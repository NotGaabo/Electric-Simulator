import { COMP_W, COMP_H, PORT_R, GRID } from "@/lib/circuit/constants";

export function CapacitorSVG({ active }: { active?: boolean }) {
  const c = active ? "#a78bfa" : "#94a3b8";
  return (
    <svg width={COMP_W} height={COMP_H} viewBox="0 0 72 56">
      <line x1="0" y1="28" x2="30" y2="28" stroke={c} strokeWidth="2.5"/>
      <line x1="42" y1="28" x2="72" y2="28" stroke={c} strokeWidth="2.5"/>
      <line x1="30" y1="14" x2="30" y2="42" stroke={c} strokeWidth="4"/>
      <line x1="42" y1="14" x2="42" y2="42" stroke={c} strokeWidth="4"/>
    </svg>
  );
}
