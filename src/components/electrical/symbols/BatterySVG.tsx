import { COMP_W, COMP_H } from "@/lib/circuit/constants";

export function BatterySVG({ active }: { active?: boolean }) {
  const wire   = active ? "#4ade80" : "#94a3b8";
  const green  = active ? "#4ade80" : "#64748b";
  const greenD = active ? "#16a34a" : "#334155";
  const dark   = active ? "#1e293b" : "#0f172a";
  const band   = active ? "#fbbf24" : "#475569";
  const sym    = active ? "#bbf7d0" : "#cbd5e1";

  return (
    <svg width={COMP_W} height={COMP_H} viewBox="0 0 72 56" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id="bg" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%"   stopColor={green}  />
          <stop offset="100%" stopColor={greenD} />
        </linearGradient>
        <linearGradient id="bd" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%"   stopColor="#334155" />
          <stop offset="100%" stopColor={dark}    />
        </linearGradient>
        <clipPath id="cg"><rect x="16" y="16" width="22" height="24" /></clipPath>
        <clipPath id="cd"><rect x="40" y="16" width="16" height="24" /></clipPath>
      </defs>

      {/* Wires */}
      <line x1="0"  y1="28" x2="16" y2="28" stroke={wire} strokeWidth="2.5" strokeLinecap="round"/>
      <line x1="56" y1="28" x2="72" y2="28" stroke={wire} strokeWidth="2.5" strokeLinecap="round"/>

      {/* Body base */}
      <rect x="16" y="16" width="40" height="24" rx="6" fill="url(#bd)"/>

      {/* Green half */}
      <rect x="16" y="16" width="40" height="24" rx="6" fill="url(#bg)" clipPath="url(#cg)"/>

      {/* Divider band */}
      <rect x="37" y="16" width="3.5" height="24" fill={band}/>

      {/* Subtle top shine */}
      <rect x="18" y="17" width="19" height="4" rx="2" fill="white" opacity="0.12" clipPath="url(#cg)"/>
      <rect x="41" y="17" width="13" height="4" rx="2" fill="white" opacity="0.06" clipPath="url(#cd)"/>

      {/* + cross (green half) */}
      <rect x="20" y="26" width="9"   height="2.5" rx="1.25" fill={sym}/>
      <rect x="23.25" y="22.75" width="2.5" height="9"   rx="1.25" fill={sym}/>

      {/* − dash (dark half) */}
      <rect x="42" y="26" width="9" height="2.5" rx="1.25" fill={sym} opacity="0.8"/>

      {/* Positive nub */}
      <rect x="11" y="24" width="6" height="8" rx="3" fill="#94a3b8"/>
      <rect x="12" y="24.5" width="3" height="3" rx="1.5" fill="white" opacity="0.2"/>

      {/* Border */}
      <rect x="16" y="16" width="40" height="24" rx="6"
        fill="none" stroke="white" strokeWidth="0.5" opacity="0.1"/>
    </svg>
  );
}