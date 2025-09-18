import React from "react";
import { View, Pressable, Text, StyleSheet } from "react-native";
import { useRouter } from "expo-router";
import { useTheme } from "../../theme";
import { Ionicons } from "@expo/vector-icons";

export default function SuppliersQuickTile() {
  const t = useTheme();
  const router = useRouter();
  const s = StyleSheet.create({
    grid: { flexDirection: "row", flexWrap: "wrap", gap: 16, marginTop: 12 },
    tile: {
      flexBasis: "48%",
      backgroundColor: t.colors.bgElevated,
      borderRadius: 12,
      paddingVertical: 18,
      paddingHorizontal: 16,
      alignItems: "center",
      justifyContent: "center",
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: t.colors.border,
    },
    label: { marginTop: 8, color: t.colors.text, fontWeight: "700" },
  });
  return (
    <View style={{ marginTop: 8 }}>
      <View style={s.grid}>
        <Pressable style={s.tile} onPress={() => router.push("/suppliers")} accessibilityRole="button">
          <Ionicons name="business-outline" size={28} color={t.colors.text} />
          <Text style={s.label}>Suppliers</Text>
        </Pressable>
      </View>
    </View>
  );
}
