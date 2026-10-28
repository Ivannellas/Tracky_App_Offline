import React, { useState, useEffect, useContext } from 'react';
import { StyleSheet, Text, View, ScrollView, TouchableOpacity, TextInput, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { getTotalBalance, getAllAccounts, deleteAccount } from '../../../api/accountsRepo';
import { getAllTransactions, deleteTransaction } from '../../../api/transactionsRepo';
import AddTransactionModal from '../../transactions/components/AddTransactionModal';
import EditTransactionModal from '../../transactions/components/EditTransactionModal';
import AddAccountModal from '../../transactions/components/AddAccountModal';
import EditAccountModal from '../../transactions/components/EditAccountModal';
import SwipeableCard from '../../transactions/components/SwipeableCard';
import { ThemeContext } from '../../../context/ThemeContext';
import { formatTransactionDate } from '../../../utils/dateFormatter'; 

export default function DashboardScreen({ onOpenCalendar }) {
  const { theme } = useContext(ThemeContext);

  const [totalBalance, setTotalBalance] = useState(0);
  const [accounts, setAccounts] = useState([]);
  const [recentTransactions, setRecentTransactions] = useState([]);
  
  // Privacy State (Hide/Reveal Balances)
  const [hideBalances, setHideBalances] = useState(false);

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
  
  const [selectedTx, setSelectedTx] = useState(null);
  const [selectedAccount, setSelectedAccount] = useState(null);
  
  // State for handling transaction duplication data
  const [selectedTxForDuplicate, setSelectedTxForDuplicate] = useState(null);

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = () => {
    setTotalBalance(getTotalBalance());
    setAccounts(getAllAccounts());
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
    Alert.alert(
      'Delete Transaction',
      `Are you sure you want to delete this ₱${item.amount} transaction?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () => {
            deleteTransaction(item.id);
            loadDashboardData();
          },
        },
      ]
    );
  };

  const handleAccountPress = (account) => {
    Alert.alert(
      account.name,
      `Manage wallet options`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Edit',
          onPress: () => {
            setSelectedAccount(account);
            setEditAccountModalVisible(true);
          },
        },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () => {
            Alert.alert(
              'Confirm Deletion',
              `Deleting "${account.name}" will remove all transactions linked to it. Continue?`,
              [
                { text: 'Cancel', style: 'cancel' },
                {
                  text: 'Delete Wallet',
                  style: 'destructive',
                  onPress: () => {
                    deleteAccount(account.id);
                    loadDashboardData();
                  },
                },
              ]
            );
          },
        },
      ]
    );
  };

  const filteredTransactions = recentTransactions.filter((item) => {
    const matchesType = filterType === 'all' || item.type === filterType;
    const matchesSearch = 
      item.category_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.account_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.note?.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesType && matchesSearch;
  });

  // Apply display limit when search/filter is not being actively searched
  const isSearchingOrFiltering = searchQuery.trim().length > 0 || filterType !== 'all';
  const displayedTransactions = (showAllTransactions || isSearchingOrFiltering)
    ? filteredTransactions
    : filteredTransactions.slice(0, TRANSACTION_LIMIT);

  return (
    <View style={[styles.mainContainer, { backgroundColor: theme.bg }]}>
      <ScrollView style={styles.container} contentContainerStyle={styles.content}>
        
        {/* Top Header Row with App Title & Calendar Action Button */}
        <View style={styles.appHeader}>
          <View>
            <Text style={[styles.appName, { color: theme.text }]}>Trackly</Text>
            <Text style={[styles.appSubtitle, { color: theme.subText }]}>Overview & Activity</Text>
          </View>
          <TouchableOpacity 
            style={[styles.headerIconButton, { backgroundColor: theme.cardBg, borderColor: theme.border }]}
            onPress={onOpenCalendar}
          >
            <Ionicons name="calendar-outline" size={26} color={theme.primary} />
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

        {/* Wallets Header */}
        <View style={styles.rowBetween}>
          <Text style={[styles.sectionTitle, { color: theme.text }]}>Your Wallets</Text>
          <TouchableOpacity 
            onPress={() => setAccountModalVisible(true)} 
            style={[styles.smallAddBtn, { backgroundColor: theme.cardBg, borderColor: theme.primary }]}
          >
            <Ionicons name="add" size={16} color={theme.primary} />
            <Text style={[styles.smallAddText, { color: theme.primary }]}>Add Wallet</Text>
          </TouchableOpacity>
        </View>
        <Text style={[styles.sectionSubtitle, { color: theme.subText }]}>Tap any wallet to Edit or Delete</Text>

        {/* Wallets Row */}
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.accountsRow}>
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
              >
                <Text style={[styles.accountName, { color: subTextColor }]} numberOfLines={1}>
                  {account.name}
                </Text>
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

        {/* Filter Chips */}
        <View style={styles.filterRow}>
          {['all', 'expense', 'income'].map((type) => (
            <TouchableOpacity
              key={type}
              style={[
                styles.filterChip, 
                { backgroundColor: theme.cardBg, borderColor: theme.border },
                filterType === type && { backgroundColor: theme.primary, borderColor: theme.primary }
              ]}
              onPress={() => setFilterType(type)}
            >
              <Text style={[styles.filterText, { color: theme.subText }, filterType === type && styles.activeFilterText]}>
                {type.charAt(0).toUpperCase() + type.slice(1)}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Recent Activity Header with Limit Toggle */}
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
      >
        <Ionicons name="add" size={28} color="#FFFFFF" />
      </TouchableOpacity>

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
    width: 45,
    height: 45,
    borderRadius: 10,
    justify: 'center',
    alignItems: 'center',
    borderWidth: 1,
  },
  summaryCard: { 
    padding: 20, 
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
    fontSize: 12, 
    textTransform: 'uppercase', 
    fontWeight: '700' 
  },
  summaryAmount: { 
    fontSize: 26, 
    fontWeight: '700' 
  },
  rowBetween: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 2 },
  sectionTitle: { fontSize: 15, fontWeight: '700' },
  seeAllText: { fontSize: 12, fontWeight: '600' },
  smallAddBtn: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6, borderWidth: 1 },
  smallAddText: { fontSize: 11, fontWeight: '600', marginLeft: 3 },
  sectionSubtitle: { fontSize: 11, marginBottom: 10 },
  accountsRow: { marginBottom: 14, flexDirection: 'row' },
  accountCard: { padding: 15, borderRadius: 10, marginRight: 10, width: 130, borderWidth: 1 },
  accountName: { fontSize: 11, marginBottom: 4 },
  accountBalance: { fontSize: 15, fontWeight: '700' },
  searchContainer: { flexDirection: 'row', alignItems: 'center', borderRadius: 8, paddingHorizontal: 10, marginBottom: 10, borderWidth: 1, height: 38 },
  searchIcon: { marginRight: 6 },
  searchInput: { flex: 1, fontSize: 13 },
  filterRow: { flexDirection: 'row', gap: 6, marginBottom: 14 },
  filterChip: { paddingHorizontal: 12, paddingVertical: 5, borderRadius: 6, borderWidth: 1 },
  filterText: { fontSize: 11, fontWeight: '600' },
  activeFilterText: { color: '#FFFFFF', fontWeight: '700' },
  emptyCard: { padding: 16, borderRadius: 10, alignItems: 'center', borderWidth: 1 },
  emptyText: { textAlign: 'center', fontSize: 12 },
  fab: { position: 'absolute', bottom: 20, right: 20, width: 50, height: 50, borderRadius: 25, justifyContent: 'center', alignItems: 'center', elevation: 4, shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.2, shadowRadius: 4 }
});