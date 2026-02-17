// src/lib/calculations/circuitCalculations.ts

import { ElectricalSymbol, Connection, CircuitAnalysis } from "@/types/electrical";

/**
 * Ohm's Law: V = I * R
 */
export function ohmLaw(params: { V?: number; I?: number; R?: number }) {
  const { V, I, R } = params;
  if (V !== undefined && R !== undefined && R !== 0) return { I: V / R };
  if (V !== undefined && I !== undefined && I !== 0) return { R: V / I };
  if (I !== undefined && R !== undefined) return { V: I * R };
  return {};
}

/**
 * Power: P = V * I = I² * R = V² / R
 */
export function calculatePower(V: number, I: number): number {
  return V * I;
}

/**
 * Series resistance: R_total = R1 + R2 + ... + Rn
 */
export function seriesResistance(resistances: number[]): number {
  return resistances.reduce((sum, r) => sum + r, 0);
}

/**
 * Parallel resistance: 1/R_total = 1/R1 + 1/R2 + ... + 1/Rn
 */
export function parallelResistance(resistances: number[]): number {
  const filtered = resistances.filter((r) => r > 0);
  if (filtered.length === 0) return 0;
  const reciprocalSum = filtered.reduce((sum, r) => sum + 1 / r, 0);
  return reciprocalSum === 0 ? 0 : 1 / reciprocalSum;
}

/**
 * Capacitive reactance: Xc = 1 / (2π * f * C)
 */
export function capacitiveReactance(frequency: number, capacitance: number): number {
  if (capacitance === 0) return Infinity;
  return 1 / (2 * Math.PI * frequency * capacitance);
}

/**
 * Calculate total load from symbols
 */
export function calculateTotalLoad(symbols: ElectricalSymbol[]): number {
  return symbols.reduce((total, s) => total + (s.power || 0), 0);
}

/**
 * Full circuit analysis
 */
export function analyzeCircuit(
  symbols: ElectricalSymbol[],
  connections: Connection[]
): CircuitAnalysis {
  // Find batteries/voltage sources
  const sources = symbols.filter((s) => s.type === "battery");
  const loads = symbols.filter(
    (s) => s.type !== "battery" && s.type !== "wire" && s.type !== "switch"
  );

  // Check if any switch is open (breaks circuit)
  const switches = symbols.filter((s) => s.type === "switch");
  const isCircuitOpen = switches.some((s) => s.isOn === false);

  if (isCircuitOpen || sources.length === 0) {
    return {
      totalVoltage: 0,
      totalCurrent: 0,
      totalResistance: 0,
      totalPower: 0,
      components: symbols.map((s) => ({ id: s.id, voltage: 0, current: 0, power: 0 })),
    };
  }

  const totalVoltage = sources.reduce((sum, s) => sum + (s.voltage || 0), 0);

  // Simple series circuit assumption for now
  const resistances = loads
    .map((s) => s.resistance || defaultResistance(s))
    .filter((r) => r > 0);

  const totalResistance =
    resistances.length > 0 ? seriesResistance(resistances) : 1;
  const totalCurrent = totalVoltage / totalResistance;
  const totalPower = calculatePower(totalVoltage, totalCurrent);

  const components = symbols.map((s) => {
    const r = s.resistance || defaultResistance(s);
    const current = r > 0 ? totalCurrent : 0;
    const voltage = current * r;
    const power = calculatePower(voltage, current);
    return { id: s.id, voltage, current, power };
  });

  return { totalVoltage, totalCurrent, totalResistance, totalPower, components };
}

function defaultResistance(symbol: ElectricalSymbol): number {
  switch (symbol.type) {
    case "resistor": return symbol.resistance || 100;
    case "luminaire": return (symbol.voltage || 120) ** 2 / (symbol.power || 60);
    case "outlet": return 0;
    case "breaker": return symbol.isOn === false ? Infinity : 0.01;
    default: return 0;
  }
}