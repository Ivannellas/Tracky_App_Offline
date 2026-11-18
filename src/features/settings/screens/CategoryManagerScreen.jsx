import React, { useState, useEffect, useContext } from 'react';
import { 
  StyleSheet, 
  Text, 
  View, 
  TouchableOpacity, 
  ScrollView, 
  TextInput, 
  Modal,
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

  // Custom In-App Alert State
  const [customAlert, setCustomAlert] = useState({ 
    visible: false, 
    title: '', 
    message: '', 
    isConfirm: false, 
    onConfirm: null 
  });

  const showAlert = (title, message, isConfirm = false, onConfirm = null) => {
    setCustomAlert({ visible: true, title, message, isConfirm, onConfirm });
  };

  // Expanded and categorized useful icons
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
    '#FF5733', '#FF8D1A', '#FFC300', '#DAF7A6',
    '#33FF57', '#33FFBD', '#33DBFF', '#3380FF',
    '#8E44AD', '#9B59B6', '#E74C3C', '#C0392B',
    '#D35400', '#E67E22', '#F1C40F', '#F39C12',
    '#00E676', '#1DE9B6', '#00B0FF', '#651FFF',
    '#D500F9', '#F50057', '#FF1744', '#FF9100',
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
      showAlert('Required Field', 'Please enter a category name.');
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
    showAlert(
      'Delete Category',
      `Are you sure you want to delete "${cat.name}"? Transactions assigned to this category will keep their records.`,
      true,
      () => {
        deleteCategory(cat.id);
        loadCategories();
      }
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
          activeOpacity={0.8}
        >
          <Ionicons name="arrow-back" size={20} color={theme.text} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: theme.text }]}>Category Manager</Text>
        
        {/* Add Category Button */}
        <TouchableOpacity 
          style={[styles.addHeaderBtn, { backgroundColor: theme.primary }]} 
          onPress={handleOpenAddModal}
          activeOpacity={0.85}
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
            activeOpacity={0.85}
          >
            <Text style={[styles.segmentText, activeType === 'expense' ? styles.activeSegmentText : { color: theme.subText }]}>
              Expenses
            </Text>
          </TouchableOpacity>

          <TouchableOpacity 
            style={[styles.segmentBtn, activeType === 'income' && { backgroundColor: theme.primary }]}
            onPress={() => setActiveType('income')}
            activeOpacity={0.85}
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

        {/* --- CATEGORIES GRID CARDS --- */}
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
                      <TouchableOpacity onPress={() => handleStartEdit(cat)} style={styles.actionIconBtn} activeOpacity={0.8}>
                        <Ionicons name="pencil" size={14} color={badgeColor} />
                      </TouchableOpacity>
                      <TouchableOpacity onPress={() => handleDelete(cat)} style={styles.actionIconBtn} activeOpacity={0.8}>
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
              <View style={styles.titleContainer}>
                <View style={[styles.titleIndicator, { backgroundColor: selectedColor }]} />
                <Text style={[styles.modalTitle, { color: theme.text }]}>
                  {isEditing ? 'Edit Category' : `Add New ${activeType === 'expense' ? 'Expense' : 'Income'}`}
                </Text>
              </View>
              <TouchableOpacity onPress={() => setModalVisible(false)} style={[styles.closeModalBtn, { backgroundColor: theme.inputBg }]} activeOpacity={0.8}>
                <Ionicons name="close" size={18} color={theme.text} />
              </TouchableOpacity>
            </View>

            <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent} keyboardShouldPersistTaps="handled">
              
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
              <Text style={[styles.label, { color: theme.subText }]}>Category Name</Text>
              <TextInput
                style={[styles.input, { backgroundColor: theme.inputBg, color: theme.text, borderColor: theme.border }]}
                placeholder="e.g. Groceries, Freelance"
                placeholderTextColor={theme.subText}
                value={categoryName}
                onChangeText={setCategoryName}
              />

              {/* Color Selector Row */}
              <Text style={[styles.label, { color: theme.subText }]}>Badge Color</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.pickerRow} keyboardShouldPersistTaps="handled">
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
                    activeOpacity={0.8}
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
                  activeOpacity={0.8}
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
                        activeOpacity={0.8}
                      />
                    ))}
                  </View>
                </View>
              )}

              {/* Icon Selector Grid */}
              <Text style={[styles.label, { color: theme.subText }]}>Select Icon</Text>
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
                    activeOpacity={0.8}
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
                activeOpacity={0.85}
              >
                <Ionicons name={isEditing ? "checkmark-circle-outline" : "add-circle-outline"} size={16} color="#FFFFFF" style={{ marginRight: 6 }} />
                <Text style={styles.saveBtnText}>{isEditing ? 'Update Category' : 'Save Category'}</Text>
              </TouchableOpacity>

            </ScrollView>
          </View>
        </KeyboardAvoidingView>
      </Modal>

      {/* --- CUSTOM IN-APP ALERT DIALOG --- */}
      <Modal
        transparent={true}
        visible={customAlert.visible}
        animationType="fade"
        onRequestClose={() => setCustomAlert({ ...customAlert, visible: false })}
      >
        <View style={styles.alertOverlay}>
          <View style={[styles.alertBox, { backgroundColor: theme.cardBg, borderColor: theme.border }]}>
            <Text style={[styles.alertTitle, { color: theme.text }]}>{customAlert.title}</Text>
            <Text style={[styles.alertMessage, { color: theme.subText }]}>{customAlert.message}</Text>
            
            <View style={styles.alertButtonRow}>
              {customAlert.isConfirm && (
                <TouchableOpacity
                  style={[styles.alertBtn, { backgroundColor: theme.inputBg, borderColor: theme.border, borderWidth: 1, flex: 1 }]}
                  onPress={() => setCustomAlert({ visible: false, title: '', message: '', isConfirm: false, onConfirm: null })}
                  activeOpacity={0.8}
                >
                  <Text style={[styles.alertBtnText, { color: theme.text }]}>Cancel</Text>
                </TouchableOpacity>
              )}

              <TouchableOpacity
                style={[styles.alertBtn, { backgroundColor: customAlert.isConfirm ? '#EF4444' : theme.primary, flex: 1 }]}
                onPress={() => {
                  const action = customAlert.onConfirm;
                  setCustomAlert({ visible: false, title: '', message: '', isConfirm: false, onConfirm: null });
                  if (action) action();
                }}
                activeOpacity={0.85}
              >
                <Text style={styles.alertBtnText}>{customAlert.isConfirm ? 'Delete' : 'OK'}</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
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

  // Modal Styles (Matched with other modals: borderTopLeftRadius: 26, maxHeight: 92%)
  modalOverlay: { flex: 1, justifyContent: 'flex-end', backgroundColor: 'rgba(0,0,0,0.65)' },
  modalContent: { 
    borderTopLeftRadius: 26, 
    borderTopRightRadius: 26, 
    borderWidth: 1, 
    borderBottomWidth: 0,
    paddingHorizontal: 18,
    paddingTop: 18, 
    maxHeight: '92%' 
  },
  scrollContent: { paddingBottom: 40, paddingTop: 4 },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 },
  titleContainer: { flexDirection: 'row', alignItems: 'center' },
  titleIndicator: { width: 8, height: 8, borderRadius: 4, marginRight: 8 },
  modalTitle: { fontSize: 17, fontWeight: '700' },
  closeModalBtn: { width: 32, height: 32, borderRadius: 16, justifyContent: 'center', alignItems: 'center' },

  previewContainer: { padding: 12, borderRadius: 12, borderWidth: 1, marginBottom: 14 },
  previewLabel: { fontSize: 10, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 0.8, marginBottom: 6 },
  previewCardRow: { flexDirection: 'row', alignItems: 'center' },

  input: { height: 44, borderRadius: 10, borderWidth: 1, paddingHorizontal: 14, fontSize: 13, marginBottom: 4 },
  label: { fontSize: 10, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 0.8, marginBottom: 6, marginTop: 10 },
  pickerRow: { flexDirection: 'row', marginBottom: 4, paddingVertical: 2 },
  colorDot: { width: 30, height: 30, borderRadius: 15, marginRight: 8, justifyContent: 'center', alignItems: 'center' },
  customPickerCircle: { borderWidth: 1 },
  selectedColorDot: { borderWidth: 2, borderColor: '#FFFFFF', transform: [{ scale: 1.08 }] },

  customGridContainer: { padding: 10, borderRadius: 10, borderWidth: 1, marginBottom: 12, marginTop: 4 },
  gridSubLabel: { fontSize: 10, fontWeight: '700', marginBottom: 8, textTransform: 'uppercase', letterSpacing: 0.8 },
  colorGridMatrix: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  gridColorBox: { width: 28, height: 28, borderRadius: 14 },
  selectedGridBox: { borderWidth: 2.5, borderColor: '#FFFFFF', transform: [{ scale: 1.15 }] },

  iconGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginBottom: 16, marginTop: 2 },
  iconBox: { width: 38, height: 38, borderRadius: 9, justifyContent: 'center', alignItems: 'center', borderWidth: 1 },
  
  saveBtn: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    justifyContent: 'center', 
    height: 46, 
    borderRadius: 12, 
    marginTop: 10,
    marginBottom: 10,
    elevation: 3,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
  },
  saveBtnText: { color: '#FFFFFF', fontWeight: '700', fontSize: 13 },

  // Custom Alert Styles
  alertOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.65)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  alertBox: {
    width: '100%',
    maxWidth: 300,
    borderRadius: 16,
    borderWidth: 1,
    padding: 20,
    alignItems: 'center',
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
  },
  alertTitle: {
    fontSize: 16,
    fontWeight: '700',
    marginBottom: 8,
    textAlign: 'center',
  },
  alertMessage: {
    fontSize: 13,
    textAlign: 'center',
    marginBottom: 20,
    lineHeight: 18,
  },
  alertButtonRow: {
    flexDirection: 'row',
    gap: 10,
    width: '100%',
  },
  alertBtn: {
    height: 40,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  alertBtnText: {
    fontWeight: '700',
    fontSize: 13,
  },
});