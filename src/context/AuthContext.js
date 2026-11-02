import React, { createContext, useState, useEffect } from 'react';
import * as LocalAuthentication from 'expo-local-authentication';
import AsyncStorage from '@react-native-async-storage/async-storage';

export const AuthContext = createContext();

const PIN_STORAGE_KEY = '@trackly_user_pin';

export const AuthProvider = ({ children }) => {
    const [isLocked, setIsLocked] = useState(true);
    const [hasPinSet, setHasPinSet] = useState(false);
    const [savedPin, setSavedPin] = useState(null);
    const [isBiometricSupported, setIsBiometricSupported] = useState(false);
    const [biometricType, setBiometricType] = useState('fingerprint'); // Strictly fingerprint
    const [isLoadingSecurity, setIsLoadingSecurity] = useState(true);

    useEffect(() => {
        loadSecuritySettings();
    }, []);

    const loadSecuritySettings = async () => {
        try {
            const pin = await AsyncStorage.getItem(PIN_STORAGE_KEY);

            const hasHardware = await LocalAuthentication.hasHardwareAsync();
            const isEnrolled = await LocalAuthentication.isEnrolledAsync();

            if (hasHardware && isEnrolled) {
                const types = await LocalAuthentication.supportedAuthenticationTypesAsync();

                // STRICT SECURITY RULE: Only allow fingerprint authentication, completely ignore Face ID / Facial Recognition
                const hasFingerprint = types.includes(LocalAuthentication.AuthenticationType.FINGERPRINT);

                if (hasFingerprint) {
                    setIsBiometricSupported(true);
                    setBiometricType('fingerprint');
                } else {
                    // Device has hardware/enrolled, but it's Face Recognition only -> Disable biometrics for higher security
                    setIsBiometricSupported(false);
                }
            } else {
                setIsBiometricSupported(false);
            }

            if (pin) {
                setSavedPin(pin);
                setHasPinSet(true);
                setIsLocked(true);
            } else {
                setHasPinSet(false);
                setIsLocked(true);
            }
        } catch (e) {
            console.error('Error loading security settings:', e);
        } finally {
            setIsLoadingSecurity(false);
        }
    };

    const setupPin = async (newPin) => {
        try {
            await AsyncStorage.setItem(PIN_STORAGE_KEY, newPin);
            setSavedPin(newPin);
            setHasPinSet(true);
            setIsLocked(false);
        } catch (e) {
            console.error('Error saving PIN:', e);
        }
    };

    const removePin = async () => {
        try {
            await AsyncStorage.removeItem(PIN_STORAGE_KEY);
            setSavedPin(null);
            setHasPinSet(false);
            setIsLocked(false);
        } catch (e) {
            console.error('Error removing PIN:', e);
        }
    };

    const authenticateBiometrics = async () => {
        try {
            const result = await LocalAuthentication.authenticateAsync({
                promptMessage: 'Biometrics Login',
                fallbackLabel: 'Use PIN',
                disableDeviceFallback: true,
                cancelLabel: 'Cancel',
                requireConfirmation: true,
                biometricsSecurityLevel: 'strong',
            });

            if (result.success) {
                setIsLocked(false);
                return true;
            }
            return false;
        } catch (error) {
            console.error('Biometric error:', error);
            return false;
        }
    };

    const verifyPin = (enteredPin) => {
        if (enteredPin === savedPin) {
            setIsLocked(false);
            return true;
        }
        return false;
    };

    const lockApp = () => {
        setIsLocked(true);
    };

    return (
        <AuthContext.Provider
            value={{
                isLocked,
                hasPinSet,
                isBiometricSupported,
                biometricType,
                isLoadingSecurity,
                setupPin,
                removePin,
                verifyPin,
                authenticateBiometrics,
                lockApp,
            }}
        >
            {children}
        </AuthContext.Provider>
    );
};