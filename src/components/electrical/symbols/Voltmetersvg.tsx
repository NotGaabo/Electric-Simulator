interface VoltmeterSVGProps {
  active?: boolean;
  selected?: boolean;
}

export function VoltmeterSVG({ active = false, selected = false }: VoltmeterSVGProps) {
  const W = 140, H = 80, MID = 40;
  const sel = selected ? "drop-shadow(0 0 6px #3b82f6)" : "";
  const glow = active ? `drop-shadow(0 0 4px #7dd3fc66) ${sel}` : sel;

  return (
    <svg width={W} height={H} viewBox={`0 0 ${W} ${H}`} style={{ filter: glow || undefined }}>
      <line x1={0} y1={MID} x2={44} y2={MID} stroke="#7dd3fc" strokeWidth={2} />
      <circle cx={70} cy={MID} r={24} fill="#0a1a28" stroke="#7dd3fc" strokeWidth={2} />
      <text x={70} y={MID + 6} textAnchor="middle" fill="#7dd3fc" fontSize={16} fontFamily="serif">V</text>
      <line x1={94} y1={MID} x2={W} y2={MID} stroke="#7dd3fc" strokeWidth={2} />
      <text x={52} y={MID - 10} fill="#7dd3fc" fontSize={10} fontFamily="monospace">+</text>
      <text x={82} y={MID - 10} fill="#7dd3fc" fontSize={10} fontFamily="monospace">−</text>
      <text x={70} y={H - 3} textAnchor="middle" fill="#334155" fontSize={8} fontFamily="monospace">
        PARALELO
      </text>
    </svg>
  );
}