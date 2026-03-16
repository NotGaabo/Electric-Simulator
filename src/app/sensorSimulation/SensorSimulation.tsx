"use client";

import { useAutomationSimulator } from "../../hooks/useAutomationSimulator";
import { Canvas } from "./components/Canvas";
import { Palette } from "./components/Palette";
import { ControlPanel } from "./components/ControlPanel";
import { StatusPanel } from "./components/StatusPanel";

export function SensorSimulation() {
  const {
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
  } = useAutomationSimulator();

  return (
    <div className="flex flex-col h-screen bg-gray-950 text-white">
      <ControlPanel
        running={state.running}
        onStart={startSimulation}
        onStop={stopSimulation}
        onReset={resetSimulation}
      />
      <div className="flex flex-1 overflow-hidden">
        <Palette onAddNode={addNode} />
        <Canvas
          nodes={state.nodes}
          wires={state.wires}
          connectingFrom={connectingFrom}
          onAddNode={addNode}
          onMoveNode={moveNode}
          onRemoveNode={removeNode}
          onToggleSensor={toggleSensor}
          onSetSelectorMode={setSelectorMode}
          onBeginConnect={beginConnect}
          onFinishConnect={finishConnect}
          onCancelConnect={cancelConnect}
          onRemoveWire={removeWire}
        />
        <StatusPanel nodes={state.nodes} />
      </div>
    </div>
  );
}