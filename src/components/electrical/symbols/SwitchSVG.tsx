import { COMP_W, COMP_H, PORT_R, GRID } from "@/lib/circuit/constants";

export function SwitchSVG({ isOn, active }: { isOn?: boolean; active?: boolean }) {
  const c = active ? "#4ade80" : "#94a3b8";
  const armY = isOn !== false ? 28 : 16;
  return (
    <svg width={COMP_W} height={COMP_H} viewBox="0 0 72 56">
      <circle cx="12" cy="28" r="4" fill={c}/>
      <circle cx="60" cy="28" r="4" fill={c}/>
      <line x1="0" y1="28" x2="12" y2="28" stroke={c} strokeWidth="2.5"/>
      <line x1="60" y1="28" x2="72" y2="28" stroke={c} strokeWidth="2.5"/>
      <line x1="12" y1="28" x2="58" y2={armY}
        stroke={isOn !== false ? c : "#f87171"} strokeWidth="2.5" strokeLinecap="round"/>
      <text x="28" y={isOn !== false ? "48" : "50"} fontSize="8"
        fill={isOn !== false ? "#4ade80" : "#f87171"} fontFamily="monospace">
        {isOn !== false ? "ON" : "OFF"}
      </text>
    </svg>
  );
}