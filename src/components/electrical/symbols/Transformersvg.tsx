interface TransformerSVGProps {
  active?: boolean;
  turns1?: number;
  turns2?: number;
  selected?: boolean;
}

export function TransformerSVG({ active = false, turns1 = 220, turns2 = 110, selected = false }: TransformerSVGProps) {
  const W = 140, H = 80, MID = 40;
  const sel = selected ? "drop-shadow(0 0 6px #3b82f6)" : "";
  const cp = active ? "#818cf8" : "#475569";
  const cs = active ? "#c084fc" : "#334155";
  const ck = active ? "#6366f1" : "#1e293b";
  const glow = active ? `drop-shadow(0 0 6px #818cf888) ${sel}` : sel;

  const ratio = turns2 > 0 ? (turns1 / turns2).toFixed(2) : "∞";
  const archP = [24, 34, 44, 54].map(cx => `M${cx},${MID} Q${cx + 5},${MID - 12} ${cx + 10},${MID}`);
  const archS = [76, 87, 98].map(cx => `M${cx},${MID} Q${cx + 5},${MID - 12} ${cx + 11},${MID}`);

  return (
    <svg width={W} height={H} viewBox={`0 0 ${W} ${H}`} style={{ filter: glow || undefined }}>
      <line x1={0} y1={MID} x2={24} y2={MID} stroke={cp} strokeWidth={2} />
      {archP.map((d, i) => <path key={i} d={d} fill="none" stroke={cp} strokeWidth={2.2} />)}
      <line x1={65} y1={MID - 18} x2={65} y2={MID + 12} stroke={ck} strokeWidth={3} />
      <line x1={69} y1={MID - 18} x2={69} y2={MID + 12} stroke={ck} strokeWidth={3} />
      <line x1={73} y1={MID - 18} x2={73} y2={MID + 12} stroke={ck} strokeWidth={3} />
      {archS.map((d, i) => <path key={i} d={d} fill="none" stroke={cs} strokeWidth={2.2} />)}
      <line x1={109} y1={MID} x2={W} y2={MID} stroke={cs} strokeWidth={2} />
      <circle cx={26} cy={MID - 15} r={3} fill={cp} />
      <circle cx={78} cy={MID - 15} r={3} fill={cs} />
      <text x={70} y={14} textAnchor="middle" fill={active ? "#a5b4fc" : "#334155"} fontSize={9} fontFamily="monospace">
        a={ratio}
      </text>
      <text x={16} y={H - 3} fill="#334155" fontSize={8} fontFamily="monospace">P</text>
      <text x={W - 16} y={H - 3} fill="#334155" fontSize={8} fontFamily="monospace">S</text>
      <text x={70} y={H - 3} textAnchor="middle" fill="#1e3a52" fontSize={8} fontFamily="monospace">
        {turns1}/{turns2} vueltas
      </text>
    </svg>
  );
}