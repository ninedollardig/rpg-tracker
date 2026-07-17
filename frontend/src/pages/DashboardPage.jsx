import { useState, useEffect } from 'react';
import { useCharacterContext } from '../context/CharacterContext';
import { apiGet } from '../api/client';
import CharacterSheet from '../components/dashboard/CharacterSheet';
import BrainRadar from '../components/charts/BrainRadar';
import DailyCheckin from '../components/dashboard/DailyCheckin';
import DailyNarrative from '../components/dashboard/DailyNarrative';
import WeeklyReport from '../components/dashboard/WeeklyReport';

export default function DashboardPage() {
  const { character, loading: charLoading } = useCharacterContext();
  const [radarScores, setRadarScores] = useState(null);

  useEffect(() => {
    apiGet('/user/settings').then(d => {
      if (d.radar_scores?.length) setRadarScores(d.radar_scores);
    }).catch(() => {});
  }, []);

  return (
    <div className="max-w-6xl mx-auto space-y-6 pb-12">
      {/* Page title */}
      <div>
        <h2 className="text-2xl font-bold text-white/85 tracking-[0.2em]" style={{ fontFamily: 'Orbitron, sans-serif' }}>角色面板</h2>
        <p className="text-[10px] text-slate-500 tracking-[0.3em] uppercase mt-1 font-mono">CHARACTER DASHBOARD</p>
      </div>

      {/* Daily narrative — character speaks to you */}
      <DailyNarrative />

      {/* Daily check-in — first action of the day */}
      <DailyCheckin />

      {/* Character sheet + radar */}
      <div className="grid grid-cols-1 lg:grid-cols-10 gap-6">
        <div className="lg:col-span-3">
          <CharacterSheet character={character} loading={charLoading} />
        </div>
        <div className="lg:col-span-7">
          <BrainRadar compact customDimensions={radarScores} />
        </div>
      </div>

      {/* Weekly report popup — only visible on Sundays */}
      <WeeklyReport />
    </div>
  );
}
