// ─── Helpers ──────────────────────────────────────────────────────────────────

import { GRID } from "./circuit/constants";

let idCtr = 1;
const uid = () => `c${idCtr++}`;
const wid = () => `w${idCtr++}`;

export { uid, wid };

export function snap(v: number) { return Math.round(v / GRID) * GRID; }

// Wire path: smooth orthogonal bezier between two points
export function wirePath(x1: number, y1: number, x2: number, y2: number): string {
  const mx = (x1 + x2) / 2;
  return `M ${x1},${y1} C ${mx},${y1} ${mx},${y2} ${x2},${y2}`;
}