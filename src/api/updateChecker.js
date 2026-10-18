import * as Application from 'expo-application';
import * as FileSystem from 'expo-file-system/legacy';
import * as IntentLauncher from 'expo-intent-launcher';
import { Alert, Platform } from 'react-native';

// Replace this URL once you host your version.json file publicly (e.g., GitHub Raw URL)
const VERSION_CHECK_URL = 'https://raw.githubusercontent.com/YOUR_USERNAME/Trackly_App_Offline/main/version.json';

export async function checkForUpdates(isManualCheck = false) {
  if (Platform.OS !== 'android') return;

  try {
    // If the placeholder URL is still set, skip checking
    if (VERSION_CHECK_URL.includes('YOUR_USERNAME')) {
      if (isManualCheck) {
        Alert.alert('Configuration Required', 'Please configure your GitHub raw URL in updateChecker.js');
      }
      return;
    }

    const response = await fetch(VERSION_CHECK_URL, { cache: 'no-store' });

    // Check if response is HTTP 200 OK
    if (!response.ok) {
      throw new Error(`Server returned status ${response.status}`);
    }

    const remoteData = await response.json();

    const currentVersionCode = parseInt(Application.nativeBuildVersion || '1', 10);

    if (remoteData.versionCode > currentVersionCode) {
      Alert.alert(
        'Update Available 🚀',
        `A new version (${remoteData.versionName}) of Trackly is available.\n\n${remoteData.releaseNotes || ''}`,
        [
          { text: 'Later', style: 'cancel' },
          { text: 'Update Now', onPress: () => downloadAndInstallApk(remoteData.apkUrl) },
        ]
      );
    } else if (isManualCheck) {
      Alert.alert('Up to Date', 'You are already using the latest version of Trackly.');
    }
  } catch (error) {
    console.error('Failed to check for updates:', error);
    if (isManualCheck) {
      alert('Could not check for updates. Please check your internet connection or update URL.');
    }
  }
}

async function downloadAndInstallApk(apkUrl) {
  try {
    const apkUri = `${FileSystem.documentDirectory}trackly_update.apk`;

    const fileInfo = await FileSystem.getInfoAsync(apkUri);
    if (fileInfo.exists) {
      await FileSystem.deleteAsync(apkUri, { idempotent: true });
    }

    alert('Downloading update... Please wait.');

    const downloadResult = await FileSystem.downloadAsync(apkUrl, apkUri);

    if (downloadResult.status !== 200) {
      throw new Error('Download failed with status: ' + downloadResult.status);
    }

    const contentUri = await FileSystem.getContentUriAsync(downloadResult.uri);

    await IntentLauncher.startActivityAsync('android.intent.action.VIEW', {
      data: contentUri,
      flags: 1, // FLAG_GRANT_READ_URI_PERMISSION
      type: 'application/vnd.android.package-archive',
    });
  } catch (error) {
    console.error('Update installation failed:', error);
    Alert.alert('Update Failed', 'Could not install the update automatically. Please download it manually.');
  }
}