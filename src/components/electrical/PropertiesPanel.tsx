"use client";

import { Component } from "@/types/types";
import { AnalysisResult } from "@/types/types";
import { CompSVG } from "./symbols/CompSVG";
import { PALETTE } from "./PalettePanel";

interface Props {
  analysis: AnalysisResult;
  selectedComp?: Component;
  updateComp: (id: string, updates: Partial<Component>) => void;
  clearAll: () => void;
}

export function PropertiesPanel({
  analysis,
  selectedComp,
  updateComp,
  clearAll,
}: Props) {

  return (
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
      );
  }
