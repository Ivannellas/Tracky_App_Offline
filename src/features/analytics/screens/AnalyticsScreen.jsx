import React, { useState, useEffect, useContext } from 'react';
import { StyleSheet, Text, View, ScrollView, TouchableOpacity, TextInput, Modal } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { getCategorySpendingForMonth, getMonthlyTotals } from '../../../api/analyticsRepo';
import { updateCategoryBudget } from '../../../api/categoriesRepo';
import { ThemeContext } from '../../../context/ThemeContext'; // <-- Import Theme Context

export default function AnalyticsScreen() {
  const { theme } = useContext(ThemeContext); // <-- Access theme values

  const [currentDate, setCurrentDate] = useState(new Date());
  const [breakdown, setBreakdown] = useState([]);
  const [totals, setTotals] = useState({ income: 0, expense: 0 });

  // Budget Editing State
  const [budgetModalVisible, setBudgetModalVisible] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [budgetInput, setBudgetInput] = useState('');

  const monthString = currentDate.toISOString().slice(0, 7); // 'YYYY-MM'
  const monthLabel = currentDate.toLocaleString('default', { month: 'long', year: 'numeric' });

  useEffect(() => {
    loadAnalytics();
  }, [monthString]);

  const loadAnalytics = () => {
    setBreakdown(getCategorySpendingForMonth(monthString));
    setTotals(getMonthlyTotals(monthString));
  };

  const changeMonth = (direction) => {
    const newDate = new Date(currentDate);
    newDate.setMonth(newDate.getMonth() + direction);
    setCurrentDate(newDate);
  };

  const handleOpenBudgetModal = (item) => {
    setSelectedCategory(item);
    setBudgetInput(item.budget_limit ? item.budget_limit.toString() : '');
    setBudgetModalVisible(true);
  };

  const handleSaveBudget = () => {
    if (!selectedCategory) return;
    const limitVal = parseFloat(budgetInput) || 0;
    updateCategoryBudget(selectedCategory.category_id, limitVal);
    setBudgetModalVisible(false);
    loadAnalytics();
  };

  const totalExpense = totals.expense;
  const totalIncome = totals.income;
  const netSavings = totalIncome - totalExpense;

  // Calculate Income vs Expense Bar ratios
  const totalFlow = totalIncome + totalExpense;
  const incomePercent = totalFlow > 0 ? (totalIncome / totalFlow) * 100 : 0;
  const expensePercent = totalFlow > 0 ? (totalExpense / totalFlow) * 100 : 0;

  return (
    <View style={[styles.container, { backgroundColor: theme.bg }]}>
      <Text style={[styles.title, { color: theme.text }]}>Financial Analytics & Budgets</Text>

      {/* Month Switcher Header */}
      <View style={[styles.monthPicker, { backgroundColor: theme.cardBg, borderColor: theme.border }]}>
        <TouchableOpacity onPress={() => changeMonth(-1)} style={styles.arrowBtn}>
          <Ionicons name="chevron-back" size={20} color={theme.text} />
        </TouchableOpacity>
        <Text style={[styles.monthLabel, { color: theme.text }]}>{monthLabel}</Text>
        <TouchableOpacity onPress={() => changeMonth(1)} style={styles.arrowBtn}>
          <Ionicons name="chevron-forward" size={20} color={theme.text} />
        </TouchableOpacity>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        {/* Income vs Expense Overview Card */}
        <View style={[styles.summaryCard, { backgroundColor: theme.cardBg, borderColor: theme.border }]}>
          <Text style={[styles.cardHeader, { color: theme.subText }]}>Monthly Cash Flow</Text>
          
          <View style={styles.statRow}>
            <View>
              <Text style={[styles.statLabel, { color: theme.subText }]}>Income</Text>
              <Text style={[styles.statValue, styles.incomeText]}>
                +₱{totalIncome.toLocaleString('en-US', { minimumFractionDigits: 2 })}
              </Text>
            </View>
            <View style={{ alignItems: 'flex-end' }}>
              <Text style={[styles.statLabel, { color: theme.subText }]}>Expenses</Text>
              <Text style={[styles.statValue, styles.expenseText]}>
                -₱{totalExpense.toLocaleString('en-US', { minimumFractionDigits: 2 })}
              </Text>
            </View>
          </View>

          {/* Visual Income vs Expense Ratio Bar */}
          <View style={[styles.ratioBarContainer, { backgroundColor: theme.inputBg }]}>
            <View style={[styles.incomeBar, { width: `${incomePercent}%` }]} />
            <View style={[styles.expenseBar, { width: `${expensePercent}%` }]} />
          </View>

          <View style={[styles.netRow, { borderTopColor: theme.border }]}>
            <Text style={[styles.netLabel, { color: theme.subText }]}>Net Cash Flow:</Text>
            <Text style={[styles.netValue, netSavings >= 0 ? styles.incomeText : styles.expenseText]}>
              {netSavings >= 0 ? '+' : ''}₱{netSavings.toLocaleString('en-US', { minimumFractionDigits: 2 })}
            </Text>
          </View>
        </View>

        {/* Category Spending Breakdown Chart & Budgets */}
        <Text style={[styles.sectionTitle, { color: theme.text }]}>Category Budgets & Spending</Text>

        {breakdown.filter(i => i.type === 'expense').length === 0 ? (
          <View style={[styles.emptyCard, { backgroundColor: theme.cardBg, borderColor: theme.border }]}>
            <Text style={[styles.emptyText, { color: theme.subText }]}>No expenses logged for {monthLabel}.</Text>
          </View>
        ) : (
          breakdown
            .filter(item => item.type === 'expense')
            .map((item, index) => {
              const spent = item.total || 0;
              const budgetLimit = item.budget_limit || 0;
              const budgetRatio = budgetLimit > 0 ? (spent / budgetLimit) * 100 : 0;

              let barColor = item.color || '#EF4444';
              let alertText = '';
              if (budgetLimit > 0) {
                if (budgetRatio >= 100) {
                  barColor = '#EF4444'; // Red: Over budget
                  alertText = `⚠️ Over budget by ₱${(spent - budgetLimit).toLocaleString()}`;
                } else if (budgetRatio >= 80) {
                  barColor = '#F59E0B'; // Orange: Nearing limit (80%+)
                  alertText = `⚠️ Approaching limit (${budgetRatio.toFixed(0)}%)`;
                } else {
                  alertText = `₱${(budgetLimit - spent).toLocaleString()} remaining`;
                }
              } else {
                alertText = 'No monthly budget set';
              }

              return (
                <View key={index} style={[styles.categoryCard, { backgroundColor: theme.cardBg, borderColor: theme.border }]}>
                  <View style={styles.rowBetween}>
                    <View style={styles.categoryHeader}>
                      <View style={[styles.colorDot, { backgroundColor: item.color || '#EF4444' }]} />
                      <Text style={[styles.catName, { color: theme.text }]}>{item.category_name}</Text>
                    </View>
                    <TouchableOpacity onPress={() => handleOpenBudgetModal(item)} style={styles.budgetBtn}>
                      <Text style={[styles.budgetBtnText, { color: theme.primary }]}>
                        {budgetLimit > 0 ? `Budget: ₱${budgetLimit.toLocaleString()}` : '+ Set Budget'}
                      </Text>
                    </TouchableOpacity>
                  </View>

                  <View style={styles.spendingRow}>
                    <Text style={[styles.catAmount, { color: theme.text }]}>
                      ₱{spent.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                    </Text>
                    <Text style={[styles.budgetSubText, { color: budgetRatio >= 100 ? '#EF4444' : budgetRatio >= 80 ? '#F59E0B' : theme.subText }]}>
                      {alertText}
                    </Text>
                  </View>

                  {/* Progress Chart Bar */}
                  <View style={[styles.progressTrack, { backgroundColor: theme.inputBg }]}>
                    <View 
                      style={[
                        styles.progressFill, 
                        { 
                          width: `${Math.min(budgetLimit > 0 ? budgetRatio : (totalExpense > 0 ? (spent / totalExpense) * 100 : 0), 100)}%`, 
                          backgroundColor: barColor 
                        }
                      ]} 
                    />
                  </View>
                </View>
              );
            })
        )}
      </ScrollView>

      {/* Set Budget Modal */}
      <Modal visible={budgetModalVisible} animationType="fade" transparent={true}>
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContainer, { backgroundColor: theme.cardBg }]}>
            <Text style={[styles.modalTitle, { color: theme.text }]}>
              Set Budget for {selectedCategory?.category_name}
            </Text>
            <Text style={[styles.label, { color: theme.subText }]}>Monthly Spending Cap (₱)</Text>
            <TextInput
              style={[styles.input, { backgroundColor: theme.inputBg, color: theme.text, borderColor: theme.border }]}
              placeholder="e.g. 5000"
              placeholderTextColor={theme.subText}
              keyboardType="numeric"
              value={budgetInput}
              onChangeText={setBudgetInput}
            />

            <View style={styles.modalActionRow}>
              <TouchableOpacity style={[styles.cancelBtn, { borderColor: theme.border }]} onPress={() => setBudgetModalVisible(false)}>
                <Text style={[styles.cancelBtnText, { color: theme.subText }]}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[styles.saveBtn, { backgroundColor: theme.primary }]} onPress={handleSaveBudget}>
                <Text style={styles.saveBtnText}>Save Budget</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 20, paddingTop: 50 },
  title: { fontSize: 22, fontWeight: 'bold' },
  monthPicker: { 
    flexDirection: 'row', 
    justifyContent: 'space-between', 
    alignItems: 'center', 
    borderRadius: 12, 
    paddingHorizontal: 12, 
    paddingVertical: 10, 
    marginTop: 14, 
    marginBottom: 16,
    borderWidth: 1
  },
  monthLabel: { fontSize: 16, fontWeight: 'bold' },
  arrowBtn: { padding: 4 },
  scrollContent: { paddingBottom: 40 },
  summaryCard: { padding: 18, borderRadius: 16, marginBottom: 20, borderWidth: 1 },
  cardHeader: { fontSize: 12, textTransform: 'uppercase', fontWeight: 'bold', marginBottom: 12 },
  statRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 14 },
  statLabel: { fontSize: 12, marginBottom: 2 },
  statValue: { fontSize: 18, fontWeight: 'bold' },
  incomeText: { color: '#10B981' },
  expenseText: { color: '#EF4444' },
  ratioBarContainer: { height: 10, borderRadius: 5, flexDirection: 'row', overflow: 'hidden', marginBottom: 14 },
  incomeBar: { height: '100%', backgroundColor: '#10B981' },
  expenseBar: { height: '100%', backgroundColor: '#EF4444' },
  netRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingTop: 10, borderTopWidth: 1 },
  netLabel: { fontSize: 13, fontWeight: '600' },
  netValue: { fontSize: 16, fontWeight: 'bold' },
  sectionTitle: { fontSize: 17, fontWeight: 'bold', marginBottom: 12 },
  categoryCard: { padding: 14, borderRadius: 12, marginBottom: 10, borderWidth: 1 },
  rowBetween: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 },
  categoryHeader: { flexDirection: 'row', alignItems: 'center' },
  colorDot: { width: 10, height: 10, borderRadius: 5, marginRight: 8 },
  catName: { fontSize: 14, fontWeight: '600' },
  budgetBtn: { paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6 },
  budgetBtnText: { fontSize: 12, fontWeight: '600' },
  spendingRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
  catAmount: { fontSize: 15, fontWeight: 'bold' },
  budgetSubText: { fontSize: 11, fontWeight: '600' },
  progressTrack: { height: 6, borderRadius: 3, overflow: 'hidden', marginBottom: 2 },
  progressFill: { height: '100%', borderRadius: 3 },
  emptyCard: { padding: 24, borderRadius: 12, alignItems: 'center', borderWidth: 1 },
  emptyText: {},
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.7)', justifyContent: 'center', alignItems: 'center', padding: 20 },
  modalContainer: { width: '100%', borderRadius: 16, padding: 20, borderWidth: 1, borderColor: '#334155' },
  modalTitle: { fontSize: 18, fontWeight: 'bold', marginBottom: 16 },
  label: { fontSize: 13, marginBottom: 6 },
  input: { padding: 12, borderRadius: 10, fontSize: 16, borderWidth: 1, marginBottom: 20 },
  modalActionRow: { flexDirection: 'row', gap: 10 },
  cancelBtn: { flex: 1, padding: 14, borderRadius: 10, borderWidth: 1, alignItems: 'center' },
  cancelBtnText: { fontWeight: '600' },
  saveBtn: { flex: 1, padding: 14, borderRadius: 10, alignItems: 'center' },
  saveBtnText: { color: '#FFFFFF', fontWeight: 'bold' },
});