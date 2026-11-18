import React, { useState, useEffect, useContext } from 'react';
import { StyleSheet, Text, View, ScrollView, TouchableOpacity, TextInput, Modal } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { PieChart, BarChart } from 'react-native-gifted-charts';
import { getCategorySpendingForMonth, getMonthlyTotals } from '../../../api/analyticsRepo';
import { getAllCategories, updateCategoryBudget } from '../../../api/categoriesRepo';
import { ThemeContext } from '../../../context/ThemeContext';

const DISTINCT_PALETTE = [
  '#8B5CF6', '#3B82F6', '#10B981', '#F59E0B', 
  '#EF4444', '#EC4899', '#06B6D4', '#84CC16', 
  '#F97316', '#6366F1'
];

export default function AnalyticsScreen({ navigation }) {
  const { theme } = useContext(ThemeContext);

  const [currentDate, setCurrentDate] = useState(new Date());
  const [cycleMode, setCycleMode] = useState('full'); // 'full' | 'first_half' (1-15) | 'second_half' (16-EOM)
  const [breakdown, setBreakdown] = useState([]);
  const [totals, setTotals] = useState({ income: 0, expense: 0 });
  const [activeTab, setActiveTab] = useState('overview'); // 'overview' | 'budgets' | 'charts' | 'breakdown'

  // Interactive Donut Center Focus State
  const [focusedSlice, setFocusedSlice] = useState(null);

  // Budget Editing State
  const [budgetModalVisible, setBudgetModalVisible] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [budgetInput, setBudgetInput] = useState('');

  const year = currentDate.getFullYear();
  const month = String(currentDate.getMonth() + 1).padStart(2, '0');
  const monthString = `${year}-${month}`; // 'YYYY-MM'
  
  const monthLabel = currentDate.toLocaleString('default', { month: 'long', year: 'numeric' });
  const cycleLabel = cycleMode === 'full' 
    ? monthLabel 
    : cycleMode === 'first_half' 
      ? `1st Payday (1–15), ${monthLabel}` 
      : `15th Payday (16–EOM), ${monthLabel}`;

  useEffect(() => {
    loadAnalytics();
  }, [monthString, cycleMode]);

  const loadAnalytics = () => {
    let startDay = 1;
    let endDay = 31;

    if (cycleMode === 'first_half') {
      startDay = 1;
      endDay = 15;
    } else if (cycleMode === 'second_half') {
      startDay = 16;
      endDay = 31;
    }

    // 1. Fetch filtered spending breakdown and totals directly from DB
    const fetchedBreakdown = getCategorySpendingForMonth(monthString, startDay, endDay) || [];
    const fetchedTotals = getMonthlyTotals(monthString, startDay, endDay) || { income: 0, expense: 0 };
    const allCategories = getAllCategories() || [];

    // 2. Merge with all categories so categories with 0 spending in this cycle still show up in budget lists
    const spendingMap = {};
    fetchedBreakdown.forEach(item => {
      spendingMap[item.category_id] = item;
    });

    const mergedBreakdown = allCategories.map(cat => {
      const existing = spendingMap[cat.id];
      return {
        category_id: cat.id,
        category_name: cat.name,
        type: cat.type,
        total: existing ? existing.total : 0,
        color: cat.color,
        budget_limit: cat.budget_limit || 0
      };
    });

    setBreakdown(mergedBreakdown);
    setTotals(fetchedTotals);
    setFocusedSlice(null);
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
  const savingsRate = totalIncome > 0 ? ((netSavings / totalIncome) * 100).toFixed(1) : 0;

  const totalFlow = totalIncome + totalExpense;
  const incomePercent = totalFlow > 0 ? (totalIncome / totalFlow) * 100 : 0;
  const expensePercent = totalFlow > 0 ? (totalExpense / totalFlow) * 100 : 0;

  const expenseBreakdown = breakdown
    .filter((item) => item.type === 'expense')
    .map((item, index) => ({
      ...item,
      displayColor: item.color && item.color !== '#8B5CF6' ? item.color : DISTINCT_PALETTE[index % DISTINCT_PALETTE.length],
    }));

  const topCategory = expenseBreakdown.length > 0
    ? [...expenseBreakdown].sort((a, b) => (b.total || 0) - (a.total || 0))[0]
    : null;

  const topCategoryPercent = topCategory && totalExpense > 0
    ? ((topCategory.total / totalExpense) * 100).toFixed(0)
    : 0;

  const pieData = expenseBreakdown
    .filter(item => item.total > 0)
    .map((item) => ({
      value: item.total || 0,
      color: item.displayColor,
      text: item.category_name,
      onPress: () => setFocusedSlice(item),
    }));

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
        <TouchableOpacity onPress={() => changeMonth(-1)} style={styles.arrowBtn} activeOpacity={0.7}>
          <Ionicons name="chevron-back" size={20} color={theme.text} />
        </TouchableOpacity>
        <Text style={[styles.monthLabel, { color: theme.text }]}>{cycleLabel}</Text>
        <TouchableOpacity onPress={() => changeMonth(1)} style={styles.arrowBtn} activeOpacity={0.7}>
          <Ionicons name="chevron-forward" size={20} color={theme.text} />
        </TouchableOpacity>
      </View>

      {/* --- PAYDAY CYCLE TOGGLE PILL --- */}
      <View style={[styles.cycleToggleRow, { backgroundColor: theme.cardBg, borderColor: theme.border }]}>
        <TouchableOpacity
          style={[styles.cycleBtn, cycleMode === 'full' && { backgroundColor: theme.primary }]}
          onPress={() => setCycleMode('full')}
          activeOpacity={0.8}
        >
          <Text style={[styles.cycleBtnText, { color: theme.subText }, cycleMode === 'full' && styles.activeCycleText]}>
            Full Month
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.cycleBtn, cycleMode === 'first_half' && { backgroundColor: theme.primary }]}
          onPress={() => setCycleMode('first_half')}
          activeOpacity={0.8}
        >
          <Text style={[styles.cycleBtnText, { color: theme.subText }, cycleMode === 'first_half' && styles.activeCycleText]}>
            1st Payday (1–15)
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.cycleBtn, cycleMode === 'second_half' && { backgroundColor: theme.primary }]}
          onPress={() => setCycleMode('second_half')}
          activeOpacity={0.8}
        >
          <Text style={[styles.cycleBtnText, { color: theme.subText }, cycleMode === 'second_half' && styles.activeCycleText]}>
            2nd Payday (16–EOM)
          </Text>
        </TouchableOpacity>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>

        {/* --- VIEW 0: OVERVIEW & HEALTH SCORECARD --- */}
        {activeTab === 'overview' && (
          <>
            <View style={[styles.healthCard, { backgroundColor: theme.cardBg, borderColor: theme.border }]}>
              <View style={styles.healthHeaderRow}>
                <View style={styles.healthBadgeContainer}>
                  <Ionicons 
                    name={netSavings >= 0 ? "shield-checkmark" : "warning-outline"} 
                    size={20} 
                    color={netSavings >= 0 ? "#10B981" : "#EF4444"} 
                  />
                  <Text style={[styles.healthBadgeText, { color: netSavings >= 0 ? "#10B981" : "#EF4444" }]}>
                    {netSavings >= 0 ? 'Healthy Cash Flow' : 'Deficit Alert'}
                  </Text>
                </View>
                <Text style={[styles.savingsRateText, { color: theme.subText }]}>
                  Savings Rate: <Text style={{ fontWeight: '700', color: netSavings >= 0 ? '#10B981' : '#EF4444' }}>{savingsRate}%</Text>
                </Text>
              </View>

              <Text style={[styles.healthDescription, { color: theme.subText }]}>
                {netSavings >= 0 
                  ? `You are keeping ₱${netSavings.toLocaleString('en-US', { minimumFractionDigits: 2 })} during this cycle. Great discipline!`
                  : `You have spent ₱${Math.abs(netSavings).toLocaleString('en-US', { minimumFractionDigits: 2 })} more than your income in this cycle.`}
              </Text>
            </View>

            {totalExpense > 0 && topCategory && topCategory.total > 0 && (
              <View style={[styles.insightCard, { backgroundColor: theme.cardBg, borderColor: theme.border }]}>
                <Ionicons name="bulb-outline" size={18} color={theme.primary} style={{ marginTop: 2 }} />
                <View style={{ flex: 1, marginLeft: 8 }}>
                  <Text style={[styles.insightTitle, { color: theme.text }]}>Spending Spotlight</Text>
                  <Text style={[styles.insightText, { color: theme.subText }]}>
                    Your largest expense is <Text style={{ fontWeight: 'bold', color: theme.text }}>{topCategory.category_name}</Text>, taking up <Text style={{ fontWeight: 'bold', color: theme.primary }}>{topCategoryPercent}%</Text> of cycle spending.
                  </Text>
                </View>
              </View>
            )}

            <View style={[styles.summaryCard, { backgroundColor: theme.cardBg, borderColor: theme.border }]}>
              <Text style={[styles.cardHeader, { color: theme.subText }]}>Cycle Cash Flow Breakdown</Text>

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

            <TouchableOpacity 
              style={[styles.quickJumpBtn, { backgroundColor: theme.cardBg, borderColor: theme.border }]}
              onPress={() => setActiveTab('budgets')}
              activeOpacity={0.8}
            >
              <Ionicons name="speedometer-outline" size={16} color={theme.primary} />
              <Text style={[styles.quickJumpText, { color: theme.text }]}>Manage Category Budgets & Limits</Text>
              <Ionicons name="chevron-forward" size={16} color={theme.subText} />
            </TouchableOpacity>
          </>
        )}

        {/* --- VIEW 1: BUDGETS VIEW --- */}
        {activeTab === 'budgets' && (
          <>
            <Text style={[styles.sectionTitle, { color: theme.text }]}>Category Budgets & Spending Limits</Text>

            {expenseBreakdown.length === 0 ? (
              <View style={[styles.emptyCard, { backgroundColor: theme.cardBg, borderColor: theme.border }]}>
                <Ionicons name="receipt-outline" size={36} color={theme.subText} style={{ marginBottom: 8 }} />
                <Text style={[styles.emptyTitle, { color: theme.text }]}>No Expenses Logged</Text>
                <Text style={[styles.emptySubText, { color: theme.subText }]}>
                  You haven't recorded any expenses for this cycle yet.
                </Text>
                <TouchableOpacity
                  style={[styles.addTransactionBtn, { backgroundColor: theme.primary }]}
                  onPress={() => navigation?.navigate?.('Dashboard')}
                  activeOpacity={0.85}
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
                      <TouchableOpacity onPress={() => handleOpenBudgetModal(item)} style={styles.budgetBtn} activeOpacity={0.8}>
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

        {/* --- VIEW 2: CHARTS VIEW --- */}
        {activeTab === 'charts' && (
          <View style={styles.viewSection}>
            <Text style={[styles.sectionTitle, { color: theme.text }]}>Visual Expense Distribution</Text>

            {expenseBreakdown.filter(i => i.total > 0).length === 0 ? (
              <View style={[styles.emptyCard, { backgroundColor: theme.cardBg, borderColor: theme.border }]}>
                <Ionicons name="pie-chart-outline" size={36} color={theme.subText} style={{ marginBottom: 8 }} />
                <Text style={[styles.emptyTitle, { color: theme.text }]}>No Chart Data Available</Text>
                <Text style={[styles.emptySubText, { color: theme.subText }]}>
                  Log transactions to generate visual spending charts.
                </Text>
                <TouchableOpacity
                  style={[styles.addTransactionBtn, { backgroundColor: theme.primary }]}
                  onPress={() => navigation?.navigate?.('Dashboard')}
                  activeOpacity={0.85}
                >
                  <Ionicons name="add" size={16} color="#FFFFFF" />
                  <Text style={styles.addTransactionBtnText}>Add Transaction</Text>
                </TouchableOpacity>
              </View>
            ) : (
              <>
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

                  <View style={styles.legendContainer}>
                    {expenseBreakdown.filter(i => i.total > 0).map((item, idx) => {
                      const percent = totalExpense > 0 ? (item.total / totalExpense) * 100 : 0;
                      return (
                        <TouchableOpacity
                          key={idx}
                          style={styles.legendItem}
                          onPress={() => setFocusedSlice(item)}
                          activeOpacity={0.7}
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

            {expenseBreakdown.filter(i => i.total > 0).length === 0 ? (
              <View style={[styles.emptyCard, { backgroundColor: theme.cardBg, borderColor: theme.border }]}>
                <Ionicons name="list-outline" size={36} color={theme.subText} style={{ marginBottom: 8 }} />
                <Text style={[styles.emptyTitle, { color: theme.text }]}>No Breakdown Records</Text>
                <Text style={[styles.emptySubText, { color: theme.subText }]}>
                  Start logging entries to view category analytics.
                </Text>
                <TouchableOpacity
                  style={[styles.addTransactionBtn, { backgroundColor: theme.primary }]}
                  onPress={() => navigation?.navigate?.('Dashboard')}
                  activeOpacity={0.85}
                >
                  <Ionicons name="add" size={16} color="#FFFFFF" />
                  <Text style={styles.addTransactionBtnText}>Add Transaction</Text>
                </TouchableOpacity>
              </View>
            ) : (
              expenseBreakdown
                .filter(i => i.total > 0)
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
                          <Text style={[styles.shareText, { color: theme.subText }]}>{sharePercent.toFixed(1)}% of cycle expenses</Text>
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
          style={[styles.floatingBtn, activeTab === 'overview' && { backgroundColor: theme.primary }]}
          onPress={() => setActiveTab('overview')}
          activeOpacity={0.8}
        >
          <Ionicons name="speedometer-outline" size={14} color={activeTab === 'overview' ? '#FFFFFF' : theme.subText} />
          <Text style={[styles.floatingBtnText, { color: theme.subText }, activeTab === 'overview' && styles.activeBtnText]}>
            Overview
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.floatingBtn, activeTab === 'budgets' && { backgroundColor: theme.primary }]}
          onPress={() => setActiveTab('budgets')}
          activeOpacity={0.8}
        >
          <Ionicons name="wallet-outline" size={14} color={activeTab === 'budgets' ? '#FFFFFF' : theme.subText} />
          <Text style={[styles.floatingBtnText, { color: theme.subText }, activeTab === 'budgets' && styles.activeBtnText]}>
            Budgets
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.floatingBtn, activeTab === 'charts' && { backgroundColor: theme.primary }]}
          onPress={() => setActiveTab('charts')}
          activeOpacity={0.8}
        >
          <Ionicons name="pie-chart-outline" size={14} color={activeTab === 'charts' ? '#FFFFFF' : theme.subText} />
          <Text style={[styles.floatingBtnText, { color: theme.subText }, activeTab === 'charts' && styles.activeBtnText]}>
            Charts
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.floatingBtn, activeTab === 'breakdown' && { backgroundColor: theme.primary }]}
          onPress={() => setActiveTab('breakdown')}
          activeOpacity={0.8}
        >
          <Ionicons name="list-outline" size={14} color={activeTab === 'breakdown' ? '#FFFFFF' : theme.subText} />
          <Text style={[styles.floatingBtnText, { color: theme.subText }, activeTab === 'breakdown' && styles.activeBtnText]}>
            Details
          </Text>
        </TouchableOpacity>
      </View>

      {/* Set Budget Modal */}
      <Modal visible={budgetModalVisible} animationType="fade" transparent={true} onRequestClose={() => setBudgetModalVisible(false)}>
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContainer, { backgroundColor: theme.cardBg, borderColor: theme.border }]}>
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
              <TouchableOpacity style={[styles.cancelBtn, { borderColor: theme.border, backgroundColor: theme.inputBg }]} onPress={() => setBudgetModalVisible(false)} activeOpacity={0.8}>
                <Text style={[styles.cancelBtnText, { color: theme.text }]}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[styles.saveBtn, { backgroundColor: theme.primary }]} onPress={handleSaveBudget} activeOpacity={0.85}>
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
    marginBottom: 8,
    borderWidth: 1,
  },
  monthLabel: { fontSize: 13, fontWeight: '600' },
  arrowBtn: { padding: 2 },

  cycleToggleRow: {
    flexDirection: 'row',
    borderRadius: 10,
    borderWidth: 1,
    padding: 3,
    marginBottom: 12,
    gap: 4,
  },
  cycleBtn: {
    flex: 1,
    paddingVertical: 7,
    borderRadius: 8,
    alignItems: 'center',
  },
  cycleBtnText: { fontSize: 11, fontWeight: '600' },
  activeCycleText: { color: '#FFFFFF', fontWeight: '700' },

  scrollContent: { paddingBottom: 95 },
  
  healthCard: { padding: 14, borderRadius: 12, marginBottom: 12, borderWidth: 1 },
  healthHeaderRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 },
  healthBadgeContainer: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  healthBadgeText: { fontSize: 13, fontWeight: '700' },
  savingsRateText: { fontSize: 11 },
  healthDescription: { fontSize: 12, lineHeight: 17 },

  insightCard: {
    flexDirection: 'row',
    padding: 12,
    borderRadius: 12,
    marginBottom: 12,
    borderWidth: 1,
    alignItems: 'flex-start',
  },
  insightTitle: { fontSize: 10, fontWeight: '700', textTransform: 'uppercase', marginBottom: 2, letterSpacing: 0.5 },
  insightText: { fontSize: 11.5, lineHeight: 16 },

  quickJumpBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
    justifyContent: 'space-between',
    marginTop: 4,
  },
  quickJumpText: { fontSize: 12, fontWeight: '600' },

  summaryCard: { padding: 14, borderRadius: 12, marginBottom: 12, borderWidth: 1 },
  cardHeader: { fontSize: 11, textTransform: 'uppercase', fontWeight: '700', marginBottom: 8, letterSpacing: 0.5 },
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
  legendItem: { flexDirection: 'row', alignItems: 'center', paddingVertical: 2 },
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
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 7,
    borderRadius: 18,
  },
  floatingBtnText: { fontSize: 11, fontWeight: '600' },
  activeBtnText: { color: '#FFFFFF', fontWeight: '700' },

  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.65)', justifyContent: 'center', alignItems: 'center', padding: 20 },
  modalContainer: { width: '100%', maxWidth: 320, borderRadius: 16, padding: 18, borderWidth: 1 },
  modalTitle: { fontSize: 16, fontWeight: '700', marginBottom: 12 },
  label: { fontSize: 10, fontWeight: '700', textTransform: 'uppercase', marginBottom: 6, letterSpacing: 0.8 },
  input: { padding: 12, borderRadius: 10, fontSize: 13, borderWidth: 1, marginBottom: 16 },
  modalActionRow: { flexDirection: 'row', gap: 8 },
  cancelBtn: { flex: 1, padding: 12, borderRadius: 10, borderWidth: 1, alignItems: 'center' },
  cancelBtnText: { fontWeight: '600', fontSize: 13 },
  saveBtn: { flex: 1, padding: 12, borderRadius: 10, alignItems: 'center' },
  saveBtnText: { color: '#FFFFFF', fontWeight: '700', fontSize: 13 },
});