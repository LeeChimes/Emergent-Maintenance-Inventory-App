import React, { useEffect } from "react";
import { View, Text, StyleSheet } from "react-native";
import { useRouter } from "expo-router";
import Screen from "./components/Screen";
import { useTheme } from "../theme";

export default function Logout() {
  const t = useTheme();
  const router = useRouter();

  useEffect(() => {
    try {
      // Web-safe clears (no new deps; ignores if not available)
      // Remove specific keys first (adjust if you know your actual keys)
      const maybe = (s: any) => (s && typeof s.removeItem === "function" && typeof s.clear === "function" ? s : null);
      const ls = maybe((globalThis as any).localStorage);
      const ss = maybe((globalThis as any).sessionStorage);
      if (ls) {
        ["currentUser", "token", "session", "auth"].forEach(k => { try { ls.removeItem(k); } catch {} });
      }
      if (ss) {
        ["currentUser", "token", "session", "auth"].forEach(k => { try { ss.removeItem(k); } catch {} });
      }
      // Fallback: clear all (web only)
      try { ls?.clear(); } catch {}
      try { ss?.clear(); } catch {}
    } catch {}
    // Navigate to Login (assumed at "/")
    const timer = setTimeout(() => router.replace("/"), 300);
    return () => clearTimeout(timer);
  }, []);

  return (
    <Screen>
      <View style={styles.box}>
        <Text style={[styles.title, { color: t.colors.text }]}>Signing you out…</Text>
        <Text style={{ color: t.colors.textDim, marginTop: 8 }}>You’ll be returned to the login screen.</Text>
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  box: { gap: 8 },
  title: { fontSize: 18, fontWeight: "700" },
});