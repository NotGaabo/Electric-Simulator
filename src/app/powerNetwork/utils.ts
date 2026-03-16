// ─── Utilities ────────────────────────────────────────────────────────────────
import { GRID, SNAP_DIST, TENSION_THRESHOLDS, CONDUCTOR_COLORS } from "./constants";
import { Pole, Conductor, TensionWarning, ValidationResult, ConductorType } from "./types";

export function snapToGrid(v: number): number {
  return Math.round(v / GRID) * GRID;
}

export function dist(ax: number, ay: number, bx: number, by: number): number {
  return Math.sqrt((bx - ax) ** 2 + (by - ay) ** 2);
}

export function nearestPole(
  mx: number,
  my: number,
  poles: Pole[]
): Pole | null {
  let nearest: Pole | null = null;
  let minD = SNAP_DIST;
  for (const p of poles) {
    const d = dist(mx, my, p.x, p.y);
    if (d < minD) { minD = d; nearest = p; }
  }
  return nearest;
}

export function conductorPath(
  x1: number, y1: number,
  x2: number, y2: number,
  sag: number = 0.05
): string {
  const mx = (x1 + x2) / 2;
  const my = (y1 + y2) / 2 + dist(x1, y1, x2, y2) * sag;
  return `M ${x1} ${y1} Q ${mx} ${my} ${x2} ${y2}`;
}

export function getTensionWarning(conductor: Conductor): TensionWarning {
  const { tension, id } = conductor;
  if (tension < TENSION_THRESHOLDS.too_loose) {
    return { conductorId: id, type: "too_loose", message: "⚠ Cable muy flojo — riesgo de contacto" };
  }
  if (tension > TENSION_THRESHOLDS.too_tight) {
    return { conductorId: id, type: "too_tight", message: "⚠ Cable muy tenso — riesgo de rotura" };
  }
  return { conductorId: id, type: "optimal", message: "✓ Tensión óptima" };
}

export function validateNetwork(
  poles: Pole[],
  conductors: Conductor[]
): ValidationResult {
  const warnings: string[] = [];
  const errors: string[] = [];

  if (poles.length === 0) errors.push("No hay postes en la red");
  if (conductors.length === 0) warnings.push("No hay conductores instalados");

  // Check loose/tight conductors
  conductors.forEach(c => {
    const w = getTensionWarning(c);
    if (w.type !== "optimal") warnings.push(`${c.label}: ${w.message}`);
  });

  // Check unconnected poles
  const connectedPoles = new Set<string>();
  conductors.forEach(c => {
    connectedPoles.add(c.fromPoleId);
    connectedPoles.add(c.toPoleId);
  });
  poles.forEach(p => {
    if (!connectedPoles.has(p.id)) warnings.push(`Poste ${p.label} sin conexiones`);
  });

  return { valid: errors.length === 0, warnings, errors };
}

export function conductorSagFromTension(tension: number): number {
  // Higher tension = less sag
  return 0.02 + (1 - tension / 100) * 0.12;
}

export function uid(): string {
  return Math.random().toString(36).slice(2, 9);
}

export function conductorColor(type: ConductorType): string {
  return CONDUCTOR_COLORS[type] ?? "#94a3b8";
}