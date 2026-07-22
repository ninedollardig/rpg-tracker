import { useRef, useCallback } from 'react';

// 音效文件放在 frontend/public/sounds/，Vite 构建时原样复制到 dist 根目录
// levelup/success 来自 Pixabay (FunWithSound, CC0)
// click/pop/unlock 来自 Kenney UI Audio (CC0)
const SOUND_MAP = {
  click:   '/sounds/click.wav',
  pop:     '/sounds/pop.wav',
  success: '/sounds/success.mp3',
  levelup: '/sounds/levelup.mp3',
  unlock:  '/sounds/unlock.wav',
  theme:   '/sounds/theme.wav',
  mode:    '/sounds/mode.wav',
  add:     '/sounds/add.wav',
};

/** 懒加载 Audio 对象，避免页面加载时一次性请求所有音频 */
const audioCache = {};

function getAudio(name) {
  if (!audioCache[name]) {
    const path = SOUND_MAP[name];
    if (!path) return null;
    audioCache[name] = new Audio(path);
    audioCache[name].volume = name === 'levelup' || name === 'unlock' ? 0.4 : 0.25;
  }
  return audioCache[name];
}

/** 模块级播放函数，供 Context/普通 JS 使用（不需要 React hook 上下文） */
const _lastPlayed = {};
export function playSoundGlobal(name) {
  const audio = getAudio(name);
  if (!audio) return;
  const now = Date.now();
  if (now - (_lastPlayed[name] || 0) < 80) return;
  _lastPlayed[name] = now;
  audio.currentTime = 0;
  audio.play().catch(() => {});
}

export default function useSound() {
  const lastPlayed = useRef({});

  const playSound = useCallback((name) => {
    const audio = getAudio(name);
    if (!audio) return;

    // 防止短时间内重复播放同一音效
    const now = Date.now();
    if (now - (lastPlayed.current[name] || 0) < 80) return;
    lastPlayed.current[name] = now;

    audio.currentTime = 0;
    audio.play().catch(() => {});
  }, []);

  return { playSound };
}
