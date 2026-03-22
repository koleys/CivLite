import { describe, it, expect } from 'vitest';
import {
  calculateCityGrowth,
  calculateCityYields,
  calculateHousing,
  calculateAmenities,
  calculateAmenitiesRequired,
  getFoodPerTurn,
  getGameSpeedGrowthMultiplier,
  calculateTileYield,
} from '@/game/engine/CityGrowth';
import type { City, MapData, Tile, Player } from '@/game/entities/types';

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

function createMockMap(width: number, height: number): MapData {
  const tiles = new Map<string, Tile>();
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      tiles.set(`${x},${y}`, createMockTile(x, y));
    }
  }
  return { width, height, tiles, seed: 12345 };
}

function createMockCity(overrides: Partial<City> = {}): City {
  return {
    id: 'city-1',
    name: 'Test City',
    owner: 0,
    x: 5,
    y: 5,
    population: 1,
    tiles: [{ x: 5, y: 5 }],
    buildings: [],
    currentProduction: null,
    buildQueue: [],
    foodStockpile: 0,
    foodForGrowth: 6,
    amenities: 2,
    amenitiesRequired: 1,
    housing: 3,
    housingUsed: 1,
    specialistSlots: { scientist: 0, merchant: 0, artist: 0 },
    isOriginalCapital: true,
    garrison: null,
    turnFounded: 1,
    turnsOfGarrison: 0,
    liberationStatus: 'none',
    wasFoundedBy: null,
    isBeingRazed: false,
    razeTurnsRemaining: 0,
    ...overrides,
  };
}

describe('City Growth', () => {
  describe('calculateTileYield', () => {
    it('should return correct yield for grassland', () => {
      const tile = createMockTile(0, 0, 'grassland');
      const yields = calculateTileYield(tile);
      
      expect(yields.food).toBe(2);
      expect(yields.production).toBe(0);
    });

    it('should return correct yield for plains', () => {
      const tile = createMockTile(0, 0, 'plains');
      const yields = calculateTileYield(tile);
      
      expect(yields.food).toBe(1);
      expect(yields.production).toBe(1);
    });

    it('should return correct yield for desert', () => {
      const tile = createMockTile(0, 0, 'desert');
      const yields = calculateTileYield(tile);
      
      expect(yields.food).toBe(0);
      expect(yields.production).toBe(0);
    });

    it('should add farm improvement bonus', () => {
      const tile = createMockTile(0, 0, 'plains');
      tile.improvement = 'farm';
      const yields = calculateTileYield(tile);
      
      expect(yields.food).toBe(2);
    });

    it('should add mine improvement bonus', () => {
      const tile = createMockTile(0, 0, 'plains');
      tile.improvement = 'mine';
      const yields = calculateTileYield(tile);
      
      expect(yields.production).toBe(3);
    });

    it('should add resource bonus for wheat', () => {
      const tile = createMockTile(0, 0, 'plains');
      tile.resource = 'wheat';
      const yields = calculateTileYield(tile);
      
      expect(yields.food).toBe(2);
    });
  });

  describe('calculateCityYields', () => {
    it('should calculate base yields for city', () => {
      const city = createMockCity();
      const map = createMockMap(10, 10);
      
      const result = calculateCityYields(city, map);
      
      expect(result.baseYields.food).toBe(2);
      expect(result.baseYields.culture).toBe(1);
    });

    it('should include worked tile yields', () => {
      const city = createMockCity({ tiles: [{ x: 5, y: 5 }] });
      const map = createMockMap(10, 10);
      
      const result = calculateCityYields(city, map);
      
      expect(result.workedTileYields.food).toBeGreaterThanOrEqual(0);
    });
  });

  describe('calculateCityGrowth', () => {
    it('should calculate food surplus correctly', () => {
      const city = createMockCity({ population: 1, foodStockpile: 0, foodForGrowth: 6 });
      const map = createMockMap(10, 10);
      
      const result = calculateCityGrowth(city, map, 3);
      
      expect(result.foodSurplus).toBe(2);
    });

    it('should not grow when food stockpile is insufficient', () => {
      const city = createMockCity({ population: 1, foodStockpile: 3, foodForGrowth: 6 });
      const map = createMockMap(10, 10);
      
      const result = calculateCityGrowth(city, map, 2);
      
      expect(result.grew).toBe(false);
      expect(result.newFoodStockpile).toBe(4);
    });

    it('should grow when food stockpile reaches threshold', () => {
      const city = createMockCity({ population: 1, foodStockpile: 4, foodForGrowth: 6 });
      const map = createMockMap(10, 10);
      
      const result = calculateCityGrowth(city, map, 3);
      
      expect(result.grew).toBe(true);
      expect(result.newFoodStockpile).toBe(0);
    });

    it('should handle starvation', () => {
      const city = createMockCity({ population: 2, foodStockpile: 0, foodForGrowth: 10 });
      const map = createMockMap(10, 10);
      
      const result = calculateCityGrowth(city, map, 1);
      
      expect(result.starved).toBe(true);
    });

    it('should handle negative food surplus', () => {
      const city = createMockCity({ population: 5, foodStockpile: 2, foodForGrowth: 10 });
      const map = createMockMap(10, 10);
      
      const result = calculateCityGrowth(city, map, 2);
      
      expect(result.foodSurplus).toBe(-3);
      expect(result.starved).toBe(true);
    });
  });

  describe('calculateHousing', () => {
    it('should return base housing of 3', () => {
      const city = createMockCity();
      const housing = calculateHousing(city);
      
      expect(housing).toBe(3);
    });

    it('should add aqueduct housing bonus', () => {
      const city = createMockCity({ buildings: ['aqueduct'] });
      const housing = calculateHousing(city);
      
      expect(housing).toBe(8);
    });

    it('should add sewer housing bonus', () => {
      const city = createMockCity({ buildings: ['aqueduct', 'sewer'] });
      const housing = calculateHousing(city);
      
      expect(housing).toBe(10);
    });

    it('should add neighborhood housing bonus', () => {
      const city = createMockCity({ buildings: ['neighborhood'] });
      const housing = calculateHousing(city);
      
      expect(housing).toBe(7);
    });
  });

  describe('calculateAmenitiesRequired', () => {
    it('should require 1 amenity for population 1', () => {
      const city = createMockCity({ population: 1 });
      const required = calculateAmenitiesRequired(city);
      
      expect(required).toBe(1);
    });

    it('should require 2 amenities for population 3', () => {
      const city = createMockCity({ population: 3 });
      const required = calculateAmenitiesRequired(city);
      
      expect(required).toBe(2);
    });

    it('should require 3 amenities for population 5', () => {
      const city = createMockCity({ population: 5 });
      const required = calculateAmenitiesRequired(city);
      
      expect(required).toBe(3);
    });
  });

  describe('calculateAmenities', () => {
    it('should have base amenities of 2', () => {
      const city = createMockCity({ population: 1 });
      const amenities = calculateAmenities(city);
      
      expect(amenities).toBe(2);
    });

    it('should increase with population', () => {
      const city = createMockCity({ population: 5 });
      const amenities = calculateAmenities(city);
      
      expect(amenities).toBe(4);
    });

    it('should add arena bonus', () => {
      const city = createMockCity({ buildings: ['arena'] });
      const amenities = calculateAmenities(city);
      
      expect(amenities).toBe(3);
    });

    it('should add specialist bonuses', () => {
      const city = createMockCity({ 
        specialistSlots: { scientist: 0, merchant: 2, artist: 2 } 
      });
      const amenities = calculateAmenities(city);
      
      expect(amenities).toBe(6);
    });
  });

  describe('getFoodPerTurn', () => {
    it('should calculate food per turn', () => {
      const city = createMockCity();
      const map = createMockMap(10, 10);
      
      const food = getFoodPerTurn(city, map);
      
      expect(food).toBeGreaterThanOrEqual(0);
    });
  });

  describe('getGameSpeedGrowthMultiplier', () => {
    it('should return 0.5 for online speed', () => {
      expect(getGameSpeedGrowthMultiplier('online')).toBe(0.5);
    });

    it('should return 1 for standard speed', () => {
      expect(getGameSpeedGrowthMultiplier('standard')).toBe(1);
    });

    it('should return 3 for marathon speed', () => {
      expect(getGameSpeedGrowthMultiplier('marathon')).toBe(3);
    });

    it('should return 1 for unknown speed', () => {
      expect(getGameSpeedGrowthMultiplier('unknown')).toBe(1);
    });
  });
});
