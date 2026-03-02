"use client";

import { AutomationNode } from "../engine/types";

interface Props {
  nodes: AutomationNode[];
}

function StatusRow({ label, value, active }: { label: string; value: string; active?: boolean }) {
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

export function StatusPanel({ nodes }: Props) {
  const sensors = nodes.filter((n) => n.type === "sensor");
  const selectors = nodes.filter((n) => n.type === "selector");
  const contactors = nodes.filter((n) => n.type === "contactor");
  const timers = nodes.filter((n) => n.type === "timer");
  const lamps = nodes.filter((n) => n.type === "lamp");
  const motors = nodes.filter((n) => n.type === "motor");

  return (
    <aside className="w-48 bg-gray-900 border-l border-gray-700 p-3 flex flex-col gap-3 overflow-y-auto shrink-0">
      <p className="text-xs text-gray-400 font-bold uppercase tracking-wider">
        Status
      </p>

      {sensors.map((n) =>
        n.type === "sensor" ? (
          <StatusRow key={n.id} label={`Sensor ${n.id.slice(-3)}`} value={n.motion ? "ON" : "OFF"} active={n.motion} />
        ) : null
      )}

      {selectors.map((n) =>
        n.type === "selector" ? (
          <StatusRow key={n.id} label={`Selector ${n.id.slice(-3)}`} value={n.mode} active={n.mode !== "OFF"} />
        ) : null
      )}

      {contactors.map((n) =>
        n.type === "contactor" ? (
          <div key={n.id} className="border border-gray-700 rounded p-1">
            <p className="text-gray-500 text-xs mb-1">Contactor {n.id.slice(-3)}</p>
            <StatusRow label="Bobina" value={n.coil ? "ON" : "OFF"} active={n.coil} />
            <StatusRow label="Contacto" value={n.contactClosed ? "CLOSED" : "OPEN"} active={n.contactClosed} />
          </div>
        ) : null
      )}

      {timers.map((n) =>
        n.type === "timer" ? (
          <div key={n.id} className="border border-gray-700 rounded p-1">
            <p className="text-gray-500 text-xs mb-1">Timer {n.id.slice(-3)}</p>
            <StatusRow label="Output" value={n.output ? "ON" : "OFF"} active={n.output} />
            <StatusRow label="Restante" value={`${(n.remainingMs / 1000).toFixed(1)}s`} active={n.remainingMs > 0} />
          </div>
        ) : null
      )}

      {lamps.map((n) =>
        n.type === "lamp" ? (
          <StatusRow key={n.id} label={`Lámpara ${n.id.slice(-3)}`} value={n.active ? "ON" : "OFF"} active={n.active} />
        ) : null
      )}

      {motors.map((n) =>
        n.type === "motor" ? (
          <StatusRow key={n.id} label={`Motor ${n.id.slice(-3)}`} value={n.active ? "ON" : "OFF"} active={n.active} />
        ) : null
      )}

      {nodes.length === 0 && (
        <p className="text-gray-600 text-xs italic">Sin nodos</p>
      )}
    </aside>
  );
}