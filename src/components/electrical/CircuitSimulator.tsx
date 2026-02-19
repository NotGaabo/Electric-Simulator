"use client";

import React, {
  useState,
  useRef,
  useCallback,
  useEffect,
  useMemo,
} from "react";

// ─── Types ────────────────────────────────────────────────────────────────────

import { CompType, Component, Port, Wire } from "@/types/types";
import { analyzeCircuit } from "@/lib/circuit/analyzeCircuit";
import { CompSVG } from "@/components/electrical/symbols/CompSVG";

// ─── Constants ────────────────────────────────────────────────────────────────
import { COMP_W, COMP_H, PORT_R, GRID } from "@/lib/circuit/constants";

// ─── Port definitions per component type ─────────────────────────────────────

export function getPorts(type: CompType): Port[] {
  return [
    { id: "left",  dx: -COMP_W / 2, dy: 0,  label: "−" },
    { id: "right", dx:  COMP_W / 2, dy: 0,  label: "+" },
  ];
}

// ─── Palette items ────────────────────────────────────────────────────────────

import { PALETTE } from "@/components/electrical/PalettePanel";
import { uid, wid, snap, wirePath } from "@/lib/utils";
import { useCircuitSimulator } from "@/hooks/useCircuitSimulator";
import { clear } from "console";


// ─── Main Component ────────────────────────────────────────────────────────────

export default function CircuitSimulator() {
  
  const {
    components,
    wires,
    selectedId,
    selectedComp,
    pendingPort,
    mousePos,
    analysis,
    pendingStart,
    containerRef,
    portPos,
    handleCanvasDrop,
    handleMouseMove,
    handleCanvasClick,
    handlePortClick,
    handleCompMouseDown,
    deleteComponent,
    deleteWire,
    toggleComp,
    updateComp,
    clearAll,
    getPorts,
  } = useCircuitSimulator();

  return (
    <div style={{ display: "flex", height: "100vh", background: "#0a0f1e", fontFamily: "'Courier New', monospace", overflow: "hidden" }}>
      
      <aside style={{
          width: 192, background: "#060d1a", borderRight: "1px solid #1e293b",
          display: "flex", flexDirection: "column", overflowY: "auto", flexShrink: 0,
        }}>
          <div style={{ padding: "14px 14px 8px", borderBottom: "1px solid #1e293b" }}>
            <div style={{ fontSize: 10, color: "#4ade80", letterSpacing: "0.15em", marginBottom: 2 }}>⚡ ELECTRIC SIMULATOR</div>
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


        <div ref={containerRef} style={{ position: "absolute", inset: 0, width: "100%", height: "100%", overflow: "visible" }}
        onClick={handleCanvasClick} 
        onMouseMove={handleMouseMove}>
          
          {/* SVG overlay: wires + port indicators */}
          <svg
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

        </div>

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
                    onClick={e => handlePortClick(comp.id, port.id)}
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
            {analysis.circuitClosed ? "CIRCUITO ABIERTO" : "CIRCUITO CERRADO"}
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
          {analysis.shortCircuit && (
          <div style={{
            background: "rgba(239,68,68,0.15)",
            border: "1px solid #ef4444",
            color: "#ef4444",
            padding: "6px",
            borderRadius: 6,
            fontSize: 10,
            marginBottom: 10,
            textAlign: "center",
            fontWeight: "bold"
          }}>
            ⚠ CORTOCIRCUITO DETECTADO
          </div>
        )}

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
            onClick={() => clearAll()}
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