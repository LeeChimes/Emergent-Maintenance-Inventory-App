// frontend/utils/qr.ts
export type QRType = 'asset' | 'door' | 'delivery' | 'tool' | 'part';

export interface QRPayload {
  v: 1;
  t: QRType;
  id: string;
  extra?: Record<string, string | number | boolean | null>;
}

export function buildQR(t: QRType, id: string, extra?: QRPayload['extra']): string {
  const payload: QRPayload = { v: 1, t, id, extra };
  return JSON.stringify(payload);
}

export function parseQR(data: string): QRPayload | null {
  try {
    const obj = JSON.parse(data);
    if (!obj || typeof obj !== 'object') return null;
    if (obj.v !== 1) return null;
    if (!obj.t || !obj.id) return null;
    return obj as QRPayload;
  } catch {
    return null;
  }
}
