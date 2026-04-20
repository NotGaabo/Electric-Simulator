import type { Component, Wire } from "@/types/types";

export interface CircuitAnalysis {
  circuitClosed: boolean;
  shortCircuit: boolean;
  totalVoltage: number;
  current: number;
  totalResistance: number;
  totalPower: number;
  compValues: Record<string, { v: number; i: number; p: number }>;
}

/** Componentes que GENERAN voltaje */
const VOLTAGE_SOURCES = new Set(["battery", "source"]);

/** Componentes que CONSUMEN energía (no pueden definir voltaje) */
const CONSUMERS = new Set(["resistor", "luminaire", "outlet", "led"]);

export function analyzeCircuit(
  components: Component[],
  wires: Wire[]
): CircuitAnalysis {
  const empty: CircuitAnalysis = {
    circuitClosed: false,
    shortCircuit: false,
    totalVoltage: 0,
    current: 0,
    totalResistance: Infinity,
    totalPower: 0,
    compValues: {},
  };

  if (components.length === 0 || wires.length === 0) return empty;

  // ── 1. Detectar circuito cerrado con BFS/DFS ──────────────────────────────
  const closed = isCircuitClosed(components, wires);
  if (!closed) return { ...empty, circuitClosed: false };

  // ── 2. Sumar fuentes de voltaje ───────────────────────────────────────────
  const sources = components.filter(c => VOLTAGE_SOURCES.has(c.type));
  const totalVoltage = sources.reduce((acc, s) => acc + (s.voltage ?? 0), 0);

  if (totalVoltage === 0) return { ...empty, circuitClosed: true };

  // ── 3. Calcular resistencia total ─────────────────────────────────────────
  // Simplificación: detecta serie vs paralelo por conectividad
  const consumers = components.filter(c => CONSUMERS.has(c.type));
  const { totalResistance, shortCircuit } = computeResistance(consumers, wires);

  if (shortCircuit) {
    return { ...empty, circuitClosed: true, shortCircuit: true, totalVoltage };
  }

  if (!isFinite(totalResistance) || totalResistance === 0) return { ...empty, circuitClosed: true };

  // ── 4. Ley de Ohm ─────────────────────────────────────────────────────────
  const current = totalVoltage / totalResistance;
  const totalPower = totalVoltage * current;

  // ── 5. Valores por componente ─────────────────────────────────────────────
  const compValues: Record<string, { v: number; i: number; p: number }> = {};

  for (const comp of components) {
    if (VOLTAGE_SOURCES.has(comp.type)) {
      compValues[comp.id] = { v: comp.voltage ?? 0, i: current, p: (comp.voltage ?? 0) * current };
    } else if (CONSUMERS.has(comp.type)) {
      const r = effectiveResistance(comp);
      const v = isFinite(r) ? current * r : 0;
      compValues[comp.id] = { v, i: current, p: v * current };
    } else {
      // Switches, breakers cerrados: sin caída de tensión
      compValues[comp.id] = { v: 0, i: current, p: 0 };
    }
  }

  return { circuitClosed: true, shortCircuit: false, totalVoltage, current, totalResistance, totalPower, compValues };
}

/** BFS: determina si existe un loop cerrado que incluya al menos una fuente */
function isCircuitClosed(components: Component[], wires: Wire[]): boolean {
  // Construye grafo de adyacencia: nodo = compId+portId
  type NodeKey = string;
  const adj = new Map<NodeKey, NodeKey[]>();

  const addEdge = (a: NodeKey, b: NodeKey) => {
    if (!adj.has(a)) adj.set(a, []);
    if (!adj.has(b)) adj.set(b, []);
    adj.get(a)!.push(b);
    adj.get(b)!.push(a);
  };

  // Cada componente conecta sus propios puertos internamente
  for (const comp of components) {
    // Switches y breakers abiertos rompen el circuito
    if ((comp.type === "switch" || comp.type === "breaker") && !comp.closed) continue;
    addEdge(`${comp.id}:left`, `${comp.id}:right`);
  }

  // Los cables conectan puertos entre componentes
  for (const wire of wires) {
    addEdge(
      `${wire.fromCompId}:${wire.fromPortId}`,
      `${wire.toCompId}:${wire.toPortId}`
    );
  }

  // Verifica ciclo: DFS desde el primer nodo
  if (adj.size === 0) return false;
  const start = adj.keys().next().value as NodeKey;
  const visited = new Set<NodeKey>();
  const hasCycle = dfsHasCycle(start, null, adj, visited);

  // Además debe haber al menos una fuente de voltaje
  const hasSource = components.some(c => VOLTAGE_SOURCES.has(c.type));
  return hasCycle && hasSource;
}

function dfsHasCycle(
  node: string,
  parent: string | null,
  adj: Map<string, string[]>,
  visited: Set<string>
): boolean {
  visited.add(node);
  for (const neighbor of (adj.get(node) ?? [])) {
    if (!visited.has(neighbor)) {
      if (dfsHasCycle(neighbor, node, adj, visited)) return true;
    } else if (neighbor !== parent) {
      return true; // Encontró ciclo
    }
  }
  return false;
}

/** Calcula resistencia total (serie simple; extiende para paralelo si necesitas) */
function computeResistance(
  consumers: Component[],
  _wires: Wire[]
): { totalResistance: number; shortCircuit: boolean } {
  if (consumers.length === 0) return { totalResistance: 0, shortCircuit: true }; // cortocircuito

  let total = 0;
  for (const c of consumers) {
    const r = effectiveResistance(c);
    if (!isFinite(r) || r < 0) return { totalResistance: Infinity, shortCircuit: false };
    total += r;
  }
  return { totalResistance: total, shortCircuit: false };
}

/** Resistencia efectiva de un componente consumidor */
function effectiveResistance(comp: Component): number {
  if (comp.type === "resistor") return comp.resistance ?? 100;
  if (comp.type === "luminaire" || comp.type === "led") {
    // R = V² / P  (si tiene voltaje y potencia definidos)
    const v = comp.voltage ?? 120;
    const p = comp.power ?? 60;
    return p > 0 ? (v * v) / p : Infinity;
  }
  if (comp.type === "outlet") return comp.resistance ?? 1000;
  return Infinity;
}