import { COMP_W, COMP_H, PORT_R, GRID } from "@/lib/circuit/constants";

export function OutletSVG({ active }: { active?: boolean }) {
  const c = active ? "#60a5fa" : "#94a3b8";
  return (
    <svg width={COMP_W} height={COMP_H} viewBox="0 0 72 56">
      <line x1="0" y1="28" x2="18" y2="28" stroke={c} strokeWidth="2.5"/>
      <line x1="54" y1="28" x2="72" y2="28" stroke={c} strokeWidth="2.5"/>
      <circle cx="36" cy="28" r="16" stroke={c} strokeWidth="2"
        fill="rgba(15,23,42,0.9)"/>
      <rect x="28" y="20" width="5" height="9" rx="2.5" fill={c}/>
      <rect x="39" y="20" width="5" height="9" rx="2.5" fill={c}/>
      <path d="M36 32 L36 38" stroke={c} strokeWidth="2" strokeLinecap="round"/>
      <path d="M32 38 L40 38" stroke={c} strokeWidth="2" strokeLinecap="round"/>
    </svg>
  );
}