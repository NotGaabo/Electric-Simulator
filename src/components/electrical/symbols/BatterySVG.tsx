import { COMP_W, COMP_H, PORT_R, GRID } from "@/lib/circuit/constants";

export function BatterySVG({ active }: { active?: boolean }) {
  const c = active ? "#4ade80" : "#94a3b8";
  return (
    <svg width={COMP_W} height={COMP_H} viewBox="0 0 72 56">
      <line x1="0" y1="28" x2="20" y2="28" stroke={c} strokeWidth="2.5"/>
      <line x1="52" y1="28" x2="72" y2="28" stroke={c} strokeWidth="2.5"/>
      <line x1="20" y1="14" x2="20" y2="42" stroke={active ? "#4ade80" : "#60a5fa"} strokeWidth="4"/>
      <line x1="32" y1="20" x2="32" y2="36" stroke={active ? "#fbbf24" : "#94a3b8"} strokeWidth="3"/>
      <line x1="44" y1="14" x2="44" y2="42" stroke={active ? "#4ade80" : "#60a5fa"} strokeWidth="4"/>
      <text x="7" y="24" fontSize="9" fill={active ? "#4ade80" : "#64748b"} fontFamily="monospace">+</text>
      <text x="58" y="24" fontSize="9" fill={active ? "#f87171" : "#64748b"} fontFamily="monospace">−</text>
    </svg>
  );
}

