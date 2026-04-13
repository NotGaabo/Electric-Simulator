import { ComponentDefinition, ComponentType, PortTemplate } from "./types";

export const OUTLET_PORTS_NON_POLARIZED: PortTemplate[] = [
  { id: "A", label: "A", conductorOptions: ["L", "N"], required: true },
  { id: "B", label: "B", conductorOptions: ["L", "N"], required: true },
  { id: "PE", label: "PE", conductorOptions: ["PE"], required: false },
];

export const OUTLET_PORTS_FEED_THROUGH: PortTemplate[] = [
  { id: "L_IN", label: "L in", conductorOptions: ["L"], required: true },
  { id: "L_OUT", label: "L out", conductorOptions: ["L"], required: true },
  { id: "N_IN", label: "N in", conductorOptions: ["N"], required: true },
  { id: "N_OUT", label: "N out", conductorOptions: ["N"], required: true },
  { id: "PE", label: "PE", conductorOptions: ["PE"], required: false },
];

const LOAD_PORTS: PortTemplate[] = [
  { id: "L", label: "L", conductorOptions: ["L"], required: true },
  { id: "N", label: "N", conductorOptions: ["N"], required: true },
  { id: "PE", label: "PE", conductorOptions: ["PE"], required: false },
];

const SWITCH_PORTS: PortTemplate[] = [
  { id: "L_IN", label: "L in", conductorOptions: ["L"], required: true },
  { id: "L_OUT", label: "L out", conductorOptions: ["L"], required: true },
];

const PANEL_PORTS: PortTemplate[] = [
  { id: "L", label: "L", conductorOptions: ["L"], required: false },
  { id: "N", label: "N", conductorOptions: ["N"], required: false },
  { id: "PE", label: "PE", conductorOptions: ["PE"], required: false },
];

const JUNCTION_PORTS: PortTemplate[] = [
  { id: "L", label: "L", conductorOptions: ["L"], required: false },
  { id: "N", label: "N", conductorOptions: ["N"], required: false },
  { id: "PE", label: "PE", conductorOptions: ["PE"], required: false },
];

export const COMPONENT_DEFINITIONS: Record<ComponentType, ComponentDefinition> = {
  Outlet: {
    type: "Outlet",
    label: "Tomacorriente",
    shortLabel: "Toma",
    category: "load",
    defaultPowerW: 300,
    defaultVoltage: 120,
    ports: [],
    outletModes: ["nonPolarized", "feedThrough"],
  },
  Switch: {
    type: "Switch",
    label: "Interruptor",
    shortLabel: "SW",
    category: "control",
    ports: SWITCH_PORTS,
  },
  LightFixture: {
    type: "LightFixture",
    label: "Luminaria",
    shortLabel: "Luz",
    category: "load",
    defaultPowerW: 20,
    defaultVoltage: 120,
    ports: LOAD_PORTS,
  },
  Panel: {
    type: "Panel",
    label: "Panel Electrico",
    shortLabel: "Panel",
    category: "distribution",
    ports: PANEL_PORTS,
  },
  JunctionBox: {
    type: "JunctionBox",
    label: "Caja de Paso",
    shortLabel: "Caja",
    category: "junction",
    ports: JUNCTION_PORTS,
  },
  Fan: {
    type: "Fan",
    label: "Abanico",
    shortLabel: "Fan",
    category: "load",
    defaultPowerW: 75,
    defaultVoltage: 120,
    ports: LOAD_PORTS,
  },
  AirConditioner: {
    type: "AirConditioner",
    label: "Aire Acondicionado",
    shortLabel: "A/C",
    category: "load",
    defaultPowerW: 1800,
    defaultVoltage: 220,
    ports: LOAD_PORTS,
  },
  Refrigerator: {
    type: "Refrigerator",
    label: "Refrigerador",
    shortLabel: "Refri",
    category: "load",
    defaultPowerW: 600,
    defaultVoltage: 120,
    ports: LOAD_PORTS,
  },
  TV: {
    type: "TV",
    label: "Televisor",
    shortLabel: "TV",
    category: "load",
    defaultPowerW: 180,
    defaultVoltage: 120,
    ports: LOAD_PORTS,
  },
  Microwave: {
    type: "Microwave",
    label: "Microondas",
    shortLabel: "Micro",
    category: "load",
    defaultPowerW: 1200,
    defaultVoltage: 120,
    ports: LOAD_PORTS,
  },
};

export const PALETTE_ITEMS = Object.values(COMPONENT_DEFINITIONS).map(
  ({ type, label, shortLabel, category }) => ({
    type,
    label,
    shortLabel,
    category,
  }),
);
