import React from "react";
import { View, Text, Switch, StyleSheet } from "react-native";
import Screen from "./components/Screen";
import { useTheme } from "../theme";
import { getScanMode, setScanMode } from "../services/prefs";

export default function Settings() {
  const t = useTheme();
  const [manualOnly, setManualOnly] = React.useState<boolean>(false);
  const [loading, setLoading] = React.useState<boolean>(true);

  React.useEffect(() => {
    (async () => {
      const m = await getScanMode();
      setManualOnly(m === "manual");
      setLoading(false);
    })();
  }, []);

  const onToggle = async (value: boolean) => {
    setManualOnly(value);
    await setScanMode(value ? "manual" : "auto");
  };

  const s = StyleSheet.create({
    row: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingVertical: 14, paddingHorizontal: 4, borderBottomWidth: StyleSheet.hairlineWidth, borderColor: t.colors.border },
    title: { color: t.colors.text, fontSize: t.typography.md, fontWeight: t.typography.semibold },
    desc: { color: t.colors.textDim, marginTop: 6 },
  });

  return (
    <Screen padded>
      <View>
        <Text style={{ color: t.colors.text, fontSize: 20, fontWeight: "800", marginBottom: 12 }}>Settings</Text>

        <View style={s.row}>
          <View style={{ flex: 1, paddingRight: 12 }}>
            <Text style={s.title}>Use manual scan on this device</Text>
            <Text style={s.desc}>Skips camera on /scan and shows Manual Entry only. Helpful on desktop PCs or browsers without camera support.</Text>
          </View>
          <Switch
            value={manualOnly}
            onValueChange={onToggle}
            disabled={loading}
            thumbColor={manualOnly ? t.colors.brandPrimary : undefined}
          />
        </View>
      </View>
    </Screen>
  );
}
