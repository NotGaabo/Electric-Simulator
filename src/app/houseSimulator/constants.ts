import { Room, DistributionPanel } from "./types";

export const GRID = 20;

export const CIRCUIT_COLORS: Record<string, string> = {
  lighting: "#fbbf24",
  outlet: "#60a5fa",
  ground: "#4ade80",
};

export const DEFAULT_ROOMS: Room[] = [
  { id: "living",   name: "Sala",       type: "living",   x: 5,  y: 5,  width: 40, height: 45 },
  { id: "bedroom",  name: "Dormitorio", type: "bedroom",  x: 55, y: 5,  width: 40, height: 45 },
  { id: "kitchen",  name: "Cocina",     type: "kitchen",  x: 5,  y: 55, width: 28, height: 40 },
  { id: "bathroom", name: "Baño",       type: "bathroom", x: 38, y: 55, width: 22, height: 40 },
  { id: "garage",   name: "Garage",     type: "garage",   x: 65, y: 55, width: 30, height: 40 },
];

export const DEFAULT_PANEL: DistributionPanel = {
  id: "main-panel",
  x: -160,
  y: 200,
  breakerIds: [],
  mainBreakerRating: 100,
};

export const ELEMENT_ICONS: Record<string, string> = {
  light: "💡",
  outlet: "🔌",
  switch: "🔘",
  ground_rod: "⏚",
  panel_breaker: "⚡",
  panel_differential: "🛡",
  conduit_pvc: "〰",
  conduit_emt: "═",
  cable_tray: "▬",
  power_source: "🔋",
};

export const ELEMENT_LABELS: Record<string, string> = {
  light: "Luminaria",
  outlet: "Tomacorriente",
  switch: "Interruptor",
  ground_rod: "Varilla Tierra",
  panel_breaker: "Termomagnético",
  panel_differential: "Diferencial",
  conduit_pvc: "Tubería PVC",
  conduit_emt: "Tubería EMT",
  cable_tray: "Canaleta",
  power_source: "Fuente eléctrica",
};

export const PALETTE_GROUPS = [
  {
    cat: "Iluminación (RF-06)",
    items: ["light", "switch"],
  },
  {
    cat: "Tomacorrientes (RF-06)",
    items: ["outlet"],
  },
  {
    cat: "Fuentes",
    items: ["power_source"],
  },
  {
    cat: "Tablero (RF-07)",
    items: ["panel_breaker", "panel_differential"],
  },
  {
    cat: "Canalización (RF-08)",
    items: ["conduit_pvc", "conduit_emt", "cable_tray"],
  },
  {
    cat: "Tierra (RF-09)",
    items: ["ground_rod"],
  },
];
