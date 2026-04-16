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
  source:      { label:"Fuente AC",      symbol:"~",  sign:"V~",      color:"#f59e0b", w:90,  h:52, cat:"Fuente",       desc:"Genera el voltaje de entrada al circuito.",         defaults:{ voltage:120, frequency:60 } },
  transformer: { label:"Transformador",  symbol:"TX", sign:"N₁/N₂",   color:"#4ade80", w:160, h:72, cat:"Núcleo",        desc:"Transforma voltaje según la relación N₁/N₂.",       defaults:{ efficiency:0.95, n1:200, n2:100, ratedVoltage:120 } },
  bulb:        { label:"Bombillo",       symbol:"💡", sign:"W",        color:"#fbbf24", w:72,  h:72, cat:"Carga",         desc:"Convierte energía eléctrica en luz.",               defaults:{ ratedWatts:60, ratedVoltage:60 } },
  resistor:    { label:"Resistencia",    symbol:"Ω",  sign:"R=V/I",    color:"#a78bfa", w:84,  h:46, cat:"Carga",         desc:"Limita la corriente. Disipa calor.",                defaults:{ resistance:100 } },
  voltmeter:   { label:"Voltímetro",     symbol:"V",  sign:"⊙V",       color:"#60a5fa", w:68,  h:52, cat:"Instrumento",   desc:"Mide el voltaje sin afectar el circuito.",          defaults:{} },
  ammeter:     { label:"Amperímetro",    symbol:"A",  sign:"⊙A",       color:"#34d399", w:68,  h:52, cat:"Instrumento",   desc:"Mide la corriente sin afectar el circuito.",        defaults:{} },
};

function getPorts(type, w, h, rotation = 0) {
  const hw = w / 2;
  const hh = h / 2;
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
  if (comps.length === 0) return { closed: false, reason: "Arrastra componentes al lienzo." };
  const src = comps.find(c => c.type === "source");
  if (!src) return { closed: false, reason: "Se necesita una Fuente AC." };
  const hasLoad = comps.some(c => c.type === "bulb" || c.type === "resistor");
  if (!hasLoad) return { closed: false, reason: "Agrega una carga: Bombillo o Resistencia." };
  if (wires.length === 0) return { closed: false, reason: "Conecta los componentes con cables." };
  const adj = {};
  comps.forEach(c => { adj[c.id] = new Set(); });
  wires.forEach(w => {
    if (adj[w.fromId] !== undefined) adj[w.fromId].add(w.toId);
    if (adj[w.toId]   !== undefined) adj[w.toId].add(w.fromId);
  });
  const isolated = comps.filter(c => adj[c.id].size === 0);
  if (isolated.length > 0) {
    const names = isolated.map(c => DEFS[c.type]?.label ?? c.type).join(", ");
    return { closed: false, reason: `Desconectado: ${names}.` };
  }
  const visited = new Set([src.id]);
  const queue = [src.id];
  while (queue.length) {
    const cur = queue.shift();
    for (const nb of adj[cur]) {
      if (!visited.has(nb)) { visited.add(nb); queue.push(nb); }
    }
  }
  if (visited.size < comps.length) {
    return { closed: false, reason: "Partes desconectadas." };
  }
  if (wires.length < comps.length) {
    return { closed: false, reason: "Circuito abierto — cierra el lazo de retorno." };
  }
  return { closed: true, reason: "" };
}

// ─────────────────────────────────────────────────────────────────────────────
//  PHYSICS ENGINE
// ─────────────────────────────────────────────────────────────────────────────
function runPhysics(comps, wires, powerOn) {
  const empty = { V1:0, V2:0, I1:0, I2:0, S:0, P:0, Ploss:0, eta:0.95,
    ratio:2, n1:200, n2:100, active:false, bulbState:"off", wireSpeed:0,
    circuitOk:false, circuitMsg:"", fluxPct:0 };

  const { closed, reason } = validateCircuit(comps, wires);
  if (!closed) return { ...empty, circuitMsg: reason };

  const src = comps.find(c => c.type === "source");
  const tx  = comps.find(c => c.type === "transformer");
  const n1     = tx ? Math.max(1, tx.n1 ?? 200) : 1;
  const n2     = tx ? Math.max(1, tx.n2 ?? 100) : 1;
  const ratio  = n1 / n2;
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
  const Bmax    = V1 / (n1 * freq);
  const BmaxRef = 120 / (200 * 60);
  const fluxPct = clamp(Bmax / BmaxRef, 0, 1);

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
    fluxPct, freq };
}

// ─────────────────────────────────────────────────────────────────────────────
//  WIRE PATH
// ─────────────────────────────────────────────────────────────────────────────
function buildPath(from, to, handles) {
  const pts = [from, ...(handles || []), to];
  if (pts.length === 2) {
    const mx = (from.x + to.x) / 2;
    return `M${from.x} ${from.y} C${mx} ${from.y} ${mx} ${to.y} ${to.x} ${to.y}`;
  }
  const T = 0.5;
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
        <circle cx={cx} cy={cy} r={20} fill="#060d1a" stroke={active?"#f59e0b":"#1e3a5f"} strokeWidth={active?2:1.5}/>
        <path d={`M${cx-12} ${cy} Q${cx-6} ${cy-9} ${cx} ${cy} Q${cx+6} ${cy+9} ${cx+12} ${cy}`}
          fill="none" stroke={c} strokeWidth={2.2} strokeLinecap="round"/>
        <line x1={0} y1={cy} x2={cx-20} y2={cy} stroke={c} strokeWidth={2}/>
        <line x1={cx+20} y1={cy} x2={w} y2={cy} stroke={c} strokeWidth={2}/>
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
    const maxArcs = 10;
    const scale = Math.max(1, Math.ceil(Math.min(n1,n2) / maxArcs));
    const vis1 = Math.round(n1 / scale);
    const vis2 = Math.round(n2 / scale);
    const arcW = 8, arcH = 6;
    const coil1W = vis1 * arcW;
    const coil2W = vis2 * arcW;
    const VW = Math.max(w, 24 + coil1W + 14 + coil2W + 24);
    const VH = h;
    const coreX = 24 + coil1W + 4;
    const coreW = 6;
    const fluxPct = state?.fluxPct ?? 0;
    return (
      <svg width={w} height={VH} viewBox={`0 0 ${VW} ${VH}`} preserveAspectRatio="xMidYMid meet">
        <line x1={0} y1={cy-18} x2={24} y2={cy-18} stroke={cp} strokeWidth={2}/>
        <line x1={0} y1={cy+18} x2={24} y2={cy+18} stroke={cp} strokeWidth={2}/>
        {Array.from({length:vis1},(_,i)=>(
          <path key={`pt${i}`} d={`M${24+i*arcW} ${cy-18} A${arcW/2} ${arcH} 0 0 1 ${24+(i+1)*arcW} ${cy-18}`}
            fill="none" stroke={active?"#f59e0b":"#64748b"} strokeWidth={2.2}/>
        ))}
        {Array.from({length:vis1},(_,i)=>(
          <path key={`pb${i}`} d={`M${24+i*arcW} ${cy+18} A${arcW/2} ${arcH} 0 0 1 ${24+(i+1)*arcW} ${cy+18}`}
            fill="none" stroke={active?"#f59e0b":"#64748b"} strokeWidth={2.2}/>
        ))}
        <line x1={coreX} y1={cy-24} x2={coreX} y2={cy+24} stroke={cc} strokeWidth={5}/>
        <line x1={coreX+coreW} y1={cy-24} x2={coreX+coreW} y2={cy+24} stroke={cc} strokeWidth={5}/>
        <line x1={coreX-1} y1={cy-24} x2={coreX+coreW+1} y2={cy-24} stroke={cc} strokeWidth={3}/>
        <line x1={coreX-1} y1={cy+24} x2={coreX+coreW+1} y2={cy+24} stroke={cc} strokeWidth={3}/>
        {active && (
          <rect x={coreX-1} y={cy-24} width={coreW+2} height={48}
            fill={fluxPct>0.8?"#ef4444":fluxPct>0.5?"#f59e0b":"#4ade80"}
            opacity={0.12 + fluxPct*0.22}/>
        )}
        {Array.from({length:vis2},(_,i)=>(
          <path key={`st${i}`} d={`M${coreX+coreW+4+i*arcW} ${cy-18} A${arcW/2} ${arcH} 0 0 0 ${coreX+coreW+4+(i+1)*arcW} ${cy-18}`}
            fill="none" stroke={active?"#60a5fa":"#64748b"} strokeWidth={2.2}/>
        ))}
        {Array.from({length:vis2},(_,i)=>(
          <path key={`sb${i}`} d={`M${coreX+coreW+4+i*arcW} ${cy+18} A${arcW/2} ${arcH} 0 0 0 ${coreX+coreW+4+(i+1)*arcW} ${cy+18}`}
            fill="none" stroke={active?"#60a5fa":"#64748b"} strokeWidth={2.2}/>
        ))}
        <line x1={coreX+coreW+4+coil2W} y1={cy-18} x2={VW} y2={cy-18} stroke={cs} strokeWidth={2}/>
        <line x1={coreX+coreW+4+coil2W} y1={cy+18} x2={VW} y2={cy+18} stroke={cs} strokeWidth={2}/>
        <text x={24+coil1W/2} y={cy-26} textAnchor="middle" fontSize={8} fill="#f59e0b" fontWeight="700">N₁={n1}</text>
        <text x={coreX+coreW+4+coil2W/2} y={cy+32} textAnchor="middle" fontSize={8} fill="#60a5fa" fontWeight="700">N₂={n2}</text>
        <text x={VW/2} y={10} textAnchor="middle" fontSize={7} fill={active?"#4ade80":"#475569"}>
          a={fmt(n1/n2,3)} · η={Math.round((comp.efficiency??0.95)*100)}%
        </text>
      </svg>
    );
  }

  if (type === "bulb") {
    const bs = state?.bulbState??"off";
    const on = bs==="on", burned=bs==="burned", exploded=bs==="exploded";
    return (
      <svg width={w} height={h} viewBox={`0 0 ${w} ${h}`}>
        <path d={`M${cx-16} ${cy+10} Q${cx-22} ${cy} ${cx-18} ${cy-12} Q${cx-14} ${cy-24} ${cx} ${cy-24} Q${cx+14} ${cy-24} ${cx+18} ${cy-12} Q${cx+22} ${cy} ${cx+16} ${cy+10} Z`}
          fill={exploded?"#450a0a":burned?"#1c0a00":on?"rgba(254,240,138,0.08)":"#060d1a"}
          stroke={exploded?"#ef4444":burned?"#b45309":on?"#fbbf24":"#1e3a5f"}
          strokeWidth={1.8}/>
        {!exploded && (
          <path d={`M${cx-6} ${cy+6} Q${cx-2} ${cy-2} ${cx} ${cy+1} Q${cx+2} ${cy+5} ${cx+6} ${cy-1}`}
            fill="none" strokeWidth={2.2} strokeLinecap="round"
            stroke={burned?"#78350f":on?"#fef08a":"#1e3a5f"}/>
        )}
        <rect x={cx-12} y={cy+10} width={24} height={5} rx={1.5} fill={burned||exploded?"#7c2d12":"#0f2040"} stroke={burned||exploded?"#c2410c":"#1e3a5f"} strokeWidth={1}/>
        <rect x={cx-10} y={cy+15} width={20} height={4} rx={1}   fill={burned||exploded?"#6b2109":"#0a1828"} stroke={burned||exploded?"#b83c0e":"#1e3a5f"} strokeWidth={1}/>
        <rect x={cx-8}  y={cy+19} width={16} height={8} rx={1}   fill={burned||exploded?"#4a1208":"#060f1e"} stroke={burned||exploded?"#9a3009":"#1e3a5f"} strokeWidth={1}/>
        <line x1={cx-4} y1={cy+27} x2={cx-4} y2={cy+35} stroke={burned||exploded?"#c2410c":"#1e3a5f"} strokeWidth={2}/>
        <line x1={cx+4} y1={cy+27} x2={cx+4} y2={cy+35} stroke={burned||exploded?"#c2410c":"#1e3a5f"} strokeWidth={2}/>
        <line x1={0} y1={cy} x2={cx-16} y2={cy} stroke={on?"#fbbf24":"#475569"} strokeWidth={2}/>
        <line x1={cx+16} y1={cy} x2={w} y2={cy} stroke={on?"#fbbf24":"#475569"} strokeWidth={2}/>
        <text x={cx} y={5} textAnchor="middle" fontSize={7} fill={exploded?"#ef4444":burned?"#f59e0b":on?"#fbbf24":"#475569"}>
          {exploded?"QUEMADO":burned?"DAÑADO":on?`${fmt(state?.V2??0,1)}V`:`${comp.ratedWatts??60}W`}
        </text>
      </svg>
    );
  }

  if (type === "resistor") {
    const c = active?"#a78bfa":"#475569";
    return (
      <svg width={w} height={h} viewBox={`0 0 ${w} ${h}`}>
        <line x1={0} y1={cy} x2={13} y2={cy} stroke={c} strokeWidth={2}/>
        <line x1={w-13} y1={cy} x2={w} y2={cy} stroke={c} strokeWidth={2}/>
        <rect x={13} y={cy-8} width={w-26} height={16} rx={2} fill="#060d1a"
          stroke={active?"#a78bfa":"#1e3a5f"} strokeWidth={active?1.8:1.2}/>
        <polyline points={`15,${cy} 21,${cy-6} 28,${cy+6} 35,${cy-6} 42,${cy+6} 49,${cy-6} 56,${cy+6} 63,${cy-6} 68,${cy}`}
          fill="none" stroke={active?"#a78bfa":"#334155"} strokeWidth={1.8}/>
        <text x={cx} y={cy-12} textAnchor="middle" fontSize={8} fill="#a78bfa">{comp.resistance}Ω</text>
      </svg>
    );
  }

  if (type === "voltmeter") {
    const c = active?"#60a5fa":"#475569";
    return (
      <svg width={w} height={h} viewBox={`0 0 ${w} ${h}`}>
        <line x1={0} y1={cy} x2={cx-18} y2={cy} stroke={c} strokeWidth={2}/>
        <line x1={cx+18} y1={cy} x2={w} y2={cy} stroke={c} strokeWidth={2}/>
        <circle cx={cx} cy={cy} r={18} fill="#060d1a" stroke={active?"#60a5fa":"#1e3a5f"} strokeWidth={active?1.8:1.2}/>
        <text x={cx} y={cy+5} textAnchor="middle" fontSize={13} fill={c} fontWeight="700">V</text>
        {active && <text x={cx} y={cy-22} textAnchor="middle" fontSize={8} fill="#60a5fa">{fmt(state?.V2??0,1)}V</text>}
      </svg>
    );
  }

  if (type === "ammeter") {
    const c = active?"#34d399":"#475569";
    return (
      <svg width={w} height={h} viewBox={`0 0 ${w} ${h}`}>
        <line x1={0} y1={cy} x2={cx-18} y2={cy} stroke={c} strokeWidth={2}/>
        <line x1={cx+18} y1={cy} x2={w} y2={cy} stroke={c} strokeWidth={2}/>
        <circle cx={cx} cy={cy} r={18} fill="#060d1a" stroke={active?"#34d399":"#1e3a5f"} strokeWidth={active?1.8:1.2}/>
        <text x={cx} y={cy+5} textAnchor="middle" fontSize={13} fill={c} fontWeight="700">A</text>
        {active && <text x={cx} y={cy-22} textAnchor="middle" fontSize={8} fill="#34d399">{fmt(state?.I2??0,3)}A</text>}
      </svg>
    );
  }
  return null;
}

// ─────────────────────────────────────────────────────────────────────────────
//  PROP EDITOR
// ─────────────────────────────────────────────────────────────────────────────
function PropEditor({ comp, onChange, onDelete }) {
  if (!comp) return (
    <div style={{padding:"16px",color:"#475569",fontSize:11,lineHeight:1.8}}>
      <div style={{fontSize:12,fontWeight:700,color:"#64748b",marginBottom:6}}>Sin selección</div>
      Haz click en un componente del lienzo para editar sus propiedades.
    </div>
  );
  const def = DEFS[comp.type];

  const FIELDS = {
    source:      [
      {k:"voltage",   unit:"V",  label:"Voltaje V₁",  min:12,  max:480, step:6,  color:"#f59e0b", tip:"Energía de entrada al circuito"},
      {k:"frequency", unit:"Hz", label:"Frecuencia",   min:50,  max:60,  step:10, color:"#fb923c", tip:"50Hz Europa · 60Hz América"},
    ],
    transformer: [
      {k:"n1",          unit:"vueltas", label:"Vueltas primario N₁",  min:10, max:800, step:10, color:"#f59e0b", tip:"Más vueltas = más voltaje en bobina"},
      {k:"n2",          unit:"vueltas", label:"Vueltas secundario N₂", min:10, max:800, step:10, color:"#60a5fa", tip:"N₂>N₁→sube · N₂<N₁→baja"},
      {k:"efficiency",  unit:"%",       label:"Eficiencia η",          min:70, max:99,  step:1,  color:"#a78bfa", scale:100, tip:"Pérdidas en núcleo y cobre"},
      {k:"ratedVoltage",unit:"V",       label:"Voltaje nominal",       min:12, max:480, step:12, color:"#fbbf24", tip:"Voltaje máximo de diseño"},
    ],
    bulb:     [
      {k:"ratedWatts",  unit:"W", label:"Potencia nominal", min:5,  max:500, step:5, color:"#fbbf24", tip:"R=V²/W"},
      {k:"ratedVoltage",unit:"V", label:"Voltaje nominal",  min:12, max:240, step:6, color:"#fb923c", tip:"V₂>2.4× → explota"},
    ],
    resistor: [{k:"resistance", unit:"Ω", label:"Resistencia R", min:1, max:2000, step:1, color:"#a78bfa", tip:"Oposición al flujo de corriente"}],
    voltmeter:[], ammeter:[],
  };

  const fields = FIELDS[comp.type] ?? [];

  return (
    <div style={{padding:"14px"}}>
      {/* Header */}
      <div style={{display:"flex",alignItems:"center",gap:10,marginBottom:14,paddingBottom:12,borderBottom:"0.5px solid #1e293b"}}>
        <div style={{width:40,height:40,borderRadius:8,flexShrink:0,background:`${def.color}14`,border:`0.5px solid ${def.color}40`,display:"flex",alignItems:"center",justifyContent:"center",fontSize:18}}>
          {def.symbol}
        </div>
        <div>
          <div style={{fontSize:13,fontWeight:700,color:def.color}}>{def.label}</div>
          <div style={{fontSize:9,color:"#475569",marginTop:2,lineHeight:1.5}}>{def.desc}</div>
        </div>
      </div>

      {/* Bulb info */}
      {comp.type==="bulb" && (
        <div style={{marginBottom:14,padding:"8px 10px",background:"rgba(251,191,36,0.06)",border:"0.5px solid rgba(251,191,36,0.3)",borderRadius:6,fontSize:10,color:"#fbbf24",lineHeight:1.7}}>
          R = V²/W = {(((comp.ratedVoltage??60)**2)/Math.max(comp.ratedWatts??60,1)).toFixed(1)} Ω
          <div style={{fontSize:8,color:"#92400e",marginTop:3}}>V₂ &gt; 2.4× voltaje nominal → explota</div>
        </div>
      )}

      {/* Transformer live card */}
      {comp.type==="transformer" && (() => {
        const n1 = Math.max(1, comp.n1 ?? 200);
        const n2 = Math.max(1, comp.n2 ?? 100);
        const a  = n1 / n2;
        const eta = comp.efficiency ?? 0.95;
        const tipo = a > 1.02 ? "Reductor (Step-Down)" : a < 0.98 ? "Elevador (Step-Up)" : "Igualador (1:1)";
        const tipoColor = a > 1.02 ? "#f59e0b" : a < 0.98 ? "#60a5fa" : "#4ade80";
        return (
          <div style={{marginBottom:14,padding:"10px",background:"rgba(74,222,128,0.04)",border:"0.5px solid rgba(74,222,128,0.2)",borderRadius:8}}>
            <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:8}}>
              <span style={{fontSize:9,color:tipoColor,background:`${tipoColor}14`,padding:"2px 7px",borderRadius:10,fontWeight:700}}>{tipo}</span>
              <span style={{fontSize:13,color:"#22d3ee",fontWeight:700}}>a = {a.toFixed(3)}</span>
            </div>
            <div style={{fontSize:9,color:"#475569",lineHeight:2}}>
              <div>N₁/N₂ = {n1}/{n2} = {a.toFixed(3)}</div>
              <div>V₂ = V₁ / {a.toFixed(2)}</div>
              <div>η = {Math.round(eta*100)}%</div>
            </div>
          </div>
        );
      })()}

      {/* Sliders */}
      {fields.map(f => {
        const raw = comp[f.k] ?? f.min;
        const disp = f.scale ? Math.round(raw * f.scale) : raw;
        return (
          <div key={f.k} style={{marginBottom:16}}>
            <div style={{display:"flex",justifyContent:"space-between",alignItems:"baseline",marginBottom:4}}>
              <span style={{fontSize:10,color:"#64748b"}}>{f.label}</span>
              <span style={{fontSize:14,fontWeight:700,color:f.color}}>{f.step<1?Number(disp).toFixed(2):Math.round(disp)}{f.unit}</span>
            </div>
            <input type="range"
              min={f.scale?f.min*f.scale:f.min} max={f.scale?f.max*f.scale:f.max}
              step={f.scale?1:f.step} value={disp}
              onChange={e=>onChange(comp.id,f.k,f.scale?+e.target.value/f.scale:+e.target.value)}
              style={{accentColor:f.color,width:"100%"}}/>
            {f.tip && <div style={{fontSize:9,color:"#334155",marginTop:2}}>{f.tip}</div>}
          </div>
        );
      })}

      {(comp.type==="voltmeter"||comp.type==="ammeter") && (
        <div style={{fontSize:10,color:"#475569",lineHeight:1.8,padding:"4px 0"}}>
          <div style={{color:"#64748b",fontWeight:700,marginBottom:3}}>Solo lectura</div>
          Conéctalo al circuito para ver su valor en tiempo real.
        </div>
      )}

      <button onClick={()=>onDelete(comp.id)}
        style={{marginTop:12,width:"100%",padding:"8px",background:"rgba(239,68,68,0.08)",color:"#f87171",border:"0.5px solid rgba(239,68,68,0.3)",borderRadius:6,fontSize:11,fontWeight:600,cursor:"pointer",fontFamily:"inherit",transition:"all 0.15s"}}
        onMouseEnter={e=>{e.currentTarget.style.background="rgba(239,68,68,0.16)"}}
        onMouseLeave={e=>{e.currentTarget.style.background="rgba(239,68,68,0.08)"}}>
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

  const showToast = useCallback((msg, type="ok") => {
    setToast({msg,type});
    setTimeout(()=>setToast(null), 4000);
  }, []);

  useEffect(()=>{
    if(state.bulbState !== prevBulbRef.current) {
      if(state.bulbState==="exploded") showToast("El bombillo explotó — voltaje demasiado alto.","danger");
      else if(state.bulbState==="burned") showToast("Bombillo dañado — reduce el voltaje.","warn");
      else if(state.bulbState==="on"&&(prevBulbRef.current==="off"||!prevBulbRef.current)) showToast("Circuito activo — bombillo encendido.","ok");
      prevBulbRef.current = state.bulbState;
    }
  },[state.bulbState,showToast]);

  const portWP = useCallback((compId, portId)=>{
    const c = comps.find(x=>x.id===compId);
    if(!c) return {x:0,y:0};
    const d = DEFS[c.type];
    const rot = c.rotation ?? 0;
    const ports = getPorts(c.type, d.w, d.h, rot);
    const p = ports.find(p=>p.id===portId);
    return {x: c.x + (p?.dx??0), y: c.y + (p?.dy??0)};
  },[comps]);

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
        const handle = Math.abs(from.x-to.x) > Math.abs(from.y-to.y)
          ? {x:mx, y:from.y}
          : {x:from.x, y:my};
        setWires(prev=>[...prev,{id:uid(),fromId:pendingPort.compId,fromPort:pendingPort.portId,toId:compId,toPort:portId,handles:[handle]}]);
        showToast("Cable conectado — click para borrar, arrastra para doblar","ok");
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
  const wireCol  = state.sat?"#f59e0b":isActive?"#4ade80":"#334155";
  const pDur     = speed>0 ? Math.max(0.4, 2.2-speed*1.8).toFixed(2) : "2.00";
  const dDur     = speed>0 ? Math.max(0.35,1.5-speed*1.2).toFixed(2) : "1.50";
  const nParts   = Math.max(2,Math.min(5,Math.round(2+speed*3)));
  const wireW    = isActive ? 3.5+speed*2.5 : 2.5;
  const { closed:circClosed, reason:circReason } = validateCircuit(comps,wires);
  const cats = ["Fuente","Núcleo","Carga","Instrumento"];
  const catLabel = {Fuente:"Fuentes",Núcleo:"Núcleo magnético",Carga:"Cargas",Instrumento:"Instrumentos"};

  return (
    <div style={{display:"flex",height:"100vh",background:"#0a0f1e",color:"#e2e8f0",overflow:"hidden",fontFamily:"'Courier New', monospace"}}>
      <style>{`
        @keyframes blink      {0%,100%{opacity:1}50%{opacity:.2}}
        @keyframes fadeUp     {from{opacity:0;transform:translateY(5px)}to{opacity:1;transform:none}}
        @keyframes flowDash   {from{stroke-dashoffset:0}to{stroke-dashoffset:-60}}
        ::-webkit-scrollbar{width:3px}::-webkit-scrollbar-thumb{background:#1e293b}
        .chip:hover{background:rgba(55,138,221,0.08)!important}
        .portdot{transition:transform .1s}.portdot:hover{transform:scale(1.5)}
        .btn-icon{background:transparent;border:0.5px solid #1e3a5f;color:#475569;cursor:pointer;border-radius:6px;font-size:11px;padding:4px 8px;font-family:inherit;transition:all .15s}
        .btn-icon:hover{border-color:#378add;color:#60a5fa}
        input[type=range]{-webkit-appearance:none;height:4px;border-radius:2px;background:#1e293b;outline:none;width:100%}
        input[type=range]::-webkit-slider-thumb{-webkit-appearance:none;width:14px;height:14px;border-radius:50%;cursor:pointer;border:2px solid #0a0f1e;background:#378add}
      `}</style>

      {/* ══ LEFT SIDEBAR ══ */}
      <aside style={{width:192,background:"#060d1a",borderRight:"0.5px solid #1e293b",display:"flex",flexDirection:"column",flexShrink:0,overflowY:"auto"}}>
        <div style={{padding:"14px 14px 10px",borderBottom:"0.5px solid #1e293b"}}>
          <div style={{fontSize:10,color:"#4ade80",letterSpacing:"0.15em",marginBottom:2}}>⚡ TRANSFORMER LAB</div>
          <div style={{fontSize:8,color:"#334155",letterSpacing:"0.08em"}}>IEC 60076 · Simulador AC</div>
        </div>

        {/* Circuit status indicator */}
        <div style={{margin:"10px 10px 0",padding:"8px 10px",borderRadius:6,background:circClosed?"rgba(74,222,128,0.05)":"rgba(239,68,68,0.05)",border:`0.5px solid ${circClosed?"rgba(74,222,128,0.25)":"rgba(239,68,68,0.25)"}`}}>
          <div style={{fontSize:9,fontWeight:700,color:circClosed?"#4ade80":"#f87171",letterSpacing:"0.06em"}}>
            {circClosed?"✓ CIRCUITO CERRADO":"✗ CIRCUITO ABIERTO"}
          </div>
          <div style={{fontSize:8,color:circClosed?"#2a6a4a":"#6a2a2a",marginTop:2,lineHeight:1.5}}>
            {circClosed?"Listo para operar.":circReason||"Conecta los componentes."}
          </div>
        </div>

        {/* ON/OFF */}
        <div style={{padding:"10px",borderBottom:"0.5px solid #1e293b"}}>
          <button onClick={()=>{setPowerOn(p=>!p);if(!powerOn)prevBulbRef.current=null;}}
            style={{width:"100%",padding:"9px 0",borderRadius:8,border:"none",cursor:"pointer",fontSize:11,fontWeight:700,letterSpacing:"0.12em",transition:"all 0.2s",background:powerOn?"rgba(74,222,128,0.1)":"rgba(239,68,68,0.08)",color:powerOn?"#4ade80":"#f87171",outline:`0.5px solid ${powerOn?"rgba(74,222,128,0.35)":"rgba(239,68,68,0.3)"}`,fontFamily:"inherit"}}>
            <span style={{display:"inline-block",width:8,height:8,borderRadius:"50%",marginRight:7,verticalAlign:"middle",background:powerOn?"#4ade80":"#ef4444",animation:powerOn?"blink 2s infinite":"none"}}/>
            {powerOn?"ENERGÍA: ON":"ENERGÍA: OFF"}
          </button>
        </div>

        {/* Palette */}
        {cats.map(cat=>{
          const items=Object.entries(DEFS).filter(([,d])=>d.cat===cat);
          if(!items.length)return null;
          return (
            <div key={cat}>
              <div style={{padding:"10px 14px 4px",fontSize:8,color:"#334155",textTransform:"uppercase",letterSpacing:"0.14em",fontWeight:700}}>
                {catLabel[cat]}
              </div>
              {items.map(([type,def])=>(
                <div key={type} className="chip" draggable
                  onDragStart={e=>e.dataTransfer.setData("compType",type)}
                  style={{display:"flex",alignItems:"center",gap:8,margin:"2px 6px",padding:"6px 8px",borderRadius:6,border:"0.5px solid transparent",cursor:"grab",transition:"all 0.15s",userSelect:"none"}}>
                  <div style={{width:36,height:28,display:"flex",alignItems:"center",justifyContent:"center",background:"rgba(255,255,255,0.03)",border:"0.5px solid #1e293b",borderRadius:5,flexShrink:0,overflow:"hidden"}}>
                    <div style={{transform:"scale(0.4)",transformOrigin:"center",pointerEvents:"none",lineHeight:0}}>
                      <CompSVG comp={{id:"",type,...def.defaults}} state={{}}/>
                    </div>
                  </div>
                  <div style={{minWidth:0}}>
                    <div style={{display:"flex",alignItems:"center",gap:5}}>
                      <span style={{fontSize:10,color:"#94a3b8"}}>{def.label}</span>
                      <span style={{fontSize:8,color:def.color,background:`${def.color}14`,padding:"1px 4px",borderRadius:3,fontWeight:700}}>{def.symbol}</span>
                    </div>
                    <div style={{fontSize:7.5,color:"#334155",marginTop:1,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap",maxWidth:110}}>
                      {def.desc.split(".")[0]}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          );
        })}

        <div style={{marginTop:"auto",padding:"10px 12px",borderTop:"0.5px solid #1e293b",fontSize:8,color:"#1e293b",lineHeight:2}}>
          <div><span style={{color:"#4ade80"}}>●</span> Puerto = punto de conexión</div>
          <div>Click en cable → borrar</div>
          <div>Arrastra cable → doblar</div>
        </div>
      </aside>

      {/* ══ CANVAS ══ */}
      <div style={{flex:1,position:"relative",overflow:"hidden"}}>
        {/* Dot grid */}
        <svg style={{position:"absolute",inset:0,width:"100%",height:"100%",pointerEvents:"none"}}>
          <defs><pattern id="dg" width={GRID} height={GRID} patternUnits="userSpaceOnUse"><circle cx={0} cy={0} r={0.8} fill="#1e293b"/></pattern></defs>
          <rect width="100%" height="100%" fill="url(#dg)"/>
        </svg>

        <div ref={canvasRef} style={{position:"absolute",inset:0}}
          onDrop={onDrop} onDragOver={e=>e.preventDefault()}
          onMouseMove={onMouseMove} onClick={onCanvasClick}>

          {/* Wire SVG */}
          <svg style={{position:"absolute",inset:0,width:"100%",height:"100%",overflow:"visible"}}>
            <defs>
              <filter id="wg">
                <feGaussianBlur stdDeviation="2" result="b"/>
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
                  {/* Halo glow when active */}
                  {isActive && <path d={d} fill="none" stroke={wireCol} strokeWidth={wireW+12} opacity={0.06+speed*0.05}/>}
                  {/* Cable body */}
                  <path d={d} fill="none" stroke={isActive?"#0f1e38":"#0f172a"} strokeWidth={wireW} strokeLinecap="round"/>
                  {/* Copper sheen when active */}
                  {isActive && (
                    <path d={d} fill="none" stroke={wireCol}
                      strokeWidth={1.6+speed*1.2}
                      strokeLinecap="round"
                      strokeDasharray={`${8+speed*4} ${3+speed*2}`}
                      opacity={0.9}
                      style={{animation:`flowDash ${dDur}s linear infinite`}}/>
                  )}
                  {/* Particles */}
                  {isActive && Array.from({length:nParts},(_,i)=>{
                    const delay = (parseFloat(pDur)*i/nParts).toFixed(2);
                    return (
                      <circle key={i} r={3.5+speed*3.5} fill={wireCol} opacity={0.9} filter="url(#wg)">
                        <animateMotion dur={`${pDur}s`} begin={`${delay}s`} repeatCount="indefinite" path={d}/>
                      </circle>
                    );
                  })}
                  {/* Hover label */}
                  {isHov && (
                    <text x={mid.x} y={mid.y-12} textAnchor="middle" fontSize={9} fill="#60a5fa" opacity={0.8} style={{pointerEvents:"none"}}>
                      {isActive?`${fmt(state.I2??0,2)}A`:"click = borrar · arrastra = doblar"}
                    </text>
                  )}
                  {/* Hit area */}
                  <path d={d} fill="none" stroke="transparent" strokeWidth={22}
                    style={{cursor:"pointer"}}
                    onMouseEnter={()=>setHovWireId(w.id)}
                    onMouseLeave={()=>setHovWireId(null)}
                    onMouseDown={e=>{
                      if(e.button!==0)return;
                      e.stopPropagation();
                      const r=canvasRef.current?.getBoundingClientRect();
                      if(!r)return;
                      const startX=e.clientX,startY=e.clientY;
                      const px=startX-r.left,py=startY-r.top;
                      let dragging=false,newHIdx=0;
                      const THRESH=5;
                      const mv=(me)=>{
                        const dx=me.clientX-startX,dy=me.clientY-startY;
                        if(!dragging&&Math.hypot(dx,dy)>THRESH){
                          dragging=true;
                          setWires(prev=>{
                            return prev.map(ww=>{
                              if(ww.id!==w.id)return ww;
                              const fp=portWP(ww.fromId,ww.fromPort),tp=portWP(ww.toId,ww.toPort);
                              const allPts=[fp,...(ww.handles||[]),tp];
                              let bestIdx=0,bestDist=Infinity;
                              for(let i=0;i<allPts.length-1;i++){
                                const mx=(allPts[i].x+allPts[i+1].x)/2,my=(allPts[i].y+allPts[i+1].y)/2;
                                const dist=Math.hypot(mx-px,my-py);
                                if(dist<bestDist){bestDist=dist;bestIdx=i;}
                              }
                              newHIdx=bestIdx;
                              const h=[...(ww.handles||[])];
                              h.splice(bestIdx,0,{x:px,y:py});
                              return{...ww,handles:h};
                            });
                          });
                        }
                        if(dragging){
                          const x=me.clientX-r.left,y=me.clientY-r.top;
                          setWires(prev=>prev.map(ww=>{
                            if(ww.id!==w.id)return ww;
                            const h=[...(ww.handles||[])];
                            if(h[newHIdx]!==undefined)h[newHIdx]={x,y};
                            return{...ww,handles:h};
                          }));
                        }
                      };
                      const up=(me)=>{
                        window.removeEventListener("mousemove",mv,true);
                        window.removeEventListener("mouseup",up,true);
                        if(!dragging)deleteWire(w.id);
                      };
                      window.addEventListener("mousemove",mv,true);
                      window.addEventListener("mouseup",up,true);
                    }}
                    onClick={e=>e.stopPropagation()}/>
                  {/* Endpoint dots */}
                  <circle cx={from.x} cy={from.y} r={isActive?4+speed*1.5:3} fill={wireCol} opacity={0.7} style={{pointerEvents:"none"}}/>
                  <circle cx={to.x}   cy={to.y}   r={isActive?4+speed*1.5:3} fill={wireCol} opacity={0.7} style={{pointerEvents:"none"}}/>
                  {/* Current label */}
                  {isActive && (
                    <g style={{pointerEvents:"none"}}>
                      <rect x={mid.x-22} y={mid.y-10} width={44} height={18} rx={4} fill="rgba(6,13,26,0.95)" stroke={`${wireCol}44`} strokeWidth={0.5}/>
                      <text x={mid.x} y={mid.y+3} textAnchor="middle" fontSize={8} fill={wireCol} fontWeight="700">{fmt(state.I2??0,2)}A</text>
                    </g>
                  )}
                </g>
              );
            })}

            {/* Pending wire */}
            {pendingPort && (
              <line x1={pendingPort.wx} y1={pendingPort.wy} x2={mousePos.x} y2={mousePos.y}
                stroke="#60a5fa" strokeWidth={2} strokeDasharray="8 5" opacity={0.8}
                style={{pointerEvents:"none"}}/>
            )}
          </svg>

          {/* Components */}
          {comps.map(comp=>{
            const def   = DEFS[comp.type];
            const w = def.w, h = def.h;
            const rot   = comp.rotation ?? 0;
            const isSel = selectedId === comp.id;
            const ports = getPorts(comp.type, w, h, rot);
            const rotate = (e, step) => {
              e.stopPropagation();
              updateComp(comp.id, "rotation", ((rot + step) + 360) % 360);
            };

            return (
              <div key={comp.id}
                style={{position:"absolute",left:comp.x-w/2,top:comp.y-h/2,width:w,height:h,zIndex:isSel?60:20,cursor:pendingPort?"crosshair":"grab",animation:"fadeUp 0.2s ease",userSelect:"none",overflow:"visible"}}
                onMouseDown={e=>startDragComp(comp.id,e)}
                onClick={e=>{e.stopPropagation();setSelectedId(comp.id);setRightTab("editor");}}>

                {/* Selection ring */}
                {isSel && <div style={{position:"absolute",inset:-6,borderRadius:10,border:"1.5px solid #2563eb",boxShadow:"0 0 0 3px rgba(37,99,235,0.18)",pointerEvents:"none"}}/>}
                {/* Active glow */}
                {isActive && <div style={{position:"absolute",inset:-14,borderRadius:14,background:`radial-gradient(ellipse,${state.sat?"rgba(245,158,11,0.06)":"rgba(74,222,128,0.06)"} 0%,transparent 70%)`,pointerEvents:"none"}}/>}

                {/* SVG */}
                <div style={{transform:`rotate(${rot}deg)`,transformOrigin:"center center",width:"100%",height:"100%",display:"flex",alignItems:"center",justifyContent:"center"}}>
                  <CompSVG comp={comp} state={state}/>
                </div>

                {/* Name tag */}
                <div style={{position:"absolute",bottom:h+6,left:"50%",transform:"translateX(-50%)",display:"flex",alignItems:"center",gap:4,background:"rgba(6,13,26,0.97)",border:`0.5px solid ${def.color}44`,padding:"3px 8px",borderRadius:5,pointerEvents:"none",whiteSpace:"nowrap",zIndex:200,boxShadow:`0 0 8px ${def.color}18`}}>
                  <span style={{fontSize:10,color:def.color,fontWeight:700}}>{def.label}</span>
                  <span style={{fontSize:8,color:def.color,opacity:0.6,background:`${def.color}18`,padding:"1px 4px",borderRadius:3}}>
                    {rot !== 0 ? `${rot}°` : def.sign}
                  </span>
                </div>

                {/* Rotation controls */}
                {isSel && (
                  <div style={{position:"absolute",top:-36,left:"50%",transform:"translateX(-50%)",display:"flex",alignItems:"center",gap:4,background:"rgba(6,13,26,0.97)",border:"0.5px solid #1e3a5f",borderRadius:20,padding:"3px 7px",zIndex:300}}>
                    <button className="btn-icon" onMouseDown={e=>e.stopPropagation()} onClick={e=>rotate(e,-90)}>↺</button>
                    <span style={{fontSize:9,color:"#60a5fa",minWidth:26,textAlign:"center",fontWeight:700}}>{rot}°</span>
                    <button className="btn-icon" onMouseDown={e=>e.stopPropagation()} onClick={e=>rotate(e,+90)}>↻</button>
                  </div>
                )}

                {/* Delete button */}
                {isSel && (
                  <button
                    style={{position:"absolute",top:-12,right:-12,width:20,height:20,borderRadius:"50%",background:"#ef4444",color:"white",border:"none",cursor:"pointer",fontSize:12,zIndex:70,display:"flex",alignItems:"center",justifyContent:"center",padding:0}}
                    onMouseDown={e=>e.stopPropagation()}
                    onClick={e=>{e.stopPropagation();deleteComp(comp.id);}}>
                    ×
                  </button>
                )}

                {/* Port dots */}
                {ports.map(port=>{
                  const isPend = pendingPort?.compId===comp.id && pendingPort?.portId===port.id;
                  const hasW   = wires.some(ww=>(ww.fromId===comp.id&&ww.fromPort===port.id)||(ww.toId===comp.id&&ww.toPort===port.id));
                  return (
                    <div key={port.id} className="portdot"
                      title={`${port.label} — click para conectar`}
                      style={{position:"absolute",left:w/2+port.dx-8,top:h/2+port.dy-8,width:16,height:16,borderRadius:"50%",background:isPend?"#4ade80":hasW?(isActive?"#f59e0b":"#475569"):"rgba(55,138,221,0.18)",border:`2px solid ${isPend?"#4ade80":hasW?(isActive?"#f59e0b":"#64748b"):"#60a5fa"}`,cursor:"crosshair",zIndex:30,boxShadow:isPend?"0 0 10px rgba(74,222,128,0.8)":hasW&&isActive?"0 0 6px rgba(245,158,11,0.5)":"none"}}
                      onClick={e=>onPortClick(comp.id,port.id,e)}>
                      <span style={{position:"absolute",bottom:"100%",left:"50%",transform:"translateX(-50%)",marginBottom:2,fontSize:7.5,color:isPend?"#60a5fa":hasW&&isActive?"#f59e0b":"#4ade80",pointerEvents:"none",whiteSpace:"nowrap",fontWeight:700}}>
                        {port.label}
                      </span>
                    </div>
                  );
                })}
              </div>
            );
          })}

          {/* Empty state */}
          {comps.length===0 && (
            <div style={{position:"absolute",inset:0,display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",pointerEvents:"none",gap:14,animation:"fadeUp 0.4s ease"}}>
              <div style={{width:72,height:72,borderRadius:"50%",border:"1px dashed #1e293b",display:"flex",alignItems:"center",justifyContent:"center",fontSize:28}}>⚡</div>
              <div style={{color:"#334155",fontSize:12,textAlign:"center",lineHeight:2,maxWidth:260}}>
                Arrastra una <span style={{color:"#f59e0b"}}>Fuente AC</span> al lienzo<br/>
                Agrega un <span style={{color:"#4ade80"}}>Transformador</span><br/>
                Conecta una <span style={{color:"#fbbf24"}}>Carga</span> y cierra el circuito
              </div>
            </div>
          )}

          {pendingPort && (
            <div style={{position:"absolute",top:14,left:"50%",transform:"translateX(-50%)",background:"rgba(55,138,221,0.12)",border:"0.5px solid #60a5fa",color:"#60a5fa",fontSize:11,padding:"5px 16px",borderRadius:20,pointerEvents:"none"}}>
              Selecciona el puerto destino — ESC cancela
            </div>
          )}
        </div>

        {/* Status badges */}
        <div style={{position:"absolute",top:14,right:14,zIndex:200,display:"flex",flexDirection:"column",gap:5}}>
          <div style={{background:isActive?"rgba(74,222,128,0.1)":"rgba(15,32,64,0.9)",border:`0.5px solid ${isActive?"rgba(74,222,128,0.35)":"#1e293b"}`,color:isActive?"#4ade80":"#334155",fontSize:9,padding:"4px 12px",borderRadius:5,display:"flex",alignItems:"center",gap:6,letterSpacing:"0.08em"}}>
            <span style={{width:6,height:6,borderRadius:"50%",background:isActive?"#4ade80":"#1e3a5f",display:"inline-block",...(isActive?{animation:"blink 1.5s infinite"}:{})}}/>
            {isActive?"EN SERVICIO":"SIN ENERGÍA"}
          </div>
          {!circClosed&&comps.length>0&&(
            <div style={{background:"rgba(239,68,68,0.08)",border:"0.5px solid rgba(239,68,68,0.35)",color:"#f87171",fontSize:9,padding:"4px 12px",borderRadius:5,textAlign:"center"}}>
              ✗ CIRCUITO ABIERTO
            </div>
          )}
          {state.sat&&(
            <div style={{background:"rgba(245,158,11,0.1)",border:"0.5px solid #f59e0b",color:"#f59e0b",fontSize:9,padding:"4px 12px",borderRadius:5,animation:"blink 0.8s infinite",textAlign:"center"}}>
              ⚠ SATURACIÓN
            </div>
          )}
          {isActive&&(
            <div style={{background:"rgba(96,165,250,0.07)",border:"0.5px solid #1e3a5f",color:"#60a5fa",fontSize:9,padding:"3px 10px",borderRadius:5}}>
              ⚡ {fmt(state.I2??0,2)}A · {fmt(state.V2??0,1)}V
            </div>
          )}
        </div>

        {/* Clear */}
        <div style={{position:"absolute",bottom:14,right:14,zIndex:200}}>
          <button onClick={()=>{setComps([]);setWires([]);setSelectedId(null);setPowerOn(false);prevBulbRef.current=null;}}
            style={{background:"rgba(6,13,26,0.95)",border:"0.5px solid #1e293b",color:"#334155",fontSize:10,padding:"6px 14px",borderRadius:6,cursor:"pointer",letterSpacing:"0.08em",transition:"all 0.15s",fontFamily:"inherit"}}
            onMouseEnter={e=>{e.currentTarget.style.borderColor="#ef4444";e.currentTarget.style.color="#ef4444";}}
            onMouseLeave={e=>{e.currentTarget.style.borderColor="#1e293b";e.currentTarget.style.color="#334155";}}>
            LIMPIAR TODO
          </button>
        </div>

        {/* Toast */}
        {toast && (
          <div style={{position:"absolute",bottom:60,left:"50%",transform:"translateX(-50%)",background:toast.type==="danger"?"rgba(127,29,29,0.97)":toast.type==="warn"?"rgba(78,52,9,0.97)":"rgba(5,46,22,0.97)",border:`0.5px solid ${toast.type==="danger"?"#ef4444":toast.type==="warn"?"#f59e0b":"#4ade80"}`,color:toast.type==="danger"?"#fca5a5":toast.type==="warn"?"#fcd34d":"#86efac",fontSize:11,padding:"8px 20px",borderRadius:20,zIndex:500,animation:"fadeUp 0.3s ease",whiteSpace:"nowrap",textAlign:"center"}}>
            {toast.msg}
          </div>
        )}
      </div>

      {/* ══ RIGHT PANEL ══ */}
      <aside style={{width:242,background:"#060d1a",borderLeft:"0.5px solid #1e293b",display:"flex",flexDirection:"column",flexShrink:0}}>
        <div style={{display:"flex",borderBottom:"0.5px solid #1e293b"}}>
          {[["metrics","⚡ Mediciones"],["editor","✏ Editor"]].map(([t,label])=>(
            <button key={t}
              onClick={()=>setRightTab(t)}
              style={{flex:1,border:"none",background:"transparent",cursor:"pointer",padding:"10px 6px",fontSize:10,letterSpacing:"0.08em",transition:"all 0.15s",fontFamily:"inherit",color:rightTab===t?"#60a5fa":"#334155",borderBottom:rightTab===t?"1.5px solid #3b82f6":"1.5px solid transparent"}}>
              {label}
            </button>
          ))}
        </div>

        <div style={{flex:1,overflowY:"auto"}}>
          {rightTab==="metrics" && (
            <div style={{padding:"14px"}}>
              {/* Circuit status card */}
              <div style={{padding:"8px 10px",borderRadius:6,marginBottom:14,background:circClosed?"rgba(74,222,128,0.05)":"rgba(239,68,68,0.05)",border:`0.5px solid ${circClosed?"rgba(74,222,128,0.2)":"rgba(239,68,68,0.25)"}`}}>
                <div style={{fontSize:10,fontWeight:700,color:circClosed?"#4ade80":"#f87171",marginBottom:3}}>
                  {circClosed?"✓ Circuito cerrado":"✗ Circuito abierto"}
                </div>
                <div style={{fontSize:9,color:circClosed?"#2a6a4a":"#6a2a2a",lineHeight:1.6}}>
                  {circClosed
                    ? powerOn?"El sistema está activo.":"Enciende el sistema para activar."
                    : circReason||"Conecta todos los componentes."}
                </div>
              </div>

              <div style={{fontSize:8,color:"#334155",letterSpacing:"0.14em",marginBottom:10,textTransform:"uppercase",fontWeight:700}}>
                Mediciones en tiempo real
              </div>

              {[
                {l:"V₁ voltaje primario",    v:fmt(state.V1??0,0),           u:"V",  c:"#f59e0b"},
                {l:"V₂ voltaje secundario",  v:fmt(state.V2??0,1),           u:"V",  c:"#60a5fa"},
                {l:"I₁ corriente primaria",  v:fmt(state.I1??0,3),           u:"A",  c:"#f59e0b"},
                {l:"I₂ corriente secundaria",v:fmt(state.I2??0,3),           u:"A",  c:"#60a5fa"},
                {l:"S potencia aparente",    v:fmt(state.S??0,1),            u:"VA", c:"#4ade80"},
                {l:"P potencia útil",        v:fmt(state.P??0,1),            u:"W",  c:"#4ade80"},
                {l:"Pérdidas núcleo",        v:fmt(state.Ploss??0,2),        u:"W",  c:"#f87171"},
                {l:"Rendimiento η",          v:fmt((state.eta??0.95)*100,1), u:"%",  c:"#a78bfa"},
              ].map(r=>(
                <div key={r.l} style={{display:"flex",justifyContent:"space-between",alignItems:"center",padding:"5px 0",borderBottom:"0.5px solid #0f172a"}}>
                  <span style={{fontSize:9,color:"#475569"}}>{r.l}</span>
                  <span style={{fontSize:12,fontWeight:700,color:r.c}}>{r.v}<span style={{fontSize:8,marginLeft:2,opacity:.5}}>{r.u}</span></span>
                </div>
              ))}

              {/* Ratio */}
              <div style={{marginTop:12,padding:"10px",background:"rgba(34,211,238,0.05)",border:"0.5px solid rgba(34,211,238,0.2)",borderRadius:6}}>
                <div style={{fontSize:8,color:"#334155",fontWeight:700,letterSpacing:"0.1em",marginBottom:5}}>RELACIÓN DE TRANSFORMACIÓN</div>
                <div style={{fontSize:19,color:"#22d3ee",fontWeight:700,marginBottom:4}}>a = {fmt(state.ratio??2,2)}</div>
                <div style={{fontSize:9,color:"#475569",lineHeight:1.9}}>
                  V₁/V₂ = N₁/N₂ = {fmt(state.ratio??2,2)}<br/>
                  V₂ = {fmt(state.V1??0,0)} ÷ {fmt(state.ratio??2,2)} = <strong style={{color:"#60a5fa"}}>{fmt(state.V2??0,1)} V</strong>
                </div>
              </div>

              {/* Alerts */}
              {state.bulbState==="exploded"&&(
                <div style={{marginTop:10,padding:"8px 10px",background:"rgba(127,29,29,0.2)",border:"0.5px solid #ef4444",borderRadius:6,color:"#fca5a5",fontSize:10,lineHeight:1.6}}>
                  Bombillo destruido. V₂ superó 2.4× el nominal.
                </div>
              )}
              {state.bulbState==="burned"&&(
                <div style={{marginTop:10,padding:"8px 10px",background:"rgba(78,52,9,0.25)",border:"0.5px solid #f59e0b",borderRadius:6,color:"#fcd34d",fontSize:10,lineHeight:1.6}}>
                  Bombillo dañado — V₂={fmt(state.V2??0,1)}V excede el nominal.
                </div>
              )}

              {/* Speed bar */}
              {isActive&&(
                <div style={{marginTop:12,padding:"10px",background:"rgba(34,211,238,0.04)",border:"0.5px solid #1e3a5f",borderRadius:6}}>
                  <div style={{fontSize:8,color:"#334155",fontWeight:700,letterSpacing:"0.08em",marginBottom:7}}>VELOCIDAD DE ELECTRONES</div>
                  <div style={{height:6,background:"#0a1830",borderRadius:3,overflow:"hidden",marginBottom:5}}>
                    <div style={{height:"100%",width:`${Math.min(speed*100,100)}%`,background:speed>.7?"#ef4444":speed>.4?"#f59e0b":"#4ade80",borderRadius:3,transition:"width 0.4s"}}/>
                  </div>
                  <div style={{fontSize:9,color:"#475569"}}>I₂ = <strong style={{color:"#60a5fa"}}>{fmt(state.I2??0,3)}A</strong></div>
                </div>
              )}

              {/* Formulas */}
              <div style={{marginTop:12,padding:"10px",background:"rgba(74,222,128,0.03)",border:"0.5px solid #1e293b",borderRadius:6}}>
                <div style={{fontSize:8,color:"#334155",marginBottom:7,letterSpacing:"0.1em",fontWeight:700}}>FÓRMULAS</div>
                {[
                  ["a = N₁/N₂","Relación de transformación"],
                  ["V₁/V₂ = N₁/N₂","Voltaje ∝ vueltas"],
                  ["I₁/I₂ = N₂/N₁","Corriente inversa"],
                  ["P = V × I","Potencia eléctrica"],
                  ["R = V²/W","Resistencia del bombillo"],
                  ["V = I × R","Ley de Ohm"],
                ].map(([f,d])=>(
                  <div key={f} style={{display:"flex",alignItems:"baseline",gap:8,marginBottom:4}}>
                    <span style={{fontSize:9,color:"#4ade80",flexShrink:0,minWidth:100,fontWeight:700}}>{f}</span>
                    <span style={{fontSize:8,color:"#2a4a3a"}}>{d}</span>
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