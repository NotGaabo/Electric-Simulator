/**
 * Power circuit helpers.
 * The control circuit dictates coil state.
 * The power circuit simply reflects contact state → load state.
 * This separation exists for future extension (e.g. overcurrent protection).
 */

import { AutomationNode } from "./types";

export function isPowerActive(
  loadId: string,
  nodes: AutomationNode[]
): boolean {
  const load = nodes.find((n) => n.id === loadId);
  if (!load) return false;
  if (load.type === "lamp" || load.type === "motor") {
    return load.active;
  }
  return false;
}