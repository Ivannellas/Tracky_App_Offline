import db from './sqLiteClient';

// Get spending breakdown grouped by category for a specific month (YYYY-MM)
export function getCategorySpendingForMonth(selectedMonth) {
  return db.getAllSync(`
    SELECT c.id as category_id, c.name as category_name, c.color, c.type, c.budget_limit, SUM(t.amount) as total
    FROM transactions t
    JOIN categories c ON t.category_id = c.id
    WHERE t.date LIKE ?
    GROUP BY c.id
    ORDER BY total DESC
  `, [`${selectedMonth}%`]);
}

// Get total expense and income sums for a specific month
export function getMonthlyTotals(selectedMonth) {
  const result = db.getAllSync(`
    SELECT type, SUM(amount) as total
    FROM transactions
    WHERE date LIKE ?
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