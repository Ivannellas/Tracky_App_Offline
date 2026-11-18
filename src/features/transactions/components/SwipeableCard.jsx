import React, { useRef, useContext } from "react";
import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  TouchableOpacity,
  Dimensions,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { formatTransactionDate } from "../../../utils/dateFormatter";
import { ThemeContext } from "../../../context/ThemeContext";

const SCREEN_WIDTH = Dimensions.get("window").width;
const ACTION_BUTTON_WIDTH = 60;
const TOTAL_ACTIONS_WIDTH = ACTION_BUTTON_WIDTH * 3; // 180px

export default function SwipeableCard({ item, onEdit, onDelete, onDuplicate }) {
  const { theme } = useContext(ThemeContext);
  const scrollViewRef = useRef(null);

  const handleActionPress = (actionCallback) => {
    scrollViewRef.current?.scrollTo({ x: 0, animated: true });
    actionCallback(item);
  };

  const formattedDate = formatTransactionDate(item.date);

  const subtitleParts = [];
  if (item.type === "transfer") {
    subtitleParts.push(
      `${item.account_name} ➔ ${item.to_account_name || "Wallet"}`,
    );

    if (item.note && !item.note.startsWith("Transfer:")) {
      subtitleParts.push(item.note);
    }
  } else {
    subtitleParts.push(item.account_name);
    if (item.note) subtitleParts.push(item.note);
  }

  if (formattedDate) subtitleParts.push(formattedDate);
  const subtitleText = subtitleParts.join(" • ");

  const displayTitle =
    item.type === "transfer" ? "Account Transfer" : item.category_name;

  const cardWidth = SCREEN_WIDTH - 28;

  return (
    <View
      style={[
        styles.container,
        { borderColor: theme.border, backgroundColor: theme.cardBg },
      ]}
    >
      <ScrollView
        ref={scrollViewRef}
        horizontal
        showsHorizontalScrollIndicator={false}
        bounces={false}
        decelerationRate="fast"
        snapToOffsets={[0, TOTAL_ACTIONS_WIDTH]}
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
      >
        {/* Main Transaction Card Content */}
        <View style={[styles.txCard, { width: cardWidth }]}>
          <View style={styles.leftContent}>
            <Text
              style={[styles.txCategory, { color: theme.text }]}
              numberOfLines={1}
            >
              {displayTitle}
            </Text>
            <Text
              style={[styles.txAccount, { color: theme.subText }]}
              numberOfLines={1}
            >
              {subtitleText}
            </Text>
          </View>
          <Text
            style={[
              styles.txAmount,
              item.type === "income"
                ? styles.income
                : item.type === "expense"
                  ? styles.expense
                  : { color: theme.primary },
            ]}
          >
            {item.type === "income"
              ? "+"
              : item.type === "expense"
                ? "-"
                : "⇄ "}
            ₱{item.amount.toLocaleString("en-US", { minimumFractionDigits: 2 })}
          </Text>
        </View>

        {/* Revealed Actions */}
        <View style={styles.actionsContainer}>
          <TouchableOpacity
            style={[styles.actionBtn, styles.duplicateBtn]}
            onPress={() => handleActionPress(onDuplicate)}
          >
            <Ionicons name="copy-outline" size={16} color="#FFFFFF" />
            <Text style={styles.actionText}>Copy</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.actionBtn, styles.editBtn]}
            onPress={() => handleActionPress(onEdit)}
          >
            <Ionicons name="pencil" size={16} color="#FFFFFF" />
            <Text style={styles.actionText}>Edit</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.actionBtn, styles.deleteBtn]}
            onPress={() => handleActionPress(onDelete)}
          >
            <Ionicons name="trash" size={16} color="#FFFFFF" />
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
    overflow: "hidden",
    height: 60,
    borderWidth: 1,
  },
  scrollView: {
    borderRadius: 10,
  },
  scrollContent: {
    flexDirection: "row",
  },
  txCard: {
    height: 60,
    paddingHorizontal: 12,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  leftContent: { flex: 1, marginRight: 10 },
  txCategory: { fontSize: 13, fontWeight: "600" },
  txAccount: { fontSize: 10, marginTop: 2 },
  txAmount: { fontSize: 14, fontWeight: "700" },
  income: { color: "#10B981" },
  expense: { color: "#EF4444" },
  actionsContainer: { flexDirection: "row", height: 60 },
  actionBtn: {
    width: ACTION_BUTTON_WIDTH,
    height: 60,
    justifyContent: "center",
    alignItems: "center",
  },
  duplicateBtn: { backgroundColor: "#8B5CF6" },
  editBtn: { backgroundColor: "#3B82F6" },
  deleteBtn: { backgroundColor: "#EF4444" },
  actionText: {
    color: "#FFFFFF",
    fontSize: 9,
    fontWeight: "700",
    marginTop: 2,
    textAlign: "center",
  },
});
