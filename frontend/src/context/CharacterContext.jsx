import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { apiGet, apiPut } from '../api/client';

const CharacterContext = createContext(null);

export function CharacterProvider({ children }) {
  const [character, setCharacter] = useState(null);
  const [loading, setLoading] = useState(true);
  const [levelUpEvent, setLevelUpEvent] = useState(null); // { level, title } or null

  const refetch = useCallback(async () => {
    setLoading(true);
    try {
      const data = await apiGet('/character');
      setCharacter(data);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { refetch(); }, [refetch]);

  const updateName = async (name) => {
    const result = await apiPut('/character', { name });
    setCharacter(prev => ({ ...prev, name: result.name }));
    return result;
  };

  const triggerLevelUp = useCallback((opts) => {
    const lvl = opts?.level ?? character?.level;
    const ttl = opts?.title ?? character?.title;
    if (lvl != null) {
      setLevelUpEvent({ level: lvl, title: ttl });
    }
  }, [character]);

  return (
    <CharacterContext.Provider value={{ character, loading, refetch, updateName, levelUpEvent, triggerLevelUp, clearLevelUp: () => setLevelUpEvent(null) }}>
      {children}
    </CharacterContext.Provider>
  );
}

export function useCharacterContext() {
  const ctx = useContext(CharacterContext);
  if (!ctx) throw new Error('useCharacterContext must be used within CharacterProvider');
  return ctx;
}
