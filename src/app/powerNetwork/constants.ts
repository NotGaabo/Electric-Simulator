// ─── Power Network Constants ──────────────────────────────────────────────────

export const GRID = 40;
export const POLE_R = 14;
export const PORT_R = 7;
export const SNAP_DIST = 20;

export const CONDUCTOR_COLORS: Record<string, string> = {
  phase_a: "#ef4444",   // Red
  phase_b: "#f59e0b",   // Yellow
  phase_c: "#3b82f6",   // Blue
  neutral: "#94a3b8",   // Gray
  ground:  "#22c55e",   // Green
};

export const CONDUCTOR_LABELS: Record<string, string> = {
  phase_a: "Fase A (R)",
  phase_b: "Fase B (S)",
  phase_c: "Fase C (T)",
  neutral: "Neutro (N)",
  ground:  "Tierra (PE)",
};

export const POLE_TYPES = {
  wooden:   { label: "Poste Madera",    color: "#92400e", height: 9  },
  concrete: { label: "Poste Hormigón",  color: "#64748b", height: 11 },
  metal:    { label: "Poste Metálico",  color: "#475569", height: 12 },
};

export const CROSS_SECTIONS = [16, 25, 35, 50, 70, 95, 120, 150, 185, 240];

export const TENSION_THRESHOLDS = {
  too_loose: 30,
  too_tight: 75,
};

export const TRENCH_DEPTHS = [0.6, 0.8, 1.0, 1.2]; // meters

export const PALETTE_AERIAL = [
  { type: "wooden",   label: "Poste Madera",   cat: "Postes",     emoji: "🪵" },
  { type: "concrete", label: "Poste Hormigón", cat: "Postes",     emoji: "🏗" },
  { type: "metal",    label: "Poste Metálico", cat: "Postes",     emoji: "⚙" },
  { type: "phase_a",  label: "Conductor F-A",  cat: "Conductores", emoji: "🔴" },
  { type: "phase_b",  label: "Conductor F-B",  cat: "Conductores", emoji: "🟡" },
  { type: "phase_c",  label: "Conductor F-C",  cat: "Conductores", emoji: "🔵" },
  { type: "neutral",  label: "Neutro",         cat: "Conductores", emoji: "⚪" },
  { type: "ground",   label: "Tierra",         cat: "Conductores", emoji: "🟢" },
];

export const PALETTE_UNDERGROUND = [
  { type: "trench",  label: "Zanja",           cat: "Instalación", emoji: "⛏" },
  { type: "phase_a", label: "Cable F-A",        cat: "Cables",      emoji: "🔴" },
  { type: "phase_b", label: "Cable F-B",        cat: "Cables",      emoji: "🟡" },
  { type: "phase_c", label: "Cable F-C",        cat: "Cables",      emoji: "🔵" },
  { type: "neutral", label: "Cable Neutro",     cat: "Cables",      emoji: "⚪" },
  { type: "ground",  label: "Cable Tierra",     cat: "Cables",      emoji: "🟢" },
];