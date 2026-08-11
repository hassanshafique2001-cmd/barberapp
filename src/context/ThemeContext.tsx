import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';
import { Appearance } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

export type ThemeMode = 'light' | 'dark' | 'auto';

export interface AppColors {
  background: string;
  card: string;
  text: string;
  textMuted: string;
  border: string;
  inputBorder: string;
  primary: string;
  primaryText: string;
  accent: string;
  success: string;
  danger: string;
  dangerBg: string;
}

const LIGHT: AppColors = {
  background: '#ffffff',
  card: '#ffffff',
  text: '#1a1a1a',
  textMuted: '#666666',
  border: '#e2e2e2',
  inputBorder: '#cccccc',
  primary: '#1a1a1a',
  primaryText: '#ffffff',
  accent: '#b8860b',
  success: '#1a7f37',
  danger: '#c0392b',
  dangerBg: '#fdecea',
};

const DARK: AppColors = {
  background: '#121212',
  card: '#1e1e1e',
  text: '#f2f2f2',
  textMuted: '#a0a0a0',
  border: '#333333',
  inputBorder: '#4d4d4d',
  primary: '#f2f2f2',
  primaryText: '#121212',
  accent: '#d9b23c',
  success: '#3ddc84',
  danger: '#ff6b6b',
  dangerBg: '#3a1f1f',
};

const STORAGE_KEY = 'app-theme-mode';

interface ThemeContextValue {
  mode: ThemeMode;
  setMode: (mode: ThemeMode) => void;
  colors: AppColors;
  scheme: 'light' | 'dark';
}

const ThemeContext = createContext<ThemeContextValue>({
  mode: 'auto',
  setMode: () => {},
  colors: LIGHT,
  scheme: 'light',
});

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [mode, setModeState] = useState<ThemeMode>('auto');
  const [systemScheme, setSystemScheme] = useState<'light' | 'dark'>(Appearance.getColorScheme() ?? 'light');

  useEffect(() => {
    AsyncStorage.getItem(STORAGE_KEY).then((stored) => {
      if (stored === 'light' || stored === 'dark' || stored === 'auto') setModeState(stored);
    });
    const subscription = Appearance.addChangeListener(({ colorScheme }) => {
      setSystemScheme(colorScheme ?? 'light');
    });
    return () => subscription.remove();
  }, []);

  function setMode(next: ThemeMode) {
    setModeState(next);
    AsyncStorage.setItem(STORAGE_KEY, next).catch(() => {});
  }

  const scheme = mode === 'auto' ? systemScheme : mode;
  const colors = scheme === 'dark' ? DARK : LIGHT;

  return <ThemeContext.Provider value={{ mode, setMode, colors, scheme }}>{children}</ThemeContext.Provider>;
}

export function useTheme() {
  return useContext(ThemeContext);
}
