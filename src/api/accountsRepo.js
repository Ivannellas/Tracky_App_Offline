import db from './sqLiteClient';

// Get all wallets/accounts with current balances
export function getAllAccounts() {
  return db.getAllSync('SELECT * FROM accounts ORDER BY id ASC');
}

// Get total net worth (sum of all account balances)
export function getTotalBalance() {
  const result = db.getFirstSync('SELECT SUM(balance) as total FROM accounts');
  return result?.total || 0;
}

// Add a new wallet (Supports both object parameters or individual arguments)
export function insertAccount(name, balance = 0, color = '#8B5CF6') {
  return db.runSync(
    'INSERT INTO accounts (name, balance, color) VALUES (?, ?, ?)',
    [name, Number(balance) || 0, color]
  );
}

// Alias for backward compatibility if any other file imports createAccount
export function createAccount({ name, initialBalance = 0, color = '#8B5CF6' }) {
  return insertAccount(name, initialBalance, color);
}

// Update an existing wallet/account
export function updateAccount(id, name, color) {
  return db.runSync(
    'UPDATE accounts SET name = ?, color = ? WHERE id = ?',
    [name, color, id]
  );
}

export function deleteAccount(id) {
  db.withTransactionSync(() => {
    db.runSync('DELETE FROM transactions WHERE account_id = ?', [id]);
    
    // 2. Delete the account row
    db.runSync('DELETE FROM accounts WHERE id = ?', [id]);
  });
}