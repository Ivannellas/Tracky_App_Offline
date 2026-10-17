import React, { useEffect, useState } from 'react';
import { StyleSheet, View, ActivityIndicator, TouchableOpacity, Text } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { initDatabase } from './api/sqLiteClient';
import { checkForUpdates } from './api/updateChecker'; // <-- 1. Import the update checker
import DashboardScreen from './features/dashboard/screens/DashboardScreen';
import RecurringBillsScreen from './features/transactions/screens/RecurringBillsScreen';
import AnalyticsScreen from './features/analytics/screens/AnalyticsScreen';
import SettingsScreen from './features/settings/screens/SettingsScreen';
import { ThemeProvider, ThemeContext } from './context/ThemeContext';

export default function App() {
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    try {
      initDatabase();
      setIsReady(true);
    } catch (error) {
      console.error('Initialization error:', error);
    }
  }, []);

  if (!isReady) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#A78BFA" />
      </View>
    );
  }

  return (
    <ThemeProvider>
      <MainAppContainer />
    </ThemeProvider>
  );
}

// Internal component to consume Theme Context
function MainAppContainer() {
  const [currentScreen, setCurrentScreen] = useState('dashboard');
  const { theme } = React.useContext(ThemeContext);

  // <-- 2. Trigger background update check 3 seconds after app boots up
  useEffect(() => {
    const timer = setTimeout(() => {
      checkForUpdates(false); // false = silent background check (only alerts if a new version is found)
    }, 3000);

    return () => clearTimeout(timer);
  }, []);

  return (
    <View style={[styles.container, { backgroundColor: theme.bg }]}>
      {/* Active Screen Render */}
      <View style={styles.screenContainer}>
        {currentScreen === 'dashboard' && <DashboardScreen />}
        {currentScreen === 'bills' && <RecurringBillsScreen />}
        {currentScreen === 'analytics' && <AnalyticsScreen />}
        {currentScreen === 'settings' && <SettingsScreen />}
      </View>

      {/* 4-Tab Bottom Navigation Bar (Dynamic Styling) */}
      <View style={[styles.navBar, { backgroundColor: theme.cardBg, borderTopColor: theme.border }]}>
        <TouchableOpacity style={styles.navItem} onPress={() => setCurrentScreen('dashboard')}>
          <Ionicons 
            name={currentScreen === 'dashboard' ? 'wallet' : 'wallet-outline'} 
            size={22} 
            color={currentScreen === 'dashboard' ? theme.primary : theme.subText} 
          />
          <Text style={[styles.navText, { color: theme.subText }, currentScreen === 'dashboard' && { color: theme.primary, fontWeight: 'bold' }]}>
            Dashboard
          </Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.navItem} onPress={() => setCurrentScreen('bills')}>
          <Ionicons 
            name={currentScreen === 'bills' ? 'repeat' : 'repeat-outline'} 
            size={22} 
            color={currentScreen === 'bills' ? theme.primary : theme.subText} 
          />
          <Text style={[styles.navText, { color: theme.subText }, currentScreen === 'bills' && { color: theme.primary, fontWeight: 'bold' }]}>
            Bills
          </Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.navItem} onPress={() => setCurrentScreen('analytics')}>
          <Ionicons 
            name={currentScreen === 'analytics' ? 'bar-chart' : 'bar-chart-outline'} 
            size={22} 
            color={currentScreen === 'analytics' ? theme.primary : theme.subText} 
          />
          <Text style={[styles.navText, { color: theme.subText }, currentScreen === 'analytics' && { color: theme.primary, fontWeight: 'bold' }]}>
            Analytics
          </Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.navItem} onPress={() => setCurrentScreen('settings')}>
          <Ionicons 
            name={currentScreen === 'settings' ? 'settings' : 'settings-outline'} 
            size={22} 
            color={currentScreen === 'settings' ? theme.primary : theme.subText} 
          />
          <Text style={[styles.navText, { color: theme.subText }, currentScreen === 'settings' && { color: theme.primary, fontWeight: 'bold' }]}>
            Settings
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  center: { flex: 1, backgroundColor: '#0F172A', justifyContent: 'center', alignItems: 'center' },
  screenContainer: { flex: 1 },
  navBar: { 
    flexDirection: 'row', 
    borderTopWidth: 1, 
    paddingVertical: 10,
    paddingBottom: 20,
    justifyContent: 'space-around'
  },
  navItem: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  navText: { fontSize: 11, marginTop: 4 }
});