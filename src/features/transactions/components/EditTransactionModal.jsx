import React, { useState, useEffect, useContext } from 'react';
import { StyleSheet, Text, View, TextInput, TouchableOpacity, Modal, ScrollView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { getAllAccounts } from '../../../api/accountsRepo';
import { getAllCategories } from '../../../api/categoriesRepo';
import { updateTransaction } from '../../../api/transactionsRepo';
import { ThemeContext } from '../../../context/ThemeContext'; // <-- Import Theme Context

export default function EditTransactionModal({ visible, transaction, onClose, onSuccess }) {
  const { theme } = useContext(ThemeContext); // <-- Access dynamic theme values

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
      <View style={styles.modalOverlay}>
        <View style={[styles.modalContainer, { backgroundColor: theme.cardBg }]}>
          
          <View style={styles.headerRow}>
            <Text style={[styles.modalTitle, { color: theme.text }]}>Edit Transaction</Text>
            <TouchableOpacity onPress={onClose}>
              <Ionicons name="close" size={24} color={theme.subText} />
            </TouchableOpacity>
          </View>

          <ScrollView showsVerticalScrollIndicator={false}>
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
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  modalOverlay: { 
    flex: 1, 
    backgroundColor: 'rgba(0,0,0,0.5)', 
    justifyContent: 'flex-end' 
  },
  modalContainer: { 
    borderTopLeftRadius: 24, 
    borderTopRightRadius: 24, 
    padding: 20, 
    maxHeight: '85%' 
  },
  headerRow: { 
    flexDirection: 'row', 
    justifyContent: 'space-between', 
    alignItems: 'center', 
    marginBottom: 16 
  },
  modalTitle: { 
    fontSize: 18, 
    fontWeight: 'bold' 
  },
  typeSelector: { 
    flexDirection: 'row', 
    borderRadius: 10, 
    padding: 4, 
    marginBottom: 16, 
    borderWidth: 1 
  },
  typeBtn: { 
    flex: 1, 
    paddingVertical: 10, 
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
    fontWeight: '600' 
  },
  activeText: { 
    color: '#FFFFFF' 
  },
  label: { 
    fontSize: 13, 
    marginBottom: 6, 
    marginTop: 12 
  },
  input: { 
    padding: 12, 
    borderRadius: 10, 
    fontSize: 16, 
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
    fontWeight: 'bold' 
  },
  chipText: { 
    fontSize: 13 
  },
  gridRow: { 
    flexDirection: 'row', 
    flexWrap: 'wrap', 
    gap: 8 
  },
  catChip: { 
    paddingHorizontal: 12, 
    paddingVertical: 6, 
    borderRadius: 8, 
    borderWidth: 1, 
    marginBottom: 6 
  },
  activeCatChipText: { 
    color: '#FFFFFF', 
    fontWeight: 'bold' 
  },
  catChipText: { 
    fontSize: 12 
  },
  saveBtn: { 
    padding: 16, 
    borderRadius: 12, 
    alignItems: 'center', 
    marginTop: 24, 
    marginBottom: 20 
  },
  saveBtnText: { 
    color: '#FFFFFF', 
    fontSize: 16, 
    fontWeight: 'bold' 
  },
});