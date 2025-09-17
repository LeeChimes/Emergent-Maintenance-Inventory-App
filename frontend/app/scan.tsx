import React from "react";
import { View, Text, StyleSheet, Pressable, Dimensions } from "react-native";
import Screen from "./components/Screen";
import { useTheme } from "../theme";
import { useRouter } from "expo-router";

export default function Scan() {
  const t = useTheme();
  const router = useRouter();
  const h = Math.max(320, Math.floor(Dimensions.get("window").height * 0.72));

  const s = StyleSheet.create({
    wrap: { flex: 1, backgroundColor: t.colors.bg },
    preview: { width: "100%", maxWidth: 1100, height: h, alignSelf: "center", backgroundColor: "#000",
               alignItems: "center", justifyContent: "center", borderRadius: 12 },
    title: { color: t.colors.textOnBrand, fontSize: 20, fontWeight: "800", marginBottom: 8 },
    caption: { color: t.colors.textOnBrand, opacity: 0.8, marginBottom: 16, textAlign: "center", paddingHorizontal: 16 },
    cta: { paddingVertical: 12, paddingHorizontal: 18, borderRadius: 10, backgroundColor: t.colors.brandPrimary },
    ctaText: { color: t.colors.textOnBrand, fontWeight: "700" },
    bar: { paddingTop: 12, paddingBottom: 18, paddingHorizontal: 16, backgroundColor: "rgba(0,0,0,0.85)" },
    barText: { color: t.colors.textOnBrand, textAlign: "center" },
  });

  return (
    <Screen padded={false}>
      <View style={s.wrap}>
        <View style={s.preview}>
          <Text style={s.title}>Scanner disabled on this device</Text>
          <Text style={s.caption}>Use Manual Entry to look up items. (Camera is intentionally not used on desktop.)</Text>
          <Pressable onPress={() => router.push("/manual-entry")} style={s.cta}>
            <Text style={s.ctaText}>Manual Entry</Text>
          </Pressable>
        </View>
        <View style={s.bar}><Text style={s.barText}>Tip: You can enable camera later on a mobile device.</Text></View>
      </View>
    </Screen>
  );
}
