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

function makeSelector(overrides: Partial<Extract<AutomationNode, { type: "selector" }>> = {}) {
  return {
    id: "selector-1",
    type: "selector",
    position: { x: 0, y: 0 },
    mode: "OFF",
    automaticEnabled: false,
    ...overrides,
  } as Extract<AutomationNode, { type: "selector" }>;
}

function makeTimer(overrides: Partial<Extract<AutomationNode, { type: "timer" }>> = {}) {
  return {
    id: "timer-1",
    type: "timer",
    position: { x: 50, y: 0 },
    input: false,
    output: false,
    timerType: "delay-on",
    delayMs: 0,
    remainingMs: 0,
    ...overrides,
  } as Extract<AutomationNode, { type: "timer" }>;
}

function makeContactor(overrides: Partial<Extract<AutomationNode, { type: "contactor" }>> = {}) {
  return {
    id: "contactor-1",
    type: "contactor",
    position: { x: 150, y: 0 },
    coil: false,
    contactClosed: false,
    maxCurrent: 50,
    ratedVoltage: 220,
    mainContacts: 3,
    auxiliaryContact: false,
    currentDetected: 0,
    ...overrides,
  } as Extract<AutomationNode, { type: "contactor" }>;
}

function makeState(nodes: AutomationNode[], wires: Wire[] = []): AutomationState {
  return { nodes, wires, running: false, conditions: [] };
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

describe("selector controls contactor modes", () => {
  it("OFF blocks automatic input", () => {
    const selector = makeSelector({ mode: "OFF" });
    const timer = makeTimer({ output: true });
    const contactor = makeContactor();
    const lamp = makeLamp();
    const wires: Wire[] = [
      { id: "wire-sel", from: selector.id, to: contactor.id },
      { id: "wire-timer", from: timer.id, to: contactor.id },
      { id: "wire-load", from: contactor.id, to: lamp.id },
    ];

    const state = runControlCycle(makeState([selector, timer, contactor, lamp], wires), 50);
    const nextContactor = state.nodes.find((node) => node.type === "contactor") as typeof contactor;
    const nextLamp = state.nodes.find((node) => node.type === "lamp") as typeof lamp;
    expect(nextContactor.contactClosed).toBe(false);
    expect(nextLamp.active).toBe(false);
  });

  it("MANUAL forces the contactor on", () => {
    const selector = makeSelector({ mode: "MANUAL" });
    const contactor = makeContactor();
    const lamp = makeLamp();
    const wires: Wire[] = [
      { id: "wire-sel", from: selector.id, to: contactor.id },
      { id: "wire-load", from: contactor.id, to: lamp.id },
    ];

    const state = runControlCycle(makeState([selector, contactor, lamp], wires), 50);
    const nextContactor = state.nodes.find((node) => node.type === "contactor") as typeof contactor;
    const nextLamp = state.nodes.find((node) => node.type === "lamp") as typeof lamp;
    expect(nextContactor.contactClosed).toBe(true);
    expect(nextLamp.active).toBe(true);
  });

  it("AUTO uses only non-selector inputs", () => {
    const selector = makeSelector({ mode: "AUTO" });
    const sensor = makeSensor({
      motion: true,
      prevMotion: true,
      onDurationMs: 0,
      onRemainingMs: 0,
    });
    const contactor = makeContactor();
    const lamp = makeLamp();
    const wires: Wire[] = [
      { id: "wire-sel", from: selector.id, to: contactor.id },
      { id: "wire-sensor", from: sensor.id, to: contactor.id },
      { id: "wire-load", from: contactor.id, to: lamp.id },
    ];

    const state = runControlCycle(makeState([selector, sensor, contactor, lamp], wires), 50);
    const nextContactor = state.nodes.find((node) => node.type === "contactor") as typeof contactor;
    const nextLamp = state.nodes.find((node) => node.type === "lamp") as typeof lamp;
    expect(nextContactor.contactClosed).toBe(true);
    expect(nextLamp.active).toBe(true);
  });
});
