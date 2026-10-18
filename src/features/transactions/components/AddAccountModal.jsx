import React, { useState } from 'react';
import { StyleSheet, Text, View, TextInput, TouchableOpacity, Modal, ScrollView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { insertAccount } from '../../../api/accountsRepo';

// Expanded color palette for wallet card fill
const PALETTE_COLORS = [
  null,      // Default (Uses dark card background)
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
        <View style={styles.modalContainer}>
          <View style={styles.headerRow}>
            <Text style={styles.modalTitle}>Add New Wallet</Text>
            <TouchableOpacity onPress={onClose}>
              <Ionicons name="close" size={24} color="#94A3B8" />
            </TouchableOpacity>
          </View>

          <Text style={styles.label}>Wallet Name (e.g. Maya, Cash, GCash)</Text>
          <TextInput
            style={styles.input}
            placeholder="Wallet Name"
            placeholderTextColor="#64748B"
            value={name}
            onChangeText={setName}
          />

          <Text style={styles.label}>Initial Balance (₱)</Text>
          <TextInput
            style={styles.input}
            placeholder="0.00"
            placeholderTextColor="#64748B"
            keyboardType="numeric"
            value={balance}
            onChangeText={setBalance}
          />

          <Text style={styles.label}>Choose Card Fill Color</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.colorRow}>
            {PALETTE_COLORS.map((c, index) => {
              const isSelected = color === c;
              const circleBg = c || '#0F172A';

              return (
                <TouchableOpacity
                  key={c || `default-${index}`}
                  style={[
                    styles.colorCircle,
                    { backgroundColor: circleBg },
                    isSelected && styles.selectedColor,
                  ]}
                  onPress={() => setColor(c)}
                >
                  {isSelected && (
                    <Ionicons name="checkmark" size={18} color="#FFFFFF" />
                  )}
                  {!c && !isSelected && (
                    <Ionicons name="ban-outline" size={14} color="#64748B" />
                  )}
                </TouchableOpacity>
              );
            })}
          </ScrollView>

          <TouchableOpacity style={styles.saveBtn} onPress={handleSave}>
            <Text style={styles.saveBtnText}>Create Wallet</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.7)', justifyContent: 'flex-end' },
  modalContainer: { backgroundColor: '#1E293B', borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 20 },
  headerRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 },
  modalTitle: { color: '#F8FAFC', fontSize: 18, fontWeight: 'bold' },
  label: { color: '#94A3B8', fontSize: 13, marginBottom: 6, marginTop: 12 },
  input: { backgroundColor: '#0F172A', color: '#F8FAFC', padding: 12, borderRadius: 10, fontSize: 16, borderWidth: 1, borderColor: '#334155' },
  colorRow: { flexDirection: 'row', marginTop: 8, paddingVertical: 4 },
  colorCircle: {
    width: 38,
    height: 38,
    borderRadius: 19,
    marginRight: 10,
    justify: 'center',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#334155',
  },
  selectedColor: { borderWidth: 3, borderColor: '#FFFFFF', transform: [{ scale: 1.08 }] },
  saveBtn: { backgroundColor: '#8B5CF6', padding: 16, borderRadius: 12, alignItems: 'center', marginTop: 24, marginBottom: 20 },
  saveBtnText: { color: '#FFFFFF', fontSize: 16, fontWeight: 'bold' },
});