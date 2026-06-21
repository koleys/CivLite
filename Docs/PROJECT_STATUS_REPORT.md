# CivLite - Project Status Report

**Date**: June 21, 2026
**Repository**: CivLite
**Spec Reference**: `Docs/SPEC.md` (1644+ lines)

---

## Table of Contents

1. [Executive Summary](#1-executive-summary)
2. [Feature Implementation Status](#2-feature-implementation-status)
3. [Critical Bugs](#3-critical-bugs)
4. [Incomplete Implementations](#4-incomplete-implementations)
5. [Missing Integrations](#5-missing-integrations)
6. [Test Coverage Analysis](#6-test-coverage-analysis)
7. [Implementation Plan](#7-implementation-plan)
8. [Appendix: File-by-File Analysis](#8-appendix-file-by-file-analysis)

---

## 1. Executive Summary

CivLite is a browser-based 4X strategy game inspired by Civilization VII. The project uses React 19, TypeScript, Zustand, and Immer. After a thorough analysis of the codebase against the SPEC:

- **~30% of SPEC features are fully functional** (core engine systems, combat, tech tree, era system, barbarians)
- **~25% are structurally implemented but not integrated** (fog of war, religion, government, crises)
- **~25% are partially implemented with bugs** (combat charge promotion, volcanic winter, city management)
- **~20% are entirely missing** (age victory, tech unlocks, policy bonuses, production UI, multiplayer)
- **Critical gap**: Many game systems exist as standalone classes but are never instantiated or called from the game loop

---

## 2. Feature Implementation Status

### Legend
- **COMPLETE** - Fully implemented and integrated
- **PARTIAL** - Core logic exists but incomplete or not integrated
- **STUB** - Only declared/skeleton code
- **MISSING** - Not implemented at all

### 2.1 Core Game Loop

| Feature | Status | Notes |
|---------|--------|-------|
| Turn management | COMPLETE | Players cycle, turns increment |
| Unit movement | PARTIAL | Works but ignores terrain costs, no terrain passability |
| Combat resolution | PARTIAL | Formula correct but charge promotion inverted, missing ZOC/flanking |
| City founding | PARTIAL | Creates city but only claims center tile, no surrounding tiles |
| Production queue | STUB | CityPanel has hardcoded buttons, no actual queue system |
| City growth | COMPLETE | Food surplus, housing, amenities calculated correctly |
| Save/Load | PARTIAL | Serialization exists but deserialization bypasses Map/Set reconstruction |

### 2.2 Game Systems

| Feature | Status | Notes |
|---------|--------|-------|
| Technology tree | COMPLETE (logic) / MISSING (integration) | 40+ techs defined, but unlocks never applied |
| Civic tree | COMPLETE (logic) / MISSING (integration) | 20+ civics defined, but bonuses never applied |
| Era score system | COMPLETE | All actions, legacy objectives, age transitions |
| Government system | COMPLETE (logic) / MISSING (integration) | 10 governments, 20+ policies, but bonuses never called |
| Religion system | PARTIAL | Faith accumulation works, but religious units don't exist on map |
| Trade system | COMPLETE | Routes, yields, capacity all implemented |
| Combat promotions | COMPLETE (logic) / PARTIAL (integration) | 18 promotions defined, but selection UI missing, some never applied |
| Barbarian system | COMPLETE | Camps, spawning, scouts, difficulty scaling all work |
| City-state system | COMPLETE | 8 types, envoy bonuses, suzerain logic |
| Great works | COMPLETE | Great person points, tourism, national parks |
| Crisis system | STUB | 4 types defined but effects are stubs, never triggered |
| Cheat system | COMPLETE | All sliders, persistence, multiplier application |

### 2.3 Map & Rendering

| Feature | Status | Notes |
|---------|--------|-------|
| Map generation | COMPLETE | Perlin noise, terrain features, resources, city states |
| Hex rendering (Canvas 2D) | COMPLETE | Flat-top hexes with terrain colors, units, cities, UI |
| WebGL renderer | STUB | Only colored quads, never integrated, no hex shapes |
| Fog of war | PARTIAL | System exists but never instantiated or rendered |
| Minimap | COMPLETE | Renders alongside main canvas |
| Hardware detection | COMPLETE | GPU/CPU/RAM detection, quality preset recommendation |

### 2.4 UI Components

| Feature | Status | Notes |
|---------|--------|-------|
| Main menu | COMPLETE | New game, load, settings |
| Game setup | PARTIAL | UI exists but many settings (mapType, aiCount) ignored |
| Top bar | PARTIAL | Shows turn/gold/science but hardcodes "Antiquity Age" |
| Unit panel | STUB | All action buttons are no-ops, level hardcoded |
| City panel | STUB | Hardcoded stats, no production assignment |
| Tech tree | PARTIAL | Displays techs but no dependency lines, no unlock info |
| Tutorial overlay | PARTIAL | Steps defined but limited guidance |
| Cheat panel | COMPLETE | All sliders functional |
| Notification panel | COMPLETE | Shows notifications |
| Victory progress | COMPLETE | Shows progress for all victory types |

### 2.5 AI

| Feature | Status | Notes |
|---------|--------|-------|
| Random AI | COMPLETE | Strategy selection, unit/city management, research |
| OpenRouter AI | COMPLETE | LLM-powered with model fallback, prompt building |
| Duplicate AI files | ISSUE | Two OpenRouter implementations (game/ai/ and game/engine/) |

### 2.6 Multiplayer

| Feature | Status | Notes |
|---------|--------|-------|
| Socket manager | STUB | Full structure but no server, not functional |
| Room management | STUB | Create/join/leave implemented, no backend |
| Action batching | STUB | Send/receive implemented, no backend |
| Chat | STUB | Message send/receive with profanity filter, no backend |

### 2.7 Data & Configuration

| Feature | Status | Notes |
|---------|--------|-------|
| JSON data files | MISSING | `src/game/data/` is empty, all data hardcoded in TS |
| `src/game/systems/` | EMPTY | Architecture dir exists but unused |
| `src/shaders/` | EMPTY | No GLSL shaders for WebGL |

---

## 3. Critical Bugs

### BUG-001: Charge Promotion Inverted (CombatResolver.ts:194-199)
**Severity**: HIGH
**Description**: The charge promotion gives the **defender** a strength bonus when damaged, instead of giving the **attacker** a bonus when the defender is damaged.
**Impact**: Melee units with charge promotion get no benefit; defenders get unintended buff.
**Fix**: Swap `defender`/`attacker` references in the charge check.

### BUG-002: Nuke Clears Buildings Before Copying (CombatResolver.ts:326-329)
**Severity**: HIGH
**Description**: `city.buildings = []` runs before `destroyedBuildings.push(...city.buildings)`, so destroyed buildings list is always empty.
**Fix**: Copy buildings first, then clear.

### BUG-003: Pirate Raid Uses Fake Coastal Detection (CrisisSystem.ts:120)
**Severity**: MEDIUM
**Description**: `c.y % 5 === 0` is used instead of actual adjacency to ocean/coast tiles.
**Fix**: Check if any adjacent tile has ocean/coast terrain.

### BUG-004: Movement Ignores Terrain (GameEngine.ts:128)
**Severity**: HIGH
**Description**: All movement costs exactly 1 movement point regardless of terrain.
**Fix**: Use `FogOfWarSystem.getMovementCost()` or duplicate terrain cost logic.

### BUG-005: Hills Give Zero Production (CityGrowth.ts:40)
**Severity**: MEDIUM
**Description**: `hills: {}` in terrain feature yields means hills provide no production bonus.
**Fix**: Add `production: 1` to hills feature yields.

### BUG-006: Tech Unlocks Are Decorative (TechSystem.ts)
**Severity**: CRITICAL
**Description**: Techs have `unlocks: string[]` but nothing checks or applies these unlocks. Researching Mining does not unlock Bronze Working.
**Impact**: Tech tree has zero gameplay effect beyond science/culture numbers.
**Fix**: Create an `UnlockManager` that applies unlocks when tech completes.

### BUG-007: Government/Policy Bonuses Never Applied (GovernmentSystem.ts)
**Severity**: CRITICAL
**Description**: `getBonusMultiplier()` exists but is never called from the game loop. Switching government or equipping policies has no effect.
**Fix**: Call `getBonusMultiplier()` in yield/science/culture calculations.

### BUG-008: Age Victory Always Returns False (VictorySystem.ts:172-174)
**Severity**: HIGH
**Description**: `checkAgeVictory()` is a stub returning `false`.
**Fix**: Implement age victory check based on era score thresholds.

### BUG-009: Fog of War Uses 8-Directional Neighbors (FogOfWar.ts:191-195)
**Severity**: MEDIUM
**Description**: Uses square grid neighbors `[-1,-1], [0,-1], [1,-1]...` instead of hex offset coordinates.
**Fix**: Use proper hex neighbor calculation for offset coordinates.

### BUG-010: GameSetup Settings Ignored (gameStore.ts)
**Severity**: MEDIUM
**Description**: `mapType`, `aiCount`, `cityStateCount` from setup UI are never read by the store.
**Fix**: Pass all settings through and use them in map generation and player creation.

### BUG-011: loadGameState Bypasses Deserialization (gameStore.ts:762-767)
**Severity**: HIGH
**Description**: Uses raw state without calling `deserializeGameState`, so `Set`/`Map` types won't be reconstructed.
**Fix**: Implement proper deserialization that converts arrays/objects back to Set/Map.

### BUG-012: Top Bar Hardcodes "Antiquity Age" (GameCanvas.tsx:828)
**Severity**: LOW
**Description**: Always shows "Antiquity Age" regardless of actual game age.
**Fix**: Read current age from game state.

### BUG-013: cheatAddResources Uses Culture as Food (gameStore.ts:792)
**Severity**: LOW
**Description**: `city.foodStockpile += culture;` — culture parameter added to food.
**Fix**: Use the correct field based on resource type.

### BUG-014: WebGL Renderer Creates/Destroys Buffers Per Frame (WebGLRenderer.ts:274-289)
**Severity**: LOW
**Description**: Creates new buffers, draws, then deletes every call instead of reusing pre-allocated buffers.
**Fix**: Use the pre-allocated `positionBuffer` and `colorBuffer` from `initBuffers()`.

---

## 4. Incomplete Implementations

### 4.1 Production Queue System
**Status**: STUB
**Description**: No mechanism for players to choose what cities produce. `CityPanel.tsx` has 4 hardcoded buttons with no handlers. Units/buildings from production completion are never actually created.
**Required Work**:
- Create production item registry (units + buildings available per tech)
- Build production queue data structure on City
- Wire CityPanel buttons to queue items
- Process queue each turn (decrement production, create item on completion)

### 4.2 Religious Units on Map
**Status**: STUB
**Description**: `trainMissionary()`/`trainApostle()` deduct faith but don't create map units. No religious spread happens automatically.
**Required Work**:
- Add missionary/apostle to UnitType enum
- Create unit objects when training
- Add spread action to unit actions
- Implement passive religious pressure

### 4.3 Government/Policy UI
**Status**: MISSING
**Description**: No component for selecting governments or managing policy cards.
**Required Work**:
- Government selection panel (after civic researched)
- Policy card management (drag/equip)
- Display active bonuses

### 4.4 City Management UI
**Status**: STUB
**Description**: CityPanel exists but is never mounted from GameCanvas. Clicking a city does nothing.
**Required Work**:
- Mount CityPanel on city tile click
- Connect production queue to city state
- Show actual yields (not hardcoded)
- Show working tiles, specialists, housing

### 4.5 Unit Promotion Selection
**Status**: MISSING
**Description**: Promotions are defined but there's no UI or logic for players to choose promotions when units level up.
**Required Work**:
- Track XP and level-up events
- Show available promotions when level-up occurs
- Apply promotion effects to combat

### 4.6 Eureka/Inspiration Triggers
**Status**: STUB
**Description**: `checkEurekaTrigger()` exists in TechSystem/CivicSystem but is never called.
**Required Work**:
- Define trigger events (kill unit, build improvement, found city, etc.)
- Fire triggers from game actions
- Apply cost reduction on trigger

### 4.7 Crisis Effects
**Status**: STUB
**Description**: 4 crisis types defined but effects are empty functions. Never triggered.
**Required Work**:
- Implement volcanic winter (50% food reduction for 10 turns)
- Implement proper coastal detection for pirate raids
- Integrate crisis triggers into game loop
- Track crisis duration

### 4.8 Space Race Progress
**Status**: STUB
**Description**: `setSpaceRaceProgress()` exists but is never called. Science victory unreachable.
**Required Work**:
- Add launch pad building (requires late-game tech)
- Create space race project steps
- Track progress per turn
- Trigger victory on completion

### 4.9 Diplomatic Favor & World Congress
**Status**: STUB
**Description**: `setDiplomaticFavor()` exists but is never called. No World Congress UI.
**Required Work**:
- Implement diplomatic favor accumulation
- Create World Congress proposal/voting system
- Track diplomatic victory progress

### 4.10 Cultural Victory Progress
**Status**: STUB
**Description**: `setCulturalProgress()` exists but is never called.
**Required Work**:
- Calculate tourism per turn from great works
- Compare against target culture threshold
- Track progress

---

## 5. Missing Integrations

The following systems are fully implemented as standalone classes but are **never called from the game loop** (`GameEngine.processEndOfRound()` or `gameStore.endTurn()`):

| System | File | What's Missing |
|--------|------|----------------|
| FogOfWar | `FogOfWar.ts` | Never instantiated, `calculateVisibility()` never called, no fog rendering |
| EraSystem | `EraSystem.ts` | No era score tracking during gameplay, no age transition trigger |
| GovernmentSystem | `GovernmentSystem.ts` | `getBonusMultiplier()` never called for yield calculations |
| ReligionSystem | `ReligionSystem.ts` | Faith never accumulates, no religious units, no spread |
| CrisisSystem | `CrisisSystem.ts` | Never instantiated, crises never trigger |
| VictorySystem | `VictorySystem.ts` | `checkAllVictories()` never called at end of turn |
| GreatWorksSystem | `GreatWorksSystem.ts` | Tourism never calculated, great persons never appear |
| TradeSystem | `TradeSystem.ts` | Trade routes never established during gameplay |

**Root Cause**: The game loop in `GameEngine.processEndOfRound()` only emits a `TURN_STARTED` event. It does not call any of the game systems. The `gameStore.endTurn()` function handles some processing (production, growth, research) but does not integrate the above systems.

---

## 6. Test Coverage Analysis

### Existing Tests (12 files)

| Test File | Coverage | Notes |
|-----------|----------|-------|
| `tests/game/combat.test.ts` | GOOD | Tests combat resolution, terrain bonuses, promotions, nuclear weapons |
| `tests/game/gameEngine.test.ts` | GOOD | Tests turn processing, unit actions, tech research |
| `tests/game/victory.test.ts` | GOOD | Tests domination, science, diplomatic victories |
| `tests/game/cityGrowth.test.ts` | GOOD | Tests yields, growth, housing, amenities |
| `tests/game/tech.test.ts` | GOOD | Tests tech research, eureka, prerequisites |
| `tests/game/FogOfWar.test.ts` | GOOD | Tests visibility, sight radius, movement range |
| `tests/game/era.test.ts` | GOOD | Tests era score, legacy objectives, transitions |
| `tests/game/pathfinding.test.ts` | GOOD | Tests A* pathfinding |
| `tests/game/unitStacking.test.ts` | GOOD | Tests stacking rules |
| `tests/components/Button.test.tsx` | BASIC | Renders, click handler |
| `tests/components/Modal.test.tsx` | BASIC | Renders, close |

### Missing Test Coverage

| Area | Priority | Notes |
|------|----------|-------|
| `gameStore.ts` (1256 lines) | HIGH | Zero test coverage for the central store |
| CrisisSystem | MEDIUM | No tests |
| GovernmentSystem | MEDIUM | No tests |
| ReligionSystem | MEDIUM | No tests |
| TradeSystem | MEDIUM | No tests |
| BarbarianSystem | LOW | No tests (complex, should have integration tests) |
| CityStateSystem | LOW | No tests |
| GreatWorksSystem | LOW | No tests |
| PromotionSystem | LOW | No tests |
| Integration tests | HIGH | No full turn cycle test |
| E2E tests | LOW | 4 Playwright specs exist but status unknown |

### Empty Test Directories
- `tests/integration/` — 0 files
- `tests/renderer/` — 0 files
- `tests/game/entities/` — 0 files

---

## 7. Implementation Plan

### Phase 1: Fix Critical Bugs (1-2 days)

| Task | File(s) | Priority | Est. Time |
|------|---------|----------|-----------|
| Fix charge promotion inversion | `CombatResolver.ts` | P0 | 30 min |
| Fix nuke building clear order | `CombatResolver.ts` | P0 | 15 min |
| Fix hills production yield | `CityGrowth.ts` | P0 | 15 min |
| Fix movement terrain costs | `GameEngine.ts` | P0 | 1 hr |
| Fix loadGameState deserialization | `gameStore.ts` | P0 | 1 hr |
| Fix cheatAddResources field | `gameStore.ts` | P1 | 15 min |
| Fix GameSetup settings passthrough | `GameSetup.tsx`, `gameStore.ts` | P1 | 1 hr |
| Fix TopBar age display | `GameCanvas.tsx` | P1 | 15 min |

### Phase 2: Integrate Core Systems (3-5 days)

| Task | File(s) | Priority | Est. Time |
|------|---------|----------|-----------|
| **Create UnlockManager** — apply tech/civic unlocks | NEW, `TechSystem.ts`, `CivicSystem.ts` | P0 | 4 hrs |
| **Integrate GovernmentSystem** — call `getBonusMultiplier()` in yield calcs | `gameStore.ts`, `CityGrowth.ts` | P0 | 2 hrs |
| **Integrate EraSystem** — track era score, trigger age transitions | `gameStore.ts`, `EraSystem.ts` | P0 | 3 hrs |
| **Integrate VictorySystem** — check victories each turn | `gameStore.ts`, `VictorySystem.ts` | P0 | 1 hr |
| **Integrate FogOfWar** — visibility calculation + rendering | `gameStore.ts`, `GameCanvas.tsx`, `FogOfWar.ts` | P1 | 4 hrs |
| Fix FogOfWar hex neighbors | `FogOfWar.ts` | P1 | 1 hr |
| **Integrate GreatWorksSystem** — tourism calculation | `gameStore.ts` | P1 | 1 hr |
| **Integrate TradeSystem** — route establishment | `gameStore.ts` | P1 | 1 hr |

### Phase 3: Core Gameplay Features (5-7 days)

| Task | File(s) | Priority | Est. Time |
|------|---------|----------|-----------|
| **Production Queue System** — UI + data model + processing | `CityPanel.tsx`, `gameStore.ts`, `CityGrowth.ts` | P0 | 6 hrs |
| **City Management UI** — mount panel, show real data | `CityPanel.tsx`, `GameCanvas.tsx` | P0 | 4 hrs |
| **Unit Action Buttons** — wire attack/fortify/skip | `UnitPanel.tsx`, `GameCanvas.tsx` | P0 | 2 hrs |
| **Unit Promotion Selection** — level-up UI | NEW, `PromotionSystem.ts` | P1 | 3 hrs |
| **Eureka/Inspiration Triggers** — fire from game actions | `TechSystem.ts`, `CivicSystem.ts`, `gameStore.ts` | P1 | 3 hrs |
| **Map Type Selection** — continents/islands/pangaea | `gameStore.ts` | P1 | 3 hrs |
| **AI Count/City State Count Settings** | `gameStore.ts` | P1 | 1 hr |
| Add terrain passability (ocean, mountains) | `GameEngine.ts`, `FogOfWar.ts` | P1 | 2 hrs |

### Phase 4: Secondary Systems (3-5 days)

| Task | File(s) | Priority | Est. Time |
|------|---------|----------|-----------|
| **Religion Integration** — faith accumulation, units, spread | `ReligionSystem.ts`, `gameStore.ts` | P2 | 4 hrs |
| **Crisis Integration** — trigger, effects, duration | `CrisisSystem.ts`, `gameStore.ts` | P2 | 3 hrs |
| **Government/Policy UI** — selection, card management | NEW, `GovernmentSystem.ts` | P2 | 4 hrs |
| **Space Race Progress** — launch pad, projects | `VictorySystem.ts`, `gameStore.ts` | P2 | 3 hrs |
| **Diplomatic Favor & World Congress** | `VictorySystem.ts`, NEW | P2 | 4 hrs |
| **Cultural Victory Progress** | `VictorySystem.ts`, `GreatWorksSystem.ts` | P2 | 2 hrs |
| **Age Victory Check** | `VictorySystem.ts` | P2 | 1 hr |
| Duplicate OpenRouterAI cleanup | `game/ai/`, `game/engine/` | P3 | 1 hr |

### Phase 5: Polish & Testing (2-3 days)

| Task | File(s) | Priority | Est. Time |
|------|---------|----------|-----------|
| **gameStore tests** — unit tests for store actions | NEW | P1 | 4 hrs |
| **Integration tests** — full turn cycle | NEW | P1 | 3 hrs |
| Fix WebGL renderer buffer allocation | `WebGLRenderer.ts` | P3 | 1 hr |
| Create JSON data files for units/buildings | `src/game/data/` | P3 | 4 hrs |
| Fix type casting in gameStore | `gameStore.ts` | P3 | 2 hrs |
| Remove duplicate yield calculations | `CityGrowth.ts`, `TileManager.ts` | P3 | 1 hr |

---

## 8. Appendix: File-by-File Analysis

### Game Engine (`src/game/engine/`)

| File | Lines | Status | Issues |
|------|-------|--------|--------|
| `GameEngine.ts` | 343 | PARTIAL | Missing ATTACK/FOUND_CITY/PILLAGE/BUILD actions; simplistic movement; no system integration |
| `CombatResolver.ts` | 356 | PARTIAL | Charge promotion inverted; nuke building clear bug; missing ZOC/flanking |
| `TechSystem.ts` | 693 | COMPLETE* | *Unlocks never applied; eureka never triggered |
| `CivicSystem.ts` | 552 | COMPLETE* | *Inspirations never triggered; no policy integration |
| `BarbarianSystem.ts` | 379 | COMPLETE | Well-implemented |
| `CityGrowth.ts` | 300 | PARTIAL | Hills production bug; hardcoded building yields; no specialist yields |
| `CityStateSystem.ts` | 319 | COMPLETE | 8 generic types (not SPEC's 18 specific ones) |
| `CheatSystem.ts` | 174 | COMPLETE | All sliders functional |
| `CivTransitionSystem.ts` | 167 | COMPLETE | 30 civs, transitions, synergies |
| `CrisisSystem.ts` | 210 | STUB | Volcanic winter empty; pirate raid fake detection; never triggered |
| `EraSystem.ts` | 327 | COMPLETE* | *Not integrated into game loop |
| `FogOfWar.ts` | 235 | COMPLETE* | *Never instantiated; 8-directional neighbor bug |
| `GovernmentSystem.ts` | 509 | COMPLETE* | *Bonuses never applied; no UI |
| `GreatWorksSystem.ts` | 287 | COMPLETE* | *Never called from game loop |
| `PromotionSystem.ts` | 428 | COMPLETE* | *No selection UI; some promotions never applied in combat |
| `ReligionSystem.ts` | 298 | PARTIAL | Faith works but units don't exist; belief ignored; no integration |
| `TileManager.ts` | 232 | COMPLETE* | *Duplicate yields with CityGrowth.ts |
| `TradeSystem.ts` | 258 | COMPLETE* | *Not integrated into game loop |
| `UnitStacking.ts` | 64 | COMPLETE | Clean implementation |
| `VictorySystem.ts` | 267 | PARTIAL | Age victory stub; cultural/diplomatic/space progress never updated |
| `OpenRouterAI.ts` | 378 | COMPLETE* | *Duplicate with `game/ai/OpenRouterAI.ts` |
| `AIRandomStrategy.ts` | 393 | COMPLETE | Functional random AI |

### AI (`src/game/ai/`)

| File | Lines | Status |
|------|-------|--------|
| `OpenRouterAI.ts` | 154 | COMPLETE — used by store |

### Store (`src/store/`)

| File | Lines | Status | Issues |
|------|-------|--------|--------|
| `gameStore.ts` | 1256 | PARTIAL | Heavy type casting; settings ignored; many systems not integrated; no victory checking |

### Renderer (`src/renderer/`)

| File | Lines | Status |
|------|-------|--------|
| `HardwareDetector.ts` | 163 | COMPLETE |
| `WebGLRenderer.ts` | ~400 | STUB — colored quads only, never used |

### Components (`src/components/`)

| File | Lines | Status |
|------|-------|--------|
| `game/GameCanvas.tsx` | ~850 | PARTIAL — core map rendering works, but no fog, no city panel mount, hardcoded age |
| `game/CityPanel.tsx` | ~200 | STUB — hardcoded stats, no production queue |
| `game/UnitPanel.tsx` | ~100 | STUB — all buttons no-ops |
| `game/TechTreePanel.tsx` | ~150 | PARTIAL — displays techs, no dependency lines |
| `game/TopBar.tsx` | ~50 | PARTIAL — hardcoded age |
| `game/Minimap.tsx` | ~80 | COMPLETE |
| `game/NotificationPanel.tsx` | ~60 | COMPLETE |
| `game/CheatPanel.tsx` | ~120 | COMPLETE |
| `game/VictoryProgress.tsx` | ~100 | COMPLETE |
| `game/TutorialOverlay.tsx` | ~100 | PARTIAL |
| `menus/MainMenu.tsx` | ~80 | COMPLETE |
| `menus/GameSetup.tsx` | ~150 | PARTIAL — settings not all passed through |
| `menus/LoadingScreen.tsx` | ~40 | COMPLETE |
| `menus/Settings.tsx` | ~80 | COMPLETE |
| `ui/*` | various | COMPLETE — Button, Modal, Tooltip, etc. all functional |

### Utils (`src/utils/`)

| File | Lines | Status |
|------|-------|--------|
| `pathfinding.ts` | ~200 | COMPLETE |
| `storage.ts` | ~80 | COMPLETE |
| `aiModels.ts` | ~60 | COMPLETE |
| `apiKey.ts` | ~30 | COMPLETE |
| `imageCache.ts` | ~50 | COMPLETE |

---

## Summary

| Category | Count |
|----------|-------|
| Critical bugs (broken core features) | 6 |
| High-severity bugs | 5 |
| Medium-severity bugs | 5 |
| Low-severity bugs | 4 |
| Systems implemented but not integrated | 8 |
| Features stubbed but not implemented | 10+ |
| Test files present | 12 |
| Test files missing | 15+ |
| Estimated effort for full implementation | 25-35 developer-days |

The project has a solid foundation with well-structured game systems. The primary gap is **integration** — many systems are built but never connected to the game loop. Phase 2 (Integrate Core Systems) is the highest-impact work and should be prioritized immediately after bug fixes.
