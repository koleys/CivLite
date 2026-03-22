import type { Tile, TileCoord, MapData, TerrainType, ImprovementType, ResourceType, TerrainFeature } from '@/game/entities/types';

export interface TileYield {
  food: number;
  production: number;
  gold: number;
  science: number;
  culture: number;
  faith: number;
}

const TERRAIN_YIELDS: Record<TerrainType, TileYield> = {
  grassland: { food: 2, production: 0, gold: 0, science: 0, culture: 0, faith: 0 },
  plains: { food: 1, production: 1, gold: 0, science: 0, culture: 0, faith: 0 },
  desert: { food: 0, production: 0, gold: 0, science: 0, culture: 0, faith: 0 },
  tundra: { food: 1, production: 0, gold: 0, science: 0, culture: 0, faith: 0 },
  snow: { food: 0, production: 0, gold: 0, science: 0, culture: 0, faith: 0 },
  ocean: { food: 1, production: 0, gold: 0, science: 0, culture: 0, faith: 0 },
  coast: { food: 1, production: 1, gold: 0, science: 0, culture: 0, faith: 0 },
  mountain: { food: 0, production: 0, gold: 0, science: 0, culture: 0, faith: 0 },
};

const FEATURE_YIELDS: Record<TerrainFeature, Partial<TileYield>> = {
  forest: { production: 1 },
  hills: {},
  floodplains: { food: 2 },
  oasis: { food: 3, gold: 1 },
  reefs: { production: 1 },
};

const RESOURCE_YIELDS: Record<Exclude<ResourceType, null>, Partial<TileYield>> = {
  wheat: { food: 1 },
  cattle: { food: 1, production: 1 },
  sheep: { food: 1, production: 1 },
  deer: { food: 1, production: 1 },
  furs: { production: 1 },
  stone: { production: 1 },
  marble: { culture: 1, production: 1 },
  fish: { food: 1, production: 1 },
  iron: { production: 1 },
  gold: { gold: 1 },
  silver: { gold: 2 },
};

const IMPROVEMENT_YIELDS: Record<ImprovementType, Partial<TileYield>> = {
  farm: { food: 1 },
  mine: { production: 2 },
  quarry: { production: 1 },
  pasture: { food: 1, production: 1 },
  camp: { production: 1 },
  fishing_boat: { food: 1 },
  fort: {},
  road: {},
  railroad: {},
  none: {},
};

export class TileManager {
  private map: MapData;

  constructor(map: MapData) {
    this.map = map;
  }

  getTile(x: number, y: number): Tile | undefined {
    return this.map.tiles.get(`${x},${y}`);
  }

  getTileCoord(tile: Tile): TileCoord {
    return { x: tile.x, y: tile.y };
  }

  isValidCoordinate(x: number, y: number): boolean {
    return x >= 0 && x < this.map.width && y >= 0 && y < this.map.height;
  }

  isImpassable(tile: Tile): boolean {
    return tile.terrain === 'mountain';
  }

  getNeighbors(x: number, y: number): Tile[] {
    const neighbors: Tile[] = [];
    const directions = [
      [-1, -1], [0, -1], [1, -1],
      [-1, 0],          [1, 0],
      [-1, 1],  [0, 1], [1, 1],
    ];

    for (const [dx, dy] of directions) {
      const tile = this.getTile(x + dx, y + dy);
      if (tile) {
        neighbors.push(tile);
      }
    }

    return neighbors;
  }

  getAdjacentTiles(x: number, y: number): Tile[] {
    const adjacent: Tile[] = [];
    const directions = [
      [0, -1], [1, 0], [0, 1], [-1, 0],
    ];

    for (const [dx, dy] of directions) {
      const tile = this.getTile(x + dx, y + dy);
      if (tile) {
        adjacent.push(tile);
      }
    }

    return adjacent;
  }

  calculateTileYield(tile: Tile, difficultyMultiplier: number = 1): TileYield {
    const base = TERRAIN_YIELDS[tile.terrain] || { food: 0, production: 0, gold: 0, science: 0, culture: 0, faith: 0 };
    
    const featureBonus = tile.feature ? FEATURE_YIELDS[tile.feature] : {};
    const resourceBonus = tile.resource ? RESOURCE_YIELDS[tile.resource] : {};
    const improvementBonus = IMPROVEMENT_YIELDS[tile.improvement] || {};

    return {
      food: (base.food + (featureBonus.food || 0) + (resourceBonus.food || 0) + (improvementBonus.food || 0)) * difficultyMultiplier,
      production: (base.production + (featureBonus.production || 0) + (resourceBonus.production || 0) + (improvementBonus.production || 0)) * difficultyMultiplier,
      gold: (base.gold + (featureBonus.gold || 0) + (resourceBonus.gold || 0) + (improvementBonus.gold || 0)) * difficultyMultiplier,
      science: (base.science + (featureBonus.science || 0) + (resourceBonus.science || 0) + (improvementBonus.science || 0)) * difficultyMultiplier,
      culture: (base.culture + (featureBonus.culture || 0) + (resourceBonus.culture || 0) + (improvementBonus.culture || 0)) * difficultyMultiplier,
      faith: (base.faith + (featureBonus.faith || 0) + (resourceBonus.faith || 0) + (improvementBonus.faith || 0)) * difficultyMultiplier,
    };
  }

  calculateAdjacentBonus(x: number, y: number, bonusType: 'production' | 'food' | 'gold'): number {
    const neighbors = this.getAdjacentTiles(x, y);
    let bonus = 0;

    for (const neighbor of neighbors) {
      if (bonusType === 'production') {
        if (neighbor.improvement === 'mine') bonus += 1;
        if (neighbor.improvement === 'quarry') bonus += 1;
        if (neighbor.feature === 'hills') bonus += 1;
      }
      if (bonusType === 'food' && neighbor.improvement === 'farm') {
        bonus += 1;
      }
    }

    return bonus;
  }

  getValidImprovementTiles(): Tile[] {
    const validTiles: Tile[] = [];
    const improvements: ImprovementType[] = ['farm', 'mine', 'quarry', 'pasture', 'camp', 'fishing_boat', 'road', 'fort'];
    this.map.tiles.forEach(tile => {
      for (const improvement of improvements) {
        if (this.canBuildImprovement(tile, improvement)) {
          validTiles.push(tile);
          break;
        }
      }
    });
    return validTiles;
  }

  canBuildImprovement(tile: Tile, improvement: ImprovementType): boolean {
    if (tile.improvement !== 'none') return false;
    if (tile.terrain === 'mountain') return false;

    switch (improvement) {
      case 'farm':
        return tile.terrain === 'grassland' || tile.terrain === 'plains' || tile.feature === 'floodplains';
      case 'mine':
        return tile.feature === 'hills' || 
               tile.resource === 'iron' || tile.resource === 'stone' || tile.resource === 'gold' || tile.resource === 'silver';
      case 'quarry':
        return tile.resource === 'stone' || tile.resource === 'marble' || 
               tile.feature === 'hills';
      case 'pasture':
        return tile.resource === 'cattle' || tile.resource === 'sheep';
      case 'camp':
        return tile.resource === 'deer' || tile.resource === 'furs';
      case 'fishing_boat':
        return tile.terrain === 'coast';
      case 'road':
        return true;
      case 'railroad':
        return true;
      case 'fort':
        return true;
      default:
        return false;
    }
  }

  getDistance(x1: number, y1: number, x2: number, y2: number): number {
    return Math.sqrt(Math.pow(x2 - x1, 2) + Math.pow(y2 - y1, 2));
  }

  getMovementCost(tile: Tile): number {
    if (tile.terrain === 'mountain') return Infinity;

    let cost = 1;

    if (tile.feature === 'hills') cost += 1;
    if (tile.feature === 'forest') cost += 1;
    if (tile.improvement === 'road') cost = 0.5;
    if (tile.improvement === 'railroad') cost = 0.25;

    return cost;
  }

  getTilesInRadius(x: number, y: number, radius: number): Tile[] {
    const tiles: Tile[] = [];
    
    for (let dy = -radius; dy <= radius; dy++) {
      for (let dx = -radius; dx <= radius; dx++) {
        const distance = Math.sqrt(dx * dx + dy * dy);
        if (distance <= radius) {
          const tile = this.getTile(x + dx, y + dy);
          if (tile) {
            tiles.push(tile);
          }
        }
      }
    }

    return tiles;
  }
}

export function createTileManager(map: MapData): TileManager {
  return new TileManager(map);
}
