import React, { useState, useEffect } from 'react';
import { StyleSheet, Text, View, TextInput, TouchableOpacity, Modal, ScrollView } from 'react-native';
import { getAllAccounts } from '../../../api/accountsRepo';
import { getCategoriesByType } from '../../../api/categoriesRepo';
import { insertTransaction } from '../../../api/transactionsRepo';

export default function AddTransactionModal({ visible, onClose, onSuccess }) {
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
      if (accts.length > 0) setSelectedAccount(accts[0].id);

      loadCategories('expense');
      setAmount('');
      setNote('');
    }
  }, [visible]);

  const loadCategories = (txType) => {
    setType(txType);
    const cats = getCategoriesByType(txType);
    setCategories(cats);
    if (cats.length > 0) setSelectedCategory(cats[0].id);
    else setSelectedCategory(null);
  };

  const handleSave = () => {
    if (!amount || isNaN(amount) || !selectedAccount || !selectedCategory) return;

    const todayIso = new Date().toISOString().split('T')[0]; // "YYYY-MM-DD"

    insertTransaction({
      accountId: selectedAccount,
      categoryId: selectedCategory,
      amount: parseFloat(amount),
      type: type,
      note: note.trim() || null,
      date: todayIso
    });

    onSuccess(); // Refresh dashboard data
    onClose();   // Close modal
  };

  return (
    <Modal visible={visible} animationType="slide" transparent={true}>
      <View style={styles.modalOverlay}>
        <View style={styles.modalContent}>
          <Text style={styles.modalTitle}>New Transaction</Text>

          {/* Type Selector Tabs */}
          <View style={styles.typeRow}>
            <TouchableOpacity 
              style={[styles.typeTab, type === 'expense' && styles.activeExpense]} 
              onPress={() => loadCategories('expense')}
            >
              <Text style={[styles.typeTabText, type === 'expense' && styles.activeText]}>Expense</Text>
            </TouchableOpacity>
            <TouchableOpacity 
              style={[styles.typeTab, type === 'income' && styles.activeIncome]} 
              onPress={() => loadCategories('income')}
            >
              <Text style={[styles.typeTabText, type === 'income' && styles.activeText]}>Income</Text>
            </TouchableOpacity>
          </View>

          {/* Amount Input */}
          <Text style={styles.label}>Amount (₱)</Text>
          <TextInput
            style={styles.input}
            placeholder="0.00"
            placeholderTextColor="#64748B"
            keyboardType="numeric"
            value={amount}
            onChangeText={setAmount}
          />

          {/* Account Selection */}
          <Text style={styles.label}>Account / Wallet</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.chipsRow}>
            {accounts.map((acc) => (
              <TouchableOpacity
                key={acc.id}
                style={[styles.chip, selectedAccount === acc.id && styles.selectedChip]}
                onPress={() => setSelectedAccount(acc.id)}
              >
                <Text style={[styles.chipText, selectedAccount === acc.id && styles.selectedChipText]}>{acc.name}</Text>
              </TouchableOpacity>
            ))}
          </ScrollView>

          {/* Category Selection */}
          <Text style={styles.label}>Category</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.chipsRow}>
            {categories.map((cat) => (
              <TouchableOpacity
                key={cat.id}
                style={[styles.chip, selectedCategory === cat.id && styles.selectedChip]}
                onPress={() => setSelectedCategory(cat.id)}
              >
                <Text style={[styles.chipText, selectedCategory === cat.id && styles.selectedChipText]}>{cat.name}</Text>
              </TouchableOpacity>
            ))}
          </ScrollView>

          {/* Note Input */}
          <Text style={styles.label}>Note (Optional)</Text>
          <TextInput
            style={styles.input}
            placeholder="e.g. Lunch with team, Grocery run"
            placeholderTextColor="#64748B"
            value={note}
            onChangeText={setNote}
          />

          {/* Action Buttons */}
          <View style={styles.buttonRow}>
            <TouchableOpacity style={styles.cancelButton} onPress={onClose}>
              <Text style={styles.cancelButtonText}>Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.saveButton} onPress={handleSave}>
              <Text style={styles.saveButtonText}>Save Transaction</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.7)', justifyContent: 'flex-end' },
  modalContent: { backgroundColor: '#1E293B', borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 24, paddingBottom: 40 },
  modalTitle: { color: '#F8FAFC', fontSize: 20, fontWeight: 'bold', marginBottom: 20, textAlign: 'center' },
  typeRow: { flexDirection: 'row', backgroundColor: '#0F172A', borderRadius: 12, padding: 4, marginBottom: 16 },
  typeTab: { flex: 1, paddingVertical: 10, alignItems: 'center', borderRadius: 10 },
  activeExpense: { backgroundColor: '#EF4444' },
  activeIncome: { backgroundColor: '#10B981' },
  typeTabText: { color: '#94A3B8', fontWeight: '600' },
  activeText: { color: '#FFFFFF' },
  label: { color: '#94A3B8', fontSize: 13, marginBottom: 6, marginTop: 12 },
  input: { backgroundColor: '#0F172A', color: '#F8FAFC', borderRadius: 12, padding: 14, fontSize: 16, borderWidth: 1, borderColor: '#334155' },
  chipsRow: { flexDirection: 'row', marginBottom: 4 },
  chip: { backgroundColor: '#0F172A', paddingHorizontal: 16, paddingVertical: 10, borderRadius: 10, marginRight: 8, borderWidth: 1, borderColor: '#334155' },
  selectedChip: { backgroundColor: '#8B5CF6', borderColor: '#8B5CF6' },
  chipText: { color: '#94A3B8', fontSize: 14 },
  selectedChipText: { color: '#FFFFFF', fontWeight: 'bold' },
  buttonRow: { flexDirection: 'row', marginTop: 24, gap: 12 },
  cancelButton: { flex: 1, padding: 16, borderRadius: 12, backgroundColor: '#334155', alignItems: 'center' },
  cancelButtonText: { color: '#F8FAFC', fontWeight: 'bold' },
  saveButton: { flex: 1, padding: 16, borderRadius: 12, backgroundColor: '#8B5CF6', alignItems: 'center' },
  saveButtonText: { color: '#FFFFFF', fontWeight: 'bold' }
});