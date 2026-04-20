// Archivo con simulador de oficinas industriales
"use client";

import { useState, useRef, useCallback, useEffect, useMemo } from "react";

// ─────────────────────────────────────────────────────────────────────────────
//  CONSTANTS
// ─────────────────────────────────────────────────────────────────────────────
const GRID = 20;
const snap = (v: number) => Math.round(v / GRID) * GRID;
let _id = 0;
const uid = () => `e${++_id}`;

// ─────────────────────────────────────────────────────────────────────────────
//  ELEMENT CATALOGUE
// ─────────────────────────────────────────────────────────────────────────────
const CATALOGUE = {
  // ── Estructura ──────────────────────────────────────────────────────────────
  room: {
    cat: "Estructura", label: "Habitación", color: "#3b82f6",
    w: 200, h: 160, isArea: true,
    desc: "Área / cuarto",
  },
  door: {
    cat: "Estructura", label: "Puerta", color: "#94a3b8",
    w: 40, h: 10, isArea: false,
    desc: "Acceso",
  },

  // ── Mobiliario ──────────────────────────────────────────────────────────────
  desk: {
    cat: "Mobiliario", label: "Escritorio", color: "#8b5cf6",
    w: 120, h: 60, isArea: false,
    desc: "Escritorio individual",
  },
  desk_l: {
    cat: "Mobiliario", label: "Escritorio L", color: "#7c3aed",
    w: 140, h: 100, isArea: false,
    desc: "Escritorio en L",
  },
  chair: {
    cat: "Mobiliario", label: "Silla", color: "#a78bfa",
    w: 40, h: 40, isArea: false,
    desc: "Silla de oficina",
  },
  shelf: {
    cat: "Mobiliario", label: "Estantería", color: "#6d28d9",
    w: 20, h: 100, isArea: false,
    desc: "Estantería / archivador",
  },
  meeting_table: {
    cat: "Mobiliario", label: "Mesa reunión", color: "#5b21b6",
    w: 160, h: 80, isArea: false,
    desc: "Mesa de reuniones",
  },
  sofa: {
    cat: "Mobiliario", label: "Sofá", color: "#4c1d95",
    w: 120, h: 50, isArea: false,
    desc: "Sofá / zona lounge",
  },
  cabinet: {
    cat: "Mobiliario", label: "Archivador", color: "#6b21a8",
    w: 40, h: 60, isArea: false,
    desc: "Archivador de pie",
  },
  plant: {
    cat: "Mobiliario", label: "Planta", color: "#16a34a",
    w: 30, h: 30, isArea: false,
    desc: "Planta decorativa",
  },

  // ── Eléctrico ───────────────────────────────────────────────────────────────
  outlet: {
    cat: "Eléctrico", label: "Tomacorriente", color: "#f472b6",
    w: 16, h: 16, isArea: false,
    desc: "Toma 220V",
  },
  outlet_usb: {
    cat: "Eléctrico", label: "Toma USB", color: "#ec4899",
    w: 16, h: 16, isArea: false,
    desc: "Toma USB-C / A",
  },
  switch: {
    cat: "Eléctrico", label: "Interruptor", color: "#a78bfa",
    w: 14, h: 20, isArea: false,
    desc: "Interruptor de luz",
  },
  dimmer: {
    cat: "Eléctrico", label: "Dimmer", color: "#818cf8",
    w: 14, h: 20, isArea: false,
    desc: "Control de intensidad",
  },
  panel: {
    cat: "Eléctrico", label: "Panel", color: "#f59e0b",
    w: 30, h: 50, isArea: false,
    desc: "Tablero eléctrico",
  },

  // ── Iluminación ─────────────────────────────────────────────────────────────
  light_ceiling: {
    cat: "Iluminación", label: "Techo", color: "#fbbf24",
    w: 20, h: 20, isArea: false,
    desc: "Lámpara de techo",
  },
  light_recessed: {
    cat: "Iluminación", label: "Empotrada", color: "#fcd34d",
    w: 16, h: 16, isArea: false,
    desc: "Luz empotrada",
  },
  light_led_strip: {
    cat: "Iluminación", label: "Tira LED", color: "#fde68a",
    w: 80, h: 8, isArea: false,
    desc: "Tira de LED",
  },
  fan: {
    cat: "Iluminación", label: "Ventilador", color: "#67e8f9",
    w: 40, h: 40, isArea: false,
    desc: "Ventilador de techo",
  },

  // ── Redes ────────────────────────────────────────────────────────────────────
  router: {
    cat: "Redes", label: "Router", color: "#22d3ee",
    w: 30, h: 20, isArea: false,
    desc: "Router WiFi",
  },
  network_port: {
    cat: "Redes", label: "Puerto red", color: "#06b6d4",
    w: 14, h: 14, isArea: false,
    desc: "Puerto ethernet",
  },
  server: {
    cat: "Redes", label: "Servidor", color: "#0891b2",
    w: 30, h: 60, isArea: false,
    desc: "Rack / servidor",
  },
  camera: {
    cat: "Redes", label: "Cámara", color: "#0e7490",
    w: 20, h: 16, isArea: false,
    desc: "Cámara de seguridad",
  },

  // ── Cables ───────────────────────────────────────────────────────────────────
  wire_hot: {
    cat: "Cables", label: "Vivo (L)", color: "#ef4444",
    isWire: true, desc: "Cable fase",
  },
  wire_neutral: {
    cat: "Cables", label: "Neutro (N)", color: "#94a3b8",
    isWire: true, desc: "Cable neutro",
  },
  wire_ground: {
    cat: "Cables", label: "Tierra (PE)", color: "#4ade80",
    isWire: true, desc: "Cable tierra",
  },
  wire_data: {
    cat: "Cables", label: "Datos", color: "#22d3ee",
    isWire: true, desc: "Cable de red",
  },
};

type ElemType = keyof typeof CATALOGUE;

// ─────────────────────────────────────────────────────────────────────────────
//  SVG SYMBOLS FOR EACH ELEMENT
// ─────────────────────────────────────────────────────────────────────────────
function ElemSVG({ type, w, h, selected = false }: { type: ElemType; w: number; h: number; selected?: boolean }) {
  const def = CATALOGUE[type];
  const col = def.color;
  const cx = w / 2, cy = h / 2;
  const sel = selected;

  // Helper: glow ring when selected
  const selRing = sel
    ? <rect x={-3} y={-3} width={w + 6} height={h + 6} rx={4} fill="none"
        stroke={col} strokeWidth={1.5} opacity={0.5}/>
    : null;

  switch (type) {
    // ── Rooms / areas ──────────────────────────────────────────────────────
    case "room":
      return (
        <svg width={w} height={h} viewBox={`0 0 ${w} ${h}`}>
          <rect x={0} y={0} width={w} height={h}
            fill={sel ? "rgba(59,130,246,0.08)" : "rgba(30,41,59,0.5)"}
            stroke={sel ? "#3b82f6" : "#1e3a5f"} strokeWidth={sel ? 2 : 1.5} rx={2}/>
          <text x={cx} y={cy} textAnchor="middle" dominantBaseline="central"
            fontSize={12} fill={sel ? "#3b82f6" : "#4a6a8a"} fontFamily="monospace">Habitación</text>
        </svg>
      );

    case "door":
      return (
        <svg width={w} height={h} viewBox={`0 0 ${w} ${h}`}>
          <rect x={0} y={0} width={w} height={h} fill={CATALOGUE[type].color} opacity={0.9} rx={2}/>
          {sel && <rect x={-2} y={-2} width={w+4} height={h+4} fill="none" stroke={col} strokeWidth={1.5} rx={3}/>}
          <path d={`M0 ${h/2} A${w} ${w} 0 0 1 ${w} ${h/2}`} fill="none" stroke="#030b1f" strokeWidth={0.8} strokeDasharray="2,2"/>
        </svg>
      );

    // ── Mobiliario ─────────────────────────────────────────────────────────
    case "desk":
      return (
        <svg width={w} height={h} viewBox={`0 0 ${w} ${h}`}>
          {selRing}
          <rect x={0} y={0} width={w} height={h} rx={3}
            fill={sel ? "rgba(139,92,246,0.2)" : "rgba(139,92,246,0.1)"}
            stroke={col} strokeWidth={1.5}/>
          <rect x={4} y={4} width={w-8} height={10} rx={1} fill={col} opacity={0.5}/>
          <text x={cx} y={cy+8} textAnchor="middle" fontSize={8} fill={col} fontFamily="monospace">DESK</text>
          {/* monitor hint */}
          <rect x={cx-14} y={8} width={28} height={18} rx={2} fill="none" stroke={col} strokeWidth={1} opacity={0.7}/>
          <line x1={cx} y1={26} x2={cx} y2={32} stroke={col} strokeWidth={1} opacity={0.5}/>
        </svg>
      );

    case "desk_l":
      return (
        <svg width={w} height={h} viewBox={`0 0 ${w} ${h}`}>
          {selRing}
          <path d={`M0 0 L${w} 0 L${w} ${h*0.4} L${w*0.4} ${h*0.4} L${w*0.4} ${h} L0 ${h} Z`}
            fill={sel ? "rgba(124,58,237,0.2)" : "rgba(124,58,237,0.1)"}
            stroke={col} strokeWidth={1.5}/>
          <text x={20} y={h*0.2} fontSize={7} fill={col} fontFamily="monospace">L-DESK</text>
        </svg>
      );

    case "chair":
      return (
        <svg width={w} height={h} viewBox={`0 0 ${w} ${h}`}>
          {selRing}
          <circle cx={cx} cy={cy} r={cx-2}
            fill={sel ? "rgba(167,139,250,0.25)" : "rgba(167,139,250,0.12)"}
            stroke={col} strokeWidth={1.5}/>
          <circle cx={cx} cy={cy} r={cx*0.45} fill={col} opacity={0.4}/>
          <text x={cx} y={cy+3} textAnchor="middle" fontSize={7} fill={col} fontFamily="monospace">CHR</text>
        </svg>
      );

    case "shelf":
      return (
        <svg width={w} height={h} viewBox={`0 0 ${w} ${h}`}>
          {selRing}
          <rect x={0} y={0} width={w} height={h} rx={2}
            fill={sel ? "rgba(109,40,217,0.2)" : "rgba(109,40,217,0.12)"}
            stroke={col} strokeWidth={1.5}/>
          {[0.25,0.5,0.75].map(f => (
            <line key={f} x1={2} y1={h*f} x2={w-2} y2={h*f} stroke={col} strokeWidth={0.8} opacity={0.6}/>
          ))}
        </svg>
      );

    case "meeting_table":
      return (
        <svg width={w} height={h} viewBox={`0 0 ${w} ${h}`}>
          {selRing}
          <rect x={10} y={10} width={w-20} height={h-20} rx={6}
            fill={sel ? "rgba(91,33,182,0.2)" : "rgba(91,33,182,0.12)"}
            stroke={col} strokeWidth={1.8}/>
          <text x={cx} y={cy+3} textAnchor="middle" fontSize={9} fill={col} fontFamily="monospace">SALA</text>
          {/* chairs around */}
          {[30,70,110].map(x => (
            <rect key={`t${x}`} x={x-8} y={1} width={16} height={8} rx={2} fill={col} opacity={0.4}/>
          ))}
          {[30,70,110].map(x => (
            <rect key={`b${x}`} x={x-8} y={h-9} width={16} height={8} rx={2} fill={col} opacity={0.4}/>
          ))}
        </svg>
      );

    case "sofa":
      return (
        <svg width={w} height={h} viewBox={`0 0 ${w} ${h}`}>
          {selRing}
          <rect x={0} y={h*0.3} width={w} height={h*0.7} rx={4}
            fill={sel?"rgba(76,29,149,0.25)":"rgba(76,29,149,0.15)"}
            stroke={col} strokeWidth={1.5}/>
          <rect x={4} y={0} width={w-8} height={h*0.35} rx={3}
            fill={col} opacity={0.3} stroke={col} strokeWidth={1}/>
          {[0,1,2].map(i=>(
            <rect key={i} x={4+i*(w-8)/3} y={h*0.32} width={(w-8)/3-2} height={h*0.65} rx={3}
              fill={col} opacity={0.2}/>
          ))}
        </svg>
      );

    case "cabinet":
      return (
        <svg width={w} height={h} viewBox={`0 0 ${w} ${h}`}>
          {selRing}
          <rect x={0} y={0} width={w} height={h} rx={2}
            fill={sel?"rgba(107,33,168,0.2)":"rgba(107,33,168,0.12)"}
            stroke={col} strokeWidth={1.5}/>
          <line x1={0} y1={h/2} x2={w} y2={h/2} stroke={col} strokeWidth={0.8} opacity={0.5}/>
          <circle cx={cx} cy={h*0.25} r={2} fill={col} opacity={0.8}/>
          <circle cx={cx} cy={h*0.75} r={2} fill={col} opacity={0.8}/>
        </svg>
      );

    case "plant":
      return (
        <svg width={w} height={h} viewBox={`0 0 ${w} ${h}`}>
          {selRing}
          <circle cx={cx} cy={cy} r={cx-2}
            fill={sel?"rgba(22,163,74,0.3)":"rgba(22,163,74,0.15)"}
            stroke={col} strokeWidth={1.5}/>
          <text x={cx} y={cy+3} textAnchor="middle" fontSize={10}>🌿</text>
        </svg>
      );

    // ── Eléctrico ──────────────────────────────────────────────────────────
    case "outlet":
    case "outlet_usb":
      return (
        <svg width={w} height={h} viewBox={`0 0 ${w} ${h}`}>
          <circle cx={cx} cy={cy} r={cx-1}
            fill="#030b1f" stroke={col} strokeWidth={1.5}
            style={sel?{filter:`drop-shadow(0 0 4px ${col})`}:{}}/>
          <line x1={cx-3} y1={cy-3} x2={cx-3} y2={cy+3} stroke={col} strokeWidth={1.5}/>
          <line x1={cx+3} y1={cy-3} x2={cx+3} y2={cy+3} stroke={col} strokeWidth={1.5}/>
          {type==="outlet_usb" && <text x={cx} y={cy+8} textAnchor="middle" fontSize={5} fill={col}>USB</text>}
        </svg>
      );

    case "switch":
    case "dimmer":
      return (
        <svg width={w} height={h} viewBox={`0 0 ${w} ${h}`}>
          <rect x={0} y={0} width={w} height={h} rx={2}
            fill="#030b1f" stroke={col} strokeWidth={1.5}
            style={sel?{filter:`drop-shadow(0 0 4px ${col})`}:{}}/>
          <text x={cx} y={cy+3} textAnchor="middle" fontSize={7} fill={col} fontFamily="monospace">
            {type==="dimmer"?"D":"S"}
          </text>
        </svg>
      );

    case "panel":
      return (
        <svg width={w} height={h} viewBox={`0 0 ${w} ${h}`}>
          <rect x={0} y={0} width={w} height={h} rx={2}
            fill="#030b1f" stroke={col} strokeWidth={2}
            style={sel?{filter:`drop-shadow(0 0 6px ${col})`}:{}}/>
          {[0.25,0.45,0.65,0.85].map(f=>(
            <line key={f} x1={4} y1={h*f} x2={w-4} y2={h*f} stroke={col} strokeWidth={0.8} opacity={0.7}/>
          ))}
          <text x={cx} y={7} textAnchor="middle" fontSize={6} fill={col} fontFamily="monospace">PANEL</text>
          <circle cx={w-5} cy={5} r={2.5} fill={col} opacity={0.8}/>
        </svg>
      );

    // ── Iluminación ────────────────────────────────────────────────────────
    case "light_ceiling":
      return (
        <svg width={w} height={h} viewBox={`0 0 ${w} ${h}`}>
          <circle cx={cx} cy={cy} r={cx-1}
            fill={sel?"rgba(251,191,36,0.2)":"rgba(251,191,36,0.08)"}
            stroke={col} strokeWidth={1.5}
            style={sel?{filter:`drop-shadow(0 0 5px ${col})`}:{}}/>
          <circle cx={cx} cy={cy} r={4} fill={col} opacity={0.7}/>
          <circle cx={cx} cy={cy} r={cx-1} fill="none" stroke={col} strokeWidth={0.6} strokeDasharray="2,2" opacity={0.4}/>
        </svg>
      );

    case "light_recessed":
      return (
        <svg width={w} height={h} viewBox={`0 0 ${w} ${h}`}>
          <circle cx={cx} cy={cy} r={cx-1}
            fill="#030b1f" stroke={col} strokeWidth={1.5}
            style={sel?{filter:`drop-shadow(0 0 5px ${col})`}:{}}/>
          <circle cx={cx} cy={cy} r={4} fill={col} opacity={0.8}/>
        </svg>
      );

    case "light_led_strip":
      return (
        <svg width={w} height={h} viewBox={`0 0 ${w} ${h}`}>
          <rect x={0} y={h/2-2} width={w} height={4} rx={2}
            fill={col} opacity={0.8}
            style={sel?{filter:`drop-shadow(0 0 5px ${col})`}:{}}/>
          {Array.from({length:8},(_,i)=>(
            <circle key={i} cx={5+i*(w-10)/7} cy={cy} r={2} fill={col} opacity={0.6}/>
          ))}
        </svg>
      );

    case "fan":
      return (
        <svg width={w} height={h} viewBox={`0 0 ${w} ${h}`}>
          {selRing}
          <circle cx={cx} cy={cy} r={cx-2}
            fill={sel?"rgba(103,232,249,0.12)":"rgba(103,232,249,0.06)"}
            stroke={col} strokeWidth={1.2}/>
          {[0,90,180,270].map(a=>(
            <ellipse key={a} cx={cx} cy={cy-8} rx={5} ry={7}
              fill={col} opacity={0.35}
              transform={`rotate(${a} ${cx} ${cy})`}/>
          ))}
          <circle cx={cx} cy={cy} r={4} fill={col} opacity={0.7}/>
        </svg>
      );

    // ── Redes ──────────────────────────────────────────────────────────────
    case "router":
      return (
        <svg width={w} height={h} viewBox={`0 0 ${w} ${h}`}>
          {selRing}
          <rect x={0} y={4} width={w} height={h-4} rx={2}
            fill="#030b1f" stroke={col} strokeWidth={1.5}
            style={sel?{filter:`drop-shadow(0 0 5px ${col})`}:{}}/>
          {[5,10,15].map(x=>(
            <line key={x} x1={x} y1={4} x2={x-2} y2={0} stroke={col} strokeWidth={1.5} strokeLinecap="round"/>
          ))}
          <circle cx={w-5} cy={8} r={2} fill={col} opacity={0.8}/>
        </svg>
      );

    case "network_port":
      return (
        <svg width={w} height={h} viewBox={`0 0 ${w} ${h}`}>
          <rect x={0} y={0} width={w} height={h} rx={2}
            fill="#030b1f" stroke={col} strokeWidth={1.5}
            style={sel?{filter:`drop-shadow(0 0 4px ${col})`}:{}}/>
          <rect x={3} y={3} width={w-6} height={h-6} rx={1} fill="none" stroke={col} strokeWidth={0.8} opacity={0.5}/>
        </svg>
      );

    case "server":
      return (
        <svg width={w} height={h} viewBox={`0 0 ${w} ${h}`}>
          {selRing}
          <rect x={0} y={0} width={w} height={h} rx={2}
            fill="#030b1f" stroke={col} strokeWidth={1.8}
            style={sel?{filter:`drop-shadow(0 0 6px ${col})`}:{}}/>
          {[0.2,0.4,0.6,0.8].map(f=>(
            <rect key={f} x={2} y={h*f-5} width={w-4} height={8} rx={1}
              fill="none" stroke={col} strokeWidth={0.8} opacity={0.6}/>
          ))}
          {[0.2,0.4,0.6,0.8].map((f,i)=>(
            <circle key={i} cx={w-5} cy={h*f} r={1.5}
              fill={i<2?"#4ade80":"#f59e0b"} opacity={0.8}/>
          ))}
        </svg>
      );

    case "camera":
      return (
        <svg width={w} height={h} viewBox={`0 0 ${w} ${h}`}>
          <rect x={0} y={2} width={w*0.65} height={h-4} rx={2}
            fill="#030b1f" stroke={col} strokeWidth={1.5}
            style={sel?{filter:`drop-shadow(0 0 4px ${col})`}:{}}/>
          <circle cx={w*0.8} cy={cy} r={h*0.35} fill="#030b1f" stroke={col} strokeWidth={1.2}/>
          <circle cx={w*0.8} cy={cy} r={h*0.18} fill={col} opacity={0.6}/>
        </svg>
      );

    default:
      return (
        <svg width={w||20} height={h||20} viewBox={`0 0 ${w||20} ${h||20}`}>
          <rect x={0} y={0} width={w||20} height={h||20} rx={3}
            fill="rgba(30,41,59,0.5)" stroke="#475569" strokeWidth={1}/>
        </svg>
      );
  }
}

// ─────────────────────────────────────────────────────────────────────────────
//  CABLE PATH
// ─────────────────────────────────────────────────────────────────────────────
function cablePath(x1: number, y1: number, x2: number, y2: number) {
  const mx = (x1 + x2) / 2;
  return `M${x1} ${y1} C${mx} ${y1} ${mx} ${y2} ${x2} ${y2}`;
}

// ─────────────────────────────────────────────────────────────────────────────
//  CATEGORY COLOR ACCENT
// ─────────────────────────────────────────────────────────────────────────────
const CAT_COLOR: Record<string, string> = {
  Estructura: "#3b82f6",
  Mobiliario: "#8b5cf6",
  Eléctrico:  "#f472b6",
  Iluminación:"#fbbf24",
  Redes:      "#22d3ee",
  Cables:     "#94a3b8",
};

// ─────────────────────────────────────────────────────────────────────────────
//  STATS
// ─────────────────────────────────────────────────────────────────────────────
function computeStats(elements: Array<Record<string, unknown>>) {
  const cats = Object.keys(CAT_COLOR);
  const result: Record<string, number> = {};
  cats.forEach(c => { result[c] = 0; });
  elements.forEach(el => {
    const def = CATALOGUE[el.type as ElemType];
    if (def?.cat) result[def.cat] = (result[def.cat] || 0) + 1;
  });
  return result;
}

// ─────────────────────────────────────────────────────────────────────────────
//  MAIN APP
// ─────────────────────────────────────────────────────────────────────────────
export default function OfficePlanner() {
  const [elements,     setElements]     = useState<Array<Record<string, unknown>>>([]);
  const [wires,        setWires]        = useState<Array<Record<string, unknown>>>([]);
  const [selectedId,   setSelectedId]   = useState<string|null>(null);
  const [activeTool,   setActiveTool]   = useState<ElemType|null>(null);
  const [wireStart,    setWireStart]    = useState<{x:number;y:number}|null>(null);
  const [roomStart,    setRoomStart]    = useState<{x:number;y:number}|null>(null);
  const [mouse,        setMouse]        = useState({x:0,y:0});
  const [draggingId,   setDraggingId]   = useState<string|null>(null);
  const [showGrid,     setShowGrid]     = useState(true);
  const [zoom,         setZoom]         = useState(1);
  const [panOffset,    setPanOffset]    = useState({x:0,y:0});
  const [isPanning,    setIsPanning]    = useState(false);
  const [panStart,     setPanStart]     = useState({x:0,y:0});
  const [panStartOff,  setPanStartOff]  = useState({x:0,y:0});
  const [roomLabel,    setRoomLabel]    = useState<{id:string;value:string}|null>(null);

  const canvasRef = useRef<HTMLDivElement>(null);
  const svgRef    = useRef<SVGSVGElement>(null);

  const isWireTool = activeTool
    ? (CATALOGUE[activeTool] as any)?.isWire === true
    : false;
  const isRoomTool = activeTool === "room";

  // Canvas coordinate from mouse event (accounting for zoom/pan)
  const toCanvas = useCallback((clientX: number, clientY: number) => {
    const rect = canvasRef.current?.getBoundingClientRect();
    if (!rect) return {x:0,y:0};
    const x = (clientX - rect.left - panOffset.x) / zoom;
    const y = (clientY - rect.top  - panOffset.y) / zoom;
    return { x: snap(x), y: snap(y) };
  }, [zoom, panOffset]);

  // ── Keyboard ──
  useEffect(() => {
    const h = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setActiveTool(null);
        setWireStart(null);
        setRoomStart(null);
      }
      if ((e.key === "Delete" || e.key === "Backspace") && selectedId) {
        const t = (e.target as HTMLElement).tagName;
        if (t !== "INPUT" && t !== "TEXTAREA") {
          setElements(p => p.filter(x => x.id !== selectedId));
          setWires(p => p.filter(w => w.fromId !== selectedId && w.toId !== selectedId));
          setSelectedId(null);
        }
      }
    };
    window.addEventListener("keydown", h);
    return () => window.removeEventListener("keydown", h);
  }, [selectedId]);

  // ── Drag from palette → canvas drop ──
  const onDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    const type = e.dataTransfer.getData("elemType") as ElemType;
    if (!type) return;
    const def = CATALOGUE[type];
    if (!def || (def as any).isWire) return;

    const rect = canvasRef.current?.getBoundingClientRect();
    if (!rect) return;
    const rx = (e.clientX - rect.left - panOffset.x) / zoom;
    const ry = (e.clientY - rect.top  - panOffset.y) / zoom;
    const x = snap(rx - ((def as any).w || 20)/2);
    const y = snap(ry - ((def as any).h || 20)/2);

    const newEl = { id: uid(), type, x, y, w: (def as any).w||20, h: (def as any).h||20, label: def.label, rotation: 0 };
    setElements(p => [...p, newEl]);
    setSelectedId(newEl.id);
  }, [zoom, panOffset]);

  // ── Canvas click ──
  const onCanvasClick = useCallback((e: React.MouseEvent) => {
    if (isPanning) return;
    const p = toCanvas(e.clientX, e.clientY);

    if (!activeTool) {
      const target = (e.target as SVGElement).closest<SVGElement>("[data-elid]");
      setSelectedId(target ? target.dataset.elid ?? null : null);
      return;
    }

    if (isRoomTool) {
      if (!roomStart) { setRoomStart(p); return; }
      const x = Math.min(roomStart.x, p.x);
      const y = Math.min(roomStart.y, p.y);
      const w = Math.abs(p.x - roomStart.x) || 200;
      const h = Math.abs(p.y - roomStart.y) || 160;
      if (w >= 40 && h >= 40) {
        const id = uid();
        setElements(prev => [...prev, { id, type:"room", x, y, w, h, label:"Habitación", rotation:0 }]);
        setRoomLabel({ id, value:"" });
      }
      setRoomStart(null);
      return;
    }

    if (isWireTool) {
      if (!wireStart) { setWireStart(p); return; }
      setWires(prev => [...prev, {
        id: uid(), type: activeTool,
        x1: wireStart.x, y1: wireStart.y,
        x2: p.x, y2: p.y,
      }]);
      setWireStart(null);
      return;
    }

    // Point element
    const def = CATALOGUE[activeTool];
    if (!def) return;
    const newEl = {
      id: uid(), type: activeTool,
      x: p.x - ((def as any).w||20)/2, y: p.y - ((def as any).h||20)/2,
      w: (def as any).w||20, h: (def as any).h||20,
      label: def.label, rotation: 0,
    };
    setElements(p2 => [...p2, newEl]);
    setSelectedId(newEl.id);
  }, [activeTool, isRoomTool, isWireTool, wireStart, roomStart, toCanvas, isPanning]);

  // ── Element drag ──
  const startDrag = useCallback((id: string, e: React.MouseEvent) => {
    if (activeTool) return;
    e.stopPropagation();
    setSelectedId(id);
    setDraggingId(id);
    const rect = canvasRef.current?.getBoundingClientRect();
    if (!rect) return;
    const el = elements.find(x => x.id === id);
    if (!el) return;
    const sx = e.clientX, sy = e.clientY;
    const ox = el.x as number, oy = el.y as number;
    const mv = (me: MouseEvent) => {
      const dx = (me.clientX - sx) / zoom;
      const dy = (me.clientY - sy) / zoom;
      setElements(prev => prev.map(x => x.id === id
        ? { ...x, x: snap(ox + dx), y: snap(oy + dy) }
        : x
      ));
    };
    const up = () => {
      setDraggingId(null);
      window.removeEventListener("mousemove", mv);
      window.removeEventListener("mouseup", up);
    };
    window.addEventListener("mousemove", mv);
    window.addEventListener("mouseup", up);
  }, [activeTool, elements, zoom]);

  // ── Panning (middle mouse or Alt+drag) ──
  const onMouseDown = useCallback((e: React.MouseEvent) => {
    if (e.button === 1 || (e.button === 0 && e.altKey)) {
      e.preventDefault();
      setIsPanning(true);
      setPanStart({ x: e.clientX, y: e.clientY });
      setPanStartOff({ ...panOffset });
    }
  }, [panOffset]);

  useEffect(() => {
    if (!isPanning) return;
    const mv = (e: MouseEvent) => {
      setPanOffset({
        x: panStartOff.x + (e.clientX - panStart.x),
        y: panStartOff.y + (e.clientY - panStart.y),
      });
    };
    const up = () => setIsPanning(false);
    window.addEventListener("mousemove", mv);
    window.addEventListener("mouseup", up);
    return () => { window.removeEventListener("mousemove", mv); window.removeEventListener("mouseup", up); };
  }, [isPanning, panStart, panStartOff]);

  // ── Zoom ──
  const onWheel = useCallback((e: React.WheelEvent) => {
    e.preventDefault();
    const factor = e.deltaY > 0 ? 0.9 : 1.1;
    setZoom(z => Math.max(0.3, Math.min(3, z * factor)));
  }, []);

  const onMouseMove = useCallback((e: React.MouseEvent) => {
    const p = toCanvas(e.clientX, e.clientY);
    setMouse(p);
  }, [toCanvas]);

  // ── Rotation ──
  const rotate = useCallback((id: string, delta: number) => {
    setElements(prev => prev.map(x => x.id === id
      ? { ...x, rotation: (((x as any).rotation || 0) + delta + 360) % 360 }
      : x
    ));
  }, []);

  // ── Delete ──
  const deleteEl = useCallback((id: string) => {
    setElements(p => p.filter(x => x.id !== id));
    setWires(p => p.filter(w => w.fromId !== id && w.toId !== id));
    setSelectedId(null);
  }, []);

  const deleteWire = useCallback((id: string) => {
    setWires(p => p.filter(w => w.id !== id));
  }, []);

  const clearAll = useCallback(() => {
    setElements([]); setWires([]); setSelectedId(null);
    setActiveTool(null); setWireStart(null); setRoomStart(null);
    setZoom(1); setPanOffset({x:0,y:0});
  }, []);

  // ── Example office ──
  const loadExample = useCallback(() => {
    clearAll();
    const g = uid; // shorthand
    const EX: any[] = [
      // rooms
      { id:uid(), type:"room",          x:40,  y:40,  w:320, h:240, label:"Área de Trabajo", rotation:0 },
      { id:uid(), type:"room",          x:380, y:40,  w:200, h:240, label:"Sala Reuniones",  rotation:0 },
      { id:uid(), type:"room",          x:40,  y:300, w:540, h:160, label:"Recepción",        rotation:0 },
      // doors
      { id:uid(), type:"door",          x:200, y:280, w:40,  h:10,  label:"Puerta",  rotation:0 },
      { id:uid(), type:"door",          x:460, y:280, w:40,  h:10,  label:"Puerta",  rotation:0 },
      // desks
      { id:uid(), type:"desk",          x:60,  y:60,  w:120, h:60,  label:"Escritorio", rotation:0 },
      { id:uid(), type:"desk",          x:60,  y:140, w:120, h:60,  label:"Escritorio", rotation:0 },
      { id:uid(), type:"desk_l",        x:200, y:60,  w:140, h:100, label:"Desk L",     rotation:0 },
      { id:uid(), type:"chair",         x:100, y:60,  w:40,  h:40,  label:"Silla", rotation:0 },
      { id:uid(), type:"chair",         x:100, y:140, w:40,  h:40,  label:"Silla", rotation:0 },
      { id:uid(), type:"meeting_table", x:400, y:80,  w:160, h:80,  label:"Mesa",  rotation:0 },
      { id:uid(), type:"shelf",         x:340, y:60,  w:20,  h:100, label:"Estante", rotation:0 },
      // electrical
      { id:uid(), type:"panel",         x:50,  y:310, w:30,  h:50,  label:"Panel", rotation:0 },
      { id:uid(), type:"outlet",        x:100, y:92,  w:16,  h:16,  label:"Toma",  rotation:0 },
      { id:uid(), type:"outlet",        x:100, y:172, w:16,  h:16,  label:"Toma",  rotation:0 },
      { id:uid(), type:"switch",        x:370, y:60,  w:14,  h:20,  label:"Int.",  rotation:0 },
      // lighting
      { id:uid(), type:"light_ceiling", x:190, y:150, w:20,  h:20,  label:"Luz",   rotation:0 },
      { id:uid(), type:"light_ceiling", x:470, y:150, w:20,  h:20,  label:"Luz",   rotation:0 },
      { id:uid(), type:"light_ceiling", x:300, y:370, w:20,  h:20,  label:"Luz",   rotation:0 },
      { id:uid(), type:"fan",           x:160, y:100, w:40,  h:40,  label:"Fan",   rotation:0 },
      // network
      { id:uid(), type:"router",        x:560, y:60,  w:30,  h:20,  label:"Router", rotation:0 },
      { id:uid(), type:"network_port",  x:160, y:92,  w:14,  h:14,  label:"LAN",   rotation:0 },
      // furniture
      { id:uid(), type:"sofa",          x:200, y:320, w:120, h:50,  label:"Sofá",  rotation:0 },
      { id:uid(), type:"plant",         x:545, y:290, w:30,  h:30,  label:"Planta",rotation:0 },
      { id:uid(), type:"plant",         x:40,  y:455, w:30,  h:30,  label:"Planta",rotation:0 },
    ];
    const WIREEX: any[] = [
      { id:uid(), type:"wire_hot",     x1:65,  y1:335, x2:100, y2:100 },
      { id:uid(), type:"wire_neutral", x1:65,  y1:335, x2:100, y2:180 },
      { id:uid(), type:"wire_data",    x1:565, y1:70,  x2:167, y2:99  },
      { id:uid(), type:"wire_data",    x1:565, y1:70,  x2:370, y2:65  },
    ];
    setElements(EX);
    setWires(WIREEX);
  }, [clearAll]);

  const stats  = useMemo(() => computeStats(elements), [elements]);
  const selEl  = selectedId ? elements.find(x => x.id === selectedId) : null;

  const cats = ["Estructura","Mobiliario","Eléctrico","Iluminación","Redes","Cables"];
  const catItems = (cat: string) =>
    Object.entries(CATALOGUE).filter(([, v]) => v.cat === cat);

  const statusTip = !activeTool ? "Modo selección — arrastra elementos"
    : isRoomTool && !roomStart ? "Haz clic en la primera esquina del cuarto"
    : isRoomTool  ? "Haz clic en la esquina opuesta"
    : isWireTool && !wireStart ? "Haz clic en el punto de inicio del cable"
    : isWireTool  ? "Haz clic en el punto final — ESC cancela"
    : `Colocando: ${CATALOGUE[activeTool]?.label} — clic para colocar`;

  return (
    <div style={{
      display:"flex", height:"100vh", overflow:"hidden",
      background:"#030b1f",
      fontFamily:"'JetBrains Mono','Courier New',monospace",
    }}>
      <style>{`
        @keyframes blinkDot{0%,100%{opacity:1}50%{opacity:0.2}}
        @keyframes fadeUp{from{opacity:0;transform:translateY(6px)}to{opacity:1;transform:none}}
        ::-webkit-scrollbar{width:3px}::-webkit-scrollbar-thumb{background:#1e3a5f}
        .pal-btn:hover{background:rgba(255,255,255,0.05)!important;border-color:rgba(255,255,255,0.1)!important}
        .tb-btn:hover{border-color:#4ade80!important;color:#4ade80!important}
        input[type=text]{outline:none}
        input[type=range]{-webkit-appearance:none;height:3px;background:#0f2040;border-radius:2px;width:100%}
        input[type=range]::-webkit-slider-thumb{-webkit-appearance:none;width:12px;height:12px;border-radius:50%;background:#22d3ee;cursor:pointer}
      `}</style>

      {/* ══ LEFT SIDEBAR ══ */}
      <aside style={{
        width:200, background:"#020912",
        borderRight:"1px solid #0f2040",
        display:"flex", flexDirection:"column",
        flexShrink:0, overflowY:"auto",
      }}>
        {/* Brand */}
        <div style={{padding:"14px 12px 10px",borderBottom:"1px solid #0f2040"}}>
          <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:5}}>
            <div style={{width:28,height:28,borderRadius:6,background:"rgba(59,130,246,0.15)",border:"1px solid rgba(59,130,246,0.3)",display:"flex",alignItems:"center",justifyContent:"center",fontSize:14}}>📐</div>
            <div>
              <div style={{fontSize:9,fontWeight:700,color:"#60a5fa",letterSpacing:"0.16em"}}>OFFICE PLANNER</div>
              <div style={{fontSize:7,color:"#1e3654",letterSpacing:"0.1em"}}>IEC 60364 · v2.0</div>
            </div>
          </div>
          <div style={{fontSize:8,color:"#1e3654",lineHeight:1.8}}>
            Arrastra → lienzo · Clic para colocar
          </div>
        </div>

        {/* Select tool */}
        <div style={{padding:"6px"}}>
          <button
            onClick={()=>{setActiveTool(null);setWireStart(null);setRoomStart(null);}}
            className="pal-btn"
            style={{
              width:"100%",display:"flex",alignItems:"center",gap:8,
              padding:"6px 10px",borderRadius:7,cursor:"pointer",
              border:"1px solid transparent",
              background:!activeTool?"rgba(74,222,128,0.1)":"transparent",
              color:!activeTool?"#4ade80":"#475569",
              fontSize:10,transition:"all 0.15s",
            }}>
            <span style={{fontSize:14}}>↖</span> Seleccionar
          </button>
        </div>

        {/* Palette */}
        {cats.map(cat => {
          const items = catItems(cat);
          if (!items.length) return null;
          const cc = CAT_COLOR[cat] || "#475569";
          return (
            <div key={cat}>
              <div style={{
                padding:"8px 12px 3px",
                fontSize:7.5,color:cc,
                textTransform:"uppercase",letterSpacing:"0.18em",fontWeight:700,
              }}>{cat}</div>
              {items.map(([type, def]) => {
                const isActive = activeTool === type;
                const isWire   = (def as any).isWire;
                return (
                  <div
                    key={type}
                    className="pal-btn"
                    draggable={!isWire}
                    onDragStart={e => e.dataTransfer.setData("elemType", type)}
                    onClick={() => {
                      setActiveTool(type as ElemType);
                      setWireStart(null);
                      setRoomStart(null);
                    }}
                    style={{
                      display:"flex",alignItems:"center",gap:8,
                      margin:"1px 5px",padding:"5px 8px",
                      borderRadius:7,cursor:"pointer",userSelect:"none",
                      border:`1px solid ${isActive?"rgba(74,222,128,0.35)":"transparent"}`,
                      background:isActive?"rgba(74,222,128,0.1)":"transparent",
                      transition:"all 0.14s",
                    }}>
                    {/* Preview */}
                    <div style={{
                      width:36,height:22,flexShrink:0,
                      background:"rgba(15,32,64,0.8)",
                      border:`1px solid ${def.color}22`,
                      borderRadius:4,overflow:"hidden",
                      display:"flex",alignItems:"center",justifyContent:"center",
                    }}>
                      {isWire
                        ? <div style={{width:22,height:2,background:def.color,borderRadius:1}}/>
                        : <div style={{transform:"scale(0.4)",transformOrigin:"center",pointerEvents:"none",lineHeight:0}}>
                            <ElemSVG type={type as ElemType} w={(def as any).w||20} h={(def as any).h||20}/>
                          </div>
                      }
                    </div>
                    <span style={{fontSize:10,color:isActive?"#4ade80":"#7aa8d8"}}>{def.label}</span>
                  </div>
                );
              })}
            </div>
          );
        })}

        <div style={{marginTop:"auto",padding:"10px 12px",borderTop:"1px solid #0f2040"}}>
          <div style={{fontSize:7.5,color:"#1e3654",lineHeight:2.2}}>
            <div>● Arrastra desde paleta</div>
            <div>● Click elemento = activa herramienta</div>
            <div>● Alt+drag = mover lienzo</div>
            <div>● Scroll = zoom</div>
            <div>● Del = borrar seleccionado</div>
            <div>● ESC = cancelar</div>
          </div>
        </div>
      </aside>

      {/* ══ MAIN CANVAS AREA ══ */}
      <div style={{flex:1,display:"flex",flexDirection:"column",overflow:"hidden"}}>
        {/* Toolbar */}
        <div style={{
          padding:"6px 10px",
          background:"#020912",
          borderBottom:"1px solid #0f2040",
          display:"flex",alignItems:"center",gap:6,flexShrink:0,
        }}>
          {[
            { label:"📋 Ejemplo", action: loadExample },
            { label:`${showGrid?"✓":"○"} Grilla`, action: ()=>setShowGrid(p=>!p) },
            { label:"↺ Reset vista", action: ()=>{setZoom(1);setPanOffset({x:0,y:0});} },
          ].map(b=>(
            <button key={b.label} className="tb-btn" onClick={b.action} style={{
              padding:"3px 10px",fontSize:9,background:"transparent",
              border:"1px solid #0f2040",color:"#3a5a80",
              borderRadius:5,cursor:"pointer",fontFamily:"inherit",
              transition:"all 0.15s",letterSpacing:"0.04em",
            }}>{b.label}</button>
          ))}

          <div style={{flex:1}}/>

          {/* Zoom indicator */}
          <span style={{fontSize:9,color:"#1e3654",background:"#020912",border:"1px solid #0f2040",padding:"2px 8px",borderRadius:10,fontFamily:"monospace"}}>
            {Math.round(zoom*100)}%
          </span>
          <span style={{fontSize:9,color:"#1e3654",background:"#020912",border:"1px solid #0f2040",padding:"2px 8px",borderRadius:10,fontFamily:"monospace"}}>
            {elements.length} elem · {wires.length} cables
          </span>

          {selectedId && (
            <button className="tb-btn" onClick={()=>deleteEl(selectedId)} style={{
              padding:"3px 10px",fontSize:9,background:"transparent",
              border:"1px solid #7f1d1d",color:"#ef4444",
              borderRadius:5,cursor:"pointer",fontFamily:"inherit",
            }}>× Eliminar</button>
          )}

          <button className="tb-btn" onClick={clearAll} style={{
            padding:"3px 10px",fontSize:9,background:"transparent",
            border:"1px solid #7f1d1d",color:"#6b7280",
            borderRadius:5,cursor:"pointer",fontFamily:"inherit",transition:"all 0.15s",
          }}>Nuevo</button>
        </div>

        {/* Status bar above canvas */}
        <div style={{
          padding:"4px 12px",background:"rgba(74,222,128,0.06)",
          borderBottom:"1px solid #0f2040",
          fontSize:9,color:activeTool?"#4ade80":"#1e3654",
          fontFamily:"monospace",flexShrink:0,
          display:"flex",alignItems:"center",gap:8,
        }}>
          {activeTool && <span style={{width:6,height:6,borderRadius:"50%",background:"#4ade80",display:"inline-block",animation:"blinkDot 1s infinite"}}/>}
          {statusTip}
          <span style={{marginLeft:"auto",color:"#1e3654"}}>x:{mouse.x} y:{mouse.y}</span>
        </div>

        {/* Canvas */}
        <div
          ref={canvasRef}
          style={{
            flex:1, overflow:"hidden", position:"relative",
            cursor: isPanning ? "grabbing" : activeTool ? "crosshair" : "default",
            background:"#030b1f",
          }}
          onDrop={onDrop}
          onDragOver={e=>e.preventDefault()}
          onMouseMove={onMouseMove}
          onClick={onCanvasClick}
          onMouseDown={onMouseDown}
          onWheel={onWheel}
        >
          <svg
            ref={svgRef}
            style={{position:"absolute",inset:0,width:"100%",height:"100%"}}
          >
            <defs>
              <pattern id="dots" width={GRID} height={GRID} patternUnits="userSpaceOnUse"
                patternTransform={`translate(${panOffset.x % GRID} ${panOffset.y % GRID}) scale(${zoom})`}>
                <circle cx={0} cy={0} r={0.7} fill="#1e3a5f"/>
              </pattern>
              <filter id="selGlow">
                <feGaussianBlur stdDeviation="3" result="b"/>
                <feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge>
              </filter>
              <filter id="wireGlow">
                <feGaussianBlur stdDeviation="2" result="b"/>
                <feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge>
              </filter>
              <marker id="arrowData" markerWidth={6} markerHeight={4} refX={6} refY={2} orient="auto">
                <polygon points="0 0,6 2,0 4" fill="#22d3ee"/>
              </marker>
            </defs>

            {/* Grid */}
            {showGrid && <rect width="100%" height="100%" fill="url(#dots)"/>}

            {/* Empty state */}
            {elements.length === 0 && wires.length === 0 && (
              <g style={{pointerEvents:"none"}}>
                <circle cx="50%" cy="50%" r={60} fill="none" stroke="#0f2040" strokeWidth={1.5} strokeDasharray="6,4"/>
                <text x="50%" y="46%" textAnchor="middle" fontSize={32} fill="#0f2040">📐</text>
                <text x="50%" y="54%" textAnchor="middle" fontSize={11} fill="#1e3654" fontFamily="monospace">
                  Arrastra elementos al lienzo o usa 📋 Ejemplo
                </text>
              </g>
            )}

            {/* All elements in transform group */}
            <g transform={`translate(${panOffset.x},${panOffset.y}) scale(${zoom})`}>
              {/* Rooms first (background) */}
              {elements.filter(el => el.type === "room").map(el => {
                const isSel = selectedId === el.id;
                return (
                  <g key={el.id as string} data-elid={el.id as string}
                    transform={`rotate(${(el as any).rotation||0},${(el as any).x+(el as any).w/2},${(el as any).y+(el as any).h/2})`}
                    style={{cursor:"move"}}
                    onMouseDown={e=>startDrag(el.id as string,e)}>
                    <rect x={(el as any).x} y={(el as any).y} width={(el as any).w} height={(el as any).h}
                      fill={isSel?"rgba(59,130,246,0.07)":"rgba(20,30,50,0.45)"}
                      stroke={isSel?"#3b82f6":"#1e3a5f"}
                      strokeWidth={isSel?2:1.5} rx={3}/>
                    <text x={(el as any).x+(el as any).w/2} y={(el as any).y+(el as any).h/2}
                      textAnchor="middle" dominantBaseline="central"
                      fontSize={12} fill={isSel?"#3b82f6":"#2a4a70"} fontFamily="monospace">
                      {(el as any).label}
                    </text>
                    {isSel && (
                      <rect x={(el as any).x-3} y={(el as any).y-3} width={(el as any).w+6} height={(el as any).h+6}
                        fill="none" stroke="#3b82f6" strokeWidth={1} strokeDasharray="4,3"
                        rx={4} opacity={0.5} filter="url(#selGlow)"/>
                    )}
                  </g>
                );
              })}

              {/* Wires */}
              {wires.map(w => {
                const def = CATALOGUE[(w as any).type as ElemType] as any;
                const col = def?.color ?? "#94a3b8";
                const isSel = selectedId === (w as any).id;
                const d = cablePath((w as any).x1,(w as any).y1,(w as any).x2,(w as any).y2);
                return (
                  <g key={(w as any).id as string} data-elid={(w as any).id as string}>
                    {isSel && <path d={d} fill="none" stroke={col} strokeWidth={8} opacity={0.15} filter="url(#wireGlow)"/>}
                    <path d={d} fill="none" stroke={col} strokeWidth={isSel?2.5:1.8} strokeLinecap="round"
                      markerEnd={(w as any).type==="wire_data"?"url(#arrowData)":undefined} filter="url(#wireGlow)"
                      style={{cursor:"pointer"}}/>
                    <circle cx={(w as any).x1} cy={(w as any).y1} r={3} fill={col} opacity={0.7}/>
                    <circle cx={(w as any).x2} cy={(w as any).y2} r={3} fill={col} opacity={0.7}/>
                    {/* Invisible hit target */}
                    <path d={d} fill="none" stroke="transparent" strokeWidth={14}
                      style={{cursor:"pointer"}}
                      onClick={e=>{e.stopPropagation();setSelectedId((w as any).id as string);}}/>
                  </g>
                );
              })}

              {/* All non-room elements */}
              {elements.filter(el => el.type !== "room").map(el => {
                const isSel = selectedId === el.id;
                const cx2 = (el as any).x + (el as any).w/2, cy2 = (el as any).y + (el as any).h/2;
                return (
                  <g key={el.id as string} data-elid={el.id as string}
                    transform={`rotate(${(el as any).rotation||0},${cx2},${cy2})`}
                    style={{cursor: activeTool ? "crosshair" : "move"}}
                    onMouseDown={e => startDrag(el.id as string, e)}>
                    {isSel && (
                      <rect x={(el as any).x-5} y={(el as any).y-5} width={(el as any).w+10} height={(el as any).h+10}
                        fill="none" stroke="#22d3ee" strokeWidth={1.5}
                        rx={4} opacity={0.4} filter="url(#selGlow)"/>
                    )}
                    <g transform={`translate(${(el as any).x},${(el as any).y})`}>
                      <ElemSVG type={(el as any).type} w={(el as any).w} h={(el as any).h} selected={isSel}/>
                    </g>
                    {/* Label below */}
                    <text x={cx2} y={(el as any).y+(el as any).h+9}
                      textAnchor="middle" fontSize={7} fill="#2a4a70"
                      fontFamily="monospace" style={{pointerEvents:"none"}}>
                      {(el as any).label}
                    </text>
                    {/* Rotation handles when selected */}
                    {isSel && (
                      <g>
                        <rect x={cx2-28} y={(el as any).y-22} width={56} height={18} rx={9}
                          fill="rgba(2,9,20,0.95)" stroke="#22d3ee44" strokeWidth={1}/>
                        <text x={cx2-10} y={(el as any).y-10} textAnchor="middle"
                          fontSize={9} fill="#22d3ee" style={{cursor:"pointer"}}
                          onClick={e=>{e.stopPropagation();rotate(el.id as string,-90);}}>↺</text>
                        <text x={cx2} y={(el as any).y-10} textAnchor="middle"
                          fontSize={8} fill="#22d3ee44">|</text>
                        <text x={cx2+10} y={(el as any).y-10} textAnchor="middle"
                          fontSize={9} fill="#22d3ee" style={{cursor:"pointer"}}
                          onClick={e=>{e.stopPropagation();rotate(el.id as string,+90);}}>↻</text>
                        {/* Delete X */}
                        <circle cx={(el as any).x+(el as any).w+6} cy={(el as any).y-6} r={7} fill="#ef4444"
                          style={{cursor:"pointer"}}
                          onClick={e=>{e.stopPropagation();deleteEl(el.id as string);}}/>
                        <text x={(el as any).x+(el as any).w+6} y={(el as any).y-2} textAnchor="middle"
                          fontSize={9} fill="white" style={{cursor:"pointer",pointerEvents:"none"}}>×</text>
                      </g>
                    )}
                  </g>
                );
              })}

              {/* Room preview */}
              {isRoomTool && roomStart && (
                <rect x={Math.min(roomStart.x,mouse.x)} y={Math.min(roomStart.y,mouse.y)}
                  width={Math.abs(mouse.x-roomStart.x)||1} height={Math.abs(mouse.y-roomStart.y)||1}
                  fill="rgba(74,222,128,0.04)" stroke="#4ade80" strokeWidth={1.5}
                  strokeDasharray="5,3" rx={2}/>
              )}

              {/* Wire preview */}
              {isWireTool && wireStart && (
                <g>
                  <path d={cablePath(wireStart.x,wireStart.y,mouse.x,mouse.y)}
                    fill="none"
                    stroke={(CATALOGUE[activeTool!] as any)?.color ?? "#94a3b8"}
                    strokeWidth={1.5} strokeDasharray="6,3" opacity={0.6}/>
                  <circle cx={wireStart.x} cy={wireStart.y} r={4}
                    fill={(CATALOGUE[activeTool!] as any)?.color ?? "#94a3b8"} opacity={0.8}/>
                </g>
              )}

              {/* Cursor dot */}
              {activeTool && (
                <circle cx={mouse.x} cy={mouse.y} r={3.5} fill="#4ade80" opacity={0.7}
                  style={{pointerEvents:"none"}}/>
              )}
            </g>
          </svg>
        </div>
      </div>

      {/* ══ RIGHT PANEL ══ */}
      <aside style={{
        width:220, background:"#020912",
        borderLeft:"1px solid #0f2040",
        display:"flex", flexDirection:"column",
        flexShrink:0, overflowY:"auto",
      }}>
        {/* Stats */}
        <div style={{padding:"12px 14px",borderBottom:"1px solid #0f2040"}}>
          <div style={{fontSize:8,color:"#2a4a70",letterSpacing:"0.16em",textTransform:"uppercase",marginBottom:10}}>
            Estado del Plano
          </div>
          {Object.entries(stats).map(([cat,count]) => (
            <div key={cat} style={{display:"flex",justifyContent:"space-between",alignItems:"center",padding:"4px 0",borderBottom:"1px solid #080f20"}}>
              <span style={{fontSize:9,color:"#2a4a70"}}>{cat}</span>
              <span style={{fontSize:12,fontWeight:700,color:CAT_COLOR[cat]||"#475569"}}>{count}</span>
            </div>
          ))}
          <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",padding:"4px 0",marginTop:2}}>
            <span style={{fontSize:9,color:"#2a4a70"}}>Cables</span>
            <span style={{fontSize:12,fontWeight:700,color:"#94a3b8"}}>{wires.length}</span>
          </div>
        </div>

        {/* Element editor */}
        {selEl ? (
          <div style={{padding:"12px 14px",animation:"fadeUp 0.2s ease"}}>
            <div style={{fontSize:8,color:"#2a4a70",letterSpacing:"0.14em",textTransform:"uppercase",marginBottom:10}}>
              Propiedades
            </div>
            {/* Type badge */}
            <div style={{
              fontSize:9,color:CAT_COLOR[CATALOGUE[(selEl as any).type as ElemType]?.cat||"Estructura"]||"#3b82f6",
              background:"rgba(59,130,246,0.08)",border:"1px solid rgba(59,130,246,0.2)",
              padding:"3px 8px",borderRadius:4,display:"inline-block",marginBottom:10,
            }}>
              {(selEl as any).type.toUpperCase().replace(/_/g," ")}
            </div>

            {/* Label */}
            <div style={{marginBottom:12}}>
              <div style={{fontSize:8,color:"#1e3654",marginBottom:3}}>Etiqueta</div>
              <input
                value={(selEl as any).label || ""}
                onChange={e => setElements(prev => prev.map(x => x.id===(selEl as any).id ? {...x,label:e.target.value} : x))}
                style={{
                  width:"100%",background:"#040d1e",
                  border:"1px solid #0f2040",borderRadius:4,
                  color:"#7aa8d8",fontSize:10,padding:"4px 7px",
                  boxSizing:"border-box",fontFamily:"monospace",
                }}
              />
            </div>

            {/* Position */}
            <div style={{marginBottom:10}}>
              <div style={{fontSize:8,color:"#1e3654",marginBottom:6}}>Posición</div>
              <div style={{display:"flex",gap:8}}>
                {["x","y"].map(axis => (
                  <div key={axis} style={{flex:1}}>
                    <div style={{fontSize:7.5,color:"#2a4a70",marginBottom:2}}>{axis.toUpperCase()}</div>
                    <input
                      type="number"
                      value={(selEl as any)[axis]}
                      onChange={e => setElements(prev => prev.map(x => x.id===(selEl as any).id ? {...x,[axis]:snap(+e.target.value)} : x))}
                      style={{
                        width:"100%",background:"#040d1e",
                        border:"1px solid #0f2040",borderRadius:4,
                        color:"#60a5fa",fontSize:10,padding:"3px 5px",
                        boxSizing:"border-box",fontFamily:"monospace",outline:"none",
                      }}
                    />
                  </div>
                ))}
              </div>
            </div>

            {/* Size (for rooms) */}
            {selEl.type === "room" && (
              <div style={{marginBottom:10}}>
                <div style={{fontSize:8,color:"#1e3654",marginBottom:6}}>Tamaño</div>
                <div style={{display:"flex",gap:8}}>
                  {["w","h"].map(axis => (
                    <div key={axis} style={{flex:1}}>
                      <div style={{fontSize:7.5,color:"#2a4a70",marginBottom:2}}>{axis==="w"?"Ancho":"Alto"}</div>
                      <input
                        type="number"
                        value={(selEl as any)[axis]}
                        onChange={e => setElements(prev => prev.map(x => x.id===(selEl as any).id ? {...x,[axis]:snap(+e.target.value)} : x))}
                        style={{
                          width:"100%",background:"#040d1e",
                          border:"1px solid #0f2040",borderRadius:4,
                          color:"#a78bfa",fontSize:10,padding:"3px 5px",
                          boxSizing:"border-box",fontFamily:"monospace",outline:"none",
                        }}
                      />
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Rotation */}
            <div style={{marginBottom:12}}>
              <div style={{display:"flex",justifyContent:"space-between",marginBottom:4}}>
                <span style={{fontSize:8,color:"#1e3654"}}>Rotación</span>
                <span style={{fontSize:10,color:"#22d3ee",fontWeight:700}}>{(selEl as any).rotation||0}°</span>
              </div>
              <input type="range" min={0} max={270} step={90} value={(selEl as any).rotation||0}
                onChange={e => setElements(prev => prev.map(x => x.id===(selEl as any).id ? {...x,rotation:+e.target.value} : x))}/>
              <div style={{display:"flex",justifyContent:"space-between",marginTop:6,gap:4}}>
                {[0,90,180,270].map(deg=>(
                  <button key={deg}
                    onClick={()=>setElements(prev=>prev.map(x=>x.id===(selEl as any).id?{...x,rotation:deg}:x))}
                    style={{
                      flex:1,padding:"4px 0",fontSize:8,border:"1px solid",cursor:"pointer",borderRadius:5,
                      borderColor:((selEl as any).rotation||0)===deg?"#22d3ee":"#0f2040",
                      background:((selEl as any).rotation||0)===deg?"rgba(34,211,238,0.1)":"transparent",
                      color:((selEl as any).rotation||0)===deg?"#22d3ee":"#2a4a70",
                    }}>{deg}°</button>
                ))}
              </div>
            </div>

            <button onClick={()=>deleteEl((selEl as any).id)} style={{
              width:"100%",padding:"8px",background:"rgba(239,68,68,0.08)",
              border:"1px solid rgba(239,68,68,0.3)",color:"#f87171",
              borderRadius:7,fontSize:11,cursor:"pointer",fontFamily:"inherit",
              transition:"all 0.15s",letterSpacing:"0.06em",
            }}>
              × Eliminar
            </button>
          </div>
        ) : (
          <div style={{padding:"14px",fontSize:9,color:"#1e3654",lineHeight:1.8}}>
            <div style={{color:"#2a4a70",marginBottom:6}}>Sin selección activa</div>
            Selecciona un elemento del lienzo para ver y editar sus propiedades.
          </div>
        )}

        {/* Wire legend */}
        <div style={{padding:"10px 14px",borderTop:"1px solid #0f2040",marginTop:"auto"}}>
          <div style={{fontSize:7.5,color:"#1e3654",letterSpacing:"0.12em",marginBottom:7,textTransform:"uppercase"}}>
            Leyenda de cables
          </div>
          {[
            ["#ef4444","Fase (L) / Vivo"],
            ["#94a3b8","Neutro (N)"],
            ["#4ade80","Tierra (PE)"],
            ["#22d3ee","Datos / Red"],
          ].map(([c,l])=>(
            <div key={l} style={{display:"flex",alignItems:"center",gap:8,marginBottom:5}}>
              <div style={{width:20,height:3,background:c,borderRadius:1,flexShrink:0}}/>
              <span style={{fontSize:9,color:"#2a4a70"}}>{l}</span>
            </div>
          ))}
        </div>
      </aside>

      {/* ── Room label modal ── */}
      {roomLabel && (
        <div style={{
          position:"fixed",inset:0,background:"rgba(0,0,0,0.6)",
          display:"flex",alignItems:"center",justifyContent:"center",zIndex:500,
        }}>
          <div style={{
            background:"#0d1626",border:"1px solid #1e3a5f",
            borderRadius:10,padding:"20px 24px",minWidth:300,
          }}>
            <div style={{fontSize:11,color:"#60a5fa",letterSpacing:"0.1em",marginBottom:12,fontFamily:"monospace"}}>
              NOMBRE DEL ESPACIO
            </div>
            <input
              autoFocus type="text"
              placeholder="Ej: Área de Trabajo, Sala de Reuniones..."
              value={roomLabel.value}
              onChange={e=>setRoomLabel(s=>s?{...s,value:e.target.value}:s)}
              onKeyDown={e=>{
                if(e.key==="Enter") confirmRoom();
                if(e.key==="Escape") cancelRoom();
              }}
              style={{
                width:"100%",marginBottom:12,background:"#0a0f1e",
                border:"1px solid #1e3a5f",borderRadius:5,
                color:"#e2e8f0",fontSize:12,padding:"7px 10px",
                fontFamily:"monospace",outline:"none",boxSizing:"border-box",
              }}
            />
            <div style={{display:"flex",gap:6,flexWrap:"wrap",marginBottom:14}}>
              {["Área de Trabajo","Sala Reuniones","Recepción","Privado","Almacén","Cocina"].map(s=>(
                <button key={s}
                  onClick={()=>setRoomLabel(st=>st?{...st,value:s}:st)}
                  style={{
                    fontSize:9,padding:"3px 8px",
                    border:"1px solid #1e3a5f",borderRadius:10,
                    background:"transparent",cursor:"pointer",
                    color:"#4a7aaa",fontFamily:"monospace",
                    transition:"all 0.12s",
                  }}>{s}</button>
              ))}
            </div>
            <div style={{display:"flex",gap:8,justifyContent:"flex-end"}}>
              <button onClick={cancelRoom} style={{
                padding:"6px 14px",fontSize:10,background:"transparent",
                border:"1px solid #1e3a5f",color:"#4a7aaa",
                borderRadius:6,cursor:"pointer",fontFamily:"monospace",
              }}>Cancelar</button>
              <button onClick={confirmRoom} style={{
                padding:"6px 14px",fontSize:10,background:"rgba(74,222,128,0.1)",
                border:"1px solid rgba(74,222,128,0.35)",color:"#4ade80",
                borderRadius:6,cursor:"pointer",fontFamily:"monospace",
              }}>Confirmar</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );

  function confirmRoom() {
    if (!roomLabel) return;
    const label = roomLabel.value.trim() || "Habitación";
    setElements(prev => prev.map(x => x.id===roomLabel.id ? {...x,label} : x));
    setRoomLabel(null);
  }
  function cancelRoom() {
    if (!roomLabel) return;
    setElements(prev => prev.filter(x => x.id!==roomLabel.id));
    setRoomLabel(null);
  }
}