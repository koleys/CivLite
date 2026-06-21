import unitsData from './units.json';
import buildingsData from './buildings.json';

export interface UnitData {
  name: string;
  cost: number;
  strength: number;
  movement: number;
  era: string;
}

export interface BuildingData {
  name: string;
  cost: number;
  food?: number;
  production?: number;
  gold?: number;
  science?: number;
  culture?: number;
  faith?: number;
  era: string;
}

export const UNITS_DATA: Record<string, UnitData> = unitsData as Record<string, UnitData>;
export const BUILDINGS_DATA: Record<string, BuildingData> = buildingsData as Record<string, BuildingData>;
