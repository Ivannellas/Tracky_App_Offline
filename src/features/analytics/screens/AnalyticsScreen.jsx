import React, { useState, useEffect, useContext } from 'react';
import { StyleSheet, Text, View, ScrollView, TouchableOpacity, TextInput, Modal } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { PieChart, BarChart } from 'react-native-gifted-charts';
import { getCategorySpendingForMonth, getMonthlyTotals } from '../../../api/analyticsRepo';
import { updateCategoryBudget } from '../../../api/categoriesRepo';
import { ThemeContext } from '../../../context/ThemeContext';

// Palette of distinct, high-contrast flat colors to prevent duplicate category colors
const DISTINCT_PALETTE = [
  '#8B5CF6', // Purple
  '#3B82F6', // Blue
  '#10B981', // Emerald Green
  '#F59E0B', // Amber
  '#EF4444', // Red
  '#EC4899', // Pink
  '#06B6D4', // Cyan
  '#84CC16', // Lime
  '#F97316', // Orange
  '#6366F1', // Indigo
];

export default function AnalyticsScreen({ navigation }) {
  const { theme } = useContext(ThemeContext);

  const [currentDate, setCurrentDate] = useState(new Date());
  const [breakdown, setBreakdown] = useState([]);
  const [totals, setTotals] = useState({ income: 0, expense: 0 });
  const [activeTab, setActiveTab] = useState('budgets'); // 'budgets' | 'charts' | 'breakdown'

  // Interactive Donut Center Focus State
  const [focusedSlice, setFocusedSlice] = useState(null);

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
    const fetchedBreakdown = getCategorySpendingForMonth(monthString);
    setBreakdown(fetchedBreakdown);
    setTotals(getMonthlyTotals(monthString));
    setFocusedSlice(null); // Reset focus on month change
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

  const totalFlow = totalIncome + totalExpense;
  const incomePercent = totalFlow > 0 ? (totalIncome / totalFlow) * 100 : 0;
  const expensePercent = totalFlow > 0 ? (totalExpense / totalFlow) * 100 : 0;

  // Filter expenses and assign guaranteed unique colors if duplicates or defaults exist
  const expenseBreakdown = breakdown
    .filter((item) => item.type === 'expense')
    .map((item, index) => {
      const itemColor =
        item.color && item.color !== '#8B5CF6'
          ? item.color
          : DISTINCT_PALETTE[index % DISTINCT_PALETTE.length];

      return {
        ...item,
        displayColor: itemColor,
      };
    });

  // Calculate Financial Insight Text
  const topCategory = expenseBreakdown.length > 0
    ? [...expenseBreakdown].sort((a, b) => (b.total || 0) - (a.total || 0))[0]
    : null;

  const topCategoryPercent = topCategory && totalExpense > 0
    ? ((topCategory.total / totalExpense) * 100).toFixed(0)
    : 0;

  // Format Data for Gifted Pie Chart with interactive press handlers
  const pieData = expenseBreakdown.map((item) => ({
    value: item.total || 0,
    color: item.displayColor,
    text: `${item.category_name}`,
    onPress: () => setFocusedSlice(item),
  }));

  // Format Data for Gifted Bar Chart
  const barData = [
    {
      value: totalIncome,
      label: 'Income',
      frontColor: '#10B981',
      topLabelComponent: () => (
        <Text style={{ color: '#10B981', fontSize: 10, fontWeight: 'bold', marginBottom: 4 }}>
          ₱{totalIncome >= 1000 ? `${(totalIncome / 1000).toFixed(1)}k` : totalIncome}
        </Text>
      ),
    },
    {
      value: totalExpense,
      label: 'Expenses',
      frontColor: '#EF4444',
      topLabelComponent: () => (
        <Text style={{ color: '#EF4444', fontSize: 10, fontWeight: 'bold', marginBottom: 4 }}>
          ₱{totalExpense >= 1000 ? `${(totalExpense / 1000).toFixed(1)}k` : totalExpense}
        </Text>
      ),
    },
  ];

  return (
    <View style={[styles.container, { backgroundColor: theme.bg }]}>
      <Text style={[styles.title, { color: theme.text }]}>Financial Analytics</Text>

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

        {/* --- SMART FINANCIAL HEALTH INSIGHT BANNER --- */}
        {totalExpense > 0 && topCategory && (
          <View style={[styles.insightCard, { backgroundColor: theme.cardBg, borderColor: theme.border }]}>
            <Ionicons name="bulb-outline" size={18} color={theme.primary} style={{ marginTop: 2 }} />
            <View style={{ flex: 1, marginLeft: 8 }}>
              <Text style={[styles.insightTitle, { color: theme.text }]}>Smart Insight</Text>
              <Text style={[styles.insightText, { color: theme.subText }]}>
                Your largest expense this month is <Text style={{ fontWeight: 'bold', color: theme.text }}>{topCategory.category_name}</Text>, taking up <Text style={{ fontWeight: 'bold', color: theme.primary }}>{topCategoryPercent}%</Text> of total spending.
              </Text>
            </View>
          </View>
        )}

        {/* --- VIEW 1: BUDGETS VIEW --- */}
        {activeTab === 'budgets' && (
          <>
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

            <Text style={[styles.sectionTitle, { color: theme.text }]}>Category Budgets & Spending</Text>

            {expenseBreakdown.length === 0 ? (
              <View style={[styles.emptyCard, { backgroundColor: theme.cardBg, borderColor: theme.border }]}>
                <Ionicons name="receipt-outline" size={36} color={theme.subText} style={{ marginBottom: 8 }} />
                <Text style={[styles.emptyTitle, { color: theme.text }]}>No Expenses Logged</Text>
                <Text style={[styles.emptySubText, { color: theme.subText }]}>
                  You haven't recorded any expenses for {monthLabel} yet.
                </Text>
                <TouchableOpacity
                  style={[styles.addTransactionBtn, { backgroundColor: theme.primary }]}
                  onPress={() => navigation?.navigate?.('Dashboard')}
                >
                  <Ionicons name="add" size={16} color="#FFFFFF" />
                  <Text style={styles.addTransactionBtnText}>Add Transaction</Text>
                </TouchableOpacity>
              </View>
            ) : (
              expenseBreakdown.map((item, index) => {
                const spent = item.total || 0;
                const budgetLimit = item.budget_limit || 0;
                const budgetRatio = budgetLimit > 0 ? (spent / budgetLimit) * 100 : 0;

                let barColor = item.displayColor;
                let alertText = '';
                if (budgetLimit > 0) {
                  if (budgetRatio >= 100) {
                    barColor = '#EF4444';
                    alertText = `⚠️ Over budget by ₱${(spent - budgetLimit).toLocaleString()}`;
                  } else if (budgetRatio >= 80) {
                    barColor = '#F59E0B';
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
                        <View style={[styles.colorDot, { backgroundColor: item.displayColor }]} />
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

                    <View style={[styles.progressTrack, { backgroundColor: theme.inputBg }]}>
                      <View
                        style={[
                          styles.progressFill,
                          {
                            width: `${Math.min(budgetLimit > 0 ? budgetRatio : (totalExpense > 0 ? (spent / totalExpense) * 100 : 0), 100)}%`,
                            backgroundColor: barColor,
                          },
                        ]}
                      />
                    </View>
                  </View>
                );
              })
            )}
          </>
        )}

        {/* --- VIEW 2: CHARTS VIEW (WITH TAP TOOLTIPS) --- */}
        {activeTab === 'charts' && (
          <View style={styles.viewSection}>
            <Text style={[styles.sectionTitle, { color: theme.text }]}>Visual Expense Distribution</Text>

            {expenseBreakdown.length === 0 ? (
              <View style={[styles.emptyCard, { backgroundColor: theme.cardBg, borderColor: theme.border }]}>
                <Ionicons name="pie-chart-outline" size={36} color={theme.subText} style={{ marginBottom: 8 }} />
                <Text style={[styles.emptyTitle, { color: theme.text }]}>No Chart Data Available</Text>
                <Text style={[styles.emptySubText, { color: theme.subText }]}>
                  Log transactions to generate visual spending charts.
                </Text>
                <TouchableOpacity
                  style={[styles.addTransactionBtn, { backgroundColor: theme.primary }]}
                  onPress={() => navigation?.navigate?.('Dashboard')}
                >
                  <Ionicons name="add" size={16} color="#FFFFFF" />
                  <Text style={styles.addTransactionBtnText}>Add Transaction</Text>
                </TouchableOpacity>
              </View>
            ) : (
              <>
                {/* 1. INTERACTIVE DONUT PIE CHART */}
                <View style={[styles.chartCard, { backgroundColor: theme.cardBg, borderColor: theme.border, alignItems: 'center' }]}>
                  <Text style={[styles.cardHeader, { color: theme.subText, alignSelf: 'flex-start' }]}>
                    Category Share Donut <Text style={{ fontSize: 10, fontStyle: 'italic' }}>(Tap slice to inspect)</Text>
                  </Text>

                  <View style={{ marginVertical: 16 }}>
                    <PieChart
                      data={pieData}
                      donut
                      showGradient={false}
                      radius={90}
                      innerRadius={55}
                      innerCircleColor={theme.cardBg}
                      centerLabelComponent={() => (
                        <TouchableOpacity
                          onPress={() => setFocusedSlice(null)}
                          activeOpacity={0.7}
                          style={{ alignItems: 'center', justifyContent: 'center', paddingHorizontal: 4, width: '100%', height: '100%' }}
                        >
                          <Text style={{ fontSize: 10, color: theme.subText, fontWeight: '600' }} numberOfLines={1}>
                            {focusedSlice ? focusedSlice.category_name : 'Total Spent'}
                          </Text>
                          <Text style={{ fontSize: 12, color: theme.text, fontWeight: 'bold' }} numberOfLines={1}>
                            ₱{focusedSlice ? focusedSlice.total.toLocaleString() : (totalExpense >= 1000 ? `${(totalExpense / 1000).toFixed(1)}k` : totalExpense)}
                          </Text>
                          {focusedSlice && (
                            <Text style={{ fontSize: 8, color: theme.primary, marginTop: 2 }}>Tap to Reset</Text>
                          )}
                        </TouchableOpacity>
                      )}
                    />
                  </View>

                  {/* Legend Grid */}
                  <View style={styles.legendContainer}>
                    {expenseBreakdown.map((item, idx) => {
                      const percent = totalExpense > 0 ? (item.total / totalExpense) * 100 : 0;
                      return (
                        <TouchableOpacity
                          key={idx}
                          style={styles.legendItem}
                          onPress={() => setFocusedSlice(item)}
                        >
                          <View style={[styles.legendDot, { backgroundColor: item.displayColor }]} />
                          <Text style={[styles.legendText, { color: theme.text }]}>
                            {item.category_name} ({percent.toFixed(0)}%)
                          </Text>
                        </TouchableOpacity>
                      );
                    })}
                  </View>
                </View>

                {/* 2. SOLID BAR CHART */}
                <Text style={[styles.sectionTitle, { color: theme.text, marginTop: 24 }]}>Cash Flow Comparison</Text>

                <View style={[styles.chartCard, { backgroundColor: theme.cardBg, borderColor: theme.border, paddingBottom: 20 }]}>
                  <Text style={[styles.cardHeader, { color: theme.subText }]}>Income vs Expenses Bar Chart</Text>

                  <View style={{ alignItems: 'center', marginTop: 20 }}>
                    <BarChart
                      data={barData}
                      barWidth={40}
                      initialSpacing={40}
                      spacing={50}
                      topRadius={6}
                      bottomRadius={2}
                      hideRules
                      showGradient={false}
                      xAxisThickness={1}
                      yAxisThickness={0}
                      xAxisColor={theme.border}
                      yAxisTextStyle={{ color: theme.subText, fontSize: 10 }}
                      noOfSections={3}
                      maxValue={Math.max(totalIncome, totalExpense, 100) * 1.2}
                    />
                  </View>
                </View>
              </>
            )}
          </View>
        )}

        {/* --- VIEW 3: BREAKDOWN VIEW --- */}
        {activeTab === 'breakdown' && (
          <View style={styles.viewSection}>
            <Text style={[styles.sectionTitle, { color: theme.text }]}>Category Breakdown & Share</Text>

            {expenseBreakdown.length === 0 ? (
              <View style={[styles.emptyCard, { backgroundColor: theme.cardBg, borderColor: theme.border }]}>
                <Ionicons name="list-outline" size={36} color={theme.subText} style={{ marginBottom: 8 }} />
                <Text style={[styles.emptyTitle, { color: theme.text }]}>No Breakdown Records</Text>
                <Text style={[styles.emptySubText, { color: theme.subText }]}>
                  Start logging entries to view category analytics.
                </Text>
                <TouchableOpacity
                  style={[styles.addTransactionBtn, { backgroundColor: theme.primary }]}
                  onPress={() => navigation?.navigate?.('Dashboard')}
                >
                  <Ionicons name="add" size={16} color="#FFFFFF" />
                  <Text style={styles.addTransactionBtnText}>Add Transaction</Text>
                </TouchableOpacity>
              </View>
            ) : (
              expenseBreakdown
                .sort((a, b) => (b.total || 0) - (a.total || 0))
                .map((item, index) => {
                  const spent = item.total || 0;
                  const sharePercent = totalExpense > 0 ? (spent / totalExpense) * 100 : 0;

                  return (
                    <View key={index} style={[styles.breakdownRow, { backgroundColor: theme.cardBg, borderColor: theme.border }]}>
                      <View style={styles.categoryHeader}>
                        <View style={[styles.colorDot, { backgroundColor: item.displayColor }]} />
                        <View>
                          <Text style={[styles.catName, { color: theme.text }]}>{item.category_name}</Text>
                          <Text style={[styles.shareText, { color: theme.subText }]}>{sharePercent.toFixed(1)}% of total expenses</Text>
                        </View>
                      </View>
                      <Text style={[styles.catAmount, { color: theme.text }]}>
                        ₱{spent.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                      </Text>
                    </View>
                  );
                })
            )}
          </View>
        )}
      </ScrollView>

      {/* --- FLOATING PILL VIEW SWITCHER --- */}
      <View style={[styles.floatingBar, { backgroundColor: theme.cardBg + 'E6', borderColor: theme.border }]}>
        <TouchableOpacity
          style={[styles.floatingBtn, activeTab === 'budgets' && { backgroundColor: theme.primary }]}
          onPress={() => setActiveTab('budgets')}
        >
          <Ionicons name="wallet-outline" size={15} color={activeTab === 'budgets' ? '#FFFFFF' : theme.subText} />
          <Text style={[styles.floatingBtnText, { color: theme.subText }, activeTab === 'budgets' && styles.activeBtnText]}>
            Budgets
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.floatingBtn, activeTab === 'charts' && { backgroundColor: theme.primary }]}
          onPress={() => setActiveTab('charts')}
        >
          <Ionicons name="pie-chart-outline" size={15} color={activeTab === 'charts' ? '#FFFFFF' : theme.subText} />
          <Text style={[styles.floatingBtnText, { color: theme.subText }, activeTab === 'charts' && styles.activeBtnText]}>
            Charts
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.floatingBtn, activeTab === 'breakdown' && { backgroundColor: theme.primary }]}
          onPress={() => setActiveTab('breakdown')}
        >
          <Ionicons name="list-outline" size={15} color={activeTab === 'breakdown' ? '#FFFFFF' : theme.subText} />
          <Text style={[styles.floatingBtnText, { color: theme.subText }, activeTab === 'breakdown' && styles.activeBtnText]}>
            Breakdown
          </Text>
        </TouchableOpacity>
      </View>

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
              placeholder="0.00"
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
  container: { flex: 1, padding: 14, paddingTop: 45 },
  title: { fontSize: 20, fontWeight: '700' },
  monthPicker: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderRadius: 10,
    paddingHorizontal: 10,
    paddingVertical: 8,
    marginTop: 10,
    marginBottom: 12,
    borderWidth: 1,
  },
  monthLabel: { fontSize: 14, fontWeight: '600' },
  arrowBtn: { padding: 2 },
  scrollContent: { paddingBottom: 95 },
  insightCard: {
    flexDirection: 'row',
    padding: 10,
    borderRadius: 10,
    marginBottom: 12,
    borderWidth: 1,
    alignItems: 'flex-start',
  },
  insightTitle: { fontSize: 10, fontWeight: '700', textTransform: 'uppercase', marginBottom: 2 },
  insightText: { fontSize: 11, lineHeight: 15 },
  summaryCard: { padding: 14, borderRadius: 12, marginBottom: 14, borderWidth: 1 },
  cardHeader: { fontSize: 11, textTransform: 'uppercase', fontWeight: '700', marginBottom: 8 },
  statRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 10 },
  statLabel: { fontSize: 11, marginBottom: 2 },
  statValue: { fontSize: 16, fontWeight: '700' },
  incomeText: { color: '#10B981' },
  expenseText: { color: '#EF4444' },
  ratioBarContainer: { height: 6, borderRadius: 3, flexDirection: 'row', overflow: 'hidden', marginBottom: 10 },
  incomeBar: { height: '100%', backgroundColor: '#10B981' },
  expenseBar: { height: '100%', backgroundColor: '#EF4444' },
  netRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingTop: 8, borderTopWidth: 1 },
  netLabel: { fontSize: 12, fontWeight: '500' },
  netValue: { fontSize: 14, fontWeight: '700' },
  sectionTitle: { fontSize: 15, fontWeight: '700', marginBottom: 10 },
  categoryCard: { padding: 12, borderRadius: 10, marginBottom: 8, borderWidth: 1 },
  rowBetween: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 },
  categoryHeader: { flexDirection: 'row', alignItems: 'center' },
  colorDot: { width: 8, height: 8, borderRadius: 4, marginRight: 6 },
  catName: { fontSize: 13, fontWeight: '600' },
  budgetBtn: { paddingHorizontal: 6, paddingVertical: 2 },
  budgetBtnText: { fontSize: 11, fontWeight: '600' },
  spendingRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 },
  catAmount: { fontSize: 14, fontWeight: '700' },
  budgetSubText: { fontSize: 10, fontWeight: '500' },
  progressTrack: { height: 5, borderRadius: 2.5, overflow: 'hidden', marginBottom: 2 },
  progressFill: { height: '100%', borderRadius: 2.5 },
  emptyCard: { padding: 24, borderRadius: 12, alignItems: 'center', borderWidth: 1, marginVertical: 8 },
  emptyTitle: { fontSize: 14, fontWeight: '700', marginBottom: 4 },
  emptySubText: { fontSize: 11, textAlign: 'center', marginBottom: 12 },
  addTransactionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
  },
  addTransactionBtnText: { color: '#FFFFFF', fontWeight: '700', fontSize: 12 },
  viewSection: { marginTop: 2 },
  chartCard: { padding: 14, borderRadius: 12, borderWidth: 1 },
  legendContainer: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 12 },
  legendItem: { flexDirection: 'row', alignItems: 'center' },
  legendDot: { width: 6, height: 6, borderRadius: 3, marginRight: 4 },
  legendText: { fontSize: 11, fontWeight: '500' },
  breakdownRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 12, borderRadius: 10, marginBottom: 8, borderWidth: 1 },
  shareText: { fontSize: 10, marginTop: 1 },
  floatingBar: {
    position: 'absolute',
    bottom: 16,
    alignSelf: 'center',
    flexDirection: 'row',
    borderRadius: 24,
    borderWidth: 1,
    padding: 3,
    gap: 2,
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
  },
  floatingBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 18,
  },
  floatingBtnText: { fontSize: 12, fontWeight: '600' },
  activeBtnText: { color: '#FFFFFF', fontWeight: '700' },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.7)', justifyContent: 'center', alignItems: 'center', padding: 20 },
  modalContainer: { width: '100%', borderRadius: 14, padding: 16, borderWidth: 1, borderColor: '#334155' },
  modalTitle: { fontSize: 16, fontWeight: '700', marginBottom: 12 },
  label: { fontSize: 12, marginBottom: 4 },
  input: { padding: 10, borderRadius: 8, fontSize: 14, borderWidth: 1, marginBottom: 16 },
  modalActionRow: { flexDirection: 'row', gap: 8 },
  cancelBtn: { flex: 1, padding: 12, borderRadius: 8, borderWidth: 1, alignItems: 'center' },
  cancelBtnText: { fontWeight: '600', fontSize: 13 },
  saveBtn: { flex: 1, padding: 12, borderRadius: 8, alignItems: 'center' },
  saveBtnText: { color: '#FFFFFF', fontWeight: '700', fontSize: 13 },
});