import { createContext, useContext, useState, useEffect } from 'react';

const ViewModeContext = createContext();

const STORAGE_KEY = 'rpg-view-mode';

export function ViewModeProvider({ children }) {
  const [viewMode, setViewMode] = useState(() => {
    try {
      return localStorage.getItem(STORAGE_KEY) || 'desktop';
    } catch {
      return 'desktop';
    }
  });

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, viewMode);
    } catch { /* ignore */ }
  }, [viewMode]);

  const toggleViewMode = () => {
    setViewMode(prev => prev === 'desktop' ? 'mobile' : 'desktop');
  };

  return (
    <ViewModeContext.Provider value={{ viewMode, setViewMode, toggleViewMode }}>
      {children}
    </ViewModeContext.Provider>
  );
}

export function useViewMode() {
  const ctx = useContext(ViewModeContext);
  if (!ctx) throw new Error('useViewMode must be used within ViewModeProvider');
  return ctx;
}
