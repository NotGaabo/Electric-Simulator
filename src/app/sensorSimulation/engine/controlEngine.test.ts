import { describe, it, expect } from "vitest";
import { runControlCycle } from "./controlEngine";
import type { AutomationState, AutomationNode, Wire } from "./types";

function makeSensor(overrides: Partial<Extract<AutomationNode, { type: "sensor" }>> = {}) {
  return {
    id: "sensor-1",
    type: "sensor",
    position: { x: 0, y: 0 },
    motion: false,
    onDurationMs: 0,
    onRemainingMs: 0,
    prevMotion: false,
    ...overrides,
  } as Extract<AutomationNode, { type: "sensor" }>;
}

function makeLamp(overrides: Partial<Extract<AutomationNode, { type: "lamp" }>> = {}) {
  return {
    id: "lamp-1",
    type: "lamp",
    position: { x: 100, y: 0 },
    active: false,
    ...overrides,
  } as Extract<AutomationNode, { type: "lamp" }>;
}

function makeState(nodes: AutomationNode[], wires: Wire[] = []): AutomationState {
  return { nodes, wires, running: false };
}

describe("sensor one-shot", () => {
  it("counts down and turns off after duration", () => {
    const sensor = makeSensor({
      motion: true,
      prevMotion: true,
      onDurationMs: 300,
      onRemainingMs: 300,
    });
    let state = makeState([sensor]);

    state = runControlCycle(state, 100);
    const s1 = state.nodes[0] as typeof sensor;
    expect(s1.motion).toBe(true);
    expect(s1.onRemainingMs).toBe(200);

    state = runControlCycle(state, 100);
    const s2 = state.nodes[0] as typeof sensor;
    expect(s2.motion).toBe(true);
    expect(s2.onRemainingMs).toBe(100);

    state = runControlCycle(state, 120);
    const s3 = state.nodes[0] as typeof sensor;
    expect(s3.motion).toBe(false);
    expect(s3.onRemainingMs).toBe(0);
  });

  it("rising edge starts pulse when timer is set", () => {
    const sensor = makeSensor({
      motion: true,
      prevMotion: false,
      onDurationMs: 400,
      onRemainingMs: 0,
    });
    const state = runControlCycle(makeState([sensor]), 50);
    const next = state.nodes[0] as typeof sensor;
    expect(next.motion).toBe(true);
    expect(next.onRemainingMs).toBe(400);
  });

  it("without timer stays ON until manually toggled", () => {
    const sensor = makeSensor({
      motion: true,
      prevMotion: true,
      onDurationMs: 0,
      onRemainingMs: 0,
    });
    let state = makeState([sensor]);
    state = runControlCycle(state, 1000);
    const next = state.nodes[0] as typeof sensor;
    expect(next.motion).toBe(true);
    expect(next.onRemainingMs).toBe(0);
  });
});

describe("lamp follows sensor signal", () => {
  it("lamp turns on during sensor pulse and off after", () => {
    const sensor = makeSensor({
      motion: true,
      prevMotion: false,
      onDurationMs: 200,
      onRemainingMs: 0,
    });
    const lamp = makeLamp({ active: false });
    const wires: Wire[] = [{ id: "wire-1", from: sensor.id, to: lamp.id }];

    let state = makeState([sensor, lamp], wires);
    state = runControlCycle(state, 50);
    const lampOn = state.nodes.find((n) => n.type === "lamp") as typeof lamp;
    expect(lampOn.active).toBe(true);

    state = runControlCycle(state, 220);
    const lampOff = state.nodes.find((n) => n.type === "lamp") as typeof lamp;
    expect(lampOff.active).toBe(false);
  });
});
