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
      const results = db.getAllSync(`SELECT date, type FROM transactions`);
      
      const marks = {};
      results.forEach((tx) => {
        if (!tx.date) return;
        const dateKey = tx.date.split('T')[0];
        marks[dateKey] = {
          marked: true,
          dotColor: tx.type === 'expense' ? '#EF4444' : '#10B981',
        };
      });

      marks[selectedDate] = {
        ...(marks[selectedDate] || {}),
        selected: true,
        selectedColor: theme.primary,
      };

      setMarkedDates(marks);
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

  return (
    <ScrollView style={[styles.container, { backgroundColor: theme.bg }]}>
      {/* Header Row with Back Option */}
      <View style={styles.headerRow}>
        <TouchableOpacity onPress={onBack} style={styles.backBtn}>
          <Text style={{ color: theme.primary, fontSize: 16, fontWeight: '600' }}>‹ Back</Text>
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: theme.text }]}>Calendar View</Text>
      </View>

      {/* Calendar UI */}
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
  container: { flex: 1, padding: 20, paddingTop: 50, paddingBottom: 50 },
  headerRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 20 },
  backBtn: { marginRight: 15 },
  headerTitle: { fontSize: 20, fontWeight: 'bold' },
  calendarStyle: { borderRadius: 16, overflow: 'hidden', marginBottom: 20, borderWidth: 1, borderColor: '#334155' },
  sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  subHeaderTitle: { fontSize: 16, fontWeight: 'bold' },
  countBadge: { fontSize: 13 },
  emptyCard: { padding: 20, borderRadius: 12, alignItems: 'center', borderWidth: 1, marginBottom: 30 },
  emptyText: { textAlign: 'center' },
  txCard: { height: 64, paddingHorizontal: 14, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', borderRadius: 12, marginBottom: 8, borderWidth: 1 },
  leftContent: { flex: 1, marginRight: 10 },
  txCategory: { fontSize: 14, fontWeight: '600' },
  txAccount: { fontSize: 11, marginTop: 2 },
  txAmount: { fontSize: 15, fontWeight: 'bold' },
  income: { color: '#10B981' },
  expense: { color: '#EF4444' }
});