export type ConductorType = "L" | "N" | "PE";

export type OutletWiringMode = "nonPolarized" | "feedThrough";

export type ComponentCategory = "load" | "control" | "distribution" | "junction";

export type ComponentType =
  | "Outlet"
  | "Switch"
  | "LightFixture"
  | "Panel"
  | "JunctionBox"
  | "Fan"
  | "AirConditioner"
  | "Refrigerator"
  | "TV"
  | "Microwave";

export interface PortTemplate {
  id: string;
  label: string;
  conductorOptions: ConductorType[];
  required?: boolean;
}

export interface ComponentDefinition {
  type: ComponentType;
  label: string;
  shortLabel: string;
  category: ComponentCategory;
  defaultPowerW?: number;
  defaultVoltage?: number;
  ports: PortTemplate[];
  outletModes?: OutletWiringMode[];
}

export interface ComponentInstance {
  id: string;
  type: ComponentType;
  x: number;
  y: number;
  circuitId?: string;
  outletMode?: OutletWiringMode;
  ports: PortTemplate[];
  properties?: Record<string, number | string | boolean>;
}

export interface Circuit {
  id: string;
  name: string;
  breakerOn: boolean;
  voltage: number;
}

export interface Connection {
  id: string;
  circuitId: string;
  fromCompId: string;
  fromPortId: string;
  toCompId: string;
  toPortId: string;
  conductor: ConductorType;
}

export interface ValidationIssue {
  id: string;
  level: "error" | "warning";
  message: string;
  componentId?: string;
  connectionId?: string;
}

export interface HouseState {
  circuits: Circuit[];
  components: ComponentInstance[];
  connections: Connection[];
}

export interface PaletteItem {
  type: ComponentType;
  label: string;
  shortLabel: string;
  category: ComponentCategory;
}
