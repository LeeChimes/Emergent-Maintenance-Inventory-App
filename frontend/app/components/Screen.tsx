import React from "react";
import { View, StyleSheet, StatusBar } from "react-native";
import { useTheme } from "../../theme";

type Props = { children: React.ReactNode; padded?: boolean };

export default function Screen({ children, padded = true }: Props) {
  const t = useTheme();
  const styles = StyleSheet.create({
    root: { flex: 1, backgroundColor: t.colors.bg },
    content: {
      flex: 1,
      paddingHorizontal: padded ? t.spacing.lg : 0,
      paddingVertical: padded ? t.spacing.lg : 0,
    },
  });
  return (
    <View style={styles.root}>
      <StatusBar barStyle="light-content" />
      <View style={styles.content}>{children}</View>
    </View>
  );
}