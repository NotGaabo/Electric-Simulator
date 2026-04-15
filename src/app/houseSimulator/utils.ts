import { Point, FloorElement, WireElement, RoomElement, PointElement } from './types';
import { GRID_SIZE } from './constants';

export function snapToGrid(value: number, gridSize = GRID_SIZE): number {
  return Math.round(value / gridSize) * gridSize;
}

export function snapPoint(p: Point, gridSize = GRID_SIZE): Point {
  return { x: snapToGrid(p.x, gridSize), y: snapToGrid(p.y, gridSize) };
}

export function generateId(): string {
  return 'el_' + Math.random().toString(36).slice(2, 9);
}

export function distance(a: Point, b: Point): number {
  return Math.sqrt(Math.pow(b.x - a.x, 2) + Math.pow(b.y - a.y, 2));
}

export function isWireElement(el: FloorElement): el is WireElement {
  return ['wire_hot', 'wire_neutral', 'wire_ground', 'circuit'].includes(el.type);
}

export function isRoomElement(el: FloorElement): el is RoomElement {
  return el.type === 'room';
}

export function isPointElement(el: FloorElement): el is PointElement {
  return !isWireElement(el) && !isRoomElement(el);
}

export function pointInsideRoom(p: Point, room: RoomElement): boolean {
  return (
    p.x >= room.x && p.x <= room.x + room.w &&
    p.y >= room.y && p.y <= room.y + room.h
  );
}

export function getElementsInRoom(room: RoomElement, elements: FloorElement[]): FloorElement[] {
  return elements.filter((el) => {
    if (isPointElement(el)) return pointInsideRoom({ x: el.x, y: el.y }, room);
    return false;
  });
}

export function getSnappedPosition(
  e: React.MouseEvent,
  containerRef: React.RefObject<HTMLDivElement | null>,
  gridSize = GRID_SIZE
): Point {
  if (!containerRef.current) return { x: 0, y: 0 };
  const rect = containerRef.current.getBoundingClientRect();
  return snapPoint(
    { x: e.clientX - rect.left, y: e.clientY - rect.top },
    gridSize
  );
}

export function exportAsSVG(svgElement: SVGSVGElement): string {
  const serializer = new XMLSerializer();
  return serializer.serializeToString(svgElement);
}

export function downloadSVG(svgElement: SVGSVGElement, filename = 'plano-electrico.svg'): void {
  const svgStr = exportAsSVG(svgElement);
  const blob = new Blob([svgStr], { type: 'image/svg+xml' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url; a.download = filename; a.click();
  URL.revokeObjectURL(url);
}

export function downloadJSON(elements: FloorElement[], filename = 'plano-electrico.json'): void {
  const json = JSON.stringify({ version: 2, elements }, null, 2);
  const blob = new Blob([json], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url; a.download = filename; a.click();
  URL.revokeObjectURL(url);
}