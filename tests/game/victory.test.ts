import { describe, it, expect, beforeEach } from 'vitest';
import {
  VictorySystem,
  createVictorySystem,
} from '@/game/engine/VictorySystem';
import type { Player, City } from '@/game/entities/types';

function createMockCity(overrides: Partial<City> = {}): City {
  return {
    id: 'city-1',
    name: 'Test City',
    owner: 0,
    x: 5,
    y: 5,
    population: 3,
    tiles: [],
    buildings: [],
    currentProduction: null,
    buildQueue: [],
    foodStockpile: 0,
    foodForGrowth: 10,
    amenities: 2,
    amenitiesRequired: 2,
    housing: 5,
    housingUsed: 3,
    specialistSlots: { scientist: 0, merchant: 0, artist: 0 },
    isOriginalCapital: false,
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

function createMockPlayer(id: number, cities: City[] = []): Player {
  return {
    id,
    name: `Player ${id}`,
    isAI: id !== 0,
    isHuman: id === 0,
    gold: 100,
    cities,
    units: [],
    technologies: new Set(),
    currentResearch: null,
    score: 0,
    eraScore: 0,
  };
}

describe('VictorySystem', () => {
  let victorySystem: VictorySystem;

  beforeEach(() => {
    victorySystem = createVictorySystem();
  });

  describe('initialization', () => {
    it('should have all 6 victory types enabled by default', () => {
      const types = ['domination', 'science', 'cultural', 'religious', 'diplomatic', 'age'] as const;
      for (const type of types) {
        expect(victorySystem.isVictoryEnabled(type)).toBe(true);
      }
    });

    it('should have no winner initially', () => {
      expect(victorySystem.getWinner()).toBeNull();
    });

    it('should allow customizing enabled victories', () => {
      const system = createVictorySystem(['domination', 'science']);
      expect(system.isVictoryEnabled('domination')).toBe(true);
      expect(system.isVictoryEnabled('cultural')).toBe(false);
    });
  });

  describe('domination victory', () => {
    it('should not trigger with no other players', () => {
      const p1 = createMockPlayer(0, [createMockCity({ isOriginalCapital: true })]);
      const context = { players: [p1], age: 'antiquity' as const, turn: 50 };
      const result = victorySystem.checkVictory(p1, 'domination', context);
      expect(result).toBe(false);
    });

    it('should trigger when player controls all enemy original capitals', () => {
      const p1Capital = createMockCity({ id: 'p1-capital', x: 0, y: 0, isOriginalCapital: true });
      const p2Capital = createMockCity({ id: 'p2-capital-captured', x: 10, y: 10, isOriginalCapital: true, owner: 1 });

      // p1 has both cities (including captured p2 capital)
      const p1 = createMockPlayer(0, [p1Capital, p2Capital]);
      // p2 has no cities left (capital was captured)
      const p2 = createMockPlayer(1, []);

      const context = { players: [p1, p2], age: 'antiquity' as const, turn: 50 };
      const result = victorySystem.checkVictory(p1, 'domination', context);
      expect(result).toBe(true);
    });

    it('should not trigger when enemy still controls their capital', () => {
      const p1Capital = createMockCity({ id: 'p1-capital', x: 0, y: 0, isOriginalCapital: true });
      const p2Capital = createMockCity({ id: 'p2-capital', x: 10, y: 10, isOriginalCapital: true });

      const p1 = createMockPlayer(0, [p1Capital]);
      const p2 = createMockPlayer(1, [p2Capital]);

      const context = { players: [p1, p2], age: 'antiquity' as const, turn: 50 };
      const result = victorySystem.checkVictory(p1, 'domination', context);
      expect(result).toBe(false);
    });

    it('should skip players with id -1 (barbarians)', () => {
      const p1Capital = createMockCity({ isOriginalCapital: true });
      const p1 = createMockPlayer(0, [p1Capital]);
      const barbarians = createMockPlayer(-1, []);

      const context = { players: [p1, barbarians], age: 'antiquity' as const, turn: 50 };
      const result = victorySystem.checkVictory(p1, 'domination', context);
      expect(result).toBe(false); // no other players with capitals to conquer
    });
  });

  describe('science victory', () => {
    it('should not trigger outside modern age', () => {
      const p1 = createMockPlayer(0);
      victorySystem.setSpaceRaceProgress(0, {
        launchPadBuilt: true,
        rocketParts: 3,
        exoplanetLaunched: true,
      });

      const context = { players: [p1], age: 'exploration' as const, turn: 50 };
      const result = victorySystem.checkVictory(p1, 'science', context);
      expect(result).toBe(false);
    });

    it('should not trigger without launch pad', () => {
      const p1 = createMockPlayer(0);
      victorySystem.setSpaceRaceProgress(0, {
        launchPadBuilt: false,
        rocketParts: 3,
        exoplanetLaunched: true,
      });

      const context = { players: [p1], age: 'modern' as const, turn: 200 };
      const result = victorySystem.checkVictory(p1, 'science', context);
      expect(result).toBe(false);
    });

    it('should not trigger without enough rocket parts', () => {
      const p1 = createMockPlayer(0);
      victorySystem.setSpaceRaceProgress(0, {
        launchPadBuilt: true,
        rocketParts: 2,
        exoplanetLaunched: true,
      });

      const context = { players: [p1], age: 'modern' as const, turn: 200 };
      const result = victorySystem.checkVictory(p1, 'science', context);
      expect(result).toBe(false);
    });

    it('should trigger with all requirements met in modern age', () => {
      const p1 = createMockPlayer(0);
      victorySystem.setSpaceRaceProgress(0, {
        launchPadBuilt: true,
        rocketParts: 3,
        exoplanetLaunched: true,
      });

      const context = { players: [p1], age: 'modern' as const, turn: 200 };
      const result = victorySystem.checkVictory(p1, 'science', context);
      expect(result).toBe(true);
    });
  });

  describe('diplomatic victory', () => {
    it('should not trigger in antiquity', () => {
      const p1 = createMockPlayer(0);
      const context = {
        players: [p1],
        age: 'antiquity' as const,
        turn: 50,
        worldCongress: { sessionNumber: 8, votesWon: 5, totalSessions: 8, crisisResolved: 2 },
      };
      const result = victorySystem.checkVictory(p1, 'diplomatic', context);
      expect(result).toBe(false);
    });

    it('should not trigger without enough votes won', () => {
      const p1 = createMockPlayer(0);
      const context = {
        players: [p1],
        age: 'modern' as const,
        turn: 200,
        worldCongress: { sessionNumber: 6, votesWon: 3, totalSessions: 6, crisisResolved: 1 },
      };
      const result = victorySystem.checkVictory(p1, 'diplomatic', context);
      expect(result).toBe(false);
    });

    it('should trigger with 4+ votes won over 6+ sessions in modern', () => {
      const p1 = createMockPlayer(0);
      const context = {
        players: [p1],
        age: 'modern' as const,
        turn: 200,
        worldCongress: { sessionNumber: 6, votesWon: 4, totalSessions: 6, crisisResolved: 2 },
      };
      const result = victorySystem.checkVictory(p1, 'diplomatic', context);
      expect(result).toBe(true);
    });
  });

  describe('checkAllVictories', () => {
    it('should return null when no victory conditions met', () => {
      const p1 = createMockPlayer(0);
      const p2 = createMockPlayer(1, [createMockCity({ isOriginalCapital: true })]);
      const context = { players: [p1, p2], age: 'antiquity' as const, turn: 50 };

      const result = victorySystem.checkAllVictories(p1, context);
      expect(result).toBeNull();
    });

    it('should return victory type when condition is met', () => {
      const p1Capital = createMockCity({ isOriginalCapital: true });
      const capturedCapital = createMockCity({ x: 10, y: 10, isOriginalCapital: true, owner: 1 });
      const p1 = createMockPlayer(0, [p1Capital, capturedCapital]);
      const p2 = createMockPlayer(1, []);

      const context = { players: [p1, p2], age: 'antiquity' as const, turn: 50 };
      const result = victorySystem.checkAllVictories(p1, context);
      expect(result).toBe('domination');
    });

    it('should mark player as winner', () => {
      const p1Capital = createMockCity({ isOriginalCapital: true });
      const capturedCapital = createMockCity({ x: 10, y: 10, isOriginalCapital: true, owner: 1 });
      const p1 = createMockPlayer(0, [p1Capital, capturedCapital]);
      const p2 = createMockPlayer(1, []);

      const context = { players: [p1, p2], age: 'antiquity' as const, turn: 50 };
      victorySystem.checkAllVictories(p1, context);
      expect(victorySystem.hasWon(0)).toBe(true);
    });
  });

  describe('getVictoryProgress', () => {
    it('should return 0 progress for science with no space race', () => {
      const p1 = createMockPlayer(0);
      expect(victorySystem.getVictoryProgress(p1, 'science')).toBe(0);
    });

    it('should calculate science progress correctly', () => {
      const p1 = createMockPlayer(0);
      victorySystem.setSpaceRaceProgress(0, {
        launchPadBuilt: true,
        rocketParts: 1,
        exoplanetLaunched: false,
      });

      const progress = victorySystem.getVictoryProgress(p1, 'science');
      expect(progress).toBeGreaterThan(0);
    });
  });

  describe('enableVictory / disableVictory', () => {
    it('should disable a victory type', () => {
      victorySystem.disableVictory('religious');
      expect(victorySystem.isVictoryEnabled('religious')).toBe(false);
    });

    it('should re-enable a disabled victory type', () => {
      victorySystem.disableVictory('religious');
      victorySystem.enableVictory('religious');
      expect(victorySystem.isVictoryEnabled('religious')).toBe(true);
    });
  });

  describe('getTieBreakerScore', () => {
    it('should return higher score for player with more cities', () => {
      const p1 = createMockPlayer(0, [createMockCity(), createMockCity({ id: 'c2' })]);
      const p2 = createMockPlayer(1, []);

      expect(victorySystem.getTieBreakerScore(p1)).toBeGreaterThan(
        victorySystem.getTieBreakerScore(p2)
      );
    });

    it('should include era score in tie breaker', () => {
      const p1 = createMockPlayer(0);
      p1.eraScore = 100;
      const p2 = createMockPlayer(1);
      p2.eraScore = 0;

      expect(victorySystem.getTieBreakerScore(p1)).toBeGreaterThan(
        victorySystem.getTieBreakerScore(p2)
      );
    });
  });
});
