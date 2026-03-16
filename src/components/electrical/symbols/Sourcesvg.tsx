interface SourceSVGProps {
  active?: boolean;
  voltage?: number;
  frequency?: number;
  selected?: boolean;
}

export function SourceSVG({ active = false, voltage = 220, frequency = 60, selected = false }: SourceSVGProps) {
  const W = 140, H = 80, MID = 40;
  const c = active ? "#f59e0b" : "#475569";
  const sel = selected ? "drop-shadow(0 0 6px #3b82f6)" : "";
  const glow = active ? `drop-shadow(0 0 5px #f59e0b88) ${sel}` : sel;

  return (
    <svg width={W} height={H} viewBox={`0 0 ${W} ${H}`} style={{ filter: glow || undefined }}>
      <line x1={0} y1={MID} x2={42} y2={MID} stroke={c} strokeWidth={2} />
      <circle cx={70} cy={MID} r={26} fill="#0a1a28" stroke={c} strokeWidth={2} />
      <path
        d="M58,40 Q61,33 64,40 Q67,47 70,40 Q73,33 76,40 Q79,47 82,40"
        fill="none"
        stroke={active ? "#fbbf24" : "#64748b"}
        strokeWidth={2}
        strokeLinecap="round"
      />
      <line x1={96} y1={MID} x2={W} y2={MID} stroke={c} strokeWidth={2} />
      <text x={6} y={MID - 8} fill="#475569" fontSize={9} fontFamily="monospace">L</text>
      <text x={W - 14} y={MID - 8} fill="#475569" fontSize={9} fontFamily="monospace">N</text>
      <text x={70} y={H - 3} textAnchor="middle" fill="#334155" fontSize={8} fontFamily="monospace">
        {voltage}V / {frequency}Hz
      </text>
    </svg>
  );
}