import * as Application from 'expo-application';
import * as FileSystem from 'expo-file-system/legacy';
import * as IntentLauncher from 'expo-intent-launcher';
import { Linking, Platform } from 'react-native';

const VERSION_CHECK_URL =
  'https://raw.githubusercontent.com/Ivannellas/Tracky_App_Offline/main/version.json';

export function isUpdateCheckerConfigured() {
  return (
    !VERSION_CHECK_URL.includes('YOUR_USERNAME') &&
    !VERSION_CHECK_URL.includes('<') &&
    !VERSION_CHECK_URL.includes('>')
  );
}

export function getCurrentAppVersion() {
  return {
    versionName: Application.nativeApplicationVersion || '1.0.7',
    versionCode: parseInt(Application.nativeBuildVersion || '8', 10),
  };
}

/**
 * Checks remote version.json with a 6s timeout so offline startup never hangs.
 * Returns { status: 'update-available' | 'up-to-date' | 'unconfigured' | 'error', remoteData?, currentVersion?, message? }
 */
export async function fetchUpdateStatus() {
  if (Platform.OS !== 'android') {
    return { status: 'up-to-date' };
  }

  if (!isUpdateCheckerConfigured()) {
    return {
      status: 'unconfigured',
      message: 'Please configure a valid GitHub raw URL in src/api/updateChecker.js.',
    };
  }

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 6000);

  try {
    const response = await fetch(`${VERSION_CHECK_URL}?t=${Date.now()}`, {
      cache: 'no-store',
      signal: controller.signal,
    });

    if (!response.ok) {
      throw new Error(`Server returned HTTP ${response.status}`);
    }

    const remoteData = await response.json();
    const current = getCurrentAppVersion();

    if (Number(remoteData.versionCode) > current.versionCode) {
      return {
        status: 'update-available',
        remoteData,
        currentVersion: current,
      };
    }

    return {
      status: 'up-to-date',
      remoteData,
      currentVersion: current,
    };
  } catch (error) {
    return {
      status: 'error',
      message:
        error?.name === 'AbortError'
          ? 'Update check timed out. Check your internet connection.'
          : 'Could not check for updates. Please verify your connection.',
    };
  } finally {
    clearTimeout(timeoutId);
  }
}

/**
 * Downloads the APK with live progress callbacks and opens Android's package installer.
 * Falls back to opening apkUrl in the system browser if intent launch is restricted.
 */
export async function downloadAndInstallApk(apkUrl, onProgress) {
  const apkUri = `${FileSystem.documentDirectory}trackly_update.apk`;

  try {
    const fileInfo = await FileSystem.getInfoAsync(apkUri);
    if (fileInfo.exists) {
      await FileSystem.deleteAsync(apkUri, { idempotent: true });
    }

    const downloadResumable = FileSystem.createDownloadResumable(
      apkUrl,
      apkUri,
      {},
      (progressEvent) => {
        if (onProgress && progressEvent.totalBytesExpectedToWrite > 0) {
          const ratio =
            progressEvent.totalBytesWritten / progressEvent.totalBytesExpectedToWrite;
          onProgress(Math.min(Math.max(ratio, 0), 1));
        }
      }
    );

    const downloadResult = await downloadResumable.downloadAsync();

    if (!downloadResult || downloadResult.status !== 200) {
      throw new Error(`Download failed with status ${downloadResult?.status || 'unknown'}`);
    }

    const contentUri = await FileSystem.getContentUriAsync(downloadResult.uri);

    await IntentLauncher.startActivityAsync('android.intent.action.VIEW', {
      data: contentUri,
      flags: 1, // FLAG_GRANT_READ_URI_PERMISSION
      type: 'application/vnd.android.package-archive',
    });

    return { ok: true };
  } catch (error) {
    console.warn('In-app APK install failed, falling back to browser:', error);

    if (apkUrl) {
      try {
        await Linking.openURL(apkUrl);
        return { ok: true, fallbackBrowser: true };
      } catch (linkError) {
        return {
          ok: false,
          message: 'Could not download or open the update link automatically.',
        };
      }
    }

    return {
      ok: false,
      message: error?.message || 'Update installation failed.',
    };
  }
}