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
import { getAllAccounts } from '../../../api/accountsRepo';
import { getCategoriesByType } from '../../../api/categoriesRepo';
import { insertTransaction } from '../../../api/transactionsRepo';
import { ThemeContext } from '../../../context/ThemeContext';

// Helper to get YYYY-MM-DD in Philippine Time (UTC+8)
const getPhilippineDateString = (offsetDays = 0) => {
  const now = new Date();
  now.setDate(now.getDate() - offsetDays);
  const phTime = new Date(now.getTime() + (8 * 60 * 60 * 1000) + (now.getTimezoneOffset() * 60 * 1000));
  return phTime.toISOString().split('T')[0];
};

export default function AddTransactionModal({ visible, initialData, onClose, onSuccess }) {
  const { theme } = useContext(ThemeContext);

  const [type, setType] = useState('expense');
  const [amount, setAmount] = useState('');
  const [note, setNote] = useState('');
  const [selectedDate, setSelectedDate] = useState(getPhilippineDateString(0));
  const [showCustomDateInput, setShowCustomDateInput] = useState(false);

  const [accounts, setAccounts] = useState([]);
  const [selectedAccount, setSelectedAccount] = useState(null);

  const [categories, setCategories] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState(null);

  useEffect(() => {
    if (visible) {
      const accts = getAllAccounts();
      setAccounts(accts);
      setShowCustomDateInput(false);

      if (initialData) {
        const txType = initialData.type || 'expense';
        setType(txType);
        setAmount(initialData.amount ? initialData.amount.toString() : '');
        setNote(initialData.note || '');
        setSelectedDate(initialData.date ? initialData.date.split('T')[0] : getPhilippineDateString(0));

        setSelectedAccount(initialData.account_id || (accts.length > 0 ? accts[0].id : null));

        const cats = getCategoriesByType(txType);
        setCategories(cats);
        setSelectedCategory(initialData.category_id || (cats.length > 0 ? cats[0].id : null));
      } else {
        if (accts.length > 0) setSelectedAccount(accts[0].id);
        loadCategories('expense');
        setAmount('');
        setNote('');
        setSelectedDate(getPhilippineDateString(0));
      }
    }
  }, [visible, initialData]);

  const loadCategories = (txType) => {
    setType(txType);
    const cats = getCategoriesByType(txType);
    setCategories(cats);
    if (cats.length > 0) setSelectedCategory(cats[0].id);
    else setSelectedCategory(null);
  };

  const handleSave = () => {
    if (!amount || isNaN(amount) || !selectedAccount || !selectedCategory) return;

    // Combine selected date (YYYY-MM-DD) with current PH time hours/minutes
    const now = new Date();
    const phTime = new Date(now.getTime() + (8 * 60 * 60 * 1000) + (now.getTimezoneOffset() * 60 * 1000));
    const timeString = phTime.toISOString().split('T')[1]; // HH:mm:ss.sssZ
    const finalDateTime = `${selectedDate}T${timeString}`;

    insertTransaction({
      accountId: selectedAccount,
      categoryId: selectedCategory,
      amount: parseFloat(amount),
      type: type,
      note: note.trim() || null,
      date: finalDateTime 
    });

    onSuccess(); 
    onClose();   
  };

  const activeColor = type === 'expense' ? '#EF4444' : '#10B981';
  const todayStr = getPhilippineDateString(0);
  const yesterdayStr = getPhilippineDateString(1);

  return (
    <Modal visible={visible} animationType="slide" transparent={true} onRequestClose={onClose}>
      {/* Updated behavior to match CategoryManagerScreen so Android pushes the sheet up correctly */}
      <KeyboardAvoidingView 
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.modalOverlay}
      >
        <View style={[styles.modalContent, { backgroundColor: theme.cardBg, borderColor: theme.border }]}>
          
          {/* Header Row */}
          <View style={styles.headerRow}>
            <View style={styles.titleContainer}>
              <View style={[styles.titleIndicator, { backgroundColor: activeColor }]} />
              <Text style={[styles.modalTitle, { color: theme.text }]}>
                {initialData ? 'Duplicate Transaction' : 'New Transaction'}
              </Text>
            </View>
            <TouchableOpacity onPress={onClose} style={[styles.closeBtn, { backgroundColor: theme.inputBg }]} activeOpacity={0.8}>
              <Ionicons name="close" size={18} color={theme.text} />
            </TouchableOpacity>
          </View>

          {/* Type Selector Tabs */}
          <View style={[styles.typeRow, { backgroundColor: theme.inputBg, borderColor: theme.border }]}>
            <TouchableOpacity
              style={[styles.typeTab, type === 'expense' && styles.activeExpense]}
              onPress={() => loadCategories('expense')}
              activeOpacity={0.85}
            >
              <Ionicons name="arrow-down-circle-outline" size={15} color={type === 'expense' ? '#FFFFFF' : theme.subText} style={{ marginRight: 6 }} />
              <Text style={[styles.typeTabText, { color: theme.subText }, type === 'expense' && styles.activeText]}>Expense</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.typeTab, type === 'income' && styles.activeIncome]}
              onPress={() => loadCategories('income')}
              activeOpacity={0.85}
            >
              <Ionicons name="arrow-up-circle-outline" size={15} color={type === 'income' ? '#FFFFFF' : theme.subText} style={{ marginRight: 6 }} />
              <Text style={[styles.typeTabText, { color: theme.subText }, type === 'income' && styles.activeText]}>Income</Text>
            </TouchableOpacity>
          </View>

          <ScrollView 
            showsVerticalScrollIndicator={true} 
            contentContainerStyle={styles.scrollContent}
            keyboardShouldPersistTaps="handled"
            keyboardDismissMode="none"
          >
            {/* Hero Amount Input Section */}
            <View style={[styles.heroAmountCard, { backgroundColor: theme.inputBg, borderColor: amount ? activeColor : theme.border }]}>
              <Text style={[styles.currencySymbol, { color: activeColor }]}>₱</Text>
              <TextInput
                style={[styles.heroInput, { color: theme.text }]}
                placeholder="0.00"
                placeholderTextColor={theme.subText}
                keyboardType="numeric"
                value={amount}
                onChangeText={setAmount}
                autoFocus={!initialData}
              />
            </View>

            {/* Date Selection Row */}
            <Text style={[styles.label, { color: theme.subText }]}>Transaction Date</Text>
            <View style={styles.dateSelectorRow}>
              <TouchableOpacity
                style={[
                  styles.dateChip,
                  { backgroundColor: theme.inputBg, borderColor: theme.border },
                  selectedDate === todayStr && { backgroundColor: theme.primary, borderColor: theme.primary }
                ]}
                onPress={() => { setSelectedDate(todayStr); setShowCustomDateInput(false); }}
                activeOpacity={0.8}
              >
                <Text style={[styles.dateChipText, { color: theme.subText }, selectedDate === todayStr && styles.selectedChipText]}>
                  Today
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[
                  styles.dateChip,
                  { backgroundColor: theme.inputBg, borderColor: theme.border },
                  selectedDate === yesterdayStr && { backgroundColor: theme.primary, borderColor: theme.primary }
                ]}
                onPress={() => { setSelectedDate(yesterdayStr); setShowCustomDateInput(false); }}
                activeOpacity={0.8}
              >
                <Text style={[styles.dateChipText, { color: theme.subText }, selectedDate === yesterdayStr && styles.selectedChipText]}>
                  Yesterday
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[
                  styles.dateChip,
                  { backgroundColor: theme.inputBg, borderColor: theme.border },
                  (selectedDate !== todayStr && selectedDate !== yesterdayStr || showCustomDateInput) && { backgroundColor: theme.primary, borderColor: theme.primary }
                ]}
                onPress={() => setShowCustomDateInput(true)}
                activeOpacity={0.8}
              >
                <Ionicons name="calendar-outline" size={13} color={(selectedDate !== todayStr && selectedDate !== yesterdayStr || showCustomDateInput) ? '#FFFFFF' : theme.subText} style={{ marginRight: 4 }} />
                <Text style={[styles.dateChipText, { color: theme.subText }, (selectedDate !== todayStr && selectedDate !== yesterdayStr || showCustomDateInput) && styles.selectedChipText]}>
                  {selectedDate !== todayStr && selectedDate !== yesterdayStr ? selectedDate : 'Custom Date'}
                </Text>
              </TouchableOpacity>
            </View>

            {/* Conditional Custom Date Text Input */}
            {showCustomDateInput && (
              <TextInput
                style={[styles.input, { backgroundColor: theme.inputBg, color: theme.text, borderColor: theme.border, marginTop: 6 }]}
                placeholder="YYYY-MM-DD (e.g. 2026-10-20)"
                placeholderTextColor={theme.subText}
                value={selectedDate}
                onChangeText={setSelectedDate}
              />
            )}

            {/* Account Selection Grid */}
            <Text style={[styles.label, { color: theme.subText }]}>Select Wallet / Account</Text>
            <View style={styles.gridContainer}>
              {accounts.map((acc) => {
                const isSelected = selectedAccount === acc.id;
                return (
                  <TouchableOpacity
                    key={acc.id}
                    style={[
                      styles.gridChip, 
                      { backgroundColor: theme.inputBg, borderColor: theme.border },
                      isSelected && { backgroundColor: theme.primary, borderColor: theme.primary, elevation: 2 }
                    ]}
                    onPress={() => setSelectedAccount(acc.id)}
                    activeOpacity={0.8}
                  >
                    <Ionicons 
                      name={acc.icon || 'wallet-outline'} 
                      size={13} 
                      color={isSelected ? '#FFFFFF' : theme.subText} 
                      style={{ marginRight: 4 }} 
                    />
                    <Text style={[styles.chipText, { color: theme.subText }, isSelected && styles.selectedChipText]} numberOfLines={1}>
                      {acc.name}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>

            {/* Category Selection Grid */}
            <Text style={[styles.label, { color: theme.subText }]}>Category</Text>
            <View style={styles.gridContainer}>
              {categories.map((cat) => {
                const isSelected = selectedCategory === cat.id;
                return (
                  <TouchableOpacity
                    key={cat.id}
                    style={[
                      styles.gridChip, 
                      { backgroundColor: theme.inputBg, borderColor: theme.border },
                      isSelected && { backgroundColor: activeColor, borderColor: activeColor, elevation: 2 }
                    ]}
                    onPress={() => setSelectedCategory(cat.id)}
                    activeOpacity={0.8}
                  >
                    {cat.icon ? (
                      <Ionicons 
                        name={cat.icon} 
                        size={13} 
                        color={isSelected ? '#FFFFFF' : (cat.color || theme.subText)} 
                        style={{ marginRight: 5 }} 
                      />
                    ) : null}
                    <Text style={[styles.chipText, { color: theme.subText }, isSelected && styles.selectedChipText]} numberOfLines={1}>
                      {cat.name}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>

            {/* Note Input */}
            <Text style={[styles.label, { color: theme.subText }]}>Note (Optional)</Text>
            <TextInput
              style={[styles.input, { backgroundColor: theme.inputBg, color: theme.text, borderColor: theme.border }]}
              placeholder="Add details..."
              placeholderTextColor={theme.subText}
              value={note}
              onChangeText={setNote}
            />

            {/* Action Buttons */}
            <View style={styles.buttonRow}>
              <TouchableOpacity 
                style={[styles.cancelButton, { backgroundColor: theme.inputBg, borderColor: theme.border }]} 
                onPress={onClose}
                activeOpacity={0.8}
              >
                <Text style={[styles.cancelButtonText, { color: theme.text }]}>Cancel</Text>
              </TouchableOpacity>

              <TouchableOpacity 
                style={[styles.saveButton, { backgroundColor: activeColor }]} 
                onPress={handleSave}
                activeOpacity={0.85}
              >
                <Ionicons name="checkmark-circle-outline" size={16} color="#FFFFFF" style={{ marginRight: 6 }} />
                <Text style={styles.saveButtonText}>
                  {initialData ? 'Save Copy' : 'Save Transaction'}
                </Text>
              </TouchableOpacity>
            </View>
          </ScrollView>

        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  modalOverlay: { 
    flex: 1, 
    backgroundColor: 'rgba(0,0,0,0.65)', 
    justifyContent: 'flex-end' 
  },
  modalContent: { 
    borderTopLeftRadius: 26, 
    borderTopRightRadius: 26, 
    paddingHorizontal: 18,
    paddingTop: 18,
    maxHeight: '92%',
    borderWidth: 1,
    borderBottomWidth: 0,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
  },
  scrollContent: {
    paddingBottom: 40,
    paddingTop: 4,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 14,
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
    fontWeight: '700', 
  },
  closeBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  typeRow: { 
    flexDirection: 'row', 
    borderRadius: 12, 
    padding: 4, 
    marginBottom: 14,
    borderWidth: 1 
  },
  typeTab: { 
    flex: 1, 
    flexDirection: 'row',
    paddingVertical: 9, 
    justifyContent: 'center',
    alignItems: 'center', 
    borderRadius: 9 
  },
  activeExpense: { 
    backgroundColor: '#EF4444',
    shadowColor: '#EF4444',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 2,
  },
  activeIncome: { 
    backgroundColor: '#10B981',
    shadowColor: '#10B981',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 2,
  },
  typeTabText: { 
    fontWeight: '600',
    fontSize: 13,
  },
  activeText: { 
    color: '#FFFFFF',
    fontWeight: '700',
  },
  heroAmountCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 14,
    borderWidth: 1.5,
    paddingVertical: 14,
    paddingHorizontal: 16,
    marginBottom: 12,
  },
  currencySymbol: {
    fontSize: 28,
    fontWeight: '700',
    marginRight: 4,
  },
  heroInput: {
    fontSize: 32,
    fontWeight: '800',
    minWidth: 100,
    textAlign: 'center',
  },
  dateSelectorRow: {
    flexDirection: 'row',
    gap: 6,
    marginBottom: 4,
  },
  dateChip: {
    flex: 1,
    flexDirection: 'row',
    height: 36,
    borderRadius: 8,
    borderWidth: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  dateChipText: {
    fontSize: 11,
    fontWeight: '600',
  },
  selectedChipText: {
    color: '#FFFFFF',
    fontWeight: '700',
  },
  label: { 
    fontSize: 10, 
    fontWeight: '700',
    marginBottom: 6, 
    marginTop: 10,
    textTransform: 'uppercase',
    letterSpacing: 0.8,
  },
  input: { 
    height: 44,
    borderRadius: 10, 
    paddingHorizontal: 14, 
    fontSize: 13, 
    borderWidth: 1 
  },
  gridContainer: { 
    flexDirection: 'row', 
    flexWrap: 'wrap', 
    gap: 6,
    marginBottom: 4,
  },
  gridChip: { 
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12, 
    paddingVertical: 8, 
    borderRadius: 9, 
    borderWidth: 1, 
  },
  chipText: { 
    fontSize: 12,
    fontWeight: '600',
  },
  buttonRow: { 
    flexDirection: 'row', 
    marginTop: 22, 
    gap: 10,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.06)',
    paddingTop: 16,
  },
  cancelButton: { 
    flex: 1, 
    height: 46, 
    borderRadius: 12, 
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
  },
  cancelButtonText: { 
    fontWeight: '600',
    fontSize: 13,
  },
  saveButton: { 
    flex: 1, 
    flexDirection: 'row',
    height: 46, 
    borderRadius: 12, 
    justifyContent: 'center',
    alignItems: 'center', 
    elevation: 3,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
  },
  saveButtonText: { 
    color: '#FFFFFF', 
    fontWeight: '700',
    fontSize: 13,
  }
});