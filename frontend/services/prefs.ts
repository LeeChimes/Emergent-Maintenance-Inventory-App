import AsyncStorage from "@react-native-async-storage/async-storage";

export type ScanMode = "auto" | "manual";
const KEY = "prefs.scanMode";

export async function getScanMode(): Promise<ScanMode> {
  try {
    const v = await AsyncStorage.getItem(KEY);
    if (v === "manual" || v === "auto") return v;
  } catch {}
  return "auto";
}

export async function setScanMode(mode: ScanMode) {
  try { await AsyncStorage.setItem(KEY, mode); } catch {}
}
