import React, { useState, useContext } from 'react';
import { StyleSheet, Text, View, Modal, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { ThemeContext } from '../context/ThemeContext';
import { downloadAndInstallApk } from '../api/updateChecker';

export default function UpdateModal({ visible, updateInfo, currentVersion, onClose }) {
  const { theme } = useContext(ThemeContext);
  const [isDownloading, setIsDownloading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [errorMessage, setErrorMessage] = useState('');

  if (!updateInfo) return null;

  const handleStartUpdate = async () => {
    if (isDownloading) return;
    setErrorMessage('');
    setIsDownloading(true);
    setProgress(0);

    const result = await downloadAndInstallApk(updateInfo.apkUrl, (ratio) => {
      setProgress(ratio);
    });

    setIsDownloading(false);

    if (result.ok) {
      onClose();
    } else {
      setErrorMessage(result.message || 'Unable to install update.');
    }
  };

  const percent = Math.round(progress * 100);

  return (
    <Modal
      visible={visible}
      transparent={true}
      animationType="fade"
      onRequestClose={() => {
        if (!isDownloading) onClose();
      }}
    >
      <View style={styles.overlay}>
        <View style={[styles.card, { backgroundColor: theme.cardBg, borderColor: theme.border }]}>
          <View style={[styles.iconBadge, { backgroundColor: 'rgba(139, 92, 246, 0.15)' }]}>
            <Ionicons name="cloud-download-outline" size={28} color={theme.primary} />
          </View>

          <View style={[styles.versionPill, { backgroundColor: 'rgba(16, 185, 129, 0.14)' }]}>
            <Text style={styles.versionPillText}>
              v{updateInfo.versionName} Available
            </Text>
          </View>

          <Text style={[styles.title, { color: theme.text }]}>New Trackly Update</Text>

          {currentVersion?.versionName && (
            <Text style={[styles.subMeta, { color: theme.subText }]}>
              Current: v{currentVersion.versionName} → New: v{updateInfo.versionName}
            </Text>
          )}

          {!!updateInfo.releaseNotes && (
            <View style={[styles.notesBox, { backgroundColor: theme.inputBg, borderColor: theme.border }]}>
              <Text style={[styles.notesLabel, { color: theme.subText }]}>WHAT'S NEW</Text>
              <Text style={[styles.notesText, { color: theme.text }]}>
                {updateInfo.releaseNotes}
              </Text>
            </View>
          )}

          {isDownloading && (
            <View style={styles.progressSection}>
              <View style={styles.progressHeader}>
                <Text style={[styles.progressLabel, { color: theme.subText }]}>
                  Downloading APK...
                </Text>
                <Text style={[styles.progressPercent, { color: theme.primary }]}>
                  {percent}%
                </Text>
              </View>
              <View style={[styles.progressTrack, { backgroundColor: theme.inputBg }]}>
                <View
                  style={[
                    styles.progressFill,
                    { backgroundColor: theme.primary, width: `${percent}%` },
                  ]}
                />
              </View>
            </View>
          )}

          {!!errorMessage && (
            <Text style={styles.errorText}>{errorMessage}</Text>
          )}

          <View style={styles.buttonRow}>
            {!isDownloading && (
              <TouchableOpacity
                style={[styles.laterBtn, { backgroundColor: theme.inputBg, borderColor: theme.border }]}
                onPress={onClose}
                activeOpacity={0.8}
              >
                <Text style={[styles.laterText, { color: theme.text }]}>Later</Text>
              </TouchableOpacity>
            )}

            <TouchableOpacity
              style={[
                styles.updateBtn,
                { backgroundColor: theme.primary, opacity: isDownloading ? 0.75 : 1 },
              ]}
              onPress={handleStartUpdate}
              disabled={isDownloading}
              activeOpacity={0.85}
            >
              <Text style={styles.updateText}>
                {isDownloading ? `Downloading (${percent}%)` : 'Update Now'}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.68)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  card: {
    width: '100%',
    maxWidth: 340,
    borderRadius: 20,
    padding: 20,
    borderWidth: 1,
    alignItems: 'center',
    elevation: 6,
  },
  iconBadge: {
    width: 54,
    height: 54,
    borderRadius: 27,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 10,
  },
  versionPill: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 999,
    marginBottom: 8,
  },
  versionPillText: {
    color: '#10B981',
    fontSize: 11,
    fontWeight: '700',
  },
  title: {
    fontSize: 18,
    fontWeight: '700',
    textAlign: 'center',
  },
  subMeta: {
    fontSize: 11,
    marginTop: 2,
    marginBottom: 14,
  },
  notesBox: {
    width: '100%',
    borderRadius: 12,
    borderWidth: 1,
    padding: 12,
    marginBottom: 16,
  },
  notesLabel: {
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 0.6,
    marginBottom: 4,
  },
  notesText: {
    fontSize: 12,
    lineHeight: 18,
  },
  progressSection: {
    width: '100%',
    marginBottom: 16,
  },
  progressHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  progressLabel: {
    fontSize: 11,
    fontWeight: '600',
  },
  progressPercent: {
    fontSize: 11,
    fontWeight: '700',
  },
  progressTrack: {
    width: '100%',
    height: 8,
    borderRadius: 4,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: 4,
  },
  errorText: {
    color: '#EF4444',
    fontSize: 11,
    textAlign: 'center',
    marginBottom: 12,
  },
  buttonRow: {
    flexDirection: 'row',
    gap: 10,
    width: '100%',
  },
  laterBtn: {
    flex: 1,
    height: 44,
    borderRadius: 10,
    borderWidth: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  laterText: {
    fontSize: 13,
    fontWeight: '600',
  },
  updateBtn: {
    flex: 1.4,
    height: 44,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  updateText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '700',
  },
});