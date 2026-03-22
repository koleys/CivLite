# AGENTS.md - CivLite Development Guide

## Project Overview

CivLite is a browser-based 4X strategy game inspired by Civilization VII, built with React 18+, TypeScript, and Zustand for state management.

---

## Build, Lint, and Test Commands

### Installation
```bash
npm install
```

### Development
```bash
npm run dev          # Start development server
npm run build        # Production build
npm run preview      # Preview production build locally
```

### Linting and Type Checking
```bash
npm run lint         # Run ESLint
npm run lint:fix     # Fix linting errors automatically
npm run typecheck    # TypeScript type checking
```

### Testing
```bash
npm run test              # Run all tests
npm run test:watch        # Watch mode for development
npm run test:coverage     # Run tests with coverage report
npm run test -- <pattern> # Run specific test file (e.g., -- GameEngine.test.ts)
```

---

## Code Style Guidelines

### TypeScript

- **Strict mode enabled** - No implicit any, strict null checks
- **Prefer interfaces** for object shapes; use `type` for unions/intersections
- **Avoid `any`** - Use `unknown` and proper type narrowing instead
- **Use readonly** for immutable arrays/objects: `readonly string[]`
- **Explicit return types** for public functions, internal functions may infer

```typescript
// Good
interface Unit {
  readonly id: string;
  readonly type: UnitType;
  health: number;
}

type YieldType = 'food' | 'production' | 'gold' | 'science' | 'culture' | 'faith';

// Avoid
interface Unit {
  id: string;
  type: any;
  health: number;
}
```

### Imports

- **Sort imports**: External packages → Internal modules → Relative imports
- **Use absolute imports** via `@/` alias for src/ directory
- **Named exports preferred** - Use `export const` or `export function`
- **Barrel exports** (`index.ts`) for public APIs per module

```typescript
import { useState, useCallback } from 'react';
import { useGameStore } from '@/store/gameStore';
import type { Unit, City } from '@/game/entities';
import { CombatResolver } from './CombatResolver';
```

### Naming Conventions

| Type | Convention | Example |
|------|------------|---------|
| Files | kebab-case | `game-engine.ts`, `city-panel.tsx` |
| React Components | PascalCase | `UnitPanel.tsx`, `TechTree.tsx` |
| Interfaces | PascalCase + optional I prefix | `IUnit`, `GameState` |
| Functions | camelCase, verb-prefixed | `calculateDamage()`, `moveUnit()` |
| Constants | SCREAMING_SNAKE | `MAX_UNIT_STACK_SIZE`, `ERA_SCORE_THRESHOLD` |
| Enum values | kebab-case or PascalCase | `VictoryType.DOMINATION`, `'science-victory'` |
| CSS variables | kebab-case | `--color-player-gold`, `--spacing-md` |
| TypeScript types | PascalCase | `TerrainType`, `ImprovementType` |

### React Components

- **Functional components** with hooks only - no class components
- **Colocate** component-specific hooks and utilities in same directory
- **Prop types via TypeScript interfaces** - no PropTypes
- **Destructuring props** for clarity

```typescript
interface CityPanelProps {
  cityId: string;
  onClose: () => void;
}

export function CityPanel({ cityId, onClose }: CityPanelProps) {
  const city = useGameStore((s) => selectCity(s, cityId));
  // ...
}
```

### State Management (Zustand)

- **Selectors** for derived data - avoid selector functions in render
- **Slice pattern**: Separate concerns in store, use subslices
- **Immer** enabled by default - mutate state directly when inside

```typescript
// Selectors defined outside component
const selectCityPopulation = (state: GameState) => 
  state.players.flatMap(p => p.cities).reduce((sum, c) => sum + c.population, 0);

export const useGameStore = create<GameState>()(
  devtools(
    persist(
      (set, get) => ({
        // State
        turn: 0,
        players: [],
        
        // Actions
        advanceTurn: () => set((s) => ({ turn: s.turn + 1 })),
      }),
      { name: 'civlite-game' }
    ),
    { name: 'GameStore' }
  )
);
```

### Error Handling

- **Try-catch with typed errors** for async operations
- **Custom error classes** for domain-specific errors
- **Error boundaries** for React component errors
- **Fallback UI** for loading/error states

```typescript
class CombatError extends Error {
  constructor(
    message: string,
    public readonly attackerId: string,
    public readonly defenderId: string
  ) {
    super(message);
    this.name = 'CombatError';
  }
}

// Usage
try {
  CombatResolver.resolve(attacker, defender);
} catch (e) {
  if (e instanceof CombatError) {
    logCombatError(e.attackerId, e.defenderId);
  }
  throw e;
}
```

### Game Engine Conventions

- **Immutable updates** for game state in systems
- **Event-driven architecture** for game actions
- **Action delta pattern** for undo system (store only changes)
- **Checksum validation** for save/load integrity

```typescript
// Game actions should return deltas
interface GameAction {
  type: string;
  payload: unknown;
  delta: Partial<GameState>; // Only changed fields
  timestamp: number;
}

// Example action
const moveUnit = (unitId: string, x: number, y: number): GameAction => ({
  type: 'MOVE_UNIT',
  payload: { unitId, x, y },
  delta: {
    players: [{ /* updated player state */ }]
  },
  timestamp: Date.now(),
});
```

### Data Files (JSON)

- **Strict typing** - Define TypeScript interfaces matching JSON schemas
- **Validation** - Validate JSON on load, throw on schema mismatch
- **Source of truth** - JSON data is read-only at runtime

### Performance Guidelines

- **Memoize expensive calculations** (pathfinding, visibility checks)
- **Virtual lists** for long lists (tech tree, policy cards)
- **Web Workers** for heavy computation (map generation)
- **RequestAnimationFrame** for game loop timing
- **Target FPS by quality preset**: Lite=30, Medium=45, High=60

---

## Architecture Overview

```
src/
├── components/
│   ├── game/        # Game UI (MapCanvas, CityPanel, UnitPanel, etc.)
│   ├── ui/          # Shared (Button, Modal, Tooltip, etc.)
│   └── menus/       # Screens (MainMenu, GameSetup, Settings)
├── game/
│   ├── engine/      # Core logic (GameEngine, CombatResolver, AI/)
│   ├── entities/    # Domain objects (Unit, City, Tile, etc.)
│   ├── systems/     # Game systems (Tech, Religion, Trade, Victory)
│   └── data/        # JSON game data (civilizations.json, units.json)
├── store/           # Zustand stores (gameStore, uiStore, settingsStore)
├── network/         # Multiplayer (SocketManager, StateDelta)
├── shaders/         # WebGL shaders (Medium/High quality)
└── utils/           # Helpers (pathfinding, combatCalc, seedUtils)
```

---

## File Naming Patterns

| Pattern | Usage | Example |
|---------|-------|---------|
| `{name}.tsx` | React components | `UnitPanel.tsx` |
| `{name}.ts` | Utilities, hooks, stores | `pathfinding.ts`, `useGameStore.ts` |
| `{name}.json` | Static game data | `civilizations.json`, `units.json` |
| `{name}.vert/.frag` | GLSL shaders | `terrain.vert` |
| `index.ts` | Barrel exports | `entities/index.ts` |

---

## Git Conventions

### MCP Server for GitHub Operations
All GitHub operations MUST use the GitHub MCP server tools (do NOT use raw git commands for GitHub operations). Available tools:
- `github_list_branches`, `github_create_branch`, `github_delete_file`
- `github_create_pull_request`, `github_update_pull_request`, `github_merge_pull_request`
- `github_pull_request_read`, `github_list_pull_requests`, `github_search_pull_requests`
- `github_issue_read`, `github_issue_write`, `github_search_issues`
- `github_list_commits`, `github_get_commit`, `github_push_files`, `github_create_or_update_file`
- `github_get_file_contents`, `github_search_code`, `github_search_repositories`
- `github_list_releases`, `github_get_latest_release`, `github_search_users`
- `github_get_me`, `github_get_teams`, `github_get_team_members`
- `github_request_copilot_review`, `github_assign_copilot_to_issue`
- `github_add_issue_comment`, `github_add_comment_to_pending_review`, `github_add_reply_to_pull_request_comment`
- `github_pull_request_review_write`

### Branch Naming
- `feature/{name}`, `fix/{issue}`, `refactor/{name}`
- Example: `feature/unit-combat`, `fix/city-growth`

### Commit Messages
- Conventional Commits format: `feat:`, `fix:`, `docs:`, `refactor:`, `test:`
- Example: `feat: add combat resolver`, `fix: resolve city growth calculation`
- Use present tense: "add" not "added", "fix" not "fixed"

### Commit & Push Workflow (ALWAYS FOLLOW THIS ORDER)

**Step 1: Check remote branch exists**
Before committing, use `github_list_branches` to check if the remote branch exists.

**Step 2: If remote branch exists - pull first**
```bash
git pull origin <branch-name>
```
If remote exists, always pull before pushing to avoid conflicts.

**Step 3: If remote branch does NOT exist - inform the user**
Tell the user: "Remote branch `<branch-name>` does not exist. Creating it on push."

**Step 4: Show files to be pushed and request approval**
Before any push, display the list of files that will be pushed. Ask the user to explicitly approve before proceeding.

Example prompt to user:
```
The following files will be pushed to `<branch-name>`:
- src/game/engine/CombatResolver.ts
- src/game/entities/Unit.ts

Do you approve this push? (yes/no)
```

**Step 5: Create commit and push**
- Stage files with `git add <files>`
- Create commit with `git commit -m "<message>"`
- Push with `git push -u origin <branch-name>` (or `git push` if branch already exists)

**Step 6: Always push every commit**
Never leave commits un-pushed. Every commit MUST be pushed to the remote repository.

### PR Title
Clear description of change. Use the same Conventional Commits format.

### Never Commit
- `node_modules/`, `.env`, `*.log`, `secrets`, `credentials.json`
- API keys, tokens, or any sensitive data
- Build artifacts (`dist/`, `build/`, `*.min.js`)

---

## Key Technical Decisions

1. **Quality presets**: Canvas 2D (Lite), WebGL 2x (Medium), WebGL 4x (High)
2. **No backend for MVP**: All logic runs client-side; IndexedDB for saves
3. **OpenRouter AI**: LLM-based AI with fallback to built-in random strategy
4. **Turn modes**: Sequential (default) and Simultaneous for multiplayer
5. **Undo system**: Stores action deltas (not full state) for last 10 turns

---

## Important Spec References

- **Three-Age System**: SPEC.md Section 2.1 - Antiquity/Exploration/Modern transitions
- **Combat Formula**: SPEC.md Section 3.5.2 - Damage calculations with promotions
- **Victory Conditions**: SPEC.md Section 2.5 - All 6 victory types
- **Era Score**: SPEC.md Section 3.1 - Unlock tiers, carry-over mechanics
- **Save Migration**: SPEC.md Section 5.4.5 - Version upgrades

---

## Common Patterns

### Canvas/WebGL Rendering
```typescript
// Quality-aware rendering setup
const quality = settingsStore.getState().quality;
if (quality === 'lite') {
  renderer = new Canvas2DRenderer(canvas);
} else {
  renderer = new WebGLRenderer(canvas, quality === 'high' ? 4 : 2);
}
```

### Tile Coordinates
```typescript
interface TileCoord {
  x: number;  // Column (0-based from west)
  y: number;  // Row (0-based from north)
}
```

### Unit Stacking
```typescript
const MAX_UNIT_STACK = 3;  // Military units per tile
const MAX_CIVILIAN_STACK = 1;  // Plus 1 escort
```
