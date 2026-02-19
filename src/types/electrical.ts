// types/electrical.ts

export type ElectricalSymbolType =
  | "luminaire"
  | "outlet"
  | "switch"
  | "breaker"
  | "resistor"
  | "battery"
  | "capacitor"
  | "wire";

export interface ElectricalSymbol {
  id: string;
  type: ElectricalSymbolType;
  x: number;
  y: number;
  power?: number;       // Watts
  voltage?: number;     // Volts
  resistance?: number;  // Ohms
  current?: number;     // Amperes
  isOn?: boolean;       // For switches/breakers
  label?: string;
}

export interface Connection {
  id: string;
  fromId: string;
  toId: string;
  fromPort: "left" | "right" | "top" | "bottom";
  toPort: "left" | "right" | "top" | "bottom";
}

export interface CircuitAnalysis {
  totalVoltage: number;
  totalCurrent: number;
  totalResistance: number;
  totalPower: number;
  components: {
    id: string;
    voltage: number;
    current: number;
    power: number;
  }[];
  shortCircuit?: boolean;
}