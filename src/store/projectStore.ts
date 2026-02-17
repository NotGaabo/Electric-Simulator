// src/store/projectStore.ts

import { create } from "zustand";
import { ElectricalSymbol, Connection, CircuitAnalysis } from "@/types/electrical";
import { analyzeCircuit } from "@/lib/calculations/circuitCalculations";
import { v4 as uuidv4 } from "uuid";

interface ProjectState {
  symbols: ElectricalSymbol[];
  connections: Connection[];
  analysis: CircuitAnalysis;
  selectedId: string | null;

  addSymbol: (symbol: Omit<ElectricalSymbol, "id">) => void;
  moveSymbol: (id: string, x: number, y: number) => void;
  removeSymbol: (id: string) => void;
  updateSymbol: (id: string, updates: Partial<ElectricalSymbol>) => void;
  toggleComponent: (id: string) => void;
  selectSymbol: (id: string | null) => void;
  addConnection: (connection: Omit<Connection, "id">) => void;
  removeConnection: (id: string) => void;
  clearAll: () => void;
}

const emptyAnalysis: CircuitAnalysis = {
  totalVoltage: 0,
  totalCurrent: 0,
  totalResistance: 0,
  totalPower: 0,
  components: [],
};

function reanalyze(symbols: ElectricalSymbol[], connections: Connection[]): CircuitAnalysis {
  return analyzeCircuit(symbols, connections);
}

export const useProjectStore = create<ProjectState>((set, get) => ({
  symbols: [],
  connections: [],
  analysis: emptyAnalysis,
  selectedId: null,

  addSymbol: (symbol) =>
    set((state) => {
      const newSymbols = [...state.symbols, { ...symbol, id: uuidv4() }];
      return {
        symbols: newSymbols,
        analysis: reanalyze(newSymbols, state.connections),
      };
    }),

  moveSymbol: (id, x, y) =>
    set((state) => {
      const newSymbols = state.symbols.map((s) =>
        s.id === id ? { ...s, x, y } : s
      );
      return { symbols: newSymbols };
    }),

  removeSymbol: (id) =>
    set((state) => {
      const newSymbols = state.symbols.filter((s) => s.id !== id);
      const newConnections = state.connections.filter(
        (c) => c.fromId !== id && c.toId !== id
      );
      return {
        symbols: newSymbols,
        connections: newConnections,
        analysis: reanalyze(newSymbols, newConnections),
        selectedId: state.selectedId === id ? null : state.selectedId,
      };
    }),

  updateSymbol: (id, updates) =>
    set((state) => {
      const newSymbols = state.symbols.map((s) =>
        s.id === id ? { ...s, ...updates } : s
      );
      return {
        symbols: newSymbols,
        analysis: reanalyze(newSymbols, state.connections),
      };
    }),

  toggleComponent: (id) =>
    set((state) => {
      const newSymbols = state.symbols.map((s) =>
        s.id === id ? { ...s, isOn: !s.isOn } : s
      );
      return {
        symbols: newSymbols,
        analysis: reanalyze(newSymbols, state.connections),
      };
    }),

  selectSymbol: (id) => set({ selectedId: id }),

  addConnection: (connection) =>
    set((state) => {
      const newConnections = [
        ...state.connections,
        { ...connection, id: uuidv4() },
      ];
      return {
        connections: newConnections,
        analysis: reanalyze(state.symbols, newConnections),
      };
    }),

  removeConnection: (id) =>
    set((state) => {
      const newConnections = state.connections.filter((c) => c.id !== id);
      return {
        connections: newConnections,
        analysis: reanalyze(state.symbols, newConnections),
      };
    }),

  clearAll: () =>
    set({
      symbols: [],
      connections: [],
      analysis: emptyAnalysis,
      selectedId: null,
    }),
}));