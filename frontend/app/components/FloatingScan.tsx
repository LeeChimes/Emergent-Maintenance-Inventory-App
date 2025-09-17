import React from "react";
import { Pressable, Text, StyleSheet, View } from "react-native";
import { useTheme } from "../../theme";

type Props = { label?: string; onPress?: () => void };

export default function FloatingScan({ label = "Scan", onPress }: Props) {
  const t = useTheme();
  const styles = StyleSheet.create({
    container: { position: "absolute", right: t.spacing.lg, bottom: t.spacing.xl },
    fab: {
      backgroundColor: t.colors.brandPrimary,
      borderRadius: t.radius.pill,
      paddingHorizontal: t.spacing.xl,
      paddingVertical: t.spacing.md,
      ...t.shadow.fab,
    },
    text: {
      color: t.colors.textOnBrand,
      fontSize: t.typography.md,
      fontWeight: t.typography.bold,
      lineHeight: t.typography.lh(t.typography.md),
    },
  });

  return (
    <View style={styles.container}>
      <Pressable onPress={onPress} style={styles.fab}>
        <Text style={styles.text}>{label}</Text>
      </Pressable>
    </View>
  );
}