import { COMP_W, COMP_H } from "@/lib/circuit/constants";

export function LuminaireSVG({ active, voltage = 0, ratedVoltage = 120 }: { active?: boolean; voltage?: number; ratedVoltage?: number }) {
  const isOvervoltage = voltage > ratedVoltage * 1.2;
  const wire = isOvervoltage ? "#ef4444" : active ? "#fde68a" : "#94a3b8";
  const bulbFill = isOvervoltage ? "#450a0a" : active ? "#fffde7" : "#cbd5e1";
  const bulbGlow = isOvervoltage ? "#ef4444" : active ? "#fef08a" : "#94a3b8";
  const baseColor = isOvervoltage ? "#7c2d12" : active ? "#9ca3af" : "#64748b";
  const baseDark  = isOvervoltage ? "#b45309" : active ? "#6b7280" : "#475569";

  return (
    <svg width={COMP_W} height={COMP_H} viewBox="0 0 72 56" xmlns="http://www.w3.org/2000/svg">
      <defs>
        {/* Bulb gradient — bright top-left highlight like the photo */}
        <radialGradient id="bulb-grad" cx="38%" cy="30%" r="60%">
          <stop offset="0%"   stopColor={isOvervoltage ? "#dc2626" : active ? "#ffffff" : "#e2e8f0"} />
          <stop offset="60%"  stopColor={isOvervoltage ? "#7c2d12" : active ? "#fef9c3" : "#cbd5e1"} />
          <stop offset="100%" stopColor={isOvervoltage ? "#ef4444" : active ? "#fde047" : "#94a3b8"} stopOpacity="0.6" />
        </radialGradient>

        {/* Base/socket gradient */}
        <linearGradient id="base-grad" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%"   stopColor={baseColor} />
          <stop offset="100%" stopColor={baseDark}  />
        </linearGradient>

        {/* Glow filter when active */}
        {(active || isOvervoltage) && (
          <filter id="glow" x="-40%" y="-40%" width="180%" height="180%">
            <feGaussianBlur stdDeviation="3" result="blur" />
            <feMerge>
              <feMergeNode in="blur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        )}
      </defs>

      {/* Glow halo behind bulb when active or overvoltage */}
      {(active || isOvervoltage) && (
        <ellipse cx="36" cy="24" rx="13" ry="13"
          fill={isOvervoltage ? "#ef4444" : "#fef08a"} opacity={isOvervoltage ? 0.4 : 0.25} filter="url(#glow)" />
      )}

      {/* Wire leads */}
      <line x1="0"  y1="28" x2="19" y2="28" stroke={wire} strokeWidth="2.5" strokeLinecap="round"/>
      <line x1="53" y1="28" x2="72" y2="28" stroke={wire} strokeWidth="2.5" strokeLinecap="round"/>

      {/* ── Bulb glass globe ── */}
      {/* A-shape: circle top + tapered neck bottom */}
      <path
        d="M 36 8 a 14 14 0 1 1 -0.01 0 Z"
        fill="url(#bulb-grad)"
        stroke={isOvervoltage ? "#dc2626" : "#94a3b8"}
        strokeWidth="0.8"
        opacity="0.95"
      />
      {/* Actual A19 bulb shape — circle + tapered shoulders */}
      <ellipse cx="36" cy="21" rx="13" ry="13"
        fill="url(#bulb-grad)"
        stroke="none"
      />
      {/* Neck/shoulder taper */}
      <path d="M 28 30 Q 27 36 29 38 L 43 38 Q 45 36 44 30 Q 40 33 36 33 Q 32 33 28 30 Z"
        fill="url(#bulb-grad)"
        stroke="none"
      />

      {/* Top shine (specular highlight) */}
      <ellipse cx="32" cy="14" rx="4" ry="3"
        fill={isOvervoltage ? "#fca5a5" : "white"} opacity={isOvervoltage ? 0.4 : active ? 0.55 : 0.3}
        transform="rotate(-20 32 14)"
      />

      {/* ── Metal base / socket ── */}
      {/* Main socket body */}
      <rect x="29" y="37" width="14" height="4" rx="1" fill="url(#base-grad)"/>
      {/* Ring grooves */}
      <rect x="29" y="41" width="14" height="2.5" rx="0.5" fill={baseDark} opacity="0.7"/>
      <rect x="29.5" y="43.5" width="13" height="2" rx="0.5" fill={baseColor} opacity="0.6"/>
      <rect x="30" y="45.5" width="12" height="2" rx="1" fill={baseDark} opacity="0.5"/>
      {/* Bottom contact */}
      <ellipse cx="36" cy="47.5" rx="4" ry="1.5" fill={baseDark} opacity="0.6"/>

      {/* Ring sheen */}
      <rect x="29" y="37" width="7" height="1" rx="0.5" fill="white" opacity="0.15"/>

      {/* ── Filament / inner glow when active ── */}
      {(active || isOvervoltage) && (
        <>
          {/* Inner warm glow core */}
          <ellipse cx="36" cy="22" rx="6" ry="6"
            fill={isOvervoltage ? "#dc2626" : "#fef08a"} opacity={isOvervoltage ? 0.6 : 0.45} />
          <ellipse cx="36" cy="22" rx="3" ry="3"
            fill={isOvervoltage ? "#ef4444" : "#fde047"} opacity={isOvervoltage ? 0.85 : 0.7} />
          {/* Filament lines */}
          <path d="M 33 22 Q 34.5 19 36 22 Q 37.5 25 39 22"
            stroke={isOvervoltage ? "#ef4444" : "#fbbf24"} strokeWidth="1" fill="none" strokeLinecap="round"/>
        </>
      )}
    </svg>
  );
}