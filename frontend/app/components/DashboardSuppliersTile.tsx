import React from "react";
import { View, Text, Pressable, StyleSheet, Platform } from "react-native";
import { usePathname, useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { useTheme } from "../../theme";

export default function DashboardSuppliersTile() {
  const pathname = (usePathname() || "").split("?")[0];
  if (pathname !== "/dashboard") return null; // only show on Dashboard
  const t = useTheme();
  const router = useRouter();

  const s = StyleSheet.create({
    wrap: {
      paddingHorizontal: 16,
      paddingTop: 12,
    },
    row: {
      flexDirection: "row",
      justifyContent: "flex-start",
      gap: 16,
      flexWrap: "wrap",
    },
    card: {
      backgroundColor: t.colors.bgElevated,
      borderRadius: 14,
      paddingVertical: 18,
      paddingHorizontal: 18,
      width: Platform.OS === "web" ? "48%" : "48%",
      minWidth: 260,
      minHeight: 96,
      justifyContent: "center",
    },
    title: {
      color: t.colors.text,
      fontSize: t.typography.md,
      fontWeight: t.typography.semibold,
      marginTop: 8,
    },
    iconRow: { flexDirection: "row", alignItems: "center", gap: 12 },
  });

  return (
    <View style={s.wrap}>
      <View style={s.row}>
        <Pressable
          accessibilityRole="button"
          onPress={() => router.push("/suppliers")}
          style={s.card}
        >
          <View style={s.iconRow}>
            <Ionicons name="pricetags-outline" size={26} color={t.colors.brandPrimary} />
            <Text style={s.title}>Suppliers</Text>
          </View>
        </Pressable>
      </View>
    </View>
  );
}
