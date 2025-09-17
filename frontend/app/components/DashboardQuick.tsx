import React from "react";
import { View, Pressable, Text, StyleSheet } from "react-native";
import { usePathname, useRouter } from "expo-router";
import { useTheme } from "../../theme";

export default function DashboardQuick() {
  const pathname = (usePathname() || "").split("?")[0];
  if (pathname !== "/dashboard") return null;
  const t = useTheme();
  const router = useRouter();

  const s = StyleSheet.create({
    bar: { backgroundColor: t.colors.bgElevated, borderBottomColor: t.colors.border, borderBottomWidth: StyleSheet.hairlineWidth, paddingVertical: t.spacing.md, paddingHorizontal: t.spacing.lg },
    row: { flexDirection: "row", flexWrap: "wrap", gap: 10 },
    tile: { paddingVertical: 12, paddingHorizontal: 16, borderRadius: 10, backgroundColor: t.colors.brandPrimary },
    tileText: { color: t.colors.textOnBrand, fontWeight: "700" },
  });

  return (
    <View style={s.bar}>
      <View style={s.row}>
        <Pressable onPress={() => router.push("/suppliers")} style={s.tile} accessibilityRole="button">
          <Text style={s.tileText}>Suppliers</Text>
        </Pressable>
        <Pressable onPress={() => router.push("/wholesalers")} style={s.tile} accessibilityRole="button">
          <Text style={s.tileText}>Wholesalers</Text>
        </Pressable>
      </View>
    </View>
  );
}
