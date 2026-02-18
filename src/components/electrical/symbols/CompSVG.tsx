import { BatterySVG } from "@/components/electrical/symbols/BatterySVG";
import { ResistorSVG } from "@/components/electrical/symbols/ResistorSVG";
import { LuminaireSVG } from "@/components/electrical/symbols/LuminaireSVG";
import { SwitchSVG } from "@/components/electrical/symbols/SwitchSVG";
import { BreakerSVG } from "@/components/electrical/symbols/BreakerSVG";
import { CapacitorSVG } from "@/components/electrical/symbols/CapacitorSVG";
import { OutletSVG } from "@/components/electrical/symbols/OutletSVG";
import { Component as CompType } from "@/types/types";

export function CompSVG({ comp, active }: { comp: CompType; active?: boolean }) {
  switch (comp.type) {
    case "battery":   return <BatterySVG active={active}/>;
    case "resistor":  return <ResistorSVG active={active}/>;
    case "luminaire": return <LuminaireSVG active={active}/>;
    case "switch":    return <SwitchSVG isOn={comp.isOn} active={active}/>;
    case "breaker":   return <BreakerSVG isOn={comp.isOn} active={active}/>;
    case "capacitor": return <CapacitorSVG active={active}/>;
    case "outlet":    return <OutletSVG active={active}/>;
    default:          return null;
  }
}
