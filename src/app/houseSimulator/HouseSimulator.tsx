"use client";
import React, { useState, useRef, useCallback, useEffect, useMemo } from "react";
import { HouseState, ElectricalElement, ElectricalElementType, Circuit, Wire, Room } from "./types";
import { DEFAULT_ROOMS, ELEMENT_ICONS, ELEMENT_LABELS, PALETTE_GROUPS, CIRCUIT_COLORS } from "./constants";
import { validateInstallation, getScoreFromErrors } from "./validation";
import { uid, snap } from "./utils";

// ─── Types ──────────────────────────────────────────────────────────────────────────────────────
type Pt = { sx: number; sy: number };

// ─── Wire bezier path ────────────────────────────────────────────────────────────────────────────
function wirePath(x1: number, y1: number, x2: number, y2: number) {
  const mx = (x1 + x2) / 2;
  return `M ${x1} ${y1} C ${mx} ${y1}, ${mx} ${y2}, ${x2} ${y2}`;
}

// ─── Initial state ───────────────────────────────────────────────────────────────────────────────
const INITIAL: HouseState = {
  rooms: DEFAULT_ROOMS, elements: [], circuits: [], wires: [],
  panel: { id: "panel", x: 0, y: 0, breakerIds: [], mainBreakerRating: 100 },
  zoomLevel: 1, viewTarget: "exterior",
  selectedRoomId: null, selectedElementId: null, selectedCircuitId: null, cameraX: 0, cameraY: 0,
};

// ─── Isometric camera ────────────────────────────────────────────────────────────────────────────
// Standard iso: 30° from horizontal, 45° plan rotation → classic 2:1 pixel ratio
// wx=right, wy=up, wz=depth
function iso(wx: number, wy: number, wz: number, scale: number, offX: number, offY: number): Pt {
  // rotate 45° around Y → then tilt 35.26° so diagonals are horizontal
  const sx = (wx - wz) * Math.cos(Math.PI / 6) * scale + offX;          // cos30 = 0.866
  const sy = (wx + wz) * Math.sin(Math.PI / 6) * scale - wy * 0.816 * scale + offY; // sin30 = 0.5
  return { sx, sy };
}

// ─── Powered luminaire check ─────────────────────────────────────────────────────────────────────
function isPowered(el: ElectricalElement, elements: ElectricalElement[], wires: Wire[], circuits: Circuit[]) {
  if (el.type !== "light") return false;
  if (!el.circuitId) return false;
  const c = circuits.find(c => c.id === el.circuitId);
  if (!c || c.type !== "lighting" || !c.breakerId) return false;
  return wires.some(w => w.fromElementId === el.id || w.toElementId === el.id);
}

// ─── Room styles ─────────────────────────────────────────────────────────────────────────────────
const RS: Record<string, { f: string; f2: string; w: string; ws: string; wd: string; lbl: string }> = {
  living:   { f:"#edd9a3", f2:"#dfc380", w:"#f5f0e8", ws:"#e8e2d8", wd:"#cec8be", lbl:"#8b7040" },
  bedroom:  { f:"#e2ca95", f2:"#cfb578", w:"#f2ede5", ws:"#e4ddd4", wd:"#cac3b8", lbl:"#7a6040" },
  kitchen:  { f:"#d0d0c8", f2:"#bfc0b8", w:"#f5f3ef", ws:"#e4e2de", wd:"#d0cdc8", lbl:"#686060" },
  bathroom: { f:"#ccd8e0", f2:"#b8ccd8", w:"#eef3f6", ws:"#dde6ec", wd:"#c8d4da", lbl:"#507080" },
  garage:   { f:"#bab4aa", f2:"#a8a49a", w:"#eceae6", ws:"#dedad4", wd:"#cccac4", lbl:"#686460" },
};

// ─────────────────────────────────────────────────────────────────────────────────────────────────
// FULL-HOUSE ISOMETRIC VIEW
// ─────────────────────────────────────────────────────────────────────────────────────────────────
function HouseView({
  onRoomClick, allElements, allWires, circuits, panelEls,
  selectedElId, onElementClick, onPanelDrop,
}: {
  onRoomClick: (id: string) => void;
  allElements: ElectricalElement[]; allWires: Wire[]; circuits: Circuit[];
  panelEls: ElectricalElement[]; selectedElId: string | null;
  onElementClick: (id: string) => void;
  onPanelDrop: (t: ElectricalElementType) => void;
}) {
  const [hov, setHov] = useState<string | null>(null);
  const [panelOver, setPanelOver] = useState(false);

  // Build 3D room data from DEFAULT_ROOMS (% coords → world units centered at 0)
  // House spans 0–100 in X and Z; centre at 50,50
  const S = 2.2; // scale factor world→iso
  const WH = 44; // wall height world units
  const rooms3d = useMemo(() => DEFAULT_ROOMS.map(r => ({
    ...r,
    x0: (r.x - 50) * S,  z0: (r.y - 50) * S,
    x1: (r.x + r.width - 50) * S,  z1: (r.y + r.height - 50) * S,
  })), []);

  // Painter sort: draw rooms from farthest to nearest in iso view
  // In standard iso (camera NW), rooms with smaller x+z are farther
  const sorted = useMemo(() =>
    [...rooms3d].sort((a, b) => ((a.x0+a.x1)/2 + (a.z0+a.z1)/2) - ((b.x0+b.x1)/2 + (b.z0+b.z1)/2)),
  [rooms3d]);

  // Calculate tight viewBox
  const SCALE = 5.2;
  const OX = 0, OY = 0;
  const project = (wx: number, wy: number, wz: number) => iso(wx, wy, wz, SCALE, OX, OY);
  function poly(pts: Pt[]) { return pts.map(p => `${p.sx.toFixed(1)},${p.sy.toFixed(1)}`).join(" "); }

  const allCorners = rooms3d.flatMap(r => [
    project(r.x0, 0, r.z0), project(r.x1, 0, r.z0),
    project(r.x0, 0, r.z1), project(r.x1, 0, r.z1),
    project(r.x0, WH, r.z0), project(r.x1, WH, r.z0),
    project(r.x0, WH, r.z1), project(r.x1, WH, r.z1),
  ]);
  const pad = 60;
  const vx0 = Math.min(...allCorners.map(p => p.sx)) - pad;
  const vx1 = Math.max(...allCorners.map(p => p.sx)) + pad;
  const vy0 = Math.min(...allCorners.map(p => p.sy)) - pad;
  const vy1 = Math.max(...allCorners.map(p => p.sy)) + pad;
  const VW = vx1 - vx0, VH = vy1 - vy0;

  function proj(wx: number, wy: number, wz: number) { return iso(wx, wy, wz, SCALE, -vx0, -vy0); }

  // Convert element's interior canvas coords (0..1200, 0..800) to world pos inside its room
  function elWorldPos(el: ElectricalElement) {
    const r = rooms3d.find(r => r.id === el.roomId);
    if (!r) return null;
    const wx = r.x0 + (r.x1 - r.x0) * (el.x / 1200);
    const wz = r.z0 + (r.z1 - r.z0) * (el.y / 800);
    return { wx, wz };
  }

  function renderRoom(r: typeof rooms3d[0]) {
    const s = RS[r.type];
    const isHov = hov === r.id;
    // Corners
    const fl = { TL: proj(r.x0,0,r.z0), TR: proj(r.x1,0,r.z0), BL: proj(r.x0,0,r.z1), BR: proj(r.x1,0,r.z1) };
    const ce = { TL: proj(r.x0,WH,r.z0), TR: proj(r.x1,WH,r.z0), BL: proj(r.x0,WH,r.z1), BR: proj(r.x1,WH,r.z1) };

    // Check if any powered lights in this room → room ambient glow
    const hasPoweredLight = allElements.some(el =>
      el.roomId === r.id && isPowered(el, allElements, allWires, circuits)
    );

    const floorFill = hasPoweredLight
      ? `url(#glow-${r.id})`
      : isHov ? "#f0e8d0" : s.f;

    // Plank lines (X direction)
    const planks = [];
    const N = 7;
    for (let i = 1; i < N; i++) {
      const t = i / N;
      const px = r.x0 + (r.x1 - r.x0) * t;
      const a = proj(px, 0, r.z0), b = proj(px, 0, r.z1);
      planks.push(<line key={`px${i}`} x1={a.sx} y1={a.sy} x2={b.sx} y2={b.sy} stroke={s.f2} strokeWidth="0.7" opacity="0.55"/>);
    }
    for (let i = 1; i < N; i++) {
      const t = i / N;
      const pz = r.z0 + (r.z1 - r.z0) * t;
      const a = proj(r.x0, 0, pz), b = proj(r.x1, 0, pz);
      planks.push(<line key={`pz${i}`} x1={a.sx} y1={a.sy} x2={b.sx} y2={b.sy} stroke={s.f2} strokeWidth="0.7" opacity="0.35"/>);
    }

    const cx = (fl.TL.sx + fl.BR.sx) / 2;
    const cy = (fl.TL.sy + fl.BR.sy) / 2;

    return (
      <g key={r.id} onClick={e => { e.stopPropagation(); onRoomClick(r.id); }}
        onMouseEnter={() => setHov(r.id)} onMouseLeave={() => setHov(null)}
        style={{ cursor: "pointer" }}>

        {/* Powered glow on floor */}
        {hasPoweredLight && (
          <defs>
            <radialGradient id={`glow-${r.id}`} cx="50%" cy="50%">
              <stop offset="0%" stopColor="#fff5c0"/>
              <stop offset="60%" stopColor="#f5d870"/>
              <stop offset="100%" stopColor={s.f}/>
            </radialGradient>
          </defs>
        )}

        {/* Floor */}
        <polygon points={poly([fl.TL,fl.TR,fl.BR,fl.BL])} fill={floorFill} stroke={s.f2} strokeWidth="0.8"/>
        {planks}

        {/* Hover overlay */}
        {isHov && <polygon points={poly([fl.TL,fl.TR,fl.BR,fl.BL])} fill="rgba(255,240,180,0.25)" stroke="none"/>}

        {/* Left wall (NW face in iso) */}
        <polygon points={poly([fl.TL,fl.BL,ce.BL,ce.TL])} fill={s.w} stroke={s.wd} strokeWidth="0.6"/>
        {/* Right wall (NE face) */}
        <polygon points={poly([fl.TL,fl.TR,ce.TR,ce.TL])} fill={s.ws} stroke={s.wd} strokeWidth="0.6"/>

        {/* Wall top edges (open ceiling) */}
        <line x1={ce.TL.sx} y1={ce.TL.sy} x2={ce.TR.sx} y2={ce.TR.sy} stroke={s.wd} strokeWidth={isHov ? 1.5 : 1}/>
        <line x1={ce.TL.sx} y1={ce.TL.sy} x2={ce.BL.sx} y2={ce.BL.sy} stroke={s.wd} strokeWidth={isHov ? 1.5 : 1}/>
        {/* Far edges dashed */}
        <line x1={ce.TR.sx} y1={ce.TR.sy} x2={ce.BR.sx} y2={ce.BR.sy} stroke={s.wd} strokeWidth="0.5" strokeDasharray="3 3"/>
        <line x1={ce.BL.sx} y1={ce.BL.sy} x2={ce.BR.sx} y2={ce.BR.sy} stroke={s.wd} strokeWidth="0.5" strokeDasharray="3 3"/>

        {/* Warm glow aura above room if powered */}
        {hasPoweredLight && (
          <>
            <ellipse cx={cx} cy={cy - WH * SCALE * 0.15} rx={(fl.TR.sx-fl.TL.sx)*0.45} ry={(fl.BL.sy-fl.TL.sy)*0.45}
              fill="rgba(255,220,60,0.12)" filter="url(#ambientGlow)"/>
          </>
        )}

        {/* Room label */}
        <text x={cx} y={cy + 6} textAnchor="middle" fontSize="8.5" fill={isHov ? "#5a3800" : s.lbl}
          fontFamily="'Georgia', serif" fontWeight={isHov ? "bold" : "normal"} letterSpacing="0.1em"
          style={{ pointerEvents: "none", userSelect: "none" }}>
          {r.name.toUpperCase()}
        </text>
        {isHov && (
          <text x={cx} y={cy + 18} textAnchor="middle" fontSize="6" fill="#8b6030"
            fontFamily="monospace" style={{ pointerEvents: "none", userSelect: "none" }}>
            clic para editar
          </text>
        )}
      </g>
    );
  }

  return (
    <div style={{ width: "100%", height: "100%", position: "relative", overflow: "hidden" }}>
      {/* Blueprint background */}
      <svg style={{ position: "absolute", inset: 0, width: "100%", height: "100%", pointerEvents: "none" }}>
        <defs>
          <radialGradient id="bpBg" cx="48%" cy="45%">
            <stop offset="0%" stopColor="#dce8f5"/>
            <stop offset="100%" stopColor="#c4d4e8"/>
          </radialGradient>
          <pattern id="bpGrid" width="28" height="28" patternUnits="userSpaceOnUse">
            <path d="M 28 0 L 0 0 0 28" fill="none" stroke="#a8bcd4" strokeWidth="0.4" opacity="0.6"/>
          </pattern>
        </defs>
        <rect width="100%" height="100%" fill="url(#bpBg)"/>
        <rect width="100%" height="100%" fill="url(#bpGrid)"/>
      </svg>

      {/* ISO Scene SVG */}
      <svg viewBox={`0 0 ${VW} ${VH}`}
        style={{ position: "absolute", inset: 0, width: "100%", height: "100%", overflow: "visible" }}>
        <defs>
          <filter id="ambientGlow" x="-50%" y="-50%" width="200%" height="200%">
            <feGaussianBlur stdDeviation="10" result="b"/>
            <feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge>
          </filter>
          <filter id="dropShadow" x="-10%" y="-10%" width="130%" height="150%">
            <feDropShadow dx="6" dy="12" stdDeviation="10" floodColor="#8090a8" floodOpacity="0.28"/>
          </filter>
          <filter id="elemGlow" x="-80%" y="-80%" width="260%" height="260%">
            <feGaussianBlur stdDeviation="6" result="b"/>
            <feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge>
          </filter>
        </defs>

        {/* House group with drop shadow */}
        <g filter="url(#dropShadow)">
          {sorted.map(r => renderRoom(r))}
        </g>

        {/* Wires on floors */}
        {allWires.map(w => {
          const fe = allElements.find(e => e.id === w.fromElementId);
          const te = allElements.find(e => e.id === w.toElementId);
          if (!fe?.roomId || !te?.roomId) return null;
          const fp = elWorldPos(fe), tp = elWorldPos(te);
          if (!fp || !tp) return null;
          const fpt = proj(fp.wx, 1.5, fp.wz), tpt = proj(tp.wx, 1.5, tp.wz);
          const cid = w.circuitId && w.circuitId !== "" ? w.circuitId : null;
          const circ = cid ? circuits.find(c => c.id === cid) : null;
          const color = w.isGroundWire ? "#4ade80" : circ?.color ?? "#6b7280";
          return (
            <g key={w.id}>
              <line x1={fpt.sx} y1={fpt.sy} x2={tpt.sx} y2={tpt.sy}
                stroke={color} strokeWidth="3" strokeLinecap="round" opacity="0.9"/>
              <line x1={fpt.sx} y1={fpt.sy} x2={tpt.sx} y2={tpt.sy}
                stroke="white" strokeWidth="1" strokeLinecap="round" opacity="0.2"/>
            </g>
          );
        })}

        {/* Elements on floors */}
        {allElements.filter(el => el.roomId !== null).map(el => {
          const wp = elWorldPos(el);
          if (!wp) return null;
          const p = proj(wp.wx, 2.5, wp.wz);
          const powered = isPowered(el, allElements, allWires, circuits);
          const circ = circuits.find(c => c.id === el.circuitId);
          const dotColor = circ?.color ?? "#6b7280";
          const isSel = selectedElId === el.id;
          const R = 9;

          return (
            <g key={el.id} style={{ cursor: "pointer" }}
              onClick={e => { e.stopPropagation(); onElementClick(el.id); }}>
              {/* Warm light pool on floor */}
              {powered && (
                <>
                  <ellipse cx={p.sx} cy={p.sy + 4} rx={38} ry={22}
                    fill="rgba(255,200,40,0.22)" filter="url(#ambientGlow)"/>
                  <ellipse cx={p.sx} cy={p.sy + 3} rx={22} ry={13}
                    fill="rgba(255,230,80,0.5)"/>
                  <ellipse cx={p.sx} cy={p.sy + 2} rx={11} ry={7}
                    fill="rgba(255,250,180,0.75)"/>
                  <ellipse cx={p.sx} cy={p.sy + 3} rx="32" ry="19" fill="none"
                    stroke="rgba(255,210,50,0.4)" strokeWidth="1.5">
                    <animate attributeName="rx" values="30;38;30" dur="2.8s" repeatCount="indefinite"/>
                    <animate attributeName="opacity" values="0.4;0.1;0.4" dur="2.8s" repeatCount="indefinite"/>
                  </ellipse>
                </>
              )}
              {/* Shadow */}
              <ellipse cx={p.sx} cy={p.sy + 3} rx={R + 3} ry={R * 0.45} fill="rgba(0,0,0,0.22)"/>
              {/* Selection */}
              {isSel && <circle cx={p.sx} cy={p.sy} r={R + 7} fill="none" stroke="#c8901c" strokeWidth="2.5"/>}
              {/* Body */}
              <circle cx={p.sx} cy={p.sy} r={R}
                fill={powered ? "#fffbe8" : "white"}
                stroke={powered ? "#e8a020" : dotColor} strokeWidth="1.8"/>
              <text x={p.sx} y={p.sy + 1} textAnchor="middle" dominantBaseline="central"
                fontSize={R * 1.05} style={{ pointerEvents: "none", userSelect: "none" }}>
                {ELEMENT_ICONS[el.type]}
              </text>
              {/* Powered indicator dot */}
              {powered && (
                <circle cx={p.sx + R * 0.72} cy={p.sy - R * 0.72} r="3.5"
                  fill="#4ade80" stroke="white" strokeWidth="1">
                  <animate attributeName="opacity" values="1;0.3;1" dur="1.6s" repeatCount="indefinite"/>
                </circle>
              )}
            </g>
          );
        })}

        {/* Compass rose */}
        {(() => {
          const cx = VW - 50, cy = 55;
          return (
            <g>
              <circle cx={cx} cy={cy} r="22" fill="rgba(255,255,255,0.7)" stroke="#a0b0c8" strokeWidth="1"/>
              <polygon points={`${cx},${cy-16} ${cx-4},${cy} ${cx+4},${cy}`} fill="#4a6080"/>
              <polygon points={`${cx},${cy+16} ${cx-4},${cy} ${cx+4},${cy}`} fill="#8090a8"/>
              <text x={cx} y={cy-19} textAnchor="middle" fontSize="9" fill="#3a5070"
                fontFamily="monospace" fontWeight="bold">N</text>
            </g>
          );
        })()}
      </svg>

      {/* Panel zone */}
      <div style={{
        position: "absolute", left: 12, top: 12, width: 186,
        background: panelOver ? "rgba(255,255,255,0.98)" : "rgba(255,253,248,0.96)",
        border: `1.5px solid ${panelOver ? "#c8901c" : "#d4c8b0"}`,
        borderRadius: 10, padding: 11, transition: "all 0.15s",
        boxShadow: "0 4px 18px rgba(80,60,20,0.14)", fontFamily: "'Georgia', serif",
      }}
        onMouseDown={e => e.stopPropagation()}
        onDragOver={e => { e.preventDefault(); e.stopPropagation(); setPanelOver(true); }}
        onDragLeave={() => setPanelOver(false)}
        onDrop={e => {
          e.preventDefault(); e.stopPropagation(); setPanelOver(false);
          const t = e.dataTransfer.getData("elemType") as ElectricalElementType;
          if (["panel_breaker","panel_differential","ground_rod"].includes(t)) onPanelDrop(t);
        }}>
        <div style={{ fontSize: 8, color: "#8b6020", fontFamily: "monospace", fontWeight: "bold", marginBottom: 7, letterSpacing: "0.12em" }}>⚡ TABLERO PRINCIPAL</div>
        <div style={{ background: "#f8f2e4", border: "1px solid #d8c898", borderRadius: 5, padding: "5px 9px", marginBottom: 7, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <span style={{ fontSize: 8, color: "#7a6030", fontFamily: "monospace" }}>PRINCIPAL 100A</span>
          <span style={{ fontSize: 9, color: "#b08010", fontFamily: "monospace", fontWeight: "bold" }}>✓</span>
        </div>
        {panelEls.length === 0
          ? <div style={{ fontSize: 8, color: panelOver ? "#c8901c" : "#b0a080", fontFamily: "monospace", textAlign: "center", padding: "9px 0", border: "1px dashed #d4c898", borderRadius: 6 }}>
              {panelOver ? "Suelta aquí ▼" : "Arrastra interruptores aquí"}
            </div>
          : panelEls.map(el => {
            const isDiff = el.type === "panel_differential";
            return (
              <div key={el.id} style={{ background: "#f8f2e4", border: `1px solid ${isDiff ? "#90c8a0" : "#d4c898"}`, borderLeft: `3px solid ${isDiff ? "#48a060" : "#c8901c"}`, borderRadius: 5, padding: "5px 9px", marginBottom: 4, display: "flex", justifyContent: "space-between", alignItems: "center" }}
                onClick={() => {}}>
                <span style={{ fontSize: 11 }}>{ELEMENT_ICONS[el.type]}</span>
                <span style={{ fontSize: 8, color: "#706040", fontFamily: "monospace", flex: 1, marginLeft: 5 }}>{el.label}</span>
                <span style={{ fontSize: 9, color: isDiff ? "#388050" : "#a87010", fontFamily: "monospace", fontWeight: "bold" }}>{el.rating ?? 20}A</span>
              </div>
            );
          })}
      </div>

      {/* Hint */}
      <div style={{ position: "absolute", bottom: 12, left: "50%", transform: "translateX(-50%)", background: "rgba(255,253,248,0.9)", border: "1px solid #d4c8b0", borderRadius: 20, padding: "5px 18px", fontSize: 8, color: "#806040", fontFamily: "monospace", display: "flex", gap: 16, pointerEvents: "none", whiteSpace: "nowrap", boxShadow: "0 2px 8px rgba(80,60,20,0.1)" }}>
        <span>Clic en habitación → Vista detalle</span>
        <span>💡 con ✓ verde = luminaria encendida</span>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────────────────────────
// SINGLE ROOM ISO VIEW (same camera, zoomed in on one room)
// ─────────────────────────────────────────────────────────────────────────────────────────────────
function RoomView({
  room, elements, wires, circuits,
  onDrop, onElementClick, onElementMove, onWireConnect,
  selectedElId, pendingWireFrom, onCanvasClick,
}: {
  room: Room; elements: ElectricalElement[]; wires: Wire[]; circuits: Circuit[];
  onDrop: (t: ElectricalElementType, x: number, y: number) => void;
  onElementClick: (id: string, wire: boolean) => void;
  onElementMove: (id: string, x: number, y: number) => void;
  onWireConnect: (toId: string) => void;
  selectedElId: string | null; pendingWireFrom: string | null;
  onCanvasClick: () => void;
}) {
  const svgRef = useRef<SVGSVGElement>(null);
  const dragRef = useRef<{ id: string; offX: number; offY: number } | null>(null);
  const [dragPos, setDragPos] = useState<{ id: string; x: number; y: number } | null>(null);
  const [mouse, setMouse] = useState({ x: 600, y: 400 });

  const roomEls = elements.filter(e => e.roomId === room.id);
  const s = RS[room.type];

  function svgXY(cx: number, cy: number) {
    const svg = svgRef.current;
    if (!svg) return { x: 0, y: 0 };
    const r = svg.getBoundingClientRect();
    return { x: (cx - r.left) / r.width * 1200, y: (cy - r.top) / r.height * 800 };
  }

  function circColor(el: ElectricalElement) {
    if (!el.circuitId) return "#94a3b8";
    return circuits.find(c => c.id === el.circuitId)?.color ?? "#94a3b8";
  }

  // --- Isometric room rendering ---
  // Room displayed as a large single room. We map 1200×800 SVG coords directly.
  // Walls visible: left (SW) and back (NW) in iso view.
  // Scale so the room fills most of the 1200×800 canvas.
  const SCALE = 4.4;
  const WH = 120; // wall height in "world units" for the zoomed room

  // room "world" is 0..100 in x and z, mapped from SVG fractions
  // But we render in SVG space directly. Floor corners at SVG fractions:
  // TL=(0,0), TR=(1,0), BL=(0,1), BR=(1,1) → map through iso
  // Iso center offset so house fills canvas
  const OX = 600, OY = 460;
  const ROOM_W = 200, ROOM_D = 160; // half extents in "room units"

  function rp(rx: number, ry: number, rz: number): Pt {
    // rx: -ROOM_W..ROOM_W (left-right), ry: height, rz: -ROOM_D..ROOM_D (front-back)
    return iso(rx, ry, rz, SCALE * 0.7, OX, OY);
  }

  // Fractions of room (0..1) to iso screen pos (for elements)
  function frac2iso(fx: number, fz: number, fy: number = 0): Pt {
    const rx = (fx - 0.5) * ROOM_W * 2;
    const rz = (fz - 0.5) * ROOM_D * 2;
    return rp(rx, fy, rz);
  }

  // SVG drag/drop pos back to fraction (0..1) of room — invert iso
  // We map SVG coords to fraction simply by treating the SVG as a 2D top-down canvas
  // for placement, then display in iso. This keeps drag UX simple.
  const pendingFromEl = pendingWireFrom ? elements.find(e => e.id === pendingWireFrom) ?? null : null;
  const pfx = dragPos?.id === pendingWireFrom ? dragPos.x : pendingFromEl?.x ?? 0;
  const pfy = dragPos?.id === pendingWireFrom ? dragPos.y : pendingFromEl?.y ?? 0;

  // Floor corners in iso
  const fTL = rp(-ROOM_W, 0, -ROOM_D), fTR = rp(ROOM_W, 0, -ROOM_D);
  const fBL = rp(-ROOM_W, 0, ROOM_D),  fBR = rp(ROOM_W, 0, ROOM_D);
  const cTL = rp(-ROOM_W, WH, -ROOM_D), cTR = rp(ROOM_W, WH, -ROOM_D);
  const cBL = rp(-ROOM_W, WH, ROOM_D);

  function pts(arr: Pt[]) { return arr.map(p => `${p.sx.toFixed(1)},${p.sy.toFixed(1)}`).join(" "); }

  // Wood planks in iso
  const planks = [];
  const NP = 10;
  for (let i = 1; i < NP; i++) {
    const t = i / NP;
    const a = frac2iso(t, 0), b = frac2iso(t, 1);
    const c = frac2iso(0, t), d = frac2iso(1, t);
    planks.push(<line key={`a${i}`} x1={a.sx} y1={a.sy} x2={b.sx} y2={b.sy} stroke={s.f2} strokeWidth="1.2" opacity="0.55"/>);
    planks.push(<line key={`b${i}`} x1={c.sx} y1={c.sy} x2={d.sx} y2={d.sy} stroke={s.f2} strokeWidth="1.2" opacity="0.38"/>);
  }

  // Wall texture lines
  const wallLines: React.ReactNode[] = [];
  for (let i = 1; i < 5; i++) {
    const t = i / 5;
    // Left wall
    const la = rp(-ROOM_W, WH * t, -ROOM_D), lb = rp(-ROOM_W, WH * t, ROOM_D);
    wallLines.push(<line key={`wl${i}`} x1={la.sx} y1={la.sy} x2={lb.sx} y2={lb.sy} stroke={s.wd} strokeWidth="0.5" opacity="0.2"/>);
    // Back wall
    const ba = rp(-ROOM_W, WH * t, -ROOM_D), bb = rp(ROOM_W, WH * t, -ROOM_D);
    wallLines.push(<line key={`wb${i}`} x1={ba.sx} y1={ba.sy} x2={bb.sx} y2={bb.sy} stroke={s.wd} strokeWidth="0.5" opacity="0.2"/>);
  }

  return (
    <svg ref={svgRef} viewBox="0 0 1200 800" preserveAspectRatio="xMidYMid meet"
      style={{
        width: "100%", height: "100%",
        background: `linear-gradient(135deg, ${s.f}18 0%, #dce8f5 100%)`,
        userSelect: "none", cursor: pendingWireFrom ? "crosshair" : "default",
        fontFamily: "'Georgia', serif",
      }}
      onMouseMove={e => {
        const p = svgXY(e.clientX, e.clientY);
        setMouse(p);
        if (dragRef.current) setDragPos({ id: dragRef.current.id, x: snap(p.x - dragRef.current.offX), y: snap(p.y - dragRef.current.offY) });
      }}
      onMouseUp={() => { if (dragRef.current && dragPos) onElementMove(dragPos.id, dragPos.x, dragPos.y); dragRef.current = null; setDragPos(null); }}
      onMouseLeave={() => { if (dragRef.current && dragPos) onElementMove(dragPos.id, dragPos.x, dragPos.y); dragRef.current = null; setDragPos(null); }}
      onClick={e => {
        if (dragPos) return;
        const tag = (e.target as SVGElement).tagName;
        if (["svg","rect","polygon","line"].includes(tag)) onCanvasClick();
      }}
      onDragOver={e => e.preventDefault()}
      onDrop={e => {
        e.preventDefault();
        const type = e.dataTransfer.getData("elemType") as ElectricalElementType;
        if (!type) return;
        const p = svgXY(e.clientX, e.clientY);
        onDrop(type, snap(p.x), snap(p.y));
      }}>

      <defs>
        <pattern id="bpG2" width="24" height="24" patternUnits="userSpaceOnUse">
          <path d="M 24 0 L 0 0 0 24" fill="none" stroke="#a8bcd4" strokeWidth="0.35" opacity="0.5"/>
        </pattern>
        <radialGradient id="lightPool" cx="50%" cy="50%">
          <stop offset="0%" stopColor="#fff8c0" stopOpacity="1"/>
          <stop offset="50%" stopColor="#ffd050" stopOpacity="0.55"/>
          <stop offset="100%" stopColor="#ffb020" stopOpacity="0"/>
        </radialGradient>
        <filter id="lglow" x="-60%" y="-60%" width="220%" height="220%">
          <feGaussianBlur stdDeviation="10" result="b"/>
          <feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge>
        </filter>
        <filter id="elSh">
          <feDropShadow dx="2" dy="4" stdDeviation="4" floodColor="#6a5030" floodOpacity="0.28"/>
        </filter>
        <marker id="wArrow" markerWidth="8" markerHeight="6" refX="8" refY="3" orient="auto">
          <polygon points="0 0, 8 3, 0 6" fill="#c8901c" opacity="0.9"/>
        </marker>
      </defs>

      {/* Blueprint bg */}
      <rect width="1200" height="800" fill="url(#bpG2)"/>

      {/* ── Iso room shell ────────────────────────────────── */}
      {/* Floor */}
      <polygon points={pts([fTL,fTR,fBR,fBL])} fill={s.f} stroke={s.f2} strokeWidth="1.2"/>
      {planks}
      {/* Left wall */}
      <polygon points={pts([fTL,fBL,cBL,cTL])} fill={s.w} stroke={s.wd} strokeWidth="1"/>
      {wallLines.filter((_, i) => i % 2 === 0)}
      {/* Back wall */}
      <polygon points={pts([fTL,fTR,cTR,cTL])} fill={s.ws} stroke={s.wd} strokeWidth="1"/>
      {wallLines.filter((_, i) => i % 2 === 1)}
      {/* Top edges */}
      <line x1={cTL.sx} y1={cTL.sy} x2={cTR.sx} y2={cTR.sy} stroke={s.wd} strokeWidth="2.5"/>
      <line x1={cTL.sx} y1={cTL.sy} x2={cBL.sx} y2={cBL.sy} stroke={s.wd} strokeWidth="2.5"/>
      {/* Baseboard */}
      <line x1={fTL.sx} y1={fTL.sy} x2={fBL.sx} y2={fBL.sy} stroke={s.wd} strokeWidth="2"/>
      <line x1={fTL.sx} y1={fTL.sy} x2={fTR.sx} y2={fTR.sy} stroke={s.wd} strokeWidth="2"/>

      {/* Room label top */}
      <text x="600" y="38" textAnchor="middle" fontSize="12" fill={s.lbl}
        fontFamily="'Georgia', serif" letterSpacing="0.2em" opacity="0.55">
        {room.name.toUpperCase()}
      </text>
      <text x="600" y="56" textAnchor="middle" fontSize="8" fill={s.lbl} fontFamily="monospace" opacity="0.4">
        Arrastra · Doble clic = cable · ESC = cancelar
      </text>

      {/* ── Wires ─────────────────────────────────────────── */}
      {wires.map(w => {
        const fe = elements.find(e => e.id === w.fromElementId);
        const te = elements.find(e => e.id === w.toElementId);
        if (!fe || !te || fe.roomId !== room.id && te.roomId !== room.id) return null;
        const cid = w.circuitId && w.circuitId !== "" ? w.circuitId : null;
        const circ = cid ? circuits.find(c => c.id === cid) : null;
        const color = circ ? circ.color : w.isGroundWire ? "#4ade80" : "#6b7280";
        const fx = dragPos?.id === fe.id ? dragPos.x : fe.x;
        const fy = dragPos?.id === fe.id ? dragPos.y : fe.y;
        const tx = dragPos?.id === te.id ? dragPos.x : te.x;
        const ty = dragPos?.id === te.id ? dragPos.y : te.y;
        const d = wirePath(fx, fy, tx, ty);
        return (
          <g key={w.id}>
            <path d={d} fill="none" stroke={color} strokeWidth="12" opacity="0.1"/>
            <path d={d} fill="none" stroke={color} strokeWidth="4" strokeLinecap="round" opacity="0.95"/>
            <path d={d} fill="none" stroke="white" strokeWidth="1.5" strokeLinecap="round" opacity="0.15"/>
          </g>
        );
      })}

      {/* Pending wire */}
      {pendingWireFrom && pendingFromEl && (
        <>
          <path d={wirePath(pfx, pfy, mouse.x, mouse.y)} fill="none" stroke="#c8901c"
            strokeWidth="2.5" strokeDasharray="12 6" opacity="0.9" markerEnd="url(#wArrow)"/>
          <circle cx={pfx} cy={pfy} r="7" fill="#c8901c" opacity="0.25">
            <animate attributeName="r" values="5;15;5" dur="0.9s" repeatCount="indefinite"/>
          </circle>
        </>
      )}

      {/* ── Elements ──────────────────────────────────────── */}
      {roomEls.map(el => {
        const powered  = isPowered(el, elements, wires, circuits);
        const isSel    = selectedElId === el.id;
        const isPSrc   = pendingWireFrom === el.id;
        const isTgt    = !!pendingWireFrom && pendingWireFrom !== el.id;
        const color    = circColor(el);
        const ex       = dragPos?.id === el.id ? dragPos.x : el.x;
        const ey       = dragPos?.id === el.id ? dragPos.y : el.y;
        const isDrag   = dragPos?.id === el.id;
        const R = 24;

        return (
          <g key={el.id} transform={`translate(${ex},${ey})`}
            style={{ cursor: pendingWireFrom ? "crosshair" : isDrag ? "grabbing" : "grab" }}
            filter={isSel || isPSrc || isDrag ? "url(#elSh)" : undefined}
            onMouseDown={e => {
              e.stopPropagation();
              if (pendingWireFrom) return;
              const p = svgXY(e.clientX, e.clientY);
              dragRef.current = { id: el.id, offX: p.x - el.x, offY: p.y - el.y };
            }}
            onClick={e => {
              e.stopPropagation();
              if (isDrag) return;
              if (pendingWireFrom && pendingWireFrom !== el.id) onWireConnect(el.id);
              else onElementClick(el.id, false);
            }}
            onDoubleClick={e => { e.stopPropagation(); onElementClick(el.id, true); }}>

            {/* Powered: large warm glow on floor */}
            {powered && el.type === "light" && (
              <>
                <ellipse cx={0} cy={10} rx={100} ry={60} fill="url(#lightPool)" opacity="0.7" filter="url(#lglow)"/>
                <ellipse cx={0} cy={7} rx={58} ry={35} fill="rgba(255,235,100,0.55)"/>
                <ellipse cx={0} cy={5} rx={28} ry={17} fill="rgba(255,255,200,0.8)"/>
                <ellipse cx={0} cy={7} rx="75" ry="45" fill="none" stroke="rgba(255,215,50,0.3)" strokeWidth="2">
                  <animate attributeName="rx" values="70;85;70" dur="3s" repeatCount="indefinite"/>
                  <animate attributeName="opacity" values="0.35;0.08;0.35" dur="3s" repeatCount="indefinite"/>
                </ellipse>
              </>
            )}

            {/* Shadow */}
            <ellipse cx={0} cy={isDrag ? 16 : 7} rx={R + 4} ry={(R + 4) * 0.38} fill="rgba(0,0,0,0.2)"/>

            {/* Wire target ring */}
            {isTgt && (
              <circle r={R + 14} fill="rgba(200,144,28,0.07)" stroke="#c8901c" strokeWidth="2" strokeDasharray="5 3">
                <animate attributeName="r" values={`${R+10};${R+18};${R+10}`} dur="0.7s" repeatCount="indefinite"/>
              </circle>
            )}
            {/* Selection ring */}
            {isSel && !isPSrc && <circle r={R + 8} fill="none" stroke="#c8901c" strokeWidth="2.5"/>}
            {/* Pending source */}
            {isPSrc && (
              <circle r={R + 9} fill="rgba(200,144,28,0.1)" stroke="#c8901c" strokeWidth="2.5">
                <animate attributeName="r" values={`${R+7};${R+15};${R+7}`} dur="0.65s" repeatCount="indefinite"/>
              </circle>
            )}
            {/* Body */}
            <circle r={R} fill={powered && el.type === "light" ? "#fffce8" : "white"}
              stroke={isPSrc ? "#c8901c" : isSel ? "#c8901c" : color}
              strokeWidth={isSel || isPSrc ? 3.5 : 2.5}
              style={{ filter: isDrag ? "none" : "drop-shadow(0 2px 5px rgba(80,55,15,0.2))" }}/>
            {/* Icon */}
            <text textAnchor="middle" dominantBaseline="central" fontSize="20"
              style={{ pointerEvents: "none", userSelect: "none" }}>
              {ELEMENT_ICONS[el.type]}
            </text>
            {/* Label */}
            <text y={R + 14} textAnchor="middle" fontSize="10" fill={isSel ? "#6a4a10" : "#706050"}
              fontFamily="monospace" style={{ pointerEvents: "none", userSelect: "none" }}>
              {el.label}
            </text>
            {/* Powered badge */}
            {powered && (
              <g transform={`translate(${R * 0.72}, ${-R * 0.72})`}>
                <circle r="9" fill="#48a060" stroke="white" strokeWidth="2"/>
                <text textAnchor="middle" dominantBaseline="central" fontSize="10" fill="white"
                  style={{ pointerEvents: "none" }}>✓</text>
              </g>
            )}
            {/* Ground badge */}
            {el.isGrounded && (
              <g transform={`translate(${-R * 0.72}, ${-R * 0.72})`}>
                <circle r="9" fill="#368050" stroke="white" strokeWidth="1.5"/>
                <text textAnchor="middle" dominantBaseline="central" fontSize="10" fill="white"
                  style={{ pointerEvents: "none" }}>⏚</text>
              </g>
            )}
            {/* Circuit dot */}
            {el.circuitId && (
              <circle cx={R * 0.72} cy={R * 0.72} r="6" fill={color} stroke="white" strokeWidth="1.2"/>
            )}
          </g>
        );
      })}

      {roomEls.length === 0 && (
        <>
          <text x="600" y="450" textAnchor="middle" fontSize="15" fill={s.lbl} opacity="0.4" fontFamily="'Georgia', serif">
            Arrastra componentes eléctricos al piso
          </text>
          <text x="600" y="475" textAnchor="middle" fontSize="9" fill={s.lbl} opacity="0.3" fontFamily="monospace">
            Doble clic en elemento instalado → iniciar cable
          </text>
        </>
      )}
    </svg>
  );
}

// ─────────────────────────────────────────────────────────────────────────────────────────────────
// VALIDATION PANEL
// ─────────────────────────────────────────────────────────────────────────────────────────────────
function ValidationPanel({ errors, score }: { errors: ReturnType<typeof validateInstallation>; score: number }) {
  const [open, setOpen] = useState(true);
  const C = { error: "#c0392b", warning: "#d4831c", info: "#2c72b0" };
  const I = { error: "✖", warning: "⚠", info: "ℹ" };
  return (
    <div style={{ position: "absolute", bottom: 14, right: 14, width: 308, background: "rgba(255,253,248,0.97)", border: "1.5px solid #d4c8b0", borderRadius: 12, overflow: "hidden", zIndex: 100, maxHeight: open ? 440 : 56, transition: "max-height 0.3s ease", boxShadow: "0 8px 32px rgba(80,60,20,0.16)", fontFamily: "'Georgia', serif" }}>
      <div style={{ padding: "11px 16px", borderBottom: open ? "1px solid #e8dfc8" : "none", display: "flex", justifyContent: "space-between", alignItems: "center", cursor: "pointer", background: "#faf5eb" }}
        onClick={() => setOpen(v => !v)}>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <svg width="40" height="40">
            <circle cx="20" cy="20" r="16" fill="none" stroke="#e8d8b0" strokeWidth="4"/>
            <circle cx="20" cy="20" r="16" fill="none" stroke={score > 70 ? "#48a060" : score > 40 ? "#d4831c" : "#c0392b"} strokeWidth="4" strokeLinecap="round" strokeDasharray={`${score * 1.005} 100`} strokeDashoffset="25" transform="rotate(-90 20 20)"/>
            <text x="20" y="20" textAnchor="middle" dominantBaseline="central" fontSize="9" fill="#806040" fontFamily="monospace" fontWeight="bold">{score}</text>
          </svg>
          <div>
            <div style={{ fontSize: 10, color: "#806040", fontFamily: "monospace", letterSpacing: "0.08em" }}>DIAGNÓSTICO NEC/RETIE</div>
            <div style={{ fontSize: 8, color: "#a09070", fontFamily: "monospace" }}>
              {errors.filter(e => e.severity === "error").length} err · {errors.filter(e => e.severity === "warning").length} adv · {errors.filter(e => e.severity === "info").length} info
            </div>
          </div>
        </div>
        <span style={{ color: "#a09070", fontSize: 13 }}>{open ? "▼" : "▲"}</span>
      </div>
      <div style={{ overflowY: "auto", maxHeight: 380 }}>
        {errors.length === 0
          ? <div style={{ padding: 16, textAlign: "center", fontSize: 11, color: "#48a060", fontFamily: "monospace" }}>✓ Instalación correcta</div>
          : errors.map(e => (
            <div key={e.id} style={{ padding: "9px 14px", borderBottom: "1px solid #f0e8d8", borderLeft: `3px solid ${C[e.severity]}` }}>
              <div style={{ display: "flex", gap: 8 }}>
                <span style={{ color: C[e.severity], fontSize: 11, flexShrink: 0 }}>{I[e.severity]}</span>
                <div>
                  <div style={{ fontSize: 9, color: "#504030", fontFamily: "monospace", fontWeight: "bold" }}>[{e.category}] {e.title}</div>
                  <div style={{ fontSize: 8, color: "#706050", fontFamily: "monospace", marginTop: 2, lineHeight: 1.6 }}>{e.message}</div>
                  <div style={{ marginTop: 4, fontSize: 7, color: C[e.severity], fontFamily: "monospace", padding: "2px 7px", background: `${C[e.severity]}12`, borderRadius: 4, display: "inline-block" }}>↳ {e.fix}</div>
                </div>
              </div>
            </div>
          ))}
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────────────────────────
// MAIN COMPONENT
// ─────────────────────────────────────────────────────────────────────────────────────────────────
export default function HouseSimulator() {
  const [state, setState] = useState<HouseState>(INITIAL);
  const [pwf, setPWF] = useState<string | null>(null); // pendingWireFrom
  const [activeTab, setActiveTab] = useState<"elements" | "circuits" | "panel">("elements");
  const [ncn, setNcn] = useState(""); // newCircuitName
  const [nct, setNct] = useState<"lighting" | "outlet" | "ground">("lighting");

  const errors = useMemo(() => validateInstallation(state), [state]);
  const score  = useMemo(() => getScoreFromErrors(errors), [errors]);
  const room   = state.selectedRoomId ? state.rooms.find(r => r.id === state.selectedRoomId) ?? null : null;
  const selEl  = state.elements.find(e => e.id === state.selectedElementId) ?? null;
  const panelEls = state.elements.filter(e => e.type === "panel_breaker" || e.type === "panel_differential");

  const go = useCallback((id: string) => { setState(s => ({ ...s, selectedRoomId: id, viewTarget: "interior", selectedElementId: null })); setPWF(null); }, []);
  const back = useCallback(() => { setState(s => ({ ...s, selectedRoomId: null, viewTarget: "exterior", selectedElementId: null })); setPWF(null); }, []);

  const drop = useCallback((type: ElectricalElementType, x: number, y: number, roomId: string | null) => {
    setState(s => ({ ...s, elements: [...s.elements, { id: uid(), type, roomId, x, y, circuitId: null, label: ELEMENT_LABELS[type], isOn: false, isGrounded: false, rating: type === "panel_breaker" ? 20 : type === "panel_differential" ? 30 : undefined }] }));
  }, []);

  const move = useCallback((id: string, x: number, y: number) => {
    setState(s => ({ ...s, elements: s.elements.map(e => e.id === id ? { ...e, x, y } : e) }));
  }, []);

  const elClick = useCallback((id: string, wire: boolean) => {
    if (wire) { setPWF(p => p === id ? null : id); setState(s => ({ ...s, selectedElementId: id })); }
    else if (!pwf) { setState(s => ({ ...s, selectedElementId: s.selectedElementId === id ? null : id })); }
  }, [pwf]);

  const connect = useCallback((toId: string) => {
    if (!pwf || pwf === toId) { setPWF(null); return; }
    const fe = state.elements.find(e => e.id === pwf);
    const te = state.elements.find(e => e.id === toId);
    if (!fe || !te) { setPWF(null); return; }
    const cid = fe.circuitId ?? te.circuitId ?? "";
    const gnd = fe.type === "ground_rod" || te.type === "ground_rod";
    setState(s => ({
      ...s,
      wires: [...s.wires, { id: uid(), fromElementId: pwf, toElementId: toId, circuitId: cid, isGroundWire: gnd, path: [] }],
      elements: gnd ? s.elements.map(e => (e.id === toId || e.id === pwf) ? { ...e, isGrounded: true } : e) : s.elements,
    }));
    setPWF(null);
  }, [pwf, state.elements]);

  const delEl = useCallback((id: string) => {
    setState(s => ({ ...s, elements: s.elements.filter(e => e.id !== id), wires: s.wires.filter(w => w.fromElementId !== id && w.toElementId !== id), selectedElementId: s.selectedElementId === id ? null : s.selectedElementId }));
    if (pwf === id) setPWF(null);
  }, [pwf]);

  const delWire = useCallback((id: string) => { setState(s => ({ ...s, wires: s.wires.filter(w => w.id !== id) })); }, []);

  const mkCircuit = useCallback(() => {
    if (!ncn.trim()) return;
    setState(s => ({ ...s, circuits: [...s.circuits, { id: uid(), name: ncn.trim(), type: nct, color: CIRCUIT_COLORS[nct], breakerId: null, elementIds: [], isProtected: false, hasGround: false }] }));
    setNcn("");
  }, [ncn, nct]);

  const assignCircuit = useCallback((eid: string, cid: string) => {
    setState(s => ({
      ...s,
      elements: s.elements.map(e => e.id === eid ? { ...e, circuitId: cid } : e),
      circuits: s.circuits.map(c => c.id === cid ? { ...c, elementIds: c.elementIds.includes(eid) ? c.elementIds : [...c.elementIds, eid] } : c),
      wires: s.wires.map(w => (w.fromElementId === eid || w.toElementId === eid) && !w.circuitId ? { ...w, circuitId: cid } : w),
    }));
  }, []);

  const delCircuit = useCallback((id: string) => {
    setState(s => ({ ...s, circuits: s.circuits.filter(c => c.id !== id), elements: s.elements.map(e => e.circuitId === id ? { ...e, circuitId: null } : e), wires: s.wires.map(w => w.circuitId === id ? { ...w, circuitId: "" } : w) }));
  }, []);

  const assignBreaker = useCallback((cid: string, bid: string) => {
    setState(s => ({ ...s, circuits: s.circuits.map(c => c.id === cid ? { ...c, breakerId: bid, isProtected: true } : c) }));
  }, []);

  const toggleGnd = useCallback((id: string) => {
    setState(s => ({ ...s, elements: s.elements.map(e => e.id === id ? { ...e, isGrounded: !e.isGrounded } : e) }));
  }, []);

  useEffect(() => {
    const h = (e: KeyboardEvent) => { if (e.key === "Escape") { setPWF(null); setState(s => ({ ...s, selectedElementId: null })); } };
    window.addEventListener("keydown", h);
    return () => window.removeEventListener("keydown", h);
  }, []);

  // UI color tokens (warm architectural palette)
  const U = { bg: "#f2ede4", side: "#f8f4ed", bdr: "#dcd4c4", txt: "#5a4830", dim: "#9a8870", acc: "#c8901c", accBg: "rgba(200,144,28,0.1)" };

  return (
    <div style={{ display: "flex", height: "100vh", background: U.bg, fontFamily: "'Georgia', serif", overflow: "hidden" }}>

      {/* ── Left Palette ─────────────────────────────────────────────────────────── */}
      <aside style={{ width: 206, background: U.side, borderRight: `1px solid ${U.bdr}`, display: "flex", flexDirection: "column", overflowY: "auto", flexShrink: 0 }}>
        <div style={{ padding: "14px 13px 9px", borderBottom: `1px solid ${U.bdr}` }}>
          <div style={{ fontSize: 9, color: U.acc, letterSpacing: "0.18em", fontFamily: "monospace", fontWeight: "bold" }}>⚡ SIMULADOR ELÉCTRICO</div>
          <div style={{ fontSize: 7, color: U.dim, marginTop: 3, fontFamily: "monospace" }}>Residencial · NEC / RETIE</div>
        </div>
        <div style={{ display: "flex", borderBottom: `1px solid ${U.bdr}` }}>
          {(["elements","circuits","panel"] as const).map(t => (
            <button key={t} style={{ flex: 1, padding: "8px 0", background: activeTab === t ? U.accBg : "transparent", border: "none", borderBottom: activeTab === t ? `2px solid ${U.acc}` : "2px solid transparent", color: activeTab === t ? U.acc : U.dim, fontSize: 8, cursor: "pointer", fontFamily: "monospace" }}
              onClick={() => setActiveTab(t)}>
              {t === "elements" ? "ELEM" : t === "circuits" ? "CIRC" : "TABLERO"}
            </button>
          ))}
        </div>

        {activeTab === "elements" && PALETTE_GROUPS.map(g => (
          <div key={g.cat}>
            <div style={{ padding: "7px 13px 3px", fontSize: 7, color: U.dim, textTransform: "uppercase", letterSpacing: "0.12em", fontFamily: "monospace" }}>{g.cat}</div>
            {g.items.map(t => (
              <div key={t} draggable onDragStart={e => e.dataTransfer.setData("elemType", t)}
                style={{ display: "flex", alignItems: "center", gap: 9, padding: "7px 13px", cursor: "grab", borderRadius: 7, margin: "2px 6px", transition: "all 0.15s", userSelect: "none", border: "1px solid transparent" }}
                onMouseEnter={e => { const d = e.currentTarget as HTMLDivElement; d.style.background = U.accBg; d.style.borderColor = "#e0c890"; }}
                onMouseLeave={e => { const d = e.currentTarget as HTMLDivElement; d.style.background = "transparent"; d.style.borderColor = "transparent"; }}>
                <span style={{ fontSize: 17 }}>{ELEMENT_ICONS[t]}</span>
                <span style={{ fontSize: 10, color: U.txt }}>{ELEMENT_LABELS[t]}</span>
              </div>
            ))}
          </div>
        ))}

        {activeTab === "circuits" && (
          <div style={{ padding: 12 }}>
            <div style={{ fontSize: 8, color: U.dim, marginBottom: 7, fontFamily: "monospace" }}>NUEVO CIRCUITO</div>
            <input value={ncn} onChange={e => setNcn(e.target.value)} onKeyDown={e => e.key === "Enter" && mkCircuit()} placeholder="Ej: Luces Sala"
              style={{ width: "100%", background: "white", border: `1px solid ${U.bdr}`, borderRadius: 5, color: U.txt, fontSize: 9, padding: "5px 8px", outline: "none", boxSizing: "border-box", fontFamily: "monospace", marginBottom: 6 }}/>
            <select value={nct} onChange={e => setNct(e.target.value as any)}
              style={{ width: "100%", background: "white", border: `1px solid ${U.bdr}`, borderRadius: 5, color: U.txt, fontSize: 9, padding: "4px 6px", outline: "none", boxSizing: "border-box", fontFamily: "monospace", marginBottom: 8 }}>
              <option value="lighting">Iluminación</option>
              <option value="outlet">Tomacorrientes</option>
              <option value="ground">Tierra</option>
            </select>
            <button onClick={mkCircuit} style={{ width: "100%", background: U.accBg, border: `1px solid ${U.acc}`, borderRadius: 5, color: U.acc, fontSize: 9, padding: "6px", cursor: "pointer", fontFamily: "monospace" }}>+ Crear Circuito</button>
            <div style={{ marginTop: 13, fontSize: 8, color: U.dim, marginBottom: 5, fontFamily: "monospace" }}>ACTIVOS</div>
            {state.circuits.length === 0 && <div style={{ fontSize: 8, color: "#c0b090", textAlign: "center", padding: "8px 0" }}>Ninguno</div>}
            {state.circuits.map(c => (
              <div key={c.id} style={{ background: "white", border: `1px solid ${c.color}44`, borderRadius: 6, padding: "7px 10px", marginBottom: 5, borderLeft: `3px solid ${c.color}` }}>
                <div style={{ display: "flex", alignItems: "center", gap: 5, marginBottom: 2 }}>
                  <div style={{ width: 7, height: 7, borderRadius: "50%", background: c.color }}/>
                  <span style={{ fontSize: 9, color: U.txt }}>{c.name}</span>
                </div>
                <div style={{ fontSize: 7, color: U.dim, fontFamily: "monospace" }}>{c.type} · {c.elementIds.length} elem · {c.breakerId ? "✓ prot." : "sin prot."}</div>
                <button onClick={() => delCircuit(c.id)} style={{ marginTop: 3, fontSize: 7, color: "#c0392b", background: "none", border: "none", cursor: "pointer", padding: 0, fontFamily: "monospace" }}>× eliminar</button>
              </div>
            ))}
          </div>
        )}

        {activeTab === "panel" && (
          <div style={{ padding: 12 }}>
            <div style={{ fontSize: 8, color: U.dim, marginBottom: 10, fontFamily: "monospace" }}>CIRCUITO → INTERRUPTOR</div>
            {state.circuits.length === 0 && <div style={{ color: "#c0b090", textAlign: "center", padding: "16px 0", fontSize: 8, fontFamily: "monospace" }}>Crea circuitos primero</div>}
            {state.circuits.map(c => (
              <div key={c.id} style={{ background: "white", border: `1px solid ${U.bdr}`, borderRadius: 6, padding: "8px", marginBottom: 6 }}>
                <div style={{ fontSize: 9, color: U.txt, marginBottom: 4 }}>{c.name}</div>
                <select value={c.breakerId ?? ""} onChange={e => assignBreaker(c.id, e.target.value)}
                  style={{ width: "100%", background: U.side, border: `1px solid ${U.bdr}`, borderRadius: 5, color: U.txt, fontSize: 8, padding: "3px 5px", fontFamily: "monospace" }}>
                  <option value="">Sin interruptor</option>
                  {panelEls.filter(e => e.type === "panel_breaker").map(br => (
                    <option key={br.id} value={br.id}>{br.label} ({br.rating}A)</option>
                  ))}
                </select>
              </div>
            ))}
          </div>
        )}

        <div style={{ marginTop: "auto", padding: "10px 13px", borderTop: `1px solid ${U.bdr}` }}>
          <button onClick={() => { setState(INITIAL); setPWF(null); }}
            style={{ width: "100%", background: "transparent", border: `1px solid ${U.bdr}`, color: U.dim, fontSize: 8, fontFamily: "monospace", padding: "6px", borderRadius: 6, cursor: "pointer" }}
            onMouseEnter={e => { const b = e.currentTarget as HTMLButtonElement; b.style.borderColor = "#c0392b"; b.style.color = "#c0392b"; }}
            onMouseLeave={e => { const b = e.currentTarget as HTMLButtonElement; b.style.borderColor = U.bdr; b.style.color = U.dim; }}>
            LIMPIAR TODO
          </button>
        </div>
      </aside>

      {/* ── Main Canvas ─────────────────────────────────────────────────────────── */}
      <div style={{ flex: 1, position: "relative", overflow: "hidden" }}>
        <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: 47, background: "rgba(248,244,237,0.97)", backdropFilter: "blur(8px)", borderBottom: `1px solid ${U.bdr}`, display: "flex", alignItems: "center", padding: "0 16px", gap: 12, zIndex: 60 }}>
          {state.viewTarget === "interior" && (
            <button onClick={back} style={{ background: U.accBg, border: `1px solid ${U.acc}`, color: U.acc, fontSize: 10, padding: "4px 16px", borderRadius: 7, cursor: "pointer", fontFamily: "monospace" }}>← Vista General</button>
          )}
          <div style={{ fontSize: 11, color: U.dim, fontFamily: "monospace" }}>
            {state.viewTarget === "interior" && room
              ? `📐 ${room.name.toUpperCase()} — Detalle isométrico`
              : "📐 PLANTA ARQUITECTÓNICA — Clic en habitación para editar instalación eléctrica"}
          </div>
          {pwf && (
            <div style={{ marginLeft: "auto", background: "rgba(200,144,28,0.1)", border: `1px solid ${U.acc}`, color: U.acc, fontSize: 9, padding: "3px 14px", borderRadius: 12, fontFamily: "monospace" }}>
              ⌁ Doble clic en destino → cable — ESC cancela
            </div>
          )}
        </div>

        <div style={{ position: "absolute", inset: 0, top: 47 }}>
          {state.viewTarget === "exterior" ? (
            <HouseView
              onRoomClick={go}
              allElements={state.elements} allWires={state.wires} circuits={state.circuits}
              panelEls={panelEls} selectedElId={state.selectedElementId}
              onElementClick={id => setState(s => ({ ...s, selectedElementId: s.selectedElementId === id ? null : id }))}
              onPanelDrop={t => drop(t, 0, 0, null)}/>
          ) : room ? (
            <RoomView
              room={room} elements={state.elements} wires={state.wires} circuits={state.circuits}
              onDrop={(t, x, y) => drop(t, x, y, room.id)}
              onElementClick={elClick} onElementMove={move} onWireConnect={connect}
              selectedElId={state.selectedElementId} pendingWireFrom={pwf}
              onCanvasClick={() => { if (pwf) setPWF(null); else setState(s => ({ ...s, selectedElementId: null })); }}/>
          ) : null}
        </div>

        <ValidationPanel errors={errors} score={score}/>
      </div>

      {/* ── Right Properties ─────────────────────────────────────────────────────── */}
      <aside style={{ width: 212, background: U.side, borderLeft: `1px solid ${U.bdr}`, display: "flex", flexDirection: "column", overflowY: "auto", flexShrink: 0 }}>
        <div style={{ padding: "12px 13px", borderBottom: `1px solid ${U.bdr}` }}>
          <div style={{ fontSize: 8, color: U.dim, letterSpacing: "0.15em", fontFamily: "monospace" }}>PROPIEDADES</div>
        </div>

        {selEl ? (
          <div style={{ padding: "12px 13px" }}>
            <div style={{ fontSize: 9, color: U.acc, background: U.accBg, padding: "3px 8px", borderRadius: 5, display: "inline-flex", alignItems: "center", gap: 5, marginBottom: 12, fontFamily: "monospace", border: `1px solid ${U.acc}44` }}>
              {ELEMENT_ICONS[selEl.type]} {selEl.type.toUpperCase()}
            </div>

            {/* Powered status for lights */}
            {selEl.type === "light" && (() => {
              const on = isPowered(selEl, state.elements, state.wires, state.circuits);
              return (
                <div style={{ marginBottom: 10, padding: "6px 10px", background: on ? "rgba(72,160,96,0.1)" : "rgba(192,57,43,0.07)", border: `1px solid ${on ? "#48a060" : "#c0392b"}`, borderRadius: 6 }}>
                  <div style={{ fontSize: 9, color: on ? "#48a060" : "#c0392b", fontFamily: "monospace", fontWeight: "bold" }}>{on ? "✓ LUMINARIA ENCENDIDA" : "✗ Sin alimentación"}</div>
                  <div style={{ fontSize: 7, color: U.dim, fontFamily: "monospace", marginTop: 2 }}>{on ? "Circuito activo con interruptor asignado" : "Necesita: circuito + interruptor + cable"}</div>
                </div>
              );
            })()}

            <div style={{ marginBottom: 9 }}>
              <div style={{ fontSize: 8, color: U.dim, marginBottom: 3, fontFamily: "monospace" }}>Etiqueta</div>
              <input value={selEl.label} onChange={e => setState(s => ({ ...s, elements: s.elements.map(el => el.id === selEl.id ? { ...el, label: e.target.value } : el) }))}
                style={{ width: "100%", background: "white", border: `1px solid ${U.bdr}`, borderRadius: 5, color: U.txt, fontSize: 10, padding: "4px 7px", outline: "none", boxSizing: "border-box", fontFamily: "monospace" }}/>
            </div>

            {(selEl.type === "panel_breaker" || selEl.type === "panel_differential") && (
              <div style={{ marginBottom: 9 }}>
                <div style={{ fontSize: 8, color: U.dim, marginBottom: 3, fontFamily: "monospace" }}>Calibre (A)</div>
                <input type="number" value={selEl.rating ?? 20} onChange={e => setState(s => ({ ...s, elements: s.elements.map(el => el.id === selEl.id ? { ...el, rating: +e.target.value } : el) }))}
                  style={{ width: "100%", background: "white", border: `1px solid ${U.bdr}`, borderRadius: 5, color: U.acc, fontSize: 12, padding: "4px 7px", outline: "none", boxSizing: "border-box", fontFamily: "monospace" }}/>
              </div>
            )}

            {selEl.type !== "panel_breaker" && selEl.type !== "panel_differential" && (
              <div style={{ marginBottom: 9 }}>
                <div style={{ fontSize: 8, color: U.dim, marginBottom: 3, fontFamily: "monospace" }}>Circuito</div>
                <select value={selEl.circuitId ?? ""} onChange={e => { if (e.target.value) assignCircuit(selEl.id, e.target.value); }}
                  style={{ width: "100%", background: "white", border: `1px solid ${U.bdr}`, borderRadius: 5, color: U.txt, fontSize: 9, padding: "4px 6px", outline: "none", boxSizing: "border-box", fontFamily: "monospace" }}>
                  <option value="">Sin circuito</option>
                  {state.circuits.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                </select>
              </div>
            )}

            {(selEl.type === "outlet" || selEl.type === "light") && (
              <button onClick={() => toggleGnd(selEl.id)} style={{ width: "100%", marginBottom: 7, background: selEl.isGrounded ? "rgba(72,160,96,0.1)" : "transparent", border: `1px solid ${selEl.isGrounded ? "#48a060" : U.bdr}`, color: selEl.isGrounded ? "#48a060" : U.dim, fontSize: 9, padding: "5px", borderRadius: 6, cursor: "pointer", fontFamily: "monospace" }}>
                {selEl.isGrounded ? "⏚ CON TIERRA ✓" : "⏚ Marcar con tierra"}
              </button>
            )}

            {state.viewTarget === "interior" && (
              <button onClick={() => setPWF(p => p === selEl.id ? null : selEl.id)} style={{ width: "100%", marginBottom: 7, background: pwf === selEl.id ? U.accBg : "transparent", border: `1px solid ${pwf === selEl.id ? U.acc : U.bdr}`, color: pwf === selEl.id ? U.acc : U.dim, fontSize: 9, padding: "5px", borderRadius: 6, cursor: "pointer", fontFamily: "monospace" }}>
                {pwf === selEl.id ? "● Esperando destino... (ESC)" : "⌁ Iniciar cable desde aquí"}
              </button>
            )}

            <button onClick={() => delEl(selEl.id)} style={{ width: "100%", background: "transparent", border: `1px solid ${U.bdr}`, color: U.dim, fontSize: 9, padding: "5px", borderRadius: 6, cursor: "pointer", fontFamily: "monospace" }}
              onMouseEnter={e => { const b = e.currentTarget as HTMLButtonElement; b.style.color = "#c0392b"; b.style.borderColor = "#c0392b"; }}
              onMouseLeave={e => { const b = e.currentTarget as HTMLButtonElement; b.style.color = U.dim; b.style.borderColor = U.bdr; }}>
              × Eliminar
            </button>

            {/* Wires */}
            {(() => {
              const cw = state.wires.filter(w => w.fromElementId === selEl.id || w.toElementId === selEl.id);
              if (!cw.length) return null;
              return (
                <div style={{ marginTop: 10 }}>
                  <div style={{ fontSize: 8, color: U.dim, marginBottom: 5, fontFamily: "monospace" }}>CABLES ({cw.length})</div>
                  {cw.map(w => {
                    const oid = w.fromElementId === selEl.id ? w.toElementId : w.fromElementId;
                    const other = state.elements.find(e => e.id === oid);
                    const circ = state.circuits.find(c => c.id === w.circuitId);
                    return (
                      <div key={w.id} style={{ background: "white", border: `1px solid ${U.bdr}`, borderRadius: 5, padding: "4px 8px", marginBottom: 3, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                        <span style={{ fontSize: 8, color: U.txt, fontFamily: "monospace" }}>{ELEMENT_ICONS[other?.type ?? "light"]} {other?.label ?? "?"}</span>
                        <div style={{ display: "flex", gap: 5, alignItems: "center" }}>
                          {circ && <div style={{ width: 6, height: 6, borderRadius: "50%", background: circ.color }}/>}
                          <button onClick={() => delWire(w.id)} style={{ fontSize: 8, color: "#c0392b", background: "none", border: "none", cursor: "pointer", padding: 0, fontFamily: "monospace" }}>✕</button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              );
            })()}

            <div style={{ marginTop: 10, padding: 9, background: "white", border: `1px solid ${U.bdr}`, borderRadius: 6 }}>
              <div style={{ fontSize: 7, color: "#c0b090", marginBottom: 4, fontFamily: "monospace", letterSpacing: "0.1em" }}>INFO</div>
              <div style={{ fontSize: 8, color: U.dim, fontFamily: "monospace", lineHeight: 2 }}>
                <div>Hab: {selEl.roomId ? state.rooms.find(r => r.id === selEl.roomId)?.name ?? "—" : "Exterior"}</div>
                <div>Tierra: {selEl.isGrounded ? "✓" : "✗"}</div>
                <div>Circ: {selEl.circuitId ? state.circuits.find(c => c.id === selEl.circuitId)?.name ?? "—" : "—"}</div>
              </div>
            </div>
          </div>
        ) : (
          <div style={{ padding: "14px 13px", fontSize: 9, color: U.dim, lineHeight: 1.9, fontFamily: "monospace" }}>
            <div style={{ color: U.txt, marginBottom: 10, fontSize: 10 }}>Sin selección</div>
            <div style={{ color: U.txt }}>Planta general:</div>
            <div>• Clic hab. → editar</div>
            <div>• Panel izq. → tablero</div>
            <div style={{ color: U.txt, marginTop: 8 }}>Detalle habitación:</div>
            <div>• Arrastra elementos al piso</div>
            <div>• Clic → seleccionar</div>
            <div>• Doble clic → cable</div>
            <div>• ESC → cancelar</div>
            <div style={{ color: U.txt, marginTop: 8 }}>Luminaria encendida si:</div>
            <div>• Circuito de iluminación</div>
            <div>• + Interruptor asignado</div>
            <div>• + Cable conectado</div>
          </div>
        )}

        <div style={{ marginTop: "auto", padding: "12px 13px", borderTop: `1px solid ${U.bdr}` }}>
          <div style={{ fontSize: 7, color: U.dim, textTransform: "uppercase", marginBottom: 8, letterSpacing: "0.12em", fontFamily: "monospace" }}>Resumen</div>
          {[
            { l: "Luminarias",    v: state.elements.filter(e => e.type === "light").length, c: "#c8901c" },
            { l: "  encendidas",  v: state.elements.filter(e => isPowered(e, state.elements, state.wires, state.circuits)).length, c: "#48a060" },
            { l: "Tomacorrientes",v: state.elements.filter(e => e.type === "outlet").length, c: "#2c72b0" },
            { l: "Circuitos",     v: state.circuits.length, c: "#8060b0" },
            { l: "Cables",        v: state.wires.length, c: "#906050" },
          ].map(r => (
            <div key={r.l} style={{ display: "flex", justifyContent: "space-between", padding: "3px 0", borderBottom: `1px solid ${U.bdr}` }}>
              <span style={{ fontSize: 9, color: U.dim, fontFamily: "monospace" }}>{r.l}</span>
              <span style={{ fontSize: 10, fontWeight: "bold", color: r.c, fontFamily: "monospace" }}>{r.v}</span>
            </div>
          ))}
        </div>
      </aside>

      <style>{`
        * { box-sizing: border-box; }
        ::-webkit-scrollbar { width: 4px; }
        ::-webkit-scrollbar-track { background: #f2ede4; }
        ::-webkit-scrollbar-thumb { background: #d4c8b0; border-radius: 2px; }
        select option { background: #f8f4ed; color: #5a4830; }
      `}</style>
    </div>
  );
}