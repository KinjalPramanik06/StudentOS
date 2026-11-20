import React, { createContext, useContext, useEffect, useState } from 'react';
import { useAppStore, type ThemeMode } from '../store/useAppStore';

interface ThemeContextType {
  theme: ThemeMode;
  resolvedTheme: 'light' | 'dark';
  setTheme: (theme: ThemeMode) => void;
  toggleTheme: () => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const theme = useAppStore((state) => state.theme);
  const setTheme = useAppStore((state) => state.setTheme);
  const [systemDark, setSystemDark] = useState(() => window.matchMedia('(prefers-color-scheme: dark)').matches);
  const resolvedTheme = theme === 'dark' || (theme === 'system' && systemDark) ? 'dark' : 'light';

  useEffect(() => {
    const query = window.matchMedia('(prefers-color-scheme: dark)');
    const onSystemChange = () => setSystemDark(query.matches);
    const onStorageChange = (event: StorageEvent) => {
      if (event.key !== 'theme' && event.key !== 'studentos_theme') return;
      const value = event.newValue;
      if (value === 'light' || value === 'dark' || value === 'system') setTheme(value);
    };
    query.addEventListener('change', onSystemChange);
    window.addEventListener('storage', onStorageChange);
    return () => {
      query.removeEventListener('change', onSystemChange);
      window.removeEventListener('storage', onStorageChange);
    };
  }, [setTheme]);

  useEffect(() => {
    document.documentElement.classList.toggle('dark', resolvedTheme === 'dark');
    document.documentElement.dataset.theme = resolvedTheme;
  }, [resolvedTheme]);

  return (
    <ThemeContext.Provider value={{ theme, resolvedTheme, setTheme, toggleTheme: () => setTheme(resolvedTheme === 'dark' ? 'light' : 'dark') }}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = (): ThemeContextType => {
  const context = useContext(ThemeContext);
  if (!context) throw new Error('useTheme must be used within ThemeProvider');
  return context;
};
