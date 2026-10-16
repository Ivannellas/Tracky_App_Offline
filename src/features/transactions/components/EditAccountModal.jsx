import React, { useState, useEffect } from 'react';
import { StyleSheet, Text, View, TextInput, TouchableOpacity, Modal } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { updateAccount } from '../../../api/accountsRepo';

export default function EditAccountModal({ visible, account, onClose, onSuccess }) {
  const [name, setName] = useState('');
  const [color, setColor] = useState('#3B82F6');

  const colors = ['#3B82F6', '#10B981', '#8B5CF6', '#F59E0B', '#EC4899', '#06B6D4'];

  useEffect(() => {
    if (visible && account) {
      setName(account.name);
      setColor(account.color || '#3B82F6');
    }
  }, [visible, account]);

  const handleUpdate = () => {
    if (!name || !account) return;
    updateAccount(account.id, name, color);
    onSuccess();
    onClose();
  };

  return (
    <Modal visible={visible} animationType="slide" transparent={true}>
      <View style={styles.modalOverlay}>
        <View style={styles.modalContainer}>
          <View style={styles.headerRow}>
            <Text style={styles.modalTitle}>Edit Wallet</Text>
            <TouchableOpacity onPress={onClose}>
              <Ionicons name="close" size={24} color="#94A3B8" />
            </TouchableOpacity>
          </View>

          <Text style={styles.label}>Wallet Name</Text>
          <TextInput
            style={styles.input}
            placeholder="Wallet Name"
            placeholderTextColor="#64748B"
            value={name}
            onChangeText={setName}
          />

          <Text style={styles.label}>Choose Accent Color</Text>
          <View style={styles.colorRow}>
            {colors.map((c) => (
              <TouchableOpacity
                key={c}
                style={[styles.colorCircle, { backgroundColor: c }, color === c && styles.selectedColor]}
                onPress={() => setColor(c)}
              />
            ))}
          </View>

          <TouchableOpacity style={styles.saveBtn} onPress={handleUpdate}>
            <Text style={styles.saveBtnText}>Save Changes</Text>
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
  colorRow: { flexDirection: 'row', gap: 12, marginTop: 8 },
  colorCircle: { width: 32, height: 32, borderRadius: 16 },
  selectedColor: { borderWidth: 3, borderColor: '#FFFFFF' },
  saveBtn: { backgroundColor: '#8B5CF6', padding: 16, borderRadius: 12, alignItems: 'center', marginTop: 24, marginBottom: 20 },
  saveBtnText: { color: '#FFFFFF', fontSize: 16, fontWeight: 'bold' },
});