import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export type ThemeKey = 'light' | 'dark' | 'nord-light' | 'nord-dark';

interface ThemeState {
  themeKey: ThemeKey;
  setTheme: (key: ThemeKey) => void;
}

export const useThemeStore = create<ThemeState>()(
  persist(
    (set) => ({
      themeKey: 'light',
      setTheme: (key: ThemeKey) => set({ themeKey: key }),
    }),
    { name: 'theme-preference' },
  ),
);
