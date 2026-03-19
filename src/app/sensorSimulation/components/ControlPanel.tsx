"use client";

interface Props {
  running: boolean;
  onStart: () => void;
  onStop: () => void;
  onReset: () => void;
}

export function ControlPanel({ running, onStart, onStop, onReset }: Props) {
  return (
    <div className="bg-gray-900 border-b border-gray-700 px-4 py-2 flex items-center gap-3">
      <h1 className="text-white font-bold text-sm mr-4 shrink-0">
        ⚡ Automation Simulator
      </h1>

      <button
        onClick={onStart}
        disabled={running}
        className="px-3 py-1 bg-green-600 hover:bg-green-500 disabled:opacity-40 text-white text-xs font-bold rounded"
      >
        ▶ Iniciar
      </button>

      <button
        onClick={onStop}
        disabled={!running}
        className="px-3 py-1 bg-red-600 hover:bg-red-500 disabled:opacity-40 text-white text-xs font-bold rounded"
      >
        ■ Detener
      </button>

      <button
        onClick={onReset}
        className="px-3 py-1 bg-gray-600 hover:bg-gray-500 text-white text-xs font-bold rounded"
      >
        ↺ Reset
      </button>

      <div
        className={`ml-2 h-2.5 w-2.5 rounded-full ${
          running ? "bg-green-400 animate-pulse" : "bg-gray-600"
        }`}
      />
      <span className="text-xs text-gray-400">{running ? "RUNNING" : "STOPPED"}</span>
    </div>
  );
}