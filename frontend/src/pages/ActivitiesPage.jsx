import { useState } from 'react';
import { toast } from 'sonner';
import { ListFilter } from 'lucide-react';
import { useActivities, useActivityTypes } from '../hooks/useActivities';
import ActivityForm from '../components/activities/ActivityForm';
import ActivityList from '../components/activities/ActivityList';
import Dropdown from '../components/ui/Dropdown';
import LevelUpEffect from '../components/effects/LevelUpEffect';
import TitleUnlockEffect from '../components/effects/TitleUnlockEffect';

export default function ActivitiesPage() {
  const [filters, setFilters] = useState({ days: '7' });
  const [timeFilter, setTimeFilter] = useState('7');
  const [levelUpData, setLevelUpData] = useState(null);
  const [newTitle, setNewTitle] = useState(null);
  const { activities, total, loading, refetch, logActivity, removeActivity } = useActivities(filters);
  const { types, loading: typesLoading } = useActivityTypes();

  const handleLog = async (body) => {
    try {
      const result = await logActivity(body);
      await refetch();

      toast.success(`+${result.exp_earned} EXP!`, {
        description: `${result.activity.name_zh} ${result.activity.value}${result.activity.unit}`,
        duration: 3000,
      });

      if (result.level_up) {
        setLevelUpData({
          level: result.level_up.to,
          title: result.level_up.new_title,
        });
      }

      if (result.new_achievements?.length) {
        for (const ach of result.new_achievements) {
          toast(`解锁成就：${ach.name_zh}`, {
            description: ach.description_zh,
            duration: 4000,
          });
        }
      }

      if (result.quest_updates?.length) {
        for (const qu of result.quest_updates) {
          if (qu.completed) {
            toast(`完成任务：${qu.title_zh}`, {
              description: `获得 ${qu.reward_exp} 额外EXP`,
              duration: 3000,
            });
          }
        }
      }

      if (result.conditional_titles?.length) {
        setNewTitle(result.conditional_titles[0]);
      }
    } catch (err) {
      toast.error('记录失败', { description: err.message });
    }
  };

  const handleDelete = async (id) => {
    try {
      await removeActivity(id);
      toast.success('已删除');
    } catch (err) {
      toast.error('删除失败', { description: err.message });
    }
  };

  const handleFilter = (key, value) => {
    const next = { ...filters, [key]: value };
    if (!value) delete next[key];
    setFilters(next);
    refetch(next);
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6 pb-12">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-white/85 tracking-[0.2em]" style={{ fontFamily: 'Orbitron, sans-serif' }}>活动记录</h2>
          <p className="text-[10px] text-slate-500 tracking-[0.3em] uppercase mt-1 font-mono">ACTIVITY LOG</p>
        </div>
        <span className="text-sm text-slate-600">共 {total} 条</span>
      </div>

      <ActivityForm types={types} loading={typesLoading} onSubmit={handleLog} />

      {/* Filters */}
      <div className="flex items-center gap-3">
        <ListFilter size={14} className="text-slate-600" />
        <Dropdown
          value={filters.category || ''}
          options={[
            { value: '', label: '全部分类' },
            { value: '生活', label: '生活' },
            { value: '学习', label: '学习' },
            { value: '娱乐', label: '娱乐' },
            { value: '休息', label: '休息' },
          ]}
          onChange={v => handleFilter('category', v)}
        />
        <Dropdown
          value={timeFilter}
          options={[
            { value: '7', label: '最近7天' },
            { value: '30', label: '最近30天' },
            { value: '', label: '全部时间' },
          ]}
          onChange={v => { setTimeFilter(v); handleFilter('days', v); }}
        />
      </div>

      <ActivityList activities={activities} loading={loading} onDelete={handleDelete} />

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
