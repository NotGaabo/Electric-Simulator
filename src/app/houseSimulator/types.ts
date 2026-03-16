// ─── House Simulator Types ─────────────────────────────────────────────────────

export type CircuitType = "lighting" | "outlet" | "ground";
export type ConductorType = "phase" | "neutral" | "ground";

export type RoomType = "living" | "bedroom" | "kitchen" | "bathroom" | "garage";

export interface Room {
  id: string;
  name: string;
  type: RoomType;
  x: number;      // position inside house floor plan (%)
  y: number;
  width: number;  // size in % of house floor area
  height: number;
}

export type ElectricalElementType =
  | "light"
  | "outlet"
  | "switch"
  | "ground_rod"
  | "panel_breaker"
  | "panel_differential"
  | "conduit_pvc"
  | "conduit_emt"
  | "cable_tray"
  | "power_source";

export interface ElectricalElement {
  id: string;
  type: ElectricalElementType;
  roomId: string | null;       // null = outdoor / panel area
  x: number;                   // absolute canvas coords
  y: number;
  circuitId: string | null;
  label: string;
  isOn?: boolean;
  isGrounded?: boolean;
  rating?: number;             // amps for breakers
  voltage?: number;
}

export interface Circuit {
  id: string;
  name: string;
  type: CircuitType;
  color: string;
  breakerId: string | null;
  elementIds: string[];
  isProtected: boolean;        // has differential
  hasGround: boolean;
}

export interface Wire {
  id: string;
  fromElementId: string;
  toElementId: string;
  circuitId: string;
  conductorType: ConductorType;
  path: { x: number; y: number }[];
}

export interface DistributionPanel {
  id: string;
  x: number;
  y: number;
  breakerIds: string[];
  mainBreakerRating: number;
}

export interface HouseState {
  rooms: Room[];
  elements: ElectricalElement[];
  circuits: Circuit[];
  wires: Wire[];
  panel: DistributionPanel;
  zoomLevel: number;           // 1 = exterior view, >2 = interior view
  viewTarget: "exterior" | "interior";
  selectedRoomId: string | null;
  selectedElementId: string | null;
  selectedCircuitId: string | null;
  cameraX: number;
  cameraY: number;
}

export interface ValidationError {
  id: string;
  severity: "error" | "warning" | "info";
  category: "RF-06" | "RF-07" | "RF-08" | "RF-09" | "RF-10";
  title: string;
  message: string;
  elementIds: string[];
  fix: string;
}
