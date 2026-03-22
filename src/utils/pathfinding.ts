import type { TileCoord, MapData, Tile } from '@/game/entities/types';

export interface PathNode {
  x: number;
  y: number;
  g: number;
  h: number;
  f: number;
  parent: PathNode | null;
}

export function findPath(
  map: MapData,
  from: TileCoord,
  to: TileCoord,
  maxMovement: number
): TileCoord[] | null {
  const openSet: PathNode[] = [];
  const closedSet = new Set<string>();

  const startNode: PathNode = {
    x: from.x,
    y: from.y,
    g: 0,
    h: manhattanDistance(from, to),
    f: manhattanDistance(from, to),
    parent: null,
  };

  openSet.push(startNode);

  while (openSet.length > 0) {
    openSet.sort((a, b) => a.f - b.f);
    const current = openSet.shift()!;
    const currentKey = `${current.x},${current.y}`;

    if (current.x === to.x && current.y === to.y) {
      const path: TileCoord[] = [];
      let node: PathNode | null = current;
      while (node) {
        path.unshift({ x: node.x, y: node.y });
        node = node.parent;
      }
      return path;
    }

    closedSet.add(currentKey);

    const neighbors = getHexNeighbors(current.x, current.y);

    for (const neighbor of neighbors) {
      const neighborKey = `${neighbor.x},${neighbor.y}`;
      
      if (closedSet.has(neighborKey)) continue;
      
      const tile = map.tiles.get(neighborKey);
      if (!tile) continue;
      
      if (tile.terrain === 'ocean') continue;
      if (tile.terrain === 'mountain') continue;

      const moveCost = getMoveCost(tile);
      const g = current.g + moveCost;
      
      if (g > maxMovement) continue;

      const existingNode = openSet.find((n) => n.x === neighbor.x && n.y === neighbor.y);
      
      if (!existingNode) {
        const h = manhattanDistance(neighbor, to);
        openSet.push({
          x: neighbor.x,
          y: neighbor.y,
          g,
          h,
          f: g + h,
          parent: current,
        });
      } else if (g < existingNode.g) {
        existingNode.g = g;
        existingNode.f = g + existingNode.h;
        existingNode.parent = current;
      }
    }
  }

  return null;
}

export function getHexNeighbors(x: number, y: number): TileCoord[] {
  const isEvenRow = y % 2 === 0;
  
  const directions = isEvenRow
    ? [
        { x: x - 1, y: y - 1 },
        { x: x, y: y - 1 },
        { x: x + 1, y: y },
        { x: x + 1, y: y + 1 },
        { x: x, y: y + 1 },
        { x: x - 1, y: y + 1 },
      ]
    : [
        { x: x - 1, y: y },
        { x: x - 1, y: y - 1 },
        { x: x, y: y - 1 },
        { x: x + 1, y: y - 1 },
        { x: x - 1, y: y + 1 },
        { x: x, y: y + 1 },
      ];

  return directions;
}

function manhattanDistance(a: TileCoord, b: TileCoord): number {
  return Math.abs(a.x - b.x) + Math.abs(a.y - b.y);
}

function getMoveCost(tile: Tile): number {
  if (tile.terrain === 'coast') return 1.5;
  if (tile.terrain === 'desert' || tile.terrain === 'plains') return 1;
  if (tile.terrain === 'tundra' || tile.terrain === 'snow') return 1.5;
  if (tile.terrain === 'grassland') return 1;
  
  if (tile.feature === 'hills') return 2;
  if (tile.feature === 'forest') return 2;
  
  return 1;
}

export function isValidMove(
  map: MapData,
  _from: TileCoord,
  to: TileCoord
): boolean {
  const tile = map.tiles.get(`${to.x},${to.y}`);
  if (!tile) return false;
  
  if (tile.terrain === 'ocean' || tile.terrain === 'mountain') {
    return false;
  }
  
  return true;
}

export function getReachableTiles(
  map: MapData,
  from: TileCoord,
  maxMovement: number
): Set<string> {
  const reachable = new Set<string>();
  const frontier: { x: number; y: number; movement: number }[] = [
    { x: from.x, y: from.y, movement: maxMovement },
  ];
  const visited = new Set<string>();

  while (frontier.length > 0) {
    const current = frontier.shift()!;
    const key = `${current.x},${current.y}`;

    if (visited.has(key)) continue;
    visited.add(key);
    reachable.add(key);

    const neighbors = getHexNeighbors(current.x, current.y);

    for (const neighbor of neighbors) {
      const neighborKey = `${neighbor.x},${neighbor.y}`;
      if (visited.has(neighborKey)) continue;

      const tile = map.tiles.get(neighborKey);
      if (!tile) continue;

      const moveCost = getMoveCost(tile);
      const remainingMovement = current.movement - moveCost;

      if (remainingMovement >= 0) {
        frontier.push({
          x: neighbor.x,
          y: neighbor.y,
          movement: remainingMovement,
        });
      }
    }
  }

  return reachable;
}
