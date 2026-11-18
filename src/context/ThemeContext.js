import React, { createContext, useState, useEffect } from 'react';
import { useColorScheme } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

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

const HIDE_BALANCES_STORAGE_KEY = '@trackly_hide_balances';

export function ThemeProvider({ children }) {
  const systemColorScheme = useColorScheme();
  const [themeMode, setThemeMode] = useState('system'); // 'dark', 'light', or 'system'
  
  // Persistent Privacy State for Balances across app restarts
  const [hideBalances, setHideBalancesState] = useState(false);

  // Load saved privacy preference on app startup
  useEffect(() => {
    async function loadHideBalancesPreference() {
      try {
        const savedPreference = await AsyncStorage.getItem(HIDE_BALANCES_STORAGE_KEY);
        if (savedPreference !== null) {
          setHideBalancesState(JSON.parse(savedPreference));
        }
      } catch (error) {
        console.log('Failed to load hide balances preference', error);
      }
    }
    loadHideBalancesPreference();
  }, []);

  // Custom setter that saves to AsyncStorage whenever state changes
  const setHideBalances = async (value) => {
    try {
      const newValue = typeof value === 'function' ? value(hideBalances) : value;
      setHideBalancesState(newValue);
      await AsyncStorage.setItem(HIDE_BALANCES_STORAGE_KEY, JSON.stringify(newValue));
    } catch (error) {
      console.log('Failed to save hide balances preference', error);
    }
  };

  const changeTheme = (mode) => {
    setThemeMode(mode);
  };

  // Determine active palette based on selection or device setting
  const activeMode = themeMode === 'system' ? (systemColorScheme || 'dark') : themeMode;
  const theme = activeMode === 'light' ? lightTheme : darkTheme;

  return (
    <ThemeContext.Provider value={{ theme, themeMode, changeTheme, hideBalances, setHideBalances }}>
      {children}
    </ThemeContext.Provider>
  );
}