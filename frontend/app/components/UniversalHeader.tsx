import React from "react";
import { View, Text, StyleSheet } from "react-native";
import { useTheme } from "../../theme";

type Props = {
  title?: string;
  subtitle?: string;
  left?: React.ReactNode;
  right?: React.ReactNode;
  // tolerated legacy props (ignored)
  showBackButton?: boolean;
  scroll?: boolean;
};

export default function UniversalHeader({ title, subtitle, left, right }: Props) {
  const t = useTheme();
  const s = StyleSheet.create({
    bar: { backgroundColor: t.colors.bg, paddingVertical: t.spacing.md, paddingHorizontal: t.spacing.lg },
    row: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
    side: { minWidth: 64, alignItems: "flex-start" },
    sideRight: { minWidth: 64, alignItems: "flex-end" },
    centerWrap: { position: "absolute", left: 0, right: 0, alignItems: "center" },
    title: { color: t.colors.text, fontSize: t.typography.lg, fontWeight: t.typography.bold },
    subtitle: { color: t.colors.textDim, marginTop: 4 },
  });
  return (
    <View style={s.bar}>
      <View style={s.row}>
        <View style={s.side}>{left}</View>
        <View style={s.centerWrap}>
          {!!title && <Text style={s.title}>{title}</Text>}
          {!!subtitle && <Text style={s.subtitle}>{subtitle}</Text>}
        </View>
        <View style={s.sideRight}>{right}</View>
      </View>
    </View>
  );
}
