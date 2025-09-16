// frontend/utils/ScanBus.ts
// Super-light event bus so any screen can subscribe to scan results.

type ScanEvent = { raw: string; ts: number };

type Listener = (evt: ScanEvent) => void;

class ScanBusClass {
  private listeners = new Set<Listener>();

  emit(evt: ScanEvent) {
    for (const l of this.listeners) {
      try { l(evt); } catch {}
    }
  }

  on(listener: Listener) {
    this.listeners.add(listener);
    return () => this.off(listener);
  }

  off(listener: Listener) {
    this.listeners.delete(listener);
  }
}

export const ScanBus = new ScanBusClass();
