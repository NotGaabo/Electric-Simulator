"use client";

import React, { useCallback } from "react";
import type { Wire, WirePoint } from "@/types/types";
import { buildWirePath, insertNodeAtPoint, WIRE_HIT_THRESHOLD } from "@/lib/circuit/wireUtils";

interface WireLayerProps {
  wires: Wire[];
  circuitClosed: boolean;
  pendingStart: WirePoint | null;
  mousePos: WirePoint;
  portPos: (compId: string, portId: string) => WirePoint;
  onDeleteWire: (id: string) => void;
  onInsertNode: (wireId: string, point: WirePoint) => void;
  onStartDragNode: (wireId: string, nodeIndex: number) => void;
  onWireClick: (wireId: string, point: WirePoint) => void;
}

const NODE_R = 5;

export function WireLayer({
  wires, circuitClosed, pendingStart, mousePos,
  portPos, onDeleteWire, onInsertNode, onStartDragNode, onWireClick,
}: WireLayerProps) {

  const handleWireClick = useCallback(
    (e: React.MouseEvent, wire: Wire) => {
      e.stopPropagation();
      const rect = (e.currentTarget as SVGElement).closest("svg")!.getBoundingClientRect();
      const clickPt: WirePoint = { x: e.clientX - rect.left, y: e.clientY - rect.top };

      const from = portPos(wire.fromCompId, wire.fromPortId);
      const to   = portPos(wire.toCompId, wire.toPortId);

      // Doble click: borrar. Simple click: insertar nodo
      if (e.detail === 2) {
        onDeleteWire(wire.id);
      } else {
        onInsertNode(wire.id, clickPt);
      }
    },
    [portPos, onDeleteWire, onInsertNode]
  );

  return (
    <svg
      style={{ position: "absolute", inset: 0, width: "100%", height: "100%", overflow: "visible", pointerEvents: "none" }}
    >
      <defs>
        <filter id="glow">
          <feGaussianBlur stdDeviation="2" result="coloredBlur"/>
          <feMerge><feMergeNode in="coloredBlur"/><feMergeNode in="SourceGraphic"/></feMerge>
        </filter>
      </defs>

      {wires.map(wire => {
        const from = portPos(wire.fromCompId, wire.fromPortId);
        const to   = portPos(wire.toCompId,   wire.toPortId);
        const d    = buildWirePath(from, wire.points, to);
        const active = circuitClosed;

        return (
          <g key={wire.id}>
            {/* Halo activo */}
            {active && (
              <path d={d} fill="none" stroke="rgba(74,222,128,0.15)"
                strokeWidth="8" filter="url(#glow)" pointerEvents="none"/>
            )}

            {/* Cuerpo del cable */}
            <path d={d} fill="none"
              stroke={active ? "#b45309" : "#334155"}
              strokeWidth={active ? 5 : 3}
              strokeLinecap="round"
              strokeLinejoin="round"
              pointerEvents="none"
            />

            {/* Capa de cobre animada */}
            {active && (
              <path d={d} fill="none" stroke="#f59e0b" strokeWidth="2"
                strokeLinecap="round" strokeLinejoin="round" opacity="0.7" pointerEvents="none"/>
            )}

            {/* Electrones animados */}
            {active && [0, 0.6, 1.2].map(begin => (
              <circle key={begin} r="4" fill="#4ade80" opacity="0.9" filter="url(#glow)" pointerEvents="none">
                <animateMotion dur="1.8s" begin={`${begin}s`} repeatCount="indefinite" path={d}/>
              </circle>
            ))}

            {/* Zona de hit transparente — permite clics */}
            <path d={d} fill="none" stroke="transparent" strokeWidth="16"
              style={{ cursor: "pointer", pointerEvents: "stroke" }}
              onClick={e => handleWireClick(e, wire)}
            />

            {/* Nodos intermedios arrastrables */}
            {wire.points.map((pt, idx) => (
              <circle
                key={idx}
                cx={pt.x} cy={pt.y} r={NODE_R}
                fill="#1e40af" stroke="#60a5fa" strokeWidth="1.5"
                style={{ cursor: "grab", pointerEvents: "all" }}
                onMouseDown={e => {
                  e.stopPropagation();
                  onStartDragNode(wire.id, idx);
                }}
              />
            ))}
          </g>
        );
      })}

      {/* Preview del cable en construcción */}
      {pendingStart && (
        <path
          d={`M ${pendingStart.x} ${pendingStart.y} L ${mousePos.x} ${mousePos.y}`}
          fill="none" stroke="#4ade80" strokeWidth="2.5"
          strokeDasharray="6,4" opacity="0.8" pointerEvents="none"
        />
      )}
    </svg>
  );
}