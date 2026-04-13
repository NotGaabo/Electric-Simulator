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
      className="relative flex-1 bg-gray-950 overflow-hidden"
      onDragOver={handleDragOver}
      onDrop={handleDrop}
      onClick={handleCanvasClick}
    >
      {/* Grid */}
      <svg className="absolute inset-0 w-full h-full opacity-10" xmlns="http://www.w3.org/2000/svg">
        <defs>
          <pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse">
            <path d="M 40 0 L 0 0 0 40" fill="none" stroke="white" strokeWidth="0.5" />
          </pattern>
        </defs>
        <rect width="100%" height="100%" fill="url(#grid)" />
      </svg>

      <WireLayer nodes={nodes} wires={wires} onRemoveWire={onRemoveWire} />

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
        <div className="absolute top-2 left-1/2 -translate-x-1/2 bg-orange-500 text-black text-xs font-bold px-3 py-1 rounded-full shadow-lg z-50">
          Conectando… clic en nodo destino o en fondo para cancelar
        </div>
      )}

      {nodes.length === 0 && (
        <div className="absolute inset-0 flex flex-col items-center justify-center text-gray-600 gap-2 pointer-events-none">
          <span className="text-5xl">⚡</span>
          <p className="text-sm">Arrastra elementos desde la paleta</p>
        </div>
      )}
    </div>
  );
}