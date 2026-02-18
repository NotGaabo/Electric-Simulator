
import { CompType, Component } from "@/types/types";

export const PALETTE: { type: CompType; label: string; cat: string; defaults: Partial<Component> }[] = [
  { type: "battery",   label: "Fuente DC",    cat: "Fuentes",   defaults: { voltage: 9, isOn: true }},
  { type: "luminaire", label: "Luminaria",    cat: "Cargas",    defaults: { voltage: 120, power: 60 }},
  { type: "outlet",    label: "Tomacorriente",cat: "Cargas",    defaults: { voltage: 120 }},
  { type: "resistor",  label: "Resistencia",  cat: "Cargas",    defaults: { resistance: 100 }},
  { type: "capacitor", label: "Capacitor",    cat: "Cargas",    defaults: {}},
  { type: "switch",    label: "Interruptor",  cat: "Control",   defaults: { isOn: true }},
  { type: "breaker",   label: "Breaker",      cat: "Protección",defaults: { isOn: true }},
];