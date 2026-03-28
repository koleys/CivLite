# CivLite Architecture

**Last Updated**: Post-Phase-1 audit  
**Status**: Reflects current implementation in `src/`

---

## 1. Project Overview

CivLite is a browser-based 4X strategy game inspired by Civilization VII. It runs entirely client-side as a React single-page application.

| Technology | Version | Role |
|---|---|---|
| **React** | 19.x | UI component library |
| **TypeScript** | 5.x | Type-safe language |
| **Zustand** | 5.x | Global state management |
| **Immer** | 11.x | Structural-sharing immutable updates |
| **Vite** | 8.x | Build tool & dev server |
| **Vitest** | 4.x | Unit testing framework |
| **Playwright** | 1.x | End-to-end browser testing |
| **idb** | 8.x | IndexedDB wrapper for save/load |

---

## 2. Directory Structure

```
src/
├── components/
│   ├── game/
│   │   └── GameCanvas.tsx       # Main canvas renderer + all in-game UI overlays
│   ├── menus/
│   │   └── MainMenu.tsx         # Main menu: 3-panel system (main/newgame/settings)
│   └── ui/
│       ├── Button.tsx           # Reusable button component
│       └── Modal.tsx            # Reusable modal component
├── game/
│   ├── entities/
│   │   └── types.ts             # ALL TypeScript type definitions (single source of truth)
│   └── engine/
│       ├── TileManager.ts       # Tile yield calculation + improvement rules
│       ├── GameEngine.ts        # Turn logic, combat, movement validation (used primarily in unit tests)
│       ├── CityGrowth.ts        # Food accumulation & population growth
│       ├── TechSystem.ts        # Technology tree, Eureka moments, research progress
│       ├── EraSystem.ts         # Three-age progression, legacy objectives, era score
│       ├── VictorySystem.ts     # Six victory condition checks
│       ├── AIRandomStrategy.ts  # AI player turn processing
│       ├── CombatResolver.ts    # Melee/ranged/siege combat resolution
│       ├── FogOfWar.ts          # Per-player visibility tracking
│       ├── BarbarianSystem.ts   # Barbarian camp spawning & scout patrol
│       ├── ReligionSystem.ts    # Faith generation, religion founding & spreading
│       ├── TradeSystem.ts       # Trade routes and route income
│       └── UnitStacking.ts      # Unit stacking rules enforcement
├── store/
│   └── gameStore.ts             # Zustand store: all game state, the live game loop, map generation
├── utils/
│   ├── pathfinding.ts           # A* pathfinding + BFS reachable-tile calculation
│   └── storage.ts               # IndexedDB save/load via idb
├── App.tsx                      # Root component: renders MainMenu or GameCanvas by phase
├── main.tsx                     # Entry point: calls enableMapSet(), mounts React
└── index.css                    # Global CSS custom properties and resets

tests/                           # Vitest unit tests (mirror of src/ structure)
e2e/                             # Playwright end-to-end tests
```

---

## 3. State Management

### Zustand + Immer

The single Zustand store is defined in `src/store/gameStore.ts`. Immer middleware is applied so all `set()` callbacks can mutate draft state directly:

```typescript
export const useGameStore = create<GameStore>()(
  immer((set, get) => ({ ... }))
);
```

Because `GameState` contains `Player.technologies: Set<string>` and `MapData.tiles: Map<string, Tile>`, Immer's `enableMapSet()` plugin **must** be called before any store access. This is done once in `src/main.tsx`:

```typescript
import { enableMapSet } from 'immer';
enableMapSet();
```

Without this call, Immer throws when trying to draft a `Map` or `Set`.

### Full `GameState` shape

| Field | Type | Description |
|---|---|---|
| `phase` | `GamePhase` | `'menu' \| 'setup' \| 'playing' \| 'paused' \| 'ended'` |
| `turn` | `number` | Current turn number (starts at 1) |
| `age` | `GameAge` | `'antiquity' \| 'exploration' \| 'modern'` |
| `currentPlayer` | `PlayerId` | Active player ID (human is always `0`) |
| `settings` | `GameSettings` | Map size, speed, difficulty, seed, AI count, etc. |
| `camera` | `Camera` | `{ x, y, zoom }` — viewport center in tile coords |
| `map` | `MapData \| null` | All tiles; null before game starts |
| `players` | `Player[]` | All players including barbarian pseudo-player (`id: -1`) |
| `selectedUnit` | `UnitId \| null` | Currently selected unit ID |
| `selectedTile` | `TileCoord \| null` | Currently selected tile coordinate |
| `showTileYields` | `boolean` | Debug overlay toggle (T key) |
| `nextId` | `number` | Auto-incrementing ID counter for cities |

### `window.__civlite_store__` pattern

For Playwright e2e tests, the store is exposed on `window`:

- In `gameStore.ts`: exposed only when `import.meta.env.DEV` is true
- In `GameCanvas.tsx`: also set unconditionally in a `useEffect`

Tests access it as:
```javascript
const state = window.__civlite_store__.getState();
const human = state.players.find(p => !p.isAI);
```

### Selector pattern

Selectors are exported functions that operate on `GameStore` (the full store type including actions). They enable component subscriptions to narrow slices of state:

```typescript
export const selectMap            = (state: GameStore) => state.map;
export const selectCamera         = (state: GameStore) => state.camera;
export const selectSelectedUnit   = (state: GameStore) => { /* derives full Unit */ };
export const selectCurrentPlayer  = (state: GameStore) => state.players.find(...);
export const selectSeed           = (state: GameStore) => state.settings.mapSeed;
export const selectTileAt         = (state: GameStore, x, y) => state.map?.tiles.get(...);
```

---

## 4. Game Data Model

### `MapData` / `Tile`

```typescript
interface MapData {
  width: number;   // tile columns
  height: number;  // tile rows
  tiles: Map<string, Tile>;  // key = "${x},${y}"
  seed: number;
}

interface Tile {
  id: string;          // "${x},${y}"
  x: number; y: number;
  terrain: TerrainType;           // ocean | coast | grassland | plains | desert | tundra | snow | mountain
  feature: TerrainFeature | null; // forest | hills | floodplains | oasis | reefs
  resource: ResourceType | null;  // wheat | cattle | sheep | deer | furs | stone | marble | fish | iron | gold | silver
  improvement: ImprovementType;   // farm | mine | quarry | pasture | camp | fishing_boat | fort | road | railroad | none
  owner: number | null;           // player ID of owner
  cityId: string | null;          // city occupying this tile
  units: UnitId[];                // IDs of units present
}
```

Tile yields (food / production / gold / science / culture / faith) are derived at runtime from terrain + feature + resource + improvement tables defined in both `TileManager.ts` and `CityGrowth.ts`.

### `Player`

```typescript
interface Player {
  id: PlayerId;           // 0 = human, 1+ = AI, -1 = barbarians
  name: string;
  isAI: boolean;
  isHuman: boolean;
  gold: number;
  cities: City[];
  units: Unit[];
  technologies: Set<string>;  // tech IDs researched
  currentResearch: CurrentResearch | null;
  score: number;
  eraScore: number;
}
```

### `Unit`

```typescript
interface Unit {
  id: string;
  type: UnitType;       // warrior | settler | scout | archer | ... (30+ types)
  owner: number;        // player ID
  x: number; y: number; // tile position
  health: number; maxHealth: number;
  movement: number; maxMovement: number;
  strength: number; strengthBase: number;
  hasActed: boolean;
  promotions?: UnitPromotions;
  fortificationTurns?: number;
}
```

`hasActed` is reset to `false` at the start of each turn. A unit is exhausted (grayed out) when `hasActed === true`.

### `City`

```typescript
interface City {
  id: string; name: string;
  owner: number;
  x: number; y: number;
  population: number;
  tiles: TileCoord[];         // worked tile list
  buildings: string[];
  currentProduction: CurrentProduction | null;
  buildQueue: CurrentProduction[];
  foodStockpile: number;
  foodForGrowth: number;      // threshold for next population growth
  amenities: number; amenitiesRequired: number;
  housing: number; housingUsed: number;
  specialistSlots: SpecialistSlots;
  isOriginalCapital: boolean;
  // … razed, liberated, garrison fields
}
```

### `Camera`

```typescript
interface Camera {
  x: number;   // camera center in tile coordinates (bounds-clamped: [0, map.width-1])
  y: number;   // camera center in tile coordinates (bounds-clamped: [0, map.height-1])
  zoom: number; // render scale (clamped: [0.5, 2.0])
}
```

Camera bounds clamping is applied in both `setCamera()` and `panCamera()` actions whenever `state.map` is available.

### `GameSettings`

```typescript
interface GameSettings {
  mapSize: MapSize;    // tiny | duel | small | standard | large | huge
  gameSpeed: GameSpeed; // online | standard | marathon
  difficulty: Difficulty; // beginner | easy | standard | deity
  mapSeed: number;
  mapType?: 'continents' | 'islands' | 'pangaea' | 'shuffle' | 'earthlike';
  aiCount?: number;
  cityStateCount?: number;
  victoriesEnabled?: VictorySettings;
  barbarians?: boolean;
  resources?: 'sparse' | 'standard' | 'abundant';
  fogOfWar?: boolean;
  quickCombat?: boolean;
}
```

---

## 5. Map Generation

### `generateMap(settings)` flow

1. Look up tile dimensions from `MAP_SIZES`:

   | Key | Width × Height |
   |---|---|
   | `tiny` | 40 × 25 |
   | `duel` | 40 × 30 |
   | `small` | 60 × 38 |
   | `standard` | 80 × 50 |
   | `large` | 100 × 62 |
   | `huge` | 128 × 80 |

2. Build two Perlin permutation tables from `seed` and `seed ^ 0xDEADBEEF` using a seeded Fisher-Yates shuffle.

3. For every tile `(x, y)`: call `generateTerrain(x, y, ...)` which uses **multi-octave fBm (fractional Brownian motion) Perlin noise** over two noise channels — one for elevation, one for moisture. A latitude bias adds polar snow/tundra and equatorial dryness.

4. Run `placeFeatures(tiles, seed)` — uses `seededRandom(seed + 77777)` (LCG) to probabilistically place forest, hills, floodplains, oasis, and reefs.

5. Run `placeResources(tiles, seed)` — uses `seededRandom(seed + 99999)` to distribute terrain-appropriate resources at ~12% density.

6. **Human spawn**: `findNearestLand(tiles, width×0.25, height×0.5, ...)` searches expanding rings from the preferred position until a non-ocean, non-coast, non-mountain tile is found. Spawns a Settler + Warrior at that tile and centers the camera on it.

7. **AI spawn**: Each AI player `i` is placed at `x = width × (0.55 + fraction × 0.35)`, `y = height × fraction` (spread across the right portion of the map), resolved to the nearest land tile. Spawns a Settler + Warrior for each.

### Seed system

- Seeds are stored as unsigned 32-bit integers
- `formatSeed(seed)` → 8-character base-36 uppercase string for display
- `parseSeed(str)` → parses both pure-numeric strings and base-36 codes back to uint32
- The same seed always reproduces the same map layout

---

## 6. Game Loop / Turn System

### Live game loop (`gameStore.ts::endTurn()`)

The **authoritative** game loop lives entirely in `gameStore.ts`. `GameEngine` (see §9) is a separate class used primarily in unit tests.

```
endTurn() [Zustand set() call]
  ├── processTurnForPlayer(humanPlayer, map, settings)
  │     ├── city production (calculateCityYields → progress += production)
  │     ├── city growth     (processCityGrowth)
  │     ├── research        (inline science calc + TECHNOLOGIES cost check)
  │     └── gold income     (calculateCityYields → player.gold += gold)
  │
  ├── for each AI player (id >= 1):
  │     ├── processTurnForPlayer(aiPlayer, map, settings)
  │     ├── new RandomAI(config).processTurn() → AIAction[]
  │     └── applyAIActionsToState(actions, aiPlayer, state)
  │
  ├── refresh all non-barbarian units:
  │     └── unit.hasActed = false; unit.movement = unit.maxMovement
  │
  └── state.turn += 1
```

### `processTurnForPlayer()` detail

- **Production**: `city.currentProduction.progress += yields.totalYields.production`. On completion, advances to next item in `buildQueue` or sets to null. Does **not** instantiate the built unit/building — this is a known limitation.
- **Growth**: delegates to `processCityGrowth(city, map, gameSpeed)`.
- **Research**: science per turn = sum over cities of (1 base + library +2 + university +4 + research_lab +6), then checks against `TECHNOLOGIES[techId].cost × TECH_COST_MULTIPLIERS[gameSpeed]`.
- **Gold**: adds `calculateCityYields().totalYields.gold` to `player.gold` each turn.

### `applyAIActionsToState()` detail

Iterates `AIAction[]` and applies: `move` (updates tile.units + unit position), `build_city` (creates City, removes settler), `research` (sets `player.currentResearch`), `end_turn` (breaks loop).

### `GameEvent` types

All event types are defined on `GameEngine.GameEvent.type`:

```
UNIT_MOVED | UNIT_DIED | CITY_FOUNDED | PRODUCTION_COMPLETED | COMBAT_OCCURRED |
TECH_COMPLETED | VICTORY | TURN_STARTED | TURN_ENDED | PLAYER_TURN_ENDED |
CITY_GREW | AGE_TRANSITION | ERA_SCORE_GAINED | BARBARIAN_SPAWNED |
UNIT_PROMOTED | RELIGION_FOUNDED
```

Events are emitted by `GameEngine` methods (used in unit tests). The live Zustand game loop does not currently emit `GameEvent` objects — it mutates state directly.

---

## 7. Rendering Pipeline

### Canvas 2D rendering (`GameCanvas.tsx`)

All game rendering uses the browser's 2D Canvas API. There is no WebGL path in the current implementation.

**Constants:**
- `TILE_SIZE = 64` px — size of each tile in world space
- `EDGE_ZONE = 60` px — edge-panning activation zone

### Camera transform

Each render frame:

```typescript
ctx.translate(canvas.width / 2, canvas.height / 2);     // move origin to canvas center
ctx.scale(camera.zoom, camera.zoom);                      // apply zoom
ctx.translate(-camera.x * TILE_SIZE, -camera.y * TILE_SIZE); // scroll to camera tile
```

A tile at world position `(tx, ty)` is drawn at canvas position:

```
screenX = canvas.width/2  + (tx - camera.x) * TILE_SIZE * zoom
screenY = canvas.height/2 + (ty - camera.y) * TILE_SIZE * zoom
```

### `screenToWorld` conversion

```typescript
const screenToWorld = (screenX, screenY) => {
  const x = (screenX - canvasSize.width  / 2) / (TILE_SIZE * camera.zoom) + camera.x;
  const y = (screenY - canvasSize.height / 2) / (TILE_SIZE * camera.zoom) + camera.y;
  return { x: Math.floor(x), y: Math.floor(y) };  // ← MUST be Math.floor, not Math.round
};
```

Using `Math.round` instead of `Math.floor` would cause off-by-one tile selection at tile boundaries.

### Draw order (per frame)

1. **Clear** canvas
2. **Save** canvas transform state
3. **Apply** camera transform
4. **Viewport culling** — compute `[minX..maxX] × [minY..maxY]` from camera bounds + 1-tile pad, skip tiles outside
5. **Terrain** — fill rect with `TERRAIN_COLORS[tile.terrain]`
6. **Grid lines** — thin white stroke on each tile
7. **Features** — semi-transparent overlay (`FEATURE_COLORS[tile.feature]`, α=0.4)
8. **Resources** — small yellow circle at tile center
9. **Cities** — red rect with city name and population
10. **Units** — shape per type (triangle for warrior/scout, square for settler, circle for others); blue = human, red = AI; gray overlay when `hasActed`
11. **Movement highlights** — green outlines on reachable tiles for selected unit
12. **Stack badges** — count overlay when multiple units share a tile
13. **Restore** canvas transform
14. **Debug info** — if `showTileYields`, draw turn/zoom/camera overlay (top-left)

---

## 8. UI Components & Interaction Model

### `MainMenu` — 3-panel system

State variable `panel: 'main' | 'newgame' | 'settings'` controls which panel renders.

| Panel | Contents |
|---|---|
| `'main'` | New Game, Quick Start, Continue Game (disabled), Settings |
| `'newgame'` | Map Size select, Difficulty select, Map Seed input + 🎲 roll button, Start Game |
| `'settings'` | Map Size, Difficulty, Game Speed, AI Players; Save & Apply / Cancel |

**Quick Start**: calls `startGame()` with current settings and a random seed.  
**New Game**: parses the seed input via `parseSeed()` (supports both numeric strings and base-36 codes).

### `GameCanvas` — in-game UI overlays

All overlays are absolutely-positioned `div` elements stacked over the `<canvas>`.

| Overlay | Position | Description |
|---|---|---|
| Top bar | top-0 full width | Turn + age, keyboard hints, seed display |
| Yields panel | top-right (below top bar) | Always-visible food/production/gold/science/culture for human |
| Unit panel | bottom-left | Visible only when unit selected; shows type, health, movement; Found City button for settlers |
| Hover tooltip | follows cursor | Terrain name, feature, resource, tile yields, city info, unit info, coordinates |
| Context menu | right-click position | Move Here, Found City, Select Unit, Skip Unit, Cancel |
| City founding overlay | centered modal | Name input dialog; Enter confirms, Escape cancels |
| Minimap | bottom-right (180×135) | Full-map overview with viewport box; click to navigate |

### Interaction model

| Input | Action |
|---|---|
| **Left-click** on tile | Select/cycle units only — does **not** move units |
| **Right-click** on reachable land tile | Move selected unit (if valid) |
| **Right-click** on any other tile | Open context menu |
| Context menu → Move Here | Move selected unit to that tile |
| Context menu → Found City | Open city-naming overlay |
| Context menu → Select Unit | Select first unacted unit on that tile |
| Context menu → Skip Unit | Mark unit as acted (skip it this turn) |
| Context menu → Cancel | Close menu |
| **ArrowKeys** | Pan camera by 2 tiles |
| **Space** | End turn |
| **Escape** | Deselect unit/tile, close context menu |
| **T** | Toggle `showTileYields` debug overlay |
| **+** / **=** | Zoom in 0.1 |
| **-** | Zoom out 0.1 |
| **Mouse wheel** | Zoom (non-passive listener, `preventDefault()`) |
| **Middle-button drag** / **Alt+drag** | Pan camera |
| **Minimap click** | Snap camera to clicked tile |
| **Edge hover (60px zone)** | Auto-pan via RAF loop at 0.15 tiles/frame |

### Edge panning

When `mousemove` detects the cursor within `EDGE_ZONE=60px` of any canvas edge, `edgePanDir` state (`{dx, dy}` each ±1 or 0) is updated. A `useEffect` on `edgePanDir` starts a `requestAnimationFrame` loop calling `panCamera(dx*0.15, dy*0.15)` each frame. The loop is cancelled when `edgePanDir` returns to `{0, 0}`.

---

## 9. Systems Deep-Dive

### `TileManager` (`src/game/engine/TileManager.ts`)

Wraps a `MapData` reference to provide:
- `calculateTileYield(tile, difficultyMultiplier?)` — base terrain + feature + resource + improvement yields
- `getNeighbors(x, y)` — 8 directions (grid, not hex)
- `getAdjacentTiles(x, y)` — 4 cardinal directions
- `canBuildImprovement(tile, improvement)` — terrain/resource rules
- `getMovementCost(tile)` — 1 base, +1 for hills/forest, 0.5 for road, 0.25 for railroad
- `calculateAdjacentBonus(x, y, bonusType)` — mine/quarry/hills adjacency bonuses

Note: `CityGrowth.ts` has a parallel (standalone) implementation of the same yield tables for use in city processing. Both tables are identical.

### `GameEngine` (`src/game/engine/GameEngine.ts`)

A class-based engine that encapsulates turn logic for use in **unit tests**. It is **not** used by the live Zustand game loop. Key methods:

- `processUnitAction(action)` — handles MOVE, SKIP_TURN, FORTIFY, SLEEP
- `endTurn()` — refreshes movement, processes production/growth/research, advances player index
- `getValidMoves(unit)` — returns reachable tiles via `getReachableTiles()` (BFS)
- `canFoundCity(settler)` — checks tile validity + minimum city distance (3 tiles)
- `getTechSystem(playerId)` — returns the `TechSystem` instance for a player

**Combat** (attacker/defender strength): `CombatResolver.ts` handles melee, ranged, and siege combat with terrain bonuses. The `GameEngine` does not currently call `CombatResolver` directly; combat resolution would need to be wired in.

### `CityGrowth` (`src/game/engine/CityGrowth.ts`)

- `calculateCityYields(city, map)` → `YieldCalculation` with `baseYields`, `workedTileYields`, `buildingYields`, `totalYields`
- `processCityGrowth(city, map, gameSpeed)` → mutates city food stockpile/population; returns `CityGrowthResult`
- Growth threshold: `foodForGrowth = floor(6 × speedMultiplier × (1 + population × 0.15))`
- Speed multipliers: online=0.5, standard=1.0, marathon=3.0
- Housing and amenities are recalculated each growth tick

### `TechSystem` (`src/game/engine/TechSystem.ts`)

- `TECHNOLOGIES` record: 20+ techs across 3 eras (antiquity → exploration → modern)
- `TECH_COST_MULTIPLIERS`: online=0.67, standard=1.0, marathon=3.0
- `processTurn()` → adds `getSciencePerTurn()` to research progress, returns `{completed: techId | null}`
- Eureka triggers give 50% cost reduction (`eurekaBonus = 0.5`)
- Science per turn: 1 per city + buildings (library +2, university +4, research_lab +6)

### `EraSystem` (`src/game/engine/EraSystem.ts`)

- Three ages: `antiquity`, `exploration`, `modern` with forced turn transitions via `AGE_TURN_LIMITS`
- Per age: 5 `LEGACY_OBJECTIVES` defined; player picks 3 at start
- `ERA_SCORE_ACTIONS` table with 13 actions and their era score values
- `transitionAge(turn)` advances age and initializes new legacy path
- Carry-over bonus from previous age is tracked

### `VictorySystem` (`src/game/engine/VictorySystem.ts`)

Six victory types: `domination`, `science`, `cultural`, `religious`, `diplomatic`, `age`

| Victory | Condition |
|---|---|
| Domination | Control every other player's `isOriginalCapital` city AND retain your own |
| Science | Modern age + space race complete (launchPad + 3 rocket parts + exoplanetLaunched) |
| Cultural | Tourism value exceeds threshold for all other civs |
| Religious | Player's religion covers >50% of all foreign city population (requires `playerReligionStats`) |
| Diplomatic | ≥4 World Congress votes won AND ≥6 total sessions |
| Age | Currently always returns `false` (stub — not yet implemented) |

### `RandomAI` (`src/game/ai/AIRandomStrategy.ts`)

- Selects an `AIStrategy` from a weighted pool at construction; re-rolls every 20 turns
- `processTurn()` calls `manageCities()`, `manageUnits()`, `manageResearch()`, returns `AIAction[]`
- **Cities**: picks production target based on strategy (military→units, scientific→library/university, etc.)
- **Units**: military units seek nearest enemy or random valid tile; settlers seek city locations ≥3 tiles from existing cities; scouts explore
- **Research**: picks a random unresearched technology with no prerequisites
- `getAllEnemyUnits(playerId)` correctly iterates `allPlayers` filtering non-self and non-barbarian players

---

## 10. Testing Strategy

### Unit tests (Vitest + jsdom)

All tests live in `tests/` and use Vitest 4.x with `@testing-library/react` for component tests.

| Test file | Tests | What is tested |
|---|---|---|
| `Button.test.tsx` | 9 | Button component rendering, variants, callbacks |
| `Modal.test.tsx` | 7 | Modal component open/close, content rendering |
| `pathfinding.test.ts` | 15 | A* pathfinding, BFS reachable tiles, terrain costs |
| `unitStacking.test.ts` | 18 | Stacking rules per unit class |
| `cityGrowth.test.ts` | 29 | Food accumulation, growth thresholds, starvation |
| `FogOfWar.test.ts` | 8 | Visibility computation per difficulty |
| `combat.test.ts` | 38 | Attacker/defender damage, terrain bonuses, nukes |
| `gameEngine.test.ts` | 32 | Turn processing, movement validation, city founding |
| `tech.test.ts` | 42 | Tech tree, prerequisites, Eureka triggers |
| `era.test.ts` | 45 | Age transitions, legacy objectives, era score |
| `victory.test.ts` | 23 | All six victory condition checks |
| **Total** | **266** | |

### End-to-end tests (Playwright — Chromium)

All e2e tests live in `e2e/`. They run against the Vite dev server.

**`e2e/game.spec.ts`** — 28 tests covering:
- Main menu rendering and button states
- Settings panel fields and save/cancel
- New Game panel seed input and controls
- Quick Start → game view renders
- Gameplay: turn counter increments, unit selection, unit panel

**`e2e/features.spec.ts`** — UX feature tests covering:
- Always-visible yields panel (`div.yields-panel`)
- Mouse tooltip on hover (terrain, yields, coordinates)
- Minimap click-to-navigate
- Camera bounds clamping (panCamera never goes below 0)
- Right-click context menu appears / items
- Right-click moves unit when valid target
- Left-click selects only (no movement)
- Context menu closes on Escape

### `window.__civlite_store__` pattern

E2e tests access game state via the exposed Zustand store:

```typescript
const state = await page.evaluate(() =>
  (window as any).__civlite_store__.getState()
);
```

### Canvas interaction pattern

Since Playwright cannot natively dispatch canvas-specific events, tests use:

```typescript
await page.evaluate(({ type, cx, cy }) => {
  const canvas = document.querySelector('canvas');
  const rect = canvas.getBoundingClientRect();
  canvas.dispatchEvent(new MouseEvent(type, {
    bubbles: true, cancelable: true,
    clientX: rect.left + cx,
    clientY: rect.top + cy,
  }));
}, { type: 'click', cx, cy });
```

---

## 11. Known Limitations / Tech Debt

| Issue | Severity | Notes |
|---|---|---|
| Production completion doesn't spawn units/buildings | Medium | `processTurnForPlayer` clears the queue when `progress >= cost` but never instantiates the produced item |
| `GameEngine` class is disconnected from live game loop | Low | The Zustand `endTurn()` uses `processTurnForPlayer()` directly; `GameEngine` is only used in unit tests |
| Research in `processTurnForPlayer` is inlined (not via `TechSystem`) | Low | Duplicates science-per-turn logic; `GameEngine.processResearch()` does use `TechSystem` but isn't called in production |
| `VictorySystem.checkAgeVictory()` always returns `false` | Medium | Stub — age victory not implemented |
| `VictorySystem.checkDominationVictory()` skips players with no original capital | Low | Enemy players who haven't yet founded a city are silently excluded from the domination check |
| Map tiles not serializable via `JSON.stringify` | Medium | `Map<string, Tile>` requires custom `serializeGameState` / `deserializeGameState` helpers in the store; save/load works but is fragile if the format changes |
| No fog of war in UI | Low | `FogOfWar.ts` exists and is tested, but is not wired into `GameCanvas.tsx` rendering |
| No sound | Low | Audio not implemented |
| No multiplayer | Low | Hot-seat planned; online multiplayer far future |
| No tech/civic/religion/trade UI panels | Medium | Planned for Phase 2 |
| `EraSystem.hasAgeVictory` checks all 5 objectives | Low | Should check only the 3 selected; design decision pending |

---

## 12. Build & Dev Commands

```bash
# Install dependencies
npm install

# Start development server (localhost:5173 by default)
npm run dev

# TypeScript compilation + Vite production bundle → dist/
npm run build

# Preview the production bundle locally
npm run preview

# Run ESLint on src/
npm run lint

# Auto-fix ESLint issues
npm run lint:fix

# TypeScript type checking (no emit)
npm run typecheck

# Run all Vitest unit tests
npm run test

# Vitest in watch mode
npm run test:watch

# Vitest with coverage report
npm run test:coverage

# Run Playwright e2e tests (requires running dev server or preview)
npm run test:e2e
```
