"use client";
import React, { useState, useRef, useCallback, useEffect, useMemo } from "react";

import { CompSVG } from "@/components/electrical/symbols/CompSVG";
import type { Component as CircuitComponent, CompType } from "@/types/types";

// ─── Types ────────────────────────────────────────────────────────────────────
type ElementType =
  | "light" | "outlet" | "switch" | "breaker"
  | "panel_breaker" | "panel_differential" | "ground_rod"
  | "smoke_detector" | "fan" | "ac";

type RoomType = "living" | "bedroom" | "kitchen" | "bathroom" | "garage" | "office" | "dining";

type CircuitType = "lighting" | "outlet" | "ground";

interface Room {
  id: string;
  name: string;
  type: RoomType;
  x: number;
  y: number;
  width: number;
  height: number;
}

interface ElectricalElement {
  id: string;
  type: ElementType;
  roomId: string | null;
  x: number;
  y: number;
  circuitId: string | null;
  label: string;
  isOn: boolean;
  isGrounded: boolean;
  rating?: number;
}

interface Circuit {
  id: string;
  name: string;
  type: CircuitType;
  color: string;
  breakerId: string | null;
  elementIds: string[];
  isProtected: boolean;
  hasGround: boolean;
}

interface Wire {
  id: string;
  fromElementId: string;
  toElementId: string;
  circuitId: string;
  isGroundWire: boolean;
  path: number[];
}

interface AppState {
  rooms: Room[];
  elements: ElectricalElement[];
  circuits: Circuit[];
  wires: Wire[];
  selectedRoomId: string | null;
  selectedElementId: string | null;
  viewTarget: "exterior" | "interior";
}

interface ValidationError {
  id: string;
  severity: "error" | "warning" | "info";
  category: string;
  title: string;
  message: string;
  fix: string;
}

interface IsoPoint {
  sx: number;
  sy: number;
}

interface DragRef {
  id: string;
  offX: number;
  offY: number;
}

interface DragPos {
  id: string;
  x: number;
  y: number;
}

// ─── Adapter a CompSVG ────────────────────────────────────────────────────────
function mapElementTypeToCompType(type: ElementType): CompType | null {
  switch (type) {
    case "light":
      return "luminaire";
    case "outlet":
      return "outlet";
    case "switch":
      return "switch";
    case "breaker":
    case "panel_breaker":
    case "panel_differential":
      return "breaker";
    default:
      return null;
  }
}

function toCircuitComponent(el: ElectricalElement): CircuitComponent | null {
  const compType = mapElementTypeToCompType(el.type);
  if (!compType) return null;

  return {
    id: el.id,
    type: compType,
    x: 0,
    y: 0,
    label: el.label,
    isOn: el.isOn,
    voltage: el.type === "light" || el.type === "outlet" ? 120 : undefined,
    rating:
      el.type === "breaker" ||
      el.type === "panel_breaker" ||
      el.type === "panel_differential"
        ? el.rating
        : undefined,
  } as CircuitComponent;
}

// ─── Legacy fallback SVGs ─────────────────────────────────────────────────────
interface GroundRodSVGProps { isGrounded: boolean; }
function GroundRodSVG({ isGrounded }: GroundRodSVGProps) {
  return (
    <svg viewBox="0 0 48 48" width="48" height="48">
      <line x1="24" y1="4" x2="24" y2="38" stroke={isGrounded ? "#4caf50" : "#78909c"} strokeWidth="3" strokeLinecap="round"/>
      <line x1="14" y1="38" x2="34" y2="38" stroke={isGrounded ? "#4caf50" : "#78909c"} strokeWidth="2.5"/>
      <line x1="17" y1="42" x2="31" y2="42" stroke={isGrounded ? "#66bb6a" : "#90a4ae"} strokeWidth="2"/>
      <line x1="20" y1="46" x2="28" y2="46" stroke={isGrounded ? "#a5d6a7" : "#b0bec5"} strokeWidth="1.5"/>
      {isGrounded && <circle cx="24" cy="8" r="4" fill="#4caf50" opacity="0.4"/>}
    </svg>
  );
}

interface SmokeDetectorSVGProps { active: boolean; }
function SmokeDetectorSVG({ active }: SmokeDetectorSVGProps) {
  return (
    <svg viewBox="0 0 48 48" width="48" height="48">
      <ellipse cx="24" cy="26" rx="18" ry="10" fill="#eceff1" stroke="#90a4ae" strokeWidth="1.5"/>
      <ellipse cx="24" cy="24" rx="18" ry="10" fill="#fafafa" stroke="#b0bec5" strokeWidth="1"/>
      <circle cx="24" cy="24" r="5" fill={active ? "#ef5350" : "#bdbdbd"} stroke={active ? "#c62828" : "#9e9e9e"} strokeWidth="1"/>
      {active && (
        <>
          <circle cx="24" cy="24" r="9" fill="none" stroke="#ef5350" strokeWidth="1" opacity="0.5"/>
          <path d="M16 14 Q18 10 20 14 Q22 18 24 14" fill="none" stroke="#90a4ae" strokeWidth="1.5" strokeLinecap="round" opacity="0.7"/>
          <path d="M24 12 Q26 8 28 12 Q30 16 32 12" fill="none" stroke="#90a4ae" strokeWidth="1.5" strokeLinecap="round" opacity="0.5"/>
        </>
      )}
    </svg>
  );
}

interface FanSVGProps { powered: boolean; }
function FanSVG({ powered }: FanSVGProps) {
  const [angle, setAngle] = useState(0);

  useEffect(() => {
    if (!powered) return;
    const id = setInterval(() => setAngle(a => (a + 12) % 360), 30);
    return () => clearInterval(id);
  }, [powered]);

  return (
    <svg viewBox="0 0 48 48" width="48" height="48">
      <circle cx="24" cy="24" r="20" fill="#eceff1" stroke="#90a4ae" strokeWidth="1.5"/>
      <g transform={`rotate(${angle}, 24, 24)`}>
        {[0, 90, 180, 270].map(r => (
          <ellipse
            key={r}
            cx="24"
            cy="14"
            rx="6"
            ry="9"
            fill={powered ? "#42a5f5" : "#b0bec5"}
            opacity="0.85"
            transform={`rotate(${r}, 24, 24)`}
          />
        ))}
      </g>
      <circle cx="24" cy="24" r="5" fill="#546e7a" stroke="#37474f" strokeWidth="1"/>
    </svg>
  );
}

interface ACSVGProps { powered: boolean; }
function ACSVG({ powered }: ACSVGProps) {
  return (
    <svg viewBox="0 0 48 48" width="48" height="48">
      <rect x="4" y="14" width="40" height="22" rx="5" fill={powered ? "#e3f2fd" : "#eceff1"} stroke={powered ? "#42a5f5" : "#90a4ae"} strokeWidth="1.5"/>
      {[20, 25, 30].map(y => (
        <line key={y} x1="10" y1={y} x2="38" y2={y} stroke={powered ? "#42a5f5" : "#b0bec5"} strokeWidth="1.2"/>
      ))}
      {powered && [0, 1, 2, 3].map(i => (
        <path
          key={i}
          d={`M${10 + i * 7} 36 Q${13 + i * 7} 42 ${16 + i * 7} 36`}
          fill="none"
          stroke="#64b5f6"
          strokeWidth="1"
          strokeLinecap="round"
          opacity="0.6"
        />
      ))}
      <circle cx="36" cy="18" r="2.5" fill={powered ? "#4caf50" : "#bdbdbd"} />
    </svg>
  );
}

function FallbackLegacySymbol({ el, powered = false }: { el: ElectricalElement; powered?: boolean }) {
  switch (el.type) {
    case "ground_rod":
      return <GroundRodSVG isGrounded={el.isGrounded} />;
    case "smoke_detector":
      return <SmokeDetectorSVG active={el.isOn} />;
    case "fan":
      return <FanSVG powered={powered} />;
    case "ac":
      return <ACSVG powered={powered} />;
    default:
      return <span style={{ fontSize: 24 }}>{ELEMENT_ICONS[el.type]}</span>;
  }
}

interface SymbolRendererProps {
  el: ElectricalElement;
  powered?: boolean;
  size?: number;
}

function SymbolRenderer({ el, powered = false, size = 48 }: SymbolRendererProps) {
  const comp = toCircuitComponent(el);

  return (
    <div
      style={{
        width: size,
        height: size,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        overflow: "hidden",
      }}
    >
      {comp ? (
        <div
          style={{
            transform: `scale(${size / 80})`,
            transformOrigin: "center",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <CompSVG comp={comp} active={powered} />
        </div>
      ) : (
        <div
          style={{
            transform: `scale(${size / 48})`,
            transformOrigin: "center",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <FallbackLegacySymbol el={el} powered={powered} />
        </div>
      )}
    </div>
  );
}

// ─── Types / Constants ────────────────────────────────────────────────────────
let _uid = 1;
const uid = () => `id_${Date.now()}_${_uid++}`;
const snap = (v: number, g = 20) => Math.round(v / g) * g;

const ELEMENT_LABELS: Record<ElementType, string> = {
  light: "Luminaria",
  outlet: "Tomacorriente",
  switch: "Interruptor",
  breaker: "Breaker",
  panel_breaker: "Interruptor",
  panel_differential: "Diferencial",
  ground_rod: "Varilla tierra",
  smoke_detector: "Detector humo",
  fan: "Ventilador",
  ac: "Aire acondicionado",
};

const ELEMENT_ICONS: Record<ElementType, string> = {
  light: "💡",
  outlet: "🔌",
  switch: "🔘",
  breaker: "⚡",
  panel_breaker: "⚡",
  panel_differential: "🛡️",
  ground_rod: "⏚",
  smoke_detector: "🔔",
  fan: "🌀",
  ac: "❄️",
};

interface PaletteGroup { cat: string; items: ElementType[]; }
const PALETTE_GROUPS: PaletteGroup[] = [
  { cat: "Iluminación", items: ["light", "switch", "fan"] },
  { cat: "Tomacorrientes", items: ["outlet", "ac"] },
  { cat: "Seguridad", items: ["smoke_detector"] },
  { cat: "Tablero", items: ["panel_breaker", "panel_differential", "ground_rod"] },
];

const CIRCUIT_COLORS: Record<CircuitType, string> = {
  lighting: "#f59e0b",
  outlet: "#3b82f6",
  ground: "#22c55e",
};

const ROOM_TYPES: RoomType[] = ["living", "bedroom", "kitchen", "bathroom", "garage", "office", "dining"];

const ROOM_TYPE_LABELS: Record<RoomType, string> = {
  living: "Sala",
  bedroom: "Dormitorio",
  kitchen: "Cocina",
  bathroom: "Baño",
  garage: "Garaje",
  office: "Oficina",
  dining: "Comedor",
};

interface RoomStyle {
  f: string;
  f2: string;
  w: string;
  ws: string;
  wd: string;
  lbl: string;
}

const RS: Record<RoomType, RoomStyle> = {
  living:   { f:"#1e2535", f2:"#252e42", w:"#1e2738", ws:"#1b2232", wd:"#334466", lbl:"#7090cc" },
  bedroom:  { f:"#1e2830", f2:"#233040", w:"#1e2832", ws:"#1a2430", wd:"#2e4055", lbl:"#6090b0" },
  kitchen:  { f:"#202530", f2:"#282e3c", w:"#1f2430", ws:"#1c2230", wd:"#303848", lbl:"#7080a0" },
  bathroom: { f:"#1a2835", f2:"#1f3040", w:"#1a2838", ws:"#152230", wd:"#2a4060", lbl:"#5090b8" },
  garage:   { f:"#1c2228", f2:"#222830", w:"#1c2228", ws:"#181e22", wd:"#2c3440", lbl:"#607080" },
  office:   { f:"#1e2030", f2:"#252840", w:"#1c1e30", ws:"#181c28", wd:"#303058", lbl:"#7060b0" },
  dining:   { f:"#28201a", f2:"#342820", w:"#281c14", ws:"#221610", wd:"#483020", lbl:"#b08060" },
};

const DEFAULT_ROOMS: Room[] = [
  { id:"r1", name:"Sala",    type:"living",   x:5,  y:5,  width:42, height:45 },
  { id:"r2", name:"Cocina",  type:"kitchen",  x:52, y:5,  width:43, height:30 },
  { id:"r3", name:"Dormit.", type:"bedroom",  x:52, y:40, width:43, height:35 },
  { id:"r4", name:"Baño",    type:"bathroom", x:5,  y:55, width:20, height:20 },
  { id:"r5", name:"Garaje",  type:"garage",   x:28, y:55, width:22, height:20 },
];

const INITIAL: AppState = {
  rooms: DEFAULT_ROOMS,
  elements: [],
  circuits: [],
  wires: [],
  selectedRoomId: null,
  selectedElementId: null,
  viewTarget: "exterior",
};

// ─── Geometry helpers ─────────────────────────────────────────────────────────
function iso(wx: number, wy: number, wz: number, scale: number, offX: number, offY: number): IsoPoint {
  const sx = (wx - wz) * Math.cos(Math.PI / 6) * scale + offX;
  const sy = (wx + wz) * Math.sin(Math.PI / 6) * scale - wy * 0.816 * scale + offY;
  return { sx, sy };
}

function wirePath(x1: number, y1: number, x2: number, y2: number): string {
  const mx = (x1 + x2) / 2;
  return `M ${x1} ${y1} C ${mx} ${y1}, ${mx} ${y2}, ${x2} ${y2}`;
}

// ─── Power logic ──────────────────────────────────────────────────────────────
function isPowered(el: ElectricalElement, elements: ElectricalElement[], wires: Wire[], circuits: Circuit[]): boolean {
  if (!["light", "fan", "ac", "smoke_detector"].includes(el.type)) return false;
  if (!el.circuitId) return false;
  const c = circuits.find(c => c.id === el.circuitId);
  if (!c || !c.breakerId) return false;
  const breaker = elements.find(e => e.id === c.breakerId);
  if (!breaker) return false;
  return wires.some(w => w.fromElementId === el.id || w.toElementId === el.id);
}

function getActiveWires(elements: ElectricalElement[], wires: Wire[], circuits: Circuit[]): Set<string> {
  const activeSet = new Set<string>();
  wires.forEach(w => {
    const fe = elements.find(e => e.id === w.fromElementId);
    const te = elements.find(e => e.id === w.toElementId);
    if (!fe || !te) return;
    const cid = w.circuitId;
    if (!cid) return;
    const c = circuits.find(c => c.id === cid);
    if (c && c.breakerId) activeSet.add(w.id);
  });
  return activeSet;
}

// ─── Validation ───────────────────────────────────────────────────────────────
function validateInstallation(state: AppState): ValidationError[] {
  const errors: ValidationError[] = [];
  const { elements, circuits } = state;
  const breakers = elements.filter(e => e.type === "panel_breaker" || e.type === "panel_differential");
  const grounds  = elements.filter(e => e.type === "ground_rod");

  if (breakers.length === 0) {
    errors.push({
      id: "e1",
      severity: "error",
      category: "Tablero",
      title: "Sin interruptores",
      message: "No hay interruptores en el tablero.",
      fix: "Arrastra un interruptor al tablero principal.",
    });
  }

  if (grounds.length === 0) {
    errors.push({
      id: "e2",
      severity: "warning",
      category: "Puesta a tierra",
      title: "Sin varilla de tierra",
      message: "No se encontró varilla de tierra.",
      fix: "Agrega una varilla de tierra.",
    });
  }

  circuits.forEach(c => {
    if (!c.breakerId) {
      errors.push({
        id: `e_c_${c.id}`,
        severity: "warning",
        category: "Circuito",
        title: "Circuito sin protección",
        message: `"${c.name}" sin interruptor.`,
        fix: "Asigna un interruptor.",
      });
    }
  });

  return errors;
}

function getScore(errors: ValidationError[]): number {
  let s = 100;
  errors.forEach(e => {
    if (e.severity === "error") s -= 20;
    else if (e.severity === "warning") s -= 8;
    else s -= 2;
  });
  return Math.max(0, s);
}

// ─── Room Manager ──────────────────────────────────────────────────────────────
interface RoomManagerProps {
  rooms: Room[];
  onClose: () => void;
  onSave: (rooms: Room[]) => void;
}

function RoomManager({ rooms, onClose, onSave }: RoomManagerProps) {
  const [draft, setDraft] = useState<Room[]>(rooms.map(r => ({ ...r })));
  const U = { bdr:"#1e3050", txt:"#94a3b8", acc:"#4a9eff", accBg:"rgba(74,158,255,0.08)", dim:"#3a5070" };

  return (
    <div style={{ position:"fixed", inset:0, background:"rgba(0,0,0,0.8)", zIndex:999, display:"flex", alignItems:"center", justifyContent:"center" }}>
      <div style={{ background:"#06101e", border:`1px solid ${U.bdr}`, borderRadius:14, width:680, maxHeight:"85vh", display:"flex", flexDirection:"column", boxShadow:"0 24px 64px rgba(0,0,0,0.7)" }}>
        <div style={{ padding:"16px 20px", borderBottom:`1px solid ${U.bdr}`, display:"flex", justifyContent:"space-between", alignItems:"center" }}>
          <div style={{ fontSize:13, color:U.acc, fontFamily:"monospace", fontWeight:"bold" }}>🏠 GESTIÓN DE HABITACIONES</div>
          <button onClick={onClose} style={{ background:"transparent", border:`1px solid ${U.bdr}`, color:U.dim, borderRadius:6, width:28, height:28, cursor:"pointer" }}>✕</button>
        </div>

        <div style={{ padding:"10px 20px", borderBottom:`1px solid ${U.bdr}` }}>
          <div style={{ position:"relative", width:"100%", height:120, background:"#040810", borderRadius:8, border:`1px solid ${U.bdr}`, overflow:"hidden" }}>
            {draft.map(r => {
              const s = RS[r.type];
              return (
                <div
                  key={r.id}
                  style={{
                    position:"absolute",
                    left:`${r.x}%`,
                    top:`${r.y}%`,
                    width:`${r.width}%`,
                    height:`${r.height}%`,
                    background:s.f,
                    border:`1px solid ${s.wd}`,
                    display:"flex",
                    alignItems:"center",
                    justifyContent:"center",
                    fontSize:7,
                    color:s.lbl,
                    fontFamily:"monospace",
                    borderRadius:2,
                  }}
                >
                  {r.name}
                </div>
              );
            })}
          </div>
        </div>

        <div style={{ overflowY:"auto", flex:1, padding:"12px 20px" }}>
          {draft.map(r => (
            <div key={r.id} style={{ background:"#0a1428", border:`1px solid ${U.bdr}`, borderRadius:8, padding:"10px 14px", marginBottom:8, display:"flex", gap:10, alignItems:"center", flexWrap:"wrap" }}>
              <div style={{ width:4, height:40, background:RS[r.type].lbl, borderRadius:2, flexShrink:0 }}/>

              <div style={{ flex:"1 1 100px", minWidth:80 }}>
                <div style={{ fontSize:7, color:U.dim, fontFamily:"monospace", marginBottom:2 }}>Nombre</div>
                <input
                  value={r.name}
                  onChange={e => setDraft(d => d.map(x => x.id===r.id ? {...x, name:e.target.value} : x))}
                  style={{ width:"100%", background:"#04080e", border:`1px solid ${U.bdr}`, borderRadius:5, color:U.txt, fontSize:10, padding:"3px 6px", fontFamily:"monospace", outline:"none", boxSizing:"border-box" }}
                />
              </div>

              <div style={{ flex:"1 1 90px" }}>
                <div style={{ fontSize:7, color:U.dim, fontFamily:"monospace", marginBottom:2 }}>Tipo</div>
                <select
                  value={r.type}
                  onChange={e => setDraft(d => d.map(x => x.id===r.id ? {...x, type:e.target.value as RoomType} : x))}
                  style={{ width:"100%", background:"#04080e", border:`1px solid ${U.bdr}`, borderRadius:5, color:U.txt, fontSize:9, padding:"3px 5px", fontFamily:"monospace", outline:"none" }}
                >
                  {ROOM_TYPES.map(t => <option key={t} value={t}>{ROOM_TYPE_LABELS[t]}</option>)}
                </select>
              </div>

              {(["x","y","width","height"] as const).map(field => (
                <div key={field} style={{ flex:"0 0 52px" }}>
                  <div style={{ fontSize:7, color:U.dim, fontFamily:"monospace", marginBottom:2 }}>
                    {field==="x"?"X%":field==="y"?"Y%":field==="width"?"Ancho%":"Alto%"}
                  </div>
                  <input
                    type="number"
                    min="1"
                    max="95"
                    value={r[field]}
                    onChange={e => setDraft(d => d.map(x => x.id===r.id ? {...x, [field]:Math.max(5,Math.min(95,+e.target.value))} : x))}
                    style={{ width:"100%", background:"#04080e", border:`1px solid ${U.bdr}`, borderRadius:5, color:U.acc, fontSize:10, padding:"3px 5px", fontFamily:"monospace", outline:"none" }}
                  />
                </div>
              ))}

              <button
                onClick={() => setDraft(d => d.filter(x => x.id!==r.id))}
                style={{ background:"transparent", border:"1px solid #c0392b44", color:"#c0392b", borderRadius:6, width:26, height:26, cursor:"pointer", fontSize:13, flexShrink:0 }}
              >
                ✕
              </button>
            </div>
          ))}

          <button
            onClick={() => setDraft(d => [...d, { id:uid(), name:"Nueva Hab.", type:"living", x:10, y:10, width:30, height:30 }])}
            style={{ width:"100%", background:U.accBg, border:`1px dashed ${U.acc}`, borderRadius:8, color:U.acc, fontSize:10, padding:"10px", cursor:"pointer", fontFamily:"monospace" }}
          >
            + Agregar habitación
          </button>
        </div>

        <div style={{ padding:"12px 20px", borderTop:`1px solid ${U.bdr}`, display:"flex", gap:10, justifyContent:"flex-end" }}>
          <button onClick={onClose} style={{ background:"transparent", border:`1px solid ${U.bdr}`, color:U.dim, borderRadius:7, padding:"7px 20px", cursor:"pointer", fontFamily:"monospace", fontSize:10 }}>
            Cancelar
          </button>
          <button onClick={() => onSave(draft)} style={{ background:U.accBg, border:`1px solid ${U.acc}`, color:U.acc, borderRadius:7, padding:"7px 24px", cursor:"pointer", fontFamily:"monospace", fontSize:10, fontWeight:"bold" }}>
            ✓ Guardar
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Cross-Room Selector ──────────────────────────────────────────────────────
interface CrossRoomSelectorProps {
  fromEl: ElectricalElement;
  elements: ElectricalElement[];
  rooms: Room[];
  circuits: Circuit[];
  onConnect: (toId: string) => void;
  onCancel: () => void;
}

function CrossRoomSelector({ fromEl, elements, rooms, circuits, onConnect, onCancel }: CrossRoomSelectorProps) {
  const [selId, setSelId] = useState<string | null>(null);
  const U = { bdr:"#1e3050", txt:"#94a3b8", acc:"#4a9eff", accBg:"rgba(74,158,255,0.08)", dim:"#3a5070" };
  const others = elements.filter(e => e.roomId && e.roomId !== fromEl.roomId && e.id !== fromEl.id);

  return (
    <div style={{ position:"fixed", inset:0, background:"rgba(0,0,0,0.8)", zIndex:999, display:"flex", alignItems:"center", justifyContent:"center" }}>
      <div style={{ background:"#06101e", border:`1px solid ${U.bdr}`, borderRadius:14, width:420, maxHeight:"70vh", display:"flex", flexDirection:"column", boxShadow:"0 24px 64px rgba(0,0,0,0.7)" }}>
        <div style={{ padding:"14px 18px", borderBottom:`1px solid ${U.bdr}` }}>
          <div style={{ fontSize:11, color:U.acc, fontFamily:"monospace", fontWeight:"bold" }}>⌁ CABLE INTER-HABITACIÓN</div>
        </div>

        <div style={{ overflowY:"auto", flex:1, padding:"10px 14px" }}>
          {others.length === 0 ? (
            <div style={{ textAlign:"center", color:U.dim, fontSize:10, fontFamily:"monospace", padding:"20px 0" }}>
              No hay elementos en otras habitaciones.
            </div>
          ) : others.map(el => {
            const c = circuits.find(c => c.id === el.circuitId);
            const isSel = selId === el.id;
            return (
              <div
                key={el.id}
                onClick={() => setSelId(el.id)}
                style={{ display:"flex", alignItems:"center", gap:10, padding:"9px 12px", marginBottom:4, background:isSel?U.accBg:"#0a1428", border:`1px solid ${isSel?U.acc:U.bdr}`, borderRadius:7, cursor:"pointer" }}
              >
                <div style={{ width:8, height:8, borderRadius:"50%", background:c?.color??"#94a3b8", flexShrink:0 }}/>
                <span style={{ fontSize:18 }}>{ELEMENT_ICONS[el.type]}</span>
                <div style={{ flex:1 }}>
                  <div style={{ fontSize:10, color:isSel?U.acc:U.txt, fontFamily:"monospace" }}>{el.label}</div>
                  <div style={{ fontSize:8, color:U.dim, fontFamily:"monospace" }}>{rooms.find(r=>r.id===el.roomId)?.name} · {el.type}</div>
                </div>
                {isSel && <span style={{ color:U.acc }}>✓</span>}
              </div>
            );
          })}
        </div>

        <div style={{ padding:"12px 18px", borderTop:`1px solid ${U.bdr}`, display:"flex", gap:8, justifyContent:"flex-end" }}>
          <button onClick={onCancel} style={{ background:"transparent", border:`1px solid ${U.bdr}`, color:U.dim, borderRadius:7, padding:"6px 16px", cursor:"pointer", fontFamily:"monospace", fontSize:9 }}>
            Cancelar
          </button>
          <button
            disabled={!selId}
            onClick={() => selId && onConnect(selId)}
            style={{ background:selId?U.accBg:"transparent", border:`1px solid ${selId?U.acc:U.bdr}`, color:selId?U.acc:U.dim, borderRadius:7, padding:"6px 20px", cursor:selId?"pointer":"not-allowed", fontFamily:"monospace", fontSize:9 }}
          >
            ⌁ Conectar
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Animated Wire ────────────────────────────────────────────────────────────
interface AnimatedWireProps {
  d: string;
  color: string;
  active: boolean;
  isCross: boolean;
  onClick: () => void;
}

function AnimatedWire({ d, color, active, isCross, onClick }: AnimatedWireProps) {
  const electrons = [0, 0.33, 0.66];
  return (
    <g>
      {active && <path d={d} fill="none" stroke={color} strokeWidth="10" opacity="0.12" strokeLinecap="round"/>}
      <path d={d} fill="none" stroke={active ? color : "#334155"} strokeWidth={active ? 4 : 3} strokeLinecap="round" strokeDasharray={isCross ? "10 6" : undefined} opacity="0.95"/>
      {active && <path d={d} fill="none" stroke="rgba(255,255,255,0.25)" strokeWidth="1.5" strokeLinecap="round"/>}
      {active && electrons.map((offset, i) => (
        <circle key={i} r="5" fill={color} opacity="0.95">
          <animateMotion dur="1.4s" begin={`${offset * 1.4}s`} repeatCount="indefinite" path={d}/>
        </circle>
      ))}
      <path d={d} fill="none" stroke="transparent" strokeWidth="14" style={{ cursor:"pointer" }} onClick={onClick}/>
    </g>
  );
}

// ─── House View ───────────────────────────────────────────────────────────────
interface Room3D extends Room {
  x0: number;
  z0: number;
  x1: number;
  z1: number;
}

interface HouseViewProps {
  rooms: Room[];
  onRoomClick: (id: string) => void;
  allElements: ElectricalElement[];
  allWires: Wire[];
  circuits: Circuit[];
  panelEls: ElectricalElement[];
  selectedElId: string | null;
  onElementClick: (id: string) => void;
  onPanelDrop: (type: ElementType) => void;
}

function HouseView({ rooms, onRoomClick, allElements, allWires, circuits, panelEls, selectedElId, onElementClick, onPanelDrop }: HouseViewProps) {
  const [hov, setHov] = useState<string | null>(null);
  const [panelOver, setPanelOver] = useState(false);
  const S = 2.2;
  const WH = 44;
  const activeWires = useMemo(() => getActiveWires(allElements, allWires, circuits), [allElements, allWires, circuits]);

  const rooms3d = useMemo<Room3D[]>(() => rooms.map(r => ({
    ...r,
    x0:(r.x-50)*S, z0:(r.y-50)*S,
    x1:(r.x+r.width-50)*S, z1:(r.y+r.height-50)*S,
  })), [rooms]);

  const sorted = useMemo(() => [...rooms3d].sort((a,b) => ((a.x0+a.x1)/2+(a.z0+a.z1)/2)-((b.x0+b.x1)/2+(b.z0+b.z1)/2)), [rooms3d]);

  const SCALE = 5.2;
  const allCorners = rooms3d.flatMap(r => [
    iso(r.x0,0,r.z0,SCALE,0,0), iso(r.x1,0,r.z0,SCALE,0,0),
    iso(r.x0,0,r.z1,SCALE,0,0), iso(r.x1,0,r.z1,SCALE,0,0),
    iso(r.x0,WH,r.z0,SCALE,0,0), iso(r.x1,WH,r.z0,SCALE,0,0),
    iso(r.x0,WH,r.z1,SCALE,0,0), iso(r.x1,WH,r.z1,SCALE,0,0),
  ]);

  const pad=60;
  const vx0=Math.min(...allCorners.map(p=>p.sx))-pad;
  const vx1=Math.max(...allCorners.map(p=>p.sx))+pad;
  const vy0=Math.min(...allCorners.map(p=>p.sy))-pad;
  const vy1=Math.max(...allCorners.map(p=>p.sy))+pad;
  const VW=vx1-vx0;
  const VH=vy1-vy0;
  const proj = (wx: number, wy: number, wz: number) => iso(wx,wy,wz,SCALE,-vx0,-vy0);
  const poly = (pts: IsoPoint[]) => pts.map(p => `${p.sx.toFixed(1)},${p.sy.toFixed(1)}`).join(" ");

  function elWorldPos(el: ElectricalElement): { wx: number; wz: number } | null {
    const r = rooms3d.find(r => r.id === el.roomId);
    if (!r) return null;
    return {
      wx: r.x0 + (r.x1-r.x0) * (el.x / 1200),
      wz: r.z0 + (r.z1-r.z0) * (el.y / 800),
    };
  }

  function renderRoom(r: Room3D) {
    const s = RS[r.type];
    const isHov = hov === r.id;
    const hasPowered = allElements.some(el => el.roomId===r.id && isPowered(el, allElements, allWires, circuits));

    const fl = { TL:proj(r.x0,0,r.z0), TR:proj(r.x1,0,r.z0), BL:proj(r.x0,0,r.z1), BR:proj(r.x1,0,r.z1) };
    const ce = { TL:proj(r.x0,WH,r.z0), TR:proj(r.x1,WH,r.z0), BL:proj(r.x0,WH,r.z1), BR:proj(r.x1,WH,r.z1) };

    const cx=(fl.TL.sx+fl.BR.sx)/2;
    const cy=(fl.TL.sy+fl.BR.sy)/2;

    const planks: React.ReactNode[] = [];
    for (let i=1; i<7; i++) {
      const t=i/7;
      const px=r.x0+(r.x1-r.x0)*t;
      const a=proj(px,0,r.z0), b=proj(px,0,r.z1);
      planks.push(<line key={`px${i}`} x1={a.sx} y1={a.sy} x2={b.sx} y2={b.sy} stroke={s.f2} strokeWidth="0.7" opacity="0.55"/>);
      const pz=r.z0+(r.z1-r.z0)*t;
      const c=proj(r.x0,0,pz), d=proj(r.x1,0,pz);
      planks.push(<line key={`pz${i}`} x1={c.sx} y1={c.sy} x2={d.sx} y2={d.sy} stroke={s.f2} strokeWidth="0.7" opacity="0.35"/>);
    }

    return (
      <g
        key={r.id}
        onClick={e => { e.stopPropagation(); onRoomClick(r.id); }}
        onMouseEnter={() => setHov(r.id)}
        onMouseLeave={() => setHov(null)}
        style={{ cursor:"pointer" }}
      >
        {hasPowered && (
          <defs>
            <radialGradient id={`glow-${r.id}`} cx="50%" cy="50%">
              <stop offset="0%" stopColor="#fff5c0"/>
              <stop offset="60%" stopColor="#f5d870"/>
              <stop offset="100%" stopColor={s.f}/>
            </radialGradient>
          </defs>
        )}

        <polygon points={poly([fl.TL,fl.TR,fl.BR,fl.BL])} fill={hasPowered ? `url(#glow-${r.id})` : isHov ? "#f0e8d0" : s.f} stroke={s.f2} strokeWidth="0.8"/>
        {planks}
        {isHov && <polygon points={poly([fl.TL,fl.TR,fl.BR,fl.BL])} fill="rgba(255,240,180,0.2)" stroke="none"/>}
        <polygon points={poly([fl.TL,fl.BL,ce.BL,ce.TL])} fill={s.w} stroke={s.wd} strokeWidth="0.6"/>
        <polygon points={poly([fl.TL,fl.TR,ce.TR,ce.TL])} fill={s.ws} stroke={s.wd} strokeWidth="0.6"/>
        <line x1={ce.TL.sx} y1={ce.TL.sy} x2={ce.TR.sx} y2={ce.TR.sy} stroke={s.wd} strokeWidth={isHov?1.8:1}/>
        <line x1={ce.TL.sx} y1={ce.TL.sy} x2={ce.BL.sx} y2={ce.BL.sy} stroke={s.wd} strokeWidth={isHov?1.8:1}/>
        <line x1={ce.TR.sx} y1={ce.TR.sy} x2={ce.BR.sx} y2={ce.BR.sy} stroke={s.wd} strokeWidth="0.5" strokeDasharray="3 3"/>
        <line x1={ce.BL.sx} y1={ce.BL.sy} x2={ce.BR.sx} y2={ce.BR.sy} stroke={s.wd} strokeWidth="0.5" strokeDasharray="3 3"/>
        <text x={cx} y={cy+6} textAnchor="middle" fontSize="8.5" fill={isHov?"#5a3800":s.lbl} fontFamily="'Georgia', serif" fontWeight={isHov?"bold":"normal"} letterSpacing="0.1em" style={{ pointerEvents:"none", userSelect:"none" }}>
          {r.name.toUpperCase()}
        </text>
        {isHov && <text x={cx} y={cy+18} textAnchor="middle" fontSize="6" fill="#8b6030" fontFamily="monospace" style={{ pointerEvents:"none" }}>clic para editar</text>}
      </g>
    );
  }

  const PANEL_TYPES: ElementType[] = ["panel_breaker","panel_differential","ground_rod"];

  return (
    <div style={{ width:"100%", height:"100%", position:"relative", overflow:"hidden" }}>
      <svg style={{ position:"absolute", inset:0, width:"100%", height:"100%", pointerEvents:"none" }}>
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

      <svg viewBox={`0 0 ${VW} ${VH}`} style={{ position:"absolute", inset:0, width:"100%", height:"100%", overflow:"visible" }}>
        <defs>
          <filter id="dropShadow" x="-10%" y="-10%" width="130%" height="150%">
            <feDropShadow dx="6" dy="12" stdDeviation="10" floodColor="#8090a8" floodOpacity="0.28"/>
          </filter>
          <filter id="elecGlow">
            <feGaussianBlur stdDeviation="3" result="b"/>
            <feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge>
          </filter>
        </defs>

        <g filter="url(#dropShadow)">
          {sorted.map(r => renderRoom(r))}
        </g>

        {allWires.map(w => {
          const fe = allElements.find(e => e.id===w.fromElementId);
          const te = allElements.find(e => e.id===w.toElementId);
          if (!fe?.roomId || !te?.roomId) return null;

          const fp = elWorldPos(fe);
          const tp = elWorldPos(te);
          if (!fp || !tp) return null;

          const fpt = proj(fp.wx,1.5,fp.wz);
          const tpt = proj(tp.wx,1.5,tp.wz);
          const isCross = fe.roomId !== te.roomId;
          const circ = w.circuitId ? circuits.find(c=>c.id===w.circuitId) : null;
          const color = w.isGroundWire ? "#22c55e" : circ?.color ?? "#6b7280";
          const active = activeWires.has(w.id);
          const d = `M ${fpt.sx} ${fpt.sy} L ${tpt.sx} ${tpt.sy}`;

          return (
            <g key={w.id}>
              <AnimatedWire d={d} color={color} active={active} isCross={isCross} onClick={() => {}}/>
            </g>
          );
        })}

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
            <g key={el.id} style={{ cursor:"pointer" }} onClick={e => { e.stopPropagation(); onElementClick(el.id); }}>
              {powered && <ellipse cx={p.sx} cy={p.sy+3} rx={24} ry={14} fill="rgba(255,230,80,0.5)" filter="url(#elecGlow)"/>}
              <ellipse cx={p.sx} cy={p.sy+3} rx={R+3} ry={(R+3)*0.45} fill="rgba(0,0,0,0.22)"/>
              {isSel && <circle cx={p.sx} cy={p.sy} r={R+7} fill="none" stroke="#f59e0b" strokeWidth="2.5"/>}
              <circle cx={p.sx} cy={p.sy} r={R} fill={powered?"#fffbe8":"white"} stroke={powered?"#f59e0b":dotColor} strokeWidth="1.8"/>

              <foreignObject x={p.sx - 14} y={p.sy - 14} width={28} height={28} style={{ pointerEvents:"none", overflow:"visible" }}>
                <div style={{ width:28, height:28, display:"flex", alignItems:"center", justifyContent:"center" }}>
                  <SymbolRenderer el={el} powered={powered} size={22} />
                </div>
              </foreignObject>

              {powered && <circle cx={p.sx+R*0.72} cy={p.sy-R*0.72} r="3.5" fill="#22c55e" stroke="white" strokeWidth="1"/>}
            </g>
          );
        })}

        <g>
          <circle cx={VW-50} cy={55} r="22" fill="rgba(255,255,255,0.7)" stroke="#a0b0c8" strokeWidth="1"/>
          <polygon points={`${VW-50},${55-16} ${VW-54},${55} ${VW-46},${55}`} fill="#4a6080"/>
          <polygon points={`${VW-50},${55+16} ${VW-54},${55} ${VW-46},${55}`} fill="#8090a8"/>
          <text x={VW-50} y={55-19} textAnchor="middle" fontSize="9" fill="#3a5070" fontFamily="monospace" fontWeight="bold">N</text>
        </g>
      </svg>

      <div
        style={{ position:"absolute", left:12, top:12, width:186, background:panelOver?"rgba(255,255,255,0.98)":"rgba(255,253,248,0.96)", border:`1.5px solid ${panelOver?"#f59e0b":"#d4c8b0"}`, borderRadius:10, padding:11, transition:"all 0.15s", boxShadow:"0 4px 18px rgba(80,60,20,0.14)", fontFamily:"Georgia,serif" }}
        onDragOver={e => { e.preventDefault(); e.stopPropagation(); setPanelOver(true); }}
        onDragLeave={() => setPanelOver(false)}
        onDrop={e => {
          e.preventDefault();
          e.stopPropagation();
          setPanelOver(false);
          const t = e.dataTransfer.getData("elemType") as ElementType;
          if (PANEL_TYPES.includes(t)) onPanelDrop(t);
        }}
      >
        <div style={{ fontSize:8, color:"#8b6020", fontFamily:"monospace", fontWeight:"bold", marginBottom:7, letterSpacing:"0.12em" }}>⚡ TABLERO PRINCIPAL</div>

        <div style={{ background:"#f8f2e4", border:"1px solid #d8c898", borderRadius:5, padding:"5px 9px", marginBottom:7, display:"flex", justifyContent:"space-between" }}>
          <span style={{ fontSize:8, color:"#7a6030", fontFamily:"monospace" }}>PRINCIPAL 100A</span>
          <span style={{ fontSize:9, color:"#b08010", fontFamily:"monospace" }}>✓</span>
        </div>

        {panelEls.length === 0 ? (
          <div style={{ fontSize:8, color:panelOver?"#f59e0b":"#b0a080", fontFamily:"monospace", textAlign:"center", padding:"9px 0", border:"1px dashed #d4c898", borderRadius:6 }}>
            {panelOver ? "Suelta aquí ▼" : "Arrastra interruptores aquí"}
          </div>
        ) : panelEls.map(el => (
          <div key={el.id} style={{ background:"#f8f2e4", border:`1px solid ${el.type==="panel_differential"?"#90c8a0":"#d4c898"}`, borderLeft:`3px solid ${el.type==="panel_differential"?"#22c55e":"#f59e0b"}`, borderRadius:5, padding:"5px 9px", marginBottom:4, display:"flex", gap:6, alignItems:"center" }}>
            <div style={{ width:32, height:32, flexShrink:0 }}>
              <SymbolRenderer el={el} powered={true} size={32} />
            </div>
            <span style={{ fontSize:8, color:"#706040", fontFamily:"monospace", flex:1 }}>{el.label}</span>
            <span style={{ fontSize:9, color:"#a87010", fontFamily:"monospace", fontWeight:"bold" }}>{el.rating??20}A</span>
          </div>
        ))}
      </div>

      <div style={{ position:"absolute", bottom:12, left:"50%", transform:"translateX(-50%)", background:"rgba(255,253,248,0.9)", border:"1px solid #d4c8b0", borderRadius:20, padding:"5px 18px", fontSize:8, color:"#806040", fontFamily:"monospace", display:"flex", gap:16, pointerEvents:"none" }}>
        <span>Clic en habitación → Vista detalle</span>
        <span>⚡ Electrones animados en circuitos activos</span>
      </div>
    </div>
  );
}

// ─── Room View ────────────────────────────────────────────────────────────────
interface RoomViewProps {
  room: Room;
  elements: ElectricalElement[];
  wires: Wire[];
  circuits: Circuit[];
  rooms: Room[];
  onDrop: (type: ElementType, x: number, y: number) => void;
  onElementClick: (id: string, wire: boolean) => void;
  onElementMove: (id: string, x: number, y: number) => void;
  onWireConnect: (toId: string) => void;
  selectedElId: string | null;
  pendingWireFrom: string | null;
  onCanvasClick: () => void;
  onCrossRoomWire: () => void;
  onToggle: (id: string) => void;
}

function RoomView({ room, elements, wires, circuits, rooms, onDrop, onElementClick, onElementMove, onWireConnect, selectedElId, pendingWireFrom, onCanvasClick, onCrossRoomWire }: RoomViewProps) {
  const svgRef = useRef<SVGSVGElement>(null);
  const dragRef = useRef<DragRef | null>(null);
  const [dragPos, setDragPos] = useState<DragPos | null>(null);
  const [mouse, setMouse] = useState<{ x: number; y: number }>({ x:600, y:400 });
  const activeWires = useMemo(() => getActiveWires(elements, wires, circuits), [elements, wires, circuits]);

  const roomEls = elements.filter(e => e.roomId === room.id);
  const s = RS[room.type];
  const WH=120, OX=600, OY=460, ROOM_W=200, ROOM_D=160;
  const rp = (rx: number, ry: number, rz: number) => iso(rx,ry,rz,4.4*0.7,OX,OY);
  const frac2iso = (fx: number, fz: number) => rp((fx-0.5)*ROOM_W*2, 0, (fz-0.5)*ROOM_D*2);

  const fTL=rp(-ROOM_W,0,-ROOM_D), fTR=rp(ROOM_W,0,-ROOM_D), fBL=rp(-ROOM_W,0,ROOM_D), fBR=rp(ROOM_W,0,ROOM_D);
  const cTL=rp(-ROOM_W,WH,-ROOM_D), cTR=rp(ROOM_W,WH,-ROOM_D), cBL=rp(-ROOM_W,WH,ROOM_D);
  const pts = (arr: IsoPoint[]) => arr.map(p=>`${p.sx.toFixed(1)},${p.sy.toFixed(1)}`).join(" ");

  const planks: React.ReactNode[] = [];
  for (let i=1; i<10; i++) {
    const t=i/10;
    const a=frac2iso(t,0), b=frac2iso(t,1), c=frac2iso(0,t), d=frac2iso(1,t);
    planks.push(<line key={`a${i}`} x1={a.sx} y1={a.sy} x2={b.sx} y2={b.sy} stroke={s.f2} strokeWidth="1.2" opacity="0.55"/>);
    planks.push(<line key={`b${i}`} x1={c.sx} y1={c.sy} x2={d.sx} y2={d.sy} stroke={s.f2} strokeWidth="1.2" opacity="0.38"/>);
  }

  function svgXY(cx: number, cy: number): { x: number; y: number } {
    const svg = svgRef.current;
    if (!svg) return { x:0, y:0 };
    const rect = svg.getBoundingClientRect();
    return { x:(cx-rect.left)/rect.width*1200, y:(cy-rect.top)/rect.height*800 };
  }

  function circColor(el: ElectricalElement): string {
    if (!el.circuitId) return "#94a3b8";
    return circuits.find(c=>c.id===el.circuitId)?.color ?? "#94a3b8";
  }

  const pendingFromEl = pendingWireFrom ? elements.find(e=>e.id===pendingWireFrom) : null;
  const pfx = dragPos?.id===pendingWireFrom ? dragPos.x : pendingFromEl?.x ?? 0;
  const pfy = dragPos?.id===pendingWireFrom ? dragPos.y : pendingFromEl?.y ?? 0;

  const crossRoomWires = wires.filter(w => {
    const fe = elements.find(e=>e.id===w.fromElementId);
    const te = elements.find(e=>e.id===w.toElementId);
    if (!fe || !te) return false;
    return (fe.roomId===room.id || te.roomId===room.id) && fe.roomId !== te.roomId;
  });

  return (
    <svg
      ref={svgRef}
      viewBox="0 0 1200 800"
      preserveAspectRatio="xMidYMid meet"
      style={{ width:"100%", height:"100%", background:`linear-gradient(135deg, ${s.f}18 0%, #dce8f5 100%)`, userSelect:"none", cursor:pendingWireFrom?"crosshair":"default" }}
      onMouseMove={e => {
        const p = svgXY(e.clientX, e.clientY);
        setMouse(p);
        if (dragRef.current) setDragPos({ id:dragRef.current.id, x:snap(p.x-dragRef.current.offX), y:snap(p.y-dragRef.current.offY) });
      }}
      onMouseUp={() => {
        if (dragRef.current && dragPos) onElementMove(dragPos.id, dragPos.x, dragPos.y);
        dragRef.current = null;
        setDragPos(null);
      }}
      onMouseLeave={() => { dragRef.current=null; setDragPos(null); }}
      onClick={e => {
        if (dragPos) return;
        const tag = (e.target as SVGElement).tagName;
        if (["svg","rect","polygon","line"].includes(tag)) onCanvasClick();
      }}
      onDragOver={e => e.preventDefault()}
      onDrop={e => {
        e.preventDefault();
        const type = e.dataTransfer.getData("elemType") as ElementType;
        if (!type) return;
        const p = svgXY(e.clientX, e.clientY);
        onDrop(type, snap(p.x), snap(p.y));
      }}
    >
      <defs>
        <pattern id="bpG2" width="24" height="24" patternUnits="userSpaceOnUse">
          <path d="M 24 0 L 0 0 0 24" fill="none" stroke="#a8bcd4" strokeWidth="0.35" opacity="0.5"/>
        </pattern>
        <radialGradient id="lightPool" cx="50%" cy="50%">
          <stop offset="0%" stopColor="#fff8c0" stopOpacity="1"/>
          <stop offset="60%" stopColor="#ffd050" stopOpacity="0.55"/>
          <stop offset="100%" stopColor="#ffb020" stopOpacity="0"/>
        </radialGradient>
        <filter id="lglow" x="-60%" y="-60%" width="220%" height="220%">
          <feGaussianBlur stdDeviation="12" result="b"/>
          <feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge>
        </filter>
        <filter id="elSh">
          <feDropShadow dx="2" dy="4" stdDeviation="4" floodColor="#6a5030" floodOpacity="0.28"/>
        </filter>
        <filter id="selGlow">
          <feGaussianBlur stdDeviation="5" result="b"/>
          <feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge>
        </filter>
        <marker id="wArrow" markerWidth="8" markerHeight="6" refX="8" refY="3" orient="auto">
          <polygon points="0 0, 8 3, 0 6" fill="#f59e0b"/>
        </marker>
      </defs>

      <rect width="1200" height="800" fill="url(#bpG2)"/>

      <polygon points={pts([fTL,fTR,fBR,fBL])} fill={s.f} stroke={s.f2} strokeWidth="1.2"/>
      {planks}
      <polygon points={pts([fTL,fBL,cBL,cTL])} fill={s.w} stroke={s.wd} strokeWidth="1"/>
      <polygon points={pts([fTL,fTR,cTR,cTL])} fill={s.ws} stroke={s.wd} strokeWidth="1"/>
      <line x1={cTL.sx} y1={cTL.sy} x2={cTR.sx} y2={cTR.sy} stroke={s.wd} strokeWidth="2.5"/>
      <line x1={cTL.sx} y1={cTL.sy} x2={cBL.sx} y2={cBL.sy} stroke={s.wd} strokeWidth="2.5"/>
      <line x1={fTL.sx} y1={fTL.sy} x2={fBL.sx} y2={fBL.sy} stroke={s.wd} strokeWidth="2"/>
      <line x1={fTL.sx} y1={fTL.sy} x2={fTR.sx} y2={fTR.sy} stroke={s.wd} strokeWidth="2"/>

      <text x="600" y="38" textAnchor="middle" fontSize="12" fill={s.lbl} fontFamily="'Georgia', serif" letterSpacing="0.2em" opacity="0.55">
        {room.name.toUpperCase()}
      </text>
      <text x="600" y="56" textAnchor="middle" fontSize="8" fill={s.lbl} fontFamily="monospace" opacity="0.4">
        Arrastra · Doble clic = cable · ESC = cancelar · Clic en switch/breaker = toggle
      </text>

      {wires.map(w => {
        const fe = elements.find(e=>e.id===w.fromElementId);
        const te = elements.find(e=>e.id===w.toElementId);
        if (!fe || !te) return null;
        if (fe.roomId!==room.id && te.roomId!==room.id) return null;
        if (fe.roomId !== te.roomId) return null;

        const circ = w.circuitId ? circuits.find(c=>c.id===w.circuitId) : null;
        const color = circ ? circ.color : w.isGroundWire ? "#22c55e" : "#6b7280";
        const active = activeWires.has(w.id);
        const fx = dragPos?.id===fe.id ? dragPos.x : fe.x;
        const fy = dragPos?.id===fe.id ? dragPos.y : fe.y;
        const tx = dragPos?.id===te.id ? dragPos.x : te.x;
        const ty = dragPos?.id===te.id ? dragPos.y : te.y;
        const d = wirePath(fx, fy, tx, ty);
        const electrons = [0, 0.4, 0.7];

        return (
          <g key={w.id}>
            {active && <path d={d} fill="none" stroke={color} strokeWidth="12" opacity="0.1" strokeLinecap="round"/>}
            <path d={d} fill="none" stroke={active?color:"#334155"} strokeWidth={active?4:3} strokeLinecap="round" opacity="0.95"/>
            {active && <path d={d} fill="none" stroke="rgba(255,255,255,0.25)" strokeWidth="1.5" strokeLinecap="round"/>}
            {active && electrons.map((off, i) => (
              <circle key={i} r="6" fill={color} opacity="0.95">
                <animateMotion dur="1.2s" begin={`${off*1.2}s`} repeatCount="indefinite" path={d}/>
              </circle>
            ))}
          </g>
        );
      })}

      {crossRoomWires.map(w => {
        const fe = elements.find(e=>e.id===w.fromElementId);
        const te = elements.find(e=>e.id===w.toElementId);
        if (!fe || !te) return null;

        const localEl = fe.roomId===room.id ? fe : te;
        const remoteEl = fe.roomId===room.id ? te : fe;
        const remoteRoom = rooms.find(r=>r.id===remoteEl.roomId);
        const lx = dragPos?.id===localEl.id ? dragPos.x : localEl.x;
        const ly = dragPos?.id===localEl.id ? dragPos.y : localEl.y;
        const circ = w.circuitId ? circuits.find(c=>c.id===w.circuitId) : null;
        const color = circ ? circ.color : w.isGroundWire ? "#22c55e" : "#6b7280";
        const active = activeWires.has(w.id);
        const edgeX = lx<600 ? 80 : 1120;
        const d = wirePath(lx, ly, edgeX, ly);

        return (
          <g key={w.id}>
            {active && <path d={d} fill="none" stroke={color} strokeWidth="10" opacity="0.12" strokeLinecap="round"/>}
            <path d={d} fill="none" stroke={active?color:"#334155"} strokeWidth={active?4:3} strokeDasharray="12 7" strokeLinecap="round" opacity="0.85"/>
            {active && [0, 0.5].map((off, i) => (
              <circle key={i} r="5" fill={color} opacity="0.9">
                <animateMotion dur="1s" begin={`${off}s`} repeatCount="indefinite" path={d}/>
              </circle>
            ))}
            <rect x={lx<600?42:1070} y={ly-14} width={60} height={28} rx={5} fill={active?color:"#334155"} opacity="0.9"/>
            <text x={lx<600?72:1100} y={ly+1} textAnchor="middle" dominantBaseline="central" fontSize="9" fill="white" fontFamily="monospace" style={{ pointerEvents:"none" }}>
              {ELEMENT_ICONS[remoteEl.type]} {remoteRoom?.name??"?"}
            </text>
          </g>
        );
      })}

      {pendingWireFrom && pendingFromEl && (
        <>
          <path d={wirePath(pfx, pfy, mouse.x, mouse.y)} fill="none" stroke="#f59e0b" strokeWidth="2.5" strokeDasharray="12 6" opacity="0.9" markerEnd="url(#wArrow)"/>
          <circle cx={pfx} cy={pfy} r="7" fill="#f59e0b" opacity="0.25">
            <animate attributeName="r" values="5;15;5" dur="0.9s" repeatCount="indefinite"/>
          </circle>
          <g onClick={e => { e.stopPropagation(); onCrossRoomWire(); }} style={{ cursor:"pointer" }}>
            <rect x="480" y="740" width="240" height="34" rx="8" fill="rgba(74,158,255,0.12)" stroke="#4a9eff" strokeWidth="1.5"/>
            <text x="600" y="758" textAnchor="middle" dominantBaseline="central" fontSize="11" fill="#4a9eff" fontFamily="monospace" style={{ pointerEvents:"none" }}>
              ⌁ Conectar a otra habitación
            </text>
          </g>
        </>
      )}

      {roomEls.map(el => {
        const powered = isPowered(el, elements, wires, circuits);
        const isSel = selectedElId === el.id;
        const isPSrc = pendingWireFrom === el.id;
        const isTgt = !!pendingWireFrom && pendingWireFrom !== el.id;
        const color = circColor(el);
        const ex = dragPos?.id===el.id ? dragPos.x : el.x;
        const ey = dragPos?.id===el.id ? dragPos.y : el.y;
        const isDrag = dragPos?.id===el.id;
        const R = 30;

        return (
          <g
            key={el.id}
            transform={`translate(${ex},${ey})`}
            style={{ cursor: pendingWireFrom?"crosshair":isDrag?"grabbing":"grab" }}
            filter={isSel||isPSrc||isDrag ? "url(#elSh)" : undefined}
            onMouseDown={e => {
              e.stopPropagation();
              if (pendingWireFrom) return;
              const p = svgXY(e.clientX, e.clientY);
              dragRef.current = { id:el.id, offX:p.x-el.x, offY:p.y-el.y };
            }}
            onClick={e => {
              e.stopPropagation();
              if (isDrag) return;
              if (pendingWireFrom && pendingWireFrom!==el.id) onWireConnect(el.id);
              else onElementClick(el.id, false);
            }}
            onDoubleClick={e => { e.stopPropagation(); onElementClick(el.id, true); }}
          >
            {powered && el.type==="light" && (
              <>
                <ellipse cx={0} cy={15} rx={110} ry={65} fill="url(#lightPool)" opacity="0.7" filter="url(#lglow)"/>
                <ellipse cx={0} cy={10} rx={65} ry={40} fill="rgba(255,235,100,0.55)"/>
                <ellipse cx={0} cy={6} rx={32} ry={20} fill="rgba(255,255,200,0.85)"/>
              </>
            )}

            {powered && <circle r={R+14} fill="none" stroke={color} strokeWidth="2" opacity="0.3" filter="url(#selGlow)"/>}
            <ellipse cx={0} cy={isDrag?18:8} rx={R+6} ry={(R+6)*0.4} fill="rgba(0,0,0,0.22)"/>

            {isTgt && <circle r={R+16} fill="rgba(245,158,11,0.07)" stroke="#f59e0b" strokeWidth="2" strokeDasharray="5 3"/>}
            {isSel && !isPSrc && <circle r={R+10} fill="none" stroke="#f59e0b" strokeWidth="2.5"/>}
            {isPSrc && <circle r={R+11} fill="rgba(245,158,11,0.12)" stroke="#f59e0b" strokeWidth="2.5"/>}

            {wires.some(w => {
              if (w.fromElementId!==el.id && w.toElementId!==el.id) return false;
              const fe = elements.find(e=>e.id===w.fromElementId);
              const te = elements.find(e=>e.id===w.toElementId);
              return !!(fe&&te&&fe.roomId!==te.roomId);
            }) && (
              <g transform={`translate(${-R*0.72}, ${-R*1.1})`}>
                <circle r="8" fill="#4a9eff" stroke="white" strokeWidth="1.5"/>
                <text textAnchor="middle" dominantBaseline="central" fontSize="10" fill="white" style={{ pointerEvents:"none" }}>⌁</text>
              </g>
            )}

            <circle r={R} fill={powered&&el.type==="light"?"#fffce8":"white"} stroke={isPSrc?"#f59e0b":isSel?"#f59e0b":color} strokeWidth={isSel||isPSrc?3.5:2.5}/>

            <foreignObject x={-R} y={-R} width={R*2} height={R*2} style={{ pointerEvents:"none", overflow:"visible" }}>
              <div style={{ width:R*2, height:R*2, display:"flex", alignItems:"center", justifyContent:"center" }}>
                <SymbolRenderer el={el} powered={powered} size={R * 1.7} />
              </div>
            </foreignObject>

            <text y={R+16} textAnchor="middle" fontSize="10" fill={isSel?"#6a4a10":"#706050"} fontFamily="monospace" style={{ pointerEvents:"none", userSelect:"none" }}>
              {el.label}
            </text>

            {powered && (
              <g transform={`translate(${R*0.72}, ${-R*0.72})`}>
                <circle r="10" fill="#22c55e" stroke="white" strokeWidth="2"/>
                <text textAnchor="middle" dominantBaseline="central" fontSize="11" fill="white" style={{ pointerEvents:"none" }}>✓</text>
              </g>
            )}

            {el.isGrounded && (
              <g transform={`translate(${-R*0.72}, ${-R*0.72})`}>
                <circle r="10" fill="#16a34a" stroke="white" strokeWidth="1.5"/>
                <text textAnchor="middle" dominantBaseline="central" fontSize="11" fill="white" style={{ pointerEvents:"none" }}>⏚</text>
              </g>
            )}

            {el.circuitId && <circle cx={R*0.72} cy={R*0.72} r="6" fill={color} stroke="white" strokeWidth="1.2"/>}
          </g>
        );
      })}

      {roomEls.length === 0 && (
        <>
          <text x="600" y="450" textAnchor="middle" fontSize="15" fill={s.lbl} opacity="0.4" fontFamily="'Georgia', serif">
            Arrastra componentes eléctricos al piso
          </text>
          <text x="600" y="475" textAnchor="middle" fontSize="9" fill={s.lbl} opacity="0.3" fontFamily="monospace">
            Doble clic en elemento → iniciar cable · Dbl-clic en switch → toggle
          </text>
        </>
      )}
    </svg>
  );
}

// ─── Main ─────────────────────────────────────────────────────────────────────
export default function HouseSimulator() {
  const [state, setState] = useState<AppState>(INITIAL);
  const [pwf, setPWF] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<"elements" | "circuits" | "panel">("elements");
  const [ncn, setNcn] = useState<string>("");
  const [nct, setNct] = useState<CircuitType>("lighting");
  const [showRoomMgr, setShowRoomMgr] = useState(false);
  const [showCrossRoom, setShowCrossRoom] = useState(false);

  const errors = useMemo(() => validateInstallation(state), [state]);
  const score  = useMemo(() => getScore(errors), [errors]);
  const room   = state.selectedRoomId ? state.rooms.find(r=>r.id===state.selectedRoomId) ?? null : null;
  const selEl  = state.elements.find(e=>e.id===state.selectedElementId) ?? null;
  const panelEls = state.elements.filter(e=>e.type==="panel_breaker"||e.type==="panel_differential");
  const activeWiresSet = useMemo(() => getActiveWires(state.elements, state.wires, state.circuits), [state]);

  const go = useCallback((id: string) => {
    setState(s => ({ ...s, selectedRoomId:id, viewTarget:"interior", selectedElementId:null }));
    setPWF(null);
  }, []);

  const back = useCallback(() => {
    setState(s => ({ ...s, selectedRoomId:null, viewTarget:"exterior", selectedElementId:null }));
    setPWF(null);
  }, []);

  const drop = useCallback((type: ElementType, x: number, y: number, roomId: string | null) => {
    setState(s => ({
      ...s,
      elements: [
        ...s.elements,
        {
          id:uid(),
          type,
          roomId,
          x,
          y,
          circuitId:null,
          label:ELEMENT_LABELS[type],
          isOn:false,
          isGrounded:false,
          rating:type==="panel_breaker"?20:type==="panel_differential"?30:undefined,
        },
      ],
    }));
  }, []);

  const move = useCallback((id: string, x: number, y: number) => {
    setState(s => ({ ...s, elements: s.elements.map(e => e.id===id ? { ...e, x, y } : e) }));
  }, []);

  const elClick = useCallback((id: string, wire: boolean) => {
    if (wire) {
      setPWF(p => p===id ? null : id);
      setState(s => ({ ...s, selectedElementId:id }));
    } else if (!pwf) {
      setState(s => ({ ...s, selectedElementId: s.selectedElementId===id ? null : id }));
    }
  }, [pwf]);

  const toggle = useCallback((id: string) => {
    setState(s => ({ ...s, elements: s.elements.map(e => e.id===id ? { ...e, isOn:!e.isOn } : e) }));
  }, []);

  const connect = useCallback((toId: string) => {
    if (!pwf || pwf===toId) {
      setPWF(null);
      return;
    }

    const fe=state.elements.find(e=>e.id===pwf);
    const te=state.elements.find(e=>e.id===toId);
    if (!fe || !te) {
      setPWF(null);
      return;
    }

    const cid=fe.circuitId??te.circuitId??"";
    const gnd=fe.type==="ground_rod"||te.type==="ground_rod";

    setState(s => ({
      ...s,
      wires:[...s.wires, { id:uid(), fromElementId:pwf, toElementId:toId, circuitId:cid, isGroundWire:gnd, path:[] }],
      elements:gnd ? s.elements.map(e=>(e.id===toId||e.id===pwf)?{...e,isGrounded:true}:e) : s.elements,
    }));

    setPWF(null);
  }, [pwf, state.elements]);

  const handleCrossRoomConnect = useCallback((toId: string) => {
    if (!pwf || pwf===toId) {
      setShowCrossRoom(false);
      return;
    }

    const fe=state.elements.find(e=>e.id===pwf);
    const te=state.elements.find(e=>e.id===toId);
    if (!fe || !te) {
      setPWF(null);
      setShowCrossRoom(false);
      return;
    }

    const cid=fe.circuitId??te.circuitId??"";
    const gnd=fe.type==="ground_rod"||te.type==="ground_rod";

    setState(s => ({
      ...s,
      wires:[...s.wires, { id:uid(), fromElementId:pwf, toElementId:toId, circuitId:cid, isGroundWire:gnd, path:[] }],
      elements:gnd ? s.elements.map(e=>(e.id===toId||e.id===pwf)?{...e,isGrounded:true}:e) : s.elements,
    }));

    setPWF(null);
    setShowCrossRoom(false);
  }, [pwf, state.elements]);

  const delEl = useCallback((id: string) => {
    setState(s => ({
      ...s,
      elements:s.elements.filter(e=>e.id!==id),
      wires:s.wires.filter(w=>w.fromElementId!==id&&w.toElementId!==id),
      selectedElementId:s.selectedElementId===id?null:s.selectedElementId,
    }));
    if (pwf===id) setPWF(null);
  }, [pwf]);

  const delWire = useCallback((id: string) => {
    setState(s => ({ ...s, wires:s.wires.filter(w=>w.id!==id) }));
  }, []);

  const mkCircuit = useCallback(() => {
    if (!ncn.trim()) return;
    setState(s => ({
      ...s,
      circuits:[...s.circuits, { id:uid(), name:ncn.trim(), type:nct, color:CIRCUIT_COLORS[nct], breakerId:null, elementIds:[], isProtected:false, hasGround:false }],
    }));
    setNcn("");
  }, [ncn, nct]);

  const assignCircuit = useCallback((eid: string, cid: string) => {
    setState(s => ({
      ...s,
      elements:s.elements.map(e=>e.id===eid?{...e,circuitId:cid}:e),
      circuits:s.circuits.map(c=>c.id===cid?{...c,elementIds:c.elementIds.includes(eid)?c.elementIds:[...c.elementIds,eid]}:c),
      wires:s.wires.map(w=>(w.fromElementId===eid||w.toElementId===eid)&&!w.circuitId?{...w,circuitId:cid}:w),
    }));
  }, []);

  const delCircuit = useCallback((id: string) => {
    setState(s => ({
      ...s,
      circuits:s.circuits.filter(c=>c.id!==id),
      elements:s.elements.map(e=>e.circuitId===id?{...e,circuitId:null}:e),
      wires:s.wires.map(w=>w.circuitId===id?{...w,circuitId:""}:w),
    }));
  }, []);

  const assignBreaker = useCallback((cid: string, bid: string) => {
    setState(s => ({ ...s, circuits:s.circuits.map(c=>c.id===cid?{...c,breakerId:bid,isProtected:true}:c) }));
  }, []);

  const toggleGnd = useCallback((id: string) => {
    setState(s => ({ ...s, elements:s.elements.map(e=>e.id===id?{...e,isGrounded:!e.isGrounded}:e) }));
  }, []);

  const saveRooms = useCallback((newRooms: Room[]) => {
    const valid = new Set(newRooms.map(r=>r.id));
    setState(s => ({
      ...s,
      rooms:newRooms,
      elements:s.elements.filter(e=>!e.roomId||valid.has(e.roomId)),
      wires:s.wires.filter(w => {
        const fe=s.elements.find(e=>e.id===w.fromElementId);
        const te=s.elements.find(e=>e.id===w.toElementId);
        return (!fe?.roomId||valid.has(fe.roomId))&&(!te?.roomId||valid.has(te.roomId));
      }),
      selectedRoomId:s.selectedRoomId&&!valid.has(s.selectedRoomId)?null:s.selectedRoomId,
      viewTarget:s.selectedRoomId&&!valid.has(s.selectedRoomId)?"exterior":s.viewTarget,
    }));
    setShowRoomMgr(false);
  }, []);

  useEffect(() => {
    const h = (e: KeyboardEvent) => {
      if (e.key==="Escape") {
        setPWF(null);
        setShowCrossRoom(false);
        setState(s=>({...s,selectedElementId:null}));
      }
    };
    window.addEventListener("keydown", h);
    return () => window.removeEventListener("keydown", h);
  }, []);

  const U = { bg:"#080e1a", side:"#060c18", bdr:"#1a2840", txt:"#94a3b8", dim:"#3a5070", acc:"#4a9eff", accBg:"rgba(74,158,255,0.08)" };
  const fromEl = pwf ? state.elements.find(e=>e.id===pwf) : null;
  const scoreColor = score>=80?"#22c55e":score>=60?"#f59e0b":"#ef4444";

  return (
    <div style={{ display:"flex", height:"100vh", background:U.bg, fontFamily:"'Georgia', serif", overflow:"hidden" }}>
      {showRoomMgr && <RoomManager rooms={state.rooms} onClose={() => setShowRoomMgr(false)} onSave={saveRooms}/>}
      {showCrossRoom && fromEl && (
        <CrossRoomSelector
          fromEl={fromEl}
          elements={state.elements}
          rooms={state.rooms}
          circuits={state.circuits}
          onConnect={handleCrossRoomConnect}
          onCancel={() => { setShowCrossRoom(false); setPWF(null); }}
        />
      )}

      {/* ── Left Palette ── */}
      <aside style={{ width:206, background:U.side, borderRight:`1px solid ${U.bdr}`, display:"flex", flexDirection:"column", overflowY:"auto", flexShrink:0 }}>
        <div style={{ padding:"14px 13px 9px", borderBottom:`1px solid ${U.bdr}` }}>
          <div style={{ fontSize:9, color:U.acc, letterSpacing:"0.18em", fontFamily:"monospace", fontWeight:"bold" }}>⚡ SIMULADOR ELÉCTRICO</div>
          <div style={{ fontSize:7, color:U.dim, marginTop:3, fontFamily:"monospace" }}>Residencial · NEC / RETIE</div>
        </div>

        <div style={{ padding:"8px 10px", borderBottom:`1px solid ${U.bdr}` }}>
          <button
            onClick={() => setShowRoomMgr(true)}
            style={{ width:"100%", background:U.accBg, border:`1px solid ${U.acc}`, borderRadius:7, color:U.acc, fontSize:9, padding:"7px", cursor:"pointer", fontFamily:"monospace", display:"flex", alignItems:"center", justifyContent:"center", gap:6 }}
          >
            🏠 Gestionar Habitaciones
            <span style={{ background:`${U.acc}22`, borderRadius:10, padding:"1px 6px", fontSize:8 }}>{state.rooms.length}</span>
          </button>
        </div>

        <div style={{ display:"flex", borderBottom:`1px solid ${U.bdr}` }}>
          {(["elements","circuits","panel"] as const).map(t => (
            <button
              key={t}
              onClick={() => setActiveTab(t)}
              style={{ flex:1, padding:"8px 0", background:activeTab===t?U.accBg:"transparent", border:"none", borderBottom:activeTab===t?`2px solid ${U.acc}`:"2px solid transparent", color:activeTab===t?U.acc:U.dim, fontSize:8, cursor:"pointer", fontFamily:"monospace" }}
            >
              {t==="elements"?"ELEM":t==="circuits"?"CIRC":"PANEL"}
            </button>
          ))}
        </div>

        {activeTab === "elements" && PALETTE_GROUPS.map(g => (
          <div key={g.cat}>
            <div style={{ padding:"7px 13px 3px", fontSize:7, color:U.dim, textTransform:"uppercase", letterSpacing:"0.12em", fontFamily:"monospace" }}>{g.cat}</div>
            {g.items.map(t => (
              <div
                key={t}
                draggable
                onDragStart={e => e.dataTransfer.setData("elemType", t)}
                style={{ display:"flex", alignItems:"center", gap:9, padding:"6px 13px", cursor:"grab", borderRadius:7, margin:"2px 6px", transition:"all 0.15s", userSelect:"none", border:"1px solid transparent" }}
                onMouseEnter={e => { e.currentTarget.style.background=U.accBg; e.currentTarget.style.borderColor="#e0c890"; }}
                onMouseLeave={e => { e.currentTarget.style.background="transparent"; e.currentTarget.style.borderColor="transparent"; }}
              >
                <div style={{ width:36, height:36, display:"flex", alignItems:"center", justifyContent:"center", background:"rgba(255,255,255,0.04)", borderRadius:5, flexShrink:0, overflow:"hidden" }}>
                  <SymbolRenderer
                    el={{
                      id: "",
                      type: t,
                      roomId: null,
                      x: 0,
                      y: 0,
                      circuitId: null,
                      label: "",
                      isOn: false,
                      isGrounded: false,
                      rating: t === "panel_breaker" || t === "panel_differential" ? 20 : undefined,
                    }}
                    powered={false}
                    size={36}
                  />
                </div>
                <span style={{ fontSize:10, color:U.txt }}>{ELEMENT_LABELS[t]}</span>
              </div>
            ))}
          </div>
        ))}

        {activeTab === "circuits" && (
          <div style={{ padding:12 }}>
            <div style={{ fontSize:8, color:U.dim, marginBottom:7, fontFamily:"monospace" }}>NUEVO CIRCUITO</div>
            <input
              value={ncn}
              onChange={e => setNcn(e.target.value)}
              onKeyDown={e => e.key==="Enter"&&mkCircuit()}
              placeholder="Ej: Luces Sala"
              style={{ width:"100%", background:"#ffffff", border:`1px solid ${U.bdr}`, borderRadius:5, color:"#1a2840", fontSize:9, padding:"5px 8px", outline:"none", boxSizing:"border-box", fontFamily:"monospace", marginBottom:6 }}
            />
            <select
              value={nct}
              onChange={e => setNct(e.target.value as CircuitType)}
              style={{ width:"100%", background:"#ffffff", border:`1px solid ${U.bdr}`, borderRadius:5, color:"#1a2840", fontSize:9, padding:"4px 6px", outline:"none", boxSizing:"border-box", fontFamily:"monospace", marginBottom:8 }}
            >
              <option value="lighting">Iluminación</option>
              <option value="outlet">Tomacorrientes</option>
              <option value="ground">Tierra</option>
            </select>
            <button onClick={mkCircuit} style={{ width:"100%", background:U.accBg, border:`1px solid ${U.acc}`, borderRadius:5, color:U.acc, fontSize:9, padding:"6px", cursor:"pointer", fontFamily:"monospace" }}>
              + Crear Circuito
            </button>

            <div style={{ marginTop:13, fontSize:8, color:U.dim, marginBottom:5, fontFamily:"monospace" }}>ACTIVOS</div>
            {state.circuits.length===0 && <div style={{ fontSize:8, color:"#94a3b8", textAlign:"center", padding:"8px 0" }}>Ninguno</div>}

            {state.circuits.map(c => (
              <div key={c.id} style={{ background:"rgba(255,255,255,0.03)", border:`1px solid ${c.color}44`, borderRadius:6, padding:"7px 10px", marginBottom:5, borderLeft:`3px solid ${c.color}` }}>
                <div style={{ display:"flex", alignItems:"center", gap:5, marginBottom:2 }}>
                  <div style={{ width:7, height:7, borderRadius:"50%", background:c.color }}/>
                  <span style={{ fontSize:9, color:U.txt }}>{c.name}</span>
                </div>
                <div style={{ fontSize:7, color:U.dim, fontFamily:"monospace" }}>{c.type} · {c.elementIds.length} elem · {c.breakerId?"✓ prot.":"sin prot."}</div>
                <button onClick={() => delCircuit(c.id)} style={{ marginTop:3, fontSize:7, color:"#ef4444", background:"none", border:"none", cursor:"pointer", padding:0, fontFamily:"monospace" }}>
                  × eliminar
                </button>
              </div>
            ))}
          </div>
        )}

        {activeTab === "panel" && (
          <div style={{ padding:12 }}>
            <div style={{ fontSize:8, color:U.dim, marginBottom:10, fontFamily:"monospace" }}>CIRCUITO → INTERRUPTOR</div>
            {state.circuits.length===0 && <div style={{ color:"#94a3b8", textAlign:"center", padding:"16px 0", fontSize:8, fontFamily:"monospace" }}>Crea circuitos primero</div>}
            {state.circuits.map(c => (
              <div key={c.id} style={{ background:"rgba(255,255,255,0.03)", border:`1px solid ${U.bdr}`, borderRadius:6, padding:"8px", marginBottom:6 }}>
                <div style={{ fontSize:9, color:U.txt, marginBottom:4, display:"flex", alignItems:"center", gap:5 }}>
                  <div style={{ width:8, height:8, borderRadius:"50%", background:c.color }}/>
                  {c.name}
                </div>
                <select
                  value={c.breakerId??""}
                  onChange={e => assignBreaker(c.id, e.target.value)}
                  style={{ width:"100%", background:"rgba(255,255,255,0.05)", border:`1px solid ${U.bdr}`, borderRadius:5, color:U.txt, fontSize:8, padding:"3px 5px", fontFamily:"monospace" }}
                >
                  <option value="">Sin interruptor</option>
                  {panelEls.filter(e=>e.type==="panel_breaker").map(br => (
                    <option key={br.id} value={br.id}>{br.label} ({br.rating}A)</option>
                  ))}
                </select>
                {c.breakerId && <div style={{ marginTop:4, fontSize:7, color:"#22c55e", fontFamily:"monospace" }}>✓ Protegido · Electrones activos</div>}
              </div>
            ))}
          </div>
        )}

        <div style={{ padding:"10px 13px", borderTop:`1px solid ${U.bdr}` }}>
          <div style={{ fontSize:7, color:U.dim, fontFamily:"monospace", marginBottom:5 }}>PUNTUACIÓN INSTALACIÓN</div>
          <div style={{ display:"flex", alignItems:"center", gap:8 }}>
            <div style={{ flex:1, height:6, background:"#0a1428", borderRadius:3, overflow:"hidden" }}>
              <div style={{ width:`${score}%`, height:"100%", background:scoreColor, borderRadius:3, transition:"width 0.4s" }}/>
            </div>
            <span style={{ fontSize:11, fontWeight:"bold", color:scoreColor, fontFamily:"monospace", minWidth:30, textAlign:"right" }}>{score}</span>
          </div>
          {errors.length > 0 && (
            <div style={{ marginTop:6, fontSize:7, color:U.dim, fontFamily:"monospace" }}>
              {errors.filter(e=>e.severity==="error").length} errores · {errors.filter(e=>e.severity==="warning").length} advertencias
            </div>
          )}
        </div>

        <div style={{ padding:"8px 13px", borderTop:`1px solid ${U.bdr}` }}>
          <button
            onClick={() => { setState(INITIAL); setPWF(null); }}
            style={{ width:"100%", background:"transparent", border:`1px solid ${U.bdr}`, color:U.dim, fontSize:8, fontFamily:"monospace", padding:"6px", borderRadius:6, cursor:"pointer" }}
            onMouseEnter={e => { e.currentTarget.style.borderColor="#ef4444"; e.currentTarget.style.color="#ef4444"; }}
            onMouseLeave={e => { e.currentTarget.style.borderColor=U.bdr; e.currentTarget.style.color=U.dim; }}
          >
            LIMPIAR TODO
          </button>
        </div>
      </aside>

      {/* ── Main Canvas ── */}
      <div style={{ flex:1, position:"relative", overflow:"hidden" }}>
        <div style={{ position:"absolute", top:0, left:0, right:0, height:47, background:"rgba(248,244,237,0.97)", backdropFilter:"blur(8px)", borderBottom:`1px solid #d4c8b0`, display:"flex", alignItems:"center", padding:"0 16px", gap:12, zIndex:60 }}>
          {state.viewTarget==="interior" && (
            <button onClick={back} style={{ background:"rgba(74,158,255,0.08)", border:"1px solid #4a9eff", color:"#4a9eff", fontSize:10, padding:"4px 16px", borderRadius:7, cursor:"pointer", fontFamily:"monospace" }}>
              ← Vista General
            </button>
          )}

          <div style={{ fontSize:11, color:U.dim, fontFamily:"monospace" }}>
            {state.viewTarget==="interior"&&room
              ? `📐 ${room.name.toUpperCase()} — Instalación eléctrica`
              : "📐 PLANTA — Clic en habitación para instalar"}
          </div>

          {state.circuits.filter(c=>c.breakerId).length > 0 && (
            <div style={{ marginLeft:"auto", display:"flex", alignItems:"center", gap:6, background:"rgba(34,197,94,0.1)", border:"1px solid rgba(34,197,94,0.4)", padding:"3px 10px", borderRadius:12 }}>
              <span style={{ width:6, height:6, borderRadius:"50%", background:"#22c55e", display:"inline-block" }}/>
              <span style={{ fontSize:8, color:"#22c55e", fontFamily:"monospace" }}>
                {state.circuits.filter(c=>c.breakerId).length} circuitos energizados
              </span>
            </div>
          )}

          {pwf && (
            <div style={{ marginLeft:"auto", background:"rgba(245,158,11,0.1)", border:"1px solid #f59e0b", color:"#f59e0b", fontSize:9, padding:"3px 14px", borderRadius:12, fontFamily:"monospace" }}>
              ⌁ Clic en destino · ESC cancela
            </div>
          )}
        </div>

        <div style={{ position:"absolute", inset:0, top:47 }}>
          {state.viewTarget==="exterior" ? (
            <HouseView
              rooms={state.rooms}
              onRoomClick={go}
              allElements={state.elements}
              allWires={state.wires}
              circuits={state.circuits}
              panelEls={panelEls}
              selectedElId={state.selectedElementId}
              onElementClick={id => setState(s=>({...s,selectedElementId:s.selectedElementId===id?null:id}))}
              onPanelDrop={t => drop(t,0,0,null)}
            />
          ) : room ? (
            <RoomView
              room={room}
              elements={state.elements}
              wires={state.wires}
              circuits={state.circuits}
              rooms={state.rooms}
              onDrop={(t,x,y) => drop(t,x,y,room.id)}
              onElementClick={elClick}
              onElementMove={move}
              onWireConnect={connect}
              selectedElId={state.selectedElementId}
              pendingWireFrom={pwf}
              onCanvasClick={() => { if(pwf) setPWF(null); else setState(s=>({...s,selectedElementId:null})); }}
              onCrossRoomWire={() => setShowCrossRoom(true)}
              onToggle={toggle}
            />
          ) : null}
        </div>
      </div>

      {/* ── Right Properties ── */}
      <aside style={{ width:212, background:U.side, borderLeft:`1px solid ${U.bdr}`, display:"flex", flexDirection:"column", overflowY:"auto", flexShrink:0 }}>
        <div style={{ padding:"12px 13px", borderBottom:`1px solid ${U.bdr}` }}>
          <div style={{ fontSize:8, color:U.dim, letterSpacing:"0.15em", fontFamily:"monospace" }}>PROPIEDADES</div>
        </div>

        {selEl ? (
          <div style={{ padding:"12px 13px" }}>
            <div style={{ display:"flex", justifyContent:"center", marginBottom:10, background:"rgba(255,255,255,0.03)", border:`1px solid ${U.bdr}`, borderRadius:8, padding:10 }}>
              <div style={{ transform:"scale(1.1)", transformOrigin:"center" }}>
                <SymbolRenderer el={selEl} powered={isPowered(selEl, state.elements, state.wires, state.circuits)} size={56} />
              </div>
            </div>

            <div style={{ fontSize:9, color:U.acc, background:U.accBg, padding:"3px 8px", borderRadius:5, display:"inline-flex", alignItems:"center", gap:5, marginBottom:10, fontFamily:"monospace", border:`1px solid ${U.acc}44` }}>
              {selEl.type.toUpperCase()}
            </div>

            {["light","fan","ac","smoke_detector"].includes(selEl.type) && (() => {
              const on = isPowered(selEl, state.elements, state.wires, state.circuits);
              return (
                <div style={{ marginBottom:10, padding:"6px 10px", background:on?"rgba(34,197,94,0.1)":"rgba(239,68,68,0.07)", border:`1px solid ${on?"#22c55e":"#ef4444"}`, borderRadius:6 }}>
                  <div style={{ fontSize:9, color:on?"#22c55e":"#ef4444", fontFamily:"monospace", fontWeight:"bold" }}>{on?"✓ ALIMENTADO":"✗ Sin alimentación"}</div>
                  <div style={{ fontSize:7, color:U.dim, fontFamily:"monospace", marginTop:2 }}>{on?"Electrones fluyendo":"Necesita: circuito + interruptor + cable"}</div>
                </div>
              );
            })()}

            <div style={{ marginBottom:9 }}>
              <div style={{ fontSize:8, color:U.dim, marginBottom:3, fontFamily:"monospace" }}>Etiqueta</div>
              <input
                value={selEl.label}
                onChange={e => setState(s=>({...s,elements:s.elements.map(el=>el.id===selEl.id?{...el,label:e.target.value}:el)}))}
                style={{ width:"100%", background:"rgba(255,255,255,0.06)", border:`1px solid ${U.bdr}`, borderRadius:5, color:U.txt, fontSize:10, padding:"4px 7px", outline:"none", boxSizing:"border-box", fontFamily:"monospace" }}
              />
            </div>

            {(selEl.type==="panel_breaker"||selEl.type==="panel_differential") && (
              <div style={{ marginBottom:9 }}>
                <div style={{ fontSize:8, color:U.dim, marginBottom:3, fontFamily:"monospace" }}>Calibre (A)</div>
                <input
                  type="number"
                  value={selEl.rating??20}
                  onChange={e => setState(s=>({...s,elements:s.elements.map(el=>el.id===selEl.id?{...el,rating:+e.target.value}:el)}))}
                  style={{ width:"100%", background:"rgba(255,255,255,0.06)", border:`1px solid ${U.bdr}`, borderRadius:5, color:U.acc, fontSize:12, padding:"4px 7px", outline:"none", boxSizing:"border-box", fontFamily:"monospace" }}
                />
              </div>
            )}

            {selEl.type!=="panel_breaker"&&selEl.type!=="panel_differential" && (
              <div style={{ marginBottom:9 }}>
                <div style={{ fontSize:8, color:U.dim, marginBottom:3, fontFamily:"monospace" }}>Circuito</div>
                <select
                  value={selEl.circuitId??""}
                  onChange={e => { if(e.target.value) assignCircuit(selEl.id,e.target.value); }}
                  style={{ width:"100%", background:"rgba(255,255,255,0.06)", border:`1px solid ${U.bdr}`, borderRadius:5, color:U.txt, fontSize:9, padding:"4px 6px", outline:"none", boxSizing:"border-box", fontFamily:"monospace" }}
                >
                  <option value="">Sin circuito</option>
                  {state.circuits.map(c => <option key={c.id} value={c.id} style={{ background:"#0a1428" }}>{c.name}</option>)}
                </select>
              </div>
            )}

            {(selEl.type==="switch"||selEl.type==="smoke_detector") && (
              <button
                onClick={() => toggle(selEl.id)}
                style={{ width:"100%", marginBottom:7, background:selEl.isOn?"rgba(34,197,94,0.1)":"rgba(239,68,68,0.07)", border:`1px solid ${selEl.isOn?"#22c55e":"#ef4444"}`, color:selEl.isOn?"#22c55e":"#ef4444", fontSize:9, padding:"5px", borderRadius:6, cursor:"pointer", fontFamily:"monospace" }}
              >
                {selEl.isOn?"● ON → clic para apagar":"○ OFF → clic para encender"}
              </button>
            )}

            {(selEl.type==="outlet"||selEl.type==="light") && (
              <button
                onClick={() => toggleGnd(selEl.id)}
                style={{ width:"100%", marginBottom:7, background:selEl.isGrounded?"rgba(34,197,94,0.1)":"transparent", border:`1px solid ${selEl.isGrounded?"#22c55e":U.bdr}`, color:selEl.isGrounded?"#22c55e":U.dim, fontSize:9, padding:"5px", borderRadius:6, cursor:"pointer", fontFamily:"monospace" }}
              >
                {selEl.isGrounded?"⏚ CON TIERRA ✓":"⏚ Marcar con tierra"}
              </button>
            )}

            {state.viewTarget==="interior" && (
              <button
                onClick={() => setPWF(p => p===selEl.id?null:selEl.id)}
                style={{ width:"100%", marginBottom:7, background:pwf===selEl.id?U.accBg:"transparent", border:`1px solid ${pwf===selEl.id?U.acc:U.bdr}`, color:pwf===selEl.id?U.acc:U.dim, fontSize:9, padding:"5px", borderRadius:6, cursor:"pointer", fontFamily:"monospace" }}
              >
                {pwf===selEl.id?"● Esperando destino... (ESC)":"⌁ Iniciar cable desde aquí"}
              </button>
            )}

            <button
              onClick={() => delEl(selEl.id)}
              style={{ width:"100%", background:"transparent", border:`1px solid ${U.bdr}`, color:U.dim, fontSize:9, padding:"5px", borderRadius:6, cursor:"pointer", fontFamily:"monospace" }}
              onMouseEnter={e => { e.currentTarget.style.color="#ef4444"; e.currentTarget.style.borderColor="#ef4444"; }}
              onMouseLeave={e => { e.currentTarget.style.color=U.dim; e.currentTarget.style.borderColor=U.bdr; }}
            >
              × Eliminar
            </button>

            {(() => {
              const cw = state.wires.filter(w=>w.fromElementId===selEl.id||w.toElementId===selEl.id);
              if (!cw.length) return null;

              return (
                <div style={{ marginTop:10 }}>
                  <div style={{ fontSize:8, color:U.dim, marginBottom:5, fontFamily:"monospace" }}>CABLES ({cw.length})</div>
                  {cw.map(w => {
                    const oid=w.fromElementId===selEl.id?w.toElementId:w.fromElementId;
                    const other=state.elements.find(e=>e.id===oid);
                    const circ=state.circuits.find(c=>c.id===w.circuitId);
                    const isCross=other&&other.roomId!==selEl.roomId;
                    const isActive=activeWiresSet.has(w.id);

                    return (
                      <div key={w.id} style={{ background:isActive?"rgba(34,197,94,0.07)":"rgba(255,255,255,0.02)", border:`1px solid ${isActive?"rgba(34,197,94,0.3)":isCross?"rgba(74,158,255,0.3)":U.bdr}`, borderLeft:`3px solid ${isActive?"#22c55e":isCross?"#4a9eff":(circ?.color??U.dim)}`, borderRadius:5, padding:"4px 8px", marginBottom:3, display:"flex", justifyContent:"space-between", alignItems:"center" }}>
                        <div>
                          <span style={{ fontSize:8, color:U.txt, fontFamily:"monospace" }}>{other?ELEMENT_ICONS[other.type]:"?"} {other?.label??"?"}</span>
                          <div style={{ fontSize:7, color:isActive?"#22c55e":U.dim, fontFamily:"monospace" }}>
                            {isActive?"⚡ activo":""}{isCross?` ⌁ ${state.rooms.find(r=>r.id===other?.roomId)?.name}`:""}
                          </div>
                        </div>
                        <button onClick={() => delWire(w.id)} style={{ fontSize:8, color:"#ef4444", background:"none", border:"none", cursor:"pointer", padding:0 }}>
                          ✕
                        </button>
                      </div>
                    );
                  })}
                </div>
              );
            })()}
          </div>
        ) : (
          <div style={{ padding:"14px 13px", fontSize:9, color:U.dim, lineHeight:1.9, fontFamily:"monospace" }}>
            <div style={{ color:U.txt, marginBottom:10, fontSize:10 }}>Sin selección</div>
            <div style={{ color:U.txt }}>Interacciones:</div>
            <div>• Arrastra elemento → habitación</div>
            <div>• Doble clic → iniciar cable</div>
            <div>• Dbl-clic switch/breaker → toggle</div>
            <div>• ⌁ → cable inter-habitación</div>
            <div style={{ color:U.txt, marginTop:8 }}>Electrones activos si:</div>
            <div>• Circuito creado</div>
            <div>• + Interruptor asignado</div>
            <div>• + Cable conectado</div>
          </div>
        )}

        <div style={{ marginTop:"auto", padding:"12px 13px", borderTop:`1px solid ${U.bdr}` }}>
          <div style={{ fontSize:7, color:U.dim, textTransform:"uppercase", marginBottom:8, letterSpacing:"0.12em", fontFamily:"monospace" }}>Resumen</div>
          {[
            { l:"Habitaciones",   v:state.rooms.length,                              c:"#4a9eff" },
            { l:"Luminarias",     v:state.elements.filter(e=>e.type==="light").length, c:"#f59e0b" },
            { l:"  energizadas",  v:state.elements.filter(e=>isPowered(e,state.elements,state.wires,state.circuits)).length, c:"#22c55e" },
            { l:"Tomacorrientes", v:state.elements.filter(e=>e.type==="outlet").length, c:"#3b82f6" },
            { l:"Circuitos",      v:state.circuits.length,                            c:"#8b5cf6" },
            { l:"  energizados",  v:state.circuits.filter(c=>c.breakerId).length,     c:"#22c55e" },
            { l:"Cables",         v:state.wires.length,                              c:"#64748b" },
            { l:"  con corriente",v:activeWiresSet.size,                             c:"#22c55e" },
          ].map(r => (
            <div key={r.l} style={{ display:"flex", justifyContent:"space-between", padding:"3px 0", borderBottom:`1px solid ${U.bdr}` }}>
              <span style={{ fontSize:9, color:U.dim, fontFamily:"monospace" }}>{r.l}</span>
              <span style={{ fontSize:10, fontWeight:"bold", color:r.c, fontFamily:"monospace" }}>{r.v}</span>
            </div>
          ))}
        </div>
      </aside>

      <style>{`
        * { box-sizing: border-box; }
        ::-webkit-scrollbar { width: 4px; }
        ::-webkit-scrollbar-track { background: #060c18; }
        ::-webkit-scrollbar-thumb { background: #1e3050; border-radius: 2px; }
        select option { background: #0a1428; color: #94a3b8; }
      `}</style>
    </div>
  );
}