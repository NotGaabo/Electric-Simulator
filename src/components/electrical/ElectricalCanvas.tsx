// src/components/electrical/ElectricalCanvas.tsx

"use client";

import { useRef } from "react";
import { useProjectStore } from "@/store/projectStore";
import { ElectricalSymbolType } from "@/types/electrical";
import ElectricalNode from "@/app/project/[id]/canvas/ElectricalNode";

const GRID_SIZE = 24;

function snapToGrid(value: number): number {
  return Math.round(value / GRID_SIZE) * GRID_SIZE;
}

// Dot grid background rendered via CSS
function GridBackground() {
  return (
    <div
      style={{
        position: "absolute",
        inset: 0,
        backgroundImage:
          "radial-gradient(circle, #334155 1px, transparent 1px)",
        backgroundSize: `${GRID_SIZE}px ${GRID_SIZE}px`,
        opacity: 0.4,
        pointerEvents: "none",
      }}
    />
  );
}

export default function ElectricalCanvas() {
  const { symbols, addSymbol, selectSymbol, analysis } = useProjectStore();
  const canvasRef = useRef<HTMLDivElement>(null);

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    const type = e.dataTransfer.getData("symbolType") as ElectricalSymbolType;
    const propsRaw = e.dataTransfer.getData("symbolProps");
    const extraProps = propsRaw ? JSON.parse(propsRaw) : {};

    if (!type) return;

    const rect = e.currentTarget.getBoundingClientRect();
    const x = snapToGrid(e.clientX - rect.left);
    const y = snapToGrid(e.clientY - rect.top);

    addSymbol({
      type,
      x,
      y,
      label: type,
      ...extraProps,
    });
  };

  return (
    <div
      ref={canvasRef}
      style={{
        flex: 1,
        position: "relative",
        background: "#0f172a",
        overflow: "hidden",
        cursor: "default",
      }}
      onDrop={handleDrop}
      onDragOver={(e) => e.preventDefault()}
      onClick={() => selectSymbol(null)}
    >
      <GridBackground />

      {/* Corner label */}
      <div
        style={{
          position: "absolute",
          top: 16,
          left: 16,
          fontSize: 11,
          fontFamily: "monospace",
          color: "#334155",
          letterSpacing: "0.1em",
          pointerEvents: "none",
          userSelect: "none",
        }}
      >
        LIENZO ELÉCTRICO — IEC 60617
      </div>

      {/* Active voltage indicator */}
      {analysis.totalVoltage > 0 && (
        <div
          style={{
            position: "absolute",
            top: 16,
            right: 16,
            background: "rgba(34, 197, 94, 0.15)",
            border: "1px solid rgba(34, 197, 94, 0.4)",
            color: "#4ade80",
            fontSize: 11,
            fontFamily: "monospace",
            padding: "4px 10px",
            borderRadius: 6,
            display: "flex",
            alignItems: "center",
            gap: 6,
            animation: "pulseBorder 2s infinite",
          }}
        >
          <span
            style={{
              width: 6,
              height: 6,
              borderRadius: "50%",
              background: "#4ade80",
              display: "inline-block",
              animation: "blink 1s infinite",
            }}
          />
          CIRCUITO ACTIVO
        </div>
      )}

      {/* Drop hint */}
      {symbols.length === 0 && (
        <div
          style={{
            position: "absolute",
            inset: 0,
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            gap: 12,
            pointerEvents: "none",
          }}
        >
          <div
            style={{
              width: 80,
              height: 80,
              borderRadius: "50%",
              border: "2px dashed #1e293b",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: 28,
            }}
          >
            ⚡
          </div>
          <p
            style={{
              color: "#334155",
              fontFamily: "monospace",
              fontSize: 13,
              textAlign: "center",
              maxWidth: 260,
              lineHeight: 1.6,
            }}
          >
            Arrastra componentes del panel izquierdo para comenzar el plano
          </p>
        </div>
      )}

      {/* Symbols */}
      {symbols.map((symbol) => {
        const componentData = analysis.components.find(
          (c) => c.id === symbol.id
        );
        return (
          <ElectricalNode
            key={symbol.id}
            symbol={symbol}
            componentData={componentData}
          />
        );
      })}

      {/* Inline styles for animations */}
      <style>{`
        @keyframes blink {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.3; }
        }
        @keyframes pulse {
          0%, 100% { opacity: 0.3; }
          50% { opacity: 0.7; }
        }
      `}</style>
    </div>
  );
}