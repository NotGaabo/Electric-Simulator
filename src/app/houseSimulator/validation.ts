import {
  ComponentInstance,
  Connection,
  ConductorType,
  HouseState,
  PortTemplate,
  ValidationIssue,
} from "./types";
import { hasActiveCircuits } from "./utils";

let issueSeq = 0;
const nextIssueId = () => `issue-${++issueSeq}`;

type PortConnectionMap = Map<string, Connection[]>;

function getPortMap(component: ComponentInstance): Map<string, PortTemplate> {
  return new Map(component.ports.map((port) => [port.id, port]));
}

function addIssue(
  issues: ValidationIssue[],
  level: "error" | "warning",
  message: string,
  componentId?: string,
  connectionId?: string,
) {
  issues.push({
    id: nextIssueId(),
    level,
    message,
    componentId,
    connectionId,
  });
}

function getPortConnections(
  portConnections: Map<string, PortConnectionMap>,
  compId: string,
  portId: string,
): Connection[] {
  return portConnections.get(compId)?.get(portId) ?? [];
}

function recordPortConnection(
  portConnections: Map<string, PortConnectionMap>,
  compId: string,
  portId: string,
  connection: Connection,
) {
  if (!portConnections.has(compId)) {
    portConnections.set(compId, new Map());
  }
  const portMap = portConnections.get(compId)!;
  if (!portMap.has(portId)) {
    portMap.set(portId, []);
  }
  portMap.get(portId)!.push(connection);
}

function singleConductor(connections: Connection[]): ConductorType | null {
  if (connections.length === 0) {
    return null;
  }
  const conductor = connections[0].conductor;
  for (const conn of connections) {
    if (conn.conductor !== conductor) {
      return null;
    }
  }
  return conductor;
}

function validateOutletNonPolarized(
  component: ComponentInstance,
  portConnections: Map<string, PortConnectionMap>,
  issues: ValidationIssue[],
) {
  const aConductor = singleConductor(
    getPortConnections(portConnections, component.id, "A"),
  );
  const bConductor = singleConductor(
    getPortConnections(portConnections, component.id, "B"),
  );

  if (!aConductor || !bConductor) {
    addIssue(
      issues,
      "error",
      "El tomacorriente no polarizado requiere una conexion L y una N.",
      component.id,
    );
    return;
  }

  if (aConductor === bConductor) {
    addIssue(
      issues,
      "error",
      "El tomacorriente no polarizado debe tener L y N en bornes distintos.",
      component.id,
    );
  }
}

function validateOutletFeedThrough(
  component: ComponentInstance,
  portConnections: Map<string, PortConnectionMap>,
  issues: ValidationIssue[],
) {
  const requiredPorts: Array<[string, ConductorType]> = [
    ["L_IN", "L"],
    ["L_OUT", "L"],
    ["N_IN", "N"],
    ["N_OUT", "N"],
  ];

  for (const [portId, conductor] of requiredPorts) {
    const connections = getPortConnections(
      portConnections,
      component.id,
      portId,
    );
    const portConductor = singleConductor(connections);
    if (!portConductor) {
      addIssue(
        issues,
        "error",
        `El tomacorriente feed-through requiere ${conductor} en ${portId}.`,
        component.id,
      );
      continue;
    }
    if (portConductor !== conductor) {
      addIssue(
        issues,
        "error",
        `Conexion invalida en ${portId}.`,
        component.id,
      );
    }
  }
}

function validateRequiredPorts(
  component: ComponentInstance,
  portConnections: Map<string, PortConnectionMap>,
  issues: ValidationIssue[],
) {
  for (const port of component.ports) {
    if (!port.required) {
      continue;
    }
    const connections = getPortConnections(
      portConnections,
      component.id,
      port.id,
    );
    if (connections.length === 0) {
      addIssue(
        issues,
        "error",
        `Falta conexion en el puerto ${port.label}.`,
        component.id,
      );
    }
  }
}

function validateOutlet(
  component: ComponentInstance,
  portConnections: Map<string, PortConnectionMap>,
  issues: ValidationIssue[],
) {
  if (component.outletMode === "feedThrough") {
    validateOutletFeedThrough(component, portConnections, issues);
    return;
  }
  validateOutletNonPolarized(component, portConnections, issues);
}

export function validateHouseState(state: HouseState): ValidationIssue[] {
  if (!hasActiveCircuits(state.circuits)) {
    return [];
  }

  const issues: ValidationIssue[] = [];
  const componentsById = new Map(
    state.components.map((comp) => [comp.id, comp]),
  );
  const portConnections = new Map<string, PortConnectionMap>();

  for (const component of state.components) {
    if (!component.circuitId) {
      addIssue(
        issues,
        "error",
        "El componente no pertenece a ningun circuito.",
        component.id,
      );
    }
  }

  for (const connection of state.connections) {
    const fromComp = componentsById.get(connection.fromCompId);
    const toComp = componentsById.get(connection.toCompId);

    if (!fromComp || !toComp) {
      addIssue(
        issues,
        "error",
        "Conexion con componentes inexistentes.",
        undefined,
        connection.id,
      );
      continue;
    }

    const fromPort = getPortMap(fromComp).get(connection.fromPortId);
    const toPort = getPortMap(toComp).get(connection.toPortId);

    if (!fromPort || !toPort) {
      addIssue(
        issues,
        "error",
        "Conexion con puertos inexistentes.",
        undefined,
        connection.id,
      );
      continue;
    }

    if (!fromPort.conductorOptions.includes(connection.conductor)) {
      addIssue(
        issues,
        "error",
        "Conexion invalida: conductor no permitido en el puerto de origen.",
        fromComp.id,
        connection.id,
      );
    }

    if (!toPort.conductorOptions.includes(connection.conductor)) {
      addIssue(
        issues,
        "error",
        "Conexion invalida: conductor no permitido en el puerto de destino.",
        toComp.id,
        connection.id,
      );
    }

    if (
      fromComp.circuitId &&
      toComp.circuitId &&
      fromComp.circuitId !== toComp.circuitId
    ) {
      addIssue(
        issues,
        "error",
        "Conexion entre componentes de circuitos distintos.",
        undefined,
        connection.id,
      );
    }

    if (
      (fromComp.circuitId && fromComp.circuitId !== connection.circuitId) ||
      (toComp.circuitId && toComp.circuitId !== connection.circuitId)
    ) {
      addIssue(
        issues,
        "error",
        "Conexion asignada a un circuito incorrecto.",
        undefined,
        connection.id,
      );
    }

    recordPortConnection(
      portConnections,
      fromComp.id,
      fromPort.id,
      connection,
    );
    recordPortConnection(
      portConnections,
      toComp.id,
      toPort.id,
      connection,
    );
  }

  for (const component of state.components) {
    validateRequiredPorts(component, portConnections, issues);
    if (component.type === "Outlet") {
      validateOutlet(component, portConnections, issues);
    }
  }

  return issues;
}
