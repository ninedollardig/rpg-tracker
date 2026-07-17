import { useState, useEffect, useCallback, useRef } from 'react';
import { apiGet, apiPost, apiDelete } from '../api/client';

export function useActivityTypes() {
  const [types, setTypes] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    apiGet('/activity-types').then(setTypes).finally(() => setLoading(false));
  }, []);

  return { types, loading };
}

export function useActivities(params = {}) {
  const [data, setData] = useState({ activities: [], total: 0 });
  const [loading, setLoading] = useState(true);
  const paramsRef = useRef(params);
  paramsRef.current = params;

  const fetch = useCallback(async (p = {}) => {
    setLoading(true);
    try {
      const merged = { ...paramsRef.current, ...p };
      const result = await apiGet('/activities', merged);
      setData(result);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetch(); }, [fetch]);

  const logActivity = async (body) => {
    const result = await apiPost('/activities', body);
    return result;
  };

  const removeActivity = async (id) => {
    await apiDelete(`/activities/${id}`);
    setData(prev => ({
      ...prev,
      activities: prev.activities.filter(a => a.id !== id),
    }));
  };

  return { ...data, loading, refetch: fetch, logActivity, removeActivity };
}
