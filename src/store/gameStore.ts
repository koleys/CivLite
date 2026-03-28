import { create } from 'zustand';
import { immer } from 'zustand/middleware/immer';
import { saveGame, loadGame as loadFromDB, deleteSave, listSaves } from '@/utils/storage';
import { canStackUnit } from '@/game/engine/UnitStacking';
import { calculateCityYields, processCityGrowth } from '@/game/engine/CityGrowth';
import { TECHNOLOGIES, TECH_COST_MULTIPLIERS } from '@/game/engine/TechSystem';
import { RandomAI } from '@/game/engine/AIRandomStrategy';
import type { AIAction } from '@/game/engine/AIRandomStrategy';
import { OpenRouterAI } from '@/game/ai/OpenRouterAI';
import { getOpenRouterKey } from '@/utils/apiKey';
import { CITY_STATE_TYPES } from '@/game/engine/CityStateSystem';
import type { CityStateType } from '@/game/engine/CityStateSystem';
import { resolveCombat } from '@/game/engine/CombatResolver';
import type { 
  GameState, GameSettings, Camera, Player, City, Unit, 
  TileCoord, MapData, Tile, UnitId, TerrainType, CityStateData
} from '@/game/entities/types';

const MAP_SIZES: Record<string, { width: number; height: number }> = {
  tiny:     { width: 40,  height: 25 },
  duel:     { width: 40,  height: 30 },
  small:    { width: 60,  height: 38 },
  standard: { width: 80,  height: 50 },
  large:    { width: 100, height: 62 },
  huge:     { width: 128, height: 80 },
};

// Hex geometry constants — must match GameCanvas.tsx
const HEX_SIZE_PX = 38;
const HEX_PX_W    = HEX_SIZE_PX * Math.sqrt(3);  // ≈ 65.82, horizontal tile spacing
const HEX_PX_H    = HEX_SIZE_PX * 1.5;           // 57, vertical tile spacing (row-to-row)

/** Clamp camera so the viewport never shows outside the map.
 *  If the map is smaller than the viewport, centre it instead. */
function clampCamera(
  x: number, y: number, zoom: number,
  mapW: number, mapH: number,
  canvasW: number, canvasH: number,
): { x: number; y: number } {
  const halfW = canvasW / (2 * zoom * HEX_PX_W);
  const halfH = canvasH / (2 * zoom * HEX_PX_H);
  const cx = halfW >= mapW / 2 ? mapW / 2 : Math.max(halfW, Math.min(mapW - halfW, x));
  const cy = halfH >= mapH / 2 ? mapH / 2 : Math.max(halfH, Math.min(mapH - halfH, y));
  return { x: cx, y: cy };
}

/** Compute the minimum zoom so the map always fills the canvas with no black border. */
function minZoomFor(mapW: number, mapH: number, canvasW: number, canvasH: number): number {
  return Math.max(canvasW / (mapW * HEX_PX_W), canvasH / (mapH * HEX_PX_H));
}

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
    nextId: 1,
    cityStates: [],
  };
}

interface GameStore extends GameState {
  aiThinking: boolean;
  cheatMode: boolean;
  tutorialActive: boolean;
  tutorialStep: number;
  canvasWidth: number;
  canvasHeight: number;
  updateCanvasSize: (w: number, h: number) => void;
  startGame: (settings: Partial<GameSettings>) => void;
  updateSettings: (settings: Partial<GameSettings>) => void;
  endTurn: () => void;
  selectUnit: (unitId: UnitId | null) => void;
  selectTile: (coord: TileCoord | null) => void;
  moveUnit: (unitId: UnitId, to: TileCoord) => void;
  setCamera: (camera: Partial<Camera>) => void;
  zoomCamera: (delta: number) => void;
  panCamera: (dx: number, dy: number) => void;
  toggleTileYields: () => void;
  skipUnit: (unitId: UnitId) => void;
  foundCity: (name: string, x: number, y: number) => void;
  buildImprovement: (x: number, y: number, improvement: string) => void;
  generateMap: () => void;
  saveGame: (slot: string, name: string) => Promise<void>;
  loadFromSlot: (slot: string) => Promise<boolean>;
  deleteGame: (slot: string) => Promise<void>;
  listSavedGames: () => Promise<{ id: string; name: string; timestamp: number; turn: number }[]>;
  loadGameState: (state: Partial<GameState>) => void;
  resetGame: () => void;
  // Research
  setResearch: (techId: string) => void;
  // Cheat / QA actions
  toggleCheatMode: () => void;
  cheatAddResources: (gold?: number, science?: number, production?: number, culture?: number) => void;
  cheatRevealMap: () => void;
  cheatSpawnUnit: (unitType: string) => void;
  cheatSkipTurns: (count: number) => void;
  // Tutorial actions
  startTutorial: () => void;
  nextTutorialStep: () => void;
  prevTutorialStep: () => void;
  endTutorial: () => void;
}

export const useGameStore = create<GameStore>()(
  immer((set, get) => ({
    phase: 'menu',
    aiThinking: false,
    cheatMode: false,
    tutorialActive: false,
    tutorialStep: 0,
    canvasWidth:  typeof window !== 'undefined' ? window.innerWidth  : 1280,
    canvasHeight: typeof window !== 'undefined' ? window.innerHeight : 720,
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

      const barbarianPlayer: Player = {
        id: -1,
        name: 'Barbarians',
        isAI: true,
        isHuman: false,
        gold: 0,
        cities: [],
        units: [],
        technologies: new Set<string>(),
        currentResearch: null,
        score: 0,
        eraScore: 0,
      };

      set((state) => {
        state.phase = 'playing';
        state.settings = fullSettings;
        state.turn = 1;
        state.age = 'antiquity';
        state.currentPlayer = 0;
        state.players = [humanPlayer, ...aiPlayers, barbarianPlayer];
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

      // Build two permutation tables from the seed for elevation + moisture
      const perm  = buildPerm(seed);
      const permM = buildPerm(seed ^ 0xdeadbeef);

      for (let y = 0; y < size.height; y++) {
        for (let x = 0; x < size.width; x++) {
          const terrain = generateTerrain(x, y, size.width, size.height, perm, permM);
          const id = `${x},${y}`;
          tiles.set(id, {
            id, x, y,
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

      // Post-process: features and resources
      placeFeatures(tiles, seed);
      placeResources(tiles, seed);

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

      // Spawn human player on valid land (quarter-way across, mid-height)
      const preferX = Math.floor(size.width * 0.25);
      const preferY = Math.floor(size.height * 0.5);
      const spawn = findNearestLand(tiles, preferX, preferY, size.width, size.height);

      const settler: Unit = {
        id: 'settler-0',
        type: 'settler',
        owner: 0,
        x: spawn.x,
        y: spawn.y,
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
        x: spawn.x,
        y: spawn.y,
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
          const tile = state.map?.tiles.get(`${spawn.x},${spawn.y}`);
          if (tile) {
            tile.units = [settler.id, warrior.id];
          }
        }

        // Spawn each AI player in a different region of the map
        const aiPlayers = state.players.filter((p) => p.isAI && p.id !== -1);
        aiPlayers.forEach((aiPlayer, i) => {
          // Place AI players spread across the map (right side, spread vertically)
          const fraction = (i + 1) / (aiPlayers.length + 1);
          const aiPreferX = Math.floor(size.width  * (0.55 + fraction * 0.35));
          const aiPreferY = Math.floor(size.height * fraction);
          const aiSpawn = findNearestLand(tiles, aiPreferX, aiPreferY, size.width, size.height);

          const aiSettler: Unit = {
            id: `settler-ai-${aiPlayer.id}`,
            type: 'settler',
            owner: aiPlayer.id,
            x: aiSpawn.x,
            y: aiSpawn.y,
            health: 100, maxHealth: 100,
            movement: 2, maxMovement: 2,
            strength: 0, strengthBase: 0,
            hasActed: false,
          };
          const aiWarrior: Unit = {
            id: `warrior-ai-${aiPlayer.id}`,
            type: 'warrior',
            owner: aiPlayer.id,
            x: aiSpawn.x,
            y: aiSpawn.y,
            health: 100, maxHealth: 100,
            movement: 2, maxMovement: 2,
            strength: 8, strengthBase: 8,
            hasActed: false,
          };

          aiPlayer.units = [aiSettler, aiWarrior];
          const aiTile = state.map?.tiles.get(`${aiSpawn.x},${aiSpawn.y}`);
          if (aiTile) {
            aiTile.units.push(aiSettler.id, aiWarrior.id);
          }
        });

        // Focus camera on human spawn — zoomed to fill viewport, never showing outside map
        const mz = minZoomFor(size.width, size.height, state.canvasWidth, state.canvasHeight);
        const initialZoom = Math.max(mz, 1);
        const initialCam = clampCamera(spawn.x, spawn.y, initialZoom, size.width, size.height, state.canvasWidth, state.canvasHeight);
        state.camera = { x: initialCam.x, y: initialCam.y, zoom: initialZoom };

        // Spawn city states across the map
        const csTypes: CityStateType[] = ['cultural', 'scientific', 'mercantile', 'religious', 'militaristic', 'industrial'];
        const csNamesByType: Record<string, string[]> = {
          cultural:     ['Athens', 'Bologna', 'Vilnius'],
          scientific:   ['Babylon', 'Alexandria', 'Seoul'],
          mercantile:   ['Venice', 'Zanzibar', 'Hunza'],
          religious:    ['Jerusalem', 'Kandy', 'Chinguetti'],
          militaristic: ['Sparta', 'Carthage', 'Kabul'],
          industrial:   ['Manchester', 'Pittsburgh', 'Osaka'],
        };
        const usedCsPos = new Set<string>();
        for (const p of state.players) {
          for (const u of p.units) usedCsPos.add(`${u.x},${u.y}`);
        }
        const newCityStates: CityStateData[] = [];
        for (let i = 0; i < 6; i++) {
          const csType = csTypes[i % csTypes.length];
          for (let attempt = 0; attempt < 300; attempt++) {
            const cx = Math.floor(Math.random() * size.width);
            const cy = Math.floor(Math.random() * size.height);
            const ckey = `${cx},${cy}`;
            const ctile = state.map?.tiles.get(ckey);
            if (!ctile || ctile.terrain === 'ocean' || ctile.terrain === 'mountain' || usedCsPos.has(ckey)) continue;
            usedCsPos.add(ckey);
            const namePool = csNamesByType[csType] ?? ['City State'];
            const csName = namePool[Math.floor(i / csTypes.length) % namePool.length] ?? `${csType} ${i}`;
            const csId = `cs-${i}`;
            newCityStates.push({
              id: csId,
              name: csName,
              type: csType,
              x: cx, y: cy,
              bonus: CITY_STATE_TYPES[csType]?.bonus ?? '',
              suzerain: null,
              envoys: {},
            });
            if (ctile) ctile.cityId = csId;
            break;
          }
        }
        state.cityStates = newCityStates;
      });
    },

    endTurn: () => {
      // Guard: ignore if AI is still thinking or not in game
      if (get().aiThinking || get().phase !== 'playing') return;

      const apiKey = getOpenRouterKey();

      // ── Synchronous path (no OpenRouter key) ─────────────────────────────
      // Keeps original behavior: single Immer draft, no async overhead.
      if (!apiKey) {
        set((state) => {
          if (!state.map) return;
          const humanPlayer = state.players.find(p => !p.isAI && p.id === state.currentPlayer);
          if (humanPlayer) {
            processTurnForPlayer(humanPlayer as Player, state.map as MapData, state.settings);
          }
          for (const aiPlayer of state.players) {
            if (!aiPlayer.isAI || aiPlayer.id === -1) continue;
            processTurnForPlayer(aiPlayer as Player, state.map as MapData, state.settings);
            const ai = new RandomAI({
              player: aiPlayer as Player,
              allPlayers: state.players as Player[],
              map: state.map as MapData,
              difficulty: state.settings.difficulty,
              age: state.age,
              gameSpeed: state.settings.gameSpeed,
              turn: state.turn,
            });
            const actions = ai.processTurn();
            applyAIActionsToState(actions, aiPlayer as unknown as Player, state as unknown as GameState & { nextId: number });
          }
          for (const player of state.players) {
            if (player.id === -1) continue;
            for (const unit of player.units) {
              unit.hasActed = false;
              unit.movement = unit.maxMovement;
            }
          }
          state.turn += 1;
        });
        return;
      }

      // ── Async path (OpenRouter key present) ──────────────────────────────
      // Process human player synchronously, then AI turns with OpenRouter.
      set((state) => {
        if (!state.map) return;
        const humanPlayer = state.players.find(p => !p.isAI && p.id === state.currentPlayer);
        if (humanPlayer) {
          processTurnForPlayer(humanPlayer as Player, state.map as MapData, state.settings);
        }
        state.aiThinking = true;
      });

      void (async () => {
        const s0 = get();

        for (const aiPlayer of (s0.players as Player[]).filter(p => p.isAI && p.id !== -1)) {
          let actions: AIAction[];
          try {
            actions = await OpenRouterAI.processTurn(
              aiPlayer,
              s0 as unknown as GameState,
              apiKey,
            );
          } catch {
            // OpenRouter failed — fall back with mutable draft inside set
            set((draft) => {
              const p = draft.players.find(pp => pp.id === aiPlayer.id)!;
              processTurnForPlayer(p as Player, draft.map as MapData, draft.settings);
              const ai = new RandomAI({
                player: p as Player,
                allPlayers: draft.players as Player[],
                map: draft.map as MapData,
                difficulty: draft.settings.difficulty,
                age: draft.age,
                gameSpeed: draft.settings.gameSpeed,
                turn: draft.turn,
              });
              const fallbackActions = ai.processTurn();
              applyAIActionsToState(fallbackActions, p as unknown as Player, draft as unknown as GameState & { nextId: number });
            });
            continue;
          }

          set((draft) => {
            const p = draft.players.find(pp => pp.id === aiPlayer.id)!;
            processTurnForPlayer(p as Player, draft.map as MapData, draft.settings);
            applyAIActionsToState(
              actions,
              p as unknown as Player,
              draft as unknown as GameState & { nextId: number },
            );
          });
        }

        // Refresh units + advance turn
        set((state) => {
          for (const player of state.players) {
            if (player.id === -1) continue;
            for (const unit of player.units) {
              unit.hasActed = false;
              unit.movement = unit.maxMovement;
            }
          }
          state.turn      += 1;
          state.aiThinking = false;
        });
      })().catch(err => {
        console.error('[endTurn] async AI processing failed:', err);
        set((state) => { state.aiThinking = false; });
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

        // Auto-combat: if enemy unit occupies destination, fight
        const destTileForCombat = state.map?.tiles.get(`${to.x},${to.y}`);
        if (destTileForCombat) {
          for (const enemyPlayer of state.players) {
            if (enemyPlayer.id === unit.owner) continue;
            const enemyIdx = enemyPlayer.units.findIndex(
              eu => eu.x === to.x && eu.y === to.y && eu.type !== 'settler'
            );
            if (enemyIdx === -1) continue;
            const enemy = enemyPlayer.units[enemyIdx];
            const result = resolveCombat(
              unit as Unit,
              enemy as Unit,
              destTileForCombat as Tile,
              destTileForCombat as Tile,
              { map: state.map as MapData, players: state.players as Player[], difficulty: state.settings.difficulty }
            );
            unit.health = Math.max(0, unit.health - result.attackerDamage);
            enemy.health = Math.max(0, enemy.health - result.defenderDamage);
            if (result.defenderKilled || enemy.health <= 0) {
              destTileForCombat.units = destTileForCombat.units.filter(uid => uid !== enemy.id);
              enemyPlayer.units.splice(enemyIdx, 1);
            }
            const unitOwner = state.players.find(p => p.id === unit.owner);
            if (unitOwner && (result.attackerKilled || unit.health <= 0)) {
              const aidx = unitOwner.units.findIndex(u => u.id === unitId);
              if (aidx !== -1) unitOwner.units.splice(aidx, 1);
              destTileForCombat.units = destTileForCombat.units.filter(uid => uid !== unitId);
              state.selectedUnit = null;
            }
            unit.hasActed = true;
            break;
          }
        }
      });
    },

    updateCanvasSize: (w, h) => {
      set((state) => {
        state.canvasWidth  = w;
        state.canvasHeight = h;
        if (state.map) {
          const mz = minZoomFor(state.map.width, state.map.height, w, h);
          if (state.camera.zoom < mz) state.camera.zoom = mz;
          const c = clampCamera(state.camera.x, state.camera.y, state.camera.zoom, state.map.width, state.map.height, w, h);
          state.camera.x = c.x;
          state.camera.y = c.y;
        }
      });
    },

    setCamera: (camera) => {
      set((state) => {
        Object.assign(state.camera, camera);
        if (state.map) {
          const c = clampCamera(state.camera.x, state.camera.y, state.camera.zoom, state.map.width, state.map.height, state.canvasWidth, state.canvasHeight);
          state.camera.x = c.x;
          state.camera.y = c.y;
        }
      });
    },

    zoomCamera: (delta) => {
      set((state) => {
        const mz = state.map
          ? minZoomFor(state.map.width, state.map.height, state.canvasWidth, state.canvasHeight)
          : 0.5;
        const newZoom = Math.max(mz, Math.min(2, state.camera.zoom + delta));
        state.camera.zoom = newZoom;
        if (state.map) {
          const c = clampCamera(state.camera.x, state.camera.y, newZoom, state.map.width, state.map.height, state.canvasWidth, state.canvasHeight);
          state.camera.x = c.x;
          state.camera.y = c.y;
        }
      });
    },

    panCamera: (dx, dy) => {
      set((state) => {
        if (state.map) {
          const c = clampCamera(state.camera.x + dx, state.camera.y + dy, state.camera.zoom, state.map.width, state.map.height, state.canvasWidth, state.canvasHeight);
          state.camera.x = c.x;
          state.camera.y = c.y;
        } else {
          state.camera.x += dx;
          state.camera.y += dy;
        }
      });
    },

    toggleTileYields: () => {
      set((state) => {
        state.showTileYields = !state.showTileYields;
      });
    },

    skipUnit: (unitId) => {
      set((state) => {
        for (const player of state.players) {
          const unit = player.units.find((u) => u.id === unitId);
          if (unit) {
            unit.movement = 0;
            unit.hasActed = true;
            break;
          }
        }
      });
    },

    foundCity: (name, x, y) => {
      set((state) => {
        const player = state.players.find((p) => p.id === state.currentPlayer);
        if (!player) return;

        const city: City = {
          id: `city-${state.nextId++}`,
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
          // Find the settler specifically at the city location (x, y)
          const settler = player.units.find((u) => u.type === 'settler' && u.x === x && u.y === y);
          if (settler) {
            const settlerTile = state.map?.tiles.get(`${settler.x},${settler.y}`);
            if (settlerTile) {
              settlerTile.units = settlerTile.units.filter((id) => id !== settler.id);
            }
            player.units = player.units.filter((u) => u.id !== settler.id);
          }
          // Clear stale selection
          state.selectedUnit = null;
          state.selectedTile = null;
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
      const saveData = serializeGameState({
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
        nextId: state.nextId,
      });
      await saveGame(slot, name, saveData, {
        turn: state.turn,
        age: state.age,
        settings: state.settings,
      });
    },

    loadFromSlot: async (slot) => {
      const saveData = await loadFromDB(slot);
      if (!saveData) return false;
      const deserialized = deserializeGameState(saveData.state as Record<string, unknown>);
      set(() => ({
        ...deserialized,
        phase: 'playing' as const,
      }));
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
      set(() => ({
        ...(state as GameState),
        phase: 'playing' as const,
      }));
    },

    resetGame: () => {
      set(() => ({
        phase: 'menu',
        ...createInitialState(),
      }));
    },

    toggleCheatMode: () => {
      set((state) => { state.cheatMode = !state.cheatMode; });
    },

    cheatAddResources: (gold = 500, science = 200, production = 200, culture = 200) => {
      set((state) => {
        const human = state.players.find(p => !p.isAI);
        if (!human) return;
        human.gold += gold;
        if (science > 0 && human.currentResearch) {
          human.currentResearch.progress += science;
        }
        for (const city of human.cities) {
          if (production > 0 && city.currentProduction) {
            city.currentProduction.progress += production;
          }
          city.foodStockpile += culture; // culture used as general boost
        }
      });
    },

    cheatRevealMap: () => {
      // Map is fully visible in current implementation — no-op placeholder
      set(() => {});
    },

    cheatSpawnUnit: (unitType: string) => {
      set((state) => {
        const human = state.players.find(p => !p.isAI);
        if (!human) return;
        const ref = human.cities[0] ?? human.units[0];
        if (!ref) return;
        const newUnit: Unit = {
          id: `unit-cheat-${state.nextId++}`,
          type: unitType as Unit['type'],
          owner: human.id,
          x: ref.x, y: ref.y,
          health: 100, maxHealth: 100,
          movement: 2, maxMovement: 2,
          strength: 25, strengthBase: 25,
          hasActed: false,
        };
        human.units.push(newUnit);
        const tile = state.map?.tiles.get(`${ref.x},${ref.y}`);
        if (tile) tile.units.push(newUnit.id);
      });
    },

    cheatSkipTurns: (count: number) => {
      for (let i = 0; i < count; i++) {
        const s = get();
        if (s.phase === 'playing' && !s.aiThinking) s.endTurn();
      }
    },

    startTutorial: () => {
      get().startGame({ mapSeed: 42, mapSize: 'tiny', difficulty: 'beginner' });
      set((state) => { state.tutorialActive = true; state.tutorialStep = 0; });
    },

    nextTutorialStep: () => {
      set((state) => { state.tutorialStep += 1; });
    },

    prevTutorialStep: () => {
      set((state) => { if (state.tutorialStep > 0) state.tutorialStep -= 1; });
    },

    setResearch: (techId: string) => {
      set((state) => {
        const human = state.players.find(p => p.id === 0);
        if (!human) return;
        // Don't restart if already researching the same tech
        if (human.currentResearch?.techId === techId) return;
        // Only allow if prerequisites met
        const tech = TECHNOLOGIES[techId];
        if (!tech) return;
        const prereqsMet = tech.prerequisites.every(p => human.technologies.has(p));
        if (!prereqsMet) return;
        human.currentResearch = { techId, progress: 0 };
      });
    },

    endTutorial: () => {
      set((state) => { state.tutorialActive = false; state.tutorialStep = 0; });
    },

    updateSettings: (partial) => {
      set((state) => {
        Object.assign(state.settings, partial);
      });
    },
  }))
);

// Expose store on window in development for debugging / e2e tests
if (typeof window !== 'undefined' && import.meta.env.DEV) {
  (window as any).__civlite_store__ = useGameStore;
}

// ─── Serialization helpers ───────────────────────────────────────────────────

function serializeGameState(state: Partial<GameState>): Record<string, unknown> {
  return {
    ...state,
    map: state.map
      ? { ...state.map, tiles: Object.fromEntries(state.map.tiles) }
      : null,
    players: (state.players ?? []).map(p => ({
      ...p,
      technologies: [...p.technologies],
    })),
  };
}

function deserializeGameState(data: Record<string, unknown>): Partial<GameState> {
  type RawPlayer = Omit<Player, 'technologies'> & { technologies: string[] };
  type RawMap = Omit<MapData, 'tiles'> & { tiles: Record<string, Tile> };
  const rawMap = data.map as RawMap | null;
  return {
    ...(data as Partial<GameState>),
    map: rawMap
      ? { ...rawMap, tiles: new Map(Object.entries(rawMap.tiles)) }
      : null,
    players: ((data.players as RawPlayer[]) ?? []).map(p => ({
      ...p,
      technologies: new Set<string>(p.technologies ?? []),
    })),
  };
}

// ─── Turn-processing helpers ─────────────────────────────────────────────────

function processTurnForPlayer(player: Player, map: MapData, settings: GameSettings): void {
  // City production
  for (const city of player.cities) {
    if (!city.currentProduction) continue;
    const yields = calculateCityYields(city, map);
    city.currentProduction.progress += Math.max(1, yields.totalYields.production);
    if (city.currentProduction.progress >= city.currentProduction.cost) {
      city.currentProduction = city.buildQueue.length > 0
        ? city.buildQueue.shift()!
        : null;
    }
  }

  // City growth
  for (const city of player.cities) {
    processCityGrowth(city, map, settings.gameSpeed);
  }

  // Research
  if (player.currentResearch) {
    let sciencePerTurn = 0;
    for (const city of player.cities) {
      sciencePerTurn += 1;
      if (city.buildings.includes('library')) sciencePerTurn += 2;
      if (city.buildings.includes('university')) sciencePerTurn += 4;
      if (city.buildings.includes('research_lab')) sciencePerTurn += 6;
    }
    sciencePerTurn = Math.max(1, sciencePerTurn);
    player.currentResearch.progress += sciencePerTurn;

    const tech = TECHNOLOGIES[player.currentResearch.techId];
    if (tech) {
      const cost = Math.floor(tech.cost * TECH_COST_MULTIPLIERS[settings.gameSpeed]);
      if (player.currentResearch.progress >= cost) {
        player.technologies.add(player.currentResearch.techId);
        player.currentResearch = null;
      }
    }
  }

  // Gold income
  for (const city of player.cities) {
    const yields = calculateCityYields(city, map);
    player.gold += yields.totalYields.gold;
  }
}

function applyAIActionsToState(
  actions: AIAction[],
  player: Player,
  state: GameState & { nextId: number }
): void {
  if (!state.map) return;
  for (const action of actions) {
    if (action.type === 'move' && action.unitId && action.target) {
      const unit = player.units.find(u => u.id === action.unitId);
      if (!unit || unit.hasActed) continue;
      const fromTile = state.map.tiles.get(`${unit.x},${unit.y}`);
      const toTile = state.map.tiles.get(`${action.target.x},${action.target.y}`);
      if (!fromTile || !toTile) continue;
      if (toTile.terrain === 'ocean' || toTile.terrain === 'mountain') continue;
      fromTile.units = fromTile.units.filter(id => id !== unit.id);
      toTile.units.push(unit.id);
      unit.x = action.target.x;
      unit.y = action.target.y;
      unit.hasActed = true;

    } else if (action.type === 'build_city' && action.unitId) {
      const settler = player.units.find(u => u.id === action.unitId && u.type === 'settler');
      if (!settler) continue;
      const cityTile = state.map.tiles.get(`${settler.x},${settler.y}`);
      if (!cityTile || cityTile.cityId) continue;
      if (cityTile.terrain === 'ocean' || cityTile.terrain === 'mountain') continue;

      const cityId = `city-${state.nextId++}`;
      const city: City = {
        id: cityId,
        name: `${player.name} City ${player.cities.length + 1}`,
        owner: player.id,
        x: settler.x,
        y: settler.y,
        population: 1,
        tiles: [{ x: settler.x, y: settler.y }],
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
        isOriginalCapital: player.cities.length === 0,
        garrison: null,
        turnFounded: state.turn,
        turnsOfGarrison: 0,
        liberationStatus: 'none',
        wasFoundedBy: null,
        isBeingRazed: false,
        razeTurnsRemaining: 0,
      };
      player.cities.push(city);
      cityTile.cityId = cityId;
      cityTile.owner = player.id;
      cityTile.units = cityTile.units.filter(id => id !== settler.id);
      player.units = player.units.filter(u => u.id !== settler.id);

    } else if (action.type === 'research' && action.techId && !player.currentResearch) {
      player.currentResearch = { techId: action.techId, progress: 0 };

    } else if (action.type === 'end_turn') {
      break;
    }
  }
}

// ─── Terrain generation ───────────────────────────────────────────────────────

// ── Permutation table for Perlin noise (256 values, doubled for wrap) ────────
const PERM_BASE = [
  151,160,137,91,90,15,131,13,201,95,96,53,194,233,7,225,
  140,36,103,30,69,142,8,99,37,240,21,10,23,190,6,148,
  247,120,234,75,0,26,197,62,94,252,219,203,117,35,11,32,
  57,177,33,88,237,149,56,87,174,20,125,136,171,168,68,175,
  74,165,71,134,139,48,27,166,77,146,158,231,83,111,229,122,
  60,211,133,230,220,105,92,41,55,46,245,40,244,102,143,54,
  65,25,63,161,1,216,80,73,209,76,132,187,208,89,18,169,
  200,196,135,130,116,188,159,86,164,100,109,198,173,186,3,64,
  52,217,226,250,124,123,5,202,38,147,118,126,255,82,85,212,
  207,206,59,227,47,16,58,17,182,189,28,42,223,183,170,213,
  119,248,152,2,44,154,163,70,221,153,101,155,167,43,172,9,
  129,22,39,253,19,98,108,110,79,113,224,232,178,185,112,104,
  218,246,97,228,251,34,242,193,238,210,144,12,191,179,162,241,
  81,51,145,235,249,14,239,107,49,192,214,31,181,199,106,157,
  184,84,204,176,115,121,50,45,127,4,150,254,138,236,205,93,
  222,114,67,29,24,72,243,141,128,195,78,66,215,61,156,180,
];
function buildPerm(seed: number): Uint8Array {
  // Shuffle PERM_BASE using the seed via Fisher-Yates
  const p = [...PERM_BASE];
  let s = (seed ^ (seed >>> 16)) >>> 0;
  for (let i = 255; i > 0; i--) {
    s = Math.imul(s ^ (s >>> 15), 0x1 | s << 1);
    s ^= s + Math.imul(s ^ (s >>> 7), 61 | s);
    const j = (s >>> 0) % (i + 1);
    [p[i], p[j]] = [p[j], p[i]];
  }
  const perm = new Uint8Array(512);
  for (let i = 0; i < 256; i++) perm[i] = perm[i + 256] = p[i];
  return perm;
}

function fade(t: number): number { return t * t * t * (t * (t * 6 - 15) + 10); }
function lerp(a: number, b: number, t: number): number { return a + t * (b - a); }
function grad(hash: number, x: number, y: number): number {
  const h = hash & 3;
  const u = h < 2 ? x : y;
  const v = h < 2 ? y : x;
  return ((h & 1) === 0 ? u : -u) + ((h & 2) === 0 ? v : -v);
}

function perlin2D(perm: Uint8Array, x: number, y: number): number {
  const xi = Math.floor(x) & 255;
  const yi = Math.floor(y) & 255;
  const xf = x - Math.floor(x);
  const yf = y - Math.floor(y);
  const u = fade(xf);
  const v = fade(yf);
  const aa = perm[perm[xi] + yi];
  const ab = perm[perm[xi] + yi + 1];
  const ba = perm[perm[xi + 1] + yi];
  const bb = perm[perm[xi + 1] + yi + 1];
  return lerp(
    lerp(grad(aa, xf, yf), grad(ba, xf - 1, yf), u),
    lerp(grad(ab, xf, yf - 1), grad(bb, xf - 1, yf - 1), u),
    v
  );
}

/** Multi-octave fBm (fractional Brownian motion) Perlin noise, returns [0, 1]. */
function fbm(perm: Uint8Array, permM: Uint8Array, x: number, y: number, octaves = 4): number {
  let value = 0, amplitude = 0.5, frequency = 1, max = 0;
  for (let i = 0; i < octaves; i++) {
    value += perlin2D(i % 2 === 0 ? perm : permM, x * frequency, y * frequency) * amplitude;
    max += amplitude;
    amplitude *= 0.5;
    frequency *= 2;
  }
  return (value / max + 1) / 2; // normalize to [0, 1]
}

function seededRandom(seed: number): () => number {
  let s = seed;
  return () => {
    s = (s * 1103515245 + 12345) & 0x7fffffff;
    return s / 0x7fffffff;
  };
}

/**
 * Generate terrain using multi-octave Perlin noise (fBm).
 * Elevation drives land/sea; moisture drives biome.
 * Latitude bias adds polar snow/tundra and equatorial dryness.
 */
function generateTerrain(
  x: number, y: number,
  _mapWidth: number, mapHeight: number,
  perm: Uint8Array, permM: Uint8Array
): TerrainType {
  const scale = 0.035;
  const elevation = fbm(perm, permM, x * scale, y * scale, 5);
  const moisture  = fbm(permM, perm, x * scale + 100, y * scale + 100, 4);

  // Latitude bias: cooler toward poles, drier near equator
  const latNorm = y / mapHeight;           // 0 = top, 1 = bottom
  const poleBias = Math.pow(Math.abs(latNorm - 0.5) * 2, 2); // 0 at equator, 1 at poles
  const adjustedElev = Math.min(1, elevation + poleBias * 0.2);

  if (adjustedElev < 0.36) return 'ocean';
  if (adjustedElev < 0.42) return 'coast';
  if (adjustedElev > 0.88) return 'mountain';

  // Polar regions
  if (poleBias > 0.75) return adjustedElev > 0.72 ? 'snow' : 'tundra';

  // Moisture-driven biome
  const dryBias = 1 - poleBias; // tropics are drier
  const adjMoisture = moisture - dryBias * 0.1;

  if (adjMoisture < 0.32) return 'desert';
  if (adjMoisture < 0.50) return 'plains';
  if (adjMoisture < 0.72) return 'grassland';
  return 'tundra';
}

/**
 * Find the nearest land tile to a given position for unit spawning.
 * Searches in expanding rings.
 */
function findNearestLand(
  tiles: Map<string, Tile>,
  cx: number, cy: number,
  mapWidth: number, mapHeight: number
): { x: number; y: number } {
  for (let r = 0; r <= 20; r++) {
    for (let dy = -r; dy <= r; dy++) {
      for (let dx = -r; dx <= r; dx++) {
        if (Math.abs(dx) !== r && Math.abs(dy) !== r) continue;
        const nx = Math.min(Math.max(cx + dx, 0), mapWidth - 1);
        const ny = Math.min(Math.max(cy + dy, 0), mapHeight - 1);
        const tile = tiles.get(`${nx},${ny}`);
        if (tile && tile.terrain !== 'ocean' && tile.terrain !== 'coast' && tile.terrain !== 'mountain') {
          return { x: nx, y: ny };
        }
      }
    }
  }
  return { x: cx, y: cy };
}

/** Place terrain features (oasis, floodplains, forest, reefs) and bonus resources. */
function placeFeatures(tiles: Map<string, Tile>, seed: number): void {
  const rng = seededRandom(seed + 77777);

  tiles.forEach((tile) => {
    const r = rng();

    if (tile.terrain === 'desert' && r < 0.04) {
      tile.feature = 'oasis';
      tile.resource = 'wheat'; // oasis gives food
    } else if ((tile.terrain === 'grassland' || tile.terrain === 'plains') && r < 0.25) {
      tile.feature = 'forest';
    } else if (tile.terrain === 'coast' && r < 0.12) {
      tile.feature = 'reefs';
    } else if ((tile.terrain === 'grassland' || tile.terrain === 'plains') && r > 0.85 && r < 0.90) {
      tile.feature = 'floodplains';
    } else if ((tile.terrain === 'plains' || tile.terrain === 'tundra') && r > 0.90) {
      tile.feature = 'hills';
    }
  });
}

/** Place bonus and strategic resources by terrain type. */
function placeResources(tiles: Map<string, Tile>, seed: number): void {
  const rng = seededRandom(seed + 99999);

  const TERRAIN_RESOURCES: Record<string, string[]> = {
    grassland: ['cattle', 'sheep', 'wheat'],
    plains:    ['wheat', 'cattle', 'deer'],
    desert:    ['stone', 'gold'],
    tundra:    ['deer', 'furs'],
    snow:      ['furs'],
    coast:     ['fish'],
    ocean:     ['fish'],
    mountain:  ['iron', 'stone', 'marble'],
  };

  tiles.forEach((tile) => {
    if (tile.resource) return; // already placed (e.g., oasis wheat)
    const choices = TERRAIN_RESOURCES[tile.terrain];
    if (!choices) return;
    const r = rng();
    if (r < 0.12) {
      tile.resource = choices[Math.floor(r / 0.12 * choices.length)] as Tile['resource'];
    }
  });
}

export const selectMap = (state: GameStore) => state.map;
export const selectPlayers = (state: GameStore) => state.players;
export const selectCurrentPlayer = (state: GameStore) => 
  state.players.find((p) => p.id === state.currentPlayer);
export const selectCamera = (state: GameStore) => state.camera;
export const selectSeed = (state: GameStore) => state.settings.mapSeed;
export const selectSelectedUnit = (state: GameStore) => {
  if (!state.selectedUnit) return null;
  return state.players.flatMap((p) => p.units).find((u) => u.id === state.selectedUnit);
};
export const selectTileAt = (state: GameStore, x: number, y: number): Tile | undefined =>
  state.map?.tiles.get(`${x},${y}`);

/** Format a numeric seed as a compact 8-char alphanumeric string for display. */
export function formatSeed(seed: number): string {
  const chars = '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ';
  let s = (seed >>> 0); // ensure unsigned 32-bit
  let result = '';
  for (let i = 0; i < 8; i++) {
    result = chars[s % 36] + result;
    s = Math.floor(s / 36);
  }
  return result;
}

/** Parse a seed string (numeric string or formatted 8-char code) into a number. */
export function parseSeed(input: string): number {
  const trimmed = input.trim().toUpperCase();
  if (/^\d+$/.test(trimmed)) return parseInt(trimmed, 10) >>> 0;
  // Decode base-36 seed code
  const chars = '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ';
  let value = 0;
  for (const ch of trimmed) {
    const idx = chars.indexOf(ch);
    if (idx === -1) break;
    value = value * 36 + idx;
  }
  return (value >>> 0);
}
