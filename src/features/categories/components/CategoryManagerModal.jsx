import React, { useState, useEffect } from "react";
import {
  StyleSheet,
  Text,
  View,
  TextInput,
  TouchableOpacity,
  Modal,
  FlatList,
  Alert,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import {
  getAllCategories,
  createCategory,
  updateCategory,
  deleteCategory,
  getCategoryTransactionCount,
} from "../../../api/categoriesRepo";

export default function CategoryManagerModal({ visible, onClose, onChange }) {
  const [categories, setCategories] = useState([]);
  const [activeType, setActiveType] = useState("expense");

  // Form State
  const [editingCategory, setEditingCategory] = useState(null); 
  const [name, setName] = useState("");
  const [color, setColor] = useState("#8B5CF6");

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
    setName("");
    setColor("#8B5CF6");
  };

  const handleSave = () => {
    if (!name.trim()) return;

    if (editingCategory) {
      // Edit existing category
      updateCategory(editingCategory.id, { name, color });
    } else {
      // Add new category
      createCategory({ name, type: activeType, color });
    }

    loadCategories();
    if (onChange) onChange();
  };

  const handleDelete = (category) => {
    // Check if category has active transactions inside it
    const txCount = getCategoryTransactionCount(category.id);

    let alertTitle = "Delete Category";
    let alertMessage = `Are you sure you want to delete "${category.name}"?`;

    if (txCount > 0) {
      alertMessage = `⚠️ WARNING: This category contains ${txCount} transaction(s). If you delete it, all associated data will be permanently deleted and CANNOT be recovered!`;
    }

    Alert.alert(alertTitle, alertMessage, [
      { text: "Cancel", style: "cancel" },
      {
        text: "Delete Everything",
        style: "destructive",
        onPress: () => {
          // Because of ON DELETE CASCADE, this deletes the category and all its transactions completely
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
    setColor(category.color || "#8B5CF6");
  };

  const filteredCategories = categories.filter((c) => c.type === activeType);

  return (
    <Modal visible={visible} animationType="slide" transparent={true}>
      <View style={styles.overlay}>
        <View style={styles.modalContent}>
          <View style={styles.header}>
            <Text style={styles.title}>Manage Categories</Text>
            <TouchableOpacity onPress={onClose}>
              <Ionicons name="close" size={24} color="#94A3B8" />
            </TouchableOpacity>
          </View>

          {/* Type Selector Tabs */}
          <View style={styles.typeRow}>
            <TouchableOpacity
              style={[
                styles.typeTab,
                activeType === "expense" && styles.activeExpense,
              ]}
              onPress={() => {
                setActiveType("expense");
                resetForm();
              }}
            >
              <Text
                style={[
                  styles.typeText,
                  activeType === "expense" && styles.whiteText,
                ]}
              >
                Expenses
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[
                styles.typeTab,
                activeType === "income" && styles.activeIncome,
              ]}
              onPress={() => {
                setActiveType("income");
                resetForm();
              }}
            >
              <Text
                style={[
                  styles.typeText,
                  activeType === "income" && styles.whiteText,
                ]}
              >
                Income
              </Text>
            </TouchableOpacity>
          </View>

          {/* Add / Edit Input Form */}
          <View style={styles.formContainer}>
            <Text style={styles.formLabel}>
              {editingCategory
                ? `Edit "${editingCategory.name}"`
                : "Add New Category"}
            </Text>
            <View style={styles.inputRow}>
              <TextInput
                style={styles.input}
                placeholder="Category name..."
                placeholderTextColor="#64748B"
                value={name}
                onChangeText={setName}
              />
              <TouchableOpacity style={styles.saveBtn} onPress={handleSave}>
                <Text style={styles.saveBtnText}>
                  {editingCategory ? "Update" : "Add"}
                </Text>
              </TouchableOpacity>
              {editingCategory && (
                <TouchableOpacity style={styles.cancelBtn} onPress={resetForm}>
                  <Text style={styles.cancelBtnText}>Cancel</Text>
                </TouchableOpacity>
              )}
            </View>
          </View>

          {/* Category List */}
          <FlatList
            data={filteredCategories}
            keyExtractor={(item) => item.id.toString()}
            style={styles.list}
            renderItem={({ item }) => (
              <View style={styles.categoryItem}>
                <View style={styles.categoryLeft}>
                  <View
                    style={[
                      styles.colorDot,
                      { backgroundColor: item.color || "#8B5CF6" },
                    ]}
                  />
                  <Text style={styles.categoryName}>{item.name}</Text>
                </View>
                <View style={styles.actions}>
                  <TouchableOpacity
                    style={styles.iconBtn}
                    onPress={() => handleEditPress(item)}
                  >
                    <Ionicons name="pencil" size={18} color="#8B5CF6" />
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={styles.iconBtn}
                    onPress={() => handleDelete(item)}
                  >
                    <Ionicons name="trash-outline" size={18} color="#EF4444" />
                  </TouchableOpacity>
                </View>
              </View>
            )}
          />
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.7)",
    justifyContent: "flex-end",
  },
  modalContent: {
    backgroundColor: "#1E293B",
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 20,
    maxHeight: "85%",
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
  },
  title: { color: "#F8FAFC", fontSize: 18, fontWeight: "bold" },
  typeRow: {
    flexDirection: "row",
    backgroundColor: "#0F172A",
    borderRadius: 12,
    padding: 4,
    marginBottom: 16,
  },
  typeTab: {
    flex: 1,
    paddingVertical: 8,
    alignItems: "center",
    borderRadius: 10,
  },
  activeExpense: { backgroundColor: "#EF4444" },
  activeIncome: { backgroundColor: "#10B981" },
  typeText: { color: "#94A3B8", fontWeight: "600", fontSize: 13 },
  whiteText: { color: "#FFFFFF" },
  formContainer: {
    backgroundColor: "#0F172A",
    padding: 12,
    borderRadius: 12,
    marginBottom: 16,
  },
  formLabel: {
    color: "#94A3B8",
    fontSize: 12,
    marginBottom: 8,
    fontWeight: "600",
  },
  inputRow: { flexDirection: "row", gap: 8 },
  input: {
    flex: 1,
    backgroundColor: "#1E293B",
    color: "#F8FAFC",
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    fontSize: 14,
  },
  saveBtn: {
    backgroundColor: "#8B5CF6",
    paddingHorizontal: 16,
    borderRadius: 8,
    justifyContent: "center",
  },
  saveBtnText: { color: "#FFFFFF", fontWeight: "bold", fontSize: 13 },
  cancelBtn: {
    backgroundColor: "#334155",
    paddingHorizontal: 12,
    borderRadius: 8,
    justifyContent: "center",
  },
  cancelBtnText: { color: "#94A3B8", fontSize: 12 },
  list: { marginTop: 8 },
  categoryItem: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    backgroundColor: "#0F172A",
    padding: 12,
    borderRadius: 10,
    marginBottom: 8,
  },
  categoryLeft: { flexDirection: "row", alignItems: "center", gap: 10 },
  colorDot: { width: 12, height: 12, borderRadius: 6 },
  categoryName: { color: "#F8FAFC", fontSize: 15, fontWeight: "500" },
  actions: { flexDirection: "row", gap: 8 },
  iconBtn: { padding: 6 },
});
