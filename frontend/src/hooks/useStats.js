import { useState, useEffect } from 'react';
import { apiGet } from '../api/client';

export function useStats() {
  const [summary, setSummary] = useState(null);
  const [trends, setTrends] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      apiGet('/stats/summary'),
      apiGet('/stats/trends', { days: '30' }),
    ]).then(([s, t]) => {
      setSummary(s);
      setTrends(t.data);
    }).finally(() => setLoading(false));
  }, []);

  const fetchTrends = async (days = 30, category = 'all') => {
    const data = await apiGet('/stats/trends', { days: String(days), category });
    setTrends(data.data);
  };

  return { summary, trends, loading, fetchTrends };
}
