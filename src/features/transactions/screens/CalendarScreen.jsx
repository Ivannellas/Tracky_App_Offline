import React, { useState, useEffect, useContext } from 'react';
import { StyleSheet, Text, View, ScrollView, TouchableOpacity } from 'react-native';
import { Calendar } from 'react-native-calendars';
import { ThemeContext } from '../../../context/ThemeContext';
import { getDb } from '../../../api/sqLiteClient';
import { formatTransactionDate } from '../../../utils/dateFormatter';

export default function CalendarScreen({ onBack }) {
  const { theme } = useContext(ThemeContext);
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [markedDates, setMarkedDates] = useState({});
  const [dayTotals, setDayTotals] = useState({});
  const [dayTransactions, setDayTransactions] = useState([]);

  useEffect(() => {
    loadCalendarData();
  }, []);

  useEffect(() => {
    loadTransactionsForDate(selectedDate);
  }, [selectedDate]);

  const loadCalendarData = () => {
    try {
      const db = getDb();
      const results = db.getAllSync(`SELECT date, amount, type FROM transactions`);
      
      const marks = {};
      const totals = {};

      results.forEach((tx) => {
        if (!tx.date) return;
        const dateKey = tx.date.split('T')[0];

        marks[dateKey] = {
          marked: true,
          dotColor: tx.type === 'expense' ? '#EF4444' : '#10B981',
        };

        if (tx.type === 'expense') {
          totals[dateKey] = (totals[dateKey] || 0) + Number(tx.amount);
        }
      });

      marks[selectedDate] = {
        ...(marks[selectedDate] || {}),
        selected: true,
        selectedColor: theme.primary,
      };

      setMarkedDates(marks);
      setDayTotals(totals);
    } catch (error) {
      console.log("Error loading calendar markers:", error);
    }
  };

  const loadTransactionsForDate = (dateString) => {
    try {
      const db = getDb();
      const txs = db.getAllSync(`
        SELECT t.*, c.name as category_name, a.name as account_name 
        FROM transactions t
        JOIN categories c ON t.category_id = c.id
        JOIN accounts a ON t.account_id = a.id
        WHERE t.date LIKE ?
        ORDER BY datetime(t.date) DESC
      `, [`${dateString}%`]);

      setDayTransactions(txs);
    } catch (error) {
      console.log("Error loading day transactions:", error);
    }
  };

  const totalDayExpense = dayTransactions
    .filter(tx => tx.type === 'expense')
    .reduce((sum, tx) => sum + Number(tx.amount), 0);

  const totalDayIncome = dayTransactions
    .filter(tx => tx.type === 'income')
    .reduce((sum, tx) => sum + Number(tx.amount), 0);

  return (
    <ScrollView 
      style={[styles.container, { backgroundColor: theme.bg }]}
      contentContainerStyle={styles.scrollContent}
      showsVerticalScrollIndicator={false}
    >
      {/* Header Row with Back Option */}
      <View style={styles.headerRow}>
        <TouchableOpacity onPress={onBack} style={styles.backBtn}>
          <Text style={{ color: theme.primary, fontSize: 15, fontWeight: '600' }}>‹ Back</Text>
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: theme.text }]}>Calendar View</Text>
      </View>

      {/* Calendar UI with Custom Day Cell Totals */}
      <Calendar
        current={selectedDate}
        onDayPress={(day) => {
          const newDate = day.dateString;
          setSelectedDate(newDate);
          setMarkedDates((prev) => ({
            ...prev,
            [selectedDate]: { ...prev[selectedDate], selected: false },
            [newDate]: { ...(prev[newDate] || {}), selected: true, selectedColor: theme.primary }
          }));
        }}
        markedDates={markedDates}
        dayComponent={({ date, state, marking }) => {
          const isSelected = marking?.selected;
          const totalExpense = dayTotals[date.dateString];

          return (
            <TouchableOpacity
              onPress={() => {
                const newDate = date.dateString;
                setSelectedDate(newDate);
                setMarkedDates((prev) => ({
                  ...prev,
                  [selectedDate]: { ...prev[selectedDate], selected: false },
                  [newDate]: { ...(prev[newDate] || {}), selected: true, selectedColor: theme.primary }
                }));
              }}
              style={[
                styles.dayCell,
                isSelected && { backgroundColor: theme.primary, borderRadius: 8 }
              ]}
            >
              <Text style={[
                styles.dayNum, 
                { color: state === 'disabled' ? '#475569' : theme.text },
                isSelected && { color: '#FFFFFF', fontWeight: 'bold' }
              ]}>
                {date.day}
              </Text>

              {totalExpense > 0 && (
                <Text style={[styles.cellExpenseText, isSelected && { color: '#FFFFFF' }]} numberOfLines={1}>
                  -₱{totalExpense >= 1000 ? `${(totalExpense / 1000).toFixed(1)}k` : Math.round(totalExpense)}
                </Text>
              )}
            </TouchableOpacity>
          );
        }}
        theme={{
          backgroundColor: theme.cardBg,
          calendarBackground: theme.cardBg,
          textSectionTitleColor: theme.subText,
          selectedDayBackgroundColor: theme.primary,
          selectedDayTextColor: '#ffffff',
          todayTextColor: theme.primary,
          dayTextColor: theme.text,
          textDisabledColor: '#475569',
          monthTextColor: theme.text,
          arrowColor: theme.primary,
        }}
        style={styles.calendarStyle}
      />

      {/* Selected Day Summary Banner */}
      <View style={[styles.daySummaryCard, { backgroundColor: theme.cardBg, borderColor: theme.border }]}>
        <View style={styles.summaryItem}>
          <Text style={[styles.summaryItemLabel, { color: theme.subText }]}>Total Spent</Text>
          <Text style={[styles.summaryItemAmount, { color: '#EF4444' }]}>
            -₱{totalDayExpense.toLocaleString('en-US', { minimumFractionDigits: 2 })}
          </Text>
        </View>
        <View style={[styles.summaryDivider, { backgroundColor: theme.border }]} />
        <View style={styles.summaryItem}>
          <Text style={[styles.summaryItemLabel, { color: theme.subText }]}>Total Earned</Text>
          <Text style={[styles.summaryItemAmount, { color: '#10B981' }]}>
            +₱{totalDayIncome.toLocaleString('en-US', { minimumFractionDigits: 2 })}
          </Text>
        </View>
      </View>

      {/* Selected Day Subheader */}
      <View style={styles.sectionHeader}>
        <Text style={[styles.subHeaderTitle, { color: theme.text }]}>
          Transactions for {selectedDate}
        </Text>
        <Text style={[styles.countBadge, { color: theme.subText }]}>
          {dayTransactions.length} items
        </Text>
      </View>

      {/* Day Transactions List */}
      {dayTransactions.length === 0 ? (
        <View style={[styles.emptyCard, { backgroundColor: theme.cardBg, borderColor: theme.border }]}>
          <Text style={[styles.emptyText, { color: theme.subText }]}>No transactions recorded on this day.</Text>
        </View>
      ) : (
        dayTransactions.map((item) => {
          const formattedDate = formatTransactionDate(item.date);
          const subtitleParts = [item.account_name];
          if (item.note) subtitleParts.push(item.note);
          if (formattedDate) subtitleParts.push(formattedDate);
          const subtitleText = subtitleParts.join(' • ');

          return (
            <View key={item.id} style={[styles.txCard, { backgroundColor: theme.cardBg, borderColor: theme.border }]}>
              <View style={styles.leftContent}>
                <Text style={[styles.txCategory, { color: theme.text }]} numberOfLines={1}>{item.category_name}</Text>
                <Text style={[styles.txAccount, { color: theme.subText }]} numberOfLines={1}>
                  {subtitleText}
                </Text>
              </View>
              <Text style={[styles.txAmount, item.type === 'income' ? styles.income : styles.expense]}>
                {item.type === 'income' ? '+' : '-'}₱{Number(item.amount).toLocaleString('en-US', { minimumFractionDigits: 2 })}
              </Text>
            </View>
          );
        })
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 14, paddingTop: 45 },
  scrollContent: { paddingBottom: 120 }, 
  headerRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 14 },
  backBtn: { marginRight: 12 },
  headerTitle: { fontSize: 18, fontWeight: '700' },
  calendarStyle: { borderRadius: 12, overflow: 'hidden', marginBottom: 12, borderWidth: 1, borderColor: '#334155' },
  
  // Custom Cell Styles
  dayCell: { width: 32, height: 38, alignItems: 'center', justifyContent: 'center' },
  dayNum: { fontSize: 12 },
  cellExpenseText: { fontSize: 8, color: '#EF4444', fontWeight: '700', marginTop: 1 },

  // Summary Card Styles
  daySummaryCard: {
    flexDirection: 'row',
    padding: 15,
    borderRadius: 10,
    borderWidth: 1,
    marginBottom: 12,
    alignItems: 'center',
  },
  summaryItem: { flex: 1, alignItems: 'center' },
  summaryItemLabel: { fontSize: 10, textTransform: 'uppercase', fontWeight: '700', marginBottom: 2 },
  summaryItemAmount: { fontSize: 14, fontWeight: '700' },
  summaryDivider: { width: 1, height: '80%' },

  sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
  subHeaderTitle: { fontSize: 14, fontWeight: '700' },
  countBadge: { fontSize: 11, fontWeight: '600' },
  emptyCard: { padding: 16, borderRadius: 10, alignItems: 'center', borderWidth: 1, marginBottom: 20 },
  emptyText: { textAlign: 'center', fontSize: 12 },
  txCard: { height: 56, paddingHorizontal: 12, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', borderRadius: 10, marginBottom: 8, borderWidth: 1 },
  leftContent: { flex: 1, marginRight: 8 },
  txCategory: { fontSize: 13, fontWeight: '600' },
  txAccount: { fontSize: 10, marginTop: 2 },
  txAmount: { fontSize: 14, fontWeight: '700' },
  income: { color: '#10B981' },
  expense: { color: '#EF4444' }
});