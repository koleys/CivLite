import { describe, it, expect } from 'vitest';
import { 
  canStackUnit, 
  isCivilianUnit, 
  isMilitaryUnit, 
  getMilitaryCount, 
  getCivilianCount,
  MAX_MILITARY_STACK,
  MAX_CIVILIAN_STACK 
} from '@/game/engine/UnitStacking';
import type { Unit, Tile, Player } from '@/game/entities/types';

function createMockTile(x: number, y: number): Tile {
  return {
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
  };
}

function createMockUnit(id: string, type: string, owner: number): Unit {
  return {
    id,
    type: type as Unit['type'],
    owner,
    x: 0,
    y: 0,
    health: 100,
    maxHealth: 100,
    movement: 2,
    maxMovement: 2,
    strength: 10,
    strengthBase: 10,
    hasActed: false,
  };
}

function createMockPlayer(id: number, units: Unit[]): Player {
  return {
    id,
    name: `Player ${id}`,
    isAI: id !== 0,
    isHuman: id === 0,
    gold: 100,
    cities: [],
    units,
    technologies: new Set(),
    currentResearch: null,
    score: 0,
    eraScore: 0,
  };
}

describe('Unit Stacking', () => {
  describe('isCivilianUnit', () => {
    it('should identify settler as civilian', () => {
      expect(isCivilianUnit('settler')).toBe(true);
    });

    it('should identify scout as civilian', () => {
      expect(isCivilianUnit('scout')).toBe(true);
    });

    it('should not identify warrior as civilian', () => {
      expect(isCivilianUnit('warrior')).toBe(false);
    });

    it('should not identify archer as civilian', () => {
      expect(isCivilianUnit('archer')).toBe(false);
    });
  });

  describe('isMilitaryUnit', () => {
    it('should identify warrior as military', () => {
      expect(isMilitaryUnit('warrior')).toBe(true);
    });

    it('should identify archer as military', () => {
      expect(isMilitaryUnit('archer')).toBe(true);
    });

    it('should not identify settler as military', () => {
      expect(isMilitaryUnit('settler')).toBe(false);
    });
  });

  describe('canStackUnit', () => {
    it('should allow stacking military units up to limit', () => {
      const tile = createMockTile(5, 5);
      tile.units = ['unit1', 'unit2'];
      
      const player = createMockPlayer(0, [
        createMockUnit('unit1', 'warrior', 0),
        createMockUnit('unit2', 'archer', 0),
      ]);
      const players = [player];

      const newUnit = createMockUnit('unit3', 'swordsman', 0);
      const result = canStackUnit(newUnit, tile, players);

      expect(result.allowed).toBe(true);
    });

    it('should prevent stacking more than 3 military units', () => {
      const tile = createMockTile(5, 5);
      tile.units = ['unit1', 'unit2', 'unit3'];
      
      const player = createMockPlayer(0, [
        createMockUnit('unit1', 'warrior', 0),
        createMockUnit('unit2', 'archer', 0),
        createMockUnit('unit3', 'swordsman', 0),
      ]);
      const players = [player];

      const newUnit = createMockUnit('unit4', 'horseman', 0);
      const result = canStackUnit(newUnit, tile, players);

      expect(result.allowed).toBe(false);
      expect(result.reason).toContain('Maximum');
    });

    it('should allow civilian with military escort', () => {
      const tile = createMockTile(5, 5);
      tile.units = ['unit1'];
      
      const player = createMockPlayer(0, [
        createMockUnit('unit1', 'warrior', 0),
      ]);
      const players = [player];

      const settler = createMockUnit('settler1', 'settler', 0);
      const result = canStackUnit(settler, tile, players);

      expect(result.allowed).toBe(true);
    });

    it('should prevent civilian without military escort', () => {
      const tile = createMockTile(5, 5);
      tile.units = [];
      
      const player = createMockPlayer(0, []);
      const players = [player];

      const settler = createMockUnit('settler1', 'settler', 0);
      const result = canStackUnit(settler, tile, players);

      expect(result.allowed).toBe(false);
      expect(result.reason).toContain('escorted');
    });

    it('should prevent stacking multiple civilians', () => {
      const tile = createMockTile(5, 5);
      tile.units = ['settler1'];
      
      const player = createMockPlayer(0, [
        createMockUnit('settler1', 'settler', 0),
        createMockUnit('scout1', 'scout', 0),
      ]);
      const players = [player];

      const scout = createMockUnit('scout1', 'scout', 0);
      const result = canStackUnit(scout, tile, players);

      expect(result.allowed).toBe(false);
    });

    it('should allow same owner military units to stack', () => {
      const tile = createMockTile(5, 5);
      tile.units = ['unit1'];
      
      const player1 = createMockPlayer(0, [createMockUnit('unit1', 'warrior', 0)]);
      const player2 = createMockPlayer(1, [createMockUnit('unit2', 'warrior', 1)]);
      const players = [player1, player2];

      const newUnit = createMockUnit('unit3', 'archer', 0);
      const result = canStackUnit(newUnit, tile, players);

      expect(result.allowed).toBe(true);
    });
  });

  describe('getMilitaryCount', () => {
    it('should count only military units', () => {
      const tile = createMockTile(5, 5);
      const player = createMockPlayer(0, [
        createMockUnit('unit1', 'warrior', 0),
        createMockUnit('unit2', 'settler', 0),
        createMockUnit('unit3', 'archer', 0),
      ]);
      tile.units = ['unit1', 'unit2', 'unit3'];
      const players = [player];

      const count = getMilitaryCount(tile, players);
      expect(count).toBe(2);
    });

    it('should filter by owner', () => {
      const tile = createMockTile(5, 5);
      const player1 = createMockPlayer(0, [createMockUnit('unit1', 'warrior', 0)]);
      const player2 = createMockPlayer(1, [createMockUnit('unit2', 'warrior', 1)]);
      tile.units = ['unit1', 'unit2'];
      const players = [player1, player2];

      const countOwn = getMilitaryCount(tile, players, 0);
      expect(countOwn).toBe(1);
    });
  });

  describe('getCivilianCount', () => {
    it('should count only civilian units', () => {
      const tile = createMockTile(5, 5);
      const player = createMockPlayer(0, [
        createMockUnit('unit1', 'warrior', 0),
        createMockUnit('unit2', 'settler', 0),
        createMockUnit('unit3', 'scout', 0),
      ]);
      tile.units = ['unit1', 'unit2', 'unit3'];
      const players = [player];

      const count = getCivilianCount(tile, players);
      expect(count).toBe(2);
    });
  });

  describe('constants', () => {
    it('should have MAX_MILITARY_STACK of 3', () => {
      expect(MAX_MILITARY_STACK).toBe(3);
    });

    it('should have MAX_CIVILIAN_STACK of 1', () => {
      expect(MAX_CIVILIAN_STACK).toBe(1);
    });
  });
});
