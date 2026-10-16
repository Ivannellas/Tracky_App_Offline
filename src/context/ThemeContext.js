import React, { createContext, useState } from 'react';
import { useColorScheme } from 'react-native';

export const ThemeContext = createContext();

export const darkTheme = {
  mode: 'dark',
  bg: '#0F172A',
  cardBg: '#1E293B',
  border: '#334155',
  text: '#F8FAFC',
  subText: '#94A3B8',
  primary: '#8B5CF6',
  income: '#10B981',
  expense: '#EF4444',
  inputBg: '#0F172A',
};

export const lightTheme = {
  mode: 'light',
  bg: '#F8FAFC',
  cardBg: '#FFFFFF',
  border: '#E2E8F0',
  text: '#0F172A',
  subText: '#64748B',
  primary: '#8B5CF6',
  income: '#10B981',
  expense: '#EF4444',
  inputBg: '#F1F5F9',
};

export function ThemeProvider({ children }) {
  const systemColorScheme = useColorScheme();
  const [themeMode, setThemeMode] = useState('system'); // 'dark', 'light', or 'system'

  const changeTheme = (mode) => {
    setThemeMode(mode);
  };

  // Determine active palette based on selection or device setting
  const activeMode = themeMode === 'system' ? (systemColorScheme || 'dark') : themeMode;
  const theme = activeMode === 'light' ? lightTheme : darkTheme;

  return (
    <ThemeContext.Provider value={{ theme, themeMode, changeTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}