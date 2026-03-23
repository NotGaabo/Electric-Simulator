import { describe, it, expect } from "vitest";
import type { Circuit, ElectricalElement, Wire } from "./HouseSimulator";
import { buildPowerInfo, isPowered } from "./HouseSimulator";

function el(partial: Partial<ElectricalElement> & Pick<ElectricalElement, "id" | "type">): ElectricalElement {
  return {
    id: partial.id,
    type: partial.type,
    roomId: partial.roomId ?? "r1",
    x: 0,
    y: 0,
    circuitId: partial.circuitId ?? null,
    label: partial.label ?? partial.id,
    isOn: partial.isOn ?? false,
    isGrounded: partial.isGrounded ?? false,
    rating: partial.rating,
  };
}

function wire(partial: Partial<Wire> & Pick<Wire, "id" | "fromElementId" | "toElementId" | "circuitId" | "conductorType">): Wire {
  return {
    id: partial.id,
    fromElementId: partial.fromElementId,
    toElementId: partial.toElementId,
    circuitId: partial.circuitId,
    conductorType: partial.conductorType,
    path: [],
  };
}

describe("power logic (fase/neutro/tierra)", () => {
  it("no enciende una luminaria si falta neutro", () => {
    const circuit: Circuit = {
      id: "c1",
      name: "Luces",
      type: "lighting",
      color: "#f59e0b",
      breakerId: "br",
      elementIds: [],
      isProtected: true,
      hasGround: false,
    };
    const elements: ElectricalElement[] = [
      el({ id: "src", type: "power_source", roomId: null, isOn: true }),
      el({ id: "br", type: "panel_breaker", roomId: null }),
      el({ id: "sw", type: "switch", circuitId: "c1", isOn: true }),
      el({ id: "l1", type: "light", circuitId: "c1" }),
    ];
    const wires: Wire[] = [
      wire({ id: "w1", fromElementId: "src", toElementId: "br", circuitId: "c1", conductorType: "phase" }),
      wire({ id: "w2", fromElementId: "br", toElementId: "sw", circuitId: "c1", conductorType: "phase" }),
      wire({ id: "w3", fromElementId: "sw", toElementId: "l1", circuitId: "c1", conductorType: "phase" }),
    ];

    const power = buildPowerInfo(elements, wires, [circuit]);
    const light = elements.find(e => e.id === "l1")!;
    expect(isPowered(light, power)).toBe(false);
    expect(power.phaseConnected.has("l1")).toBe(true);
    expect(power.neutralConnected.has("l1")).toBe(false);
  });

  it("enciende luminaria si hay fase + neutro + switch ON", () => {
    const circuit: Circuit = {
      id: "c1",
      name: "Luces",
      type: "lighting",
      color: "#f59e0b",
      breakerId: "br",
      elementIds: [],
      isProtected: true,
      hasGround: false,
    };
    const elements: ElectricalElement[] = [
      el({ id: "src", type: "power_source", roomId: null, isOn: true }),
      el({ id: "br", type: "panel_breaker", roomId: null }),
      el({ id: "sw", type: "switch", circuitId: "c1", isOn: true }),
      el({ id: "l1", type: "light", circuitId: "c1" }),
    ];
    const wires: Wire[] = [
      wire({ id: "w1", fromElementId: "src", toElementId: "br", circuitId: "c1", conductorType: "phase" }),
      wire({ id: "w2", fromElementId: "br", toElementId: "sw", circuitId: "c1", conductorType: "phase" }),
      wire({ id: "w3", fromElementId: "sw", toElementId: "l1", circuitId: "c1", conductorType: "phase" }),
      wire({ id: "w4", fromElementId: "src", toElementId: "l1", circuitId: "c1", conductorType: "neutral" }),
    ];

    const power = buildPowerInfo(elements, wires, [circuit]);
    const light = elements.find(e => e.id === "l1")!;
    expect(isPowered(light, power)).toBe(true);
  });

  it("no enciende luminaria si el switch está OFF", () => {
    const circuit: Circuit = {
      id: "c1",
      name: "Luces",
      type: "lighting",
      color: "#f59e0b",
      breakerId: "br",
      elementIds: [],
      isProtected: true,
      hasGround: false,
    };
    const elements: ElectricalElement[] = [
      el({ id: "src", type: "power_source", roomId: null, isOn: true }),
      el({ id: "br", type: "panel_breaker", roomId: null }),
      el({ id: "sw", type: "switch", circuitId: "c1", isOn: false }),
      el({ id: "l1", type: "light", circuitId: "c1" }),
    ];
    const wires: Wire[] = [
      wire({ id: "w1", fromElementId: "src", toElementId: "br", circuitId: "c1", conductorType: "phase" }),
      wire({ id: "w2", fromElementId: "br", toElementId: "sw", circuitId: "c1", conductorType: "phase" }),
      wire({ id: "w3", fromElementId: "sw", toElementId: "l1", circuitId: "c1", conductorType: "phase" }),
      wire({ id: "w4", fromElementId: "src", toElementId: "l1", circuitId: "c1", conductorType: "neutral" }),
    ];

    const power = buildPowerInfo(elements, wires, [circuit]);
    const light = elements.find(e => e.id === "l1")!;
    expect(isPowered(light, power)).toBe(false);
  });

  it("tomacorriente funciona con fase + neutro sin switch", () => {
    const circuit: Circuit = {
      id: "c2",
      name: "Tomas",
      type: "outlet",
      color: "#3b82f6",
      breakerId: "br2",
      elementIds: [],
      isProtected: true,
      hasGround: false,
    };
    const elements: ElectricalElement[] = [
      el({ id: "src", type: "power_source", roomId: null, isOn: true }),
      el({ id: "br2", type: "panel_breaker", roomId: null }),
      el({ id: "o1", type: "outlet", circuitId: "c2" }),
    ];
    const wires: Wire[] = [
      wire({ id: "w1", fromElementId: "src", toElementId: "br2", circuitId: "c2", conductorType: "phase" }),
      wire({ id: "w2", fromElementId: "br2", toElementId: "o1", circuitId: "c2", conductorType: "phase" }),
      wire({ id: "w3", fromElementId: "src", toElementId: "o1", circuitId: "c2", conductorType: "neutral" }),
    ];

    const power = buildPowerInfo(elements, wires, [circuit]);
    const outlet = elements.find(e => e.id === "o1")!;
    expect(isPowered(outlet, power)).toBe(true);
  });
});
