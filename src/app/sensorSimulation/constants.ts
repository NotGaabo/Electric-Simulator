export const TICK_INTERVAL_MS = 100;
export const DEFAULT_TIMER_DELAY_MS = 5000;

export const NODE_WIDTH = 80;
export const NODE_HEIGHT = 60;

export const PALETTE_ITEMS = [
  { type: "sensor", label: "Sensor", icon: "📡" },
  { type: "selector", label: "Selector", icon: "🔘" },
  { type: "relay", label: "Relé", icon: "🔌" },
  { type: "contactor", label: "Contactor", icon: "⚡" },
  { type: "timer", label: "Timer", icon: "⏱" },
  { type: "lamp", label: "Lámpara", icon: "💡" },
  { type: "motor", label: "Motor", icon: "⚙️" },
] as const;