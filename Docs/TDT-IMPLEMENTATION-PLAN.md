# CivLite Technical Implementation Plan
## Test-Driven Development (TDD) Approach

---

## Document Information
- **Project**: CivLite - Browser-Based Civilization Clone
- **Based on**: SPEC.md v3.69
- **Approach**: Test-Driven Development (TDD)
- **Last Updated**: March 2026

---

## TDD Core Principles

1. **Red-Green-Refactor Cycle**: Write failing test → Write minimal code to pass → Refactor
2. **Test First**: All features require tests before implementation
3. **Incremental Development**: Build incrementally from foundation to full systems
4. **Continuous Verification**: Run tests after each phase milestone

---

## Phase 1: Foundation (MVP)
### Timeline: Months 1-4

#### 1.1 Project Setup

**Tests to Write:**
```typescript
// tests/setup/project.test.ts
- should initialize Vite + React + TypeScript project
- should have proper TypeScript strict mode configuration
- should have Zustand store setup
- should have Vitest configured
- should have testing utilities (React Testing Library)
```

**Implementation Tasks:**
- [ ] Initialize Vite project with React + TypeScript template
- [ ] Configure TypeScript strict mode (noImplicitAny, strictNullChecks)
- [ ] Install and configure Zustand for state management
- [ ] Set up Vitest with React Testing Library
- [ ] Configure ESLint and Prettier
- [ ] Set up path aliases (@/ for src/)

---

#### 1.2 Core Data Structures

**Tests to Write:**
```typescript
// tests/game/entities/types.test.ts
- should define all terrain types correctly
- should define all resource types correctly
- should define all improvement types correctly
- should define unit types with proper era classification
- should validate Tile interface structure
- should validate Unit interface structure
- should validate City interface structure
- should validate Player interface structure
- should validate GameState interface structure
```

**Implementation Tasks:**
- [ ] Create TypeScript interfaces for all entities (Section 5.3)
- [ ] Define type aliases for all game enums
- [ ] Create game data JSON schemas
- [ ] Implement validation functions for each entity type

---

#### 1.3 Map System & Tile Manager

**Tests to Write:**
```typescript
// tests/game/mapGenerator.test.ts
- should generate map with correct dimensions for each size
- should place terrain based on biome weights
- should distribute resources according to rarity rules
- should place city-states at valid locations
- should place starting positions at valid distances
- should generate consistent maps from same seed
- should generate unique maps from different seeds
```

**Implementation Tasks:**
- [ ] Implement MapGenerator class (Section 5.1)
- [ ] Implement TileManager for tile operations
- [ ] Implement terrain generation algorithms
- [ ] Implement resource distribution system
- [ ] Implement map seeding and reproducibility

---

#### 1.4 Pathfinding System

**Tests to Write:**
```typescript
// tests/game/pathfinding.test.ts
- should find shortest path between two tiles
- should respect terrain movement costs
- should return null for unreachable destinations
- should account for embarked units (shallow vs deep water)
- should respect impassable terrain
- should account for friendly/enemy unit blocking
- should return path with correct tile sequence
```

**Implementation Tasks:**
- [ ] Implement A* pathfinding algorithm
- [ ] Implement terrain movement cost calculation
- [ ] Implement embarked unit movement rules
- [ ] Implement ZOC (Zone of Control) penalties

---

#### 1.5 Turn System & Game Loop

**Tests to Write:**
```typescript
// tests/game/gameEngine.test.ts
- should initialize game with correct starting state
- should increment turn counter after all players complete
- should process player turns in correct order
- should handle AI turns
- should trigger end-game conditions correctly
- should save game state at turn boundaries
- should load saved game correctly
```

**Implementation Tasks:**
- [ ] Implement GameEngine class
- [ ] Implement TurnManager for turn sequencing
- [ ] Implement player turn processing
- [ ] Implement AI turn delegation
- [ ] Implement turn-end triggers (victory, age transition)

---

#### 1.6 Unit System

**Tests to Write:**
```typescript
// tests/game/unit.test.ts
- should create unit with correct stats
- should move unit to valid adjacent tile
- should not move unit to invalid tile
- should respect movement point limits
- should consume movement points correctly
- should stack units according to stacking rules
- should not stack civilian with military (except settler escort)
- should disband unit correctly
- should upgrade unit with correct cost calculation
```

**Implementation Tasks:**
- [ ] Implement Unit entity class
- [ ] Implement movement validation
- [ ] Implement unit stacking rules (Section 3.5.3)
- [ ] Implement unit upgrade system (Section 3.10.9)

---

#### 1.7 City Management

**Tests to Write:**
```typescript
// tests/game/city.test.ts
- should found city at valid location
- should calculate city growth correctly
- should calculate food stockpile correctly
- should trigger housing limit effects
- should calculate amenities requirements
- should assign citizens to worked tiles
- should process build queue correctly
- should calculate city yields correctly
- should found city on valid distance from other cities
```

**Implementation Tasks:**
- [ ] Implement City entity class
- [ ] Implement city founding rules (Section 3.10.1)
- [ ] Implement city growth calculations (Section 3.6.1)
- [ ] Implement citizen assignment system
- [ ] Implement build queue processing

---

#### 1.8 Tile Improvement System

**Tests to Write:**
```typescript
// tests/game/improvement.test.ts
- should build improvement on valid tile
- should calculate build time correctly
- should apply improvement yields correctly
- should respect technology requirements
- should calculate adjacent bonuses correctly
- should not build on invalid terrain
- should remove improvement when city captured
```

**Implementation Tasks:**
- [ ] Implement tile improvement rules (Section 3.6.4)
- [ ] Implement improvement validity checks
- [ ] Implement adjacent bonus calculations
- [ ] Implement resource-specific improvements

---

#### 1.9 Fog of War System

**Tests to Write:**
```typescript
// tests/game/fogOfWar.test.ts
- should reveal tiles within sight radius
- should mark tiles as 'seen' when exited
- should hide tiles outside sight radius
- should respect difficulty sight modifiers
- should calculate city sight radius correctly
- should calculate unit sight radius correctly
- should apply Cheat Mode visibility rules
```

**Implementation Tasks:**
- [ ] Implement FogOfWar calculator (Section 2.4.5)
- [ ] Implement visibility recalculation
- [ ] Implement difficulty-based sight modifiers
- [ ] Implement seen tile memory

---

#### 1.10 Save/Load System

**Tests to Write:**
```typescript
// tests/game/saveManager.test.ts
- should serialize game state to JSON
- should deserialize game state correctly
- should calculate SHA-256 checksum on save
- should validate checksum on load
- should handle corrupted save gracefully
- should load auto-backup on corruption
- should perform version migration correctly
- should trigger auto-save at correct intervals
```

**Implementation Tasks:**
- [ ] Implement SaveManager class (Section 5.4)
- [ ] Implement IndexedDB storage
- [ ] Implement checksum validation
- [ ] Implement corruption recovery
- [ ] Implement save migration system

---

#### 1.11 Canvas 2D Map Renderer

**Tests to Write:**
```typescript
// tests/renderer/canvas2d.test.ts
- should render terrain tiles correctly
- should render resource icons correctly
- should render improvements correctly
- should render units on tiles
- should render cities with correct visuals
- should render fog of war overlay
- should render selection highlight
- should render movement range overlay
- should render path preview
- should handle pan/zoom correctly
```

**Implementation Tasks:**
- [ ] Implement Canvas2DRenderer class
- [ ] Implement tile rendering with terrain sprites
- [ ] Implement unit/city rendering
- [ ] Implement overlay rendering (selection, fog, paths)
- [ ] Implement camera controls (pan, zoom)

---

#### 1.12 UI Components (Foundation)

**Tests to Write:**
```typescript
// tests/components/ui.test.ts
- should render Button with correct variants
- should render Modal with overlay
- should render Tooltip on hover
- should render Dropdown with options
- should render Slider with value changes
- should render Tab navigation
- should render ProgressBar with correct fill
- should render Badge with correct styling
```

**Implementation Tasks:**
- [ ] Implement Button component
- [ ] Implement Modal component
- [ ] Implement Tooltip component
- [ ] Implement Dropdown component
- [ ] Implement Slider component
- [ ] Implement Tab component
- [ ] Implement ProgressBar component
- [ ] Implement Badge component

---

#### 1.13 Game UI Components (Foundation)

**Tests to Write:**
```typescript
// tests/components/game.test.ts
- should render TopBar with correct info
- should render Minimap with correct map display
- should render UnitPanel for selected unit
- should render CityPanel for selected city
- should render NotificationPanel with events
- should render VictoryProgress tracker
- should update UI when game state changes
```

**Implementation Tasks:**
- [ ] Implement TopBar component
- [ ] Implement Minimap component
- [ ] Implement UnitPanel component
- [ ] Implement CityPanel component
- [ ] Implement NotificationPanel component
- [ ] Implement VictoryProgress component

---

#### 1.14 Menu Screens

**Tests to Write:**
```typescript
// tests/components/menus.test.ts
- should render MainMenu with all options
- should navigate to GameSetup from MainMenu
- should render GameSetup with all options
- should validate GameSetup inputs
- should start new game with selected settings
- should load saved game from Continue
- should navigate to Settings from MainMenu
- should apply settings correctly
```

**Implementation Tasks:**
- [ ] Implement MainMenu component
- [ ] Implement GameSetup component
- [ ] Implement Settings component
- [ ] Implement LoadingScreen component
- [ ] Implement game initialization flow

---

### Phase 1 Acceptance Tests (MVP Milestone)

```typescript
// tests/integration/mvp.test.ts
- should start a new game from main menu
- should generate a playable map
- should move units on valid tiles
- should found a new city
- should grow a city over turns
- should build tile improvements
- should save and load game
- should display fog of war correctly
- should process a complete turn
- should display basic UI panels
```

---

## Phase 2: Core Gameplay
### Timeline: Months 5-7

#### 2.1 Combat System

**Tests to Write:**
```typescript
// tests/game/combat.test.ts
- should calculate damage using combat formula
- should apply terrain bonuses correctly
- should apply fortification bonuses correctly
- should apply fortification multiplier formula
- should apply ZOC penalties correctly
- should apply ranged movement penalties
- should apply charge bonuses correctly
- should apply promotions correctly
- should apply difficulty modifiers
- should apply minimum damage (1)
- should trigger nuclear weapon automatic destruction
- should handle nuclear weapon effects (blast radius, fallout)
```

**Implementation Tasks:**
- [ ] Implement CombatResolver (Section 3.5.2)
- [ ] Implement terrain bonus calculations
- [ ] Implement fortification system
- [ ] Implement promotion effects
- [ ] Implement nuclear weapons (Section 3.5.2.1)

---

#### 2.2 Barbarian System

**Tests to Write:**
```typescript
// tests/game/barbarian.test.ts
- should spawn initial camps at game start
- should spawn camps at valid distances from players
- should maintain minimum camp spacing
- should spawn units at correct intervals
- should scale unit strength with difficulty
- should trigger scout patrol behavior
- should spawn raiders when scout succeeds
- should spawn leaders with correct probability
- should apply era scaling to camps
- should cap camp count at 8 maximum
- should award correct Era Score for kills
```

**Implementation Tasks:**
- [ ] Implement BarbarianSystem (Section 3.5.4)
- [ ] Implement camp spawning logic
- [ ] Implement unit spawning from camps
- [ ] Implement scout/raider behavior
- [ ] Implement leader mechanics

---

#### 2.3 Unit Promotions System

**Tests to Write:**
```typescript
// tests/game/promotion.test.ts
- should award XP for combat
- should unlock promotions at correct XP thresholds
- should apply promotion bonuses correctly
- should allow promotion tree branching
- should apply class-specific promotions
- should not duplicate promotions
- should persist promotions through upgrade
```

**Implementation Tasks:**
- [ ] Implement UnitPromotionSystem (Section 3.5.5)
- [ ] Implement XP calculation
- [ ] Implement promotion tree
- [ ] Implement promotion application

---

#### 2.4 Technology Tree

**Tests to Write:**
```typescript
// tests/game/techTree.test.ts
- should research technologies in valid order
- should apply Eureka triggers correctly
- should apply Eureka bonuses (50% cost reduction)
- should unlock correct units/buildings
- should calculate tech costs with modifiers
- should persist research progress across turns
- should apply speed modifiers (Online/Standard/Marathon)
- should complete tech tree progression
```

**Implementation Tasks:**
- [ ] Implement TechSystem (Section 3.3)
- [ ] Implement tech tree structure
- [ ] Implement Eureka triggers
- [ ] Implement research calculations

---

#### 2.5 Civic Tree

**Tests to Write:**
```typescript
// tests/game/civicTree.test.ts
- should progress civics in valid order
- should apply Inspiration triggers correctly
- should apply Inspiration bonuses (50% cost reduction)
- should unlock correct policies and governments
- should calculate civic costs with modifiers
- should persist civic progress across turns
```

**Implementation Tasks:**
- [ ] Implement CivicTree parallel to tech tree
- [ ] Implement inspiration triggers
- [ ] Implement policy unlock system

---

#### 2.6 Government System

**Tests to Write:**
```typescript
// tests/game/government.test.ts
- should adopt government at game start
- should change government with correct cost
- should apply government bonuses correctly
- should unlock policy slots by government type
- should apply policy slot tier restrictions (15/25 Era Score)
- should calculate government change cost by era
```

**Implementation Tasks:**
- [ ] Implement GovernmentSystem (Section 3.4)
- [ ] Implement government adoption
- [ ] Implement policy card system
- [ ] Implement slot tier restrictions

---

#### 2.7 Era System

**Tests to Write:**
```typescript
// tests/game/era.test.ts
- should track Era Score correctly
- should award Era Score for all actions
- should unlock policy tiers at correct thresholds
- should apply carry-over bonus when Era Score >= 20
- should trigger voluntary age transition with 2+ objectives
- should force age transition at turn limit
- should apply Age Victory bonus (+50) correctly
- should apply forced transition penalty (-20) when <2 objectives
- should reset Era Score at age transition
- should transition between all three ages
```

**Implementation Tasks:**
- [ ] Implement EraSystem (Section 3.1)
- [ ] Implement Era Score tracking
- [ ] Implement age transition logic
- [ ] Implement Age Victory calculation

---

#### 2.8 Legacy Path System

**Tests to Write:**
```typescript
// tests/game/legacyPath.test.ts
- should select 3 objectives at age start
- should track objective progress correctly
- should validate completed objectives
- should trigger Age Victory when all 3 complete
- should auto-select objectives on forced transition (<2 completed)
- should apply cross-era synergies correctly
- should award synergy bonuses at transition
```

**Implementation Tasks:**
- [ ] Implement LegacyPath objectives for each age
- [ ] Implement objective tracking
- [ ] Implement cross-era synergy calculation

---

#### 2.9 Religion System

**Tests to Write:**
```typescript
// tests/game/religion.test.ts
- should award Great Prophet points correctly
- should found pantheon at 20 Faith (first player)
- should found religion at 8 Prophet points (first player)
- should select religion beliefs correctly
- should spread religion with missionaries
- should spread religion with apostles (including combat)
- should remove heresy with inquisitors
- should check religious victory conditions
- should disable religious victory at Modern Age start
- should calculate religion followers correctly
```

**Implementation Tasks:**
- [ ] Implement ReligionSystem (Section 3.8)
- [ ] Implement pantheon founding
- [ ] Implement religion founding
- [ ] Implement religious unit mechanics
- [ ] Implement religious victory check

---

#### 2.10 Trade System

**Tests to Write:**
```typescript
// tests/game/trade.test.ts
- should establish trade routes between valid cities
- should calculate trade route yields correctly
- should apply base yield + modifiers formula
- should award Era Score for international routes (>=10 tiles)
- should not award Era Score for domestic routes
- should calculate route capacity correctly (2 + pop/50)
- should cancel routes on city capture/destruction
- should handle Treasure Fleet yields (Exploration+)
- should implement colonial settlement bonuses
```

**Implementation Tasks:**
- [ ] Implement TradeSystem (Section 3.7)
- [ ] Implement trade route establishment
- [ ] Implement yield calculation
- [ ] Implement Treasure Fleet mechanics

---

#### 2.11 Built-in Random AI

**Tests to Write:**
```typescript
// tests/game/ai/random.test.ts
- should select strategy at game start
- should re-roll strategy every 20 turns
- should execute actions based on selected strategy
- should not exceed unit cap limits
- should build valid units/buildings
- should attack valid targets
- should found cities at valid locations
```

**Implementation Tasks:**
- [ ] Implement AIRandomStrategy (Section 5.6)
- [ ] Implement strategy selection
- [ ] Implement action execution

---

### Phase 2 Acceptance Tests

```typescript
// tests/integration/coreGameplay.test.ts
- should resolve combat with all modifiers
- should spawn and manage barbarian camps
- should earn and apply unit promotions
- should research full technology tree
- should progress through civic tree
- should adopt and change governments
- should earn Era Score and trigger age transitions
- should found and spread religions
- should establish and manage trade routes
- should play against AI opponent
```

---

## Phase 3: LLM AI + Multiplayer
### Timeline: Months 8-10

#### 3.1 OpenRouter AI Integration

**Tests to Write:**
```typescript
// tests/game/ai/openrouter.test.ts
- should store API key in localStorage (Base64 encoded)
- should test connection with valid key
- should handle 401 unauthorized error
- should handle 429 rate limit error (retry then fallback)
- should handle 500 server error (retry then fallback)
- should handle timeout (show overlay, offer cancel/wait/fallback)
- should handle empty response as timeout
- should fallback to built-in AI on all errors
- should build condensed meta prompt correctly
- should include turn history in context
- should parse AI response correctly
- should execute AI action correctly
- should detect offline mode automatically
```

**Implementation Tasks:**
- [ ] Implement OpenRouterAI (Section 5.5)
- [ ] Implement API key management
- [ ] Implement error handling
- [ ] Implement fallback chain
- [ ] Implement meta prompt builder
- [ ] Implement offline detection

---

#### 3.2 WebSocket Multiplayer Server

**Tests to Write:**
```typescript
// tests/network/multiplayer.test.ts
- should create game room with code
- should join existing room with code
- should synchronize initial game state
- should broadcast actions to all players
- should apply actions in correct order
- should handle sequential turn mode
- should handle simultaneous turn mode
- should detect and resolve conflicts
- should send state delta (not full state)
- should sync checkpoints every 10 turns
- should handle player disconnect (5-min timeout)
- should allow reconnection as observer
- should filter chat messages
```

**Implementation Tasks:**
- [ ] Implement SocketManager (Section 5.2)
- [ ] Implement LobbyManager
- [ ] Implement StateDelta sync
- [ ] Implement TurnCoordinator
- [ ] Implement reconnection handling
- [ ] Implement chat with filter

---

### Phase 3 Acceptance Tests

```typescript
// tests/integration/multiplayer.test.ts
- should connect LLM AI with valid API key
- should fallback to built-in AI on errors
- should create and join multiplayer room
- should synchronize game state across players
- should handle turn-based multiplayer
- should handle disconnect/reconnect gracefully
```

---

## Phase 4: Full Systems
### Timeline: Months 11-13

#### 4.1 Victory Conditions

**Tests to Write:**
```typescript
// tests/game/victory.test.ts
// Domination Victory
- should trigger when all original capitals controlled
- should not require captured original capital
- should eliminate civs when all cities captured
- should handle vassalage correctly
- should handle simultaneous domination (score tie-breaker)

// Science Victory
- should require all techs through Advanced Computing
- should require Launch Pad in Campus city
- should require 3 Rocket Parts in same city
- should allow parallel Rocket Part construction
- should trigger when Exoplanet Expedition launched

// Cultural Victory
- should calculate Tourism correctly per category
- should calculate Domestic Tourist threshold correctly
- should apply Open Borders bonus (+25%)
- should apply National Parks tourism (+10 each)
- should trigger when all civs have Domestic Tourists

// Religious Victory
- should trigger when >50% followers in all civs
- should disable at Modern Age start
- should handle Holy City conversion

// Diplomatic Victory
- should track World Congress votes (4/6 needed)
- should form World Congress at Exploration Age start
- should trigger crisis events every 30 turns
- should resolve crises correctly

// Age Victory
- should trigger when all 3 objectives complete
- should apply +50 bonus before reset
```

**Implementation Tasks:**
- [ ] Implement VictorySystem (Section 2.5)
- [ ] Implement all 6 victory conditions
- [ ] Implement victory progress tracking
- [ ] Implement victory tie-breaker

---

#### 4.2 City-States System

**Tests to Write:**
```typescript
// tests/game/cityStates.test.ts
- should spawn correct number of city-states (setting-based)
- should distribute envoys at correct intervals
- should calculate Suzerain correctly (3 envoys or 2 if uncontested)
- should apply Suzerain bonuses correctly
- should compete for Suzerain when envoys invested
- should track Suzerain Legacy Path objective
- should trigger Suzerain victory when all achieved
```

**Implementation Tasks:**
- [ ] Implement CityStateSystem (Section 3.6.3)
- [ ] Implement 18 city-state types
- [ ] Implement Suzerain mechanics
- [ ] Implement envoy distribution

---

#### 4.3 Great Works System

**Tests to Write:**
```typescript
// tests/game/greatWorks.test.ts
- should track Great Person points correctly
- should trigger Great Person appearance at thresholds
- should apply Great Person effects correctly
- should store Great Works in correct buildings
- should apply theming bonuses
- should apply National Parks (1 per terrain type)
- should apply Zoo amenities from National Parks
```

**Implementation Tasks:**
- [ ] Implement GreatWorksSystem (Section 3.9)
- [ ] Implement Great Person claiming
- [ ] Implement Great Works storage
- [ ] Implement National Parks

---

#### 4.4 Crisis System

**Tests to Write:**
```typescript
// tests/game/crisis.test.ts
- should trigger crisis events every 30 turns (Exploration+)
- should apply Zombie Outbreak effect correctly
- should apply Volcanic Winter effect correctly
- should apply Pirate Raid effect correctly
- should apply Plague effect correctly
- should resolve crisis favorably when majority acts
- should apply penalties on unfavorable resolution
- should award Era Score and Diplomatic Favor on resolution
```

**Implementation Tasks:**
- [ ] Implement CrisisSystem (Section 2.5.5)
- [ ] Implement crisis event generation
- [ ] Implement crisis resolution mechanics

---

#### 4.5 Three-Age Civilization Transitions

**Tests to Write:**
```typescript
// tests/game/civTransition.test.ts
- should present locked civilizations from previous age
- should present new civilizations for current age
- should calculate cross-era synergies correctly
- should award Tier 1/2/3 synergy bonuses
- should apply unique buildings from Tier 2 synergy
- should apply unique units from Tier 3 synergy
```

**Implementation Tasks:**
- [ ] Implement civilization transition UI
- [ ] Implement synergy calculation
- [ ] Implement synergy bonuses

---

#### 4.6 Tutorial Mode

**Tests to Write:**
```typescript
// tests/game/tutorial.test.ts
- should guide through 6 tutorial steps
- should highlight correct UI elements
- should validate player actions for each step
- should track tutorial progress
- should allow skip at any time
- should allow replay from Main Menu
- should reset tutorial state on reset
```

**Implementation Tasks:**
- [ ] Implement TutorialOverlay (Section 4.4)
- [ ] Implement 6 tutorial steps
- [ ] Implement progress tracking
- [ ] Implement reset functionality

---

#### 4.7 Cheat Mode System

**Tests to Write:**
```typescript
// tests/game/cheatMode.test.ts
- should enable cheat mode from Game Setup only
- should apply all multiplier sliders (1x-100x)
- should display "CHEAT" badge in top bar
- should NOT apply cheats to AI opponents
- should not stack with difficulty multipliers
```

**Implementation Tasks:**
- [ ] Implement CheatConfig system (Section 3.2.5)
- [ ] Implement slider UI
- [ ] Implement cheat badge display
- [ ] Ensure AI immune to cheats

---

### Phase 4 Acceptance Tests

```typescript
// tests/integration/fullSystems.test.ts
- should achieve all 6 victory conditions
- should manage city-states and suzerainty
- should create and display Great Works
- should trigger and resolve crises
- should transition between ages with synergies
- should complete tutorial mode
- should use cheat mode sliders
```

---

## Phase 5: Polish & Optimization
### Timeline: Months 14-15

#### 5.1 WebGL Renderer

**Tests to Write:**
```typescript
// tests/renderer/webgl.test.ts
- should render terrain with 3D geometry (Medium quality)
- should render terrain with 4x scale (High quality)
- should render units with correct shaders
- should render lighting correctly
- should maintain 45fps (Medium) / 60fps (High)
- should fall back to Canvas 2D on WebGL failure
```

**Implementation Tasks:**
- [ ] Implement WebGLRenderer class
- [ ] Implement terrain shaders (Section 5.1)
- [ ] Implement unit shaders
- [ ] Implement quality presets

---

#### 5.2 Hardware Auto-Detection

**Tests to Write:**
```typescript
// tests/system/hardwareDetection.test.ts
- should detect hardwareConcurrency
- should detect WebGL capabilities
- should query WEBGL_debug_renderer_info
- should recommend correct quality preset
- should allow user override
- should persist user preference
```

**Implementation Tasks:**
- [ ] Implement hardware detection utility
- [ ] Implement auto-quality selection
- [ ] Implement user override option

---

#### 5.3 Audio System

**Tests to Write:**
```typescript
// tests/system/audio.test.ts
- should play background music
- should play sound effects for actions
- should respect volume sliders
- should mute when game loses focus
- should handle audio loading errors gracefully
```

**Implementation Tasks:**
- [ ] Implement audio manager
- [ ] Implement music system
- [ ] Implement SFX system
- [ ] Implement volume controls

---

#### 5.4 Performance Optimization

**Tests to Write:**
```typescript
// tests/performance/benchmark.test.ts
- should render at 30fps on Lite preset
- should render at 45fps on Medium preset
- should render at 60fps on High preset
- should process turn in <300ms (Lite)
- should process turn in <500ms (Medium)
- should process turn in <800ms (High)
- should load game in <3s (Lite)
- should stay within memory limits
```

**Implementation Tasks:**
- [ ] Profile and optimize rendering
- [ ] Optimize turn processing
- [ ] Implement virtualization where needed
- [ ] Optimize memory usage

---

### Phase 5 Acceptance Tests

```typescript
// tests/integration/polish.test.ts
- should render correctly at all quality presets
- should auto-detect hardware and recommend quality
- should play audio with volume controls
- should maintain target frame rates
- should stay within performance budgets
```

---

## Phase 6: Beta & Launch
### Timeline: Month 16+

#### 6.1 Beta Testing Infrastructure

**Tests to Write:**
```typescript
// tests/beta/acceptance.test.ts
- should pass all acceptance criteria (Section 9)
- should work in Chrome (latest 2 versions)
- should work in Firefox (latest 2 versions)
- should work in Safari (latest 2 versions)
- should work in Edge (latest 2 versions)
- should be responsive on tablets
- should handle all browser-specific quirks
```

**Implementation Tasks:**
- [ ] Cross-browser testing
- [ ] Balance tuning
- [ ] Bug fixes
- [ ] Documentation

---

## Test File Organization

```
tests/
├── setup/
│   └── project.test.ts
├── game/
│   ├── entities/
│   │   └── types.test.ts
│   ├── mapGenerator.test.ts
│   ├── pathfinding.test.ts
│   ├── gameEngine.test.ts
│   ├── unit.test.ts
│   ├── city.test.ts
│   ├── improvement.test.ts
│   ├── fogOfWar.test.ts
│   ├── combat.test.ts
│   ├── barbarian.test.ts
│   ├── promotion.test.ts
│   ├── techTree.test.ts
│   ├── civicTree.test.ts
│   ├── government.test.ts
│   ├── era.test.ts
│   ├── legacyPath.test.ts
│   ├── religion.test.ts
│   ├── trade.test.ts
│   ├── victory.test.ts
│   ├── cityStates.test.ts
│   ├── greatWorks.test.ts
│   ├── crisis.test.ts
│   ├── civTransition.test.ts
│   ├── tutorial.test.ts
│   ├── cheatMode.test.ts
│   ├── saveManager.test.ts
│   └── ai/
│       ├── random.test.ts
│       └── openrouter.test.ts
├── renderer/
│   ├── canvas2d.test.ts
│   └── webgl.test.ts
├── components/
│   ├── ui.test.ts
│   ├── game.test.ts
│   └── menus.test.ts
├── network/
│   └── multiplayer.test.ts
├── system/
│   ├── hardwareDetection.test.ts
│   └── audio.test.ts
├── performance/
│   └── benchmark.test.ts
├── integration/
│   ├── mvp.test.ts
│   ├── coreGameplay.test.ts
│   ├── multiplayer.test.ts
│   ├── fullSystems.test.ts
│   ├── polish.test.ts
│   └── beta/
│       └── acceptance.test.ts
└── helpers/
    ├── render.tsx
    ├── store.ts
    └── gameBuilders.ts
```

---

## Running Tests

### Run All Tests
```bash
npm test
```

### Run Tests in Watch Mode
```bash
npm run test:watch
```

### Run Tests with Coverage
```bash
npm run test:coverage
```

### Run Specific Test File
```bash
npm test -- GameEngine.test.ts
```

### Run Tests Matching Pattern
```bash
npm test -- --grep "combat"
```

---

## Test Coverage Targets

| Phase | Target Coverage |
|-------|-----------------|
| Phase 1 (Foundation) | 80% |
| Phase 2 (Core Gameplay) | 85% |
| Phase 3 (AI + Multiplayer) | 80% |
| Phase 4 (Full Systems) | 85% |
| Phase 5 (Polish) | 75% |
| Phase 6 (Beta) | 90% |

---

## CI/CD Integration

Tests should run automatically on:
- Every pull request
- Every push to main branch
- Before deployment

Failing tests block merge/deployment.

---

## Revision History

| Version | Date | Changes |
|---------|------|---------|
| 1.0 | March 2026 | Initial TDD Implementation Plan |

---

*End of Technical Implementation Plan*
