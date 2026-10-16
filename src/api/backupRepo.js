import * as FileSystem from 'expo-file-system';
import * as Sharing from 'expo-sharing';
import db from './sqLiteClient';

// Export all local database tables into a JSON file and open share sheet
export async function exportDatabaseBackup() {
  try {
    const accounts = db.getAllSync('SELECT * FROM accounts');
    const categories = db.getAllSync('SELECT * FROM categories');
    const transactions = db.getAllSync('SELECT * FROM transactions');

    const backupData = {
      version: 1,
      exportedAt: new Date().toISOString(),
      data: {
        accounts,
        categories,
        transactions,
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