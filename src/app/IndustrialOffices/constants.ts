import { EquipmentDefinition, EquipmentType } from "./types";

export const OFFICE_ROOM_NAME = "Habitacion Unica de Oficina";

export const EQUIPMENT_TYPES: EquipmentType[] = ["LIGHT", "AIR_CONDITIONER", "OUTLET"];
export const CIRCUIT_TOOLBOX = ["Breaker", "Interruptor", "Cable"];

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
    hasPhase: false,
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
