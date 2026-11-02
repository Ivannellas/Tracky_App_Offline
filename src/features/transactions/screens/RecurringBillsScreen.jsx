import React, { useState, useEffect, useContext } from 'react';
import { StyleSheet, Text, View, ScrollView, TouchableOpacity, TextInput, Modal, KeyboardAvoidingView, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { getAllRecurringBills, insertRecurringBill, deleteRecurringBill, payRecurringBill } from '../../../api/recurringBillsRepo';
import { getAllAccounts } from '../../../api/accountsRepo';
import { getAllCategories } from '../../../api/categoriesRepo';
import { ThemeContext } from '../../../context/ThemeContext';

const POPULAR_BILLS = [
  { name: 'Netflix', amount: '549', dueDay: '15', icon: 'tv-outline' },
  { name: 'Spotify', amount: '149', dueDay: '20', icon: 'musical-notes-outline' },
  { name: 'Internet / Wi-Fi', amount: '1500', dueDay: '28', icon: 'wifi-outline' },
  { name: 'Electricity (Meralco)', amount: '2500', dueDay: '10', icon: 'flash-outline' },
  { name: 'Rent', amount: '8000', dueDay: '1', icon: 'home-outline' },
];

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

  // Custom Confirmation Modal State
  const [confirmModal, setConfirmModal] = useState({
    visible: false,
    title: '',
    message: '',
    confirmText: '',
    isDanger: false,
    onConfirm: () => {},
  });

  const hideConfirmModal = () => {
    setConfirmModal(prev => ({ ...prev, visible: false }));
  };

  useEffect(() => {
    loadData();
  }, []);

  const loadData = () => {
    const accts = getAllAccounts();
    const cats = getAllCategories();
    setBills(getAllRecurringBills());
    setAccounts(accts);
    setCategories(cats);

    if (accts.length > 0 && !accountId) setAccountId(accts[0].id);
    const expenseCats = cats.filter(c => c.type === 'expense');
    if (expenseCats.length > 0 && !categoryId) setCategoryId(expenseCats[0].id);
  };

  const handleApplyPreset = (preset) => {
    setName(preset.name);
    setAmount(preset.amount);
    setDueDay(preset.dueDay);
  };

  const handleSave = () => {
    if (!name.trim() || !amount || !dueDay || !accountId || !categoryId) return;

    insertRecurringBill({
      name: name.trim(),
      amount: parseFloat(amount),
      category_id: categoryId,
      account_id: accountId,
      due_day: parseInt(dueDay, 10),
    });

    setName('');
    setAmount('');
    setDueDay('');
    setModalVisible(false);
    loadData();
  };

  const handlePay = (bill) => {
    setConfirmModal({
      visible: true,
      title: 'Pay Bill',
      message: `Log payment of ₱${Number(bill.amount).toLocaleString('en-US', { minimumFractionDigits: 2 })} for "${bill.name}"? This will deduct from your wallet balance and record an expense.`,
      confirmText: 'Confirm Pay',
      isDanger: false,
      onConfirm: () => {
        hideConfirmModal();
        payRecurringBill(bill);
        loadData();
      },
    });
  };

  const handleDelete = (id) => {
    setConfirmModal({
      visible: true,
      title: 'Delete Bill',
      message: 'Are you sure you want to remove this recurring bill from your tracking list?',
      confirmText: 'Delete',
      isDanger: true,
      onConfirm: () => {
        hideConfirmModal();
        deleteRecurringBill(id);
        loadData();
      },
    });
  };

  return (
    <View style={[styles.container, { backgroundColor: theme.bg }]}>
      <View style={styles.headerRow}>
        <View>
          <Text style={[styles.title, { color: theme.text }]}>Recurring Bills</Text>
          <Text style={[styles.subtitle, { color: theme.subText }]}>Automate your regular subscriptions</Text>
        </View>
        <TouchableOpacity onPress={() => setModalVisible(true)} style={[styles.addBtn, { backgroundColor: theme.primary }]} activeOpacity={0.85}>
          <Ionicons name="add" size={20} color="#FFFFFF" />
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.listContainer} showsVerticalScrollIndicator={false}>
        {bills.length === 0 ? (
          <View style={[styles.emptyCard, { backgroundColor: theme.cardBg, borderColor: theme.border }]}>
            <Ionicons name="repeat-outline" size={36} color={theme.subText} style={{ marginBottom: 8 }} />
            <Text style={[styles.emptyText, { color: theme.text, fontWeight: '600' }]}>No recurring bills tracked yet</Text>
            <Text style={[styles.emptySubtext, { color: theme.subText }]}>Tap the plus icon above to track subscriptions like Netflix or Rent.</Text>
          </View>
        ) : (
          bills.map((bill) => (
            <View key={bill.id} style={[styles.billCard, { backgroundColor: theme.cardBg, borderColor: theme.border }]}>
              <View style={styles.billInfo}>
                <Text style={[styles.billName, { color: theme.text }]} numberOfLines={1}>{bill.name}</Text>
                <Text style={[styles.billDue, { color: theme.subText }]}>Due every {bill.due_day}th of the month</Text>
                <Text style={styles.billAmount}>₱{Number(bill.amount).toLocaleString('en-US', { minimumFractionDigits: 2 })}</Text>
              </View>

              <View style={styles.actionRow}>
                <TouchableOpacity style={[styles.payBtn, { backgroundColor: '#10B981' }]} onPress={() => handlePay(bill)} activeOpacity={0.8}>
                  <Text style={styles.payBtnText}>Pay</Text>
                </TouchableOpacity>
                <TouchableOpacity onPress={() => handleDelete(bill.id)} style={styles.deleteIconBtn} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
                  <Ionicons name="trash-outline" size={16} color="#EF4444" />
                </TouchableOpacity>
              </View>
            </View>
          ))
        )}
      </ScrollView>

      {/* Add Recurring Bill Modal */}
      <Modal visible={modalVisible} animationType="slide" transparent={true} onRequestClose={() => setModalVisible(false)}>
        <View style={styles.modalOverlay}>
          <KeyboardAvoidingView 
            behavior={Platform.OS === 'ios' ? 'padding' : undefined}
            style={styles.keyboardView}
          >
            <View style={[styles.modalContainer, { backgroundColor: theme.cardBg, borderColor: theme.border }]}>
              
              <View style={styles.modalHeaderRow}>
                <View style={styles.titleContainer}>
                  <View style={[styles.titleIndicator, { backgroundColor: theme.primary }]} />
                  <Text style={[styles.modalTitle, { color: theme.text }]}>New Recurring Bill</Text>
                </View>
                <TouchableOpacity onPress={() => setModalVisible(false)} style={[styles.closeBtn, { backgroundColor: theme.inputBg }]} activeOpacity={0.8}>
                  <Ionicons name="close" size={18} color={theme.text} />
                </TouchableOpacity>
              </View>

              <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent} keyboardShouldPersistTaps="handled">
                
                {/* Hero Amount Input Section */}
                <View style={[styles.heroAmountCard, { backgroundColor: theme.inputBg, borderColor: amount ? theme.primary : theme.border }]}>
                  <Text style={[styles.currencySymbol, { color: theme.primary }]}>₱</Text>
                  <TextInput
                    style={[styles.heroInput, { color: theme.text }]}
                    placeholder="0.00"
                    placeholderTextColor={theme.subText}
                    keyboardType="numeric"
                    value={amount}
                    onChangeText={setAmount}
                  />
                </View>

                {/* Bill Name Input */}
                <Text style={[styles.label, { color: theme.subText }]}>Bill Name</Text>
                <TextInput 
                  style={[styles.input, { backgroundColor: theme.inputBg, color: theme.text, borderColor: theme.border }]} 
                  placeholder="e.g. Netflix, Rent, Internet..." 
                  placeholderTextColor={theme.subText} 
                  value={name} 
                  onChangeText={setName} 
                />

                {/* Popular Preset Chips */}
                <View style={styles.presetsRow}>
                  {POPULAR_BILLS.map((preset) => (
                    <TouchableOpacity
                      key={preset.name}
                      style={[styles.presetChip, { backgroundColor: theme.inputBg, borderColor: theme.border }]}
                      onPress={() => handleApplyPreset(preset)}
                      activeOpacity={0.7}
                    >
                      <Ionicons name={preset.icon} size={12} color={theme.primary} style={{ marginRight: 4 }} />
                      <Text style={[styles.presetText, { color: theme.subText }]}>{preset.name}</Text>
                    </TouchableOpacity>
                  ))}
                </View>

                {/* Due Day Input */}
                <Text style={[styles.label, { color: theme.subText }]}>Due Day of Month (1 - 31)</Text>
                <TextInput 
                  style={[styles.input, { backgroundColor: theme.inputBg, color: theme.text, borderColor: theme.border }]} 
                  placeholder="e.g. 15" 
                  placeholderTextColor={theme.subText} 
                  keyboardType="numeric" 
                  value={dueDay} 
                  onChangeText={setDueDay} 
                />

                {/* Wallet Selector */}
                <Text style={[styles.label, { color: theme.subText }]}>Paid From Wallet</Text>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.chipRow} keyboardShouldPersistTaps="handled">
                  {accounts.map((acc) => {
                    const isSelected = accountId === acc.id;
                    return (
                      <TouchableOpacity 
                        key={acc.id} 
                        style={[
                          styles.chip, 
                          { backgroundColor: theme.inputBg, borderColor: theme.border },
                          isSelected && { backgroundColor: theme.primary, borderColor: theme.primary }
                        ]} 
                        onPress={() => setAccountId(acc.id)}
                        activeOpacity={0.8}
                      >
                        <Ionicons name={acc.icon || 'wallet-outline'} size={13} color={isSelected ? '#FFFFFF' : theme.subText} style={{ marginRight: 4 }} />
                        <Text style={[styles.chipText, { color: theme.subText }, isSelected && styles.activeChipText]}>{acc.name}</Text>
                      </TouchableOpacity>
                    );
                  })}
                </ScrollView>

                {/* Category Selector */}
                <Text style={[styles.label, { color: theme.subText }]}>Category</Text>
                <View style={styles.gridRow}>
                  {categories.filter(c => c.type === 'expense').map((cat) => {
                    const isSelected = categoryId === cat.id;
                    return (
                      <TouchableOpacity 
                        key={cat.id} 
                        style={[
                          styles.catChip, 
                          { backgroundColor: theme.inputBg, borderColor: theme.border },
                          isSelected && { backgroundColor: theme.primary, borderColor: theme.primary }
                        ]} 
                        onPress={() => setCategoryId(cat.id)}
                        activeOpacity={0.8}
                      >
                        {cat.icon && (
                          <Ionicons name={cat.icon} size={13} color={isSelected ? '#FFFFFF' : (cat.color || theme.subText)} style={{ marginRight: 4 }} />
                        )}
                        <Text style={[styles.catChipText, { color: theme.subText }, isSelected && styles.activeCatChipText]}>{cat.name}</Text>
                      </TouchableOpacity>
                    );
                  })}
                </View>

                {/* Action Button */}
                <TouchableOpacity 
                  style={[styles.saveBtn, { backgroundColor: theme.primary }]} 
                  onPress={handleSave}
                  activeOpacity={0.85}
                >
                  <Ionicons name="checkmark-circle-outline" size={16} color="#FFFFFF" style={{ marginRight: 6 }} />
                  <Text style={styles.saveBtnText}>Save Recurring Bill</Text>
                </TouchableOpacity>
              </ScrollView>

            </View>
          </KeyboardAvoidingView>
        </View>
      </Modal>

      {/* --- CUSTOM STYLIZED CONFIRMATION MODAL --- */}
      <Modal
        visible={confirmModal.visible}
        transparent={true}
        animationType="fade"
        onRequestClose={hideConfirmModal}
      >
        <View style={styles.alertOverlay}>
          <View style={[styles.alertContent, { backgroundColor: theme.cardBg, borderColor: theme.border }]}>
            <View style={[styles.alertIconBadge, { backgroundColor: confirmModal.isDanger ? 'rgba(239, 68, 68, 0.15)' : 'rgba(16, 185, 129, 0.15)' }]}>
              <Ionicons 
                name={confirmModal.isDanger ? 'alert-circle-outline' : 'checkmark-circle-outline'} 
                size={26} 
                color={confirmModal.isDanger ? '#EF4444' : '#10B981'} 
              />
            </View>

            <Text style={[styles.alertTitle, { color: theme.text }]}>{confirmModal.title}</Text>
            <Text style={[styles.alertMessage, { color: theme.subText }]}>{confirmModal.message}</Text>

            <View style={styles.alertBtnRow}>
              <TouchableOpacity 
                style={[styles.alertCancelBtn, { backgroundColor: theme.inputBg, borderColor: theme.border }]} 
                onPress={hideConfirmModal}
                activeOpacity={0.8}
              >
                <Text style={[styles.alertCancelText, { color: theme.text }]}>Cancel</Text>
              </TouchableOpacity>

              <TouchableOpacity 
                style={[
                  styles.alertConfirmBtn, 
                  { backgroundColor: confirmModal.isDanger ? '#EF4444' : '#10B981' }
                ]} 
                onPress={confirmModal.onConfirm}
                activeOpacity={0.85}
              >
                <Text style={styles.alertConfirmText}>{confirmModal.confirmText}</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 14, paddingTop: 45 },
  headerRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 },
  title: { fontSize: 22, fontWeight: '700' },
  subtitle: { fontSize: 11, marginTop: 1 },
  addBtn: { width: 38, height: 38, borderRadius: 19, justifyContent: 'center', alignItems: 'center', elevation: 2 },
  listContainer: { paddingBottom: 110 },
  billCard: { padding: 14, borderRadius: 12, marginBottom: 10, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', borderWidth: 1 },
  billInfo: { flex: 1 },
  billName: { fontSize: 14, fontWeight: '700' },
  billDue: { fontSize: 11, marginTop: 2, marginBottom: 6 },
  billAmount: { color: '#EF4444', fontSize: 15, fontWeight: '800' },
  actionRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  payBtn: { paddingHorizontal: 14, paddingVertical: 7, borderRadius: 8, elevation: 1 },
  payBtnText: { color: '#FFFFFF', fontWeight: '700', fontSize: 12 },
  deleteIconBtn: { padding: 4 },
  emptyCard: { padding: 30, borderRadius: 14, alignItems: 'center', borderWidth: 1, marginTop: 20 },
  emptyText: { fontSize: 14, marginBottom: 4 },
  emptySubtext: { fontSize: 11, textAlign: 'center', lineHeight: 16 },
  
  // Modal Styles
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.65)', justifyContent: 'flex-end' },
  keyboardView: { width: '100%', justifyContent: 'flex-end' },
  modalContainer: { borderTopLeftRadius: 26, borderTopRightRadius: 26, paddingHorizontal: 18, paddingTop: 18, maxHeight: '92%', borderWidth: 1, borderBottomWidth: 0 },
  modalHeaderRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 },
  titleContainer: { flexDirection: 'row', alignItems: 'center' },
  titleIndicator: { width: 8, height: 8, borderRadius: 4, marginRight: 8 },
  modalTitle: { fontSize: 17, fontWeight: '700' },
  closeBtn: { width: 32, height: 32, borderRadius: 16, justifyContent: 'center', alignItems: 'center' },
  scrollContent: { paddingBottom: 40, paddingTop: 4 },
  
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
  currencySymbol: { fontSize: 28, fontWeight: '700', marginRight: 4 },
  heroInput: { fontSize: 32, fontWeight: '800', minWidth: 100, textAlign: 'center' },

  label: { fontSize: 10, fontWeight: '700', marginBottom: 6, marginTop: 12, textTransform: 'uppercase', letterSpacing: 0.8 },
  input: { height: 44, paddingHorizontal: 14, borderRadius: 10, fontSize: 13, borderWidth: 1 },
  
  presetsRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginTop: 8 },
  presetChip: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 10, paddingVertical: 5, borderRadius: 6, borderWidth: 1 },
  presetText: { fontSize: 11, fontWeight: '600' },

  chipRow: { flexDirection: 'row', paddingVertical: 4 },
  chip: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 12, height: 36, borderRadius: 9, marginRight: 8, borderWidth: 1 },
  activeChipText: { color: '#FFFFFF', fontWeight: '700' },
  chipText: { fontSize: 12, fontWeight: '600' },

  gridRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginBottom: 4 },
  catChip: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 12, paddingVertical: 8, borderRadius: 9, borderWidth: 1 },
  activeCatChipText: { color: '#FFFFFF', fontWeight: '700' },
  catChipText: { fontSize: 12, fontWeight: '600' },

  saveBtn: { flexDirection: 'row', height: 46, borderRadius: 12, justifyContent: 'center', alignItems: 'center', marginTop: 24, marginBottom: 10, elevation: 3 },
  saveBtnText: { color: '#FFFFFF', fontSize: 13, fontWeight: '700' },

  // Custom Alert / Confirmation Modal Styles
  alertOverlay: { 
    flex: 1, 
    backgroundColor: 'rgba(0,0,0,0.65)', 
    justifyContent: 'center', 
    alignItems: 'center', 
    padding: 20 
  },
  alertContent: { 
    width: '100%', 
    maxWidth: 340, 
    borderRadius: 20, 
    padding: 20, 
    borderWidth: 1, 
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 10,
    elevation: 5,
  },
  alertIconBadge: {
    width: 50,
    height: 50,
    borderRadius: 25,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  alertTitle: { 
    fontSize: 17, 
    fontWeight: '700', 
    textAlign: 'center', 
    marginBottom: 6 
  },
  alertMessage: { 
    fontSize: 12, 
    textAlign: 'center', 
    lineHeight: 18, 
    marginBottom: 20 
  },
  alertBtnRow: { 
    flexDirection: 'row', 
    gap: 10, 
    width: '100%' 
  },
  alertCancelBtn: { 
    flex: 1, 
    height: 44, 
    borderRadius: 10, 
    justifyContent: 'center', 
    alignItems: 'center', 
    borderWidth: 1 
  },
  alertCancelText: { 
    fontSize: 13, 
    fontWeight: '600' 
  },
  alertConfirmBtn: { 
    flex: 1, 
    height: 44, 
    borderRadius: 10, 
    justifyContent: 'center', 
    alignItems: 'center',
    elevation: 2,
  },
  alertConfirmText: { 
    color: '#FFFFFF', 
    fontSize: 13, 
    fontWeight: '700' 
  }
});