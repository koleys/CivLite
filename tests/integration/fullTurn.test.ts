import { describe, it, expect, beforeEach } from 'vitest';
import { useGameStore } from '@/store/gameStore';

describe('Full turn integration', () => {
  beforeEach(() => {
    useGameStore.getState().resetGame();
  });

  it('runs 10 turns without crashing', () => {
    const store = useGameStore;
    store.getState().startGame({
      mapSeed: 42,
      mapSize: 'tiny',
      difficulty: 'beginner',
      aiCount: 1,
    });

    for (let i = 0; i < 10; i++) {
      const s = store.getState();
      if (s.phase !== 'playing') break;
      if (s.aiThinking) continue;
      s.endTurn();
    }

    const state = store.getState();
    expect(state.turn).toBeGreaterThan(1);
    expect(state.players.length).toBeGreaterThanOrEqual(2);

    for (const p of state.players) {
      expect(Number.isNaN(p.gold)).toBe(false);
    }
  });

  it('fog of war is initialized after game start', () => {
    const store = useGameStore;
    store.getState().startGame({
      mapSeed: 42,
      mapSize: 'tiny',
      difficulty: 'standard',
      aiCount: 1,
    });

    const state = store.getState();
    expect(state.visibility).toBeDefined();
    expect(state.visibility[0]).toBeDefined();

    const humanVis = state.visibility[0];
    const visValues = Object.values(humanVis);
    expect(visValues.length).toBeGreaterThan(0);
    expect(visValues.some(v => v === 'visible')).toBe(true);
  });

  it('city founding claims surrounding tiles', () => {
    const store = useGameStore;
    store.getState().startGame({
      mapSeed: 42,
      mapSize: 'tiny',
      difficulty: 'beginner',
      aiCount: 1,
    });

    const state = store.getState();
    const human = state.players.find(p => p.id === 0);
    expect(human).toBeDefined();

    const settler = human!.units.find(u => u.type === 'settler');
    if (!settler) return;

    store.getState().foundCity('Test City', settler.x, settler.y);

    const updated = store.getState();
    const city = updated.players.find(p => p.id === 0)!.cities.find(c => c.name === 'Test City');
    expect(city).toBeDefined();
    expect(city!.tiles.length).toBeGreaterThanOrEqual(1);
  });

  it('research progresses each turn', () => {
    const store = useGameStore;
    store.getState().startGame({
      mapSeed: 42,
      mapSize: 'tiny',
      difficulty: 'beginner',
      aiCount: 1,
    });

    store.getState().setResearch('mining');
    const initialProgress = store.getState().players[0].currentResearch?.progress ?? 0;
    expect(initialProgress).toBe(0);

    // Run 5 turns
    for (let i = 0; i < 5; i++) {
      const s = store.getState();
      if (s.phase !== 'playing' || s.aiThinking) break;
      store.getState().endTurn();
    }

    const final = store.getState();
    const human = final.players[0];
    // Research progress should have increased, or tech completed
    if (human.currentResearch) {
      expect(human.currentResearch.progress).toBeGreaterThan(0);
    } else {
      expect(human.technologies.has('mining')).toBe(true);
    }
  });
});
