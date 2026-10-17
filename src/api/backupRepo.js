import * as FileSystem from 'expo-file-system/legacy'; // <-- UPDATED to legacy path
import * as Sharing from 'expo-sharing';
import * as DocumentPicker from 'expo-document-picker';
import db from './sqLiteClient';

// Export all local database tables into a JSON file and open share sheet
export async function exportDatabaseBackup() {
  try {
    const accounts = db.getAllSync('SELECT * FROM accounts');
    const categories = db.getAllSync('SELECT * FROM categories');
    const transactions = db.getAllSync('SELECT * FROM transactions');
    const recurringBills = db.getAllSync('SELECT * FROM recurring_bills');

    const backupData = {
      version: 1,
      exportedAt: new Date().toISOString(),
      data: {
        accounts,
        categories,
        transactions,
        recurring_bills: recurringBills,
      },
    };

    const fileName = `trackly_backup_${new Date().toISOString().split('T')[0]}.json`;
    const fileUri = `${FileSystem.documentDirectory}${fileName}`;

    await FileSystem.writeAsStringAsync(fileUri, JSON.stringify(backupData, null, 2), {
      encoding: FileSystem.EncodingType.UTF8,
    });

    if (await Sharing.isAvailableAsync()) {
      await Sharing.shareAsync(fileUri, {
        dialogTitle: 'Backup Trackly Data',
        mimeType: 'application/json',
      });
    } else {
      alert('Sharing is not available on this device.');
    }
  } catch (error) {
    console.error('Failed to export backup:', error);
    alert('Export failed. Check console for details.');
  }
}

// Import JSON backup file and restore database tables
export async function importDatabaseBackup() {
  try {
    const result = await DocumentPicker.getDocumentAsync({
      type: 'application/json',
      copyToCacheDirectory: true,
    });

    if (result.canceled || !result.assets || result.assets.length === 0) {
      return false;
    }

    const fileUri = result.assets[0].uri;
    const fileContent = await FileSystem.readAsStringAsync(fileUri, {
      encoding: FileSystem.EncodingType.UTF8,
    });

    const parsedBackup = JSON.parse(fileContent);

    if (!parsedBackup || !parsedBackup.data) {
      throw new Error('Invalid backup file structure.');
    }

    const { accounts, categories, transactions, recurring_bills } = parsedBackup.data;

    db.withTransactionSync(() => {
      db.runSync('DELETE FROM transactions');
      db.runSync('DELETE FROM recurring_bills');
      db.runSync('DELETE FROM accounts');
      db.runSync('DELETE FROM categories');

      if (categories && Array.isArray(categories)) {
        for (const cat of categories) {
          db.runSync(
            `INSERT INTO categories (id, name, type, color, budget_limit) VALUES (?, ?, ?, ?, ?)`,
            [cat.id, cat.name, cat.type, cat.color || '#A78BFA', cat.budget_limit || 0]
          );
        }
      }

      if (accounts && Array.isArray(accounts)) {
        for (const acc of accounts) {
          db.runSync(
            `INSERT INTO accounts (id, name, balance, color) VALUES (?, ?, ?, ?)`,
            [acc.id, acc.name, acc.balance, acc.color || '#8B5CF6']
          );
        }
      }

      if (transactions && Array.isArray(transactions)) {
        for (const tx of transactions) {
          db.runSync(
            `INSERT INTO transactions (id, account_id, category_id, amount, type, note, date) VALUES (?, ?, ?, ?, ?, ?, ?)`,
            [tx.id, tx.account_id, tx.category_id, tx.amount, tx.type, tx.note, tx.date]
          );
        }
      }

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