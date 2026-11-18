import React, { useState, useEffect } from 'react';
import {
  StyleSheet,
  Text,
  View,
  Modal,
  TouchableOpacity,
  TextInput,
  KeyboardAvoidingView,
  Platform,
  ScrollView
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { transferFunds } from '../../../api/accountsRepo';

export default function TransferModal({ visible, onClose, accounts = [], onTransferSuccess, theme }) {
  const [fromAccountId, setFromAccountId] = useState(null);
  const [toAccountId, setToAccountId] = useState(null);
  const [amount, setAmount] = useState('');
  const [fee, setFee] = useState('');
  const [note, setNote] = useState('');

  // Custom Alert State to replace native Alert.alert
  const [customAlert, setCustomAlert] = useState({ visible: false, title: '', message: '', onSuccess: null });

  useEffect(() => {
    if (visible && accounts.length >= 2) {
      setFromAccountId(accounts[0].id);
      setToAccountId(accounts[1].id);
      setAmount('');
      setFee('');
      setNote('');
    }
  }, [visible, accounts]);

  const fromAccount = accounts.find((a) => a.id === fromAccountId);
  const toAccount = accounts.find((a) => a.id === toAccountId);

  const handleSwapAccounts = () => {
    const temp = fromAccountId;
    setFromAccountId(toAccountId);
    setToAccountId(temp);
  };

  const showAlert = (title, message, onSuccess = null) => {
    setCustomAlert({ visible: true, title, message, onSuccess });
  };

  const handleExecuteTransfer = () => {
    const numericAmount = parseFloat(amount);
    const numericFee = parseFloat(fee) || 0;

    if (!fromAccountId || !toAccountId) {
      showAlert('Error', 'Please select both source and destination accounts.');
      return;
    }

    if (fromAccountId === toAccountId) {
      showAlert('Error', 'Source and destination accounts must be different.');
      return;
    }

    if (isNaN(numericAmount) || numericAmount <= 0) {
      showAlert('Invalid Amount', 'Please enter a valid transfer amount.');
      return;
    }

    if (fromAccount && (numericAmount + numericFee) > fromAccount.balance) {
      showAlert('Insufficient Balance', `You only have ₱${fromAccount.balance.toFixed(2)} available in ${fromAccount.name}.`);
      return;
    }

    try {
      transferFunds({
        fromAccountId,
        toAccountId,
        amount: numericAmount,
        fee: numericFee,
        note
      });

      showAlert('Success', 'Funds transferred successfully!', () => {
        onTransferSuccess();
        onClose();
      });
    } catch (error) {
      showAlert('Transfer Failed', error.message || 'An error occurred during transfer.');
    }
  };

  return (
    <Modal
      animationType="slide"
      transparent={true}
      visible={visible}
      onRequestClose={onClose}
    >
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.modalOverlay}
      >
        <View style={[styles.modalContent, { backgroundColor: theme.cardBg, borderColor: theme.border }]}>
          
          {/* Header */}
          <View style={styles.modalHeader}>
            <View>
              <Text style={[styles.modalTitle, { color: theme.text }]}>Transfer Funds</Text>
              <Text style={[styles.modalSubtitle, { color: theme.subText }]}>Move balance between accounts instantly</Text>
            </View>
            <TouchableOpacity onPress={onClose} style={[styles.closeBtn, { backgroundColor: theme.inputBg }]}>
              <Ionicons name="close" size={18} color={theme.text} />
            </TouchableOpacity>
          </View>

          <ScrollView 
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.scrollContent}
            keyboardShouldPersistTaps="handled"
          >

            {/* --- UNIFIED TRANSFER FLOW BOX --- */}
            <View style={[styles.transferCardContainer, { backgroundColor: theme.bg, borderColor: theme.border }]}>
              
              {/* FROM SECTION */}
              <View style={styles.transferSection}>
                <View style={styles.sectionHeaderRow}>
                  <Text style={[styles.sectionHeading, { color: theme.subText }]}>From Account</Text>
                  <Text style={[styles.balanceIndicator, { color: theme.subText }]}>
                    Avail: <Text style={{ fontWeight: '700', color: theme.text }}>₱{fromAccount?.balance?.toFixed(2) || '0.00'}</Text>
                  </Text>
                </View>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chipsScroll} keyboardShouldPersistTaps="handled">
                  {accounts.map((acc) => {
                    const isSelected = acc.id === fromAccountId;
                    const isDisabled = acc.id === toAccountId;
                    const badgeColor = acc.color || theme.primary;
                    return (
                      <TouchableOpacity
                        key={acc.id}
                        disabled={isDisabled}
                        style={[
                          styles.accountChip,
                          { borderColor: theme.border, backgroundColor: theme.cardBg },
                          isSelected && { backgroundColor: badgeColor, borderColor: badgeColor },
                          isDisabled && { opacity: 0.25 }
                        ]}
                        onPress={() => setFromAccountId(acc.id)}
                      >
                        <Text style={[styles.chipText, { color: isSelected ? '#FFFFFF' : theme.text }]}>
                          {acc.name}
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
                </ScrollView>
              </View>

              {/* CENTER FLOATING SWAP BUTTON */}
              <View style={styles.dividerRow}>
                <View style={[styles.dividerLine, { backgroundColor: theme.border }]} />
                <TouchableOpacity 
                  style={[styles.floatingSwapBtn, { backgroundColor: theme.cardBg, borderColor: theme.border }]} 
                  onPress={handleSwapAccounts}
                  activeOpacity={0.8}
                >
                  <Ionicons name="swap-vertical" size={16} color={theme.primary} />
                </TouchableOpacity>
                <View style={[styles.dividerLine, { backgroundColor: theme.border }]} />
              </View>

              {/* TO SECTION */}
              <View style={styles.transferSection}>
                <View style={styles.sectionHeaderRow}>
                  <Text style={[styles.sectionHeading, { color: theme.subText }]}>To Account</Text>
                  <Text style={[styles.balanceIndicator, { color: theme.subText }]}>
                    Bal: <Text style={{ fontWeight: '700', color: theme.text }}>₱{toAccount?.balance?.toFixed(2) || '0.00'}</Text>
                  </Text>
                </View>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chipsScroll} keyboardShouldPersistTaps="handled">
                  {accounts.map((acc) => {
                    const isSelected = acc.id === toAccountId;
                    const isDisabled = acc.id === fromAccountId;
                    const badgeColor = acc.color || theme.primary;
                    return (
                      <TouchableOpacity
                        key={acc.id}
                        disabled={isDisabled}
                        style={[
                          styles.accountChip,
                          { borderColor: theme.border, backgroundColor: theme.cardBg },
                          isSelected && { backgroundColor: badgeColor, borderColor: badgeColor },
                          isDisabled && { opacity: 0.25 }
                        ]}
                        onPress={() => setToAccountId(acc.id)}
                      >
                        <Text style={[styles.chipText, { color: isSelected ? '#FFFFFF' : theme.text }]}>
                          {acc.name}
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
                </ScrollView>
              </View>

            </View>

            {/* --- HERO AMOUNT INPUT --- */}
            <Text style={[styles.fieldLabel, { color: theme.subText }]}>TRANSFER AMOUNT</Text>
            <View style={[styles.amountHeroBox, { backgroundColor: theme.inputBg, borderColor: theme.border }]}>
              <Text style={[styles.currencySymbol, { color: theme.primary }]}>₱</Text>
              <TextInput
                style={[styles.heroAmountInput, { color: theme.text }]}
                placeholder="0.00"
                placeholderTextColor={theme.subText}
                keyboardType="decimal-pad"
                value={amount}
                onChangeText={setAmount}
              />
            </View>

            {/* --- COMPACT OPTIONAL FIELDS ROW --- */}
            <View style={styles.compactRow}>
              <View style={styles.compactField}>
                <Text style={[styles.fieldLabel, { color: theme.subText }]}>FEE (OPTIONAL)</Text>
                <TextInput
                  style={[styles.inputField, { backgroundColor: theme.inputBg, color: theme.text, borderColor: theme.border }]}
                  placeholder="0.00"
                  placeholderTextColor={theme.subText}
                  keyboardType="decimal-pad"
                  value={fee}
                  onChangeText={setFee}
                />
              </View>

              <View style={[styles.compactField, { flex: 1.6 }]}>
                <Text style={[styles.fieldLabel, { color: theme.subText }]}>NOTE (OPTIONAL)</Text>
                <TextInput
                  style={[styles.inputField, { backgroundColor: theme.inputBg, color: theme.text, borderColor: theme.border }]}
                  placeholder="ATM withdrawal"
                  placeholderTextColor={theme.subText}
                  value={note}
                  onChangeText={setNote}
                />
              </View>
            </View>

            {/* SUBMIT BUTTON */}
            <TouchableOpacity 
              style={[styles.transferSubmitBtn, { backgroundColor: theme.primary }]} 
              onPress={handleExecuteTransfer}
              activeOpacity={0.85}
            >
              <Text style={styles.transferSubmitText}>Confirm Transfer</Text>
              <Ionicons name="arrow-forward" size={16} color="#FFFFFF" style={{ marginLeft: 6 }} />
            </TouchableOpacity>

          </ScrollView>
        </View>
      </KeyboardAvoidingView>

      {/* --- CUSTOM IN-APP ALERT DIALOG --- */}
      <Modal
        transparent={true}
        visible={customAlert.visible}
        animationType="fade"
        onRequestClose={() => setCustomAlert({ ...customAlert, visible: false })}
      >
        <View style={styles.alertOverlay}>
          <View style={[styles.alertBox, { backgroundColor: theme.cardBg, borderColor: theme.border }]}>
            <Text style={[styles.alertTitle, { color: theme.text }]}>{customAlert.title}</Text>
            <Text style={[styles.alertMessage, { color: theme.subText }]}>{customAlert.message}</Text>
            <TouchableOpacity
              style={[styles.alertBtn, { backgroundColor: theme.primary }]}
              onPress={() => {
                const action = customAlert.onSuccess;
                setCustomAlert({ visible: false, title: '', message: '', onSuccess: null });
                if (action) action();
              }}
              activeOpacity={0.85}
            >
              <Text style={styles.alertBtnText}>OK</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </Modal>
  );
}

const styles = StyleSheet.create({
  modalOverlay: { flex: 1, justifyContent: 'flex-end', backgroundColor: 'rgba(0,0,0,0.5)' },
  modalContent: { 
    borderTopLeftRadius: 20, 
    borderTopRightRadius: 20, 
    borderWidth: 1, 
    paddingHorizontal: 16, 
    paddingTop: 16, 
    maxHeight: '85%' 
  },
  scrollContent: { paddingBottom: 24 },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 },
  modalTitle: { fontSize: 16, fontWeight: '700' },
  modalSubtitle: { fontSize: 11, marginTop: 1 },
  closeBtn: { width: 30, height: 30, borderRadius: 15, justifyContent: 'center', alignItems: 'center' },

  transferCardContainer: { borderRadius: 14, borderWidth: 1, padding: 10, marginBottom: 14 },
  transferSection: { paddingVertical: 4 },
  sectionHeaderRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6, paddingHorizontal: 4 },
  sectionHeading: { fontSize: 10, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 0.5 },
  balanceIndicator: { fontSize: 10 },
  chipsScroll: { paddingVertical: 2, gap: 6 },
  
  accountChip: { 
    paddingHorizontal: 12, 
    paddingVertical: 6, 
    borderRadius: 8, 
    borderWidth: 1, 
    marginRight: 6 
  },
  chipText: { fontSize: 11, fontWeight: '600' },

  dividerRow: { flexDirection: 'row', alignItems: 'center', marginVertical: 8, position: 'relative' },
  dividerLine: { flex: 1, height: 1 },
  floatingSwapBtn: { 
    width: 28, 
    height: 28, 
    borderRadius: 14, 
    borderWidth: 1, 
    justifyContent: 'center', 
    alignItems: 'center', 
    marginHorizontal: 8,
    elevation: 2
  },

  fieldLabel: { fontSize: 10, fontWeight: '700', marginBottom: 6, textTransform: 'uppercase', letterSpacing: 0.5 },
  
  amountHeroBox: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    borderRadius: 12, 
    borderWidth: 1, 
    paddingHorizontal: 14, 
    height: 50, 
    marginBottom: 12 
  },
  currencySymbol: { fontSize: 20, fontWeight: '700', marginRight: 6 },
  heroAmountInput: { flex: 1, fontSize: 20, fontWeight: '700' },

  compactRow: { flexDirection: 'row', gap: 8, marginBottom: 16 },
  compactField: { flex: 1 },
  inputField: { height: 40, borderRadius: 8, borderWidth: 1, paddingHorizontal: 10, fontSize: 12 },

  transferSubmitBtn: {
    flexDirection: 'row',
    height: 46,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 2,
    marginTop: 4
  },
  transferSubmitText: { color: '#FFFFFF', fontWeight: '700', fontSize: 13 },

  // Custom Alert Styles
  alertOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.6)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  alertBox: {
    width: '100%',
    maxWidth: 300,
    borderRadius: 16,
    borderWidth: 1,
    padding: 20,
    alignItems: 'center',
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
  },
  alertTitle: {
    fontSize: 16,
    fontWeight: '700',
    marginBottom: 8,
    textAlign: 'center',
  },
  alertMessage: {
    fontSize: 13,
    textAlign: 'center',
    marginBottom: 20,
    lineHeight: 18,
  },
  alertBtn: {
    width: '100%',
    height: 40,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  alertBtnText: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 13,
  },
});