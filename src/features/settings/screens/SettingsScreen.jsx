import React, { useContext } from 'react';
import { StyleSheet, Text, View, TouchableOpacity, Alert, ScrollView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { exportDatabaseBackup, importDatabaseBackup } from '../../../api/backupRepo';
import { deleteAllTransactions } from '../../../api/transactionsRepo';
import { ThemeContext } from '../../../context/ThemeContext';
import { AuthContext } from '../../../context/AuthContext';

export default function SettingsScreen({ onOpenCategoryManager }) {
  const { theme, themeMode, changeTheme } = useContext(ThemeContext);
  const { hasPinSet, lockApp, removePin } = useContext(AuthContext);

  const handleExport = async () => {
    try {
      await exportDatabaseBackup();
    } catch (error) {
      Alert.alert('Export Failed', 'An error occurred while creating your backup file.');
    }
  };

  const handleImport = async () => {
    Alert.alert(
      'Restore Backup',
      'Restoring from a backup file will replace all existing transactions, categories, and wallet balances. Continue?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Restore Data',
          style: 'destructive',
          onPress: async () => {
            try {
              const success = await importDatabaseBackup();
              if (success) {
                Alert.alert('Success', 'Your Trackly data has been successfully restored!');
              }
            } catch (error) {
              Alert.alert('Import Failed', 'The selected file is not a valid Trackly JSON backup.');
            }
          },
        },
      ]
    );
  };

  const handleTogglePin = () => {
    if (hasPinSet) {
      Alert.alert(
        'Disable App Lock',
        'Are you sure you want to remove your 4-digit PIN security lock?',
        [
          { text: 'Cancel', style: 'cancel' },
          {
            text: 'Disable Lock',
            style: 'destructive',
            onPress: () => removePin(),
          },
        ]
      );
    } else {
      lockApp(); 
    }
  };

  const handleDeleteAllTransactions = () => {
    Alert.alert(
      'Delete All Transactions?',
      'This will permanently wipe all recorded transactions. Your wallets and categories will remain intact, but transaction history will be cleared.\n\nAre you sure you want to continue?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete All',
          style: 'destructive',
          onPress: () => {
            try {
              deleteAllTransactions();
              Alert.alert('Cleared', 'All transaction history has been permanently deleted.');
            } catch (error) {
              Alert.alert('Error', 'Failed to clear transactions. Please try again.');
            }
          },
        },
      ]
    );
  };

  return (
    <ScrollView 
      style={[styles.container, { backgroundColor: theme.bg }]} 
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
        >
          <Ionicons 
            name={hasPinSet ? 'lock-closed' : 'lock-open-outline'} 
            size={18} 
            color={hasPinSet ? '#8B5CF6' : theme.subText} 
          />
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
            <Ionicons name="color-palette-outline" size={18} color={theme.primary} />
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
        >
          <Ionicons name="list-outline" size={18} color={theme.primary} />
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
        >
          <Ionicons name="cloud-download-outline" size={18} color="#10B981" />
          <View style={styles.actionTextContainer}>
            <Text style={[styles.actionTitle, { color: theme.text }]}>Export Backup (.json)</Text>
            <Text style={[styles.actionSubtitle, { color: theme.subText }]}>Save a secure copy of your current data records</Text>
          </View>
          <Ionicons name="chevron-forward" size={16} color={theme.subText} />
        </TouchableOpacity>

        <TouchableOpacity 
          style={[styles.actionButton, { backgroundColor: theme.cardBg, borderColor: theme.border }]} 
          onPress={handleImport}
        >
          <Ionicons name="cloud-upload-outline" size={18} color="#3B82F6" />
          <View style={styles.actionTextContainer}>
            <Text style={[styles.actionTitle, { color: theme.text }]}>Import Backup (.json)</Text>
            <Text style={[styles.actionSubtitle, { color: theme.subText }]}>Restore records from a previously exported backup file</Text>
          </View>
          <Ionicons name="chevron-forward" size={16} color={theme.subText} />
        </TouchableOpacity>
      </View>

      {/* --- DANGER ZONE SECTION --- */}
      <View style={styles.section}>
        <Text style={[styles.sectionLabel, { color: '#EF4444' }]}>Danger Zone</Text>
        
        <TouchableOpacity 
          style={[styles.actionButton, styles.dangerCard]} 
          onPress={handleDeleteAllTransactions}
        >
          <Ionicons name="trash-bin-outline" size={18} color="#EF4444" />
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
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { padding: 14, paddingTop: 45, paddingBottom: 120 }, 
  headerTitle: { fontSize: 22, fontWeight: '700', marginBottom: 16 },
  section: { marginBottom: 14 },
  sectionLabel: { fontSize: 12, fontWeight: '700', textTransform: 'uppercase', marginBottom: 8, color: '#94A3B8' },
  themeCard: { padding: 16, borderRadius: 10, borderWidth: 1 },
  themeHeaderRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 10, gap: 6 },
  themeCardTitle: { fontSize: 13, fontWeight: '600' },
  themeRow: { flexDirection: 'row', gap: 8 },
  themeOption: { flex: 1, paddingVertical: 8, borderRadius: 8, alignItems: 'center', borderWidth: 1, flexDirection: 'row', justifyContent: 'center', gap: 4 },
  themeText: { fontSize: 11, fontWeight: '600' },
  activeThemeText: { color: '#FFFFFF', fontWeight: '700' },
  actionButton: { padding: 13, borderRadius: 10, flexDirection: 'row', alignItems: 'center', borderWidth: 1, marginBottom: 8 },
  dangerCard: { backgroundColor: 'rgba(239, 68, 68, 0.08)', borderColor: 'rgba(239, 68, 68, 0.3)' },
  actionTextContainer: { flex: 1, marginLeft: 10 },
  actionTitle: { fontSize: 13, fontWeight: '600' },
  actionSubtitle: { fontSize: 10, marginTop: 1 },
  infoCard: { padding: 16, borderRadius: 10, alignItems: 'center', marginTop: 6, marginBottom: 20, borderWidth: 1 },
  infoTitle: { fontSize: 14, fontWeight: '700' },
  infoText: { fontSize: 11, textAlign: 'center', lineHeight: 15 }
});