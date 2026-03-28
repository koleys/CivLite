import type { Unit, UnitType, Tile, Player } from '@/game/entities/types';

export const MAX_MILITARY_STACK = 3;
export const MAX_CIVILIAN_STACK = 1;

export const CIVILIAN_UNITS: readonly UnitType[] = ['settler'] as const;

export const isCivilianUnit = (type: UnitType): boolean => {
  return CIVILIAN_UNITS.includes(type);
};

export const isMilitaryUnit = (type: UnitType): boolean => {
  return !isCivilianUnit(type);
};

export interface StackingResult {
  allowed: boolean;
  reason?: string;
}

export function canStackUnit(
  movingUnit: Unit,
  targetTile: Tile,
  allPlayers: Player[]
): StackingResult {
  const unitsOnTile = targetTile.units
    .map((id) => allPlayers.flatMap((p) => p.units).find((u) => u.id === id))
    .filter((u): u is Unit => u !== undefined);

  const movingIsCivilian = isCivilianUnit(movingUnit.type);
  const movingIsMilitary = isMilitaryUnit(movingUnit.type);

  if (movingIsCivilian) {
    const civilianCount = unitsOnTile.filter((u) => isCivilianUnit(u.type)).length;
    if (civilianCount >= MAX_CIVILIAN_STACK) {
      return { allowed: false, reason: `Maximum ${MAX_CIVILIAN_STACK} civilian unit(s) per tile` };
    }
  }

  if (movingIsMilitary) {
    const militaryCount = unitsOnTile.filter((u) => isMilitaryUnit(u.type) && u.owner === movingUnit.owner).length;
    if (militaryCount >= MAX_MILITARY_STACK) {
      return { allowed: false, reason: `Maximum ${MAX_MILITARY_STACK} military units per tile` };
    }
  }

  return { allowed: true };
}

export function getUnitsOnTile(tile: Tile, allPlayers: Player[]): Unit[] {
  return tile.units
    .map((id) => allPlayers.flatMap((p) => p.units).find((u) => u.id === id))
    .filter((u): u is Unit => u !== undefined);
}

export function getMilitaryCount(tile: Tile, allPlayers: Player[], owner?: number): number {
  return getUnitsOnTile(tile, allPlayers).filter(
    (u) => isMilitaryUnit(u.type) && (owner === undefined || u.owner === owner)
  ).length;
}

export function getCivilianCount(tile: Tile, allPlayers: Player[]): number {
  return getUnitsOnTile(tile, allPlayers).filter((u) => isCivilianUnit(u.type)).length;
}
