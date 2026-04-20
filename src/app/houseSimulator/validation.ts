import { FloorElement, ValidationResult, ValidationIssue, WireElement, PointElement } from './types';
import { LIGHT_TYPES, SWITCH_TYPES, WIRE_TYPES } from './constants';
import { isWireElement, isPointElement, distance } from './utils';

const SNAP_DISTANCE = 30;

function wireEndpointNear(wire: WireElement, el: PointElement): boolean {
  return (
    distance({ x: wire.x1, y: wire.y1 }, { x: el.x, y: el.y }) <= SNAP_DISTANCE ||
    distance({ x: wire.x2, y: wire.y2 }, { x: el.x, y: el.y }) <= SNAP_DISTANCE
  );
}

export function validateCircuits(elements: FloorElement[]): ValidationResult {
  const issues: ValidationIssue[] = [];

  const rooms    = elements.filter((e) => e.type === 'room');
  const lights   = elements.filter((e) => isPointElement(e) && LIGHT_TYPES.has(e.type))   as PointElement[];
  const switches = elements.filter((e) => isPointElement(e) && SWITCH_TYPES.has(e.type))  as PointElement[];
  const outlets  = elements.filter((e) => isPointElement(e) && e.type === 'outlet')        as PointElement[];
  const panels   = elements.filter((e) => isPointElement(e) && e.type === 'panel')         as PointElement[];
  const wires    = elements.filter(isWireElement) as WireElement[];
  const hotWires     = wires.filter((w) => w.type === 'wire_hot');
  const groundWires  = wires.filter((w) => w.type === 'wire_ground');
  const neutralWires = wires.filter((w) => w.type === 'wire_neutral');

  const stats = {
    rooms:    rooms.length,
    lights:   lights.length,
    switches: switches.length,
    outlets:  outlets.length,
    panels:   panels.length,
    wires:    wires.length,
  };

  // ── Panel ──
  if (panels.length === 0) {
    issues.push({ severity: 'error', message: 'Sin panel de distribución. Agrega al menos uno.' });
  } else if (panels.length > 1) {
    issues.push({ severity: 'warning', message: `${panels.length} paneles detectados. Verifica la división de circuitos.` });
  }

  // ── Lights need switches ──
  if (lights.length > 0 && switches.length === 0) {
    issues.push({ severity: 'error', message: 'Luminarias sin interruptor asociado.' });
  } else if (lights.length > switches.length * 4) {
    issues.push({ severity: 'warning', message: 'Relación luces/interruptores alta. Verifica control por zona.' });
  }

  // ── Outlets need ground ──
  if (outlets.length > 0 && groundWires.length === 0) {
    issues.push({ severity: 'error', message: 'Los tomacorrientes requieren cable de tierra (verde).' });
  }

  // ── Wires need panel ──
  if (wires.length > 0 && panels.length === 0) {
    issues.push({ severity: 'error', message: 'Hay cables pero ningún panel los origina.' });
  }

  // ── Hot wire from panel ──
  if (hotWires.length > 0 && panels.length > 0) {
    const panel = panels[0] as PointElement;
    const panelConnected = hotWires.some((w) => wireEndpointNear(w, panel));
    if (!panelConnected) {
      issues.push({ severity: 'warning', message: 'Ningún cable vivo parece originarse en el panel.' });
    }
  }

  // ── Neutral recommended ──
  if (hotWires.length > 0 && neutralWires.length === 0) {
    issues.push({ severity: 'warning', message: 'Se recomienda trazar cables neutros junto a los cables vivos.' });
  }

  // ── Empty rooms ──
  if (rooms.length > 0 && lights.length === 0) {
    issues.push({ severity: 'warning', message: 'Habitaciones sin luminarias colocadas.' });
  }

  if (elements.length === 0) {
    issues.push({ severity: 'warning', message: 'El plano está vacío. Comienza dibujando habitaciones.' });
  }

  const isValid = !issues.some((i) => i.severity === 'error');

  if (isValid && issues.filter(i => i.severity !== 'ok').length === 0) {
    issues.push({
      severity: 'ok',
      message: `Plano válido — ${lights.length} luces · ${outlets.length} tomas · ${switches.length} interruptores · ${wires.length} cables`,
    });
  }

  return { issues, isValid, stats };
}