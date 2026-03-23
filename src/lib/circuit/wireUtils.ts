import type { Wire, WirePoint } from "@/types/types";

/** Construye el string SVG `d` a partir de todos los puntos del cable
 *  incluyendo los extremos reales (puertos de componentes). */
export function buildWirePath(
  from: WirePoint,
  intermediates: WirePoint[],
  to: WirePoint
): string {
  const allPoints = [from, ...intermediates, to];
  return allPoints
    .map((p, i) => `${i === 0 ? "M" : "L"} ${p.x} ${p.y}`)
    .join(" ");
}

/** Inserta un nuevo nodo intermedio en el cable en la posición del click.
 *  Encuentra el segmento más cercano al punto dado e inserta ahí. */
export function insertNodeAtPoint(
  wire: Wire,
  from: WirePoint,
  to: WirePoint,
  clickPoint: WirePoint
): WirePoint[] {
  const allPoints = [from, ...wire.points, to];
  let bestSegment = 0;
  let bestDist = Infinity;

  for (let i = 0; i < allPoints.length - 1; i++) {
    const d = distToSegment(clickPoint, allPoints[i], allPoints[i + 1]);
    if (d < bestDist) {
      bestDist = d;
      bestSegment = i;
    }
  }

  // Inserta entre bestSegment y bestSegment+1 en los intermedios
  // (descontando el primer punto que es `from`)
  const newIntermediates = [...wire.points];
  const insertIdx = bestSegment; // índice en intermedios
  newIntermediates.splice(Math.max(0, insertIdx), 0, clickPoint);
  return newIntermediates;
}

/** Distancia de punto P al segmento AB */
function distToSegment(p: WirePoint, a: WirePoint, b: WirePoint): number {
  const dx = b.x - a.x;
  const dy = b.y - a.y;
  const lenSq = dx * dx + dy * dy;
  if (lenSq === 0) return Math.hypot(p.x - a.x, p.y - a.y);
  const t = Math.max(0, Math.min(1, ((p.x - a.x) * dx + (p.y - a.y) * dy) / lenSq));
  return Math.hypot(p.x - (a.x + t * dx), p.y - (a.y + t * dy));
}

/** Mueve un nodo intermedio (por índice) a nuevas coordenadas */
export function moveIntermediateNode(
  wire: Wire,
  nodeIndex: number,
  newPos: WirePoint
): WirePoint[] {
  const updated = [...wire.points];
  updated[nodeIndex] = newPos;
  return updated;
}

/** Comprueba si el punto está suficientemente cerca del cable para insertar un nodo */
export const WIRE_HIT_THRESHOLD = 8; // px
export function isNearWire(
  wire: Wire,
  from: WirePoint,
  to: WirePoint,
  point: WirePoint
): boolean {
  const allPoints = [from, ...wire.points, to];
  for (let i = 0; i < allPoints.length - 1; i++) {
    if (distToSegment(point, allPoints[i], allPoints[i + 1]) < WIRE_HIT_THRESHOLD) {
      return true;
    }
  }
  return false;
}