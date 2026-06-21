# CivLite — Exhaustive Implementation Blueprint

> **Purpose**: A sequentially executable blueprint for low-context LLM agents.
> Each module is self-contained: prerequisites, exact data shapes, step-by-step
> pseudo-algorithms, expected outputs, and verification commands.
> **Source of truth for types**: `src/game/entities/types.ts` (see §2.2).

---

## 1. EXECUTIVE FEATURE AUDIT

### 1.1 File & Module Inventory

```
CivLite/
├── index.html
├── package.json
├── tsconfig.json
├── vite.config.ts
├── eslint.config.js
├── playwright.config.ts
├── src/
│   ├── App.tsx
│   ├── main.tsx
│   ├── index.css
│   ├── vite-env.d.ts
│   ├── vitest-env.d.ts
│   ├── assets/AssetManifest.ts
│   ├── components/
│   │   ├── game/
│   │   │   ├── index.ts
│   │   │   ├── GameCanvas.tsx
│   │   │   ├── CityPanel.tsx
│   │   │   ├── UnitPanel.tsx
│   │   │   ├── TechTreePanel.tsx
│   │   │   ├── TopBar.tsx
│   │   │   ├── Minimap.tsx
│   │   │   ├── NotificationPanel.tsx
│   │   │   ├── CheatPanel.tsx
│   │   │   ├── TutorialOverlay.tsx
│   │   │   └── VictoryProgress.tsx
│   │   ├── menus/
│   │   │   ├── index.ts
│   │   │   ├── MainMenu.tsx
│   │   │   ├── GameSetup.tsx
│   │   │   ├── LoadingScreen.tsx
│   │   │   └── Settings.tsx
│   │   └── ui/
│   │       ├── index.ts
│   │       ├── Badge.tsx
│   │       ├── Button.tsx
│   │       ├── Dropdown.tsx
│   │       ├── Modal.tsx
│   │       ├── ProgressBar.tsx
│   │       ├── Slider.tsx
│   │       ├── Tabs.tsx
│   │       └── Tooltip.tsx
│   ├── game/
│   │   ├── ai/OpenRouterAI.ts
│   │   ├── engine/
│   │   │   ├── GameEngine.ts
│   │   │   ├── CombatResolver.ts
│   │   │   ├── TechSystem.ts
│   │   │   ├── CivicSystem.ts
│   │   │   ├── EraSystem.ts
│   │   │   ├── GovernmentSystem.ts
│   │   │   ├── ReligionSystem.ts
│   │   │   ├── TradeSystem.ts
│   │   │   ├── GreatWorksSystem.ts
│   │   │   ├── PromotionSystem.ts
│   │   │   ├── BarbarianSystem.ts
│   │   │   ├── CityStateSystem.ts
│   │   │   ├── CityGrowth.ts
│   │   │   ├── TileManager.ts
│   │   │   ├── UnitStacking.ts
│   │   │   ├── FogOfWar.ts
│   │   │   ├── CrisisSystem.ts
│   │   │   ├── CivTransitionSystem.ts
│   │   │   ├── VictorySystem.ts
│   │   │   ├── CheatSystem.ts
│   │   │   ├── AIRandomStrategy.ts
│   │   │   └── OpenRouterAI.ts   ← DUPLICATE of game/ai/OpenRouterAI.ts
│   │   ├── entities/types.ts
│   │   ├── data/                 ← EMPTY (no JSON data files)
│   │   └── systems/              ← EMPTY (unused per AGENTS.md)
│   ├── network/SocketManager.ts
│   ├── renderer/
│   │   ├── HardwareDetector.ts
│   │   └── WebGLRenderer.ts
│   ├── shaders/                  ← EMPTY (no GLSL)
│   ├── store/gameStore.ts
│   ├── system/
│   │   ├── AudioSystem.ts
│   │   └── PerformanceOptimizer.ts
│   └── utils/
│       ├── pathfinding.ts
│       ├── storage.ts
│       ├── aiModels.ts
│       ├── apiKey.ts
│       └── imageCache.ts
└── tests/
    ├── setup.ts
    ├── components/{Button,Modal}.test.tsx
    └── game/{combat,gameEngine,victory,cityGrowth,tech,FogOfWar,era,pathfinding,unitStacking}.test.ts
```

### 1.2 Per-Module Status Tables

#### A. Game Engine (`src/game/engine/`)

| File (module) | Status | Identified Bugs / Gaps |
|---|---|---|
| `GameEngine.ts` | PARTIAL | `GameAction.type` union declares `ATTACK`, `FOUND_CITY`, `PILLAGE`, `BUILD` but `processUnitAction` switch (line ~80) has NO cases for them. `moveUnit` (line 128) always does `unit.movement -= 1` — ignores terrain/road/railroad costs. No terrain passability check (ocean/mountain walkable). `processEndOfRound` (line 248) only emits `TURN_STARTED` — calls ZERO other systems (no barbarians, no era, no crisis, no religion, no government). Production completion in `endProduction` (line ~210) does NOT create the actual unit/building — just nulls `currentProduction`. |
| `CombatResolver.ts` | PARTIAL | **BUG-1** Charge promotion inverted (lines 194-199): checks `defender.health < 50%` then boosts `effectiveDefenderStrength` by 1.15 if `defender` has charge. Correct behavior: when defender is damaged, check if **attacker** has charge and boost **attacker**. **BUG-2** Nuke (lines 320-330): `city.buildings = []` runs BEFORE `destroyedBuildings.push(...city.buildings)` → destroyed list is always empty. **MISSING** No ZOC penalty, no ranged penalty, no flanking bonus, no embark/amphibious combat. `resolveNuke` ignores `unit` param (`void unit;`). Several promotions (`medic`, `embark`, `ranger`, `swift`, `mortar`, `shrapnel`) declared but never applied in `getCombatStrength`. |
| `TechSystem.ts` | PARTIAL | **CRITICAL** `TECHNOLOGIES` (40+ techs) each have `unlocks: string[]` but NOTHING in the codebase reads/applies unlocks. Researching a tech changes only `player.technologies` Set. `getSciencePerTurn` (line 601) hardcodes `1 + library +2 + university +4 + research_lab +6` — disconnected from `calculateCityYields()`. `checkEurekaTrigger()` (line 652) exists but is NEVER called from anywhere. |
| `CivicSystem.ts` | PARTIAL | All 20+ civics defined; `checkInspirationTrigger()` exists, never called. Culture/turn = `cityCount * 2` (hardcoded). No integration with `GovernmentSystem` (civics should unlock governments/policies). |
| `EraSystem.ts` | COMPLETE* | All `ERA_SCORE_ACTIONS`, `LEGACY_OBJECTIVES`, `AGE_TURN_LIMITS` correct. **NOT INTEGRATED** — `EraSystem` is never instantiated from `gameStore.endTurn()`; `eraScore` on Player never increments; age never transitions during play. |
| `GovernmentSystem.ts` | PARTIAL | All 10 governments + 20+ policy cards defined. **CRITICAL** `getBonusMultiplier()` (line 427) never called from any yield calculation — governments/policies are purely cosmetic. `setGovernment()` (line 496) bypasses gold cost (only `changeGovernment` checks cost). No UI component exists. |
| `ReligionSystem.ts` | PARTIAL | Pantheon (20 faith), religion (8 prophet pts), beliefs (14) defined. **BUG** `foundPantheon` (line 155): `void beliefId;` — chosen belief discarded. `trainMissionary/Apostle` deduct faith but create NO `Unit` object — religious units do not exist on map. `getFaithPerTurn()` never called. No passive religious pressure. No UI. |
| `TradeSystem.ts` | COMPLETE* | Routes, yields, capacity, colonial bonuses all implemented. **NOT INTEGRATED** — never called from game loop; no UI to establish routes. |
| `GreatWorksSystem.ts` | COMPLETE* | Great person thresholds, tourism, national parks, theming all implemented. **NOT INTEGRATED** — never called; great persons never appear; tourism never calculated. |
| `PromotionSystem.ts` | PARTIAL | 18 promotions, XP thresholds `[10,30,60,100,150]`, trees per unit class defined. **MISSING** No UI/logic to let player CHOOSE a promotion on level-up. `updateUnitLevel` just sets level number. Several promotions never applied in `CombatResolver.getCombatStrength`. |
| `BarbarianSystem.ts` | COMPLETE | Camps, scouts, raiders, leaders, difficulty/era scaling all implemented. **NOT INTEGRATED** — `BarbarianSystem` never instantiated from game loop. |
| `CityStateSystem.ts` | COMPLETE | 8 generic types, envoy bonuses, suzerain logic. Uses 8 generic types (cultural/scientific/etc.) instead of SPEC's 18 specific city-states. **NOT INTEGRATED** — envoy investment never callable from UI. |
| `CityGrowth.ts` | PARTIAL | **BUG** `hills: {}` (line 40) — empty yield object → hills give ZERO production. Building yields (lines 148-186) hardcoded for only 7 buildings (granary, library, market, temple, university, bank, broadcast_center); aqueduct, sewer, walls, arena, neighborhood, etc. produce nothing. No specialist yield calc. `calculateHousing` exists but no growth penalty when `housingUsed > housing`. Yield tables duplicated with `TileManager.ts`. |
| `TileManager.ts` | COMPLETE | Duplicate yield tables (see CityGrowth). Movement cost calc correct (hills/forest +1, road 0.5, railroad 0.25) but UNUSED by `GameEngine.moveUnit`. |
| `UnitStacking.ts` | COMPLETE | 3 military / 1 civilian rule correct. |
| `FogOfWar.ts` | PARTIAL | Visibility, sight radii, last-seen tiles, BFS movement all implemented. **BUG** `getValidNeighbors` (line 191) uses 8-directional square offsets `[-1,-1]...[1,1]` — wrong for offset hex coords. **NOT INTEGRATED** — never instantiated; `calculateVisibility()` never called; `GameCanvas` renders all tiles unconditionally. |
| `CrisisSystem.ts` | STUB | 4 crisis types defined. **BUG** Pirate raid (line 120): `c.y % 5 === 0` fake coastal detection. **STUB** `applyVolcanicEffect` (line 110) — loop body is just a comment, no food reduction. `getCrisisPenalties` (line 182) returns empty `() => {}` for all types. **NOT INTEGRATED** — never triggered. |
| `CivTransitionSystem.ts` | COMPLETE | 30 civs, transitions, synergies. Not connected to age transition flow. |
| `VictorySystem.ts` | PARTIAL | Domination, science, cultural, religious, diplomatic checks implemented. **STUB** `checkAgeVictory` (line 172) always `return false`. `setCulturalProgress`, `setSpaceRaceProgress`, `setDiplomaticFavor` exist but NEVER called from game loop → all progress maps stay at 0 → science/cultural/diplomatic victories unreachable. **NOT INTEGRATED** — `checkAllVictories` never called from `endTurn`. |
| `CheatSystem.ts` | COMPLETE | All 9 sliders, persistence, reset. |
| `AIRandomStrategy.ts` | COMPLETE | Weighted strategy, settler building, unit move/attack, city founding, research selection. |
| `OpenRouterAI.ts` (engine) | COMPLETE | **DUPLICATE** of `src/game/ai/OpenRouterAI.ts`. Store uses the `ai/` version. This one has connection-test features but is dead code. |

#### B. AI (`src/game/ai/`)

| File | Status | Bugs/Gaps |
|---|---|---|
| `OpenRouterAI.ts` | COMPLETE | Used by store. Model fallback via `utils/aiModels.ts`. |

#### C. Store (`src/store/`)

| File | Status | Bugs/Gaps |
|---|---|---|
| `gameStore.ts` (1256 lines) | PARTIAL | **BUG** 15+ unsafe `as Player`/`as MapData`/`as unknown as GameState & {nextId}` casts (lines 384, 388, 399, 419, 439, 450, 458, 556…). **BUG** `cheatAddResources` (line 792): `city.foodStockpile += culture` — wrong field. **BUG** `cheatRevealMap` (line 797): no-op ("Map is fully visible"). **BUG** `loadGameState` (line 762): uses raw state, bypasses `deserializeGameState` → `Set`/`Map` not reconstructed → save/load broken for `technologies`/`tiles`. **BUG** `generateMap()` ignores `settings.mapType` (always Perlin), `settings.aiCount` (always 2), `settings.cityStateCount` (always 6). **MISSING** No victory check in `endTurn`. **MISSING** No fog-of-war, era, crisis, religion, government, trade, great-works integration in `endTurn`. **MISSING** `foundCity` (line 662) only adds center tile to `city.tiles` — no 6 surrounding tiles claimed. `processTurnForPlayer` (line 909) production completion (line 915) nulls `currentProduction` but does NOT create the unit/building. Science calc (line 930-936) hardcodes buildings — disconnected from `calculateCityYields()`. |

#### D. Components (`src/components/`)

| File | Status | Bugs/Gaps |
|---|---|---|
| `game/GameCanvas.tsx` | PARTIAL | Core hex/Canvas2D rendering works. **BUG** TopBar (line 828) hardcodes `"Antiquity Age"`. **MISSING** `CityPanel` never mounted — clicking city does nothing. **MISSING** No fog-of-war rendering (all tiles drawn). **MISSING** No production queue UI. `UnitPanel` imported but unused (inline panel used). |
| `game/CityPanel.tsx` | STUB | **STUB** Build tab (lines 143-149): 4 hardcoded buttons, NO `onClick`. **STUB** Stats tab (lines 158-163): hardcoded strings `"+5/turn"`. **STUB** Defense tab (line 191): `"100/100"` hardcoded. No production assignment logic. Not mounted. |
| `game/UnitPanel.tsx` | STUB | **TODO** line 10 "Wire up move action", line 22 "Implement fortify", line 26 "Implement skip". All buttons no-ops. Level hardcoded "1" (line 42). Not rendered by GameCanvas. |
| `game/TechTreePanel.tsx` | PARTIAL | **BUG** line 41: `cost = TECHNOLOGIES[techId].cost` raw — ignores game-speed multiplier + eureka → progress % wrong. No visual dependency edges. Unlocks not displayed. |
| `game/TopBar.tsx` | PARTIAL | Hardcoded age. |
| `game/Minimap.tsx` | COMPLETE | — |
| `game/NotificationPanel.tsx` | COMPLETE | — |
| `game/CheatPanel.tsx` | COMPLETE | — |
| `game/VictoryProgress.tsx` | COMPLETE | — |
| `game/TutorialOverlay.tsx` | PARTIAL | Steps defined, limited. |
| `menus/MainMenu.tsx` | COMPLETE | — |
| `menus/GameSetup.tsx` | PARTIAL | **BUG** `mapType`, `aiCount`, `cityStateCount`, `victoriesEnabled`, `barbarians`, `resources` in UI but `startGame` in store only reads `mapSize`, `gameSpeed`, `difficulty`, `mapSeed`. `aiType`/`cheatMode` local state never passed (lines 62-63). |
| `menus/LoadingScreen.tsx` | COMPLETE | — |
| `menus/Settings.tsx` | COMPLETE | — |
| `ui/*` (9 files) | COMPLETE | Button, Modal, Tooltip, etc. functional. |

#### E. Renderer / Network / System / Utils

| File | Status | Bugs/Gaps |
|---|---|---|
| `renderer/HardwareDetector.ts` | COMPLETE | — |
| `renderer/WebGLRenderer.ts` | STUB | Colored quads only. **BUG** lines 274-289: creates/destroys buffers per frame; pre-allocated `positionBuffer`/`colorBuffer` from `initBuffers()` never used. Never instantiated by `GameCanvas` (uses Canvas2D). |
| `network/SocketManager.ts` | STUB | Full structure, no server, not functional. |
| `system/AudioSystem.ts` | STUB | — |
| `system/PerformanceOptimizer.ts` | STUB | — |
| `utils/pathfinding.ts` | COMPLETE | A* implemented. |
| `utils/storage.ts` | COMPLETE | IndexedDB via `idb`. |
| `utils/aiModels.ts` | COMPLETE | Model priority list. |
| `utils/apiKey.ts` | COMPLETE | OpenRouter key from localStorage. |
| `utils/imageCache.ts` | COMPLETE | — |

#### F. Tests (`tests/`)

| File | Status | Bugs/Gaps |
|---|---|---|
| `game/combat.test.ts` | GOOD | — |
| `game/gameEngine.test.ts` | GOOD | — |
| `game/victory.test.ts` | GOOD | — |
| `game/cityGrowth.test.ts` | GOOD | — |
| `game/tech.test.ts` | GOOD | — |
| `game/FogOfWar.test.ts` | GOOD | — |
| `game/era.test.ts` | GOOD | — |
| `game/pathfinding.test.ts` | GOOD | — |
| `game/unitStacking.test.ts` | GOOD | — |
| `components/Button.test.tsx` | BASIC | — |
| `components/Modal.test.tsx` | BASIC | — |
| **MISSING** | — | `gameStore` (1256 lines) — 0% coverage. No CrisisSystem, GovernmentSystem, ReligionSystem, TradeSystem, GreatWorksSystem, BarbarianSystem, CityStateSystem, PromotionSystem tests. No integration tests. `tests/integration/`, `tests/renderer/`, `tests/game/entities/` empty. |

#### G. Empty/Unused Directories

| Path | Status | Action |
|---|---|---|
| `src/game/data/` | EMPTY | Needs JSON data files (see Phase 6B). |
| `src/game/systems/` | EMPTY | Architecture artifact; unused. Leave empty. |
| `src/shaders/` | EMPTY | Needs GLSL for WebGL High quality (deferred). |

---

## 2. ARCHITECTURAL BLUEPRINT

### 2.1 State Management Architecture

**Source of truth**: Single Zustand store `useGameStore` (`src/store/gameStore.ts`) wrapped with `immer` middleware. State shape is `GameState` (see `types.ts:168`) extended with UI fields (`aiThinking`, `cheatMode`, `tutorialActive`, `canvasWidth/Height`).

**Update model**: All mutations go through `set((draft) => { /* mutate draft directly */ })`. Immer produces immutable snapshots. NO direct state reads for mutations.

**Game loop mechanism** (current — BROKEN):
```
endTurn() (user clicks "End Turn")
  → set(): processTurnForPlayer(humanPlayer)   // sync: production, growth, research, gold
  → for each AI player:
       RandomAI.processTurn() OR OpenRouterAI.processTurn() (async)
       applyAIActionsToState()               // move/build_city actions
  → reset unit.movement/hasActed for all players
  → turn += 1
```

**REQUIRED game loop** (target — implemented in Phase 2):
```
endTurn()
  → processTurnForPlayer(humanPlayer)         // production COMPLETE→spawn, growth, research COMPLETE→applyUnlock, gold
  → for each AI: AI.processTurn() → applyAIActionsToState
  → GAME SYSTEMS PHASE (NEW — see §4 Phase 2):
       1. FogOfWar.calculateVisibility() per player  → update tile visibility
       2. BarbarianSystem.processBarbarians()
       3. ReligionSystem.processFaith() per player
       4. TradeSystem.processRoutes() per player
       5. GreatWorksSystem.processGreatPersons() per player
       6. CrisisSystem.tick() (every N turns)
       7. EraSystem.processEraScore() → check age transition
       8. VictorySystem.checkAllVictories() → if winner: phase='ended'
  → reset unit.movement/hasActed
  → turn += 1
  → currentPlayer = 0 (sequential mode) OR unchanged (simultaneous)
```

**Turn modes** (SPEC §5): `sequential` (default — currentPlayer cycles) and `simultaneous` (all players act then resolve). MVP uses sequential; store already supports `currentPlayer` but `endTurn` advances ALL players at once (effectively simultaneous processing under sequential UI). This is acceptable for MVP.

**Save/load**: `utils/storage.ts` (IndexedDB via `idb`). `serializeGameState` (`gameStore:878`) converts `Map→Object`, `Set→Array`. `deserializeGameState` (`gameStore:891`) reverses. **BUG**: `loadGameState` action (`gameStore:762`) bypasses `deserializeGameState` → MUST be fixed (Phase 1, Task 1.5).

### 2.2 Core Data Models (exact shapes from `types.ts`)

```typescript
// === MAP ===
interface MapData {
  width: number;
  height: number;
  tiles: Map<string, Tile>;   // key = `${x},${y}`
  seed: number;
}

interface Tile {
  id: string;
  x: number; y: number;
  terrain: TerrainType;        // 'ocean'|'coast'|'grassland'|'plains'|'desert'|'tundra'|'snow'|'mountain'
  feature: TerrainFeature | null; // 'forest'|'hills'|'floodplains'|'oasis'|'reefs'
  resource: ResourceType | null; // 11 types
  improvement: ImprovementType;   // 'farm'|'mine'|...|'none'
  owner: number | null;          // PlayerId or null
  cityId: string | null;
  units: UnitId[];                // stacked unit IDs
}

// === PLAYER / CIV ===
interface Player {
  id: PlayerId;                  // number; -1 = barbarians
  name: string;
  isAI: boolean;
  isHuman: boolean;
  gold: number;
  cities: City[];
  units: Unit[];
  technologies: Set<string>;            // researched tech IDs
  currentResearch: CurrentResearch | null; // {techId, progress}
  score: number;
  eraScore: number;
  // MISSING fields needed (Phase 2+):
  // civilization: string;       // civ ID from CivTransitionSystem
  // age: GameAge;               // per-player age (for simultaneous mode)
  // faith: number;
  // government: string | null;
  // activePolicies: string[];
  // envoys: Record<string, number>;  // city-state id → count
}

// === CITY ===
interface City {
  id: string; name: string; owner: PlayerId;
  x: number; y: number;
  population: number;
  tiles: TileCoord[];                  // worked tiles
  buildings: string[];                 // building IDs
  currentProduction: CurrentProduction | null;
  buildQueue: CurrentProduction[];
  foodStockpile: number; foodForGrowth: number;
  amenities: number; amenitiesRequired: number;
  housing: number; housingUsed: number;
  specialistSlots: { scientist: number; merchant: number; artist: number };
  isOriginalCapital: boolean;
  garrison: string | null; turnFounded: number; turnsOfGarrison: number;
  liberationStatus: 'none'|'liberatable'|'liberated';
  wasFoundedBy: number | null;
  isBeingRazed: boolean; razeTurnsRemaining: number;
}

interface CurrentProduction {
  name: string;
  type: 'unit'|'building'|'wonder'|'project';
  cost: number; progress: number;
}

// === UNIT ===
interface Unit {
  id: string; type: UnitType; owner: PlayerId;
  x: number; y: number;
  health: number; maxHealth: number;
  movement: number; maxMovement: number;
  strength: number; strengthBase: number;
  hasActed: boolean;
  promotions?: { level: number; xp: number; promotions: string[] };
  fortificationTurns?: number;
}

// UnitType union: warrior, settler, scout, archer, swordsman, horseman,
//   galley, caravel, caravelle, fighter, bomber, jet_fighter,
//   musketman, samurai, infantry, tank, catapult, cannon, artillery,
//   great_general, great_admiral, nuclear_device,
//   missionary, apostle, crossbowman, charioteer, cavalry,
//   cuirassier, galleass, ship_of_the_line,
//   spearman, pikeman, rifleman, trireme, frigate, battleship, submarine

// === GAME STATE (root) ===
interface GameState {
  phase: 'menu'|'setup'|'playing'|'paused'|'ended';
  turn: number;
  age: GameAge;                          // 'antiquity'|'exploration'|'modern'
  currentPlayer: PlayerId;
  settings: GameSettings;
  camera: { x: number; y: number; zoom: number };
  map: MapData | null;
  players: Player[];
  selectedUnit: UnitId | null;
  selectedTile: TileCoord | null;
  showTileYields: boolean;
  nextId: number;                        // monotonic ID generator
  cityStates: CityStateData[];
}

interface GameSettings {
  mapSize: 'tiny'|'duel'|'small'|'standard'|'large'|'huge';
  gameSpeed: 'online'|'standard'|'marathon';
  difficulty: 'beginner'|'easy'|'standard'|'deity';
  mapSeed: number;
  mapType?: 'continents'|'islands'|'pangaea'|'shuffle'|'earthlike';
  aiCount?: number;
  cityStateCount?: number;
  victoriesEnabled?: VictorySettings;   // {domination,science,culture,religious,diplomatic,age: boolean}
  barbarians?: boolean;
  resources?: 'sparse'|'standard'|'abundant';
  fogOfWar?: boolean;
  quickCombat?: boolean;
}

interface CityStateData {
  id: string; name: string; type: string;
  x: number; y: number; bonus: string;
  suzerain: PlayerId | null;
  envoys: Record<PlayerId, number>;
}
```

### 2.3 Tech Tree Data Model (from `TechSystem.ts`)

```typescript
interface Technology {
  id: string;            // e.g. 'mining', 'bronze_working'
  name: string;
  era: GameAge;          // 'antiquity'|'exploration'|'modern'
  cost: number;
  prerequisites: string[]; // tech IDs
  unlocks: string[];     // e.g. ['bronze_working','masonry','construction']
  eureka: string;        // trigger description
}
const TECHNOLOGIES: Record<string, Technology>;  // 40+ entries
const TECH_COST_MULTIPLIERS: Record<GameSpeed, number>; // {online:0.6, standard:1, marathon:1.5}
```

### 2.4 Component Dependency & Data Flow

```
App.tsx
  └─ switch(phase):
       menu  → MainMenu → (Load button → listSavedGames)
       setup → GameSetup → startGame(settings) → generateMap()
       loading → LoadingScreen
       playing → GameCanvas  ← THE ROOT GAME UI
                 ├─ reads: useGameStore(s => s.map, s.players, s.camera, s.selectedUnit/Tile, s.turn, s.age)
                 ├─ Canvas2D render loop (requestAnimationFrame):
                 │     for each tile in viewport:
                 │       drawHex(terrain color, feature, resource, improvement)
                 │       drawUnits(unit icons)
                 │       drawCities(city marker + name)
                 │       drawSelectionOutline(selectedTile/Unit)
                 │     drawTopBarOverlay(turn, gold, science, age)
                 └─ Children panels:
                     ├─ TopBar           ← reads turn, gold, science, age
                     ├─ Minimap          ← reads map, camera
                     ├─ TechTreePanel    ← reads players[human].currentResearch, technologies; dispatch setResearch(id)
                     ├─ CityPanel        ← reads selectedTile → find city at (x,y)   [CURRENTLY NOT MOUNTED]
                     ├─ UnitPanel        ← reads selectedUnit  [CURRENTLY NOT MOUNTED]
                     ├─ CheatPanel       ← dispatch cheatAddResources, cheatSpawnUnit
                     ├─ NotificationPanel← reads notifications
                     ├─ VictoryProgress  ← reads victory progress
                     └─ TutorialOverlay  ← reads tutorialStep

  Data flow direction: User input → GameCanvas handlers → useGameStore actions (moveUnit, selectUnit, endTurn, setResearch) → Immer draft mutation → React re-render → Canvas redraw.

  Store → Engine calls (one-way): store actions import pure functions from src/game/engine/* and call them inside set() drafts. Engine NEVER imports store (no circular deps).
```

**REQUIRED new wiring** (Phase 3):
```
GameCanvas.onClick(tile):
  if tile has city owned by human → selectTile → mount CityPanel → CityPanel reads city, dispatch setProduction(item)
  if tile has human unit → selectUnit → mount UnitPanel → UnitPanel dispatch moveUnit/attack/foundCity
```

---

## 3. REFACTORING & BUG-FIX PLAN

Exact corrections for existing files. Each fix is independent and reversible.

### FIX-3.1 — Charge Promotion Inversion (`CombatResolver.ts:194-199`)

**Current (broken)**:
```typescript
const defenderDamaged = defender.health < defender.maxHealth * 0.5;
if (defenderDamaged) {
  const hasChargePromo = defenderPromotions.promotions.includes('charge');
  if (hasChargePromo) {
    effectiveDefenderStrength = Math.floor(effectiveDefenderStrength * 1.15);
  }
}
```

**Replace with**:
```typescript
const defenderDamaged = defender.health < defender.maxHealth * 0.5;
if (defenderDamaged) {
  const attackerPromotions = attacker.promotions ?? { level: 0, xp: 0, promotions: [] };
  const hasChargePromo = attackerPromotions.promotions.includes('charge');
  if (hasChargePromo) {
    effectiveAttackerStrength = Math.floor(effectiveAttackerStrength * 1.15);  // ATTACKER gets bonus
  }
}
```
**Verification**: `tests/game/combat.test.ts` add case: attacker with `promotions:['charge']`, defender at 40% health → attacker strength ≥ base*1.15.

### FIX-3.2 — Nuke Building Clear Order (`CombatResolver.ts:320-330`)

**Current (broken)**:
```typescript
city.buildings = [];
destroyedBuildings.push(...city.buildings);   // always empty
```

**Replace with**:
```typescript
destroyedBuildings.push(...city.buildings);   // copy FIRST
city.buildings = [];                           // then clear
```
**Verification**: unit test — city with `buildings:['walls','library']` after nuke → `destroyedBuildings` length 2, `city.buildings` length 0.

### FIX-3.3 — Hills Yield (`CityGrowth.ts:40`)

**Current (broken)**: `hills: {}`

**Replace with**: `hills: { production: 1 }`

**Verification**: `tests/game/cityGrowth.test.ts` — tile `terrain:'plains', feature:'hills'` → `calculateTileYield()` returns `production >= 1`.

### FIX-3.4 — Movement Terrain Cost (`GameEngine.ts:128` and `gameStore.ts:534`)

**Current (broken)**: `unit.movement -= 1;` everywhere.

**Add a pure helper** in `TileManager.ts` (already has `getMovementCost` — verify signature):
```typescript
export function getMoveCost(fromTile: Tile, toTile: Tile): number {
  let cost = 1;
  if (toTile.feature === 'hills' || toTile.feature === 'forest') cost += 1;
  if (toTile.improvement === 'road') cost = 0.5;
  if (toTile.improvement === 'railroad') cost = 0.25;
  return cost;
}
export function isPassable(tile: Tile, unit: Unit): boolean {
  if (tile.terrain === 'mountain') return false;
  if (tile.terrain === 'ocean' || tile.terrain === 'coast') {
    return unit.type === 'galley' || unit.type === 'caravel' || unit.type === 'caravelle'
        || unit.type === 'trireme' || unit.type === 'frigate' || unit.type === 'battleship'
        || unit.type === 'submarine' || unit.type === 'galleass' || unit.type === 'ship_of_the_line';
  }
  return true;
}
```

**In `gameStore.ts:534`** replace `unit.movement -= 1;` with:
```typescript
const cost = getMoveCost(fromTile, toTile);
if (!isPassable(toTile, unit) || unit.movement < cost) { console.warn('impassable/insufficient'); return; }
unit.movement -= cost;
if (unit.movement <= 0) unit.hasActed = true;
```
**Verification**: manual — move warrior onto hills → movement drops by 2. Move onto ocean → blocked.

### FIX-3.5 — loadGameState Deserialization (`gameStore.ts:762`)

**Current (broken)**: `set(state => { Object.assign(state, incomingRawState); });`

**Replace with**:
```typescript
loadGameState: (incoming) => {
  set((state) => {
    const restored = deserializeGameState(incoming as Record<string, unknown>);
    Object.assign(state, restored);
  });
},
```
**Verification**: `tests/game/gameStore.test.ts` — save a game with `technologies:Set(['mining'])`, load it, assert `players[0].technologies.has('mining') === true` and `map.tiles.get('0,0')` returns a Tile.

### FIX-3.6 — cheatAddResources Field (`gameStore.ts:792`)

**Current (broken)**: `city.foodStockpile += culture;`

**Replace with** (route by parameter name):
```typescript
cheatAddResources: (gold=0, science=0, production=0, culture=0) => {
  set((state) => {
    const p = state.players.find(pp => pp.id === state.currentPlayer); if (!p) return;
    p.gold += gold;
    for (const c of p.cities) {
      c.foodStockpile += production * 0.5;   // or dedicated food param
      if (c.currentProduction) c.currentProduction.progress += production;
    }
    if (p.currentResearch) p.currentResearch.progress += science;
    // culture has no per-city store yet; track on player when CultureSystem integrated
  });
}
```
**Verification**: console — call `cheatAddResources(100,50,80,30)` → gold +100, research progress +50, currentProduction.progress +80.

### FIX-3.7 — TopBar Age Display (`GameCanvas.tsx:828`)

**Current (broken)**: `Turn {turn} – Antiquity Age`

**Replace with**: `Turn {turn} – {age.charAt(0).toUpperCase() + age.slice(1)} Age` (using `const age = useGameStore(s => s.age);` at top of component).

**Verification**: set `state.age='modern'` → TopBar shows "Modern Age".

### FIX-3.8 — GameSetup Settings Passthrough (`GameSetup.tsx` + `gameStore.startGame`)

**GameSetup.tsx** — change `onStart` to pass ALL settings:
```typescript
const handleStart = () => {
  startGame({
    mapSize, gameSpeed, difficulty, mapSeed,
    mapType, aiCount, cityStateCount,
    victoriesEnabled, barbarians, resources, fogOfWar, quickCombat,
    aiType, cheatMode,            // NEW: pass through
  });
};
```

**gameStore.startGame** — store all settings:
```typescript
startGame: (settings) => set((state) => {
  state.settings = { ...state.settings, ...settings };   // merge all
  state.phase = 'loading';
}),
```
**generateMap** — USE the settings:
```typescript
const aiCount = state.settings.aiCount ?? 2;
const csCount = state.settings.cityStateCount ?? 6;
// create exactly aiCount AI players, csCount city states
// switch on state.settings.mapType for generator branch
```
**Verification**: e2e — GameSetup with `aiCount:4` → after generateMap, `state.players.length === 5` (human+4 AI).

### FIX-3.9 — Pirate Raid Coastal Detection (`CrisisSystem.ts:120`)

**Current (broken)**: `player.cities.filter(c => c.y % 5 === 0)`

**Replace with**:
```typescript
const coastalCities = player.cities.filter(c => {
  for (const [dx, dy] of HEX_NEIGHBORS) {
    const nKey = `${c.x+dx},${c.y+dy}`;
    const t = map.tiles.get(nKey);
    if (t && (t.terrain === 'ocean' || t.terrain === 'coast')) return true;
  }
  return false;
});
```
Where `HEX_NEIGHBORS` for offset coords (even-r) is:
```typescript
const HEX_NEIGHBORS_EVEN_R = [[1,0],[0,-1],[-1,-1],[-1,0],[-1,1],[0,1]];
const HEX_NEIGHBORS_ODD_R  = [[1,0],[1,-1],[0,-1],[-1,0],[0,1],[1,1]];
const HEX_NEIGHBORS = (y % 2 === 0) ? HEX_NEIGHBORS_EVEN_R : HEX_NEIGHBORS_ODD_R;
```
**Verification**: place city at `(x, y)` adjacent to ocean tile → `coastalCities` includes it; inland city excluded.

### FIX-3.10 — FogOfWar Hex Neighbors (`FogOfWar.ts:191`)

**Current (broken)**: 8 square offsets.

**Replace with** the `HEX_NEIGHBORS` function above (even-r/odd-r aware). See §4 Phase 2 Task 2.1 for full visibility integration.

### FIX-3.11 — TechTreePanel Cost (`TechTreePanel.tsx:41`)

**Current (broken)**: `const cost = TECHNOLOGIES[techId]?.cost ?? 1;`

**Replace with**:
```typescript
import { TECH_COST_MULTIPLIERS } from '@/game/engine/TechSystem';
const speed = useGameStore(s => s.settings.gameSpeed);
const cost = Math.floor((TECHNOLOGIES[techId]?.cost ?? 1) * TECH_COST_MULTIPLIERS[speed]);
```
**Verification**: gameSpeed `'marathon'`, tech cost 60 → displayed cost 90.

### FIX-3.12 — foundCity Surrounding Tiles (`gameStore.ts:662`)

**Current (broken)**: `tiles: [{ x, y }]`

**Replace with**:
```typescript
const ring: TileCoord[] = [];
const offsets = (y % 2 === 0) ? HEX_NEIGHBORS_EVEN_R : HEX_NEIGHBORS_ODD_R;
for (const [dx, dy] of offsets) {
  const nx = x + dx, ny = y + dy;
  if (nx >= 0 && nx < map.width && ny >= 0 && ny < map.height) {
    const t = map.tiles.get(`${nx},${ny}`);
    if (t && t.terrain !== 'ocean' && t.terrain !== 'mountain') {
      t.owner = state.currentPlayer;
      t.cityId = city.id;
      ring.push({ x: nx, y: ny });
    }
  }
}
tiles: [{ x, y }, ...ring]
```
**Verification**: found city → `city.tiles.length === 7`, surrounding tiles `owner === playerId`.

### FIX-3.13 — Remove Duplicate OpenRouterAI

**Delete** `src/game/engine/OpenRouterAI.ts`. **Grep** for imports of `@/game/engine/OpenRouterAI` and redirect to `@/game/ai/OpenRouterAI`.
```bash
rg "engine/OpenRouterAI" src/ && # fix any hits
```
**Verification**: `npm run typecheck` passes; `npm run build` succeeds.

### FIX-3.14 — WebGL Buffer Reuse (`WebGLRenderer.ts:274-289`) [LOW PRIORITY — defer]

Pre-allocated buffers from `initBuffers()` are unused. Refactor `drawArrays` to bind `positionBuffer`/`colorBuffer` and update with `bufferSubData` instead of create/delete per frame. Defer to Phase 6.

---

## 4. STEP-BY-STEP MODULAR IMPLEMENTATION ROADMAP

Each task is a self-contained **Prompt Checklist** for a low-context LLM. Execute in order. After each task, run the listed verification before proceeding.

> **Convention**: New files go under the path shown. New types go in `src/game/entities/types.ts` (append). New store actions go in `GameStore` interface (`gameStore.ts:74`). All new functions are pure (no side effects) unless they touch the store via `set()`.

### PHASE 1 — Bug Fixes (Prerequisites: NONE)

#### Task 1.1 — Fix Charge Promotion
- **Prerequisites**: none
- **Inputs**: `src/game/engine/CombatResolver.ts`
- **Logic**: Apply FIX-3.1 exactly (§3 above).
- **Outputs**: Modified `CombatResolver.ts`.
- **Verification**: `npm run test -- -- combat.test.ts` passes; add new assertion that attacker-with-charge vs damaged defender yields attacker strength ≥ floor(base*1.15).

#### Task 1.2 — Fix Nuke Building Order
- **Prerequisites**: 1.1
- **Inputs**: `src/game/engine/CombatResolver.ts` lines 320-330
- **Logic**: Apply FIX-3.2.
- **Outputs**: Modified `CombatResolver.ts`.
- **Verification**: unit test — `resolveNuke` on city with `buildings:['walls']` → `destroyedBuildings` contains `'walls'`.

#### Task 1.3 — Fix Hills Yield
- **Prerequisites**: none
- **Inputs**: `src/game/engine/CityGrowth.ts:40`
- **Logic**: Apply FIX-3.3.
- **Outputs**: Modified `CityGrowth.ts`.
- **Verification**: `npm run test -- -- cityGrowth.test.ts` passes; new test: plains+hills tile → production ≥ 1.

#### Task 1.4 — Fix Movement Cost + Passability
- **Prerequisites**: 1.3
- **Inputs**: `src/game/engine/TileManager.ts`, `src/store/gameStore.ts:534`
- **Logic**: Apply FIX-3.4. Add `getMoveCost` + `isPassable` exports in `TileManager.ts`. Replace `unit.movement -= 1` in `moveUnit` action with cost-based deduction. Naval unit list: galley, caravel, caravelle, trireme, frigate, battleship, submarine, galleass, ship_of_the_line.
- **Outputs**: Modified `TileManager.ts`, `gameStore.ts`.
- **Verification**: Manual — move warrior onto hills → movement drops by 2 (not 1). Move onto ocean → blocked (no-op). `npm run typecheck`.

#### Task 1.5 — Fix Save/Load Deserialization
- **Prerequisites**: 1.4
- **Inputs**: `src/store/gameStore.ts:762`
- **Logic**: Apply FIX-3.5.
- **Outputs**: Modified `gameStore.ts`.
- **Verification**: Save a game; load it; assert `players[0].technologies.has(...)` works (Set intact) and `map.tiles.get('0,0')` returns a Tile (Map intact).

#### Task 1.6–1.10 — Remaining Fixes
Apply FIX-3.6 (cheatAddResources), FIX-3.7 (TopBar age), FIX-3.8 (GameSetup passthrough + generateMap using aiCount/csCount/mapType), FIX-3.9 (pirate raid), FIX-3.11 (TechTreePanel cost), FIX-3.12 (foundCity ring). Each: **Verification** = `npm run typecheck` + the specific assertion in §3.

#### Task 1.11 — Remove Duplicate OpenRouterAI
- **Prerequisites**: 1.10
- **Logic**: Apply FIX-3.13.
- **Verification**: `npm run build` succeeds; `rg "engine/OpenRouterAI" src/` returns nothing.

---

### PHASE 2 — Core System Integration (Prerequisites: PHASE 1 complete)

This phase wires standalone systems into the `endTurn` game loop. Each task adds ONE system call. Order matters (later systems depend on earlier ones — e.g., victory check must run after era/religion/crisis).

#### Task 2.1 — Fog of War Integration
- **Prerequisites**: Phase 1
- **Inputs**:
  - `src/game/engine/FogOfWar.ts` (exists)
  - `src/game/entities/types.ts` — ADD fields:
    ```typescript
    interface GameState {
      // ... existing
      visibility: Record<PlayerId, Record<TileId, 'visible'|'explored'|'hidden'>>;
    }
    ```
  - `src/components/game/GameCanvas.tsx`
- **Logic**:
  1. Fix `FogOfWar.getValidNeighbors` (line 191) to use hex offsets (even-r/odd-r). Add helper:
     ```typescript
     function hexNeighbors(x: number, y: number): TileCoord[] {
       const dirs = (y % 2 === 0)
         ? [[1,0],[0,-1],[-1,-1],[-1,0],[-1,1],[0,1]]
         : [[1,0],[1,-1],[0,-1],[-1,0],[0,1],[1,1]];
       return dirs.map(([dx,dy]) => ({x:x+dx, y:y+dy}));
     }
     ```
  2. In `gameStore.generateMap()`, after map created, initialize:
     ```typescript
     state.visibility = {};
     for (const p of state.players) {
       state.visibility[p.id] = {};
       for (const key of state.map.tiles.keys()) {
         state.visibility[p.id][key] = 'hidden';
       }
     }
     ```
  3. Add store action `calculateVisibility: () => set((state) => { ... })`:
     ```typescript
     const fog = new FogOfWarSystem(state.settings.difficulty, state.map);
     for (const p of state.players) {
       if (p.id === -1) continue;
       const sources = [
         ...p.units.map(u => ({x:u.x, y:u.y, type:u.type})),
         ...p.cities.map(c => ({x:c.x, y:c.y, type:'city'})),
       ];
       const vis = fog.calculateVisibility(sources, state.visibility[p.id]);
       state.visibility[p.id] = vis;
     }
     ```
  4. Call `calculateVisibility()` at the END of `endTurn()` (both sync and async paths) and after every `moveUnit`.
  5. In `GameCanvas.tsx` render loop, before drawing each tile:
     ```typescript
     const humanId = useGameStore.getState().currentPlayer; // or human player id
     const v = visibility[humanId]?.[tileKey];
     if (v === 'hidden') { drawFogOverlay(tile); continue; }
     if (v === 'explored') { drawTileWithDarkness(tile, 0.5); continue; }
     // v === 'visible' → draw normally
     ```
- **Outputs**: new `visibility` state field, `calculateVisibility` action, modified `FogOfWar.ts`, `GameCanvas.tsx`, `gameStore.ts`.
- **Verification**:
  1. `npm run test -- -- FogOfWar.test.ts` passes.
  2. New test: `calculateVisibility` with a warrior at `(5,5)` → tiles within 3 (standard difficulty) are `'visible'`, ring beyond is `'hidden'`.
  3. Manual: launch game, only area around starting units visible; rest black.

#### Task 2.2 — Era System Integration
- **Prerequisites**: 2.1
- **Inputs**:
  - `src/game/engine/EraSystem.ts` (exists, complete)
  - `src/game/entities/types.ts` — ADD to Player:
    ```typescript
    interface Player {
      // ... existing
      eraScoreActions: Record<string, number>;  // actionId → count this age
      legacyObjectives: Record<string, number>;  // objectiveId → progress
      ageBonuses: { productionCarryOver: number; scoreCarryOver: number } | null;
    }
    ```
- **Logic**:
  1. In `gameStore.startGame()`, initialize for each player: `eraScoreActions:{}`, `legacyObjectives:{}`, `ageBonuses:null`.
  2. Add store action `awardEraScore: (actionId: string, amount: number) => set((state) => { ... })`:
     ```typescript
     const p = state.players.find(pp => pp.id === state.currentPlayer); if (!p) return;
     const era = new EraSystem(state.settings.gameSpeed, state.age);
     const score = era.getEraScoreForAction(actionId) * amount;
     p.eraScore += score;
     p.eraScoreActions[actionId] = (p.eraScoreActions[actionId] ?? 0) + amount;
     // Also update legacy objective progress if action maps to one
     ```
  3. Define a mapping `ACTION_TO_OBJECTIVE: Record<string, string>` (e.g., `'found_city' → 'antiquity_cities'`).
  4. Fire `awardEraScore` from existing store actions:
     - `foundCity` → `awardEraScore('found_city', 1)`
     - `moveUnit` combat kill → `awardEraScore('kill_unit', 1)` (after `result.defenderKilled`)
     - `setResearch` completion (in `processTurnForPlayer`) → `awardEraScore('research_tech', 1)`
     - `buildImprovement` → `awardEraScore('build_improvement', 1)`
  5. Add `checkAgeTransition` to `endTurn()` after all players processed:
     ```typescript
     const era = new EraSystem(state.settings.gameSpeed, state.age);
     const limit = era.getTurnLimit();
     if (state.turn >= limit) {
       for (const p of state.players) {
         if (p.id === -1) continue;
         const result = era.processAgeTransition(p, p.legacyObjectives);
         p.ageBonuses = result.carryOver;
         if (result.forced && p.eraScore < 2) p.eraScore -= 20; // penalty (floor at 0)
       }
       state.age = era.getNextAge();  // 'antiquity'→'exploration'→'modern'
     }
     ```
- **Outputs**: new Player fields, `awardEraScore` action, `checkAgeTransition` in `endTurn`, modified `processTurnForPlayer`.
- **Verification**:
  1. `npm run test -- -- era.test.ts` passes.
  2. New test: trigger `found_city` 3× → `eraScore` includes 3× founding score; `legacyObjectives['antiquity_cities'] === 3`.
  3. Manual: run game to turn 100 (standard) → age transitions to `'exploration'`.

#### Task 2.3 — Tech Unlock Application (CRITICAL)
- **Prerequisites**: 2.2
- **Inputs**:
  - `src/game/engine/TechSystem.ts` (`TECHNOLOGIES[].unlocks`)
  - Create NEW file `src/game/engine/UnlockManager.ts`
  - `src/store/gameStore.ts` (`processTurnForPlayer` line 942)
- **Logic**:
  1. Create `UnlockManager.ts`:
     ```typescript
     export interface UnlockEffect {
       techId: string;
       unitTypes: UnitType[];        // newly buildable units
       buildings: string[];          // newly buildable buildings
       improvements: ImprovementType[]; // newly buildable improvements
       actions: string[];           // e.g., 'found_religion', 'launch_nuke'
     }
     // Map techId → concrete unlock effects (derive from SPEC §3.3)
     export const TECH_UNLOCK_EFFECTS: Record<string, UnlockEffect> = {
       'mining':       { unitTypes: [], buildings: [], improvements: ['mine','quarry'], actions: [] },
       'bronze_working':{ unitTypes: ['spearman'], buildings: [], improvements: [], actions: [] },
       'masonry':      { unitTypes: [], buildings: ['walls'], improvements: [], actions: [] },
       'construction': { unitTypes: [], buildings: ['granary'], improvements: [], actions: [] },
       'wheel':        { unitTypes: ['charioteer'], buildings: [], improvements: ['road'], actions: [] },
       'irrigation':   { unitTypes: [], buildings: [], improvements: ['farm'], actions: [] },
       'writing':      { unitTypes: [], buildings: ['library'], improvements: [], actions: [] },
       'astrology':    { unitTypes: [], buildings: ['temple','shrine'], improvements: [], actions: ['found_pantheon'] },
       'horseback_riding':{ unitTypes: ['horseman'], buildings: [], improvements: ['pasture'], actions: [] },
       'archery':      { unitTypes: ['archer','crossbowman'], buildings: [], improvements: [], actions: [] },
       'iron_working': { unitTypes: ['swordsman'], buildings: [], improvements: [], actions: [] },
       'engineering':  { unitTypes: [], buildings: ['aqueduct'], improvements: ['fort'], actions: [] },
       'currency':     { unitTypes: [], buildings: ['market'], improvements: [], actions: [] },
       'mathematics':  { unitTypes: ['catapult'], buildings: [], improvements: [], actions: [] },
       'navigation':   { unitTypes: ['caravel','caravelle'], buildings: [], improvements: ['fishing_boat'], actions: [] },
       'shipbuilding': { unitTypes: ['galley','trireme'], buildings: [], improvements: [], actions: [] },
       'apprenticeship':{ unitTypes: [], buildings: ['workshop'], improvements: [], actions: [] },
       'industrialization':{ unitTypes: ['musketman','infantry'], buildings: ['factory','power_plant'], improvements: ['railroad'], actions: [] },
       'ballistics':   { unitTypes: ['cannon','artillery'], buildings: [], improvements: [], actions: [] },
       'steam_power':  { unitTypes: [], buildings: ['bank'], improvements: [], actions: [] },
       'flight':       { unitTypes: ['fighter','bomber'], buildings: ['aerodrome','airport'], improvements: [], actions: [] },
       'rocketry':     { unitTypes: [], buildings: ['spaceport','launch_pad'], improvements: [], actions: ['launch_satellite'] },
       'nuclear_fission':{ unitTypes: ['nuclear_device'], buildings: [], improvements: [], actions: ['launch_nuke'] },
       'computers':   { unitTypes: [], buildings: ['research_lab'], improvements: [], actions: [] },
       'plastics':     { unitTypes: [], buildings: ['broadcast_center'], improvements: [], actions: [] },
       'satellites':   { unitTypes: ['jet_fighter'], buildings: [], improvements: [], actions: ['launch_recon'] },
       'robotics':     { unitTypes: [], buildings: ['launch_pad'], improvements: [], actions: [] },
       'nanotechnology':{ unitTypes: [], buildings: [], improvements: [], actions: ['launch_exoplanet'] },
       // Exploration/Modern techs similar — derive from SPEC
     };
     export function getUnlocks(techId: string): UnlockEffect { return TECH_UNLOCK_EFFECTS[techId] ?? { techId, unitTypes:[], buildings:[], improvements:[], actions:[] }; }
     ```
  2. In `processTurnForPlayer` (`gameStore:942`), when research completes:
     ```typescript
     if (player.currentResearch.progress >= cost) {
       player.technologies.add(player.currentResearch.techId);
       const unlock = getUnlocks(player.currentResearch.techId);
       // Unlocked buildings are now available in production menu (checked at queue time)
       // Unlocked improvements available in buildImprovement action
       // Unlocked unit types available in production menu
       // 'actions' unlocked stored on player:
       (player as any).unlockedActions = [...((player as any).unlockedActions ?? []), ...unlock.actions];
       // Fire era score
       awardEraScoreAction(player, 'research_tech', 1);   // see Task 2.2
       // Fire eureka if applicable
       player.currentResearch = null;
     }
     ```
  3. Add helper `getAvailableProductionItems(player: Player, city: City): CurrentProduction[]` in `UnlockManager.ts`:
     ```typescript
     export function getAvailableProductionItems(player, city): CurrentProduction[] {
       const items: CurrentProduction[] = [];
       for (const techId of player.technologies) {
         const u = TECH_UNLOCK_EFFECTS[techId];
         if (!u) continue;
         for (const ut of u.unitTypes) items.push({ name: ut, type:'unit', cost: UNIT_COSTS[ut] ?? 50, progress: 0 });
         for (const b of u.buildings) if (!city.buildings.includes(b)) items.push({ name: b, type:'building', cost: BUILDING_COSTS[b] ?? 100, progress: 0 });
       }
       return items;
     }
     export const UNIT_COSTS: Record<string, number> = { warrior:30, settler:80, scout:20, archer:50, swordsman:60, horseman:70, spearman:40, catapult:80, cannon:120, artillery:160, musketman:100, infantry:140, tank:240, fighter:280, bomber:340, nuclear_device:500, missionary:80, apostle:120, galley:60, caravel:120, /* ... */ };
     export const BUILDING_COSTS: Record<string, number> = { walls:50, granary:40, library:80, temple:100, market:100, workshop:120, bank:160, university:180, factory:240, power_plant:320, research_lab:400, aqueduct:140, sewer:200, aerodrome:280, airport:360, broadcast_center:300, spaceport:600, launch_pad:800, /* ... */ };
     ```
- **Outputs**: `UnlockManager.ts`, modified `processTurnForPlayer`, `UNIT_COSTS`/`BUILDING_COSTS` tables.
- **Verification**:
  1. New test `tests/game/unlockManager.test.ts`: player with `technologies:Set(['writing'])` → `getAvailableProductionItems` returns item `library`. Player without → not returned.
  2. Manual: research `writing` → next turn, CityPanel production menu (Phase 3) shows `library`.

#### Task 2.4 — Government & Policy Bonus Application
- **Prerequisites**: 2.3
- **Inputs**:
  - `src/game/engine/GovernmentSystem.ts` (`getBonusMultiplier` exists)
  - `src/game/entities/types.ts` — ADD to Player:
    ```typescript
    interface Player {
      // ...
      government: string | null;          // e.g. 'oligarchy'
      activePolicies: string[];           // equipped policy card IDs
      policySlots: { military: number; economic: number; diplomatic: number; wildcard: number };
    }
    ```
- **Logic**:
  1. Initialize in `startGame`: `government:'oligarchy'` (default antiquity), `activePolicies:[]`, `policySlots` from `GOVERNMENTS['oligarchy'].slots`.
  2. In `processTurnForPlayer`, replace hardcoded yield/science/gold/culture with bonus-multiplied versions. Add helper:
     ```typescript
     import { GovernmentSystem } from '@/game/engine/GovernmentSystem';
     function getGovMultiplier(player: Player, bonusType: 'science'|'gold'|'culture'|'faith'|'production'|'combat'): number {
       const gov = new GovernmentSystem(player, state.settings.gameSpeed);
       return gov.getBonusMultiplier(bonusType);   // existing method
     }
     ```
  3. Apply in research: `sciencePerTurn = Math.floor(sciencePerTurn * getGovMultiplier(player,'science'))`. Apply in gold: `player.gold += Math.floor(yields.gold * getGovMultiplier(player,'gold'))`. Apply in city yields (production): multiply `yields.production` by gov multiplier before adding to `currentProduction.progress`.
  4. Add store actions:
     ```typescript
     setGovernment: (govId: string) => set((state) => { /* check gold cost via GovernmentSystem.changeGovernment; deduct; set player.government; recompute policySlots */ });
     equipPolicy: (cardId: string, slot: 'military'|'economic'|'diplomatic'|'wildcard') => set(...);
     unequipPolicy: (cardId: string) => set(...);
     ```
- **Outputs**: new Player fields, `setGovernment`/`equipPolicy`/`unequipPolicy` actions, bonus multiplication in `processTurnForPlayer`.
- **Verification**:
  1. New test: player with `government:'oligarchy'` → `getGovMultiplier('combat') > 1`.
  2. Manual: switch to `aristocracy` → next turn gold income increases by multiplier.

#### Task 2.5 — Religion Integration
- **Prerequisites**: 2.4
- **Inputs**:
  - `src/game/engine/ReligionSystem.ts`
  - `src/game/entities/types.ts` — ADD to Player: `faith: number; pantheon: string | null; religion: { id: string; name: string; beliefs: string[] } | null;`
  - ADD to `UnitType`: already includes `missionary`, `apostle`.
- **Logic**:
  1. In `processTurnForPlayer`, add faith accumulation:
     ```typescript
     import { ReligionSystem } from '@/game/engine/ReligionSystem';
     const rel = new ReligionSystem();
     for (const city of player.cities) {
       const yields = calculateCityYields(city, map);
       player.faith += Math.floor(yields.faith * getGovMultiplier(player,'faith'));   // faith from city yields (need to ADD faith to calculateCityYields)
     }
     ```
  2. **Extend `calculateCityYields`** (`CityGrowth.ts`) to include `faith` from buildings: `temple +2`, `shrine +1`, `cathedral +3`. Add `faith` to the `CityYields` interface return.
  3. Fix `ReligionSystem.foundPantheon` (line 155): remove `void beliefId;`, store `player.pantheon = beliefId`.
  4. Fix `trainMissionary`/`trainApostle` to create actual `Unit` objects:
     ```typescript
     trainMissionary(player, state): Unit {
       if (player.faith < 25) throw new Error('insufficient faith');
       player.faith -= 25;
       const u: Unit = { id:`unit-${state.nextId++}`, type:'missionary', owner:player.id, x:/* capital x */, y:/* capital y */, health:100, maxHealth:100, movement:2, maxMovement:2, strength:0, strengthBase:0, hasActed:false };
       player.units.push(u);
       return u;
     }
     ```
  5. Add store actions: `foundPantheon(beliefId)`, `foundReligion(name, beliefs[])`, `trainMissionary()`, `trainApostle()`, `spreadReligion(unitId)` — validate `unit.type==='missionary'|'apostle'`, deduct movement, call `ReligionSystem.spreadReligion`.
- **Outputs**: new Player fields, `faith` in city yields, fixed `foundPantheon`/`train*`, new store actions.
- **Verification**:
  1. New test: accumulate 20 faith → `foundPantheon('religious_settlements')` → `player.pantheon === 'religious_settlements'`, `player.faith -= 20`.
  2. New test: `trainMissionary` → `player.units` contains a `missionary` Unit; `player.faith -= 25`.
  3. Manual: found pantheon, train missionary, move to enemy city, `spreadReligion` → city majority religion changes.

#### Task 2.6 — Trade Route Integration
- **Prerequisites**: 2.5
- **Inputs**: `src/game/engine/TradeSystem.ts`; Player ADD: `tradeRoutes: TradeRoute[]`.
- **Logic**:
  1. Initialize `player.tradeRoutes = []` in `startGame`.
  2. In `processTurnForPlayer`, call:
     ```typescript
     const trade = new TradeSystem();
     for (const route of player.tradeRoutes) {
       const y = trade.calculateRouteYields(route, state.map, state.players, state.age);
       player.gold += y.gold; /* distribute yields */
       // era score for international routes
       if (route.type === 'international') awardEraScoreAction(player, 'trade_route', 1);
     }
     ```
  3. Add store actions: `establishTradeRoute(fromCityId, toCityId)`, `removeTradeRoute(routeId)`.
- **Outputs**: `tradeRoutes` field, route yields in turn processing, new store actions.
- **Verification**: establish route between 2 cities → next turn gold increases by route yield; route count tracked.

#### Task 2.7 — Great Works & Tourism
- **Prerequisites**: 2.6
- **Inputs**: `src/game/engine/GreatWorksSystem.ts`; Player ADD: `greatWorks: GreatWork[]; greatPersonPoints: Record<string, number>; tourism: number;`
- **Logic**:
  1. In `processTurnForPlayer`:
     ```typescript
     const gw = new GreatWorksSystem();
     gw.processGreatPersons(player, state.turn);  // accumulate points, spawn persons at threshold
     player.tourism = gw.calculateTourism(player);
     ```
  2. Add store actions: `createGreatWork(personId, type, cityId)`, `themeGreatWork(workId, cityId)`, `foundNationalPark(...)`.
- **Outputs**: new Player fields, great-person/tourism processing, store actions.
- **Verification**: accumulate great_general points to threshold → `player.greatWorks` contains a great work; `player.tourism > 0`.

#### Task 2.8 — Crisis System Integration
- **Prerequisites**: 2.7
- **Inputs**: `src/game/engine/CrisisSystem.ts` (fix volcanic stub + pirate per FIX-3.9); Player ADD: `crisisEffects: { type: string; turnsRemaining: number; payload: unknown }[]`.
- **Logic**:
  1. Fix `applyVolcanicEffect`: for each city, set `city.foodStockpile = Math.floor(city.foodStockpile * 0.5)` — OR add a `crisisEffect` to player that halves food yield for 10 turns (cleaner: track on city). Add to City: `activeCrisisEffects: { type: string; turnsRemaining: number; modifier: number }[]`.
  2. In `CityGrowth.calculateCityYields`, multiply food by `(1 - effect.modifier)` for each active volcanic effect.
  3. In `processTurnForPlayer`, decrement `turnsRemaining` on all active effects; remove when 0.
  4. In `endTurn`, every `CRISIS_INTERVAL` (e.g. 30) turns:
     ```typescript
     const crisis = new CrisisSystem();
     const triggered = crisis.maybeTrigger(state.turn, state.players, state.map, state.settings.difficulty);
     for (const c of triggered) applyCrisis(c);   // add effects to cities/players
     ```
- **Outputs**: `activeCrisisEffects` on City, volcanic modifier in yield calc, crisis trigger in `endTurn`.
- **Verification**: force `crisis.maybeTrigger` to return volcanic → cities' food halved for 10 turns, then restored.

#### Task 2.9 — Barbarian Integration
- **Prerequisites**: 2.8
- **Inputs**: `src/game/engine/BarbarianSystem.ts` (complete); Player `-1` reserved for barbarians (already in code).
- **Logic**:
  1. In `generateMap`, if `state.settings.barbarians !== false`, create barbarian player: `{ id:-1, name:'Barbarians', isAI:true, isHuman:false, gold:0, cities:[], units:[], technologies:new Set(), currentResearch:null, score:0, eraScore:0 }`.
  2. Spawn initial camps: `const barb = new BarbarianSystem(state.map, state.settings.difficulty, state.age); barb.spawnInitialCamps(state.players);` — push camps to barbarian player cities (or separate `barbarianCamps` field on GameState).
  3. In `endTurn` (before victory check):
     ```typescript
     if (state.settings.barbarians !== false && state.players.find(p => p.id === -1)) {
       const barb = new BarbarianSystem(state.map, state.settings.difficulty, state.age);
       barb.processBarbarians(barbarianPlayer, state.players, state.turn, state);
     }
     ```
  4. `processBarbarians` spawns units, moves scouts/raiders (move logic can reuse simple nearest-target).
- **Outputs**: barbarian player in `players`, camps, `processBarbarians` in `endTurn`.
- **Verification**: after 10 turns, barbarian camps exist on map; barbarian units visible (if fog cleared around them); kill reward applied to killer's gold.

#### Task 2.10 — Victory Checking
- **Prerequisites**: 2.9
- **Inputs**: `src/game/engine/VictorySystem.ts` (fix `checkAgeVictory`); `gameStore.endTurn`.
- **Logic**:
  1. Implement `checkAgeVictory`:
     ```typescript
     private checkAgeVictory(player, context): boolean {
       const era = new EraSystem(context.settings.gameSpeed, context.age);
       return player.eraScore >= era.getAgeVictoryThreshold();   // e.g. 50 for standard
     }
     ```
  2. In `endTurn`, after all processing, before `turn += 1`:
     ```typescript
     const victory = new VictorySystem(state.settings.victoriesEnabled ?? { domination:true, science:true, culture:true, religious:true, diplomatic:true, age:true });
     const winner = victory.checkAllVictories(state.players, state.map, { spaceRace: state.spaceRace, worldCongress: state.worldCongress, age: state.age });
     if (winner) { state.phase = 'ended'; state.winner = winner; }
     ```
  3. Add `winner: PlayerId | null` to GameState; show VictoryProgress panel with winner on `phase==='ended'`.
  4. Progress updates: in `processTurnForPlayer`, after Space Race project production completes → `victory.setSpaceRaceProgress(playerId, step)`. After World Congress vote → `setDiplomaticFavor`. After great works tourism → `setCulturalProgress`. (These are wired via store actions from Phase 3 UI.)
- **Outputs**: fixed `checkAgeVictory`, `winner` state, `checkAllVictories` in `endTurn`.
- **Verification**:
  1. `npm run test -- -- victory.test.ts` passes; add test for `checkAgeVictory` with `eraScore >= 50` → true.
  2. Manual: conquer all capitals → `phase==='ended'`, `winner` set.

---

### PHASE 3 — Core Gameplay UI (Prerequisites: PHASE 2 complete)

#### Task 3.1 — CityPanel Real Data + Production Queue
- **Prerequisites**: 2.3 (UnlockManager), 2.4 (gov bonuses)
- **Inputs**:
  - `src/components/game/CityPanel.tsx`
  - `src/game/engine/UnlockManager.ts` (`getAvailableProductionItems`)
  - `src/store/gameStore.ts`
- **Logic**:
  1. Replace hardcoded stats with computed:
     ```typescript
     const city = useGameStore(s => s.players.flatMap(p=>p.cities).find(c => c.id === selectedCityId));
     const map = useGameStore(s => s.map);
     const yields = city && map ? calculateCityYields(city, map) : null;
     // Stats tab: yields.food/turn, yields.production/turn, yields.gold/turn, yields.science/turn, yields.culture/turn, yields.faith/turn
     // Population, housing (housingUsed/housing), amenities, food stockpile/foodForGrowth
     ```
  2. Build tab — list available items:
     ```typescript
     const player = useGameStore(s => s.players.find(p => p.id === currentPlayer)); // human
     const items = getAvailableProductionItems(player, city);
     // Render each item as a button: onClick → dispatch setProduction(item)
     ```
  3. Add store action `setProduction: (cityId: string, item: CurrentProduction) => set((state) => { find city; city.currentProduction = item; })`.
  4. Add `queueProduction: (cityId, item) => set(... city.buildQueue.push(item) ...)`.
  5. In `processTurnForPlayer` (line 915), when production completes, ACTUALLY create the item:
     ```typescript
     if (city.currentProduction && city.currentProduction.progress >= city.currentProduction.cost) {
       const item = city.currentProduction;
       if (item.type === 'unit') {
         const u: Unit = { id:`unit-${state.nextId++}`, type: item.name as UnitType, owner: player.id, x: city.x, y: city.y, health:100, maxHealth:100, movement:2, maxMovement:2, strength: UNIT_STRENGTH[item.name] ?? 10, strengthBase: ..., hasActed:false };
         player.units.push(u);
         // also push to tile.units
         const tileKey = `${city.x},${city.y}`;
         state.map.tiles.get(tileKey)?.units.push(u.id);
       } else if (item.type === 'building') {
         city.buildings.push(item.name);
       } else if (item.type === 'wonder') { city.buildings.push(item.name); /* mark as wonder */ }
       city.currentProduction = city.buildQueue.shift() ?? null;
     }
     ```
  6. Defense tab — show actual garrison unit health from `city.garrison` → look up Unit.
- **Outputs**: rewritten `CityPanel.tsx`, `setProduction`/`queueProduction` actions, production completion spawns units/buildings.
- **Verification**:
  1. New test `tests/game/production.test.ts`: queue `warrior` (cost 30), city yields 10 production/turn → after 3 turns `player.units` has a new warrior at city location.
  2. Manual: click city → CityPanel shows real yields; click `Warrior` → next 3 turns → warrior appears.

#### Task 3.2 — Mount CityPanel from GameCanvas
- **Prerequisites**: 3.1
- **Inputs**: `src/components/game/GameCanvas.tsx`
- **Logic**:
  1. Add state: `const selectedCity = useGameStore(s => s.selectedTile ? findCityAt(s, s.selectedTile) : null)`.
  2. Add `findCityAt(state, coord)`: iterate `state.players.flatMap(p=>p.cities).find(c => c.x===coord.x && c.y===coord.y)`.
  3. In click handler: if clicked tile has `cityId` owned by human player → `selectTile({x,y})`.
  4. Render: `{selectedCity && <CityPanel cityId={selectedCity.id} onClose={() => selectTile(null)} />}` as sibling of canvas.
- **Outputs**: modified `GameCanvas.tsx`.
- **Verification**: click own city → CityPanel appears; click empty tile → closes.

#### Task 3.3 — UnitPanel Real Actions
- **Prerequisites**: 3.2
- **Inputs**: `src/components/game/UnitPanel.tsx`
- **Logic**:
  1. Wire buttons:
     - Move: already handled by GameCanvas click-to-move; UnitPanel just shows info.
     - Attack: `onClick → dispatch attackUnit(unitId, targetTile)` — NEW store action that calls `resolveCombat` (extract from existing inline `moveUnit` combat code into dedicated action).
     - Fortify: `onClick → dispatch fortifyUnit(unitId)` → `unit.fortificationTurns += 1; unit.hasActed = true`.
     - Skip: `onClick → dispatch skipUnit(unitId)` (exists).
  2. Show real level: `unit.promotions?.level ?? 1`.
  3. Show promotions list, available moves.
- **Outputs**: rewritten `UnitPanel.tsx`, `attackUnit`/`fortifyUnit` actions.
- **Verification**: select unit → Fortify → unit.hasActed true, fortificationTurns=1; click enemy → Attack → combat resolved.

#### Task 3.4 — Unit Promotion Selection UI
- **Prerequisites**: 3.3
- **Inputs**: `src/game/engine/PromotionSystem.ts` (`getAvailablePromotions`); NEW `src/components/game/PromotionDialog.tsx`.
- **Logic**:
  1. In `CombatResolver.resolveCombat`, after damage applied, if XP gain causes level-up (check `XP_THRESHOLDS`), mark unit `pendingPromotion = true` on Unit.
  2. Add `pendingPromotion?: boolean` to Unit.
  3. In `GameCanvas`, after combat, if `unit.pendingPromotion` → render `<PromotionDialog unitId={unit.id} options={getAvailablePromotions(unit)} onSelect={(promoId) => dispatch awardPromotion(unitId, promoId)} />`.
  4. `awardPromotion` action: `const prom = PROMOTIONS[promoId]; apply effects to unit; unit.promotions.promotions.push(promoId); unit.pendingPromotion = false;`.
- **Outputs**: `pendingPromotion` field, `PromotionDialog.tsx`, `awardPromotion` action.
- **Verification**: unit gains 100 XP → dialog shows 2 promotion choices → select `charge` → `unit.promotions.promotions.includes('charge')`.

#### Task 3.5 — GameCanvas Age Display + End Game Screen
- **Prerequisites**: 2.10, 3.4
- **Logic**:
  1. TopBar uses `const age = useGameStore(s => s.age)` (FIX-3.7 already).
  2. When `phase==='ended'`, render `<VictoryScreen winner={state.winner} />` overlay with restart button (`resetGame`).
- **Outputs**: `VictoryScreen` component or extend `VictoryProgress`.
- **Verification**: trigger domination victory → VictoryScreen shows winner; `resetGame` → phase back to `menu`.

---

### PHASE 4 — Secondary Systems UI (Prerequisites: PHASE 3 complete)

#### Task 4.1 — Government & Policy Panel
- **Prerequisites**: 2.4
- **Inputs**: NEW `src/components/game/GovernmentPanel.tsx`; `src/game/engine/GovernmentSystem.ts` (`GOVERNMENTS`, `POLICY_CARDS`).
- **Logic**:
  1. Panel shows current government, available governments (gated by civics researched — check `player.technologies`? No, civics — need `player.civics: Set<string>` ADD). For each civic that unlocks a government, if `player.civics.has(civicId)` → government selectable.
  2. On select → `dispatch setGovernment(govId)` (Task 2.4 action) — checks gold cost.
  3. Policy card section: show slots (military/economic/diplomatic/wildcard), equipped cards, available cards (gated by civics). Drag or click to equip → `dispatch equipPolicy(cardId, slot)`.
  4. Mount from a "Government" button in TopBar.
- **Add**: `civics: Set<string>` and `currentCivic: { civicId: string; progress: number } | null` to Player.
- **Integrate CivicSystem**: in `processTurnForPlayer`, process civic research parallel to tech: `player.currentCivic.progress += culturePerTurn; if (>=cost) player.civics.add(...)`.
- **Outputs**: `GovernmentPanel.tsx`, `civics`/`currentCivic` on Player, civic research in turn processing, mount.
- **Verification**: research civic `code_of_laws` → `GovernmentPanel` shows `oligarchy`/`aristocracy` selectable; switch → gold cost deducted; equip policy → bonus applied next turn.

#### Task 4.2 — Religion Panel
- **Prerequisites**: 2.5, 4.1
- **Inputs**: NEW `src/components/game/ReligionPanel.tsx`.
- **Logic**: Show faith count, pantheon belief (if founded), religion (if founded), available beliefs, train missionary/apostle buttons (dispatch from Task 2.5). Mount from TopBar "Religion" button.
- **Verification**: found pantheon → belief shown; train missionary → unit appears; `spreadReligion` action works.

#### Task 4.3 — TechTreePanel Dependency Lines + Unlocks Display
- **Prerequisites**: 2.3
- **Inputs**: `src/components/game/TechTreePanel.tsx`.
- **Logic**:
  1. For each tech, draw edges to its `prerequisites` (SVG lines or Canvas overlay).
  2. Each tech card shows `unlocks` list (from `TECH_UNLOCK_EFFECTS` — unit/building/improvement icons + names).
  3. Color techs: green if `player.technologies.has(id)`, blue if `currentResearch.techId === id`, grey if prerequisites not met, yellow if available.
- **Verification**: panel shows lines from `mining` → `bronze_working`; card shows "Unlocks: Spearman, Mine, Quarry".

#### Task 4.4 — Diplomatic / World Congress
- **Prerequisites**: 2.10
- **Inputs**: NEW `src/components/game/WorldCongressPanel.tsx`; `VictorySystem` (has `WorldCongressState`).
- **Logic**:
  1. Every 30 turns (Modern age), trigger World Congress: each player gets votes proportional to diplomatic favor. Human player picks a proposal from 3 random; AIs pick randomly.
  2. Tally votes → winning proposal applies a global modifier (e.g., "+10% science" for N turns).
  3. Player with most votes gains diplomatic victory progress. 4/6 wins = victory.
  4. `diplomaticFavor` accumulated from: completing quests, sending envoys, being suzerain of 3+ city-states, alliances.
- **Outputs**: `WorldCongressPanel.tsx`, favor accumulation in `processTurnForPlayer`, congress trigger.
- **Verification**: accumulate favor → World Congress triggers → vote → progress tracked.

#### Task 4.5 — Space Race Project Sequence
- **Prerequisites**: 4.4
- **Inputs**: `src/game/engine/VictorySystem.ts` (`SpaceRaceProgress`); `UnlockManager.ts` (`launch_pad`, `satellite`, etc. as projects).
- **Logic**:
  1. In Modern age, after `rocketry` tech, `spaceport` building buildable, then `launch_pad` project (production item type `'project'`).
  2. Project sequence: `launch_satellite` → `launch_recon` → `launch_exoplanet` (each a city project with escalating cost). Each completion → `victory.setSpaceRaceProgress(playerId, step)` advancing `{satellite:false→true, recon:false→true, exoplanet:false→true}`.
  3. All three complete → science victory.
- **Outputs**: project production items, `setSpaceRaceProgress` calls.
- **Verification**: build spaceport, queue `launch_satellite` project, complete → progress.satellite === true; all three → science victory triggers.

---

### PHASE 5 — Map Type Selection (Prerequisites: PHASE 4)

#### Task 5.1 — Map Type Generators
- **Prerequisites**: FIX-3.8 (settings passthrough)
- **Inputs**: `src/store/gameStore.ts` `generateMap`; NEW `src/game/engine/MapGenerator.ts`.
- **Logic**:
  1. Extract current Perlin logic into `generateContinents(seed, w, h): MapData`.
  2. Add `generateIslands(seed, w, h)`: increase ocean fraction to 60%, scatter small landmasses.
  3. Add `generatePangaea(seed, w, h)`: single large landmass — bias noise to one hemisphere.
  4. Add `generateShuffle(seed, w, h)`: pick randomly per generation.
  5. In `generateMap`, `switch(state.settings.mapType)` → call appropriate generator.
- **Verification**: `mapType:'islands'` → visible ocean gaps between landmasses; `'pangaea'` → one contiguous land.

---

### PHASE 6 — Data Externalization & Polish (Prerequisites: PHASE 5)

#### Task 6.1 — JSON Data Files
- **Prerequisites**: 2.3 (UnlockManager tables stable)
- **Inputs**: `src/game/data/` (empty).
- **Logic**: Move `TECHNOLOGIES`, `CIVICS`, `GOVERNMENTS`, `POLICY_CARDS`, `CIVILIZATIONS`, `PROMOTIONS`, `UNIT_COSTS`, `BUILDING_COSTS`, `UNIT_STRENGTH` to JSON files: `src/game/data/technologies.json`, etc. Add a `loadDataFile<T>(path): T` util that validates against a TypeScript interface and throws on mismatch. Replace const declarations with ` loadDataFile(...)` calls (memoized).
- **Verification**: game loads; `technologies.json` edit → tech cost changes in game.

#### Task 6.2 — gameStore Unit Tests
- **Prerequisites**: Phase 2
- **Inputs**: NEW `tests/store/gameStore.test.ts`.
- **Logic**: Test each action: `startGame` → state initialized; `moveUnit` → tile.units updated, unit.x/y changed, movement decreased; `endTurn` → turn incremented, units reset; `setResearch` → currentResearch set; `foundCity` → city.tiles.length === 7; `saveGame`/`loadFromSlot` roundtrip preserves Set/Map; `setProduction` → city.currentProduction set. Use a test harness that creates a fresh store per test (`useGameStore.setState(createInitialState())` + `phase:'setup'`).
- **Verification**: `npm run test -- -- gameStore.test.ts` — 90%+ action coverage.

#### Task 6.3 — Integration Test
- **Prerequisites**: 6.2
- **Inputs**: NEW `tests/integration/fullTurn.test.ts`.
- **Logic**: Create a 2-player game, run 50 `endTurn()` cycles, assert: turn === 50, no NaN in yields, no duplicate unit IDs, no orphan tile.units entries (every id in tile.units exists in some player.units), at least one tech researched, cities grew or stayed stable, no crashes.
- **Verification**: test passes after full Phase 2 integration.

---

## Appendix A — Hex Coordinate Helpers (reference for all tasks)

CivLite uses **offset coordinates (even-r)** per `GameCanvas.tsx` hex math. Neighbor offsets depend on row parity:

```typescript
export const HEX_DIRS_EVEN_R: ReadonlyArray<readonly [number, number]> = [
  [+1,  0], [ 0, -1], [-1, -1],
  [-1,  0], [-1, +1], [ 0, +1],
];
export const HEX_DIRS_ODD_R: ReadonlyArray<readonly [number, number]> = [
  [+1,  0], [+1, -1], [ 0, -1],
  [-1,  0], [ 0, +1], [+1, +1],
];
export function hexNeighbors(x: number, y: number): TileCoord[] {
  const dirs = (y % 2 === 0) ? HEX_DIRS_EVEN_R : HEX_DIRS_ODD_R;
  return dirs.map(([dx, dy]) => ({ x: x + dx, y: y + dy }));
}
export function hexDistance(a: TileCoord, b: TileCoord): number {
  // Convert offset→cube for accurate hex distance
  const ax = a.x - ((a.y - (a.y & 1)) / 2);
  const az = a.y;
  const bx = b.x - ((b.y - (b.y & 1)) / 2);
  const bz = b.y;
  return (Math.abs(ax - bx) + Math.abs(az - bz) + Math.abs((ax + az) - (bx + bz))) / 2;
}
```
Place in `src/game/engine/HexGrid.ts` (NEW). Import wherever neighbors/distance needed (FogOfWar, CrisisSystem, foundCity, combat adjacency).

---

## Appendix B — Verification Command Reference

| Command | Purpose |
|---|---|
| `npm run typecheck` | TypeScript strict type check — run after every file edit. |
| `npm run lint` | ESLint — run before commits. |
| `npm run test` | All vitest unit tests. |
| `npm run test -- -- <pattern>` | Single test file (e.g., `-- combat.test.ts`). |
| `npm run build` | Production build — confirms no compile errors. |
| `npm run dev` | Dev server at :3000 — manual verification. |

---

## Appendix C — Task Dependency Graph

```
PHASE 1 (bug fixes) ─── no deps, do in order 1.1→1.11
        │
        ▼
PHASE 2 (integration)
   2.1 Fog   ──┐
              ├──→ 2.2 Era ──→ 2.3 Unlock ──→ 2.4 Gov ──→ 2.5 Religion
                                                                ├─→ 2.6 Trade ──→ 2.7 GreatWorks
                                                                │                 ├─→ 2.8 Crisis ──→ 2.9 Barb ──→ 2.10 Victory
                                                                ▼
PHASE 3 (core UI) — 3.1 CityPanel/Production ──→ 3.2 Mount ──→ 3.3 UnitPanel ──→ 3.4 Promotion ──→ 3.5 EndGame
PHASE 4 (secondary UI) — 4.1 GovPanel ──→ 4.2 ReligionPanel ──→ 4.3 TechTree lines ──→ 4.4 WorldCongress ──→ 4.5 SpaceRace
PHASE 5 — 5.1 MapType
PHASE 6 — 6.1 JSON data ║ 6.2 gameStore tests ║ 6.3 integration test   (parallel)
```

---

## Appendix D — Player Extended Type (cumulative across phases)

After all phases, `Player` becomes:
```typescript
interface Player {
  id: PlayerId; name: string; isAI: boolean; isHuman: boolean; gold: number;
  cities: City[]; units: Unit[];
  technologies: Set<string>; currentResearch: CurrentResearch | null;
  civics: Set<string>; currentCivic: { civicId: string; progress: number } | null;  // P4.1
  government: string | null; activePolicies: string[]; policySlots: { military: number; economic: number; diplomatic: number; wildcard: number };  // P2.4
  faith: number; pantheon: string | null; religion: { id: string; name: string; beliefs: string[] } | null;  // P2.5
  tradeRoutes: TradeRoute[];  // P2.6
  greatWorks: GreatWork[]; greatPersonPoints: Record<string, number>; tourism: number;  // P2.7
  eraScore: number; eraScoreActions: Record<string, number>; legacyObjectives: Record<string, number>; ageBonuses: { productionCarryOver: number; scoreCarryOver: number } | null;  // P2.2
  civilization: string;  // P2.x (optional)
  unlockedActions: string[];  // P2.3
  score: number;
}
```

---

**End of Blueprint.** Total tasks: 31 across 6 phases. Each task is independently verifiable. Resume capability: an LLM may stop after any task and resume by re-reading this file and executing the next uncompleted task (track via `git log` or a `progress.md` companion file).
