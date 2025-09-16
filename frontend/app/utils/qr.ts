// frontend/app/utils/qr.ts

// What kinds of codes we support generating right now
export type QRType = 'door' | 'delivery' | 'asset' | 'tool' | 'part';

export interface BuildQRInput {
  t: QRType;
  id: string;                    // the visible code, e.g. "FD-CORE8-012"
  meta?: Record<string, string>; // reserved for future
}

/**
 * Keep it ultra simple: encode just the ID string.
 * This matches your current scanner which routes by string prefix.
 */
export function buildQR(input: BuildQRInput): string {
  return input.id.trim();
}

/**
 * If you ever scan a code that’s just text, this returns it.
 * Later we can extend to parse JSON payloads if you choose.
 */
export function parseQR(raw: string): { id: string } | null {
  const id = String(raw || '').trim();
  return id ? { id } : null;
}
