import React, { useState, useEffect, useContext } from 'react';
import { 
  StyleSheet, 
  Text, 
  View, 
  TextInput, 
  TouchableOpacity, 
  Modal, 
  ScrollView, 
  KeyboardAvoidingView, 
  Platform 
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { updateAccount } from '../../../api/accountsRepo';
import { ThemeContext } from '../../../context/ThemeContext';

const PALETTE_COLORS = [
  null,
  '#2563EB',
  '#059669',
  '#7C3AED',
  '#D97706',
  '#DC2626',
  '#DB2777',
  '#0891B2',
  '#EA580C',
  '#475569',
];

const ACCOUNT_ICONS = [
  { id: 'wallet-outline', label: 'Wallet' },
  { id: 'card-outline', label: 'Card' },
  { id: 'cash-outline', label: 'Cash' },
  { id: 'phone-portrait-outline', label: 'E-Wallet' },
  { id: 'business-outline', label: 'Bank' },
  { id: 'shield-checkmark-outline', label: 'Savings' },
  { id: 'trending-up-outline', label: 'Invest' },
];

export default function EditAccountModal({ visible, account, onClose, onSuccess }) {
  const { theme } = useContext(ThemeContext);

  const [name, setName] = useState('');
  const [color, setColor] = useState(null);
  const [icon, setIcon] = useState('wallet-outline');

  useEffect(() => {
    if (visible && account) {
      setName(account.name);
      setColor(account.color || null);
      setIcon(account.icon || 'wallet-outline');
    }
  }, [visible, account]);

  const handleUpdate = () => {
    if (!name.trim() || !account) return;
    updateAccount(account.id, name.trim(), color, icon);
    onSuccess();
    onClose();
  };

  const hasCustomColor = !!color;
  const previewBg = color || theme.cardBg;
  const previewText = hasCustomColor ? '#FFFFFF' : theme.text;
  const previewSubText = hasCustomColor ? 'rgba(255, 255, 255, 0.8)' : theme.subText;

  return (
    <Modal visible={visible} animationType="slide" transparent={true} onRequestClose={onClose}>
      <View style={styles.modalOverlay}>
        {/* Updated behavior to match CategoryManagerScreen so Android pushes the sheet up correctly */}
        <KeyboardAvoidingView 
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={styles.keyboardView}
        >
          <View style={[styles.modalContainer, { backgroundColor: theme.cardBg, borderColor: theme.border }]}>
            
            {/* Header */}
            <View style={styles.headerRow}>
              <View style={styles.titleContainer}>
                <View style={[styles.titleIndicator, { backgroundColor: theme.primary }]} />
                <Text style={[styles.modalTitle, { color: theme.text }]}>Edit Wallet</Text>
              </View>
              <TouchableOpacity onPress={onClose} style={[styles.closeBtn, { backgroundColor: theme.inputBg }]} activeOpacity={0.8}>
                <Ionicons name="close" size={18} color={theme.text} />
              </TouchableOpacity>
            </View>

            <ScrollView 
              showsVerticalScrollIndicator={false}
              contentContainerStyle={styles.scrollContent}
              keyboardShouldPersistTaps="handled"
              keyboardDismissMode="none"
            >
              {/* Live Card Preview Component */}
              <View style={styles.previewContainer}>
                <View style={[styles.mockCard, { backgroundColor: previewBg, borderColor: hasCustomColor ? previewBg : theme.border }]}>
                  <View style={styles.mockCardTop}>
                    <Text style={[styles.mockCardName, { color: previewSubText }]} numberOfLines={1}>
                      {name.trim() || 'Wallet Name'}
                    </Text>
                    <Ionicons name={icon || 'wallet-outline'} size={18} color={previewSubText} />
                  </View>
                  <Text style={[styles.mockCardBalance, { color: previewText }]}>
                    ₱{account?.balance ? account.balance.toLocaleString('en-US', { minimumFractionDigits: 2 }) : '0.00'}
                  </Text>
                </View>
              </View>

              <Text style={[styles.label, { color: theme.subText }]}>Wallet Name</Text>
              <TextInput
                style={[styles.input, { backgroundColor: theme.inputBg, color: theme.text, borderColor: theme.border }]}
                placeholder="Wallet Name"
                placeholderTextColor={theme.subText}
                value={name}
                onChangeText={setName}
              />

              {/* Choose Account Icon */}
              <Text style={[styles.label, { color: theme.subText }]}>Account Icon</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.iconRow} keyboardShouldPersistTaps="handled">
                {ACCOUNT_ICONS.map((item) => {
                  const isSelected = icon === item.id;
                  return (
                    <TouchableOpacity
                      key={item.id}
                      style={[
                        styles.iconChip,
                        { backgroundColor: theme.inputBg, borderColor: theme.border },
                        isSelected && { backgroundColor: theme.primary, borderColor: theme.primary }
                      ]}
                      onPress={() => setIcon(item.id)}
                      activeOpacity={0.8}
                    >
                      <Ionicons name={item.id} size={15} color={isSelected ? '#FFFFFF' : theme.subText} />
                      <Text style={[styles.iconChipText, { color: isSelected ? '#FFFFFF' : theme.subText }]}>{item.label}</Text>
                    </TouchableOpacity>
                  );
                })}
              </ScrollView>

              <Text style={[styles.label, { color: theme.subText }]}>Card Color Theme</Text>
              <ScrollView 
                horizontal 
                showsHorizontalScrollIndicator={false} 
                style={styles.colorRow}
                keyboardShouldPersistTaps="handled"
              >
                {PALETTE_COLORS.map((c, index) => {
                  const isSelected = color === c;
                  const circleBg = c || theme.cardBg;

                  return (
                    <TouchableOpacity
                      key={c || `default-${index}`}
                      style={[
                        styles.colorCircle,
                        { backgroundColor: circleBg, borderColor: theme.border },
                        isSelected && styles.selectedColor,
                      ]}
                      onPress={() => setColor(c)}
                      activeOpacity={0.8}
                    >
                      {isSelected && (
                        <Ionicons name="checkmark" size={14} color="#FFFFFF" />
                      )}
                      {!c && !isSelected && (
                        <Ionicons name="ban-outline" size={12} color={theme.subText} />
                      )}
                    </TouchableOpacity>
                  );
                })}
              </ScrollView>

              <TouchableOpacity 
                style={[styles.saveBtn, { backgroundColor: theme.primary }]} 
                onPress={handleUpdate}
                activeOpacity={0.85}
              >
                <Ionicons name="checkmark-circle-outline" size={16} color="#FFFFFF" style={{ marginRight: 6 }} />
                <Text style={styles.saveBtnText}>Save Changes</Text>
              </TouchableOpacity>
            </ScrollView>

          </View>
        </KeyboardAvoidingView>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  modalOverlay: { 
    flex: 1, 
    backgroundColor: 'rgba(0,0,0,0.65)', 
    justifyContent: 'flex-end' 
  },
  keyboardView: {
    width: '100%',
    justifyContent: 'flex-end',
  },
  modalContainer: { 
    borderTopLeftRadius: 26, 
    borderTopRightRadius: 26, 
    paddingHorizontal: 18,
    paddingTop: 18,
    borderWidth: 1,
    borderBottomWidth: 0,
    maxHeight: '92%',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
  },
  scrollContent: {
    paddingBottom: 40,
  },
  headerRow: { 
    flexDirection: 'row', 
    justifyContent: 'space-between', 
    alignItems: 'center', 
    marginBottom: 12 
  },
  titleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  titleIndicator: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 8,
  },
  modalTitle: { 
    fontSize: 17, 
    fontWeight: '700' 
  },
  closeBtn: { 
    width: 32, 
    height: 32, 
    borderRadius: 16, 
    justifyContent: 'center', 
    alignItems: 'center' 
  },
  previewContainer: {
    alignItems: 'center',
    marginVertical: 10,
  },
  mockCard: {
    width: '100%',
    height: 80,
    borderRadius: 12,
    padding: 14,
    justifyContent: 'space-between',
    borderWidth: 1,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  mockCardTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  mockCardName: {
    fontSize: 12,
    fontWeight: '600',
  },
  mockCardBalance: {
    fontSize: 16,
    fontWeight: '700',
  },
  label: { 
    fontSize: 10, 
    fontWeight: '700',
    marginBottom: 6, 
    marginTop: 12,
    textTransform: 'uppercase',
    letterSpacing: 0.8
  },
  input: { 
    height: 44,
    paddingHorizontal: 14, 
    borderRadius: 10, 
    fontSize: 13, 
    borderWidth: 1 
  },
  iconRow: {
    flexDirection: 'row',
    paddingVertical: 4,
  },
  iconChip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 8,
    borderWidth: 1,
    marginRight: 6,
    gap: 5,
  },
  iconChipText: {
    fontSize: 11,
    fontWeight: '600',
  },
  colorRow: { 
    flexDirection: 'row', 
    marginTop: 6, 
    paddingVertical: 4 
  },
  colorCircle: {
    width: 34,
    height: 34,
    borderRadius: 17,
    marginRight: 8,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
  },
  selectedColor: { 
    borderWidth: 2, 
    borderColor: '#FFFFFF', 
    transform: [{ scale: 1.08 }] 
  },
  saveBtn: { 
    flexDirection: 'row',
    height: 46, 
    borderRadius: 12, 
    justifyContent: 'center', 
    alignItems: 'center', 
    marginTop: 24, 
    marginBottom: 10,
    elevation: 3,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
  },
  saveBtnText: { 
    color: '#FFFFFF', 
    fontSize: 13, 
    fontWeight: '700' 
  },
});