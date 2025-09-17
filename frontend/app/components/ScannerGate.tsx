import React from "react";
import { View, Text, Pressable, StyleSheet, Platform } from "react-native";
import { usePathname, useRouter } from "expo-router";
import { useTheme } from "../../theme";
import { isScannerPath } from "../utils/isScannerRoute";

// optional (runtime) requires so we don't break if one package isn't installed
let Camera: any = null;
let BarCodeScanner: any = null;
try { Camera = require("expo-camera"); } catch {}
try { BarCodeScanner = require("expo-barcode-scanner"); } catch {}

type Perm = "unknown" | "granted" | "denied";

async function getAnyPermission(): Promise<Perm> {
  // On web, don't block UI—let the page handle mediaDevices prompts
  if (Platform.OS === "web") return "granted";
  try {
    // Try camera first
    if (Camera?.getCameraPermissionsAsync) {
      const r = await Camera.getCameraPermissionsAsync();
      if (r?.status === "granted") return "granted";
    }
    // Try barcode-scanner
    if (BarCodeScanner?.getPermissionsAsync) {
      const r = await BarCodeScanner.getPermissionsAsync();
      if (r?.status === "granted") return "granted";
    }
    return "denied";
  } catch {
    return "denied";
  }
}

async function requestAnyPermission(): Promise<Perm> {
  if (Platform.OS === "web") return "granted";
  try {
    if (Camera?.requestCameraPermissionsAsync) {
      const r = await Camera.requestCameraPermissionsAsync();
      if (r?.status === "granted") return "granted";
    }
    if (BarCodeScanner?.requestPermissionsAsync) {
      const r = await BarCodeScanner.requestPermissionsAsync();
      if (r?.status === "granted") return "granted";
    }
    return "denied";
  } catch {
    return "denied";
  }
}

export default function ScannerGate() {
  const pathname = usePathname();
  const router = useRouter();
  const t = useTheme();

  const [status, setStatus] = React.useState<Perm>("unknown");
  const [asked, setAsked] = React.useState(false);

  const onScanner = isScannerPath(pathname ?? undefined);

  React.useEffect(() => {
    let mounted = true;
    if (!onScanner) return;
    (async () => {
      const s = await getAnyPermission();
      if (mounted) setStatus(s);
    })();
    return () => { mounted = false; };
  }, [onScanner]);

  const request = async () => {
    setAsked(true);
    const s = await requestAnyPermission();
    setStatus(s);
    // If it just became granted but the camera view is black, a tiny reload helps
    if (s === "granted") {
      try { router.replace(pathname || "/scan"); } catch {}
    }
  };

  if (!onScanner || status === "granted") return null;

  const styles = StyleSheet.create({
    bar: {
      backgroundColor: t.colors.bgElevated,
      borderBottomColor: t.colors.border,
      borderBottomWidth: StyleSheet.hairlineWidth,
      paddingVertical: t.spacing.md,
      paddingHorizontal: t.spacing.lg,
    },
    row: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
    msg: { color: t.colors.text, fontSize: t.typography.md, fontWeight: t.typography.medium, marginRight: t.spacing.lg },
    actions: { flexDirection: "row", gap: 12 },
    btn: { paddingVertical: 8, paddingHorizontal: 12, borderRadius: 8, borderWidth: StyleSheet.hairlineWidth, borderColor: t.colors.border },
    btnText: { color: t.colors.text, fontSize: t.typography.sm, fontWeight: t.typography.semibold },
  });

  return (
    <View style={styles.bar}>
      <View style={styles.row}>
        <Text style={styles.msg}>Camera access is needed to scan. Use Manual or allow the camera.</Text>
        <View style={styles.actions}>
          <Pressable onPress={() => router.push("/manual-entry")} style={styles.btn}>
            <Text style={styles.btnText}>Manual Entry</Text>
          </Pressable>
          <Pressable onPress={request} style={styles.btn}>
            <Text style={styles.btnText}>{asked ? "Try Again" : "Allow Camera"}</Text>
          </Pressable>
        </View>
      </View>
    </View>
  );
}