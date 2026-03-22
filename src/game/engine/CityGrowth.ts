import type { City, Tile, MapData, TerrainType, ImprovementType, ResourceType, TerrainFeature } from '@/game/entities/types';

export interface CityGrowthResult {
  foodSurplus: number;
  newFoodStockpile: number;
  grew: boolean;
  starved: boolean;
  foodNeeded: number;
}

export interface CityYields {
  food: number;
  production: number;
  gold: number;
  science: number;
  culture: number;
  faith: number;
}

export interface YieldCalculation {
  baseYields: CityYields;
  workedTileYields: CityYields;
  buildingYields: CityYields;
  totalYields: CityYields;
}

const TERRAIN_YIELDS: Record<TerrainType, CityYields> = {
  grassland: { food: 2, production: 0, gold: 0, science: 0, culture: 0, faith: 0 },
  plains: { food: 1, production: 1, gold: 0, science: 0, culture: 0, faith: 0 },
  desert: { food: 0, production: 0, gold: 0, science: 0, culture: 0, faith: 0 },
  tundra: { food: 1, production: 0, gold: 0, science: 0, culture: 0, faith: 0 },
  snow: { food: 0, production: 0, gold: 0, science: 0, culture: 0, faith: 0 },
  ocean: { food: 1, production: 0, gold: 0, science: 0, culture: 0, faith: 0 },
  coast: { food: 1, production: 1, gold: 0, science: 0, culture: 0, faith: 0 },
  mountain: { food: 0, production: 0, gold: 0, science: 0, culture: 0, faith: 0 },
};

const FEATURE_YIELDS: Record<TerrainFeature, Partial<CityYields>> = {
  forest: { production: 1 },
  hills: {},
  floodplains: { food: 2 },
  oasis: { food: 3, gold: 1 },
  reefs: { production: 1 },
};

const RESOURCE_YIELDS: Record<Exclude<ResourceType, null>, Partial<CityYields>> = {
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

const IMPROVEMENT_YIELDS: Record<ImprovementType, Partial<CityYields>> = {
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

export function calculateTileYield(tile: Tile): CityYields {
  const base = TERRAIN_YIELDS[tile.terrain] || { food: 0, production: 0, gold: 0, science: 0, culture: 0, faith: 0 };
  const featureBonus = tile.feature ? FEATURE_YIELDS[tile.feature] : {};
  const resourceBonus = tile.resource ? RESOURCE_YIELDS[tile.resource] : {};
  const improvementBonus = IMPROVEMENT_YIELDS[tile.improvement] || {};

  return {
    food: base.food + (featureBonus.food || 0) + (resourceBonus.food || 0) + (improvementBonus.food || 0),
    production: base.production + (featureBonus.production || 0) + (resourceBonus.production || 0) + (improvementBonus.production || 0),
    gold: base.gold + (featureBonus.gold || 0) + (resourceBonus.gold || 0) + (improvementBonus.gold || 0),
    science: base.science + (featureBonus.science || 0) + (resourceBonus.science || 0) + (improvementBonus.science || 0),
    culture: base.culture + (featureBonus.culture || 0) + (resourceBonus.culture || 0) + (improvementBonus.culture || 0),
    faith: base.faith + (featureBonus.faith || 0) + (resourceBonus.faith || 0) + (improvementBonus.faith || 0),
  };
}

export function calculateCityYields(
  city: City,
  map: MapData,
): YieldCalculation {
  const baseYields: CityYields = {
    food: 2,
    production: 0,
    gold: 0,
    science: 0,
    culture: 1,
    faith: 0,
  };

  const workedTileYields = calculateWorkedTileYields(city, map);
  const buildingYields = calculateBuildingYields(city);

  const totalYields: CityYields = {
    food: baseYields.food + workedTileYields.food + buildingYields.food,
    production: baseYields.production + workedTileYields.production + buildingYields.production,
    gold: baseYields.gold + workedTileYields.gold + buildingYields.gold,
    science: baseYields.science + workedTileYields.science + buildingYields.science,
    culture: baseYields.culture + workedTileYields.culture + buildingYields.culture,
    faith: baseYields.faith + workedTileYields.faith + buildingYields.faith,
  };

  return {
    baseYields,
    workedTileYields,
    buildingYields,
    totalYields,
  };
}

function calculateWorkedTileYields(city: City, map: MapData): CityYields {
  const yields: CityYields = {
    food: 0,
    production: 0,
    gold: 0,
    science: 0,
    culture: 0,
    faith: 0,
  };

  for (const coord of city.tiles) {
    const tile = map.tiles.get(`${coord.x},${coord.y}`);
    if (!tile) continue;

    const tileYields = calculateTileYield(tile);
    yields.food += tileYields.food;
    yields.production += tileYields.production;
    yields.gold += tileYields.gold;
    yields.science += tileYields.science;
    yields.culture += tileYields.culture;
    yields.faith += tileYields.faith;
  }

  return yields;
}

function calculateBuildingYields(city: City): CityYields {
  const yields: CityYields = {
    food: 0,
    production: 0,
    gold: 0,
    science: 0,
    culture: 0,
    faith: 0,
  };

  for (const building of city.buildings) {
    switch (building) {
      case 'granary':
        yields.food += 2;
        break;
      case 'library':
        yields.science += 2;
        break;
      case 'market':
        yields.gold += 2;
        break;
      case 'temple':
        yields.culture += 2;
        yields.faith += 2;
        break;
      case 'university':
        yields.science += 4;
        break;
      case 'bank':
        yields.gold += 4;
        break;
      case 'broadcast_center':
        yields.culture += 4;
        break;
    }
  }

  return yields;
}

export function calculateHousing(city: City): number {
  let housing = 3;

  if (city.buildings.includes('aqueduct')) {
    housing += 5;
  }
  if (city.buildings.includes('sewer')) {
    housing += 2;
  }
  if (city.buildings.includes('neighborhood')) {
    housing += 4;
  }

  return housing;
}

export function calculateAmenitiesRequired(city: City): number {
  return Math.ceil(city.population / 2);
}

export function calculateAmenities(city: City): number {
  let amenities = 2;
  amenities += Math.floor(city.population / 2);
  amenities += city.specialistSlots.merchant;
  amenities += city.specialistSlots.artist;

  if (city.buildings.includes('arena')) {
    amenities += 1;
  }

  return amenities;
}

export function getGameSpeedGrowthMultiplier(speed: string): number {
  switch (speed) {
    case 'online':
      return 0.5;
    case 'standard':
      return 1;
    case 'marathon':
      return 3;
    default:
      return 1;
  }
}

export function getFoodPerTurn(city: City, map: MapData): number {
  const yields = calculateCityYields(city, map);
  return yields.totalYields.food;
}

export function calculateCityGrowth(
  city: City,
  _map: MapData,
  foodPerTurn: number
): CityGrowthResult {
  const citizens = city.population;
  const foodConsumption = citizens;
  const foodSurplus = foodPerTurn - foodConsumption;

  let newFoodStockpile = city.foodStockpile + foodSurplus;
  let grew = false;
  let starved = false;
  const foodNeeded = city.foodForGrowth;

  if (newFoodStockpile >= foodNeeded) {
    grew = true;
    newFoodStockpile = newFoodStockpile - foodNeeded;
  }

  if (newFoodStockpile < 0) {
    starved = true;
    newFoodStockpile = 0;
  }

  return {
    foodSurplus,
    newFoodStockpile,
    grew,
    starved,
    foodNeeded,
  };
}

export function processCityGrowth(
  city: City,
  map: MapData,
  gameSpeed: string
): CityGrowthResult {
  const foodPerTurn = getFoodPerTurn(city, map);
  const result = calculateCityGrowth(city, map, foodPerTurn);

  city.foodStockpile = result.newFoodStockpile;

  if (result.grew) {
    city.population += 1;
    const growthMultiplier = getGameSpeedGrowthMultiplier(gameSpeed);
    city.foodForGrowth = Math.floor(6 * growthMultiplier * (1 + city.population * 0.15));
    city.housingUsed = city.population;
  }

  if (result.starved && city.population > 1) {
    city.population -= 1;
    city.foodStockpile = 0;
    city.housingUsed = city.population;
  }

  city.amenitiesRequired = calculateAmenitiesRequired(city);
  city.amenities = calculateAmenities(city);
  city.housing = calculateHousing(city);

  return result;
}
