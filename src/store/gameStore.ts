import { create } from 'zustand';
import { immer } from 'zustand/middleware/immer';
import { saveGame, loadGame as loadFromDB, deleteSave, listSaves } from '@/utils/storage';
import { canStackUnit } from '@/game/engine/UnitStacking';
import type { 
  GameState, GameSettings, Camera, Player, City, Unit, 
  TileCoord, MapData, Tile, UnitId, TerrainType 
} from '@/game/entities/types';

const MAP_SIZES: Record<string, { width: number; height: number }> = {
  duel: { width: 40, height: 30 },
  small: { width: 60, height: 45 },
  standard: { width: 80, height: 60 },
  large: { width: 100, height: 75 },
  huge: { width: 120, height: 90 },
};

function createInitialState(): Omit<GameState, 'phase'> {
  return {
    turn: 1,
    age: 'antiquity',
    currentPlayer: 0,
    settings: {
      mapSize: 'standard',
      gameSpeed: 'standard',
      difficulty: 'standard',
      mapSeed: Date.now(),
    },
    camera: { x: 0, y: 0, zoom: 1 },
    map: null,
    players: [],
    selectedUnit: null,
    selectedTile: null,
    showTileYields: false,
  };
}

interface GameStore extends GameState {
  startGame: (settings: Partial<GameSettings>) => void;
  endTurn: () => void;
  selectUnit: (unitId: UnitId | null) => void;
  selectTile: (coord: TileCoord | null) => void;
  moveUnit: (unitId: UnitId, to: TileCoord) => void;
  setCamera: (camera: Partial<Camera>) => void;
  zoomCamera: (delta: number) => void;
  panCamera: (dx: number, dy: number) => void;
  toggleTileYields: () => void;
  foundCity: (name: string, x: number, y: number) => void;
  buildImprovement: (x: number, y: number, improvement: string) => void;
  generateMap: () => void;
  saveGame: (slot: string, name: string) => Promise<void>;
  loadFromSlot: (slot: string) => Promise<boolean>;
  deleteGame: (slot: string) => Promise<void>;
  listSavedGames: () => Promise<{ id: string; name: string; timestamp: number; turn: number }[]>;
  loadGameState: (state: Partial<GameState>) => void;
  resetGame: () => void;
}

export const useGameStore = create<GameStore>()(
  immer((set, get) => ({
    phase: 'menu',
    ...createInitialState(),

    startGame: (settings) => {
      const fullSettings: GameSettings = {
        mapSize: settings.mapSize ?? 'standard',
        gameSpeed: settings.gameSpeed ?? 'standard',
        difficulty: settings.difficulty ?? 'standard',
        mapSeed: settings.mapSeed ?? Date.now(),
      };

      const humanPlayer: Player = {
        id: 0,
        name: 'Player',
        isAI: false,
        isHuman: true,
        gold: 100,
        cities: [],
        units: [],
        technologies: new Set<string>(),
        currentResearch: null,
        score: 0,
        eraScore: 0,
      };

      const aiPlayers: Player[] = [1, 2].map((id) => ({
        id,
        name: `AI Player ${id}`,
        isAI: true,
        isHuman: false,
        gold: 100,
        cities: [],
        units: [],
        technologies: new Set<string>(),
        currentResearch: null,
        score: 0,
        eraScore: 0,
      }));

      set((state) => {
        state.phase = 'playing';
        state.settings = fullSettings;
        state.turn = 1;
        state.age = 'antiquity';
        state.currentPlayer = 0;
        state.players = [humanPlayer, ...aiPlayers];
        state.selectedUnit = null;
        state.selectedTile = null;
      });

      get().generateMap();
    },

    generateMap: () => {
      const { settings } = get();
      const size = MAP_SIZES[settings.mapSize];
      const tiles = new Map<string, Tile>();
      const seed = settings.mapSeed;

      for (let y = 0; y < size.height; y++) {
        for (let x = 0; x < size.width; x++) {
          const terrain = generateTerrain(x, y, seed);
          const id = `${x},${y}`;
          tiles.set(id, {
            id,
            x,
            y,
            terrain,
            feature: null,
            resource: null,
            improvement: 'none',
            owner: null,
            cityId: null,
            units: [],
          });
        }
      }

      const mapData: MapData = {
        width: size.width,
        height: size.height,
        tiles,
        seed,
      };

      set((state) => {
        state.map = mapData;
        const centerX = Math.floor(size.width / 2);
        const centerY = Math.floor(size.height / 2);
        state.camera = { x: centerX, y: centerY, zoom: 1 };
      });

      const spawnX = Math.floor(size.width * 0.25);
      const spawnY = Math.floor(size.height * 0.5);

      const settler: Unit = {
        id: 'settler-0',
        type: 'settler',
        owner: 0,
        x: spawnX,
        y: spawnY,
        health: 100,
        maxHealth: 100,
        movement: 2,
        maxMovement: 2,
        strength: 0,
        strengthBase: 0,
        hasActed: false,
      };

      const warrior: Unit = {
        id: 'warrior-0',
        type: 'warrior',
        owner: 0,
        x: spawnX,
        y: spawnY,
        health: 100,
        maxHealth: 100,
        movement: 2,
        maxMovement: 2,
        strength: 8,
        strengthBase: 8,
        hasActed: false,
      };

      set((state) => {
        const player = state.players.find((p) => p.id === 0);
        if (player) {
          player.units = [settler, warrior];
          const tile = state.map?.tiles.get(`${spawnX},${spawnY}`);
          if (tile) {
            tile.units.push(settler.id, warrior.id);
          }
        }
      });
    },

    endTurn: () => {
      set((state) => {
        state.turn += 1;
        state.players.forEach((player) => {
          player.units.forEach((unit) => {
            unit.hasActed = false;
            unit.movement = unit.maxMovement;
          });
        });
      });
    },

    selectUnit: (unitId) => {
      set((state) => {
        state.selectedUnit = unitId;
        if (unitId) {
          const unit = state.players
            .flatMap((p) => p.units)
            .find((u) => u.id === unitId);
          if (unit) {
            state.selectedTile = { x: unit.x, y: unit.y };
          }
        }
      });
    },

    selectTile: (coord) => {
      set((state) => {
        state.selectedTile = coord;
        if (!coord) {
          state.selectedUnit = null;
        }
      });
    },

    moveUnit: (unitId, to) => {
      set((state) => {
        const unit = state.players
          .flatMap((p) => p.units)
          .find((u) => u.id === unitId);
        
        if (!unit || unit.hasActed) return;

        const fromKey = `${unit.x},${unit.y}`;
        const toKey = `${to.x},${to.y}`;

        const fromTile = state.map?.tiles.get(fromKey);
        const toTile = state.map?.tiles.get(toKey);

        if (!fromTile || !toTile) return;

        const stackingCheck = canStackUnit(unit, toTile, state.players);
        if (!stackingCheck.allowed) {
          console.warn(`Cannot move unit: ${stackingCheck.reason}`);
          return;
        }

        fromTile.units = fromTile.units.filter((id) => id !== unitId);
        toTile.units.push(unitId);

        unit.x = to.x;
        unit.y = to.y;
        unit.movement -= 1;
        if (unit.movement <= 0) {
          unit.hasActed = true;
        }

        state.selectedTile = to;
      });
    },

    setCamera: (camera) => {
      set((state) => {
        Object.assign(state.camera, camera);
      });
    },

    zoomCamera: (delta) => {
      set((state) => {
        const newZoom = Math.max(0.5, Math.min(2, state.camera.zoom + delta));
        state.camera.zoom = newZoom;
      });
    },

    panCamera: (dx, dy) => {
      set((state) => {
        state.camera.x += dx;
        state.camera.y += dy;
      });
    },

    toggleTileYields: () => {
      set((state) => {
        state.showTileYields = !state.showTileYields;
      });
    },

    foundCity: (name, x, y) => {
      set((state) => {
        const player = state.players.find((p) => p.id === state.currentPlayer);
        if (!player) return;

        const city: City = {
          id: `city-${Date.now()}`,
          name,
          owner: state.currentPlayer,
          x,
          y,
          population: 1,
          tiles: [{ x, y }],
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
          isOriginalCapital: state.players.find(p => p.id === state.currentPlayer)?.cities.length === 0,
          garrison: null,
          turnFounded: state.turn,
          turnsOfGarrison: 0,
          liberationStatus: 'none',
          wasFoundedBy: null,
          isBeingRazed: false,
          razeTurnsRemaining: 0,
        };

        player.cities.push(city);

        const tile = state.map?.tiles.get(`${x},${y}`);
        if (tile) {
          tile.cityId = city.id;
          tile.owner = state.currentPlayer;
          const settler = player.units.find((u) => u.type === 'settler');
          if (settler) {
            const settlerTile = state.map?.tiles.get(`${settler.x},${settler.y}`);
            if (settlerTile) {
              settlerTile.units = settlerTile.units.filter((id) => id !== settler.id);
            }
            player.units = player.units.filter((u) => u.id !== settler.id);
          }
        }
      });
    },

    buildImprovement: (x, y, improvement) => {
      set((state) => {
        const tile = state.map?.tiles.get(`${x},${y}`);
        if (tile) {
          tile.improvement = improvement as Tile['improvement'];
        }
      });
    },

    saveGame: async (slot, name) => {
      const state = get();
      const saveData = {
        phase: state.phase,
        turn: state.turn,
        age: state.age,
        currentPlayer: state.currentPlayer,
        settings: state.settings,
        camera: state.camera,
        map: state.map,
        players: state.players,
        selectedUnit: state.selectedUnit,
        selectedTile: state.selectedTile,
        showTileYields: state.showTileYields,
      };
      await saveGame(slot, name, saveData, {
        turn: state.turn,
        age: state.age,
        settings: state.settings,
      });
    },

    loadFromSlot: async (slot) => {
      const saveData = await loadFromDB(slot);
      if (!saveData) return false;
      const state = saveData.state as Partial<GameState>;
      set((s) => {
        Object.assign(s, state);
        s.phase = 'playing';
      });
      return true;
    },

    deleteGame: async (slot) => {
      await deleteSave(slot);
    },

    listSavedGames: async () => {
      const saves = await listSaves();
      return saves.map((s) => ({
        id: s.id,
        name: s.name,
        timestamp: s.timestamp,
        turn: s.turn,
      }));
    },

    loadGameState: (state) => {
      set((s) => {
        Object.assign(s, state);
        s.phase = 'playing';
      });
    },

    resetGame: () => {
      set(() => ({
        phase: 'menu',
        ...createInitialState(),
      }));
    },
  }))
);

function seededRandom(seed: number): () => number {
  let s = seed;
  return () => {
    s = (s * 1103515245 + 12345) & 0x7fffffff;
    return s / 0x7fffffff;
  };
}

function noise2D(x: number, y: number, seed: number): number {
  const random = seededRandom(seed + x * 374761393 + y * 668265263);
  return random();
}

function generateTerrain(x: number, y: number, seed: number): TerrainType {
  const elevation = noise2D(x * 0.1, y * 0.1, seed);
  const moisture = noise2D(x * 0.05 + 1000, y * 0.05, seed + 500);

  if (elevation < 0.3) return 'ocean';
  if (elevation < 0.35) return 'coast';
  if (elevation > 0.85) return 'mountain';
  if (elevation > 0.75) return 'snow';
  if (moisture < 0.3) return 'desert';
  if (moisture < 0.5) return 'plains';
  if (moisture < 0.7) return 'grassland';
  return 'tundra';
}

export const selectMap = (state: GameStore) => state.map;
export const selectPlayers = (state: GameStore) => state.players;
export const selectCurrentPlayer = (state: GameStore) => 
  state.players.find((p) => p.id === state.currentPlayer);
export const selectCamera = (state: GameStore) => state.camera;
export const selectSelectedUnit = (state: GameStore) => {
  if (!state.selectedUnit) return null;
  return state.players.flatMap((p) => p.units).find((u) => u.id === state.selectedUnit);
};
export const selectTileAt = (state: GameStore, x: number, y: number): Tile | undefined =>
  state.map?.tiles.get(`${x},${y}`);
