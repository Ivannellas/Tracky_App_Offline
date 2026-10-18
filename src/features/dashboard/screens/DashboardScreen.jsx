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

export default function DashboardScreen() {
  const { theme } = useContext(ThemeContext);

  const [totalBalance, setTotalBalance] = useState(0);
  const [accounts, setAccounts] = useState([]);
  const [recentTransactions, setRecentTransactions] = useState([]);
  
  // Search & Filter State
  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState('all');

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

  return (
    <View style={[styles.mainContainer, { backgroundColor: theme.bg }]}>
      <ScrollView style={styles.container} contentContainerStyle={styles.content}>
        {/* Net Worth Summary */}
        <View style={[styles.summaryCard, { backgroundColor: theme.cardBg, borderColor: theme.border }]}>
          <Text style={[styles.summaryLabel, { color: theme.subText }]}>Total Net Balance</Text>
          <Text style={[styles.summaryAmount, { color: theme.text }]}>₱{totalBalance.toLocaleString('en-US', { minimumFractionDigits: 2 })}</Text>
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

        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.accountsRow}>
          {accounts.map((account) => {
            // Check if user saved a custom background color for this wallet
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
                  ₱{account.balance.toLocaleString('en-US', { minimumFractionDigits: 2 })}
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

        {/* Recent Activity */}
        <Text style={[styles.sectionTitle, { color: theme.text }]}>Recent Activity</Text>
        <Text style={[styles.sectionSubtitle, { color: theme.subText }]}>Swipe any card left to Copy, Edit, or Delete</Text>
        
        {filteredTransactions.length === 0 ? (
          <View style={[styles.emptyCard, { backgroundColor: theme.cardBg, borderColor: theme.border }]}>
            <Text style={[styles.emptyText, { color: theme.subText }]}>No matching transactions found.</Text>
          </View>
        ) : (
          filteredTransactions.map((item) => (
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
  content: { padding: 20, paddingTop: 60, paddingBottom: 100 },
  summaryCard: { padding: 20, borderRadius: 16, marginBottom: 20, borderLeftWidth: 4, borderLeftColor: '#8B5CF6', borderWidth: 1 },
  summaryLabel: { fontSize: 14, marginBottom: 4 },
  summaryAmount: { fontSize: 32, fontWeight: 'bold' },
  rowBetween: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 2 },
  sectionTitle: { fontSize: 18, fontWeight: 'bold' },
  smallAddBtn: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8, borderWidth: 1 },
  smallAddText: { fontSize: 12, fontWeight: '600', marginLeft: 4 },
  sectionSubtitle: { fontSize: 12, marginBottom: 12 },
  accountsRow: { marginBottom: 20, flexDirection: 'row' },
  accountCard: { padding: 16, borderRadius: 12, marginRight: 12, width: 140, borderWidth: 1 },
  accountName: { fontSize: 12, marginBottom: 6 },
  accountBalance: { fontSize: 18, fontWeight: 'bold' },
  searchContainer: { flexDirection: 'row', alignItems: 'center', borderRadius: 10, paddingHorizontal: 12, marginBottom: 12, borderWidth: 1, height: 44 },
  searchIcon: { marginRight: 8 },
  searchInput: { flex: 1, fontSize: 14 },
  filterRow: { flexDirection: 'row', gap: 8, marginBottom: 20 },
  filterChip: { paddingHorizontal: 16, paddingVertical: 6, borderRadius: 8, borderWidth: 1 },
  filterText: { fontSize: 12, fontWeight: '600' },
  activeFilterText: { color: '#FFFFFF', fontWeight: 'bold' },
  emptyCard: { padding: 20, borderRadius: 12, alignItems: 'center', borderWidth: 1 },
  emptyText: { textAlign: 'center' },
  fab: { position: 'absolute', bottom: 30, right: 30, width: 60, height: 60, borderRadius: 30, justifyContent: 'center', alignItems: 'center', elevation: 5, shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 4 }
});