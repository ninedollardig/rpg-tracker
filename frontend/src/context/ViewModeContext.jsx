import { createContext, useContext, useState, useEffect, useCallback } from 'react';

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
  // mobilePage: null = show home nav, string = current route
  const [mobilePage, setMobilePage] = useState(null);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, viewMode);
    } catch { /* ignore */ }
  }, [viewMode]);

  const toggleViewMode = useCallback(() => {
    setViewMode(prev => prev === 'desktop' ? 'mobile' : 'desktop');
  }, []);

  const goMobilePage = useCallback((path) => setMobilePage(path), []);
  const goMobileHome = useCallback(() => setMobilePage(null), []);

  return (
    <ViewModeContext.Provider value={{
      viewMode, setViewMode, toggleViewMode,
      mobilePage, goMobilePage, goMobileHome,
    }}>
      {children}
    </ViewModeContext.Provider>
  );
}

export function useViewMode() {
  const ctx = useContext(ViewModeContext);
  if (!ctx) throw new Error('useViewMode must be used within ViewModeProvider');
  return ctx;
}
