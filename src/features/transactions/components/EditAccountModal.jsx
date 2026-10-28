import React, { useState, useEffect, useContext } from 'react';
import { 
  StyleSheet, 
  Text, 
  View, 
  TextInput, 
  TouchableOpacity, 
  Modal, 
  ScrollView, 
  KeyboardAvoidingView, 
  Platform, 
  TouchableWithoutFeedback, 
  Keyboard 
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { updateAccount } from '../../../api/accountsRepo';
import { ThemeContext } from '../../../context/ThemeContext';

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

export default function EditAccountModal({ visible, account, onClose, onSuccess }) {
  const { theme } = useContext(ThemeContext);

  const [name, setName] = useState('');
  const [color, setColor] = useState(null);

  useEffect(() => {
    if (visible && account) {
      setName(account.name);
      setColor(account.color || null);
    }
  }, [visible, account]);

  const handleUpdate = () => {
    if (!name.trim() || !account) return;
    updateAccount(account.id, name.trim(), color);
    onSuccess();
    onClose();
  };

  return (
    <Modal visible={visible} animationType="slide" transparent={true}>
      <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
        <View style={styles.modalOverlay}>
          <KeyboardAvoidingView 
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
            style={styles.keyboardView}
          >
            <View style={[styles.modalContainer, { backgroundColor: theme.cardBg, borderColor: theme.border }]}>
              
              <View style={styles.headerRow}>
                <Text style={[styles.modalTitle, { color: theme.text }]}>Edit Wallet</Text>
                <TouchableOpacity onPress={onClose} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
                  <Ionicons name="close" size={20} color={theme.subText} />
                </TouchableOpacity>
              </View>

              <Text style={[styles.label, { color: theme.subText }]}>Wallet Name</Text>
              <TextInput
                style={[styles.input, { backgroundColor: theme.inputBg, color: theme.text, borderColor: theme.border }]}
                placeholder="Wallet Name"
                placeholderTextColor={theme.subText}
                value={name}
                onChangeText={setName}
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
                        <Ionicons name="checkmark" size={14} color="#FFFFFF" />
                      )}
                      {!c && !isSelected && (
                        <Ionicons name="ban-outline" size={12} color={theme.subText} />
                      )}
                    </TouchableOpacity>
                  );
                })}
              </ScrollView>

              <TouchableOpacity style={[styles.saveBtn, { backgroundColor: theme.primary }]} onPress={handleUpdate}>
                <Text style={styles.saveBtnText}>Save Changes</Text>
              </TouchableOpacity>

            </View>
          </KeyboardAvoidingView>
        </View>
      </TouchableWithoutFeedback>
    </Modal>
  );
}

const styles = StyleSheet.create({
  modalOverlay: { 
    flex: 1, 
    backgroundColor: 'rgba(0,0,0,0.6)', 
    justifyContent: 'flex-end' 
  },
  keyboardView: {
    width: '100%',
    justifyContent: 'flex-end',
  },
  modalContainer: { 
    borderTopLeftRadius: 16, 
    borderTopRightRadius: 16, 
    padding: 16,
    borderWidth: 1,
    borderBottomWidth: 0,
  },
  headerRow: { 
    flexDirection: 'row', 
    justifyContent: 'space-between', 
    alignItems: 'center', 
    marginBottom: 12 
  },
  modalTitle: { 
    fontSize: 16, 
    fontWeight: '700' 
  },
  label: { 
    fontSize: 11, 
    fontWeight: '600',
    marginBottom: 4, 
    marginTop: 10 
  },
  input: { 
    padding: 10, 
    borderRadius: 8, 
    fontSize: 13, 
    borderWidth: 1 
  },
  colorRow: { 
    flexDirection: 'row', 
    marginTop: 6, 
    paddingVertical: 2 
  },
  colorCircle: {
    width: 30,
    height: 30,
    borderRadius: 15,
    marginRight: 8,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
  },
  selectedColor: { 
    borderWidth: 2, 
    borderColor: '#FFFFFF', 
    transform: [{ scale: 1.08 }] 
  },
  saveBtn: { 
    padding: 12, 
    borderRadius: 8, 
    alignItems: 'center', 
    marginTop: 18, 
    marginBottom: 12 
  },
  saveBtnText: { 
    color: '#FFFFFF', 
    fontSize: 13, 
    fontWeight: '700' 
  },
});