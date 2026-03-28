import { describe, it, expect, beforeEach } from 'vitest';
import {
  TechSystem,
  createTechSystem,
  TECHNOLOGIES,
  TECH_COST_MULTIPLIERS,
  checkEurekaTrigger,
} from '@/game/engine/TechSystem';
import type { Player } from '@/game/entities/types';

function createMockPlayer(): Player {
  return {
    id: 0,
    name: 'Test Player',
    isAI: false,
    isHuman: true,
    gold: 100,
    cities: [],
    units: [],
    technologies: new Set(),
    currentResearch: null,
    score: 0,
    eraScore: 0,
  };
}

describe('TechSystem', () => {
  let player: Player;
  let techSystem: TechSystem;

  beforeEach(() => {
    player = createMockPlayer();
    techSystem = createTechSystem(player, { gameSpeed: 'standard', difficulty: 'standard' });
  });

  describe('TECHNOLOGIES data', () => {
    it('should have all required starting technologies', () => {
      const startingTechs = ['mining', 'pottery', 'writing', 'archery', 'sailing', 'animal_husbandry'];
      for (const tech of startingTechs) {
        expect(TECHNOLOGIES[tech]).toBeDefined();
      }
    });

    it('should have refining technology defined', () => {
      expect(TECHNOLOGIES['refining']).toBeDefined();
      expect(TECHNOLOGIES['refining'].era).toBe('exploration');
    });

    it('should have universities technology defined', () => {
      expect(TECHNOLOGIES['universities']).toBeDefined();
      expect(TECHNOLOGIES['universities'].era).toBe('exploration');
    });

    it('should have combustion requiring refining', () => {
      expect(TECHNOLOGIES['combustion'].prerequisites).toContain('refining');
    });

    it('should have plastics requiring refining', () => {
      expect(TECHNOLOGIES['plastics'].prerequisites).toContain('refining');
    });

    it('should have education unlocking universities', () => {
      expect(TECHNOLOGIES['education'].unlocks).toContain('universities');
    });

    it('should have valid prerequisites chains (no undefined techs)', () => {
      const allTechIds = Object.keys(TECHNOLOGIES);
      for (const techId of allTechIds) {
        const tech = TECHNOLOGIES[techId];
        for (const prereq of tech.prerequisites) {
          expect(allTechIds).toContain(prereq);
        }
      }
    });
  });

  describe('TECH_COST_MULTIPLIERS', () => {
    it('should have online speed multiplier of 0.67', () => {
      expect(TECH_COST_MULTIPLIERS['online']).toBe(0.67);
    });

    it('should have standard speed multiplier of 1.0', () => {
      expect(TECH_COST_MULTIPLIERS['standard']).toBe(1.0);
    });

    it('should have marathon speed multiplier of 3.0', () => {
      expect(TECH_COST_MULTIPLIERS['marathon']).toBe(3.0);
    });
  });

  describe('canResearch', () => {
    it('should allow researching a tech with no prerequisites', () => {
      expect(techSystem.canResearch('mining')).toBe(true);
    });

    it('should not allow researching already researched tech', () => {
      player.technologies.add('mining');
      expect(techSystem.canResearch('mining')).toBe(false);
    });

    it('should not allow researching tech without prerequisites', () => {
      expect(techSystem.canResearch('bronze_working')).toBe(false);
    });

    it('should allow researching tech once prerequisites met', () => {
      player.technologies.add('mining');
      expect(techSystem.canResearch('bronze_working')).toBe(true);
    });
  });

  describe('startResearch', () => {
    it('should start research for valid tech', () => {
      const result = techSystem.startResearch('mining');
      expect(result).toBe(true);
      expect(techSystem.getCurrentResearch()?.techId).toBe('mining');
    });

    it('should not start research for invalid tech', () => {
      const result = techSystem.startResearch('nonexistent_tech');
      expect(result).toBe(false);
    });

    it('should not start research without prerequisites', () => {
      const result = techSystem.startResearch('bronze_working');
      expect(result).toBe(false);
    });

    it('should not start research already being researched', () => {
      techSystem.startResearch('mining');
      const result = techSystem.startResearch('mining');
      expect(result).toBe(false);
    });
  });

  describe('processTurn', () => {
    // getSciencePerTurn() = 1 base per city; add 1 city → 1 science/turn
    beforeEach(() => {
      player.cities = [{
        id: 'c1', name: 'City 1', owner: 0, x: 0, y: 0,
        population: 1, tiles: [], buildings: [], currentProduction: null,
        buildQueue: [], foodStockpile: 0, foodForGrowth: 6,
        amenities: 2, amenitiesRequired: 1, housing: 3, housingUsed: 1,
        specialistSlots: { scientist: 0, merchant: 0, artist: 0 },
        isOriginalCapital: true, garrison: null, turnFounded: 1,
        turnsOfGarrison: 0, liberationStatus: 'none', wasFoundedBy: null,
        isBeingRazed: false, razeTurnsRemaining: 0,
      }];
    });

    it('should accumulate research progress each turn', () => {
      techSystem.startResearch('mining');
      const before = techSystem.getCurrentResearch()?.progress ?? 0;
      techSystem.processTurn();
      const after = techSystem.getCurrentResearch()?.progress ?? 0;
      expect(after).toBeGreaterThan(before);
    });

    it('should complete research when progress reaches cost', () => {
      techSystem.startResearch('mining');
      const research = techSystem.getCurrentResearch()!;
      research.progress = 19; // mining costs 20, +1 science/turn → completes at 20

      const result = techSystem.processTurn();
      expect(result.completed).toBe('mining');
    });

    it('should add completed tech to player technologies', () => {
      techSystem.startResearch('mining');
      const research = techSystem.getCurrentResearch()!;
      research.progress = 19;

      techSystem.processTurn();
      expect(player.technologies.has('mining')).toBe(true);
    });

    it('should clear current research after completion', () => {
      techSystem.startResearch('mining');
      const research = techSystem.getCurrentResearch()!;
      research.progress = 19;

      techSystem.processTurn();
      expect(techSystem.getCurrentResearch()).toBeNull();
    });

    it('should return null completed when no research active', () => {
      const result = techSystem.processTurn();
      expect(result.completed).toBeNull();
    });
  });

  describe('getAdjustedCost', () => {
    it('should return base cost for standard speed', () => {
      expect(techSystem.getAdjustedCost('mining')).toBe(20);
    });

    it('should apply eureka bonus when triggered', () => {
      techSystem.startResearch('mining');
      techSystem.triggerEureka('mining');
      const adjustedCost = techSystem.getAdjustedCost('mining');
      expect(adjustedCost).toBe(Math.floor(20 * 0.5));
    });
  });

  describe('triggerEureka', () => {
    it('should trigger eureka for current research', () => {
      techSystem.startResearch('mining');
      techSystem.triggerEureka('mining');
      expect(techSystem.getCurrentResearch()?.eurekaTriggered).toBe(true);
    });

    it('should not trigger eureka for different tech', () => {
      techSystem.startResearch('pottery');
      techSystem.triggerEureka('mining');
      expect(techSystem.getCurrentResearch()?.eurekaTriggered).toBe(false);
    });

    it('should not trigger eureka twice', () => {
      techSystem.startResearch('mining');
      techSystem.triggerEureka('mining');
      techSystem.triggerEureka('mining'); // second call should be no-op
      expect(techSystem.getCurrentResearch()?.eurekaTriggered).toBe(true);
    });
  });

  describe('getSciencePerTurn', () => {
    it('should return minimum 1 science with no cities', () => {
      expect(techSystem.getSciencePerTurn()).toBe(1);
    });

    it('should return 1 base science per city', () => {
      player.cities.push({
        id: 'city-1', name: 'City 1', owner: 0, x: 0, y: 0,
        population: 1, tiles: [], buildings: [], currentProduction: null,
        buildQueue: [], foodStockpile: 0, foodForGrowth: 6,
        amenities: 2, amenitiesRequired: 1, housing: 3, housingUsed: 1,
        specialistSlots: { scientist: 0, merchant: 0, artist: 0 },
        isOriginalCapital: true, garrison: null, turnFounded: 1,
        turnsOfGarrison: 0, liberationStatus: 'none', wasFoundedBy: null,
        isBeingRazed: false, razeTurnsRemaining: 0,
      });
      expect(techSystem.getSciencePerTurn()).toBe(1); // 1 base per city
    });

    it('should add +2 for library', () => {
      player.cities.push({
        id: 'city-1', name: 'City 1', owner: 0, x: 0, y: 0,
        population: 1, tiles: [], buildings: ['library'], currentProduction: null,
        buildQueue: [], foodStockpile: 0, foodForGrowth: 6,
        amenities: 2, amenitiesRequired: 1, housing: 3, housingUsed: 1,
        specialistSlots: { scientist: 0, merchant: 0, artist: 0 },
        isOriginalCapital: true, garrison: null, turnFounded: 1,
        turnsOfGarrison: 0, liberationStatus: 'none', wasFoundedBy: null,
        isBeingRazed: false, razeTurnsRemaining: 0,
      });
      expect(techSystem.getSciencePerTurn()).toBe(3); // 1 base + 2 library
    });
  });

  describe('getAvailableTechnologies', () => {
    it('should return technologies with no prerequisites initially', () => {
      const available = techSystem.getAvailableTechnologies();
      expect(available).toContain('mining');
      expect(available).toContain('pottery');
      expect(available).toContain('writing');
    });

    it('should not include already researched techs', () => {
      player.technologies.add('mining');
      const available = techSystem.getAvailableTechnologies();
      expect(available).not.toContain('mining');
    });

    it('should unlock new techs as prerequisites are met', () => {
      player.technologies.add('mining');
      const available = techSystem.getAvailableTechnologies();
      expect(available).toContain('bronze_working');
    });
  });

  describe('getResearchProgress', () => {
    it('should return 0 when no research active', () => {
      expect(techSystem.getResearchProgress()).toBe(0);
    });

    it('should return percentage of completion', () => {
      techSystem.startResearch('mining');
      const research = techSystem.getCurrentResearch()!;
      research.progress = 10; // 50% of 20

      expect(techSystem.getResearchProgress()).toBe(50);
    });
  });

  describe('hasTech', () => {
    it('should return false for unresearched tech', () => {
      expect(techSystem.hasTech('mining')).toBe(false);
    });

    it('should return true after tech is researched', () => {
      player.technologies.add('mining');
      expect(techSystem.hasTech('mining')).toBe(true);
    });
  });

  describe('checkEurekaTrigger', () => {
    it('should trigger for killing a unit', () => {
      const result = checkEurekaTrigger('Kill a unit with a melee unit', { unitKilled: true });
      expect(result).toBe(true);
    });

    it('should not trigger without the required context', () => {
      const result = checkEurekaTrigger('Kill a unit with a melee unit', {});
      expect(result).toBe(false);
    });

    it('should trigger for building 3 mines', () => {
      const result = checkEurekaTrigger('Build 3 Mines', { mineBuilt: 3 });
      expect(result).toBe(true);
    });

    it('should not trigger for building 2 mines when 3 required', () => {
      const result = checkEurekaTrigger('Build 3 Mines', { mineBuilt: 2 });
      expect(result).toBe(false);
    });

    it('should trigger for building a road', () => {
      const result = checkEurekaTrigger('Build a Road', { roadBuilt: true });
      expect(result).toBe(true);
    });
  });
});
