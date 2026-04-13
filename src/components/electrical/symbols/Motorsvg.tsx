interface MotorSVGProps {
  active?: boolean;
  ratedVoltage?: number;
  ratedPower?: number;
  selected?: boolean;
}

export function MotorSVG({ active = false, ratedVoltage = 110, ratedPower = 500, selected = false }: MotorSVGProps) {
  const W = 140, H = 80, MID = 40;
  const c = active ? "#34d399" : "#334155";
  const sel = selected ? "drop-shadow(0 0 6px #3b82f6)" : "";
  const glow = active ? `drop-shadow(0 0 7px #34d39966) ${sel}` : sel;

  return (
    <svg width={W} height={H} viewBox={`0 0 ${W} ${H}`} style={{ filter: glow || undefined }}>
      <line x1={0} y1={MID} x2={30} y2={MID} stroke={c} strokeWidth={2} />
      <circle cx={70} cy={MID} r={26} fill="#0a1a28" stroke={c} strokeWidth={2.5} />
      <text
        x={70} y={MID + 6}
        textAnchor="middle"
        fill={active ? "#34d399" : "#475569"}
        fontSize={18}
        fontWeight="bold"
        fontFamily="monospace"
      >
        M
      </text>
      {active && (
        <path
          d="M60,50 Q63,46 66,50 Q69,54 72,50 Q75,46 78,50"
          fill="none" stroke="#34d399" strokeWidth={1.5} opacity={0.5}
        />
      )}
      {active ? (
        <line x1={96} y1={MID} x2={W} y2={MID} stroke="#34d399" strokeWidth={3} strokeDasharray="6 3" />
      ) : (
        <line x1={96} y1={MID} x2={W} y2={MID} stroke="#1e293b" strokeWidth={2} />
      )}
      {active && (
        <circle cx={70} cy={MID} r={30} fill="none" stroke="rgba(52,211,153,0.15)" strokeWidth={4}>
          <animateTransform
            attributeName="transform" type="rotate"
            from="0 70 40" to="360 70 40"
            dur="1s" repeatCount="indefinite"
          />
        </circle>
      )}
      <text x={70} y={H - 3} textAnchor="middle" fill="#1e3a52" fontSize={8} fontFamily="monospace">
        {ratedVoltage}V · {ratedPower}W
      </text>
    </svg>
  );
}