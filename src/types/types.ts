
export type CompType =
  | "battery"
  | "resistor"
  | "luminaire"
  | "switch"
  | "breaker"
  | "capacitor"
  | "outlet"
  | "motor"
  | "transformer"
  | "stator"
  | "rotor";

export interface Port {
  id: string;       // e.g. "left" | "right"
  dx: number;       // offset from component center
  dy: number;
  label: string;
}

export interface Component {
  id: string;
  type: CompType;
  x: number;
  y: number;
  label: string;
  // electrical props
  voltage?: number;
  resistance?: number;
  power?: number;
  isOn?: boolean;
  ratedVoltage?: number;
  health?: "ok" | "warning" | "fault";
}

export interface Wire {
  id: string;
  fromCompId: string;
  fromPortId: string;
  toCompId: string;
  toPortId: string;
}

export interface AnalysisResult {
  current: number;           // total circuit current (A)
  totalVoltage: number;      // total source voltage
  totalResistance: number;   // equivalent resistance
  totalPower: number;
  compValues: Record<string, { v: number; i: number; p: number }>;
  circuitClosed: boolean;
  shortCircuit?: boolean;
}
