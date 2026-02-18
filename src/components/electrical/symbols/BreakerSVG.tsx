import { COMP_W, COMP_H, PORT_R, GRID } from "@/lib/circuit/constants";

export function BreakerSVG({ isOn, active }: { isOn?: boolean; active?: boolean }) {
  const c = active ? "#4ade80" : "#94a3b8";
  return (
    <svg width={COMP_W} height={COMP_H} viewBox="0 0 72 56">
      <line x1="0" y1="28" x2="14" y2="28" stroke={c} strokeWidth="2.5"/>
      <line x1="58" y1="28" x2="72" y2="28" stroke={c} strokeWidth="2.5"/>
      <rect x="14" y="14" width="44" height="28" rx="4" stroke={c} strokeWidth="2"
        fill="rgba(15,23,42,0.9)"/>
      <rect x="28" y={isOn !== false ? "16" : "28"} width="16" height="12" rx="3"
        fill={isOn !== false ? "#4ade80" : "#ef4444"}/>
      <text x="24" y="52" fontSize="8" fill={isOn !== false ? "#4ade80" : "#ef4444"} fontFamily="monospace">
        {isOn !== false ? "ON" : "OFF"}
      </text>
    </svg>
  );
}

