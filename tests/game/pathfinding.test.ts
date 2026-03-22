import { describe, it, expect, beforeEach } from 'vitest';
import { findPath, getHexNeighbors, isValidMove, getReachableTiles } from '@/utils/pathfinding';
import type { MapData, TileCoord, Tile } from '@/game/entities/types';

function createMockTile(x: number, y: number, terrain: string = 'grassland'): Tile {
  return {
    id: `${x},${y}`,
    x,
    y,
    terrain: terrain as Tile['terrain'],
    feature: null,
    resource: null,
    improvement: 'none',
    owner: null,
    cityId: null,
    units: [],
  };
}

function createMockMap(width: number, height: number, terrain: string = 'grassland'): MapData {
  const tiles = new Map<string, Tile>();
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      tiles.set(`${x},${y}`, createMockTile(x, y, terrain));
    }
  }
  return { width, height, tiles, seed: 12345 };
}

describe('Pathfinding', () => {
  describe('getHexNeighbors', () => {
    it('should return 6 neighbors for even row', () => {
      const neighbors = getHexNeighbors(5, 4);
      expect(neighbors).toHaveLength(6);
    });

    it('should return 6 neighbors for odd row', () => {
      const neighbors = getHexNeighbors(5, 5);
      expect(neighbors).toHaveLength(6);
    });

    it('should calculate neighbors correctly for even row', () => {
      const neighbors = getHexNeighbors(5, 4);
      const expected = [
        { x: 4, y: 3 },
        { x: 5, y: 3 },
        { x: 6, y: 4 },
        { x: 6, y: 5 },
        { x: 5, y: 5 },
        { x: 4, y: 5 },
      ];
      expect(neighbors).toEqual(expected);
    });
  });

  describe('isValidMove', () => {
    it('should return true for valid grassland tile', () => {
      const map = createMockMap(10, 10, 'grassland');
      const result = isValidMove(map, { x: 0, y: 0 }, { x: 1, y: 1 });
      expect(result).toBe(true);
    });

    it('should return false for ocean tile', () => {
      const map = createMockMap(10, 10, 'grassland');
      const oceanTile = map.tiles.get('1,1');
      if (oceanTile) oceanTile.terrain = 'ocean';
      
      const result = isValidMove(map, { x: 0, y: 0 }, { x: 1, y: 1 });
      expect(result).toBe(false);
    });

    it('should return false for mountain tile', () => {
      const map = createMockMap(10, 10, 'grassland');
      const mountainTile = map.tiles.get('1,1');
      if (mountainTile) mountainTile.terrain = 'mountain';
      
      const result = isValidMove(map, { x: 0, y: 0 }, { x: 1, y: 1 });
      expect(result).toBe(false);
    });

    it('should return false for out of bounds tile', () => {
      const map = createMockMap(10, 10, 'grassland');
      const result = isValidMove(map, { x: 0, y: 0 }, { x: 100, y: 100 });
      expect(result).toBe(false);
    });
  });

  describe('findPath', () => {
    it('should find direct path between adjacent tiles', () => {
      const map = createMockMap(10, 10, 'grassland');
      const path = findPath(map, { x: 5, y: 5 }, { x: 6, y: 5 }, 2);
      
      expect(path).not.toBeNull();
      expect(path!.length).toBeGreaterThanOrEqual(2);
      expect(path![0]).toEqual({ x: 5, y: 5 });
      expect(path![path!.length - 1]).toEqual({ x: 6, y: 5 });
    });

    it('should find path around obstacle', () => {
      const map = createMockMap(5, 5, 'grassland');
      const mountainTile = map.tiles.get('2,2');
      if (mountainTile) mountainTile.terrain = 'mountain';
      
      const path = findPath(map, { x: 1, y: 2 }, { x: 3, y: 2 }, 10);
      expect(path).not.toBeNull();
      expect(path!.length).toBeGreaterThan(2);
    });

    it('should return null when destination is unreachable', () => {
      const map = createMockMap(5, 5, 'grassland');
      for (let y = 0; y < 5; y++) {
        for (let x = 0; x < 5; x++) {
          const tile = map.tiles.get(`${x},${y}`);
          if (tile) tile.terrain = 'mountain';
        }
      }
      
      const path = findPath(map, { x: 0, y: 0 }, { x: 4, y: 4 }, 10);
      expect(path).toBeNull();
    });

    it('should respect movement limit', () => {
      const map = createMockMap(10, 10, 'grassland');
      const path = findPath(map, { x: 0, y: 0 }, { x: 5, y: 5 }, 2);
      expect(path).toBeNull();
    });
  });

  describe('getReachableTiles', () => {
    it('should return starting tile as reachable', () => {
      const map = createMockMap(10, 10, 'grassland');
      const reachable = getReachableTiles(map, { x: 5, y: 5 }, 2);
      
      expect(reachable.has('5,5')).toBe(true);
    });

    it('should include adjacent tiles within movement', () => {
      const map = createMockMap(10, 10, 'grassland');
      const reachable = getReachableTiles(map, { x: 5, y: 5 }, 2);
      
      expect(reachable.has('6,5')).toBe(true);
      expect(reachable.has('5,6')).toBe(true);
    });

    it('should respect movement cost for hills', () => {
      const map = createMockMap(10, 10, 'grassland');
      const hillsTile = map.tiles.get('6,5');
      if (hillsTile) hillsTile.feature = 'hills';
      
      const reachable = getReachableTiles(map, { x: 5, y: 5 }, 1);
      expect(reachable.has('6,5')).toBe(false);
    });

    it('should include hills with enough movement', () => {
      const map = createMockMap(10, 10, 'grassland');
      const hillsTile = map.tiles.get('6,5');
      if (hillsTile) hillsTile.feature = 'hills';
      
      const reachable = getReachableTiles(map, { x: 5, y: 5 }, 2);
      expect(reachable.has('6,5')).toBe(true);
    });
  });
});
