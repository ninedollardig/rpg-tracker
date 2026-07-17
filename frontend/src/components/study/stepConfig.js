import { Sparkles, Brain, MessagesSquare } from 'lucide-react';

export const STEPS = [
  { key: 'step1', label: 'AI预处理', icon: Sparkles, desc: 'AI加工材料，提取知识点' },
  { key: 'step2', label: '内化理解', icon: Brain, desc: '拆解逻辑，举例推导' },
  { key: 'step3', label: '高强度输出', icon: MessagesSquare, desc: '自测练习，间隔重复' },
];

export const STATUS_LABELS = {
  step1: '待内化', step2: '待输出', step3: '待复习', completed: '已完成',
};
