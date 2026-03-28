# Contributing to CivLite

## Prerequisites

### Hardware

| Component | Minimum | Recommended |
|-----------|---------|-------------|
| CPU | Dual-core 2 GHz | Quad-core 3 GHz+ |
| RAM | 8 GB | 16 GB |
| Storage | 1 GB free | 5 GB free |
| Display | 1280×720 | 1920×1080 |

### Software

| Tool | Version | Notes |
|------|---------|-------|
| Node.js | 18.x LTS or 20.x LTS | [nodejs.org](https://nodejs.org) |
| npm | 9.x+ | Ships with Node.js |
| Git | 2.40+ | [git-scm.com](https://git-scm.com) |
| VS Code | Latest | Recommended IDE |

### Browser Support

| Browser | Min Version |
|---------|------------|
| Chrome | 110+ |
| Firefox | 115+ |
| Safari | 16+ |
| Edge | 110+ |

WebGL is not required. IndexedDB is required for save/load.

---

## Technology Stack

### Core

| Technology | Version | Purpose |
|------------|---------|---------|
| React | 19.x | UI library |
| TypeScript | 5.x | Language |
| Vite | 8.x | Build tool and dev server |
| Zustand | 5.x | Global state management |
| Immer | 11.x | Immutable state via direct mutation in store actions |

Zustand uses Immer middleware so store actions can mutate draft state directly without spread.
`enableMapSet()` is called at startup because `GameState` uses `Map` and `Set`.

### Rendering

Canvas 2D exclusively (`TILE_SIZE = 64px`). Viewport culling draws only tiles within the visible camera area plus 1-tile padding.

### Persistence

IndexedDB via the `idb` library. `MapData.tiles` is a `Map<string, Tile>` and `Player.technologies` is a `Set<string>` — these are converted to/from plain objects by `serializeGameState()` / `deserializeGameState()` helpers in `gameStore.ts`.

### Testing

| Tool | Version | Purpose |
|------|---------|---------|
| Vitest | 4.x | Unit and integration tests (jsdom) |
| React Testing Library | 16.x | Component tests |
| Playwright | 1.x | End-to-end tests (Chromium) |

### Linting

ESLint with `react-hooks` and `react-refresh` plugins. TypeScript strict mode (`noImplicitAny`, `strictNullChecks`).

---

## Development Setup

```bash
# Clone and install
git clone <repo-url>
cd CivLite
npm install

# Verify the baseline
npm run typecheck   # should pass
npm run lint        # should pass
npm run build       # should succeed

# Start development server
npm run dev         # http://localhost:5173
```

### Troubleshooting

Node version issues:
```bash
nvm install 20
nvm use 20
```

Clean install:
```bash
rm -rf node_modules package-lock.json
npm cache clean --force
npm install
```

Build fails:
```bash
npm run lint:fix
npm run typecheck
```

---

## Development Commands

```bash
npm run dev             # Dev server at localhost:5173
npm run build           # Production build → dist/
npm run preview         # Preview production build locally
npm run lint            # Run ESLint
npm run lint:fix        # Auto-fix ESLint issues
npm run typecheck       # TypeScript type checking (tsc --noEmit)
npm run test            # Run all unit tests
npm run test:watch      # Watch mode
npm run test:coverage   # Coverage report
npm run test:e2e        # Playwright end-to-end tests
```

---

## Implementation Notes

### Architecture Overview

The live game loop lives in `src/store/gameStore.ts::endTurn()`. The `GameEngine` class (`src/game/engine/GameEngine.ts`) mirrors that logic for use in unit tests only.

```
endTurn()
  → processTurnForPlayer(humanPlayer)
      → city production (calculateCityYields)
      → city growth    (processCityGrowth)
      → research       (inline science + TECHNOLOGIES cost check)
      → gold income    (calculateCityYields)
  → for each AI player:
      → processTurnForPlayer(aiPlayer)
      → RandomAI.processTurn() → AIAction[]
      → applyAIActionsToState(actions)
  → refresh all units (hasActed=false, movement=maxMovement)
  → state.turn += 1
```

### Source Layout

```
src/
├── components/
│   ├── game/
│   │   └── GameCanvas.tsx      # Main canvas + all in-game UI overlays
│   ├── menus/
│   │   └── MainMenu.tsx        # Three-panel main menu
│   └── ui/
│       ├── Button.tsx
│       └── Modal.tsx
├── game/
│   ├── entities/
│   │   └── types.ts            # All TypeScript types (single source of truth)
│   └── engine/
│       ├── TileManager.ts      # Tile yield calculation
│       ├── GameEngine.ts       # Turn logic (unit tests only)
│       ├── TechSystem.ts       # Technology research and Eureka bonuses
│       ├── EraSystem.ts        # Three-age progression
│       ├── VictorySystem.ts    # Victory conditions
│       ├── CombatResolver.ts   # Combat mechanics
│       ├── CityGrowth.ts       # City food/growth
│       ├── FogOfWar.ts         # Per-player visibility
│       ├── BarbarianSystem.ts  # Barbarian AI
│       ├── AIRandomStrategy.ts # Player AI
│       ├── ReligionSystem.ts   # Religion (no UI yet)
│       ├── TradeSystem.ts      # Trade routes (no UI yet)
│       └── UnitStacking.ts     # Stacking rules
├── store/
│   └── gameStore.ts            # Zustand store + live game loop
├── utils/
│   ├── pathfinding.ts          # A* + BFS reachable tiles
│   └── storage.ts              # IndexedDB save/load
├── App.tsx
├── main.tsx                    # Entry point: calls enableMapSet()
└── index.css
```

### Implemented Systems

| System | Status | Notes |
|--------|--------|-------|
| TechSystem | ✅ Active | Tech tree, Eureka triggers, research progress |
| CityGrowth | ✅ Active | Food accumulation, population thresholds |
| EraSystem | ✅ Tested | Age transitions, legacy objectives, era score |
| VictorySystem | ✅ Tested | 5 of 6 conditions (Age Victory is stub) |
| AIRandomStrategy | ✅ Active | Weighted strategy, re-rolls every 20 turns |
| CombatResolver | ✅ Tested | Melee/ranged/siege (not yet wired to UI combat) |
| FogOfWar | ✅ Tested | Per-player visibility (not yet wired to canvas) |
| BarbarianSystem | ✅ Exists | Camp spawning (not wired to game loop) |
| ReligionSystem | ✅ Exists | Faith/religion (no UI panel) |
| TradeSystem | ✅ Exists | Trade routes (no UI panel) |
| Pathfinding | ✅ Active | A* + BFS, hex offset coordinates |
| Save/Load | ✅ Active | IndexedDB with Map/Set serialization |

### Test Coverage

| Test File | Tests |
|-----------|-------|
| `Button.test.tsx` | 9 |
| `Modal.test.tsx` | 7 |
| `pathfinding.test.ts` | 15 |
| `unitStacking.test.ts` | 18 |
| `cityGrowth.test.ts` | 29 |
| `FogOfWar.test.ts` | 8 |
| `combat.test.ts` | 38 |
| `gameEngine.test.ts` | 32 |
| `tech.test.ts` | 42 |
| `era.test.ts` | 45 |
| `victory.test.ts` | 23 |
| **Total** | **266** |

### Known Issues

| Issue | Severity |
|-------|----------|
| Production completion doesn't spawn units/buildings | Medium |
| `VictorySystem.checkAgeVictory()` always returns `false` (stub) | Medium |
| No fog of war in UI (`FogOfWar.ts` tested but not wired to canvas) | Low |
| No tech/civic/religion/trade UI panels | Medium |
| `GameEngine` class disconnected from live game loop | Low |
| Save/load Map serialization — format changes break existing saves | Medium |
| No sound | Low |
| No multiplayer | Low |

### TDD Approach

The project follows Red-Green-Refactor: write a failing test, write minimal code to pass it, then refactor. All new features should have tests before implementation. Run `npm run test` after each change to keep the suite green.

### Technical Decisions

| Decision | Choice | Rationale |
|----------|--------|-----------|
| UI Framework | React 19 | Mature, great ecosystem |
| Language | TypeScript 5 | Type safety critical for game logic |
| Build Tool | Vite 8 | Fast dev experience |
| State Management | Zustand + Immer | Lightweight, direct mutation in actions |
| Rendering | Canvas 2D | Works on all devices without WebGL |
| Persistence | IndexedDB (`idb`) | Client-side, handles large game state |
| Unit Testing | Vitest 4 | Fast, native ESM, Vite-compatible |
| E2E Testing | Playwright | Reliable cross-browser automation |
| Hex Grid | Offset coordinates | Even/odd row distinction for neighbor calc |
