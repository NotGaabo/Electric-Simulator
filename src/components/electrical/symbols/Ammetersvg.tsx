interface AmmeterSVGProps {
  active?: boolean;
  selected?: boolean;
}

export function AmmeterSVG({ active = false, selected = false }: AmmeterSVGProps) {
  const W = 140, H = 80, MID = 40;
  const sel = selected ? "drop-shadow(0 0 6px #3b82f6)" : "";
  const glow = active ? `drop-shadow(0 0 4px #c084fc66) ${sel}` : sel;

  return (
    <svg width={W} height={H} viewBox={`0 0 ${W} ${H}`} style={{ filter: glow || undefined }}>
      <line x1={0} y1={MID} x2={44} y2={MID} stroke="#c084fc" strokeWidth={2} />
      <circle cx={70} cy={MID} r={24} fill="#0a1a28" stroke="#c084fc" strokeWidth={2} />
      <text x={70} y={MID + 6} textAnchor="middle" fill="#c084fc" fontSize={16} fontFamily="serif">A</text>
      <line x1={94} y1={MID} x2={W} y2={MID} stroke="#c084fc" strokeWidth={2} />
      <polygon points="10,37 18,40 10,43" fill="#c084fc" opacity={0.5} />
      <polygon points="122,37 130,40 122,43" fill="#c084fc" opacity={0.5} />
      <text x={70} y={H - 3} textAnchor="middle" fill="#334155" fontSize={8} fontFamily="monospace">
        SERIE
      </text>
    </svg>
  );
}