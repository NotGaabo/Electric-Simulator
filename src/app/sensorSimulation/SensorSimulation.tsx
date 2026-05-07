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
    selectedNodeId,
    startSimulation,
    stopSimulation,
    resetSimulation,
    loadScenario,
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
  } = useAutomationSimulator();

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        height: "100vh",
        background: "#0a0f1e",
        color: "#e2e8f0",
        fontFamily: "'Courier New', monospace",
        overflow: "hidden",
      }}
    >
      <ControlPanel
        running={state.running}
        nodes={state.nodes}
        wires={state.wires}
        onStart={startSimulation}
        onStop={stopSimulation}
        onReset={resetSimulation}
        onLoadScenario={loadScenario}
      />
      <div style={{ display: "flex", flex: 1, overflow: "hidden" }}>
        <Palette />
        <Canvas
          nodes={state.nodes}
          wires={state.wires}
          connectingFrom={connectingFrom}
          selectedNodeId={selectedNodeId}
          onAddNode={addNode}
          onMoveNode={moveNode}
          onRemoveNode={removeNode}
          onToggleSensor={toggleSensor}
          onSetSelectorMode={setSelectorMode}
          onBeginConnect={beginConnect}
          onFinishConnect={finishConnect}
          onCancelConnect={cancelConnect}
          onRemoveWire={removeWire}
          onInsertWirePoint={insertWirePoint}
          onUpdateWirePoint={updateWirePoint}
          onSelectNode={selectNode}
        />
        <StatusPanel
          nodes={state.nodes}
          selectedNodeId={selectedNodeId}
          onSetSensorDuration={setSensorDuration}
        />
      </div>
      <style>{`
        * { box-sizing: border-box; }
      `}</style>
    </div>
  );
}
