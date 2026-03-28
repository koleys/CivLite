import { describe, it, expect, beforeEach } from 'vitest';
import { FogOfWarSystem, createFogOfWarSystem } from '@/game/engine/FogOfWar';
import type { MapData, Player, Unit, City } from '@/game/entities/types';

describe('FogOfWarSystem', () => {
  let map: MapData;
  let config: { enabled: boolean; difficulty: 'beginner' | 'easy' | 'standard' | 'deity' };

  beforeEach(() => {
    const tiles = new Map<string, any>();
    for (let y = 0; y < 20; y++) {
      for (let x = 0; x < 20; x++) {
        tiles.set(`${x},${y}`, {
          id: `${x},${y}`,
          x,
          y,
          terrain: 'grassland',
          feature: null,
          resource: null,
          improvement: 'none',
          owner: null,
          cityId: null,
          units: [],
        });
      }
    }

    map = {
      width: 20,
      height: 20,
      tiles,
      seed: 12345,
    };

    config = {
      enabled: true,
      difficulty: 'standard',
    };
  });

  describe('visibility calculation', () => {
    it('reveals all tiles when difficulty is beginner', () => {
      const fow = createFogOfWarSystem(map, { enabled: true, difficulty: 'beginner' });
      const player: Player = {
        id: 0,
        name: 'Test',
        isAI: false,
        isHuman: true,
        gold: 100,
        cities: [],
        units: [],
      };

      fow.calculateVisibility([player], 0);
      
      expect(fow.isTileVisible(10, 10)).toBe(true);
      expect(fow.isTileVisible(0, 0)).toBe(true);
      expect(fow.isTileVisible(19, 19)).toBe(true);
    });

    it('reveals tiles around units with correct radius', () => {
      const fow = createFogOfWarSystem(map, config);
      const unit: Unit = {
        id: 'test-unit',
        type: 'warrior',
        owner: 0,
        x: 10,
        y: 10,
        health: 100,
        maxHealth: 100,
        movement: 2,
        maxMovement: 2,
        hasActed: false,
      };
      const player: Player = {
        id: 0,
        name: 'Test',
        isAI: false,
        isHuman: true,
        gold: 100,
        cities: [],
        units: [unit],
      };

      fow.calculateVisibility([player], 0);
      
      expect(fow.isTileVisible(10, 10)).toBe(true);
      expect(fow.isTileVisible(10, 11)).toBe(true);
      expect(fow.isTileVisible(10, 12)).toBe(true);
      expect(fow.isTileVisible(10, 14)).toBe(false);
    });

    it('marks unseen tiles as hidden', () => {
      const fow = createFogOfWarSystem(map, config);
      const player: Player = {
        id: 0,
        name: 'Test',
        isAI: false,
        isHuman: true,
        gold: 100,
        cities: [],
        units: [],
      };

      fow.calculateVisibility([player], 0);
      
      expect(fow.getVisibilityAt(10, 10)).toBe('hidden');
    });
  });

  describe('city sight', () => {
    it('reveals tiles around cities', () => {
      const fow = createFogOfWarSystem(map, config);
      const city: City = {
        id: 'test-city',
        name: 'Test City',
        owner: 0,
        x: 10,
        y: 10,
        population: 5,
        tiles: [{ x: 10, y: 10 }],
        buildings: [],
        currentProduction: null,
        buildQueue: [],
        foodStockpile: 0,
        foodForGrowth: 14,
        amenities: 3,
        amenitiesRequired: 3,
        housing: 5,
        housingUsed: 5,
        specialistSlots: { scientist: 0, merchant: 0, artist: 0 },
        isOriginalCapital: true,
        garrison: null,
        turnFounded: 1,
        turnsOfGarrison: 0,
        liberationStatus: 'none',
        wasFoundedBy: null,
        isBeingRazed: false,
        razeTurnsRemaining: 0,
      };
      const player: Player = {
        id: 0,
        name: 'Test',
        isAI: false,
        isHuman: true,
        gold: 100,
        cities: [city],
        units: [],
      };

      fow.calculateVisibility([player], 0);
      
      expect(fow.isTileVisible(10, 10)).toBe(true);
      expect(fow.isTileVisible(10, 11)).toBe(true);
      expect(fow.isTileVisible(10, 14)).toBe(false);
    });
  });

  describe('scout sight radius', () => {
    it('scouts have increased sight radius', () => {
      const fow = createFogOfWarSystem(map, config);
      const scout: Unit = {
        id: 'scout',
        type: 'scout',
        owner: 0,
        x: 10,
        y: 10,
        health: 100,
        maxHealth: 100,
        movement: 2,
        maxMovement: 2,
        hasActed: false,
      };
      const player: Player = {
        id: 0,
        name: 'Test',
        isAI: false,
        isHuman: true,
        gold: 100,
        cities: [],
        units: [scout],
      };

      fow.calculateVisibility([player], 0);
      
      expect(fow.isTileVisible(10, 10)).toBe(true);
      expect(fow.isTileVisible(10, 13)).toBe(true);
      expect(fow.isTileVisible(10, 15)).toBe(false);
    });
  });

  describe('getReachableTiles', () => {
    it('returns tiles within movement range', () => {
      const fow = createFogOfWarSystem(map, config);
      const unit: Unit = {
        id: 'warrior',
        type: 'warrior',
        owner: 0,
        x: 10,
        y: 10,
        health: 100,
        maxHealth: 100,
        movement: 2,
        maxMovement: 2,
        hasActed: false,
      };
      const player: Player = {
        id: 0,
        name: 'Test',
        isAI: false,
        isHuman: true,
        gold: 100,
        cities: [],
        units: [unit],
      };

      fow.calculateVisibility([player], 0);
      const reachable = fow.getReachableTiles(unit);

      expect(reachable.has('10,10')).toBe(true);
      expect(reachable.has('11,10')).toBe(true);
      expect(reachable.has('12,10')).toBe(true);
    });
  });

  describe('difficulty scaling', () => {
    it('standard difficulty has 3-tile base sight', () => {
      const fow = createFogOfWarSystem(map, { enabled: true, difficulty: 'standard' });
      const unit: Unit = {
        id: 'warrior',
        type: 'warrior',
        owner: 0,
        x: 10,
        y: 10,
        health: 100,
        maxHealth: 100,
        movement: 2,
        maxMovement: 2,
        hasActed: false,
      };
      const player: Player = {
        id: 0,
        name: 'Test',
        isAI: false,
        isHuman: true,
        gold: 100,
        cities: [],
        units: [unit],
      };

      fow.calculateVisibility([player], 0);

      expect(fow.isTileVisible(10, 10)).toBe(true);
      expect(fow.isTileVisible(10, 13)).toBe(true);
      expect(fow.isTileVisible(10, 15)).toBe(false);
    });

    it('deity difficulty has 2-tile base sight', () => {
      const fow = createFogOfWarSystem(map, { enabled: true, difficulty: 'deity' });
      const unit: Unit = {
        id: 'warrior',
        type: 'warrior',
        owner: 0,
        x: 10,
        y: 10,
        health: 100,
        maxHealth: 100,
        movement: 2,
        maxMovement: 2,
        hasActed: false,
      };
      const player: Player = {
        id: 0,
        name: 'Test',
        isAI: false,
        isHuman: true,
        gold: 100,
        cities: [],
        units: [unit],
      };

      fow.calculateVisibility([player], 0);

      expect(fow.isTileVisible(10, 10)).toBe(true);
      expect(fow.isTileVisible(10, 12)).toBe(true);
      expect(fow.isTileVisible(10, 14)).toBe(false);
    });
  });
});
