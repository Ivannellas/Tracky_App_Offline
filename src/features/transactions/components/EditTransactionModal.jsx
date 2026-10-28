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
  Platform, 
  TouchableWithoutFeedback, 
  Keyboard 
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

  return (
    <Modal visible={visible} animationType="slide" transparent={true}>
      <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
        <View style={styles.modalOverlay}>
          <KeyboardAvoidingView 
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
            style={styles.keyboardView}
          >
            <View style={[styles.modalContainer, { backgroundColor: theme.cardBg, borderColor: theme.border }]}>
              
              <View style={styles.headerRow}>
                <Text style={[styles.modalTitle, { color: theme.text }]}>Edit Transaction</Text>
                <TouchableOpacity onPress={onClose} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
                  <Ionicons name="close" size={20} color={theme.subText} />
                </TouchableOpacity>
              </View>

              <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 20 }}>
                {/* Type Selector (Income / Expense) */}
                <View style={[styles.typeSelector, { backgroundColor: theme.inputBg, borderColor: theme.border }]}>
                  <TouchableOpacity 
                    style={[styles.typeBtn, type === 'expense' && styles.activeExpense]} 
                    onPress={() => setType('expense')}
                  >
                    <Text style={[styles.typeText, { color: theme.subText }, type === 'expense' && styles.activeText]}>Expense</Text>
                  </TouchableOpacity>
                  <TouchableOpacity 
                    style={[styles.typeBtn, type === 'income' && styles.activeIncome]} 
                    onPress={() => setType('income')}
                  >
                    <Text style={[styles.typeText, { color: theme.subText }, type === 'income' && styles.activeText]}>Income</Text>
                  </TouchableOpacity>
                </View>

                {/* Amount Input */}
                <Text style={[styles.label, { color: theme.subText }]}>Amount (₱)</Text>
                <TextInput
                  style={[styles.input, { backgroundColor: theme.inputBg, color: theme.text, borderColor: theme.border }]}
                  placeholder="0.00"
                  placeholderTextColor={theme.subText}
                  keyboardType="numeric"
                  value={amount}
                  onChangeText={setAmount}
                />

                {/* Account Selector */}
                <Text style={[styles.label, { color: theme.subText }]}>Wallet / Account</Text>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.selectorRow}>
                  {accounts.map((acc) => (
                    <TouchableOpacity
                      key={acc.id}
                      style={[
                        styles.chip, 
                        { backgroundColor: theme.inputBg, borderColor: theme.border },
                        accountId === acc.id && { backgroundColor: theme.primary, borderColor: theme.primary }
                      ]}
                      onPress={() => setAccountId(acc.id)}
                    >
                      <Text style={[styles.chipText, { color: theme.subText }, accountId === acc.id && styles.activeChipText]}>
                        {acc.name}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </ScrollView>

                {/* Category Selector */}
                <Text style={[styles.label, { color: theme.subText }]}>Category</Text>
                <View style={styles.gridRow}>
                  {categories.filter(c => c.type === type).map((cat) => (
                    <TouchableOpacity
                      key={cat.id}
                      style={[
                        styles.catChip, 
                        { backgroundColor: theme.inputBg, borderColor: theme.border },
                        categoryId === cat.id && { backgroundColor: theme.primary, borderColor: theme.primary }
                      ]}
                      onPress={() => setCategoryId(cat.id)}
                    >
                      <Text style={[styles.catChipText, { color: theme.subText }, categoryId === cat.id && styles.activeCatChipText]}>
                        {cat.name}
                      </Text>
                    </TouchableOpacity>
                  ))}
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
                <TouchableOpacity style={[styles.saveBtn, { backgroundColor: theme.primary }]} onPress={handleUpdate}>
                  <Text style={styles.saveBtnText}>Update Transaction</Text>
                </TouchableOpacity>
              </ScrollView>

            </View>
          </KeyboardAvoidingView>
        </View>
      </TouchableWithoutFeedback>
    </Modal>
  );
}

const styles = StyleSheet.create({
  modalOverlay: { 
    flex: 1, 
    backgroundColor: 'rgba(0,0,0,0.6)', 
    justifyContent: 'flex-end' 
  },
  keyboardView: {
    width: '100%',
    justifyContent: 'flex-end',
  },
  modalContainer: { 
    borderTopLeftRadius: 20, 
    borderTopRightRadius: 20, 
    paddingHorizontal: 16,
    paddingTop: 14,
    maxHeight: '92%', 
    borderWidth: 1,
    borderBottomWidth: 0,
  },
  headerRow: { 
    flexDirection: 'row', 
    justifyContent: 'space-between', 
    alignItems: 'center', 
    marginBottom: 10 
  },
  modalTitle: { 
    fontSize: 17, 
    fontWeight: '700' 
  },
  typeSelector: { 
    flexDirection: 'row', 
    borderRadius: 10, 
    padding: 3, 
    marginBottom: 10, 
    borderWidth: 1 
  },
  typeBtn: { 
    flex: 1, 
    paddingVertical: 8, 
    alignItems: 'center', 
    borderRadius: 8 
  },
  activeExpense: { 
    backgroundColor: '#EF4444' 
  },
  activeIncome: { 
    backgroundColor: '#10B981' 
  },
  typeText: { 
    fontWeight: '600',
    fontSize: 13,
  },
  activeText: { 
    color: '#FFFFFF' 
  },
  label: { 
    fontSize: 12, 
    fontWeight: '700',
    marginBottom: 6, 
    marginTop: 10 
  },
  input: { 
    borderRadius: 10, 
    paddingVertical: 12,
    paddingHorizontal: 14, 
    fontSize: 15, 
    borderWidth: 1 
  },
  selectorRow: { 
    flexDirection: 'row', 
    marginBottom: 4 
  },
  chip: { 
    paddingHorizontal: 14, 
    paddingVertical: 8, 
    borderRadius: 8, 
    marginRight: 8, 
    borderWidth: 1 
  },
  activeChipText: { 
    color: '#FFFFFF', 
    fontWeight: '700' 
  },
  chipText: { 
    fontSize: 13 
  },
  gridRow: { 
    flexDirection: 'row', 
    flexWrap: 'wrap', 
    gap: 6,
    marginBottom: 4,
  },
  catChip: { 
    paddingHorizontal: 12, 
    paddingVertical: 6, 
    borderRadius: 8, 
    borderWidth: 1, 
    marginBottom: 4 
  },
  activeCatChipText: { 
    color: '#FFFFFF', 
    fontWeight: '700' 
  },
  catChipText: { 
    fontSize: 12 
  },
  saveBtn: { 
    padding: 14, 
    borderRadius: 10, 
    alignItems: 'center', 
    marginTop: 18, 
    marginBottom: 12 
  },
  saveBtnText: { 
    color: '#FFFFFF', 
    fontSize: 14, 
    fontWeight: '700' 
  },
});