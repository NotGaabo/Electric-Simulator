"use client";

import React, { useState, useRef, useCallback, useEffect } from "react";

// ─── Types ────────────────────────────────────────────────────────────────────
type NetworkMode = "aerial" | "underground";
type ToolMode = "select" | "pole" | "conductor" | "trench" | "cable" | "label" | "cover";
type ConductorType = "phase_a" | "phase_b" | "phase_c" | "neutral" | "ground";
type PoleType = "wooden" | "concrete" | "metal";
type VoltageLevel = "LV" | "MV";

interface Pole { id: string; x: number; y: number; height: number; type: PoleType; hasAnchor: boolean; label: string; }
interface Conductor { id: string; fromPoleId: string; toPoleId: string; type: ConductorType; tension: number; crossSection: number; protected: boolean; label: string; voltage: VoltageLevel; }
interface Trench { id: string; x1: number; y1: number; x2: number; y2: number; depth: number; covered: boolean; }
interface UGCable { id: string; trenchId: string; type: ConductorType; crossSection: number; label: string; hasConduit: boolean; hasMechanicalProtection: boolean; }

// ─── Constants ────────────────────────────────────────────────────────────────
const GRID = 40;
const POLE_R = 16;
const COND_COLORS: Record<string, string> = {
  phase_a: "#ef4444", phase_b: "#f59e0b", phase_c: "#3b82f6",
  neutral: "#94a3b8", ground: "#22c55e",
};
const COND_LABELS: Record<string, string> = {
  phase_a: "Fase A", phase_b: "Fase B", phase_c: "Fase C",
  neutral: "Neutro", ground: "Tierra",
};
const POLE_META: Record<PoleType, { color: string; label: string; h: number }> = {
  wooden:   { color: "#92400e", label: "Madera",   h: 9  },
  concrete: { color: "#64748b", label: "Hormigón", h: 11 },
  metal:    { color: "#475569", label: "Metálico", h: 12 },
};

function uid() { return Math.random().toString(36).slice(2, 9); }
function snap(v: number) { return Math.round(v / GRID) * GRID; }
function dist(ax: number, ay: number, bx: number, by: number) { return Math.sqrt((bx - ax) ** 2 + (by - ay) ** 2); }
function nearestPole(mx: number, my: number, poles: Pole[]): Pole | null {
  let best: Pole | null = null; let minD = 30;
  poles.forEach(p => { const d = dist(mx, my, p.x, p.y); if (d < minD) { minD = d; best = p; } });
  return best;
}
function sagPath(x1: number, y1: number, x2: number, y2: number, tension: number): string {
  const sag = 0.01 + (1 - tension / 100) * 0.14;
  const mx = (x1 + x2) / 2, my = (y1 + y2) / 2 + dist(x1, y1, x2, y2) * sag;
  return `M ${x1} ${y1} Q ${mx} ${my} ${x2} ${y2}`;
}

// ─── 3D Pole SVG ─────────────────────────────────────────────────────────────
function Pole3D({ pole, selected, active }: { pole: Pole; selected: boolean; active: boolean }) {
  const meta = POLE_META[pole.type];
  const scale = pole.height / 11;
  const h = 60 * scale, w = 10;
  const cx = 0, cy = 0;
  return (
    <g transform={`translate(${pole.x}, ${pole.y})`}>
      {/* Shadow */}
      <ellipse cx={8} cy={4} rx={14} ry={5} fill="rgba(0,0,0,0.25)" />
      {/* Pole body - 3D effect */}
      <defs>
        <linearGradient id={`pg-${pole.id}`} x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" stopColor={meta.color} stopOpacity="0.6" />
          <stop offset="40%" stopColor={meta.color} stopOpacity="1" />
          <stop offset="100%" stopColor="#000" stopOpacity="0.4" />
        </linearGradient>
      </defs>
      <rect x={-w/2} y={-h} width={w} height={h} rx={w/2}
        fill={`url(#pg-${pole.id})`}
        stroke={selected ? "#60a5fa" : "rgba(255,255,255,0.1)"}
        strokeWidth={selected ? 2 : 0.5}
      />
      {/* Cross-arm */}
      <rect x={-20} y={-h + 8} width={40} height={5} rx={2}
        fill={meta.color} opacity={0.9}
      />
      {/* Insulators */}
      {[-16, 0, 16].map((ox, i) => (
        <ellipse key={i} cx={ox} cy={-h + 6} rx={3} ry={4}
          fill="#f1f5f9" stroke="#94a3b8" strokeWidth={0.5}
        />
      ))}
      {/* Anchor indicator */}
      {pole.hasAnchor && (
        <line x1={-w/2} y1={-h/2} x2={-30} y2={0}
          stroke="#f59e0b" strokeWidth={2} strokeDasharray="3,2"
        />
      )}
      {/* Label */}
      <text x={0} y={10} textAnchor="middle" fontSize={9}
        fill={selected ? "#60a5fa" : "#64748b"} fontFamily="monospace"
      >{pole.label}</text>
      {/* Base */}
      <ellipse cx={0} cy={0} rx={8} ry={4}
        fill={meta.color} opacity={0.7}
      />
      {/* Selection ring */}
      {selected && (
        <circle cx={0} cy={-h/2} r={POLE_R + 4}
          fill="none" stroke="#60a5fa" strokeWidth={1.5}
          strokeDasharray="4,3" opacity={0.8}
        />
      )}
    </g>
  );
}

// ─── Underground Trench SVG ───────────────────────────────────────────────────
function TrenchSVG({ trench, cables, selected }: { trench: Trench; cables: UGCable[]; selected: boolean }) {
  const dx = trench.x2 - trench.x1, dy = trench.y2 - trench.y1;
  const len = Math.sqrt(dx * dx + dy * dy);
  const angle = Math.atan2(dy, dx) * 180 / Math.PI;
  const trenchCables = cables.filter(c => c.trenchId === trench.id);

  return (
    <g>
      {/* Soil excavation fill */}
      <line x1={trench.x1} y1={trench.y1} x2={trench.x2} y2={trench.y2}
        stroke={trench.covered ? "#78350f" : "#92400e"}
        strokeWidth={trench.covered ? 16 : 20}
        strokeLinecap="round"
        opacity={0.4}
      />
      {/* Trench outline */}
      <line x1={trench.x1} y1={trench.y1} x2={trench.x2} y2={trench.y2}
        stroke={selected ? "#60a5fa" : trench.covered ? "#6b7280" : "#b45309"}
        strokeWidth={selected ? 22 : 20}
        strokeLinecap="round"
        fill="none"
        strokeDasharray={trench.covered ? "none" : "8,4"}
        opacity={selected ? 0.5 : 0.3}
      />
      {/* Cables inside trench */}
      {trenchCables.map((cable, i) => {
        const offset = (i - (trenchCables.length - 1) / 2) * 4;
        const nx = -dy / len * offset, ny = dx / len * offset;
        return (
          <line key={cable.id}
            x1={trench.x1 + nx} y1={trench.y1 + ny}
            x2={trench.x2 + nx} y2={trench.y2 + ny}
            stroke={COND_COLORS[cable.type]}
            strokeWidth={3}
            strokeLinecap="round"
            opacity={trench.covered ? 0.6 : 0.9}
          />
        );
      })}
      {/* Depth label */}
      <text
        x={(trench.x1 + trench.x2) / 2}
        y={(trench.y1 + trench.y2) / 2 - 14}
        textAnchor="middle" fontSize={8} fill="#78350f" fontFamily="monospace"
      >
        {trench.depth.toFixed(1)}m {trench.covered ? "✓" : "⚠ sin cubrir"}
      </text>
    </g>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────
export default function PowerNetwork() {
  const [mode, setMode] = useState<NetworkMode>("aerial");
  const [tool, setTool] = useState<ToolMode>("select");
  const [poles, setPoles] = useState<Pole[]>([]);
  const [conductors, setConductors] = useState<Conductor[]>([]);
  const [trenches, setTrenches] = useState<Trench[]>([]);
  const [ugCables, setUGCables] = useState<UGCable[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [pendingPole, setPendingPole] = useState<string | null>(null); // pole id waiting for conductor dest
  const [trenchStart, setTrenchStart] = useState<{ x: number; y: number } | null>(null);
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });
  const [poleType, setPoleType] = useState<PoleType>("concrete");
  const [condType, setCondType] = useState<ConductorType>("phase_a");
  const [condSection, setCondSection] = useState(35);
  const [showGrid, setShowGrid] = useState(true);
  const [hoveredId, setHoveredId] = useState<string | null>(null);
  const [activePanel, setActivePanel] = useState<"palette" | "properties" | "analysis">("palette");
  const svgRef = useRef<SVGSVGElement>(null);

  const getSVGCoords = useCallback((e: React.MouseEvent | MouseEvent) => {
    const svg = svgRef.current;
    if (!svg) return { x: 0, y: 0 };
    const rect = svg.getBoundingClientRect();
    return { x: e.clientX - rect.left, y: e.clientY - rect.top };
  }, []);

  const selectedPole = poles.find(p => p.id === selectedId);
  const selectedConductor = conductors.find(c => c.id === selectedId);
  const selectedTrench = trenches.find(t => t.id === selectedId);
  const selectedCable = ugCables.find(c => c.id === selectedId);

  const handleCanvasMouseMove = useCallback((e: React.MouseEvent<SVGSVGElement>) => {
    const pos = getSVGCoords(e);
    setMousePos({ x: snap(pos.x), y: snap(pos.y) });
  }, [getSVGCoords]);

  const handleCanvasClick = useCallback((e: React.MouseEvent<SVGSVGElement>) => {
    const pos = getSVGCoords(e);
    const sx = snap(pos.x), sy = snap(pos.y);

    if (mode === "aerial") {
      if (tool === "pole") {
        const newPole: Pole = {
          id: uid(), x: sx, y: sy,
          height: POLE_META[poleType].h,
          type: poleType, hasAnchor: false,
          label: `P${poles.length + 1}`,
        };
        setPoles(prev => [...prev, newPole]);
        return;
      }
      if (tool === "conductor") {
        const nearest = nearestPole(pos.x, pos.y, poles);
        if (!nearest) return;
        if (!pendingPole) {
          setPendingPole(nearest.id);
        } else {
          if (pendingPole !== nearest.id) {
            const newC: Conductor = {
              id: uid(), fromPoleId: pendingPole, toPoleId: nearest.id,
              type: condType, tension: 55, crossSection: condSection,
              protected: false, voltage: "LV",
              label: `C${conductors.length + 1}-${COND_LABELS[condType]}`,
            };
            setConductors(prev => [...prev, newC]);
          }
          setPendingPole(null);
        }
        return;
      }
    }

    if (mode === "underground") {
      if (tool === "trench") {
        if (!trenchStart) {
          setTrenchStart({ x: sx, y: sy });
        } else {
          const newTrench: Trench = {
            id: uid(), x1: trenchStart.x, y1: trenchStart.y,
            x2: sx, y2: sy, depth: 0.8, covered: false,
          };
          setTrenches(prev => [...prev, newTrench]);
          setTrenchStart(null);
        }
        return;
      }
      if (tool === "cable") {
        const clickedTrench = trenches.find(t => {
          const d = pointToSegmentDist(pos.x, pos.y, t.x1, t.y1, t.x2, t.y2);
          return d < 20;
        });
        if (clickedTrench) {
          const newCable: UGCable = {
            id: uid(), trenchId: clickedTrench.id,
            type: condType, crossSection: condSection,
            label: `CB${ugCables.length + 1}-${COND_LABELS[condType]}`,
            hasConduit: true, hasMechanicalProtection: false,
          };
          setUGCables(prev => [...prev, newCable]);
        }
        return;
      }
      if (tool === "cover") {
        const clickedTrench = trenches.find(t => {
          const d = pointToSegmentDist(pos.x, pos.y, t.x1, t.y1, t.x2, t.y2);
          return d < 20;
        });
        if (clickedTrench) {
          setTrenches(prev => prev.map(t => t.id === clickedTrench.id ? { ...t, covered: true } : t));
        }
        return;
      }
    }

    if (tool === "select") setSelectedId(null);
  }, [mode, tool, poles, poleType, pendingPole, condType, condSection, conductors, trenches, ugCables, trenchStart]);

  function pointToSegmentDist(px: number, py: number, x1: number, y1: number, x2: number, y2: number): number {
    const dx = x2 - x1, dy = y2 - y1;
    const lenSq = dx * dx + dy * dy;
    if (lenSq === 0) return dist(px, py, x1, y1);
    const t = Math.max(0, Math.min(1, ((px - x1) * dx + (py - y1) * dy) / lenSq));
    return dist(px, py, x1 + t * dx, y1 + t * dy);
  }

  const deleteSelected = useCallback(() => {
    if (!selectedId) return;
    setPoles(prev => prev.filter(p => p.id !== selectedId));
    setConductors(prev => prev.filter(c => c.id !== selectedId && c.fromPoleId !== selectedId && c.toPoleId !== selectedId));
    setTrenches(prev => prev.filter(t => t.id !== selectedId));
    setUGCables(prev => prev.filter(c => c.id !== selectedId));
    setSelectedId(null);
  }, [selectedId]);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") { setPendingPole(null); setTrenchStart(null); setTool("select"); }
      if (e.key === "Delete" || e.key === "Backspace") deleteSelected();
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [deleteSelected]);

  // Analysis
  const warnings: string[] = [];
  conductors.forEach(c => {
    if (c.tension < 30) warnings.push(`⚠ ${c.label}: Cable muy flojo`);
    if (c.tension > 75) warnings.push(`⚠ ${c.label}: Cable muy tenso`);
  });
  trenches.forEach(t => {
    if (!t.covered) warnings.push(`⚠ Zanja sin cubrir`);
    if (t.depth < 0.6) warnings.push(`✗ Zanja demasiado superficial`);
  });

  const canvasCursor = tool === "pole" ? "crosshair"
    : tool === "conductor" ? (pendingPole ? "cell" : "crosshair")
    : tool === "trench" ? (trenchStart ? "cell" : "crosshair")
    : tool === "cable" ? "copy"
    : tool === "cover" ? "pointer"
    : "default";

  const aerialTools: { id: ToolMode; label: string; icon: string }[] = [
    { id: "select", label: "Seleccionar", icon: "↖" },
    { id: "pole", label: "Colocar Poste", icon: "⏸" },
    { id: "conductor", label: "Trazar Conductor", icon: "〰" },
  ];
  const ugTools: { id: ToolMode; label: string; icon: string }[] = [
    { id: "select", label: "Seleccionar", icon: "↖" },
    { id: "trench", label: "Trazar Zanja", icon: "⛏" },
    { id: "cable", label: "Tender Cable", icon: "〰" },
    { id: "cover", label: "Cubrir Zanja", icon: "🪨" },
  ];
  const tools = mode === "aerial" ? aerialTools : ugTools;

  return (
    <div style={{
      display: "flex", height: "100vh", background: "#070d1a",
      fontFamily: "'Courier New', Courier, monospace", overflow: "hidden",
      color: "#e2e8f0",
    }}>

      {/* ── Left Sidebar ── */}
      <aside style={{
        width: 200, background: "#050a14", borderRight: "1px solid #1e293b",
        display: "flex", flexDirection: "column", flexShrink: 0, overflowY: "auto",
      }}>
        {/* Header */}
        <div style={{ padding: "14px 12px 10px", borderBottom: "1px solid #1e293b" }}>
          <div style={{ fontSize: 9, color: "#4ade80", letterSpacing: "0.18em", fontWeight: "bold" }}>
            ⚡ RED ELÉCTRICA
          </div>
          <div style={{ fontSize: 8, color: "#334155", marginTop: 2 }}>
            Simulador de instalaciones
          </div>
        </div>

        {/* Mode toggle */}
        <div style={{ padding: "10px 10px 8px" }}>
          <div style={{ fontSize: 8, color: "#334155", letterSpacing: "0.1em", marginBottom: 6, textTransform: "uppercase" }}>
            Tipo de Red
          </div>
          <div style={{ display: "flex", gap: 4 }}>
            {(["aerial", "underground"] as NetworkMode[]).map(m => (
              <button key={m}
                onClick={() => { setMode(m); setTool("select"); setPendingPole(null); setTrenchStart(null); }}
                style={{
                  flex: 1, padding: "5px 4px", fontSize: 9, cursor: "pointer",
                  borderRadius: 5, border: "none", transition: "all 0.15s",
                  background: mode === m ? "rgba(74,222,128,0.15)" : "rgba(255,255,255,0.04)",
                  color: mode === m ? "#4ade80" : "#475569",
                  outline: mode === m ? "1px solid rgba(74,222,128,0.4)" : "1px solid transparent",
                }}
              >
                {m === "aerial" ? "🏗 Aérea" : "⛏ Subterr."}
              </button>
            ))}
          </div>
        </div>

        {/* Tools */}
        <div style={{ padding: "0 10px 8px", borderBottom: "1px solid #1e293b" }}>
          <div style={{ fontSize: 8, color: "#334155", letterSpacing: "0.1em", marginBottom: 6, textTransform: "uppercase" }}>
            Herramientas
          </div>
          {tools.map(t => (
            <button key={t.id}
              onClick={() => { setTool(t.id); setPendingPole(null); setTrenchStart(null); }}
              style={{
                width: "100%", display: "flex", alignItems: "center", gap: 8,
                padding: "6px 8px", marginBottom: 3, cursor: "pointer",
                borderRadius: 5, border: "none", textAlign: "left",
                background: tool === t.id ? "rgba(74,222,128,0.12)" : "transparent",
                color: tool === t.id ? "#4ade80" : "#64748b",
                fontSize: 10, transition: "all 0.15s",
                outline: tool === t.id ? "1px solid rgba(74,222,128,0.3)" : "none",
              }}
            >
              <span style={{ fontSize: 14 }}>{t.icon}</span> {t.label}
            </button>
          ))}
        </div>

        {/* Aerial options */}
        {mode === "aerial" && (
          <div style={{ padding: "8px 10px", borderBottom: "1px solid #1e293b" }}>
            <div style={{ fontSize: 8, color: "#334155", textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: 6 }}>
              Tipo de Poste
            </div>
            {(["wooden", "concrete", "metal"] as PoleType[]).map(pt => (
              <button key={pt}
                onClick={() => { setPoleType(pt); setTool("pole"); }}
                style={{
                  width: "100%", display: "flex", alignItems: "center", gap: 8,
                  padding: "5px 8px", marginBottom: 2, cursor: "pointer",
                  borderRadius: 4, border: "none", textAlign: "left",
                  background: poleType === pt ? "rgba(148,163,184,0.1)" : "transparent",
                  color: poleType === pt ? "#e2e8f0" : "#475569",
                  fontSize: 10, transition: "all 0.15s",
                }}
              >
                <span style={{ width: 8, height: 8, borderRadius: 2, background: POLE_META[pt].color, flexShrink: 0, display: "inline-block" }}/>
                {POLE_META[pt].label} ({POLE_META[pt].h}m)
              </button>
            ))}
          </div>
        )}

        {/* Conductor / cable type */}
        <div style={{ padding: "8px 10px", borderBottom: "1px solid #1e293b" }}>
          <div style={{ fontSize: 8, color: "#334155", textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: 6 }}>
            {mode === "aerial" ? "Conductor" : "Cable"}
          </div>
          {(["phase_a", "phase_b", "phase_c", "neutral", "ground"] as ConductorType[]).map(ct => (
            <button key={ct}
              onClick={() => { setCondType(ct); setTool(mode === "aerial" ? "conductor" : "cable"); }}
              style={{
                width: "100%", display: "flex", alignItems: "center", gap: 8,
                padding: "5px 8px", marginBottom: 2, cursor: "pointer",
                borderRadius: 4, border: "none", textAlign: "left",
                background: condType === ct ? "rgba(255,255,255,0.06)" : "transparent",
                color: condType === ct ? "#e2e8f0" : "#475569",
                fontSize: 10, transition: "all 0.15s",
                outline: condType === ct ? `1px solid ${COND_COLORS[ct]}40` : "none",
              }}
            >
              <span style={{ width: 10, height: 10, borderRadius: "50%", background: COND_COLORS[ct], flexShrink: 0, display: "inline-block" }}/>
              {COND_LABELS[ct]}
            </button>
          ))}
          <div style={{ marginTop: 8 }}>
            <div style={{ fontSize: 8, color: "#334155", marginBottom: 4 }}>Sección (mm²)</div>
            <select value={condSection} onChange={e => setCondSection(+e.target.value)}
              style={{ width: "100%", background: "#0f172a", border: "1px solid #1e293b", color: "#94a3b8", fontSize: 10, padding: "4px 6px", borderRadius: 4, outline: "none" }}
            >
              {[16, 25, 35, 50, 70, 95, 120, 150, 185, 240].map(s => (
                <option key={s} value={s}>{s} mm²</option>
              ))}
            </select>
          </div>
        </div>

        {/* Quick legend */}
        <div style={{ padding: "8px 10px", marginTop: "auto" }}>
          <div style={{ fontSize: 8, color: "#1e293b", lineHeight: 1.8 }}>
            <div>Click: colocar / conectar</div>
            <div>ESC: cancelar operación</div>
            <div>DEL: eliminar selección</div>
          </div>
        </div>
      </aside>

      {/* ── Canvas ── */}
      <div style={{ flex: 1, position: "relative", overflow: "hidden" }}>

        {/* Top toolbar */}
        <div style={{
          position: "absolute", top: 0, left: 0, right: 0, zIndex: 20,
          display: "flex", alignItems: "center", gap: 8,
          padding: "8px 14px",
          background: "rgba(5,10,20,0.85)", backdropFilter: "blur(8px)",
          borderBottom: "1px solid #1e293b",
        }}>
          <div style={{ fontSize: 10, color: mode === "aerial" ? "#60a5fa" : "#f59e0b", fontWeight: "bold", letterSpacing: "0.1em" }}>
            {mode === "aerial" ? "🏗 RED AÉREA BT" : "⛏ RED SUBTERRÁNEA BT"}
          </div>
          <div style={{ flex: 1 }} />
          {/* Grid toggle */}
          <button onClick={() => setShowGrid(g => !g)}
            style={{ background: showGrid ? "rgba(74,222,128,0.1)" : "transparent", border: "1px solid #1e293b", color: showGrid ? "#4ade80" : "#475569", fontSize: 9, padding: "3px 10px", borderRadius: 4, cursor: "pointer" }}
          >
            GRID {showGrid ? "ON" : "OFF"}
          </button>
          {/* Clear */}
          <button onClick={() => { setPoles([]); setConductors([]); setTrenches([]); setUGCables([]); setSelectedId(null); }}
            style={{ background: "transparent", border: "1px solid #1e293b", color: "#ef4444", fontSize: 9, padding: "3px 10px", borderRadius: 4, cursor: "pointer" }}
          >
            LIMPIAR
          </button>
        </div>

        {/* Mode hint */}
        {(pendingPole || trenchStart) && (
          <div style={{
            position: "absolute", top: 48, left: "50%", transform: "translateX(-50%)",
            background: "rgba(74,222,128,0.12)", border: "1px solid #4ade80",
            color: "#4ade80", fontSize: 11, padding: "5px 16px", borderRadius: 20,
            zIndex: 20, pointerEvents: "none",
          }}>
            {pendingPole ? "● Haz clic en el poste destino — ESC para cancelar"
              : "● Haz clic para terminar la zanja — ESC para cancelar"}
          </div>
        )}

        {/* SVG Canvas */}
        <svg
          ref={svgRef}
          style={{ position: "absolute", inset: 0, width: "100%", height: "100%", cursor: canvasCursor }}
          onClick={handleCanvasClick}
          onMouseMove={handleCanvasMouseMove}
        >
          <defs>
            <pattern id="grid" width={GRID} height={GRID} patternUnits="userSpaceOnUse">
              <circle cx="0" cy="0" r="0.7" fill="#1e293b" opacity="0.8"/>
            </pattern>
            {/* Ground texture */}
            <pattern id="soil" width="8" height="8" patternUnits="userSpaceOnUse">
              <rect width="8" height="8" fill="#0f172a"/>
              <circle cx="2" cy="3" r="0.8" fill="#1e293b"/>
              <circle cx="5" cy="6" r="0.6" fill="#1e293b"/>
            </pattern>
            <filter id="glow2">
              <feGaussianBlur stdDeviation="3" result="blur"/>
              <feMerge><feMergeNode in="blur"/><feMergeNode in="SourceGraphic"/></feMerge>
            </filter>
            <filter id="glow1">
              <feGaussianBlur stdDeviation="1.5" result="blur"/>
              <feMerge><feMergeNode in="blur"/><feMergeNode in="SourceGraphic"/></feMerge>
            </filter>
          </defs>

          {/* Background */}
          <rect width="100%" height="100%" fill={mode === "underground" ? "url(#soil)" : "#070d1a"}/>
          {showGrid && <rect width="100%" height="100%" fill="url(#grid)"/>}

          {/* Underground ground line */}
          {mode === "underground" && (
            <rect x="0" y="0" width="100%" height="100%" fill="rgba(120,53,15,0.06)"/>
          )}

          {/* ── AERIAL MODE ── */}
          {mode === "aerial" && <>
            {/* Conductors */}
            {conductors.map(c => {
              const from = poles.find(p => p.id === c.fromPoleId);
              const to   = poles.find(p => p.id === c.toPoleId);
              if (!from || !to) return null;
              const isSelected = selectedId === c.id;
              const color = COND_COLORS[c.type];
              const d = sagPath(from.x, from.y, to.x, to.y, c.tension);
              const tooLoose = c.tension < 30;
              const tooTight = c.tension > 75;
              return (
                <g key={c.id} onClick={e => { e.stopPropagation(); setSelectedId(c.id); }}>
                  {/* Wide invisible hit target */}
                  <path d={d} fill="none" stroke="transparent" strokeWidth={16} style={{ cursor: "pointer" }}/>
                  {/* Glow for selected */}
                  {isSelected && <path d={d} fill="none" stroke={color} strokeWidth={8} opacity={0.2} filter="url(#glow2)"/>}
                  {/* Wire */}
                  <path d={d} fill="none"
                    stroke={tooLoose || tooTight ? "#ef4444" : color}
                    strokeWidth={isSelected ? 3.5 : 2.5}
                    strokeLinecap="round"
                    strokeDasharray={tooLoose ? "6,4" : "none"}
                  />
                  {/* Conductor sheen */}
                  <path d={d} fill="none" stroke="rgba(255,255,255,0.15)" strokeWidth={1} strokeLinecap="round"/>
                  {/* Label */}
                  <text x={(from.x + to.x) / 2} y={(from.y + to.y) / 2 - 10}
                    textAnchor="middle" fontSize={8} fill={color} opacity={0.8}
                    fontFamily="monospace"
                  >{c.label}</text>
                  {/* Warning icon */}
                  {(tooLoose || tooTight) && (
                    <text x={(from.x + to.x) / 2} y={(from.y + to.y) / 2 + 5}
                      textAnchor="middle" fontSize={12}
                    >{tooLoose ? "📉" : "📈"}</text>
                  )}
                </g>
              );
            })}

            {/* Pending conductor preview */}
            {pendingPole && (() => {
              const fromPole = poles.find(p => p.id === pendingPole);
              if (!fromPole) return null;
              return (
                <path
                  d={sagPath(fromPole.x, fromPole.y, mousePos.x, mousePos.y, 50)}
                  fill="none" stroke={COND_COLORS[condType]} strokeWidth={2}
                  strokeDasharray="6,4" opacity={0.6}
                />
              );
            })()}

            {/* Poles */}
            {poles.map(p => (
              <g key={p.id} onClick={e => {
                e.stopPropagation();
                if (tool === "conductor") {
                  handleCanvasClick(e as unknown as React.MouseEvent<SVGSVGElement>);
                } else {
                  setSelectedId(p.id);
                }
              }}>
                <circle cx={p.x} cy={p.y} r={POLE_R + 6} fill="transparent" style={{ cursor: "pointer" }}/>
                <Pole3D pole={p} selected={selectedId === p.id} active={false}/>
              </g>
            ))}

            {/* Snap indicator while placing pole */}
            {tool === "pole" && (
              <circle cx={mousePos.x} cy={mousePos.y} r={POLE_R}
                fill="rgba(74,222,128,0.08)" stroke="#4ade80" strokeWidth={1.5}
                strokeDasharray="4,3" pointerEvents="none"
              />
            )}
          </>}

          {/* ── UNDERGROUND MODE ── */}
          {mode === "underground" && <>
            {/* Trenches */}
            {trenches.map(t => (
              <g key={t.id} onClick={e => {
                e.stopPropagation();
                if (tool === "select") setSelectedId(t.id);
              }}>
                <TrenchSVG trench={t} cables={ugCables} selected={selectedId === t.id}/>
              </g>
            ))}

            {/* Pending trench preview */}
            {trenchStart && (
              <line
                x1={trenchStart.x} y1={trenchStart.y}
                x2={mousePos.x} y2={mousePos.y}
                stroke="#f59e0b" strokeWidth={14} strokeLinecap="round"
                strokeDasharray="10,6" opacity={0.5}
              />
            )}

            {/* Crosshair when placing trench */}
            {tool === "trench" && (
              <g pointerEvents="none">
                <line x1={mousePos.x - 12} y1={mousePos.y} x2={mousePos.x + 12} y2={mousePos.y} stroke="#f59e0b" strokeWidth={1.5} opacity={0.7}/>
                <line x1={mousePos.x} y1={mousePos.y - 12} x2={mousePos.x} y2={mousePos.y + 12} stroke="#f59e0b" strokeWidth={1.5} opacity={0.7}/>
              </g>
            )}
          </>}
        </svg>

        {/* Empty state */}
        {poles.length === 0 && trenches.length === 0 && (
          <div style={{
            position: "absolute", inset: 0, display: "flex",
            flexDirection: "column", alignItems: "center", justifyContent: "center",
            pointerEvents: "none", gap: 12,
          }}>
            <div style={{ fontSize: 48, opacity: 0.15 }}>
              {mode === "aerial" ? "🏗" : "⛏"}
            </div>
            <p style={{ color: "#1e3a5f", fontSize: 13, textAlign: "center", maxWidth: 300, lineHeight: 1.7 }}>
              {mode === "aerial"
                ? "Selecciona 'Colocar Poste' y haz clic en el lienzo.\nLuego usa 'Trazar Conductor' para conectar los postes."
                : "Selecciona 'Trazar Zanja', dibuja la zanja en el lienzo,\nluego tiende cables y cierra la zanja."}
            </p>
          </div>
        )}
      </div>

      {/* ── Right Panel ── */}
      <aside style={{
        width: 220, background: "#050a14", borderLeft: "1px solid #1e293b",
        display: "flex", flexDirection: "column", flexShrink: 0, overflowY: "auto",
      }}>

        {/* Panel tabs */}
        <div style={{ display: "flex", borderBottom: "1px solid #1e293b" }}>
          {(["properties", "analysis"] as const).map(tab => (
            <button key={tab}
              onClick={() => setActivePanel(tab)}
              style={{
                flex: 1, padding: "9px 4px", fontSize: 8, border: "none", cursor: "pointer",
                textTransform: "uppercase", letterSpacing: "0.1em",
                background: activePanel === tab ? "rgba(74,222,128,0.08)" : "transparent",
                color: activePanel === tab ? "#4ade80" : "#334155",
                borderBottom: activePanel === tab ? "2px solid #4ade80" : "2px solid transparent",
              }}
            >
              {tab === "properties" ? "Propiedades" : "Análisis"}
            </button>
          ))}
        </div>

        {/* Properties panel */}
        {activePanel === "properties" && (
          <div style={{ padding: "12px", flex: 1 }}>
            {!selectedId && (
              <p style={{ fontSize: 10, color: "#1e3a5f", lineHeight: 1.6 }}>
                Haz clic en un elemento del lienzo para ver y editar sus propiedades.
              </p>
            )}

            {/* Pole properties */}
            {selectedPole && (
              <>
                <div style={{ fontSize: 9, color: "#4ade80", marginBottom: 10, letterSpacing: "0.1em" }}>
                  ⏸ POSTE · {POLE_META[selectedPole.type].label.toUpperCase()}
                </div>
                {[
                  { label: "Etiqueta", key: "label", type: "text", value: selectedPole.label },
                  { label: "Altura (m)", key: "height", type: "number", value: selectedPole.height },
                ].map(field => (
                  <div key={field.key} style={{ marginBottom: 8 }}>
                    <div style={{ fontSize: 8, color: "#334155", marginBottom: 3 }}>{field.label}</div>
                    <input type={field.type} value={field.value}
                      onChange={e => setPoles(prev => prev.map(p =>
                        p.id === selectedPole.id
                          ? { ...p, [field.key]: field.type === "number" ? +e.target.value : e.target.value }
                          : p
                      ))}
                      style={{ width: "100%", background: "#0f172a", border: "1px solid #1e293b", borderRadius: 4, color: "#e2e8f0", fontSize: 11, padding: "4px 7px", outline: "none", boxSizing: "border-box" as const }}
                    />
                  </div>
                ))}
                <label style={{ display: "flex", alignItems: "center", gap: 8, cursor: "pointer", marginBottom: 8 }}>
                  <input type="checkbox" checked={selectedPole.hasAnchor}
                    onChange={e => setPoles(prev => prev.map(p =>
                      p.id === selectedPole.id ? { ...p, hasAnchor: e.target.checked } : p
                    ))}
                    style={{ accentColor: "#4ade80" }}
                  />
                  <span style={{ fontSize: 10, color: "#64748b" }}>Anclaje / Retenida</span>
                </label>
                <button onClick={deleteSelected}
                  style={{ width: "100%", background: "transparent", border: "1px solid #ef4444", color: "#ef4444", fontSize: 10, padding: "5px", borderRadius: 4, cursor: "pointer", marginTop: 8 }}
                >
                  Eliminar Poste
                </button>
              </>
            )}

            {/* Conductor properties */}
            {selectedConductor && (
              <>
                <div style={{ fontSize: 9, color: COND_COLORS[selectedConductor.type], marginBottom: 10, letterSpacing: "0.1em" }}>
                  〰 CONDUCTOR · {COND_LABELS[selectedConductor.type].toUpperCase()}
                </div>
                <div style={{ marginBottom: 10 }}>
                  <div style={{ display: "flex", justifyContent: "space-between", fontSize: 9, marginBottom: 4 }}>
                    <span style={{ color: "#475569" }}>Tensión: {selectedConductor.tension}%</span>
                    <span style={{
                      color: selectedConductor.tension < 30 ? "#ef4444"
                        : selectedConductor.tension > 75 ? "#f59e0b"
                        : "#4ade80"
                    }}>
                      {selectedConductor.tension < 30 ? "⚠ Flojo"
                        : selectedConductor.tension > 75 ? "⚠ Tenso"
                        : "✓ Óptimo"}
                    </span>
                  </div>
                  <input type="range" min={0} max={100} value={selectedConductor.tension}
                    onChange={e => setConductors(prev => prev.map(c =>
                      c.id === selectedConductor.id ? { ...c, tension: +e.target.value } : c
                    ))}
                    style={{ width: "100%", accentColor: COND_COLORS[selectedConductor.type] }}
                  />
                  <div style={{ display: "flex", justifyContent: "space-between", fontSize: 8, color: "#1e293b" }}>
                    <span>Flojo</span><span>Óptimo</span><span>Tenso</span>
                  </div>
                </div>
                <div style={{ marginBottom: 8 }}>
                  <div style={{ fontSize: 8, color: "#334155", marginBottom: 3 }}>Etiqueta</div>
                  <input value={selectedConductor.label}
                    onChange={e => setConductors(prev => prev.map(c =>
                      c.id === selectedConductor.id ? { ...c, label: e.target.value } : c
                    ))}
                    style={{ width: "100%", background: "#0f172a", border: "1px solid #1e293b", borderRadius: 4, color: "#e2e8f0", fontSize: 11, padding: "4px 7px", outline: "none", boxSizing: "border-box" as const }}
                  />
                </div>
                <label style={{ display: "flex", alignItems: "center", gap: 8, cursor: "pointer", marginBottom: 4 }}>
                  <input type="checkbox" checked={selectedConductor.protected}
                    onChange={e => setConductors(prev => prev.map(c =>
                      c.id === selectedConductor.id ? { ...c, protected: e.target.checked } : c
                    ))}
                    style={{ accentColor: "#4ade80" }}
                  />
                  <span style={{ fontSize: 10, color: "#64748b" }}>Protección mecánica</span>
                </label>
                <div style={{ marginBottom: 8 }}>
                  <div style={{ fontSize: 8, color: "#334155", marginBottom: 3 }}>Nivel de tensión</div>
                  <select value={selectedConductor.voltage}
                    onChange={e => setConductors(prev => prev.map(c =>
                      c.id === selectedConductor.id ? { ...c, voltage: e.target.value as VoltageLevel } : c
                    ))}
                    style={{ width: "100%", background: "#0f172a", border: "1px solid #1e293b", color: "#94a3b8", fontSize: 10, padding: "4px 6px", borderRadius: 4, outline: "none" }}
                  >
                    <option value="LV">BT — Baja Tensión</option>
                    <option value="MV">MT — Media Tensión</option>
                  </select>
                </div>
                <button onClick={deleteSelected}
                  style={{ width: "100%", background: "transparent", border: "1px solid #ef4444", color: "#ef4444", fontSize: 10, padding: "5px", borderRadius: 4, cursor: "pointer", marginTop: 4 }}
                >
                  Eliminar Conductor
                </button>
              </>
            )}

            {/* Trench properties */}
            {selectedTrench && (
              <>
                <div style={{ fontSize: 9, color: "#f59e0b", marginBottom: 10, letterSpacing: "0.1em" }}>
                  ⛏ ZANJA
                </div>
                <div style={{ marginBottom: 8 }}>
                  <div style={{ fontSize: 8, color: "#334155", marginBottom: 3 }}>Profundidad (m)</div>
                  <input type="number" min={0.3} max={2.5} step={0.1} value={selectedTrench.depth}
                    onChange={e => setTrenches(prev => prev.map(t =>
                      t.id === selectedTrench.id ? { ...t, depth: +e.target.value } : t
                    ))}
                    style={{ width: "100%", background: "#0f172a", border: "1px solid #1e293b", borderRadius: 4, color: "#f59e0b", fontSize: 11, padding: "4px 7px", outline: "none", boxSizing: "border-box" as const }}
                  />
                  {selectedTrench.depth < 0.6 && (
                    <div style={{ fontSize: 9, color: "#ef4444", marginTop: 4 }}>✗ Mínimo reglamentario: 0.6m</div>
                  )}
                </div>
                <div style={{ padding: "8px", background: "rgba(245,158,11,0.06)", borderRadius: 6, border: "1px solid #78350f", marginBottom: 8 }}>
                  <div style={{ fontSize: 9, color: "#92400e", marginBottom: 4 }}>Estado</div>
                  <div style={{ fontSize: 11, color: selectedTrench.covered ? "#4ade80" : "#f59e0b" }}>
                    {selectedTrench.covered ? "✓ Zanja cubierta" : "⚠ Zanja abierta — usar herramienta Cubrir"}
                  </div>
                  <div style={{ fontSize: 9, color: "#475569", marginTop: 4 }}>
                    {ugCables.filter(c => c.trenchId === selectedTrench.id).length} cable(s) instalados
                  </div>
                </div>
                <button onClick={deleteSelected}
                  style={{ width: "100%", background: "transparent", border: "1px solid #ef4444", color: "#ef4444", fontSize: 10, padding: "5px", borderRadius: 4, cursor: "pointer" }}
                >
                  Eliminar Zanja
                </button>
              </>
            )}

            {/* Cable properties */}
            {selectedCable && (
              <>
                <div style={{ fontSize: 9, color: COND_COLORS[selectedCable.type], marginBottom: 10, letterSpacing: "0.1em" }}>
                  〰 CABLE SUBTERRÁNEO · {COND_LABELS[selectedCable.type].toUpperCase()}
                </div>
                <div style={{ marginBottom: 8 }}>
                  <div style={{ fontSize: 8, color: "#334155", marginBottom: 3 }}>Etiqueta</div>
                  <input value={selectedCable.label}
                    onChange={e => setUGCables(prev => prev.map(c =>
                      c.id === selectedCable.id ? { ...c, label: e.target.value } : c
                    ))}
                    style={{ width: "100%", background: "#0f172a", border: "1px solid #1e293b", borderRadius: 4, color: "#e2e8f0", fontSize: 11, padding: "4px 7px", outline: "none", boxSizing: "border-box" as const }}
                  />
                </div>
                {[
                  { key: "hasConduit", label: "Conducto/Tubería" },
                  { key: "hasMechanicalProtection", label: "Protección mecánica" },
                ].map(f => (
                  <label key={f.key} style={{ display: "flex", alignItems: "center", gap: 8, cursor: "pointer", marginBottom: 6 }}>
                    <input type="checkbox" checked={(selectedCable as any)[f.key]}
                      onChange={e => setUGCables(prev => prev.map(c =>
                        c.id === selectedCable.id ? { ...c, [f.key]: e.target.checked } : c
                      ))}
                      style={{ accentColor: "#4ade80" }}
                    />
                    <span style={{ fontSize: 10, color: "#64748b" }}>{f.label}</span>
                  </label>
                ))}
                <button onClick={deleteSelected}
                  style={{ width: "100%", background: "transparent", border: "1px solid #ef4444", color: "#ef4444", fontSize: 10, padding: "5px", borderRadius: 4, cursor: "pointer", marginTop: 8 }}
                >
                  Eliminar Cable
                </button>
              </>
            )}
          </div>
        )}

        {/* Analysis panel */}
        {activePanel === "analysis" && (
          <div style={{ padding: "12px", flex: 1 }}>
            <div style={{ fontSize: 9, color: "#64748b", letterSpacing: "0.12em", textTransform: "uppercase", marginBottom: 10 }}>
              Resumen de Red
            </div>

            {/* Stats */}
            {[
              { label: "Postes",       value: poles.length,      color: "#60a5fa" },
              { label: "Conductores",  value: conductors.length,  color: "#f59e0b" },
              { label: "Zanjas",       value: trenches.length,    color: "#a78bfa" },
              { label: "Cables UG",    value: ugCables.length,    color: "#4ade80" },
            ].map(s => (
              <div key={s.label} style={{ display: "flex", justifyContent: "space-between", padding: "5px 0", borderBottom: "1px solid #0f172a" }}>
                <span style={{ fontSize: 10, color: "#475569" }}>{s.label}</span>
                <span style={{ fontSize: 13, fontWeight: "bold", color: s.color }}>{s.value}</span>
              </div>
            ))}

            {/* Uncovered trenches */}
            <div style={{ marginTop: 12, fontSize: 9, color: "#64748b", letterSpacing: "0.1em", textTransform: "uppercase", marginBottom: 8 }}>
              Estado Zanjas
            </div>
            {trenches.length === 0 ? (
              <p style={{ fontSize: 10, color: "#1e293b" }}>Sin zanjas</p>
            ) : trenches.map(t => (
              <div key={t.id} style={{ display: "flex", justifyContent: "space-between", padding: "4px 0", fontSize: 9 }}>
                <span style={{ color: "#475569" }}>Zanja ({t.depth.toFixed(1)}m)</span>
                <span style={{ color: t.covered ? "#4ade80" : "#f59e0b" }}>{t.covered ? "✓ Cubierta" : "⚠ Abierta"}</span>
              </div>
            ))}

            {/* Warnings */}
            {warnings.length > 0 && (
              <>
                <div style={{ marginTop: 12, fontSize: 9, color: "#64748b", letterSpacing: "0.1em", textTransform: "uppercase", marginBottom: 8 }}>
                  Advertencias ({warnings.length})
                </div>
                {warnings.map((w, i) => (
                  <div key={i} style={{
                    fontSize: 9, padding: "5px 8px", marginBottom: 4,
                    background: "rgba(239,68,68,0.07)", border: "1px solid #7f1d1d",
                    borderRadius: 4, color: "#fca5a5", lineHeight: 1.5,
                  }}>{w}</div>
                ))}
              </>
            )}

            {warnings.length === 0 && (poles.length > 0 || trenches.length > 0) && (
              <div style={{
                marginTop: 12, padding: "8px", background: "rgba(74,222,128,0.07)",
                border: "1px solid #14532d", borderRadius: 6,
                fontSize: 10, color: "#4ade80", textAlign: "center",
              }}>
                ✓ Red sin advertencias
              </div>
            )}

            {/* Legend */}
            <div style={{ marginTop: 16, paddingTop: 12, borderTop: "1px solid #1e293b" }}>
              <div style={{ fontSize: 8, color: "#334155", textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: 8 }}>
                Leyenda de Colores
              </div>
              {Object.entries(COND_LABELS).map(([key, label]) => (
                <div key={key} style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4 }}>
                  <span style={{ width: 20, height: 3, background: COND_COLORS[key], borderRadius: 2, display: "inline-block" }}/>
                  <span style={{ fontSize: 9, color: "#475569" }}>{label}</span>
                </div>
              ))}
            </div>

            {/* Standards note */}
            <div style={{ marginTop: 12, padding: "8px", background: "rgba(255,255,255,0.02)", borderRadius: 4, fontSize: 8, color: "#1e3a5f", lineHeight: 1.7 }}>
              <strong style={{ color: "#334155" }}>Normativa ref.:</strong><br/>
              IEC 60227 / NEC 225<br/>
              Profundidad mín. zanja: 0.6m<br/>
              MT requiere conducto protector
            </div>
          </div>
        )}
      </aside>

      <style>{`
        * { box-sizing: border-box; }
        ::-webkit-scrollbar { width: 4px; }
        ::-webkit-scrollbar-track { background: #050a14; }
        ::-webkit-scrollbar-thumb { background: #1e293b; border-radius: 2px; }
        input[type=range] { -webkit-appearance: none; height: 4px; background: #1e293b; border-radius: 2px; }
        input[type=range]::-webkit-slider-thumb { -webkit-appearance: none; width: 12px; height: 12px; border-radius: 50%; cursor: pointer; margin-top: -4px; }
      `}</style>
    </div>
  );
}