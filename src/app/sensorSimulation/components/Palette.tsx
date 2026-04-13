"use client";

import { NodeType } from "../engine/types";
import { PALETTE_ITEMS } from "../constants";
import { LuminaireSVG } from "@/components/electrical/symbols/LuminaireSVG";

interface Props {
  onAddNode: (type: NodeType, x: number, y: number) => void;
}

export function Palette({ onAddNode }: Props) {
  const handleDragStart = (e: React.DragEvent, type: NodeType) => {
    e.dataTransfer.setData("nodeType", type);
  };

  return (
    <aside
      style={{
        width: 192,
        background: "#060d1a",
        borderRight: "1px solid #1e293b",
        display: "flex",
        flexDirection: "column",
        overflowY: "auto",
        flexShrink: 0,
      }}
    >
      <div style={{ padding: "14px 14px 8px", borderBottom: "1px solid #1e293b" }}>
        <div style={{ fontSize: 10, color: "#4ade80", letterSpacing: "0.15em", marginBottom: 2 }}>
          ⚡ AUTOMATION PALETTE
        </div>
        <div style={{ fontSize: 8, color: "#58677b" }}>Arrastra → Lienzo</div>
      </div>

      <div style={{ paddingBottom: 10 }}>
        {PALETTE_ITEMS.map((item) => (
          <div
            key={item.type}
            draggable
            onDragStart={(e) => handleDragStart(e, item.type)}
            style={{
              display: "flex",
              alignItems: "center",
              gap: 8,
              padding: "6px 14px",
              cursor: "grab",
              borderRadius: 6,
              margin: "2px 6px",
              transition: "background 0.15s",
              userSelect: "none",
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = "rgba(74,222,128,0.07)";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = "transparent";
            }}
          >
            <div
              style={{
                width: 36,
                height: 28,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                background: "rgba(255,255,255,0.04)",
                borderRadius: 5,
                flexShrink: 0,
                overflow: "hidden",
                fontSize: 18,
              }}
            >
              {item.type === "lamp" ? (
                <div style={{ transform: "scale(0.45)", transformOrigin: "center" }}>
                  <LuminaireSVG />
                </div>
              ) : (
                item.icon
              )}
            </div>
            <span style={{ fontSize: 11, color: "#94a3b8" }}>{item.label}</span>
          </div>
        ))}
      </div>
    </aside>
  );
}
