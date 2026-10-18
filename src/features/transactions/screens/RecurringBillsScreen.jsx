import React, { useState, useEffect, useContext } from 'react';
import { StyleSheet, Text, View, ScrollView, TouchableOpacity, TextInput, Modal, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { getAllRecurringBills, insertRecurringBill, deleteRecurringBill, payRecurringBill } from '../../../api/recurringBillsRepo';
import { getAllAccounts } from '../../../api/accountsRepo';
import { getAllCategories } from '../../../api/categoriesRepo';
import { ThemeContext } from '../../../context/ThemeContext'; // <-- Import Theme Context

export default function RecurringBillsScreen() {
  const { theme } = useContext(ThemeContext); // <-- Access dynamic theme values

  const [bills, setBills] = useState([]);
  const [accounts, setAccounts] = useState([]);
  const [categories, setCategories] = useState([]);
  
  const [modalVisible, setModalVisible] = useState(false);
  const [name, setName] = useState('');
  const [amount, setAmount] = useState('');
  const [dueDay, setDueDay] = useState('');
  const [accountId, setAccountId] = useState(null);
  const [categoryId, setCategoryId] = useState(null);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = () => {
    setBills(getAllRecurringBills());
    setAccounts(getAllAccounts());
    setCategories(getAllCategories());
  };

  const handleSave = () => {
    if (!name || !amount || !dueDay || !accountId || !categoryId) return;

    insertRecurringBill({
      name,
      amount,
      category_id: categoryId,
      account_id: accountId,
      due_day: dueDay,
    });

    setName('');
    setAmount('');
    setDueDay('');
    setModalVisible(false);
    loadData();
  };

  const handlePay = (bill) => {
    Alert.alert(
      'Pay Bill',
      `Log payment of ₱${bill.amount} for "${bill.name}"? This will deduct from your wallet balance and record an expense.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Confirm Pay',
          onPress: () => {
            payRecurringBill(bill);
            Alert.alert('Success', `Successfully paid ${bill.name}!`);
            loadData();
          },
        },
      ]
    );
  };

  const handleDelete = (id) => {
    Alert.alert('Delete Bill', 'Are you sure you want to remove this recurring bill?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: () => {
          deleteRecurringBill(id);
          loadData();
        },
      },
    ]);
  };

  return (
    <View style={[styles.container, { backgroundColor: theme.bg }]}>
      <View style={styles.headerRow}>
        <Text style={[styles.title, { color: theme.text }]}>Recurring Bills & Subscriptions</Text>
        <TouchableOpacity onPress={() => setModalVisible(true)} style={[styles.addBtn, { backgroundColor: theme.primary }]}>
          <Ionicons name="add" size={20} color="#FFFFFF" />
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.listContainer}>
        {bills.length === 0 ? (
          <View style={[styles.emptyCard, { backgroundColor: theme.cardBg, borderColor: theme.border }]}>
            <Text style={[styles.emptyText, { color: theme.subText }]}>No recurring bills tracked yet.</Text>
          </View>
        ) : (
          bills.map((bill) => (
            <View key={bill.id} style={[styles.billCard, { backgroundColor: theme.cardBg, borderColor: theme.border }]}>
              <View style={styles.billInfo}>
                <Text style={[styles.billName, { color: theme.text }]}>{bill.name}</Text>
                <Text style={[styles.billDue, { color: theme.subText }]}>Due every {bill.due_day}th of the month</Text>
                <Text style={styles.billAmount}>₱{bill.amount.toLocaleString('en-US', { minimumFractionDigits: 2 })}</Text>
              </View>

              <View style={styles.actionRow}>
                <TouchableOpacity style={styles.payBtn} onPress={() => handlePay(bill)}>
                  <Text style={styles.payBtnText}>Pay</Text>
                </TouchableOpacity>
                <TouchableOpacity onPress={() => handleDelete(bill.id)} style={styles.deleteIconBtn}>
                  <Ionicons name="trash-outline" size={18} color="#EF4444" />
                </TouchableOpacity>
              </View>
            </View>
          ))
        )}
      </ScrollView>

      {/* Add Recurring Bill Modal */}
      <Modal visible={modalVisible} animationType="slide" transparent={true}>
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContainer, { backgroundColor: theme.cardBg }]}>
            <View style={styles.headerRow}>
              <Text style={[styles.modalTitle, { color: theme.text }]}>Add Recurring Bill</Text>
              <TouchableOpacity onPress={() => setModalVisible(false)}>
                <Ionicons name="close" size={24} color={theme.subText} />
              </TouchableOpacity>
            </View>

            <ScrollView showsVerticalScrollIndicator={false}>
              <Text style={[styles.label, { color: theme.subText }]}>Bill Name (Netflix, Rent)</Text>
              <TextInput 
                style={[styles.input, { backgroundColor: theme.inputBg, color: theme.text, borderColor: theme.border }]} 
                placeholder="Netflix" 
                placeholderTextColor={theme.subText} 
                value={name} 
                onChangeText={setName} 
              />

              <Text style={[styles.label, { color: theme.subText }]}>Amount (₱)</Text>
              <TextInput 
                style={[styles.input, { backgroundColor: theme.inputBg, color: theme.text, borderColor: theme.border }]} 
                placeholder="0.00" 
                placeholderTextColor={theme.subText} 
                keyboardType="numeric" 
                value={amount} 
                onChangeText={setAmount} 
              />

              <Text style={[styles.label, { color: theme.subText }]}>Due Day of Month (1-31)</Text>
              <TextInput 
                style={[styles.input, { backgroundColor: theme.inputBg, color: theme.text, borderColor: theme.border }]} 
                placeholder="15" 
                placeholderTextColor={theme.subText} 
                keyboardType="numeric" 
                value={dueDay} 
                onChangeText={setDueDay} 
              />

              <Text style={[styles.label, { color: theme.subText }]}>Paid From Wallet</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.chipRow}>
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
                    <Text style={[styles.chipText, { color: theme.subText }, accountId === acc.id && styles.activeChipText]}>{acc.name}</Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>

              <Text style={[styles.label, { color: theme.subText }]}>Category</Text>
              <View style={styles.gridRow}>
                {categories.map((cat) => (
                  <TouchableOpacity 
                    key={cat.id} 
                    style={[
                      styles.catChip, 
                      { backgroundColor: theme.inputBg, borderColor: theme.border },
                      categoryId === cat.id && { backgroundColor: theme.primary, borderColor: theme.primary }
                    ]} 
                    onPress={() => setCategoryId(cat.id)}
                  >
                    <Text style={[styles.catChipText, { color: theme.subText }, categoryId === cat.id && styles.activeCatChipText]}>{cat.name}</Text>
                  </TouchableOpacity>
                ))}
              </View>

              <TouchableOpacity style={[styles.saveBtn, { backgroundColor: theme.primary }]} onPress={handleSave}>
                <Text style={styles.saveBtnText}>Save Recurring Bill</Text>
              </TouchableOpacity>
            </ScrollView>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 20, paddingTop: 50 },
  headerRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
  title: { fontSize: 20, fontWeight: 'bold' },
  addBtn: { width: 36, height: 36, borderRadius: 18, justifyContent: 'center', alignItems: 'center' },
  listContainer: { paddingBottom: 40 },
  billCard: { padding: 16, borderRadius: 12, marginBottom: 12, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', borderWidth: 1 },
  billInfo: { flex: 1 },
  billName: { fontSize: 16, fontWeight: '600' },
  billDue: { fontSize: 12, marginTop: 2, marginBottom: 6 },
  billAmount: { color: '#EF4444', fontSize: 15, fontWeight: 'bold' },
  actionRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  payBtn: { backgroundColor: '#10B981', paddingHorizontal: 14, paddingVertical: 8, borderRadius: 8 },
  payBtnText: { color: '#FFFFFF', fontWeight: 'bold', fontSize: 13 },
  deleteIconBtn: { padding: 6 },
  emptyCard: { padding: 24, borderRadius: 12, alignItems: 'center', borderWidth: 1 },
  emptyText: {},
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.7)', justifyContent: 'flex-end' },
  modalContainer: { borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 20, maxHeight: '85%' },
  modalTitle: { fontSize: 18, fontWeight: 'bold' },
  label: { fontSize: 13, marginBottom: 6, marginTop: 12 },
  input: { padding: 12, borderRadius: 10, fontSize: 16, borderWidth: 1 },
  chipRow: { flexDirection: 'row', marginBottom: 4 },
  chip: { paddingHorizontal: 14, paddingVertical: 8, borderRadius: 8, marginRight: 8, borderWidth: 1 },
  chipText: { fontSize: 13 },
  activeChipText: { color: '#FFFFFF', fontWeight: 'bold' },
  gridRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  catChip: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 8, borderWidth: 1, marginBottom: 6 },
  catChipText: { fontSize: 12 },
  activeCatChipText: { color: '#FFFFFF', fontWeight: 'bold' },
  saveBtn: { padding: 16, borderRadius: 12, alignItems: 'center', marginTop: 24, marginBottom: 20 },
  saveBtnText: { color: '#FFFFFF', fontSize: 16, fontWeight: 'bold' },
});