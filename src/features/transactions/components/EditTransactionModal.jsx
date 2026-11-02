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
import { getAllCategories } from '../../../api/categoriesRepo';
import { updateTransaction } from '../../../api/transactionsRepo';
import { ThemeContext } from '../../../context/ThemeContext';

export default function EditTransactionModal({ visible, transaction, onClose, onSuccess }) {
  const { theme } = useContext(ThemeContext);

  const [accounts, setAccounts] = useState([]);
  const [categories, setCategories] = useState([]);
  
  const [type, setType] = useState('expense');
  const [amount, setAmount] = useState('');
  const [accountId, setAccountId] = useState(null);
  const [categoryId, setCategoryId] = useState(null);
  const [note, setNote] = useState('');

  useEffect(() => {
    if (visible && transaction) {
      setAccounts(getAllAccounts());
      setCategories(getAllCategories());
      
      setType(transaction.type);
      setAmount(transaction.amount.toString());
      setAccountId(transaction.account_id);
      setCategoryId(transaction.category_id);
      setNote(transaction.note || '');
    }
  }, [visible, transaction]);

  const handleUpdate = () => {
    if (!amount || !accountId || !categoryId) return;
    
    updateTransaction(transaction.id, {
      account_id: accountId,
      category_id: categoryId,
      amount: parseFloat(amount),
      type,
      note,
    });

    onSuccess();
    onClose();
  };

  const activeColor = type === 'expense' ? '#EF4444' : '#10B981';

  return (
    <Modal visible={visible} animationType="slide" transparent={true} onRequestClose={onClose}>
      <View style={styles.modalOverlay}>
        <KeyboardAvoidingView 
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          style={styles.keyboardView}
        >
          <View style={[styles.modalContent, { backgroundColor: theme.cardBg, borderColor: theme.border }]}>
            
            {/* Header */}
            <View style={styles.headerRow}>
              <View style={styles.titleContainer}>
                <View style={[styles.titleIndicator, { backgroundColor: activeColor }]} />
                <Text style={[styles.modalTitle, { color: theme.text }]}>Edit Transaction</Text>
              </View>
              <TouchableOpacity onPress={onClose} style={[styles.closeBtn, { backgroundColor: theme.inputBg }]} activeOpacity={0.8}>
                <Ionicons name="close" size={18} color={theme.text} />
              </TouchableOpacity>
            </View>

            {/* Type Selector (Income / Expense) */}
            <View style={[styles.typeSelector, { backgroundColor: theme.inputBg, borderColor: theme.border }]}>
              <TouchableOpacity 
                style={[styles.typeBtn, type === 'expense' && styles.activeExpense]} 
                onPress={() => setType('expense')}
                activeOpacity={0.85}
              >
                <Ionicons name="arrow-down-circle-outline" size={15} color={type === 'expense' ? '#FFFFFF' : theme.subText} style={{ marginRight: 6 }} />
                <Text style={[styles.typeText, { color: theme.subText }, type === 'expense' && styles.activeText]}>Expense</Text>
              </TouchableOpacity>
              <TouchableOpacity 
                style={[styles.typeBtn, type === 'income' && styles.activeIncome]} 
                onPress={() => setType('income')}
                activeOpacity={0.85}
              >
                <Ionicons name="arrow-up-circle-outline" size={15} color={type === 'income' ? '#FFFFFF' : theme.subText} style={{ marginRight: 6 }} />
                <Text style={[styles.typeText, { color: theme.subText }, type === 'income' && styles.activeText]}>Income</Text>
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
                />
              </View>

              {/* Account Selector */}
              <Text style={[styles.label, { color: theme.subText }]}>Wallet / Account</Text>
              <ScrollView 
                horizontal 
                showsHorizontalScrollIndicator={false} 
                style={styles.selectorRow}
                keyboardShouldPersistTaps="handled"
              >
                {accounts.map((acc) => {
                  const isSelected = accountId === acc.id;
                  return (
                    <TouchableOpacity
                      key={acc.id}
                      style={[
                        styles.chip, 
                        { backgroundColor: theme.inputBg, borderColor: theme.border },
                        isSelected && { backgroundColor: theme.primary, borderColor: theme.primary, elevation: 2 }
                      ]}
                      onPress={() => setAccountId(acc.id)}
                      activeOpacity={0.8}
                    >
                      <Ionicons 
                        name="wallet-outline" 
                        size={13} 
                        color={isSelected ? '#FFFFFF' : theme.subText} 
                        style={{ marginRight: 4 }} 
                      />
                      <Text style={[styles.chipText, { color: theme.subText }, isSelected && styles.activeChipText]}>
                        {acc.name}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </ScrollView>

              {/* Category Selector */}
              <Text style={[styles.label, { color: theme.subText }]}>Category</Text>
              <View style={styles.gridRow}>
                {categories.filter(c => c.type === type).map((cat) => {
                  const isSelected = categoryId === cat.id;
                  return (
                    <TouchableOpacity
                      key={cat.id}
                      style={[
                        styles.catChip, 
                        { backgroundColor: theme.inputBg, borderColor: theme.border },
                        isSelected && { backgroundColor: activeColor, borderColor: activeColor, elevation: 2 }
                      ]}
                      onPress={() => setCategoryId(cat.id)}
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
                      <Text style={[styles.catChipText, { color: theme.subText }, isSelected && styles.activeCatChipText]}>
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
                placeholder="Grocery run, lunch"
                placeholderTextColor={theme.subText}
                value={note}
                onChangeText={setNote}
              />

              {/* Save Button */}
              <TouchableOpacity 
                style={[styles.saveBtn, { backgroundColor: activeColor }]} 
                onPress={handleUpdate}
                activeOpacity={0.85}
              >
                <Ionicons name="checkmark-circle-outline" size={16} color="#FFFFFF" style={{ marginRight: 6 }} />
                <Text style={styles.saveBtnText}>Update Transaction</Text>
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
    marginBottom: 14 
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
    alignItems: 'center',
  },
  typeSelector: { 
    flexDirection: 'row', 
    borderRadius: 12, 
    padding: 4, 
    marginBottom: 14, 
    borderWidth: 1 
  },
  typeBtn: { 
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
  typeText: { 
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
    marginBottom: 16,
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
  label: { 
    fontSize: 10, 
    fontWeight: '700',
    marginBottom: 8, 
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
  selectorRow: { 
    flexDirection: 'row', 
    marginBottom: 4,
    paddingVertical: 2,
  },
  chip: { 
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12, 
    paddingVertical: 8, 
    borderRadius: 9, 
    marginRight: 8, 
    borderWidth: 1 
  },
  activeChipText: { 
    color: '#FFFFFF', 
    fontWeight: '700' 
  },
  chipText: { 
    fontSize: 12,
    fontWeight: '600',
  },
  gridRow: { 
    flexDirection: 'row', 
    flexWrap: 'wrap', 
    gap: 6,
    marginBottom: 4,
  },
  catChip: { 
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12, 
    paddingVertical: 8, 
    borderRadius: 9, 
    borderWidth: 1, 
  },
  activeCatChipText: { 
    color: '#FFFFFF', 
    fontWeight: '700' 
  },
  catChipText: { 
    fontSize: 12,
    fontWeight: '600',
  },
  saveBtn: { 
    flexDirection: 'row',
    height: 46, 
    borderRadius: 12, 
    justifyContent: 'center', 
    alignItems: 'center', 
    marginTop: 22, 
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