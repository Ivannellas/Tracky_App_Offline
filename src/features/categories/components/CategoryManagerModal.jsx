import React, { useState, useEffect, useContext } from 'react';
import {
  StyleSheet,
  Text,
  View,
  TextInput,
  TouchableOpacity,
  Modal,
  FlatList,
  Alert,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  TouchableWithoutFeedback,
  Keyboard,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import {
  getAllCategories,
  createCategory,
  updateCategory,
  deleteCategory,
  getCategoryTransactionCount,
} from '../../../api/categoriesRepo';
import { ThemeContext } from '../../../context/ThemeContext';

const PALETTE_COLORS = [
  '#8B5CF6', // Purple
  '#2563EB', // Blue
  '#059669', // Emerald Green
  '#D97706', // Amber
  '#EF4444', // Red
  '#EC4899', // Pink
  '#06B6D4', // Cyan
  '#F97316', // Orange
  '#64748B', // Slate
];

export default function CategoryManagerModal({ visible, onClose, onChange }) {
  const { theme } = useContext(ThemeContext);

  const [categories, setCategories] = useState([]);
  const [activeType, setActiveType] = useState('expense');

  // Form State
  const [editingCategory, setEditingCategory] = useState(null);
  const [name, setName] = useState('');
  const [color, setColor] = useState('#8B5CF6');

  useEffect(() => {
    if (visible) {
      loadCategories();
    }
  }, [visible]);

  const loadCategories = () => {
    setCategories(getAllCategories());
    resetForm();
  };

  const resetForm = () => {
    setEditingCategory(null);
    setName('');
    setColor('#8B5CF6');
  };

  const handleSave = () => {
    if (!name.trim()) return;

    if (editingCategory) {
      updateCategory(editingCategory.id, { name: name.trim(), color });
    } else {
      createCategory({ name: name.trim(), type: activeType, color });
    }

    loadCategories();
    if (onChange) onChange();
  };

  const handleDelete = (category) => {
    const txCount = getCategoryTransactionCount(category.id);

    let alertTitle = 'Delete Category';
    let alertMessage = `Are you sure you want to delete "${category.name}"?`;

    if (txCount > 0) {
      alertMessage = `⚠️ WARNING: This category contains ${txCount} transaction(s). Deleting it will permanently remove all associated data!`;
    }

    Alert.alert(alertTitle, alertMessage, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete Everything',
        style: 'destructive',
        onPress: () => {
          deleteCategory(category.id);
          loadCategories();
          if (onChange) onChange();
        },
      },
    ]);
  };

  const handleEditPress = (category) => {
    setEditingCategory(category);
    setName(category.name);
    setColor(category.color || '#8B5CF6');
  };

  const filteredCategories = categories.filter((c) => c.type === activeType);

  return (
    <Modal visible={visible} animationType="slide" transparent={true}>
      <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
        <View style={styles.overlay}>
          <KeyboardAvoidingView
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
            style={styles.keyboardView}
          >
            <View style={[styles.modalContent, { backgroundColor: theme.cardBg, borderColor: theme.border }]}>
              
              {/* Header */}
              <View style={styles.header}>
                <Text style={[styles.title, { color: theme.text }]}>Manage Categories</Text>
                <TouchableOpacity onPress={onClose} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
                  <Ionicons name="close" size={20} color={theme.subText} />
                </TouchableOpacity>
              </View>

              {/* Type Tabs */}
              <View style={[styles.typeRow, { backgroundColor: theme.inputBg, borderColor: theme.border }]}>
                <TouchableOpacity
                  style={[styles.typeTab, activeType === 'expense' && styles.activeExpense]}
                  onPress={() => {
                    setActiveType('expense');
                    resetForm();
                  }}
                >
                  <Text style={[styles.typeText, { color: theme.subText }, activeType === 'expense' && styles.whiteText]}>
                    Expenses
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.typeTab, activeType === 'income' && styles.activeIncome]}
                  onPress={() => {
                    setActiveType('income');
                    resetForm();
                  }}
                >
                  <Text style={[styles.typeText, { color: theme.subText }, activeType === 'income' && styles.whiteText]}>
                    Income
                  </Text>
                </TouchableOpacity>
              </View>

              {/* Add / Edit Input Form */}
              <View style={[styles.formContainer, { backgroundColor: theme.inputBg, borderColor: theme.border }]}>
                <Text style={[styles.formLabel, { color: theme.subText }]}>
                  {editingCategory ? `Edit "${editingCategory.name}"` : 'Add New Category'}
                </Text>
                
                <View style={styles.inputRow}>
                  <TextInput
                    style={[styles.input, { backgroundColor: theme.cardBg, color: theme.text, borderColor: theme.border }]}
                    placeholder="Category name..."
                    placeholderTextColor={theme.subText}
                    value={name}
                    onChangeText={setName}
                  />
                  <TouchableOpacity style={[styles.saveBtn, { backgroundColor: theme.primary }]} onPress={handleSave}>
                    <Text style={styles.saveBtnText}>
                      {editingCategory ? 'Update' : 'Add'}
                    </Text>
                  </TouchableOpacity>
                  {editingCategory && (
                    <TouchableOpacity style={[styles.cancelBtn, { backgroundColor: theme.border }]} onPress={resetForm}>
                      <Text style={[styles.cancelBtnText, { color: theme.text }]}>Cancel</Text>
                    </TouchableOpacity>
                  )}
                </View>

                {/* Color Swatches */}
                <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.colorRow}>
                  {PALETTE_COLORS.map((c) => {
                    const isSelected = color === c;
                    return (
                      <TouchableOpacity
                        key={c}
                        style={[styles.colorDot, { backgroundColor: c }, isSelected && styles.selectedDot]}
                        onPress={() => setColor(c)}
                      >
                        {isSelected && <Ionicons name="checkmark" size={12} color="#FFFFFF" />}
                      </TouchableOpacity>
                    );
                  })}
                </ScrollView>
              </View>

              {/* Category List */}
              <FlatList
                data={filteredCategories}
                keyExtractor={(item) => item.id.toString()}
                showsVerticalScrollIndicator={false}
                contentContainerStyle={{ paddingBottom: 16 }}
                ListEmptyComponent={
                  <View style={styles.emptyState}>
                    <Text style={[styles.emptyText, { color: theme.subText }]}>No categories found for {activeType}.</Text>
                  </View>
                }
                renderItem={({ item }) => {
                  const txCount = getCategoryTransactionCount(item.id);

                  return (
                    <View style={[styles.categoryItem, { backgroundColor: theme.inputBg, borderColor: theme.border }]}>
                      <View style={styles.categoryLeft}>
                        <View style={[styles.listColorDot, { backgroundColor: item.color || '#8B5CF6' }]} />
                        <View>
                          <Text style={[styles.categoryName, { color: theme.text }]}>{item.name}</Text>
                          {txCount > 0 && (
                            <Text style={[styles.usageText, { color: theme.subText }]}>{txCount} transaction{txCount > 1 ? 's' : ''}</Text>
                          )}
                        </View>
                      </View>

                      <View style={styles.actions}>
                        <TouchableOpacity style={styles.iconBtn} onPress={() => handleEditPress(item)}>
                          <Ionicons name="pencil" size={16} color={theme.primary} />
                        </TouchableOpacity>
                        <TouchableOpacity style={styles.iconBtn} onPress={() => handleDelete(item)}>
                          <Ionicons name="trash-outline" size={16} color="#EF4444" />
                        </TouchableOpacity>
                      </View>
                    </View>
                  );
                }}
              />

            </View>
          </KeyboardAvoidingView>
        </View>
      </TouchableWithoutFeedback>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.6)',
    justify: 'flex-end',
  },
  keyboardView: {
    width: '100%',
    justifyContent: 'flex-end',
  },
  modalContent: {
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingHorizontal: 16,
    paddingTop: 14,
    maxHeight: '92%',
    borderWidth: 1,
    borderBottomWidth: 0,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  title: { fontSize: 17, fontWeight: '700' },
  typeRow: {
    flexDirection: 'row',
    borderRadius: 10,
    padding: 3,
    marginBottom: 10,
    borderWidth: 1,
  },
  typeTab: {
    flex: 1,
    paddingVertical: 8,
    alignItems: 'center',
    borderRadius: 8,
  },
  activeExpense: { backgroundColor: '#EF4444' },
  activeIncome: { backgroundColor: '#10B981' },
  typeText: { fontWeight: '600', fontSize: 13 },
  whiteText: { color: '#FFFFFF' },
  formContainer: {
    padding: 10,
    borderRadius: 10,
    marginBottom: 12,
    borderWidth: 1,
  },
  formLabel: {
    fontSize: 11,
    marginBottom: 6,
    fontWeight: '700',
    textTransform: 'uppercase',
  },
  inputRow: { flexDirection: 'row', gap: 6 },
  input: {
    flex: 1,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 14,
    borderWidth: 1,
  },
  colorRow: {
    flexDirection: 'row',
    marginTop: 8,
    paddingVertical: 2,
  },
  colorDot: {
    width: 24,
    height: 24,
    borderRadius: 12,
    marginRight: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  selectedDot: {
    borderWidth: 2,
    borderColor: '#FFFFFF',
    transform: [{ scale: 1.1 }],
  },
  saveBtn: {
    paddingHorizontal: 14,
    borderRadius: 8,
    justifyContent: 'center',
  },
  saveBtnText: { color: '#FFFFFF', fontWeight: '700', fontSize: 13 },
  cancelBtn: {
    paddingHorizontal: 10,
    borderRadius: 8,
    justifyContent: 'center',
  },
  cancelBtnText: { fontSize: 12, fontWeight: '600' },
  categoryItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 10,
    borderRadius: 8,
    marginBottom: 6,
    borderWidth: 1,
  },
  categoryLeft: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  listColorDot: { width: 10, height: 10, borderRadius: 5 },
  categoryName: { fontSize: 14, fontWeight: '600' },
  usageText: { fontSize: 10, marginTop: 1 },
  actions: { flexDirection: 'row', gap: 4 },
  iconBtn: { padding: 4 },
  emptyState: { paddingVertical: 20, alignItems: 'center' },
  emptyText: { fontSize: 13 },
});