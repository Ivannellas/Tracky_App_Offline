import React, { useState, useEffect, useContext } from 'react';
import { StyleSheet, Text, View, TextInput, TouchableOpacity, Modal, ScrollView } from 'react-native';
import { getAllAccounts } from '../../../api/accountsRepo';
import { getCategoriesByType } from '../../../api/categoriesRepo';
import { insertTransaction } from '../../../api/transactionsRepo';
import { ThemeContext } from '../../../context/ThemeContext'; // <-- Import Theme Context

export default function AddTransactionModal({ visible, initialData, onClose, onSuccess }) {
  const { theme } = useContext(ThemeContext); // <-- Access dynamic theme values

  const [type, setType] = useState('expense'); // 'expense' or 'income'
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
        // Pre-fill from duplicated transaction data
        const txType = initialData.type || 'expense';
        setType(txType);
        setAmount(initialData.amount ? initialData.amount.toString() : '');
        setNote(initialData.note || '');

        // Select matching account or fallback to first
        setSelectedAccount(initialData.account_id || (accts.length > 0 ? accts[0].id : null));

        // Load categories for the transaction type and pre-select
        const cats = getCategoriesByType(txType);
        setCategories(cats);
        setSelectedCategory(initialData.category_id || (cats.length > 0 ? cats[0].id : null));
      } else {
        // Reset to default blank values for a new transaction
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

    onSuccess(); // Refresh dashboard data
    onClose();   // Close modal
  };

  return (
    <Modal visible={visible} animationType="slide" transparent={true}>
      <View style={styles.modalOverlay}>
        <View style={[styles.modalContent, { backgroundColor: theme.cardBg }]}>
          
          <Text style={[styles.modalTitle, { color: theme.text }]}>
            {initialData ? 'Duplicate Transaction' : 'New Transaction'}
          </Text>

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

          {/* Account Selection */}
          <Text style={[styles.label, { color: theme.subText }]}>Account / Wallet</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.chipsRow}>
            {accounts.map((acc) => (
              <TouchableOpacity
                key={acc.id}
                style={[
                  styles.chip, 
                  { backgroundColor: theme.inputBg, borderColor: theme.border },
                  selectedAccount === acc.id && { backgroundColor: theme.primary, borderColor: theme.primary }
                ]}
                onPress={() => setSelectedAccount(acc.id)}
              >
                <Text style={[styles.chipText, { color: theme.subText }, selectedAccount === acc.id && styles.selectedChipText]}>
                  {acc.name}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>

          {/* Category Selection */}
          <Text style={[styles.label, { color: theme.subText }]}>Category</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.chipsRow}>
            {categories.map((cat) => (
              <TouchableOpacity
                key={cat.id}
                style={[
                  styles.chip, 
                  { backgroundColor: theme.inputBg, borderColor: theme.border },
                  selectedCategory === cat.id && { backgroundColor: theme.primary, borderColor: theme.primary }
                ]}
                onPress={() => setSelectedCategory(cat.id)}
              >
                <Text style={[styles.chipText, { color: theme.subText }, selectedCategory === cat.id && styles.selectedChipText]}>
                  {cat.name}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>

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
              style={[styles.cancelButton, { backgroundColor: theme.border }]} 
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
  modalContent: { 
    borderTopLeftRadius: 24, 
    borderTopRightRadius: 24, 
    padding: 24, 
    paddingBottom: 40 
  },
  modalTitle: { 
    fontSize: 20, 
    fontWeight: 'bold', 
    marginBottom: 20, 
    textAlign: 'center' 
  },
  typeRow: { 
    flexDirection: 'row', 
    borderRadius: 12, 
    padding: 4, 
    marginBottom: 16,
    borderWidth: 1 
  },
  typeTab: { 
    flex: 1, 
    paddingVertical: 10, 
    alignItems: 'center', 
    borderRadius: 10 
  },
  activeExpense: { 
    backgroundColor: '#EF4444' 
  },
  activeIncome: { 
    backgroundColor: '#10B981' 
  },
  typeTabText: { 
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
    borderRadius: 12, 
    padding: 14, 
    fontSize: 16, 
    borderWidth: 1 
  },
  chipsRow: { 
    flexDirection: 'row', 
    marginBottom: 4 
  },
  chip: { 
    paddingHorizontal: 16, 
    paddingVertical: 10, 
    borderRadius: 10, 
    marginRight: 8, 
    borderWidth: 1 
  },
  chipText: { 
    fontSize: 14 
  },
  selectedChipText: { 
    color: '#FFFFFF', 
    fontWeight: 'bold' 
  },
  buttonRow: { 
    flexDirection: 'row', 
    marginTop: 24, 
    gap: 12 
  },
  cancelButton: { 
    flex: 1, 
    padding: 16, 
    borderRadius: 12, 
    alignItems: 'center' 
  },
  cancelButtonText: { 
    fontWeight: 'bold' 
  },
  saveButton: { 
    flex: 1, 
    padding: 16, 
    borderRadius: 12, 
    alignItems: 'center' 
  },
  saveButtonText: { 
    color: '#FFFFFF', 
    fontWeight: 'bold' 
  }
});