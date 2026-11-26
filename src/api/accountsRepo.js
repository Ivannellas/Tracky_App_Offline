import db from "./sqLiteClient";

// Get all wallets/accounts sorted by user preference order
export function getAllAccounts() {
  return db.getAllSync(
    "SELECT * FROM accounts ORDER BY sort_order ASC, id ASC",
  );
}

// Get total net worth (sum of all account balances)
export function getTotalBalance() {
  const result = db.getFirstSync("SELECT SUM(balance) as total FROM accounts");
  return result?.total || 0;
}

// Add a new wallet with automatic sort indexing and icon support
export function insertAccount(
  name,
  balance = 0,
  color = "#8B5CF6",
  icon = "wallet-outline",
) {
  const maxOrderResult = db.getFirstSync(
    "SELECT MAX(sort_order) as maxOrder FROM accounts",
  );
  const nextOrder = (maxOrderResult?.maxOrder ?? -1) + 1;

  return db.runSync(
    "INSERT INTO accounts (name, balance, color, sort_order, icon) VALUES (?, ?, ?, ?, ?)",
    [name, Number(balance) || 0, color, nextOrder, icon],
  );
}

// Alias for backward compatibility if any other file imports createAccount
export function createAccount({
  name,
  initialBalance = 0,
  color = "#8B5CF6",
  icon = "wallet-outline",
}) {
  return insertAccount(name, initialBalance, color, icon);
}

// Update an existing wallet/account including icon selection
export function updateAccount(id, name, color, icon = "wallet-outline") {
  return db.runSync(
    "UPDATE accounts SET name = ?, color = ?, icon = ? WHERE id = ?",
    [name, color, icon, id],
  );
}

// Save reordered accounts sequence from dashboard shifts
export function updateAccountsOrder(orderedAccounts) {
  db.withTransactionSync(() => {
    orderedAccounts.forEach((acc, index) => {
      db.runSync("UPDATE accounts SET sort_order = ? WHERE id = ?", [
        index,
        acc.id,
      ]);
    });
  });
}

export function deleteAccount(id) {
  db.withTransactionSync(() => {
    db.runSync("DELETE FROM transactions WHERE account_id = ?", [id]);

    // 2. Delete the account row
    db.runSync("DELETE FROM accounts WHERE id = ?", [id]);
  });
}

// Execute an internal fund transfer between two accounts
export function transferFunds({
  fromAccountId,
  toAccountId,
  amount,
  fee = 0,
  note = "",
}) {
  const transferAmount = parseFloat(amount);
  const transferFee = parseFloat(fee) || 0;
  const totalDeduction = transferAmount + transferFee;

  if (isNaN(transferAmount) || transferAmount <= 0) {
    throw new Error("Please enter a valid transfer amount.");
  }

  if (fromAccountId === toAccountId) {
    throw new Error("Source and destination accounts must be different.");
  }

  // Wrap inside an atomic SQLite transaction
  return db.withTransactionSync(() => {
    // 1. Deduct (amount + fee) from source account
    db.runSync("UPDATE accounts SET balance = balance - ? WHERE id = ?", [
      totalDeduction,
      fromAccountId,
    ]);

    // 2. Add amount to destination account
    db.runSync("UPDATE accounts SET balance = balance + ? WHERE id = ?", [
      transferAmount,
      toAccountId,
    ]);

    // 3. Fetch account names for note logging
    const timestamp = new Date().toISOString();
    const fromAcc = db.getFirstSync("SELECT name FROM accounts WHERE id = ?", [
      fromAccountId,
    ]);
    const toAcc = db.getFirstSync("SELECT name FROM accounts WHERE id = ?", [
      toAccountId,
    ]);

    const logNote = note.trim()
      ? `Transfer to ${toAcc?.name}: ${note.trim()}`
      : `Transfer: ${fromAcc?.name} -> ${toAcc?.name}`;

    // 4. Log the main transfer record as type 'transfer' with to_account_id
    db.runSync(
      `INSERT INTO transactions (account_id, to_account_id, category_id, amount, type, note, date) 
       VALUES (?, ?, NULL, ?, 'transfer', ?, ?)`,
      [fromAccountId, toAccountId, transferAmount, logNote, timestamp],
    );

    // 5. If there is a transfer fee, log it separately as an expense
    if (transferFee > 0) {
      db.runSync(
        `INSERT INTO transactions (account_id, category_id, amount, type, note, date) 
         VALUES (?, NULL, ?, 'expense', ?, ?)`,
        [fromAccountId, transferFee, `Transfer Fee: ${toAcc?.name}`, timestamp],
      );
    }
  });
}
