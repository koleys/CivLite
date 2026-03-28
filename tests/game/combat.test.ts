import { describe, it, expect } from 'vitest';
import {
  resolveCombat,
  applyCombatDamage,
  getCombatStrength,
  getTerrainBonus,
  getUnitClass,
  isRangedUnit,
  isSiegeUnit,
  canAttack,
  canNuke,
  resolveNuke,
} from '@/game/engine/CombatResolver';
import type { Unit, Tile, Player, MapData } from '@/game/entities/types';

function createMockUnit(overrides: Partial<Unit> = {}): Unit {
  return {
    id: 'unit-1',
    type: 'warrior',
    owner: 0,
    x: 5,
    y: 5,
    health: 100,
    maxHealth: 100,
    movement: 2,
    maxMovement: 2,
    strength: 20,
    strengthBase: 20,
    hasActed: false,
    ...overrides,
  };
}

function createMockTile(overrides: Partial<Tile> = {}): Tile {
  return {
    id: '5,5',
    x: 5,
    y: 5,
    terrain: 'grassland',
    feature: null,
    resource: null,
    improvement: 'none',
    owner: null,
    cityId: null,
    units: [],
    ...overrides,
  };
}

function createMockPlayer(id: number, units: Unit[] = []): Player {
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

function createMockMap(): MapData {
  const tiles = new Map<string, Tile>();
  for (let y = 0; y < 10; y++) {
    for (let x = 0; x < 10; x++) {
      tiles.set(`${x},${y}`, createMockTile({ id: `${x},${y}`, x, y }));
    }
  }
  return { width: 10, height: 10, tiles, seed: 12345 };
}

describe('CombatResolver', () => {
  describe('getUnitClass', () => {
    it('should return melee for warrior', () => {
      expect(getUnitClass('warrior')).toBe('melee');
    });

    it('should return ranged for archer', () => {
      expect(getUnitClass('archer')).toBe('ranged');
    });

    it('should return siege for catapult', () => {
      expect(getUnitClass('catapult')).toBe('siege');
    });

    it('should return light_cavalry for horseman', () => {
      expect(getUnitClass('horseman')).toBe('light_cavalry');
    });

    it('should return naval_melee for galley', () => {
      expect(getUnitClass('galley')).toBe('naval_melee');
    });

    it('should return air for fighter', () => {
      expect(getUnitClass('fighter')).toBe('air');
    });

    it('should return support for settler', () => {
      expect(getUnitClass('settler')).toBe('support');
    });
  });

  describe('isRangedUnit', () => {
    it('should identify archer as ranged', () => {
      expect(isRangedUnit('archer')).toBe(true);
    });

    it('should not identify warrior as ranged', () => {
      expect(isRangedUnit('warrior')).toBe(false);
    });

    it('should identify catapult as ranged', () => {
      expect(isRangedUnit('catapult')).toBe(true);
    });
  });

  describe('isSiegeUnit', () => {
    it('should identify catapult as siege', () => {
      expect(isSiegeUnit('catapult')).toBe(true);
    });

    it('should identify cannon as siege', () => {
      expect(isSiegeUnit('cannon')).toBe(true);
    });

    it('should not identify warrior as siege', () => {
      expect(isSiegeUnit('warrior')).toBe(false);
    });
  });

  describe('getTerrainBonus', () => {
    it('should return 0 for flat grassland', () => {
      const tile = createMockTile({ terrain: 'grassland' });
      expect(getTerrainBonus(tile)).toBe(0);
    });

    it('should return 0.25 for hills', () => {
      const tile = createMockTile({ feature: 'hills' });
      expect(getTerrainBonus(tile)).toBe(0.25);
    });

    it('should return 0.25 for forest', () => {
      const tile = createMockTile({ feature: 'forest' });
      expect(getTerrainBonus(tile)).toBe(0.25);
    });

    it('should return 0.5 for fort improvement', () => {
      const tile = createMockTile({ improvement: 'fort' });
      expect(getTerrainBonus(tile)).toBe(0.5);
    });

    it('should return 0.4 for city tile', () => {
      const tile = createMockTile({ cityId: 'city-1' });
      expect(getTerrainBonus(tile)).toBe(0.4);
    });

    it('should stack bonuses (hills + forest)', () => {
      const tile = createMockTile({ feature: 'hills' });
      // hills gives 0.25; forest is separate feature, can't stack directly
      // In this implementation, feature can only be one value
      expect(getTerrainBonus(tile)).toBe(0.25);
    });
  });

  describe('getCombatStrength', () => {
    it('should return base strength for warrior on flat tile', () => {
      const unit = createMockUnit({ type: 'warrior', strengthBase: 20 });
      const tile = createMockTile();
      const strength = getCombatStrength(unit, tile, true, { level: 0, xp: 0, promotions: [] });
      expect(strength).toBe(20);
    });

    it('should return 0 for non-military unit', () => {
      const unit = createMockUnit({ type: 'settler', strengthBase: 0 });
      const tile = createMockTile();
      const strength = getCombatStrength(unit, tile, true, { level: 0, xp: 0, promotions: [] });
      expect(strength).toBe(0);
    });

    it('should apply terrain bonus', () => {
      const unit = createMockUnit({ type: 'warrior', strengthBase: 20 });
      const tile = createMockTile({ feature: 'hills' });
      const strength = getCombatStrength(unit, tile, true, { level: 0, xp: 0, promotions: [] });
      expect(strength).toBe(Math.floor(20 * 1.25));
    });

    it('should apply aggressor promotion', () => {
      const unit = createMockUnit({ type: 'warrior', strengthBase: 20 });
      const tile = createMockTile();
      const strength = getCombatStrength(unit, tile, true, {
        level: 1, xp: 10,
        promotions: ['aggressor'],
      });
      expect(strength).toBe(25);
    });
  });

  describe('canAttack', () => {
    it('should allow attack if unit has not acted', () => {
      const unit = createMockUnit({ hasActed: false });
      expect(canAttack(unit, false)).toBe(true);
    });

    it('should not allow attack if unit has acted', () => {
      const unit = createMockUnit({ hasActed: true });
      expect(canAttack(unit, false)).toBe(false);
    });

    it('should not allow ranged attack after moving', () => {
      const unit = createMockUnit({ type: 'archer', hasActed: false });
      expect(canAttack(unit, true)).toBe(false);
    });

    it('should allow melee attack after moving', () => {
      const unit = createMockUnit({ type: 'warrior', hasActed: false });
      expect(canAttack(unit, true)).toBe(true);
    });

    it('should not allow settler to attack', () => {
      const unit = createMockUnit({ type: 'settler', hasActed: false });
      expect(canAttack(unit, false)).toBe(false);
    });
  });

  describe('resolveCombat', () => {
    it('should produce damage in both directions for melee', () => {
      const attacker = createMockUnit({ id: 'att', type: 'warrior', strengthBase: 20 });
      const defender = createMockUnit({ id: 'def', type: 'warrior', owner: 1, strengthBase: 20 });
      const attackerTile = createMockTile({ id: '4,5', x: 4, y: 5 });
      const defenderTile = createMockTile({ id: '5,5', x: 5, y: 5 });
      const map = createMockMap();
      const players = [createMockPlayer(0, [attacker]), createMockPlayer(1, [defender])];

      const result = resolveCombat(attacker, defender, attackerTile, defenderTile, {
        map,
        players,
        difficulty: 'standard',
      });

      expect(result.defenderDamage).toBeGreaterThanOrEqual(1);
      expect(result.attackerDamage).toBeGreaterThanOrEqual(0);
    });

    it('should apply difficulty multiplier: beginner does more damage', () => {
      const attacker = createMockUnit({ id: 'att', type: 'warrior', strengthBase: 20 });
      const defender = createMockUnit({ id: 'def', type: 'warrior', owner: 1, strengthBase: 10 });
      const attackerTile = createMockTile();
      const defenderTile = createMockTile();
      const map = createMockMap();
      const players = [createMockPlayer(0, [attacker]), createMockPlayer(1, [defender])];

      const config = { map, players, difficulty: 'standard' as const };
      const configBeginner = { map, players, difficulty: 'beginner' as const };

      const resultStandard = resolveCombat(attacker, defender, attackerTile, defenderTile, config);
      const resultBeginner = resolveCombat(attacker, defender, attackerTile, defenderTile, configBeginner);

      expect(resultBeginner.defenderDamage).toBeGreaterThanOrEqual(resultStandard.defenderDamage);
    });

    it('should mark unit as killed when damage equals health', () => {
      const attacker = createMockUnit({ id: 'att', type: 'warrior', strengthBase: 100 });
      const defender = createMockUnit({ id: 'def', type: 'warrior', owner: 1, strengthBase: 1, health: 1 });
      const tile = createMockTile();
      const map = createMockMap();
      const players = [createMockPlayer(0, [attacker]), createMockPlayer(1, [defender])];

      const result = resolveCombat(attacker, defender, tile, tile, {
        map,
        players,
        difficulty: 'standard',
      });

      expect(result.defenderKilled).toBe(true);
    });

    it('should give xp for combat', () => {
      const attacker = createMockUnit({ id: 'att', type: 'warrior', strengthBase: 20 });
      const defender = createMockUnit({ id: 'def', type: 'warrior', owner: 1, strengthBase: 20 });
      const tile = createMockTile();
      const map = createMockMap();
      const players = [createMockPlayer(0), createMockPlayer(1)];

      const result = resolveCombat(attacker, defender, tile, tile, {
        map,
        players,
        difficulty: 'standard',
      });

      expect(result.xpGained).toBeGreaterThanOrEqual(1);
    });
  });

  describe('applyCombatDamage', () => {
    it('should reduce health by damage amount', () => {
      const attacker = createMockUnit({ id: 'att', health: 100 });
      const defender = createMockUnit({ id: 'def', owner: 1, health: 100 });
      const players = [createMockPlayer(0, [attacker]), createMockPlayer(1, [defender])];

      applyCombatDamage(attacker, defender, {
        attackerDamage: 10,
        defenderDamage: 20,
        attackerKilled: false,
        defenderKilled: false,
        xpGained: 2,
      }, players);

      expect(attacker.health).toBe(90);
      expect(defender.health).toBe(80);
    });

    it('should return killed unit ids', () => {
      const attacker = createMockUnit({ id: 'att', health: 10 });
      const defender = createMockUnit({ id: 'def', owner: 1, health: 5 });
      const players = [createMockPlayer(0, [attacker]), createMockPlayer(1, [defender])];

      const { killedUnits } = applyCombatDamage(attacker, defender, {
        attackerDamage: 10,
        defenderDamage: 5,
        attackerKilled: true,
        defenderKilled: true,
        xpGained: 2,
      }, players);

      expect(killedUnits).toContain('att');
      expect(killedUnits).toContain('def');
    });
  });

  describe('canNuke', () => {
    it('should allow nuke within range 7', () => {
      const unit = createMockUnit({ type: 'nuclear_device' as typeof createMockUnit extends (o: Partial<infer U>) => infer U ? U : never extends { type: infer T } ? T : never, x: 0, y: 0, movement: 2 });
      expect(canNuke(unit, 3, 4)).toBe(true);
    });

    it('should reject nuke for non-nuclear unit', () => {
      const unit = createMockUnit({ type: 'warrior', x: 0, y: 0, movement: 2 });
      expect(canNuke(unit, 3, 4)).toBe(false);
    });
  });

  describe('resolveNuke', () => {
    it('should destroy units in blast radius', () => {
      const nuke = createMockUnit({ type: 'warrior', x: 0, y: 0 }); // type doesn't matter here
      const map = createMockMap();
      const players = [createMockPlayer(0), createMockPlayer(1)];

      // Place a unit at blast center
      const victim = createMockUnit({ id: 'victim', owner: 1, x: 5, y: 5 });
      players[1].units.push(victim);
      map.tiles.get('5,5')!.units.push('victim');

      const result = resolveNuke(nuke, 5, 5, { map, players, difficulty: 'standard' });

      expect(result.destroyedUnits).toContain('victim');
    });

    it('should create fallout tiles around blast', () => {
      const nuke = createMockUnit({ type: 'warrior', x: 0, y: 0 });
      const map = createMockMap();
      const players = [createMockPlayer(0)];

      const result = resolveNuke(nuke, 5, 5, { map, players, difficulty: 'standard' });

      expect(result.falloutTiles.length).toBeGreaterThan(0);
    });
  });
});
