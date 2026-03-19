"use client";

import { NodeType } from "../engine/types";
import { PALETTE_ITEMS } from "../constants";

interface Props {
  onAddNode: (type: NodeType, x: number, y: number) => void;
}

export function Palette({ onAddNode }: Props) {
  const handleDragStart = (e: React.DragEvent, type: NodeType) => {
    e.dataTransfer.setData("nodeType", type);
  };

  return (
    <aside className="w-28 bg-gray-900 border-r border-gray-700 flex flex-col gap-2 p-2 shrink-0">
      <p className="text-xs text-gray-400 font-bold uppercase tracking-wider text-center">
        Palette
      </p>
      {PALETTE_ITEMS.map((item) => (
        <div
          key={item.type}
          draggable
          onDragStart={(e) => handleDragStart(e, item.type)}
          className="flex flex-col items-center justify-center bg-gray-800 hover:bg-gray-700 border border-gray-600 rounded-lg p-2 cursor-grab text-white gap-1 select-none"
        >
          <span className="text-2xl">{item.icon}</span>
          <span className="text-xs">{item.label}</span>
        </div>
      ))}
      <p className="text-xs text-gray-500 text-center mt-2">
        Arrastra al canvas
      </p>
    </aside>
  );
}