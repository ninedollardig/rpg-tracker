import { useState } from 'react';
import { useCharacterContext } from '../context/CharacterContext';
import { useQuests } from '../hooks/useQuests';
import { useWeeklyTasks } from '../hooks/useWeeklyTasks';
import QuestList from '../components/quests/QuestList';
import WeekTaskPanel from '../components/dashboard/WeekTaskPanel';
import LevelUpEffect from '../components/effects/LevelUpEffect';
import TitleUnlockEffect from '../components/effects/TitleUnlockEffect';
import { apiGet } from '../api/client';

export default function QuestsPage() {
  const { character, refetch: refetchChar } = useCharacterContext();
  const [levelUpData, setLevelUpData] = useState(null);
  const [newTitle, setNewTitle] = useState(null);
  const { quests: dailyQuests, loading: dqLoading, refetch: refetchDaily } = useQuests('daily');
  const { quests: weeklyQuests, loading: wqLoading, refetch: refetchWeekly } = useQuests('weekly');
  const {
    tasksByDay, templates, categoryScores, WEEKDAYS,
    addTask, updateTask, toggleTask: rawToggleTask, deleteTask: rawDeleteTask,
    weekInfo, leftoverTasks,
  } = useWeeklyTasks();

  const toggleTask = async (id) => {
    const oldLevel = character?.level;
    const result = await rawToggleTask(id);

    // Fetch updated character to detect level up
    const newChar = await apiGet('/character');
    refetchChar();
    refetchDaily();
    refetchWeekly();

    if (oldLevel != null && newChar?.level > oldLevel) {
      setLevelUpData({ level: newChar.level, title: newChar.title });
    }

    // Title drops
    if (result?.titleDrop) {
      setNewTitle(result.titleDrop);
    } else if (result?.conditional_titles?.length) {
      setNewTitle(result.conditional_titles[0]);
    }
  };

  const deleteTask = async (id) => {
    await rawDeleteTask(id);
    refetchChar();
  };

  return (
    <div className="max-w-6xl mx-auto space-y-6 pb-12">
      <div>
        <h2 className="text-2xl font-bold text-white/85 tracking-[0.2em]" style={{ fontFamily: 'Orbitron, sans-serif' }}>任务</h2>
        <p className="text-[10px] text-slate-500 tracking-[0.3em] uppercase mt-1 font-mono">QUEST BOARD</p>
      </div>

      <WeekTaskPanel
        tasksByDay={tasksByDay}
        templates={templates}
        categoryScores={categoryScores}
        WEEKDAYS={WEEKDAYS}
        weekInfo={weekInfo}
        leftoverTasks={leftoverTasks}
        addTask={addTask}
        updateTask={updateTask}
        toggleTask={toggleTask}
        deleteTask={deleteTask}
      />

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <QuestList quests={dailyQuests} title="今日任务" loading={dqLoading} />
        <QuestList quests={weeklyQuests} title="本周任务" loading={wqLoading} />
      </div>

      <LevelUpEffect
        show={!!levelUpData}
        level={levelUpData?.level}
        title={levelUpData?.title}
        onDone={() => setLevelUpData(null)}
      />
      <TitleUnlockEffect
        show={!!newTitle}
        title={newTitle}
        onDone={() => setNewTitle(null)}
      />
    </div>
  );
}
