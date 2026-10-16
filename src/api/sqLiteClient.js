import * as SQLite from 'expo-sqlite';

// Open local SQLite database file
const db = SQLite.openDatabaseSync('trackly_v2.db');

export function initDatabase() {
  db.execSync(`
    PRAGMA journal_mode = WAL;
    PRAGMA foreign_keys = ON;

    CREATE TABLE IF NOT EXISTS accounts (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      balance REAL DEFAULT 0.0,
      color TEXT DEFAULT '#8B5CF6'
    );

    CREATE TABLE IF NOT EXISTS categories (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      type TEXT CHECK(type IN ('income', 'expense')) NOT NULL,
      color TEXT DEFAULT '#A78BFA'
    );

    CREATE TABLE IF NOT EXISTS transactions (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      account_id INTEGER NOT NULL,
      category_id INTEGER NOT NULL,
      amount REAL NOT NULL,
      type TEXT CHECK(type IN ('income', 'expense')) NOT NULL,
      note TEXT,
      date TEXT NOT NULL,
      FOREIGN KEY(account_id) REFERENCES accounts(id) ON DELETE CASCADE,
      FOREIGN KEY(category_id) REFERENCES categories(id) ON DELETE CASCADE
    );

    -- ADDED: Recurring bills table schema
    CREATE TABLE IF NOT EXISTS recurring_bills (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      amount REAL NOT NULL,
      category_id INTEGER NOT NULL,
      account_id INTEGER NOT NULL,
      due_day INTEGER NOT NULL,
      FOREIGN KEY(account_id) REFERENCES accounts(id) ON DELETE CASCADE,
      FOREIGN KEY(category_id) REFERENCES categories(id) ON DELETE CASCADE
    );
  `);

  // Seed default accounts if table is completely empty
  const accountCheck = db.getFirstSync('SELECT COUNT(*) as count FROM accounts');
  if (accountCheck.count === 0) {
    db.runSync(`INSERT INTO accounts (name, balance, color) VALUES ('Cash', 0.0, '#10B981')`);
    db.runSync(`INSERT INTO accounts (name, balance, color) VALUES ('GCash', 0.0, '#3B82F6')`);
  }

  // Seed default categories if table is completely empty
  const categoryCheck = db.getFirstSync('SELECT COUNT(*) as count FROM categories');
  if (categoryCheck.count === 0) {
    db.runSync(`INSERT INTO categories (name, type, color) VALUES ('Food & Dining', 'expense', '#EF4444')`);
    db.runSync(`INSERT INTO categories (name, type, color) VALUES ('Transportation', 'expense', '#F59E0B')`);
    db.runSync(`INSERT INTO categories (name, type, color) VALUES ('Salary', 'income', '#10B981')`);
  }
}

export default db;