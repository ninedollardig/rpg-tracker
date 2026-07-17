import { useState, useEffect, useCallback } from 'react';
import { apiGet, apiPost } from '../api/client';

export function useQuests(type) {
  const [quests, setQuests] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetch = useCallback(async () => {
    setLoading(true);
    try {
      const data = await apiGet('/quests', { quest_type: type });
      setQuests(data.quests);
    } finally {
      setLoading(false);
    }
  }, [type]);

  useEffect(() => { fetch(); }, [fetch]);

  const regenerate = async () => {
    await apiPost('/quests/generate', { quest_type: type });
    await fetch();
  };

  return { quests, loading, refetch: fetch, regenerate };
}
