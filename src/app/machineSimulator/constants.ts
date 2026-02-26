import { CompType, CompDef } from "./type";

export const GRID = 40;
export const COMP_W = 140;
export const COMP_H = 80;

// ─── Definiciones ─────────────────────────────────────────────────────────────
export const COMP_DEFS: Record<CompType, CompDef> = {
  source:      { label: "Fuente AC",     color: "#f59e0b", ports: { left: { x:0,y:40 }, right: { x:140,y:40 } }, defaults: { voltage:220, frequency:60 } },
  transformer: { label: "Transformador", color: "#818cf8", ports: { left: { x:0,y:40 }, right: { x:140,y:40 } }, defaults: { turns1:220, turns2:110, efficiency:0.95 } },
  motor:       { label: "Motor AC",      color: "#34d399", ports: { left: { x:0,y:40 }, right: { x:140,y:40 } }, defaults: { ratedVoltage:110, powerFactor:0.85, ratedPower:500 } },
  breaker:     { label: "Disyuntor",     color: "#f87171", ports: { left: { x:0,y:40 }, right: { x:140,y:40 } }, defaults: { isOn:true, ratedCurrent:10 } },
  voltmeter:   { label: "Voltímetro",    color: "#7dd3fc", ports: { left: { x:0,y:40 }, right: { x:140,y:40 } }, defaults: {} },
  ammeter:     { label: "Amperímetro",   color: "#c084fc", ports: { left: { x:0,y:40 }, right: { x:140,y:40 } }, defaults: {} },
};