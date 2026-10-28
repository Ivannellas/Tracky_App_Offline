import React, { useState, useEffect, useContext } from 'react';
import { StyleSheet, Text, View, ScrollView, TouchableOpacity, TextInput, Modal, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { getAllRecurringBills, insertRecurringBill, deleteRecurringBill, payRecurringBill } from '../../../api/recurringBillsRepo';
import { getAllAccounts } from '../../../api/accountsRepo';
import { getAllCategories } from '../../../api/categoriesRepo';
import { ThemeContext } from '../../../context/ThemeContext';

export default function RecurringBillsScreen() {
  const { theme } = useContext(ThemeContext);

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
          <Ionicons name="add" size={18} color="#FFFFFF" />
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.listContainer} showsVerticalScrollIndicator={false}>
        {bills.length === 0 ? (
          <View style={[styles.emptyCard, { backgroundColor: theme.cardBg, borderColor: theme.border }]}>
            <Ionicons name="repeat-outline" size={32} color={theme.subText} style={{ marginBottom: 6 }} />
            <Text style={[styles.emptyText, { color: theme.subText }]}>No recurring bills tracked yet.</Text>
          </View>
        ) : (
          bills.map((bill) => (
            <View key={bill.id} style={[styles.billCard, { backgroundColor: theme.cardBg, borderColor: theme.border }]}>
              <View style={styles.billInfo}>
                <Text style={[styles.billName, { color: theme.text }]} numberOfLines={1}>{bill.name}</Text>
                <Text style={[styles.billDue, { color: theme.subText }]}>Due every {bill.due_day}th of the month</Text>
                <Text style={styles.billAmount}>₱{bill.amount.toLocaleString('en-US', { minimumFractionDigits: 2 })}</Text>
              </View>

              <View style={styles.actionRow}>
                <TouchableOpacity style={styles.payBtn} onPress={() => handlePay(bill)}>
                  <Text style={styles.payBtnText}>Pay</Text>
                </TouchableOpacity>
                <TouchableOpacity onPress={() => handleDelete(bill.id)} style={styles.deleteIconBtn}>
                  <Ionicons name="trash-outline" size={16} color="#EF4444" />
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
            <View style={styles.modalHeaderRow}>
              <Text style={[styles.modalTitle, { color: theme.text }]}>Add Recurring Bill</Text>
              <TouchableOpacity onPress={() => setModalVisible(false)}>
                <Ionicons name="close" size={20} color={theme.subText} />
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
                keyboardCategory="numeric" 
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
  container: { flex: 1, padding: 14, paddingTop: 45 },
  headerRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 },
  modalHeaderRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  title: { fontSize: 20, fontWeight: '700' },
  addBtn: { width: 34, height: 34, borderRadius: 17, justifyContent: 'center', alignItems: 'center' },
  listContainer: { paddingBottom: 110 },
  billCard: { padding: 12, borderRadius: 10, marginBottom: 8, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', borderWidth: 1 },
  billInfo: { flex: 1 },
  billName: { fontSize: 13, fontWeight: '600' },
  billDue: { fontSize: 10, marginTop: 1, marginBottom: 4 },
  billAmount: { color: '#EF4444', fontSize: 14, fontWeight: '700' },
  actionRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  payBtn: { backgroundColor: '#10B981', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 6 },
  payBtnText: { color: '#FFFFFF', fontWeight: '700', fontSize: 12 },
  deleteIconBtn: { padding: 4 },
  emptyCard: { padding: 20, borderRadius: 10, alignItems: 'center', borderWidth: 1, marginTop: 10 },
  emptyText: { fontSize: 12 },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.7)', justifyContent: 'flex-end' },
  modalContainer: { borderTopLeftRadius: 16, borderTopRightRadius: 16, padding: 16, maxHeight: '85%', borderWidth: 1, borderBottomWidth: 0 },
  modalTitle: { fontSize: 16, fontWeight: '700' },
  label: { fontSize: 11, marginBottom: 4, marginTop: 10, fontWeight: '600' },
  input: { padding: 10, borderRadius: 8, fontSize: 13, borderWidth: 1 },
  chipRow: { flexDirection: 'row', marginBottom: 2 },
  chip: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 6, marginRight: 6, borderWidth: 1 },
  chipText: { fontSize: 12 },
  activeChipText: { color: '#FFFFFF', fontWeight: '700' },
  gridRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  catChip: { paddingHorizontal: 10, paddingVertical: 5, borderRadius: 6, borderWidth: 1, marginBottom: 4 },
  catChipText: { fontSize: 11 },
  activeCatChipText: { color: '#FFFFFF', fontWeight: '700' },
  saveBtn: { padding: 12, borderRadius: 8, alignItems: 'center', marginTop: 18, marginBottom: 20 },
  saveBtnText: { color: '#FFFFFF', fontSize: 13, fontWeight: '700' },
});