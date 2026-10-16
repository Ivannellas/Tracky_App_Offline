import React, { useState, useEffect } from 'react';
import { StyleSheet, Text, View, TextInput, TouchableOpacity, Modal, ScrollView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { getAllAccounts } from '../../../api/accountsRepo';
import { getAllCategories } from '../../../api/categoriesRepo';
import { updateTransaction } from '../../../api/transactionsRepo';

export default function EditTransactionModal({ visible, transaction, onClose, onSuccess }) {
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
        <View style={styles.modalContainer}>
          <View style={styles.headerRow}>
            <Text style={styles.modalTitle}>Edit Transaction</Text>
            <TouchableOpacity onPress={onClose}>
              <Ionicons name="close" size={24} color="#94A3B8" />
            </TouchableOpacity>
          </View>

          <ScrollView showsVerticalScrollIndicator={false}>
            {/* Type Selector (Income / Expense) */}
            <View style={styles.typeSelector}>
              <TouchableOpacity 
                style={[styles.typeBtn, type === 'expense' && styles.activeExpense]} 
                onPress={() => setType('expense')}
              >
                <Text style={[styles.typeText, type === 'expense' && styles.activeText]}>Expense</Text>
              </TouchableOpacity>
              <TouchableOpacity 
                style={[styles.typeBtn, type === 'income' && styles.activeIncome]} 
                onPress={() => setType('income')}
              >
                <Text style={[styles.typeText, type === 'income' && styles.activeText]}>Income</Text>
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

            {/* Account Selector */}
            <Text style={styles.label}>Wallet / Account</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.selectorRow}>
              {accounts.map((acc) => (
                <TouchableOpacity
                  key={acc.id}
                  style={[styles.chip, accountId === acc.id && styles.activeChip]}
                  onPress={() => setAccountId(acc.id)}
                >
                  <Text style={[styles.chipText, accountId === acc.id && styles.activeChipText]}>{acc.name}</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>

            {/* Category Selector */}
            <Text style={styles.label}>Category</Text>
            <View style={styles.gridRow}>
              {categories.filter(c => c.type === type).map((cat) => (
                <TouchableOpacity
                  key={cat.id}
                  style={[styles.catChip, categoryId === cat.id && styles.activeCatChip]}
                  onPress={() => setCategoryId(cat.id)}
                >
                  <Text style={[styles.catChipText, categoryId === cat.id && styles.activeCatChipText]}>{cat.name}</Text>
                </TouchableOpacity>
              ))}
            </View>

            {/* Note Input */}
            <Text style={styles.label}>Note (Optional)</Text>
            <TextInput
              style={styles.input}
              placeholder="e.g. Grocery run, lunch"
              placeholderTextColor="#64748B"
              value={note}
              onChangeText={setNote}
            />

            {/* Save Button */}
            <TouchableOpacity style={styles.saveBtn} onPress={handleUpdate}>
              <Text style={styles.saveBtnText}>Update Transaction</Text>
            </TouchableOpacity>
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.7)', justifyContent: 'flex-end' },
  modalContainer: { backgroundColor: '#1E293B', borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 20, maxHeight: '85%' },
  headerRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 },
  modalTitle: { color: '#F8FAFC', fontSize: 18, fontWeight: 'bold' },
  typeSelector: { flexDirection: 'row', backgroundColor: '#0F172A', borderRadius: 10, padding: 4, marginBottom: 16 },
  typeBtn: { flex: 1, paddingVertical: 10, alignItems: 'center', borderRadius: 8 },
  activeExpense: { backgroundColor: '#EF4444' },
  activeIncome: { backgroundColor: '#10B981' },
  typeText: { color: '#94A3B8', fontWeight: '600' },
  activeText: { color: '#FFFFFF' },
  label: { color: '#94A3B8', fontSize: 13, marginBottom: 6, marginTop: 12 },
  input: { backgroundColor: '#0F172A', color: '#F8FAFC', padding: 12, borderRadius: 10, fontSize: 16, borderWidth: 1, borderColor: '#334155' },
  selectorRow: { flexDirection: 'row', marginBottom: 4 },
  chip: { backgroundColor: '#0F172A', paddingHorizontal: 14, paddingVertical: 8, borderRadius: 8, marginRight: 8, borderWidth: 1, borderColor: '#334155' },
  activeChip: { backgroundColor: '#8B5CF6', borderColor: '#8B5CF6' },
  chipText: { color: '#94A3B8', fontSize: 13 },
  activeChipText: { color: '#FFFFFF', fontWeight: 'bold' },
  gridRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  catChip: { backgroundColor: '#0F172A', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 8, borderWidth: 1, borderColor: '#334155', marginBottom: 6 },
  activeCatChip: { backgroundColor: '#8B5CF6', borderColor: '#8B5CF6' },
  catChipText: { color: '#94A3B8', fontSize: 12 },
  activeCatChipText: { color: '#FFFFFF', fontWeight: 'bold' },
  saveBtn: { backgroundColor: '#8B5CF6', padding: 16, borderRadius: 12, alignItems: 'center', marginTop: 24, marginBottom: 20 },
  saveBtnText: { color: '#FFFFFF', fontSize: 16, fontWeight: 'bold' },
});