import { EquipmentDefinition, EquipmentType } from "./types";

export const OFFICE_ROOM_NAME = "Habitacion Unica de Oficina";

export const EQUIPMENT_TYPES: EquipmentType[] = [
  "LIGHT",
  "PANEL_LED",
  "REFLECTOR",
  "INDUSTRIAL_LUMINAIRE",
  "AIR_CONDITIONER",
  "OUTLET",
];
export const CIRCUIT_TOOLBOX = [
  "Fuente Trifasica",
  "Breaker principal",
  "Interruptor de circuito",
  "Cableado L1/L2/L3/N/PE",
];

export const EQUIPMENT_CATALOG: Record<EquipmentType, EquipmentDefinition> = {
  LIGHT: {
    type: "LIGHT",
    label: "Bombillo / Luminaria",
    shortLabel: "Luminaria",
    category: "LOAD",
    powerW: 20,
    requiredVoltage: { min: 110, max: 127 },
    requiresSwitch: true,
  },
  PANEL_LED: {
    type: "PANEL_LED",
    label: "Panel LED Comercial",
    shortLabel: "Panel LED",
    category: "LOAD",
    powerW: 48,
    requiredVoltage: { min: 110, max: 127 },
    requiresSwitch: true,
  },
  REFLECTOR: {
    type: "REFLECTOR",
    label: "Reflector LED",
    shortLabel: "Reflector",
    category: "LOAD",
    powerW: 120,
    requiredVoltage: { min: 110, max: 127 },
    requiresSwitch: true,
  },
  INDUSTRIAL_LUMINAIRE: {
    type: "INDUSTRIAL_LUMINAIRE",
    label: "Luminaria Industrial",
    shortLabel: "Lum. Ind.",
    category: "LOAD",
    powerW: 220,
    requiredVoltage: { min: 208, max: 240 },
    requiresSwitch: true,
  },
  AIR_CONDITIONER: {
    type: "AIR_CONDITIONER",
    label: "Aire Acondicionado",
    shortLabel: "A/A",
    category: "LOAD",
    powerW: 1800,
    requiredVoltage: { min: 208, max: 240 },
  },
  OUTLET: {
    type: "OUTLET",
    label: "Tomacorriente",
    shortLabel: "Toma",
    category: "LOAD",
    powerW: 300,
    requiredVoltage: { min: 110, max: 127 },
  },
};

export const DEFAULT_CIRCUIT_VALUES = {
  breakerOn: false,
  switchOn: false,
  voltage: 0,
  connection: {
    hasL1: false,
    hasL2: false,
    hasL3: false,
    hasNeutral: false,
    hasGround: false,
  },
} as const;

export const UI_THEME = {
  appBg: "#030b1f",
  panelBg: "#04122d",
  panelBorder: "#12315f",
  roomBg: "#0a1f46",
  roomBorder: "#2a5db3",
  textPrimary: "#dbe9ff",
  textSecondary: "#7fa4e8",
  accent: "#56a2ff",
  success: "#4ade80",
  danger: "#fb7185",
} as const;
