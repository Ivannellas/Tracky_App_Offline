import React, { useState, useEffect, useContext } from 'react';
import { 
  StyleSheet, 
  Text, 
  View, 
  TouchableOpacity, 
  ScrollView, 
  TextInput, 
  Alert 
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { ThemeContext } from '../../../context/ThemeContext';
import { 
  getAllCategories, 
  addCategory, 
  updateCategory, 
  deleteCategory 
} from '../../../api/categoriesRepo';

export default function CategoryManagerScreen({ onBack }) {
  const { theme } = useContext(ThemeContext);

  const [activeType, setActiveType] = useState('expense'); // 'expense' | 'income'
  const [categories, setCategories] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');

  // Inline Creation / Edit State
  const [isEditing, setIsEditing] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [categoryName, setCategoryName] = useState('');
  const [selectedIcon, setSelectedIcon] = useState('pricetag-outline');
  const [selectedColor, setSelectedColor] = useState('#8B5CF6');
  
  // Custom Color Grid Toggle State
  const [showCustomGrid, setShowCustomGrid] = useState(false);

  const ICON_OPTIONS = [
    'cart-outline', 'fast-food-outline', 'car-outline', 'home-outline', 
    'briefcase-outline', 'film-outline', 'fitness-outline', 'medkit-outline',
    'wallet-outline', 'gift-outline', 'school-outline', 'airplane-outline'
  ];

  const COLOR_OPTIONS = [
    '#8B5CF6', '#3B82F6', '#10B981', '#F59E0B', 
    '#EF4444', '#EC4899', '#6366F1', '#14B8A6'
  ];

  // Extended spectrum choices for the custom grid
  const EXTENDED_COLOR_GRID = [
    '#7C3AED', '#6D28D9', '#5B21B6', '#4C1D95',
    '#1D4ED8', '#1E40AF', '#1E3A8A', '#312E81',
    '#047857', '#065F46', '#064E3B', '#022C22',
    '#B45309', '#92400E', '#78350F', '#451A03',
    '#C2410C', '#9A3412', '#7C2D12', '#431407',
    '#B91C1C', '#991B1B', '#7F1D1D', '#450A0A',
    '#BE185D', '#9D174D', '#831843', '#500724',
    '#334155', '#475569', '#64748B', '#0F172A'
  ];

  useEffect(() => {
    loadCategories();
  }, []);

  const loadCategories = () => {
    const data = getAllCategories();
    setCategories(data || []);
  };

  const handleSave = () => {
    if (!categoryName.trim()) {
      Alert.alert('Required Field', 'Please enter a category name.');
      return;
    }

    if (isEditing) {
      updateCategory(editingId, {
        name: categoryName.trim(),
        icon: selectedIcon,
        color: selectedColor,
        type: activeType,
      });
    } else {
      addCategory({
        name: categoryName.trim(),
        icon: selectedIcon,
        color: selectedColor,
        type: activeType,
      });
    }

    resetForm();
    loadCategories();
  };

  const handleStartEdit = (cat) => {
    setIsEditing(true);
    setEditingId(cat.id);
    setCategoryName(cat.name);
    setSelectedIcon(cat.icon || 'pricetag-outline');
    setSelectedColor(cat.color || '#8B5CF6');
    setShowCustomGrid(false);
  };

  const handleDelete = (cat) => {
    Alert.alert(
      'Delete Category',
      `Are you sure you want to delete "${cat.name}"? Transactions assigned to this category will keep their records.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () => {
            deleteCategory(cat.id);
            loadCategories();
          },
        },
      ]
    );
  };

  const resetForm = () => {
    setIsEditing(false);
    setEditingId(null);
    setCategoryName('');
    setSelectedIcon('pricetag-outline');
    setSelectedColor('#8B5CF6');
    setShowCustomGrid(false);
  };

  const filteredCategories = categories.filter((c) => {
    const matchesType = c.type === activeType;
    const matchesSearch = c.name?.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesType && matchesSearch;
  });

  return (
    <View style={[styles.container, { backgroundColor: theme.bg }]}>
      
      {/* --- SCREEN HEADER --- */}
      <View style={styles.header}>
        <TouchableOpacity 
          style={[styles.backBtn, { backgroundColor: theme.cardBg, borderColor: theme.border }]} 
          onPress={onBack}
        >
          <Ionicons name="arrow-back" size={20} color={theme.text} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: theme.text }]}>Category Manager</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        
        {/* --- TYPE SWITCHER SEGMENT --- */}
        <View style={[styles.segmentContainer, { backgroundColor: theme.cardBg, borderColor: theme.border }]}>
          <TouchableOpacity 
            style={[
              styles.segmentBtn, 
              activeType === 'expense' && { backgroundColor: theme.primary }
            ]}
            onPress={() => { setActiveType('expense'); resetForm(); }}
          >
            <Text style={[styles.segmentText, activeType === 'expense' ? styles.activeSegmentText : { color: theme.subText }]}>
              Expenses
            </Text>
          </TouchableOpacity>

          <TouchableOpacity 
            style={[
              styles.segmentBtn, 
              activeType === 'income' && { backgroundColor: theme.primary }
            ]}
            onPress={() => { setActiveType('income'); resetForm(); }}
          >
            <Text style={[styles.segmentText, activeType === 'income' ? styles.activeSegmentText : { color: theme.subText }]}>
              Income
            </Text>
          </TouchableOpacity>
        </View>

        {/* --- ADD / EDIT FORM CARD --- */}
        <View style={[styles.formCard, { backgroundColor: theme.cardBg, borderColor: theme.border }]}>
          <View style={styles.formHeader}>
            <Text style={[styles.formTitle, { color: theme.text }]}>
              {isEditing ? 'Edit Category' : `Add New ${activeType === 'expense' ? 'Expense' : 'Income'} Category`}
            </Text>
            {isEditing && (
              <TouchableOpacity onPress={resetForm}>
                <Text style={{ fontSize: 11, color: '#EF4444', fontWeight: '600' }}>Cancel</Text>
              </TouchableOpacity>
            )}
          </View>

          {/* Name Input */}
          <TextInput
            style={[styles.input, { backgroundColor: theme.inputBg, color: theme.text, borderColor: theme.border }]}
            placeholder="Category Name (e.g. Groceries, Salary)"
            placeholderTextColor={theme.subText}
            value={categoryName}
            onChangeText={setCategoryName}
          />

          {/* Color Selector Row */}
          <Text style={[styles.pickerLabel, { color: theme.subText }]}>Select Badge Color</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.pickerRow}>
            {COLOR_OPTIONS.map((color) => (
              <TouchableOpacity
                key={color}
                style={[
                  styles.colorDot, 
                  { backgroundColor: color },
                  selectedColor === color && styles.selectedColorDot
                ]}
                onPress={() => {
                  setSelectedColor(color);
                  setShowCustomGrid(false);
                }}
              />
            ))}

            {/* --- LAST CIRCLE: CUSTOM COLOR PICKER TOGGLE --- */}
            <TouchableOpacity
              style={[
                styles.colorDot,
                styles.customPickerCircle,
                { backgroundColor: theme.inputBg, borderColor: theme.border },
                showCustomGrid && styles.selectedColorDot
              ]}
              onPress={() => setShowCustomGrid(!showCustomGrid)}
            >
              <Ionicons name="color-palette-outline" size={14} color={theme.text} />
            </TouchableOpacity>
          </ScrollView>

          {/* --- EXPANDED CUSTOM COLOR GRID (Circular Swatches) --- */}
          {showCustomGrid && (
            <View style={[styles.customGridContainer, { backgroundColor: theme.inputBg, borderColor: theme.border }]}>
              <Text style={[styles.gridSubLabel, { color: theme.subText }]}>Choose Custom Shade</Text>
              <View style={styles.colorGridMatrix}>
                {EXTENDED_COLOR_GRID.map((color) => (
                  <TouchableOpacity
                    key={color}
                    style={[
                      styles.gridColorBox,
                      { backgroundColor: color },
                      selectedColor === color && styles.selectedGridBox
                    ]}
                    onPress={() => setSelectedColor(color)}
                  />
                ))}
              </View>
            </View>
          )}

          {/* Icon Selector Grid */}
          <Text style={[styles.pickerLabel, { color: theme.subText }]}>Select Icon</Text>
          <View style={styles.iconGrid}>
            {ICON_OPTIONS.map((icon) => (
              <TouchableOpacity
                key={icon}
                style={[
                  styles.iconBox,
                  { backgroundColor: theme.inputBg, borderColor: theme.border },
                  selectedIcon === icon && { backgroundColor: selectedColor, borderColor: selectedColor }
                ]}
                onPress={() => setSelectedIcon(icon)}
              >
                <Ionicons 
                  name={icon} 
                  size={18} 
                  color={selectedIcon === icon ? '#FFFFFF' : theme.text} 
                />
              </TouchableOpacity>
            ))}
          </View>

          {/* Save Action Button */}
          <TouchableOpacity 
            style={[styles.saveBtn, { backgroundColor: selectedColor }]} 
            onPress={handleSave}
          >
            <Ionicons name={isEditing ? "checkmark-circle" : "add-circle"} size={18} color="#FFFFFF" />
            <Text style={styles.saveBtnText}>{isEditing ? 'Update Category' : 'Save Category'}</Text>
          </TouchableOpacity>
        </View>

        {/* --- SEARCH & LIST HEADER --- */}
        <View style={styles.listHeaderRow}>
          <Text style={[styles.sectionTitle, { color: theme.text }]}>
            Existing {activeType === 'expense' ? 'Expenses' : 'Income'} ({filteredCategories.length})
          </Text>
        </View>

        <View style={[styles.searchBar, { backgroundColor: theme.cardBg, borderColor: theme.border }]}>
          <Ionicons name="search" size={16} color={theme.subText} style={{ marginRight: 6 }} />
          <TextInput
            style={[styles.searchInput, { color: theme.text }]}
            placeholder="Search category..."
            placeholderTextColor={theme.subText}
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
        </View>

        {/* --- CATEGORIES GRID CARDS --- */}
        {filteredCategories.length === 0 ? (
          <View style={[styles.emptyBox, { backgroundColor: theme.cardBg, borderColor: theme.border }]}>
            <Text style={[styles.emptyText, { color: theme.subText }]}>No categories found.</Text>
          </View>
        ) : (
          <View style={styles.cardsGrid}>
            {filteredCategories.map((cat) => {
              const badgeColor = cat.color || theme.primary;

              return (
                <View 
                  key={cat.id} 
                  style={[styles.categoryCard, { backgroundColor: theme.cardBg, borderColor: theme.border }]}
                >
                  <View style={styles.cardHeader}>
                    <View style={[styles.iconBadge, { backgroundColor: `${badgeColor}20` }]}>
                      <Ionicons name={cat.icon || 'pricetag-outline'} size={20} color={badgeColor} />
                    </View>
                    
                    <View style={styles.cardActions}>
                      <TouchableOpacity onPress={() => handleStartEdit(cat)} style={styles.actionIconBtn}>
                        <Ionicons name="pencil" size={14} color={theme.subText} />
                      </TouchableOpacity>
                      <TouchableOpacity onPress={() => handleDelete(cat)} style={styles.actionIconBtn}>
                        <Ionicons name="trash-outline" size={14} color="#EF4444" />
                      </TouchableOpacity>
                    </View>
                  </View>

                  <Text style={[styles.catName, { color: theme.text }]} numberOfLines={1}>
                    {cat.name}
                  </Text>
                  
                  <Text style={[styles.catMeta, { color: theme.subText }]}>
                    Active category
                  </Text>
                </View>
              );
            })}
          </View>
        )}

      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    justifyContent: 'space-between', 
    paddingHorizontal: 14, 
    paddingTop: 45, 
    paddingBottom: 10 
  },
  backBtn: { width: 38, height: 38, borderRadius: 10, justifyContent: 'center', alignItems: 'center', borderWidth: 1 },
  headerTitle: { fontSize: 18, fontWeight: '700' },
  content: { padding: 14, paddingBottom: 120 },
  segmentContainer: { flexDirection: 'row', padding: 4, borderRadius: 10, borderWidth: 1, marginBottom: 14 },
  segmentBtn: { flex: 1, paddingVertical: 8, borderRadius: 8, alignItems: 'center' },
  segmentText: { fontSize: 12, fontWeight: '600' },
  activeSegmentText: { color: '#FFFFFF', fontWeight: '700' },
  formCard: { padding: 14, borderRadius: 12, borderWidth: 1, marginBottom: 16 },
  formHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 },
  formTitle: { fontSize: 13, fontWeight: '700' },
  input: { height: 40, borderRadius: 8, borderWidth: 1, paddingHorizontal: 12, fontSize: 12, marginBottom: 10 },
  pickerLabel: { fontSize: 10, fontWeight: '700', textTransform: 'uppercase', marginBottom: 6 },
  pickerRow: { flexDirection: 'row', marginBottom: 10 },
  colorDot: { width: 26, height: 26, borderRadius: 13, marginRight: 8, justifyContent: 'center', alignItems: 'center' },
  customPickerCircle: { borderWidth: 1 },
  selectedColorDot: { borderWidth: 2, borderColor: '#8B5CF6', transform: [{ scale: 1.1 }] },
  
  // Custom Color Grid Styles (Circular Swatches)
  customGridContainer: {
    padding: 10,
    borderRadius: 8,
    borderWidth: 1,
    marginBottom: 12,
  },
  gridSubLabel: {
    fontSize: 10,
    fontWeight: '700',
    marginBottom: 8,
    textTransform: 'uppercase',
  },
  colorGridMatrix: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  gridColorBox: {
    width: 28,
    height: 28,
    borderRadius: 14,
  },
  selectedGridBox: {
    borderWidth: 2.5,
    borderColor: '#FFFFFF',
    transform: [{ scale: 1.15 }],
  },

  iconGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginBottom: 14 },
  iconBox: { width: 38, height: 38, borderRadius: 8, justifyContent: 'center', alignItems: 'center', borderWidth: 1 },
  saveBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', height: 42, borderRadius: 8, gap: 6 },
  saveBtnText: { color: '#FFFFFF', fontWeight: '700', fontSize: 13 },
  listHeaderRow: { marginBottom: 8 },
  sectionTitle: { fontSize: 14, fontWeight: '700' },
  searchBar: { flexDirection: 'row', alignItems: 'center', height: 36, borderRadius: 8, borderWidth: 1, paddingHorizontal: 10, marginBottom: 12 },
  searchInput: { flex: 1, fontSize: 12 },
  cardsGrid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between' },
  categoryCard: { width: '48%', padding: 12, borderRadius: 10, borderWidth: 1, marginBottom: 10 },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
  iconBadge: { width: 36, height: 36, borderRadius: 9, justifyContent: 'center', alignItems: 'center' },
  cardActions: { flexDirection: 'row', gap: 6 },
  actionIconBtn: { padding: 4 },
  catName: { fontSize: 13, fontWeight: '700', marginBottom: 2 },
  catMeta: { fontSize: 10 },
  emptyBox: { padding: 20, borderRadius: 10, alignItems: 'center', borderWidth: 1 },
  emptyText: { fontSize: 12 }
});