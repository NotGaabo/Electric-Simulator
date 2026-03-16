// @ts-nocheck
"use client";


import { useState, useRef, useCallback, useEffect, useMemo } from "react";

// ─── Constants ────────────────────────────────────────────────────────────────
const COMP_W = 64;
const COMP_H = 32;
const PORT_R = 6;
const GRID = 28;

// ─── Palette ──────────────────────────────────────────────────────────────────
const PALETTE = [
  { type: "battery",  label: "Batería",      cat: "Fuentes",    defaults: { voltage: 12, resistance: 0 } },
  { type: "outlet",   label: "Tomacorriente",cat: "Fuentes",    defaults: { voltage: 220, resistance: 0 } },
  { type: "resistor", label: "Resistor",     cat: "Cargas",     defaults: { resistance: 100 } },
  { type: "luminaire",label: "Luminaria",    cat: "Cargas",     defaults: { power: 60, voltage: 0 } },
  { type: "motor",    label: "Motor",        cat: "Cargas",     defaults: { resistance: 50 } },
  { type: "switch",   label: "Interruptor",  cat: "Control",    defaults: { closed: false } },
  { type: "breaker",  label: "Breaker",      cat: "Protección", defaults: { closed: true } },
  { type: "fuse",     label: "Fusible",      cat: "Protección", defaults: { resistance: 0.1 } },
];

let _uid = 0;
const uid = () => `c${++_uid}`;
const snap = (v) => Math.round(v / GRID) * GRID;

function getPorts() {
  return [
    { id: "left",  dx: -COMP_W / 2, dy: 0 },
    { id: "right", dx:  COMP_W / 2, dy: 0 },
  ];
}

function wirePath(x1, y1, x2, y2) {
  const mx = (x1 + x2) / 2;
  return `M ${x1} ${y1} C ${mx} ${y1}, ${mx} ${y2}, ${x2} ${y2}`;
}

// ─── Component SVG Symbols ────────────────────────────────────────────────────
function CompSVG({ comp, active = false }) {
  const w = COMP_W, h = COMP_H;
  const cx = w / 2, cy = h / 2;
  const col = active ? "#f59e0b" : "#94a3b8";
  const glow = active ? "#4ade80" : "none";

  const shared = (
    <>
      <line x1={0} y1={cy} x2={10} y2={cy} stroke={col} strokeWidth={2} />
      <line x1={w - 10} y1={cy} x2={w} y2={cy} stroke={col} strokeWidth={2} />
    </>
  );

  switch (comp.type) {
    case "battery":
      return (
        <svg width={w} height={h} viewBox={`0 0 ${w} ${h}`}>
          {shared}
          <rect x={10} y={cy - 10} width={44} height={20} rx={3}
            fill="none" stroke={active ? "#f59e0b" : "#334155"} strokeWidth={1.5} />
          <line x1={20} y1={cy - 6} x2={20} y2={cy + 6} stroke={col} strokeWidth={2.5} />
          <line x1={28} y1={cy - 9} x2={28} y2={cy + 9} stroke={col} strokeWidth={1.5} />
          <line x1={36} y1={cy - 6} x2={36} y2={cy + 6} stroke={col} strokeWidth={2.5} />
          <line x1={44} y1={cy - 9} x2={44} y2={cy + 9} stroke={col} strokeWidth={1.5} />
          <text x={cx} y={cy - 12} textAnchor="middle" fontSize={7} fill="#60a5fa">
            {comp.voltage ?? 12}V
          </text>
        </svg>
      );
    case "outlet":
      return (
        <svg width={w} height={h} viewBox={`0 0 ${w} ${h}`}>
          {shared}
          <circle cx={cx} cy={cy} r={11} fill="none" stroke={active ? "#f59e0b" : "#334155"} strokeWidth={1.5} />
          <line x1={cx - 3} y1={cy - 5} x2={cx - 3} y2={cy + 3} stroke={col} strokeWidth={2} />
          <line x1={cx + 3} y1={cy - 5} x2={cx + 3} y2={cy + 3} stroke={col} strokeWidth={2} />
          <circle cx={cx} cy={cy + 6} r={1.5} fill={col} />
        </svg>
      );
    case "resistor":
      return (
        <svg width={w} height={h} viewBox={`0 0 ${w} ${h}`}>
          {shared}
          <rect x={14} y={cy - 6} width={36} height={12} rx={2}
            fill="none" stroke={active ? "#f59e0b" : "#7c3aed"} strokeWidth={1.5} />
          <polyline
            points={`16,${cy} 20,${cy - 5} 25,${cy + 5} 30,${cy - 5} 35,${cy + 5} 40,${cy - 5} 44,${cy + 5} 48,${cy}`}
            fill="none" stroke={active ? "#f59e0b" : "#a78bfa"} strokeWidth={1.5}
          />
        </svg>
      );
    case "luminaire":
      return (
        <svg width={w} height={h} viewBox={`0 0 ${w} ${h}`}>
          {shared}
          <circle cx={cx} cy={cy} r={10} fill={active ? "rgba(251,191,36,0.2)" : "none"}
            stroke={active ? "#fbbf24" : "#334155"} strokeWidth={1.5} />
          {active && <>
            <line x1={cx} y1={cy - 14} x2={cx} y2={cy - 10} stroke="#fbbf24" strokeWidth={1.5} />
            <line x1={cx} y1={cy + 10} x2={cx} y2={cy + 14} stroke="#fbbf24" strokeWidth={1.5} />
            <line x1={cx - 14} y1={cy} x2={cx - 10} y2={cy} stroke="#fbbf24" strokeWidth={1.5} />
            <line x1={cx + 10} y1={cy} x2={cx + 14} y2={cy} stroke="#fbbf24" strokeWidth={1.5} />
          </>}
          <circle cx={cx} cy={cy} r={5} fill={active ? "#fbbf24" : "#1e293b"}
            stroke={active ? "#fbbf24" : "#475569"} strokeWidth={1} />
        </svg>
      );
    case "motor":
      return (
        <svg width={w} height={h} viewBox={`0 0 ${w} ${h}`}>
          {shared}
          <circle cx={cx} cy={cy} r={11} fill="none" stroke={active ? "#f59e0b" : "#334155"} strokeWidth={1.5} />
          <text x={cx} y={cy + 4} textAnchor="middle" fontSize={10} fill={col} fontWeight="bold">M</text>
        </svg>
      );
    case "switch":
      return (
        <svg width={w} height={h} viewBox={`0 0 ${w} ${h}`}>
          {shared}
          <circle cx={16} cy={cy} r={3} fill={col} />
          <circle cx={w - 16} cy={cy} r={3} fill={col} />
          <line x1={16} y1={cy} x2={comp.closed ? w - 16 : w - 22} y2={comp.closed ? cy : cy - 10}
            stroke={active ? "#4ade80" : "#475569"} strokeWidth={2} strokeLinecap="round" />
          {!comp.closed && <text x={cx} y={cy - 8} textAnchor="middle" fontSize={7} fill="#ef4444">OPEN</text>}
        </svg>
      );
    case "breaker":
      return (
        <svg width={w} height={h} viewBox={`0 0 ${w} ${h}`}>
          {shared}
          <rect x={cx - 10} y={cy - 10} width={20} height={20} rx={2}
            fill={comp.closed ? "rgba(74,222,128,0.1)" : "rgba(239,68,68,0.1)"}
            stroke={comp.closed ? "#4ade80" : "#ef4444"} strokeWidth={1.5} />
          <line x1={cx} y1={cy - 6} x2={cx} y2={comp.closed ? cy + 6 : cy - 2}
            stroke={comp.closed ? "#4ade80" : "#ef4444"} strokeWidth={2} />
        </svg>
      );
    case "fuse":
      return (
        <svg width={w} height={h} viewBox={`0 0 ${w} ${h}`}>
          {shared}
          <rect x={16} y={cy - 6} width={32} height={12} rx={6}
            fill="none" stroke={active ? "#f59e0b" : "#78350f"} strokeWidth={1.5} />
          <line x1={18} y1={cy} x2={46} y2={cy} stroke={active ? "#f59e0b" : "#d97706"}
            strokeWidth={1.5} strokeDasharray="2,3" />
        </svg>
      );
    default:
      return (
        <svg width={w} height={h} viewBox={`0 0 ${w} ${h}`}>
          {shared}
          <rect x={10} y={cy - 10} width={44} height={20} rx={3}
            fill="none" stroke="#334155" strokeWidth={1.5} />
        </svg>
      );
  }
}

// ─── Isometric Office Scene ───────────────────────────────────────────────────
function IsometricOffice({ lightOn = false, circuitActive = false }) {
  const glow = lightOn ? 1 : 0;
  const accent = circuitActive ? "#4ade80" : "#3b82f6";

  return (
    <svg viewBox="0 0 900 600" width="100%" height="100%" preserveAspectRatio="xMidYMid meet" style={{ position: "absolute", inset: 0 }}>
      <defs>
        <linearGradient id="floor" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#0d1f3c" />
          <stop offset="100%" stopColor="#091526" />
        </linearGradient>
        <linearGradient id="wallLeft" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#162040" />
          <stop offset="100%" stopColor="#0c1628" />
        </linearGradient>
        <linearGradient id="wallRight" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#1a2848" />
          <stop offset="100%" stopColor="#0e1c34" />
        </linearGradient>
        <linearGradient id="desk1" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#1e3a5f" />
          <stop offset="100%" stopColor="#132540" />
        </linearGradient>
        <linearGradient id="deskTop" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#243d60" />
          <stop offset="100%" stopColor="#1a2f4a" />
        </linearGradient>
        <linearGradient id="monitor" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#0a1628" />
          <stop offset="100%" stopColor="#071020" />
        </linearGradient>
        <linearGradient id="chair" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#1e3050" />
          <stop offset="100%" stopColor="#142238" />
        </linearGradient>
        <radialGradient id="glowLight" cx="50%" cy="35%" r="55%">
          <stop offset="0%" stopColor={`rgba(255,230,100,${0.03 + glow * 0.18})`} />
          <stop offset="100%" stopColor="rgba(0,0,0,0)" />
        </radialGradient>
        <radialGradient id="screenGlow" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor={`rgba(96,165,250,${0.1 + glow * 0.2})`} />
          <stop offset="100%" stopColor="rgba(0,0,0,0)" />
        </radialGradient>
        <filter id="softGlow">
          <feGaussianBlur stdDeviation="3" result="b" />
          <feMerge><feMergeNode in="b" /><feMergeNode in="SourceGraphic" /></feMerge>
        </filter>
        <filter id="subtleGlow">
          <feGaussianBlur stdDeviation="1.5" result="b" />
          <feMerge><feMergeNode in="b" /><feMergeNode in="SourceGraphic" /></feMerge>
        </filter>
        <pattern id="floorGrid" width="60" height="34.6" patternUnits="userSpaceOnUse"
          patternTransform="translate(450,340) rotate(-30) scale(1,0.577)">
          <rect width="60" height="34.6" fill="none" stroke="#1a3050" strokeWidth="0.6" opacity="0.5" />
        </pattern>
      </defs>

      {/* ─── ROOM STRUCTURE ─── */}
      {/* Floor */}
      <polygon points="450,140 760,312 450,484 140,312" fill="url(#floor)" stroke="#1e3a5f" strokeWidth="1.5" />
      <polygon points="450,140 760,312 450,484 140,312" fill="url(#floorGrid)" opacity="0.35" />
      {/* Ambient */}
      <polygon points="450,140 760,312 450,484 140,312" fill="url(#glowLight)" />

      {/* Left wall */}
      <polygon points="140,60 450,60 450,140 140,312" fill="url(#wallLeft)" stroke="#1e3a5f" strokeWidth="1.5" />
      {/* Wall grid lines */}
      {[1,2,3,4,5].map(i => (
        <line key={`wlv${i}`}
          x1={140 + 62*i} y1={60 + 50.4*i}
          x2={140 + 62*i} y2={312 - 50.4*(5-i) + 50.4*i - 50.4*i + 50.4*(i-1) + 50.4}
          stroke="#1e3a5f" strokeWidth="0.5" opacity="0.4" />
      ))}
      {[1,2,3].map(i => (
        <line key={`wlh${i}`}
          x1={140} y1={60 + (252) * i/4}
          x2={450} y2={60 + (80) * i/4}
          stroke="#1e3a5f" strokeWidth="0.5" opacity="0.3" />
      ))}

      {/* Right wall */}
      <polygon points="450,60 760,60 760,312 450,140" fill="url(#wallRight)" stroke="#1e3a5f" strokeWidth="1.5" />
      {[1,2,3,4].map(i => (
        <line key={`wrv${i}`}
          x1={450 + 77.5*i} y1={60 + 20*i}
          x2={450 + 77.5*i} y2={140 + 43*i}
          stroke="#1e3a5f" strokeWidth="0.5" opacity="0.3" />
      ))}
      {[1,2,3].map(i => (
        <line key={`wrh${i}`}
          x1={450} y1={60 + 252*i/4}
          x2={760} y2={60 + 252*i/4}
          stroke="#1e3a5f" strokeWidth="0.5" opacity="0.25" />
      ))}

      {/* Ceiling */}
      <polygon points="140,60 450,60 760,60 450,60" fill="#060f20" stroke="#1e3a5f" strokeWidth="1" />
      <polygon points="140,60 450,60 760,312 450,140" fill="none" />

      {/* Ceiling ridge */}
      <line x1={450} y1={60} x2={450} y2={140} stroke="#2e4e74" strokeWidth="2" opacity="0.8" />
      <line x1={140} y1={60} x2={140} y2={312} stroke="#1e3654" strokeWidth="1.5" opacity="0.7" />
      <line x1={760} y1={60} x2={760} y2={312} stroke="#1e3654" strokeWidth="1.5" opacity="0.7" />

      {/* ─── CEILING LIGHTS ─── */}
      {[[350,62],[450,62],[550,62],[400,62],[500,62]].map(([cx,cy],i) => (
        <g key={`clight${i}`}>
          <rect x={cx-12} y={cy-2} width={24} height={8} rx={2}
            fill="#0a1628" stroke="#1e3a5f" strokeWidth="1" />
          {glow > 0 && (
            <ellipse cx={cx} cy={cy+18} rx={20+glow*30} ry={12+glow*18}
              fill={`rgba(255,228,100,${0.04+glow*0.12})`} />
          )}
          <rect x={cx-10} y={cy} width={20} height={4} rx={1}
            fill={glow > 0 ? `rgba(255,230,120,${0.4+glow*0.5})` : "#1a2a40"}
            style={glow > 0 ? { filter: "url(#softGlow)" } : {}} />
        </g>
      ))}

      {/* Screen glow on floor/walls */}
      <ellipse cx={560} cy={260} rx={80} ry={40}
        fill={`rgba(96,165,250,${0.03 + glow * 0.08})`} />

      {/* ─── BOOKSHELF (left wall) ─── */}
      {/* Shelf body */}
      <polygon points="160,155 240,110 240,260 160,305" fill="#0c1e38" stroke="#1e3a5f" strokeWidth="1.2" />
      <polygon points="160,155 240,110 280,132 200,177" fill="#122438" stroke="#1e3a5f" strokeWidth="1.2" />
      {/* Shelf dividers */}
      {[0,1,2,3].map(i => (
        <line key={`shelf${i}`}
          x1={160} y1={155+37.5*i}
          x2={240} y2={110+37.5*i}
          stroke="#1e3a5f" strokeWidth="1" />
      ))}
      {/* Books */}
      {[
        [168,148,8,28,"#3b82f6"],[178,145,6,27,"#ef4444"],[186,143,9,26,"#8b5cf6"],
        [197,140,7,25,"#10b981"],[168,186,8,28,"#f59e0b"],[178,183,10,27,"#6366f1"],
        [190,180,6,26,"#ec4899"],[168,222,8,27,"#14b8a6"],[178,219,7,26,"#f97316"],
        [187,217,9,25,"#3b82f6"],
      ].map(([x,y,w,h,c],i) => (
        <polygon key={`book${i}`}
          points={`${x},${y} ${x+w},${y-w*0.5} ${x+w},${y-w*0.5+h} ${x},${y+h}`}
          fill={c} opacity="0.7" stroke={c} strokeWidth="0.5" />
      ))}

      {/* ─── MAIN DESK ─── */}
      {/* Desk legs (isometric) */}
      <polygon points="340,360 360,349 360,390 340,401" fill="#0c1e38" stroke="#1e3654" strokeWidth="1" />
      <polygon points="560,360 580,349 580,390 560,401" fill="#0c1e38" stroke="#1e3654" strokeWidth="1" />
      <polygon points="340,401 360,390 580,390 560,401" fill="#0c1e38" stroke="#1e3654" strokeWidth="1" />

      {/* Desk side face */}
      <polygon points="320,290 340,280 340,360 320,370" fill="url(#desk1)" stroke="#1e3a5f" strokeWidth="1.2" />
      {/* Desk front face */}
      <polygon points="340,280 600,280 600,360 340,360" fill="#122035" stroke="#1e3a5f" strokeWidth="1.2" />
      {/* Desk top */}
      <polygon points="320,270 580,270 600,280 340,280" fill="url(#deskTop)" stroke="#2a4a70" strokeWidth="1.5" />

      {/* ─── MONITOR ─── */}
      {/* Monitor stand */}
      <polygon points="450,248 468,239 468,272 450,281" fill="#0c1628" stroke="#1e3a5f" strokeWidth="1" />
      <polygon points="440,275 480,255 480,272 440,292" fill="#0c1628" stroke="#1e3a5f" strokeWidth="1" />

      {/* Monitor back */}
      <polygon points="400,180 500,132 500,248 400,296" fill="#08111e" stroke="#1e3a5f" strokeWidth="1.5" />
      {/* Monitor screen */}
      <polygon points="406,184 494,138 494,244 406,290" fill="url(#monitor)" stroke="#1e4080" strokeWidth="1" />
      {/* Screen glow effect */}
      <polygon points="406,184 494,138 494,244 406,290"
        fill={`rgba(59,130,246,${0.05+glow*0.12})`} />

      {/* Screen content */}
      {glow > 0 && <>
        {/* Fake UI on monitor */}
        <polygon points="412,190 488,146 488,196 412,240" fill="rgba(6,20,48,0.9)" />
        {[0,1,2,3,4].map(i => (
          <line key={`sline${i}`}
            x1={415} y1={195+i*9} x2={415+(50+i*8)*0.82} y2={195+i*9-((50+i*8)*0.5)}
            stroke={["#3b82f6","#4ade80","#f59e0b","#8b5cf6","#60a5fa"][i]}
            strokeWidth={1.5} opacity="0.8" strokeLinecap="round" />
        ))}
        <polygon points="420,212 488,172 488,196 420,236"
          fill="rgba(15,30,60,0.8)" stroke="#1e3a5f" strokeWidth="0.5" />
        {/* Circuit diagram on screen */}
        <polyline points="425,230 435,224 445,228 455,220 465,224 475,218 485,222"
          fill="none" stroke="#4ade80" strokeWidth="1" opacity="0.7" />
      </>}

      {/* Monitor frame lights */}
      <circle cx={494} cy={246} r={2} fill={circuitActive ? "#4ade80" : "#1e3a5f"}
        style={circuitActive ? { filter: "url(#softGlow)" } : {}} />

      {/* ─── KEYBOARD ─── */}
      <polygon points="380,280 460,240 460,255 380,295" fill="#0e1e38" stroke="#1e3a5f" strokeWidth="1" />
      <polygon points="380,295 460,255 472,261 392,301" fill="#091528" stroke="#1e3a5f" strokeWidth="1" />
      {/* Key rows */}
      {[0,1,2,3].map(r => (
        [0,1,2,3,4,5,6].map(c => (
          <rect key={`key${r}${c}`}
            x={383+c*11} y={282-c*5.5+r*7-r*3.5}
            width={8} height={5} rx={1}
            transform={`skewY(-26) skewX(0)`}
            fill="#0a1528" stroke="#1e3a5f" strokeWidth="0.4" opacity="0.8" />
        ))
      ))}

      {/* ─── MOUSE ─── */}
      <ellipse cx={478} cy={272} rx={12} ry={7}
        fill="#0e1e38" stroke="#1e3a5f" strokeWidth="1"
        transform="rotate(-26,478,272)" />
      <line x1={472} y1={269} x2={472} y2={275}
        stroke="#1e3a5f" strokeWidth="1" transform="rotate(-26,472,272)" />

      {/* ─── DESK ITEMS ─── */}
      {/* Coffee mug */}
      <ellipse cx={335} cy={273} rx={9} ry={5} fill="#1a3050" stroke="#2a4a70" strokeWidth="1" />
      <polygon points="326,268 344,260 344,278 326,286" fill="#1a3050" stroke="#2a4a70" strokeWidth="1" />
      <ellipse cx={335} cy={268} rx={9} ry={5} fill="#0d1e38" stroke="#2a4a70" strokeWidth="1" />
      {glow > 0 && <ellipse cx={335} cy={268} rx={7} ry={3.5} fill="rgba(251,191,36,0.15)" />}
      {/* Mug handle */}
      <path d="M 344,263 Q 352,264 352,270 Q 352,276 344,277"
        fill="none" stroke="#2a4a70" strokeWidth="1.5" />

      {/* Notepad */}
      <polygon points="355,276 400,252 400,270 355,294" fill="#0e2040" stroke="#1e3a5f" strokeWidth="1" />
      <polygon points="355,276 400,252 404,254 360,278" fill="#132840" stroke="#1e3a5f" strokeWidth="1" />
      {[0,1,2,3].map(i => (
        <line key={`note${i}`}
          x1={358} y1={279+i*3.5}
          x2={395} y2={258+i*3.5}
          stroke="#1e3a5f" strokeWidth="0.6" />
      ))}

      {/* Small plant */}
      <polygon points="590,272 600,267 600,285 590,290" fill="#0c1e38" stroke="#1e3a5f" strokeWidth="1" />
      <ellipse cx={595} cy={268} rx={7} ry={4} fill="#0c1e38" stroke="#1e3a5f" strokeWidth="1" />
      {/* Plant leaves */}
      {[[-6,-16,12,-20],[6,-16,-12,-20],[0,-12,0,-22],[8,-14,-4,-24],[-8,-14,4,-24]].map(([dx1,dy1,dx2,dy2],i) => (
        <path key={`leaf${i}`}
          d={`M 595,266 Q ${595+dx1},${266+dy1} ${595+dx2},${266+dy2}`}
          fill="none" stroke="#22c55e" strokeWidth={i<2?"2.5":"2"} opacity="0.7" strokeLinecap="round" />
      ))}

      {/* ─── CHAIR ─── */}
      {/* Chair base/wheels */}
      {[-16,0,16,-8,8].map((dx,i) => (
        <ellipse key={`wheel${i}`} cx={450+dx} cy={424+Math.abs(dx)*0.3}
          rx={4} ry={2.5} fill="#0a1628" stroke="#1e3654" strokeWidth="0.8"
          transform={`rotate(-20,${450+dx},${424+Math.abs(dx)*0.3})`} />
      ))}
      {/* Chair stem */}
      <polygon points="446,385 454,381 454,422 446,426" fill="#0e1e38" stroke="#1e3654" strokeWidth="1" />
      {/* Chair seat */}
      <polygon points="415,365 485,328 485,348 415,385" fill="url(#chair)" stroke="#1e3a5f" strokeWidth="1.2" />
      <polygon points="415,365 485,328 490,331 420,368" fill="#122030" stroke="#1e3a5f" strokeWidth="1" />
      {/* Chair back */}
      <polygon points="435,310 475,289 475,328 435,349" fill="url(#chair)" stroke="#1e3a5f" strokeWidth="1.2" />
      <polygon points="435,310 475,289 479,291 439,312" fill="#0e1828" stroke="#1e3a5f" strokeWidth="0.8" />
      {/* Armrests */}
      <polygon points="415,340 425,335 425,355 415,360" fill="#0e1e38" stroke="#1e3654" strokeWidth="1" />
      <polygon points="479,310 489,305 489,325 479,320" fill="#0e1e38" stroke="#1e3654" strokeWidth="1" />

      {/* ─── SERVER RACK (right wall) ─── */}
      <polygon points="660,130 720,98 720,250 660,282" fill="#0c1628" stroke="#1e3a5f" strokeWidth="1.5" />
      <polygon points="660,130 720,98 740,110 680,142" fill="#0e1e38" stroke="#1e3a5f" strokeWidth="1.5" />
      {/* Rack units */}
      {[0,1,2,3,4,5,6,7].map(i => (
        <g key={`rack${i}`}>
          <polygon
            points={`663,${137+i*17.5} 717,${107+i*17.5} 717,${122+i*17.5} 663,${152+i*17.5}`}
            fill={i%3===0 ? "rgba(59,130,246,0.15)" : i%3===1 ? "rgba(74,222,128,0.1)" : "rgba(30,41,59,0.8)"}
            stroke="#1e3a5f" strokeWidth="0.8" />
          <circle cx={670} cy={144+i*17.5}
            r={2.5}
            fill={circuitActive && i%3!==2 ? (i%2===0 ? "#4ade80" : "#3b82f6") : "#1e3a5f"}
            style={circuitActive ? { filter: "url(#subtleGlow)" } : {}} />
          {circuitActive && i%3!==2 && (
            <circle cx={680} cy={144+i*17.5} r={1.5} fill="#f59e0b" opacity="0.7" />
          )}
        </g>
      ))}

      {/* ─── CABLE MANAGEMENT ─── */}
      {circuitActive && [
        "M 490,244 Q 520,250 540,260 Q 560,270 570,280",
        "M 335,280 Q 300,300 280,320 Q 260,340 250,360",
        "M 600,280 Q 640,285 660,275",
      ].map((d,i) => (
        <path key={`cable${i}`} d={d} fill="none"
          stroke={["#3b82f6","#4ade80","#f59e0b"][i]}
          strokeWidth={1.5} opacity="0.5" strokeDasharray="4,3"
          style={{ animation: "cableFlow 1.5s linear infinite" }} />
      ))}

      {/* ─── FLOOR ACCENT LINES ─── */}
      <polyline points="140,312 450,484 760,312" fill="none" stroke="#1e3a5f" strokeWidth="2" opacity="0.5" />

      {/* Baseboard left */}
      <line x1={140} y1={312} x2={450} y2={484} stroke="#243650" strokeWidth="2.5" opacity="0.6" />
      {/* Baseboard right */}
      <line x1={450} y1={484} x2={760} y2={312} stroke="#243650" strokeWidth="2.5" opacity="0.5" />

      {/* ─── ELECTRICAL PANEL on wall ─── */}
      <polygon points="200,170 260,138 260,210 200,242" fill="#0a1828" stroke="#2563eb" strokeWidth="1.5" />
      <polygon points="200,170 260,138 266,141 206,173" fill="#0c1e38" stroke="#2563eb" strokeWidth="1" />
      {/* Panel label */}
      <text x={224} y={190} fontSize={7} fill="#60a5fa" opacity="0.8"
        transform="rotate(-27,224,190)">TABLERO</text>
      {/* Breakers */}
      {[0,1,2,3,4,5].map(i => (
        <g key={`br${i}`}>
          <rect x={207} y={179+i*8} width={16} height={6} rx={1}
            fill={circuitActive ? "rgba(74,222,128,0.2)" : "rgba(30,41,59,0.8)"}
            stroke={circuitActive ? "#22c55e" : "#1e3a5f"} strokeWidth="0.8"
            transform={`rotate(-27,215,182+${i*8})`} />
        </g>
      ))}

      {/* Panel indicator LED */}
      <circle cx={258} cy={140} r={3}
        fill={circuitActive ? "#4ade80" : "#ef4444"}
        style={circuitActive ? { filter: "url(#softGlow)" } : {}}
        transform="rotate(-27,258,140)" />
    </svg>
  );
}

// ─── Simple Circuit Hook ──────────────────────────────────────────────────────
function useCircuit() {
  const [components, setComponents] = useState([]);
  const [wires, setWires] = useState([]);
  const [selectedId, setSelectedId] = useState(null);
  const [pendingPort, setPendingPort] = useState(null);
  const [pendingStart, setPendingStart] = useState(null);
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });
  const containerRef = useRef(null);

  const selectedComp = components.find(c => c.id === selectedId) ?? null;

  const analysis = useMemo(() => {
    const sources = components.filter(c => c.type === "battery" || c.type === "outlet");
    const loads = components.filter(c => ["resistor","luminaire","motor","fuse"].includes(c.type));
    const switches = components.filter(c => c.type === "switch" || c.type === "breaker");
    const allSwitchesClosed = switches.every(s => s.closed !== false);
    const totalVoltage = sources.reduce((sum, s) => sum + (s.voltage ?? 12), 0);
    const totalResistance = loads.reduce((sum, l) => {
      if (l.type === "luminaire" && l.power && l.voltage) return sum + (l.voltage * l.voltage) / l.power;
      return sum + (l.resistance ?? 100);
    }, 0) || Infinity;
    const circuitClosed = sources.length > 0 && loads.length > 0 && wires.length >= 2 && allSwitchesClosed;
    const current = circuitClosed && isFinite(totalResistance) ? totalVoltage / totalResistance : 0;
    const totalPower = current * totalVoltage;
    const compValues = {};
    if (circuitClosed) {
      components.forEach(c => {
        const v = (c.type === "battery" || c.type === "outlet") ? (c.voltage ?? 12) : current * (c.resistance ?? 100);
        compValues[c.id] = { v, i: current, p: v * current };
      });
    }
    return { totalVoltage, totalResistance, current, totalPower, circuitClosed, compValues, shortCircuit: circuitClosed && totalResistance < 0.5 };
  }, [components, wires]);

  const portPos = useCallback((compId, portId) => {
    const comp = components.find(c => c.id === compId);
    if (!comp) return { x: 0, y: 0 };
    const port = getPorts().find(p => p.id === portId);
    return { x: comp.x + (port?.dx ?? 0), y: comp.y + (port?.dy ?? 0) };
  }, [components]);

  const handleCanvasDrop = useCallback((e) => {
    e.preventDefault();
    const type = e.dataTransfer.getData("compType");
    if (!type) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const x = snap(e.clientX - rect.left);
    const y = snap(e.clientY - rect.top);
    const item = PALETTE.find(p => p.type === type);
    const newComp = { id: uid(), type, x, y, label: `${type[0].toUpperCase()}${components.length + 1}`, ...(item?.defaults ?? {}) };
    setComponents(prev => [...prev, newComp]);
    setSelectedId(newComp.id);
  }, [components.length]);

  const handleMouseMove = useCallback((e) => {
    const rect = containerRef.current?.getBoundingClientRect();
    if (!rect) return;
    setMousePos({ x: e.clientX - rect.left, y: e.clientY - rect.top });
  }, []);

  const handleCanvasClick = useCallback(() => {
    if (pendingPort) { setPendingPort(null); setPendingStart(null); }
    else setSelectedId(null);
  }, [pendingPort]);

  const handlePortClick = useCallback((compId, portId) => {
    if (!pendingPort) {
      const pos = portPos(compId, portId);
      setPendingPort({ compId, portId });
      setPendingStart(pos);
    } else {
      if (pendingPort.compId !== compId) {
        const newWire = { id: uid(), fromCompId: pendingPort.compId, fromPortId: pendingPort.portId, toCompId: compId, toPortId: portId };
        setWires(prev => [...prev, newWire]);
      }
      setPendingPort(null);
      setPendingStart(null);
    }
  }, [pendingPort, portPos]);

  const handleCompMouseDown = useCallback((compId, e) => {
    e.stopPropagation();
    setSelectedId(compId);
    const startX = e.clientX, startY = e.clientY;
    const comp = components.find(c => c.id === compId);
    if (!comp) return;
    const origX = comp.x, origY = comp.y;
    const onMove = (me) => {
      const dx = me.clientX - startX, dy = me.clientY - startY;
      setComponents(prev => prev.map(c => c.id === compId ? { ...c, x: snap(origX + dx), y: snap(origY + dy) } : c));
    };
    const onUp = () => { window.removeEventListener("mousemove", onMove); window.removeEventListener("mouseup", onUp); };
    window.addEventListener("mousemove", onMove);
    window.addEventListener("mouseup", onUp);
  }, [components]);

  const deleteComponent = useCallback((id) => {
    setComponents(prev => prev.filter(c => c.id !== id));
    setWires(prev => prev.filter(w => w.fromCompId !== id && w.toCompId !== id));
    setSelectedId(null);
  }, []);

  const deleteWire = useCallback((id) => setWires(prev => prev.filter(w => w.id !== id)), []);

  const toggleComp = useCallback((id) => {
    setComponents(prev => prev.map(c => c.id === id ? { ...c, closed: !c.closed } : c));
  }, []);

  const updateComp = useCallback((id, updates) => {
    setComponents(prev => prev.map(c => c.id === id ? { ...c, ...updates } : c));
  }, []);

  const clearAll = useCallback(() => { setComponents([]); setWires([]); setSelectedId(null); }, []);

  useEffect(() => {
    const handler = (e) => { if (e.key === "Escape") { setPendingPort(null); setPendingStart(null); } };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, []);

  return {
    components, wires, selectedId, selectedComp, pendingPort, mousePos, analysis,
    pendingStart, containerRef, portPos, handleCanvasDrop, handleMouseMove,
    handleCanvasClick, handlePortClick, handleCompMouseDown, deleteComponent,
    deleteWire, toggleComp, updateComp, clearAll, getPorts,
  };
}

// ─── Main App ─────────────────────────────────────────────────────────────────
export default function App() {
  const circuit = useCircuit();
  const {
    components, wires, selectedId, selectedComp, pendingPort, mousePos,
    analysis, pendingStart, containerRef, portPos, handleCanvasDrop,
    handleMouseMove, handleCanvasClick, handlePortClick, handleCompMouseDown,
    deleteComponent, deleteWire, toggleComp, updateComp, clearAll, getPorts,
  } = circuit;

  const lightOn = analysis.circuitClosed &&
    components.some(c => c.type === "luminaire" && (analysis.compValues[c.id]?.i ?? 0) > 0);

  return (
    <div style={{
      display: "flex", height: "100vh",
      background: "#030b1f",
      fontFamily: "'JetBrains Mono', 'Courier New', monospace",
      overflow: "hidden",
    }}>
      <style>{`
        @keyframes cableFlow { from{stroke-dashoffset:0} to{stroke-dashoffset:-20} }
        @keyframes blink { 0%,100%{opacity:1} 50%{opacity:0.2} }
        @keyframes fadeIn { from{opacity:0;transform:translateY(4px)} to{opacity:1;transform:none} }
        @keyframes electronFlow { from{stroke-dashoffset:0} to{stroke-dashoffset:-40} }
        ::-webkit-scrollbar{width:3px} ::-webkit-scrollbar-thumb{background:#1e3a5f;border-radius:2px}
        .pal-item:hover { background: rgba(59,130,246,0.08) !important; border-color: #2563eb !important; }
        .port-dot:hover { transform: scale(1.5); }
        input[type=number]::-webkit-inner-spin-button { opacity: 0.3; }
      `}</style>

      {/* ══ LEFT SIDEBAR ══ */}
      <aside style={{
        width: 200, background: "#020916",
        borderRight: "1px solid #0f2040",
        display: "flex", flexDirection: "column",
        overflowY: "auto", flexShrink: 0,
      }}>
        {/* Header */}
        <div style={{ padding: "14px 14px 10px", borderBottom: "1px solid #0f2040" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4 }}>
            <div style={{
              width: 28, height: 28, borderRadius: 6,
              background: "rgba(59,130,246,0.15)",
              border: "1px solid rgba(59,130,246,0.3)",
              display: "flex", alignItems: "center", justifyContent: "center",
              fontSize: 14,
            }}>⚡</div>
            <div>
              <div style={{ fontSize: 9, fontWeight: 700, color: "#60a5fa", letterSpacing: "0.18em" }}>
                CIRCUIT LAB
              </div>
              <div style={{ fontSize: 7, color: "#2a4a70", letterSpacing: "0.1em" }}>
                IEC 60617 · ISOMETRIC
              </div>
            </div>
          </div>
          <div style={{
            fontSize: 7, color: "#1e3654", padding: "4px 0", lineHeight: 1.6,
          }}>
            Arrastra → Lienzo · Clic en puerto para conectar
          </div>
        </div>

        {/* Palette categories */}
        {["Fuentes", "Cargas", "Control", "Protección"].map(cat => {
          const items = PALETTE.filter(p => p.cat === cat);
          if (!items.length) return null;
          return (
            <div key={cat}>
              <div style={{
                padding: "10px 14px 4px", fontSize: 7.5, color: "#2a4a70",
                textTransform: "uppercase", letterSpacing: "0.18em", fontWeight: 700,
              }}>{cat}</div>
              {items.map(item => (
                <div
                  key={item.type}
                  className="pal-item"
                  draggable
                  onDragStart={e => e.dataTransfer.setData("compType", item.type)}
                  style={{
                    display: "flex", alignItems: "center", gap: 8,
                    padding: "5px 12px", cursor: "grab", margin: "1px 6px",
                    borderRadius: 6, border: "1px solid transparent",
                    transition: "all 0.15s", userSelect: "none",
                  }}
                >
                  <div style={{
                    width: 38, height: 22, display: "flex", alignItems: "center",
                    justifyContent: "center", background: "rgba(15,32,64,0.8)",
                    border: "1px solid #0f2040", borderRadius: 4,
                    flexShrink: 0, overflow: "hidden",
                  }}>
                    <div style={{ transform: "scale(0.5)", transformOrigin: "center" }}>
                      <CompSVG comp={{ ...item.defaults, id: "", type: item.type, x: 0, y: 0, label: "" }} />
                    </div>
                  </div>
                  <span style={{ fontSize: 10, color: "#7aa8d8" }}>{item.label}</span>
                </div>
              ))}
            </div>
          );
        })}

        {/* Instructions */}
        <div style={{
          marginTop: "auto", padding: "12px 14px",
          borderTop: "1px solid #0f2040",
        }}>
          <div style={{ fontSize: 7.5, color: "#1e3654", lineHeight: 2 }}>
            <div>● Arrastra componentes</div>
            <div>● Click puerto <span style={{ color: "#3b82f6" }}>●</span> para conectar</div>
            <div>● Doble-click switch para abrir/cerrar</div>
            <div>● ESC cancela conexión</div>
          </div>
        </div>
      </aside>

      {/* ══ ISOMETRIC CANVAS ══ */}
      <div style={{ flex: 1, position: "relative", overflow: "hidden" }}>
        {/* Background grid */}
        <svg style={{ position: "absolute", inset: 0, width: "100%", height: "100%", pointerEvents: "none", opacity: 0.15 }}>
          <defs>
            <pattern id="bgGrid" width={GRID} height={GRID} patternUnits="userSpaceOnUse">
              <circle cx="0" cy="0" r="0.7" fill="#1e3a5f" />
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#bgGrid)" />
        </svg>

        {/* Isometric Office */}
        <div style={{ position: "absolute", inset: 0, pointerEvents: "none" }}>
          <IsometricOffice lightOn={lightOn} circuitActive={analysis.circuitClosed} />
        </div>

        {/* Circuit canvas overlay */}
        <div
          ref={containerRef}
          style={{ position: "absolute", inset: 0 }}
          onDrop={handleCanvasDrop}
          onDragOver={e => e.preventDefault()}
          onMouseMove={handleMouseMove}
          onClick={handleCanvasClick}
        >
          {/* Wires SVG */}
          <svg style={{ position: "absolute", inset: 0, width: "100%", height: "100%", overflow: "visible" }}>
            <defs>
              <filter id="wireGlow">
                <feGaussianBlur stdDeviation="2.5" result="b" />
                <feMerge><feMergeNode in="b" /><feMergeNode in="SourceGraphic" /></feMerge>
              </filter>
            </defs>

            {wires.map(w => {
              const from = portPos(w.fromCompId, w.fromPortId);
              const to = portPos(w.toCompId, w.toPortId);
              const active = analysis.circuitClosed;
              const d = wirePath(from.x, from.y, to.x, to.y);
              return (
                <g key={w.id}>
                  {active && <path d={d} fill="none" stroke="rgba(74,222,128,0.12)" strokeWidth="10" filter="url(#wireGlow)" />}
                  <path d={d} fill="none"
                    stroke={active ? "#b45309" : "#1e3a5f"}
                    strokeWidth={active ? 4 : 2.5}
                    strokeLinecap="round" />
                  {active && <path d={d} fill="none" stroke="#f59e0b" strokeWidth="1.5" strokeLinecap="round" opacity="0.8" />}
                  {active && [0, 0.6, 1.2].map(delay => (
                    <circle key={delay} r={3.5} fill="#4ade80" opacity="0.9" filter="url(#wireGlow)">
                      <animateMotion dur="1.8s" begin={`${delay}s`} repeatCount="indefinite" path={d} />
                    </circle>
                  ))}
                  <path d={d} fill="none" stroke="transparent" strokeWidth="14"
                    style={{ cursor: "pointer" }}
                    onClick={e => { e.stopPropagation(); deleteWire(w.id); }} />
                </g>
              );
            })}

            {pendingStart && (
              <path
                d={wirePath(pendingStart.x, pendingStart.y, mousePos.x, mousePos.y)}
                fill="none" stroke="#3b82f6" strokeWidth="2" strokeDasharray="6,4" opacity="0.7"
              />
            )}
          </svg>

          {/* Components */}
          {components.map(comp => {
            const compData = analysis.compValues[comp.id];
            const active = analysis.circuitClosed && (compData?.i ?? 0) > 0;
            const isSelected = selectedId === comp.id;
            const ports = getPorts(comp.type);
            return (
              <div
                key={comp.id}
                style={{
                  position: "absolute",
                  left: comp.x - COMP_W / 2,
                  top: comp.y - COMP_H / 2,
                  width: COMP_W, height: COMP_H,
                  zIndex: isSelected ? 50 : 10,
                  cursor: pendingPort ? "crosshair" : "grab",
                  animation: "fadeIn 0.2s ease",
                }}
                onMouseDown={e => handleCompMouseDown(comp.id, e)}
                onDoubleClick={e => {
                  e.stopPropagation();
                  if (comp.type === "switch" || comp.type === "breaker") toggleComp(comp.id);
                }}
              >
                {/* Selection ring */}
                {isSelected && (
                  <div style={{
                    position: "absolute", inset: -5, borderRadius: 8,
                    border: "1.5px solid #3b82f6",
                    boxShadow: "0 0 0 3px rgba(59,130,246,0.2)",
                    pointerEvents: "none",
                  }} />
                )}
                {/* Active glow */}
                {active && (
                  <div style={{
                    position: "absolute", inset: -10, borderRadius: 12,
                    background: "radial-gradient(ellipse, rgba(74,222,128,0.1) 0%, transparent 70%)",
                    pointerEvents: "none",
                  }} />
                )}

                <div style={{ position: "relative" }}>
                  <CompSVG comp={comp} active={active} />
                </div>

                {/* Label */}
                <div style={{
                  position: "absolute", top: COMP_H + 3, left: "50%",
                  transform: "translateX(-50%)", fontSize: 8, color: "#3a5a80",
                  whiteSpace: "nowrap", pointerEvents: "none",
                  background: "rgba(3,11,31,0.8)", padding: "1px 4px", borderRadius: 3,
                }}>
                  {comp.label}
                </div>

                {/* Live values */}
                {active && compData && (
                  <div style={{
                    position: "absolute", top: -30, left: "50%",
                    transform: "translateX(-50%)",
                    background: "rgba(10,20,40,0.95)", border: "1px solid #92400e",
                    color: "#fde68a", fontSize: 7.5, padding: "2px 7px",
                    borderRadius: 4, whiteSpace: "nowrap", pointerEvents: "none",
                  }}>
                    {compData.v.toFixed(1)}V · {compData.i.toFixed(2)}A
                  </div>
                )}

                {/* Delete */}
                {isSelected && (
                  <button
                    style={{
                      position: "absolute", top: -12, right: -12, width: 18, height: 18,
                      borderRadius: "50%", background: "#ef4444", color: "white",
                      border: "none", cursor: "pointer", fontSize: 12, lineHeight: "18px",
                      textAlign: "center", zIndex: 60, display: "flex",
                      alignItems: "center", justifyContent: "center", padding: 0,
                    }}
                    onMouseDown={e => e.stopPropagation()}
                    onClick={e => { e.stopPropagation(); deleteComponent(comp.id); }}
                  >×</button>
                )}

                {/* Ports */}
                {getPorts().map(port => {
                  const isPending = pendingPort?.compId === comp.id && pendingPort?.portId === port.id;
                  const hasWire = wires.some(w =>
                    (w.fromCompId === comp.id && w.fromPortId === port.id) ||
                    (w.toCompId === comp.id && w.toPortId === port.id)
                  );
                  return (
                    <div
                      key={port.id}
                      className="port-dot"
                      style={{
                        position: "absolute",
                        left: COMP_W / 2 + port.dx - PORT_R,
                        top: COMP_H / 2 + port.dy - PORT_R,
                        width: PORT_R * 2, height: PORT_R * 2,
                        borderRadius: "50%",
                        background: isPending ? "#3b82f6" : hasWire ? (active ? "#f59e0b" : "#1e3a5f") : "rgba(59,130,246,0.1)",
                        border: `2px solid ${isPending ? "#60a5fa" : hasWire ? (active ? "#f59e0b" : "#2a4a70") : "#3b82f6"}`,
                        cursor: "crosshair", zIndex: 20,
                        transition: "all 0.15s",
                        boxShadow: isPending ? "0 0 8px rgba(59,130,246,0.8)" : "none",
                      }}
                      onClick={e => { e.stopPropagation(); handlePortClick(comp.id, port.id); }}
                    />
                  );
                })}
              </div>
            );
          })}

          {/* Empty state */}
          {components.length === 0 && (
            <div style={{
              position: "absolute", bottom: 24, left: "50%",
              transform: "translateX(-50%)",
              pointerEvents: "none",
              background: "rgba(3,11,31,0.85)",
              border: "1px solid #0f2040",
              borderRadius: 10, padding: "10px 20px",
              color: "#2a4a70", fontSize: 10, textAlign: "center", lineHeight: 1.8,
            }}>
              <span style={{ color: "#3b82f6" }}>⚡</span> Arrastra componentes al lienzo isométrico
            </div>
          )}

          {/* Pending wire banner */}
          {pendingPort && (
            <div style={{
              position: "absolute", top: 14, left: "50%", transform: "translateX(-50%)",
              background: "rgba(59,130,246,0.12)", border: "1px solid #3b82f6",
              color: "#60a5fa", fontSize: 10, padding: "5px 16px", borderRadius: 20,
              pointerEvents: "none",
            }}>
              ● Selecciona puerto destino para conectar — ESC para cancelar
            </div>
          )}
        </div>

        {/* Circuit status badge */}
        <div style={{ position: "absolute", top: 14, right: 14, zIndex: 100 }}>
          <div style={{
            background: analysis.circuitClosed ? "rgba(74,222,128,0.1)" : "rgba(15,32,64,0.8)",
            border: `1px solid ${analysis.circuitClosed ? "rgba(74,222,128,0.35)" : "#0f2040"}`,
            color: analysis.circuitClosed ? "#4ade80" : "#2a4a70",
            fontSize: 9, padding: "4px 12px", borderRadius: 20,
            display: "flex", alignItems: "center", gap: 6,
            letterSpacing: "0.12em",
          }}>
            <span style={{
              width: 6, height: 6, borderRadius: "50%",
              background: analysis.circuitClosed ? "#4ade80" : "#1e3a5f",
              display: "inline-block",
              ...(analysis.circuitClosed ? { animation: "blink 1.2s infinite" } : {}),
            }} />
            {analysis.circuitClosed ? "CIRCUITO CERRADO" : "CIRCUITO ABIERTO"}
          </div>
          {analysis.shortCircuit && (
            <div style={{
              marginTop: 6, background: "rgba(239,68,68,0.15)", border: "1px solid #ef4444",
              color: "#ef4444", fontSize: 9, padding: "4px 12px", borderRadius: 20, textAlign: "center",
            }}>
              ⚠ CORTOCIRCUITO
            </div>
          )}
        </div>
      </div>

      {/* ══ RIGHT PANEL ══ */}
      <aside style={{
        width: 220, background: "#020916",
        borderLeft: "1px solid #0f2040",
        display: "flex", flexDirection: "column",
        overflowY: "auto", flexShrink: 0,
      }}>
        {/* Analysis */}
        <div style={{ padding: "14px", borderBottom: "1px solid #0f2040" }}>
          <div style={{ fontSize: 8, color: "#2a4a70", letterSpacing: "0.18em", textTransform: "uppercase", marginBottom: 12 }}>
            Análisis de Circuito
          </div>

          {[
            { label: "Voltaje",     value: analysis.totalVoltage.toFixed(2),     unit: "V",  color: "#fbbf24" },
            { label: "Corriente",   value: analysis.current.toFixed(3),          unit: "A",  color: "#60a5fa" },
            { label: "Resistencia", value: isFinite(analysis.totalResistance) ? analysis.totalResistance.toFixed(1) : "∞", unit: "Ω", color: "#a78bfa" },
            { label: "Potencia",    value: analysis.totalPower.toFixed(2),        unit: "W",  color: "#4ade80" },
          ].map(row => (
            <div key={row.label} style={{
              display: "flex", justifyContent: "space-between", alignItems: "center",
              padding: "5px 0", borderBottom: "1px solid #080f20",
            }}>
              <span style={{ fontSize: 9.5, color: "#2a4a70" }}>{row.label}</span>
              <span style={{ fontSize: 12, fontWeight: 700, color: row.color }}>
                {row.value}
                <span style={{ fontSize: 8, marginLeft: 2, opacity: 0.5 }}>{row.unit}</span>
              </span>
            </div>
          ))}
        </div>

        {/* Formulas */}
        <div style={{ padding: "10px 14px", borderBottom: "1px solid #0f2040" }}>
          <div style={{ fontSize: 7.5, color: "#2a4a70", letterSpacing: "0.14em", textTransform: "uppercase", marginBottom: 6 }}>
            Fórmulas
          </div>
          {["V = I · R", "P = V · I", "R_s = ΣR", "1/R_p = Σ(1/R)"].map(f => (
            <div key={f} style={{ fontSize: 9.5, color: "#1e3654", padding: "2px 0", fontFamily: "monospace" }}>
              {f}
            </div>
          ))}
        </div>

        {/* Component properties */}
        {selectedComp ? (
          <div style={{ padding: "12px 14px", animation: "fadeIn 0.2s ease" }}>
            <div style={{ fontSize: 8, color: "#2a4a70", letterSpacing: "0.14em", textTransform: "uppercase", marginBottom: 10 }}>
              Propiedades
            </div>
            <div style={{
              fontSize: 8, color: "#60a5fa", background: "rgba(59,130,246,0.08)",
              border: "1px solid rgba(59,130,246,0.2)",
              padding: "3px 8px", borderRadius: 4, display: "inline-block", marginBottom: 10,
            }}>
              {selectedComp.type.toUpperCase()}
            </div>

            <div style={{ marginBottom: 10 }}>
              <div style={{ fontSize: 8, color: "#1e3654", marginBottom: 3 }}>Etiqueta</div>
              <input
                value={selectedComp.label}
                onChange={e => updateComp(selectedComp.id, { label: e.target.value })}
                style={{
                  width: "100%", background: "#040d1e", border: "1px solid #0f2040",
                  borderRadius: 4, color: "#7aa8d8", fontSize: 10, padding: "4px 7px",
                  outline: "none", boxSizing: "border-box",
                }}
              />
            </div>

            {(selectedComp.type === "battery" || selectedComp.type === "outlet") && (
              <div style={{ marginBottom: 10 }}>
                <div style={{ fontSize: 8, color: "#1e3654", marginBottom: 3 }}>Voltaje (V)</div>
                <input type="number"
                  value={selectedComp.voltage ?? ""}
                  onChange={e => updateComp(selectedComp.id, { voltage: +e.target.value })}
                  style={{ width: "100%", background: "#040d1e", border: "1px solid #0f2040", borderRadius: 4, color: "#fbbf24", fontSize: 11, padding: "4px 7px", outline: "none", boxSizing: "border-box" }}
                />
              </div>
            )}

            {selectedComp.type === "resistor" && (
              <div style={{ marginBottom: 10 }}>
                <div style={{ fontSize: 8, color: "#1e3654", marginBottom: 3 }}>Resistencia (Ω)</div>
                <input type="number"
                  value={selectedComp.resistance ?? ""}
                  onChange={e => updateComp(selectedComp.id, { resistance: +e.target.value })}
                  style={{ width: "100%", background: "#040d1e", border: "1px solid #0f2040", borderRadius: 4, color: "#a78bfa", fontSize: 11, padding: "4px 7px", outline: "none", boxSizing: "border-box" }}
                />
              </div>
            )}

            {selectedComp.type === "luminaire" && (
              <div style={{ marginBottom: 10 }}>
                <div style={{ fontSize: 8, color: "#1e3654", marginBottom: 3 }}>Potencia (W)</div>
                <input type="number"
                  value={selectedComp.power ?? ""}
                  onChange={e => updateComp(selectedComp.id, { power: +e.target.value })}
                  style={{ width: "100%", background: "#040d1e", border: "1px solid #0f2040", borderRadius: 4, color: "#4ade80", fontSize: 11, padding: "4px 7px", outline: "none", boxSizing: "border-box" }}
                />
              </div>
            )}

            {analysis.compValues[selectedComp.id] && analysis.circuitClosed && (
              <div style={{ marginTop: 10, padding: 10, background: "rgba(251,191,36,0.04)", border: "1px solid #78350f", borderRadius: 6 }}>
                <div style={{ fontSize: 7.5, color: "#78350f", marginBottom: 6, letterSpacing: "0.1em" }}>VALORES CALCULADOS</div>
                {[
                  ["V caída", `${analysis.compValues[selectedComp.id].v.toFixed(2)} V`],
                  ["Corriente", `${analysis.compValues[selectedComp.id].i.toFixed(3)} A`],
                  ["Potencia", `${analysis.compValues[selectedComp.id].p.toFixed(2)} W`],
                ].map(([k, v]) => (
                  <div key={k} style={{ display: "flex", justifyContent: "space-between", fontSize: 9.5, padding: "2px 0", color: "#fde68a" }}>
                    <span style={{ color: "#78350f" }}>{k}</span>
                    <span>{v}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        ) : (
          <div style={{ padding: "14px", fontSize: 9.5, color: "#1e3654", lineHeight: 1.9 }}>
            <div style={{ color: "#2a4a70", marginBottom: 6 }}>Sin selección activa</div>
            Selecciona un componente para ver y editar sus propiedades eléctricas
          </div>
        )}

        {/* Clear button */}
        <div style={{ marginTop: "auto", padding: "10px 14px", borderTop: "1px solid #0f2040" }}>
          <button
            onClick={clearAll}
            style={{
              width: "100%", background: "transparent", border: "1px solid #0f2040",
              color: "#1e3654", fontSize: 9, fontFamily: "monospace",
              padding: "7px", borderRadius: 5, cursor: "pointer", letterSpacing: "0.1em",
              transition: "all 0.15s",
            }}
            onMouseEnter={e => { e.currentTarget.style.borderColor = "#ef4444"; e.currentTarget.style.color = "#ef4444"; }}
            onMouseLeave={e => { e.currentTarget.style.borderColor = "#0f2040"; e.currentTarget.style.color = "#1e3654"; }}
          >
            LIMPIAR LIENZO
          </button>
        </div>
      </aside>
    </div>
  );
}





