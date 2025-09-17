declare module "expo-camera" {
  export const Camera: any;
  export const CameraView: any;
  export function getCameraPermissionsAsync(): Promise<{ status: "granted" | "denied" | "undetermined" }>;
  export function requestCameraPermissionsAsync(): Promise<{ status: "granted" | "denied" | "undetermined" }>;
}
declare module "expo-barcode-scanner" {
  export const BarCodeScanner: any;
  export function getPermissionsAsync(): Promise<{ status: "granted" | "denied" | "undetermined" }>;
  export function requestPermissionsAsync(): Promise<{ status: "granted" | "denied" | "undetermined" }>;
}