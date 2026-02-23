import { BatterySVG } from "@/components/electrical/symbols/BatterySVG";
import { ResistorSVG } from "@/components/electrical/symbols/ResistorSVG";
import { LuminaireSVG } from "@/components/electrical/symbols/LuminaireSVG";
import { SwitchSVG } from "@/components/electrical/symbols/SwitchSVG";
import { BreakerSVG } from "@/components/electrical/symbols/BreakerSVG";
import { CapacitorSVG } from "@/components/electrical/symbols/CapacitorSVG";
import { OutletSVG } from "@/components/electrical/symbols/OutletSVG";
import { Component as CompType } from "@/types/types";

export function CompSVG({ comp, active }: { comp: CompType; active?: boolean }) {
  const stroke = active ? "#f59e0b" : "#94a3b8";

  switch (comp.type) {
    case "battery":   return <BatterySVG active={active}/>;
    case "resistor":  return <ResistorSVG active={active}/>;
    case "luminaire": return <LuminaireSVG active={active}/>;
    case "switch":    return <SwitchSVG isOn={comp.isOn} active={active}/>;
    case "breaker":   return <BreakerSVG isOn={comp.isOn} active={active}/>;
    case "capacitor": return <CapacitorSVG active={active}/>;
    case "outlet":    return <OutletSVG active={active}/>;
    case "motor":
      return (
        <svg width="72" height="56" viewBox="0 0 72 56" fill="none">
          <circle cx="36" cy="28" r="16" stroke={stroke} strokeWidth="2"/>
          <text x="36" y="32" textAnchor="middle" fontSize="10" fill={stroke}>M</text>
          <line x1="8" y1="28" x2="20" y2="28" stroke={stroke} strokeWidth="2"/>
          <line x1="52" y1="28" x2="64" y2="28" stroke={stroke} strokeWidth="2"/>
        </svg>
      );
    case "transformer":
      return (
        <svg width="72" height="56" viewBox="0 0 72 56" fill="none">
          <path d="M18 18c4 0 4 20 0 20M24 18c4 0 4 20 0 20M48 18c4 0 4 20 0 20M54 18c4 0 4 20 0 20" stroke={stroke} strokeWidth="2"/>
          <line x1="34" y1="16" x2="34" y2="40" stroke={stroke} strokeWidth="1.5" strokeDasharray="3 3"/>
        </svg>
      );
    case "stator":
      return (
        <svg width="72" height="56" viewBox="0 0 72 56" fill="none">
          <circle cx="36" cy="28" r="16" stroke={stroke} strokeWidth="2"/>
          <circle cx="36" cy="28" r="9" stroke={stroke} strokeWidth="1.5" strokeDasharray="2 2"/>
        </svg>
      );
    case "rotor":
      return (
        <svg width="72" height="56" viewBox="0 0 72 56" fill="none">
          <rect x="22" y="20" width="28" height="16" rx="2" stroke={stroke} strokeWidth="2"/>
          <line x1="36" y1="16" x2="36" y2="40" stroke={stroke} strokeWidth="1.5"/>
        </svg>
      );
    default:          return null;
  }
}
