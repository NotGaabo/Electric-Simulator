"use client";

import { AutomationNode, Wire, NodeType, Mode } from "../engine/types";
import { WireLayer } from "./WireLayer";
import { DraggableNode } from "./DraggableNode";

interface Props {
  nodes: AutomationNode[];
  wires: Wire[];
  connectingFrom: string | null;
  selectedNodeId: string | null;
  onAddNode: (type: NodeType, x: number, y: number) => void;
  onMoveNode: (id: string, x: number, y: number) => void;
  onRemoveNode: (id: string) => void;
  onToggleSensor: (id: string) => void;
  onSetSelectorMode: (id: string, mode: Mode) => void;
  onBeginConnect: (id: string) => void;
  onFinishConnect: (id: string) => void;
  onCancelConnect: () => void;
  onRemoveWire: (id: string) => void;
  onInsertWirePoint: (id: string, point: { x: number; y: number }, index?: number) => void;
  onUpdateWirePoint: (id: string, index: number, point: { x: number; y: number }) => void;
  onSelectNode: (id: string | null) => void;
}

export function Canvas({
  nodes,
  wires,
  connectingFrom,
  selectedNodeId,
  onAddNode,
  onMoveNode,
  onRemoveNode,
  onToggleSensor,
  onSetSelectorMode,
  onBeginConnect,
  onFinishConnect,
  onCancelConnect,
  onRemoveWire,
  onInsertWirePoint,
  onUpdateWirePoint,
  onSelectNode,
}: Props) {
  const handleDragOver = (e: React.DragEvent) => e.preventDefault();

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    const type = e.dataTransfer.getData("nodeType") as NodeType;
    if (!type) return;
    const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
    const x = e.clientX - rect.left - 40;
    const y = e.clientY - rect.top - 30;
    onAddNode(type, x, y);
  };

  const handleCanvasClick = () => {
    if (connectingFrom) {
      onCancelConnect();
    } else {
      onSelectNode(null);
    }
  };

  return (
    <div
      style={{ position: "relative", flex: 1, background: "#0a0f1e", overflow: "hidden" }}
      onDragOver={handleDragOver}
      onDrop={handleDrop}
      onClick={handleCanvasClick}
    >
      {/* Grid */}
      <svg
        className="absolute inset-0 w-full h-full"
        style={{ opacity: 1, pointerEvents: "none" }}
        xmlns="http://www.w3.org/2000/svg"
      >
        <defs>
          <pattern id="grid" width="36" height="36" patternUnits="userSpaceOnUse">
            <circle cx="0" cy="0" r="0.8" fill="#1e293b" />
          </pattern>
        </defs>
        <rect width="100%" height="100%" fill="url(#grid)" />
      </svg>

      <WireLayer
        nodes={nodes}
        wires={wires}
        onRemoveWire={onRemoveWire}
        onInsertWirePoint={onInsertWirePoint}
        onUpdateWirePoint={onUpdateWirePoint}
      />

      {nodes.map((node) => (
        <DraggableNode
          key={node.id}
          node={node}
          onMove={onMoveNode}
          onRemove={onRemoveNode}
          onToggleSensor={onToggleSensor}
          onSetSelectorMode={onSetSelectorMode}
          onBeginConnect={onBeginConnect}
          onFinishConnect={onFinishConnect}
          onSelect={onSelectNode}
          isConnecting={connectingFrom !== null && connectingFrom !== node.id}
          isSelected={selectedNodeId === node.id}
        />
      ))}

      {connectingFrom && (
        <div
          style={{
            position: "absolute",
            top: 12,
            left: "50%",
            transform: "translateX(-50%)",
            background: "rgba(74,222,128,0.15)",
            border: "1px solid #4ade80",
            color: "#4ade80",
            fontSize: 11,
            padding: "5px 14px",
            borderRadius: 20,
            pointerEvents: "none",
            zIndex: 50,
          }}
        >
          Conectando… clic en nodo destino o en fondo para cancelar
        </div>
      )}

      {nodes.length === 0 && (
        <div
          style={{
            position: "absolute",
            inset: 0,
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            pointerEvents: "none",
            gap: 12,
            color: "#9ea2a8",
            fontSize: 13,
            textAlign: "center",
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
              fontSize: 32,
            }}
          >
            ⚡
          </div>
          <p style={{ maxWidth: 280, lineHeight: 1.6 }}>
            Arrastra elementos desde la paleta.
            <br />
            Conéctalos para simular la lógica.
          </p>
        </div>
      )}

      {wires.length > 0 && (
        <div
          style={{
            position: "absolute",
            top: 14,
            right: 14,
            background: "rgba(96,165,250,0.08)",
            border: "1px solid #1e3a5f",
            color: "#475569",
            fontSize: 9,
            padding: "3px 10px",
            borderRadius: 6,
            textAlign: "center",
            pointerEvents: "none",
          }}
        >
          Click cable → nodo · Doble click → borrar
        </div>
      )}
    </div>
  );
}
