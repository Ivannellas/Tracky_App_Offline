import * as FileSystem from 'expo-file-system';
import * as Sharing from 'expo-sharing';
import db from '../api/sqLiteClient';

// 1. Export Database to JSON File
export async function exportDatabaseBackup() {
  try {
    // Gather all data from local SQLite tables
    const accounts = db.getAllSync('SELECT * FROM accounts');
    const categories = db.getAllSync('SELECT * FROM categories');
    const transactions = db.getAllSync('SELECT * FROM transactions');
    const recurringBills = db.getAllSync('SELECT * FROM recurring_bills');

    const backupData = {
      version: 1,
      exportDate: new Date().toISOString(),
      data: {
        accounts,
        categories,
        transactions,
        recurring_bills: recurringBills,
      },
    };

    const fileName = `trackly_backup_${new Date().toISOString().slice(0, 10)}.json`;
    const fileUri = `${FileSystem.documentDirectory}${fileName}`;

    // Write JSON string to local document directory
    await FileSystem.writeAsStringAsync(fileUri, JSON.stringify(backupData, null, 2), {
      encoding: FileSystem.EncodingType.UTF8,
    });

    // Check if sharing is available and open share sheet
    if (await Sharing.isAvailableAsync()) {
      await Sharing.shareAsync(fileUri, {
        mimeType: 'application/json',
        dialogTitle: 'Export Trackly Backup',
        UTI: 'public.json',
      });
    } else {
      throw new Error('Sharing is not available on this device.');
    }
  } catch (error) {
    console.error('Export failed:', error);
    throw error;
  }
}

// 2. Import Database from a JSON String/File
export async function importDatabaseBackup(fileUri) {
  try {
    const fileContent = await FileSystem.readAsStringAsync(fileUri, {
      encoding: FileSystem.EncodingType.UTF8,
    });

    const parsedBackup = JSON.parse(fileContent);

    if (!parsedBackup || !parsedBackup.data) {
      throw new Error('Invalid backup file structure.');
    }

    const { accounts, categories, transactions, recurring_bills } = parsedBackup.data;

    // Perform database restoration inside an atomic transaction
    db.withTransactionSync(() => {
      // Clear current data to prevent primary key collisions or duplicates
      db.runSync('DELETE FROM transactions');
      db.runSync('DELETE FROM recurring_bills');
      db.runSync('DELETE FROM accounts');
      db.runSync('DELETE FROM categories');

      // Restore Categories
      if (categories && Array.isArray(categories)) {
        for (const cat of categories) {
          db.runSync(
            `INSERT INTO categories (id, name, type, color, budget_limit) VALUES (?, ?, ?, ?, ?)`,
            [cat.id, cat.name, cat.type, cat.color || '#A78BFA', cat.budget_limit || 0]
          );
        }
      }

      // Restore Accounts
      if (accounts && Array.isArray(accounts)) {
        for (const acc of accounts) {
          db.runSync(
            `INSERT INTO accounts (id, name, balance, color) VALUES (?, ?, ?, ?)`,
            [acc.id, acc.name, acc.balance, acc.color || '#8B5CF6']
          );
        }
      }

      // Restore Transactions
      if (transactions && Array.isArray(transactions)) {
        for (const tx of transactions) {
          db.runSync(
            `INSERT INTO transactions (id, account_id, category_id, amount, type, note, date) VALUES (?, ?, ?, ?, ?, ?, ?)`,
            [tx.id, tx.account_id, tx.category_id, tx.amount, tx.type, tx.note, tx.date]
          );
        }
      }

      // Restore Recurring Bills
      if (recurring_bills && Array.isArray(recurring_bills)) {
        for (const bill of recurring_bills) {
          db.runSync(
            `INSERT INTO recurring_bills (id, name, amount, category_id, account_id, due_day) VALUES (?, ?, ?, ?, ?, ?)`,
            [bill.id, bill.name, bill.amount, bill.category_id, bill.account_id, bill.due_day]
          );
        }
      }
    });

    return true;
  } catch (error) {
    console.error('Import failed:', error);
    throw error;
  }
}