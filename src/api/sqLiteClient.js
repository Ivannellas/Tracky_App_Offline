import * as SQLite from 'expo-sqlite';

// Open local SQLite database file
const db = SQLite.openDatabaseSync('trackly_v2.db');

export function getDb() {
  return db;
}

export function initDatabase() {
  db.execSync(`
    PRAGMA journal_mode = WAL;
    PRAGMA foreign_keys = ON;

    CREATE TABLE IF NOT EXISTS accounts (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      balance REAL DEFAULT 0.0,
      color TEXT DEFAULT '#8B5CF6',
      sort_order INTEGER DEFAULT 0,
      icon TEXT DEFAULT 'wallet-outline'
    );

    CREATE TABLE IF NOT EXISTS categories (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      type TEXT CHECK(type IN ('income', 'expense')) NOT NULL,
      color TEXT DEFAULT '#A78BFA',
      icon TEXT,
      budget_limit REAL DEFAULT 0.0
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

  // Auto-migration for categories table
  try {
    const tableInfo = db.getAllSync("PRAGMA table_info(categories)");
    
    // Check and add budget_limit if missing
    const hasBudgetColumn = tableInfo.some((col) => col.name === 'budget_limit');
    if (!hasBudgetColumn) {
      db.execSync("ALTER TABLE categories ADD COLUMN budget_limit REAL DEFAULT 0.0;");
    }

    // Check and add icon column if missing
    const hasIconColumn = tableInfo.some((col) => col.name === 'icon');
    if (!hasIconColumn) {
      db.execSync("ALTER TABLE categories ADD COLUMN icon TEXT;");
    }
  } catch (error) {
    console.log("Categories migration check error:", error);
  }

  // Auto-migration for accounts table (sort_order & icon columns)
  try {
    const accountTableInfo = db.getAllSync("PRAGMA table_info(accounts)");
    
    const hasSortOrder = accountTableInfo.some((col) => col.name === 'sort_order');
    if (!hasSortOrder) {
      db.execSync("ALTER TABLE accounts ADD COLUMN sort_order INTEGER DEFAULT 0;");
    }

    const hasIcon = accountTableInfo.some((col) => col.name === 'icon');
    if (!hasIcon) {
      db.execSync("ALTER TABLE accounts ADD COLUMN icon TEXT DEFAULT 'wallet-outline';");
    }
  } catch (error) {
    console.log("Accounts migration check error:", error);
  }

  // Seed default accounts if table is empty
  const accountCheck = db.getFirstSync('SELECT COUNT(*) as count FROM accounts');
  if (accountCheck.count === 0) {
    db.runSync(`INSERT INTO accounts (name, balance, color, sort_order, icon) VALUES ('Cash', 0.0, '#10B981', 0, 'cash-outline')`);
    db.runSync(`INSERT INTO accounts (name, balance, color, sort_order, icon) VALUES ('GCash', 0.0, '#3B82F6', 1, 'phone-portrait-outline')`);
  }

  // Seed default categories if table is empty
  const categoryCheck = db.getFirstSync('SELECT COUNT(*) as count FROM categories');
  if (categoryCheck.count === 0) {
    db.runSync(`INSERT INTO categories (name, type, color, icon, budget_limit) VALUES ('Food & Dining', 'expense', '#EF4444', 'fast-food-outline', 0.0)`);
    db.runSync(`INSERT INTO categories (name, type, color, icon, budget_limit) VALUES ('Transportation', 'expense', '#F59E0B', 'car-outline', 0.0)`);
    db.runSync(`INSERT INTO categories (name, type, color, icon, budget_limit) VALUES ('Salary', 'income', '#10B981', 'wallet-outline', 0.0)`);
  }
}

export default db;