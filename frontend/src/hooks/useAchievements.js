import { useState, useEffect, useCallback } from 'react';
import { apiGet, apiPut, apiPost } from '../api/client';

export function useAchievements() {
  const [achievements, setAchievements] = useState([]);
  const [titles, setTitles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [equippedBadgeId, setEquippedBadgeId] = useState(null);

  // Sync achievements once on first mount
  useEffect(() => {
    apiPost('/achievements/sync').catch(() => {});
  }, []);

  const fetch = useCallback(async () => {
    try {
      const [achData, charData, titleData] = await Promise.all([
        apiGet('/achievements'),
        apiGet('/character'),
        apiGet('/achievements/titles'),
      ]);
      setAchievements(achData.achievements);
      setTitles(titleData.titles || []);
      setEquippedBadgeId(charData.equipped_badge?.id || null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetch(); }, [fetch]);

  const equipBadge = async (achievementId) => {
    const result = await apiPut('/character/badge', { achievement_id: achievementId });
    setEquippedBadgeId(result.equipped_badge_id);
    return result;
  };

  return { achievements, titles, loading, equippedBadgeId, equipBadge, refetch: fetch };
}
