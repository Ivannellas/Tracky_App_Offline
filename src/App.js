import React, { useEffect, useState, useContext } from 'react';
import { StyleSheet, View, ActivityIndicator, TouchableOpacity, Text } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { initDatabase } from './api/sqLiteClient';
import { fetchUpdateStatus } from './api/updateChecker';
import { initNotificationHandler } from './utils/notifications';
import UpdateModal from './components/UpdateModal';
import DashboardScreen from './features/dashboard/screens/DashboardScreen';
import RecurringBillsScreen from './features/transactions/screens/RecurringBillsScreen';
import AnalyticsScreen from './features/analytics/screens/AnalyticsScreen';
import SettingsScreen from './features/settings/screens/SettingsScreen';
import CategoryManagerScreen from './features/settings/screens/CategoryManagerScreen';
import LockScreen from './components/LockScreen';
import { ThemeProvider, ThemeContext } from './context/ThemeContext';
import { AuthProvider, AuthContext } from './context/AuthContext';
import CalendarScreen from './features/transactions/screens/CalendarScreen';

export default function App() {
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    try {
      initDatabase();
      initNotificationHandler();
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
      <AuthProvider>
        <MainAppContainer />
      </AuthProvider>
    </ThemeProvider>
  );
}

function MainAppContainer() {
  const [currentScreen, setCurrentScreen] = useState('dashboard');
  const { theme } = useContext(ThemeContext);
  const { isLocked, isLoadingSecurity } = useContext(AuthContext);

  const [updateModalVisible, setUpdateModalVisible] = useState(false);
  const [updateInfo, setUpdateInfo] = useState(null);
  const [currentVersion, setCurrentVersion] = useState(null);

  useEffect(() => {
    let isMounted = true;

    const timer = setTimeout(async () => {
      const result = await fetchUpdateStatus();
      if (isMounted && result.status === 'update-available') {
        setUpdateInfo(result.remoteData);
        setCurrentVersion(result.currentVersion);
        setUpdateModalVisible(true);
      }
    }, 1500);

    return () => {
      isMounted = false;
      clearTimeout(timer);
    };
  }, []);

  if (isLoadingSecurity) {
    return (
      <View style={[styles.center, { backgroundColor: theme.bg }]}>
        <ActivityIndicator size="large" color={theme.primary} />
      </View>
    );
  }

  if (isLocked) {
    return <LockScreen />;
  }

  return (
    <View style={[styles.container, { backgroundColor: theme.bg }]}>
      <View style={styles.screenContainer}>
        {currentScreen === 'dashboard' && <DashboardScreen onOpenCalendar={() => setCurrentScreen('calendar')} />}
        {currentScreen === 'calendar' && <CalendarScreen onBack={() => setCurrentScreen('dashboard')} />}
        {currentScreen === 'bills' && <RecurringBillsScreen />}
        {currentScreen === 'analytics' && <AnalyticsScreen />}
        
        {/* Pass down callback prop to open Category Manager */}
        {currentScreen === 'settings' && (
          <SettingsScreen onOpenCategoryManager={() => setCurrentScreen('categoryManager')} />
        )}
        
        {/* Category Manager Full Screen View */}
        {currentScreen === 'categoryManager' && (
          <CategoryManagerScreen onBack={() => setCurrentScreen('settings')} />
        )}
      </View>

      {/* Bottom Navigation Bar (Hidden when inside full-screen sub-views) */}
      {currentScreen !== 'calendar' && currentScreen !== 'categoryManager' && (
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
      )}

      {/* Custom In-App Update Modal */}
      <UpdateModal
        visible={updateModalVisible}
        updateInfo={updateInfo}
        currentVersion={currentVersion}
        onClose={() => setUpdateModalVisible(false)}
      />
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