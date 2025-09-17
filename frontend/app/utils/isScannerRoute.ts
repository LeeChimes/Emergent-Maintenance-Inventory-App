export function isScannerPath(path?: string | null): boolean {
  if (!path) return false;
  const p = path.split("?")[0].toLowerCase();
  // Support common scanner routes in your app
  return p === "/scan" || p === "/scanner" || p === "/qr" || p === "/qr-scan";
}