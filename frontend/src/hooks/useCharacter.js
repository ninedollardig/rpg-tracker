import { useState, useEffect, useCallback } from 'react';
import { apiGet, apiPut } from '../api/client';

export function useCharacter() {
  const [character, setCharacter] = useState(null);
  const [loading, setLoading] = useState(true);

  const fetch = useCallback(async () => {
    setLoading(true);
    try {
      const data = await apiGet('/character');
      setCharacter(data);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetch(); }, [fetch]);

  const updateName = async (name) => {
    const result = await apiPut('/character', { name });
    setCharacter(prev => ({ ...prev, name: result.name }));
    return result;
  };

  return { character, loading, refetch: fetch, updateName };
}
