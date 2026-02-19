import { COMP_W, COMP_H } from "@/lib/circuit/constants";

export function ResistorSVG({ active }: { active?: boolean }) {
  const wire       = active ? "#60a5fa" : "#94a3b8";
  const bodyFill   = active ? "#0f1e35" : "#0f172a";
  const bodyStroke = active ? "#3b82f6" : "#475569";

  // Blues — 4 bands from dark to light blue
  const bands = active
    ? ["#1d4ed8", "#2563eb", "#3b82f6", "#93c5fd"]
    : ["#1e3a5f", "#1e40af", "#2563eb", "#60a5fa"];

  // Square-ish body with rounded corners
  const BX = 14, BW = 44, BY = 14, BH = 28, BRX = 6;

  return (
    <svg width={COMP_W} height={COMP_H} viewBox="0 0 72 56" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id="r-body" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%"   stopColor={active ? "#1e3a5f" : "#1e293b"} />
          <stop offset="100%" stopColor={bodyFill} />
        </linearGradient>

        <linearGradient id="r-band-shade" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%"   stopColor="white" stopOpacity="0.2" />
          <stop offset="35%"  stopColor="white" stopOpacity="0"   />
          <stop offset="100%" stopColor="black" stopOpacity="0.4" />
        </linearGradient>

        <clipPath id="r-clip">
          <rect x={BX} y={BY} width={BW} height={BH} rx={BRX} />
        </clipPath>

        <filter id="r-shadow" x="-5%" y="-15%" width="110%" height="140%">
          <feDropShadow dx="0" dy="2" stdDeviation="2" floodColor="#000" floodOpacity="0.4"/>
        </filter>
      </defs>

      {/* Wire leads */}
      <line x1="0"     y1="28" x2={BX}    y2="28" stroke={wire} strokeWidth="2.5" strokeLinecap="round"/>
      <line x1={BX+BW} y1="28" x2="72"    y2="28" stroke={wire} strokeWidth="2.5" strokeLinecap="round"/>

      {/* Body */}
      <rect x={BX} y={BY} width={BW} height={BH} rx={BRX}
        fill="url(#r-body)" stroke={bodyStroke} strokeWidth="1.2" filter="url(#r-shadow)"/>

      {/* Inner bevel */}
      <rect x={BX+0.5} y={BY+0.5} width={BW-1} height={BH-1} rx={BRX-0.5}
        fill="none" stroke="white" strokeWidth="0.5" opacity="0.1"/>

      {/* Band 1 — darkest blue */}
      <rect x="22" y={BY} width="6" height={BH} fill={bands[0]} clipPath="url(#r-clip)"/>
      <rect x="22" y={BY} width="6" height={BH} fill="url(#r-band-shade)" clipPath="url(#r-clip)"/>

      {/* Band 2 */}
      <rect x="30" y={BY} width="6" height={BH} fill={bands[1]} clipPath="url(#r-clip)"/>
      <rect x="30" y={BY} width="6" height={BH} fill="url(#r-band-shade)" clipPath="url(#r-clip)"/>

      {/* Band 3 */}
      <rect x="38" y={BY} width="6" height={BH} fill={bands[2]} clipPath="url(#r-clip)"/>
      <rect x="38" y={BY} width="6" height={BH} fill="url(#r-band-shade)" clipPath="url(#r-clip)"/>

      {/* Band 4 — lightest blue */}
      <rect x="46" y={BY} width="6" height={BH} fill={bands[3]} clipPath="url(#r-clip)"/>
      <rect x="46" y={BY} width="6" height={BH} fill="url(#r-band-shade)" clipPath="url(#r-clip)"/>

      {/* Top shine */}
      <rect x={BX+4} y={BY+1.5} width={BW-8} height={4} rx="2"
        fill="white" opacity={active ? 0.12 : 0.06} clipPath="url(#r-clip)"/>

      {/* Active glow */}
      {active && (
        <rect x={BX} y={BY} width={BW} height={BH} rx={BRX}
          fill="none" stroke="#3b82f6" strokeWidth="1.5" opacity="0.4"/>
      )}
    </svg>
  );
}