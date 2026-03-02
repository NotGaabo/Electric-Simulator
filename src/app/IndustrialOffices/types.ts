export type EquipmentType = "LIGHT" | "AIR_CONDITIONER" | "OUTLET";

export type EquipmentStatus = "ON" | "OFF";

export interface VoltageRange {
  min: number;
  max: number;
}

export interface EquipmentDefinition {
  type: EquipmentType;
  label: string;
  shortLabel: string;
  category: "LOAD";
  powerW: number;
  requiredVoltage: VoltageRange;
  requiresSwitch?: boolean;
}

export interface CircuitConnection {
  hasPhase: boolean;
  hasNeutral: boolean;
  hasGround: boolean;
}

export interface ElectricCircuit {
  id: string;
  name: string;
  breakerOn: boolean;
  switchOn: boolean;
  voltage: number;
  connection: CircuitConnection;
}

export interface OfficeEquipment {
  id: string;
  type: EquipmentType;
  label: string;
  status: EquipmentStatus;
  circuitId: string;
}

export interface ValidationResult {
  isValid: boolean;
  reasons: string[];
}

export interface EquipmentOperationalResult extends ValidationResult {
  canOperate: boolean;
}
