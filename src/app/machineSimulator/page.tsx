// @ts-nocheck
"use client";

import { useState, useRef, useCallback, useEffect, useMemo } from "react";

// ─────────────────────────────────────────────────────────────────────────────
//  CONSTANTS
// ─────────────────────────────────────────────────────────────────────────────
const GRID = 36;
const snap = (v) => Math.round(v / GRID) * GRID;
let _uid = 100;
const uid = () => ++_uid;
const clamp = (v, lo, hi) => Math.max(lo, Math.min(hi, v));
const fmt = (n, d = 1) => (isFinite(n) && !isNaN(n)) ? Number(n).toFixed(d) : "0";

// ─────────────────────────────────────────────────────────────────────────────
//  COMPONENT DEFINITIONS
// ─────────────────────────────────────────────────────────────────────────────
const DEFS = {
  source:      { label:"Fuente AC",      symbol:"~",  sign:"V~",      color:"#f59e0b", w:90,  h:52, cat:"Fuente",       desc:"Genera el voltaje. Sin ella no hay circuito.",         defaults:{ voltage:120, frequency:60 } },
  transformer: { label:"Transformador",  symbol:"TX", sign:"N₁/N₂",   color:"#4ade80", w:160, h:72, cat:"Núcleo",        desc:"Sube o baja el voltaje según la relación N₁/N₂.",      defaults:{ efficiency:0.95, n1:200, n2:100, ratedVoltage:120 } },
  bulb:        { label:"Bombillo",       symbol:"💡", sign:"W",        color:"#fbbf24", w:72,  h:72, cat:"Carga",         desc:"Consume energía y la convierte en luz.",               defaults:{ ratedWatts:60, ratedVoltage:60 } },
  resistor:    { label:"Resistencia",    symbol:"Ω",  sign:"R=V/I",    color:"#a78bfa", w:84,  h:46, cat:"Carga",         desc:"Limita la corriente. Disipa energía como calor.",      defaults:{ resistance:100 } },
  voltmeter:   { label:"Voltímetro",     symbol:"V",  sign:"⊙V",       color:"#60a5fa", w:68,  h:52, cat:"Instrumento",   desc:"Mide el voltaje. No afecta al circuito.",              defaults:{} },
  ammeter:     { label:"Amperímetro",    symbol:"A",  sign:"⊙A",       color:"#34d399", w:68,  h:52, cat:"Instrumento",   desc:"Mide la corriente. No afecta al circuito.",            defaults:{} },
};

function getPorts(type, w, h, rotation = 0) {
  const hw = w / 2;
  const hh = h / 2;

  // Base ports (no rotation)
  let ports;
  if (type === "transformer") {
    ports = [
      { id:"p1", dx:-hw, dy:-16, label:"L₁+" },
      { id:"p2", dx:-hw, dy: 16, label:"L₁−" },
      { id:"s1", dx: hw, dy:-16, label:"L₂+" },
      { id:"s2", dx: hw, dy: 16, label:"L₂−" },
    ];
  } else {
    ports = [
      { id:"L", dx:-hw, dy:0, label:"−" },
      { id:"R", dx: hw, dy:0, label:"+" },
    ];
  }

  // Rotate port offsets
  if (!rotation || rotation === 0) return ports;
  const rad = (rotation * Math.PI) / 180;
  const cos = Math.round(Math.cos(rad));
  const sin = Math.round(Math.sin(rad));
  return ports.map(p => ({
    ...p,
    dx: p.dx * cos - p.dy * sin,
    dy: p.dx * sin + p.dy * cos,
  }));
}

// ─────────────────────────────────────────────────────────────────────────────
//  CIRCUIT TOPOLOGY VALIDATOR
// ─────────────────────────────────────────────────────────────────────────────
function validateCircuit(comps, wires) {
  if (comps.length === 0) return { closed: false, reason: "Arrastra componentes al lienzo para comenzar." };

  const src = comps.find(c => c.type === "source");
  if (!src) return { closed: false, reason: "Necesitas una Fuente AC en el circuito." };

  const hasLoad = comps.some(c => c.type === "bulb" || c.type === "resistor");
  if (!hasLoad) return { closed: false, reason: "Agrega una carga: Bombillo o Resistencia." };

  if (wires.length === 0) return { closed: false, reason: "Conecta los componentes con cables." };

  // Build adjacency map (component → set of connected components)
  const adj = {};
  comps.forEach(c => { adj[c.id] = new Set(); });
  wires.forEach(w => {
    if (adj[w.fromId] !== undefined) adj[w.fromId].add(w.toId);
    if (adj[w.toId]   !== undefined) adj[w.toId].add(w.fromId);
  });

  // Every component must have at least one wire
  const isolated = comps.filter(c => adj[c.id].size === 0);
  if (isolated.length > 0) {
    const names = isolated.map(c => DEFS[c.type]?.label ?? c.type).join(", ");
    return { closed: false, reason: `Desconectado: ${names}. Conecta todos los componentes.` };
  }

  // BFS from source — all nodes must be reachable
  const visited = new Set([src.id]);
  const queue = [src.id];
  while (queue.length) {
    const cur = queue.shift();
    for (const nb of adj[cur]) {
      if (!visited.has(nb)) { visited.add(nb); queue.push(nb); }
    }
  }
  if (visited.size < comps.length) {
    return { closed: false, reason: "Partes desconectadas. Todo debe estar en la misma red." };
  }

  // Cycle detection via DFS — at least one cycle is needed for current to flow
  // A connected graph with N nodes has a cycle when it has >= N edges
  const nodeCount  = comps.length;
  const edgeCount  = wires.length; // each wire is one undirected edge
  if (edgeCount < nodeCount) {
    return { closed: false, reason: "Circuito abierto — cierra el lazo de retorno (conecta el último componente de vuelta al inicio)." };
  }

  return { closed: true, reason: "" };
}

// ─────────────────────────────────────────────────────────────────────────────
//  PHYSICS ENGINE  — ratio always derived from N1/N2
// ─────────────────────────────────────────────────────────────────────────────
function runPhysics(comps, wires, powerOn) {
  const empty = { V1:0, V2:0, I1:0, I2:0, S:0, P:0, Ploss:0, eta:0.95,
    ratio:2, n1:200, n2:100, active:false, bulbState:"off", wireSpeed:0,
    circuitOk:false, circuitMsg:"", Bmax:0, fluxPct:0 };

  const { closed, reason } = validateCircuit(comps, wires);
  if (!closed) return { ...empty, circuitMsg: reason };

  const src = comps.find(c => c.type === "source");
  const tx  = comps.find(c => c.type === "transformer");

  // N1, N2 are the TRUE parameters — ratio is DERIVED
  const n1     = tx ? Math.max(1, tx.n1 ?? 200) : 1;
  const n2     = tx ? Math.max(1, tx.n2 ?? 100) : 1;
  const ratio  = n1 / n2;            // a = N1/N2  (the real formula)
  const eta    = tx ? (tx.efficiency ?? 0.95) : 1;
  const ratedV = tx ? (tx.ratedVoltage ?? 120) : (src?.voltage ?? 120);
  const freq   = src?.frequency ?? 60;

  if (!powerOn) {
    const V1 = src?.voltage ?? 120;
    const V2 = V1 / ratio;
    return { ...empty, V1, V2, ratio, n1, n2, eta, circuitOk:true,
      circuitMsg:"Circuito cerrado. Enciende el sistema." };
  }

  const V1  = src?.voltage ?? 120;
  const V2  = V1 / ratio;
  const sat = V1 > ratedV * 1.25;

  // Flux density indicator (arbitrary units, normalized 0-1)
  // Bmax ∝ V1 / (N1 × freq) — simplified Faraday
  const Bmax   = V1 / (n1 * freq);
  const BmaxRef = 120 / (200 * 60); // reference: 120V, 200 turns, 60Hz
  const fluxPct = clamp(Bmax / BmaxRef, 0, 1);

  // Load resistance
  const loads = comps.filter(c => c.type === "bulb" || c.type === "resistor");
  const getReff = (c) => {
    if (c.type === "bulb") {
      const Vr = c.ratedVoltage ?? 60;
      const W  = c.ratedWatts  ?? 60;
      return (Vr * Vr) / Math.max(W, 1);
    }
    return c.resistance ?? 100;
  };
  let invR = 0;
  loads.forEach(l => { invR += 1 / Math.max(getReff(l), 0.01); });
  const R_total = invR > 0 ? (1 / invR) : 1e6;

  const I2    = V2 / Math.max(R_total, 0.01);
  const I1    = (I2 / ratio) / eta;
  const S     = V1 * I1;
  const P     = S * eta;
  const Ploss = S * (1 - eta);
  const wireSpeed = clamp(I2 / 15, 0.04, 1);

  const bulb = comps.find(c => c.type === "bulb");
  let bulbState = "off";
  if (bulb) {
    const r = V2 / (bulb.ratedVoltage ?? 60);
    if      (r > 2.4)  bulbState = "exploded";
    else if (r > 1.7)  bulbState = "burned";
    else if (r > 0.05) bulbState = "on";
  }

  return { V1, V2, I1, I2, S, P, Ploss, eta, ratio, n1, n2,
    active:true, sat, wireSpeed, bulbState, circuitOk:true, circuitMsg:"",
    Bmax, fluxPct, freq };
}

// ─────────────────────────────────────────────────────────────────────────────
//  WIRE PATH  — smooth Catmull-Rom through all handle points
// ─────────────────────────────────────────────────────────────────────────────
function buildPath(from, to, handles) {
  const pts = [from, ...(handles || []), to];
  if (pts.length === 2) {
    // No handles: simple orthogonal elbow
    const mx = (from.x + to.x) / 2;
    return `M${from.x} ${from.y} C${mx} ${from.y} ${mx} ${to.y} ${to.x} ${to.y}`;
  }
  // Catmull-Rom spline
  const T = 0.5; // tension
  let d = `M${pts[0].x} ${pts[0].y}`;
  for (let i = 0; i < pts.length - 1; i++) {
    const p0 = pts[Math.max(i - 1, 0)];
    const p1 = pts[i];
    const p2 = pts[i + 1];
    const p3 = pts[Math.min(i + 2, pts.length - 1)];
    const cp1x = p1.x + (p2.x - p0.x) * T / 2;
    const cp1y = p1.y + (p2.y - p0.y) * T / 2;
    const cp2x = p2.x - (p3.x - p1.x) * T / 2;
    const cp2y = p2.y - (p3.y - p1.y) * T / 2;
    d += ` C${cp1x.toFixed(1)},${cp1y.toFixed(1)} ${cp2x.toFixed(1)},${cp2y.toFixed(1)} ${p2.x},${p2.y}`;
  }
  return d;
}

// ─────────────────────────────────────────────────────────────────────────────
//  COMPONENT SVG
// ─────────────────────────────────────────────────────────────────────────────
function CompSVG({ comp, state }) {
  const { type } = comp;
  const def = DEFS[type];
  const w = def.w, h = def.h, cx = w/2, cy = h/2;
  const active = !!state?.active;

  if (type === "source") {
    const c = active ? "#f59e0b" : "#475569";
    return (
      <svg width={w} height={h} viewBox={`0 0 ${w} ${h}`}>
        <circle cx={cx} cy={cy} r={20} fill="#040c1a" stroke={active?"#f59e0b":"#1e3a5f"} strokeWidth={active?2.5:1.5}
          style={active?{filter:"drop-shadow(0 0 7px #f59e0b66)"}:{}}/>
        <path d={`M${cx-12} ${cy} Q${cx-6} ${cy-10} ${cx} ${cy} Q${cx+6} ${cy+10} ${cx+12} ${cy}`}
          fill="none" stroke={c} strokeWidth={2.4} strokeLinecap="round"/>
        <line x1={0} y1={cy} x2={cx-20} y2={cy} stroke={c} strokeWidth={2.2}/>
        <line x1={cx+20} y1={cy} x2={w} y2={cy} stroke={c} strokeWidth={2.2}/>
        <text x={cx} y={h-3} textAnchor="middle" fontSize={7} fill={c}>{comp.voltage??120}V ~ {comp.frequency??60}Hz</text>
      </svg>
    );
  }

  if (type === "transformer") {
    const cp = active ? "#f59e0b" : "#64748b";
    const cs = active ? "#60a5fa" : "#64748b";
    const cc = active ? "#4ade80" : "#334155";
    const n1 = Math.max(1, comp.n1 ?? 200);
    const n2 = Math.max(1, comp.n2 ?? 100);
    const ratio = n1 / n2;
    const eta = comp.efficiency ?? 0.95;

    // Visual turns: 1 arc represents a group of turns
    // Scale so max 12 arcs fit on each side
    const maxArcs = 12;
    const minTurns = Math.min(n1, n2);
    const scale = Math.max(1, Math.ceil(minTurns / maxArcs));
    const vis1 = Math.round(n1 / scale);  // arcs on primary
    const vis2 = Math.round(n2 / scale);  // arcs on secondary
    const arcW = 8, arcH = 6;

    // Compute coil widths
    const coil1W = vis1 * arcW;
    const coil2W = vis2 * arcW;
    // SVG is wide enough for both coils + core + leads
    // We use a wide viewBox to show everything clearly
    const VW = Math.max(w, 24 + coil1W + 14 + coil2W + 24);
    const VH = h;
    const coreX = 24 + coil1W + 4;   // left edge of core
    const coreW = 6;

    const fluxPct = state?.fluxPct ?? 0;

    return (
      <svg width={w} height={VH} viewBox={`0 0 ${VW} ${VH}`} preserveAspectRatio="xMidYMid meet">
        {/* ─── PRIMARY LEADS ─── */}
        <line x1={0} y1={cy-18} x2={24} y2={cy-18} stroke={cp} strokeWidth={2.2}/>
        <line x1={0} y1={cy+18} x2={24} y2={cy+18} stroke={cp} strokeWidth={2.2}/>

        {/* ─── PRIMARY COIL (arcs upward) ─── */}
        {Array.from({length:vis1},(_,i)=>(
          <path key={`pt${i}`}
            d={`M${24+i*arcW} ${cy-18} A${arcW/2} ${arcH} 0 0 1 ${24+(i+1)*arcW} ${cy-18}`}
            fill="none" stroke={active?"#f59e0b":"#64748b"} strokeWidth={2.4}
            style={active?{filter:"drop-shadow(0 0 2px #f59e0b66)"}:{}}/>
        ))}
        {Array.from({length:vis1},(_,i)=>(
          <path key={`pb${i}`}
            d={`M${24+i*arcW} ${cy+18} A${arcW/2} ${arcH} 0 0 1 ${24+(i+1)*arcW} ${cy+18}`}
            fill="none" stroke={active?"#f59e0b":"#64748b"} strokeWidth={2.4}/>
        ))}

        {/* Dashed bridge to core */}
        {coil1W + 24 < coreX &&
          <>
            <line x1={24+coil1W} y1={cy-18} x2={coreX} y2={cy-18} stroke={cp} strokeWidth={1.5} strokeDasharray="2 3" opacity={0.5}/>
            <line x1={24+coil1W} y1={cy+18} x2={coreX} y2={cy+18} stroke={cp} strokeWidth={1.5} strokeDasharray="2 3" opacity={0.5}/>
          </>
        }

        {/* ─── CORE ─── */}
        {/* Main iron bars */}
        <line x1={coreX}      y1={cy-24} x2={coreX}      y2={cy+24} stroke={cc} strokeWidth={5}/>
        <line x1={coreX+coreW} y1={cy-24} x2={coreX+coreW} y2={cy+24} stroke={cc} strokeWidth={5}/>
        {/* Top + bottom caps */}
        <line x1={coreX-1} y1={cy-24} x2={coreX+coreW+1} y2={cy-24} stroke={cc} strokeWidth={3}/>
        <line x1={coreX-1} y1={cy+24} x2={coreX+coreW+1} y2={cy+24} stroke={cc} strokeWidth={3}/>
        {/* Flux fill — height proportional to flux density */}
        {active && (
          <rect x={coreX-1} y={cy-24} width={coreW+2} height={48}
            fill={fluxPct>0.8?"#ef4444":fluxPct>0.5?"#f59e0b":"#4ade80"}
            opacity={0.12 + fluxPct*0.25}
            style={{animation:"glowPulse 1.2s ease-in-out infinite"}}/>
        )}
        {/* Flux arrow */}
        {active && (
          <>
            <line x1={coreX+coreW/2} y1={cy-10} x2={coreX+coreW/2} y2={cy+6}
              stroke={cc} strokeWidth={1.5} opacity={0.7}/>
            <polygon points={`${coreX+coreW/2-3},${cy+3} ${coreX+coreW/2},${cy+10} ${coreX+coreW/2+3},${cy+3}`}
              fill={cc} opacity={0.7}/>
          </>
        )}
        {/* Φm label */}
        <text x={coreX+coreW/2} y={cy+22} textAnchor="middle" fontSize={6} fill={cc} opacity={0.9}>Φ</text>

        {/* ─── SECONDARY COIL (arcs downward — opposite winding) ─── */}
        {Array.from({length:vis2},(_,i)=>(
          <path key={`st${i}`}
            d={`M${coreX+coreW+4+i*arcW} ${cy-18} A${arcW/2} ${arcH} 0 0 0 ${coreX+coreW+4+(i+1)*arcW} ${cy-18}`}
            fill="none" stroke={active?"#60a5fa":"#64748b"} strokeWidth={2.4}
            style={active?{filter:"drop-shadow(0 0 2px #60a5fa66)"}:{}}/>
        ))}
        {Array.from({length:vis2},(_,i)=>(
          <path key={`sb${i}`}
            d={`M${coreX+coreW+4+i*arcW} ${cy+18} A${arcW/2} ${arcH} 0 0 0 ${coreX+coreW+4+(i+1)*arcW} ${cy+18}`}
            fill="none" stroke={active?"#60a5fa":"#64748b"} strokeWidth={2.4}/>
        ))}

        {/* ─── SECONDARY LEADS ─── */}
        <line x1={coreX+coreW+4+coil2W} y1={cy-18} x2={VW} y2={cy-18} stroke={cs} strokeWidth={2.2}/>
        <line x1={coreX+coreW+4+coil2W} y1={cy+18} x2={VW} y2={cy+18} stroke={cs} strokeWidth={2.2}/>

        {/* ─── TURN COUNT LABELS ─── */}
        {/* Primary */}
        <rect x={24} y={cy-34} width={coil1W} height={12} rx={2} fill="rgba(2,9,20,0.85)"/>
        <text x={24+coil1W/2} y={cy-25} textAnchor="middle" fontSize={8} fill="#f59e0b" fontWeight="700">
          N₁={n1}
        </text>
        {/* Brackets around primary coil */}
        <line x1={24} y1={cy-30} x2={24} y2={cy-34} stroke="#f59e0b" strokeWidth={1} opacity={0.5}/>
        <line x1={24+coil1W} y1={cy-30} x2={24+coil1W} y2={cy-34} stroke="#f59e0b" strokeWidth={1} opacity={0.5}/>
        <line x1={24} y1={cy-34} x2={24+coil1W} y2={cy-34} stroke="#f59e0b" strokeWidth={1} opacity={0.5}/>

        {/* Secondary */}
        <rect x={coreX+coreW+4} y={cy+22} width={coil2W} height={12} rx={2} fill="rgba(2,9,20,0.85)"/>
        <text x={coreX+coreW+4+coil2W/2} y={cy+31} textAnchor="middle" fontSize={8} fill="#60a5fa" fontWeight="700">
          N₂={n2}
        </text>
        <line x1={coreX+coreW+4} y1={cy+24} x2={coreX+coreW+4} y2={cy+22} stroke="#60a5fa" strokeWidth={1} opacity={0.5}/>
        <line x1={coreX+coreW+4+coil2W} y1={cy+24} x2={coreX+coreW+4+coil2W} y2={cy+22} stroke="#60a5fa" strokeWidth={1} opacity={0.5}/>
        <line x1={coreX+coreW+4} y1={cy+22} x2={coreX+coreW+4+coil2W} y2={cy+22} stroke="#60a5fa" strokeWidth={1} opacity={0.5}/>

        {/* Scale note if grouped */}
        {scale > 1 && (
          <text x={VW/2} y={VH-2} textAnchor="middle" fontSize={6} fill="#475569" opacity={0.8}>
            1 arco = {scale} vueltas
          </text>
        )}

        {/* Ratio + efficiency */}
        <text x={VW/2} y={10} textAnchor="middle" fontSize={7.5} fill={active?"#4ade80":"#475569"} fontWeight="700">
          a={fmt(ratio,3)} · η={Math.round(eta*100)}%
        </text>
      </svg>
    );
  }

  if (type === "bulb") {
    const bs = state?.bulbState??"off";
    const on = bs==="on", burned=bs==="burned", exploded=bs==="exploded";
    const br = on ? clamp((state?.V2??0)/(comp.ratedVoltage??60), 0.15, 1) : 0;
    return (
      <svg width={w} height={h} viewBox={`0 0 ${w} ${h}`}>
        {on && <circle cx={cx} cy={cy-8} r={30} fill="#fbbf24" opacity={0.06*br}/>}
        <path d={`M${cx-16} ${cy+10} Q${cx-23} ${cy} ${cx-19} ${cy-13} Q${cx-14} ${cy-25} ${cx} ${cy-25} Q${cx+14} ${cy-25} ${cx+19} ${cy-13} Q${cx+23} ${cy} ${cx+16} ${cy+10} Z`}
          fill={exploded?"#450a0a":burned?"#1c0a00":on?`rgba(254,240,138,${0.1*br+0.04})`:"#040c1a"}
          stroke={exploded?"#ef4444":burned?"#b45309":on?"#fbbf24":"#1e3a5f"}
          strokeWidth={exploded||burned?2.8:1.8}
          style={on?{filter:`drop-shadow(0 0 ${Math.round(8*br)}px #fbbf2488)`}:{}}/>
        {!exploded && (
          <path d={`M${cx-7} ${cy+7} Q${cx-3} ${cy-3} ${cx} ${cy+2} Q${cx+3} ${cy+7} ${cx+7} ${cy+0}`}
            fill="none" strokeWidth={2.5} strokeLinecap="round"
            stroke={burned?"#78350f":on?"#fef08a":"#1e3a5f"}
            style={on&&!burned?{filter:"drop-shadow(0 0 4px #fef08a)"}:{}}/>
        )}
        {exploded && [[-9,-16],[7,-18],[0,-11],[-13,-9],[13,-12]].map(([dx,dy],i)=>(
          <line key={i} x1={cx+dx} y1={cy+dy} x2={cx+dx+(dx>=0?7:-7)} y2={cy+dy-9}
            stroke="#ef4444" strokeWidth={2.2} strokeLinecap="round"/>
        ))}
        <rect x={cx-13} y={cy+10} width={26} height={5} rx={1.5} fill={burned||exploded?"#7c2d12":"#0f2040"} stroke={burned||exploded?"#c2410c":"#1e3a5f"} strokeWidth={1}/>
        <rect x={cx-11} y={cy+15} width={22} height={4} rx={1}   fill={burned||exploded?"#6b2109":"#0a1828"} stroke={burned||exploded?"#b83c0e":"#1e3a5f"} strokeWidth={1}/>
        <rect x={cx-9}  y={cy+19} width={18} height={8} rx={1}   fill={burned||exploded?"#4a1208":"#060f1e"} stroke={burned||exploded?"#9a3009":"#1e3a5f"} strokeWidth={1}/>
        <line x1={cx-5} y1={cy+27} x2={cx-5} y2={cy+36} stroke={burned||exploded?"#c2410c":"#1e3a5f"} strokeWidth={2.2}/>
        <line x1={cx+5} y1={cy+27} x2={cx+5} y2={cy+36} stroke={burned||exploded?"#c2410c":"#1e3a5f"} strokeWidth={2.2}/>
        <line x1={0} y1={cy} x2={cx-16} y2={cy} stroke={on?"#fbbf24":"#475569"} strokeWidth={2.2}/>
        <line x1={cx+16} y1={cy} x2={w} y2={cy} stroke={on?"#fbbf24":"#475569"} strokeWidth={2.2}/>
        <text x={cx} y={5} textAnchor="middle" fontSize={7.5} fill={exploded?"#ef4444":burned?"#f59e0b":on?"#fbbf24":"#475569"}>
          {exploded?"💥 QUEMADO":burned?"⚠ DAÑADO":on?`${fmt(state?.V2??0,1)}V`:`${comp.ratedWatts??60}W/${comp.ratedVoltage??60}V`}
        </text>
      </svg>
    );
  }

  if (type === "resistor") {
    const c = active?"#a78bfa":"#475569";
    return (
      <svg width={w} height={h} viewBox={`0 0 ${w} ${h}`}>
        <line x1={0} y1={cy} x2={13} y2={cy} stroke={c} strokeWidth={2.2}/>
        <line x1={w-13} y1={cy} x2={w} y2={cy} stroke={c} strokeWidth={2.2}/>
        <rect x={13} y={cy-9} width={w-26} height={18} rx={2.5} fill="#040c1a"
          stroke={active?"#a78bfa":"#1e3a5f"} strokeWidth={active?2.2:1.5}
          style={active?{filter:"drop-shadow(0 0 5px #a78bfa44)"}:{}}/>
        <polyline points={`15,${cy} 21,${cy-7} 28,${cy+7} 35,${cy-7} 42,${cy+7} 49,${cy-7} 56,${cy+7} 63,${cy-7} 68,${cy}`}
          fill="none" stroke={active?"#a78bfa":"#334155"} strokeWidth={2}/>
        <text x={cx} y={cy-13} textAnchor="middle" fontSize={8} fill="#a78bfa">{comp.resistance}Ω</text>
      </svg>
    );
  }

  if (type === "voltmeter") {
    const c = active?"#60a5fa":"#475569";
    return (
      <svg width={w} height={h} viewBox={`0 0 ${w} ${h}`}>
        <line x1={0} y1={cy} x2={cx-19} y2={cy} stroke={c} strokeWidth={2.2}/>
        <line x1={cx+19} y1={cy} x2={w} y2={cy} stroke={c} strokeWidth={2.2}/>
        <circle cx={cx} cy={cy} r={19} fill="#040c1a" stroke={active?"#60a5fa":"#1e3a5f"} strokeWidth={active?2.2:1.5}
          style={active?{filter:"drop-shadow(0 0 6px #60a5fa44)"}:{}}/>
        <text x={cx} y={cy+5} textAnchor="middle" fontSize={14} fill={c} fontWeight="700">V</text>
        {active && <text x={cx} y={cy-23} textAnchor="middle" fontSize={8} fill="#60a5fa">{fmt(state?.V2??0,1)}V</text>}
      </svg>
    );
  }

  if (type === "ammeter") {
    const c = active?"#34d399":"#475569";
    return (
      <svg width={w} height={h} viewBox={`0 0 ${w} ${h}`}>
        <line x1={0} y1={cy} x2={cx-19} y2={cy} stroke={c} strokeWidth={2.2}/>
        <line x1={cx+19} y1={cy} x2={w} y2={cy} stroke={c} strokeWidth={2.2}/>
        <circle cx={cx} cy={cy} r={19} fill="#040c1a" stroke={active?"#34d399":"#1e3a5f"} strokeWidth={active?2.2:1.5}
          style={active?{filter:"drop-shadow(0 0 6px #34d39944)"}:{}}/>
        <text x={cx} y={cy+5} textAnchor="middle" fontSize={14} fill={c} fontWeight="700">A</text>
        {active && <text x={cx} y={cy-23} textAnchor="middle" fontSize={8} fill="#34d399">{fmt(state?.I2??0,3)}A</text>}
      </svg>
    );
  }
  return null;
}

// ─────────────────────────────────────────────────────────────────────────────
//  BACKGROUND DIAGRAM (decorativo)
// ─────────────────────────────────────────────────────────────────────────────
function BGDiagram() {
  return (
    <svg viewBox="0 0 900 540" width="100%" height="100%"
      preserveAspectRatio="xMidYMid meet"
      style={{position:"absolute",inset:0,pointerEvents:"none",opacity:0.055}}>
      <polyline points="90,218 90,168 285,168 285,205" fill="none" stroke="#f59e0b" strokeWidth={7} strokeLinecap="round" strokeLinejoin="round"/>
      <polyline points="90,322 90,372 285,372 285,335" fill="none" stroke="#f59e0b" strokeWidth={7} strokeLinecap="round" strokeLinejoin="round"/>
      <polyline points="568,205 568,168 720,168 720,218 835,218" fill="none" stroke="#60a5fa" strokeWidth={7} strokeLinecap="round" strokeLinejoin="round"/>
      <polyline points="568,335 568,372 720,372 720,322 835,322" fill="none" stroke="#60a5fa" strokeWidth={7} strokeLinecap="round" strokeLinejoin="round"/>
      <circle cx={90} cy={270} r={52} fill="none" stroke="#f59e0b" strokeWidth={4.5}/>
      <path d="M62,270 Q76,248 90,270 Q104,292 118,270" fill="none" stroke="#f59e0b" strokeWidth={4.5} strokeLinecap="round"/>
      <text x={90} y={348} textAnchor="middle" fontSize={20} fill="#f59e0b" fontFamily="sans-serif">Vₚ</text>
      <text x={18} y={270} textAnchor="middle" fontSize={16} fill="#94a3b8" fontFamily="sans-serif" transform="rotate(-90,18,270)">Circuito Primario</text>
      <line x1={160} y1={168} x2={256} y2={168} stroke="#f59e0b" strokeWidth={3}/>
      <polygon points="256,160 272,168 256,176" fill="#f59e0b"/>
      <text x={208} y={152} textAnchor="middle" fontSize={20} fill="#f59e0b" fontFamily="sans-serif">Iₚ</text>
      {Array.from({length:10},(_,i)=>(<path key={i} d={`M285 ${205+i*15} A14 7.5 0 0 1 285 ${220+i*15}`} fill="none" stroke="#f59e0b" strokeWidth={5.5} strokeLinecap="round"/>))}
      <text x={285} y={402} textAnchor="middle" fontSize={19} fill="#f59e0b" fontFamily="sans-serif">Nₚ vueltas</text>
      <rect x={395} y={152} width={72} height={236} rx={9} fill="none" stroke="#94a3b8" strokeWidth={5.5}/>
      {Array.from({length:13},(_,i)=>(<line key={i} x1={404} y1={166+i*16} x2={458} y2={166+i*16} stroke="#64748b" strokeWidth={2} opacity={0.5}/>))}
      <text x={431} y={280} textAnchor="middle" fontSize={26} fill="#8b5cf6" fontFamily="sans-serif">Φₘ</text>
      <line x1={431} y1={300} x2={431} y2={336} stroke="#8b5cf6" strokeWidth={3}/>
      <polygon points="422,330 431,348 440,330" fill="#8b5cf6"/>
      {Array.from({length:6},(_,i)=>(<path key={i} d={`M568 ${205+i*22} A14 11 0 0 0 568 ${227+i*22}`} fill="none" stroke="#60a5fa" strokeWidth={5.5} strokeLinecap="round"/>))}
      <text x={568} y={402} textAnchor="middle" fontSize={19} fill="#60a5fa" fontFamily="sans-serif">Nₛ vueltas</text>
      <text x={568} y={290} textAnchor="middle" fontSize={20} fill="#60a5fa" fontFamily="sans-serif">Vₛ</text>
      <line x1={596} y1={168} x2={700} y2={168} stroke="#60a5fa" strokeWidth={3}/>
      <polygon points="700,160 716,168 700,176" fill="#60a5fa"/>
      <text x={650} y={152} textAnchor="middle" fontSize={20} fill="#60a5fa" fontFamily="sans-serif">Iₛ</text>
      <path d="M812,238 Q789,224 793,208 Q797,188 835,188 Q873,188 877,208 Q881,224 858,238 L858,260 L812,260 Z" fill="none" stroke="#fbbf24" strokeWidth={4.5}/>
      <path d="M820,258 Q828,244 835,250 Q842,256 850,248" fill="none" stroke="#fbbf24" strokeWidth={3.5} strokeLinecap="round"/>
      <rect x={814} y={260} width={42} height={9} rx={2} fill="none" stroke="#fbbf24" strokeWidth={3}/>
      <text x={835} y={308} textAnchor="middle" fontSize={18} fill="#fbbf24" fontFamily="sans-serif">Carga</text>
      <text x={888} y={270} textAnchor="middle" fontSize={16} fill="#94a3b8" fontFamily="sans-serif" transform="rotate(90,888,270)">Circuito Secundario</text>
    </svg>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
//  PROP EDITOR
// ─────────────────────────────────────────────────────────────────────────────
function PropEditor({ comp, onChange, onDelete }) {
  if (!comp) return (
    <div style={{padding:"18px 16px",lineHeight:1.9}}>
      <div style={{fontSize:13,fontWeight:700,color:"#4a7aaa",marginBottom:8}}>Sin selección</div>
      <div style={{fontSize:11,color:"#2a4a6a"}}>Haz click en un componente del lienzo para editarlo aquí.</div>
    </div>
  );
  const def = DEFS[comp.type];

  const FIELDS = {
    source:      [
      {k:"voltage",   unit:"V",  label:"Voltaje V₁",  min:12,  max:480, step:6,   color:"#f59e0b", tip:"Determina toda la energía del circuito"},
      {k:"frequency", unit:"Hz", label:"Frecuencia",   min:50,  max:60,  step:10,  color:"#fb923c", tip:"50Hz Europa · 60Hz América"},
    ],
    transformer: [
      {k:"n1",         unit:"vueltas", label:"Vueltas primario N₁",   min:10, max:800, step:10, color:"#f59e0b", tip:"Más vueltas = más voltaje en esa bobina"},
      {k:"n2",         unit:"vueltas", label:"Vueltas secundario N₂",  min:10, max:800, step:10, color:"#60a5fa", tip:"N₂ > N₁ → sube voltaje · N₂ < N₁ → baja voltaje"},
      {k:"efficiency", unit:"%",       label:"Eficiencia η",           min:70, max:99,  step:1,  color:"#a78bfa", scale:100, tip:"Pérdidas reales en núcleo y cobre"},
      {k:"ratedVoltage",unit:"V",      label:"Voltaje nominal",        min:12, max:480, step:12, color:"#fbbf24", tip:"Voltaje máximo de diseño"},
    ],
    bulb:     [{k:"ratedWatts",unit:"W",label:"Potencia nominal",min:5,max:500,step:5,color:"#fbbf24",tip:"R=V²/W"},{k:"ratedVoltage",unit:"V",label:"Voltaje nominal",min:12,max:240,step:6,color:"#fb923c",tip:"V₂>2.4× → ¡EXPLOTA!"}],
    resistor: [{k:"resistance",unit:"Ω",label:"Resistencia R",min:1,max:2000,step:1,color:"#a78bfa",tip:"Oposición al flujo de corriente"}],
    voltmeter:[], ammeter:[],
  };

  const fields = FIELDS[comp.type] ?? [];

  return (
    <div style={{padding:"14px 16px"}}>
      {/* Header */}
      <div style={{display:"flex",alignItems:"center",gap:10,marginBottom:14,paddingBottom:12,borderBottom:"1px solid #0f2040"}}>
        <div style={{width:44,height:44,borderRadius:10,flexShrink:0,background:`${def.color}18`,border:`1px solid ${def.color}45`,display:"flex",alignItems:"center",justifyContent:"center",fontSize:20,color:def.color}}>
          {def.symbol}
        </div>
        <div style={{minWidth:0}}>
          <div style={{fontSize:14,fontWeight:700,color:def.color,letterSpacing:"0.04em"}}>{def.label}</div>
          <div style={{fontSize:10,color:"#4a6a8a",marginTop:3,lineHeight:1.5}}>{def.desc}</div>
        </div>
      </div>

      {/* Sign badge */}
      <div style={{display:"inline-block",padding:"4px 12px",borderRadius:6,marginBottom:14,background:`${def.color}18`,border:`1px solid ${def.color}40`,color:def.color,fontSize:12,fontWeight:700}}>
        {def.sign}
      </div>

      {/* Bulb info */}
      {comp.type==="bulb" && (
        <div style={{marginBottom:14,padding:"10px 12px",background:"rgba(251,191,36,0.07)",border:"1px solid rgba(251,191,36,0.28)",borderRadius:8,lineHeight:1.7}}>
          <div style={{fontSize:11,color:"#fcd34d",fontWeight:700,marginBottom:3}}>💡 Resistencia calculada automáticamente</div>
          <div style={{fontSize:12,color:"#fbbf24",fontWeight:700}}>
            R = V²/W = {((comp.ratedVoltage??60)**2/Math.max(comp.ratedWatts??60,1)).toFixed(1)} Ω
          </div>
          <div style={{fontSize:9,color:"#92400e",marginTop:5}}>⚠ Si V₂ supera 2.4× el voltaje nominal → ¡el bombillo explota!</div>
        </div>
      )}

      {/* Transformer live card */}
      {comp.type==="transformer" && (() => {
        const n1 = Math.max(1, comp.n1 ?? 200);
        const n2 = Math.max(1, comp.n2 ?? 100);
        const a  = n1 / n2;
        const eta = comp.efficiency ?? 0.95;
        const vNom = comp.ratedVoltage ?? 120;
        const tipo = a > 1.02 ? "Reductor (Step-Down)" : a < 0.98 ? "Elevador (Step-Up)" : "Igualador (1:1)";
        const tipoColor = a > 1.02 ? "#f59e0b" : a < 0.98 ? "#60a5fa" : "#4ade80";

        // Proportional bar: each bar = max(1, ceil(n/maxBars)) turns
        const maxBars = 24;
        const scale = Math.max(1, Math.ceil(Math.max(n1,n2) / maxBars));
        const bars1 = Math.round(n1 / scale);
        const bars2 = Math.round(n2 / scale);

        // EMF per turn (Faraday: e = V/N)
        const emfPerTurn1 = (vNom / n1).toFixed(3);
        const emfPerTurn2 = (vNom / a / n2).toFixed(3);

        return (
          <div style={{marginBottom:16,padding:"12px",background:"rgba(74,222,128,0.05)",border:"1px solid rgba(74,222,128,0.2)",borderRadius:9}}>
            {/* Type + ratio */}
            <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:12}}>
              <span style={{fontSize:10,color:tipoColor,fontWeight:700,background:`${tipoColor}18`,padding:"3px 9px",borderRadius:12}}>
                {tipo}
              </span>
              <div style={{textAlign:"right"}}>
                <div style={{fontSize:14,color:"#22d3ee",fontWeight:700}}>a = {a.toFixed(3)}</div>
                <div style={{fontSize:8,color:"#3a6a8a"}}>N₁/N₂</div>
              </div>
            </div>

            {/* ── TURN VISUALIZER ── */}
            <div style={{marginBottom:12,padding:"10px",background:"rgba(2,9,20,0.5)",borderRadius:7,border:"1px solid #0f2040"}}>
              <div style={{fontSize:8,color:"#4a7aaa",marginBottom:8,letterSpacing:"0.1em",fontWeight:700}}>
                VUELTAS — {scale > 1 ? `cada bloque = ${scale} vuelt.` : "cada bloque = 1 vuelta"}
              </div>

              {/* N1 bar */}
              <div style={{marginBottom:7}}>
                <div style={{display:"flex",justifyContent:"space-between",marginBottom:3}}>
                  <span style={{fontSize:10,color:"#f59e0b",fontWeight:700}}>Primario N₁</span>
                  <span style={{fontSize:13,color:"#f59e0b",fontWeight:700}}>{n1} vueltas</span>
                </div>
                <div style={{display:"flex",gap:2,flexWrap:"wrap"}}>
                  {Array.from({length:bars1},(_,i)=>(
                    <div key={i} style={{
                      width:7, height:14, borderRadius:2,
                      background:`hsl(${38 + i*(20/Math.max(bars1,1))},90%,55%)`,
                      opacity:0.85,
                      title:`Vuelta ${(i*scale)+1}–${Math.min((i+1)*scale, n1)}`,
                    }}/>
                  ))}
                </div>
              </div>

              {/* N2 bar */}
              <div>
                <div style={{display:"flex",justifyContent:"space-between",marginBottom:3}}>
                  <span style={{fontSize:10,color:"#60a5fa",fontWeight:700}}>Secundario N₂</span>
                  <span style={{fontSize:13,color:"#60a5fa",fontWeight:700}}>{n2} vueltas</span>
                </div>
                <div style={{display:"flex",gap:2,flexWrap:"wrap"}}>
                  {Array.from({length:bars2},(_,i)=>(
                    <div key={i} style={{
                      width:7, height:14, borderRadius:2,
                      background:`hsl(${210 + i*(20/Math.max(bars2,1))},80%,62%)`,
                      opacity:0.85,
                    }}/>
                  ))}
                </div>
              </div>
            </div>

            {/* ── LIVE FORMULAS ── */}
            <div style={{fontSize:10,color:"#4a7a9a",lineHeight:2.1,borderTop:"1px solid #0f2040",paddingTop:8}}>
              <div style={{display:"flex",justifyContent:"space-between"}}>
                <span>Relación de vueltas:</span>
                <strong style={{color:"#22d3ee"}}>N₁/N₂ = {n1}/{n2} = {a.toFixed(3)}</strong>
              </div>
              <div style={{display:"flex",justifyContent:"space-between"}}>
                <span>Voltaje secundario:</span>
                <strong style={{color:"#60a5fa"}}>V₂ = V₁ / {a.toFixed(2)}</strong>
              </div>
              <div style={{display:"flex",justifyContent:"space-between"}}>
                <span>FEM por vuelta (N₁):</span>
                <strong style={{color:"#f59e0b"}}>{emfPerTurn1} V/vta</strong>
              </div>
              <div style={{display:"flex",justifyContent:"space-between"}}>
                <span style={{color:"#a78bfa"}}>Eficiencia:</span>
                <strong style={{color:"#a78bfa"}}>{Math.round(eta*100)}%</strong>
              </div>
            </div>
          </div>
        );
      })()}

      {/* Sliders */}
      {fields.map(f => {
        const raw = comp[f.k] ?? f.min;
        const disp = f.scale ? Math.round(raw * f.scale) : raw;
        return (
          <div key={f.k} style={{marginBottom:18}}>
            <div style={{display:"flex",justifyContent:"space-between",alignItems:"baseline",marginBottom:5}}>
              <span style={{fontSize:11,color:"#5a8aaa"}}>{f.label}</span>
              <span style={{fontSize:15,fontWeight:700,color:f.color}}>{f.step<1?Number(disp).toFixed(2):Math.round(disp)}{f.unit}</span>
            </div>
            <input type="range"
              min={f.scale?f.min*f.scale:f.min} max={f.scale?f.max*f.scale:f.max}
              step={f.scale?1:f.step} value={disp}
              onChange={e=>onChange(comp.id,f.k,f.scale?+e.target.value/f.scale:+e.target.value)}
              style={{accentColor:f.color,width:"100%"}}/>
            {f.tip && <div style={{fontSize:9,color:"#2a4060",marginTop:3}}>{f.tip}</div>}
          </div>
        );
      })}

      {(comp.type==="voltmeter"||comp.type==="ammeter") && (
        <div style={{fontSize:11,color:"#4a6a8a",lineHeight:1.9,padding:"6px 0"}}>
          <div style={{color:"#6a9ab0",fontWeight:700,marginBottom:4}}>Solo lectura — sin parámetros</div>
          Conéctalo al circuito y mostrará el valor en tiempo real.
        </div>
      )}

      <button onClick={()=>onDelete(comp.id)}
        style={{marginTop:10,width:"100%",padding:"10px",background:"rgba(239,68,68,0.1)",color:"#f87171",border:"1px solid rgba(239,68,68,0.35)",borderRadius:8,fontSize:12,fontWeight:600,cursor:"pointer",letterSpacing:"0.06em",transition:"all 0.15s"}}
        onMouseEnter={e=>{e.currentTarget.style.background="rgba(239,68,68,0.2)";}}
        onMouseLeave={e=>{e.currentTarget.style.background="rgba(239,68,68,0.1)";}}>
        × Eliminar componente
      </button>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
//  MAIN APP
// ─────────────────────────────────────────────────────────────────────────────
export default function App() {
  const [comps,       setComps]       = useState([]);
  const [wires,       setWires]       = useState([]);
  const [selectedId,  setSelectedId]  = useState(null);
  const [pendingPort, setPendingPort] = useState(null);
  const [mousePos,    setMousePos]    = useState({x:0,y:0});
  const [powerOn,     setPowerOn]     = useState(false);
  const [toast,       setToast]       = useState(null);
  const [rightTab,    setRightTab]    = useState("editor");
  const [hovWireId,   setHovWireId]   = useState(null);
  const canvasRef   = useRef(null);
  const prevBulbRef = useRef(null);

  const state = useMemo(() => runPhysics(comps, wires, powerOn), [comps, wires, powerOn]);

  // Toast
  const showToast = useCallback((msg, type="ok") => {
    setToast({msg,type});
    setTimeout(()=>setToast(null), 4000);
  }, []);

  // Bulb explosion feedback
  useEffect(()=>{
    if(state.bulbState !== prevBulbRef.current) {
      if(state.bulbState==="exploded") showToast("💥 ¡El bombillo explotó! Voltaje demasiado alto.","danger");
      else if(state.bulbState==="burned") showToast("⚠ Bombillo dañado — reduce el voltaje.","warn");
      else if(state.bulbState==="on"&&(prevBulbRef.current==="off"||!prevBulbRef.current)) showToast("💡 ¡Circuito funcionando! El bombillo se encendió.","ok");
      prevBulbRef.current = state.bulbState;
    }
  },[state.bulbState,showToast]);

  // Circuit closed feedback
  useEffect(()=>{
    if(powerOn && !state.circuitOk && state.circuitMsg)
      showToast("⚠ "+state.circuitMsg,"warn");
  },[powerOn, state.circuitOk, state.circuitMsg]);

  // Port world pos
  const portWP = useCallback((compId, portId)=>{
    const c = comps.find(x=>x.id===compId);
    if(!c) return {x:0,y:0};
    const d = DEFS[c.type];
    const rot = c.rotation ?? 0;
    const ports = getPorts(c.type, d.w, d.h, rot);
    const p = ports.find(p=>p.id===portId);
    return {x: c.x + (p?.dx??0), y: c.y + (p?.dy??0)};
  },[comps]);

  // Drop
  const onDrop = useCallback((e)=>{
    e.preventDefault();
    const type = e.dataTransfer.getData("compType");
    if(!type) return;
    const rect = canvasRef.current.getBoundingClientRect();
    const x = snap(e.clientX-rect.left), y = snap(e.clientY-rect.top);
    const newComp = {id:uid(),type,x,y,...DEFS[type].defaults};
    setComps(prev=>[...prev,newComp]);
    setSelectedId(newComp.id);
    setRightTab("editor");
  },[]);

  // Drag component
  const startDragComp = useCallback((id, e) => {
    e.stopPropagation();
    if (pendingPort) return;
    setSelectedId(id); setRightTab("editor");
    const sx = e.clientX, sy = e.clientY;
    const c = comps.find(x => x.id === id);
    if (!c) return;
    const ox = c.x, oy = c.y;
    const mv = (me) => {
      setComps(prev => prev.map(x =>
        x.id === id ? { ...x, x: snap(ox + (me.clientX - sx)), y: snap(oy + (me.clientY - sy)) } : x
      ));
    };
    const up = () => {
      window.removeEventListener("mousemove", mv);
      window.removeEventListener("mouseup", up);
    };
    window.addEventListener("mousemove", mv);
    window.addEventListener("mouseup", up);
  }, [comps, pendingPort]);

  // Port click
  const onPortClick = useCallback((compId,portId,e)=>{
    e.stopPropagation();
    const wp = portWP(compId,portId);
    if(!pendingPort){
      setPendingPort({compId,portId,wx:wp.x,wy:wp.y});
    } else {
      if(pendingPort.compId!==compId){
        const from=portWP(pendingPort.compId,pendingPort.portId);
        const to=portWP(compId,portId);
        const mx=(from.x+to.x)/2,my=(from.y+to.y)/2;
        // Use orthogonal mid-handle for cleaner default wires
        const handle = Math.abs(from.x-to.x) > Math.abs(from.y-to.y)
          ? {x:mx, y:from.y}
          : {x:from.x, y:my};
        setWires(prev=>[...prev,{id:uid(),fromId:pendingPort.compId,fromPort:pendingPort.portId,toId:compId,toPort:portId,handles:[handle]}]);
        showToast("✓ Cable conectado — doble-click en el cable para agregar puntos","ok");
      }
      setPendingPort(null);
    }
  },[pendingPort,portWP,showToast]);

  const onMouseMove = useCallback((e)=>{
    const r=canvasRef.current?.getBoundingClientRect();if(!r)return;
    setMousePos({x:e.clientX-r.left,y:e.clientY-r.top});
  },[]);

  const onCanvasClick = useCallback(()=>{
    if(pendingPort){setPendingPort(null);return;}
    setSelectedId(null);
  },[pendingPort]);

  const updateComp=(id,k,v)=>setComps(prev=>prev.map(c=>c.id===id?{...c,[k]:v}:c));
  const deleteComp=(id)=>{setComps(p=>p.filter(c=>c.id!==id));setWires(p=>p.filter(w=>w.fromId!==id&&w.toId!==id));setSelectedId(null);};
  const deleteWire=(id)=>setWires(p=>p.filter(w=>w.id!==id));

  useEffect(()=>{
    const h=(e)=>{if(e.key==="Escape")setPendingPort(null);};
    window.addEventListener("keydown",h);return()=>window.removeEventListener("keydown",h);
  },[]);

  const sel = comps.find(c=>c.id===selectedId)??null;
  const isActive = !!state.active;
  const speed    = state.wireSpeed??0;
  const wireCol  = state.sat?"#f59e0b":isActive?"#4ade80":"#1e3a5f";
  // Particle animation duration: fast current = short duration
  const pDur   = speed>0 ? Math.max(0.4, 2.2-speed*1.8).toFixed(2) : "2.00";
  const dDur   = speed>0 ? Math.max(0.35,1.5-speed*1.2).toFixed(2) : "1.50";
  const nParts = Math.max(2,Math.min(6,Math.round(2+speed*4)));
  const pSize  = 3.5+speed*5;
  const wireW  = isActive ? 4+speed*3 : 3;

  const cats = ["Fuente","Núcleo","Carga","Instrumento"];
  const catLabel = {Fuente:"Fuentes",Núcleo:"Núcleo Magnético",Carga:"Cargas",Instrumento:"Instrumentos"};

  // Circuit status
  const {closed:circClosed, reason:circReason} = validateCircuit(comps,wires);

  return (
    <div style={{display:"flex",height:"100vh",background:"#030b1f",overflow:"hidden",fontFamily:"'JetBrains Mono','Courier New',monospace"}}>
      <style>{`
        @keyframes blink      {0%,100%{opacity:1}50%{opacity:0.18}}
        @keyframes fadeUp     {from{opacity:0;transform:translateY(8px)}to{opacity:1;transform:none}}
        @keyframes flowDash   {from{stroke-dashoffset:0}to{stroke-dashoffset:-80}}
        @keyframes glowPulse  {0%,100%{opacity:0.12}50%{opacity:0.38}}
        @keyframes particleHalo{0%,100%{opacity:0.2}50%{opacity:0.5}}
        ::-webkit-scrollbar{width:3px}::-webkit-scrollbar-thumb{background:#1e3a5f}
        .chip:hover{background:rgba(255,255,255,0.05)!important;border-color:rgba(255,255,255,0.12)!important;transform:translateX(3px)}
        .portdot:hover{transform:scale(1.7)}
        .hdl{cursor:grab;transition:all 0.12s}
        .hdl:hover{fill:white!important;transform:scale(1.4)}
        .wire-hit:hover~.wire-hint{display:block}
        input[type=range]{-webkit-appearance:none;height:4px;border-radius:2px;outline:none;background:#0f2040;width:100%}
        input[type=range]::-webkit-slider-thumb{-webkit-appearance:none;width:16px;height:16px;border-radius:50%;cursor:pointer;border:2px solid #030b1f;background:#22d3ee}
        .rtab{border:none;background:transparent;cursor:pointer;padding:10px 6px;font-size:10px;letter-spacing:0.1em;transition:all 0.15s;font-family:inherit}
        .rtab:hover{color:#60a5fa!important}
      `}</style>

      {/* ══ LEFT SIDEBAR ══ */}
      <aside style={{width:218,background:"#020912",borderRight:"1px solid #0f2040",display:"flex",flexDirection:"column",flexShrink:0,overflowY:"auto"}}>
        <div style={{padding:"16px 14px 10px",borderBottom:"1px solid #0f2040"}}>
          <div style={{display:"flex",alignItems:"center",gap:10,marginBottom:8}}>
            <div style={{width:34,height:34,borderRadius:9,background:"rgba(74,222,128,0.12)",border:"1px solid rgba(74,222,128,0.3)",display:"flex",alignItems:"center",justifyContent:"center",fontSize:18}}>⚡</div>
            <div>
              <div style={{fontSize:11,fontWeight:700,color:"#4ade80",letterSpacing:"0.2em"}}>TRANSFORMER LAB</div>
              <div style={{fontSize:7.5,color:"#1e3654",letterSpacing:"0.1em"}}>Simulador · IEC 60076</div>
            </div>
          </div>
          <div style={{fontSize:9,color:"#2a4a6a",lineHeight:2}}>
            1. Arrastra componentes al lienzo<br/>
            2. Conecta los puertos <span style={{color:"#4ade80"}}>●</span><br/>
            3. Cierra el circuito completo<br/>
            4. Enciende el sistema
          </div>
        </div>

        {/* Circuit status indicator */}
        <div style={{
          margin:"10px 10px 0",padding:"8px 10px",borderRadius:8,
          background:circClosed?"rgba(74,222,128,0.07)":"rgba(239,68,68,0.07)",
          border:`1px solid ${circClosed?"rgba(74,222,128,0.25)":"rgba(239,68,68,0.25)"}`,
        }}>
          <div style={{fontSize:9,fontWeight:700,color:circClosed?"#4ade80":"#f87171",marginBottom:3,letterSpacing:"0.08em"}}>
            {circClosed?"✓ CIRCUITO CERRADO":"✗ CIRCUITO ABIERTO"}
          </div>
          <div style={{fontSize:8,color:circClosed?"#2a6a4a":"#7a2a2a",lineHeight:1.6}}>
            {circClosed?"El circuito está listo para operar.":circReason||"Conecta todos los componentes."}
          </div>
        </div>

        {/* ON/OFF */}
        <div style={{padding:"12px 10px",borderBottom:"1px solid #0f2040"}}>
          <button onClick={()=>{setPowerOn(p=>!p);if(!powerOn)prevBulbRef.current=null;}}
            style={{
              width:"100%",padding:"11px 0",borderRadius:10,border:"none",cursor:"pointer",
              fontSize:12,fontWeight:700,letterSpacing:"0.18em",transition:"all 0.25s",
              background:powerOn?"rgba(74,222,128,0.14)":"rgba(239,68,68,0.12)",
              color:powerOn?"#4ade80":"#f87171",
              boxShadow:powerOn?"0 0 18px rgba(74,222,128,0.26)":"0 0 10px rgba(239,68,68,0.12)",
              outline:`1px solid ${powerOn?"rgba(74,222,128,0.38)":"rgba(239,68,68,0.36)"}`,
              opacity: circClosed||!powerOn ? 1 : 0.6,
            }}>
            <span style={{display:"inline-block",width:10,height:10,borderRadius:"50%",marginRight:8,verticalAlign:"middle",
              background:powerOn?"#4ade80":"#ef4444",
              boxShadow:powerOn?"0 0 8px #4ade80":"0 0 5px #ef4444",
              animation:powerOn?"blink 2s infinite":"none"}}/>
            {powerOn?"ENERGÍA: ON":"ENERGÍA: OFF"}
          </button>
          {!circClosed && powerOn && (
            <div style={{fontSize:8,color:"#f87171",textAlign:"center",marginTop:5}}>
              Circuito abierto — no fluye corriente
            </div>
          )}
        </div>

        {/* Palette */}
        {cats.map(cat=>{
          const items=Object.entries(DEFS).filter(([,d])=>d.cat===cat);
          if(!items.length)return null;
          return (
            <div key={cat}>
              <div style={{padding:"10px 12px 5px",fontSize:8,color:"#2a4a6a",textTransform:"uppercase",letterSpacing:"0.18em",fontWeight:700}}>
                {catLabel[cat]}
              </div>
              {items.map(([type,def])=>(
                <div key={type} className="chip" draggable
                  onDragStart={e=>e.dataTransfer.setData("compType",type)}
                  style={{display:"flex",alignItems:"center",gap:9,margin:"2px 6px",padding:"8px 9px",borderRadius:9,border:"1px solid transparent",cursor:"grab",transition:"all 0.15s",userSelect:"none"}}>
                  <div style={{width:40,height:40,borderRadius:8,background:"rgba(15,32,64,0.8)",border:`1px solid ${def.color}22`,display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0,overflow:"hidden"}}>
                    <div style={{transform:"scale(0.42)",transformOrigin:"center",pointerEvents:"none",lineHeight:0}}>
                      <CompSVG comp={{id:"",type,...def.defaults}} state={{}}/>
                    </div>
                  </div>
                  <div style={{minWidth:0}}>
                    <div style={{display:"flex",alignItems:"center",gap:5}}>
                      <span style={{fontSize:10.5,color:"#94a3b8",fontWeight:600}}>{def.label}</span>
                      <span style={{fontSize:9,color:def.color,background:`${def.color}18`,padding:"1px 5px",borderRadius:4,fontWeight:700}}>{def.symbol}</span>
                    </div>
                    <div style={{fontSize:7.5,color:"#2a4060",marginTop:2,lineHeight:1.3,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap",maxWidth:118}}>
                      {def.desc.split('.')[0]}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          );
        })}

        <div style={{marginTop:"auto",padding:"10px 12px",borderTop:"1px solid #0f2040"}}>
          <div style={{fontSize:8,color:"#1e3654",lineHeight:2.4}}>
            <div><span style={{color:"#4ade80"}}>●</span> Puerto = punto de conexión</div>
            <div><span style={{color:"#4ade80"}}>Clic</span> en cable = desconectar</div>
            <div><span style={{color:"#22d3ee"}}>Arrastra</span> cable = doblarlo</div>
            <div style={{color:"#f59e0b"}}>⚠ Circuito cerrado = corriente fluye</div>
          </div>
        </div>
      </aside>

      {/* ══ CANVAS ══ */}
      <div style={{flex:1,position:"relative",overflow:"hidden"}}>
        {/* Grid */}
        <svg style={{position:"absolute",inset:0,width:"100%",height:"100%",pointerEvents:"none",opacity:0.1}}>
          <defs><pattern id="dg" width={GRID} height={GRID} patternUnits="userSpaceOnUse"><circle cx={0} cy={0} r={1.2} fill="#1e3a5f"/></pattern></defs>
          <rect width="100%" height="100%" fill="url(#dg)"/>
        </svg>

        <BGDiagram/>

        <div ref={canvasRef} style={{position:"absolute",inset:0}}
          onDrop={onDrop} onDragOver={e=>e.preventDefault()}
          onMouseMove={onMouseMove} onClick={onCanvasClick}>

          {/* Wire SVG */}
          <svg style={{position:"absolute",inset:0,width:"100%",height:"100%",overflow:"visible"}}>
            <defs>
              <filter id="wg">
                <feGaussianBlur stdDeviation="3" result="b"/>
                <feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge>
              </filter>
              <filter id="wg2">
                <feGaussianBlur stdDeviation="1.5" result="b"/>
                <feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge>
              </filter>
            </defs>

            {wires.map(w=>{
              const from = portWP(w.fromId,w.fromPort);
              const to   = portWP(w.toId,  w.toPort);
              const d    = buildPath(from,to,w.handles||[]);
              const handles = w.handles||[];
              const mid = handles.length>0
                ? handles[Math.floor(handles.length/2)]
                : {x:(from.x+to.x)/2,y:(from.y+to.y)/2};
              const isHov = hovWireId===w.id;

              return (
                <g key={w.id}>
                  {/* === OUTER ENERGY GLOW — size proportional to power === */}
                  {isActive && <path d={d} fill="none" stroke={wireCol} strokeWidth={wireW+18+speed*14} opacity={0.03+speed*0.055}/>}
                  {isActive && <path d={d} fill="none" stroke={wireCol} strokeWidth={wireW+8} opacity={0.08+speed*0.09} filter="url(#wg)"/>}

                  {/* === DARK CABLE BODY === */}
                  <path d={d} fill="none" stroke={isActive?"#0f1e38":"#0c1a2e"} strokeWidth={wireW} strokeLinecap="round"/>

                  {/* === NEON CORE LINE — animated dashes === */}
                  {isActive && (
                    <path d={d} fill="none" stroke={wireCol}
                      strokeWidth={1.8+speed*1.6}
                      strokeLinecap="round"
                      strokeDasharray={`${10+speed*5} ${4+speed*2}`}
                      opacity={0.95}
                      style={{animation:`flowDash ${dDur}s linear infinite`}}/>
                  )}

                  {/* === ENERGY PARTICLES === */}
                  {isActive && Array.from({length:nParts},(_,i)=>{
                    const delay = (parseFloat(pDur)*i/nParts).toFixed(2);
                    return (
                      <g key={i}>
                        <circle r={pSize+4} fill={wireCol} opacity={0.12} style={{animation:`particleHalo ${pDur}s ${delay}s linear infinite`}}>
                          <animateMotion dur={`${pDur}s`} begin={`${delay}s`} repeatCount="indefinite" path={d}/>
                        </circle>
                        <circle r={pSize} fill={wireCol} opacity={0.95} filter="url(#wg2)">
                          <animateMotion dur={`${pDur}s`} begin={`${delay}s`} repeatCount="indefinite" path={d}/>
                        </circle>
                        <circle r={pSize*0.42} fill="white" opacity={0.75}>
                          <animateMotion dur={`${pDur}s`} begin={`${delay}s`} repeatCount="indefinite" path={d}/>
                        </circle>
                      </g>
                    );
                  })}

                  {/* === HOVER HINT === */}
                  {isHov && (
                    <text x={mid.x} y={mid.y - 14} textAnchor="middle"
                      fontSize={9} fill="#22d3ee" opacity={0.75}
                      style={{pointerEvents:"none"}}>
                      {isActive ? `${fmt(state.I2??0,2)}A` : "clic = borrar · arrastra = doblar"}
                    </text>
                  )}

                  {/* === DRAG SURFACE — click to delete, drag to bend === */}
                  <path d={d} fill="none" stroke="transparent" strokeWidth={26}
                    style={{cursor: isHov ? "pointer" : "pointer"}}
                    onMouseEnter={()=>setHovWireId(w.id)}
                    onMouseLeave={()=>setHovWireId(null)}
                    onMouseDown={e=>{
                      if(e.button !== 0) return;
                      e.stopPropagation();
                      const r = canvasRef.current?.getBoundingClientRect();
                      if(!r) return;
                      const startX = e.clientX;
                      const startY = e.clientY;
                      const px = startX - r.left;
                      const py = startY - r.top;
                      let dragging = false;
                      let newHIdx = 0;
                      const DRAG_THRESHOLD = 5; // pixels before we consider it a drag

                      const mv = (me) => {
                        const dx = me.clientX - startX;
                        const dy = me.clientY - startY;

                        if (!dragging && Math.hypot(dx, dy) > DRAG_THRESHOLD) {
                          // Threshold crossed — insert handle and start drag
                          dragging = true;
                          setWires(prev => {
                            const updated = prev.map(ww => {
                              if(ww.id !== w.id) return ww;
                              const fromPt = portWP(ww.fromId, ww.fromPort);
                              const toPt   = portWP(ww.toId,   ww.toPort);
                              const allPts = [fromPt, ...(ww.handles||[]), toPt];
                              let bestIdx = 0, bestDist = Infinity;
                              for(let i=0;i<allPts.length-1;i++){
                                const mx=(allPts[i].x+allPts[i+1].x)/2;
                                const my=(allPts[i].y+allPts[i+1].y)/2;
                                const dist = Math.hypot(mx-px, my-py);
                                if(dist < bestDist){ bestDist=dist; bestIdx=i; }
                              }
                              newHIdx = bestIdx;
                              const h = [...(ww.handles||[])];
                              h.splice(bestIdx, 0, {x:px, y:py});
                              return {...ww, handles:h};
                            });
                            return updated;
                          });
                        }

                        if (dragging) {
                          const x = me.clientX - r.left;
                          const y = me.clientY - r.top;
                          setWires(prev => prev.map(ww => {
                            if(ww.id !== w.id) return ww;
                            const h = [...(ww.handles||[])];
                            if(h[newHIdx] !== undefined) h[newHIdx] = {x, y};
                            return {...ww, handles:h};
                          }));
                        }
                      };

                      const up = (me) => {
                        window.removeEventListener("mousemove", mv, true);
                        window.removeEventListener("mouseup",   up, true);
                        if (!dragging) {
                          // No drag → it was a click → delete the wire
                          deleteWire(w.id);
                        }
                      };

                      window.addEventListener("mousemove", mv, true);
                      window.addEventListener("mouseup",   up, true);
                    }}
                    onClick={e=>e.stopPropagation()}
                    onDoubleClick={e=>e.stopPropagation()}
                  />

                  {/* === ENDPOINT DOTS === */}
                  <circle cx={from.x} cy={from.y} r={isActive?5+speed*2:4} fill={wireCol} opacity={0.65} style={{pointerEvents:"none"}}/>
                  <circle cx={to.x}   cy={to.y}   r={isActive?5+speed*2:4} fill={wireCol} opacity={0.65} style={{pointerEvents:"none"}}/>

                  {/* === CURRENT LABEL on wire (active only) === */}
                  {isActive && (
                    <g style={{pointerEvents:"none"}}>
                      <rect x={mid.x-26} y={mid.y-11} width={52} height={20} rx={5}
                        fill="rgba(2,9,20,0.92)" stroke={`${wireCol}55`} strokeWidth={1}/>
                      <text x={mid.x} y={mid.y+4} textAnchor="middle"
                        fontSize={9} fill={wireCol} fontFamily="monospace" fontWeight="bold">
                        {fmt(state.I2??0,2)}A
                      </text>
                    </g>
                  )}
                </g>
              );
            })}

            {/* Pending wire */}
            {pendingPort && (
              <line x1={pendingPort.wx} y1={pendingPort.wy} x2={mousePos.x} y2={mousePos.y}
                stroke="#3b82f6" strokeWidth={2.5} strokeDasharray="10 6" opacity={0.85}
                style={{pointerEvents:"none"}}/>
            )}
          </svg>

          {/* Components */}
          {comps.map(comp=>{
            const def   = DEFS[comp.type];
            const w = def.w, h = def.h;
            const rot   = comp.rotation ?? 0; // 0 | 90 | 180 | 270
            const isSel = selectedId === comp.id;

            // For 90/270 the bounding box swaps w↔h visually — we keep the div
            // w×h but rotate the inner SVG, so ports need to follow the rotation.
            const ports = getPorts(comp.type, w, h, rot);

            // Rotate helper: cycle by step
            const rotate = (e, step) => {
              e.stopPropagation();
              updateComp(comp.id, "rotation", ((rot + step) + 360) % 360);
            };

            return (
              <div key={comp.id}
                style={{
                  position:"absolute",
                  left:comp.x - w/2, top:comp.y - h/2,
                  width:w, height:h,
                  zIndex:isSel ? 60 : 20,
                  cursor: pendingPort ? "crosshair" : "grab",
                  animation:"fadeUp 0.2s ease",
                  userSelect:"none", overflow:"visible",
                }}
                onMouseDown={e=>startDragComp(comp.id,e)}
                onClick={e=>{e.stopPropagation();setSelectedId(comp.id);setRightTab("editor");}}>

                {/* Selection ring */}
                {isSel && <div style={{position:"absolute",inset:-8,borderRadius:13,border:"2px solid #22d3ee",boxShadow:"0 0 0 4px rgba(34,211,238,0.12)",pointerEvents:"none"}}/>}
                {/* Active aura */}
                {isActive && <div style={{position:"absolute",inset:-18,borderRadius:18,background:`radial-gradient(ellipse,${state.sat?"rgba(245,158,11,0.08)":"rgba(74,222,128,0.07)"} 0%,transparent 70%)`,pointerEvents:"none"}}/>}

                {/* SVG — rotated around its center */}
                <div style={{
                  transform:`rotate(${rot}deg)`,
                  transformOrigin:"center center",
                  width:"100%", height:"100%",
                  display:"flex", alignItems:"center", justifyContent:"center",
                }}>
                  <CompSVG comp={comp} state={state}/>
                </div>

                {/* Name tag — always readable, unrotated */}
                <div style={{
                  position:"absolute", bottom:h+8, left:"50%", transform:"translateX(-50%)",
                  display:"flex", alignItems:"center", gap:5,
                  background:"rgba(2,9,20,0.96)", border:`1px solid ${def.color}50`,
                  padding:"4px 10px", borderRadius:7,
                  pointerEvents:"none", whiteSpace:"nowrap", zIndex:200,
                  boxShadow:`0 0 10px ${def.color}22`,
                }}>
                  <span style={{fontSize:11,color:def.color,fontWeight:700}}>{def.label}</span>
                  <span style={{fontSize:9,color:def.color,opacity:0.7,background:`${def.color}22`,padding:"1px 5px",borderRadius:4,fontWeight:600}}>
                    {rot !== 0 ? `${rot}°` : def.sign}
                  </span>
                </div>

                {/* Rotation controls — shown when selected */}
                {isSel && (
                  <div style={{
                    position:"absolute", top:-40, left:"50%", transform:"translateX(-50%)",
                    display:"flex", alignItems:"center", gap:4,
                    background:"rgba(2,9,20,0.96)", border:"1px solid #22d3ee44",
                    borderRadius:20, padding:"4px 8px", zIndex:300,
                    boxShadow:"0 0 12px rgba(34,211,238,0.15)",
                  }}>
                    {/* Counter-clockwise */}
                    <button
                      onMouseDown={e=>e.stopPropagation()}
                      onClick={e=>rotate(e,-90)}
                      title="Rotar 90° izquierda"
                      style={{
                        width:22,height:22,borderRadius:"50%",border:"1px solid #22d3ee55",
                        background:"rgba(34,211,238,0.1)",color:"#22d3ee",
                        cursor:"pointer",fontSize:13,display:"flex",alignItems:"center",justifyContent:"center",
                        transition:"all 0.15s",padding:0,lineHeight:1,
                      }}
                      onMouseEnter={e=>{e.currentTarget.style.background="rgba(34,211,238,0.25)";}}
                      onMouseLeave={e=>{e.currentTarget.style.background="rgba(34,211,238,0.1)";}}>
                      ↺
                    </button>
                    {/* Degree indicator */}
                    <span style={{fontSize:9,color:"#22d3ee",minWidth:28,textAlign:"center",fontWeight:700}}>
                      {rot}°
                    </span>
                    {/* Clockwise */}
                    <button
                      onMouseDown={e=>e.stopPropagation()}
                      onClick={e=>rotate(e,+90)}
                      title="Rotar 90° derecha"
                      style={{
                        width:22,height:22,borderRadius:"50%",border:"1px solid #22d3ee55",
                        background:"rgba(34,211,238,0.1)",color:"#22d3ee",
                        cursor:"pointer",fontSize:13,display:"flex",alignItems:"center",justifyContent:"center",
                        transition:"all 0.15s",padding:0,lineHeight:1,
                      }}
                      onMouseEnter={e=>{e.currentTarget.style.background="rgba(34,211,238,0.25)";}}
                      onMouseLeave={e=>{e.currentTarget.style.background="rgba(34,211,238,0.1)";}}>
                      ↻
                    </button>
                  </div>
                )}

                {/* Delete button */}
                {isSel && (
                  <button
                    style={{position:"absolute",top:-14,right:-14,width:22,height:22,borderRadius:"50%",background:"#ef4444",color:"white",border:"none",cursor:"pointer",fontSize:14,zIndex:70,display:"flex",alignItems:"center",justifyContent:"center",padding:0}}
                    onMouseDown={e=>e.stopPropagation()}
                    onClick={e=>{e.stopPropagation();deleteComp(comp.id);}}>
                    ×
                  </button>
                )}

                {/* Port dots — positioned using rotated offsets */}
                {ports.map(port=>{
                  const isPend = pendingPort?.compId===comp.id && pendingPort?.portId===port.id;
                  const hasW   = wires.some(ww=>(ww.fromId===comp.id&&ww.fromPort===port.id)||(ww.toId===comp.id&&ww.toPort===port.id));
                  return (
                    <div key={port.id} className="portdot"
                      title={`${port.label} — click para conectar`}
                      style={{
                        position:"absolute",
                        left: w/2 + port.dx - 9,
                        top:  h/2 + port.dy - 9,
                        width:18, height:18, borderRadius:"50%",
                        background: isPend?"#3b82f6" : hasW?(isActive?"#f59e0b":"#1e3a5f") : "rgba(74,222,128,0.2)",
                        border:`2.5px solid ${isPend?"#60a5fa":hasW?(isActive?"#f59e0b":"#2a4a70"):"#4ade80"}`,
                        cursor:"crosshair", zIndex:30,
                        transition:"transform 0.12s",
                        boxShadow: isPend?"0 0 14px rgba(59,130,246,0.9)":hasW&&isActive?"0 0 8px #f59e0b55":"none",
                      }}
                      onClick={e=>onPortClick(comp.id,port.id,e)}>
                      <span style={{
                        position:"absolute", bottom:"100%", left:"50%",
                        transform:"translateX(-50%)", marginBottom:3,
                        fontSize:8, color:isPend?"#60a5fa":hasW&&isActive?"#f59e0b":"#4ade80",
                        pointerEvents:"none", whiteSpace:"nowrap", fontWeight:700,
                      }}>{port.label}</span>
                    </div>
                  );
                })}
              </div>
            );
          })}

          {/* Empty state */}
          {comps.length===0 && (
            <div style={{position:"absolute",bottom:32,left:"50%",transform:"translateX(-50%)",background:"rgba(2,9,22,0.96)",border:"1px solid #0f2040",borderRadius:14,padding:"16px 30px",color:"#2a4a6a",fontSize:12,textAlign:"center",lineHeight:2.3,pointerEvents:"none",animation:"fadeUp 0.4s ease",zIndex:10}}>
              <div style={{color:"#4ade80",fontSize:16,marginBottom:6}}>⚡ Bienvenido al simulador</div>
              <div>1. Arrastra una <span style={{color:"#f59e0b"}}>Fuente AC</span></div>
              <div>2. Arrastra un <span style={{color:"#4ade80"}}>Transformador</span></div>
              <div>3. Arrastra un <span style={{color:"#fbbf24"}}>Bombillo</span> o <span style={{color:"#a78bfa"}}>Resistencia</span></div>
              <div>4. <span style={{color:"#4ade80"}}>Conecta todos los puertos</span> para cerrar el circuito</div>
              <div>5. Enciende el sistema</div>
            </div>
          )}

          {pendingPort && (
            <div style={{position:"absolute",top:16,left:"50%",transform:"translateX(-50%)",background:"rgba(59,130,246,0.14)",border:"1px solid #3b82f6",color:"#60a5fa",fontSize:11,padding:"7px 20px",borderRadius:22,pointerEvents:"none"}}>
              ● Haz click en otro puerto para conectar — ESC cancela
            </div>
          )}
        </div>

        {/* Status badges */}
        <div style={{position:"absolute",top:16,right:16,zIndex:200,display:"flex",flexDirection:"column",gap:6}}>
          <div style={{background:isActive?"rgba(74,222,128,0.1)":"rgba(15,32,64,0.9)",border:`1px solid ${isActive?"rgba(74,222,128,0.4)":"#0f2040"}`,color:isActive?"#4ade80":"#2a4a70",fontSize:10,padding:"5px 16px",borderRadius:22,display:"flex",alignItems:"center",gap:8,letterSpacing:"0.1em"}}>
            <span style={{width:8,height:8,borderRadius:"50%",background:isActive?"#4ade80":"#1e3a5f",display:"inline-block",...(isActive?{animation:"blink 1.5s infinite"}:{})}}/>
            {isActive?"EN SERVICIO":"SIN ENERGÍA"}
          </div>
          {!circClosed && comps.length>0 && (
            <div style={{background:"rgba(239,68,68,0.1)",border:"1px solid rgba(239,68,68,0.4)",color:"#f87171",fontSize:9,padding:"5px 14px",borderRadius:22,textAlign:"center",maxWidth:200,lineHeight:1.5}}>
              ✗ CIRCUITO ABIERTO
            </div>
          )}
          {state.sat && (
            <div style={{background:"rgba(245,158,11,0.12)",border:"1px solid #f59e0b",color:"#f59e0b",fontSize:10,padding:"5px 16px",borderRadius:22,animation:"blink 0.8s infinite",textAlign:"center"}}>
              ⚠ SATURACIÓN
            </div>
          )}
          {isActive && <div style={{background:"rgba(34,211,238,0.08)",border:"1px solid rgba(34,211,238,0.25)",color:"#22d3ee",fontSize:9,padding:"4px 12px",borderRadius:22,textAlign:"center",opacity:0.8}}>
            ⚡ {fmt(state.I2??0,2)}A · {fmt(state.V2??0,1)}V
          </div>}
        </div>

        {/* Clear */}
        <div style={{position:"absolute",bottom:16,right:16,zIndex:200}}>
          <button onClick={()=>{setComps([]);setWires([]);setSelectedId(null);setPowerOn(false);prevBulbRef.current=null;}}
            style={{background:"rgba(3,11,31,0.9)",border:"1px solid #0f2040",color:"#2a4a6a",fontSize:10,padding:"7px 16px",borderRadius:8,cursor:"pointer",letterSpacing:"0.1em",transition:"all 0.15s"}}
            onMouseEnter={e=>{e.currentTarget.style.borderColor="#ef4444";e.currentTarget.style.color="#ef4444";}}
            onMouseLeave={e=>{e.currentTarget.style.borderColor="#0f2040";e.currentTarget.style.color="#2a4a6a";}}>
            LIMPIAR TODO
          </button>
        </div>

        {/* Toast */}
        {toast && (
          <div style={{position:"absolute",bottom:70,left:"50%",transform:"translateX(-50%)",background:toast.type==="danger"?"rgba(127,29,29,0.97)":toast.type==="warn"?"rgba(78,52,9,0.97)":"rgba(5,46,22,0.97)",border:`1px solid ${toast.type==="danger"?"#ef4444":toast.type==="warn"?"#f59e0b":"#4ade80"}`,color:toast.type==="danger"?"#fca5a5":toast.type==="warn"?"#fcd34d":"#86efac",fontSize:12,padding:"10px 24px",borderRadius:22,zIndex:500,animation:"fadeUp 0.3s ease",whiteSpace:"nowrap",maxWidth:"80%",textAlign:"center"}}>
            {toast.msg}
          </div>
        )}
      </div>

      {/* ══ RIGHT PANEL ══ */}
      <aside style={{width:268,background:"#020912",borderLeft:"1px solid #0f2040",display:"flex",flexDirection:"column",flexShrink:0}}>
        <div style={{display:"flex",borderBottom:"1px solid #0f2040"}}>
          {[["metrics","⚡ MEDICIONES"],["editor","✏️ EDITOR"]].map(([t,label])=>(
            <button key={t} className="rtab" onClick={()=>setRightTab(t)}
              style={{flex:1,color:rightTab===t?"#60a5fa":"#2a4a70",borderBottom:rightTab===t?"2px solid #3b82f6":"2px solid transparent"}}>
              {label}
            </button>
          ))}
        </div>

        <div style={{flex:1,overflowY:"auto"}}>
          {rightTab==="metrics" && (
            <div style={{padding:"14px 16px"}}>
              {/* Circuit status card */}
              <div style={{
                padding:"10px 12px",borderRadius:9,marginBottom:14,
                background:circClosed?"rgba(74,222,128,0.06)":"rgba(239,68,68,0.07)",
                border:`1px solid ${circClosed?"rgba(74,222,128,0.2)":"rgba(239,68,68,0.25)"}`,
              }}>
                <div style={{fontSize:11,fontWeight:700,color:circClosed?"#4ade80":"#f87171",marginBottom:4}}>
                  {circClosed?"✓ Circuito cerrado":"✗ Circuito abierto"}
                </div>
                <div style={{fontSize:10,color:circClosed?"#2a6a4a":"#6a2a2a",lineHeight:1.7}}>
                  {circClosed
                    ? powerOn?"El sistema está activo y entregando energía.":"Enciende el sistema para activar el circuito."
                    : circReason||"Conecta todos los componentes correctamente."}
                </div>
              </div>

              <div style={{fontSize:9,color:"#4a7aaa",letterSpacing:"0.16em",marginBottom:10,textTransform:"uppercase",fontWeight:700}}>
                Mediciones en tiempo real
              </div>

              {[
                {l:"V₁ Voltaje primario",   v:fmt(state.V1??0,0),           u:"V",  c:"#f59e0b"},
                {l:"V₂ Voltaje secundario",  v:fmt(state.V2??0,1),           u:"V",  c:"#60a5fa"},
                {l:"I₁ Corriente primaria",  v:fmt(state.I1??0,3),           u:"A",  c:"#f59e0b"},
                {l:"I₂ Corriente secundaria",v:fmt(state.I2??0,3),           u:"A",  c:"#60a5fa"},
                {l:"S Potencia aparente",    v:fmt(state.S??0,1),            u:"VA", c:"#4ade80"},
                {l:"P Potencia útil",        v:fmt(state.P??0,1),            u:"W",  c:"#4ade80"},
                {l:"Pérdidas núcleo",        v:fmt(state.Ploss??0,2),        u:"W",  c:"#f87171"},
                {l:"Rendimiento η",          v:fmt((state.eta??0.95)*100,1), u:"%",  c:"#a78bfa"},
              ].map(r=>(
                <div key={r.l} style={{display:"flex",justifyContent:"space-between",alignItems:"center",padding:"6px 0",borderBottom:"1px solid #0a1830"}}>
                  <span style={{fontSize:10,color:"#5a8aaa"}}>{r.l}</span>
                  <span style={{fontSize:13,fontWeight:700,color:r.c}}>{r.v}<span style={{fontSize:9,marginLeft:2,opacity:0.5}}>{r.u}</span></span>
                </div>
              ))}

              {/* Ratio */}
              <div style={{marginTop:12,padding:"10px 12px",background:"rgba(34,211,238,0.06)",border:"1px solid rgba(34,211,238,0.2)",borderRadius:8}}>
                <div style={{fontSize:9,color:"#4a8aaa",fontWeight:700,letterSpacing:"0.1em",marginBottom:5}}>RELACIÓN DE TRANSFORMACIÓN</div>
                <div style={{fontSize:20,color:"#22d3ee",fontWeight:700,marginBottom:4}}>a = {fmt(state.ratio??2,2)}</div>
                <div style={{fontSize:10,color:"#4a7a9a",lineHeight:1.9}}>
                  V₁/V₂ = N₁/N₂ = {fmt(state.ratio??2,2)}<br/>
                  V₂ = {fmt(state.V1??0,0)} ÷ {fmt(state.ratio??2,2)} = <strong style={{color:"#60a5fa"}}>{fmt(state.V2??0,1)} V</strong>
                </div>
              </div>

              {/* Bulb alert */}
              {state.bulbState==="exploded" && (
                <div style={{marginTop:10,padding:"9px 12px",background:"rgba(127,29,29,0.25)",border:"1px solid #ef4444",borderRadius:8,color:"#fca5a5",fontSize:11,lineHeight:1.7,animation:"blink 0.5s infinite"}}>
                  💥 Bombillo destruido. V₂ superó 2.4× el nominal. Baja el voltaje o aumenta la relación a.
                </div>
              )}
              {state.bulbState==="burned" && (
                <div style={{marginTop:10,padding:"9px 12px",background:"rgba(78,52,9,0.3)",border:"1px solid #f59e0b",borderRadius:8,color:"#fcd34d",fontSize:11,lineHeight:1.7}}>
                  ⚠ Bombillo dañado. V₂={fmt(state.V2??0,1)}V supera el voltaje nominal.
                </div>
              )}

              {/* Wire speed */}
              {isActive && (
                <div style={{marginTop:12,padding:"10px 12px",background:"rgba(34,211,238,0.05)",border:"1px solid rgba(34,211,238,0.2)",borderRadius:8}}>
                  <div style={{fontSize:9,color:"#4a8aaa",fontWeight:700,letterSpacing:"0.08em",marginBottom:7}}>VELOCIDAD DE ELECTRONES</div>
                  <div style={{height:8,background:"#0a1830",borderRadius:4,overflow:"hidden",marginBottom:6}}>
                    <div style={{height:"100%",width:`${Math.min(speed*100,100)}%`,background:speed>0.7?"#ef4444":speed>0.4?"#f59e0b":"#4ade80",borderRadius:4,transition:"width 0.4s"}}/>
                  </div>
                  <div style={{fontSize:10,color:"#5a8aaa"}}>
                    I₂ = <strong style={{color:"#60a5fa"}}>{fmt(state.I2??0,3)}A</strong>
                    <span style={{marginLeft:8,color:"#3a6a8a"}}>velocidad ×{fmt(speed*10,1)}</span>
                  </div>
                </div>
              )}

              {/* Formulas */}
              <div style={{marginTop:12,padding:"10px 12px",background:"rgba(74,222,128,0.04)",border:"1px solid rgba(74,222,128,0.15)",borderRadius:8}}>
                <div style={{fontSize:9,color:"#4a8a6a",marginBottom:8,letterSpacing:"0.1em",fontWeight:700}}>FÓRMULAS</div>
                {[["a = N₁/N₂","Relación de transformación"],["V₁/V₂ = N₁/N₂","Voltaje ∝ vueltas"],["I₁/I₂ = N₂/N₁","Corriente inversa"],["P = V × I","Potencia eléctrica"],["R = V²/W","Resistencia del bombillo"],["V = I × R","Ley de Ohm"]].map(([f,d])=>(
                  <div key={f} style={{display:"flex",alignItems:"baseline",gap:8,marginBottom:5}}>
                    <span style={{fontSize:10,color:"#4ade80",flexShrink:0,minWidth:110,fontWeight:700}}>{f}</span>
                    <span style={{fontSize:9,color:"#2a5a3a"}}>{d}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {rightTab==="editor" && <PropEditor comp={sel} onChange={updateComp} onDelete={deleteComp}/>}
        </div>
      </aside>
    </div>
  );
}