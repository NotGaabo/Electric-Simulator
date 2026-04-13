"use client";

import { useState } from "react";
import { AutomationNode, LampNode } from "../engine/types";

interface Props {
  nodes: AutomationNode[];
  selectedNodeId: string | null;
  onSetLampDuration: (id: string, durationMs: number) => void;
}

function StatusRow({
  label,
  value,
  active,
}: {
  label: string;
  value: string;
  active?: boolean;
}) {
  return (
    <div className="flex justify-between items-center py-0.5">
      <span className="text-gray-400 text-xs">{label}</span>
      <span
        className={`text-xs font-mono px-1 rounded ${
          active ? "bg-green-500 text-black" : "bg-gray-700 text-gray-300"
        }`}
      >
        {value}
      </span>
    </div>
  );
}

function LampConfig({
  lamp,
  onSetDuration,
}: {
  lamp: LampNode;
  onSetDuration: (ms: number) => void;
}) {
  const [inputSec, setInputSec] = useState(
    lamp.onDurationMs > 0 ? String(lamp.onDurationMs / 1000) : ""
  );

  const handleApply = () => {
    const sec = parseFloat(inputSec);
    if (!isNaN(sec) && sec >= 0) {
      onSetDuration(Math.round(sec * 1000));
    }
  };

  const handleClear = () => {
    setInputSec("");
    onSetDuration(0);
  };

  return (
    <div className="border border-blue-500/40 rounded-lg p-2 bg-blue-950/30 flex flex-col gap-2">
      <p className="text-blue-300 text-xs font-bold uppercase tracking-wider">
        💡 Config Lámpara
      </p>
      <p className="text-gray-400 text-[10px]">ID: {lamp.id.slice(-6)}</p>

      {/* Estado actual */}
      <div className="flex flex-col gap-0.5">
        <StatusRow
          label="Estado"
          value={lamp.active ? "ON" : "OFF"}
          active={lamp.active}
        />
        {lamp.onDurationMs > 0 && (
          <StatusRow
            label="Timer"
            value={`${lamp.onDurationMs / 1000}s`}
            active={lamp.onDurationMs > 0}
          />
        )}
        {lamp.active && lamp.onRemainingMs > 0 && (
          <StatusRow
            label="Restante"
            value={`${(lamp.onRemainingMs / 1000).toFixed(1)}s`}
            active
          />
        )}
      </div>

      {/* Barra de progreso one-shot */}
      {lamp.active && lamp.onDurationMs > 0 && (
        <div className="w-full h-1.5 bg-gray-700 rounded-full overflow-hidden">
          <div
            className="h-full bg-yellow-400 transition-all duration-100 rounded-full"
            style={{
              width: `${Math.min(
                100,
                (lamp.onRemainingMs / lamp.onDurationMs) * 100
              )}%`,
            }}
          />
        </div>
      )}

      {/* Configuración de tiempo */}
      <div className="flex flex-col gap-1 mt-1">
        <p className="text-gray-400 text-[10px]">Tiempo encendido (seg):</p>
        <div className="flex gap-1">
          <input
            type="number"
            min="0"
            step="0.5"
            value={inputSec}
            onChange={(e) => setInputSec(e.target.value)}
            placeholder="ej: 5"
            className="flex-1 bg-gray-800 border border-gray-600 rounded px-2 py-1 text-white text-xs w-0 focus:border-blue-400 focus:outline-none"
          />
          <button
            onClick={handleApply}
            className="px-2 py-1 bg-blue-600 hover:bg-blue-500 text-white text-[10px] font-bold rounded"
          >
            ✓
          </button>
        </div>
        {lamp.onDurationMs > 0 && (
          <button
            onClick={handleClear}
            className="text-[10px] text-gray-500 hover:text-red-400 text-left"
          >
            ✕ Quitar timer (modo directo)
          </button>
        )}
        <p className="text-gray-600 text-[9px] leading-tight">
          {lamp.onDurationMs > 0
            ? "One-shot: se enciende y apaga sola"
            : "Sin timer: sigue la señal de entrada"}
        </p>
      </div>

      {/* Presets rápidos */}
      <div className="flex flex-col gap-1">
        <p className="text-gray-500 text-[9px]">Presets:</p>
        <div className="flex flex-wrap gap-1">
          {[1, 3, 5, 10, 30].map((s) => (
            <button
              key={s}
              onClick={() => {
                setInputSec(String(s));
                onSetDuration(s * 1000);
              }}
              className={`px-1.5 py-0.5 rounded text-[9px] font-mono border transition-colors
                ${lamp.onDurationMs === s * 1000
                  ? "bg-yellow-500 border-yellow-400 text-black"
                  : "bg-gray-800 border-gray-600 text-gray-300 hover:border-blue-400"
                }`}
            >
              {s}s
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

export function StatusPanel({ nodes, selectedNodeId, onSetLampDuration }: Props) {
  const sensors = nodes.filter((n) => n.type === "sensor");
  const selectors = nodes.filter((n) => n.type === "selector");
  const contactors = nodes.filter((n) => n.type === "contactor");
  const timers = nodes.filter((n) => n.type === "timer");
  const lamps = nodes.filter((n) => n.type === "lamp") as LampNode[];
  const motors = nodes.filter((n) => n.type === "motor");

  const selectedLamp =
    selectedNodeId
      ? (nodes.find((n) => n.id === selectedNodeId && n.type === "lamp") as LampNode | undefined)
      : undefined;

  return (
    <aside className="w-52 bg-gray-900 border-l border-gray-700 p-3 flex flex-col gap-3 overflow-y-auto shrink-0">
      <p className="text-xs text-gray-400 font-bold uppercase tracking-wider">
        Status
      </p>

      {/* Config de lámpara seleccionada */}
      {selectedLamp && (
        <LampConfig
          lamp={selectedLamp}
          onSetDuration={(ms) => onSetLampDuration(selectedLamp.id, ms)}
        />
      )}

      {sensors.map((n) =>
        n.type === "sensor" ? (
          <StatusRow
            key={n.id}
            label={`Sensor ${n.id.slice(-4)}`}
            value={n.motion ? "ON" : "OFF"}
            active={n.motion}
          />
        ) : null
      )}

      {selectors.map((n) =>
        n.type === "selector" ? (
          <StatusRow
            key={n.id}
            label={`Selector ${n.id.slice(-4)}`}
            value={n.mode}
            active={n.mode !== "OFF"}
          />
        ) : null
      )}

      {contactors.map((n) =>
        n.type === "contactor" ? (
          <div key={n.id} className="border border-gray-700 rounded p-1">
            <p className="text-gray-500 text-xs mb-1">Contactor {n.id.slice(-4)}</p>
            <StatusRow label="Bobina" value={n.coil ? "ON" : "OFF"} active={n.coil} />
            <StatusRow
              label="Contacto"
              value={n.contactClosed ? "CLOSED" : "OPEN"}
              active={n.contactClosed}
            />
          </div>
        ) : null
      )}

      {timers.map((n) =>
        n.type === "timer" ? (
          <div key={n.id} className="border border-gray-700 rounded p-1">
            <p className="text-gray-500 text-xs mb-1">Timer {n.id.slice(-4)}</p>
            <StatusRow label="Output" value={n.output ? "ON" : "OFF"} active={n.output} />
            <StatusRow
              label="Restante"
              value={`${(n.remainingMs / 1000).toFixed(1)}s`}
              active={n.remainingMs > 0}
            />
          </div>
        ) : null
      )}

      {lamps.map((n) => (
        <div
          key={n.id}
          className={`border rounded p-1 cursor-pointer transition-colors
            ${selectedNodeId === n.id ? "border-blue-400 bg-blue-950/20" : "border-gray-700 hover:border-gray-500"}`}
          onClick={() => {/* selección manejada desde canvas */}}
        >
          <p className="text-gray-500 text-xs mb-1 flex items-center gap-1">
            <span>💡</span> Lámpara {n.id.slice(-4)}
            {n.onDurationMs > 0 && (
              <span className="ml-auto text-[9px] text-yellow-400 font-mono">
                T:{n.onDurationMs / 1000}s
              </span>
            )}
          </p>
          <StatusRow label="Estado" value={n.active ? "ON" : "OFF"} active={n.active} />
          {n.active && n.onRemainingMs > 0 && (
            <StatusRow
              label="Restante"
              value={`${(n.onRemainingMs / 1000).toFixed(1)}s`}
              active
            />
          )}
        </div>
      ))}

      {motors.map((n) =>
        n.type === "motor" ? (
          <StatusRow
            key={n.id}
            label={`Motor ${n.id.slice(-4)}`}
            value={n.active ? "RUN" : "STOP"}
            active={n.active}
          />
        ) : null
      )}

      {nodes.length === 0 && (
        <p className="text-gray-600 text-xs italic">Sin nodos</p>
      )}

      {lamps.length > 0 && !selectedLamp && (
        <p className="text-gray-600 text-[10px] italic text-center mt-1">
          Clic en una 💡 para configurar su timer
        </p>
      )}
    </aside>
  );
}