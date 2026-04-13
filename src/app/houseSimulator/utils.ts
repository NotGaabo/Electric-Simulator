import { Circuit, OutletWiringMode, PortTemplate } from "./types";
import {
  OUTLET_PORTS_FEED_THROUGH,
  OUTLET_PORTS_NON_POLARIZED,
} from "./constants";

let idSeq = 0;

export function createId(prefix: string): string {
  idSeq += 1;
  return `${prefix}-${idSeq}`;
}

export function buildOutletPorts(mode: OutletWiringMode): PortTemplate[] {
  const base =
    mode === "feedThrough"
      ? OUTLET_PORTS_FEED_THROUGH
      : OUTLET_PORTS_NON_POLARIZED;
  return base.map((port) => ({ ...port }));
}

export function hasActiveCircuits(circuits: Circuit[]): boolean {
  return circuits.length > 0;
}
