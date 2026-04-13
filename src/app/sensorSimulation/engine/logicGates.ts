import { Signal } from "./types";

export function AND(...signals: Signal[]): Signal {
  return signals.length > 0 && signals.every(Boolean);
}

export function OR(...signals: Signal[]): Signal {
  return signals.some(Boolean);
}

export function NOT(signal: Signal): Signal {
  return !signal;
}