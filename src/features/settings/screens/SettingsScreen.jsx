import React, { useState, useContext } from 'react';
import { StyleSheet, Text, View, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { exportDatabaseBackup } from '../../../api/backupRepo';
import CategoryManagerModal from '../../categories/components/CategoryManagerModal';
import { ThemeContext } from '../../../context/ThemeContext';

export default function SettingsScreen() {
  const [isCategoryModalVisible, setIsCategoryModalVisible] = useState(false);
  const { theme, themeMode, changeTheme } = useContext(ThemeContext);

  const handleExport = async () => {
    await exportDatabaseBackup();
  };

  return (
    <View style={[styles.container, { backgroundColor: theme.bg }]}>
      <Text style={[styles.headerTitle, { color: theme.text }]}>Settings & Data</Text>

      {/* --- APPEARANCE / THEME SECTION --- */}
      <View style={styles.section}>
        <Text style={styles.sectionLabel}>Appearance</Text>
        <View style={[styles.themeCard, { backgroundColor: theme.cardBg, borderColor: theme.border }]}>
          <View style={styles.themeHeaderRow}>
            <Ionicons name="color-palette-outline" size={20} color={theme.primary} />
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
                  size={16} 
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
          onPress={() => setIsCategoryModalVisible(true)}
        >
          <Ionicons name="list-outline" size={20} color={theme.primary} />
          <View style={styles.actionTextContainer}>
            <Text style={[styles.actionTitle, { color: theme.text }]}>Manage Categories</Text>
            <Text style={[styles.actionSubtitle, { color: theme.subText }]}>Add, edit, or delete income and expense categories</Text>
          </View>
          <Ionicons name="chevron-forward" size={18} color={theme.subText} />
        </TouchableOpacity>
      </View>

      {/* --- DATA BACKUP SECTION --- */}
      <View style={styles.section}>
        <Text style={styles.sectionLabel}>Data Backup</Text>
        
        <TouchableOpacity 
          style={[styles.actionButton, { backgroundColor: theme.cardBg, borderColor: theme.border }]} 
          onPress={handleExport}
        >
          <Ionicons name="cloud-download-outline" size={20} color="#10B981" />
          <View style={styles.actionTextContainer}>
            <Text style={[styles.actionTitle, { color: theme.text }]}>Export Backup (.json)</Text>
            <Text style={[styles.actionSubtitle, { color: theme.subText }]}>Save a secure copy of your local SQLite records</Text>
          </View>
          <Ionicons name="chevron-forward" size={18} color={theme.subText} />
        </TouchableOpacity>
      </View>

      <View style={[styles.infoCard, { backgroundColor: theme.cardBg, borderColor: theme.border }]}>
        <Ionicons name="shield-checkmark-outline" size={24} color="#10B981" style={{ marginBottom: 8 }} />
        <Text style={[styles.infoTitle, { color: theme.text }]}>100% Offline & Private</Text>
        <Text style={[styles.infoText, { color: theme.subText }]}>
          Your financial data stays securely on this device inside a local SQLite file. No cloud servers, no tracking, and zero internet required.
        </Text>
      </View>

      {/* --- CATEGORY MANAGER MODAL COMPONENT --- */}
      <CategoryManagerModal 
        visible={isCategoryModalVisible} 
        onClose={() => setIsCategoryModalVisible(false)} 
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 20, paddingTop: 60 },
  headerTitle: { fontSize: 24, fontWeight: 'bold', marginBottom: 20 },
  section: { marginBottom: 20 },
  sectionLabel: { fontSize: 12, fontWeight: '600', textTransform: 'uppercase', marginBottom: 10, color: '#94A3B8' },
  themeCard: { padding: 16, borderRadius: 14, borderWidth: 1 },
  themeHeaderRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 12, gap: 8 },
  themeCardTitle: { fontSize: 15, fontWeight: '600' },
  themeRow: { flexDirection: 'row', gap: 10 },
  themeOption: { flex: 1, paddingVertical: 10, borderRadius: 10, alignItems: 'center', borderWidth: 1, flexDirection: 'row', justifyContent: 'center', gap: 6 },
  themeText: { fontSize: 13, fontWeight: '600' },
  activeThemeText: { color: '#FFFFFF', fontWeight: 'bold' },
  actionButton: { padding: 16, borderRadius: 14, flexDirection: 'row', alignItems: 'center', borderWidth: 1, marginBottom: 8 },
  actionTextContainer: { flex: 1, marginLeft: 14 },
  actionTitle: { fontSize: 16, fontWeight: '600' },
  actionSubtitle: { fontSize: 12, marginTop: 2 },
  infoCard: { padding: 20, borderRadius: 16, alignItems: 'center', marginTop: 'auto', marginBottom: 30, borderWidth: 1 },
  infoTitle: { fontSize: 16, fontWeight: 'bold', marginBottom: 6 },
  infoText: { fontSize: 13, textAlign: 'center', lineHeight: 18 }
});