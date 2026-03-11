"use client";

import React, {
  useState, useRef, useCallback, useEffect, useMemo,
  type CSSProperties, type DragEvent, type MouseEvent as RMouseEvent,
  type KeyboardEvent as RKeyboardEvent,
} from "react";

// ─── Types ─────────────────────────────────────────────────────────────────────

export type ElementType =
  | "light" | "outlet" | "switch"
  | "panel_breaker" | "panel_differential"
  | "ground_rod" | "conduit_pvc" | "conduit_emt" | "cable_tray"
  | "smoke_detector" | "fan";

export type RoomType =
  | "living" | "bedroom" | "kitchen" | "bathroom"
  | "garage" | "office" | "dining";

export type CircuitType = "lighting" | "outlet" | "ground";

export type ViewTarget = "exterior" | "interior";

export interface Room {
  id: string;
  name: string;
  type: RoomType;
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface ElectricalElement {
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

export interface Circuit {
  id: string;
  name: string;
  type: CircuitType;
  color: string;
  breakerId: string | null;
  elementIds: string[];
  isProtected: boolean;
  hasGround: boolean;
}

export interface Wire {
  id: string;
  fromElementId: string;
  toElementId: string;
  circuitId: string;
  isGroundWire: boolean;
  path: number[];
}

export interface AppState {
  rooms: Room[];
  elements: ElectricalElement[];
  circuits: Circuit[];
  wires: Wire[];
  selectedRoomId: string | null;
  selectedElementId: string | null;
  viewTarget: ViewTarget;
}

export interface ValidationError {
  id: string;
  severity: "error" | "warning" | "info";
  category: "RF-06" | "RF-07" | "RF-08" | "RF-09" | "RF-10";
  title: string;
  message: string;
  fix: string;
}

interface IsoPoint { sx: number; sy: number; }
interface DragRef  { id: string; offX: number; offY: number; }
interface DragPos  { id: string; x: number; y: number; }

interface RoomStyle {
  f: string; f2: string; w: string; ws: string; wd: string; lbl: string;
}

interface Room3D extends Room {
  x0: number; z0: number; x1: number; z1: number;
}

// ─── UID & Helpers ─────────────────────────────────────────────────────────────

let _uid = 1;
const uid = (): string => `id_${Date.now()}_${_uid++}`;
const snap = (v: number, g = 20): number => Math.round(v / g) * g;

// ─── Constants ─────────────────────────────────────────────────────────────────

const ELEMENT_LABELS: Record<ElementType, string> = {
  light: "Luminaria",
  outlet: "Tomacorriente",
  switch: "Interruptor",
  panel_breaker: "Termomagnético",
  panel_differential: "Diferencial",
  ground_rod: "Varilla Tierra",
  conduit_pvc: "Tubería PVC",
  conduit_emt: "Tubería EMT",
  cable_tray: "Canaleta",
  smoke_detector: "Detector Humo",
  fan: "Ventilador",
};

const ELEMENT_ICONS: Record<ElementType, string> = {
  light: "💡", outlet: "🔌", switch: "🔘",
  panel_breaker: "⚡", panel_differential: "🛡️",
  ground_rod: "⏚", conduit_pvc: "〰",
  conduit_emt: "═", cable_tray: "▬",
  smoke_detector: "🔔", fan: "🌀",
};

interface PaletteGroup { cat: string; items: ElementType[]; }
const PALETTE_GROUPS: PaletteGroup[] = [
  { cat: "Iluminación (RF-06)", items: ["light", "switch", "fan"] },
  { cat: "Tomacorrientes (RF-06)", items: ["outlet"] },
  { cat: "Seguridad", items: ["smoke_detector"] },
  { cat: "Tablero (RF-07)", items: ["panel_breaker", "panel_differential"] },
  { cat: "Canalización (RF-08)", items: ["conduit_pvc", "conduit_emt", "cable_tray"] },
  { cat: "Tierra (RF-09)", items: ["ground_rod"] },
];

const CIRCUIT_COLORS: Record<CircuitType, string> = {
  lighting: "#f59e0b",
  outlet: "#3b82f6",
  ground: "#22c55e",
};

const ROOM_TYPES: RoomType[] = ["living", "bedroom", "kitchen", "bathroom", "garage", "office", "dining"];

const ROOM_TYPE_LABELS: Record<RoomType, string> = {
  living: "Sala", bedroom: "Dormitorio", kitchen: "Cocina", bathroom: "Baño",
  garage: "Garaje", office: "Oficina", dining: "Comedor",
};

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
  { id:"r1", name:"Sala",       type:"living",   x:5,  y:5,  width:42, height:45 },
  { id:"r2", name:"Cocina",     type:"kitchen",  x:52, y:5,  width:43, height:30 },
  { id:"r3", name:"Dormitorio", type:"bedroom",  x:52, y:40, width:43, height:35 },
  { id:"r4", name:"Baño",       type:"bathroom", x:5,  y:55, width:20, height:20 },
  { id:"r5", name:"Garaje",     type:"garage",   x:28, y:55, width:22, height:20 },
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

// ─── Geometry ──────────────────────────────────────────────────────────────────

function isoProject(
  wx: number, wy: number, wz: number,
  scale: number, offX: number, offY: number,
): IsoPoint {
  const sx = (wx - wz) * Math.cos(Math.PI / 6) * scale + offX;
  const sy = (wx + wz) * Math.sin(Math.PI / 6) * scale - wy * 0.816 * scale + offY;
  return { sx, sy };
}

function wirePath(x1: number, y1: number, x2: number, y2: number): string {
  const mx = (x1 + x2) / 2;
  return `M ${x1} ${y1} C ${mx} ${y1}, ${mx} ${y2}, ${x2} ${y2}`;
}

function polyPts(pts: IsoPoint[]): string {
  return pts.map(p => `${p.sx.toFixed(1)},${p.sy.toFixed(1)}`).join(" ");
}

// ─── Power Logic ───────────────────────────────────────────────────────────────

function isPowered(
  el: ElectricalElement,
  elements: ElectricalElement[],
  wires: Wire[],
  circuits: Circuit[],
): boolean {
  if (!["light", "fan", "smoke_detector", "outlet"].includes(el.type)) return false;
  if (!el.circuitId) return false;
  const c = circuits.find(c => c.id === el.circuitId);
  if (!c || !c.breakerId) return false;
  return wires.some(w => w.fromElementId === el.id || w.toElementId === el.id);
}

function getActiveWires(
  elements: ElectricalElement[],
  wires: Wire[],
  circuits: Circuit[],
): Set<string> {
  const s = new Set<string>();
  wires.forEach(w => {
    const c = circuits.find(c => c.id === w.circuitId);
    if (c?.breakerId) s.add(w.id);
  });
  return s;
}

// ─── Validation ────────────────────────────────────────────────────────────────

function validateInstallation(state: AppState): ValidationError[] {
  const errors: ValidationError[] = [];
  const { elements, circuits, rooms } = state;
  let ec = 0;

  const mkErr = (
    sev: ValidationError["severity"],
    cat: ValidationError["category"],
    title: string,
    message: string,
    fix: string,
  ): void => {
    errors.push({ id: `e${++ec}`, severity: sev, category: cat, title, message, fix });
  };

  const lights   = elements.filter(e => e.type === "light");
  const outlets  = elements.filter(e => e.type === "outlet");
  const breakers = elements.filter(e => e.type === "panel_breaker");
  const diffs    = elements.filter(e => e.type === "panel_differential");
  const conduits = elements.filter(e =>
    (["conduit_pvc", "conduit_emt", "cable_tray"] as ElementType[]).includes(e.type),
  );
  const grounds  = elements.filter(e => e.type === "ground_rod");

  // RF-06
  if (lights.length === 0)
    mkErr("error","RF-06","Sin luminarias","No hay luminarias instaladas.","Arrastra luminarias a las habitaciones.");
  if (outlets.length === 0)
    mkErr("error","RF-06","Sin tomacorrientes","No hay tomacorrientes instalados.","Arrastra tomacorrientes a las habitaciones.");
  rooms.forEach(r => {
    if (!lights.some(e => e.roomId === r.id))
      mkErr("warning","RF-06",`${r.name} sin iluminación`,`"${r.name}" no tiene luminaria.`,`Coloca una luminaria en ${r.name}.`);
  });

  // RF-07
  if (breakers.length === 0)
    mkErr("error","RF-07","Sin termomagnéticos","No hay interruptores termomagnéticos.","Agrega al menos un termomagnético.");
  if (diffs.length === 0)
    mkErr("error","RF-07","Sin diferencial","No hay interruptor diferencial.","Agrega un interruptor diferencial.");
  circuits.forEach(c => {
    if (!c.breakerId)
      mkErr("warning","RF-07","Circuito sin protección",`"${c.name}" sin termomagnético.`,"Asigna un interruptor al circuito.");
  });

  // RF-08
  if (conduits.length === 0 && elements.length > 4)
    mkErr("warning","RF-08","Sin canalización","No hay tuberías ni canaletas.","Agrega tubería PVC, EMT o canaletas.");

  // RF-09
  if (grounds.length === 0)
    mkErr("error","RF-09","Sin puesta a tierra","No hay varilla de tierra instalada.","Instala una varilla de tierra.");
  outlets.forEach(o => {
    if (!o.isGrounded)
      mkErr("warning","RF-09","Tomacorriente sin tierra",`"${o.label}" sin conexión a tierra.`,"Conecta conductor de tierra.");
  });

  // RF-10
  if (lights.length > 0 && !circuits.some(c => c.type === "lighting"))
    mkErr("info","RF-10","Sin circuito de iluminación","Luminarias sin circuito asignado.","Crea un circuito de iluminación.");
  if (outlets.length > 0 && !circuits.some(c => c.type === "outlet"))
    mkErr("info","RF-10","Sin circuito de tomacorrientes","Tomacorrientes sin circuito dedicado.","Crea un circuito de tomacorrientes.");

  return errors;
}

function getScore(errors: ValidationError[]): number {
  let s = 100;
  errors.forEach(e => {
    if (e.severity === "error")   s -= 15;
    else if (e.severity === "warning") s -= 7;
    else s -= 3;
  });
  return Math.max(0, s);
}

// ─── Animated Wire ─────────────────────────────────────────────────────────────

interface AnimatedWireProps {
  d: string;
  color: string;
  active: boolean;
  dashed?: boolean;
  onClick: () => void;
}

function AnimatedWire({ d, color, active, dashed = false, onClick }: AnimatedWireProps) {
  return (
    <g>
      {active && (
        <path d={d} fill="none" stroke={color} strokeWidth="10" opacity="0.1" strokeLinecap="round"/>
      )}
      <path
        d={d} fill="none"
        stroke={active ? color : "#2d3f5a"}
        strokeWidth={active ? 4 : 2.5}
        strokeLinecap="round"
        strokeDasharray={dashed ? "10 5" : undefined}
        opacity="0.9"
      />
      {active && (
        <path d={d} fill="none" stroke="rgba(255,255,255,0.2)" strokeWidth="1.5" strokeLinecap="round"/>
      )}
      {active && ([0, 0.33, 0.66] as const).map((off, i) => (
        <circle key={i} r="5" fill={color} opacity="0.9">
          <animateMotion dur="1.2s" begin={`${off * 1.2}s`} repeatCount="indefinite" path={d}/>
        </circle>
      ))}
      <path
        d={d} fill="none" stroke="transparent" strokeWidth="14"
        style={{ cursor: "pointer" }} onClick={onClick}
      />
    </g>
  );
}

// ─── Validation Panel ──────────────────────────────────────────────────────────

interface ValidationPanelProps {
  errors: ValidationError[];
  score: number;
}

function ValidationPanel({ errors, score }: ValidationPanelProps) {
  const [open, setOpen] = useState(false);
  const scoreColor = score >= 80 ? "#22c55e" : score >= 60 ? "#f59e0b" : "#ef4444";

  const sevIcon: Record<ValidationError["severity"], string> = {
    error: "❌", warning: "⚠️", info: "ℹ️",
  };
  const catColor: Record<ValidationError["category"], string> = {
    "RF-06": "#f59e0b", "RF-07": "#3b82f6",
    "RF-08": "#8b5cf6", "RF-09": "#22c55e", "RF-10": "#ec4899",
  };

  return (
    <div style={{ position:"absolute", bottom:12, right:12, zIndex:80, fontFamily:"monospace" }}>
      <button
        onClick={() => setOpen(o => !o)}
        style={{ background:"rgba(6,16,30,0.95)", border:`1px solid ${scoreColor}`, borderRadius:10, padding:"8px 14px", color:scoreColor, fontSize:11, cursor:"pointer", display:"flex", alignItems:"center", gap:8, boxShadow:`0 0 18px ${scoreColor}40` }}
      >
        <span style={{ fontSize:18, fontWeight:"bold" }}>{score}</span>
        <span>{score >= 80 ? "✅ Instalación OK" : score >= 60 ? "⚠️ Con advertencias" : "❌ Con errores"}</span>
        <span style={{ fontSize:9, color:"#3a5070" }}>{open ? "▲" : "▼"}</span>
      </button>

      {open && (
        <div style={{ position:"absolute", bottom:"110%", right:0, width:340, background:"rgba(4,8,14,0.98)", border:"1px solid #1e3050", borderRadius:12, padding:14, maxHeight:360, overflowY:"auto", boxShadow:"0 16px 48px rgba(0,0,0,0.8)" }}>
          <div style={{ fontSize:9, color:"#3a5070", marginBottom:10, letterSpacing:"0.15em" }}>VALIDACIÓN DE INSTALACIÓN</div>
          {errors.length === 0 ? (
            <div style={{ textAlign:"center", color:"#22c55e", padding:"16px 0", fontSize:11 }}>✓ Instalación correcta</div>
          ) : errors.map(e => (
            <div key={e.id} style={{ background:"rgba(255,255,255,0.02)", border:`1px solid ${catColor[e.category]}22`, borderLeft:`3px solid ${catColor[e.category]}`, borderRadius:6, padding:"8px 10px", marginBottom:6 }}>
              <div style={{ display:"flex", gap:6, alignItems:"center", marginBottom:3 }}>
                <span>{sevIcon[e.severity]}</span>
                <span style={{ fontSize:9, color:"#94a3b8", fontWeight:"bold" }}>{e.title}</span>
                <span style={{ marginLeft:"auto", fontSize:7, color:catColor[e.category], border:`1px solid ${catColor[e.category]}44`, borderRadius:4, padding:"1px 5px" }}>{e.category}</span>
              </div>
              <div style={{ fontSize:8, color:"#64748b", marginBottom:4 }}>{e.message}</div>
              <div style={{ fontSize:7, color:"#22c55e" }}>💡 {e.fix}</div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ─── Multimeter / Test Tool (RF-10) ────────────────────────────────────────────

interface MultimeterPanelProps {
  selEl: ElectricalElement;
  elements: ElectricalElement[];
  wires: Wire[];
  circuits: Circuit[];
}

function MultimeterPanel({ selEl, elements, wires, circuits }: MultimeterPanelProps) {
  const powered = isPowered(selEl, elements, wires, circuits);
  const c = circuits.find(c => c.id === selEl.circuitId) ?? null;
  const breakerEl = c?.breakerId ? elements.find(e => e.id === c.breakerId) ?? null : null;
  const connWires = wires.filter(w => w.fromElementId === selEl.id || w.toElementId === selEl.id);
  const hasGround = selEl.isGrounded || connWires.some(w => w.isGroundWire);

  const rows: Array<{ label: string; val: string; ok: boolean }> = [
    { label: "Voltaje",     val: powered ? "120 V" : "0 V",                       ok: powered },
    { label: "Continuidad", val: connWires.length > 0 ? "OK" : "Abierto",         ok: connWires.length > 0 },
    { label: "Tierra",      val: hasGround ? "✓ Conectada" : "✗ Ausente",         ok: hasGround },
    { label: "Polaridad",   val: c ? "Correcta" : "N/A",                          ok: !!c },
    { label: "Circuito",    val: c?.name ?? "Sin asignar",                         ok: !!c },
    { label: "Protección",  val: breakerEl ? `${breakerEl.rating ?? 20}A` : "Sin breaker", ok: !!breakerEl },
  ];

  return (
    <div style={{ background:"rgba(4,8,14,0.95)", border:"1px solid #1e3050", borderRadius:10, padding:12, marginTop:8, fontFamily:"monospace" }}>
      <div style={{ fontSize:8, color:"#3a5070", marginBottom:8, letterSpacing:"0.15em" }}>🔬 PRUEBAS RF-10</div>
      <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:5 }}>
        {rows.map(item => (
          <div key={item.label} style={{ background:item.ok?"rgba(34,197,94,0.06)":"rgba(239,68,68,0.06)", border:`1px solid ${item.ok?"rgba(34,197,94,0.3)":"rgba(239,68,68,0.2)"}`, borderRadius:5, padding:"5px 8px" }}>
            <div style={{ fontSize:7, color:"#3a5070", marginBottom:1 }}>{item.label}</div>
            <div style={{ fontSize:9, color:item.ok?"#22c55e":"#ef4444", fontWeight:"bold" }}>{item.val}</div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── Room Manager Modal ─────────────────────────────────────────────────────────

interface RoomManagerProps {
  rooms: Room[];
  onClose: () => void;
  onSave: (rooms: Room[]) => void;
}

function RoomManager({ rooms, onClose, onSave }: RoomManagerProps) {
  const [draft, setDraft] = useState<Room[]>(() => rooms.map(r => ({ ...r })));
  const U = { bdr:"#1e3050", txt:"#94a3b8", acc:"#4a9eff", accBg:"rgba(74,158,255,0.08)", dim:"#3a5070" };

  const updateRoom = (id: string, patch: Partial<Room>): void =>
    setDraft(d => d.map(r => r.id === id ? { ...r, ...patch } : r));

  return (
    <div style={{ position:"fixed", inset:0, background:"rgba(0,0,0,0.85)", zIndex:1000, display:"flex", alignItems:"center", justifyContent:"center" }}>
      <div style={{ background:"#06101e", border:`1px solid ${U.bdr}`, borderRadius:16, width:700, maxHeight:"85vh", display:"flex", flexDirection:"column", boxShadow:"0 32px 80px rgba(0,0,0,0.8)" }}>

        <div style={{ padding:"16px 20px", borderBottom:`1px solid ${U.bdr}`, display:"flex", justifyContent:"space-between", alignItems:"center" }}>
          <span style={{ fontSize:13, color:U.acc, fontFamily:"monospace", fontWeight:"bold" }}>🏠 GESTIÓN DE HABITACIONES</span>
          <button onClick={onClose} style={{ background:"transparent", border:`1px solid ${U.bdr}`, color:U.dim, borderRadius:6, width:28, height:28, cursor:"pointer" }}>✕</button>
        </div>

        <div style={{ padding:"10px 20px", borderBottom:`1px solid ${U.bdr}` }}>
          <div style={{ position:"relative", width:"100%", height:110, background:"#040810", borderRadius:8, border:`1px solid ${U.bdr}`, overflow:"hidden" }}>
            {draft.map(r => {
              const s = RS[r.type];
              return (
                <div key={r.id} style={{ position:"absolute", left:`${r.x}%`, top:`${r.y}%`, width:`${r.width}%`, height:`${r.height}%`, background:s.f, border:`1px solid ${s.wd}`, display:"flex", alignItems:"center", justifyContent:"center", fontSize:7, color:s.lbl, fontFamily:"monospace", borderRadius:2 }}>
                  {r.name}
                </div>
              );
            })}
          </div>
        </div>

        <div style={{ overflowY:"auto", flex:1, padding:"12px 20px" }}>
          {draft.map(r => (
            <div key={r.id} style={{ background:"#0a1428", border:`1px solid ${U.bdr}`, borderRadius:8, padding:"10px 14px", marginBottom:8, display:"flex", gap:10, alignItems:"center", flexWrap:"wrap" }}>
              <div style={{ width:4, height:36, background:RS[r.type].lbl, borderRadius:2, flexShrink:0 }}/>

              <div style={{ flex:"1 1 90px" }}>
                <div style={{ fontSize:7, color:U.dim, fontFamily:"monospace", marginBottom:2 }}>Nombre</div>
                <input
                  value={r.name}
                  onChange={e => updateRoom(r.id, { name: e.target.value })}
                  style={{ width:"100%", background:"#04080e", border:`1px solid ${U.bdr}`, borderRadius:5, color:U.txt, fontSize:10, padding:"3px 6px", fontFamily:"monospace", outline:"none", boxSizing:"border-box" }}
                />
              </div>

              <div style={{ flex:"1 1 80px" }}>
                <div style={{ fontSize:7, color:U.dim, fontFamily:"monospace", marginBottom:2 }}>Tipo</div>
                <select
                  value={r.type}
                  onChange={e => updateRoom(r.id, { type: e.target.value as RoomType })}
                  style={{ width:"100%", background:"#04080e", border:`1px solid ${U.bdr}`, borderRadius:5, color:U.txt, fontSize:9, padding:"3px 5px", fontFamily:"monospace", outline:"none" }}
                >
                  {ROOM_TYPES.map(t => <option key={t} value={t}>{ROOM_TYPE_LABELS[t]}</option>)}
                </select>
              </div>

              {(["x","y","width","height"] as const).map(field => (
                <div key={field} style={{ flex:"0 0 52px" }}>
                  <div style={{ fontSize:7, color:U.dim, fontFamily:"monospace", marginBottom:2 }}>
                    {field === "x" ? "X%" : field === "y" ? "Y%" : field === "width" ? "Ancho%" : "Alto%"}
                  </div>
                  <input
                    type="number" min="1" max="95"
                    value={r[field]}
                    onChange={e => updateRoom(r.id, { [field]: Math.max(5, Math.min(95, Number(e.target.value))) })}
                    style={{ width:"100%", background:"#04080e", border:`1px solid ${U.bdr}`, borderRadius:5, color:U.acc, fontSize:10, padding:"3px 5px", fontFamily:"monospace", outline:"none" }}
                  />
                </div>
              ))}

              <button
                onClick={() => setDraft(d => d.filter(x => x.id !== r.id))}
                style={{ background:"transparent", border:"1px solid #c0392b44", color:"#c0392b", borderRadius:6, width:26, height:26, cursor:"pointer", fontSize:13, flexShrink:0 }}
              >✕</button>
            </div>
          ))}
          <button
            onClick={() => setDraft(d => [...d, { id:uid(), name:"Nueva Hab.", type:"living", x:10, y:10, width:30, height:30 }])}
            style={{ width:"100%", background:U.accBg, border:`1px dashed ${U.acc}`, borderRadius:8, color:U.acc, fontSize:10, padding:"10px", cursor:"pointer", fontFamily:"monospace" }}
          >+ Agregar habitación</button>
        </div>

        <div style={{ padding:"12px 20px", borderTop:`1px solid ${U.bdr}`, display:"flex", gap:10, justifyContent:"flex-end" }}>
          <button onClick={onClose} style={{ background:"transparent", border:`1px solid ${U.bdr}`, color:U.dim, borderRadius:7, padding:"7px 20px", cursor:"pointer", fontFamily:"monospace", fontSize:10 }}>Cancelar</button>
          <button onClick={() => onSave(draft)} style={{ background:U.accBg, border:`1px solid ${U.acc}`, color:U.acc, borderRadius:7, padding:"7px 24px", cursor:"pointer", fontFamily:"monospace", fontSize:10, fontWeight:"bold" }}>✓ Guardar</button>
        </div>
      </div>
    </div>
  );
}

// ─── Cross-Room Selector ───────────────────────────────────────────────────────

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
    <div style={{ position:"fixed", inset:0, background:"rgba(0,0,0,0.85)", zIndex:1000, display:"flex", alignItems:"center", justifyContent:"center" }}>
      <div style={{ background:"#06101e", border:`1px solid ${U.bdr}`, borderRadius:14, width:420, maxHeight:"70vh", display:"flex", flexDirection:"column", boxShadow:"0 24px 64px rgba(0,0,0,0.8)" }}>
        <div style={{ padding:"14px 18px", borderBottom:`1px solid ${U.bdr}` }}>
          <div style={{ fontSize:11, color:U.acc, fontFamily:"monospace", fontWeight:"bold" }}>⌁ CABLE INTER-HABITACIÓN</div>
        </div>
        <div style={{ overflowY:"auto", flex:1, padding:"10px 14px" }}>
          {others.length === 0
            ? <div style={{ textAlign:"center", color:U.dim, fontSize:10, fontFamily:"monospace", padding:"20px 0" }}>No hay elementos en otras habitaciones.</div>
            : others.map(el => {
                const c = circuits.find(c => c.id === el.circuitId);
                const isSel = selId === el.id;
                return (
                  <div key={el.id} onClick={() => setSelId(el.id)} style={{ display:"flex", alignItems:"center", gap:10, padding:"9px 12px", marginBottom:4, background:isSel?U.accBg:"#0a1428", border:`1px solid ${isSel?U.acc:U.bdr}`, borderRadius:7, cursor:"pointer" }}>
                    <div style={{ width:8, height:8, borderRadius:"50%", background:c?.color ?? "#94a3b8", flexShrink:0 }}/>
                    <span style={{ fontSize:18 }}>{ELEMENT_ICONS[el.type]}</span>
                    <div style={{ flex:1 }}>
                      <div style={{ fontSize:10, color:isSel?U.acc:U.txt, fontFamily:"monospace" }}>{el.label}</div>
                      <div style={{ fontSize:8, color:U.dim, fontFamily:"monospace" }}>
                        {rooms.find(r => r.id === el.roomId)?.name ?? "?"} · {el.type}
                      </div>
                    </div>
                    {isSel && <span style={{ color:U.acc }}>✓</span>}
                  </div>
                );
              })
          }
        </div>
        <div style={{ padding:"12px 18px", borderTop:`1px solid ${U.bdr}`, display:"flex", gap:8, justifyContent:"flex-end" }}>
          <button onClick={onCancel} style={{ background:"transparent", border:`1px solid ${U.bdr}`, color:U.dim, borderRadius:7, padding:"6px 16px", cursor:"pointer", fontFamily:"monospace", fontSize:9 }}>Cancelar</button>
          <button
            disabled={!selId}
            onClick={() => { if (selId) onConnect(selId); }}
            style={{ background:selId?U.accBg:"transparent", border:`1px solid ${selId?U.acc:U.bdr}`, color:selId?U.acc:U.dim, borderRadius:7, padding:"6px 20px", cursor:selId?"pointer":"not-allowed", fontFamily:"monospace", fontSize:9 }}
          >⌁ Conectar</button>
        </div>
      </div>
    </div>
  );
}

// ─── House Exterior (Isometric) View ───────────────────────────────────────────

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

function HouseView({
  rooms, onRoomClick, allElements, allWires, circuits,
  panelEls, selectedElId, onElementClick, onPanelDrop,
}: HouseViewProps) {
  const [hov, setHov] = useState<string | null>(null);
  const [panelOver, setPanelOver] = useState(false);

  const S = 2.2, WH = 44;
  const activeWires = useMemo(
    () => getActiveWires(allElements, allWires, circuits),
    [allElements, allWires, circuits],
  );

  const rooms3d = useMemo<Room3D[]>(
    () => rooms.map(r => ({
      ...r,
      x0: (r.x - 50) * S, z0: (r.y - 50) * S,
      x1: (r.x + r.width - 50) * S, z1: (r.y + r.height - 50) * S,
    })),
    [rooms],
  );

  const sorted = useMemo(
    () => [...rooms3d].sort((a, b) =>
      ((a.x0 + a.x1) / 2 + (a.z0 + a.z1) / 2) - ((b.x0 + b.x1) / 2 + (b.z0 + b.z1) / 2),
    ),
    [rooms3d],
  );

  const SCALE = 5.2;
  const allCorners = rooms3d.flatMap(r => [
    isoProject(r.x0,0,r.z0,SCALE,0,0), isoProject(r.x1,0,r.z0,SCALE,0,0),
    isoProject(r.x0,0,r.z1,SCALE,0,0), isoProject(r.x1,0,r.z1,SCALE,0,0),
    isoProject(r.x0,WH,r.z0,SCALE,0,0), isoProject(r.x1,WH,r.z0,SCALE,0,0),
    isoProject(r.x0,WH,r.z1,SCALE,0,0), isoProject(r.x1,WH,r.z1,SCALE,0,0),
  ]);

  const pad = 60;
  const vx0 = Math.min(...allCorners.map(p => p.sx)) - pad;
  const vx1 = Math.max(...allCorners.map(p => p.sx)) + pad;
  const vy0 = Math.min(...allCorners.map(p => p.sy)) - pad;
  const vy1 = Math.max(...allCorners.map(p => p.sy)) + pad;
  const VW = vx1 - vx0, VH = vy1 - vy0;

  const proj = (wx: number, wy: number, wz: number): IsoPoint =>
    isoProject(wx, wy, wz, SCALE, -vx0, -vy0);

  function elWorldPos(el: ElectricalElement): { wx: number; wz: number } | null {
    const r = rooms3d.find(r => r.id === el.roomId);
    if (!r) return null;
    return {
      wx: r.x0 + (r.x1 - r.x0) * (el.x / 1200),
      wz: r.z0 + (r.z1 - r.z0) * (el.y / 800),
    };
  }

  function renderRoom(r: Room3D): React.ReactNode {
    const s = RS[r.type];
    const isHov = hov === r.id;
    const hasPowered = allElements.some(
      el => el.roomId === r.id && isPowered(el, allElements, allWires, circuits),
    );
    const fl = {
      TL: proj(r.x0,0,r.z0), TR: proj(r.x1,0,r.z0),
      BL: proj(r.x0,0,r.z1), BR: proj(r.x1,0,r.z1),
    };
    const ce = {
      TL: proj(r.x0,WH,r.z0), TR: proj(r.x1,WH,r.z0),
      BL: proj(r.x0,WH,r.z1),
    };
    const cx = (fl.TL.sx + fl.BR.sx) / 2;
    const cy = (fl.TL.sy + fl.BR.sy) / 2;

    const planks: React.ReactNode[] = [];
    for (let i = 1; i < 7; i++) {
      const t = i / 7;
      const px = r.x0 + (r.x1 - r.x0) * t;
      const pz = r.z0 + (r.z1 - r.z0) * t;
      const a = proj(px,0,r.z0), b = proj(px,0,r.z1);
      planks.push(<line key={`px${i}`} x1={a.sx} y1={a.sy} x2={b.sx} y2={b.sy} stroke={s.f2} strokeWidth="0.7" opacity="0.5"/>);
      const c2 = proj(r.x0,0,pz), d = proj(r.x1,0,pz);
      planks.push(<line key={`pz${i}`} x1={c2.sx} y1={c2.sy} x2={d.sx} y2={d.sy} stroke={s.f2} strokeWidth="0.7" opacity="0.3"/>);
    }

    return (
      <g
        key={r.id}
        onClick={(e: RMouseEvent<SVGGElement>) => { e.stopPropagation(); onRoomClick(r.id); }}
        onMouseEnter={() => setHov(r.id)}
        onMouseLeave={() => setHov(null)}
        style={{ cursor:"pointer" }}
      >
        {hasPowered && (
          <defs>
            <radialGradient id={`g-${r.id}`} cx="50%" cy="50%">
              <stop offset="0%" stopColor="#fff5c0"/>
              <stop offset="60%" stopColor="#f5d870"/>
              <stop offset="100%" stopColor={s.f}/>
            </radialGradient>
          </defs>
        )}
        <polygon points={polyPts([fl.TL,fl.TR,fl.BR,fl.BL])} fill={hasPowered ? `url(#g-${r.id})` : isHov ? "#f0e8d0" : s.f} stroke={s.f2} strokeWidth="0.8"/>
        {planks}
        {isHov && <polygon points={polyPts([fl.TL,fl.TR,fl.BR,fl.BL])} fill="rgba(255,240,180,0.18)" stroke="none"/>}
        <polygon points={polyPts([fl.TL,fl.BL,ce.BL,ce.TL])} fill={s.w} stroke={s.wd} strokeWidth="0.6"/>
        <polygon points={polyPts([fl.TL,fl.TR,ce.TR,ce.TL])} fill={s.ws} stroke={s.wd} strokeWidth="0.6"/>
        <line x1={ce.TL.sx} y1={ce.TL.sy} x2={ce.TR.sx} y2={ce.TR.sy} stroke={s.wd} strokeWidth={isHov?1.8:1}/>
        <line x1={ce.TL.sx} y1={ce.TL.sy} x2={ce.BL.sx} y2={ce.BL.sy} stroke={s.wd} strokeWidth={isHov?1.8:1}/>
        <text x={cx} y={cy+6} textAnchor="middle" fontSize="8" fill={isHov?"#5a3800":s.lbl} fontFamily="Georgia,serif" fontWeight={isHov?"bold":"normal"} letterSpacing="0.1em" style={{ pointerEvents:"none", userSelect:"none" }}>
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
            <path d="M 28 0 L 0 0 0 28" fill="none" stroke="#a8bcd4" strokeWidth="0.4" opacity="0.5"/>
          </pattern>
        </defs>
        <rect width="100%" height="100%" fill="url(#bpBg)"/>
        <rect width="100%" height="100%" fill="url(#bpGrid)"/>
      </svg>

      <svg viewBox={`0 0 ${VW} ${VH}`} style={{ position:"absolute", inset:0, width:"100%", height:"100%", overflow:"visible" }}>
        <defs>
          <filter id="ds" x="-10%" y="-10%" width="130%" height="150%">
            <feDropShadow dx="6" dy="12" stdDeviation="10" floodColor="#8090a8" floodOpacity="0.25"/>
          </filter>
          <filter id="eg">
            <feGaussianBlur stdDeviation="3" result="b"/>
            <feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge>
          </filter>
        </defs>
        <g filter="url(#ds)">{sorted.map(r => renderRoom(r))}</g>

        {allWires.map(w => {
          const fe = allElements.find(e => e.id === w.fromElementId);
          const te = allElements.find(e => e.id === w.toElementId);
          if (!fe?.roomId || !te?.roomId) return null;
          const fp = elWorldPos(fe), tp = elWorldPos(te);
          if (!fp || !tp) return null;
          const fpt = proj(fp.wx, 1.5, fp.wz);
          const tpt = proj(tp.wx, 1.5, tp.wz);
          const circ = circuits.find(c => c.id === w.circuitId);
          const color = w.isGroundWire ? "#22c55e" : (circ?.color ?? "#6b7280");
          const active = activeWires.has(w.id);
          const isCross = fe.roomId !== te.roomId;
          const d = `M ${fpt.sx} ${fpt.sy} L ${tpt.sx} ${tpt.sy}`;
          return <AnimatedWire key={w.id} d={d} color={color} active={active} dashed={isCross} onClick={() => {}}/>;
        })}

        {allElements.filter(el => el.roomId !== null).map(el => {
          const wp = elWorldPos(el);
          if (!wp) return null;
          const p = proj(wp.wx, 2.5, wp.wz);
          const powered = isPowered(el, allElements, allWires, circuits);
          const circ = circuits.find(c => c.id === el.circuitId);
          const isSel = selectedElId === el.id;
          const R = 9;
          return (
            <g key={el.id} style={{ cursor:"pointer" }} onClick={(e: RMouseEvent<SVGGElement>) => { e.stopPropagation(); onElementClick(el.id); }}>
              {powered && <ellipse cx={p.sx} cy={p.sy+3} rx={24} ry={14} fill="rgba(255,230,80,0.45)" filter="url(#eg)"/>}
              <ellipse cx={p.sx} cy={p.sy+3} rx={R+3} ry={(R+3)*0.4} fill="rgba(0,0,0,0.2)"/>
              {isSel && <circle cx={p.sx} cy={p.sy} r={R+7} fill="none" stroke="#f59e0b" strokeWidth="2"/>}
              <circle cx={p.sx} cy={p.sy} r={R} fill={powered?"#fffbe8":"white"} stroke={powered?"#f59e0b":(circ?.color ?? "#6b7280")} strokeWidth="1.8"/>
              <text x={p.sx} y={p.sy+4} textAnchor="middle" fontSize="10" style={{ pointerEvents:"none", userSelect:"none" }}>{ELEMENT_ICONS[el.type]}</text>
              {powered && <circle cx={p.sx+R*0.72} cy={p.sy-R*0.72} r="3.5" fill="#22c55e" stroke="white" strokeWidth="1"/>}
            </g>
          );
        })}
      </svg>

      {/* Distribution Panel */}
      <div
        style={{ position:"absolute", left:12, top:12, width:190, background:panelOver?"rgba(255,255,255,0.98)":"rgba(255,253,248,0.96)", border:`1.5px solid ${panelOver?"#f59e0b":"#d4c8b0"}`, borderRadius:10, padding:11, transition:"all 0.15s", boxShadow:"0 4px 18px rgba(80,60,20,0.14)", fontFamily:"Georgia,serif" }}
        onDragOver={(e: DragEvent<HTMLDivElement>) => { e.preventDefault(); e.stopPropagation(); setPanelOver(true); }}
        onDragLeave={() => setPanelOver(false)}
        onDrop={(e: DragEvent<HTMLDivElement>) => {
          e.preventDefault(); e.stopPropagation(); setPanelOver(false);
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
            <span style={{ fontSize:16 }}>{ELEMENT_ICONS[el.type]}</span>
            <span style={{ fontSize:8, color:"#706040", fontFamily:"monospace", flex:1 }}>{el.label}</span>
            <span style={{ fontSize:9, color:"#a87010", fontFamily:"monospace", fontWeight:"bold" }}>{el.rating ?? 20}A</span>
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

// ─── Room Interior View ────────────────────────────────────────────────────────

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

function RoomView({
  room, elements, wires, circuits, rooms,
  onDrop, onElementClick, onElementMove, onWireConnect,
  selectedElId, pendingWireFrom, onCanvasClick, onCrossRoomWire,
}: RoomViewProps) {
  const svgRef = useRef<SVGSVGElement>(null);
  const dragRef = useRef<DragRef | null>(null);
  const [dragPos, setDragPos] = useState<DragPos | null>(null);
  const [mouse, setMouse] = useState<{ x: number; y: number }>({ x:600, y:400 });

  const activeWires = useMemo(
    () => getActiveWires(elements, wires, circuits),
    [elements, wires, circuits],
  );
  const roomEls = elements.filter(e => e.roomId === room.id);
  const s = RS[room.type];

  const WH = 120, OX = 600, OY = 460, RW = 200, RD = 160;
  const rp = (rx: number, ry: number, rz: number): IsoPoint =>
    isoProject(rx, ry, rz, 4.4 * 0.7, OX, OY);
  const fTL = rp(-RW,0,-RD), fTR = rp(RW,0,-RD), fBL = rp(-RW,0,RD), fBR = rp(RW,0,RD);
  const cTL = rp(-RW,WH,-RD), cTR = rp(RW,WH,-RD), cBL = rp(-RW,WH,RD);

  const planks: React.ReactNode[] = [];
  for (let i = 1; i < 10; i++) {
    const t = i / 10;
    const frac2iso = (fx: number, fz: number): IsoPoint =>
      rp((fx - 0.5) * RW * 2, 0, (fz - 0.5) * RD * 2);
    const a = frac2iso(t,0), b = frac2iso(t,1), c2 = frac2iso(0,t), d = frac2iso(1,t);
    planks.push(<line key={`a${i}`} x1={a.sx} y1={a.sy} x2={b.sx} y2={b.sy} stroke={s.f2} strokeWidth="1.1" opacity="0.5"/>);
    planks.push(<line key={`b${i}`} x1={c2.sx} y1={c2.sy} x2={d.sx} y2={d.sy} stroke={s.f2} strokeWidth="1.1" opacity="0.3"/>);
  }

  function svgXY(cx: number, cy: number): { x: number; y: number } {
    const svg = svgRef.current;
    if (!svg) return { x:0, y:0 };
    const rect = svg.getBoundingClientRect();
    return { x: (cx - rect.left) / rect.width * 1200, y: (cy - rect.top) / rect.height * 800 };
  }

  function circColor(el: ElectricalElement): string {
    if (!el.circuitId) return "#94a3b8";
    return circuits.find(c => c.id === el.circuitId)?.color ?? "#94a3b8";
  }

  const pendingFromEl = pendingWireFrom ? elements.find(e => e.id === pendingWireFrom) ?? null : null;
  const pfx = dragPos?.id === pendingWireFrom ? dragPos.x : (pendingFromEl?.x ?? 0);
  const pfy = dragPos?.id === pendingWireFrom ? dragPos.y : (pendingFromEl?.y ?? 0);

  const crossWires = wires.filter(w => {
    const fe = elements.find(e => e.id === w.fromElementId);
    const te = elements.find(e => e.id === w.toElementId);
    if (!fe || !te) return false;
    return (fe.roomId === room.id || te.roomId === room.id) && fe.roomId !== te.roomId;
  });

  return (
    <svg
      ref={svgRef}
      viewBox="0 0 1200 800"
      preserveAspectRatio="xMidYMid meet"
      style={{ width:"100%", height:"100%", background:`linear-gradient(135deg, ${s.f}18 0%, #dce8f5 100%)`, userSelect:"none", cursor:pendingWireFrom ? "crosshair" : "default" }}
      onMouseMove={e => {
        const p = svgXY(e.clientX, e.clientY);
        setMouse(p);
        if (dragRef.current) setDragPos({ id:dragRef.current.id, x:snap(p.x - dragRef.current.offX), y:snap(p.y - dragRef.current.offY) });
      }}
      onMouseUp={() => {
        if (dragRef.current && dragPos) onElementMove(dragPos.id, dragPos.x, dragPos.y);
        dragRef.current = null; setDragPos(null);
      }}
      onMouseLeave={() => { dragRef.current = null; setDragPos(null); }}
      onClick={e => {
        if (dragPos) return;
        const tag = (e.target as SVGElement).tagName;
        if (["svg","rect","polygon","line"].includes(tag)) onCanvasClick();
      }}
      onDragOver={(e: DragEvent<SVGSVGElement>) => e.preventDefault()}
      onDrop={(e: DragEvent<SVGSVGElement>) => {
        e.preventDefault();
        const type = e.dataTransfer.getData("elemType") as ElementType;
        if (!type) return;
        const p = svgXY(e.clientX, e.clientY);
        onDrop(type, snap(p.x), snap(p.y));
      }}
    >
      <defs>
        <pattern id="bpG2" width="24" height="24" patternUnits="userSpaceOnUse">
          <path d="M 24 0 L 0 0 0 24" fill="none" stroke="#a8bcd4" strokeWidth="0.3" opacity="0.4"/>
        </pattern>
        <radialGradient id="lPool" cx="50%" cy="50%">
          <stop offset="0%" stopColor="#fff8c0" stopOpacity="1"/>
          <stop offset="60%" stopColor="#ffd050" stopOpacity="0.5"/>
          <stop offset="100%" stopColor="#ffb020" stopOpacity="0"/>
        </radialGradient>
        <filter id="lglow" x="-60%" y="-60%" width="220%" height="220%">
          <feGaussianBlur stdDeviation="12" result="b"/>
          <feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge>
        </filter>
        <filter id="elSh"><feDropShadow dx="2" dy="4" stdDeviation="4" floodColor="#6a5030" floodOpacity="0.25"/></filter>
        <marker id="wArr" markerWidth="8" markerHeight="6" refX="8" refY="3" orient="auto">
          <polygon points="0 0,8 3,0 6" fill="#f59e0b"/>
        </marker>
      </defs>

      <rect width="1200" height="800" fill="url(#bpG2)"/>
      <polygon points={polyPts([fTL,fTR,fBR,fBL])} fill={s.f} stroke={s.f2} strokeWidth="1.2"/>
      {planks}
      <polygon points={polyPts([fTL,fBL,cBL,cTL])} fill={s.w} stroke={s.wd} strokeWidth="1"/>
      <polygon points={polyPts([fTL,fTR,cTR,cTL])} fill={s.ws} stroke={s.wd} strokeWidth="1"/>
      <line x1={cTL.sx} y1={cTL.sy} x2={cTR.sx} y2={cTR.sy} stroke={s.wd} strokeWidth="2.5"/>
      <line x1={cTL.sx} y1={cTL.sy} x2={cBL.sx} y2={cBL.sy} stroke={s.wd} strokeWidth="2.5"/>
      <text x="600" y="36" textAnchor="middle" fontSize="11" fill={s.lbl} fontFamily="Georgia,serif" letterSpacing="0.2em" opacity="0.5">
        {room.name.toUpperCase()}
      </text>
      <text x="600" y="54" textAnchor="middle" fontSize="7.5" fill={s.lbl} fontFamily="monospace" opacity="0.35">
        Arrastra · Doble clic = cable · ESC = cancelar
      </text>

      {/* Same-room wires */}
      {wires.map(w => {
        const fe = elements.find(e => e.id === w.fromElementId);
        const te = elements.find(e => e.id === w.toElementId);
        if (!fe || !te) return null;
        if (fe.roomId !== room.id || te.roomId !== room.id) return null;
        const circ = circuits.find(c => c.id === w.circuitId);
        const color = w.isGroundWire ? "#22c55e" : (circ?.color ?? "#6b7280");
        const active = activeWires.has(w.id);
        const fx = dragPos?.id === fe.id ? dragPos.x : fe.x;
        const fy = dragPos?.id === fe.id ? dragPos.y : fe.y;
        const tx = dragPos?.id === te.id ? dragPos.x : te.x;
        const ty = dragPos?.id === te.id ? dragPos.y : te.y;
        return <AnimatedWire key={w.id} d={wirePath(fx,fy,tx,ty)} color={color} active={active} onClick={() => {}}/>;
      })}

      {/* Cross-room wires */}
      {crossWires.map(w => {
        const fe = elements.find(e => e.id === w.fromElementId);
        const te = elements.find(e => e.id === w.toElementId);
        if (!fe || !te) return null;
        const localEl = fe.roomId === room.id ? fe : te;
        const remoteEl = fe.roomId === room.id ? te : fe;
        const remoteRoom = rooms.find(r => r.id === remoteEl.roomId);
        const lx = dragPos?.id === localEl.id ? dragPos.x : localEl.x;
        const ly = dragPos?.id === localEl.id ? dragPos.y : localEl.y;
        const circ = circuits.find(c => c.id === w.circuitId);
        const color = w.isGroundWire ? "#22c55e" : (circ?.color ?? "#6b7280");
        const active = activeWires.has(w.id);
        const edgeX = lx < 600 ? 80 : 1120;
        return (
          <g key={w.id}>
            <AnimatedWire d={wirePath(lx,ly,edgeX,ly)} color={color} active={active} dashed onClick={() => {}}/>
            <rect x={lx<600?42:1070} y={ly-14} width={60} height={28} rx={5} fill={active?color:"#334155"} opacity="0.9"/>
            <text x={lx<600?72:1100} y={ly+1} textAnchor="middle" dominantBaseline="central" fontSize="9" fill="white" fontFamily="monospace" style={{ pointerEvents:"none" }}>
              {ELEMENT_ICONS[remoteEl.type]} {remoteRoom?.name ?? "?"}
            </text>
          </g>
        );
      })}

      {/* Pending wire preview */}
      {pendingWireFrom && pendingFromEl && (
        <>
          <path d={wirePath(pfx,pfy,mouse.x,mouse.y)} fill="none" stroke="#f59e0b" strokeWidth="2.5" strokeDasharray="12 6" opacity="0.9" markerEnd="url(#wArr)"/>
          <circle cx={pfx} cy={pfy} r="7" fill="#f59e0b" opacity="0.2">
            <animate attributeName="r" values="5;15;5" dur="0.9s" repeatCount="indefinite"/>
          </circle>
          <g onClick={(e: RMouseEvent<SVGGElement>) => { e.stopPropagation(); onCrossRoomWire(); }} style={{ cursor:"pointer" }}>
            <rect x="460" y="742" width="280" height="34" rx="8" fill="rgba(74,158,255,0.1)" stroke="#4a9eff" strokeWidth="1.5"/>
            <text x="600" y="760" textAnchor="middle" dominantBaseline="central" fontSize="11" fill="#4a9eff" fontFamily="monospace" style={{ pointerEvents:"none" }}>
              ⌁ Conectar a otra habitación
            </text>
          </g>
        </>
      )}

      {/* Elements */}
      {roomEls.map(el => {
        const powered = isPowered(el, elements, wires, circuits);
        const isSel = selectedElId === el.id;
        const isPSrc = pendingWireFrom === el.id;
        const isTgt = !!pendingWireFrom && pendingWireFrom !== el.id;
        const color = circColor(el);
        const ex = dragPos?.id === el.id ? dragPos.x : el.x;
        const ey = dragPos?.id === el.id ? dragPos.y : el.y;
        const isDrag = dragPos?.id === el.id;
        const R = 30;

        const hasCross = wires.some(w => {
          if (w.fromElementId !== el.id && w.toElementId !== el.id) return false;
          const fe = elements.find(e => e.id === w.fromElementId);
          const te = elements.find(e => e.id === w.toElementId);
          return !!(fe && te && fe.roomId !== te.roomId);
        });

        return (
          <g
            key={el.id}
            transform={`translate(${ex},${ey})`}
            style={{ cursor: pendingWireFrom ? "crosshair" : isDrag ? "grabbing" : "grab" }}
            filter={isSel || isPSrc || isDrag ? "url(#elSh)" : undefined}
            onMouseDown={(e: RMouseEvent<SVGGElement>) => {
              e.stopPropagation();
              if (pendingWireFrom) return;
              const p = svgXY(e.clientX, e.clientY);
              dragRef.current = { id:el.id, offX:p.x - el.x, offY:p.y - el.y };
            }}
            onClick={(e: RMouseEvent<SVGGElement>) => {
              e.stopPropagation();
              if (isDrag) return;
              if (pendingWireFrom && pendingWireFrom !== el.id) onWireConnect(el.id);
              else onElementClick(el.id, false);
            }}
            onDoubleClick={(e: RMouseEvent<SVGGElement>) => {
              e.stopPropagation();
              onElementClick(el.id, true);
            }}
          >
            {powered && el.type === "light" && (
              <>
                <ellipse cx={0} cy={15} rx={110} ry={65} fill="url(#lPool)" opacity="0.65" filter="url(#lglow)"/>
                <ellipse cx={0} cy={6} rx={32} ry={20} fill="rgba(255,255,200,0.8)"/>
              </>
            )}
            {powered && <circle r={R+14} fill="none" stroke={color} strokeWidth="2" opacity="0.25" filter="url(#lglow)"/>}
            <ellipse cx={0} cy={isDrag?18:8} rx={R+6} ry={(R+6)*0.4} fill="rgba(0,0,0,0.2)"/>
            {isTgt && <circle r={R+16} fill="rgba(245,158,11,0.06)" stroke="#f59e0b" strokeWidth="2" strokeDasharray="5 3"/>}
            {isSel && !isPSrc && <circle r={R+10} fill="none" stroke="#f59e0b" strokeWidth="2.5"/>}
            {isPSrc && <circle r={R+11} fill="rgba(245,158,11,0.1)" stroke="#f59e0b" strokeWidth="2.5"/>}
            {hasCross && (
              <g transform={`translate(${-R*0.72},${-R*1.1})`}>
                <circle r="8" fill="#4a9eff" stroke="white" strokeWidth="1.5"/>
                <text textAnchor="middle" dominantBaseline="central" fontSize="10" fill="white" style={{ pointerEvents:"none" }}>⌁</text>
              </g>
            )}
            <circle r={R} fill={powered && el.type==="light" ? "#fffce8" : "white"} stroke={isPSrc || isSel ? "#f59e0b" : color} strokeWidth={isSel || isPSrc ? 3.5 : 2.5}/>
            <text y={5} textAnchor="middle" fontSize="22" style={{ pointerEvents:"none", userSelect:"none" }}>{ELEMENT_ICONS[el.type]}</text>
            <text y={R+16} textAnchor="middle" fontSize="9" fill={isSel?"#6a4a10":"#706050"} fontFamily="monospace" style={{ pointerEvents:"none", userSelect:"none" }}>{el.label}</text>
            {powered && (
              <g transform={`translate(${R*0.72},${-R*0.72})`}>
                <circle r="10" fill="#22c55e" stroke="white" strokeWidth="2"/>
                <text textAnchor="middle" dominantBaseline="central" fontSize="11" fill="white" style={{ pointerEvents:"none" }}>✓</text>
              </g>
            )}
            {el.isGrounded && (
              <g transform={`translate(${-R*0.72},${-R*0.72})`}>
                <circle r="9" fill="#16a34a" stroke="white" strokeWidth="1.5"/>
                <text textAnchor="middle" dominantBaseline="central" fontSize="10" fill="white" style={{ pointerEvents:"none" }}>⏚</text>
              </g>
            )}
            {el.circuitId && <circle cx={R*0.72} cy={R*0.72} r="6" fill={color} stroke="white" strokeWidth="1.2"/>}
          </g>
        );
      })}

      {roomEls.length === 0 && (
        <text x="600" y="450" textAnchor="middle" fontSize="15" fill={s.lbl} opacity="0.35" fontFamily="Georgia,serif">
          Arrastra componentes eléctricos al piso
        </text>
      )}
    </svg>
  );
}

// ─── Main App ──────────────────────────────────────────────────────────────────

export default function HouseSimulator() {
  const [state, setState] = useState<AppState>(INITIAL);
  const [pwf, setPWF] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<"elements" | "circuits" | "panel">("elements");
  const [ncn, setNcn] = useState<string>("");
  const [nct, setNct] = useState<CircuitType>("lighting");
  const [showRoomMgr, setShowRoomMgr] = useState(false);
  const [showCrossRoom, setShowCrossRoom] = useState(false);

  const errors  = useMemo(() => validateInstallation(state), [state]);
  const score   = useMemo(() => getScore(errors), [errors]);
  const room    = state.selectedRoomId
    ? (state.rooms.find(r => r.id === state.selectedRoomId) ?? null)
    : null;
  const selEl   = state.elements.find(e => e.id === state.selectedElementId) ?? null;
  const panelEls = state.elements.filter(e =>
    (["panel_breaker","panel_differential"] as ElementType[]).includes(e.type),
  );
  const activeWiresSet = useMemo(
    () => getActiveWires(state.elements, state.wires, state.circuits),
    [state],
  );

  const go = useCallback((id: string): void => {
    setState(s => ({ ...s, selectedRoomId:id, viewTarget:"interior", selectedElementId:null }));
    setPWF(null);
  }, []);

  const back = useCallback((): void => {
    setState(s => ({ ...s, selectedRoomId:null, viewTarget:"exterior", selectedElementId:null }));
    setPWF(null);
  }, []);

  const drop = useCallback((type: ElementType, x: number, y: number, roomId: string | null): void => {
    setState(s => ({
      ...s,
      elements: [...s.elements, {
        id: uid(), type, roomId, x, y,
        circuitId: null,
        label: ELEMENT_LABELS[type],
        isOn: false, isGrounded: false,
        rating: (["panel_breaker","panel_differential"] as ElementType[]).includes(type) ? 20 : undefined,
      }],
    }));
  }, []);

  const move = useCallback((id: string, x: number, y: number): void => {
    setState(s => ({ ...s, elements: s.elements.map(e => e.id === id ? { ...e, x, y } : e) }));
  }, []);

  const elClick = useCallback((id: string, wire: boolean): void => {
    if (wire) {
      setPWF(p => p === id ? null : id);
      setState(s => ({ ...s, selectedElementId: id }));
    } else if (!pwf) {
      setState(s => ({ ...s, selectedElementId: s.selectedElementId === id ? null : id }));
    }
  }, [pwf]);

  const connect = useCallback((toId: string): void => {
    if (!pwf || pwf === toId) { setPWF(null); return; }
    const fe = state.elements.find(e => e.id === pwf);
    const te = state.elements.find(e => e.id === toId);
    if (!fe || !te) { setPWF(null); return; }
    const cid = fe.circuitId ?? te.circuitId ?? "";
    const gnd = fe.type === "ground_rod" || te.type === "ground_rod";
    setState(s => ({
      ...s,
      wires: [...s.wires, { id:uid(), fromElementId:pwf, toElementId:toId, circuitId:cid, isGroundWire:gnd, path:[] }],
      elements: gnd
        ? s.elements.map(e => (e.id === toId || e.id === pwf) ? { ...e, isGrounded:true } : e)
        : s.elements,
    }));
    setPWF(null);
  }, [pwf, state.elements]);

  const handleCrossRoomConnect = useCallback((toId: string): void => {
    if (!pwf || pwf === toId) { setShowCrossRoom(false); return; }
    const fe = state.elements.find(e => e.id === pwf);
    const te = state.elements.find(e => e.id === toId);
    if (!fe || !te) { setPWF(null); setShowCrossRoom(false); return; }
    const cid = fe.circuitId ?? te.circuitId ?? "";
    const gnd = fe.type === "ground_rod" || te.type === "ground_rod";
    setState(s => ({
      ...s,
      wires: [...s.wires, { id:uid(), fromElementId:pwf, toElementId:toId, circuitId:cid, isGroundWire:gnd, path:[] }],
      elements: gnd
        ? s.elements.map(e => (e.id === toId || e.id === pwf) ? { ...e, isGrounded:true } : e)
        : s.elements,
    }));
    setPWF(null); setShowCrossRoom(false);
  }, [pwf, state.elements]);

  const delEl = useCallback((id: string): void => {
    setState(s => ({
      ...s,
      elements: s.elements.filter(e => e.id !== id),
      wires: s.wires.filter(w => w.fromElementId !== id && w.toElementId !== id),
      selectedElementId: s.selectedElementId === id ? null : s.selectedElementId,
    }));
    if (pwf === id) setPWF(null);
  }, [pwf]);

  const delWire = useCallback((id: string): void => {
    setState(s => ({ ...s, wires: s.wires.filter(w => w.id !== id) }));
  }, []);

  const mkCircuit = useCallback((): void => {
    if (!ncn.trim()) return;
    setState(s => ({
      ...s,
      circuits: [...s.circuits, {
        id: uid(), name: ncn.trim(), type: nct,
        color: CIRCUIT_COLORS[nct],
        breakerId: null, elementIds: [], isProtected: false, hasGround: false,
      }],
    }));
    setNcn("");
  }, [ncn, nct]);

  const assignCircuit = useCallback((eid: string, cid: string): void => {
    setState(s => ({
      ...s,
      elements: s.elements.map(e => e.id === eid ? { ...e, circuitId:cid } : e),
      circuits: s.circuits.map(c => c.id === cid
        ? { ...c, elementIds: c.elementIds.includes(eid) ? c.elementIds : [...c.elementIds, eid] }
        : c),
      wires: s.wires.map(w =>
        (w.fromElementId === eid || w.toElementId === eid) && !w.circuitId
          ? { ...w, circuitId:cid } : w,
      ),
    }));
  }, []);

  const delCircuit = useCallback((id: string): void => {
    setState(s => ({
      ...s,
      circuits: s.circuits.filter(c => c.id !== id),
      elements: s.elements.map(e => e.circuitId === id ? { ...e, circuitId:null } : e),
      wires: s.wires.map(w => w.circuitId === id ? { ...w, circuitId:"" } : w),
    }));
  }, []);

  const assignBreaker = useCallback((cid: string, bid: string): void => {
    setState(s => ({
      ...s,
      circuits: s.circuits.map(c => c.id === cid ? { ...c, breakerId:bid, isProtected:true } : c),
    }));
  }, []);

  const toggleGnd = useCallback((id: string): void => {
    setState(s => ({ ...s, elements: s.elements.map(e => e.id === id ? { ...e, isGrounded:!e.isGrounded } : e) }));
  }, []);

  const toggleEl = useCallback((id: string): void => {
    setState(s => ({ ...s, elements: s.elements.map(e => e.id === id ? { ...e, isOn:!e.isOn } : e) }));
  }, []);

  const saveRooms = useCallback((newRooms: Room[]): void => {
    const valid = new Set(newRooms.map(r => r.id));
    setState(s => ({
      ...s,
      rooms: newRooms,
      elements: s.elements.filter(e => !e.roomId || valid.has(e.roomId)),
      wires: s.wires.filter(w => {
        const fe = s.elements.find(e => e.id === w.fromElementId);
        const te = s.elements.find(e => e.id === w.toElementId);
        return (!fe?.roomId || valid.has(fe.roomId)) && (!te?.roomId || valid.has(te.roomId));
      }),
      selectedRoomId: s.selectedRoomId && !valid.has(s.selectedRoomId) ? null : s.selectedRoomId,
      viewTarget: s.selectedRoomId && !valid.has(s.selectedRoomId) ? "exterior" : s.viewTarget,
    }));
    setShowRoomMgr(false);
  }, []);

  useEffect(() => {
    const h = (e: KeyboardEvent): void => {
      if (e.key === "Escape") {
        setPWF(null); setShowCrossRoom(false);
        setState(s => ({ ...s, selectedElementId:null }));
      }
    };
    window.addEventListener("keydown", h);
    return () => window.removeEventListener("keydown", h);
  }, []);

  const U = {
    bg:"#080e1a", side:"#060c18", bdr:"#1a2840",
    txt:"#94a3b8", dim:"#3a5070", acc:"#4a9eff",
    accBg:"rgba(74,158,255,0.08)",
  };
  const scoreColor = score >= 80 ? "#22c55e" : score >= 60 ? "#f59e0b" : "#ef4444";
  const fromEl = pwf ? (state.elements.find(e => e.id === pwf) ?? null) : null;

  const tabStyle = (t: "elements" | "circuits" | "panel"): CSSProperties => ({
    flex:1, padding:"8px 0",
    background: activeTab === t ? U.accBg : "transparent",
    border: "none",
    borderBottom: activeTab === t ? `2px solid ${U.acc}` : "2px solid transparent",
    color: activeTab === t ? U.acc : U.dim,
    fontSize:8, cursor:"pointer", fontFamily:"monospace",
  });

  return (
    <div style={{ display:"flex", height:"100vh", background:U.bg, fontFamily:"Georgia,serif", overflow:"hidden" }}>

      {showRoomMgr && (
        <RoomManager rooms={state.rooms} onClose={() => setShowRoomMgr(false)} onSave={saveRooms}/>
      )}
      {showCrossRoom && fromEl && (
        <CrossRoomSelector
          fromEl={fromEl} elements={state.elements} rooms={state.rooms} circuits={state.circuits}
          onConnect={handleCrossRoomConnect}
          onCancel={() => { setShowCrossRoom(false); setPWF(null); }}
        />
      )}

      {/* ── Left Palette ── */}
      <aside style={{ width:210, background:U.side, borderRight:`1px solid ${U.bdr}`, display:"flex", flexDirection:"column", overflowY:"auto", flexShrink:0 }}>
        <div style={{ padding:"14px 13px 9px", borderBottom:`1px solid ${U.bdr}` }}>
          <div style={{ fontSize:9, color:U.acc, letterSpacing:"0.18em", fontFamily:"monospace", fontWeight:"bold" }}>⚡ SIMULADOR ELÉCTRICO</div>
          <div style={{ fontSize:7, color:U.dim, marginTop:3, fontFamily:"monospace" }}>Residencial · RF-06 a RF-10</div>
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
            <button key={t} onClick={() => setActiveTab(t)} style={tabStyle(t)}>
              {t === "elements" ? "ELEM" : t === "circuits" ? "CIRC" : "PANEL"}
            </button>
          ))}
        </div>

        {activeTab === "elements" && PALETTE_GROUPS.map(g => (
          <div key={g.cat}>
            <div style={{ padding:"7px 13px 3px", fontSize:7, color:U.dim, textTransform:"uppercase", letterSpacing:"0.12em", fontFamily:"monospace" }}>{g.cat}</div>
            {g.items.map(t => (
              <div
                key={t} draggable
                onDragStart={(e: DragEvent<HTMLDivElement>) => e.dataTransfer.setData("elemType", t)}
                style={{ display:"flex", alignItems:"center", gap:9, padding:"6px 13px", cursor:"grab", borderRadius:7, margin:"2px 6px", transition:"all 0.15s", userSelect:"none", border:"1px solid transparent" }}
                onMouseEnter={e => { e.currentTarget.style.background = U.accBg; e.currentTarget.style.borderColor = "#e0c890"; }}
                onMouseLeave={e => { e.currentTarget.style.background = "transparent"; e.currentTarget.style.borderColor = "transparent"; }}
              >
                <div style={{ width:34, height:34, display:"flex", alignItems:"center", justifyContent:"center", background:"rgba(255,255,255,0.04)", borderRadius:5, flexShrink:0, fontSize:20 }}>
                  {ELEMENT_ICONS[t]}
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
              onKeyDown={(e: React.KeyboardEvent<HTMLInputElement>) => { if (e.key === "Enter") mkCircuit(); }}
              placeholder="Ej: Luces Sala"
              style={{ width:"100%", background:"rgba(255,255,255,0.06)", border:`1px solid ${U.bdr}`, borderRadius:5, color:U.txt, fontSize:9, padding:"5px 8px", outline:"none", boxSizing:"border-box", fontFamily:"monospace", marginBottom:6 }}
            />
            <select
              value={nct}
              onChange={e => setNct(e.target.value as CircuitType)}
              style={{ width:"100%", background:"rgba(255,255,255,0.06)", border:`1px solid ${U.bdr}`, borderRadius:5, color:U.txt, fontSize:9, padding:"4px 6px", outline:"none", boxSizing:"border-box", fontFamily:"monospace", marginBottom:8 }}
            >
              <option value="lighting">Iluminación</option>
              <option value="outlet">Tomacorrientes</option>
              <option value="ground">Tierra</option>
            </select>
            <button onClick={mkCircuit} style={{ width:"100%", background:U.accBg, border:`1px solid ${U.acc}`, borderRadius:5, color:U.acc, fontSize:9, padding:"6px", cursor:"pointer", fontFamily:"monospace" }}>
              + Crear Circuito
            </button>
            <div style={{ marginTop:13, fontSize:8, color:U.dim, marginBottom:5, fontFamily:"monospace" }}>ACTIVOS ({state.circuits.length})</div>
            {state.circuits.map(c => (
              <div key={c.id} style={{ background:"rgba(255,255,255,0.03)", border:`1px solid ${c.color}44`, borderRadius:6, padding:"7px 10px", marginBottom:5, borderLeft:`3px solid ${c.color}` }}>
                <div style={{ display:"flex", alignItems:"center", gap:5, marginBottom:2 }}>
                  <div style={{ width:7, height:7, borderRadius:"50%", background:c.color }}/>
                  <span style={{ fontSize:9, color:U.txt }}>{c.name}</span>
                </div>
                <div style={{ fontSize:7, color:U.dim, fontFamily:"monospace" }}>
                  {c.type} · {c.elementIds.length} elem · {c.breakerId ? "✓ prot." : "sin prot."}
                </div>
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
            {state.circuits.length === 0 && (
              <div style={{ color:"#94a3b8", textAlign:"center", padding:"16px 0", fontSize:8, fontFamily:"monospace" }}>Crea circuitos primero</div>
            )}
            {state.circuits.map(c => (
              <div key={c.id} style={{ background:"rgba(255,255,255,0.03)", border:`1px solid ${U.bdr}`, borderRadius:6, padding:"8px", marginBottom:6 }}>
                <div style={{ fontSize:9, color:U.txt, marginBottom:4, display:"flex", alignItems:"center", gap:5 }}>
                  <div style={{ width:8, height:8, borderRadius:"50%", background:c.color }}/>{c.name}
                </div>
                <select
                  value={c.breakerId ?? ""}
                  onChange={e => assignBreaker(c.id, e.target.value)}
                  style={{ width:"100%", background:"rgba(255,255,255,0.05)", border:`1px solid ${U.bdr}`, borderRadius:5, color:U.txt, fontSize:8, padding:"3px 5px", fontFamily:"monospace" }}
                >
                  <option value="">Sin interruptor</option>
                  {panelEls.filter(e => e.type === "panel_breaker").map(br => (
                    <option key={br.id} value={br.id}>{br.label} ({br.rating ?? 20}A)</option>
                  ))}
                </select>
                {c.breakerId && (
                  <div style={{ marginTop:4, fontSize:7, color:"#22c55e", fontFamily:"monospace" }}>✓ Protegido · Electrones activos</div>
                )}
              </div>
            ))}
          </div>
        )}

        <div style={{ padding:"10px 13px", borderTop:`1px solid ${U.bdr}` }}>
          <div style={{ fontSize:7, color:U.dim, fontFamily:"monospace", marginBottom:5 }}>PUNTUACIÓN</div>
          <div style={{ display:"flex", alignItems:"center", gap:8 }}>
            <div style={{ flex:1, height:6, background:"#0a1428", borderRadius:3, overflow:"hidden" }}>
              <div style={{ width:`${score}%`, height:"100%", background:scoreColor, borderRadius:3, transition:"width 0.4s" }}/>
            </div>
            <span style={{ fontSize:11, fontWeight:"bold", color:scoreColor, fontFamily:"monospace", minWidth:30, textAlign:"right" }}>{score}</span>
          </div>
        </div>

        <div style={{ padding:"8px 13px", borderTop:`1px solid ${U.bdr}` }}>
          <button
            onClick={() => { setState(INITIAL); setPWF(null); }}
            style={{ width:"100%", background:"transparent", border:`1px solid ${U.bdr}`, color:U.dim, fontSize:8, fontFamily:"monospace", padding:"6px", borderRadius:6, cursor:"pointer" }}
            onMouseEnter={e => { e.currentTarget.style.borderColor = "#ef4444"; e.currentTarget.style.color = "#ef4444"; }}
            onMouseLeave={e => { e.currentTarget.style.borderColor = U.bdr; e.currentTarget.style.color = U.dim; }}
          >
            🗑 LIMPIAR TODO
          </button>
        </div>
      </aside>

      {/* ── Main Canvas ── */}
      <div style={{ flex:1, position:"relative", overflow:"hidden" }}>
        <div style={{ position:"absolute", top:0, left:0, right:0, height:47, background:"rgba(248,244,237,0.97)", backdropFilter:"blur(8px)", borderBottom:"1px solid #d4c8b0", display:"flex", alignItems:"center", padding:"0 16px", gap:12, zIndex:60 }}>
          {state.viewTarget === "interior" && (
            <button onClick={back} style={{ background:"rgba(74,158,255,0.08)", border:"1px solid #4a9eff", color:"#4a9eff", fontSize:10, padding:"4px 16px", borderRadius:7, cursor:"pointer", fontFamily:"monospace" }}>
              ← Vista General
            </button>
          )}
          <div style={{ fontSize:11, color:U.dim, fontFamily:"monospace" }}>
            {state.viewTarget === "interior" && room
              ? `📐 ${room.name.toUpperCase()} — Instalación eléctrica`
              : "📐 PLANTA — Clic en habitación para instalar"}
          </div>
          {state.circuits.filter(c => c.breakerId).length > 0 && (
            <div style={{ marginLeft:"auto", display:"flex", alignItems:"center", gap:6, background:"rgba(34,197,94,0.1)", border:"1px solid rgba(34,197,94,0.4)", padding:"3px 10px", borderRadius:12 }}>
              <span style={{ width:6, height:6, borderRadius:"50%", background:"#22c55e", display:"inline-block" }}/>
              <span style={{ fontSize:8, color:"#22c55e", fontFamily:"monospace" }}>
                {state.circuits.filter(c => c.breakerId).length} circuitos energizados
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
          {state.viewTarget === "exterior" ? (
            <HouseView
              rooms={state.rooms} onRoomClick={go}
              allElements={state.elements} allWires={state.wires} circuits={state.circuits}
              panelEls={panelEls} selectedElId={state.selectedElementId}
              onElementClick={id => setState(s => ({ ...s, selectedElementId: s.selectedElementId === id ? null : id }))}
              onPanelDrop={t => drop(t, 0, 0, null)}
            />
          ) : room ? (
            <RoomView
              room={room} elements={state.elements} wires={state.wires}
              circuits={state.circuits} rooms={state.rooms}
              onDrop={(t, x, y) => drop(t, x, y, room.id)}
              onElementClick={elClick} onElementMove={move}
              onWireConnect={connect} selectedElId={state.selectedElementId}
              pendingWireFrom={pwf}
              onCanvasClick={() => { if (pwf) setPWF(null); else setState(s => ({ ...s, selectedElementId:null })); }}
              onCrossRoomWire={() => setShowCrossRoom(true)}
              onToggle={toggleEl}
            />
          ) : null}
        </div>

        <ValidationPanel errors={errors} score={score}/>
      </div>

      {/* ── Right Properties ── */}
      <aside style={{ width:216, background:U.side, borderLeft:`1px solid ${U.bdr}`, display:"flex", flexDirection:"column", overflowY:"auto", flexShrink:0 }}>
        <div style={{ padding:"12px 13px", borderBottom:`1px solid ${U.bdr}` }}>
          <div style={{ fontSize:8, color:U.dim, letterSpacing:"0.15em", fontFamily:"monospace" }}>PROPIEDADES</div>
        </div>

        {selEl ? (
          <div style={{ padding:"12px 13px" }}>
            <div style={{ display:"flex", justifyContent:"center", marginBottom:10, background:"rgba(255,255,255,0.03)", border:`1px solid ${U.bdr}`, borderRadius:8, padding:10, fontSize:40 }}>
              {ELEMENT_ICONS[selEl.type]}
            </div>
            <div style={{ fontSize:9, color:U.acc, background:U.accBg, padding:"3px 8px", borderRadius:5, display:"inline-flex", alignItems:"center", marginBottom:10, fontFamily:"monospace", border:`1px solid ${U.acc}44` }}>
              {selEl.type.toUpperCase()}
            </div>

            {(["light","fan","smoke_detector","outlet"] as ElementType[]).includes(selEl.type) && (() => {
              const on = isPowered(selEl, state.elements, state.wires, state.circuits);
              return (
                <div style={{ marginBottom:10, padding:"6px 10px", background:on?"rgba(34,197,94,0.1)":"rgba(239,68,68,0.07)", border:`1px solid ${on?"#22c55e":"#ef4444"}`, borderRadius:6 }}>
                  <div style={{ fontSize:9, color:on?"#22c55e":"#ef4444", fontFamily:"monospace", fontWeight:"bold" }}>{on ? "✓ ALIMENTADO" : "✗ Sin alimentación"}</div>
                  <div style={{ fontSize:7, color:U.dim, fontFamily:"monospace", marginTop:2 }}>
                    {on ? "Electrones fluyendo" : "Necesita: circuito + interruptor + cable"}
                  </div>
                </div>
              );
            })()}

            <div style={{ marginBottom:9 }}>
              <div style={{ fontSize:8, color:U.dim, marginBottom:3, fontFamily:"monospace" }}>Etiqueta</div>
              <input
                value={selEl.label}
                onChange={e => setState(s => ({ ...s, elements: s.elements.map(el => el.id === selEl.id ? { ...el, label:e.target.value } : el) }))}
                style={{ width:"100%", background:"rgba(255,255,255,0.06)", border:`1px solid ${U.bdr}`, borderRadius:5, color:U.txt, fontSize:10, padding:"4px 7px", outline:"none", boxSizing:"border-box", fontFamily:"monospace" }}
              />
            </div>

            {(["panel_breaker","panel_differential"] as ElementType[]).includes(selEl.type) && (
              <div style={{ marginBottom:9 }}>
                <div style={{ fontSize:8, color:U.dim, marginBottom:3, fontFamily:"monospace" }}>Calibre (A)</div>
                <input
                  type="number"
                  value={selEl.rating ?? 20}
                  onChange={e => setState(s => ({ ...s, elements: s.elements.map(el => el.id === selEl.id ? { ...el, rating:Number(e.target.value) } : el) }))}
                  style={{ width:"100%", background:"rgba(255,255,255,0.06)", border:`1px solid ${U.bdr}`, borderRadius:5, color:U.acc, fontSize:12, padding:"4px 7px", outline:"none", boxSizing:"border-box", fontFamily:"monospace" }}
                />
              </div>
            )}

            {!(["panel_breaker","panel_differential"] as ElementType[]).includes(selEl.type) && (
              <div style={{ marginBottom:9 }}>
                <div style={{ fontSize:8, color:U.dim, marginBottom:3, fontFamily:"monospace" }}>Circuito</div>
                <select
                  value={selEl.circuitId ?? ""}
                  onChange={e => { if (e.target.value) assignCircuit(selEl.id, e.target.value); }}
                  style={{ width:"100%", background:"rgba(255,255,255,0.06)", border:`1px solid ${U.bdr}`, borderRadius:5, color:U.txt, fontSize:9, padding:"4px 6px", outline:"none", boxSizing:"border-box", fontFamily:"monospace" }}
                >
                  <option value="">Sin circuito</option>
                  {state.circuits.map(c => <option key={c.id} value={c.id} style={{ background:"#0a1428" }}>{c.name}</option>)}
                </select>
              </div>
            )}

            {(["switch","smoke_detector"] as ElementType[]).includes(selEl.type) && (
              <button
                onClick={() => toggleEl(selEl.id)}
                style={{ width:"100%", marginBottom:7, background:selEl.isOn?"rgba(34,197,94,0.1)":"rgba(239,68,68,0.07)", border:`1px solid ${selEl.isOn?"#22c55e":"#ef4444"}`, color:selEl.isOn?"#22c55e":"#ef4444", fontSize:9, padding:"5px", borderRadius:6, cursor:"pointer", fontFamily:"monospace" }}
              >
                {selEl.isOn ? "● ON → clic para apagar" : "○ OFF → clic para encender"}
              </button>
            )}

            {(["outlet","light"] as ElementType[]).includes(selEl.type) && (
              <button
                onClick={() => toggleGnd(selEl.id)}
                style={{ width:"100%", marginBottom:7, background:selEl.isGrounded?"rgba(34,197,94,0.1)":"transparent", border:`1px solid ${selEl.isGrounded?"#22c55e":U.bdr}`, color:selEl.isGrounded?"#22c55e":U.dim, fontSize:9, padding:"5px", borderRadius:6, cursor:"pointer", fontFamily:"monospace" }}
              >
                {selEl.isGrounded ? "⏚ CON TIERRA ✓" : "⏚ Marcar con tierra"}
              </button>
            )}

            {state.viewTarget === "interior" && (
              <button
                onClick={() => setPWF(p => p === selEl.id ? null : selEl.id)}
                style={{ width:"100%", marginBottom:7, background:pwf===selEl.id?U.accBg:"transparent", border:`1px solid ${pwf===selEl.id?U.acc:U.bdr}`, color:pwf===selEl.id?U.acc:U.dim, fontSize:9, padding:"5px", borderRadius:6, cursor:"pointer", fontFamily:"monospace" }}
              >
                {pwf === selEl.id ? "● Esperando destino... (ESC)" : "⌁ Iniciar cable desde aquí"}
              </button>
            )}

            <button
              onClick={() => delEl(selEl.id)}
              style={{ width:"100%", background:"transparent", border:`1px solid ${U.bdr}`, color:U.dim, fontSize:9, padding:"5px", borderRadius:6, cursor:"pointer", fontFamily:"monospace" }}
              onMouseEnter={e => { e.currentTarget.style.color = "#ef4444"; e.currentTarget.style.borderColor = "#ef4444"; }}
              onMouseLeave={e => { e.currentTarget.style.color = U.dim; e.currentTarget.style.borderColor = U.bdr; }}
            >× Eliminar</button>

            {/* Cables list */}
            {(() => {
              const cw = state.wires.filter(w => w.fromElementId === selEl.id || w.toElementId === selEl.id);
              if (!cw.length) return null;
              return (
                <div style={{ marginTop:10 }}>
                  <div style={{ fontSize:8, color:U.dim, marginBottom:5, fontFamily:"monospace" }}>CABLES ({cw.length})</div>
                  {cw.map(w => {
                    const oid = w.fromElementId === selEl.id ? w.toElementId : w.fromElementId;
                    const other = state.elements.find(e => e.id === oid) ?? null;
                    const circ = state.circuits.find(c => c.id === w.circuitId) ?? null;
                    const isCross = other && other.roomId !== selEl.roomId;
                    const isAct = activeWiresSet.has(w.id);
                    return (
                      <div key={w.id} style={{ background:isAct?"rgba(34,197,94,0.07)":"rgba(255,255,255,0.02)", border:`1px solid ${isAct?"rgba(34,197,94,0.3)":isCross?"rgba(74,158,255,0.3)":U.bdr}`, borderLeft:`3px solid ${isAct?"#22c55e":isCross?"#4a9eff":(circ?.color ?? U.dim)}`, borderRadius:5, padding:"4px 8px", marginBottom:3, display:"flex", justifyContent:"space-between", alignItems:"center" }}>
                        <div>
                          <span style={{ fontSize:8, color:U.txt, fontFamily:"monospace" }}>
                            {other ? ELEMENT_ICONS[other.type] : "?"} {other?.label ?? "?"}
                          </span>
                          <div style={{ fontSize:7, color:isAct?"#22c55e":U.dim, fontFamily:"monospace" }}>
                            {isAct ? "⚡ activo" : ""}
                            {isCross ? ` ⌁ ${state.rooms.find(r => r.id === other?.roomId)?.name ?? "?"}` : ""}
                          </div>
                        </div>
                        <button onClick={() => delWire(w.id)} style={{ fontSize:8, color:"#ef4444", background:"none", border:"none", cursor:"pointer", padding:0 }}>✕</button>
                      </div>
                    );
                  })}
                </div>
              );
            })()}

            <MultimeterPanel selEl={selEl} elements={state.elements} wires={state.wires} circuits={state.circuits}/>
          </div>
        ) : (
          <div style={{ padding:"14px 13px", fontSize:9, color:U.dim, lineHeight:1.9, fontFamily:"monospace" }}>
            <div style={{ color:U.txt, marginBottom:10, fontSize:10 }}>Sin selección</div>
            <div style={{ color:U.txt }}>Interacciones:</div>
            <div>• Arrastra elemento → habitación</div>
            <div>• Doble clic → iniciar cable</div>
            <div>• ESC → cancelar cable</div>
            <div>• ⌁ → cable inter-habitación</div>
            <div style={{ color:U.txt, marginTop:8 }}>Electrones activos si:</div>
            <div>• Circuito creado</div>
            <div>• + Interruptor asignado</div>
            <div>• + Cable conectado</div>
          </div>
        )}

        {/* Summary */}
        <div style={{ marginTop:"auto", padding:"12px 13px", borderTop:`1px solid ${U.bdr}` }}>
          <div style={{ fontSize:7, color:U.dim, textTransform:"uppercase", marginBottom:8, letterSpacing:"0.12em", fontFamily:"monospace" }}>Resumen</div>
          {([
            { l:"Habitaciones",   v:state.rooms.length,                                                                                c:"#4a9eff" },
            { l:"Luminarias",     v:state.elements.filter(e => e.type === "light").length,                                             c:"#f59e0b" },
            { l:"  energizadas",  v:state.elements.filter(e => isPowered(e, state.elements, state.wires, state.circuits)).length,      c:"#22c55e" },
            { l:"Tomacorrientes", v:state.elements.filter(e => e.type === "outlet").length,                                            c:"#3b82f6" },
            { l:"Circuitos",      v:state.circuits.length,                                                                             c:"#8b5cf6" },
            { l:"  energizados",  v:state.circuits.filter(c => !!c.breakerId).length,                                                  c:"#22c55e" },
            { l:"Cables",         v:state.wires.length,                                                                                c:"#64748b" },
            { l:"  con corriente",v:activeWiresSet.size,                                                                               c:"#22c55e" },
          ] satisfies Array<{ l: string; v: number; c: string }>).map(r => (
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