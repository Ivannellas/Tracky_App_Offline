import db from './sqLiteClient';

export function getAllRecurringBills() {
  return db.getAllSync('SELECT * FROM recurring_bills ORDER BY due_day ASC');
}

export function insertRecurringBill({ name, amount, category_id, account_id, due_day }) {
  return db.runSync(
    'INSERT INTO recurring_bills (name, amount, category_id, account_id, due_day) VALUES (?, ?, ?, ?, ?)',
    [name, Number(amount), category_id, account_id, Number(due_day)]
  );
}

export function deleteRecurringBill(id) {
  return db.runSync('DELETE FROM recurring_bills WHERE id = ?', [id]);
}

// Pay a recurring bill: deducts from wallet and logs a transaction
export function payRecurringBill(bill) {
  db.withTransactionSync(() => {
    const today = new Date().toISOString().split('T')[0];

    // 1. Deduct amount from the linked account/wallet balance
    db.runSync(
      'UPDATE accounts SET balance = balance - ? WHERE id = ?',
      [bill.amount, bill.account_id]
    );

    // 2. Insert a formal transaction record so it shows up in dashboard history
    db.runSync(
      'INSERT INTO transactions (account_id, category_id, amount, type, note, date) VALUES (?, ?, ?, ?, ?, ?)',
      [bill.account_id, bill.category_id, bill.amount, 'expense', `Paid bill: ${bill.name}`, today]
    );
  });
}