import { COMP_W, COMP_H, PORT_R, GRID } from "@/lib/circuit/constants";

export function OutletSVG({ active }: { active?: boolean }) {
  const accent = active ? "#60a5fa" : "#94a3b8";
  const bodyFill = active ? "rgba(15,23,42,0.92)" : "rgba(20,26,40,0.95)";
  const plateFill = active ? "#1e3a5f" : "#1e293b";
  const plateStroke = active ? "#3b82f6" : "#475569";
  const slotFill = active ? "#0ea5e9" : "#64748b";
  const highlightOpacity = active ? 0.18 : 0.10;

  return (
    <svg
      width={COMP_W}
      height={COMP_H}
      viewBox="0 0 72 56"
      xmlns="http://www.w3.org/2000/svg"
    >
      <defs>
        {/* Plate gradient - gives depth like the photo */}
        <linearGradient id="plateGrad" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor={active ? "#1e3a5f" : "#334155"} />
          <stop offset="100%" stopColor={active ? "#0f1e35" : "#0f172a"} />
        </linearGradient>
        {/* Outer faceplate shadow/bevel */}
        <filter id="bevel" x="-5%" y="-5%" width="110%" height="110%">
          <feDropShadow dx="0.5" dy="1" stdDeviation="0.8"
            floodColor={active ? "#0284c7" : "#000"} floodOpacity="0.5" />
        </filter>
        {/* Inner socket inset shadow */}
        <filter id="inset" x="-10%" y="-10%" width="120%" height="120%">
          <feDropShadow dx="0" dy="1" stdDeviation="1"
            floodColor="#000" floodOpacity="0.6" />
        </filter>
        {/* Slot glow when active */}
        <filter id="slotGlow">
          <feGaussianBlur stdDeviation="0.6" result="blur" />
          <feMerge>
            <feMergeNode in="blur" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
      </defs>

      {/* ── Wire leads ── */}
      <line x1="0" y1="28" x2="17" y2="28" stroke={accent} strokeWidth="2.5" strokeLinecap="round" />
      <line x1="55" y1="28" x2="72" y2="28" stroke={accent} strokeWidth="2.5" strokeLinecap="round" />

      {/* ── Outer faceplate (rounded square) ── */}
      <rect x="13" y="4" width="46" height="48" rx="5" ry="5"
        fill="url(#plateGrad)"
        stroke={plateStroke}
        strokeWidth="1.2"
        filter="url(#bevel)"
      />

      {/* Highlight edge top-left (mimics photo's white shine) */}
      <rect x="13.5" y="4.5" width="45" height="47" rx="4.5"
        fill="none"
        stroke="white"
        strokeWidth="0.5"
        opacity={highlightOpacity}
      />

      {/* ── Inner recessed socket panel ── */}
      {/* Top socket (3-prong face) */}
      <rect x="20" y="8" width="32" height="22" rx="10"
        fill={bodyFill}
        stroke={plateStroke}
        strokeWidth="0.8"
        filter="url(#inset)"
      />

      {/* Bottom socket (2-prong face) */}
      <rect x="20" y="33" width="32" height="16" rx="8"
        fill={bodyFill}
        stroke={plateStroke}
        strokeWidth="0.8"
        filter="url(#inset)"
      />

      {/* ── Top socket slots ── */}
      {/* Left slot (hot) */}
      <rect x="27" y="12" width="4" height="8" rx="2"
        fill={slotFill}
        opacity={active ? 1 : 0.75}
        filter={active ? "url(#slotGlow)" : undefined}
      />
      {/* Right slot (neutral - slightly taller in real outlets) */}
      <rect x="41" y="11.5" width="4" height="9" rx="2"
        fill={slotFill}
        opacity={active ? 1 : 0.75}
        filter={active ? "url(#slotGlow)" : undefined}
      />
      {/* Ground (D-shaped hole center bottom) */}
      <path
        d="M34 24 A3 3 0 0 1 38 24 L38 27 A3 3 0 0 1 34 27 Z"
        fill={slotFill}
        opacity={active ? 1 : 0.7}
        filter={active ? "url(#slotGlow)" : undefined}
      />

      {/* ── Bottom socket slots ── */}
      <rect x="27" y="36.5" width="4" height="8" rx="2"
        fill={slotFill}
        opacity={active ? 1 : 0.75}
        filter={active ? "url(#slotGlow)" : undefined}
      />
      <rect x="41" y="36" width="4" height="9" rx="2"
        fill={slotFill}
        opacity={active ? 1 : 0.75}
        filter={active ? "url(#slotGlow)" : undefined}
      />

      {/* Screw between sockets (detail from photo) */}
      <circle cx="36" cy="30" r="1.5"
        fill={plateFill}
        stroke={plateStroke}
        strokeWidth="0.6"
      />
      <line x1="36" y1="28.8" x2="36" y2="31.2" stroke={plateStroke} strokeWidth="0.5" />

      {/* Active glow ring around whole plate */}
      {active && (
        <rect x="13" y="4" width="46" height="48" rx="5"
          fill="none"
          stroke="#3b82f6"
          strokeWidth="1.5"
          opacity="0.35"
        />
      )}
    </svg>
  );
}