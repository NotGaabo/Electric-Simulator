import { COMP_W, COMP_H, PORT_R, GRID } from "@/lib/circuit/constants";

export function ResistorSVG({ active }: { active?: boolean }) {
  const c = active ? "#fbbf24" : "#94a3b8";
  return (
    <svg width={COMP_W} height={COMP_H} viewBox="0 0 72 56">
      <line x1="0" y1="28" x2="14" y2="28" stroke={c} strokeWidth="2.5"/>
      <line x1="58" y1="28" x2="72" y2="28" stroke={c} strokeWidth="2.5"/>
      <rect x="14" y="18" width="44" height="20" rx="3" stroke={c} strokeWidth="2" fill={active ? "rgba(251,191,36,0.12)" : "rgba(30,41,59,0.9)"}/>
      <polyline points="17,28 21,19 25,37 29,19 33,37 37,19 41,37 45,19 49,37 53,28 55,28"
        stroke={c} strokeWidth="1.5" fill="none"/>
    </svg>
  );
}