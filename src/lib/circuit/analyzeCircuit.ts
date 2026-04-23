// ─── Circuit Analysis Engine ───────────────────────────────────────────────────

import { AnalysisResult, Component, Wire } from "@/types/types";
import { getPorts } from "@/hooks/useCircuitSimulator";

export function analyzeCircuit(
  components: Component[],
  wires: Wire[]
): AnalysisResult {
  const empty: AnalysisResult = {
    current: 0, totalVoltage: 0, totalResistance: 0, totalPower: 0,
    compValues: {}, circuitClosed: false,
  };

  if (components.length === 0 || wires.length === 0) return empty;

  // Build adjacency: node = compId:portId
  // We collapse connected ports into the same electrical node
  const adj: Record<string, string[]> = {};
  const allNodeIds = new Set<string>();

  components.forEach(c => {
    getPorts(c.type).forEach(p => {
      const nid = `${c.id}:${p.id}`;
      allNodeIds.add(nid);
      adj[nid] = adj[nid] || [];
    });
  });

  wires.forEach(w => {
    const a = `${w.fromCompId}:${w.fromPortId}`;
    const b = `${w.toCompId}:${w.toPortId}`;
    adj[a] = adj[a] || [];
    adj[b] = adj[b] || [];
    adj[a].push(b);
    adj[b].push(a);
  });

  // Union-Find to collapse nodes connected by wires
  const parent: Record<string, string> = {};
  allNodeIds.forEach(n => { parent[n] = n; });
  function find(x: string): string {
    if (parent[x] !== x) parent[x] = find(parent[x]);
    return parent[x];
  }
  function union(x: string, y: string) {
    parent[find(x)] = find(y);
  }
  wires.forEach(w => {
    union(`${w.fromCompId}:${w.fromPortId}`, `${w.toCompId}:${w.toPortId}`);
  });

  // Check if any switch/breaker is open — break that path
  const switchOpen = components.some(c => {
  if ((c.type !== "switch" && c.type !== "breaker") || c.isOn !== false) return false;
  // Verificar si este switch tiene wires conectados
  const isConnected = wires.some(
    w => w.fromCompId === c.id || w.toCompId === c.id
  );
  return isConnected;
}); 

  // Find batteries
  const batteries = components.filter(c => c.type === "battery");
  if (batteries.length === 0 || switchOpen) {
    const cv: Record<string, { v: number; i: number; p: number }> = {};
    components.forEach(c => { cv[c.id] = { v: 0, i: 0, p: 0 }; });
    return { ...empty, compValues: cv };
  }

  // Check circuit is closed: battery left port and right port are in
  // different electrical nodes that are eventually connected through the rest
  // Simple heuristic: if there are >= 2 wires touching the battery it's likely closed
  const batteryWires = wires.filter(
    w => batteries.some(b => w.fromCompId === b.id || w.toCompId === b.id)
  );
  if (batteryWires.length < 2) {
    const cv: Record<string, { v: number; i: number; p: number }> = {};
    components.forEach(c => { cv[c.id] = { v: 0, i: 0, p: 0 }; });
    return { ...empty, compValues: cv };
  }

  // Check if battery + and - are on different super-nodes (not short-circuit) 
  // and that there's a path from one to the other (circuit closed)
  const bat = batteries[0];
  const batPlus = find(`${bat.id}:right`);
  const batMinus = find(`${bat.id}:left`);

  // Traverse: collect all components between + and - nodes
  // For each non-battery component: left port and right port must both connect
  // to super-nodes that form a path. 
  // Simple series detection: all components share the same pair of super-nodes
  const totalVoltage = batteries.reduce((s, b) => s + (b.voltage ?? 9), 0);

  // Gather loads and their resistance
  const loads = components.filter(
    c => c.type !== "battery" && c.type !== "switch" && c.type !== "breaker"
  );

  // Verify connectivity: at least one load is connected between + and - nodes
  const connectedLoads = loads.filter(c => {
    const lNode = find(`${c.id}:left`);
    const rNode = find(`${c.id}:right`);
    // Component is connected to circuit if BOTH ports connect to battery's + or -
    // and they're on different nodes (forms a path across the component)
    return (
      (lNode === batPlus || lNode === batMinus) &&
      (rNode === batPlus || rNode === batMinus) &&
      lNode !== rNode // ensures it's not a short circuit across the battery
    );
  });

  if (connectedLoads.length === 0) {
    const cv: Record<string, { v: number; i: number; p: number }> = {};
    components.forEach(c => { cv[c.id] = { v: 0, i: 0, p: 0 }; });
    return { ...empty, compValues: cv };
  }

  // Calculate using only connected loads
  const connectedResistances = connectedLoads.map(c => effectiveResistance(c, totalVoltage));
  const totalResistance = connectedResistances.reduce((a, b) => a + b, 0) || 1;
  const current = totalVoltage / totalResistance;
  const totalPower = totalVoltage * current;

  const compValues: Record<string, { v: number; i: number; p: number }> = {};
  components.forEach(c => {
    // Only calculate values for battery and connected loads
    const isConnectedLoad = connectedLoads.some(l => l.id === c.id);
    const isBattery = c.type === "battery";
    
    if (isBattery) {
      compValues[c.id] = { v: c.voltage ?? 9, i: current, p: (c.voltage ?? 9) * current };
    } else if (c.type === "switch" || c.type === "breaker") {
      // Switches and breakers only have values if they're connected
      const isConnected = wires.some(w => w.fromCompId === c.id || w.toCompId === c.id);
      if (isConnected) {
        compValues[c.id] = { v: 0, i: current, p: 0 };
      } else {
        compValues[c.id] = { v: 0, i: 0, p: 0 };
      }
    } else if (isConnectedLoad) {
      // Only connected loads get calculated values
      const r = effectiveResistance(c, totalVoltage);
      const v = current * r;
      compValues[c.id] = { v, i: current, p: v * current };
    } else {
      // Disconnected components have zero values
      compValues[c.id] = { v: 0, i: 0, p: 0 };
    }
  });

  return { current, totalVoltage, totalResistance, totalPower, compValues, circuitClosed: true };
}

export function effectiveResistance(c: Component, sourceV: number): number {
  switch (c.type) {
    case "resistor": return c.resistance ?? 100;
    case "motor": return c.resistance ?? 32;
    case "transformer": return c.resistance ?? 80;
    case "stator": return c.resistance ?? 25;
    case "rotor": return c.resistance ?? 20;
    case "luminaire": {
      const v = c.voltage ?? 120;
      const p = c.power ?? 60;
      return p > 0 ? (v * v) / p : 240;
    }
    case "outlet": return 50;
    case "capacitor": return 1000; // treated as high-Z for DC
    default: return 0;
  }
}
