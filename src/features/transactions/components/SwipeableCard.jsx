import React, { useRef } from 'react';
import { StyleSheet, Text, View, ScrollView, TouchableOpacity, Dimensions } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

const SCREEN_WIDTH = Dimensions.get('window').width;
const ACTION_BUTTON_WIDTH = 60; 

export default function SwipeableCard({ item, onEdit, onDelete, onDuplicate }) {
  const scrollViewRef = useRef(null);

  const handleActionPress = (actionCallback) => {
    scrollViewRef.current?.scrollTo({ x: 0, animated: true });
    actionCallback(item);
  };

  return (
    <View style={styles.container}>
      <ScrollView
        ref={scrollViewRef}
        horizontal
        showsHorizontalScrollIndicator={false}
        bounces={false}
        decelerationRate="fast"
        snapToInterval={ACTION_BUTTON_WIDTH * 3}
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
      >
        {/* Main Transaction Card Content */}
        <View style={[styles.txCard, { width: SCREEN_WIDTH - 40 }]}>
          <View style={styles.leftContent}>
            <Text style={styles.txCategory} numberOfLines={1}>{item.category_name}</Text>
            <Text style={styles.txAccount} numberOfLines={1}>
              {item.account_name} {item.note ? `• ${item.note}` : ''}
            </Text>
          </View>
          <Text
            style={[
              styles.txAmount,
              item.type === 'income' ? styles.income : styles.expense,
            ]}
          >
            {item.type === 'income' ? '+' : '-'}₱
            {item.amount.toLocaleString('en-US', { minimumFractionDigits: 2 })}
          </Text>
        </View>

        {/* Revealed Actions */}
        <View style={styles.actionsContainer}>
          {/* Copy / Duplicate Button */}
          <TouchableOpacity
            style={[styles.actionBtn, styles.duplicateBtn]}
            onPress={() => handleActionPress(onDuplicate)}
          >
            <Ionicons name="copy-outline" size={18} color="#FFFFFF" />
            <Text style={styles.actionText}>Copy</Text>
          </TouchableOpacity>

          {/* Edit Button */}
          <TouchableOpacity
            style={[styles.actionBtn, styles.editBtn]}
            onPress={() => handleActionPress(onEdit)}
          >
            <Ionicons name="pencil" size={18} color="#FFFFFF" />
            <Text style={styles.actionText}>Edit</Text>
          </TouchableOpacity>

          {/* Delete Button */}
          <TouchableOpacity
            style={[styles.actionBtn, styles.deleteBtn]}
            onPress={() => handleActionPress(onDelete)}
          >
            <Ionicons name="trash" size={18} color="#FFFFFF" />
            <Text style={styles.actionText}>Delete</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { 
    marginBottom: 8, 
    borderRadius: 10, 
    overflow: 'hidden',
    height: 64,
  },
  scrollView: { 
    backgroundColor: '#1E293B', 
    borderRadius: 10,
  },
  scrollContent: {
    alignItems: 'center',
  },
  txCard: {
    height: 64,
    paddingHorizontal: 14,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#1E293B',
  },
  leftContent: { flex: 1, marginRight: 10 },
  txCategory: { color: '#F8FAFC', fontSize: 14, fontWeight: '600' },
  txAccount: { color: '#64748B', fontSize: 11, marginTop: 2 },
  txAmount: { fontSize: 15, fontWeight: 'bold' },
  income: { color: '#10B981' },
  expense: { color: '#EF4444' },
  actionsContainer: { flexDirection: 'row', height: 64 },
  actionBtn: {
    width: ACTION_BUTTON_WIDTH,
    height: 64,
    justifyContent: 'center',
    alignItems: 'center',   
  },
  duplicateBtn: { backgroundColor: '#8B5CF6' },
  editBtn: { backgroundColor: '#3B82F6' },     
  deleteBtn: { backgroundColor: '#EF4444' },   
  actionText: { 
    color: '#FFFFFF', 
    fontSize: 10, 
    fontWeight: 'bold', 
    marginTop: 3, 
    textAlign: 'center' 
  },
});