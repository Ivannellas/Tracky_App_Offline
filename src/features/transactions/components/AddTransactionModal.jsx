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
import { getCategoriesByType } from '../../../api/categoriesRepo';
import { insertTransaction } from '../../../api/transactionsRepo';
import { ThemeContext } from '../../../context/ThemeContext';

export default function AddTransactionModal({ visible, initialData, onClose, onSuccess }) {
  const { theme } = useContext(ThemeContext);

  const [type, setType] = useState('expense');
  const [amount, setAmount] = useState('');
  const [note, setNote] = useState('');

  const [accounts, setAccounts] = useState([]);
  const [selectedAccount, setSelectedAccount] = useState(null);

  const [categories, setCategories] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState(null);

  useEffect(() => {
    if (visible) {
      const accts = getAllAccounts();
      setAccounts(accts);

      if (initialData) {
        const txType = initialData.type || 'expense';
        setType(txType);
        setAmount(initialData.amount ? initialData.amount.toString() : '');
        setNote(initialData.note || '');

        setSelectedAccount(initialData.account_id || (accts.length > 0 ? accts[0].id : null));

        const cats = getCategoriesByType(txType);
        setCategories(cats);
        setSelectedCategory(initialData.category_id || (cats.length > 0 ? cats[0].id : null));
      } else {
        if (accts.length > 0) setSelectedAccount(accts[0].id);
        loadCategories('expense');
        setAmount('');
        setNote('');
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

    const currentDateTime = new Date().toISOString();

    insertTransaction({
      accountId: selectedAccount,
      categoryId: selectedCategory,
      amount: parseFloat(amount),
      type: type,
      note: note.trim() || null,
      date: currentDateTime 
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
            <View style={[styles.modalContent, { backgroundColor: theme.cardBg, borderColor: theme.border }]}>
              
              {/* Header Row with Clean Alignment */}
              <View style={styles.headerRow}>
                <Text style={[styles.modalTitle, { color: theme.text }]}>
                  {initialData ? 'Duplicate Transaction' : 'New Transaction'}
                </Text>
                <TouchableOpacity onPress={onClose} style={styles.closeBtn} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
                  <Ionicons name="close" size={20} color={theme.subText} />
                </TouchableOpacity>
              </View>

              {/* Type Selector Tabs */}
              <View style={[styles.typeRow, { backgroundColor: theme.inputBg, borderColor: theme.border }]}>
                <TouchableOpacity
                  style={[styles.typeTab, type === 'expense' && styles.activeExpense]}
                  onPress={() => loadCategories('expense')}
                >
                  <Text style={[styles.typeTabText, { color: theme.subText }, type === 'expense' && styles.activeText]}>Expense</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.typeTab, type === 'income' && styles.activeIncome]}
                  onPress={() => loadCategories('income')}
                >
                  <Text style={[styles.typeTabText, { color: theme.subText }, type === 'income' && styles.activeText]}>Income</Text>
                </TouchableOpacity>
              </View>

              <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 20 }}>
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

                {/* Account Selection Grid */}
                <Text style={[styles.label, { color: theme.subText }]}>Account / Wallet</Text>
                <View style={styles.gridContainer}>
                  {accounts.map((acc) => (
                    <TouchableOpacity
                      key={acc.id}
                      style={[
                        styles.gridChip, 
                        { backgroundColor: theme.inputBg, borderColor: theme.border },
                        selectedAccount === acc.id && { backgroundColor: theme.primary, borderColor: theme.primary }
                      ]}
                      onPress={() => setSelectedAccount(acc.id)}
                    >
                      <Text style={[styles.chipText, { color: theme.subText }, selectedAccount === acc.id && styles.selectedChipText]} numberOfLines={1}>
                        {acc.name}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>

                {/* Category Selection Grid */}
                <Text style={[styles.label, { color: theme.subText }]}>Category</Text>
                <View style={styles.gridContainer}>
                  {categories.map((cat) => (
                    <TouchableOpacity
                      key={cat.id}
                      style={[
                        styles.gridChip, 
                        { backgroundColor: theme.inputBg, borderColor: theme.border },
                        selectedCategory === cat.id && { backgroundColor: theme.primary, borderColor: theme.primary }
                      ]}
                      onPress={() => setSelectedCategory(cat.id)}
                    >
                      <Text style={[styles.chipText, { color: theme.subText }, selectedCategory === cat.id && styles.selectedChipText]} numberOfLines={1}>
                        {cat.name}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>

                {/* Note Input */}
                <Text style={[styles.label, { color: theme.subText }]}>Note (Optional)</Text>
                <TextInput
                  style={[styles.input, { backgroundColor: theme.inputBg, color: theme.text, borderColor: theme.border }]}
                  placeholder="Lunch with team, Grocery run"
                  placeholderTextColor={theme.subText}
                  value={note}
                  onChangeText={setNote}
                />

                {/* Action Buttons */}
                <View style={styles.buttonRow}>
                  <TouchableOpacity 
                    style={[styles.cancelButton, { backgroundColor: theme.inputBg, borderColor: theme.border }]} 
                    onPress={onClose}
                  >
                    <Text style={[styles.cancelButtonText, { color: theme.text }]}>Cancel</Text>
                  </TouchableOpacity>

                  <TouchableOpacity 
                    style={[styles.saveButton, { backgroundColor: theme.primary }]} 
                    onPress={handleSave}
                  >
                    <Text style={styles.saveButtonText}>
                      {initialData ? 'Save Copy' : 'Save Transaction'}
                    </Text>
                  </TouchableOpacity>
                </View>
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
  modalContent: { 
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
    marginBottom: 10,
  },
  modalTitle: { 
    fontSize: 17, 
    fontWeight: '700', 
  },
  closeBtn: {
    padding: 2,
  },
  typeRow: { 
    flexDirection: 'row', 
    borderRadius: 10, 
    padding: 3, 
    marginBottom: 10,
    borderWidth: 1 
  },
  typeTab: { 
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
  typeTabText: { 
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
  gridContainer: { 
    flexDirection: 'row', 
    flexWrap: 'wrap', 
    gap: 6,
    marginBottom: 4,
  },
  gridChip: { 
    paddingHorizontal: 14, 
    paddingVertical: 8, 
    borderRadius: 8, 
    borderWidth: 1,
    marginBottom: 2,
  },
  chipText: { 
    fontSize: 13 
  },
  selectedChipText: { 
    color: '#FFFFFF', 
    fontWeight: '700' 
  },
  buttonRow: { 
    flexDirection: 'row', 
    marginTop: 18, 
    gap: 10,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.05)',
    paddingTop: 14,
  },
  cancelButton: { 
    flex: 1, 
    padding: 14, 
    borderRadius: 10, 
    alignItems: 'center',
    borderWidth: 1,
  },
  cancelButtonText: { 
    fontWeight: '600',
    fontSize: 14,
  },
  saveButton: { 
    flex: 1, 
    padding: 14, 
    borderRadius: 10, 
    alignItems: 'center' 
  },
  saveButtonText: { 
    color: '#FFFFFF', 
    fontWeight: '700',
    fontSize: 14,
  }
});