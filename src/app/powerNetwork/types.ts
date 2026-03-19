// ─── Power Network Types ──────────────────────────────────────────────────────

export type NetworkMode = "aerial" | "underground";
export type ViewMode = "2d" | "3d";
export type ToolMode = "select" | "pole" | "conductor" | "trench" | "cable" | "label";

export type ConductorType = "phase_a" | "phase_b" | "phase_c" | "neutral" | "ground";
export type VoltageLevel = "LV" | "MV" | "HV"; // Low / Medium / High

export interface Pole {
  id: string;
  x: number;
  y: number;
  z: number; // height
  height: number; // pole height in meters
  type: "wooden" | "concrete" | "metal";
  hasAnchor: boolean;
  label: string;
  insulatorCount: number;
}

export interface Conductor {
  id: string;
  fromPoleId: string;
  toPoleId: string;
  type: ConductorType;
  tension: number;       // 0-100, 50 = optimal
  crossSection: number;  // mm²
  material: "aluminum" | "copper";
  protected: boolean;    // has mechanical protection
  color: string;
  label: string;
  voltage: VoltageLevel;
}

export interface Trench {
  id: string;
  points: { x: number; y: number }[];
  depth: number;   // meters
  width: number;   // meters
  covered: boolean;
  conduitCount: number;
}

export interface UndergroundCable {
  id: string;
  trenchId: string;
  type: ConductorType;
  crossSection: number;
  color: string;
  label: string;
  hasConduit: boolean;
  hasMechanicalProtection: boolean;
  voltage: VoltageLevel;
}

export interface NetworkLabel {
  id: string;
  x: number;
  y: number;
  text: string;
  targetId: string; // pole, conductor, cable or trench id
  color: string;
}

export interface TensionWarning {
  conductorId: string;
  type: "too_loose" | "too_tight" | "optimal";
  message: string;
}

export interface ValidationResult {
  valid: boolean;
  warnings: string[];
  errors: string[];
}

export interface NetworkAnalysis {
  poleCount: number;
  conductorCount: number;
  trenchCount: number;
  cableCount: number;
  totalLength: number;
  tensionWarnings: TensionWarning[];
  validation: ValidationResult;
}