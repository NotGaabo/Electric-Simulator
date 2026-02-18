import { COMP_W, COMP_H, PORT_R, GRID } from "@/lib/circuit/constants";

export function LuminaireSVG({ active }: { active?: boolean }) {
  const c = active ? "#fde68a" : "#94a3b8";
  const fill = active ? "rgba(253,230,138,0.2)" : "rgba(30,41,59,0.9)";
  return (
    <svg width={COMP_W} height={COMP_H} viewBox="0 0 72 56">
      <line x1="0" y1="28" x2="18" y2="28" stroke={c} strokeWidth="2.5"/>
      <line x1="54" y1="28" x2="72" y2="28" stroke={c} strokeWidth="2.5"/>
      <circle cx="36" cy="28" r="16" stroke={c} strokeWidth="2" fill={fill}/>
      <line x1="20" y1="28" x2="52" y2="28" stroke={c} strokeWidth="2"/>
      <line x1="36" y1="12" x2="36" y2="44" stroke={c} strokeWidth="2"/>
      {active && <>
        <circle cx="36" cy="28" r="7" fill="rgba(253,230,138,0.6)"/>
        <circle cx="36" cy="28" r="3" fill="#fde68a"/>
      </>}
    </svg>
  );
}
