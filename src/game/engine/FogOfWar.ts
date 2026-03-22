import type { Tile, TileCoord, Player, City, Unit, MapData } from '@/game/entities/types';

export type VisibilityState = 'hidden' | 'seen' | 'visible';

export interface FogOfWarConfig {
  enabled: boolean;
  difficulty: 'beginner' | 'easy' | 'standard' | 'deity';
}

const SIGHT_RADIUS = {
  difficulty: {
    beginner: 10,
    easy: 5,
    standard: 3,
    deity: 2,
  },
  cityBase: 2,
  cityWalls: 1,
  cityBroadcastTower: 2,
  unitBase: 1,
  scout: 2,
  naval: 3,
  aircraft: 5,
} as const;

export class FogOfWarSystem {
  private map: MapData;
  private config: FogOfWarConfig;
  private visibilityMap: Map<string, VisibilityState> = new Map();
  private lastSeenTiles: Map<string, Tile> = new Map();

  constructor(map: MapData, config: FogOfWarConfig) {
    this.map = map;
    this.config = config;
  }

  calculateVisibility(players: Player[], currentPlayerId: number): Map<string, VisibilityState> {
    this.visibilityMap.clear();

    if (!this.config.enabled || this.config.difficulty === 'beginner') {
      for (const [, tile] of this.map.tiles) {
        this.visibilityMap.set(tile.id, 'visible');
      }
      return this.visibilityMap;
    }

    const currentPlayer = players.find(p => p.id === currentPlayerId);
    if (!currentPlayer) return this.visibilityMap;

    this.revealTilesAroundUnits(currentPlayer.units);
    this.revealTilesAroundCities(currentPlayer.cities);

    this.map.tiles.forEach((_, tileId) => {
      if (!this.visibilityMap.has(tileId)) {
        if (this.lastSeenTiles.has(tileId)) {
          this.visibilityMap.set(tileId, 'seen');
        } else {
          this.visibilityMap.set(tileId, 'hidden');
        }
      }
    });

    return this.visibilityMap;
  }

  private revealTilesAroundUnits(units: Unit[]): void {
    units.forEach(unit => {
      const unitSight = this.getUnitSightRadius(unit);
      this.revealCircle(unit.x, unit.y, unitSight);
    });
  }

  private revealTilesAroundCities(cities: City[]): void {
    cities.forEach(city => {
      const citySight = SIGHT_RADIUS.cityBase;
      this.revealCircle(city.x, city.y, citySight);
      this.lastSeenTiles.set(`${city.x},${city.y}`, this.map.tiles.get(`${city.x},${city.y}`)!);
    });
  }

  private revealCircle(centerX: number, centerY: number, radius: number): void {
    for (let dy = -radius; dy <= radius; dy++) {
      for (let dx = -radius; dx <= radius; dx++) {
        const distance = Math.sqrt(dx * dx + dy * dy);
        if (distance <= radius) {
          const x = centerX + dx;
          const y = centerY + dy;
          
          if (x >= 0 && x < this.map.width && y >= 0 && y < this.map.height) {
            const tileId = `${x},${y}`;
            const tile = this.map.tiles.get(tileId);
            
            if (tile) {
              this.visibilityMap.set(tileId, 'visible');
              this.lastSeenTiles.set(tileId, { ...tile });
            }
          }
        }
      }
    }
  }

  private getUnitSightRadius(unit: Unit): number {
    const difficultyRadius = SIGHT_RADIUS.difficulty[this.config.difficulty];

    switch (unit.type) {
      case 'scout':
        return difficultyRadius + 1;
      case 'galley':
      case 'caravel':
      case 'caravelle':
        return difficultyRadius + 2;
      case 'fighter':
      case 'bomber':
      case 'jet_fighter':
        return difficultyRadius + 4;
      default:
        return difficultyRadius;
    }
  }

  getVisibilityAt(x: number, y: number): VisibilityState {
    return this.visibilityMap.get(`${x},${y}`) || 'hidden';
  }

  getLastSeenTile(x: number, y: number): Tile | undefined {
    return this.lastSeenTiles.get(`${x},${y}`);
  }

  isTileVisible(x: number, y: number): boolean {
    return this.getVisibilityAt(x, y) === 'visible';
  }

  isTileSeen(x: number, y: number): boolean {
    const visibility = this.getVisibilityAt(x, y);
    return visibility === 'seen' || visibility === 'visible';
  }

  updateVisibilityAfterAction(
    players: Player[],
    currentPlayerId: number
  ): Map<string, VisibilityState> {
    return this.calculateVisibility(players, currentPlayerId);
  }

  getVisibleTiles(): Tile[] {
    const visibleTiles: Tile[] = [];
    this.visibilityMap.forEach((visibility, tileId) => {
      if (visibility === 'visible') {
        const tile = this.map.tiles.get(tileId);
        if (tile) visibleTiles.push(tile);
      }
    });
    return visibleTiles;
  }

  getReachableTiles(unit: Unit, maxDistance: number = unit.movement): Set<string> {
    const reachable = new Set<string>();
    const visited = new Set<string>();
    const queue: Array<{ x: number; y: number; distance: number }> = [];

    queue.push({ x: unit.x, y: unit.y, distance: 0 });
    visited.add(`${unit.x},${unit.y}`);

    while (queue.length > 0) {
      const current = queue.shift()!;
      reachable.add(`${current.x},${current.y}`);

      if (current.distance >= maxDistance) continue;

      const neighbors = this.getValidNeighbors(current.x, current.y);
      for (const neighbor of neighbors) {
        const neighborKey = `${neighbor.x},${neighbor.y}`;
        if (!visited.has(neighborKey) && this.isTileVisible(neighbor.x, neighbor.y)) {
          visited.add(neighborKey);
          const moveCost = this.getMovementCost(neighbor.x, neighbor.y);
          queue.push({
            x: neighbor.x,
            y: neighbor.y,
            distance: current.distance + moveCost
          });
        }
      }
    }

    return reachable;
  }

  private getValidNeighbors(x: number, y: number): TileCoord[] {
    const neighbors: TileCoord[] = [];
    const directions = [
      [-1, -1], [0, -1], [1, -1],
      [-1, 0],          [1, 0],
      [-1, 1],  [0, 1], [1, 1],
    ];

    for (const [dx, dy] of directions) {
      const nx = x + dx;
      const ny = y + dy;
      
      if (nx >= 0 && nx < this.map.width && ny >= 0 && ny < this.map.height) {
        const tile = this.map.tiles.get(`${nx},${ny}`);
        if (tile && tile.terrain !== 'ocean' && tile.terrain !== 'mountain') {
          neighbors.push({ x: nx, y: ny });
        }
      }
    }

    return neighbors;
  }

  private getMovementCost(x: number, y: number): number {
    const tile = this.map.tiles.get(`${x},${y}`);
    if (!tile) return 1;

    if (tile.feature === 'hills' || tile.feature === 'forest') {
      return 2;
    }

    if (tile.improvement === 'road' || tile.improvement === 'railroad') {
      return 0.5;
    }

    return 1;
  }

  clearVisibility(): void {
    this.visibilityMap.clear();
    this.lastSeenTiles.clear();
  }
}

export function createFogOfWarSystem(map: MapData, config: FogOfWarConfig): FogOfWarSystem {
  return new FogOfWarSystem(map, config);
}
