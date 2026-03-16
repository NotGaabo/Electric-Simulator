export type CompType = "source" | "transformer" | "motor" | "breaker" | "voltmeter" | "ammeter";
export type CompatLevel = "ok" | "warning" | "error";

export interface CompProps {
  voltage?: number;
  frequency?: number;
  turns1?: number;
  turns2?: number;
  efficiency?: number;
  ratedVoltage?: number;
  powerFactor?: number;
  ratedPower?: number;
  isOn?: boolean;
  ratedCurrent?: number;
}

export interface PlacedComp {
  id: string;
  type: CompType;
  x: number;
  y: number;
  label: string;
  props: CompProps;
}

export interface Connection {
  id: string;
  from: string;
  to: string;
}

export interface PortDef { x: number; y: number; }
export interface CompDef {
  label: string;
  color: string;
  ports: Record<string, PortDef>;
  defaults: CompProps;
}

export interface TransformerCircuit {
  source?: CompProps;
  transformer?: CompProps;
  motor?: CompProps;
  breaker?: CompProps;
}

export interface PhysicsResult {
  V1: number; V2: number; a: number; n1: number; n2: number;
  η: number; f: number; I1: number; I2: number;
  P_in: number; P_out: number; losses: number; loadFactor: number;
}

export interface CompatResult {
  level: CompatLevel;
  messages: string[];
}