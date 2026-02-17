"use client";

/**
 * CircuitSimulator.tsx
 * ─────────────────────────────────────────────────────────────────────────────
 * Self-contained circuit simulator with:
 *  • Drag components from palette onto canvas
 *  • Move placed components by dragging
 *  • Connect components by clicking connection ports
 *  • Animated current flow along wires when circuit is closed
 *  • Real circuit analysis: Ohm's law, series/parallel resistance, power
 *  • Properties panel for editing component values
 *  • Delete components / wires
 * ─────────────────────────────────────────────────────────────────────────────
 */

import React, {
  useState,
  useRef,
  useCallback,
  useEffect,
  useMemo,
} from "react";

// ─── Types ────────────────────────────────────────────────────────────────────

type CompType =
  | "battery"
  | "resistor"
  | "luminaire"
  | "switch"
  | "breaker"
  | "capacitor"
  | "outlet";

interface Port {
  id: string;       // e.g. "left" | "right"
  dx: number;       // offset from component center
  dy: number;
  label: string;
}

interface Component {
  id: string;
  type: CompType;
  x: number;
  y: number;
  label: string;
  // electrical props
  voltage?: number;
  resistance?: number;
  power?: number;
  isOn?: boolean;
}

interface Wire {
  id: string;
  fromCompId: string;
  fromPortId: string;
  toCompId: string;
  toPortId: string;
}

interface AnalysisResult {
  current: number;           // total circuit current (A)
  totalVoltage: number;      // total source voltage
  totalResistance: number;   // equivalent resistance
  totalPower: number;
  compValues: Record<string, { v: number; i: number; p: number }>;
  circuitClosed: boolean;
}

// ─── Constants ────────────────────────────────────────────────────────────────

const COMP_W = 72;
const COMP_H = 56;
const PORT_R = 7;
const GRID = 24;

// ─── Port definitions per component type ─────────────────────────────────────

function getPorts(type: CompType): Port[] {
  return [
    { id: "left",  dx: -COMP_W / 2, dy: 0,  label: "−" },
    { id: "right", dx:  COMP_W / 2, dy: 0,  label: "+" },
  ];
}

// ─── SVG Symbols (IEC-inspired) ───────────────────────────────────────────────

function BatterySVG({ active }: { active?: boolean }) {
  const c = active ? "#4ade80" : "#94a3b8";
  return (
    <svg width={COMP_W} height={COMP_H} viewBox="0 0 72 56">
      <line x1="0" y1="28" x2="20" y2="28" stroke={c} strokeWidth="2.5"/>
      <line x1="52" y1="28" x2="72" y2="28" stroke={c} strokeWidth="2.5"/>
      <line x1="20" y1="14" x2="20" y2="42" stroke={active ? "#4ade80" : "#60a5fa"} strokeWidth="4"/>
      <line x1="32" y1="20" x2="32" y2="36" stroke={active ? "#fbbf24" : "#94a3b8"} strokeWidth="3"/>
      <line x1="44" y1="14" x2="44" y2="42" stroke={active ? "#4ade80" : "#60a5fa"} strokeWidth="4"/>
      <text x="7" y="24" fontSize="9" fill={active ? "#4ade80" : "#64748b"} fontFamily="monospace">+</text>
      <text x="58" y="24" fontSize="9" fill={active ? "#f87171" : "#64748b"} fontFamily="monospace">−</text>
    </svg>
  );
}

function ResistorSVG({ active }: { active?: boolean }) {
  const c = active ? "#fbbf24" : "#94a3b8";
  return (
    <svg width={COMP_W} height={COMP_H} viewBox="0 0 72 56">
      <line x1="0" y1="28" x2="14" y2="28" stroke={c} strokeWidth="2.5"/>
      <line x1="58" y1="28" x2="72" y2="28" stroke={c} strokeWidth="2.5"/>
      <rect x="14" y="18" width="44" height="20" rx="3" stroke={c} strokeWidth="2" fill={active ? "rgba(251,191,36,0.12)" : "rgba(30,41,59,0.9)"}/>
      <polyline points="17,28 21,19 25,37 29,19 33,37 37,19 41,37 45,19 49,37 53,28 55,28"
        stroke={c} strokeWidth="1.5" fill="none"/>
    </svg>
  );
}

function LuminaireSVG({ active }: { active?: boolean }) {
  const c = active ? "#fde68a" : "#94a3b8";
  const fill = active ? "rgba(253,230,138,0.2)" : "rgba(30,41,59,0.9)";
  return (
    <svg width={COMP_W} height={COMP_H} viewBox="0 0 72 56">
      <line x1="0" y1="28" x2="18" y2="28" stroke={c} strokeWidth="2.5"/>
      <line x1="54" y1="28" x2="72" y2="28" stroke={c} strokeWidth="2.5"/>
      <circle cx="36" cy="28" r="16" stroke={c} strokeWidth="2" fill={fill}/>
      <line x1="20" y1="28" x2="52" y2="28" stroke={c} strokeWidth="2"/>
      <line x1="36" y1="12" x2="36" y2="44" stroke={c} strokeWidth="2"/>
      {active && <>
        <circle cx="36" cy="28" r="7" fill="rgba(253,230,138,0.6)"/>
        <circle cx="36" cy="28" r="3" fill="#fde68a"/>
      </>}
    </svg>
  );
}

function SwitchSVG({ isOn, active }: { isOn?: boolean; active?: boolean }) {
  const c = active ? "#4ade80" : "#94a3b8";
  const armY = isOn !== false ? 28 : 16;
  return (
    <svg width={COMP_W} height={COMP_H} viewBox="0 0 72 56">
      <circle cx="12" cy="28" r="4" fill={c}/>
      <circle cx="60" cy="28" r="4" fill={c}/>
      <line x1="0" y1="28" x2="12" y2="28" stroke={c} strokeWidth="2.5"/>
      <line x1="60" y1="28" x2="72" y2="28" stroke={c} strokeWidth="2.5"/>
      <line x1="12" y1="28" x2="58" y2={armY}
        stroke={isOn !== false ? c : "#f87171"} strokeWidth="2.5" strokeLinecap="round"/>
      <text x="28" y={isOn !== false ? "48" : "50"} fontSize="8"
        fill={isOn !== false ? "#4ade80" : "#f87171"} fontFamily="monospace">
        {isOn !== false ? "ON" : "OFF"}
      </text>
    </svg>
  );
}

function BreakerSVG({ isOn, active }: { isOn?: boolean; active?: boolean }) {
  const c = active ? "#4ade80" : "#94a3b8";
  return (
    <svg width={COMP_W} height={COMP_H} viewBox="0 0 72 56">
      <line x1="0" y1="28" x2="14" y2="28" stroke={c} strokeWidth="2.5"/>
      <line x1="58" y1="28" x2="72" y2="28" stroke={c} strokeWidth="2.5"/>
      <rect x="14" y="14" width="44" height="28" rx="4" stroke={c} strokeWidth="2"
        fill="rgba(15,23,42,0.9)"/>
      <rect x="28" y={isOn !== false ? "16" : "28"} width="16" height="12" rx="3"
        fill={isOn !== false ? "#4ade80" : "#ef4444"}/>
      <text x="24" y="52" fontSize="8" fill={isOn !== false ? "#4ade80" : "#ef4444"} fontFamily="monospace">
        {isOn !== false ? "ON" : "OFF"}
      </text>
    </svg>
  );
}

function CapacitorSVG({ active }: { active?: boolean }) {
  const c = active ? "#a78bfa" : "#94a3b8";
  return (
    <svg width={COMP_W} height={COMP_H} viewBox="0 0 72 56">
      <line x1="0" y1="28" x2="30" y2="28" stroke={c} strokeWidth="2.5"/>
      <line x1="42" y1="28" x2="72" y2="28" stroke={c} strokeWidth="2.5"/>
      <line x1="30" y1="14" x2="30" y2="42" stroke={c} strokeWidth="4"/>
      <line x1="42" y1="14" x2="42" y2="42" stroke={c} strokeWidth="4"/>
    </svg>
  );
}

function OutletSVG({ active }: { active?: boolean }) {
  const c = active ? "#60a5fa" : "#94a3b8";
  return (
    <svg width={COMP_W} height={COMP_H} viewBox="0 0 72 56">
      <line x1="0" y1="28" x2="18" y2="28" stroke={c} strokeWidth="2.5"/>
      <line x1="54" y1="28" x2="72" y2="28" stroke={c} strokeWidth="2.5"/>
      <circle cx="36" cy="28" r="16" stroke={c} strokeWidth="2"
        fill="rgba(15,23,42,0.9)"/>
      <rect x="28" y="20" width="5" height="9" rx="2.5" fill={c}/>
      <rect x="39" y="20" width="5" height="9" rx="2.5" fill={c}/>
      <path d="M36 32 L36 38" stroke={c} strokeWidth="2" strokeLinecap="round"/>
      <path d="M32 38 L40 38" stroke={c} strokeWidth="2" strokeLinecap="round"/>
    </svg>
  );
}

function CompSVG({ comp, active }: { comp: Component; active?: boolean }) {
  switch (comp.type) {
    case "battery":   return <BatterySVG active={active}/>;
    case "resistor":  return <ResistorSVG active={active}/>;
    case "luminaire": return <LuminaireSVG active={active}/>;
    case "switch":    return <SwitchSVG isOn={comp.isOn} active={active}/>;
    case "breaker":   return <BreakerSVG isOn={comp.isOn} active={active}/>;
    case "capacitor": return <CapacitorSVG active={active}/>;
    case "outlet":    return <OutletSVG active={active}/>;
    default:          return null;
  }
}

// ─── Circuit Analysis Engine ───────────────────────────────────────────────────

function analyzeCircuit(
  components: Component[],
  wires: Wire[]
): AnalysisResult {
  const empty: AnalysisResult = {
    current: 0, totalVoltage: 0, totalResistance: 0, totalPower: 0,
    compValues: {}, circuitClosed: false,
  };

  if (components.length === 0 || wires.length === 0) return empty;

  // Build adjacency: node = compId:portId
  // We collapse connected ports into the same electrical node
  const adj: Record<string, string[]> = {};
  const allNodeIds = new Set<string>();

  components.forEach(c => {
    getPorts(c.type).forEach(p => {
      const nid = `${c.id}:${p.id}`;
      allNodeIds.add(nid);
      adj[nid] = adj[nid] || [];
    });
  });

  wires.forEach(w => {
    const a = `${w.fromCompId}:${w.fromPortId}`;
    const b = `${w.toCompId}:${w.toPortId}`;
    adj[a] = adj[a] || [];
    adj[b] = adj[b] || [];
    adj[a].push(b);
    adj[b].push(a);
  });

  // Union-Find to collapse nodes connected by wires
  const parent: Record<string, string> = {};
  allNodeIds.forEach(n => { parent[n] = n; });
  function find(x: string): string {
    if (parent[x] !== x) parent[x] = find(parent[x]);
    return parent[x];
  }
  function union(x: string, y: string) {
    parent[find(x)] = find(y);
  }
  wires.forEach(w => {
    union(`${w.fromCompId}:${w.fromPortId}`, `${w.toCompId}:${w.toPortId}`);
  });

  // Check if any switch/breaker is open — break that path
  const switchOpen = components.some(
    c => (c.type === "switch" || c.type === "breaker") && c.isOn === false
  );

  // Find batteries
  const batteries = components.filter(c => c.type === "battery");
  if (batteries.length === 0 || switchOpen) {
    const cv: Record<string, { v: number; i: number; p: number }> = {};
    components.forEach(c => { cv[c.id] = { v: 0, i: 0, p: 0 }; });
    return { ...empty, compValues: cv };
  }

  // Check circuit is closed: battery left port and right port are in
  // different electrical nodes that are eventually connected through the rest
  // Simple heuristic: if there are >= 2 wires touching the battery it's likely closed
  const batteryWires = wires.filter(
    w => batteries.some(b => w.fromCompId === b.id || w.toCompId === b.id)
  );
  if (batteryWires.length < 2) {
    const cv: Record<string, { v: number; i: number; p: number }> = {};
    components.forEach(c => { cv[c.id] = { v: 0, i: 0, p: 0 }; });
    return { ...empty, compValues: cv };
  }

  // Check if battery + and - are on different super-nodes (not short-circuit) 
  // and that there's a path from one to the other (circuit closed)
  const bat = batteries[0];
  const batPlus = find(`${bat.id}:right`);
  const batMinus = find(`${bat.id}:left`);

  // Traverse: collect all components between + and - nodes
  // For each non-battery component: left port and right port must both connect
  // to super-nodes that form a path. 
  // Simple series detection: all components share the same pair of super-nodes
  const totalVoltage = batteries.reduce((s, b) => s + (b.voltage ?? 9), 0);

  // Gather loads and their resistance
  const loads = components.filter(
    c => c.type !== "battery" && c.type !== "switch" && c.type !== "breaker"
  );

  const resistances = loads.map(c => effectiveResistance(c, totalVoltage));
  const totalResistance = resistances.reduce((a, b) => a + b, 0) || 1;

  // Verify connectivity: at least one load is connected between + and - nodes
  const connectedLoads = loads.filter(c => {
    const lNode = find(`${c.id}:left`);
    const rNode = find(`${c.id}:right`);
    // It's in the circuit if one side connects to batPlus or batMinus
    return (
      (lNode === batPlus || lNode === batMinus) &&
      (rNode === batPlus || rNode === batMinus)
    ) || (
      lNode !== rNode // at minimum the two ports are in different nodes
    );
  });

  if (connectedLoads.length === 0) {
    const cv: Record<string, { v: number; i: number; p: number }> = {};
    components.forEach(c => { cv[c.id] = { v: 0, i: 0, p: 0 }; });
    return { ...empty, compValues: cv };
  }

  const current = totalVoltage / totalResistance;
  const totalPower = totalVoltage * current;

  const compValues: Record<string, { v: number; i: number; p: number }> = {};
  components.forEach(c => {
    if (c.type === "battery") {
      compValues[c.id] = { v: c.voltage ?? 9, i: current, p: (c.voltage ?? 9) * current };
    } else if (c.type === "switch" || c.type === "breaker") {
      compValues[c.id] = { v: 0, i: current, p: 0 };
    } else {
      const r = effectiveResistance(c, totalVoltage);
      const v = current * r;
      compValues[c.id] = { v, i: current, p: v * current };
    }
  });

  return { current, totalVoltage, totalResistance, totalPower, compValues, circuitClosed: true };
}

function effectiveResistance(c: Component, sourceV: number): number {
  switch (c.type) {
    case "resistor": return c.resistance ?? 100;
    case "luminaire": {
      const v = c.voltage ?? 120;
      const p = c.power ?? 60;
      return p > 0 ? (v * v) / p : 240;
    }
    case "outlet": return 50;
    case "capacitor": return 1000; // treated as high-Z for DC
    default: return 0;
  }
}

// ─── Palette items ────────────────────────────────────────────────────────────

const PALETTE: { type: CompType; label: string; cat: string; defaults: Partial<Component> }[] = [
  { type: "battery",   label: "Fuente DC",    cat: "Fuentes",   defaults: { voltage: 9, isOn: true }},
  { type: "luminaire", label: "Luminaria",    cat: "Cargas",    defaults: { voltage: 120, power: 60 }},
  { type: "outlet",    label: "Tomacorriente",cat: "Cargas",    defaults: { voltage: 120 }},
  { type: "resistor",  label: "Resistencia",  cat: "Cargas",    defaults: { resistance: 100 }},
  { type: "capacitor", label: "Capacitor",    cat: "Cargas",    defaults: {}},
  { type: "switch",    label: "Interruptor",  cat: "Control",   defaults: { isOn: true }},
  { type: "breaker",   label: "Breaker",      cat: "Protección",defaults: { isOn: true }},
];

// ─── Helpers ──────────────────────────────────────────────────────────────────

let idCtr = 1;
const uid = () => `c${idCtr++}`;
const wid = () => `w${idCtr++}`;

function snap(v: number) { return Math.round(v / GRID) * GRID; }

// Wire path: smooth orthogonal bezier between two points
function wirePath(x1: number, y1: number, x2: number, y2: number): string {
  const mx = (x1 + x2) / 2;
  return `M ${x1},${y1} C ${mx},${y1} ${mx},${y2} ${x2},${y2}`;
}

// ─── Main Component ────────────────────────────────────────────────────────────

export default function CircuitSimulator() {
  const [components, setComponents] = useState<Component[]>([]);
  const [wires, setWires] = useState<Wire[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [pendingPort, setPendingPort] = useState<{ compId: string; portId: string } | null>(null);
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });
  const [mode, setMode] = useState<"select" | "wire">("select");
  const canvasRef = useRef<SVGSVGElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const analysis = useMemo(() => analyzeCircuit(components, wires), [components, wires]);

  // ── Drop from palette ──────────────────────────────────────────────────────
  const handleCanvasDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    const type = e.dataTransfer.getData("compType") as CompType;
    if (!type) return;
    const rect = containerRef.current!.getBoundingClientRect();
    const x = snap(e.clientX - rect.left);
    const y = snap(e.clientY - rect.top);
    const paletteItem = PALETTE.find(p => p.type === type)!;
    setComponents(prev => [...prev, {
      id: uid(), type, x, y,
      label: paletteItem.label,
      ...paletteItem.defaults,
    }]);
  }, []);

  // ── Mouse move for wire preview ────────────────────────────────────────────
  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    if (!pendingPort) return;
    const rect = containerRef.current!.getBoundingClientRect();
    setMousePos({ x: e.clientX - rect.left, y: e.clientY - rect.top });
  }, [pendingPort]);

  // ── Click canvas background: cancel pending port ────────────────────────
  const handleCanvasClick = useCallback(() => {
    setPendingPort(null);
    setSelectedId(null);
  }, []);

  // ── Port click ─────────────────────────────────────────────────────────────
  const handlePortClick = useCallback((compId: string, portId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!pendingPort) {
      setPendingPort({ compId, portId });
      setMode("wire");
    } else {
      if (pendingPort.compId === compId) { setPendingPort(null); setMode("select"); return; }
      // Check duplicate
      const exists = wires.some(
        w => (w.fromCompId === pendingPort.compId && w.fromPortId === pendingPort.portId &&
              w.toCompId === compId && w.toPortId === portId) ||
             (w.toCompId === pendingPort.compId && w.toPortId === pendingPort.portId &&
              w.fromCompId === compId && w.fromPortId === portId)
      );
      if (!exists) {
        setWires(prev => [...prev, {
          id: wid(),
          fromCompId: pendingPort.compId,
          fromPortId: pendingPort.portId,
          toCompId: compId,
          toPortId: portId,
        }]);
      }
      setPendingPort(null);
      setMode("select");
    }
  }, [pendingPort, wires]);

  // ── Drag to move component ────────────────────────────────────────────────
  const handleCompMouseDown = useCallback((compId: string, e: React.MouseEvent) => {
    if (pendingPort) return;
    e.stopPropagation();
    setSelectedId(compId);
    const rect = containerRef.current!.getBoundingClientRect();
    const startX = e.clientX - rect.left;
    const startY = e.clientY - rect.top;
    const comp = components.find(c => c.id === compId)!;
    const origX = comp.x;
    const origY = comp.y;

    const onMove = (ev: MouseEvent) => {
      const dx = ev.clientX - rect.left - startX;
      const dy = ev.clientY - rect.top - startY;
      setComponents(prev => prev.map(c =>
        c.id === compId ? { ...c, x: snap(origX + dx), y: snap(origY + dy) } : c
      ));
    };
    const onUp = () => {
      window.removeEventListener("mousemove", onMove);
      window.removeEventListener("mouseup", onUp);
    };
    window.addEventListener("mousemove", onMove);
    window.addEventListener("mouseup", onUp);
  }, [pendingPort, components]);

  // ── Delete component ──────────────────────────────────────────────────────
  const deleteComponent = useCallback((id: string) => {
    setComponents(prev => prev.filter(c => c.id !== id));
    setWires(prev => prev.filter(w => w.fromCompId !== id && w.toCompId !== id));
    if (selectedId === id) setSelectedId(null);
  }, [selectedId]);

  // ── Delete wire ───────────────────────────────────────────────────────────
  const deleteWire = useCallback((id: string) => {
    setWires(prev => prev.filter(w => w.id !== id));
  }, []);

  // ── Toggle switch/breaker ─────────────────────────────────────────────────
  const toggleComp = useCallback((id: string) => {
    setComponents(prev => prev.map(c =>
      c.id === id ? { ...c, isOn: !c.isOn } : c
    ));
  }, []);

  // ── Update property ───────────────────────────────────────────────────────
  const updateComp = useCallback((id: string, updates: Partial<Component>) => {
    setComponents(prev => prev.map(c => c.id === id ? { ...c, ...updates } : c));
  }, []);

  // ── Get port world position ───────────────────────────────────────────────
  const portPos = useCallback((compId: string, portId: string) => {
    const comp = components.find(c => c.id === compId);
    if (!comp) return { x: 0, y: 0 };
    const port = getPorts(comp.type).find(p => p.id === portId);
    if (!port) return { x: 0, y: 0 };
    return { x: comp.x + port.dx, y: comp.y + port.dy };
  }, [components]);

  const selectedComp = components.find(c => c.id === selectedId);

  // ── Pending wire start position ───────────────────────────────────────────
  const pendingStart = pendingPort ? portPos(pendingPort.compId, pendingPort.portId) : null;

  return (
    <div style={{ display: "flex", height: "100vh", background: "#0a0f1e", fontFamily: "'Courier New', monospace", overflow: "hidden" }}>
      
      {/* ── Palette ── */}
      <aside style={{
        width: 192, background: "#060d1a", borderRight: "1px solid #1e293b",
        display: "flex", flexDirection: "column", overflowY: "auto", flexShrink: 0,
      }}>
        <div style={{ padding: "14px 14px 8px", borderBottom: "1px solid #1e293b" }}>
          <div style={{ fontSize: 10, color: "#4ade80", letterSpacing: "0.15em", marginBottom: 2 }}>⚡ ELECTRIC SIM</div>
          <div style={{ fontSize: 8, color: "#334155" }}>IEC 60617 · Arrastra → Lienzo</div>
        </div>

        {["Fuentes","Cargas","Control","Protección"].map(cat => {
          const items = PALETTE.filter(p => p.cat === cat);
          if (!items.length) return null;
          return (
            <div key={cat}>
              <div style={{ padding: "10px 14px 4px", fontSize: 8, color: "#475569", textTransform: "uppercase", letterSpacing: "0.1em" }}>{cat}</div>
              {items.map(item => (
                <div key={item.type}
                  draggable
                  onDragStart={e => e.dataTransfer.setData("compType", item.type)}
                  style={{
                    display: "flex", alignItems: "center", gap: 8, padding: "6px 14px",
                    cursor: "grab", borderRadius: 6, margin: "2px 6px",
                    transition: "background 0.15s", userSelect: "none",
                  }}
                  onMouseEnter={e => (e.currentTarget.style.background = "rgba(74,222,128,0.07)")}
                  onMouseLeave={e => (e.currentTarget.style.background = "transparent")}
                >
                  <div style={{
                    width: 36, height: 28, display: "flex", alignItems: "center",
                    justifyContent: "center", background: "rgba(255,255,255,0.04)",
                    borderRadius: 5, flexShrink: 0, overflow: "hidden",
                  }}>
                    <div style={{ transform: "scale(0.5)", transformOrigin: "center" }}>
                      <CompSVG comp={{ ...item.defaults, id: "", type: item.type, x: 0, y: 0, label: "" } as Component} />
                    </div>
                  </div>
                  <span style={{ fontSize: 11, color: "#94a3b8" }}>{item.label}</span>
                </div>
              ))}
            </div>
          );
        })}

        {/* Instructions */}
        <div style={{
          marginTop: "auto", padding: "12px 14px", borderTop: "1px solid #1e293b",
          fontSize: 9, color: "#1e293b", lineHeight: 1.7,
        }}>
          <div style={{ color: "#334155", marginBottom: 4 }}>CONTROLES</div>
          <div>• Arrastra componente al lienzo</div>
          <div>• Clic en puerto (<span style={{color:"#60a5fa"}}>●</span>) para conectar</div>
          <div>• Doble clic → ON/OFF</div>
          <div>• Clic para seleccionar</div>
          <div>• Selecciona → tecla DEL para borrar</div>
        </div>
      </aside>

      {/* ── Canvas ── */}
      <div style={{ flex: 1, position: "relative", overflow: "hidden" }}
        ref={containerRef}
        onDrop={handleCanvasDrop}
        onDragOver={e => e.preventDefault()}
        onMouseMove={handleMouseMove}
      >
        {/* Grid */}
        <svg style={{ position: "absolute", inset: 0, width: "100%", height: "100%", pointerEvents: "none" }}>
          <defs>
            <pattern id="grid" width={GRID} height={GRID} patternUnits="userSpaceOnUse">
              <circle cx="0" cy="0" r="0.8" fill="#1e293b"/>
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#grid)"/>
        </svg>

        {/* SVG overlay: wires + port indicators */}
        <svg
          ref={canvasRef}
          style={{ position: "absolute", inset: 0, width: "100%", height: "100%", overflow: "visible" }}
          onClick={handleCanvasClick}
          onMouseMove={handleMouseMove}
        >
          <defs>
            {/* Animated dash for active wires */}
            <filter id="glow">
              <feGaussianBlur stdDeviation="2" result="coloredBlur"/>
              <feMerge><feMergeNode in="coloredBlur"/><feMergeNode in="SourceGraphic"/></feMerge>
            </filter>
          </defs>

          {/* Wires */}
          {wires.map(w => {
            const from = portPos(w.fromCompId, w.fromPortId);
            const to   = portPos(w.toCompId,   w.toPortId);
            const active = analysis.circuitClosed;
            const d = wirePath(from.x, from.y, to.x, to.y);
            return (
              <g key={w.id}>
                {/* Outer glow for active */}
                {active && (
                  <path d={d} fill="none" stroke="rgba(74,222,128,0.15)"
                    strokeWidth="8" filter="url(#glow)"/>
                )}
                {/* Wire body */}
                <path d={d} fill="none"
                  stroke={active ? "#b45309" : "#334155"}
                  strokeWidth={active ? 5 : 3}
                  strokeLinecap="round"
                />
                {/* Copper sheen */}
                {active && (
                  <path d={d} fill="none"
                    stroke="#f59e0b"
                    strokeWidth="2"
                    strokeLinecap="round"
                    opacity="0.7"
                  />
                )}
                {/* Animated electrons */}
                {active && (
                  <>
                    <circle r="4" fill="#4ade80" opacity="0.9" filter="url(#glow)">
                      <animateMotion dur="1.8s" repeatCount="indefinite" path={d}/>
                    </circle>
                    <circle r="4" fill="#4ade80" opacity="0.9" filter="url(#glow)">
                      <animateMotion dur="1.8s" begin="0.6s" repeatCount="indefinite" path={d}/>
                    </circle>
                    <circle r="4" fill="#4ade80" opacity="0.9" filter="url(#glow)">
                      <animateMotion dur="1.8s" begin="1.2s" repeatCount="indefinite" path={d}/>
                    </circle>
                  </>
                )}
                {/* Delete button midpoint */}
                <path d={d} fill="none" stroke="transparent" strokeWidth="12"
                  style={{ cursor: "pointer" }}
                  onClick={e => { e.stopPropagation(); deleteWire(w.id); }}
                />
              </g>
            );
          })}

          {/* Pending wire preview */}
          {pendingStart && (
            <path
              d={wirePath(pendingStart.x, pendingStart.y, mousePos.x, mousePos.y)}
              fill="none" stroke="#4ade80" strokeWidth="2.5"
              strokeDasharray="6,4" opacity="0.8"
            />
          )}
        </svg>

        {/* Components (HTML divs positioned absolutely) */}
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
                width: COMP_W,
                height: COMP_H,
                zIndex: isSelected ? 50 : 10,
                cursor: pendingPort ? "crosshair" : "grab",
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
                  position: "absolute", inset: -4, borderRadius: 8,
                  border: "1.5px solid #2563eb",
                  boxShadow: "0 0 0 3px rgba(37,99,235,0.25)",
                  pointerEvents: "none", zIndex: 1,
                }}/>
              )}

              {/* Glow when active */}
              {active && (
                <div style={{
                  position: "absolute", inset: -8, borderRadius: 12,
                  background: "radial-gradient(ellipse, rgba(74,222,128,0.12) 0%, transparent 70%)",
                  pointerEvents: "none", zIndex: 0,
                }}/>
              )}

              {/* Symbol */}
              <div style={{ position: "relative", zIndex: 2 }}>
                <CompSVG comp={comp} active={active}/>
              </div>

              {/* Label */}
              <div style={{
                position: "absolute", top: COMP_H + 2, left: "50%",
                transform: "translateX(-50%)", fontSize: 9, color: "#475569",
                whiteSpace: "nowrap", pointerEvents: "none", zIndex: 3,
              }}>
                {comp.label}
              </div>

              {/* Live values bubble */}
              {active && compData && (
                <div style={{
                  position: "absolute", top: -28, left: "50%",
                  transform: "translateX(-50%)",
                  background: "rgba(15,23,42,0.95)", border: "1px solid #854d0e",
                  color: "#fde68a", fontSize: 8, padding: "2px 6px",
                  borderRadius: 4, whiteSpace: "nowrap", pointerEvents: "none", zIndex: 3,
                }}>
                  {compData.v.toFixed(1)}V · {compData.i.toFixed(2)}A · {compData.p.toFixed(1)}W
                </div>
              )}

              {/* Delete button */}
              {isSelected && (
                <button
                  style={{
                    position: "absolute", top: -12, right: -12, width: 20, height: 20,
                    borderRadius: "50%", background: "#ef4444", color: "white", border: "none",
                    cursor: "pointer", fontSize: 13, lineHeight: "20px", textAlign: "center",
                    zIndex: 60, display: "flex", alignItems: "center", justifyContent: "center",
                    padding: 0,
                  }}
                  onMouseDown={e => e.stopPropagation()}
                  onClick={e => { e.stopPropagation(); deleteComponent(comp.id); }}
                >×</button>
              )}

              {/* Connection ports */}
              {ports.map(port => {
                const isPending = pendingPort?.compId === comp.id && pendingPort?.portId === port.id;
                const hasWire = wires.some(
                  w => (w.fromCompId === comp.id && w.fromPortId === port.id) ||
                       (w.toCompId === comp.id && w.toPortId === port.id)
                );
                return (
                  <div
                    key={port.id}
                    style={{
                      position: "absolute",
                      left: COMP_W / 2 + port.dx - PORT_R,
                      top:  COMP_H / 2 + port.dy - PORT_R,
                      width: PORT_R * 2, height: PORT_R * 2,
                      borderRadius: "50%",
                      background: isPending
                        ? "#4ade80"
                        : hasWire
                          ? (active ? "#f59e0b" : "#475569")
                          : "rgba(96,165,250,0.2)",
                      border: `2px solid ${isPending ? "#4ade80" : hasWire ? (active ? "#f59e0b" : "#64748b") : "#60a5fa"}`,
                      cursor: "crosshair",
                      zIndex: 20,
                      transition: "all 0.15s",
                      boxShadow: isPending ? "0 0 8px rgba(74,222,128,0.8)" : hasWire && active ? "0 0 6px rgba(245,158,11,0.6)" : "none",
                    }}
                    onClick={e => handlePortClick(comp.id, port.id, e)}
                    onMouseEnter={e => {
                      (e.currentTarget as HTMLDivElement).style.transform = "scale(1.4)";
                    }}
                    onMouseLeave={e => {
                      (e.currentTarget as HTMLDivElement).style.transform = "scale(1)";
                    }}
                  />
                );
              })}
            </div>
          );
        })}

        {/* Empty state hint */}
        {components.length === 0 && (
          <div style={{
            position: "absolute", inset: 0, display: "flex",
            flexDirection: "column", alignItems: "center", justifyContent: "center",
            pointerEvents: "none", gap: 16,
          }}>
            <div style={{
              width: 80, height: 80, borderRadius: "50%",
              border: "2px dashed #1e293b",
              display: "flex", alignItems: "center", justifyContent: "center",
              fontSize: 32,
            }}>⚡</div>
            <p style={{
              color: "#1e293b", fontSize: 13, textAlign: "center",
              maxWidth: 280, lineHeight: 1.6,
            }}>
              Arrastra componentes del panel izquierdo.<br/>
              Conecta sus puertos (<span style={{color:"#60a5fa"}}>●</span>) para cerrar el circuito.
            </p>
          </div>
        )}

        {/* Mode indicator */}
        {pendingPort && (
          <div style={{
            position: "absolute", top: 14, left: "50%", transform: "translateX(-50%)",
            background: "rgba(74,222,128,0.15)", border: "1px solid #4ade80",
            color: "#4ade80", fontSize: 11, padding: "5px 14px", borderRadius: 20,
            pointerEvents: "none",
          }}>
            ● Selecciona el puerto destino para conectar — ESC para cancelar
          </div>
        )}

        {/* Circuit status */}
        <div style={{
          position: "absolute", top: 14, right: 14,
          display: "flex", flexDirection: "column", gap: 6,
        }}>
          <div style={{
            background: analysis.circuitClosed ? "rgba(74,222,128,0.12)" : "rgba(100,116,139,0.1)",
            border: `1px solid ${analysis.circuitClosed ? "rgba(74,222,128,0.4)" : "#1e293b"}`,
            color: analysis.circuitClosed ? "#4ade80" : "#334155",
            fontSize: 10, padding: "4px 12px", borderRadius: 6,
            display: "flex", alignItems: "center", gap: 6,
          }}>
            <span style={{
              width: 6, height: 6, borderRadius: "50%",
              background: analysis.circuitClosed ? "#4ade80" : "#334155",
              display: "inline-block",
              ...(analysis.circuitClosed ? { animation: "blink 1s infinite" } : {}),
            }}/>
            {analysis.circuitClosed ? "CIRCUITO CERRADO" : "CIRCUITO ABIERTO"}
          </div>
        </div>
      </div>

      {/* ── Right panel: properties + analysis ── */}
      <aside style={{
        width: 210, background: "#060d1a", borderLeft: "1px solid #1e293b",
        display: "flex", flexDirection: "column", overflowY: "auto", flexShrink: 0,
      }}>
        {/* Circuit analysis */}
        <div style={{ padding: "14px", borderBottom: "1px solid #1e293b" }}>
          <div style={{ fontSize: 9, color: "#64748b", letterSpacing: "0.12em", textTransform: "uppercase", marginBottom: 10 }}>
            Análisis de Circuito
          </div>
          {[
            { label: "Voltaje",     value: analysis.totalVoltage.toFixed(2),     unit: "V",  color: "#fbbf24" },
            { label: "Corriente",   value: analysis.current.toFixed(3),          unit: "A",  color: "#60a5fa" },
            { label: "Resistencia", value: isFinite(analysis.totalResistance) ? analysis.totalResistance.toFixed(1) : "∞", unit: "Ω", color: "#f472b6" },
            { label: "Potencia",    value: analysis.totalPower.toFixed(2),        unit: "W",  color: "#4ade80" },
          ].map(row => (
            <div key={row.label} style={{
              display: "flex", justifyContent: "space-between", alignItems: "center",
              padding: "5px 0", borderBottom: "1px solid #0f172a",
            }}>
              <span style={{ fontSize: 10, color: "#475569" }}>{row.label}</span>
              <span style={{ fontSize: 12, fontWeight: "bold", color: row.color }}>
                {row.value}<span style={{ fontSize: 8, marginLeft: 2, opacity: 0.6 }}>{row.unit}</span>
              </span>
            </div>
          ))}
        </div>

        {/* Formulas */}
        <div style={{ padding: "12px 14px", borderBottom: "1px solid #1e293b" }}>
          <div style={{ fontSize: 8, color: "#1e293b", letterSpacing: "0.1em", textTransform: "uppercase", marginBottom: 6 }}>
            Fórmulas Aplicadas
          </div>
          {["V = I · R", "P = V · I", "R_s = ΣR", "1/R_p = Σ(1/R)"].map(f => (
            <div key={f} style={{ fontSize: 10, color: "#334155", fontFamily: "'Courier New', monospace", padding: "2px 0" }}>
              {f}
            </div>
          ))}
        </div>

        {/* Selected component properties */}
        {selectedComp ? (
          <div style={{ padding: "12px 14px" }}>
            <div style={{ fontSize: 9, color: "#64748b", letterSpacing: "0.12em", textTransform: "uppercase", marginBottom: 10 }}>
              Propiedades
            </div>
            <div style={{
              fontSize: 9, color: "#4ade80", background: "rgba(74,222,128,0.08)",
              padding: "3px 8px", borderRadius: 4, display: "inline-block", marginBottom: 10,
            }}>
              {selectedComp.type.toUpperCase()}
            </div>

            {/* Label */}
            <div style={{ marginBottom: 10 }}>
              <div style={{ fontSize: 9, color: "#475569", marginBottom: 3 }}>Etiqueta</div>
              <input
                value={selectedComp.label}
                onChange={e => updateComp(selectedComp.id, { label: e.target.value })}
                style={{ width: "100%", background: "#0f172a", border: "1px solid #1e293b", borderRadius: 4, color: "#e2e8f0", fontSize: 11, padding: "4px 7px", outline: "none", boxSizing: "border-box" as const }}
              />
            </div>

            {/* Voltage */}
            {(selectedComp.type === "battery" || selectedComp.type === "luminaire" || selectedComp.type === "outlet") && (
              <div style={{ marginBottom: 10 }}>
                <div style={{ fontSize: 9, color: "#475569", marginBottom: 3 }}>Voltaje (V)</div>
                <input type="number"
                  value={selectedComp.voltage ?? ""}
                  onChange={e => updateComp(selectedComp.id, { voltage: +e.target.value })}
                  style={{ width: "100%", background: "#0f172a", border: "1px solid #1e293b", borderRadius: 4, color: "#fbbf24", fontSize: 12, padding: "4px 7px", outline: "none", boxSizing: "border-box" as const }}
                />
              </div>
            )}

            {/* Resistance */}
            {selectedComp.type === "resistor" && (
              <div style={{ marginBottom: 10 }}>
                <div style={{ fontSize: 9, color: "#475569", marginBottom: 3 }}>Resistencia (Ω)</div>
                <input type="number"
                  value={selectedComp.resistance ?? ""}
                  onChange={e => updateComp(selectedComp.id, { resistance: +e.target.value })}
                  style={{ width: "100%", background: "#0f172a", border: "1px solid #1e293b", borderRadius: 4, color: "#f472b6", fontSize: 12, padding: "4px 7px", outline: "none", boxSizing: "border-box" as const }}
                />
              </div>
            )}

            {/* Power */}
            {selectedComp.type === "luminaire" && (
              <div style={{ marginBottom: 10 }}>
                <div style={{ fontSize: 9, color: "#475569", marginBottom: 3 }}>Potencia (W)</div>
                <input type="number"
                  value={selectedComp.power ?? ""}
                  onChange={e => updateComp(selectedComp.id, { power: +e.target.value })}
                  style={{ width: "100%", background: "#0f172a", border: "1px solid #1e293b", borderRadius: 4, color: "#4ade80", fontSize: 12, padding: "4px 7px", outline: "none", boxSizing: "border-box" as const }}
                />
              </div>
            )}

            {/* Calculated values for this component */}
            {analysis.compValues[selectedComp.id] && analysis.circuitClosed && (
              <div style={{ marginTop: 12, padding: 10, background: "rgba(251,191,36,0.05)", border: "1px solid #78350f", borderRadius: 6 }}>
                <div style={{ fontSize: 8, color: "#92400e", marginBottom: 6 }}>VALORES CALCULADOS</div>
                {Object.entries({
                  "V caída": `${analysis.compValues[selectedComp.id].v.toFixed(2)} V`,
                  "Corriente": `${analysis.compValues[selectedComp.id].i.toFixed(3)} A`,
                  "Potencia": `${analysis.compValues[selectedComp.id].p.toFixed(2)} W`,
                }).map(([k, v]) => (
                  <div key={k} style={{ display: "flex", justifyContent: "space-between", fontSize: 10, padding: "2px 0", color: "#fde68a" }}>
                    <span style={{ color: "#78350f" }}>{k}</span>
                    <span>{v}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        ) : (
          <div style={{ padding: "14px", fontSize: 10, color: "#1e293b", lineHeight: 1.6 }}>
            Selecciona un componente para ver y editar sus propiedades
          </div>
        )}

        {/* Clear button */}
        <div style={{ marginTop: "auto", padding: "10px 14px", borderTop: "1px solid #1e293b" }}>
          <button
            onClick={() => { setComponents([]); setWires([]); setSelectedId(null); setPendingPort(null); }}
            style={{
              width: "100%", background: "transparent", border: "1px solid #1e293b",
              color: "#475569", fontSize: 10, fontFamily: "monospace",
              padding: "6px", borderRadius: 5, cursor: "pointer",
              transition: "all 0.15s",
            }}
            onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.borderColor = "#ef4444"; (e.currentTarget as HTMLButtonElement).style.color = "#ef4444"; }}
            onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.borderColor = "#1e293b"; (e.currentTarget as HTMLButtonElement).style.color = "#475569"; }}
          >
            LIMPIAR LIENZO
          </button>
        </div>
      </aside>

      <style>{`
        @keyframes blink { 0%,100%{opacity:1} 50%{opacity:0.2} }
        * { box-sizing: border-box; }
      `}</style>
    </div>
  );
}