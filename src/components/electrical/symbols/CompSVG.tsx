import { BatterySVG }     from "@/components/electrical/symbols/BatterySVG";
import { ResistorSVG }    from "@/components/electrical/symbols/ResistorSVG";
import { LuminaireSVG }   from "@/components/electrical/symbols/LuminaireSVG";
import { SwitchSVG }      from "@/components/electrical/symbols/SwitchSVG";
import { BreakerSVG }     from "@/components/electrical/symbols/BreakerSVG";
import { CapacitorSVG }   from "@/components/electrical/symbols/CapacitorSVG";
import { OutletSVG }      from "@/components/electrical/symbols/OutletSVG";
import { SourceSVG }      from "@/components/electrical/symbols/Sourcesvg";
import { TransformerSVG } from "@/components/electrical/symbols/Transformersvg";
import { MotorSVG }       from "@/components/electrical/symbols/Motorsvg";
import { VoltmeterSVG }   from "@/components/electrical/symbols/Voltmetersvg";
import { AmmeterSVG }     from "@/components/electrical/symbols/Ammetersvg";

export type SVGCompType =
  | "source"
  | "transformer"
  | "led"
  | "motor"
  | "breaker"
  | "voltmeter"
  | "ammeter"
  | "battery"
  | "resistor"
  | "luminaire"
  | "switch"
  | "capacitor"
  | "outlet"
  | "stator"
  | "rotor";

export interface SVGComp {
  id:            string;
  type:          SVGCompType;
  label?:        string;
  voltage?:      number;
  frequency?:    number;
  resistance?:   number;
  power?:        number;
  isOn?:         boolean;
  ratedVoltage?: number;
  ratedPower?:   number;
  ratedCurrent?: number;
  turns1?:       number;
  turns2?:       number;
  efficiency?:   number;
  powerFactor?:  number;
}

interface CompSVGProps {
  comp:      SVGComp;
  active?:   boolean;
  selected?: boolean;
}

export function CompSVG({ comp, active = false, selected = false }: CompSVGProps) {
  const stroke = active ? "#f59e0b" : "#94a3b8";

  // ── El glow de selección se aplica aquí como wrapper ──────────────────────
  // Así ningún SVG hijo necesita recibir la prop `selected`.
  const selectionStyle: React.CSSProperties = selected
    ? { filter: "drop-shadow(0 0 6px #3b82f6)" }
    : {};

  const symbol = (() => {
    switch (comp.type) {

      // ── Simulador de transformadores ───────────────────────────────────────
      case "source":
        return (
          <SourceSVG
            active={active}
            voltage={comp.voltage ?? 220}
            frequency={comp.frequency ?? 60}
          />
        );

      case "transformer":
        return (
          <TransformerSVG
            active={active}
            turns1={comp.turns1 ?? 220}
            turns2={comp.turns2 ?? 110}
          />
        );

      case "motor":
        return (
          <MotorSVG
            active={active}
            ratedVoltage={comp.ratedVoltage ?? 110}
            ratedPower={comp.ratedPower ?? 500}
          />
        );

      case "breaker":
        return (
          <BreakerSVG
            active={active}
            isOn={comp.isOn ?? true}
          />
        );

      case "voltmeter":
        return <VoltmeterSVG active={active} />;

      case "ammeter":
        return <AmmeterSVG active={active} />;

      // ── Simulador general ──────────────────────────────────────────────────
      case "battery":
        return <BatterySVG active={active} />;

      case "resistor":
        return <ResistorSVG active={active} />;

      case "luminaire":
        return <LuminaireSVG active={active} />;

      case "switch":
        return <SwitchSVG isOn={comp.isOn ?? true} active={active} />;

      case "capacitor":
        return <CapacitorSVG active={active} />;

      case "outlet":
        return <OutletSVG active={active} />;

      // ── Internos de máquina ────────────────────────────────────────────────
      case "stator":
        return (
          <svg width="140" height="80" viewBox="0 0 140 80" fill="none">
            <circle cx="70" cy="40" r="26" stroke={stroke} strokeWidth={2} />
            <circle cx="70" cy="40" r="14" stroke={stroke} strokeWidth={1.5} strokeDasharray="3 3" />
            <line x1={0}  y1={40} x2={44}  y2={40} stroke={stroke} strokeWidth={2} />
            <line x1={96} y1={40} x2={140} y2={40} stroke={stroke} strokeWidth={2} />
          </svg>
        );

      case "rotor":
        return (
          <svg width="140" height="80" viewBox="0 0 140 80" fill="none">
            <rect x="44" y="24" width="52" height="32" rx="3" stroke={stroke} strokeWidth={2} />
            <line x1={70} y1={16} x2={70} y2={64} stroke={stroke} strokeWidth={1.5} />
            <line x1={0}  y1={40} x2={44} y2={40} stroke={stroke} strokeWidth={2} />
            <line x1={96} y1={40} x2={140} y2={40} stroke={stroke} strokeWidth={2} />
          </svg>
        );

      default:
        return null;
    }
  })();

  // Envuelve el símbolo con el glow de selección si aplica
  return (
    <div style={selectionStyle}>
      {symbol}
    </div>
  );
}