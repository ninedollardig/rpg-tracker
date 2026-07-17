import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { apiGet, apiPut } from '../api/client';

const CharacterContext = createContext(null);

export function CharacterProvider({ children }) {
  const [character, setCharacter] = useState(null);
  const [loading, setLoading] = useState(true);

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

  return (
    <CharacterContext.Provider value={{ character, loading, refetch, updateName }}>
      {children}
    </CharacterContext.Provider>
  );
}

export function useCharacterContext() {
  const ctx = useContext(CharacterContext);
  if (!ctx) throw new Error('useCharacterContext must be used within CharacterProvider');
  return ctx;
}
