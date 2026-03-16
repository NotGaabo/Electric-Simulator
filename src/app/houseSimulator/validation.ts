import { HouseState, ValidationError, ElectricalElement, Circuit, Wire } from "./types";

export function validateInstallation(state: HouseState): ValidationError[] {
  const errors: ValidationError[] = [];
  const { elements, circuits, wires, rooms } = state;

  // CORRECCIÓN Bug 8: contador LOCAL por llamada, nunca global
  let ec = 0;
  function makeError(
    severity: ValidationError["severity"],
    category: ValidationError["category"],
    title: string,
    message: string,
    elementIds: string[],
    fix: string
  ): ValidationError {
    return { id: `err-${++ec}`, severity, category, title, message, elementIds, fix };
  }

  const lights       = elements.filter(e => e.type === "light");
  const outlets      = elements.filter(e => e.type === "outlet");
  const groundRods   = elements.filter(e => e.type === "ground_rod");
  const breakers     = elements.filter(e => e.type === "panel_breaker");
  const differentials = elements.filter(e => e.type === "panel_differential");
  const conduits     = elements.filter(e =>
    e.type === "conduit_pvc" || e.type === "conduit_emt" || e.type === "cable_tray"
  );

  // ── RF-06: Luminarias y tomacorrientes ───────────────────────────────────────

  if (lights.length === 0) {
    errors.push(makeError("error", "RF-06",
      "Sin luminarias",
      "No hay luminarias instaladas en la vivienda. Se requiere al menos una por habitación.",
      [],
      "Arrastra luminarias desde el panel a cada habitación."
    ));
  }

  if (outlets.length === 0) {
    errors.push(makeError("error", "RF-06",
      "Sin tomacorrientes",
      "No hay tomacorrientes instalados. Las viviendas deben tener al menos uno por habitación.",
      [],
      "Arrastra tomacorrientes desde el panel izquierdo."
    ));
  }

  // Cada habitación debe tener al menos una luminaria
  for (const room of rooms) {
    if (!lights.some(e => e.roomId === room.id)) {
      errors.push(makeError("warning", "RF-06",
        `${room.name} sin iluminación`,
        `La habitación "${room.name}" no tiene luminaria instalada.`,
        [],
        `Coloca al menos una luminaria en ${room.name}.`
      ));
    }
  }

  // CORRECCIÓN Bug 3: cada luminaria debe tener un interruptor conectado por cable
  const switchedLights = new Set<string>();
  for (const w of wires) {
    const fromEl = elements.find(e => e.id === w.fromElementId);
    const toEl   = elements.find(e => e.id === w.toElementId);
    if (fromEl?.type === "switch" && toEl?.type === "light")   switchedLights.add(toEl.id);
    if (toEl?.type   === "switch" && fromEl?.type === "light") switchedLights.add(fromEl.id);
  }
  for (const light of lights) {
    if (!switchedLights.has(light.id)) {
      errors.push(makeError("warning", "RF-06",
        "Luminaria sin interruptor",
        `La luminaria "${light.label}" no está conectada a un interruptor.`,
        [light.id],
        "Conecta un interruptor a esta luminaria."
      ));
    }
  }

  // ── RF-07: Tablero de distribución ───────────────────────────────────────────

  if (breakers.length === 0) {
    errors.push(makeError("error", "RF-07",
      "Sin interruptores termomagnéticos",
      "El tablero no tiene interruptores termomagnéticos instalados.",
      [],
      "Arrastra al menos un interruptor termomagnético al tablero."
    ));
  }

  if (differentials.length === 0) {
    errors.push(makeError("error", "RF-07",
      "Sin interruptor diferencial",
      "No hay interruptor diferencial en el tablero. Es obligatorio para protección ante fallas a tierra.",
      [],
      "Agrega un interruptor diferencial al tablero de distribución."
    ));
  }

  // CORRECCIÓN Bug 5: solo verificar breakerId — isProtected es redundante y nunca confiable
  for (const circuit of circuits) {
    if (!circuit.breakerId) {
      errors.push(makeError("warning", "RF-07",
        "Circuito sin protección",
        `El circuito "${circuit.name}" no tiene un termomagnético asignado.`,
        circuit.elementIds,
        "Asigna un interruptor termomagnético a este circuito."
      ));
    }

    // Protección diferencial: existe diferencial en el tablero y el circuito tiene breaker
    const hasdifferential = differentials.length > 0;
    if (circuit.breakerId && !hasdifferential) {
      errors.push(makeError("info", "RF-07",
        "Circuito sin diferencial",
        `El circuito "${circuit.name}" no cuenta con protección diferencial.`,
        circuit.elementIds,
        "Instala un interruptor diferencial en el tablero."
      ));
    }
  }

  // ── RF-08: Canalización ───────────────────────────────────────────────────────

  if (conduits.length === 0 && elements.length > 3) {
    errors.push(makeError("warning", "RF-08",
      "Sin canalización",
      "No se han colocado tuberías ni canaletas para proteger el cableado.",
      [],
      "Agrega tuberías PVC, EMT o canaletas para encerrar los cables."
    ));
  }

  // ── RF-09: Puesta a tierra ────────────────────────────────────────────────────

  if (groundRods.length === 0) {
    errors.push(makeError("error", "RF-09",
      "Sin sistema de puesta a tierra",
      "No hay varilla de tierra instalada. La puesta a tierra es obligatoria.",
      [],
      "Instala una varilla de puesta a tierra en el exterior de la vivienda."
    ));
  }

  // CORRECCIÓN Bug 4: verificar también si hay cable de tierra conectado, no solo el flag
  for (const outlet of outlets) {
    const hasGroundWire = wires.some(w =>
      (w.fromElementId === outlet.id || w.toElementId === outlet.id) && w.isGroundWire
    );
    if (!outlet.isGrounded && !hasGroundWire) {
      errors.push(makeError("warning", "RF-09",
        "Tomacorriente sin tierra",
        `El tomacorriente "${outlet.label}" no tiene conexión a tierra.`,
        [outlet.id],
        "Conecta el conductor de tierra (verde/amarillo) o marca el elemento como aterrizado."
      ));
    }
  }

  // ── RF-10: Pruebas funcionales ────────────────────────────────────────────────

  const lightCircuits  = circuits.filter(c => c.type === "lighting");
  const outletCircuits = circuits.filter(c => c.type === "outlet");

  if (lights.length > 0 && lightCircuits.length === 0) {
    errors.push(makeError("info", "RF-10",
      "Luminarias sin circuito",
      "Hay luminarias instaladas pero no pertenecen a ningún circuito de iluminación.",
      lights.map(l => l.id),
      "Crea un circuito de iluminación y asigna las luminarias."
    ));
  }

  if (outlets.length > 0 && outletCircuits.length === 0) {
    errors.push(makeError("info", "RF-10",
      "Tomacorrientes sin circuito",
      "Hay tomacorrientes instalados pero no pertenecen a un circuito dedicado.",
      outlets.map(o => o.id),
      "Crea un circuito de tomacorrientes separado del de iluminación."
    ));
  }

  // CORRECCIÓN Bug 6: circuit.hasGround nunca se actualiza desde la UI,
  // así que derivamos el estado real desde los cables y elementos del circuito
  for (const circuit of outletCircuits) {
    const hasGroundInCircuit = circuit.elementIds.some(eid => {
      const el = elements.find(e => e.id === eid);
      if (!el) return false;
      return (
        el.isGrounded ||
        wires.some(w =>
          (w.fromElementId === eid || w.toElementId === eid) && w.isGroundWire
        )
      );
    });

    if (!hasGroundInCircuit) {
      errors.push(makeError("warning", "RF-10",
        "Polaridad/tierra incompleta",
        `El circuito "${circuit.name}" no tiene conductor de tierra verificado en ninguno de sus elementos.`,
        circuit.elementIds,
        "Verifica que el cable de tierra esté conectado en todo el recorrido del circuito."
      ));
    }
  }

  return errors;
}

export function getScoreFromErrors(errors: ValidationError[]): number {
  let score = 100;
  for (const e of errors) {
    if (e.severity === "error")   score -= 15;
    if (e.severity === "warning") score -= 7;
    if (e.severity === "info")    score -= 3;
  }
  return Math.max(0, score);
}