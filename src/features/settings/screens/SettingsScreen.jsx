import React, { useState, useEffect, useContext } from 'react';
import { StyleSheet, Text, View, TouchableOpacity, ScrollView, Modal, Switch } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { exportDatabaseBackup, importDatabaseBackup } from '../../../api/backupRepo';
import { deleteAllTransactions } from '../../../api/transactionsRepo';
import { ThemeContext } from '../../../context/ThemeContext';
import { AuthContext } from '../../../context/AuthContext';
import {
  scheduleBiMonthlyPaydayReminders,
  cancelPaydayReminders,
  scheduleTwiceDailyExpenseReminders,
  cancelTwiceDailyExpenseReminders,
  scheduleDailyFinancialAdvice,
  cancelDailyFinancialAdvice,
  triggerTestSavingsNotification,
} from '../../../utils/notifications';

const PAYDAY_REMINDERS_STORAGE_KEY = '@trackly_payday_reminders_enabled';
const EXPENSE_REMINDERS_STORAGE_KEY = '@trackly_expense_reminders_enabled';
const ADVICE_REMINDERS_STORAGE_KEY = '@trackly_financial_advice_enabled';

export default function SettingsScreen({ onOpenCategoryManager }) {
  const { theme, themeMode, changeTheme } = useContext(ThemeContext);
  const { hasPinSet, lockApp, removePin } = useContext(AuthContext);

  // Default to true unless explicitly turned off by the user
  const [paydayRemindersEnabled, setPaydayRemindersEnabled] = useState(true);
  const [expenseRemindersEnabled, setExpenseRemindersEnabled] = useState(true);
  const [adviceRemindersEnabled, setAdviceRemindersEnabled] = useState(true);
  const [isUpdatingReminders, setIsUpdatingReminders] = useState(false);

  // Custom Confirmation Modal State
  const [modalConfig, setModalConfig] = useState({
    visible: false,
    title: '',
    message: '',
    confirmText: '',
    isDanger: false,
    onConfirm: () => {},
  });

  const hideCustomModal = () => {
    setModalConfig(prev => ({ ...prev, visible: false }));
  };

  useEffect(() => {
    async function loadAndInitReminderStates() {
      try {
        const [savedPayday, savedExpense, savedAdvice] = await Promise.all([
          AsyncStorage.getItem(PAYDAY_REMINDERS_STORAGE_KEY),
          AsyncStorage.getItem(EXPENSE_REMINDERS_STORAGE_KEY),
          AsyncStorage.getItem(ADVICE_REMINDERS_STORAGE_KEY),
        ]);

        const paydayActive = savedPayday !== null ? JSON.parse(savedPayday) : true;
        const expenseActive = savedExpense !== null ? JSON.parse(savedExpense) : true;
        const adviceActive = savedAdvice !== null ? JSON.parse(savedAdvice) : true;

        setPaydayRemindersEnabled(paydayActive);
        setExpenseRemindersEnabled(expenseActive);
        setAdviceRemindersEnabled(adviceActive);

        if (savedPayday === null) {
          await AsyncStorage.setItem(PAYDAY_REMINDERS_STORAGE_KEY, JSON.stringify(true));
        }
        if (savedExpense === null) {
          await AsyncStorage.setItem(EXPENSE_REMINDERS_STORAGE_KEY, JSON.stringify(true));
        }
        if (savedAdvice === null) {
          await AsyncStorage.setItem(ADVICE_REMINDERS_STORAGE_KEY, JSON.stringify(true));
        }

        // Silently ensure default-enabled schedules are active without interrupting UI
        if (paydayActive) {
          await scheduleBiMonthlyPaydayReminders();
        }
        if (expenseActive) {
          await scheduleTwiceDailyExpenseReminders();
        }
        if (adviceActive) {
          await scheduleDailyFinancialAdvice(9, 30);
        }
      } catch (error) {
        console.log('Failed to load reminder preferences:', error);
      }
    }

    loadAndInitReminderStates();
  }, []);

  const handleTogglePaydayReminders = async (nextValue) => {
    if (isUpdatingReminders) return;
    setIsUpdatingReminders(true);

    try {
      if (nextValue) {
        const result = await scheduleBiMonthlyPaydayReminders();
        if (!result.ok) {
          setPaydayRemindersEnabled(false);
          await AsyncStorage.setItem(PAYDAY_REMINDERS_STORAGE_KEY, JSON.stringify(false));
          setModalConfig({
            visible: true,
            title: 'Reminders Unavailable',
            message: result.reason || 'Could not enable payday savings reminders.',
            confirmText: 'OK',
            isDanger: false,
            onConfirm: hideCustomModal,
          });
          return;
        }

        setPaydayRemindersEnabled(true);
        await AsyncStorage.setItem(PAYDAY_REMINDERS_STORAGE_KEY, JSON.stringify(true));
        setModalConfig({
          visible: true,
          title: 'Payday Reminders Active',
          message: 'You will get a savings nudge on the 1st and 16th of every month at 9:00 AM.',
          confirmText: 'OK',
          isDanger: false,
          onConfirm: hideCustomModal,
        });
      } else {
        await cancelPaydayReminders();
        setPaydayRemindersEnabled(false);
        await AsyncStorage.setItem(PAYDAY_REMINDERS_STORAGE_KEY, JSON.stringify(false));
        setModalConfig({
          visible: true,
          title: 'Reminders Paused',
          message: 'Bi-monthly payday savings reminders have been turned off.',
          confirmText: 'OK',
          isDanger: false,
          onConfirm: hideCustomModal,
        });
      }
    } finally {
      setIsUpdatingReminders(false);
    }
  };

  const handleToggleExpenseReminders = async (nextValue) => {
    if (isUpdatingReminders) return;
    setIsUpdatingReminders(true);

    try {
      if (nextValue) {
        const result = await scheduleTwiceDailyExpenseReminders();
        if (!result.ok) {
          setExpenseRemindersEnabled(false);
          await AsyncStorage.setItem(EXPENSE_REMINDERS_STORAGE_KEY, JSON.stringify(false));
          setModalConfig({
            visible: true,
            title: 'Expense Reminders Unavailable',
            message: result.reason || 'Could not enable twice-daily expense reminders.',
            confirmText: 'OK',
            isDanger: false,
            onConfirm: hideCustomModal,
          });
          return;
        }

        setExpenseRemindersEnabled(true);
        await AsyncStorage.setItem(EXPENSE_REMINDERS_STORAGE_KEY, JSON.stringify(true));
        setModalConfig({
          visible: true,
          title: 'Expense Reminders Active',
          message: 'You will get expense tracking reminders twice a day at 1:00 PM and 8:30 PM.',
          confirmText: 'OK',
          isDanger: false,
          onConfirm: hideCustomModal,
        });
      } else {
        await cancelTwiceDailyExpenseReminders();
        setExpenseRemindersEnabled(false);
        await AsyncStorage.setItem(EXPENSE_REMINDERS_STORAGE_KEY, JSON.stringify(false));
        setModalConfig({
          visible: true,
          title: 'Expense Reminders Paused',
          message: 'Twice-daily expense tracking reminders have been turned off.',
          confirmText: 'OK',
          isDanger: false,
          onConfirm: hideCustomModal,
        });
      }
    } finally {
      setIsUpdatingReminders(false);
    }
  };

  const handleToggleAdviceReminders = async (nextValue) => {
    if (isUpdatingReminders) return;
    setIsUpdatingReminders(true);

    try {
      if (nextValue) {
        const result = await scheduleDailyFinancialAdvice(9, 30);
        if (!result.ok) {
          setAdviceRemindersEnabled(false);
          await AsyncStorage.setItem(ADVICE_REMINDERS_STORAGE_KEY, JSON.stringify(false));
          setModalConfig({
            visible: true,
            title: 'Financial Advice Unavailable',
            message: result.reason || 'Could not enable daily financial advice.',
            confirmText: 'OK',
            isDanger: false,
            onConfirm: hideCustomModal,
          });
          return;
        }

        setAdviceRemindersEnabled(true);
        await AsyncStorage.setItem(ADVICE_REMINDERS_STORAGE_KEY, JSON.stringify(true));
        setModalConfig({
          visible: true,
          title: 'Daily Advice Active',
          message: 'You will get a fresh financial tip once a day.',
          confirmText: 'OK',
          isDanger: false,
          onConfirm: hideCustomModal,
        });
      } else {
        await cancelDailyFinancialAdvice();
        setAdviceRemindersEnabled(false);
        await AsyncStorage.setItem(ADVICE_REMINDERS_STORAGE_KEY, JSON.stringify(false));
        setModalConfig({
          visible: true,
          title: 'Daily Advice Paused',
          message: 'Daily financial advice notifications have been turned off.',
          confirmText: 'OK',
          isDanger: false,
          onConfirm: hideCustomModal,
        });
      }
    } finally {
      setIsUpdatingReminders(false);
    }
  };

  const handleTestNotification = async () => {
    const result = await triggerTestSavingsNotification(5);
    if (result.ok) {
      setModalConfig({
        visible: true,
        title: 'Test Nudge Scheduled',
        message: 'A savings reminder will arrive in 5 seconds—even if you close or minimize the app.',
        confirmText: 'OK',
        isDanger: false,
        onConfirm: hideCustomModal,
      });
    } else {
      setModalConfig({
        visible: true,
        title: 'Test Failed',
        message: result.reason || 'Unable to trigger test notification.',
        confirmText: 'OK',
        isDanger: false,
        onConfirm: hideCustomModal,
      });
    }
  };

  const handleExport = async () => {
    try {
      await exportDatabaseBackup();
    } catch (error) {
      setModalConfig({
        visible: true,
        title: 'Export Failed',
        message: 'An error occurred while creating your backup file.',
        confirmText: 'OK',
        isDanger: false,
        onConfirm: hideCustomModal,
      });
    }
  };

  const handleImport = () => {
    setModalConfig({
      visible: true,
      title: 'Restore Backup',
      message: 'Restoring from a backup file will replace all existing transactions, categories, and wallet balances. Continue?',
      confirmText: 'Restore Data',
      isDanger: true,
      onConfirm: async () => {
        hideCustomModal();
        try {
          const success = await importDatabaseBackup();
          if (success) {
            setModalConfig({
              visible: true,
              title: 'Success',
              message: 'Your Trackly data has been successfully restored!',
              confirmText: 'OK',
              isDanger: false,
              onConfirm: hideCustomModal,
            });
          }
        } catch (error) {
          setModalConfig({
            visible: true,
            title: 'Import Failed',
            message: 'The selected file is not a valid Trackly JSON backup.',
            confirmText: 'OK',
            isDanger: false,
            onConfirm: hideCustomModal,
          });
        }
      },
    });
  };

  const handleTogglePin = () => {
    if (hasPinSet) {
      setModalConfig({
        visible: true,
        title: 'Disable App Lock',
        message: 'Are you sure you want to remove your 4-digit PIN security lock?',
        confirmText: 'Disable Lock',
        isDanger: true,
        onConfirm: () => {
          hideCustomModal();
          removePin();
        },
      });
    } else {
      lockApp(); 
    }
  };

  const handleDeleteAllTransactions = () => {
    setModalConfig({
      visible: true,
      title: 'Delete All Transactions?',
      message: 'This will permanently wipe all recorded transactions. Your wallets and categories will remain intact, but transaction history will be cleared.',
      confirmText: 'Delete All',
      isDanger: true,
      onConfirm: () => {
        hideCustomModal();
        try {
          deleteAllTransactions();
          setModalConfig({
            visible: true,
            title: 'Cleared',
            message: 'All transaction history has been permanently deleted.',
            confirmText: 'OK',
            isDanger: false,
            onConfirm: hideCustomModal,
          });
        } catch (error) {
          setModalConfig({
            visible: true,
            title: 'Error',
            message: 'Failed to clear transactions. Please try again.',
            confirmText: 'OK',
            isDanger: false,
            onConfirm: hideCustomModal,
          });
        }
      },
    });
  };

  return (
    <View style={[styles.mainContainer, { backgroundColor: theme.bg }]}>
      <ScrollView 
        style={styles.container} 
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        <Text style={[styles.headerTitle, { color: theme.text }]}>Settings & Data</Text>

        {/* --- APP SECURITY SECTION --- */}
        <View style={styles.section}>
          <Text style={styles.sectionLabel}>Security</Text>
          
          <TouchableOpacity 
            style={[styles.actionButton, { backgroundColor: theme.cardBg, borderColor: theme.border }]} 
            onPress={handleTogglePin}
            activeOpacity={0.8}
          >
            <View style={[styles.iconBox, { backgroundColor: 'rgba(139, 92, 246, 0.1)' }]}>
              <Ionicons 
                name={hasPinSet ? 'lock-closed' : 'lock-open-outline'} 
                size={16} 
                color="#8B5CF6" 
              />
            </View>
            <View style={styles.actionTextContainer}>
              <Text style={[styles.actionTitle, { color: theme.text }]}>
                {hasPinSet ? 'Change / Disable PIN Lock' : 'Enable App PIN Lock'}
              </Text>
              <Text style={[styles.actionSubtitle, { color: theme.subText }]}>
                {hasPinSet ? 'PIN protection is active' : 'Protect financial data with a 4-digit PIN'}
              </Text>
            </View>
            <Ionicons name="chevron-forward" size={16} color={theme.subText} />
          </TouchableOpacity>
        </View>

        {/* --- APPEARANCE / THEME SECTION --- */}
        <View style={styles.section}>
          <Text style={styles.sectionLabel}>Appearance</Text>
          <View style={[styles.themeCard, { backgroundColor: theme.cardBg, borderColor: theme.border }]}>
            <View style={styles.themeHeaderRow}>
              <View style={[styles.iconBox, { backgroundColor: 'rgba(59, 130, 246, 0.1)' }]}>
                <Ionicons name="color-palette-outline" size={16} color={theme.primary} />
              </View>
              <Text style={[styles.themeCardTitle, { color: theme.text }]}>App Theme Mode</Text>
            </View>
            
            <View style={styles.themeRow}>
              {[
                { id: 'dark', label: 'Dark', icon: 'moon' },
                { id: 'light', label: 'Light', icon: 'sunny' },
                { id: 'system', label: 'System', icon: 'phone-portrait' },
              ].map((item) => (
                <TouchableOpacity
                  key={item.id}
                  style={[
                    styles.themeOption,
                    { backgroundColor: theme.inputBg, borderColor: theme.border },
                    themeMode === item.id && { backgroundColor: theme.primary, borderColor: theme.primary }
                  ]}
                  onPress={() => changeTheme(item.id)}
                  activeOpacity={0.8}
                >
                  <Ionicons 
                    name={item.icon} 
                    size={14} 
                    color={themeMode === item.id ? '#FFFFFF' : theme.subText} 
                  />
                  <Text 
                    style={[
                      styles.themeText, 
                      { color: theme.subText },
                      themeMode === item.id && styles.activeThemeText
                    ]}
                  >
                    {item.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        </View>

        {/* --- CATEGORY MANAGEMENT SECTION --- */}
        <View style={styles.section}>
          <Text style={styles.sectionLabel}>Customization</Text>
          
          <TouchableOpacity 
            style={[styles.actionButton, { backgroundColor: theme.cardBg, borderColor: theme.border }]} 
            onPress={onOpenCategoryManager}
            activeOpacity={0.8}
          >
            <View style={[styles.iconBox, { backgroundColor: 'rgba(16, 185, 129, 0.1)' }]}>
              <Ionicons name="list-outline" size={16} color="#10B981" />
            </View>
            <View style={styles.actionTextContainer}>
              <Text style={[styles.actionTitle, { color: theme.text }]}>Manage Categories</Text>
              <Text style={[styles.actionSubtitle, { color: theme.subText }]}>Add, edit, or delete income and expense categories</Text>
            </View>
            <Ionicons name="chevron-forward" size={16} color={theme.subText} />
          </TouchableOpacity>
        </View>

        {/* --- DATA BACKUP SECTION --- */}
        <View style={styles.section}>
          <Text style={styles.sectionLabel}>Data Backup & Restore</Text>
          
          <TouchableOpacity 
            style={[styles.actionButton, { backgroundColor: theme.cardBg, borderColor: theme.border }]} 
            onPress={handleExport}
            activeOpacity={0.8}
          >
            <View style={[styles.iconBox, { backgroundColor: 'rgba(16, 185, 129, 0.1)' }]}>
              <Ionicons name="cloud-download-outline" size={16} color="#10B981" />
            </View>
            <View style={styles.actionTextContainer}>
              <Text style={[styles.actionTitle, { color: theme.text }]}>Export Backup</Text>
              <Text style={[styles.actionSubtitle, { color: theme.subText }]}>Save a secure copy of your current data records</Text>
            </View>
            <Ionicons name="chevron-forward" size={16} color={theme.subText} />
          </TouchableOpacity>

          <TouchableOpacity 
            style={[styles.actionButton, { backgroundColor: theme.cardBg, borderColor: theme.border }]} 
            onPress={handleImport}
            activeOpacity={0.8}
          >
            <View style={[styles.iconBox, { backgroundColor: 'rgba(59, 130, 246, 0.1)' }]}>
              <Ionicons name="cloud-upload-outline" size={16} color="#3B82F6" />
            </View>
            <View style={styles.actionTextContainer}>
              <Text style={[styles.actionTitle, { color: theme.text }]}>Import Backup</Text>
              <Text style={[styles.actionSubtitle, { color: theme.subText }]}>Restore records from a previously exported backup file</Text>
            </View>
            <Ionicons name="chevron-forward" size={16} color={theme.subText} />
          </TouchableOpacity>
        </View>

        {/* --- SAVINGS REMINDERS SECTION (BELOW BACKUP & RESTORE) --- */}
        <View style={styles.section}>
          <Text style={styles.sectionLabel}>Savings Reminders</Text>

          <View style={[styles.actionButton, { backgroundColor: theme.cardBg, borderColor: theme.border }]}>
            <View style={[styles.iconBox, { backgroundColor: 'rgba(139, 92, 246, 0.12)' }]}>
              <Ionicons name="notifications-outline" size={16} color={theme.primary} />
            </View>
            <View style={styles.actionTextContainer}>
              <Text style={[styles.actionTitle, { color: theme.text }]}>Bi-Monthly Payday Nudges</Text>
              <Text style={[styles.actionSubtitle, { color: theme.subText }]}>
                Remind me to save on the 1st & 16th.
              </Text>
            </View>
            <Switch
              value={paydayRemindersEnabled}
              onValueChange={handleTogglePaydayReminders}
              disabled={isUpdatingReminders}
              trackColor={{ false: theme.border, true: theme.primary }}
              thumbColor="#FFFFFF"
            />
          </View>

          <View style={[styles.actionButton, { backgroundColor: theme.cardBg, borderColor: theme.border }]}>
            <View style={[styles.iconBox, { backgroundColor: 'rgba(59, 130, 246, 0.12)' }]}>
              <Ionicons name="receipt-outline" size={16} color="#3B82F6" />
            </View>
            <View style={styles.actionTextContainer}>
              <Text style={[styles.actionTitle, { color: theme.text }]}>Expense Tracking</Text>
              <Text style={[styles.actionSubtitle, { color: theme.subText }]}>
                Log expenses reminder.
              </Text>
            </View>
            <Switch
              value={expenseRemindersEnabled}
              onValueChange={handleToggleExpenseReminders}
              disabled={isUpdatingReminders}
              trackColor={{ false: theme.border, true: theme.primary }}
              thumbColor="#FFFFFF"
            />
          </View>

          <View style={[styles.actionButton, { backgroundColor: theme.cardBg, borderColor: theme.border }]}>
            <View style={[styles.iconBox, { backgroundColor: 'rgba(245, 158, 11, 0.14)' }]}>
              <Ionicons name="bulb-outline" size={16} color="#F59E0B" />
            </View>
            <View style={styles.actionTextContainer}>
              <Text style={[styles.actionTitle, { color: theme.text }]}>Daily Financial Advice</Text>
              <Text style={[styles.actionSubtitle, { color: theme.subText }]}>
                Unique money tip once a day at 9:30 AM
              </Text>
            </View>
            <Switch
              value={adviceRemindersEnabled}
              onValueChange={handleToggleAdviceReminders}
              disabled={isUpdatingReminders}
              trackColor={{ false: theme.border, true: theme.primary }}
              thumbColor="#FFFFFF"
            />
          </View>

          {/* <TouchableOpacity
            style={[styles.actionButton, { backgroundColor: theme.cardBg, borderColor: theme.border }]}
            onPress={handleTestNotification}
            activeOpacity={0.8}
          >
            <View style={[styles.iconBox, { backgroundColor: 'rgba(16, 185, 129, 0.12)' }]}>
              <Ionicons name="timer-outline" size={16} color="#10B981" />
            </View>
            <View style={styles.actionTextContainer}>
              <Text style={[styles.actionTitle, { color: theme.text }]}>Send Test Savings Nudge (5s)</Text>
              <Text style={[styles.actionSubtitle, { color: theme.subText }]}>
                Verify local notification delivery in Expo Go or APK
              </Text>
            </View>
            <Ionicons name="chevron-forward" size={16} color={theme.subText} />
          </TouchableOpacity> */}
        </View>

        {/* --- DANGER ZONE SECTION --- */}
        <View style={styles.section}>
          <Text style={[styles.sectionLabel, { color: '#EF4444' }]}>Danger Zone</Text>
          
          <TouchableOpacity 
            style={[styles.actionButton, styles.dangerCard]} 
            onPress={handleDeleteAllTransactions}
            activeOpacity={0.8}
          >
            <View style={[styles.iconBox, { backgroundColor: 'rgba(239, 68, 68, 0.15)' }]}>
              <Ionicons name="trash-bin-outline" size={16} color="#EF4444" />
            </View>
            <View style={styles.actionTextContainer}>
              <Text style={[styles.actionTitle, { color: '#EF4444' }]}>Delete All Transactions</Text>
              <Text style={[styles.actionSubtitle, { color: theme.subText }]}>Clear transaction history (wallets & categories stay)</Text>
            </View>
            <Ionicons name="chevron-forward" size={16} color="#EF4444" />
          </TouchableOpacity>
        </View>

        <View style={[styles.infoCard, { backgroundColor: theme.cardBg, borderColor: theme.border }]}>
          <Ionicons name="shield-checkmark-outline" size={22} color="#10B981" style={{ marginBottom: 6 }} />
          <Text style={[styles.infoTitle, { color: theme.text }]}>100% Offline & Private</Text>
          <Text style={[styles.infoText, { color: theme.subText }]}>
            Your financial data stays securely on this device inside local storage. No cloud servers, no tracking, and zero internet required.
          </Text>
        </View>
      </ScrollView>

      {/* --- CUSTOM STYLIZED CONFIRMATION MODAL --- */}
      <Modal
        visible={modalConfig.visible}
        transparent={true}
        animationType="fade"
        onRequestClose={hideCustomModal}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: theme.cardBg, borderColor: theme.border }]}>
            <View style={[styles.modalIconBadge, { backgroundColor: modalConfig.isDanger ? 'rgba(239, 68, 68, 0.15)' : 'rgba(139, 92, 246, 0.15)' }]}>
              <Ionicons 
                name={modalConfig.isDanger ? 'alert-circle-outline' : 'information-circle-outline'} 
                size={26} 
                color={modalConfig.isDanger ? '#EF4444' : theme.primary} 
              />
            </View>

            <Text style={[styles.modalTitle, { color: theme.text }]}>{modalConfig.title}</Text>
            <Text style={[styles.modalMessage, { color: theme.subText }]}>{modalConfig.message}</Text>

            <View style={styles.modalBtnRow}>
              {modalConfig.confirmText !== 'OK' && (
                <TouchableOpacity 
                  style={[styles.modalCancelBtn, { backgroundColor: theme.inputBg, borderColor: theme.border }]} 
                  onPress={hideCustomModal}
                  activeOpacity={0.8}
                >
                  <Text style={[styles.modalCancelText, { color: theme.text }]}>Cancel</Text>
                </TouchableOpacity>
              )}

              <TouchableOpacity 
                style={[
                  styles.modalConfirmBtn, 
                  { backgroundColor: modalConfig.isDanger ? '#EF4444' : theme.primary },
                  modalConfig.confirmText === 'OK' && { flex: 1 }
                ]} 
                onPress={modalConfig.onConfirm}
                activeOpacity={0.85}
              >
                <Text style={styles.modalConfirmText}>{modalConfig.confirmText}</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  mainContainer: { flex: 1 },
  container: { flex: 1 },
  content: { padding: 14, paddingTop: 45, paddingBottom: 120 }, 
  headerTitle: { fontSize: 22, fontWeight: '700', marginBottom: 16 },
  section: { marginBottom: 14 },
  sectionLabel: { fontSize: 11, fontWeight: '700', textTransform: 'uppercase', marginBottom: 8, color: '#94A3B8', letterSpacing: 0.8 },
  themeCard: { padding: 14, borderRadius: 12, borderWidth: 1 },
  themeHeaderRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 10, gap: 8 },
  themeCardTitle: { fontSize: 13, fontWeight: '600' },
  themeRow: { flexDirection: 'row', gap: 8 },
  themeOption: { flex: 1, paddingVertical: 8, borderRadius: 8, alignItems: 'center', borderWidth: 1, flexDirection: 'row', justifyContent: 'center', gap: 4 },
  themeText: { fontSize: 11, fontWeight: '600' },
  activeThemeText: { color: '#FFFFFF', fontWeight: '700' },
  actionButton: { padding: 12, borderRadius: 12, flexDirection: 'row', alignItems: 'center', borderWidth: 1, marginBottom: 8 },
  dangerCard: { backgroundColor: 'rgba(239, 68, 68, 0.08)', borderColor: 'rgba(239, 68, 68, 0.3)' },
  iconBox: { width: 30, height: 30, borderRadius: 8, justifyContent: 'center', alignItems: 'center' },
  actionTextContainer: { flex: 1, marginLeft: 10 },
  actionTitle: { fontSize: 13, fontWeight: '600' },
  actionSubtitle: { fontSize: 10, marginTop: 1 },
  infoCard: { padding: 16, borderRadius: 12, alignItems: 'center', marginTop: 6, marginBottom: 20, borderWidth: 1 },
  infoTitle: { fontSize: 14, fontWeight: '700' },
  infoText: { fontSize: 11, textAlign: 'center', lineHeight: 15 },
  
  // Custom Modal Styles
  modalOverlay: { 
    flex: 1, 
    backgroundColor: 'rgba(0,0,0,0.65)', 
    justifyContent: 'center', 
    alignItems: 'center', 
    padding: 20 
  },
  modalContent: { 
    width: '100%', 
    maxWidth: 340, 
    borderRadius: 20, 
    padding: 20, 
    borderWidth: 1, 
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 10,
    elevation: 5,
  },
  modalIconBadge: {
    width: 50,
    height: 50,
    borderRadius: 25,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  modalTitle: { 
    fontSize: 17, 
    fontWeight: '700', 
    textAlign: 'center', 
    marginBottom: 6 
  },
  modalMessage: { 
    fontSize: 12, 
    textAlign: 'center', 
    lineHeight: 18, 
    marginBottom: 20 
  },
  modalBtnRow: { 
    flexDirection: 'row', 
    gap: 10, 
    width: '100%' 
  },
  modalCancelBtn: { 
    flex: 1, 
    height: 44, 
    borderRadius: 10, 
    justifyContent: 'center', 
    alignItems: 'center', 
    borderWidth: 1 
  },
  modalCancelText: { 
    fontSize: 13, 
    fontWeight: '600' 
  },
  modalConfirmBtn: { 
    flex: 1, 
    height: 44, 
    borderRadius: 10, 
    justifyContent: 'center', 
    alignItems: 'center',
    elevation: 2,
  },
  modalConfirmText: { 
    color: '#FFFFFF', 
    fontSize: 13, 
    fontWeight: '700' 
  }
});