import db from './sqLiteClient';

// Get spending breakdown grouped by category for a specific month (YYYY-MM) and optional day range
export function getCategorySpendingForMonth(selectedMonth, startDay = 1, endDay = 31) {
  // Inject startDay and endDay directly as numbers to avoid SQLite placeholder limits
  return db.getAllSync(`
    SELECT c.id as category_id, c.name as category_name, c.color, c.type, c.budget_limit, SUM(t.amount) as total
    FROM transactions t
    JOIN categories c ON t.category_id = c.id
    WHERE t.date LIKE ? 
      AND CAST(SUBSTR(t.date, 9, 2) AS INTEGER) BETWEEN ${startDay} AND ${endDay}
    GROUP BY c.id
    ORDER BY total DESC
  `, [`${selectedMonth}%`]);
}

// Get total expense and income sums for a specific month and optional day range
export function getMonthlyTotals(selectedMonth, startDay = 1, endDay = 31) {
  const result = db.getAllSync(`
    SELECT type, SUM(amount) as total
    FROM transactions
    WHERE date LIKE ? 
      AND CAST(SUBSTR(date, 9, 2) AS INTEGER) BETWEEN ${startDay} AND ${endDay}
    GROUP BY type
  `, [`${selectedMonth}%`]);

  let income = 0;
  let expense = 0;

  result.forEach(row => {
    if (row.type === 'income') income = row.total;
    if (row.type === 'expense') expense = row.total;
  });

  return { income, expense };
}

// Get raw transactions for a month
export function getTransactionsForMonth(selectedMonth) {
  return db.getAllSync(`
    SELECT t.*, c.name as category_name, c.color as category_color, c.budget_limit 
    FROM transactions t
    LEFT JOIN categories c ON t.category_id = c.id
    WHERE t.date LIKE ?
    ORDER BY t.date DESC
  `, [`${selectedMonth}%`]);
}