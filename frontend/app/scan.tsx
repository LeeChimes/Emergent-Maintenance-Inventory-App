import React from "react";
import { View, Text, StyleSheet, Pressable, Platform, Alert, Dimensions } from "react-native";
import Screen from "./components/Screen";
import { useTheme } from "../theme";
import { useRouter } from "expo-router";
import { getScanMode } from "../services/prefs";

const IS_WEB = Platform.OS === "web";

let CameraPkg: any = null;
let BarCodeScannerPkg: any = null;
try { CameraPkg = require("expo-camera"); } catch {}
try { BarCodeScannerPkg = require("expo-barcode-scanner"); } catch {}

const CameraView = !IS_WEB ? (CameraPkg?.CameraView ?? CameraPkg?.Camera) : null;
const BarCodeScanner = IS_WEB ? BarCodeScannerPkg?.BarCodeScanner : null;

type Perm = "unknown" | "granted" | "denied";

export default function Scan() {
  const t = useTheme();
  const router = useRouter();

  const initH = Math.max(320, Math.floor(Dimensions.get("window").height * 0.72));
  const [camHeight, setCamHeight] = React.useState<number>(initH);
  React.useEffect(() => {
    const sub = Dimensions.addEventListener?.("change", ({ window }) => {
      setCamHeight(Math.max(320, Math.floor(window.height * 0.72)));
    });
    return () => { (sub as any)?.remove?.(); };
  }, []);

  const [permission, setPermission] = React.useState<Perm>("unknown");
  const [facing, setFacing] = React.useState<"back" | "front">("back");
  const [mountKey, setMountKey] = React.useState<number>(0);
  const [manualOnly, setManualOnly] = React.useState<boolean>(false);

  // Load device preference
  React.useEffect(() => {
    (async () => {
      try {
        const mode = await getScanMode();
        setManualOnly(mode === "manual");
      } catch { setManualOnly(false); }
    })();
  }, []);

  // Ask permissions only when not manualOnly
  React.useEffect(() => {
    if (manualOnly) return;
    let mounted = true;
    (async () => {
      try {
        if (IS_WEB && BarCodeScannerPkg?.getPermissionsAsync) {
          const r = await BarCodeScannerPkg.getPermissionsAsync();
          if (mounted) setPermission(r?.status === "granted" ? "granted" : "denied");
          return;
        }
        if (!IS_WEB && CameraPkg?.getCameraPermissionsAsync) {
          const r = await CameraPkg.getCameraPermissionsAsync();
          if (mounted) setPermission(r?.status === "granted" ? "granted" : "denied");
          return;
        }
        if (mounted) setPermission("denied");
      } catch {
        if (mounted) setPermission("denied");
      }
    })();
    return () => { mounted = false; };
  }, [manualOnly]);

  const requestPerms = async () => {
    try {
      if (IS_WEB && BarCodeScannerPkg?.requestPermissionsAsync) {
        const r = await BarCodeScannerPkg.requestPermissionsAsync();
        setPermission(r?.status === "granted" ? "granted" : "denied");
        setMountKey((k) => k + 1);
        return;
      }
      if (!IS_WEB && CameraPkg?.requestCameraPermissionsAsync) {
        const r = await CameraPkg.requestCameraPermissionsAsync();
        setPermission(r?.status === "granted" ? "granted" : "denied");
        setMountKey((k) => k + 1);
        return;
      }
      setPermission("denied");
    } catch {
      setPermission("denied");
    }
  };

  const onScanned = (e: any) => {
    const value = e?.data ?? e?.rawValue ?? "";
    if (!value) return;
    Alert.alert("Scanned", String(value));
  };

  const s = StyleSheet.create({
    wrap: { flex: 1 },
    cameraFrame: { flex: 1, alignItems: "center", justifyContent: "center", backgroundColor: "#000" },
    cameraView: { width: "100%", maxWidth: 1100, height: camHeight, backgroundColor: "#000" },
    overlay: { position: "absolute", top: 0, bottom: 0, left: 0, right: 0, alignItems: "center", justifyContent: "center" },
    greenBox: { width: 260, height: 260, borderRadius: 18, borderWidth: 3, borderColor: "#2ecc71", opacity: 0.9 },
    bottomBar: { paddingTop: 12, paddingBottom: 18, paddingHorizontal: 16, backgroundColor: "rgba(0,0,0,0.85)" },
    bottomText: { color: t.colors.textOnBrand, textAlign: "center" },
    ctaRow: { position: "absolute", bottom: 20, left: 16, right: 16, flexDirection: "row", gap: 12, justifyContent: "space-between" },
    cta: { paddingVertical: 12, paddingHorizontal: 16, borderRadius: 10, backgroundColor: t.colors.brandPrimary },
    ctaGhost: { paddingVertical: 12, paddingHorizontal: 16, borderRadius: 10, borderWidth: StyleSheet.hairlineWidth, borderColor: t.colors.border, backgroundColor: t.colors.bgElevated },
    ctaText: { color: t.colors.textOnBrand, fontWeight: "700" },
    ctaTextGhost: { color: t.colors.text, fontWeight: "700" },
    infoText: { color: t.colors.text, marginBottom: 10, fontWeight: "700", textAlign: "center" },
  });

  const manualPanel = (
    <View style={[s.cameraView, { alignItems: "center", justifyContent: "center" }]}>
      <Text style={s.infoText}>Manual scan mode is enabled for this device.</Text>
      <Pressable onPress={() => router.push("/manual-entry")} style={s.cta}>
        <Text style={s.ctaText}>Manual Entry</Text>
      </Pressable>
    </View>
  );

  return (
    <Screen padded={false}>
      <View style={s.wrap}>
        <View style={s.cameraFrame}>
          {manualOnly ? (
            manualPanel
          ) : permission !== "granted" ? (
            <View style={[s.cameraView, { alignItems: "center", justifyContent: "center" }]}>
              <Text style={s.infoText}>Camera permission needed</Text>
              <Pressable onPress={requestPerms} style={s.ctaGhost}><Text style={s.ctaTextGhost}>Allow Camera</Text></Pressable>
            </View>
          ) : (IS_WEB && BarCodeScanner) ? (
            <BarCodeScanner key={mountKey} style={s.cameraView} onBarCodeScanned={onScanned} />
          ) : CameraView ? (
            <CameraView key={mountKey} style={s.cameraView} facing={facing} onBarCodeScanned={onScanned}
              barCodeScannerSettings={{ barCodeTypes: ["qr","pdf417","code128","code39","ean13","ean8","upc_a","upc_e"] }} />
          ) : (
            manualPanel
          )}
          <View style={s.overlay}><View style={s.greenBox} /></View>
        </View>
        <View style={s.bottomBar}><Text style={s.bottomText}>Align code within the frame</Text></View>
        <View style={s.ctaRow}>
          <Pressable onPress={() => router.push("/manual-entry")} style={s.cta}><Text style={s.ctaText}>Manual Entry</Text></Pressable>
          {!IS_WEB && CameraView && !manualOnly && (
            <Pressable onPress={() => setFacing((p) => (p === "back" ? "front" : "back"))} style={s.ctaGhost}>
              <Text style={s.ctaTextGhost}>Flip Camera</Text>
            </Pressable>
          )}
        </View>
      </View>
    </Screen>
  );
}
