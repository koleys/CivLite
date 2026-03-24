import type { Unit, Tile, Player, MapData } from '@/game/entities/types';
import { isMilitaryUnit } from './UnitStacking';

export interface CombatResult {
  attackerDamage: number;
  defenderDamage: number;
  attackerKilled: boolean;
  defenderKilled: boolean;
  xpGained: number;
}

export interface CombatConfig {
  map: MapData;
  players: Player[];
  difficulty: 'beginner' | 'easy' | 'standard' | 'deity';
}

const BASE_DAMAGE = {
  melee: 20,
  ranged: 15,
} as const;

const TERRAIN_BONUS: Record<string, number> = {
  hills: 0.25,
  forest: 0.25,
  mountain: 0.5,
  fort: 0.5,
  city: 0.4,
};

const UNIT_CLASS_BONUS: Record<string, number> = {
  melee: 0,
  ranged: 0,
  siege: 1.0,
  light_cavalry: 0,
  heavy_cavalry: 0,
  naval_melee: 0,
  naval_ranged: 0,
};

export type PromotionType =
  | 'aggressor'
  | 'precise'
  | 'survivor'
  | 'mobile'
  | 'berserker'
  | 'bloodthirsty'
  | 'mortar'
  | 'shrapnel'
  | 'hardened'
  | 'resilient'
  | 'swallow'
  | 'swift'
  | 'ranger'
  | 'charge'
  | 'medic'
  | 'embark'
  | 'amphibious';

export interface UnitPromotions {
  level: number;
  xp: number;
  promotions: PromotionType[];
}

export function getUnitPromotions(unit: Unit): UnitPromotions {
  return (unit as Unit & { promotions?: UnitPromotions }).promotions ?? {
    level: 0,
    xp: 0,
    promotions: [],
  };
}

export function getCombatStrength(
  unit: Unit,
  tile: Tile,
  isAttacker: boolean,
  promotions: UnitPromotions
): number {
  let strength = unit.strengthBase;

  if (!isMilitaryUnit(unit.type)) return 0;

  let promotionBonus = 0;
  for (const promo of promotions.promotions) {
    switch (promo) {
      case 'aggressor':
        promotionBonus += 5;
        break;
      case 'berserker':
        if (!isAttacker) promotionBonus += 10;
        break;
      case 'bloodthirsty':
        promotionBonus += 5;
        break;
    }
  }

  strength += promotionBonus;

  const terrainBonus = getTerrainBonus(tile);
  strength = Math.floor(strength * (1 + terrainBonus));

  const fortificationTurns = (unit as Unit & { fortificationTurns?: number }).fortificationTurns ?? 0;
  if (fortificationTurns > 0 && !isAttacker) {
    const fortBonus = 1 + Math.min(fortificationTurns * 0.05, 0.2);
    strength = Math.floor(strength * fortBonus);
  }

  return strength;
}

export function getTerrainBonus(tile: Tile): number {
  let bonus = 0;

  if (tile.feature === 'hills') bonus += TERRAIN_BONUS.hills;
  if (tile.feature === 'forest') bonus += TERRAIN_BONUS.forest;
  if (tile.terrain === 'mountain') bonus += TERRAIN_BONUS.mountain;
  if (tile.improvement === 'fort') bonus += TERRAIN_BONUS.fort;
  if (tile.cityId) bonus += TERRAIN_BONUS.city;

  return bonus;
}

export function getUnitClass(type: string): string {
  const classMap: Record<string, string> = {
    warrior: 'melee',
    swordsman: 'melee',
    musketman: 'melee',
    samurai: 'melee',
    infantry: 'melee',
    tank: 'heavy_cavalry',
    archer: 'ranged',
    crossbowman: 'ranged',
    catapult: 'siege',
    cannon: 'siege',
    artillery: 'siege',
    horseman: 'light_cavalry',
    charioteer: 'light_cavalry',
    cavalry: 'light_cavalry',
    cuirassier: 'heavy_cavalry',
    galley: 'naval_melee',
    caravel: 'naval_melee',
    caravelle: 'naval_melee',
    galleass: 'naval_ranged',
    ship_of_the_line: 'naval_ranged',
    fighter: 'air',
    bomber: 'air',
    jet_fighter: 'air',
    scout: 'support',
    settler: 'support',
  };

  return classMap[type] || 'melee';
}

export function isRangedUnit(type: string): boolean {
  const rangedTypes = ['archer', 'crossbowman', 'catapult', 'cannon', 'artillery', 'galleass', 'ship_of_the_line', 'fighter', 'bomber'];
  return rangedTypes.includes(type);
}

export function isSiegeUnit(type: string): boolean {
  const siegeTypes = ['catapult', 'cannon', 'artillery'];
  return siegeTypes.includes(type);
}

export function canAttack(attacker: Unit, hasMoved: boolean): boolean {
  if (attacker.hasActed) return false;
  if (!isMilitaryUnit(attacker.type)) return false;

  if (hasMoved && isRangedUnit(attacker.type)) {
    return false;
  }

  return true;
}

export function resolveCombat(
  attacker: Unit,
  defender: Unit,
  attackerTile: Tile,
  defenderTile: Tile,
  config: CombatConfig
): CombatResult {
  const attackerPromotions = getUnitPromotions(attacker);
  const defenderPromotions = getUnitPromotions(defender);

  const attackerStrength = getCombatStrength(attacker, attackerTile, true, attackerPromotions);
  const defenderStrength = getCombatStrength(defender, defenderTile, false, defenderPromotions);

  let effectiveAttackerStrength = attackerStrength;
  let effectiveDefenderStrength = defenderStrength;

  if (isSiegeUnit(attacker.type) && defenderTile.cityId) {
    effectiveAttackerStrength = Math.floor(effectiveAttackerStrength * (1 + UNIT_CLASS_BONUS.siege));
  }

  const defenderDamaged = defender.health < defender.maxHealth * 0.5;
  if (defenderDamaged) {
    const hasChargePromo = defenderPromotions.promotions.includes('charge');
    if (hasChargePromo) {
      effectiveDefenderStrength = Math.floor(effectiveDefenderStrength * 1.15);
    }
  }

  const effectiveStrength = effectiveAttackerStrength - effectiveDefenderStrength;

  const baseDamage = isRangedUnit(attacker.type) ? BASE_DAMAGE.ranged : BASE_DAMAGE.melee;
  const rawDamage = Math.max(1, effectiveStrength) * baseDamage / 10;

  const difficultyMultiplier = getDifficultyMultiplier(config.difficulty);
  const defenderDamage = Math.floor(rawDamage * difficultyMultiplier);

  const defenderAttackerStrength = defenderStrength - attackerStrength;
  const attackerBaseDamage = isRangedUnit(defender.type) ? BASE_DAMAGE.ranged : BASE_DAMAGE.melee;
  const attackerRawDamage = Math.max(1, defenderAttackerStrength) * attackerBaseDamage / 10;
  const attackerDamage = Math.floor(attackerRawDamage / difficultyMultiplier);

  const xpGained = Math.floor(defender.strengthBase / 10);

  return {
    attackerDamage: Math.min(attackerDamage, attacker.health),
    defenderDamage: Math.min(defenderDamage, defender.health),
    attackerKilled: attacker.health <= attackerDamage,
    defenderKilled: defender.health <= defenderDamage,
    xpGained,
  };
}

function getDifficultyMultiplier(difficulty: string): number {
  const multipliers: Record<string, number> = {
    beginner: 2.0,
    easy: 1.33,
    standard: 1.0,
    deity: 0.5,
  };
  return multipliers[difficulty] || 1.0;
}

export function applyCombatDamage(
  attacker: Unit,
  defender: Unit,
  result: CombatResult,
  players: Player[]
): { attacker: Unit; defender: Unit; killedUnits: string[] } {
  const killedUnits: string[] = [];

  if (result.attackerDamage > 0) {
    attacker.health -= result.attackerDamage;
    if (result.attackerKilled) {
      killedUnits.push(attacker.id);
    }
  }

  if (result.defenderDamage > 0) {
    defender.health -= result.defenderDamage;
    if (result.defenderKilled) {
      killedUnits.push(defender.id);
    }
  }

  const attackerPlayer = players.find((p) => p.id === attacker.owner);

  if (attackerPlayer && !result.attackerKilled) {
    const attackerPromotions = getUnitPromotions(attacker);
    attackerPromotions.xp += result.xpGained;
    updateUnitLevel(attacker);
  }

  return { attacker, defender, killedUnits };
}

function updateUnitLevel(unit: Unit): void {
  const promotions = getUnitPromotions(unit);
  const xpThresholds = [10, 30, 60, 100, 150];

  for (let i = xpThresholds.length - 1; i >= 0; i--) {
    if (promotions.xp >= xpThresholds[i]) {
      promotions.level = i + 1;
      break;
    }
  }
}

export function canNuke(
  unit: Unit,
  targetX: number,
  targetY: number
): boolean {
  const unitType = unit.type as string;
  if (unitType !== 'nuclear_device') return false;
  if (unit.movement < 1) return false;

  const distance = Math.abs(unit.x - targetX) + Math.abs(unit.y - targetY);
  return distance <= 7;
}

export interface NukeResult {
  destroyedUnits: string[];
  destroyedBuildings: string[];
  capturedCity: boolean;
  falloutTiles: Array<{ x: number; y: number }>;
}

export function resolveNuke(
  unit: Unit,
  targetX: number,
  targetY: number,
  config: CombatConfig
): NukeResult {
  const destroyedUnits: string[] = [];
  const destroyedBuildings: string[] = [];
  const falloutTiles: Array<{ x: number; y: number }> = [];

  const { map, players } = config;
  void unit;

  for (let dy = -1; dy <= 1; dy++) {
    for (let dx = -1; dx <= 1; dx++) {
      const x = targetX + dx;
      const y = targetY + dy;

      if (x < 0 || x >= map.width || y < 0 || y >= map.height) continue;

      const tile = map.tiles.get(`${x},${y}`);
      if (!tile) continue;

      if (dx === 0 && dy === 0) {
        const city = players.flatMap((p) => p.cities).find((c) => c.x === x && c.y === y);
        if (city) {
          city.population = 1;
          city.buildings = [];
          destroyedBuildings.push(...city.buildings);
          city.garrison = null;
        }
      }

      for (const unitId of tile.units) {
        destroyedUnits.push(unitId);
      }
      tile.units = [];
      tile.improvement = 'none';

      if (dx !== 0 || dy !== 0) {
        falloutTiles.push({ x, y });
        const falloutTile = map.tiles.get(`${x},${y}`);
        if (falloutTile) {
          (falloutTile as Tile & { fallout?: boolean }).fallout = true;
        }
      }
    }
  }

  return {
    destroyedUnits,
    destroyedBuildings,
    capturedCity: false,
    falloutTiles,
  };
}
