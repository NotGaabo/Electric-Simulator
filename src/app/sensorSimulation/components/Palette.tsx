"use client";

import { NodeType } from "../engine/types";
import { PALETTE_ITEMS } from "../constants";
import { LuminaireSVG } from "@/components/electrical/symbols/LuminaireSVG";

export function Palette() {
  const handleDragStart = (e: React.DragEvent, type: NodeType) => {
    e.dataTransfer.setData("nodeType", type);
  };

  const groups = [
    {
      title: "Detectores",
      subtitle: "Disparan eventos",
      types: ["sensor"],
    },
    {
      title: "Control",
      subtitle: "Deciden la logica",
      types: ["selector", "relay", "contactor", "timer"],
    },
    {
      title: "Cargas",
      subtitle: "Lo que se enciende",
      types: ["lamp", "motor"],
    },
  ] as const;

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
          PLAYGROUND DE AUTOMATIZACION
        </div>
        <div style={{ fontSize: 8, color: "#58677b" }}>Arrastra piezas al lienzo y arma una historia</div>
      </div>

      <div style={{ paddingBottom: 10 }}>
        {groups.map((group) => (
          <div key={group.title} style={{ paddingTop: 8 }}>
            <div style={{ padding: "6px 14px 4px" }}>
              <div style={{ fontSize: 9, color: "#93c5fd", letterSpacing: "0.1em", textTransform: "uppercase" }}>
                {group.title}
              </div>
              <div style={{ fontSize: 8, color: "#475569" }}>{group.subtitle}</div>
            </div>

            {PALETTE_ITEMS.filter((item) => group.types.includes(item.type)).map((item) => (
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
                  borderRadius: 8,
                  margin: "2px 6px",
                  transition: "background 0.15s, transform 0.15s",
                  userSelect: "none",
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = "rgba(74,222,128,0.07)";
                  e.currentTarget.style.transform = "translateX(2px)";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = "transparent";
                  e.currentTarget.style.transform = "translateX(0)";
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
        ))}
      </div>
    </aside>
  );
}
