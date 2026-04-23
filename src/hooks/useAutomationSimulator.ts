"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import {
  AutomationState,
  AutomationNode,
  Wire,
  NodeType,
  Mode,
  WirePoint,
} from "../app/sensorSimulation/engine/types";
import { runControlCycle } from "../app/sensorSimulation/engine/controlEngine";
import { TICK_INTERVAL_MS, DEFAULT_TIMER_DELAY_MS } from "../app/sensorSimulation/constants";

let nodeCounter = 0;
function generateId(prefix: string): string {
  return `${prefix}-${++nodeCounter}-${Date.now()}`;
}

function createNode(type: NodeType, x: number, y: number): AutomationNode {
  const base = { id: generateId(type), position: { x, y } };
  switch (type) {
    case "sensor":
      return {
        ...base,
        type: "sensor",
        sensorType: "PIR",
        motion: false,
        onDurationMs: 0,
        onRemainingMs: 0,
        prevMotion: false,
        sensitivity: 75,
        debounceMs: 100,
        lastActivationTime: 0,
      };
    case "selector":
      return {
        ...base,
        type: "selector",
        mode: "OFF",
        automaticEnabled: false,
      };
    case "relay":
      return {
        ...base,
        type: "relay",
        coil: false,
        contactClosed: false,
        ratedCurrent: 10,
        ratedVoltage: 24,
        contactType: "N/O",
      };
    case "contactor":
      return {
        ...base,
        type: "contactor",
        coil: false,
        contactClosed: false,
        maxCurrent: 50,
        ratedVoltage: 220,
        mainContacts: 3,
        auxiliaryContact: false,
        currentDetected: 0,
      };
    case "timer":
      return {
        ...base,
        type: "timer",
        input: false,
        output: false,
        timerType: "delay-on",
        delayMs: DEFAULT_TIMER_DELAY_MS,
        remainingMs: 0,
      };
    case "lamp":
      return {
        ...base,
        type: "lamp",
        active: false,
        powerW: 40,
        operationalState: "off",
      };
    case "motor":
      return {
        ...base,
        type: "motor",
        active: false,
        powerHP: 1,
        rpmNominal: 1800,
        nominalCurrent: 5,
        operationalState: "stopped",
        runningTimeMs: 0,
      };
    default:
      return {
        ...base,
        type: "sensor",
        sensorType: "PIR",
        motion: false,
        onDurationMs: 0,
        onRemainingMs: 0,
        prevMotion: false,
        sensitivity: 75,
        debounceMs: 100,
        lastActivationTime: 0,
      } as AutomationNode;
  }
}

const INITIAL_STATE: AutomationState = {
  nodes: [],
  wires: [],
  running: false,
  conditions: [],
};

export function useAutomationSimulator() {
  const [state, setState] = useState<AutomationState>(INITIAL_STATE);
  const [connectingFrom, setConnectingFrom] = useState<string | null>(null);
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);
  const stateRef = useRef(state);
  stateRef.current = state;

  // Loop de simulación
  useEffect(() => {
    if (!state.running) return;
    const interval = setInterval(() => {
      setState((prev) => runControlCycle(prev, TICK_INTERVAL_MS));
    }, TICK_INTERVAL_MS);
    return () => clearInterval(interval);
  }, [state.running]);

  const startSimulation = useCallback(() => {
    setState((prev) => ({ ...prev, running: true }));
  }, []);

  const stopSimulation = useCallback(() => {
    setState((prev) => ({ ...prev, running: false }));
  }, []);

  const resetSimulation = useCallback(() => {
    setState(INITIAL_STATE);
    setSelectedNodeId(null);
  }, []);

  const addNode = useCallback((type: NodeType, x: number, y: number) => {
    const node = createNode(type, x, y);
    setState((prev) => ({ ...prev, nodes: [...prev.nodes, node] }));
  }, []);

  const moveNode = useCallback((id: string, x: number, y: number) => {
    setState((prev) => ({
      ...prev,
      nodes: prev.nodes.map((n) =>
        n.id === id ? { ...n, position: { x, y } } : n
      ),
    }));
  }, []);

  const removeNode = useCallback((id: string) => {
    setState((prev) => ({
      ...prev,
      nodes: prev.nodes.filter((n) => n.id !== id),
      wires: prev.wires.filter((w) => w.from !== id && w.to !== id),
    }));
    setSelectedNodeId((prev) => (prev === id ? null : prev));
  }, []);

  const toggleSensor = useCallback((id: string) => {
    setState((prev) => ({
      ...prev,
      nodes: prev.nodes.map((n) =>
        n.id === id && n.type === "sensor"
          ? n.onDurationMs > 0
            ? n.motion
              ? { ...n, onRemainingMs: n.onDurationMs, prevMotion: true }
              : {
                  ...n,
                  motion: true,
                  onRemainingMs: n.onDurationMs,
                  prevMotion: true,
                }
            : { ...n, motion: !n.motion }
          : n
      ),
    }));
  }, []);

  const setSelectorMode = useCallback((id: string, mode: Mode) => {
    setState((prev) => ({
      ...prev,
      nodes: prev.nodes.map((n) =>
        n.id === id && n.type === "selector" ? { ...n, mode } : n
      ),
    }));
  }, []);

  /** Configura el tiempo one-shot de un sensor (en milisegundos). 0 = sin timer */
  const setSensorDuration = useCallback((id: string, durationMs: number) => {
    setState((prev) => ({
      ...prev,
      nodes: prev.nodes.map((n) =>
        n.id === id && n.type === "sensor"
          ? {
              ...n,
              onDurationMs: Math.max(0, durationMs),
              onRemainingMs: 0,
              motion: false,
              prevMotion: false,
            }
          : n
      ),
    }));
  }, []);

  const selectNode = useCallback((id: string | null) => {
    setSelectedNodeId(id);
  }, []);

  const beginConnect = useCallback((fromId: string) => {
    setConnectingFrom(fromId);
  }, []);

  const finishConnect = useCallback(
    (toId: string) => {
      if (!connectingFrom || connectingFrom === toId) {
        setConnectingFrom(null);
        return;
      }
      const wire: Wire = {
        id: generateId("wire"),
        from: connectingFrom,
        to: toId,
      };
      setState((prev) => {
        const exists = prev.wires.some(
          (w) => w.from === wire.from && w.to === wire.to
        );
        if (exists) return prev;
        return { ...prev, wires: [...prev.wires, wire] };
      });
      setConnectingFrom(null);
    },
    [connectingFrom]
  );

  const cancelConnect = useCallback(() => {
    setConnectingFrom(null);
  }, []);

  const removeWire = useCallback((id: string) => {
    setState((prev) => ({
      ...prev,
      wires: prev.wires.filter((w) => w.id !== id),
    }));
  }, []);

  const insertWirePoint = useCallback((id: string, point: WirePoint, index?: number) => {
    setState((prev) => ({
      ...prev,
      wires: prev.wires.map((w) => {
        if (w.id !== id) return w;
        const next = [...(w.points ?? [])];
        const insertAt =
          typeof index === "number" ? Math.max(0, Math.min(index, next.length)) : next.length;
        next.splice(insertAt, 0, point);
        return { ...w, points: next };
      }),
    }));
  }, []);

  const updateWirePoint = useCallback((id: string, index: number, point: WirePoint) => {
    setState((prev) => ({
      ...prev,
      wires: prev.wires.map((w) => {
        if (w.id !== id) return w;
        const next = [...(w.points ?? [])];
        if (!next[index]) return w;
        next[index] = point;
        return { ...w, points: next };
      }),
    }));
  }, []);

  return {
    state,
    connectingFrom,
    selectedNodeId,
    startSimulation,
    stopSimulation,
    resetSimulation,
    addNode,
    moveNode,
    removeNode,
    toggleSensor,
    setSelectorMode,
    setSensorDuration,
    selectNode,
    beginConnect,
    finishConnect,
    cancelConnect,
    removeWire,
    insertWirePoint,
    updateWirePoint,
  };
}
