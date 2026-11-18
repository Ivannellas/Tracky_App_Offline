import db from './sqLiteClient';

export function getAllTransactions() {
  return db.getAllSync(`
    SELECT t.*, c.name as category_name, a.name as account_name, dest.name as to_account_name 
    FROM transactions t
    LEFT JOIN categories c ON t.category_id = c.id
    JOIN accounts a ON t.account_id = a.id
    LEFT JOIN accounts dest ON t.to_account_id = dest.id
    ORDER BY datetime(t.date) DESC, t.id DESC
  `);
}

export function insertTransaction({ accountId, toAccountId, categoryId, amount, type, note, date }) {
  db.withTransactionSync(() => {
    if (type === 'transfer') {
      // 1. Insert the transfer transaction record
      db.runSync(
        `INSERT INTO transactions (account_id, to_account_id, amount, type, note, date) VALUES (?, ?, ?, ?, ?, ?)`,
        [accountId, toAccountId, amount, 'transfer', note || 'Transfer between accounts', date]
      );

      // 2. Deduct from source account
      db.runSync(
        `UPDATE accounts SET balance = balance - ? WHERE id = ?`,
        [amount, accountId]
      );

      // 3. Add to destination account
      db.runSync(
        `UPDATE accounts SET balance = balance + ? WHERE id = ?`,
        [amount, toAccountId]
      );
    } else {
      // Regular Income / Expense
      db.runSync(
        `INSERT INTO transactions (account_id, category_id, amount, type, note, date) VALUES (?, ?, ?, ?, ?, ?)`,
        [accountId, categoryId, amount, type, note, date]
      );

      const balanceChange = type === 'income' ? amount : -amount;
      db.runSync(
        `UPDATE accounts SET balance = balance + ? WHERE id = ?`,
        [balanceChange, accountId]
      );
    }
  });
}

export function deleteTransaction(id) {
  db.withTransactionSync(() => {
    const tx = db.getFirstSync('SELECT * FROM transactions WHERE id = ?', [id]);
    if (!tx) return;

    if (tx.type === 'transfer') {
      // Revert transfer: Add back to source, subtract from destination
      db.runSync('UPDATE accounts SET balance = balance + ? WHERE id = ?', [tx.amount, tx.account_id]);
      if (tx.to_account_id) {
        db.runSync('UPDATE accounts SET balance = balance - ? WHERE id = ?', [tx.amount, tx.to_account_id]);
      }
    } else {
      // Revert income/expense
      const revertBalanceChange = tx.type === 'income' ? -tx.amount : tx.amount;
      db.runSync(
        'UPDATE accounts SET balance = balance + ? WHERE id = ?',
        [revertBalanceChange, tx.account_id]
      );
    }

    db.runSync('DELETE FROM transactions WHERE id = ?', [id]);
  });
}

export function updateTransaction(id, { account_id, to_account_id, category_id, amount, type, note }) {
  db.withTransactionSync(() => {
    const oldTx = db.getFirstSync('SELECT * FROM transactions WHERE id = ?', [id]);
    if (!oldTx) return;

    // 1. Fully revert old transaction balance impacts
    if (oldTx.type === 'transfer') {
      db.runSync('UPDATE accounts SET balance = balance + ? WHERE id = ?', [oldTx.amount, oldTx.account_id]);
      if (oldTx.to_account_id) {
        db.runSync('UPDATE accounts SET balance = balance - ? WHERE id = ?', [oldTx.amount, oldTx.to_account_id]);
      }
    } else {
      const oldRevert = oldTx.type === 'income' ? -oldTx.amount : oldTx.amount;
      db.runSync('UPDATE accounts SET balance = balance + ? WHERE id = ?', [oldRevert, oldTx.account_id]);
    }

    // 2. Apply new transaction balance impacts
    if (type === 'transfer') {
      db.runSync('UPDATE accounts SET balance = balance - ? WHERE id = ?', [Number(amount), account_id]);
      if (to_account_id) {
        db.runSync('UPDATE accounts SET balance = balance + ? WHERE id = ?', [Number(amount), to_account_id]);
      }
      db.runSync(
        'UPDATE transactions SET account_id = ?, to_account_id = ?, category_id = NULL, amount = ?, type = ?, note = ? WHERE id = ?',
        [account_id, to_account_id, Number(amount), 'transfer', note || 'Transfer between accounts', id]
      );
    } else {
      const newImpact = type === 'income' ? Number(amount) : -Number(amount);
      db.runSync('UPDATE accounts SET balance = balance + ? WHERE id = ?', [newImpact, account_id]);
      db.runSync(
        'UPDATE transactions SET account_id = ?, to_account_id = NULL, category_id = ?, amount = ?, type = ?, note = ? WHERE id = ?',
        [account_id, category_id, Number(amount), type, note || '', id]
      );
    }
  });
}

export function deleteAllTransactions() {
  try {
    db.withTransactionSync(() => {
      db.execSync('DELETE FROM transactions;');
      db.execSync('UPDATE accounts SET balance = 0.0;');
    });
    return true;
  } catch (error) {
    console.error('Failed to delete all transactions:', error);
    throw error;
  }
}