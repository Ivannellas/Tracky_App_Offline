import React, { useState, useEffect, useContext } from 'react';
import { StyleSheet, Text, View, ScrollView, TouchableOpacity, TextInput, Modal } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { getTotalBalance, getAllAccounts, deleteAccount, updateAccountsOrder } from '../../../api/accountsRepo';
import { getAllTransactions, deleteTransaction } from '../../../api/transactionsRepo';
import AddTransactionModal from '../../transactions/components/AddTransactionModal';
import EditTransactionModal from '../../transactions/components/EditTransactionModal';
import AddAccountModal from '../../transactions/components/AddAccountModal';
import EditAccountModal from '../../transactions/components/EditAccountModal';
import TransferModal from '../components/TransferModal';
import SwipeableCard from '../../transactions/components/SwipeableCard';
import { ThemeContext } from '../../../context/ThemeContext';
import { formatTransactionDate } from '../../../utils/dateFormatter'; 

export default function DashboardScreen({ onOpenCalendar }) {
  const { theme, hideBalances, setHideBalances } = useContext(ThemeContext);

  const [totalBalance, setTotalBalance] = useState(0);
  const [accounts, setAccounts] = useState([]);
  const [recentTransactions, setRecentTransactions] = useState([]);

  // Search & Filter State
  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState('all');

  // Limit State
  const [showAllTransactions, setShowAllTransactions] = useState(false);
  const TRANSACTION_LIMIT = 5;

  const [addModalVisible, setAddModalVisible] = useState(false);
  const [editModalVisible, setEditModalVisible] = useState(false);
  const [accountModalVisible, setAccountModalVisible] = useState(false);
  const [editAccountModalVisible, setEditAccountModalVisible] = useState(false);
  const [transferModalVisible, setTransferModalVisible] = useState(false);
  
  // Wallet Management Sheet State
  const [walletActionModalVisible, setWalletActionModalVisible] = useState(false);
  const [activeWallet, setActiveWallet] = useState(null);

  const [selectedTx, setSelectedTx] = useState(null);
  const [selectedAccount, setSelectedAccount] = useState(null);
  const [selectedTxForDuplicate, setSelectedTxForDuplicate] = useState(null);

  // Custom In-App Alert State
  const [customAlert, setCustomAlert] = useState({ 
    visible: false, 
    title: '', 
    message: '', 
    isConfirm: false, 
    onConfirm: null 
  });

  const showAlert = (title, message, isConfirm = false, onConfirm = null) => {
    setCustomAlert({ visible: true, title, message, isConfirm, onConfirm });
  };

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = () => {
    setTotalBalance(getTotalBalance());
    const loadedAccounts = getAllAccounts();
    setAccounts(loadedAccounts);
    setRecentTransactions(getAllTransactions());
  };

  const handleEdit = (item) => {
    setSelectedTx(item);
    setEditModalVisible(true);
  };

  const handleDuplicate = (item) => {
    setSelectedTxForDuplicate(item);
    setAddModalVisible(true);
  };

  const handleDelete = (item) => {
    showAlert(
      'Delete Transaction',
      `Are you sure you want to delete this ₱${item.amount} transaction?`,
      true,
      () => {
        deleteTransaction(item.id);
        loadDashboardData();
      }
    );
  };

  const handleAccountPress = (account) => {
    setActiveWallet(account);
    setWalletActionModalVisible(true);
  };

  const handleMoveLeft = () => {
    if (!activeWallet) return;
    const index = accounts.findIndex(a => a.id === activeWallet.id);
    if (index > 0) {
      const newAccounts = [...accounts];
      const temp = newAccounts[index];
      newAccounts[index] = newAccounts[index - 1];
      newAccounts[index - 1] = temp;
      updateAccountsOrder(newAccounts);
      loadDashboardData();
    }
    setWalletActionModalVisible(false);
  };

  const handleMoveRight = () => {
    if (!activeWallet) return;
    const index = accounts.findIndex(a => a.id === activeWallet.id);
    if (index < accounts.length - 1) {
      const newAccounts = [...accounts];
      const temp = newAccounts[index];
      newAccounts[index] = newAccounts[index + 1];
      newAccounts[index + 1] = temp;
      updateAccountsOrder(newAccounts);
      loadDashboardData();
    }
    setWalletActionModalVisible(false);
  };

  const handleTriggerEdit = () => {
    setWalletActionModalVisible(false);
    setSelectedAccount(activeWallet);
    setEditAccountModalVisible(true);
  };

  const handleTriggerDelete = () => {
    setWalletActionModalVisible(false);
    showAlert(
      'Confirm Deletion',
      `Deleting "${activeWallet.name}" will remove all transactions linked to it. Continue?`,
      true,
      () => {
        deleteAccount(activeWallet.id);
        loadDashboardData();
      }
    );
  };

  const filteredTransactions = recentTransactions.filter((item) => {
    const matchesType = filterType === 'all' || item.type === filterType;
    const query = searchQuery.toLowerCase();
    const matchesSearch = 
      item.category_name?.toLowerCase().includes(query) ||
      item.account_name?.toLowerCase().includes(query) ||
      item.to_account_name?.toLowerCase().includes(query) ||
      item.note?.toLowerCase().includes(query);

    return matchesType && matchesSearch;
  });

  const isSearchingOrFiltering = searchQuery.trim().length > 0 || filterType !== 'all';
  const displayedTransactions = (showAllTransactions || isSearchingOrFiltering)
    ? filteredTransactions
    : filteredTransactions.slice(0, TRANSACTION_LIMIT);

  const activeWalletIndex = accounts.findIndex(a => a.id === activeWallet?.id);

  return (
    <View style={[styles.mainContainer, { backgroundColor: theme.bg }]}>
      <ScrollView style={styles.container} contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        
        {/* Top Header Row */}
        <View style={styles.appHeader}>
          <View>
            <Text style={[styles.appName, { color: theme.text }]}>Trackly</Text>
            <Text style={[styles.appSubtitle, { color: theme.subText }]}>Overview & Activity</Text>
          </View>
          <TouchableOpacity 
            style={[styles.headerIconButton, { backgroundColor: theme.cardBg, borderColor: theme.border }]}
            onPress={onOpenCalendar}
            activeOpacity={0.8}
          >
            <Ionicons name="calendar-outline" size={24} color={theme.primary} />
          </TouchableOpacity>
        </View>

        {/* Net Worth Summary Card */}
        <View style={[styles.summaryCard, { backgroundColor: theme.cardBg, borderColor: theme.border }]}>
          <View style={styles.summaryHeaderRow}>
            <Text style={[styles.summaryLabel, { color: theme.subText }]}>Total Net Balance</Text>
            <TouchableOpacity onPress={() => setHideBalances(!hideBalances)} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
              <Ionicons 
                name={hideBalances ? 'eye-off-outline' : 'eye-outline'} 
                size={18} 
                color={theme.subText} 
              />
            </TouchableOpacity>
          </View>
          
          <Text style={[styles.summaryAmount, { color: theme.text }]}>
            {hideBalances 
              ? '₱ ••••••' 
              : `₱${totalBalance.toLocaleString('en-US', { minimumFractionDigits: 2 })}`}
          </Text>
        </View>

        {/* Wallets Header & Action Buttons */}
        <View style={styles.rowBetween}>
          <Text style={[styles.sectionTitle, { color: theme.text }]}>Your Wallets</Text>
          <View style={styles.walletActionBtnsRow}>
            {accounts.length >= 2 && (
              <TouchableOpacity 
                onPress={() => setTransferModalVisible(true)} 
                style={[styles.smallAddBtn, { backgroundColor: theme.cardBg, borderColor: theme.primary, marginRight: 6 }]}
                activeOpacity={0.8}
              >
                <Ionicons name="swap-vertical" size={14} color={theme.primary} />
                <Text style={[styles.smallAddText, { color: theme.primary }]}>Transfer</Text>
              </TouchableOpacity>
            )}
            
            <TouchableOpacity 
              onPress={() => setAccountModalVisible(true)} 
              style={[styles.smallAddBtn, { backgroundColor: theme.cardBg, borderColor: theme.primary }]}
              activeOpacity={0.8}
            >
              <Ionicons name="add" size={16} color={theme.primary} />
              <Text style={[styles.smallAddText, { color: theme.primary }]}>Add Wallet</Text>
            </TouchableOpacity>
          </View>
        </View>
        <Text style={[styles.sectionSubtitle, { color: theme.subText }]}>Tap any wallet card to manage, reorder or edit</Text>

        {/* Wallets Row */}
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.accountsRow} keyboardShouldPersistTaps="handled">
          {accounts.map((account) => {
            const hasCustomColor = !!account.color;
            const cardBgColor = account.color || theme.cardBg;
            const textColor = hasCustomColor ? '#FFFFFF' : theme.text;
            const subTextColor = hasCustomColor ? 'rgba(255, 255, 255, 0.8)' : theme.subText;

            return (
              <TouchableOpacity 
                key={account.id} 
                style={[
                  styles.accountCard, 
                  { 
                    backgroundColor: cardBgColor, 
                    borderColor: hasCustomColor ? cardBgColor : theme.border 
                  }
                ]}
                onPress={() => handleAccountPress(account)}
                onLongPress={() => handleAccountPress(account)}
                activeOpacity={0.85}
              >
                <View style={styles.cardTopRow}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', flex: 1, marginRight: 4 }}>
                    <Ionicons name={account.icon || 'wallet-outline'} size={14} color={subTextColor} style={{ marginRight: 5 }} />
                    <Text style={[styles.accountName, { color: subTextColor }]} numberOfLines={1}>
                      {account.name}
                    </Text>
                  </View>
                  <Ionicons name="ellipsis-vertical" size={12} color={subTextColor} />
                </View>
                <Text style={[styles.accountBalance, { color: textColor }]}>
                  {hideBalances 
                    ? '₱ ••••••' 
                    : `₱${account.balance.toLocaleString('en-US', { minimumFractionDigits: 2 })}`}
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>

        {/* Search Bar */}
        <View style={[styles.searchContainer, { backgroundColor: theme.cardBg, borderColor: theme.border }]}>
          <Ionicons name="search" size={18} color={theme.subText} style={styles.searchIcon} />
          <TextInput
            style={[styles.searchInput, { color: theme.text }]}
            placeholder="Search category, note, wallet..."
            placeholderTextColor={theme.subText}
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity onPress={() => setSearchQuery('')}>
              <Ionicons name="close-circle" size={18} color={theme.subText} />
            </TouchableOpacity>
          )}
        </View>

        {/* Filter Chips - Includes 'transfer' */}
        <View style={styles.filterRow}>
          {['all', 'expense', 'income', 'transfer'].map((type) => (
            <TouchableOpacity
              key={type}
              style={[
                styles.filterChip, 
                { backgroundColor: theme.cardBg, borderColor: theme.border },
                filterType === type && { backgroundColor: theme.primary, borderColor: theme.primary }
              ]}
              onPress={() => setFilterType(type)}
              activeOpacity={0.8}
            >
              <Text style={[styles.filterText, { color: theme.subText }, filterType === type && styles.activeFilterText]}>
                {type.charAt(0).toUpperCase() + type.slice(1)}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Recent Activity Header */}
        <View style={styles.rowBetween}>
          <Text style={[styles.sectionTitle, { color: theme.text }]}>Recent Activity</Text>
          {filteredTransactions.length > TRANSACTION_LIMIT && !isSearchingOrFiltering && (
            <TouchableOpacity onPress={() => setShowAllTransactions(!showAllTransactions)}>
              <Text style={[styles.seeAllText, { color: theme.primary }]}>
                {showAllTransactions ? 'Show Less' : `View All (${filteredTransactions.length})`}
              </Text>
            </TouchableOpacity>
          )}
        </View>
        <Text style={[styles.sectionSubtitle, { color: theme.subText }]}>Swipe any card left to Copy, Edit, or Delete</Text>
        
        {displayedTransactions.length === 0 ? (
          <View style={[styles.emptyCard, { backgroundColor: theme.cardBg, borderColor: theme.border }]}>
            <Text style={[styles.emptyText, { color: theme.subText }]}>No matching transactions found.</Text>
          </View>
        ) : (
          displayedTransactions.map((item) => (
            <SwipeableCard 
              key={item.id} 
              item={item} 
              onEdit={handleEdit} 
              onDelete={handleDelete} 
              onDuplicate={handleDuplicate}
            />
          ))
        )}
      </ScrollView>

      {/* Floating Action Button */}
      <TouchableOpacity 
        style={[styles.fab, { backgroundColor: theme.primary }]} 
        onPress={() => {
          setSelectedTxForDuplicate(null);
          setAddModalVisible(true);
        }}
        activeOpacity={0.85}
      >
        <Ionicons name="add" size={26} color="#FFFFFF" />
      </TouchableOpacity>

      {/* Custom Wallet Action Sheet Modal */}
      <Modal
        visible={walletActionModalVisible}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setWalletActionModalVisible(false)}
      >
        <TouchableOpacity 
          style={styles.sheetOverlay} 
          activeOpacity={1} 
          onPress={() => setWalletActionModalVisible(false)}
        >
          <View style={[styles.sheetContent, { backgroundColor: theme.cardBg, borderColor: theme.border }]}>
            <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 2, gap: 8 }}>
              <Ionicons name={activeWallet?.icon || 'wallet-outline'} size={20} color={theme.primary} />
              <Text style={[styles.sheetTitle, { color: theme.text }]}>{activeWallet?.name}</Text>
            </View>
            <Text style={[styles.sheetSubtitle, { color: theme.subText }]}>Manage wallet options & position</Text>

            <View style={styles.sheetActionList}>
              {activeWalletIndex > 0 && (
                <TouchableOpacity style={[styles.sheetActionItem, { backgroundColor: theme.inputBg, borderColor: theme.border }]} onPress={handleMoveLeft}>
                  <Ionicons name="arrow-back" size={16} color={theme.primary} />
                  <Text style={[styles.sheetActionText, { color: theme.text }]}>Move Left</Text>
                </TouchableOpacity>
              )}

              {activeWalletIndex < accounts.length - 1 && (
                <TouchableOpacity style={[styles.sheetActionItem, { backgroundColor: theme.inputBg, borderColor: theme.border }]} onPress={handleMoveRight}>
                  <Ionicons name="arrow-forward" size={16} color={theme.primary} />
                  <Text style={[styles.sheetActionText, { color: theme.text }]}>Move Right</Text>
                </TouchableOpacity>
              )}

              <TouchableOpacity style={[styles.sheetActionItem, { backgroundColor: theme.inputBg, borderColor: theme.border }]} onPress={handleTriggerEdit}>
                <Ionicons name="create-outline" size={16} color={theme.primary} />
                <Text style={[styles.sheetActionText, { color: theme.text }]}>Edit Wallet</Text>
              </TouchableOpacity>

              <TouchableOpacity style={[styles.sheetActionItem, { backgroundColor: 'rgba(239, 68, 68, 0.1)', borderColor: '#EF4444' }]} onPress={handleTriggerDelete}>
                <Ionicons name="trash-outline" size={16} color="#EF4444" />
                <Text style={[styles.sheetActionText, { color: '#EF4444' }]}>Delete Wallet</Text>
              </TouchableOpacity>
            </View>
          </View>
        </TouchableOpacity>
      </Modal>

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
            
            <View style={styles.alertButtonRow}>
              {customAlert.isConfirm && (
                <TouchableOpacity
                  style={[styles.alertBtn, { backgroundColor: theme.inputBg, borderColor: theme.border, borderWidth: 1, flex: 1 }]}
                  onPress={() => setCustomAlert({ visible: false, title: '', message: '', isConfirm: false, onConfirm: null })}
                  activeOpacity={0.8}
                >
                  <Text style={[styles.alertBtnText, { color: theme.text }]}>Cancel</Text>
                </TouchableOpacity>
              )}

              <TouchableOpacity
                style={[styles.alertBtn, { backgroundColor: customAlert.isConfirm ? '#EF4444' : theme.primary, flex: 1 }]}
                onPress={() => {
                  const action = customAlert.onConfirm;
                  setCustomAlert({ visible: false, title: '', message: '', isConfirm: false, onConfirm: null });
                  if (action) action();
                }}
                activeOpacity={0.85}
              >
                <Text style={styles.alertBtnText}>{customAlert.isConfirm ? 'Delete' : 'OK'}</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Modals */}
      <AddTransactionModal 
        visible={addModalVisible} 
        initialData={selectedTxForDuplicate}
        onClose={() => {
          setAddModalVisible(false);
          setSelectedTxForDuplicate(null);
        }} 
        onSuccess={loadDashboardData} 
      />

      <EditTransactionModal 
        visible={editModalVisible} 
        transaction={selectedTx} 
        onClose={() => setEditModalVisible(false)} 
        onSuccess={loadDashboardData} 
      />

      <AddAccountModal 
        visible={accountModalVisible} 
        onClose={() => setAccountModalVisible(false)} 
        onSuccess={loadDashboardData} 
      />

      <EditAccountModal 
        visible={editAccountModalVisible} 
        account={selectedAccount} 
        onClose={() => setEditAccountModalVisible(false)} 
        onSuccess={loadDashboardData} 
      />

      <TransferModal
        visible={transferModalVisible}
        onClose={() => setTransferModalVisible(false)}
        accounts={accounts}
        onTransferSuccess={loadDashboardData}
        theme={theme}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  mainContainer: { flex: 1 },
  container: { flex: 1 },
  content: { padding: 14, paddingTop: 45, paddingBottom: 90 },
  appHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 14,
  },
  appName: {
    fontSize: 22,
    fontWeight: '700',
  },
  appSubtitle: {
    fontSize: 11,
  },
  headerIconButton: {
    width: 42,
    height: 42,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
  },
  summaryCard: { 
    padding: 18, 
    borderRadius: 12, 
    marginBottom: 14, 
    borderLeftWidth: 3, 
    borderLeftColor: '#8B5CF6', 
    borderWidth: 1 
  },
  summaryHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  summaryLabel: { 
    fontSize: 11, 
    textTransform: 'uppercase', 
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  summaryAmount: { 
    fontSize: 24, 
    fontWeight: '700' 
  },
  rowBetween: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 2 },
  sectionTitle: { fontSize: 15, fontWeight: '700' },
  seeAllText: { fontSize: 12, fontWeight: '600' },
  walletActionBtnsRow: { flexDirection: 'row', alignItems: 'center' },
  smallAddBtn: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6, borderWidth: 1 },
  smallAddText: { fontSize: 11, fontWeight: '600', marginLeft: 3 },
  sectionSubtitle: { fontSize: 11, marginBottom: 10 },
  accountsRow: { marginBottom: 14, flexDirection: 'row' },
  accountCard: { padding: 14, borderRadius: 12, marginRight: 10, width: 130, borderWidth: 1, justifyContent: 'space-between', height: 75 },
  cardTopRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  accountName: { fontSize: 11, fontWeight: '600' },
  accountBalance: { fontSize: 14, fontWeight: '700' },
  searchContainer: { flexDirection: 'row', alignItems: 'center', borderRadius: 8, paddingHorizontal: 10, marginBottom: 10, borderWidth: 1, height: 40 },
  searchIcon: { marginRight: 6 },
  searchInput: { flex: 1, fontSize: 13 },
  filterRow: { flexDirection: 'row', gap: 6, marginBottom: 14 },
  filterChip: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 6, borderWidth: 1 },
  filterText: { fontSize: 11, fontWeight: '600' },
  activeFilterText: { color: '#FFFFFF', fontWeight: '700' },
  emptyCard: { padding: 16, borderRadius: 10, alignItems: 'center', borderWidth: 1 },
  emptyText: { textAlign: 'center', fontSize: 12 },
  fab: { position: 'absolute', bottom: 20, right: 20, width: 48, height: 48, borderRadius: 24, justifyContent: 'center', alignItems: 'center', elevation: 4, shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.2, shadowRadius: 4 },
  sheetOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', alignItems: 'center', padding: 20 },
  sheetContent: { width: '100%', maxWidth: 320, borderRadius: 16, padding: 20, borderWidth: 1, elevation: 5 },
  sheetTitle: { fontSize: 18, fontWeight: '700' },
  sheetSubtitle: { fontSize: 12, marginBottom: 16 },
  sheetActionList: { gap: 8 },
  sheetActionItem: { flexDirection: 'row', alignItems: 'center', padding: 12, borderRadius: 10, borderWidth: 1, gap: 10 },
  sheetActionText: { fontSize: 14, fontWeight: '600' },

  // Custom Alert Styles
  alertOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.65)',
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
  alertButtonRow: {
    flexDirection: 'row',
    gap: 10,
    width: '100%',
  },
  alertBtn: {
    height: 40,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  alertBtnText: {
    fontWeight: '700',
    fontSize: 13,
    color: '#FFFFFF',
  },
});