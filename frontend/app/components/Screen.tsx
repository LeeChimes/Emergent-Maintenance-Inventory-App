import React from "react";
import { View, ScrollView, StyleSheet } from "react-native";
import { useTheme } from "../../theme";

type Props = {
  children?: React.ReactNode;
  padded?: boolean;
  scroll?: boolean; // legacy/tolerated
};

export default function Screen({ children, padded = true, scroll = false }: Props) {
  const t = useTheme();

  const styles = StyleSheet.create({
    root: { flex: 1, backgroundColor: t.colors.bg },
    inner: {
      flexGrow: 1,
      paddingHorizontal: padded ? t.spacing.lg : 0,
      paddingVertical: padded ? t.spacing.md : 0,
    },
  });

  if (scroll) {
    return (
      <ScrollView
        style={styles.root}
        contentContainerStyle={styles.inner}
        keyboardShouldPersistTaps="handled"
      >
        {children}
      </ScrollView>
    );
  }

  return <View style={[styles.root, styles.inner]}>{children}</View>;
}