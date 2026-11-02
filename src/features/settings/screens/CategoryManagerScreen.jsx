import React, { useState, useEffect, useContext } from 'react';
import { 
  StyleSheet, 
  Text, 
  View, 
  TouchableOpacity, 
  ScrollView, 
  TextInput, 
  Modal,
  Alert,
  KeyboardAvoidingView,
  Platform
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { ThemeContext } from '../../../context/ThemeContext';
import { 
  getAllCategories, 
  addCategory, 
  updateCategory, 
  deleteCategory,
  getCategoryTransactionCount
} from '../../../api/categoriesRepo';

export default function CategoryManagerScreen({ onBack }) {
  const { theme } = useContext(ThemeContext);

  const [activeType, setActiveType] = useState('expense'); // 'expense' | 'income'
  const [categories, setCategories] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');

  // Modal State
  const [modalVisible, setModalVisible] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [categoryName, setCategoryName] = useState('');
  const [selectedIcon, setSelectedIcon] = useState('pricetag-outline');
  const [selectedColor, setSelectedColor] = useState('#8B5CF6');
  
  // Custom Color Grid Toggle State
  const [showCustomGrid, setShowCustomGrid] = useState(false);

  // Expanded and categorized useful icons (fixed gamepad name to game-controller-outline)
  const ICON_OPTIONS = [
    // Essentials & Bills
    'cart-outline', 'fast-food-outline', 'home-outline', 'flash-outline',
    'water-outline', 'wifi-outline', 'phone-portrait-outline', 'car-outline',
    // Finance & Work
    'wallet-outline', 'briefcase-outline', 'cash-outline', 'card-outline',
    'trending-up-outline', 'calculator-outline', 'receipt-outline', 'bar-chart-outline',
    // Lifestyle & Leisure
    'fitness-outline', 'film-outline', 'airplane-outline', 'gift-outline',
    'school-outline', 'medical-outline', 'shirt-outline', 'game-controller-outline',
    // Extras & Pets
    'paw-outline', 'cafe-outline', 'beer-outline', 'book-outline',
    'hammer-outline', 'construct-outline', 'basket-outline', 'pricetag-outline'
  ];

  const COLOR_OPTIONS = [
    '#8B5CF6', '#3B82F6', '#10B981', '#F59E0B', 
    '#EF4444', '#EC4899', '#6366F1', '#14B8A6'
  ];

  // Vibrant, energetic, and expressive color palette
  const EXTENDED_COLOR_GRID = [
    // Bright & Electric
    '#FF5733', '#FF8D1A', '#FFC300', '#DAF7A6',
    '#33FF57', '#33FFBD', '#33DBFF', '#3380FF',
    // Rich Jewel & Deep Tones
    '#8E44AD', '#9B59B6', '#E74C3C', '#C0392B',
    '#D35400', '#E67E22', '#F1C40F', '#F39C12',
    // Neon & Modern Accents
    '#00E676', '#1DE9B6', '#00B0FF', '#651FFF',
    '#D500F9', '#F50057', '#FF1744', '#FF9100',
    // Deep Midnight & Dark Themes
    '#263238', '#37474F', '#455A64', '#2C3E50',
    '#1A237E', '#311B92', '#4A148C', '#880E4F'
  ];

  useEffect(() => {
    loadCategories();
  }, []);

  const loadCategories = () => {
    const data = getAllCategories();
    const enrichedData = data.map(cat => ({
      ...cat,
      txCount: getCategoryTransactionCount(cat.id)
    }));
    setCategories(enrichedData || []);
  };

  const handleOpenAddModal = () => {
    setIsEditing(false);
    setEditingId(null);
    setCategoryName('');
    setSelectedIcon('pricetag-outline');
    setSelectedColor('#8B5CF6');
    setShowCustomGrid(false);
    setModalVisible(true);
  };

  const handleStartEdit = (cat) => {
    setIsEditing(true);
    setEditingId(cat.id);
    setCategoryName(cat.name);
    setSelectedIcon(cat.icon || 'pricetag-outline');
    setSelectedColor(cat.color || '#8B5CF6');
    setShowCustomGrid(false);
    setModalVisible(true);
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

    setModalVisible(false);
    loadCategories();
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
        
        {/* Add Category Button */}
        <TouchableOpacity 
          style={[styles.addHeaderBtn, { backgroundColor: theme.primary }]} 
          onPress={handleOpenAddModal}
        >
          <Ionicons name="add" size={20} color="#FFFFFF" />
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        
        {/* --- TYPE SWITCHER SEGMENT --- */}
        <View style={[styles.segmentContainer, { backgroundColor: theme.cardBg, borderColor: theme.border }]}>
          <TouchableOpacity 
            style={[styles.segmentBtn, activeType === 'expense' && { backgroundColor: theme.primary }]}
            onPress={() => setActiveType('expense')}
          >
            <Text style={[styles.segmentText, activeType === 'expense' ? styles.activeSegmentText : { color: theme.subText }]}>
              Expenses
            </Text>
          </TouchableOpacity>

          <TouchableOpacity 
            style={[styles.segmentBtn, activeType === 'income' && { backgroundColor: theme.primary }]}
            onPress={() => setActiveType('income')}
          >
            <Text style={[styles.segmentText, activeType === 'income' ? styles.activeSegmentText : { color: theme.subText }]}>
              Income
            </Text>
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

        {/* --- CATEGORIES GRID CARDS (FILLED WITH COLOR) --- */}
        {filteredCategories.length === 0 ? (
          <View style={[styles.emptyBox, { backgroundColor: theme.cardBg, borderColor: theme.border }]}>
            <Ionicons name="folder-open-outline" size={32} color={theme.subText} style={{ marginBottom: 6 }} />
            <Text style={[styles.emptyText, { color: theme.subText }]}>No categories found.</Text>
          </View>
        ) : (
          <View style={styles.cardsGrid}>
            {filteredCategories.map((cat) => {
              const badgeColor = cat.color || theme.primary;

              return (
                <View 
                  key={cat.id} 
                  style={[
                    styles.categoryCard, 
                    { 
                      backgroundColor: `${badgeColor}15`,
                      borderColor: `${badgeColor}40`
                    }
                  ]}
                >
                  <View style={styles.cardHeader}>
                    <View style={[styles.iconBadge, { backgroundColor: badgeColor }]}>
                      <Ionicons name={cat.icon || 'pricetag-outline'} size={18} color="#FFFFFF" />
                    </View>
                    
                    <View style={styles.cardActions}>
                      <TouchableOpacity onPress={() => handleStartEdit(cat)} style={styles.actionIconBtn}>
                        <Ionicons name="pencil" size={14} color={badgeColor} />
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
                    {cat.txCount} {cat.txCount === 1 ? 'transaction' : 'transactions'}
                  </Text>
                </View>
              );
            })}
          </View>
        )}

      </ScrollView>

      {/* --- SLIDE-UP BOTTOM SHEET MODAL (ADD / EDIT FORM) --- */}
      <Modal
        animationType="slide"
        transparent={true}
        visible={modalVisible}
        onRequestClose={() => setModalVisible(false)}
      >
        <KeyboardAvoidingView 
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={styles.modalOverlay}
        >
          <View style={[styles.modalContent, { backgroundColor: theme.cardBg, borderColor: theme.border }]}>
            
            {/* Modal Header & Close Button */}
            <View style={styles.modalHeader}>
              <Text style={[styles.modalTitle, { color: theme.text }]}>
                {isEditing ? 'Edit Category' : `Add New ${activeType === 'expense' ? 'Expense' : 'Income'}`}
              </Text>
              <TouchableOpacity onPress={() => setModalVisible(false)} style={styles.closeModalBtn}>
                <Ionicons name="close" size={20} color={theme.subText} />
              </TouchableOpacity>
            </View>

            <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 20 }}>
              
              {/* --- LIVE PREVIEW CARD --- */}
              <View style={[styles.previewContainer, { backgroundColor: `${selectedColor}15`, borderColor: `${selectedColor}40` }]}>
                <Text style={[styles.previewLabel, { color: selectedColor }]}>Live Preview</Text>
                <View style={styles.previewCardRow}>
                  <View style={[styles.iconBadge, { backgroundColor: selectedColor }]}>
                    <Ionicons name={selectedIcon} size={20} color="#FFFFFF" />
                  </View>
                  <View style={{ marginLeft: 10, flex: 1 }}>
                    <Text style={[styles.catName, { color: theme.text }]} numberOfLines={1}>
                      {categoryName.trim() || 'Category Name'}
                    </Text>
                    <Text style={[styles.catMeta, { color: theme.subText }]}>
                      0 transactions
                    </Text>
                  </View>
                </View>
              </View>

              {/* Name Input */}
              <Text style={[styles.pickerLabel, { color: theme.subText }]}>Category Name</Text>
              <TextInput
                style={[styles.input, { backgroundColor: theme.inputBg, color: theme.text, borderColor: theme.border }]}
                placeholder="e.g. Groceries, Freelance"
                placeholderTextColor={theme.subText}
                value={categoryName}
                onChangeText={setCategoryName}
              />

              {/* Color Selector Row */}
              <Text style={[styles.pickerLabel, { color: theme.subText }]}>Badge Color</Text>
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

                {/* Custom Palette Toggle Circle */}
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

              {/* Expanded Custom Color Grid */}
              {showCustomGrid && (
                <View style={[styles.customGridContainer, { backgroundColor: theme.inputBg, borderColor: theme.border }]}>
                  <Text style={[styles.gridSubLabel, { color: theme.subText }]}>Expressive & Jewel Palette</Text>
                  <View style={styles.colorGridMatrix}>
                    {EXTENDED_COLOR_GRID.map((color, index) => (
                      <TouchableOpacity
                        key={`${color}-${index}`}
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

            </ScrollView>
          </View>
        </KeyboardAvoidingView>
      </Modal>

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
  addHeaderBtn: { width: 38, height: 38, borderRadius: 10, justifyContent: 'center', alignItems: 'center' },
  
  content: { padding: 14, paddingBottom: 120 },
  segmentContainer: { flexDirection: 'row', padding: 4, borderRadius: 10, borderWidth: 1, marginBottom: 14 },
  segmentBtn: { flex: 1, paddingVertical: 8, borderRadius: 8, alignItems: 'center' },
  segmentText: { fontSize: 12, fontWeight: '600' },
  activeSegmentText: { color: '#FFFFFF', fontWeight: '700' },
  
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
  
  emptyBox: { padding: 30, borderRadius: 10, alignItems: 'center', borderWidth: 1, marginTop: 10 },
  emptyText: { fontSize: 12 },

  // Modal Styles
  modalOverlay: { flex: 1, justifyContent: 'flex-end', backgroundColor: 'rgba(0,0,0,0.5)' },
  modalContent: { borderTopLeftRadius: 20, borderTopRightRadius: 20, borderWidth: 1, padding: 16, maxHeight: '85%' },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  modalTitle: { fontSize: 15, fontWeight: '700' },
  closeModalBtn: { padding: 4 },

  previewContainer: { padding: 12, borderRadius: 10, borderWidth: 1, marginBottom: 14 },
  previewLabel: { fontSize: 10, fontWeight: '700', textTransform: 'uppercase', marginBottom: 6 },
  previewCardRow: { flexDirection: 'row', alignItems: 'center' },

  input: { height: 40, borderRadius: 8, borderWidth: 1, paddingHorizontal: 12, fontSize: 12, marginBottom: 12 },
  pickerLabel: { fontSize: 10, fontWeight: '700', textTransform: 'uppercase', marginBottom: 6 },
  pickerRow: { flexDirection: 'row', marginBottom: 12 },
  colorDot: { width: 26, height: 26, borderRadius: 13, marginRight: 8, justifyContent: 'center', alignItems: 'center' },
  customPickerCircle: { borderWidth: 1 },
  selectedColorDot: { borderWidth: 2, borderColor: '#8B5CF6', transform: [{ scale: 1.1 }] },

  customGridContainer: { padding: 10, borderRadius: 8, borderWidth: 1, marginBottom: 12 },
  gridSubLabel: { fontSize: 10, fontWeight: '700', marginBottom: 8, textTransform: 'uppercase' },
  colorGridMatrix: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  gridColorBox: { width: 28, height: 28, borderRadius: 14 },
  selectedGridBox: { borderWidth: 2.5, borderColor: '#8B5CF6', transform: [{ scale: 1.15 }] },

  iconGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginBottom: 16 },
  iconBox: { width: 38, height: 38, borderRadius: 8, justifyContent: 'center', alignItems: 'center', borderWidth: 1 },
  
  saveBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', height: 42, borderRadius: 8, gap: 6 },
  saveBtnText: { color: '#FFFFFF', fontWeight: '700', fontSize: 13 }
});