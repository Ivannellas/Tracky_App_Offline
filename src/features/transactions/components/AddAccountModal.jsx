import React, { useState, useContext } from 'react';
import { StyleSheet, Text, View, TextInput, TouchableOpacity, Modal, ScrollView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { insertAccount } from '../../../api/accountsRepo';
import { ThemeContext } from '../../../context/ThemeContext'; // <-- Import Theme Context

// Expanded color palette for wallet card fill
const PALETTE_COLORS = [
  null,      // Default (Uses theme card background)
  '#2563EB', // Royal Blue
  '#059669', // Emerald Green
  '#7C3AED', // Violet Purple
  '#D97706', // Amber Gold
  '#DC2626', // Crimson Red
  '#DB2777', // Magenta / Pink
  '#0891B2', // Cyan / Teal
  '#EA580C', // Orange
  '#475569', // Slate Gray
];

export default function AddAccountModal({ visible, onClose, onSuccess }) {
  const { theme } = useContext(ThemeContext); // <-- Access dynamic theme values

  const [name, setName] = useState('');
  const [balance, setBalance] = useState('');
  const [color, setColor] = useState('#2563EB'); // Default to Royal Blue

  const handleSave = () => {
    if (!name.trim()) return;
    insertAccount(name.trim(), parseFloat(balance) || 0, color);
    setName('');
    setBalance('');
    setColor('#2563EB');
    onSuccess();
    onClose();
  };

  return (
    <Modal visible={visible} animationType="slide" transparent={true}>
      <View style={styles.modalOverlay}>
        <View style={[styles.modalContainer, { backgroundColor: theme.cardBg }]}>
          
          <View style={styles.headerRow}>
            <Text style={[styles.modalTitle, { color: theme.text }]}>Add New Wallet</Text>
            <TouchableOpacity onPress={onClose}>
              <Ionicons name="close" size={24} color={theme.subText} />
            </TouchableOpacity>
          </View>

          <Text style={[styles.label, { color: theme.subText }]}>Wallet Name (Maya, Cash, GCash)</Text>
          <TextInput
            style={[styles.input, { backgroundColor: theme.inputBg, color: theme.text, borderColor: theme.border }]}
            placeholder="Wallet Name"
            placeholderTextColor={theme.subText}
            value={name}
            onChangeText={setName}
          />

          <Text style={[styles.label, { color: theme.subText }]}>Initial Balance (₱)</Text>
          <TextInput
            style={[styles.input, { backgroundColor: theme.inputBg, color: theme.text, borderColor: theme.border }]}
            placeholder="0.00"
            placeholderTextColor={theme.subText}
            keyboardType="numeric"
            value={balance}
            onChangeText={setBalance}
          />

          <Text style={[styles.label, { color: theme.subText }]}>Choose Card Fill Color</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.colorRow}>
            {PALETTE_COLORS.map((c, index) => {
              const isSelected = color === c;
              const circleBg = c || theme.cardBg;

              return (
                <TouchableOpacity
                  key={c || `default-${index}`}
                  style={[
                    styles.colorCircle,
                    { backgroundColor: circleBg, borderColor: theme.border },
                    isSelected && styles.selectedColor,
                  ]}
                  onPress={() => setColor(c)}
                >
                  {isSelected && (
                    <Ionicons name="checkmark" size={18} color="#FFFFFF" />
                  )}
                  {!c && !isSelected && (
                    <Ionicons name="ban-outline" size={14} color={theme.subText} />
                  )}
                </TouchableOpacity>
              );
            })}
          </ScrollView>

          <TouchableOpacity style={[styles.saveBtn, { backgroundColor: theme.primary }]} onPress={handleSave}>
            <Text style={styles.saveBtnText}>Create Wallet</Text>
          </TouchableOpacity>

        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  modalOverlay: { 
    flex: 1, 
    backgroundColor: 'rgba(0,0,0,0.5)', 
    justifyContent: 'flex-end' 
  },
  modalContainer: { 
    borderTopLeftRadius: 24, 
    borderTopRightRadius: 24, 
    padding: 20 
  },
  headerRow: { 
    flexDirection: 'row', 
    justifyContent: 'space-between', 
    alignItems: 'center', 
    marginBottom: 16 
  },
  modalTitle: { 
    fontSize: 18, 
    fontWeight: 'bold' 
  },
  label: { 
    fontSize: 13, 
    marginBottom: 6, 
    marginTop: 12 
  },
  input: { 
    padding: 12, 
    borderRadius: 10, 
    fontSize: 16, 
    borderWidth: 1 
  },
  colorRow: { 
    flexDirection: 'row', 
    marginTop: 8, 
    paddingVertical: 4 
  },
  colorCircle: {
    width: 38,
    height: 38,
    borderRadius: 19,
    marginRight: 10,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
  },
  selectedColor: { 
    borderWidth: 3, 
    borderColor: '#FFFFFF', 
    transform: [{ scale: 1.08 }] 
  },
  saveBtn: { 
    padding: 16, 
    borderRadius: 12, 
    alignItems: 'center', 
    marginTop: 24, 
    marginBottom: 20 
  },
  saveBtnText: { 
    color: '#FFFFFF', 
    fontSize: 16, 
    fontWeight: 'bold' 
  },
});