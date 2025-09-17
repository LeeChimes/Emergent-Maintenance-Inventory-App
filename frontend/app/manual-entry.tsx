import React from "react";
import { View, Text, TextInput, Pressable, StyleSheet, Alert } from "react-native";
import Screen from "./components/Screen";
import { useTheme } from "../theme";

export default function ManualEntry() {
  const t = useTheme();
  const [value, setValue] = React.useState("");

  const styles = StyleSheet.create({
    field: { borderColor: t.colors.border, borderWidth: StyleSheet.hairlineWidth, borderRadius: t.radius.md, paddingVertical: 12, paddingHorizontal: 14, color: t.colors.text, backgroundColor: t.colors.bgSurface, marginBottom: 12 },
    btn: { alignSelf: "flex-start", backgroundColor: t.colors.brandPrimary, borderRadius: t.radius.md, paddingVertical: 10, paddingHorizontal: 16 },
    btnText: { color: t.colors.textOnBrand, fontSize: t.typography.md, fontWeight: t.typography.bold },
    hint: { color: t.colors.textDim, marginTop: 10 },
  });

  const submit = () => {
    const trimmed = value.trim();
    if (!trimmed) return Alert.alert("Manual Entry", "Please enter a code or ID.");
    // TODO: Navigate to the right record once we wire lookups
    Alert.alert("Manual Entry", `Entered: ${trimmed}`);
  };

  return (
    <Screen padded>
      <View>
        <Text style={{ color: t.colors.text, fontSize: 18, fontWeight: "700", marginBottom: 10 }}>Manual Entry</Text>
        <TextInput placeholder="Type QR code / ID / SKU…" placeholderTextColor={t.colors.textDim} value={value} onChangeText={setValue} style={styles.field} autoCapitalize="none" autoCorrect={false} returnKeyType="search" onSubmitEditing={submit} />
        <Pressable onPress={submit} style={styles.btn}><Text style={styles.btnText}>Submit</Text></Pressable>
        <Text style={styles.hint}>Tip: You can still switch to the Scanner at any time.</Text>
      </View>
    </Screen>
  );
}