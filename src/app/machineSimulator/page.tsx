// @ts-nocheck
"use client";

import { useState, useRef, useCallback, useEffect, useMemo } from "react";

// ─── Constants ────────────────────────────────────────────────────────────────
const COMP_W = 72;
const COMP_H = 36;
const PORT_R = 6;
const GRID = 28;

// ─── Palette ──────────────────────────────────────────────────────────────────
const PALETTE = [
  { type: "source_ac",         label: "Fuente AC",          cat: "Alimentación", defaults: { voltage: 120, frequency: 60 } },
  { type: "transformer",       label: "Transformador",      cat: "Núcleo",       defaults: { ratio: 2, efficiency: 0.95, coreType: "shell", ratedVoltage: 120 } },
  { type: "primary_winding",   label: "Dev. Primario",      cat: "Devanados",    defaults: { turns: 200, resistance: 5 } },
  { type: "secondary_winding", label: "Dev. Secundario",    cat: "Devanados",    defaults: { turns: 100, resistance: 2 } },
  { type: "load_resistor",     label: "Carga Resistiva",    cat: "Cargas",       defaults: { resistance: 50 } },
  { type: "voltmeter",         label: "Voltímetro",         cat: "Instrumentos", defaults: { connected: false } },
  { type: "ammeter",           label: "Amperímetro",        cat: "Instrumentos", defaults: { connected: false } },
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
  const strokeCol = active ? "#f59e0b" : "#334155";

  const leads = (
    <>
      <line x1={0} y1={cy} x2={12} y2={cy} stroke={col} strokeWidth={2} />
      <line x1={w - 12} y1={cy} x2={w} y2={cy} stroke={col} strokeWidth={2} />
    </>
  );

  switch (comp.type) {
    case "source_ac":
      return (
        <svg width={w} height={h} viewBox={`0 0 ${w} ${h}`}>
          {leads}
          <circle cx={cx} cy={cy} r={13} fill="none" stroke={strokeCol} strokeWidth={1.5} />
          <path
            d={`M ${cx - 8} ${cy} Q ${cx - 4} ${cy - 7}, ${cx} ${cy} Q ${cx + 4} ${cy + 7}, ${cx + 8} ${cy}`}
            fill="none" stroke={col} strokeWidth={1.8} strokeLinecap="round"
          />
          <text x={cx} y={cy - 16} textAnchor="middle" fontSize={7} fill="#60a5fa">
            {comp.voltage ?? 120}V / {comp.frequency ?? 60}Hz
          </text>
        </svg>
      );

    case "transformer": {
      const ct = comp.coreType ?? "shell";
      return (
        <svg width={w} height={h} viewBox={`0 0 ${w} ${h}`}>
          <line x1={0} y1={cy} x2={14} y2={cy} stroke={col} strokeWidth={2} />
          <line x1={w - 14} y1={cy} x2={w} y2={cy} stroke={col} strokeWidth={2} />
          {/* Primary coil */}
          {[0,1,2].map(i => (
            <path key={`p${i}`}
              d={`M ${14 + i * 7} ${cy} A 3.5 4 0 0 1 ${21 + i * 7} ${cy}`}
              fill="none" stroke={col} strokeWidth={1.8} />
          ))}
          {/* Core lines */}
          {ct === "toroidal" ? (
            <ellipse cx={cx} cy={cy} rx={4} ry={10} fill="none" stroke={active ? "#f59e0b" : "#475569"} strokeWidth={2} />
          ) : (
            <>
              <line x1={cx - 2} y1={cy - 11} x2={cx - 2} y2={cy + 11} stroke={active ? "#f59e0b" : "#475569"} strokeWidth={2.5} />
              <line x1={cx + 2} y1={cy - 11} x2={cx + 2} y2={cy + 11} stroke={active ? "#f59e0b" : "#475569"} strokeWidth={2.5} />
              {ct === "shell" && (
                <>
                  <line x1={cx - 2} y1={cy - 11} x2={cx + 2} y2={cy - 11} stroke={active ? "#f59e0b" : "#475569"} strokeWidth={2} />
                  <line x1={cx - 2} y1={cy + 11} x2={cx + 2} y2={cy + 11} stroke={active ? "#f59e0b" : "#475569"} strokeWidth={2} />
                </>
              )}
            </>
          )}
          {/* Secondary coil */}
          {[0,1,2].map(i => (
            <path key={`s${i}`}
              d={`M ${cx + 7 + i * 7} ${cy} A 3.5 4 0 0 0 ${cx + 14 + i * 7} ${cy}`}
              fill="none" stroke={col} strokeWidth={1.8} />
          ))}
          <text x={cx} y={h - 2} textAnchor="middle" fontSize={6.5} fill="#64748b">
            {comp.ratio ?? 2}:1 · {ct}
          </text>
        </svg>
      );
    }

    case "primary_winding":
      return (
        <svg width={w} height={h} viewBox={`0 0 ${w} ${h}`}>
          {leads}
          {[0,1,2,3,4].map(i => (
            <path key={i}
              d={`M ${14 + i * 9} ${cy} A 4.5 5.5 0 0 1 ${23 + i * 9} ${cy}`}
              fill="none" stroke={col} strokeWidth={1.8} />
          ))}
          <text x={cx} y={cy - 14} textAnchor="middle" fontSize={7} fill="#60a5fa">
            N1={comp.turns ?? 200}
          </text>
        </svg>
      );

    case "secondary_winding":
      return (
        <svg width={w} height={h} viewBox={`0 0 ${w} ${h}`}>
          {leads}
          {[0,1,2,3,4].map(i => (
            <path key={i}
              d={`M ${14 + i * 9} ${cy} A 4.5 5.5 0 0 0 ${23 + i * 9} ${cy}`}
              fill="none" stroke={col} strokeWidth={1.8} />
          ))}
          <text x={cx} y={cy - 14} textAnchor="middle" fontSize={7} fill="#a78bfa">
            N2={comp.turns ?? 100}
          </text>
        </svg>
      );

    case "load_resistor":
      return (
        <svg width={w} height={h} viewBox={`0 0 ${w} ${h}`}>
          {leads}
          <rect x={14} y={cy - 7} width={w - 28} height={14} rx={2}
            fill="none" stroke={active ? "#f59e0b" : "#7c3aed"} strokeWidth={1.5} />
          <polyline
            points={`16,${cy} 20,${cy-5} 26,${cy+5} 32,${cy-5} 38,${cy+5} 44,${cy-5} 50,${cy+5} 56,${cy}`}
            fill="none" stroke={active ? "#f59e0b" : "#a78bfa"} strokeWidth={1.5}
          />
          <text x={cx} y={cy - 10} textAnchor="middle" fontSize={7} fill="#a78bfa">
            {comp.resistance ?? 50}Ω
          </text>
        </svg>
      );

    case "voltmeter":
      return (
        <svg width={w} height={h} viewBox={`0 0 ${w} ${h}`}>
          {leads}
          <circle cx={cx} cy={cy} r={11} fill="none" stroke={active ? "#fbbf24" : "#334155"} strokeWidth={1.5} />
          <text x={cx} y={cy + 4} textAnchor="middle" fontSize={11} fill={active ? "#fbbf24" : "#64748b"} fontWeight="600">V</text>
        </svg>
      );

    case "ammeter":
      return (
        <svg width={w} height={h} viewBox={`0 0 ${w} ${h}`}>
          {leads}
          <circle cx={cx} cy={cy} r={11} fill="none" stroke={active ? "#60a5fa" : "#334155"} strokeWidth={1.5} />
          <text x={cx} y={cy + 4} textAnchor="middle" fontSize={11} fill={active ? "#60a5fa" : "#64748b"} fontWeight="600">A</text>
        </svg>
      );

    default:
      return (
        <svg width={w} height={h} viewBox={`0 0 ${w} ${h}`}>
          {leads}
          <rect x={12} y={cy - 10} width={w - 24} height={20} rx={3} fill="none" stroke="#334155" strokeWidth={1.5} />
        </svg>
      );
  }
}

// ─── Isometric Substation Scene ───────────────────────────────────────────────
function IsometricSubstation({ active = false, saturated = false, shortCircuit = false }) {
  const glow = active ? 1 : 0;
  const accent = shortCircuit ? "#ef4444" : saturated ? "#f59e0b" : "#4ade80";
  const accentDim = shortCircuit ? "rgba(239,68,68,0.15)" : saturated ? "rgba(245,158,11,0.12)" : "rgba(74,222,128,0.08)";

  return (
    <svg viewBox="0 0 900 580" width="100%" height="100%" preserveAspectRatio="xMidYMid meet"
      style={{ position: "absolute", inset: 0 }}>
      <defs>
        <linearGradient id="isoFloor" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#0a1a2e" />
          <stop offset="100%" stopColor="#060f1e" />
        </linearGradient>
        <linearGradient id="isoWallL" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#10213a" />
          <stop offset="100%" stopColor="#080e1c" />
        </linearGradient>
        <linearGradient id="isoWallR" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#152640" />
          <stop offset="100%" stopColor="#0b1528" />
        </linearGradient>
        <linearGradient id="txBody" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#1c3355" />
          <stop offset="100%" stopColor="#0e1e34" />
        </linearGradient>
        <linearGradient id="txTop" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#203d65" />
          <stop offset="100%" stopColor="#162d4e" />
        </linearGradient>
        <radialGradient id="envGlow" cx="50%" cy="40%" r="55%">
          <stop offset="0%" stopColor={`rgba(${active ? "74,222,128" : "59,130,246"},${0.02 + glow * 0.12})`} />
          <stop offset="100%" stopColor="rgba(0,0,0,0)" />
        </radialGradient>
        <filter id="subGlow">
          <feGaussianBlur stdDeviation="3" result="b" />
          <feMerge><feMergeNode in="b" /><feMergeNode in="SourceGraphic" /></feMerge>
        </filter>
        <filter id="subGlow2">
          <feGaussianBlur stdDeviation="1.5" result="b" />
          <feMerge><feMergeNode in="b" /><feMergeNode in="SourceGraphic" /></feMerge>
        </filter>
        <pattern id="isoGrid" width="60" height="34.6" patternUnits="userSpaceOnUse"
          patternTransform="translate(450,320) rotate(-30) scale(1,0.577)">
          <rect width="60" height="34.6" fill="none" stroke="#1a2e48" strokeWidth="0.5" opacity="0.4" />
        </pattern>
        <marker id="arrowHV" markerWidth="6" markerHeight="6" refX="5" refY="3" orient="auto">
          <path d="M0,0 L6,3 L0,6 Z" fill={accent} opacity="0.7" />
        </marker>
      </defs>

      {/* ─── ROOM ─── */}
      <polygon points="450,120 770,300 450,480 130,300" fill="url(#isoFloor)" stroke="#1e3a5f" strokeWidth="1.5" />
      <polygon points="450,120 770,300 450,480 130,300" fill="url(#isoGrid)" opacity="0.3" />
      <polygon points="450,120 770,300 450,480 130,300" fill="url(#envGlow)" />

      {/* Left wall */}
      <polygon points="130,50 450,50 450,120 130,300" fill="url(#isoWallL)" stroke="#1e3a5f" strokeWidth="1.5" />
      {[1,2,3,4].map(i => (
        <line key={`wlh${i}`} x1={130} y1={50 + 250*i/5} x2={450} y2={50 + 70*i/5}
          stroke="#1a2e48" strokeWidth="0.4" opacity="0.3" />
      ))}

      {/* Right wall */}
      <polygon points="450,50 770,50 770,300 450,120" fill="url(#isoWallR)" stroke="#1e3a5f" strokeWidth="1.5" />
      {[1,2,3].map(i => (
        <line key={`wrh${i}`} x1={450} y1={50 + 250*i/4} x2={770} y2={50 + 250*i/4}
          stroke="#1a2e48" strokeWidth="0.4" opacity="0.25" />
      ))}

      {/* Ceiling */}
      <line x1={450} y1={50} x2={450} y2={120} stroke="#2a4060" strokeWidth="2" opacity="0.7" />
      <line x1={130} y1={50} x2={130} y2={300} stroke="#1e3050" strokeWidth="1.5" opacity="0.6" />
      <line x1={770} y1={50} x2={770} y2={300} stroke="#1e3050" strokeWidth="1.5" opacity="0.6" />

      {/* ─── HV TOWER (left wall) ─── */}
      {/* Tower legs */}
      <polygon points="180,80 200,70 200,180 180,190" fill="#0a1828" stroke="#1e3a5f" strokeWidth="1" />
      <polygon points="200,70 220,60 220,170 200,180" fill="#0c1e38" stroke="#1e3a5f" strokeWidth="1" />
      <polygon points="180,80 220,60 240,70 200,90" fill="#102030" stroke="#1e3a5f" strokeWidth="1" />
      {/* Tower crossarms */}
      {[0,1,2].map(i => (
        <line key={`arm${i}`} x1={170} y1={90 + i*28} x2={250} y2={65 + i*22}
          stroke="#1e3a5f" strokeWidth="2" />
      ))}
      {/* Insulators */}
      {[0,1,2].map(i => (
        <g key={`ins${i}`}>
          <ellipse cx={172} cy={90 + i*28} rx={4} ry={3} fill="#0a1828" stroke={active ? accent : "#2a4060"} strokeWidth="1" />
          <ellipse cx={248} cy={65 + i*22} rx={4} ry={3} fill="#0a1828" stroke={active ? accent : "#2a4060"} strokeWidth="1" />
        </g>
      ))}
      {/* HV cables entering from left */}
      {active && [0,1,2].map(i => (
        <path key={`hvcable${i}`}
          d={`M 130,${90 + i*28} Q 155,${90 + i*28} 172,${90 + i*28}`}
          fill="none" stroke={accent} strokeWidth={1.5} opacity="0.6"
          strokeDasharray="4,3"
          style={{ animation: "cableFlow 1.2s linear infinite" }} />
      ))}

      {/* ─── MAIN TRANSFORMER (center) ─── */}
      {/* Pedestal */}
      <polygon points="340,380 500,380 500,420 340,420" fill="#0a1628" stroke="#1e3654" strokeWidth="1.2" />
      <polygon points="340,380 500,380 520,365 360,365" fill="#0e1e38" stroke="#1e3654" strokeWidth="1.2" />
      <polygon points="500,380 520,365 520,405 500,420" fill="#091528" stroke="#1e3654" strokeWidth="1" />

      {/* Transformer body */}
      <polygon points="330,220 510,220 510,380 330,380" fill="url(#txBody)" stroke="#1e3654" strokeWidth="1.5" />
      <polygon points="330,220 510,220 530,205 350,205" fill="url(#txTop)" stroke="#2a4a6e" strokeWidth="1.5" />
      <polygon points="510,220 530,205 530,365 510,380" fill="#0c1a30" stroke="#1e3654" strokeWidth="1" />

      {/* Cooling fins */}
      {[0,1,2,3].map(i => (
        <g key={`fin${i}`}>
          <rect x={340 + i*28} y={240} width={12} height={120} rx={2}
            fill={active ? "rgba(74,222,128,0.05)" : "#0a1628"} stroke="#1e3654" strokeWidth="0.8" />
        </g>
      ))}
      {[0,1,2,3].map(i => (
        <g key={`finr${i}`}>
          <rect x={450 + i*12} y={230} width={10} height={110} rx={2}
            fill={active ? "rgba(74,222,128,0.04)" : "#080e1e"} stroke="#162030" strokeWidth="0.8" />
        </g>
      ))}

      {/* Bushings HV (top, left side) */}
      {[0,1,2].map(i => (
        <g key={`busHV${i}`}>
          <rect x={350 + i*22} y={175} width={10} height={45} rx={3}
            fill="#0a1830" stroke={active ? accent : "#1e3654"} strokeWidth={1.2} />
          <ellipse cx={355 + i*22} cy={175} rx={6} ry={4}
            fill={active ? accentDim : "#080e1e"} stroke={active ? accent : "#1e3654"} strokeWidth={1} />
          {active && <circle cx={355 + i*22} cy={174} r={3} fill={accent}
            style={{ filter: "url(#subGlow2)", animation: "blink 1.5s infinite" }} />}
        </g>
      ))}

      {/* Bushings LV (top, right side) */}
      {[0,1].map(i => (
        <g key={`busLV${i}`}>
          <rect x={448 + i*20} y={180} width={10} height={35} rx={3}
            fill="#0a1830" stroke={active ? "#60a5fa" : "#1e3654"} strokeWidth={1.2} />
          <ellipse cx={453 + i*20} cy={180} rx={5} ry={3}
            fill={active ? "rgba(96,165,250,0.15)" : "#080e1e"} stroke={active ? "#60a5fa" : "#1e3654"} strokeWidth={1} />
          {active && <circle cx={453 + i*20} cy={179} r={2.5} fill="#60a5fa"
            style={{ filter: "url(#subGlow2)" }} />}
        </g>
      ))}

      {/* Transformer nameplate */}
      <rect x={360} y={290} width={100} height={50} rx={2}
        fill="#040c1a" stroke="#1e3654" strokeWidth="1" />
      <text x={410} y={310} textAnchor="middle" fontSize={7} fill="#3b82f6" opacity="0.8">TRANSFORMADOR</text>
      <text x={410} y={322} textAnchor="middle" fontSize={6.5} fill="#1e3654">HV · LV</text>
      <text x={410} y={334} textAnchor="middle" fontSize={6} fill="#1e3654">50/60 Hz</text>

      {/* Status LED on nameplate */}
      <circle cx={448} cy={296} r={3.5}
        fill={active ? (shortCircuit ? "#ef4444" : saturated ? "#f59e0b" : "#4ade80") : "#1e3654"}
        style={active ? { filter: "url(#subGlow2)", animation: shortCircuit ? "blink 0.4s infinite" : "blink 2s infinite" } : {}} />

      {/* ─── HV CABLES: tower to transformer ─── */}
      {[0,1,2].map(i => (
        <path key={`hvlink${i}`}
          d={`M 248,${67 + i*22} Q 280,${90 + i*15} 310,${185 + i*8}`}
          fill="none" stroke={active ? accent : "#1e3050"} strokeWidth={active ? 2 : 1.5}
          strokeLinecap="round" opacity={active ? 0.7 : 0.4}
          strokeDasharray={active ? "5,3" : "none"}
          style={active ? { animation: "cableFlow 1s linear infinite" } : {}} />
      ))}

      {/* ─── LV CABLES: transformer to distribution panel ─── */}
      {active && [0,1].map(i => (
        <path key={`lvlink${i}`}
          d={`M ${460 + i*18},185 Q ${530 + i*10},${180 + i*12} ${600},${200 + i*20}`}
          fill="none" stroke="#60a5fa" strokeWidth={2}
          strokeLinecap="round" opacity="0.6"
          strokeDasharray="5,3"
          style={{ animation: "cableFlow 1.3s linear infinite" }} />
      ))}

      {/* ─── DISTRIBUTION PANEL (right wall) ─── */}
      <polygon points="610,160 690,120 690,280 610,320" fill="#08121e" stroke="#1e3a5f" strokeWidth="1.5" />
      <polygon points="610,160 690,120 700,125 620,165" fill="#0c1a2e" stroke="#1e3a5f" strokeWidth="1" />
      <text x={640} y={195} fontSize={7} fill="#60a5fa" opacity="0.8" transform="rotate(-20,640,195)">DISTRIBUCIÓN</text>
      {[0,1,2,3,4].map(i => (
        <g key={`cb${i}`}>
          <polygon
            points={`618,${175+i*18} 680,${145+i*18} 680,${158+i*18} 618,${188+i*18}`}
            fill={active ? "rgba(96,165,250,0.12)" : "rgba(20,30,50,0.8)"}
            stroke={active ? "#2563eb" : "#1e3a5f"} strokeWidth="0.8" />
          <circle cx={624} cy={181+i*18} r={2.5}
            fill={active && i%2===0 ? "#4ade80" : active ? "#60a5fa" : "#1e3654"}
            style={active ? { filter: "url(#subGlow2)" } : {}} />
        </g>
      ))}
      {/* Panel LED */}
      <circle cx={688} cy={122} r={3}
        fill={active ? "#4ade80" : "#ef4444"}
        style={active ? { filter: "url(#subGlow)" } : {}} />

      {/* ─── OIL CONSERVATOR TANK (top of transformer) ─── */}
      <ellipse cx={420} cy={197} rx={30} ry={9}
        fill="#0e1e34" stroke="#1e3a5f" strokeWidth="1.2" />
      <rect x={400} y={180} width={40} height={18} rx={3}
        fill="#0c1a30" stroke="#1e3a5f" strokeWidth="1.2" />
      <ellipse cx={420} cy={180} rx={30} ry={9}
        fill="#112030" stroke="#2a3e58" strokeWidth="1.2" />
      {/* Oil level indicator */}
      <rect x={425} y={183} width={3} height={10} rx={1}
        fill={active ? (saturated ? "#f59e0b" : "#4ade80") : "#1e3654"} />

      {/* ─── BUCHHOLZ RELAY ─── */}
      <circle cx={380} cy={193} r={7} fill="#0a1828" stroke="#2563eb" strokeWidth="1.2" />
      <text x={380} y={196} textAnchor="middle" fontSize={5} fill="#3b82f6" opacity="0.9">B</text>

      {/* ─── FLOOR ACCENTS ─── */}
      <polyline points="130,300 450,480 770,300" fill="none" stroke="#1e3a5f" strokeWidth="2" opacity="0.5" />
      <line x1={130} y1={300} x2={450} y2={480} stroke="#203450" strokeWidth="2.5" opacity="0.5" />
      <line x1={450} y1={480} x2={770} y2={300} stroke="#203450" strokeWidth="2.5" opacity="0.4" />

      {/* Ground straps */}
      <path d="M 340,380 Q 310,430 280,440" fill="none" stroke="#1e3654" strokeWidth="1.5" strokeDasharray="3,2" />
      <path d="M 510,380 Q 540,430 570,440" fill="none" stroke="#1e3654" strokeWidth="1.5" strokeDasharray="3,2" />
      {/* Ground symbols */}
      {[[280,440],[570,440]].map(([gx,gy],i) => (
        <g key={`gnd${i}`}>
          <line x1={gx-8} y1={gy} x2={gx+8} y2={gy} stroke="#1e3654" strokeWidth="1.5" />
          <line x1={gx-5} y1={gy+4} x2={gx+5} y2={gy+4} stroke="#1e3654" strokeWidth="1.2" />
          <line x1={gx-2} y1={gy+8} x2={gx+2} y2={gy+8} stroke="#1e3654" strokeWidth="1" />
        </g>
      ))}

      {/* ─── SATURATION SPARKS ─── */}
      {saturated && (
        <g style={{ animation: "blink 0.5s infinite" }}>
          {[[360,210],[400,205],[445,208]].map(([sx,sy],i) => (
            <g key={`spark${i}`}>
              <line x1={sx} y1={sy-8} x2={sx-4} y2={sy} stroke="#f59e0b" strokeWidth="1.5" />
              <line x1={sx-4} y1={sy} x2={sx+3} y2={sy+5} stroke="#f59e0b" strokeWidth="1.5" />
            </g>
          ))}
        </g>
      )}

      {/* ─── SHORT CIRCUIT ARCS ─── */}
      {shortCircuit && (
        <g style={{ animation: "blink 0.2s infinite" }}>
          {[[455,210],[472,213]].map(([ax,ay],i) => (
            <path key={`arc${i}`}
              d={`M ${ax} ${ay} Q ${ax+8} ${ay-12} ${ax+16} ${ay}`}
              fill="none" stroke="#ef4444" strokeWidth={2} opacity="0.9" />
          ))}
        </g>
      )}
    </svg>
  );
}

// ─── B-H Curve SVG ────────────────────────────────────────────────────────────
function BHCurve({ saturated = false, v1 = 120, ratedV = 120 }) {
  const ratio = v1 / Math.max(ratedV, 1);
  // Normal path and saturated path
  const w = 200, h = 120;
  const cx = 30, cy = h - 20;
  // Generate curve points
  const pts = [];
  for (let i = 0; i <= 40; i++) {
    const h_val = (i / 40) * 2.5;
    let b;
    if (saturated) {
      b = Math.tanh(h_val * 1.5) * 0.85 + (h_val > 1.8 ? (h_val - 1.8) * 0.05 : 0);
    } else {
      b = Math.tanh(h_val * 2.5) * 0.9;
    }
    pts.push({ x: cx + h_val * 56, y: cy - b * (h - 40) });
  }
  const pathD = pts.map((p, i) => `${i === 0 ? "M" : "L"} ${p.x.toFixed(1)} ${p.y.toFixed(1)}`).join(" ");

  // Operating point marker
  const opH = Math.min(ratio * 1.2, 2.4);
  let opB;
  if (saturated) {
    opB = Math.tanh(opH * 1.5) * 0.85 + (opH > 1.8 ? (opH - 1.8) * 0.05 : 0);
  } else {
    opB = Math.tanh(opH * 2.5) * 0.9;
  }
  const opX = cx + opH * 56;
  const opY = cy - opB * (h - 40);

  return (
    <svg width={w} height={h} viewBox={`0 0 ${w} ${h}`}>
      {/* Axes */}
      <line x1={cx} y1={10} x2={cx} y2={cy} stroke="#1e3a5f" strokeWidth="1" />
      <line x1={cx} y1={cy} x2={w - 10} y2={cy} stroke="#1e3a5f" strokeWidth="1" />
      <text x={cx + 2} y={14} fontSize={8} fill="#3b82f6">B</text>
      <text x={w - 12} y={cy - 2} fontSize={8} fill="#3b82f6">H</text>
      {/* Saturation label */}
      {saturated && <text x={cx + 100} y={24} fontSize={7} fill="#f59e0b">SATURADO</text>}
      {/* Curve */}
      <path d={pathD} fill="none" stroke={saturated ? "#f59e0b" : "#4ade80"} strokeWidth="2" strokeLinecap="round" />
      {/* Linear reference */}
      <line x1={cx} y1={cy} x2={cx + 120} y2={cy - 90}
        stroke="#1e3654" strokeWidth="1" strokeDasharray="3,2" />
      {/* Operating point */}
      <circle cx={opX} cy={opY} r={4}
        fill={saturated ? "#f59e0b" : "#4ade80"}
        style={{ filter: saturated ? "drop-shadow(0 0 3px #f59e0b)" : "drop-shadow(0 0 3px #4ade80)" }} />
      <line x1={opX} y1={opY} x2={opX} y2={cy} stroke="#94a3b8" strokeWidth="0.8" strokeDasharray="2,2" />
      <line x1={cx} y1={opY} x2={opX} y2={opY} stroke="#94a3b8" strokeWidth="0.8" strokeDasharray="2,2" />
    </svg>
  );
}

// ─── Circuit Hook ─────────────────────────────────────────────────────────────
function useCircuit() {
  const [components, setComponents] = useState([]);
  const [wires, setWires] = useState([]);
  const [selectedId, setSelectedId] = useState(null);
  const [pendingPort, setPendingPort] = useState(null);
  const [pendingStart, setPendingStart] = useState(null);
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });
  const [faultMode, setFaultMode] = useState(null); // null | "open" | "short"
  const containerRef = useRef(null);

  const selectedComp = components.find(c => c.id === selectedId) ?? null;

  const analysis = useMemo(() => {
    const source = components.find(c => c.type === "source_ac");
    const transformer = components.find(c => c.type === "transformer");
    const load = components.find(c => c.type === "load_resistor");
    const primW = components.find(c => c.type === "primary_winding");
    const secW = components.find(c => c.type === "secondary_winding");

    if (!source || !transformer) {
      return {
        circuitClosed: false, V1: 0, V2: 0, I1: 0, I2: 0, S: 0, P: 0, Pcore: 0,
        ratio: 2, efficiency: 0.95, saturated: false, shortCircuit: false,
      };
    }

    const V1 = source.voltage ?? 120;
    const ratio = transformer.ratio ?? 2;
    const efficiency = transformer.efficiency ?? 0.95;
    const ratedVoltage = transformer.ratedVoltage ?? 120;
    const saturated = V1 > ratedVoltage * 1.2;

    // Fault overrides
    const effectiveFault = faultMode;

    if (effectiveFault === "open" || (!load && wires.length < 2)) {
      return {
        circuitClosed: false, V1, V2: V1 / ratio, I1: 0, I2: 0, S: 0, P: 0,
        Pcore: V1 * 0.001, ratio, efficiency, saturated, shortCircuit: false,
        noLoad: true,
      };
    }

    const R_load = effectiveFault === "short" ? 0.01 : (load?.resistance ?? 50);
    const shortCircuit = R_load < 1;
    const circuitClosed = wires.length >= 2 || components.length >= 2;

    const V2 = V1 / ratio;
    const I2 = V2 / Math.max(R_load, 0.01);
    const I1 = (I2 / ratio) / efficiency;
    const S = V1 * I1;
    const P = S * efficiency;
    const Pcore = S * (1 - efficiency);

    return { circuitClosed, V1, V2, I1, I2, S, P, Pcore, ratio, efficiency, saturated, shortCircuit };
  }, [components, wires, faultMode]);

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
    const newComp = { id: uid(), type, x, y, label: `${type.split("_").map(s => s[0].toUpperCase()).join("")}${components.length + 1}`, ...(item?.defaults ?? {}) };
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

  const handleCompDblClick = useCallback((compId, e) => {
    e.stopPropagation();
    setComponents(prev => prev.map(c => {
      if (c.id !== compId || c.type !== "transformer") return c;
      const cycle = { shell: "core", core: "toroidal", toroidal: "shell" };
      return { ...c, coreType: cycle[c.coreType ?? "shell"] };
    }));
  }, []);

  const deleteComponent = useCallback((id) => {
    setComponents(prev => prev.filter(c => c.id !== id));
    setWires(prev => prev.filter(w => w.fromCompId !== id && w.toCompId !== id));
    setSelectedId(null);
  }, []);

  const deleteWire = useCallback((id) => setWires(prev => prev.filter(w => w.id !== id)), []);

  const updateComp = useCallback((id, updates) => {
    setComponents(prev => prev.map(c => c.id === id ? { ...c, ...updates } : c));
  }, []);

  const clearAll = useCallback(() => {
    setComponents([]); setWires([]); setSelectedId(null); setFaultMode(null);
  }, []);

  useEffect(() => {
    const handler = (e) => { if (e.key === "Escape") { setPendingPort(null); setPendingStart(null); } };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, []);

  return {
    components, wires, selectedId, selectedComp, pendingPort, mousePos, analysis,
    pendingStart, containerRef, portPos, handleCanvasDrop, handleMouseMove,
    handleCanvasClick, handlePortClick, handleCompMouseDown, handleCompDblClick,
    deleteComponent, deleteWire, updateComp, clearAll, getPorts, faultMode, setFaultMode,
  };
}

// ─── Right Panel ──────────────────────────────────────────────────────────────
function RightPanel({ analysis, selectedComp, updateComp, faultMode, setFaultMode }) {
  const [tab, setTab] = useState("analysis");

  const transformer = selectedComp?.type === "transformer" ? selectedComp : null;

  const statusColor = analysis.shortCircuit ? "#ef4444"
    : analysis.saturated ? "#f59e0b"
    : analysis.circuitClosed ? "#4ade80"
    : "#3b82f6";

  const fmt = (n, d = 2) => isFinite(n) ? n.toFixed(d) : "∞";

  return (
    <aside style={{
      width: 260, background: "#020916",
      borderLeft: "1px solid #0f2040",
      display: "flex", flexDirection: "column",
      overflowY: "auto", flexShrink: 0,
    }}>
      {/* Status */}
      <div style={{ padding: "12px 14px", borderBottom: "1px solid #0f2040" }}>
        <div style={{
          display: "flex", alignItems: "center", gap: 8,
          padding: "6px 10px", borderRadius: 8,
          background: `${statusColor}12`,
          border: `1px solid ${statusColor}40`,
        }}>
          <span style={{
            width: 7, height: 7, borderRadius: "50%",
            background: statusColor, display: "inline-block",
            animation: analysis.circuitClosed ? (analysis.shortCircuit ? "blink 0.3s infinite" : "blink 2s infinite") : "none",
          }} />
          <span style={{ fontSize: 9, color: statusColor, letterSpacing: "0.12em", fontWeight: 700 }}>
            {analysis.shortCircuit ? "CORTOCIRCUITO" : analysis.saturated ? "SATURACIÓN" : analysis.circuitClosed ? "EN SERVICIO" : "SIN CARGA"}
          </span>
        </div>
      </div>

      {/* Tabs */}
      <div style={{ display: "flex", borderBottom: "1px solid #0f2040" }}>
        {["analysis", "params", "bh", "faults"].map(t => (
          <button key={t} onClick={() => setTab(t)} style={{
            flex: 1, padding: "7px 2px", fontSize: 8, border: "none", cursor: "pointer",
            background: tab === t ? "rgba(59,130,246,0.1)" : "transparent",
            color: tab === t ? "#60a5fa" : "#2a4a70",
            borderBottom: tab === t ? "2px solid #3b82f6" : "2px solid transparent",
            letterSpacing: "0.08em", transition: "all 0.15s",
          }}>
            {t === "analysis" ? "ANÁLISIS" : t === "params" ? "PARÁMETROS" : t === "bh" ? "CURVA B-H" : "FALLAS"}
          </button>
        ))}
      </div>

      <div style={{ flex: 1, overflowY: "auto" }}>

        {/* ── ANALYSIS TAB ── */}
        {tab === "analysis" && (
          <div style={{ padding: "12px 14px", animation: "fadeIn 0.2s ease" }}>
            {[
              { label: "V Primario",    value: fmt(analysis.V1),    unit: "V",  color: "#fbbf24" },
              { label: "V Secundario",  value: fmt(analysis.V2),    unit: "V",  color: "#fbbf24" },
              { label: "I Primario",    value: fmt(analysis.I1, 3), unit: "A",  color: "#60a5fa" },
              { label: "I Secundario",  value: fmt(analysis.I2, 3), unit: "A",  color: "#60a5fa" },
              { label: "S Aparente",    value: fmt(analysis.S),     unit: "VA", color: "#4ade80" },
              { label: "P Activa",      value: fmt(analysis.P),     unit: "W",  color: "#4ade80" },
              { label: "Pérdidas",      value: fmt(analysis.Pcore), unit: "W",  color: "#f87171" },
              { label: "Rendimiento",   value: (analysis.efficiency * 100).toFixed(1), unit: "%", color: "#a78bfa" },
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

            <div style={{ marginTop: 12, padding: 10, background: "rgba(59,130,246,0.04)", border: "1px solid #0f2040", borderRadius: 6 }}>
              <div style={{ fontSize: 7.5, color: "#2a4a70", marginBottom: 6, letterSpacing: "0.1em" }}>RELACIÓN DE TRANSFORMACIÓN</div>
              <div style={{ fontSize: 11, color: "#60a5fa", fontWeight: 700 }}>a = {fmt(analysis.ratio, 3)}</div>
              <div style={{ fontSize: 8.5, color: "#1e3654", marginTop: 4 }}>V2 = V1 / a = {fmt(analysis.V2)}</div>
            </div>
          </div>
        )}

        {/* ── PARAMS TAB ── */}
        {tab === "params" && (
          <div style={{ padding: "12px 14px", animation: "fadeIn 0.2s ease" }}>
            {transformer ? (
              <>
                <div style={{ fontSize: 8, color: "#2a4a70", marginBottom: 10, letterSpacing: "0.1em" }}>TRANSFORMADOR SELECCIONADO</div>

                {[
                  { key: "ratio", label: "Relación a (N1/N2)", color: "#60a5fa", min: 0.1, max: 20, step: 0.1 },
                  { key: "efficiency", label: "Eficiencia (0–1)", color: "#4ade80", min: 0.5, max: 1, step: 0.01 },
                  { key: "ratedVoltage", label: "V nominal (V)", color: "#fbbf24", min: 10, max: 1000, step: 10 },
                ].map(({ key, label, color, min, max, step }) => (
                  <div key={key} style={{ marginBottom: 12 }}>
                    <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 3 }}>
                      <span style={{ fontSize: 8, color: "#1e3654" }}>{label}</span>
                      <span style={{ fontSize: 9, color, fontWeight: 700 }}>{transformer[key]}</span>
                    </div>
                    <input type="range" min={min} max={max} step={step}
                      value={transformer[key] ?? min}
                      onChange={e => updateComp(transformer.id, { [key]: +e.target.value })}
                      style={{ width: "100%", accentColor: color }} />
                  </div>
                ))}

                <div style={{ marginBottom: 12 }}>
                  <div style={{ fontSize: 8, color: "#1e3654", marginBottom: 6 }}>Tipo de Núcleo</div>
                  <div style={{ display: "flex", gap: 4 }}>
                    {["shell", "core", "toroidal"].map(ct => (
                      <button key={ct} onClick={() => updateComp(transformer.id, { coreType: ct })}
                        style={{
                          flex: 1, padding: "5px 2px", fontSize: 8, border: "1px solid",
                          borderColor: transformer.coreType === ct ? "#3b82f6" : "#0f2040",
                          background: transformer.coreType === ct ? "rgba(59,130,246,0.15)" : "transparent",
                          color: transformer.coreType === ct ? "#60a5fa" : "#2a4a70",
                          borderRadius: 4, cursor: "pointer",
                        }}>{ct}</button>
                    ))}
                  </div>
                </div>
              </>
            ) : selectedComp?.type === "load_resistor" ? (
              <div>
                <div style={{ fontSize: 8, color: "#2a4a70", marginBottom: 8, letterSpacing: "0.1em" }}>CARGA RESISTIVA</div>
                <div style={{ marginBottom: 3 }}>
                  <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 3 }}>
                    <span style={{ fontSize: 8, color: "#1e3654" }}>Resistencia (Ω)</span>
                    <span style={{ fontSize: 9, color: "#a78bfa", fontWeight: 700 }}>{selectedComp.resistance}</span>
                  </div>
                  <input type="range" min={1} max={500} step={1}
                    value={selectedComp.resistance ?? 50}
                    onChange={e => updateComp(selectedComp.id, { resistance: +e.target.value })}
                    style={{ width: "100%", accentColor: "#a78bfa" }} />
                </div>
              </div>
            ) : selectedComp?.type === "source_ac" ? (
              <div>
                <div style={{ fontSize: 8, color: "#2a4a70", marginBottom: 8, letterSpacing: "0.1em" }}>FUENTE AC</div>
                <div style={{ marginBottom: 12 }}>
                  <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 3 }}>
                    <span style={{ fontSize: 8, color: "#1e3654" }}>Voltaje (V)</span>
                    <span style={{ fontSize: 9, color: "#fbbf24", fontWeight: 700 }}>{selectedComp.voltage}</span>
                  </div>
                  <input type="range" min={10} max={500} step={5}
                    value={selectedComp.voltage ?? 120}
                    onChange={e => updateComp(selectedComp.id, { voltage: +e.target.value })}
                    style={{ width: "100%", accentColor: "#fbbf24" }} />
                </div>
                <div>
                  <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 3 }}>
                    <span style={{ fontSize: 8, color: "#1e3654" }}>Frecuencia (Hz)</span>
                    <span style={{ fontSize: 9, color: "#60a5fa", fontWeight: 700 }}>{selectedComp.frequency}</span>
                  </div>
                  <input type="range" min={50} max={60} step={10}
                    value={selectedComp.frequency ?? 60}
                    onChange={e => updateComp(selectedComp.id, { frequency: +e.target.value })}
                    style={{ width: "100%", accentColor: "#60a5fa" }} />
                </div>
              </div>
            ) : (
              <div style={{ fontSize: 9.5, color: "#1e3654", lineHeight: 1.8 }}>
                <div style={{ color: "#2a4a70", marginBottom: 4 }}>Sin componente seleccionado</div>
                Selecciona un transformador, fuente o carga para editar sus parámetros.
              </div>
            )}

            {/* Formulas */}
            <div style={{ marginTop: 16, padding: 10, background: "rgba(15,32,64,0.5)", border: "1px solid #0f2040", borderRadius: 6 }}>
              <div style={{ fontSize: 7.5, color: "#2a4a70", marginBottom: 6, letterSpacing: "0.08em" }}>FÓRMULAS</div>
              {["a = N₁/N₂", "V₂ = V₁/a", "I₁ = I₂/a", "S = V₁·I₁", "P = S·η", "P_c = S·(1-η)"].map(f => (
                <div key={f} style={{ fontSize: 9, color: "#1e3654", padding: "1px 0" }}>{f}</div>
              ))}
            </div>
          </div>
        )}

        {/* ── B-H CURVE TAB ── */}
        {tab === "bh" && (
          <div style={{ padding: "12px 14px", animation: "fadeIn 0.2s ease" }}>
            <div style={{ fontSize: 8, color: "#2a4a70", marginBottom: 10, letterSpacing: "0.1em" }}>CURVA DE MAGNETIZACIÓN</div>
            <div style={{ background: "rgba(5,10,25,0.8)", border: "1px solid #0f2040", borderRadius: 6, padding: 8 }}>
              <BHCurve saturated={analysis.saturated}
                v1={analysis.V1}
                ratedV={analysis.circuitClosed ? analysis.V1 / (analysis.saturated ? 1.3 : 1) : 120} />
            </div>
            <div style={{ marginTop: 10, fontSize: 8.5, color: "#1e3654", lineHeight: 1.8 }}>
              <div style={{ color: analysis.saturated ? "#f59e0b" : "#4ade80", marginBottom: 4 }}>
                Estado: {analysis.saturated ? "⚠ Núcleo saturado" : "✓ Zona lineal"}
              </div>
              <div>El punto de operación indica la región B-H actual del núcleo.</div>
              {analysis.saturated && <div style={{ color: "#f59e0b", marginTop: 4 }}>V₁ &gt; 1.2·V_nominal → saturación</div>}
            </div>
          </div>
        )}

        {/* ── FAULTS TAB ── */}
        {tab === "faults" && (
          <div style={{ padding: "12px 14px", animation: "fadeIn 0.2s ease" }}>
            <div style={{ fontSize: 8, color: "#2a4a70", marginBottom: 12, letterSpacing: "0.1em" }}>SIMULACIÓN DE FALLAS</div>

            {[
              { mode: "open",  label: "Circuito abierto secundario", color: "#f59e0b", desc: "Simula falla de aislamiento / circuito abierto en el secundario." },
              { mode: "short", label: "Cortocircuito secundario",    color: "#ef4444", desc: "Cortocircuita el devanado secundario — corriente máxima." },
            ].map(({ mode, label, color, desc }) => (
              <div key={mode} style={{ marginBottom: 12 }}>
                <button
                  onClick={() => setFaultMode(faultMode === mode ? null : mode)}
                  style={{
                    width: "100%", padding: "8px 10px", border: `1px solid ${faultMode === mode ? color : "#0f2040"}`,
                    background: faultMode === mode ? `${color}18` : "transparent",
                    color: faultMode === mode ? color : "#2a4a70",
                    fontSize: 9.5, borderRadius: 5, cursor: "pointer", textAlign: "left",
                    transition: "all 0.15s",
                  }}
                >
                  {faultMode === mode ? "■ " : "▶ "}{label}
                </button>
                <div style={{ fontSize: 8, color: "#1e3654", marginTop: 4, paddingLeft: 2, lineHeight: 1.6 }}>{desc}</div>
              </div>
            ))}

            <button
              onClick={() => setFaultMode(null)}
              style={{
                width: "100%", padding: "7px", border: "1px solid #0f2040",
                background: "transparent", color: "#4ade80", fontSize: 9,
                borderRadius: 5, cursor: "pointer", marginTop: 4,
                transition: "all 0.15s",
              }}
            >
              ↺ Reset fallas
            </button>

            {faultMode && (
              <div style={{
                marginTop: 12, padding: 10,
                background: faultMode === "short" ? "rgba(239,68,68,0.08)" : "rgba(245,158,11,0.08)",
                border: `1px solid ${faultMode === "short" ? "#ef4444" : "#f59e0b"}40`,
                borderRadius: 6,
              }}>
                <div style={{ fontSize: 8, color: faultMode === "short" ? "#ef4444" : "#f59e0b", marginBottom: 4 }}>
                  FALLA ACTIVA
                </div>
                {faultMode === "short" ? (
                  <div style={{ fontSize: 8.5, color: "#1e3654", lineHeight: 1.7 }}>
                    I₂ → ∞, I₁ → ∞<br />
                    Peligro de daño térmico en bobinados.
                  </div>
                ) : (
                  <div style={{ fontSize: 8.5, color: "#1e3654", lineHeight: 1.7 }}>
                    I₂ = 0, S ≈ 0<br />
                    Solo corriente de magnetización.
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Clear */}
      <div style={{ padding: "10px 14px", borderTop: "1px solid #0f2040" }}>
        <button
          onClick={() => {}} // handled by parent via clearAll
          id="clearBtn"
          style={{
            width: "100%", background: "transparent", border: "1px solid #0f2040",
            color: "#1e3654", fontSize: 9, fontFamily: "monospace",
            padding: "7px", borderRadius: 5, cursor: "pointer", letterSpacing: "0.1em",
          }}
        >
          LIMPIAR LIENZO
        </button>
      </div>
    </aside>
  );
}

// ─── Main App ─────────────────────────────────────────────────────────────────
export default function App() {
  const circuit = useCircuit();
  const {
    components, wires, selectedId, selectedComp, pendingPort, mousePos,
    analysis, pendingStart, containerRef, portPos, handleCanvasDrop,
    handleMouseMove, handleCanvasClick, handlePortClick, handleCompMouseDown,
    handleCompDblClick, deleteComponent, deleteWire, updateComp, clearAll,
    getPorts, faultMode, setFaultMode,
  } = circuit;

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
        .pal-item:hover { background: rgba(74,222,128,0.06) !important; border-color: #1e5040 !important; }
        .port-dot:hover { transform: scale(1.6); }
        input[type=range]{-webkit-appearance:none;height:3px;border-radius:2px;outline:none;background:#0f2040}
        input[type=range]::-webkit-slider-thumb{-webkit-appearance:none;width:12px;height:12px;border-radius:50%;background:#3b82f6;cursor:pointer}
        #clearBtn:hover { border-color: #ef4444 !important; color: #ef4444 !important; }
      `}</style>

      {/* ══ LEFT SIDEBAR ══ */}
      <aside style={{
        width: 200, background: "#020916",
        borderRight: "1px solid #0f2040",
        display: "flex", flexDirection: "column",
        overflowY: "auto", flexShrink: 0,
      }}>
        <div style={{ padding: "14px 14px 10px", borderBottom: "1px solid #0f2040" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4 }}>
            <div style={{
              width: 28, height: 28, borderRadius: 6,
              background: "rgba(74,222,128,0.1)",
              border: "1px solid rgba(74,222,128,0.25)",
              display: "flex", alignItems: "center", justifyContent: "center",
              fontSize: 14,
            }}>⚡</div>
            <div>
              <div style={{ fontSize: 9, fontWeight: 700, color: "#4ade80", letterSpacing: "0.18em" }}>
                TRANSFORMER
              </div>
              <div style={{ fontSize: 7, color: "#1e3654", letterSpacing: "0.1em" }}>
                LAB · IEC 60076
              </div>
            </div>
          </div>
          <div style={{ fontSize: 7, color: "#1e3654", lineHeight: 1.6, marginTop: 4 }}>
            Arrastra → Lienzo · Click puerto para conectar
          </div>
        </div>

        {["Alimentación", "Núcleo", "Devanados", "Cargas", "Instrumentos"].map(cat => {
          const items = PALETTE.filter(p => p.cat === cat);
          if (!items.length) return null;
          return (
            <div key={cat}>
              <div style={{ padding: "10px 14px 4px", fontSize: 7.5, color: "#1e3654", textTransform: "uppercase", letterSpacing: "0.18em", fontWeight: 700 }}>{cat}</div>
              {items.map(item => (
                <div key={item.type} className="pal-item" draggable
                  onDragStart={e => e.dataTransfer.setData("compType", item.type)}
                  style={{
                    display: "flex", alignItems: "center", gap: 8,
                    padding: "5px 12px", cursor: "grab", margin: "1px 6px",
                    borderRadius: 6, border: "1px solid transparent",
                    transition: "all 0.15s", userSelect: "none",
                  }}>
                  <div style={{
                    width: 40, height: 24, display: "flex", alignItems: "center",
                    justifyContent: "center", background: "rgba(15,32,64,0.8)",
                    border: "1px solid #0f2040", borderRadius: 4,
                    flexShrink: 0, overflow: "hidden",
                  }}>
                    <div style={{ transform: "scale(0.5)", transformOrigin: "center" }}>
                      <CompSVG comp={{ ...item.defaults, id: "", type: item.type, x: 0, y: 0, label: "" }} />
                    </div>
                  </div>
                  <span style={{ fontSize: 10, color: "#6a8fb0" }}>{item.label}</span>
                </div>
              ))}
            </div>
          );
        })}

        <div style={{ marginTop: "auto", padding: "12px 14px", borderTop: "1px solid #0f2040" }}>
          <div style={{ fontSize: 7.5, color: "#1e3654", lineHeight: 2 }}>
            <div>● Arrastra componentes</div>
            <div>● Click <span style={{ color: "#3b82f6" }}>●</span> para conectar</div>
            <div>● Doble-click en TX → cicla núcleo</div>
            <div>● ESC cancela conexión</div>
          </div>
        </div>
      </aside>

      {/* ══ CANVAS ══ */}
      <div style={{ flex: 1, position: "relative", overflow: "hidden" }}>
        {/* Grid dots */}
        <svg style={{ position: "absolute", inset: 0, width: "100%", height: "100%", pointerEvents: "none", opacity: 0.15 }}>
          <defs>
            <pattern id="bgGrid" width={GRID} height={GRID} patternUnits="userSpaceOnUse">
              <circle cx="0" cy="0" r="0.7" fill="#1e3a5f" />
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#bgGrid)" />
        </svg>

        {/* Isometric substation background */}
        <div style={{ position: "absolute", inset: 0, pointerEvents: "none" }}>
          <IsometricSubstation
            active={analysis.circuitClosed}
            saturated={analysis.saturated}
            shortCircuit={analysis.shortCircuit} />
        </div>

        {/* Circuit overlay */}
        <div ref={containerRef}
          style={{ position: "absolute", inset: 0 }}
          onDrop={handleCanvasDrop}
          onDragOver={e => e.preventDefault()}
          onMouseMove={handleMouseMove}
          onClick={handleCanvasClick}>

          {/* Wires */}
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
              const wireColor = analysis.shortCircuit ? "#ef4444" : analysis.saturated ? "#f59e0b" : "#4ade80";
              return (
                <g key={w.id}>
                  {active && <path d={d} fill="none" stroke={`${wireColor}18`} strokeWidth="12" filter="url(#wireGlow)" />}
                  <path d={d} fill="none"
                    stroke={active ? "#92400e" : "#1e3a5f"}
                    strokeWidth={active ? 4 : 2.5} strokeLinecap="round" />
                  {active && <path d={d} fill="none" stroke={wireColor} strokeWidth="1.5" strokeLinecap="round" opacity="0.8" />}
                  {active && [0, 0.7, 1.4].map(delay => (
                    <circle key={delay} r={3} fill={wireColor} opacity="0.9" filter="url(#wireGlow)">
                      <animateMotion dur="2s" begin={`${delay}s`} repeatCount="indefinite" path={d} />
                    </circle>
                  ))}
                  <path d={d} fill="none" stroke="transparent" strokeWidth="14"
                    style={{ cursor: "pointer" }}
                    onClick={e => { e.stopPropagation(); deleteWire(w.id); }} />
                </g>
              );
            })}

            {pendingStart && (
              <path d={wirePath(pendingStart.x, pendingStart.y, mousePos.x, mousePos.y)}
                fill="none" stroke="#3b82f6" strokeWidth="2" strokeDasharray="6,4" opacity="0.7" />
            )}
          </svg>

          {/* Components */}
          {components.map(comp => {
            const active = analysis.circuitClosed;
            const isSelected = selectedId === comp.id;
            const ports = getPorts();
            return (
              <div key={comp.id}
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
                onDoubleClick={e => handleCompDblClick(comp.id, e)}>

                {isSelected && (
                  <div style={{
                    position: "absolute", inset: -5, borderRadius: 8,
                    border: "1.5px solid #3b82f6",
                    boxShadow: "0 0 0 3px rgba(59,130,246,0.2)",
                    pointerEvents: "none",
                  }} />
                )}
                {active && (
                  <div style={{
                    position: "absolute", inset: -10, borderRadius: 12,
                    background: `radial-gradient(ellipse, ${analysis.shortCircuit ? "rgba(239,68,68,0.08)" : "rgba(74,222,128,0.07)"} 0%, transparent 70%)`,
                    pointerEvents: "none",
                  }} />
                )}

                <CompSVG comp={comp} active={active} />

                <div style={{
                  position: "absolute", top: COMP_H + 3, left: "50%",
                  transform: "translateX(-50%)", fontSize: 8, color: "#2a4a6a",
                  whiteSpace: "nowrap", pointerEvents: "none",
                  background: "rgba(3,11,31,0.8)", padding: "1px 4px", borderRadius: 3,
                }}>
                  {comp.label}
                </div>

                {/* Live values tooltip */}
                {active && comp.type === "voltmeter" && (
                  <div style={{
                    position: "absolute", top: -28, left: "50%",
                    transform: "translateX(-50%)",
                    background: "rgba(10,20,40,0.95)", border: "1px solid #92400e",
                    color: "#fbbf24", fontSize: 7.5, padding: "2px 7px",
                    borderRadius: 4, whiteSpace: "nowrap", pointerEvents: "none",
                  }}>
                    {analysis.V2.toFixed(1)}V
                  </div>
                )}
                {active && comp.type === "ammeter" && (
                  <div style={{
                    position: "absolute", top: -28, left: "50%",
                    transform: "translateX(-50%)",
                    background: "rgba(10,20,40,0.95)", border: "1px solid #1e3a8a",
                    color: "#60a5fa", fontSize: 7.5, padding: "2px 7px",
                    borderRadius: 4, whiteSpace: "nowrap", pointerEvents: "none",
                  }}>
                    {analysis.I2.toFixed(3)}A
                  </div>
                )}

                {isSelected && (
                  <button style={{
                    position: "absolute", top: -12, right: -12, width: 18, height: 18,
                    borderRadius: "50%", background: "#ef4444", color: "white",
                    border: "none", cursor: "pointer", fontSize: 12, lineHeight: "18px",
                    zIndex: 60, display: "flex", alignItems: "center", justifyContent: "center", padding: 0,
                  }}
                    onMouseDown={e => e.stopPropagation()}
                    onClick={e => { e.stopPropagation(); deleteComponent(comp.id); }}>×</button>
                )}

                {ports.map(port => {
                  const isPending = pendingPort?.compId === comp.id && pendingPort?.portId === port.id;
                  const hasWire = wires.some(w =>
                    (w.fromCompId === comp.id && w.fromPortId === port.id) ||
                    (w.toCompId === comp.id && w.toPortId === port.id)
                  );
                  return (
                    <div key={port.id} className="port-dot"
                      style={{
                        position: "absolute",
                        left: COMP_W / 2 + port.dx - PORT_R,
                        top: COMP_H / 2 + port.dy - PORT_R,
                        width: PORT_R * 2, height: PORT_R * 2,
                        borderRadius: "50%",
                        background: isPending ? "#3b82f6" : hasWire ? (active ? "#f59e0b" : "#1e3a5f") : "rgba(74,222,128,0.1)",
                        border: `2px solid ${isPending ? "#60a5fa" : hasWire ? (active ? "#f59e0b" : "#2a4a70") : "#4ade80"}`,
                        cursor: "crosshair", zIndex: 20,
                        transition: "all 0.15s",
                        boxShadow: isPending ? "0 0 8px rgba(59,130,246,0.8)" : "none",
                      }}
                      onClick={e => { e.stopPropagation(); handlePortClick(comp.id, port.id); }} />
                  );
                })}
              </div>
            );
          })}

          {/* Empty state */}
          {components.length === 0 && (
            <div style={{
              position: "absolute", bottom: 24, left: "50%",
              transform: "translateX(-50%)", pointerEvents: "none",
              background: "rgba(3,11,31,0.85)", border: "1px solid #0f2040",
              borderRadius: 10, padding: "10px 20px",
              color: "#1e3654", fontSize: 10, textAlign: "center", lineHeight: 1.8,
            }}>
              <span style={{ color: "#4ade80" }}>⚡</span> Arrastra componentes al lienzo de la subestación
            </div>
          )}

          {/* Pending wire indicator */}
          {pendingPort && (
            <div style={{
              position: "absolute", top: 14, left: "50%", transform: "translateX(-50%)",
              background: "rgba(59,130,246,0.12)", border: "1px solid #3b82f6",
              color: "#60a5fa", fontSize: 10, padding: "5px 16px", borderRadius: 20,
              pointerEvents: "none",
            }}>
              ● Selecciona puerto destino — ESC cancela
            </div>
          )}
        </div>

        {/* Status badge top-right */}
        <div style={{ position: "absolute", top: 14, right: 14, zIndex: 100, display: "flex", flexDirection: "column", gap: 6 }}>
          <div style={{
            background: analysis.circuitClosed ? "rgba(74,222,128,0.1)" : "rgba(15,32,64,0.8)",
            border: `1px solid ${analysis.circuitClosed ? "rgba(74,222,128,0.35)" : "#0f2040"}`,
            color: analysis.circuitClosed ? "#4ade80" : "#2a4a70",
            fontSize: 9, padding: "4px 12px", borderRadius: 20,
            display: "flex", alignItems: "center", gap: 6, letterSpacing: "0.12em",
          }}>
            <span style={{
              width: 6, height: 6, borderRadius: "50%",
              background: analysis.circuitClosed ? "#4ade80" : "#1e3a5f", display: "inline-block",
              ...(analysis.circuitClosed ? { animation: "blink 1.2s infinite" } : {}),
            }} />
            {analysis.circuitClosed ? "EN SERVICIO" : "SIN CARGA"}
          </div>
          {analysis.saturated && (
            <div style={{
              background: "rgba(245,158,11,0.12)", border: "1px solid #f59e0b",
              color: "#f59e0b", fontSize: 9, padding: "4px 12px", borderRadius: 20, textAlign: "center",
              animation: "blink 0.8s infinite",
            }}>
              ⚠ SATURACIÓN
            </div>
          )}
          {analysis.shortCircuit && (
            <div style={{
              background: "rgba(239,68,68,0.15)", border: "1px solid #ef4444",
              color: "#ef4444", fontSize: 9, padding: "4px 12px", borderRadius: 20, textAlign: "center",
              animation: "blink 0.3s infinite",
            }}>
              ⚠ CORTOCIRCUITO
            </div>
          )}
          {faultMode && (
            <div style={{
              background: "rgba(239,68,68,0.08)", border: "1px solid rgba(239,68,68,0.4)",
              color: "#f87171", fontSize: 8, padding: "3px 10px", borderRadius: 20, textAlign: "center",
            }}>
              FALLA ACTIVA
            </div>
          )}
        </div>

        {/* Clear button (tied to clearAll) */}
        <div style={{ position: "absolute", bottom: 14, right: 14, zIndex: 100 }}>
          <button onClick={clearAll} style={{
            background: "rgba(3,11,31,0.85)", border: "1px solid #0f2040",
            color: "#1e3654", fontSize: 8.5, fontFamily: "monospace",
            padding: "5px 12px", borderRadius: 6, cursor: "pointer",
            letterSpacing: "0.1em", transition: "all 0.15s",
          }}
            onMouseEnter={e => { e.currentTarget.style.borderColor = "#ef4444"; e.currentTarget.style.color = "#ef4444"; }}
            onMouseLeave={e => { e.currentTarget.style.borderColor = "#0f2040"; e.currentTarget.style.color = "#1e3654"; }}>
            LIMPIAR
          </button>
        </div>
      </div>

      {/* ══ RIGHT PANEL ══ */}
      <RightPanel
        analysis={analysis}
        selectedComp={selectedComp}
        updateComp={updateComp}
        faultMode={faultMode}
        setFaultMode={setFaultMode} />
    </div>
  );
}