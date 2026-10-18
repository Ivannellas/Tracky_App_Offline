import React, { useState, useContext } from 'react';
import { StyleSheet, Text, View, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { AuthContext } from '../context/AuthContext';
import { ThemeContext } from '../context/ThemeContext';

export default function LockScreen() {
  const { theme } = useContext(ThemeContext);
  const {
    hasPinSet,
    isBiometricSupported,
    biometricType,
    setupPin,
    verifyPin,
    authenticateBiometrics,
  } = useContext(AuthContext);

  const [pin, setPin] = useState('');
  const [confirmPin, setConfirmPin] = useState('');
  const [isConfirming, setIsConfirming] = useState(false);
  const [error, setError] = useState('');

  const handleKeyPress = (num) => {
    if (pin.length < 4) {
      const updatedPin = pin + num;
      setPin(updatedPin);
      setError('');

      if (updatedPin.length === 4) {
        handlePinComplete(updatedPin);
      }
    }
  };

  const handleDelete = () => {
    if (pin.length > 0) {
      setPin(pin.slice(0, -1));
      setError('');
    }
  };

  const handlePinComplete = (completedPin) => {
    if (!hasPinSet) {
      if (!isConfirming) {
        setConfirmPin(completedPin);
        setPin('');
        setIsConfirming(true);
      } else {
        if (completedPin === confirmPin) {
          setupPin(completedPin);
        } else {
          setError('PINs do not match. Try again.');
          setPin('');
          setConfirmPin('');
          setIsConfirming(false);
        }
      }
    } else {
      const isValid = verifyPin(completedPin);
      if (!isValid) {
        setError('Incorrect PIN. Please try again.');
        setPin('');
      }
    }
  };

  const getHeaderTitle = () => {
    if (!hasPinSet) {
      return isConfirming ? 'Confirm 4-Digit PIN' : 'Create 4-Digit PIN';
    }
    return 'Enter App PIN';
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.bg }]}>
      <View style={styles.topSection}>
        <Ionicons
          name={hasPinSet ? 'lock-closed' : 'shield-checkmark'}
          size={48}
          color={theme.primary}
          style={{ marginBottom: 16 }}
        />
        <Text style={[styles.title, { color: theme.text }]}>{getHeaderTitle()}</Text>
        <Text style={[styles.subtitle, { color: theme.subText }]}>
          {!hasPinSet
            ? 'Set a PIN code to keep your financial data private'
            : 'Enter PIN or tap biometrics to unlock'}
        </Text>

        <View style={styles.dotsContainer}>
          {[0, 1, 2, 3].map((index) => (
            <View
              key={index}
              style={[
                styles.dot,
                { borderColor: theme.primary },
                pin.length > index && { backgroundColor: theme.primary },
              ]}
            />
          ))}
        </View>

        {error ? <Text style={styles.errorText}>{error}</Text> : null}
      </View>

      <View style={styles.keypad}>
        {[
          ['1', '2', '3'],
          ['4', '5', '6'],
          ['7', '8', '9'],
        ].map((row, rIndex) => (
          <View key={rIndex} style={styles.keyRow}>
            {row.map((num) => (
              <TouchableOpacity
                key={num}
                style={[styles.keyBtn, { backgroundColor: theme.cardBg }]}
                onPress={() => handleKeyPress(num)}
              >
                <Text style={[styles.keyText, { color: theme.text }]}>{num}</Text>
              </TouchableOpacity>
            ))}
          </View>
        ))}

        <View style={styles.keyRow}>
          {hasPinSet && isBiometricSupported ? (
            <TouchableOpacity
              style={[styles.keyBtn, { backgroundColor: theme.cardBg, borderColor: theme.primary, borderWidth: 1 }]}
              onPress={authenticateBiometrics}
            >
              <Ionicons 
                name={biometricType === 'face' ? 'scan-outline' : 'finger-print'} 
                size={26} 
                color={theme.primary} 
              />
            </TouchableOpacity>
          ) : (
            <View style={styles.keyBtnPlaceholder} />
          )}

          <TouchableOpacity
            style={[styles.keyBtn, { backgroundColor: theme.cardBg }]}
            onPress={() => handleKeyPress('0')}
          >
            <Text style={[styles.keyText, { color: theme.text }]}>0</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.keyBtn, { backgroundColor: theme.cardBg }]}
            onPress={handleDelete}
          >
            <Ionicons name="backspace-outline" size={24} color={theme.text} />
          </TouchableOpacity>
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: 'space-between', paddingHorizontal: 24, paddingVertical: 20 },
  topSection: { alignItems: 'center', marginTop: 40 },
  title: { fontSize: 22, fontWeight: 'bold', marginBottom: 8 },
  subtitle: { fontSize: 13, textAlign: 'center', marginBottom: 28 },
  dotsContainer: { flexDirection: 'row', gap: 16, marginBottom: 12 },
  dot: { width: 16, height: 16, borderRadius: 8, borderWidth: 2 },
  errorText: { color: '#EF4444', fontSize: 13, fontWeight: '600', marginTop: 8 },
  keypad: { marginBottom: 30 },
  keyRow: { flexDirection: 'row', justifyContent: 'space-around', marginBottom: 16 },
  keyBtn: {
    width: 72,
    height: 72,
    borderRadius: 36,
    justifyContent: 'center',
    alignItems: 'center',
  },
  keyBtnPlaceholder: { width: 72, height: 72 },
  keyText: { fontSize: 24, fontWeight: 'bold' },
});