"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import {
  AutomationState,
  AutomationNode,
  Wire,
  NodeType,
  Mode,
} from "../engine/types";
import { runControlCycle } from "../engine/controlEngine";
import { TICK_INTERVAL_MS, DEFAULT_TIMER_DELAY_MS } from "../constants";

let nodeCounter = 0;
function generateId(prefix: string): string {
  return `${prefix}-${++nodeCounter}-${Date.now()}`;
}

function createNode(type: NodeType, x: number, y: number): AutomationNode {
  const base = { id: generateId(type), position: { x, y } };
  switch (type) {
    case "sensor":
      return { ...base, type: "sensor", motion: false };
    case "selector":
      return { ...base, type: "selector", mode: "OFF" };
    case "contactor":
      return { ...base, type: "contactor", coil: false, contactClosed: false };
    case "timer":
      return {
        ...base,
        type: "timer",
        input: false,
        output: false,
        delayMs: DEFAULT_TIMER_DELAY_MS,
        remainingMs: 0,
      };
    case "lamp":
      return { ...base, type: "lamp", active: false };
    case "motor":
      return { ...base, type: "motor", active: false };
    default:
      return { ...base, type: "sensor", motion: false } as AutomationNode;
  }
}

const INITIAL_STATE: AutomationState = {
  nodes: [],
  wires: [],
  running: false,
};

export function useAutomationSimulator() {
  const [state, setState] = useState<AutomationState>(INITIAL_STATE);
  const [connectingFrom, setConnectingFrom] = useState<string | null>(null);
  const stateRef = useRef(state);
  stateRef.current = state;

  // Start/stop simulation loop
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
  }, []);

  const toggleSensor = useCallback((id: string) => {
    setState((prev) => ({
      ...prev,
      nodes: prev.nodes.map((n) =>
        n.id === id && n.type === "sensor"
          ? { ...n, motion: !n.motion }
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

  return {
    state,
    connectingFrom,
    startSimulation,
    stopSimulation,
    resetSimulation,
    addNode,
    moveNode,
    removeNode,
    toggleSensor,
    setSelectorMode,
    beginConnect,
    finishConnect,
    cancelConnect,
    removeWire,
  };
}