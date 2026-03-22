# Technology Stack - CivLite

This document summarizes the technologies used to develop and deploy CivLite.

---

## Technology Overview

CivLite is a browser-based 4X strategy game that runs entirely on the client-side with optional multiplayer support. The tech stack emphasizes performance, type safety, and cross-platform browser compatibility.

---

## Frontend Technologies

### Core Framework

| Technology | Version | Purpose | Rationale |
|------------|---------|---------|------------|
| **React** | 18.x | UI library | Component-based architecture, excellent ecosystem |
| **TypeScript** | 5.x | Programming language | Type safety, better IDE support, fewer runtime errors |
| **Vite** | 5.x | Build tool & dev server | Fast HMR, optimized builds, modern tooling |

### State Management

| Technology | Purpose | Alternative Considered |
|------------|---------|----------------------|
| **Zustand** | Global state management | Redux Toolkit (heavier, more boilerplate) |

**Why Zustand:**
- Minimal boilerplate
- Built-in Immer support for immutable updates
- Excellent TypeScript support
- Smaller bundle size than Redux

### UI & Styling

| Technology | Purpose |
|------------|---------|
| **CSS Modules** or **CSS-in-JS** | Component-scoped styling |
| **CSS Variables** | Theme customization (quality presets) |

---

## Rendering & Graphics

### Quality Presets

| Preset | Renderer | Target FPS | Memory | Use Case |
|--------|----------|-----------|--------|----------|
| **Lite** | Canvas 2D | 30 fps | <300 MB | Integrated graphics, low-end devices |
| **Medium** | WebGL 2x | 45 fps | <500 MB | Mid-range laptops |
| **High** | WebGL 4x | 60 fps | <800 MB | Discrete GPU gaming |

### Graphics Pipeline

```
┌─────────────────────────────────────────────────────────────┐
│                    Quality Preset Selection                  │
│  (Auto-detect via hardwareConcurrency, WebGL info)          │
└─────────────────────┬───────────────────────────────────────┘
                      │
        ┌─────────────┼─────────────┐
        ▼             ▼             ▼
   ┌─────────┐   ┌─────────┐   ┌─────────┐
   │  Canvas │   │ WebGL   │   │ WebGL   │
   │   2D    │   │   2x    │   │   4x    │
   │  Sprite │   │ Shader  │   │ Shader  │
   │ Render  │   │ Render  │   │ Render  │
   └─────────┘   └─────────┘   └─────────┘
```

### WebGL Shaders (Medium/High Quality)

| Shader | Purpose |
|--------|---------|
| `terrain.vert/frag` | Tile rendering with height, lighting |
| `unit.vert/frag` | Unit sprites with animations |

---

## Game Engine Components

### Core Systems

```
Game Engine
├── TurnManager          # Turn sequencing (sequential/simultaneous)
├── TileManager          # Tile operations, visibility
├── CombatResolver       # Damage calculations (SPEC Section 3.5.2)
├── MapGenerator         # Procedural map generation
├── Pathfinding          # A* implementation for unit movement
├── FogOfWar             # Visibility per difficulty setting
├── SaveManager          # IndexedDB save/load with checksum
├── UndoManager          # Action delta storage (last 10 turns)
└── AI/
    ├── AIDirector       # AI coordinator
    ├── AIRandomStrategy # Built-in fallback AI
    └── OpenRouterAI     # LLM-based AI via OpenRouter API
```

### Game Systems

| System | Purpose |
|--------|---------|
| **TechSystem** | Technology tree, Eureka triggers |
| **ReligionSystem** | Pantheon, religion founding, beliefs |
| **TradeSystem** | Trade routes, yields |
| **VictorySystem** | 6 victory conditions tracking |
| **EraSystem** | Age transitions, Legacy Paths |
| **BarbarianSystem** | Camp spawning, unit patrols |
| **UnitPromotionSystem** | XP tracking, promotion trees |
| **GreatWorksSystem** | Great Person storage, theming |
| **CrisisSystem** | World Congress, emergency events |

---

## Data Management

### Static Game Data (JSON)

| File | Purpose |
|------|---------|
| `civilizations.json` | Civ definitions, UBs, UUs |
| `leaders.json` | Leader bonuses, personalities |
| `technologies.json` | Tech costs, tree, eurekas |
| `units.json` | Unit stats, promotions, costs |
| `buildings.json` | Building costs, effects |
| `wonders.json` | Wonder costs, global effects |
| `policies.json` | Government policies |
| `cityStates.json` | 18 city-state definitions |
| `mapBiomes.json` | Terrain generation weights |
| `naturalWonders.json` | Wonder locations and bonuses |

### Runtime Data

| Storage | Technology | Purpose |
|---------|-----------|---------|
| **Game State** | Zustand + Immer | In-memory reactive state |
| **Saves** | IndexedDB | Browser-local persistence |
| **Settings** | localStorage | User preferences |
| **AI Config** | localStorage (Base64) | OpenRouter API key |

---

## Multiplayer Architecture

### Technologies

| Component | Technology | Purpose |
|-----------|-----------|---------|
| **Real-time Communication** | WebSocket (Socket.io) | Turn sync, chat |
| **State Sync** | StateDelta compression | Efficient updates |
| **Game Coordinator** | Node.js server | Turn validation |

### Multiplayer Modes

1. **Hot-seat**: Turn-based, same machine, no network
2. **Online**: WebSocket-based, synchronized turns
3. **Sequential Turns**: Player 1 → Player 2 → ... → Turn advances
4. **Simultaneous Turns**: All players act, then resolve

### Sync Protocol

```
Turn End
    │
    ▼
┌─────────────────────────────────┐
│  Calculate State Delta          │
│  (Only changed fields)          │
└─────────────────┬───────────────┘
                  │
                  ▼
┌─────────────────────────────────┐
│  Broadcast Delta to Players    │
│  via WebSocket                  │
└─────────────────┬───────────────┘
                  │
                  ▼
┌─────────────────────────────────┐
│  Checkpoint every 10 turns     │
│  (Full state snapshot)          │
└─────────────────────────────────┘
```

---

## Development & Build Tools

### Build Pipeline

```
Source Code (TypeScript)
        │
        ▼
    ┌─────────────────────────────────┐
    │  Vite Dev Server / Build        │
    │  - TypeScript compilation       │
    │  - ESBuild bundling            │
    │  - Hot Module Replacement      │
    └────────────────┬────────────────┘
                     │
        ┌────────────┴────────────┐
        ▼                         ▼
  ┌─────────────┐           ┌─────────────┐
  │ Development │           │ Production  │
  │ (HMR, fast) │           │ (minified,   │
  │             │           │  optimized) │
  └─────────────┘           └─────────────┘
```

### Linting & Quality

| Tool | Purpose |
|------|---------|
| **ESLint** | JavaScript/TypeScript linting |
| **Prettier** | Code formatting |
| **TypeScript** | Static type checking |

### Testing

| Tool | Purpose |
|------|---------|
| **Vitest** | Unit and integration testing |
| **React Testing Library** | Component testing |

---

## Deployment

### Deployment Targets

| Environment | Platform | Notes |
|-------------|----------|-------|
| **Web (Primary)** | Static hosting (Vercel, Netlify, GitHub Pages) | SPA deployment |
| **Node.js Server** | VPS or cloud (optional for multiplayer) | WebSocket server |

### Build Outputs

```
dist/
├── index.html          # Entry point
├── assets/
│   ├── js/             # Bundled JavaScript
│   ├── css/            # Compiled CSS
│   └── assets/         # Static game assets
└── favicon.ico
```

### Browser Compatibility

| Browser | Min Version | WebGL Level |
|---------|------------|-------------|
| Chrome | 110+ | WebGL 2.0 |
| Firefox | 115+ | WebGL 2.0 |
| Safari | 16+ | WebGL 2.0 |
| Edge | 110+ | WebGL 2.0 |

---

## Performance Targets

| Metric | Lite | Medium | High |
|--------|------|--------|------|
| **Frame Rate** | 30 fps | 45 fps | 60 fps |
| **Initial Load** | <3s | <5s | <8s |
| **Turn Processing** | <300ms | <500ms | <800ms |
| **Save/Load** | <1s | <2s | <3s |
| **Memory Usage** | <300MB | <500MB | <800MB |

---

## Future Technologies (Post-MVP)

| Technology | Phase | Purpose |
|------------|-------|---------|
| **PostgreSQL** | Phase 6 | Cloud saves, leaderboards |
| **Web Workers** | Phase 5 | Offload map generation |
| **WebRTC** | Phase 3 | P2P multiplayer (optional) |
| **Service Workers** | Phase 5 | Offline support |

---

## Technology Decision Summary

| Decision | Choice | Rationale |
|----------|--------|-----------|
| UI Framework | React 18 | Mature, great ecosystem |
| Language | TypeScript 5 | Type safety critical for game logic |
| Build Tool | Vite | Fast dev experience |
| State Management | Zustand | Lightweight, Immer support |
| Rendering | Canvas 2D + WebGL | Quality presets for all hardware |
| Multiplayer | Socket.io | Reliable WebSocket abstraction |
| Saves | IndexedDB | Client-side persistence |
| AI | OpenRouter LLM + Random fallback | Smart AI with graceful degradation |
