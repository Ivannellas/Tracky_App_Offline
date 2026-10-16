import db from './sqLiteClient';

export function getAllTransactions() {
  return db.getAllSync(`
    SELECT t.*, c.name as category_name, a.name as account_name 
    FROM transactions t
    JOIN categories c ON t.category_id = c.id
    JOIN accounts a ON t.account_id = a.id
    ORDER BY t.date DESC
  `);
}

export function insertTransaction({ accountId, categoryId, amount, type, note, date }) {
  db.withTransactionSync(() => {
    // 1. Insert the transaction row
    db.runSync(
      `INSERT INTO transactions (account_id, category_id, amount, type, note, date) VALUES (?, ?, ?, ?, ?, ?)`,
      [accountId, categoryId, amount, type, note, date]
    );

    // 2. Atomically update the account balance
    const balanceChange = type === 'income' ? amount : -amount;
    db.runSync(
      `UPDATE accounts SET balance = balance + ? WHERE id = ?`,
      [balanceChange, accountId]
    );
  });
}


export function deleteTransaction(id) {
  db.withTransactionSync(() => {
    // 1. Fetch the transaction details first to know amount, type, and account_id
    const tx = db.getFirstSync('SELECT * FROM transactions WHERE id = ?', [id]);
    if (!tx) return;

    // 2. Revert account balance
    const revertBalanceChange = tx.type === 'income' ? -tx.amount : tx.amount;
    db.runSync(
      'UPDATE accounts SET balance = balance + ? WHERE id = ?',
      [revertBalanceChange, tx.account_id]
    );

    // 3. Delete the transaction row
    db.runSync('DELETE FROM transactions WHERE id = ?', [id]);
  });
}

export function updateTransaction(id, { account_id, category_id, amount, type, note }) {
  db.withTransactionSync(() => {
    // 1. Fetch old transaction details
    const oldTx = db.getFirstSync('SELECT * FROM transactions WHERE id = ?', [id]);
    if (!oldTx) return;

    // 2. Revert old account balance impact
    const oldRevert = oldTx.type === 'income' ? -oldTx.amount : oldTx.amount;
    db.runSync('UPDATE accounts SET balance = balance + ? WHERE id = ?', [oldRevert, oldTx.account_id]);

    // 3. Apply new account balance impact
    const newImpact = type === 'income' ? Number(amount) : -Number(amount);
    db.runSync('UPDATE accounts SET balance = balance + ? WHERE id = ?', [newImpact, account_id]);

    // 4. Update the transaction row
    db.runSync(
      'UPDATE transactions SET account_id = ?, category_id = ?, amount = ?, type = ?, note = ? WHERE id = ?',
      [account_id, category_id, Number(amount), type, note || '', id]
    );
  });
}