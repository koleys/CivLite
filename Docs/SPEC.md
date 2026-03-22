# CivLite - Browser-Based Civilization VII Clone

## Project Requirements Document

---

## 1. Project Overview

### 1.1 Project Name
**CivLite** - A browser-based 4X strategy game inspired by Civilization VII

### 1.2 Project Vision
A fully-playable Civilization VII-inspired strategy game that runs entirely in modern web browsers, featuring the signature three-age system, legacy paths, turn-based empire building, and multiplayer capabilities. Optimized for lite hardware (integrated graphics, <4GB RAM).

### 1.3 Target Platform
- Primary: Modern web browsers (Chrome, Firefox, Safari, Edge)
- Minimum: WebGL 1.0 support, 4GB RAM
- Target: Single-player campaign, local hot-seat multiplayer, online multiplayer

### 1.4 Technology Stack
- **Game Engine**: Custom WebGL engine for 3D/2D rendering
- **Frontend Framework**: React 18+ with TypeScript
- **State Management**: Zustand or Redux Toolkit
- **Backend**: Node.js with WebSocket for multiplayer
- **Database**: PostgreSQL (deferred - using IndexedDB for MVP)
- **Real-time**: Socket.io for multiplayer synchronization

### 1.5 Hardware Optimization

Three quality presets with auto-detect on startup:

| Preset | Renderer | Target FPS | Min RAM | Use Case |
|--------|----------|------------|---------|----------|
| **Lite** | Canvas 2D (no WebGL) | 30fps | 2GB | Integrated graphics, old browsers |
| **Medium** | WebGL 2x scale | 45fps | 3GB | Mid-range laptops |
| **High** | WebGL 4x scale | 60fps | 4GB+ | Discrete GPU |

Auto-detect uses `navigator.hardwareConcurrency`, `WebGLRenderingContext`, and `WEBGL_debug_renderer_info` to determine the best preset. User can override in Settings. Canvas 2D mode renders tiles as pre-rendered sprites rather than 3D geometry.

---

## 2. Core Gameplay Features

### 2.1 Three-Age System (Signature Feature)

The game is divided into three distinct ages, each representing a major era of human history. Each age has a unique set of civilizations, mechanics, and Legacy Path objectives.

#### 2.1.1 Antiquity Age
- **Time Period**: 3000 BCE - 1 BCE
- **Starting Era**: Ancient civilizations
- **Available Civilizations** (10):
  1. Egypt (Nile bonus, Pyramid unique)
  2. Greece (Culture bonus, Hoplite unique)
  3. Rome (Production bonus, Legion unique)
  4. Persia (Gold bonus, Immortal unique)
  5. China (Science bonus, Crossbowman unique)
  6. India (Faith bonus, Varu unique)
  7. Babylon (Science bonus, Bowman unique)
  8. Carthage (Trade bonus, Quadrireme unique)
  9. Celts (Faith/Production bonus, Picts unique unit)
  10. Harappa (Food/Production bonus, River bonus)
- **Legacy Path Objectives** (select 3 of 5):
  1. Construct 3 Wonders
  2. Reach 10 population in capital
  3. Establish 5 trade routes
  4. Research 5 technologies
  5. Control 8+ cities
- **Transition**: Requires completing at least 2 Legacy Path objectives for voluntary early transition. Voluntary early transition with 2+ completed objectives incurs no penalty. If forced transition by turn limit occurs with fewer than 2 objectives completed, the game auto-selects the 2 most advanced from available progress, applies a -20 Era Score penalty, and the player continues into the next age without Age Victory.

#### 2.1.2 Exploration Age
- **Time Period**: 1 CE - 1500 CE
- **Transition**: Requires completing at least 2 Legacy Path objectives for voluntary early transition. Same rules as Antiquity→Exploration transition (voluntary early with no penalty after 2 objectives; forced transition by turn limit with -20 Era Score penalty if fewer than 2 objectives completed).
- **Available Civilizations** (12):
   1. Byzantium (Faith/Military bonus)
   2. Japan (Production bonus, coastal/naval warfare specialty)
  3. Mongolia (Movement/Combat bonus)
  4. Mali (Gold/Faith bonus)
  5. Songhai (Gold/Conquest bonus)
  6. Ottoman (Production/Gunpowder-era bonus)
  7. Spain (Exploration bonus)
  8. France (Culture/Diplomacy bonus)
  9. England (Naval bonus)
  10. Aztecs (Production/Faith bonus)
  11. Incas (Mountain/Food bonus)
  12. Venice (Trade/Diplomacy bonus)
- **New Mechanics**:
  - **Treasure Fleets**: Special naval trade routes requiring a Treasure Fleet unit. Originate from a city with a Harbor, destination must be a valid foreign port or colony. Yields 20-50 Gold based on number of active trade routes. One-time use (fleet returns to port after delivering goods).
  - **Colonial settlements**: New cities founded on a different continent than your capital. Gain +2 Production for 10 turns upon founding. Different from regular city founding.
  - Naval exploration bonuses: +1 Movement for naval units in Exploration Age
  - Printing Press: Civic that unlocks additional policy slots
- **Legacy Path Objectives** (select 3 of 5):
  1. Establish colonies on 3 continents
  2. Control 15+ cities
  3. Have 3 distinct religions
  4. Establish 10+ international trade routes (cumulative over the age; routes need not be simultaneous)
  5. Build 5 unique units

#### 2.1.3 Modern Age
- **Time Period**: 1500 CE - 2050 CE
- **Transition**: Requires completing at least 2 Legacy Path objectives for voluntary early transition. Same rules as Exploration Age transition (voluntary early with no penalty after 2 objectives; forced transition by turn limit with -20 Era Score penalty if fewer than 2 objectives completed).
- **Available Civilizations** (8):
  1. America (All-round bonus)
  2. Germany (Production/Military bonus)
  3. Russia (Production/Size bonus)
  4. Brazil (Culture/Nature bonus)
  5. Australia (Production/Culture bonus)
  6. Canada (Culture/Diplomacy bonus)
  7. Netherlands (Trade/Banking bonus)
  8. Sweden (Culture/Diplomacy bonus)
- **New Mechanics**:
  - **Industrial zones**: Districts providing Production bonuses. Buildings (Workshop, Factory, Power Plant) scale with adjacent Industrial Zones. Requires Steam Power technology.
  - **Railroad networks**: Tile improvement (unlocked by Steam Power) that provides +100% unit movement on Railroads. Connects cities for faster unit repositioning.
  - **Nuclear weapons**: Extremely powerful units (Nuclear Device) built with Uranium resources, capable of destroying cities and units. Leaves Fallout terrain. Unlocked by Nuclear Fission technology.
  - **Space Race**: Sequence of projects to win Scientific Victory. Requires: Launch Pad (Rocketry), 3 Rocket Parts, then Exoplanet Expedition. Details in Section 2.5.2.
  - **Corporations**: Special organizations founded in Modern Age that boost specific resource yields empire-wide. Unlocked by Corporations civic. Players select a Corporate Headquarters location in a city, and all connected cities with the relevant resource types receive bonus yields. Requires Education, Economics, and Corporation-specific resources (e.g., Oil for Oil Corporation, Aluminum for Tech Corporation).
- **Legacy Path Objectives** (select 3 of 5):
  1. Launch spaceship to Alpha Centauri
  2. Control 25+ cities
  3. Control 50%+ of the world's total population (sum of all population across all players' cities)
  4. Win any other victory condition (Domination, Science, Cultural, Religious, or Diplomatic)
  5. Be Suzerain of all city-states spawned in the game simultaneously. This requires meeting the Suzerain threshold for each city-state simultaneously — must be achieved and maintained, and if a city-state is lost, it must be regained before the objective is complete. Example: 8 city-states on Standard map (scales with city-state count setting in Game Setup: 4-16 range, default 8). See Section 3.6.3 for detailed Suzerain mechanics.

### 2.2 Civilization Selection System

Each age allows players to choose a new civilization based on their previous selections:
- **Locked Options**: Civs that connect from previous age (e.g., Rome → Italy)
- **New Options**: Fresh civilization choices for the new age
- **Cross-era Synergies**: Bonus for thematic transitions (e.g., Egypt → Ottoman). The synergy grants Era Score based on completed synergy tier. Synergy tiers:
  - **Tier 1** (1 shared theme): +1 Era Score
  - **Tier 2** (2 shared themes): +2 Era Score + unique building
  - **Tier 3** (3+ shared themes): +3 Era Score + unique unit
  Examples:
  - Egypt → Ottoman: Shared "desert/war" themes → Tier 2 (Desert Fort building)
  - Greece → Rome: Shared "classical/mediterranean" → Tier 2 (Forum building)
  - India → Mali: Shared "faith/trade" → Tier 2 (Sacred Market building)

### 2.3 Leader System
- **Separation**: Leader is chosen separately from Civilization
- **Leader Bonuses**: Unique passive abilities + leader-specific unit or building
- **Starting Leaders**: 2 leaders per civilization at launch (expandable)
- **Leader Personalities**: Aggressive, Diplomatic, Scientific, Cultural, Religious

### 2.4 Map Generation

#### 2.4.1 Map Sizes
| Size | Players | Dimensions (Total Tiles) | Recommended Age |
|------|---------|--------------------------|-----------------|
| Duel | 2 | 12×8 (96) | Any (Tutorial recommended) |
| Small | 4 | 16×10 (160) | Antiquity |
| Standard | 6 | 20×12 (240) | Exploration |
| Large | 8 | 24×14 (336) | Modern |
| Huge | 12 | 30×18 (540) | Modern |

#### 2.4.2 Map Types
1. **Continents** (default): 2-4 large landmasses
2. **Islands**: Many small islands
3. **Pangaea**: Single supercontinent
4. **Shuffle**: Fully randomized landforms
5. **Earth-like**: Real-world geography (stretch goal)

#### 2.4.3 Tile Types
| Tile | Base Yield | Spawnable On |
|------|------------|--------------|
| Grassland | 2 Food | Yes |
| Plains | 1 Food, 1 Production | Yes |
| Desert | — | Yes (with Oasis) |
| Tundra | 1 Food | Yes (sparse) |
| Snow | — | Yes (rare) |
| Hills | — (2 Production) | Yes |
| Mountains | — | Yes (1 tile each) |
| Coast | 1 Food, 1 Production | Edge |
| Lake | 2 Food | Yes (small) |
| Ocean | 1 Food | Edge/deep |

**Tile Features** (modifiers on base tiles):
| Feature | Effect | Spawnable On |
|---------|--------|--------------|
| Floodplains | +2 Food from farms (in addition to farm's base +1 Food) | Grassland, Plains (river adjacent) |
| Oasis | +3 Food, +1 Gold, blocks adjacency bonuses | Desert |

#### 2.4.4 Resources Distribution

**Bonus Resources** (common, ~15% of land tiles): Wheat, Cattle, Sheep, Deer, Fish, Bananas, Sugar, Rice, Stone, Marble (+1-2 Food or +1-2 Production)

**Luxury Resources** (uncommon, ~5% of tiles): Silk, Spices, Furs, Ivory, Jade, Pearls, Wine, Whales, Dyes, Cotton, Cocoa, Coffee, Tea, Tobacco, Amber, Citrus (+4 Amenities when connected to city)

**Strategic Resources** (weighted by era):
| Resource | Era | Distribution | Used For |
|----------|-----|-------------|----------|
| Horses | Antiquity+ | 3-5 per player region | Light Cavalry, Heavy Cavalry |
| Iron | Antiquity+ | 3-5 per player region | Swordsman, Legion, Medieval units |
| Copper | Antiquity+ | 3-5 per player region | Swordsman, early melee units |
| Coal | Exploration+ | 2-4 per player region | Industrial Zone, Steamship |
| Oil | Modern+ | 2-4 per player region | Tank, Oil Power Plant, Fighter |
| Aluminum | Modern+ | 2-3 per player region | Fighter, Modern Armor |
| Uranium | Modern+ | 1-2 per player region | Nuclear Weapon, Nuclear Plant |

Map seeds: Each map generates a seed string (e.g., "ANV-7K2M") displayed in UI. Players can copy seed to clipboard and paste to reproduce exact map in Settings → Map → Seed Input.

#### 2.4.5 Fog of War

Fog of War behavior varies by difficulty setting:

| Difficulty | Visible Tiles | Previously Seen | Unexplored |
|------------|--------------|-----------------|------------|
| Beginner | All tiles visible from start | N/A | N/A |
| Easy | All tiles within 5 tiles of any unit | N/A | Hidden (dark) |
| Standard | All tiles within 3 tiles of any unit | Grayed out | Hidden (dark) |
| Deity | All tiles within 2 tiles of any unit | Grayed out + shows terrain only | Hidden (dark) |

- **Cheat Mode**: No fog of war (full map visible). All tiles visible, no fog of war mechanics apply.
- **"Seen" tiles** on Standard/Deity: Show last known terrain, resources, and improvements but units/cities only if currently visible
- **City sight radius**: 2 tiles (standard), +1 for cities with Walls, +2 for cities with Broadcast Tower
- **Unit sight radius**: 1 tile for ground units, 2 for scouts, 3 for naval, 5 for aircraft
- **Religious units**: Apostles/Missionaries have 2-tile sight, do not reveal map
- **Visibility checks**: Recalculated at the start of each player's turn and after every unit move/attack

#### 2.4.6 Natural Wonders (8) & World Wonders (9)

There are 8 discoverable **Natural Wonders** (tile features, first to discover earns Era Score) and 9 buildable **World Wonders** (constructed in cities, unique effects):

**Natural Wonders** (8 total — occupy 1 tile, cannot be captured, discovered by moving a unit onto the tile):
1. **Mt. Sinai** (+2 Faith, +1 Faith per adjacent desert tile)
2. **Lake Victoria** (+2 Food, +2 Gold to all cities within 5 tiles)
3. **Krakatoa** (+2 Science, +2 Production to all cities within 5 tiles)
4. **Paititi** (+2 Gold, +2 Faith to all cities within 3 tiles)
5. **Bermuda Triangle** (+3 Movement to all naval units within 3 tiles)
6. **Giant's Causeway** (+2 Production, +1 Production to adjacent tiles)
7. **Yongding** (+2 Food, +2 Culture to adjacent farms)
8. **Tsingy** (+2 Culture, +1 Amenity to nearest city)

**Reefs** (Coast tile feature): A special coastal feature found on certain Coast tiles (spawned with the Coast tile). Reefs provide +1 Production to the Harbor district in the same city and +1 Science to adjacent campus districts. Nan Madol city-state provides +2 Production from Reefs.

**World Wonders** (9 total — built in cities, unique effects, only 1 per civilization per wonder):
1. **Great Library** (+1 Science per Library, +1 Science per University in the building's city only — effects apply to this city only)
2. **Colossus** (+2 Gold per Harbor in the building's city, +2 Gold to all trade routes)
3. **Hanging Gardens** (+1 Food per farm per city, +1 Amenity) — a single wonder
4. **Great Wall** (+20% Production toward Walls building, +1 Culture per worked tile in cities with Walls built)
5. **Oracle** (+2 Culture, +2 Faith, +1 Great Prophet point)
6. **Petra** (+2 Gold, +1 Production to all worked Desert tiles empire-wide)
7. **Chichen Itza** (+20% Production toward units requiring Military Tactics technology)
8. **Machu Picchu** (+2 Gold to all trade routes that pass through Mountain tiles, +2 Gold per Trading Post)
9. **Pyramids** (+2 Production from Mines on Hills tiles, +1 Culture per Quarry on Stone or Marble) — Egyptian civilization unique

### 2.5 Victory Conditions

#### 2.5.1 Domination Victory
- Control all **original capitals** of all **remaining major civilizations** (civilizations not yet eliminated)
- **Own capital**: If your original capital is captured by an opponent, you are NOT eliminated — you can reconquer it or win through another victory condition. You cannot win Domination Victory until YOUR original capital is back under your control
- **Eliminated civilizations**: A civilization is eliminated when ALL their cities are captured/destroyed. Eliminated civs' original capitals no longer need to be controlled for Domination Victory
- **Vassalage**: Capital capture triggers "Capitulation" — the defeated player becomes a vassal (can still win other conditions, can reconquer, but cannot win Domination until free). A vassal's original capital does NOT count toward your Domination Victory requirements
- **Nuclear weapons**: Accelerate domination by enabling rapid city capture
- **Simultaneous domination**: If two players complete domination on the same turn, the one with the higher score wins
- **Minimum turns**: Domination Victory is available from Turn 1 (no minimum turn count)

#### 2.5.2 Science Victory
- Research all technologies (through Advanced Computing)
- Build Eurekas to accelerate research
- Construct a Launch Pad in a city with a Campus district (requires Rocketry technology researched)
- Build 3 Rocket Parts in the same city as the Launch Pad
- Launch Exoplanet Expedition (requires all above)
- First to reach Alpha Centauri wins
- Available once the player enters the Modern Age

#### 2.5.3 Cultural Victory
- Achieve Domestic Tourist status in ALL major civilizations simultaneously
- **Domestic Tourist** = your Tourism toward a civilization exceeds their Culture output
- **Tourism per turn** = `(Great Works of Art × 3 + Great Works of Writing × 2 + Great Works of Music × 2 + Great Works of Artifact × 2 + National Parks × 10 + Open Borders bonus) × Policy Multiplier`
- **Policy Multiplier** = `1.0 + bonus from cultural policies (e.g., +25% from certain policies)`
- **Open Borders bonus**: When another civilization grants you Open Borders (via diplomatic agreement, requiring an Embassy in their capital), you receive +25% Tourism toward that civilization. Open Borders can be requested via diplomatic negotiation once you have an Embassy with that civilization. The Embassy building (Foreign Trade) provides the diplomatic channel; Enlightenment civic represents the diplomatic context.
- **Domestic Tourist threshold** per civilization = `10 + (that civilization's Culture ÷ 20)`
- **National Parks**: Require Naturalist unit (build park on valid terrain tiles)
- **Great Works requirement**: 6+ Great Works in Art, Writing, Music, and Artifact categories each (4 categories × 6 = 24 Great Works total)
- **Artifacts**: Created by Great Naturalists when earning enough Great Naturalist points. Artifacts provide Tourism like other Great Works but have different theming bonuses. National Parks are also unlocked by recruiting Great Naturalists.
- Tourism IS directional: you generate Tourism toward each civilization independently
- When you have **Domestic Tourists in ALL other major civilizations**, Cultural Victory triggers

#### 2.5.4 Religious Victory
- Establish majority religion (>50%) in all major civilizations
- Only one religion can dominate
- Holy City conversion resets the religion
- Religious victory is available throughout Antiquity and Exploration ages and can be achieved at any time during those ages. At the START of Modern Age, if no Religious Victory has occurred, Religious Victory becomes unavailable for the rest of the game (diplomatic paths take over)

#### 2.5.5 Diplomatic Victory
- Win 4/6 World Congress votes at game end
- **World Congress formation**: First World Congress session is held at the start of Exploration Age (Turn 1 of Exploration Age), after each player has founded at least 3 cities
- Subsequent sessions every 15 turns (Standard speed)
- Favorable resolution of 3+ crises
- Accumulate enough Diplomatic Favor to win voting sessions (20+ stored Favor provides advantage at World Congress votes, but the primary win condition is winning 4 of 6 votes at game end)
- Available from Exploration Age onward
- **World Congress resolutions**: Hosted by the player with the most Diplomatic Favor; others vote. Resolutions include: City-State patron rewards, Embargo targets, Wonders of the World votes, Emergency crises

**Crisis System**:
- **Crisis Events**: Random events triggered every 30 turns (Exploration+) that require collective action
- **Crisis Types**:
  - **Zombie Outbreak**: All cities lose 1 population unless players spend 100 Gold each
  - **Volcanic Winter**: All food production reduced by 50% for 10 turns
  - **Pirate Raid**: Barbarian camps spawn near trade routes
  - **Plague**: Cities with 10+ population lose amenities
- **Favorable Resolution**: If majority of players vote and act on crisis, all gain +5 Era Score and +10 Diplomatic Favor
- **Unfavorable Resolution**: If crisis is not resolved, affected players suffer penalties

#### 2.5.6 Age Victory (CIV7 Signature)
- **Age Victory** is granted when transitioning to the next age with ALL 3 chosen Legacy Path objectives completed
- Grants +50 Era Score applied IMMEDIATELY before the end-of-age reset. This +50 contributes to the carry-over bonus (if ≥20 after reset bonus calculation)
- Age Victory does NOT end the game — play continues into the next age
- If a player voluntarily transitions with fewer than 3 objectives completed (but at least 2), they transition normally but do NOT receive Age Victory bonus
- If forced to transition by turn limit with fewer than 2 objectives completed, the game auto-selects the 2 most advanced from available progress, applies a -20 Era Score penalty, and the player continues into the next age without Age Victory
- Age Victory is per-age: can be achieved at Antiquity→Exploration AND at Exploration→Modern

**Multiplayer Age Transitions**: In multiplayer, age transitions are synchronized. When any player triggers a voluntary transition (after completing 2+ objectives), all players enter the transition phase simultaneously. Each player independently selects their 3 Legacy objectives. Players who have not completed 2 objectives by the time any player triggers transition are subject to the auto-selection penalty. The transition turn resolves for all players at once.

#### 2.5.7 Victory Tie-Breaker
If multiple players meet victory conditions simultaneously, highest score wins:
```
Score = (Cities × 10) + (Wonders × 25) + (Units × 5) + (Technologies Researched × 3) + (Gold ÷ 10) + (Era Score)
```

---

## 3. Game Systems

### 3.1 Era Score System

Era Score is earned through notable achievements, tracked per turn and cumulatively:

| Action | Era Score | Can Repeat? |
|--------|-----------|-------------|
| Found a city | +5 | Yes |
| Construct a Wonder | +10 | Yes |
| Kill a unit | +1 | Yes |
| Kill a Barbarian Leader | +8 | Yes |
| Recruit a Great Person | +8 | Yes |
| Discover a Natural Wonder | +5 | Yes |
| Establish a Religion | +10 | No |
| Win a Crisis | +5 | Yes |
| Land on a new continent | +5 | Yes (once per continent; continent defined as landmass separated by ocean tiles) |
| Complete a Trade Route | +2 | Yes (route must be international and at least 10 tiles distance; domestic routes do not grant Era Score) |
| Build a unique unit/building | +3 | Yes |
| Gain a city via diplomatic means | +5 | Yes |
| Kill a unit from a more advanced era | +3 | Yes |

Era Score unlocks:
- **15+ Era Score (current age)**: Unlock Tier 2 policy cards
- **20+ Era Score (current age)**: Era score bonus for next age (+15% production bonus carried forward)
- **25+ Era Score (current age)**: Unlock Tier 3 policy cards
- **End of Age**: Era score resets to 0 at the start of each new age (carry-over bonus is applied separately, raw score resets)

Era Score is **per-age**: Each age tracks its own Era Score independently. The carry-over bonus is a **+15% production bonus** applied to the next age's starting resources (not added to the new age's score counter). This is calculated as: if your Era Score ≥ 20, you receive +15% production bonus on starting resources in the next age. The Age Victory bonus of +50 Era Score is a one-time bonus applied IMMEDIATELY before the reset, effectively boosting the carry-over bonus if earned (the +50 adds to the score used for the ≥20 threshold check). Tier 3 is achievable within a single age since scores reset: 25 Era Score per age is the target (achievable by founding ~3 cities, building 1 wonder, completing 1-2 trade routes, etc.).

**End of Age Trigger**: Each age has a fixed turn limit based on game speed:
| Speed | Antiquity → Exploration | Exploration → Modern |
|-------|------------------------|---------------------|
| Online | ~67 turns | ~67 turns |
| Standard | ~100 turns | ~100 turns |
| Marathon | ~300 turns | ~300 turns |

Player may voluntarily transition early once 2 Legacy objectives are complete. After reaching the turn limit, transition is forced regardless of objective completion — if fewer than 2 objectives are done, auto-selection occurs with penalty.

### 3.2 Resource & Economy System

#### 3.2.1 Yield Types
| Yield | Icon | Description |
|-------|------|-------------|
| Food | 🌾 | Population growth |
| Production | ⚙️ | Building/unit construction |
| Gold | 💰 | Currency, maintenance, trade |
| Science | 🔬 | Technology research |
| Culture | 🎭 | Civic progress, border expansion |
| Faith | ⛪ | Religion, Great Prophet points |
| Amenities | 😊 | Population happiness |
| Housing | 🏠 | Population cap |
| Diplomatic Favor | 🏳️ | Congress votes, alliances |
| Power | ⚡ | Required by Industrial Zone buildings; generated by Factory and Power Plant; enables modern buildings and districts |

#### 3.2.2 Tile Yield Formula
```
TileYield = (BaseYield + ResourceBonus + FeatureBonus) × (1 + DifficultyMultiplier) × (1 + PolicyBonus) + GovernmentBonus + ImprovementBonus
```
- **BaseYield**: Terrain base yields (e.g., Grassland = 2 Food)
- **ResourceBonus**: Bonus from bonus/strategic resources (+1-2 per resource)
- **FeatureBonus**: Modifiers from terrain features (e.g., Floodplains +2 Food)
- **DifficultyMultiplier**: Beginner=2.0, Easy=1.33, Standard=1.0, Deity=0.5 (higher values make the game easier by multiplying yield, e.g., Beginner yield = base × 2.0 (yields are doubled); Standard yield = base × 1.0 (standard); Deity yield = base × 0.5 (yields are halved). Note: These are used as multipliers in the TileYield formula, so higher multiplier values produce larger final yields, making the game easier.)
- **PolicyBonus**: Percentage bonuses from active policies (e.g., +10% = 0.1)
- **GovernmentBonus**: Flat bonuses from government type
- **ImprovementBonus**: Flat yields from tile improvements (e.g., Mine +2 Production)

#### 3.2.3 City Yield Formula
```
Sum of all working tile yields + Base city yield (2 Food, 1 Production, 0 Gold) + District yields + Building yields
```

#### 3.2.4 Difficulty-Based Economy

Difficulty affects starting resources, tile yields, and AI competitiveness:

| Difficulty | Tile Yield Multiplier | Production Multiplier | Pop Yield Bonus | Starting Gold | Starting Units | Starting Resources | AI Aggression |
|------------|----------------------|-----------------------|------------------|---------------|---------------|--------------------|---------------|
| Beginner | 2.0 | 2.0 | +10/pop | 150 | 2 Warriors + 2 Settlers | Abundant resources | Disabled (AI plays passively) |
| Easy | 1.33 | 1.33 | +5/pop | 125 | 1 Warrior + 2 Settlers | Abundant resources | Very Low |
| Standard | 1.0 | 1.0 | +0.5/pop | 100 | 1 Warrior + 1 Settler | Standard resources | Standard |
| Deity | 0.5 | 0.5 | +0.25/pop | 50 | 0 Warriors + 0 Settlers | Sparse resources | Very High |

"Population Yield Bonus" column shows a flat bonus to each worked tile's yield per population point (cumulative, not per-population incremental).
"AI Aggression" determines how aggressively the built-in AI pursues military victory and attacks (does not affect LLM AI behavior).
"Starting Resources" affects the abundance of bonus, luxury, and strategic resources on the map.
"Tile Yield Multiplier" and "Production Multiplier": Higher multiplier values produce larger final yields (easier gameplay). Used in the tile yield formula as multipliers, so Beginner with 2.0 gives base×2 (doubled yields), Deity with 0.5 gives base×0.5 (halved yields).

#### 3.2.5 Cheat Mode

Cheat Mode provides sliders (1x-100x) to multiply yields, stacking independently from difficulty. Does NOT stack with difficulty multipliers. Accessed via Game Setup → Advanced → Cheat Mode toggle (must be enabled before game start):

| Slider | Min | Max | Default | Effect |
|--------|-----|-----|---------|--------|
| Production | 1x | 100x | 1x | Production for building units, buildings, and districts |
| Gold | 1x | 100x | 1x | Gold income, trade route yields, gold-based purchases |
| Science | 1x | 100x | 1x | Research speed |
| Culture | 1x | 100x | 1x | Civic progress |
| Faith | 1x | 100x | 1x | Faith generation |
| Food | 1x | 100x | 1x | Population growth rate |
| Movement | 1x | 10x | 1x | Unit movement points |
| Combat | 1x | 10x | 1x | Unit strength |
| Build | 1x | 100x | 1x | Production cost (divides production needed, makes items cheaper/faster) |

When Cheat Mode is active, an orange "CHEAT" badge displays in the top bar. Cheat Mode does NOT apply to AI opponents - only the human player.

### 3.3 Technology Tree

#### 3.3.1 Technology Costs (Standard Difficulty)

| Era | Tech | Cost (Beakers) | Eureka Trigger | Eureka Bonus |
|-----|------|----------------|-----------------|--------------|
| **Antiquity** | Mining | 20 | Mine a resource tile | -50% |
| | Bronze Working (Tech) | 35 | Kill a unit with a melee unit | -50% |
| | Masonry | 25 | Build 3 Mines | -50% |
| | Pottery | 20 | Build 3 Farms | -50% |
| | Writing | 40 | Earn 100 Gold | -50% |
| | Mathematics | 45 | Train a Scout unit | -50% |
| | Iron Working (Tech) | 65 | Train a Swordsman unit | -50% |
| | Construction | 55 | Build 3 Forts | -50% |
| | Currency | 60 | Build a Market | -50% |
| | Philosophy | 70 | Build a Shrine | -50% |
| | Horse Riding | 50 | Build a Pasture | -50% |
| | Archery | 35 | Train an Archer unit | -50% |
| | Sailing | 35 | Discover a Coast tile | -50% |
| | Calendar | 45 | Harvest a luxury resource | -50% |
| | Engineering | 100 | Build a Road | -50% |
| | Animal Husbandry | 30 | Build a Pasture | -50% |
| **Exploration** | Paper | 90 | Build a Library | -50% |
| | Printing | 150 | Build 3 Libraries | -50% |
| | Optics | 80 | Build a Harbor | -50% |
| | Compass | 100 | Explore 3 coasts | -50% |
| | Cartography | 150 | Have a unit enter an unexplored tile | -50% |
| | Shipbuilding | 120 | Build a Harbor | -50% |
| | Astronomy | 140 | Build a Harbor | -50% |
| | Navigation (Exploration) | 180 | Reach the New World | -50% |
| | Metallurgy | 200 | Train a Heavy Cavalry unit | -50% |
| | Steel | 200 | Build a Forge | -50% |
| | Military Tactics | 180 | Train 3 Melee units | -50% |
| | Education | 200 | Build 3 Libraries | -50% |
| | Refrigeration | 180 | Harvest a Whale resource | -50% |
| | Banking | 220 | Build a Market | -50% |
| | Steam Power | 250 | Build an Industrial Zone district | -50% |

#### 3.3.2 Technology Prerequisites (Partial List)
| Tech | Prerequisites | Unlocks |
|------|-------------|---------|
| Mining | - | Bronze Working, Construction, Masonry |
| Bronze Working (Tech) | Mining | Swordsman unit (via unit system) |
| Construction | Mining | Engineering, Roads |
| Animal Husbandry | - | Horse Riding, Pastures |
| Sailing | — | Optics, Shipbuilding |
| Optics | Sailing | Astronomy, Navigation, Cartography |
| Compass | Sailing | Navigation |
| Cartography | Optics | Astronomy |
| Astronomy | Optics | — |
| Navigation | Compass | Caravelle, Ship of the Line |
| Navigation (Exploration) | — | (no unlocks — Navigation civic provides Inspiration trigger only) |
| Iron Working (Tech) | Bronze Working | Metallurgy, Heavy Cavalry units |
| Metallurgy | Iron Working | Steel |
| Steam Power | Metallurgy | Electricity, Industrial Zone |
| Steel | Iron Working | Refining, Military Tactics |
| Education | Printing | Universities |
| Printing | — | Banking |
| Banking | Education | Stock Exchange |
| Refrigeration | Education | Seaside Resorts |
| Electricity | Steam Power | Nuclear Fission |
| Refining | Steel | Combustion |
| Combustion | Refining | Flight, Rocketry, Forts |
| Nuclear Fission | Electricity | Fusion |
| Computers | Electricity | Telephones |
| Flight | Combustion | Advanced Flight |
| Rocketry | Combustion | Satellites |
| Fusion | Nuclear Fission | — |
| Advanced Computing | Fusion | Supercomputer, Laser |

#### 3.3.3 Modern Era Technologies (Exploration+ prerequisites may apply)
| Tech | Cost | Prerequisite | Eureka Trigger | Eureka Bonus |
|------|------|-------------|---------------|-------------|
| Radio | 350 | — | Build a Stock Exchange | -50% |
| Electricity | 300 | Steam Power (Exploration+) | Build a Factory | -50% |
| Computers | 500 | Electricity | Build a Research Lab | -50% |
| Telephones | 400 | Electricity | Build a Stock Exchange | -50% |
| Plastics | 450 | Refining | Discover Oil resource | -50% |
| Combustion | 500 | Refining (Exploration+) | Build a Fort | -50% |
| Flight | 400 | Combustion | Build an Aerodrome | -50% |
| Advanced Flight | 550 | Flight | Build 3 Airports | -50% |
| Rocketry | 700 | Combustion | Build a Rocket Artillery | -50% |
| Nuclear Fission | 850 | Electricity | Build a Nuclear Plant | -50% |
| Robotics | 750 | Electricity | Build a Factory | -50% |
| Satellites | 800 | Rocketry | Build a Solar Plant | -50% |
| Laser | 900 | Advanced Computing | Build 3 Research Labs | -50% |
| Advanced Computing | 1200 | Fusion | Build a Supercomputer | -50% |
| Fusion | 1100 | Nuclear Fission | Reach Fusion tech | -50% |

#### 3.3.4 Civic Tree (Parallel to Technology Tree)

Civics progress independently from Technologies and unlock policy cards and government reforms.

| Era | Civic | Cost (Culture) | Prerequisite | Inspiration Trigger | Inspiration Bonus |
|-----|-------|----------------|-------------|--------------------|------------------|
| **Antiquity** | Early Empire | 20 | — | Meet another civilization | -50% |
| | Craftsmanship | 25 | — | Train 3 melee units | -50% |
| | Military Tradition | 40 | — | Win a battle | -50% |
| | Early Politics | 45 | — | Build a Palace | -50% |
| | Foreign Trade | 55 | — | Establish a Trade Route | -50% |
| | Recording History | 60 | — | Build a Monument | -50% |
| | Mysticism | 65 | — | Build a Shrine | -50% |
| | Bronze Working (Civic) | 70 | — | Discover a Natural Wonder | -50% |
| | Iron Working (Civic) | 80 | Bronze Working (Civic) | Improve Iron resource | -50% |
| | Naval Tradition | 85 | — | Build a Harbor | -50% |
| | Coinage | 90 | — | Earn 50 Gold | -50% |
| **Exploration** | Medieval Faires | 100 | — | Build a University | -50% |
| | Printing Press | 140 | — | Have 3 Libraries | -50% |
| | Navigation (Exploration) | 160 | — | Establish an international trade route to a continent you did not start on (requires having reached a different continent) | -50% |
| | Enlightenment | 180 | — | Recruit a Great Person | -50% |
| | Military Drill | 200 | — | Build a Barracks | -50% |
| | Economics | 220 | — | Build a Bank | -50% |
| | Humanism | 250 | — | Build 3 Temples | -50% |
| | Exploration | 280 | — | Land on 2 continents you did not start on | -50% |
| | Reformation | 300 | — | Found a Religion | -50% |
| | Mercantilism | 320 | — | Have 5 luxury resources connected | -50% |
| | Corporations | 380 | — | Have 5 unique resource types improved | -50% |
| **Modern** | Natural History | 350 | — | Build 3 Museums | -50% |
| | Civil Engineering | 400 | — | Build 3 Aqueducts | -50% |
| | Urbanization | 450 | Civil Engineering | Reach 10 population in a city | -50% |
| | Replaceable Parts | 500 | Civil Engineering | Build a Factory | -50% |
| | Conservation | 550 | Urbanization | Plant 3 Forests | -50% |
| | Electrification | 600 | Civil Engineering | Build a Power Plant | -50% |
| | Mass Media | 700 | Replaceable Parts | Build 3 Broadcast Towers | -50% |
| | Global Warming | 800 | Mass Media | Trigger a climate crisis | -50% |
| | Social Media | 900 | Mass Media | Reach 100 population in a city | -50% |

Civics unlock:
- Policy cards (shared pool with Technologies)
- New government types
- Legacy Path progress for culture-related objectives

Civics use the same policy card tier system as Technologies (Tier 1/2/3 based on Era Score).

**Speed Modifiers**: Online = 0.67x costs, Standard = 1x, Marathon = 3x

### 3.4 Government System

#### 3.4.1 Government Types
| Government | Era | Bonus | Policy Slots |
|------------|-----|-------|--------------|
| Chiefdom | Antiquity | +20% Production | 1 Military, 1 Economic |
| Classical Republic | Antiquity | +2 Envoys | 1 Military, 2 Economic |
| Monarchy | Antiquity | +20% Gold | 2 Military, 1 Economic |
| Theocracy | Antiquity | +2 Faith | 1 Military, 1 Religious |
| Merchant Republic | Exploration | +50% Trade Routes | 1 Economic, 1 Diplomatic |
| Constitutional Monarchy | Modern | +2 Gold per Campus | 1 Military, 1 Economic, 1 Diplomatic |
| Communism | Modern | +4 Housing | 2 Economic, 1 Industrial |
| Democracy | Modern | +1 Gold per 10 population | 2 Economic, 1 Diplomatic |
| Fascism | Modern | +50% Production towards units | 3 Military |
| Digital Democracy | Modern | +30% Science | 1 Economic, 1 Diplomatic, 1 Scientific |

#### 3.4.2 Policy Card Tiers
- **Tier 1**: Available from the start of the game (Antiquity onward), always accessible
- **Tier 2**: Requires 15+ Era Score accumulated within the current age (resets each age)
- **Tier 3**: Requires 25+ Era Score accumulated within the current age (resets each age, harder to reach but achievable with focused Era Score generation)

#### 3.4.3 Government Mechanics

Each government type provides passive bonuses and unlocked policy slots. Players can switch governments by spending Culture (cost varies by era tier). Governments also unlock additional policy slots as players progress through the civic tree.

**Government Panel UI** (see Section 4.2.4):

### 3.5 Combat System

#### 3.5.1 Unit Classes
| Class | Antiquity | Exploration | Modern | Special |
|-------|-----------|-------------|--------|---------|
| **Melee** | Warrior, Swordsman | Musketman, Samurai | Infantry, Mechanized Infantry | High base strength |
| **Ranged** | Archer, Crossbowman | Cannon, Machine Gun | - | Attack from 2 tiles |
| **Siege** | Catapult | Bombards | Artillery, Rocket Artillery | +100% vs walls, can't move+attack |
| **Light Cavalry** | Horseman, Chariot Archer | Cavalry | - | Ignores ZOC, high movement |
| **Heavy Cavalry** | - | Cuirassier, Knight | Tank, Modern Armor | Charges (bonus vs damaged) |
| **Naval Melee** | Galley | Caravelle, Frigate | Destroyer, Missile Cruiser | Coastal/water combat |
| **Naval Ranged** | - | Galleass, Ship of the Line | Battleship | Ranged naval |
| **Air** | - | - | Fighter, Bomber, Jet Fighter | Strategic bombing |
| **Support** | Scout, Settler | Scout, Settler, Caravel (exploration) | - | Non-combat roles |
| **Mercenary** | - | Mercenary (Exploration+, unlocked via Policies) | - | Gold-based unit, replaces military units with production bonus |

#### 3.5.2 Combat Formula
```
EffectiveStrength = AttackerStrength × (1 + Promotions + GeneralBonus) - DefenderStrength × (1 + TerrainBonus + Fortification)
Damage = max(1, EffectiveStrength) × BaseDamage ÷ 10
```
- **Base Damage**: 20 for Melee, 15 for Ranged
- **Minimum Damage**: 1 (even if defender has higher strength)
- **Terrain Bonus**: Hills/Forest +25%, Mountains +50%, Fort tile improvement +50%, City +40%
- **Fortification Status**: Units can fortify (pressing F or Fortify button) on any tile. Fortification grants a multiplicative defense bonus using formula: `FortificationMultiplier = 1 + (0.05 × fortificationTurns)` where each turn of fortification adds +5%, stacking up to +20% after 4 turns (FortificationMultiplier = 1.20). Units in a Fort tile improvement get both the Fort terrain bonus (+50%) and the fortification bonus (if fortified). Fortification does not stack with the Fort tile improvement bonus — the Fort tile improvement bonus (50%) replaces the fortification bonus (max 20%).
- **ZOC Penalty**: -10% strength when entering enemy ZOC
- **Ranged Penalty**: -33% strength if moved before attacking
- **Charging**: +15% vs units below 50% health

#### 3.5.2.1 Nuclear Weapons
- **Nuclear Device** (Uranium, Modern+): Unit that can be built in a city once Nuclear Fission is researched and 1 Uranium resource is available
  - Strength: 150 (extremely powerful)
  - Movement: 1
  - Range: 7 tiles (can be launched from a distance)
  - Effect: **Automatic destruction** — does not use the standard combat formula. Destroys all units and buildings in the target tile and all adjacent tiles. Leaves behind Fallout terrain (impassable, -1 Amenities to nearest city). Enemy cities in blast radius are captured with 1 population and lose all buildings/districts. Friendly cities in blast radius lose all buildings/districts and population.
  - Cooldown: 10 turns between uses
  - Requires: Uranium resource (consumed on use)

#### 3.5.3 Unit Stacking Rules
- **Military units**: Up to 3 per tile
- **Civilian units**: By default, 1 per tile and CANNOT share with military
- **Exception**: Settler or City Builder MAY stack with exactly 1 military escort unit on the same tile
- **Multi-civilian rule**: If a civilian unit is on a tile with an escort, no other civilian unit can join (only the escort + 1 settler max)
- **General/Great General**: 1 per tile, provides +10% combat strength to adjacent allies
- **Formation**: First 2 units visible in UI, +N indicator for overflow
- **Attack**: All military units on tile can attack independently (each has its own health)
- **Movement**: Stacked units move together unless split explicitly (right-click a unit in stack to split)

#### 3.5.4 Barbarian System

**Camp Spawning**:
- Barbarian Camps spawn on land tiles at game start (after player/AI city placement) and periodically throughout the game.
- Initial camps: `(floor(totalPlayers ÷ 2)) + 1` (so Duel=2, Small=3, Standard=4, Large=5, Huge=7), capped at 8 maximum. "totalPlayers" means total player count (human + all AI opponents combined)
- Camp density: 1 camp per ~40 valid land tiles (fewer camps than previously stated to prevent spam)
- **New camp spawn rate**: 1 new camp every 30 turns (Standard difficulty), scaled by difficulty as shown in Difficulty Scaling table below
- **Unit spawn interval**: Units spawn from existing camps at the intervals shown in the Camp Scaling table (varies by era and difficulty)
- Camps spawn at least 8 tiles away from any player's starting position
- **Minimum camp spacing**: Barbarian camps must be at least 10 tiles apart (center-to-center distance). If no valid tile exists within the spawn region at minimum distance from all existing camps, the spawn is skipped for that interval.
- Camps spawn Barbarian Scouts (2-turn patrol) and Raiders (4-turn patrol)
- Scout discovers player → notifies camp → camp spawns Raiders
- If Scout fails to report within 8 turns, camp spawns faster (2 Raiders instead of 1)
- **Initial scouts**: Each camp spawns 1 Scout immediately at game start (Scouts start with 1 turn of patrol already used so they don't immediately reveal the map)
- **Camp cap**: Maximum 8 camps can exist at any time (initial + spawned). New camps do not spawn once the cap is reached, regardless of difficulty setting.

**Camp Scaling**:
| Era | Difficulty | Scout Strength | Raider Strength | Leader Strength | Unit Spawn Interval |
|-----|------------|---------------|-----------------|----------------|-------------------|
| Antiquity | Beginner | 0 | 0 | 0 | N/A (inactive) |
| Antiquity | Easy | 4 | 6 | 10 | Every 12 turns |
| Antiquity | Standard | 4 | 6 | 10 | Every 8 turns |
| Antiquity | Deity | 6 | 9 | 15 | Every 6 turns |
| Exploration | Beginner | 0 | 0 | 0 | N/A (inactive) |
| Exploration | Easy | 8 | 14 | 18 | Every 9 turns |
| Exploration | Standard | 8 | 14 | 18 | Every 6 turns |
| Exploration | Deity | 12 | 21 | 27 | Every 4 turns |
| Modern | Beginner | 0 | 0 | 0 | N/A (inactive) |
| Modern | Easy | 16 | 28 | 36 | Every 6 turns |
| Modern | Standard | 16 | 28 | 36 | Every 4 turns |
| Modern | Deity | 24 | 42 | 54 | Every 3 turns |
*New Barbarian Camp spawns every 30 turns (scaled by difficulty), independent of era. Unit Spawn Interval refers to unit spawning from existing camps.*

**Difficulty Scaling**:
- Beginner: 0% spawn rate (initial camps still spawn but are inactive/neutral; no periodic new camps spawn). See Camp Scaling table for unit strength values (all 0 for inactive camps).
- Easy: 50% spawn rate → periodic camps spawn every 60 turns instead of 30 (both camp spawns AND unit spawns from existing camps are halved; unit strength follows Easy values from the Camp Scaling table, which match Standard)
- Standard: 100% spawn rate → periodic camps spawn every 30 turns (baseline values from the Camp Scaling table)
- Deity: 150% spawn rate → periodic camps spawn every 20 turns (both camp spawns AND unit spawns are 1.5× frequency; unit strength uses Deity values from the Camp Scaling table, which are 1.5× Standard values)
- Note: On Beginner, initial camps spawn at game start but remain inactive (visible but do not attack or spawn units)
- **What scales with difficulty**: Both the Barbarian spawn RATE (more frequent camp spawns and unit spawns) and unit STRENGTH scale with difficulty. The Camp Scaling table's unit strength values are fixed per era-difficulty combination (Deity uses 1.5× Standard values, Easy matches Standard). The difficulty multiplier affects both how often camps spawn and how strong their units are.

**Barbarian Leaders** (all eras):
- Every 20 turns, a Barbarian Leader may spawn at an existing camp with a 30% chance
- Killing a Leader grants +8 Era Score
- Leader unit is stronger (+10 strength) and provides +2 movement to nearby Barbarians within 2 tiles
- Leader spawn rate and strength scales with era (see Camp Scaling table)

**Rewards**:
- Kill Barbarian Scout: +1 Era Score
- Kill Barbarian Raider: +1 Era Score, +5 Gold
- Raze Camp: +10 Gold, +2 Era Score

#### 3.5.5 Unit Promotions

Promotions are earned through combat (10 XP per enemy strength killed). XP threshold per level: 10, 30, 60, 100, 150.

**Promotion Trees**:

```
Level 1 (pick 1):
├── Aggressor (+5 strength) ──┬── Berserker (+10 vs damaged) ──── Bloodthirsty (+5 all combat)
├── Precise (+1 range) ────────┼── Mortar (+2 range) ───────────── Shrapnel (+25% vs siege)
├── Survivor (+10 HP) ─────────┴── Hardened (+terrain bonus doubled) ─── Resilient (+heal +5)
└── Mobile (+1 movement) ──────┴── Swallow (-1 enemy ZOC) ───────────── Swift (+10% flanking)

Level 2+ (unlock based on class):
├── Warrior (+5 strength vs Barbarians)
├── Ranger (+25% attack from hills/forest) — available to ranged and melee classes
├── Charge (+15% vs units below 50% HP)
├── Medic (+heal +10 to adjacent)
├── Embark (can cross shallow water without strength penalty)
└── Amphibious (can attack from water to land, +10% combat on beaches)
```

#### 3.5.6 Exploration & Modern Era Units

The following units are referenced in the Unit Classes table (3.5.1) but not yet defined with specific stats. These should be added to `units.json` during implementation:

| Unit | Era | Class | Notes |
|------|-----|-------|-------|
| **Bombards** | Exploration | Siege | Replaces Catapult; +100% vs walls, cannot move+attack same turn |
| **Cuirassier** | Exploration | Heavy Cavalry | Requires Metallurgy; has Charge ability |
| **Caravelle** | Exploration | Naval Melee | Discovered by Navigation technology; coastal exploration |
| **Galleass** | Exploration | Naval Ranged | Upgrade from Galley; ranged naval combat |
| **Ship of the Line** | Exploration | Naval Ranged | Discovered by Navigation technology; powerful ranged naval |
| **Steamship** | Exploration | Naval Melee | Requires Steam Power; not affected by wind |
| **Infantry** | Exploration | Melee | Standard melee unit; unlocked by Military Tactics (note: Infantry becomes prominent in Modern Age but is technically available from Exploration Age) |
| **Musketman** | Exploration | Melee | Requires Education; replaces Swordsman/Legion |
| **Samurai** | Exploration | Melee | Japan unique unit; requires Education |
| **Mechanized Infantry** | Modern | Melee | Requires Combustion; upgrade from Infantry |
| **Fighter** | Modern | Air | Requires Flight; air combat and strategic bombing |
| **Bomber** | Modern | Air | Requires Advanced Flight; heavy strategic bombing |
| **Jet Fighter** | Modern | Air | Requires Advanced Flight; upgraded Fighter unit with improved air combat stats |
| **Tank** | Modern | Heavy Cavalry | Requires Combustion; has Charge ability |
| **Modern Armor** | Modern | Heavy Cavalry | Requires Advanced Computing; upgraded Tank |

#### 3.5.7 National Parks

National Parks are part of the Cultural Victory path (Section 2.5.3). Mechanics:
- **Unlock**: Recruit a Great Naturalist (400 points)
- **Valid terrain**: 4 adjacent tiles that are Mountains, Hills (no mines/improvements), or untouched natural tiles. All 4 tiles must be owned by the player and within the city's workable radius.
- **Build**: Great Naturalist spends charges to establish a park on valid terrain. Each Naturalist can create 1 National Park.
- **Yield**: Each National Park provides +10 Tourism per turn.
- **Amenities from National Parks**: Cities with a Zoo building (Entertainment district, Conservation civic, 300 Production) gain +2 Amenities from each National Park within their workable radius. National Parks without a Zoo do not provide Amenities.
- **Limit**: Maximum 1 National Park per unique terrain configuration per player. "Unique terrain configuration" means all 4 tiles must share the same terrain type category (e.g., all Mountains OR all Hills OR all untouched natural tiles). Two National Parks cannot use the same terrain type category, regardless of specific tile locations.

### 3.6 City Management

#### 3.6.1 City Tiles & Growth
- Capital: City Center + 4 tiles (2 rings)
- Regular City: City Center + 1 tile per population (up to 12)
- Citizens: 1 per worked tile, can be assigned to specialists
- Specialists: 2 base + 1 per 10 population (scientist, merchant, artist, etc.)
- **City Growth Formula**: Each turn, city accumulates `FoodSurplus = FoodProduced - FoodConsumed` where `FoodConsumed = Population × 1`. `FoodForGrowth = Population × 2 + 4`. When `FoodStockpile ≥ FoodForGrowth`, city grows by 1 population and `FoodStockpile` resets (minus `FoodForGrowth`).
- **Housing Cap**: Population cannot exceed `Housing`. Excess population causes `Amenities` deficit. **Housing Formula**: `BaseHousing = 2 + (CityCenter × 1) + (Palace × 1) + (Aqueduct × 3) + (Sewer × 2) + (Neighborhood × 4)`. Default city starts with 3 Housing (2 base + 1 from Palace). Additional Housing buildings scale with population: Barracks (+1), Granary (+1), Stable (+1), Water Mill (+1), Factory (+2, requires Power).
- **Growth Blockers**: Unworked tiles, food deficits, housing limits, amenities deficits all affect growth rate.
- **Aqueduct**: Enables city growth past 10 population (removes hard housing cap at 10).

#### 3.6.2 Buildings

| District | Building | Cost | Effect |
|----------|----------|------|--------|
| **Campus** (District, base: +2 Science) | Library | Writing (60) | +2 Gold, +1 Science, +1 Great Scientist point, +1 Great Writing slot |
| | University | Library (160) | +2 Science, +1 Great Scientist point |
| | Research Lab | Computers (380) | +4 Science, +50% Science from Campus district |
| **Commercial Hub** (District, base: +2 Gold) | Market | 70 | +1 Gold, +25% Gold |
| | Bank | 290 | +2 Gold, +50% Gold |
| | Stock Exchange | 570 | +3 Gold, +75% Gold |
| **Industrial Zone** (District, base: +2 Production) | Workshop | 100 | +1 Production, +1 Production from adjacent Industrial Zone |
| | Factory | 260 | +3 Production, +2 Power, +1 Production for each adjacent Industrial Zone |
| | Power Plant | 540 | +4 Production, +1 Production for each adjacent Factory |
| **Theater Square** (District, base: +2 Culture) | Amphitheater | 80 | +2 Culture, +1 Great Artist point |
| | Museum | 360 | +4 Culture, +2 Culture from Great Works of Art, +2 Great Art slots, +2 Artifact slots, +1 Great Art point |
| | Broadcast Tower | 500 | +3 Culture, +3 Tourism, +1 Great Work of Music slot, +2 Great Musician points |
| **Holy Site** (District, base: +2 Faith) | Shrine | 50 | +2 Faith, +2 Great Prophet points |
| | Temple | 140 | +3 Faith, +1 Great Prophet point |
| | Cathedral | Philosophy (340) | +2 Faith, +2 Culture (from Great Works of Art in Museums), +3 Tourism, +1 Great Work of Art slot |
| **Encampment** (District, base: +2 Production) | Barracks | 70 | +15 XP to all units built, +1 Military Policy slot |
| | Armory | 200 | Unlocks Level 1 promotions |
| | Military Academy | 420 | +30 XP to all units built |
| | Walls | Engineering (120) | +3 Defense strength to city, +1 City sight radius, +1 Amenity |
| **Harbor** (District, base: +2 Gold) | Lighthouse | 80 | +1 Gold, +1 Production, +1 Food from adjacent water tiles with Fishing Boats, +1 Trade Route capacity (additive to base 2 routes) |
| | Shipyard | 220 | +2 Gold, +2 Production, +1 Production from adjacent Harbor district |
| | Seaport | 400 | +3 Gold, +2 Production, +1 Great Admiral point, +25% Production toward naval units |
| **Entertainment** (District, base: +2 Amenities) | Arena | 170 | +2 Culture, +1 Great Writer point, +1 Amenity |
| | Zoo | Conservation (300) | +2 Amenities from National Parks |
| **Aqueduct** | District | 100 | +3 Housing, +2 Production, enables city growth past 10 population |
| **Sewer** | Civil Engineering | 300 | +2 Housing |
| **Neighborhood** | Urbanization | 600 | +4 Housing, +1 Amenity |
| **Aerodrome** | (District, base: —) | 220 | +2 Air capacity, +25% Production toward air units. Unlocked by Flight technology. |
| **Palace** | (Auto-built in capital, not constructable) | 0 | +2 Gold, +2 Science, +2 Culture, +1 Science per adjacent Campus, +1 Culture per adjacent Theater Square |
| **Water Mill** | Construction | 70 | +2 Production, +1 Food to adjacent farm tiles |
| **Monument** | Mathematics | 40 | +2 Culture, +1 Great Writer point |
| **Forge** | Metallurgy | 130 | +1 Production, +1 Gold, +15% Production toward military units |
| **Ironworks** | Steel | 300 | +4 Production, +1 Production from adjacent mines and quarries |
| **Stable** | Horse Riding | 80 | +1 Production, +15 XP to cavalry units, enables Light Cavalry training |
| **Gallery** | Recording History | 60 | +2 Culture, +1 Great Art slot, +1 Great Artist point |
| **Embassy** | Foreign Trade | 50 | Enables Open Borders diplomatic agreement with the civilization that built it, +2 Gold from trade routes to that civilization |
| **Observatory** | Astronomy | 150 | +2 Science, +25% Science from Campus district |

#### 3.6.3 City-States (18 Types)

| Type | Resource | Suzerain Bonus |
|------|----------|---------------|
| **Brussels** | - | +15% Production toward wonders |
| **Mexico City** | - | +2 Amenities from Aqueducts |
| **Kabul** | - | +2 Production from Encampment buildings |
| **Geneva** | - | +4 Science in all Campuses |
| **Khartoum** | - | +4 Faith in all Holy Sites |
| **Zanzibar** | 2 Luxury resources | +2 Gold per city |
| **Carthage** | - | +2 Movement to all naval units |
| **Vatican City** | - | +4 Faith if first to found religion |
| **Hattusa** | - | +2 Gold for each active Trade Route |
| **Nan Madol** | - | +2 Production from Reefs |
| **Rapa Nui** | - | +2 Culture from Moai improvements |
| **Akkad** | - | +100% Production toward Mercenaries (requires Mercenary unit, unlocked via Policies) |
| **Samarkand** | - | +30% Gold from domestic Trade Routes |
| **Muscat** | - | +1 Amenity from Entertainment |
| **Stockholm** | - | +1 Great Scientist point per Library |
| **Buenos Aires** | - | +1 Amenity from every Luxury |
| **Seoul** | - | +2 Science from Campus buildings per city |
| **Lisbon** | - | +2 Gold per international Trade Route |

Envoy investment: 2 envoys at game start (distributed across city-states of choice), +1 additional envoy at turn 6, +3 at turn 12, +6 at turn 18 (per civilization). Players receive 2 envoys at the start of the game to enable early Suzerain competition.

**Suzerain System**:
- **Suzerain**: The player with the most envoys invested in a city-state becomes its Suzerain (default threshold: 3 envoys; if no competitor has invested more, a player with 2 envoys can still become Suzerain, ties broken by first arrival)
- **Suzerain bonuses**: Unique bonus per city-state type (see table above)
- **Competing for Suzerain**: If another player surpasses your envoy count, they become the new Suzerain
- **Suzerain for All City-States victory** (Legacy Path): Requires being Suzerain of ALL city-states spawned in the game simultaneously. Must be achieved and maintained — if a city-state is lost, it must be regained before the objective is complete. Scales with city-state count setting (4-16, default 8). For example: Standard map spawns 8 city-states by default (see Game Setup: City-States setting).

#### 3.6.4 Tile Improvements

| Improvement | Tech Required | Build Cost | Effect | Valid Tiles |
|------------|----------------|------------|--------|-------------|
| Farm | Pottery | 3 turns | +1 Food (+2 Food on Floodplains, stacking with civilization bonuses) | Grassland, Plains, Floodplains |
| Mine | Mining | 4 turns | +2 Production | Hills, Mountains, Iron tiles, Copper tiles |
| Quarry | Masonry | 3 turns | +1 Production (+2 Production if on Stone or Marble) | Stone, Marble, Hills, Mountains |
| Pasture | Animal Husbandry | 4 turns | +1 Production, +1 Food | Cattle, Sheep |
| Plantation | Calendar | 3 turns | +1 Production + Luxury | Sugar, Spices, Tobacco |
| Camp | - | 4 turns | +1 Production | Deer, Furs, Ivory |
| Fishing Boat | Sailing | 2 turns | +1 Food | Fish, Whales |
| Fort | Engineering | 5 turns | +50% defense (replaces fortification bonus when fortified), impassable to enemy units | Any |
| Railroad | Steam Power | 2 turns | +100% movement (requires tech) | Hills, Plains |
| Road | Engineering | 3 turns | +50% movement | Any |
| Airfield | Flight | 5 turns | +2 Air capacity | Any |
| Windmill | Economics | 4 turns | +1 Production, +1 Food | Plains |
| Seaside Resort | Refrigeration | 3 turns | +3 Gold, +1 Tourism | Coast |
| Moai | - | 3 turns | +2 Culture (placed on coastal tiles adjacent to shoreline) | Coast (shoreline) |
| Oil Well | Combustion | 4 turns | +1 Production, +1 Gold | Oil |
| Coal Mine | Steam Power | 4 turns | +2 Production | Coal |
| Aluminum Mine | Combustion | 4 turns | +1 Production | Aluminum |


**Resource-specific improvements** (alternative to regular Mine for specific resources):
- Mine (Iron): Mining, +2 Production (standard Mine improvement, valid on Iron resource tiles)
- Mine (Copper): Mining, +2 Production (standard Mine improvement, valid on Copper resource tiles)
- Well (Oil): Combustion, +1 Production, +1 Gold (replaces Mine for Oil tiles)
- Mine (Aluminum): Combustion, +1 Production (replaces Mine for Aluminum tiles)
- Mine (Uranium): Nuclear Fission, +2 Production (replaces Mine for Uranium tiles)

#### 3.6.5 City Capture Options

When a player captures a foreign city:

1. **Keep**: Take full control, reset to 1 population, keep 50% of buildings (selected randomly from those present), districts are reduced to 1 if present, original owner loses city
2. **Raze**: Destroy city over 3-5 turns (based on population), grants gold/production bonus each turn, city disappears after razing
3. **Liberate**: Return to original owner, gain +50 relationship, +3 Era Score, +10 Diplomatic Favor

Captured capitals: If the original capital is captured, the civilization is "captured" but not eliminated. They can reconquer or rebuild. If all their cities are captured, they are eliminated.

### 3.7 Trade System

#### 3.7.1 Trade Routes
- Base routes: 2 (same for all governments, regardless of type)
- Government trade bonuses are applied passively (not through policy slots), as specified in the Government Types table (Section 3.4.1)
- Trade route capacity: +1 per 50 population
- International route: Gold generation + culture sharing (+2 Culture per turn)
- Domestic route: Internal food/production bonuses

#### 3.7.2 Trade Route Yields (Standard Difficulty)
| Route Type | Gold | Other |
|------------|------|-------|
| Land (Domestic) | 2-4 | +1 Production to destination city |
| Land (International) | 4-8 | +10 Tourism |
| Naval (Domestic) | 3-5 | +1 Food to port city |
| Naval (International) | 6-12 | +15 Tourism |
| Treasure Fleet (Exploration+) | 20-50 | Gold only |

Trade route yield ranges are determined by: `baseYield + (playerGoldPerTurn ÷ 50) + (distanceBonus ÷ 2)`, where `baseYield` is the minimum yield value shown in the table (e.g., 2 for Land Domestic, 4 for Land International). `playerGoldPerTurn` is the sender's current gold income per turn. `distanceBonus` = number of road or railroad tiles along the trade route path. International routes gain bonus gold from having more improvements along the route path. Treasure Fleets yield based on the number of active Trade Routes the sending civilization has.

#### 3.7.3 Trade Panel UI (Section 4.2.5)

### 3.8 Religion System

#### 3.8.1 Religion Founding
1. Build Holy Site → Great Prophet point +1/turn
2. Pantheon: First to 20 Faith founds pantheon (select Pantheon Belief: +1 yield to specific terrain)
3. First to 8 Prophet points founds religion
4. Select Religion Beliefs (4 slots: Pantheon, Founder, Follower, Enhancer)

#### 3.8.2 Religion Beliefs (4 slots)
| Slot | Options (select 1 each) |
|------|---------|
| Pantheon | +1 Production from Workboats, +1 Food/+1 Production from Cattle/Sheep/Deer, +1 Production from Stone, +1 Faith from Desert/Tundra/Mountains, etc. |
| Founder | +1 Faith per city following, +1 Gold per Holy Site, +1 Faith per pantheon-following city |
| Follower | +1 Food per city, +1 Amenity per city, +2 Culture, +1 Production from shrines/temples |
| Enhancer | +2 Missionary charges, +50% spread speed, +15% combat strength for missionaries, +2 strength for religious units |

#### 3.8.3 Religious Units
| Unit | Cost | Charges | Spread Strength |
|------|------|---------|-----------------|
| Missionary | 80 Faith | 2 | 100% |
| Apostle | 140 Faith | 3 | 150% + can fight |
| Inquisitor | 120 Faith | 2 | Removes religion |

#### 3.8.4 Religion Panel UI (Section 4.2.6)

### 3.9 Great Works System

Great Works are created by Great Persons and stored in appropriate buildings.

| Great Person | Points Required | Creates | Stored In |
|-------------|-----------------|---------|-----------|
| Great Artist | 400 | Great Work of Art (Masterpiece) | Museum, Gallery |
| Great Writer | 400 | Great Work of Writing | Library, Museum |
| Great Musician | 400 | 1 Great Work of Music (+3 Tourism per turn from that slot) | Broadcast Tower, Theater Square |
| Great Naturalist | 400 | 1 Great Work of Artifact (creates National Park option, stored in Museum) | Museum |
| Great Merchant | 600 | 1 Charge: instant gold and production bonus (+4 Gold per turn, +200 Gold immediately) | Bank, Stock Exchange |
| Great Engineer | 600 | Charge: instant production of any available Wonder in that city | - |
| Great Scientist | 700 | 1 Charge: instant Eureka trigger for 1 technology (completes the Eureka, not the full tech) | Campus, Library |
| Great Prophet | 500 | Charge: found a religion (consumed on use) | - |
| Great Admiral | 500 | +30% combat strength to all naval units within 2 tiles for 10 turns | Harbor |
| Great General | 500 | +30% combat strength to all land units within 2 tiles for 10 turns | Encampment |

---

### 3.10 Clarifications & Edge Cases

#### 3.10.1 City Founding
- **Prerequisite**: Player must have a Settler unit to found a city
- Settlers are available from game start (no technology required) and are produced in cities like any other unit
- Settler is consumed upon founding (like standard Civ)
- Cannot found a city on a tile occupied by another unit, city, or Barbarian camp
- Minimum founding distance: 3 tiles (center-to-center) from any existing city

#### 3.10.2 Trade Route Conflicts
- If a trade route destination city is captured or destroyed mid-route, the route is cancelled
- Cancelled international routes grant no further yield; partial gold is NOT refunded
- Domestic routes can be reassigned freely each turn
- Maximum active trade routes per player: `2 + (population ÷ 50)` rounded down

#### 3.10.3 Religious Victory Trigger
- Checked at the END of each player's turn
- If a player's religion has >50% followers in ALL major civilizations' cities simultaneously, the founding player wins
- A civilization is considered "converted" if >50% of its total population follows that religion
- If two religions simultaneously reach >50% in all civs, the one with the higher total percentage of followers (sum of all followers across all cities) wins
- **End of game check**: Religious Victory is evaluated at the start of Modern Age; if no Religious Victory has occurred by then, Religious Victory becomes unavailable for the rest of the game

#### 3.10.4 Natural Wonder Discovery
- First player to move a unit onto a Natural Wonder tile "discovers" it
- Discovery grants Era Score (+5) and reveals the wonder tile permanently
- If two players' units arrive on the same turn, the player with the earlier turn order discovers it
- Natural Wonders cannot be captured or destroyed; they remain neutral territory

#### 3.10.5 Embarkation
- All military land units gain the ability to embark (cross shallow water) via the **Embark** promotion (Level 2+)
- Civilian units (Settlers) can embark from the start without a promotion
- **Shallow water**: Coast tiles (adjacent to land) — can be crossed by embarked units with or without Optics
- **Deep water**: Ocean tiles (not adjacent to land) — requires Optics technology to cross
- Embarked units have reduced combat strength (50% of normal) and move at 1 tile per turn
- Embarked units cannot attack unless they have the "Amphibious" promotion

#### 3.10.6 Barbarian Scout Visibility Behavior
- Barbarian Scouts patrol in a 2-tile radius around their camp
- Scouts reveal tiles within 2 tiles of themselves (same as player Scout)
- When a Barbarian Scout enters a tile visible to a player, it is revealed on the map as a Barbarian Scout
- If the Scout returns to its camp, the camp's location is revealed if it wasn't already
- Scout→Camp revelation: If a Barbarian Scout reaches a player's city or settler, the Scout disappears and the camp spawns Raiders on the next turn. The camp's location becomes visible to that player. Scouts do not trigger camp spawning for other players' camps.

#### 3.10.7 Raze Duration Formula
- City razing duration: `max(3, population × 1.5)` turns
- Each razing turn: city loses 1 population, grants `population × 2` gold
- If razing city reaches 0 population, the city is destroyed and the tile becomes unclaimed
- Razing does NOT destroy buildings/districts — they are all lost at destruction

#### 3.10.8 Science Victory — Rocket Parts
- 3 Rocket Parts must be built in the same city as the Launch Pad
- Rocket Parts are built as normal city production (each part = 1 project)
- A city can work on multiple Rocket Parts in parallel (production is divided among queued items)
- All 3 parts must be complete before the Exoplanet Expedition can be launched
- The Exoplanet Expedition project becomes available once all 3 Rocket Parts are complete

#### 3.10.9 Unit Upgrades
- Units can be upgraded when the prerequisite technology is researched
- Upgrade cost: `50% of the new unit's production cost` (paid in Gold)
- Upgraded units retain: health, promotions, experience, current position, embarked status
- Upgraded units do NOT retain: cargo, fortification status
- Not all units have a direct upgrade path (e.g., Scout can upgrade to Caravel when embarked on coastal water, Settler is consumed on founding)

#### 3.10.10 Warmonger Penalty System
- Declaring war on another civilization generates **War Weariness** points: +5 War Weariness per turn while at war
- War Weariness effects: Reduces population growth rate (formula: `growth × (1 - WarWeariness ÷ 100)`, capped at 50% reduction)
- Capturing a city generates **Grievances** (Warmonger points): `cityPopulation × 10` base grievances
- Grievances decay over time: -10 per turn after 20 turns of peace
- Grievances affect:
  - Diplomatic relationship: Each 10 grievances reduces relationship by 1 point
  - World Congress voting (other civilizations may vote against warmongers)
  - Suzerain bonuses from some city-states
- **Justified wars** (defensive wars, liberation wars) generate 50% fewer grievances
- Players who eliminate another civilization generate **permanent grievances**: +50 grievances from each remaining civilization
- Grievance UI: Displayed in Diplomatic panel as "Warmonger Score" per civilization

### 4.1 Main Game Screen Layout

```
┌─────────────────────────────────────────────────────────────────────────────────┐
│  [≡ Menu]  Turn: 42   Exploration Age   Score: 1,250   Era: ★★★☆☆   [🔔] [⚙️]   │
├─────────────────────────────────────────────────────────────────────────────────┤
│                                                                                  │
│                             MAP VIEWPORT (Canvas/WebGL)                          │
│                                                                                  │
│  [Minimap 180x120]                                              [Notification   │
│                                                              → Stream]           │
│                                                                                  │
├──────────────────────────────────────────────────────────────────────────────────┤
│ [Units] [Cities] [Tech] [Gov] [Religion] [Diplomacy] [Military] [Trade] [Stats]  │
└─────────────────────────────────────────────────────────────────────────────────┘
```

**Top Bar Elements**:
- Menu button (hamburger icon)
- Turn counter
- Current Age
- Score
- Era Score progress (5 stars)
- Notification bell (badge count)
- Settings gear

### 4.2 UI Components

#### 4.2.1 Map Controls
- **Pan**: WASD / Arrow keys, click-drag, edge scroll
- **Zoom**: Mouse wheel, pinch gesture, +/- buttons (6 levels)
- **Minimap**: Bottom-left, 180x120px, click to center, toggle-able
- **Tile Hover**: Tooltip with terrain, resources, improvements, yields
- **Selection**: Left-click to select, Shift+click for multi-select
- **Right-click**: Context menu (attack, move, fortify, etc.)
- **Keyboard shortcuts**: See Hotkeys Reference (Section 4.6)

#### 4.2.2 Unit Action Panel (Bottom-Left, slides up on unit select)
```
┌──────────────────────────────────────────────────────────────┐
│  ⚔️ Warrior (Lv.2 Aggressor)  ❤️ 80/80   ⚡ 2/2   💪 16     │
├──────────────────────────────────────────────────────────────┤
│  [Attack][Fortify][Sleep][Alert][Build][Skip Turn]          │
│  ─────────────────────────────────────────────────────      │
│  Movement Range: [tiles highlighted in blue]                 │
│  Attack Range: [tiles highlighted in red]                   │
└──────────────────────────────────────────────────────────────┘
```
- Unit portrait and type
- Health bar (colored: green>yellow>orange>red)
- Movement points (current/max)
- Combat strength
- Promotion badges (up to 3 visible)
- Action buttons based on unit type
- Movement overlay toggle

#### 4.2.3 City Panel (Modal overlay on city click)
```
┌──────────────────────────────────────────────────────────────┐
│  Alexandria  ⭐ Population: 7   ⭐ Amenities: 4/4            │
├──────────────────────────────────────────────────────────────┤
│  CITIZENS TAB │ BUILD TAB │ STATS TAB │ DEFENSE TAB         │
├──────────────────────────────────────────────────────────────┤
│  Worked Tiles:                                              │
│  [Tile +2 Food] [Tile +1 Prod] [Tile +1 Prod, +1 Gold]      │
│  ─────────────────────────────────────────                  │
│  Specialists: [🧑‍🔬Scientist: 1] [🧑‍💼Merchant: 0] [🎨Artist: 1] │
└──────────────────────────────────────────────────────────────┘
```
- City name and governor badge
- Population with growth progress
- Amenities with status
- Tab navigation: Citizens, Build, Stats, Defense
- Working tile assignment (drag-drop or auto-assign)
- Specialist slots
- Production queue
- Build/Buy buttons

#### 4.2.4 Government Panel (Government tab)
```
┌──────────────────────────────────────────────────────────────┐
│  GOVERNMENT                                                 │
├──────────────────────────────────────────────────────────────┤
│  Current: Constitutional Monarchy (Modern) [Change Government: 40🎭]│
├──────────────────────────────────────────────────────────────┤
│  MILITARY (2)         │ ECONOMIC (1)                        │
│  ─────────────────────┼────────────────────                  │
│  [Aggressive Stance]   │ [Trade Confederation]               │
│  [Veteran Corps]      │ [Economic Union]                    │
│                       │                                     │
├──────────────────────────────────────────────────────────────┤
│  DIPLOMATIC (0)       │ RELIGIOUS (0)                       │
│  ─────────────────────┼────────────────────                  │
│  [None]               │ [None]                               │
└──────────────────────────────────────────────────────────────┘
```
- Current government display
- Change government button (costs Culture equal to the new government's era tier: Tier 1 (Antiquity governments) = 10 Culture, Tier 2 (Exploration governments) = 20 Culture, Tier 3 (Modern governments) = 40 Culture; no cost for downgrading)
- Policy card slots grouped by type
- Draggable policy card assignment
- Lock/unlock policies per slot
- Tier indicator (1/2/3) on each policy

#### 4.2.5 Trade Panel (Trade tab)
```
┌──────────────────────────────────────────────────────────────┐
│  TRADE ROUTES  (3/4 slots)                                  │
├──────────────────────────────────────────────────────────────┤
│  ACTIVE ROUTES:                                             │
│  [Alexandria → Rome]  💰+6 Gold, 🎭+10 Tourism             │
│  [Alexandria → Venice] 💰+8 Gold                            │
│  [Carthage → Alexandria] 💰+4 Gold                          │
├──────────────────────────────────────────────────────────────┤
│  AVAILABLE DESTINATIONS:                                    │
│  [Select City ▼] → [Rome] 💰+6  [Venice] 💰+5              │
│  [Start Route]                                              │
└──────────────────────────────────────────────────────────────┘
```

#### 4.2.6 Religion Panel (Religion tab)
```
┌──────────────────────────────────────────────────────────────┐
│  RELIGION: Buddhism (founded Turn 12)                        │
├──────────────────────────────────────────────────────────────┤
│  Beliefs:                                                   │
│  [Pantheon: Sacred Places (+2 Faith from Mountains)]       │
│  [Founder: Pious Patronage (+1 Faith per city)]            │
│  [Follower: Warrior Monks (+2 Combat for monasteries)]     │
│  [Enhancer: Holy Words (+50% spread speed)]                │
├──────────────────────────────────────────────────────────────┤
│  Religious Units:                                           │
│  [Apostle x2] [Missionary x1]  [+Found Apostle: 80 Faith] │
└──────────────────────────────────────────────────────────────┘
```

#### 4.2.7 Victory Progress (Top-right floating)
```
┌────────────────────────────────────┐
│  VICTORY TRACKER                   │
├────────────────────────────────────┤
│  🏆 Domination     [████████░░] 80% │
│  🔬 Science        [██████░░░░] 60% │
│  🎭 Cultural       [███░░░░░░░] 30% │
│  ⛪ Religious      [████░░░░░░] 40% │
│  🏳️ Diplomatic     [█████░░░░░] 50% │
└────────────────────────────────────┘
```
Each victory type shows:
- Icon and name
- Progress bar (percentage or milestone markers)
- Competitor status (e.g., "Rome leading with 50%")

#### 4.2.8 Notifications Panel (Bell icon → dropdown)
```
┌──────────────────────────────────────────────────────────────┐
│  NOTIFICATIONS                                   [⚙️ Settings]│
├──────────────────────────────────────────────────────────────┤
│  🔴 Barbarian Camp discovered NE of Alexandria             │
│  🟡 Rome denounces you (angry about war)                   │
│  🟢 Great Artist (Michelangelo) available (400 pts)        │
│  🟢 National Park unlocked in your territory               │
│  🔵 City-State (Brussels) offers alliance for 50 Gold       │
├──────────────────────────────────────────────────────────────┤
│  [Clear All] [Mark All Read]                                │
└──────────────────────────────────────────────────────────────┘
```
- Color-coded by severity (red=yellow=orange=action, blue=info, green=positive)
- Timestamp (turn number)
- Click to center camera on relevant location
- Filter by type
- Unread count badge on bell icon

### 4.3 Menus

#### 4.3.1 Main Menu
- **New Game**: Start new game with setup
- **Continue**: Load most recent save (IndexedDB)
- **Multiplayer**: Create/join online game
- **Settings**: Audio, video, AI config, cheat mode
- **Tutorial**: 6-step interactive tutorial
- **Credits**: Game credits and licenses
- **Quit**: (browser: shows confirmation)

#### 4.3.2 Game Setup
```
┌──────────────────────────────────────────────────────────────┐
│  GAME SETUP                                                 │
├──────────────────────────────────────────────────────────────┤
│  CIVILIZATION: [🪷 Egypt ▼]   LEADER: [Cleopatra ▼]         │
│  MAP SIZE:    [Standard ▼]                                  │
│  MAP TYPE:    [Continents ▼]                                │
│  MAP SEED:    [________] [🎲 Randomize] [📋 Copy]            │
│  DIFFICULTY:  [Standard ▼]  (Beginner/Easy/Standard/Deity)  │
│  GAME SPEED:  [Standard ▼]  (Online/Standard/Marathon)      │
│  AI OPPONENTS: [2 ▼]                                        │
│  CITY-STATES:  [8 ▼]                                        │
│  VICTORY:      ☑ Domination ☑ Science ☑ Cultural           │
│                ☑ Religious ☑ Diplomatic ☑ Age Victory       │
│  ─────────────────────────────────────────────────────       │
│  [Advanced ▼]: Barbarians, Resources, Game Options         │
│  ─────────────────────────────────────────────────────       │
│  Barbarians: [On ▼] (On/Off - scales with difficulty)       │
│  Resources: [Standard ▼] (Sparse/Standard/Abundant)         │
│  Quick Combat: [Off ▼] (On/Off - skip combat animations)    │
│  ─────────────────────────────────────────────────────       │
│  [AI OPPONENT TYPE:                                        │
│   ○ OpenRouter LLM (requires API key) [Configure...]       │
│   ○ Built-in Random AI (default)                            │
│                                                               │
│  CHEAT MODE: [Off ▼] (Off/On - enables sliders in Settings) │
│                                                               │
│  [BACK]                    [START GAME →]                   │
└──────────────────────────────────────────────────────────────┘
```

#### 4.3.3 Settings
```
┌──────────────────────────────────────────────────────────────┐
│  SETTINGS                                                    │
├──────────────────────────────────────────────────────────────┤
│  AUDIO                                                       │
│  [Music: ████████░░ 80%] [SFX: ██████░░░░ 60%]              │
│                                                               │
│  VIDEO                                                       │
│  Quality: [Medium ▼] (Lite/Medium/High/Auto)                 │
│  Animations: [✓]  Particles: [✓]  UI Scale: [100% ▼]        │
│                                                               │
│  GAMEPLAY                                                    │
│  [Auto-Save: ✓ Every 5 turns] [Quick Movement: ✓]          │
│  [Tile Recommendations: ✓] [Yield Icons: ✓]                │
│                                                               │
│  AI CONFIGURATION (OpenRouter)                              │
│  [API Key: •••••••••••••••••] [Test Connection]              │
│  [Model Priority: deepseek/deepseek-r1 → llama-3.3-70b → ] │
│  [Timeout: [30s ▼] (10-120s)]                               │
│                                                               │
│  HOTKEYS: [View Full Reference]                             │
│                                                               │
│  ABOUT                                                       │
│  Version: 0.1.0  |  [Save Settings]  [Reset to Defaults]    │
└──────────────────────────────────────────────────────────────┘
```

#### 4.3.4 Cheat Mode Settings (shown when Cheat Mode enabled in Game Setup)
```
┌──────────────────────────────────────────────────────────────┐
│  CHEAT MODE SLIDERS                                          │
├──────────────────────────────────────────────────────────────┤
│  ⚠ WARNING: Cheat Mode is active. Changes affect THIS game.│
│  ─────────────────────────────────────────────────────       │
│  Production:  [1░░░░░░░░░] 1x     (range: 1-100)            │
│  Gold:        [1░░░░░░░░░] 1x     (range: 1-100)            │
│  Science:     [1░░░░░░░░░] 1x     (range: 1-100)           │
│  Culture:     [1░░░░░░░░░] 1x     (range: 1-100)           │
│  Faith:       [1░░░░░░░░░] 1x     (range: 1-100)           │
│  Food:        [1░░░░░░░░░] 1x     (range: 1-100)           │
│  Movement:    [1░░░░░░░░░] 1x     (range: 1-10)            │
│  Combat:      [1░░░░░░░░░] 1x     (range: 1-10)            │
│  Build:       [1░░░░░░░░░] 1x     (range: 1-100)           │
│  ─────────────────────────────────────────────────────       │
│  [Reset to 1x] [Set All to 10x] [Set All to 100x]           │
└──────────────────────────────────────────────────────────────┘
```

### 4.4 Tutorial Mode

A 6-step interactive tutorial for new players. Toggle-able from Main Menu.

**Tutorial Steps**:
1. **Movement**: Move a Scout to a nearby tile. Highlight +1 resource found.
2. **Exploration**: Find a Natural Wonder. Display first-Era-Score notification.
3. **Founding**: Settle a new city. Show city founding animation.
4. **Production**: Queue a Warrior in the new city.
5. **Combat**: Attack a Barbarian Scout with the Warrior.
6. **Victory Overview**: Show Victory Progress panel and explain each type.

**Tutorial UX**:
- Modal overlay with numbered steps
- "Next" / "Previous" navigation
- "Skip Tutorial" button (top-right)
- "Replay Tutorial" in Main Menu
- **Reset Tutorial**: Clears all progress, spawns a fresh tutorial game state (new map, player units, and cities), returns to Step 1. Does NOT reset user settings or saved games.

### 4.5 Visual Style

- **Art Direction**: Stylized low-poly (WebGL) or pixel art (Canvas 2D) with warm palette
- **Color Coding**:
  - Player: Gold/Yellow highlights
  - Allies: Blue borders
  - Enemies: Red borders
  - Neutral: Gray borders
  - City-State: Purple borders
- **Tile Overlay**: Semi-transparent for selection/pathing
- **Animations**: Smooth unit movement (0.5s per tile), attack effects, city growth

### 4.6 Hotkeys Reference

| Key | Action |
|-----|--------|
| `W/A/S/D` or Arrows | Pan map |
| `Q/E` | Rotate camera (3D mode only — only available in Medium/High quality presets; disabled in Lite) |
| `+/-` | Zoom in/out |
| `Space` | End turn |
| `Esc` | Close panel / Cancel |
| `Enter` | Confirm / Next |
| `Tab` | Cycle through units |
| `Shift+Tab` | Cycle reverse |
| `,` / `.` | Cycle through cities |
| `Ctrl+1` - `Ctrl+9` | Quick save to slot 1-9 |
| `1` - `9` | Quick load from slot 1-9 |
| `F1` | Open Units panel |
| `F2` | Open Cities panel |
| `F3` | Open Tech/Civic tree |
| `F4` | Open Government panel |
| `F5` | Open Diplomatic panel |
| `Ctrl+S` | Quick save (next available slot) |
| `Ctrl+Z` | Undo last action (up to 10 turns) |
| `Del` | Delete selected unit |
| `Ctrl+Click` | Multi-select units |
| `G` | Garrison unit |
| `H` | Heal unit |
| `F` | Fortify unit |
| `Alt+F` | Fortify until healed |
| `B` | Show build options |
| `R` | Create trade route |
| `T` | Toggle tile yield overlay |
| `M` | Toggle minimap |
| `N` | Next notification |
| `O` | Toggle fog of war reveal (debug only, always disabled in release) |
| `P` | Pause/Resume AI turn |

---

## 5. Technical Architecture

### 5.1 Frontend Architecture

```
src/
├── components/
│   ├── game/               # Game-specific React components
│   │   ├── MapCanvas.tsx    # Main map renderer (Canvas 2D or WebGL)
│   │   ├── CityPanel.tsx    # City management modal
│   │   ├── UnitPanel.tsx    # Unit action panel
│   │   ├── TechTree.tsx     # Technology tree panel
│   │   ├── GovernmentPanel.tsx
│   │   ├── ReligionPanel.tsx
│   │   ├── TradePanel.tsx
│   │   ├── DiplomaticPanel.tsx
│   │   ├── VictoryProgress.tsx
│   │   ├── NotificationPanel.tsx
│   │   ├── Minimap.tsx
│   │   ├── TopBar.tsx
│   │   └── BottomBar.tsx
│   ├── ui/                 # Shared UI components
│   │   ├── Button.tsx
│   │   ├── Modal.tsx
│   │   ├── Tooltip.tsx
│   │   ├── Dropdown.tsx
│   │   ├── Slider.tsx
│   │   ├── Tab.tsx
│   │   ├── ProgressBar.tsx
│   │   ├── Badge.tsx
│   │   └── HotkeyHint.tsx
│   └── menus/              # Menu screens
│       ├── MainMenu.tsx
│       ├── GameSetup.tsx
│       ├── Settings.tsx
│       ├── TutorialOverlay.tsx
│       └── LoadingScreen.tsx
├── game/
│   ├── engine/             # Core game logic
│   │   ├── GameEngine.ts   # Main game loop
│   │   ├── TurnManager.ts  # Turn sequencing
│   │   ├── TileManager.ts  # Tile operations
│   │   ├── CombatResolver.ts
│   │   ├── AI/
│   │   │   ├── AIDirector.ts    # AI coordinator
│   │   │   ├── AIRandomStrategy.ts  # Built-in random AI
│   │   │   ├── OpenRouterAI.ts  # LLM AI via OpenRouter
│   │   │   └── prompts/
│   │   │       └── metaPrompt.ts # Condensed LLM system prompt
│   │   ├── FogOfWar.ts
│   │   ├── MapGenerator.ts
│   │   ├── Pathfinding.ts
│   │   ├── SaveManager.ts
│   │   └── UndoManager.ts      # Stores action deltas (not full state) for last 10 turns
│   ├── entities/
│   │   ├── Civilization.ts
│   │   ├── City.ts
│   │   ├── Unit.ts
│   │   ├── District.ts
│   │   ├── Tile.ts
│   │   └── Resource.ts
│   ├── systems/
│   │   ├── TechSystem.ts
│   │   ├── ReligionSystem.ts
│   │   ├── TradeSystem.ts
│   │   ├── VictorySystem.ts
│   │   ├── CrisisSystem.ts
│   │   ├── EraSystem.ts
│   │   ├── BarbarianSystem.ts
│   │   ├── UnitPromotionSystem.ts
│   │   └── GreatWorksSystem.ts
│   └── data/
│       ├── civilizations.json    # Civ definitions, UBs, UUs
│       ├── leaders.json           # Leader bonuses, personalities
│       ├── technologies.json      # Tech costs, tree, eurekas
│       ├── units.json             # Unit stats, promotions, costs
│       ├── buildings.json         # Building costs, effects
│       ├── wonders.json           # Wonder costs, global effects
│       ├── policies.json          # Government policies
│       ├── cityStates.json        # 18 city-state definitions
│       ├── mapBiomes.json         # Terrain generation weights
│       └── naturalWonders.json    # Wonder locations and bonuses
├── network/
│   ├── SocketManager.ts
│   ├── GameSerializer.ts
│   ├── LobbyManager.ts
│   └── StateDelta.ts      # Delta compression for multiplayer
├── store/
│   ├── gameStore.ts       # Main game state (Zustand)
│   ├── uiStore.ts         # UI state (panels, modals)
│   ├── settingsStore.ts   # User settings (persisted)
│   └── networkStore.ts
├── shaders/               # WebGL shaders (for High quality)
│   ├── terrain.vert
│   ├── terrain.frag
│   ├── unit.vert
│   └── unit.frag
└── utils/
    ├── pathfinding.ts     # A* implementation
    ├── mapGenerator.ts    # Procedural map generation
    ├── combatCalc.ts      # Combat formulas
    ├── seedUtils.ts       # Seed generation/parsing
    └── crypto.ts          # Base64 encode/decode, SHA-256
```

### 5.2 Backend Architecture (Deferred for MVP)

For MVP, the backend is deferred. All game logic runs client-side. A lightweight Node.js server handles:

```
server/
├── index.ts              # Entry point (Express + Socket.io)
├── games/
│   ├── GameManager.ts    # Game session management
│   └── TurnCoordinator.ts
└── api/
    ├── lobby.ts          # Room creation, join
    └── stats.ts          # Win/loss tracking (stretch)
```

**Multiplayer Synchronization**:
- **Turn Modes**:
  - **Sequential** (default): Player 1 takes their full turn (all actions on all units/cities), then Player 2 takes their full turn, and so on. After all players complete, the turn increments and a new round begins.
  - **Simultaneous**: All players take their turns at the same time. Actions are executed in order of player initiative after timer expires or all players confirm "Ready". Conflicts (e.g., two players attacking the same city) are resolved by order of operations rules.
- **State Delta Sync**: Only changed state is sent each turn
- **Turn Validation**: All players send "ready" before turn advances to next player (in sequential mode) or before actions are resolved (in simultaneous mode)
- **Desync Recovery**: Full state snapshot every 10 turns as checkpoint
- **Chat**: Socket.io broadcast with profanity filter
- **Disconnect**: 5-minute timeout → bot takeover → reconnect rejoins as observer

### 5.3 Data Models

#### 5.3.1 Game State
```typescript
// Type Aliases
type playerId = number;
type cityStateId = string;
type TileId = string;
type UnitId = string;
type TerrainType = 'ocean' | 'coast' | 'grassland' | 'plains' | 'desert' | 'tundra' | 'snow' | 'mountain';
type TerrainFeature = 'floodplains' | 'oasis' | 'reefs' | 'forest';
type ResourceType = 'wheat' | 'cattle' | 'sheep' | 'deer' | 'stone' | 'marble' | 'fish' | 'whale' | 'sugar' | 'spices' | 'furs' | 'ivory' | 'jade' | 'pearls' | 'wine' | 'dyes' | 'cotton' | 'cocoa' | 'coffee' | 'tea' | 'tobacco' | 'amber' | 'citrus' | 'horses' | 'iron' | 'copper' | 'coal' | 'oil' | 'aluminum' | 'uranium';
type ImprovementType = 'farm' | 'mine' | 'quarry' | 'pasture' | 'plantation' | 'camp' | 'fishing_boat' | 'fort' | 'road' | 'railroad' | 'airfield' | 'windmill' | 'seaside_resort' | 'moai' | 'oil_well' | 'coal_mine' | 'aluminum_mine';
type ActionType = 'MOVE' | 'ATTACK' | 'BUILD' | 'FOUND_CITY' | 'PILLAGE' | 'FORTIFY' | 'SLEEP' | 'ALERT' | 'SKIP_TURN' | 'UPGRADE' | 'PROMOTE' | 'FOUND_RELIGION' | 'SPREAD_RELIGION' | 'REMOVE_HERESY' | 'TRADE' | 'ESTABLISH_ENVoy' | 'CHANGE_GOVERNMENT' | 'ADOPT_POLICY' | 'START_PROJECT' | 'LAUNCH_VICTORY';
type UnitType = string;
type GovernmentType = 'chiefdom' | 'classical_republic' | 'merchant_republic' | 'monarchy' | 'theocracy' | 'fascism' | 'communism' | 'democracy' | 'digital_democracy';
type MapSize = 'duel' | 'small' | 'standard' | 'large' | 'huge';
type MapType = 'continents' | 'islands' | 'pangaea' | 'shuffle' | 'earthlike';
type Difficulty = 'beginner' | 'easy' | 'standard' | 'deity';
type GameSpeed = 'online' | 'standard' | 'marathon';
type VictoryType = 'domination' | 'science' | 'culture' | 'religious' | 'diplomatic' | 'age';

interface GameState {
  id: string;
  turn: number;
  age: 'antiquity' | 'exploration' | 'modern';
  eraScore: number;
  turnStartTimestamp: number;
  players: Player[];
  map: MapData;
  cityStates: CityState[];
  cityStateEnvoys: Map<playerId, Map<cityStateId, number>>;
  tradeRoutes: TradeRoute[];
  religions: Religion[];
  crises: Crisis[];
  barbarianCamps: BarbarianCamp[];
  greatPersons: GreatPersonClaim[];
  victoryProgress: VictoryProgress;
  settings: GameSettings;
  cheats: CheatConfig;
  version: string;  // For save migration
}

interface UndoEntry {
  turn: number;
  playerId: number;
  actionType: string;
  delta: Partial<GameState>;  // Only changed fields, not full state
  timestamp: number;
}

interface MapData {
  width: number;
  height: number;
  seed: string;
  tiles: Tile[];
  resources: ResourceNode[];
  wonders: NaturalWonder[];
}

interface Tile {
  x: number;
  y: number;
  terrain: TerrainType;
  feature: TerrainFeature | null;
  resource: ResourceType | null;
  improvement: ImprovementType | null;
  owner: playerId | null;
  units: UnitId[];
  visibility: 'hidden' | 'seen' | 'visible'; // Fog of war
}

interface Player {
  id: number;
  civilizationId: string;
  leaderId: string;
  color: string;
  name: string;
  cities: City[];
  units: Unit[];
  resources: ResourceInventory;
  technologies: Set<string>;
  civics: Set<string>;
  currentResearch: { techId: string; progress: number } | null;
  currentCivic: { civicId: string; progress: number } | null;
  government: GovernmentType;
  policies: Policy[];
  religion: PlayerReligion | null;
  score: number;
  eraScore: number;
  legacyObjectives: string[];
  legacyObjectivesCompleted: Set<string>;
  isAlive: boolean;
  isAI: boolean;
  aiType: 'random' | 'openrouter';
  grievances: Map<playerId, number>;
  warWeariness: number;
  relationship: Map<playerId, Relationship>;
}

interface Relationship {
  value: number;        // -100 (war) to +100 (ally)
  tradesOffered: number;
  tradesAccepted: number;
  declaredWarOn: boolean;
  grievances: number;
  envoyCount: number;    // Invested envoys in this player's city-states
  isSuzerainOf: cityStateId[];
}

interface GreatPersonClaim {
  personId: string;
  name: string;
  type: 'artist' | 'writer' | 'musician' | 'merchant' | 'engineer' | 'scientist' | 'prophet' | 'admiral' | 'general';
  claimedBy: playerId | null;
  turnEarned: number;
  isRecruited: boolean;
}

interface Unit {
  id: string;
  type: UnitType;
  owner: playerId;
  x: number;
  y: number;
  health: number;
  maxHealth: number;
  movement: number;
  maxMovement: number;
  strength: number;
  strengthBase: number;
  promotions: Promotion[];
  experience: number;
  cargo: UnitId[];
  buildCharges: number;
  hasActed: boolean;
  fortificationTurns: number;
  isEmbarked: boolean;
  religion: string | null;
}

interface City {
  id: string;
  name: string;
  owner: playerId;
  population: number;
  x: number;
  y: number;
  buildQueue: BuildItem[];
  currentProduction: ProductionItem | null;
  foodStockpile: number;
  foodForGrowth: number;
  amenities: number;
  amenitiesRequired: number;
  housing: number;
  housingUsed: number;
  districtIds: string[];
  workedTiles: TileId[];
  specialistSlots: Specialist[];
  isOriginalCapital: boolean;
  garrison: UnitId | null;
  turnFounded: number;
  turnsOfGarrison: number;
  liberationStatus: 'none' | 'liberatable' | 'liberated';
  wasFoundedBy: playerId | null;
  isBeingRazed: boolean;
  razeTurnsRemaining: number;
}

interface GameSettings {
  mapSize: MapSize;
  mapType: MapType;
  mapSeed: string;
  difficulty: Difficulty;
  gameSpeed: GameSpeed;
  aiCount: number;
  cityStateCount: number;
  victoriesEnabled: Record<VictoryType, boolean>;
  barbarians: boolean;
  resources: 'sparse' | 'standard' | 'abundant';
  fogOfWar: boolean;
  quickCombat: boolean;
  gameVersion: string;  // Semantic versioning, e.g., "0.1.0"
}

interface CheatConfig {
  enabled: boolean;
  productionMultiplier: number;
  goldMultiplier: number;
  scienceMultiplier: number;
  cultureMultiplier: number;
  faithMultiplier: number;
  foodMultiplier: number;
  movementMultiplier: number;
  combatMultiplier: number;
  buildMultiplier: number;
}
```

### 5.4 Save/Load System

#### 5.4.1 Storage
- **Storage**: IndexedDB (browser-local, no server)
- **Format**: JSON with game state + metadata
- **Encryption**: None (client-side only, user controls data)

#### 5.4.2 Save Slot Structure
```typescript
interface SaveSlot {
  id: string;
  timestamp: number;
  turn: number;
  age: string;
  playerName: string;
  score: number;
  checksum: string;        // SHA-256 of serialized state
  autoSaveIndex: number;   // 0, 1 for rolling backup
  state: GameState;        // Serialized game state
}
```

#### 5.4.3 Corruption Handling
1. On save: Calculate SHA-256 checksum, store with save
2. On load: Recalculate checksum, compare
3. **Mismatch detected**:
   - Show modal: "Save file may be corrupted. Load anyway?"
   - Offer to load auto-backup instead
   - Log error to console for debugging
4. **JSON parse error**:
   - Same flow as checksum mismatch
   - Try loading auto-backup automatically

#### 5.4.4 Auto-Backup
- **Rolling backup**: 2 auto-save slots cycle (auto-slot-0, auto-slot-1)
- **Trigger**: Every 5 turns automatically
- **Naming**: "Auto-Save (Turn {N})" format
- **Manual saves**: Unlimited slots, user names editable
- **Max saves**: 10 total (warn user when approaching limit, delete old auto-saves first)

#### 5.4.5 Save Migration
When game version updates (detected via `version` field in save):
1. Load existing save
2. Run migration function `migrate(fromVersion, toVersion, state)`
3. Each migration: Add new fields with defaults, remove obsolete ones
4. Version stored in save metadata
5. If migration fails: Show error, offer to start new game

### 5.5 OpenRouter AI Integration

#### 5.5.1 Setup Flow
1. User enters API key in Settings → AI Configuration
2. Key stored in localStorage with Base64 encoding (obfuscation only, NOT encryption)
3. "Test Connection" button sends a minimal request to verify key validity
4. On 401 error: Prompt user to check/re-enter key
5. On success: Show confirmation, enable LLM AI in game setup

#### 5.5.2 API Configuration
```typescript
interface OpenRouterConfig {
  apiKey: string;           // User-provided, stored in localStorage
  modelPriority: string[];  // ['deepseek/deepseek-r1', 'meta-llama/llama-3.3-70b-instruct', ...]
  timeout: number;          // 30s default, configurable 10-120s
  maxTokens: number;        // 500 tokens for response
}
```

#### 5.5.3 Model Fallback Chain
```
1. deepseek/deepseek-r1 (fast reasoning, best value)
2. meta-llama/llama-3.3-70b-instruct (reliable fallback)
3. qwen/qwen-3-235b-a22b (highest capability)
4. BUILT-IN RANDOM AI (final fallback if all fail)
```

#### 5.5.4 Meta Prompt

The full game state is too large for free LLM models. The condensed meta prompt (~250 tokens) summarizes key game state information:

```
You are the AI opponent in Civilization VII. You are playing as [CIV]. You are in the [AGE] Age, Turn [N].

YOUR CIV: [Civ Name] - [Unique Bonus description]
YOUR LEADER: [Leader] - [Leader bonus]
YOUR RESOURCES: [Gold: X] [Production: X] [Science: X] [Culture: X] [Faith: X]
YOUR CITIES: [list up to 5 most important]

ENEMIES: [Civ A: aggressive, claims territories], [Civ B: friendly, trade partner]
CITY-STATES: [nearest city-state: type and your envoy count]

IMMEDIATE GOALS (pick 1-2):
- Economy: Boost gold/production
- Military: Build army, defend borders, or prepare attack
- Expansion: Settle new cities, claim resources
- Science: Research priority tech
- Culture: Grow tourism or unlock policies

AVAILABLE ACTIONS (respond with ONE action):
1. BUILD [unit/building] in [city]
2. MOVE [unit] to [x,y]
3. ATTACK [unit] at [x,y]
4. RESEARCH [technology]
5. ADOPT [policy/government]
6. TRADE [offer/accept]
7. FOUND_CITY at [x,y] with [settler]

Respond ONLY with the action. Format: ACTION|target|details
```

**Turn History**: Include last 2 AI decisions in context for consistency.

#### 5.5.5 Error Handling
| Error | Response |
|-------|----------|
| 401 Unauthorized | Clear API key, show "Invalid API key" error, prompt re-entry |
| 429 Rate Limited | Retry once after 2s, then fallback to built-in AI |
| 500 Server Error | Retry twice with 1s delay, then fallback to built-in AI |
| Timeout (configurable) | Show loading overlay with "Thinking..." + "Cancel" + "Wait 30s" + "Use Built-in AI" |
| No Internet | Auto-detect offline, switch to built-in AI immediately |
| Empty Response | Treat as timeout, same handling |

#### 5.5.6 Offline Detection
- On game start, ping `https://openrouter.ai/api/v1/models` (GET, no key required)
- If fails, show banner: "Offline mode - Using built-in AI"
- Online detection re-runs every turn start
- If comes back online, continue with current AI (no mid-game switch)

### 5.6 Built-in AI (Fallback)

When LLM AI is unavailable or disabled:

**Random Strategy AI**:
- 30% chance: Prioritize economy (build markets, trade routes)
- 25% chance: Prioritize military (build army, attack)
- 20% chance: Prioritize expansion (settle new cities)
- 15% chance: Prioritize science (build campuses, research)
- 10% chance: Prioritize culture (build theaters, adopt policies)

Each AI opponent rolls strategy on game start and re-rolls every 20 turns.

---

## 6. Data File Structures

World Wonder construction costs are defined in `wonders.json` (see Section 6.4). Each World Wonder has a production cost that scales with game speed (Online = 0.67x, Standard = 1x, Marathon = 3x). Default costs range from 300 to 700 Production. Each wonder can only be built once per civilization and requires the prerequisite technology or civic to be researched.

### 6.1 civilizations.json
```json
[
  {
    "id": "egypt",
    "name": "Egypt",
    "adjectival": "Egyptian",
    "age": "antiquity",
    "abilities": [
      {
        "name": "Waters of the Nile",
        "description": "+2 Food to farms on floodplains",
        "effect": { "type": "yield", "tile": "floodplains", "yield": "food", "amount": 2 }
      }
    ],
    "uniqueUnit": { "id": "egyptian_chariot_archer", "replaces": "chariot_archer" },
    "uniqueBuilding": null,
    "colors": { "primary": "#FFD700", "secondary": "#8B4513" },
    "legacyUnlocks": ["ottoman", "mali"]
  }
]
```

### 6.2 technologies.json
```json
[
  {
    "id": "mining",
    "name": "Mining",
    "era": "antiquity",
    "cost": 20,
    "eureka": { "type": "improve", "resource": ["stone", "copper", "iron"] },
    "eurekaBonus": 0.5,
    "prerequisites": [],
    "unlocks": ["bronze_working", "masonry"],
    "color": "#8B4513"
  }
]
```

### 6.3 units.json
```json
[
  {
    "id": "warrior",
    "name": "Warrior",
    "class": "melee",
    "era": "antiquity",
    "strength": 8,
    "movement": 2,
    "range": 1,
    "cost": 20,
    "maintenance": 0,
    "prerequisites": [],
    "promotions": ["aggressor", "survivor", "mobile"],
    "abilities": [],
    "upgradesTo": ["swordsman"]
  }
]
```

---

## 7. Performance Targets

| Metric | Lite | Medium | High |
|--------|------|--------|------|
| **Frame Rate** | 30fps | 45fps | 60fps |
| **Initial Load** | <3s | <5s | <8s |
| **Turn Processing** | <300ms | <500ms | <800ms |
| **Save/Load** | <1s | <2s | <3s |
| **Memory Usage** | <300MB | <500MB | <800MB |
| **Map Size** | Up to Standard | Up to Large | Up to Huge |

---

## 8. Development Phases

### Phase 1: Foundation (Months 1-4) - MVP Milestone
- [ ] Project setup (Vite + React + TypeScript + Zustand)
- [ ] Canvas 2D map renderer (Lite quality baseline)
- [ ] Tile system with terrain and basic resources
- [ ] Camera controls (pan/zoom) + minimap
- [ ] Pathfinding (A* implementation)
- [ ] Turn system infrastructure (player → AI → next)
- [ ] Basic unit movement and selection
- [ ] City placement and city panel
- [ ] Tile improvement system (farm, mine, quarry)
- [ ] Save/Load with IndexedDB
- [ ] **MVP**: Can play a single Antiquity Age game with basic mechanics

### Phase 2: Core Gameplay (Months 5-7)
- [ ] Combat system (damage formula, terrain bonuses)
- [ ] Unit stacking rules
- [ ] Barbarian system (camps, scouts, raiders)
- [ ] Unit promotions tree
- [ ] Map generation (all map types, seeds)
- [ ] Fog of War by difficulty
- [ ] Built-in Random AI opponent
- [ ] Technology tree with Eureka moments
- [ ] Basic UI panels (Tech, Government, Religion, Trade)

### Phase 3: LLM AI + Multiplayer (Months 8-10)
- [ ] OpenRouter AI integration
- [ ] Meta prompt optimization
- [ ] AI error handling and fallback
- [ ] WebSocket server for multiplayer
- [ ] Lobby system and room codes
- [ ] State delta sync
- [ ] Hot-seat multiplayer
- [ ] Online multiplayer with reconnection

### Phase 4: Full Systems (Months 11-13)
- [ ] All 6 victory conditions
- [ ] Three-Age system and Legacy Paths
- [ ] Civilization transitions between ages
- [ ] City-States (18 types with suzerain bonuses)
- [ ] Great Works system
- [ ] Crisis system (Exploration+)
- [ ] Tutorial mode (6 steps)
- [ ] Cheat mode with sliders

### Phase 5: Polish & Optimization (Months 14-15)
- [ ] WebGL renderer (Medium/High quality)
- [ ] Hardware auto-detect and quality presets
- [ ] Visual polish and animations
- [ ] Audio implementation (music, SFX)
- [ ] Performance optimization
- [ ] Comprehensive bug fixing
- [ ] Browser compatibility testing

### Phase 6: Beta & Launch (Month 16+)
- [ ] Beta testing with users
- [ ] Balance tuning
- [ ] Documentation and help system
- [ ] Launch preparation
- [ ] Post-launch support
- [ ] Feature expansion

---

## 9. Acceptance Criteria

### 9.1 Core Functionality
- [ ] Game can be started from main menu
- [ ] Map generates correctly for all sizes
- [ ] Units can move on valid tiles
- [ ] Combat resolves correctly with terrain/modifier bonuses
- [ ] Cities can be built, grown, and managed
- [ ] Technology progresses through tree with Eureka bonuses
- [ ] All victory conditions are achievable
- [ ] Game saves and loads without corruption
- [ ] Fog of war displays correctly by difficulty

### 9.2 AI Opponent
- [ ] OpenRouter API key stored in localStorage (Base64)
- [ ] LLM responds with valid game actions
- [ ] Model fallback chain works (deepseek → llama → qwen → built-in)
- [ ] Error handling for 401, 429, 500, timeout
- [ ] Offline detection auto-switches to built-in AI
- [ ] Built-in Random AI selectable in game setup
- [ ] AI turn time reasonable (30s per LLM, instant for built-in)

### 9.3 Difficulty & Cheats
- [ ] Beginner difficulty: 2.0x multiplier (2x yields), extra units, no barbarians
- [ ] Easy difficulty: 1.33x multiplier (~1.33x yields), reduced barbarians
- [ ] Standard difficulty: normal yields (1.0x multiplier)
- [ ] Deity difficulty: 0.5x multiplier (0.5x yields), extra barbarians, no starting units
- [ ] Cheat Mode sliders (1x-100x) functional
- [ ] Cheat Mode badge visible in top bar
- [ ] Cheat Mode does NOT affect AI opponents

### 9.4 UI/UX
- [ ] All panels accessible (Government, Religion, Trade, etc.)
- [ ] Hotkeys work as specified
- [ ] Notifications panel shows all event types
- [ ] Tutorial mode 6 steps completable
- [ ] Tutorial reset works
- [ ] Victory progress tracker updates in real-time

### 9.5 Three-Age System
- [ ] Three ages transition correctly
- [ ] Legacy path objectives track and validate
- [ ] Civilization selection changes per age
- [ ] Age victory triggers on objective completion
- [ ] Era score accumulates and unlocks rewards

### 9.6 Multiplayer
- [ ] Hot-seat works without crashes
- [ ] Online matches synchronize correctly
- [ ] Disconnection handled gracefully (5-min timeout)
- [ ] State delta sync prevents desyncs
- [ ] Chat functions with basic profanity filter

### 9.7 Performance
- [ ] Lite mode runs at 30fps on integrated graphics
- [ ] Medium mode runs at 45fps on mid-range laptop
- [ ] High mode runs at 60fps on discrete GPU
- [ ] No critical frame drops during normal play
- [ ] Loading screens don't exceed targets
- [ ] Memory stays within limits
- [ ] No save corruption with checksum validation

### 9.8 Compatibility
- [ ] Works in Chrome (latest 2 versions)
- [ ] Works in Firefox (latest 2 versions)
- [ ] Works in Safari (latest 2 versions)
- [ ] Works in Edge (latest 2 versions)
- [ ] Responsive on tablet devices

---

## 10. Risks and Mitigations

| Risk | Impact | Mitigation |
|------|--------|------------|
| Scope creep | High | Strict phase gates, feature freeze at Month 12 |
| Performance issues | High | Early optimization, profiling from Month 1 |
| AI quality (LLM) | Medium | Build-in fallback, condensed prompt, keep expectations realistic |
| Multiplayer bugs | High | Extensive testing, rollback plan, delta sync checkpoints |
| Browser compatibility | Medium | Feature detection, Canvas 2D fallback |
| Asset creation | Medium | Use procedural/CSS placeholders early, iterate |
| LLM API costs | Low | Free tier priority, fallback to built-in |
| IndexedDB limits | Low | Warn at 50MB, suggest cleanup at 80MB |

---

## 11. Future Considerations

### 11.1 Post-Launch Features
- Additional civilizations (5 per update)
- Additional leaders (3 per update)
- Scenario editor
- Mod support (JSON-based config)
- Campaign mode
- Achievements system
- PostgreSQL backend for cloud saves

### 11.2 Monetization (Optional)
- Cosmetic DLC (skins, UI themes)
- Additional civilizations pack
- Premium soundtrack

---

*Document Version: 3.68*  
*Last Updated: March 2026 (Review Cycle 49)*  
*Project: CivLite - Browser-Based Civilization Clone*

## Change Log

### Version 3.68 (March 2026)
- **Fixed Cathedral building table entry format**: Section 3.6.2 listed Cathedral with "Philosophy | 340" as separate Prerequisite and Cost columns, but the table format combines prerequisite and cost in the same column (e.g., "Writing (60)" for Library, "Conservation (300)" for Zoo). Changed Cathedral to "Philosophy (340)" to match the established format for all other buildings in the table.
- **Removed redundant Zoo building civic requirement**: Section 3.6.2's Zoo entry included "(Conservation civic required)" in the Effect column, but this information was already redundant since Conservation is already listed as the prerequisite in the Cost column ("Conservation (300)"). Removed the redundant parenthetical for clarity.
- **Added Fortification multiplier formula**: Section 3.5.2's Fortification Status description stated "+5% defense strength, stacking up to +20% after 4 turns" without defining the actual formula. Added explicit formula: `FortificationMultiplier = 1 + (0.05 × fortificationTurns)` to clarify the multiplicative nature of the bonus and ensure consistent implementation with terrain bonuses that also use multiplicative stacking.
- **Streamlined Suzerain Legacy Path objective wording**: Section 2.1.3's objective 5 contained redundant parenthetical information that duplicated content already defined in Section 3.6.3 (Suzerain threshold details). Simplified the wording to eliminate redundancy while maintaining the reference to Section 3.6.3 for detailed mechanics.

### Version 3.67 (March 2026)
- **Fixed Government Trade Bonus contradiction**: Section 3.7.1 stated "Government trade bonuses are applied as policy cards (Tier 1/2/3)" but the Government Types table (Section 3.4.1) lists Merchant Republic's "+50% Trade Routes" as a passive government bonus, not a policy card mechanism. Clarified that government bonuses apply passively as specified in the Government Types table, resolving the contradiction.
- **Removed redundant Barbarian "per player" definition**: Section 3.5.4 had two consecutive statements defining "per player" (lines 642-643), where the second was redundant with the first. Removed the duplicate "**\"Per player\"** means total player count (human + all AI opponents combined)" line.
- **Fixed National Parks mixed terrain contradiction**: Section 3.5.7's example stated "Mixed configurations like 2 Mountains + 2 Hills count as one terrain type combination" which contradicts the rule that "all 4 tiles must share the same terrain type category." Removed the contradictory mixed-terrain example to ensure consistency.
- **Fixed Cathedral building table formatting**: Section 3.6.2 listed Cathedral with "Philosophy (340)" in the prerequisite column, combining prerequisite and cost in parentheses. This was inconsistent with other buildings like Zoo that use "Prerequisite | Cost" as separate columns. Changed to "Philosophy | 340" format to match the table structure and removed the redundant "(Enlightenment civic)" parenthetical from the Effect column.

### Version 3.66 (March 2026)
- **Fixed Legion incorrectly listed as generic Melee unit**: Section 3.5.1's Unit Classes table listed "Legion" as a generic Antiquity Melee unit alongside Warrior and Swordsman, but Section 2.1.1 defines Legion as Rome's unique unit ("Rome (Production bonus, Legion unique)"). Removed Legion from the generic Melee list since unique units should not appear as generic options available to all civilizations.
- **Fixed Workshop adjacent bonus inconsistency**: Section 3.6.2's Workshop entry stated "+1 Production from adjacent mines" but this conflicts with Section 2.1.3's Modern Age mechanics description ("Buildings (Workshop, Factory, Power Plant) scale with adjacent Industrial Zones") and the Factory entry ("+1 Production for each adjacent Industrial Zone"). The Workshop bonus was incorrectly copying the Ironworks building's bonus (+1 Production from adjacent mines and quarries, as shown at line 793). Changed Workshop's adjacent bonus to "+1 Production from adjacent Industrial Zone" to match the Industrial Zone scaling pattern.
- **Fixed Navigation technology row format inconsistency**: Section 3.3.1's Navigation (Exploration) row displayed 6 columns: "Navigation (Exploration) | 180 | Compass | Reach the New World | -50%" where "Compass" appeared in the Eureka Trigger column as a prerequisite, creating an inconsistent format with all other technology rows that show 5 columns (Era, Tech, Cost, Eureka Trigger, Eureka Bonus). Removed the extraneous "Compass" prerequisite column to match the standard 5-column format. The prerequisite for Navigation is already properly defined in Section 3.3.2's prerequisites table.

### Version 3.65 (March 2026)
- **Fixed Library missing Writing prerequisite**: Section 3.6.2's Library building entry had no technology prerequisite listed ("—"), but Section 3.6.1's Buildings table includes Library as a prerequisite for University, implying it can be built without a prerequisite. However, the Library is referenced by Great Writer storage (Section 3.9), Writing technology (Section 3.3.1), and Printing/University Eureka triggers. Added "Writing" as the technology prerequisite for Library to complete the building progression chain.
- **Fixed Barracks row format inconsistency**: Section 3.6.2's Barracks entry used "Engineering (120)" format in parentheses while other Encampment buildings (Armory, Military Academy) used "—" and "Walls" used "Engineering | 120" format. Standardized Barracks to "| Engineering | 120 |" format for consistency with the table's structure (District | Building | Cost | Effect columns).
- **Fixed redundant Campus Science bonus**: Both Research Lab and Observatory provide "+50% Science from Campus district" in Section 3.6.2. Changed Observatory's bonus to "+2 Science, +25% Science from Campus district" to differentiate it from Research Lab's effect and make Observatory a meaningful intermediate building.
- **Fixed Jet Fighter prerequisite clarification**: Section 3.5.6 listed Jet Fighter as "Requires Advanced Flight" but both units are in the Modern era, creating ambiguity about whether Jet Fighter replaces or upgrades from Fighter. Added clarifying note that Jet Fighter is an upgraded Fighter unit (not a separate line), requiring Advanced Flight and providing improved air combat stats.
- **Clarified Exploration civic "new continents" requirement**: Section 3.3.4's Exploration civic listed "Land on 2 new continents" as its Inspiration trigger. Changed to "Land on 2 continents you did not start on" to clarify that "new" means continents other than the player's starting continent, consistent with Navigation technology's "Reach the New World" trigger language.
- **Clarified Harbor Lighthouse Trade Route capacity**: Section 3.6.2's Lighthouse entry showed "+1 Trade Route capacity" but Section 3.7.1 already defines base routes as 2 (same for all governments). Clarified that Lighthouse's +1 capacity is additive to the base 2 routes, making total capacity 3 for cities with a Lighthouse.
- **Fixed missing Computers technology prerequisite entry**: Section 3.3.3 listed Computers (Electricity, 500 beakers) but Section 3.3.2's prerequisites table had no entry for Computers. Added "Computers | Electricity | Telephones" to complete the Modern era technology dependency chain.
- **Clarified National Parks terrain combination limit**: Section 3.5.7's "unique terrain configuration" limit stated that National Parks cannot share terrain type combinations but was ambiguous about whether all 4 tiles must match or just share tile types. Added clarifying note that the 4 tiles must all share the same terrain type category (e.g., all Mountains OR all Hills OR all natural tiles), so mixed configurations like 2 Mountains + 2 Hills count as one configuration.

### Version 3.64 (March 2026)
- **Duplicate of v3.63** (removed duplicate entries; all content moved to v3.63)

### Version 3.63 (March 2026)
- **Fixed Navigation (Tech) prerequisite and added era label**: Section 3.3.1 listed Navigation without an era label and without showing Compass as its prerequisite, creating inconsistency with Section 3.3.2 which shows Compass → Navigation. Added "Compass" prerequisite and "(Exploration)" era label to Navigation in Section 3.3.1. Also added unlocks (Caravelle, Ship of the Line) to Navigation entry in prerequisites table.
- **Fixed Advanced Computing prerequisite contradiction**: Section 3.3.2 showed Fusion → Advanced Computing (Fusion unlocks Advanced Computing), but Section 3.3.3 listed Computers as Advanced Computing's prerequisite. This created a circular dependency: Nuclear Fission → Fusion → ? → Advanced Computing → Computers (where ? would need to unlock both Advanced Computing and Computers). Changed Section 3.3.3 to show Fusion as the prerequisite for Advanced Computing, matching Section 3.3.2. Added "Supercomputer, Laser" as the unlocks for Advanced Computing in Section 3.3.2.
- **Completed Barbarian Camp Scaling table with all difficulty levels**: The Camp Scaling table only had Standard and Deity rows, but the Difficulty Scaling section describes Beginner, Easy, Standard, and Deity. Added Beginner rows (0 strength, N/A intervals - inactive camps) and Easy rows (Standard strength values, 50% spawn rate) for all three eras. Also updated Difficulty Scaling text to reference the updated table and clarify Easy uses Standard-strength values (not separate Easy-strength values).

- **Fixed Hanging Gardens Wonder entry wording**: Section 2.4.6's Hanging Gardens entry used "Wonder" singular while the section header stated "World Wonders (9 total)" and all other wonder entries used their full names. Added "— a single wonder" to clarify the grammar matches the actual item (a single wonder, not multiple wonders).
- **Consolidated Suzerain redundant entries**: Section 3.6.3 had two consecutive bullet points that were partially redundant: "- **Suzerain**: The player with the most envoys..." and "- **Suzerain threshold**: 3 envoys...". Combined into a single consolidated bullet that defines both the concept and threshold together.
- **Clarified Fort tile improvement vs fortification interaction**: Section 3.6.4's Fort tile entry now explicitly states "(replaces fortification bonus when fortified)" to match the clarification in Section 3.5.2, making the tile improvement section self-contained.
- **Clarified Easy difficulty spawn rate scaling**: Section 3.5.4's Easy difficulty entry stated "50% spawn rate → periodic camps spawn every 60 turns" without clarifying whether this applies to both camp spawns AND unit spawns from existing camps. Added explicit note that 50% applies to BOTH camp spawns AND unit spawns, and that unit strength follows Standard values (not scaled like Deity).

### Version 3.61 (March 2026)
- **Added missing Antiquity Age transition rules**: Section 2.1.1 was missing transition rules that were referenced by Section 2.1.2's "Same rules as Antiquity→Exploration transition" but were never defined in Section 2.1.1. Added transition paragraph matching the structure of Sections 2.1.2 and 2.1.3, defining voluntary early transition (2+ objectives, no penalty) and forced transition (turn limit, <2 objectives = -20 Era Score penalty, no Age Victory).
- **Fixed Zoo building prerequisite**: Section 3.6.2's Zoo entry showed "300" in the Cost column instead of indicating the Conservation civic prerequisite. Changed to "Conservation (300)" to match the format of other buildings with civic prerequisites.
- **Clarified Cathedral building effect**: Section 3.6.2's Cathedral effect listed "+2 Culture" without clarifying that this bonus comes from Great Works of Art stored in Museums, not from the Cathedral itself. Added "(from Great Works of Art in Museums)" to clarify the source of this culture bonus.
- **Fixed University building prerequisite**: Section 3.6.2's University entry showed "Research Lab" as the prerequisite, which is incorrect. University requires Library (to be built in a Campus), not Research Lab. Changed prerequisite to "Library required" for consistency.

### Version 3.60 (March 2026)
- **Fixed Tile Yield Formula structure**: The formula was using division by `(1 + DifficultyDivisor)` which produced the OPPOSITE effect of documented behavior. Beginner=0.5 gave ÷1.5=0.67× yield (harder instead of easier), Deity=2 gave ÷3=0.33× yield (even harder). Restructured formula to multiply by `(1 + DifficultyMultiplier)` with corrected values: Beginner=2.0 (base×2 = 2× yield, easier), Easy=1.33 (base×1.33 ≈ 1.33× yield), Standard=1.0 (base×1 = 1× yield), Deity=0.5 (base×0.5 = 0.5× yield, harder). Updated formula in Section 3.2.2, renamed DifficultyDivisor to DifficultyMultiplier, updated Difficulty-Based Economy table headers and values, and updated Acceptance Criteria descriptions.
- **Fixed duplicate changelog entries**: v3.53 and v3.54 contained identical content. Removed duplicate v3.53 content, replaced with reference to v3.54.
- **Clarified Navigation civic Eureka trigger**: Added "(requires having reached a different continent)" to clarify the international trade route requirement for Navigation (Exploration) civic Inspiration trigger.
- **Fixed Aqueduct table formatting**: Changed "(District, not a building)" from cost column to proper "District" classification with 100 Production cost.

### Version 3.58 (March 2026)
- **Clarified Cheat Mode fog of war behavior**: Section 2.4.5's Cheat Mode entry was incomplete, stating only "No fog of war" without clarifying that all fog mechanics are disabled. Added explicit note that all tiles are visible and no fog of war mechanics apply.
- **Clarified National Parks/Zoo/Amenities connection**: Section 3.5.7's Zoo building description was ambiguous about when Amenities are provided from National Parks. Added explicit statement that National Parks without a Zoo do not provide Amenities, and Cities with a Zoo gain +2 Amenities from each National Park within their workable radius.
- **Fixed Suzerain example formatting**: Section 3.6.3's Legacy Path example had inconsistent punctuation and missing context. Changed to "For example: Standard map spawns 8 city-states by default" to clarify the scaling example.
- **Clarified Barbarian camp cap behavior**: Section 3.5.4's "capped at 8 maximum" was ambiguous about whether this applies to all difficulties or just some. Added explicit note that the 8-camp maximum applies to all difficulty settings (initial + spawned combined), and new camps do not spawn once cap is reached.
- **Clarified Beginner difficulty camp behavior**: Section 3.5.4's Difficulty Scaling description said "initial camps and periodic camps disabled entirely" but this conflicted with the later note that "initial camps still exist." Clarified that initial camps still spawn on Beginner but are inactive/neutral (do not attack or spawn units).
- **Clarified Population Yield column header**: Section 3.2.4's "Population Yield" column header was ambiguous. Changed to "Pop Yield Bonus" and clarified that it shows a flat bonus to worked tile yields per population point (cumulative).

### Version 3.57 (March 2026)
- **Fixed DifficultyDivisor values**: The difficulty divisor values were inverted, causing Beginner difficulty to produce the hardest gameplay (smallest yields) and Deity to produce the easiest gameplay (largest yields) - the opposite of intended behavior. Swapped the values: Beginner=0.5 (dividing by 0.5 doubles yields), Easy=0.75 (~1.33x yields), Standard=1 (normal), Deity=2 (halves yields). Updated the DifficultyDivisor definition in Section 3.2.2, the Difficulty-Based Economy table in Section 3.2.4, and the Acceptance Criteria difficulty descriptions in Section 9.3.

### Version 3.56 (March 2026)
- **Fixed DifficultyDivisor description**: Section 3.2.2 stated "higher values make the game easier" which is mathematically incorrect when using these values as divisors in the formula. Lower values (smaller divisors) produce larger final yields (easier game), while higher values (larger divisors) produce smaller final yields (harder game). The example "Deity yield = base ÷ 0.7 = base × 1.43" showed Deity having 1.43× yields (harder), contradicting the text. Corrected to "lower values make the game easier" with updated explanation that divisor values work inversely to intuitive expectations.
- **Clarified Suzerain Legacy Path objective wording**: Section 2.1.3 stated "requires 3 envoys invested per city-state" which conflicted with Section 3.6.3's explanation that 2 envoys may suffice if uncontested. Changed to "requires meeting the Suzerain threshold for each city-state — typically 3 envoys invested, though 2 envoys may suffice if no competitors have invested more" and added explicit reference to Section 3.6.3 for detailed mechanics.
- **Clarified Barbarian initial camp formula**: Added explicit note to the initial camps formula that "totalPlayers" means total player count (human + all AI opponents combined), consistent with the "per player" definition that follows.

### Version 3.55 (March 2026)
- **Fixed Navigation technology prerequisite**: Section 3.3.2 listed Navigation as requiring Sailing directly, contradicting the Compass row which stated Compass unlocks Navigation. Navigation now correctly requires Compass (Sailing → Compass → Navigation chain), consistent with how naval exploration technologies typically chain together. Note: v3.54's Barbarian Difficulty Scaling entry stated strength does NOT scale, but the Camp Scaling table clearly shows Deity values are 1.5× Standard — this contradiction is corrected in this version.
- **Fixed Barbarian Difficulty Scaling contradiction**: v3.54 stated "The Barbarian spawn RATE scales... not unit STRENGTH." However, the Camp Scaling table explicitly shows Deity unit strengths are 1.5× Standard values (Scout: 4→6, Raider: 6→9, Leader: 10→15). The text was factually incorrect. Updated to clarify that both spawn rate AND unit strength scale with difficulty, consistent with the table. Also removed the obsolete "×" column reference.
- **Renamed DifficultyMultiplier to DifficultyDivisor and restructured formula**: Section 3.2.2 used `× (1 + DifficultyMultiplier)` where Beginner=3x makes tiles easier (3× yield = more food/production = easier), which is backwards for a "multiplier." Renamed to DifficultyDivisor and restructured formula to `÷ (1 + DifficultyDivisor)`, where dividing by larger numbers makes the game easier (Beginner: base÷3, Deity: base÷0.7). Updated the definition, formula, and Difficulty-Based Economy table headers/values accordingly. Added clarifying note that these values are used as divisors in calculations.

### Version 3.54 (March 2026)
- **Clarified Suzerain Legacy Path objective vs detailed mechanics**: Section 2.1.3 stated "requires 3 envoys invested per city-state" which created ambiguity with Section 3.6.3's detailed Suzerain mechanics that explain "2 envoys may suffice if no competitors have invested more." The objective requires meeting the Suzerain threshold (which is 3 envoys minimum, or 2 if uncontested), while the detailed mechanics define the nuanced threshold system. Clarified both sections to explicitly reference each other: Section 2.1.3 now states "requires 3 envoys invested per city-state to become Suzerain, though 2 envoys may suffice if no competitors have invested more — see Section 3.6.3 for detailed Suzerain mechanics" to match Section 3.6.3's language.
- **Clarified Fort tile improvement vs Fortification bonus**: Section 3.6.4's Fort tile improvement description used "+50% defense" terminology. Clarified that the Fort tile improvement provides a defensive terrain bonus (+50% to defending strength) and is impassable to enemy units. The Zone of Control (ZOC) mentioned in Section 3.5.2 combat formula is a separate concept (-10% strength when entering enemy ZOC) that applies to attacking enemy-controlled tiles, not to Fort tiles.
- **Clarified Barbarian Difficulty Scaling**: The Difficulty Scaling section described "scaled by difficulty" but did not explicitly state what scales. Added clarification: "scaled by difficulty means spawn RATE scales (more frequent camp spawns), not unit STRENGTH scaling. The Camp Scaling table's unit strength values are fixed per difficulty level (Deity uses higher base values than Standard, as shown in the table)." Note: this entry contained a factual error — see v3.55 for correction.
- **Added Navigation civic to prerequisites table**: Section 3.3.2 was missing the Navigation civic entry from the prerequisites table, creating an inconsistency with the Civic Tree table (Section 3.3.4) which lists Navigation (Exploration) with prerequisite "—". Added Navigation (Exploration) to Section 3.3.2 with prerequisite "—" and unlock note "(no unlocks — Navigation civic provides Inspiration trigger only)".

### Version 3.53 (March 2026)
- **Duplicate of v3.54** (removed duplicate entries; all content moved to v3.54)

### Version 3.52 (March 2026)
- **Fixed Iron Working technology missing "(Tech)" suffix**: Section 3.3.1 cost table listed "Iron Working" without the "(Tech)" suffix, creating inconsistency with "Bronze Working (Tech)" in the same table. Added "(Tech)" suffix to match the naming convention.
- **Fixed Bronze Working technology reference in prerequisites table**: Section 3.3.2 prerequisites table listed "Bronze Working" without the "(Tech)" suffix, causing inconsistency with the cost table entry. Added "(Tech)" suffix for consistency.
- **Fixed Iron Working technology reference in prerequisites table**: Section 3.3.2 prerequisites table listed "Iron Working" without the "(Tech)" suffix, causing inconsistency with the cost table entry. Added "(Tech)" suffix for consistency.
- **Added Mercenaries unit to Unit Classes table**: The Akkad city-state bonus references "+100% Production toward Mercenaries" but there was no Mercenary unit defined in Section 3.5.1. Added Mercenary unit class row to the table with note that it's unlocked via Policies in Exploration+ era.
- **Added Entertainment district and moved Arena**: The Muscat city-state bonus references "+1 Amenity from Entertainment" but there was no Entertainment district defined. Added Entertainment district (base: +2 Amenities) with Arena and Zoo buildings (Zoo was moved from Theater Square to Entertainment since it provides Amenities, making it more appropriately placed in Entertainment district). Removed duplicate Arena from Theater Square to avoid conflicts.

### Version 3.51 (March 2026)
- **Fixed Gallery building missing technology prerequisite**: Section 3.6.2 Buildings table had Gallery with "—" in the Tech Required column, which was inconsistent with other buildings that have technology prerequisites. Added "Recording History" as the prerequisite since Gallery stores Great Works of Art (per Section 3.9) and Recording History is the civic that enables cultural buildings.
- **Fixed Cross-era Synergies Era Score wording**: Section 2.1.3 stated "+1 Era Score per city per completed synergy tier" which made the tier descriptions ambiguous (lines 128-130 showed flat values). Changed to "The synergy grants Era Score based on completed synergy tier" to clarify the bonuses are flat values, not per-city.

### Version 3.50 (March 2026)
- **Fixed Navigation civic era label**: Section 3.3.4 listed the Navigation civic without an era label while other Exploration-era civics in the same block had no era label. Changed to "Navigation (Exploration)" to match the format of Navigation technology in Section 3.3.1 and clarify that this is a separate civic from the technology of the same name.
- **Clarified Barbarian spawn intervals**: Section 3.5.4's description of camp spawning was ambiguous about the relationship between the 30-turn new camp spawn rate and the unit spawn intervals from existing camps. Added explicit distinction: "**New camp spawn rate**: 1 new camp every 30 turns (Standard difficulty), scaled by difficulty" and "**Unit spawn interval**: Units spawn from existing camps at the intervals shown in the Camp Scaling table (varies by era and difficulty)" to clarify these are two separate mechanics.

### Version 3.49 (March 2026)
- **Fixed project name inconsistency**: Changed "CIVLite" to "CivLite" in Section 1.1 Project Name and document header to match the actual project name format (lowercase "v" in "Lite").
- **Fixed Ottoman civilization bonus wording**: Changed "Production/Gunpowder bonus" to "Production/Gunpowder-era bonus" in Section 2.1.2 (Exploration Age civilizations) to avoid confusion with non-existent "Gunpowder" technology.

### Version 3.48 (March 2026)
- **Fixed Fort tile improvement tech requirement**: Fort tile improvement was listed as requiring Military Tactics (Exploration era), but Construction (Antiquity) and Engineering (Antiquity) both had Eureka triggers requiring Forts. This created impossible Eurekas in Antiquity. Changed Fort to require Engineering instead of Military Tactics, enabling Fort building in Antiquity era and fixing the circular Eureka triggers.
- **Fixed Engineering Eureka trigger**: Engineering's Eureka was "Build a Fort" but Fort now requires Engineering (circular). Changed to "Build a Road" since Roads are directly unlocked by Engineering.
- **Expanded Tile Yield Formula**: Section 3.2.2 formula was vague ("Base Yield + Bonus + Bonus...") with no actual values or structure. Added complete formula with definitions: `TileYield = (BaseYield + ResourceBonus + FeatureBonus) × (1 + DifficultyMultiplier) × (1 + PolicyBonus) + GovernmentBonus + ImprovementBonus`, including definitions for each component.
- **Clarified Infantry era placement**: Section 3.5.6 listed Infantry under "Exploration" era which contradicted Section 3.5.1 showing Infantry under Modern. Added clarifying note that Infantry is technically available from Exploration Age (via Military Tactics) but becomes prominent in Modern Age.

### Version 3.47 (March 2026)
- **Added Iron Working to Antiquity tech cost table**: Iron Working was referenced as a prerequisite for Heavy Cavalry units and Metallurgy technology (Section 3.3.2) but had no cost entry in Section 3.3.1's Antiquity era tech costs table. Added Iron Working (65 beakers, Eureka: Train a Swordsman unit, -50% bonus) to complete the tech progression chain.
- **Fixed Constitutional Monarchy government era mismatch**: Section 4.2.4 Government Panel example displayed "Merchant Republic (Exploration)" with 20 Culture cost, but Constitutional Monarchy exists in Section 3.4.1 as a Modern era government (cost 40 Culture). Updated the example to display "Constitutional Monarchy (Modern) [Change Government: 40🎭]" to reflect the correct era and cost tier.
- **Clarified Suzerain threshold in Legacy Path objective**: Section 2.1.3 objective 5 referenced "the Suzerain threshold" without defining it. Added explicit clarification: "requires 3 envoys invested per city-state to become Suzerain, though 2 envoys may suffice if no competitors have invested more" to align with Section 3.6.3's detailed Suzerain mechanics.
- **Clarified Scout to Caravel upgrade path**: Section 3.10.9 mentioned "Scout → Caravel" without explaining how a Support class Scout upgrades to a Naval Melee Caravel. Added clarification that Scout can upgrade to Caravel when embarked on coastal water, making the upgrade path logical and consistent.

### Version 3.46 (March 2026)
- **Fixed Exploration Age civilization numbering gap**: Section 2.1.2 listed civilizations 10 (England) and 12 (Aztecs) with no number 11 between them. Added missing "11. Aztecs" to complete the sequential numbering for all 12 Exploration Age civilizations.
- **Fixed Suzerain objective envoy reference**: Section 2.1.3 said "requires 3 envoys per city-state" which conflicted with Section 3.6.3's detailed Suzerain mechanics that explain the threshold can be 2 envoys with no competition. Changed to "requires meeting the Suzerain threshold" to avoid contradicting the nuanced suzerain mechanics defined in Section 3.6.3.
- **Fixed duplicate Navigation civic/tech Eureka**: Navigation civic and Navigation technology both had "Reach the New World" as their Eureka/Inspiration trigger, creating redundancy. Changed Navigation civic's trigger to "Establish an international trade route to a continent you did not start on" to differentiate it from the technology's exploration-focused trigger.
- **Clarified Fort tile improvement description**: Changed "blocks passage" to "impassable to enemy units" to better describe the Fort tile's actual gameplay effect rather than the vague "blocks passage" phrasing.
- **Fixed Natural Wonders count mismatch**: Section 2.4.6 header stated "There are 9 discoverable Natural Wonders" but the numbered list only contains 8 items (Mt. Sinai, Lake Victoria, Krakatoa, Paititi, Bermuda Triangle, Giant's Causeway, Yongding, Tsingy). The 9th claimed item (Reefs) is actually defined as a tile feature, not a Natural Wonder. Changed header to "There are 8 discoverable Natural Wonders" to match the actual count.

### Version 3.45 (March 2026)
- **Fixed Refrigeration table formatting error**: Section 3.3.1 had an extra column in the Refrigeration row with "Education (Exploration+)" inserted where the format should only have 5 columns (Era, Tech, Cost, Eureka Trigger, Eureka Bonus). Removed the erroneous column.
- **Added missing Modern era unit definitions**: Section 3.5.6 now includes all Modern era units referenced in the Unit Classes table (3.5.1): Infantry, Mechanized Infantry, Fighter, Bomber, Jet Fighter, Tank, and Modern Armor.
- **Fixed Bronze Working and Iron Working naming conflict**: Added "(Tech)" and "(Civic)" suffixes to distinguish between the technology and civic versions of Bronze Working and Iron Working throughout the spec. This prevents implementation confusion since both have separate costs, prerequisites, and Eureka triggers.
- **Clarified OpenRouter meta prompt section**: Removed "(Condensed ~250 tokens)" from section header and reworded the description to clearly state the prompt summarizes key game state information, not that it represents an uncondensed alternative.
- **Defined trade route baseYield variable**: The trade route yield formula referenced `baseYield` but did not define it. Added definition: baseYield is the minimum yield value shown in the trade route table (e.g., 2 for Land Domestic, 4 for Land International), with modifiers added based on player gold per turn and distance.

### Version 3.44 (March 2026)
- **Fixed Natural Wonders count mismatch**: Section 2.4.6 header stated "8 discoverable Natural Wonders" but the list contains 9 items. Changed to "9 discoverable Natural Wonders" to match the actual count (Mt. Sinai, Lake Victoria, Krakatoa, Paititi, Bermuda Triangle, Giant's Causeway, Yongding, Tsingy, and Reefs).
- **Added Barbarian Leader Era Score entry**: Section 3.1 Era Score table was missing the Barbarian Leader kill reward (+8 Era Score) despite Section 3.5.4 defining this reward. Added "| Kill a Barbarian Leader | +8 | Yes |" entry.
- **Fixed era classification for Electricity, Refrigeration, and Combustion**: Section 3.3.3 listed these technologies under "Modern Era Technologies" header, but their prerequisites place them in Exploration+: Electricity requires Steam Power (Exploration+), Refrigeration requires Education (Exploration), and Combustion requires Refining (which requires Steel, both Exploration+). Added "(Exploration+)" suffix to these tech entries to clarify they become available in Exploration era. Also added clarifying note to the section header: "(Exploration+ prerequisites may apply)".
- **Fixed duplicate Eureka trigger for Metallurgy and Steel**: Section 3.3.1 had both Metallurgy and Steel using "Build a Forge" as their Eureka trigger. Since the Forge building requires Metallurgy (per Section 3.6.2), this created a logical conflict. Changed Metallurgy's Eureka to "Train a Heavy Cavalry unit" (reflecting Metallurgy's unlock of Heavy Cavalry units) and kept Steel's Eureka as "Build a Forge" (valid since Forge requires Metallurgy, a prerequisite of Steel).
- **Added clarifying parentheses to Barbarian Camp formula**: Section 3.5.4 showed `floor(totalPlayers ÷ 2) + 1` with line break separating the formula components, causing visual ambiguity. Added parentheses: `(floor(totalPlayers ÷ 2)) + 1` for clarity.
- **Fixed Raze duration minimum threshold**: Section 3.10.7 stated "minimum 3 turns" but the formula `population × 1.5` yields 1.5 turns for cities with 1 population. Changed formula to `max(3, population × 1.5)` to ensure the minimum is always enforced mathematically.
- **Clarified Nuclear Device combat mechanics**: Section 3.5.2.1 did not specify whether Nuclear Device damage uses the standard combat formula. Added explicit note: "**Automatic destruction — does not use the standard combat formula**" to clarify that nuclear weapons bypass combat resolution entirely.
- **Added Suzerain threshold reference to Legacy Path objective**: Section 2.1.3's "Be Suzerain of all city-states" objective did not reference the suzerain threshold. Added "(requires 3 envoys per city-state)" to clarify the requirement, referencing Section 3.6.3's suzerain mechanics.

### Version 3.43 (March 2026)
- **Fixed Modern Age Legacy Path objective wording**: Section 2.1.3 point 4 previously said "Win any victory condition" which was ambiguous. Changed to "Win any other victory condition (Domination, Science, Cultural, Religious, or Diplomatic)" to clarify that Age Victory is about completing legacy objectives, not winning itself.
- **Fixed Caravelle notation in Unit Classes table**: Section 3.5.1 showed "Caravelle (Compass)" which was incorrect. Caravelle is discovered by Navigation technology, not Compass. Removed the "(Compass)" suffix. Also fixed Ship of the Line from "Requires Optics" to "Discovered by Navigation technology" for consistency.
- **Fixed Galleass description**: Changed "Replaces Galley" to "Upgrade from Galley" since Galleass is a Naval Ranged unit that upgrades from the Naval Melee Galley, not replaces it.
- **Added Artifact slots to Museum building**: The Museum building was missing explicit Artifact slots despite Great Naturalists creating Great Works of Artifacts that are stored in Museum. Added "+2 Artifact slots" to the Museum building entry.
- **Added Writing slots to Library building**: The Library was missing Great Writing slots despite Great Writers storing their works in Library or Museum. Added "+1 Great Writing slot" to the Library building entry.
- **Added Music slots to Broadcast Tower**: The Broadcast Tower was missing Great Work of Music slots despite Great Musicians storing their works in Broadcast Tower or Theater Square. Added "+1 Great Work of Music slot" to the Broadcast Tower building entry.
- **Fixed duplicate Steel technology entry**: Section 3.3.1 had Steel listed twice in the Exploration era tech table (both at row 451 and again after Banking). Removed the duplicate Steel entry at line 451-452.
- **Added missing Steam Power to Exploration tech table**: Section 3.3.1 was missing Steam Power from the Exploration era technology costs table despite Steam Power being a key technology (prerequisite for Industrial Zones, Factories, Railroads). Added Steam Power (250 beakers) with Eureka trigger "Build an Industrial Zone district" to the Exploration era table between Banking and the Modern era section.
- **Fixed duplicate Navigation naming conflict**: The spec contained both a "Navigation" technology (in 3.3.1 and 3.3.2) and a "Navigation" civic (in 3.3.4). This creates confusion since they serve different purposes (Navigation tech unlocks naval units like Caravelle/Ship of the Line, while Navigation civic provides "Reach the New World" inspiration). Added era labels to both entries in the tech cost table to distinguish them: "Navigation | 180 | Reach the New World" for technology (Exploration era).
- **Fixed Great Library wording redundancy**: The Great Library wonder entry said "+1 Science per Library, +1 Science per University" which is redundant. Simplified to "+1 Science per Library and +1 Science per University in the building's city only" for clarity.
- **Fixed Trade Route Capacity inconsistency**: Section 3.7.1 states base routes = 2, but Section 3.10.2 says maximum active trade routes = `2 + (population ÷ 50)`. These are consistent (base 2 plus 1 per 50 pop = formula). However, Section 3.7.2 (Trade Route Yields) only shows yields without referencing how route capacity is calculated. Added reference to Section 3.7.1's formula in the Trade Route Yields section for completeness.
- **Fixed Constitutional Monarchy government era**: Section 3.4.1 Government Types table lists Constitutional Monarchy as a Modern era government, but earlier versions of the spec had it as Exploration. Modern is correct given Constitutional Monarchy's historical context and the table structure. No change needed - this was verified as correct.
- **Verified Civil Engineering civic prerequisite**: Confirmed Civil Engineering is correctly listed as the prerequisite for Urbanization, Replaceable Parts, and Electrification civics in Section 3.3.4. No issues found.

### Version 3.41 (March 2026)
- **Fixed Suzerain of All City-States ambiguity**: Section 2.1.3 and Section 3.6.3 did not clarify whether suzerainty must be maintained simultaneously or achieved at any point. Clarified that players must be Suzerain of ALL city-states simultaneously at the moment of checking (consistent with how other victory conditions work). Added "(must be achieved and maintained simultaneously — if a city-state is lost, it must be regained before the objective is complete)".
- **Fixed non-existent government reference in UI**: Section 4.2.4 Government Panel displayed "Constitutional Monarchy (Exploration)" as a government option, but Constitutional Monarchy does not appear in the Government Types table (Section 3.4.1). Changed to "Merchant Republic (Exploration)" since it is the only Exploration-era government in the table.
- **Clarified Suzerain threshold text**: Changed "Suzerain threshold: 3 envoys to become Suzerain" to "Suzerain threshold: 3 envoys" to avoid redundant phrasing (the section already explains "The player with the most envoys invested in a city-state becomes its Suzerain").
- **Clarified National Parks "unique terrain configuration"**: Added definition that "unique terrain configuration" means a unique combination of tile types (e.g., Mountain tiles only vs. Hills tiles only vs. mixed natural tiles). Two National Parks cannot use the same terrain type combination, regardless of specific tile locations.
- **Fixed Suzerain bonus text**: Changed "Seoul: +2 Science from Campus buildings" to "Seoul: +2 Science from Campus buildings per city" to clarify that the bonus applies per-city, not per-city-state (consistent with other per-city bonuses like Zanzibar's "+2 Gold per city").

### Version 3.40 (March 2026)
- **Fixed self-referential Exploration Age transition text**: Section 2.1.2 said "Same rules as Exploration Age transition" which referenced itself. Changed to "Same rules as Antiquity→Exploration transition" for clarity.
- **Fixed circular Technology prerequisites**: Section 3.3.2 had a circular dependency where Astronomy → Navigation → Astronomy. Removed cross-dependencies so Astronomy and Navigation both require Optics directly (no interdependency).
- **Fixed Scout evolution notation**: Section 3.5.1 Support class row had confusing "Scout -> Caravel (exploration)" notation. Changed to list all Exploration support units explicitly: "Scout, Settler, Caravel (exploration)".
- **Fixed Walls building table formatting**: Section 3.6.2 had Walls row incorrectly starting with "Encampment" in the first column. Changed to empty first column to properly continue under the Encampment district header.
- **Fixed Camp improvement valid tiles**: Section 3.6.4 listed "Stone" as a valid tile for Camp, but Stone resources use Quarry improvement, not Camp. Removed Stone from Camp's valid tiles.

### Version 3.39 (March 2026)
- **Fixed Nuclear Fission era/prerequisite contradiction**: Section 3.3.1 listed Nuclear Fission in the Antiquity era table with prerequisite Metallurgy (cost 850), while Section 3.3.3 listed it in the Modern era table with prerequisite Electricity (cost 850). Nuclear Fission is now correctly placed in the Modern era with Electricity as its prerequisite. Removed the duplicate Nuclear Fission entry from Section 3.3.1 (which was also incorrectly listed as Antiquity-era). Updated the prerequisites table (3.3.2) to show Nuclear Fission (Electricity → Nuclear Fission → Fusion) as the correct dependency chain for Modern-era nuclear technology.
- **Added Zoo building to Buildings table**: Zoo was defined in Section 3.5.7 (National Parks) and referenced in Section 3.6.3 (City-States), but had no formal entry in the Buildings table. Added Zoo (Theater Square district, 300 Production, Conservation civic required) with effect "+2 Amenities from National Parks." This completes the Zoo → National Parks connection across all relevant sections.
- **Added Neighborhood building to Buildings table**: Neighborhood is referenced in the Housing formula (Section 3.6.1) as providing +4 Housing, but had no formal Buildings table entry. Added Neighborhood (Urbanization civic, 600 Production) with effect "+4 Housing, +1 Amenity." This enables players to exceed the Aqueduct's housing cap for cities reaching higher populations.
- **Added Sewer building to Buildings table**: Sewer is referenced in the Housing formula (Section 3.6.1) as providing +2 Housing, but had no formal Buildings table entry. Added Sewer (Civil Engineering civic, 300 Production) with effect "+2 Housing."

### Version 3.38 (March 2026)
- **Fixed Zoo building table entry**: The Zoo row in the Buildings table had "Conservation" misplaced in the Cost column (3rd column) instead of being in the Effect column. The entry now reads `| Zoo | 300 | +2 Amenities from National Parks (Conservation civic required) |`, correctly showing 300 Production as the cost.
- **Added Iron and Copper resource improvements**: Iron (Antiquity+) and Copper (Antiquity+) strategic resources were defined in the Resources section but had no corresponding improvement entry. Added Mine (Iron) and Mine (Copper) to the resource-specific improvements section, clarifying that both use the standard Mine improvement with +2 Production, and updated the Mine row's Valid Tiles column to explicitly include "Iron tiles" and "Copper tiles" alongside Hills and Mountains.

### Version 3.37 (March 2026)
- **Added missing Cathedral prerequisite**: Section 3.6.2 Buildings table now notes "Philosophy required" in Cathedral's effect column, since the table has no dedicated prerequisite column. Cathedral should only be buildable after researching Philosophy (matching the Holy Site → Shrine → Temple → Cathedral progression).
- **Added Zoo building definition**: Zoo building was referenced in the National Parks section (Section 3.5.7) but was absent from the Buildings table. Added Zoo (Conservation civic, 300 Production, Theater Square district) with +2 Amenities from National Parks. Updated National Parks section to reference Zoo explicitly.
- **Fixed repetitive Suzerain threshold wording**: Section 3.6.3 previously explained the 3-envoy threshold twice with redundant phrasing ("3 envoys to become Suzerain" followed by "The 3-envoy threshold is the automatic trigger"). Consolidated into a single clear statement.

### Version 3.36 (March 2026)
- **Clarified Suzerain threshold**: Section 3.6.3 now explains that while 3 envoys is the automatic trigger for Suzerain status, a player with 2 envoys can still become Suzerain if no other player has invested more envoys in that city-state (ties broken by first arrival).
- **Added Era and Difficulty columns to Barbarian Scaling table**: Table now includes both Era and Difficulty columns showing unit strength scaling and spawn intervals for Standard and Deity difficulties across all three ages.
- **Added Housing formula to City Growth section**: Section 3.6.1 now defines the Housing formula: `BaseHousing = 2 + (CityCenter × 1) + (Palace × 1) + (Aqueduct × 3) + (Sewer × 2) + (Neighborhood × 4)`, plus descriptions of Housing-providing buildings.
- **Removed redundant Modern Age transition text**: Eliminated duplicated explanation of age transition rules from Section 2.1.3, replacing with a reference to the Exploration Age rules (which already define the full mechanic).
- **Fixed Walls building row format**: Corrected table formatting from "Walls | Engineering | 120" to proper "Walls | Engineering (120)" format in the Buildings table.
- **Added Iron Working civic to Civic Tree**: Added Iron Working (Antiquity, 80 Culture, prerequisite: Bronze Working, Inspiration: Improve Iron resource) to Section 3.3.4. Also corrected its prerequisite from "—" to "Bronze Working".
- **Clarified Fort tile improvement vs Fortification**: Added distinction between the Fort tile improvement (+50% defense bonus) and unit Fortification status (+5% per turn, max +20%). Clarified that Fort tile improvement bonus replaces fortification bonus (50% > 20%).
- **Added Barbarian camp minimum spacing**: Added requirement that Barbarian camps must be at least 10 tiles apart. If no valid tile exists at minimum distance, the spawn is skipped.

### Version 3.35 (March 2026)
- **Removed duplicate Quarry tile improvement**: Consolidated two conflicting Quarry entries (lines 795 and 810) into a single unified definition with correct yield (+1 Production, +2 on Stone/Marble) and valid tiles (Stone, Marble, Hills, Mountains).
- **Fixed Civic naming conflict with Technology**: Renamed "Electricity" civic to "Electrification" in Section 3.3.4 to avoid confusion with the "Electricity" technology in Section 3.3.3. Both had identical names but different prerequisites (Civil Engineering vs. Steam Power).
- **Completed City Growth Formula**: Added definition for FoodConsumed (`Population × 1`) to the formula in Section 3.6.1, completing the full growth calculation: `FoodSurplus = FoodProduced - (Population × 1)`.

### Version 3.33 (March 2026)
- **Fixed Celts civilization entry**: Changed "Celts (Faith/Production, Picts unique)" to "Celts (Faith/Production bonus, Picts unique unit)" to match the format of other civilization entries.
- **Fixed Harappa civilization entry**: Changed "Harappa (Food/Production, Indus River bonus)" to "Harappa (Food/Production bonus, River bonus)" to match the format of other civilization entries.
- **Fixed World Congress formation requirement**: Changed "after all players have had at least 3 cities" to "after each player has founded at least 3 cities" in Section 2.5.5 for clarity.
- **Fixed Printing technology prerequisite**: Changed Printing's prerequisite from Medieval Faires to "—" in Section 3.3.2. Medieval Faires is a Civic, not a Technology, so it cannot be a prerequisite for a Technology.
- **Clarified international trade route culture sharing**: Added "+2 Culture per turn" to the international route description in Section 3.7.1.
- **Fixed Suzerain of all city-states victory objective**: Clarified that the example refers to the number of city-states spawned (based on setting), not the number of city-state types.

### Version 3.9 (March 2026)
- **Added Government Mechanics section**: Section 3.4.3 previously just said "(Section 4.2.4)" — a backward reference. Added a brief paragraph defining what governments do (passive bonuses, policy slots, switching costs) before the UI reference.
- **Clarified Open Borders definition**: Previously said Open Borders is "unlocked by Enlightenment civic" but the Embassy building (Foreign Trade) is what enables the diplomatic agreement. Clarified that Open Borders requires an Embassy in the civilization's capital, and the Enlightenment civic represents the diplomatic context.

### Version 3.8 (March 2026)
- **Clarified Map Sizes column header**: Changed "Tiles (Standard Ratio)" to "Dimensions (Total Tiles)" for accuracy. The column shows width×height dimensions and total tile count (e.g., "20×12 (240)"), not a ratio.
- **Clarified Petra wonder wording**: Simplified "+2 Gold, +1 Production to all desert tiles in the building's city and worked tiles empire-wide" to "+2 Gold, +1 Production to all worked Desert tiles empire-wide" — Petra is empire-wide, not city-local.
- **Added Embassy building**: Open Borders is referenced as a diplomatic agreement (enabling +25% Tourism) and the Open Borders bonus is referenced in the Tourism formula, but no Embassy building was defined. Added Embassy (Foreign Trade civic, 50 Production, enables Open Borders diplomatic agreement, +2 Gold from trade routes to that civilization).

### Version 3.7 (March 2026)
- **Fixed all circular Eureka triggers in Antiquity tech tree**: Nearly every Antiquity technology had an impossible eureka trigger (e.g., "Build a Quarry" required Masonry, which requires the quarry itself; "Build a Farm" required Pottery, etc.). Changed all to non-circular alternatives:
  - Mining: unchanged (mine a resource tile - always possible)
  - Bronze Working: unchanged (kill a melee unit - Warriors available from start)
  - Masonry: "Build a Quarry" → "Build 3 Mines" (Mines require Mining, prerequisite of Masonry)
  - Pottery: "Build a Farm" → "Build 3 Farms" (farms are buildable without Pottery in this version, as a basic improvement)
  - Writing: "Build a Library" → "Earn 100 Gold" (no building prerequisite)
  - Mathematics: "Build a Monument" → "Train a Scout unit" (Scout available from start)
   - Construction: "Build a Water Mill" → "Build 3 Forts" (Fort tile improvement moved from Military Tactics to Engineering to enable Antiquity-era Fort building)
  - Horse Riding: "Build a Stable" → "Build a Pasture" (Pasture requires Animal Husbandry, prerequisite of Horse Riding)
  - Archery: "Build an Archery Range" → "Train an Archer unit" (Archer available from start with Archery tech)
   - Engineering: "Build an Aqueduct" → "Build a Road" (Fort tile improvement moved from Military Tactics to Engineering; Eureka changed to Road which Engineering directly unlocks)
  - Animal Husbandry: unchanged (Pasture requires Animal Husbandry, but alternative trigger kept for consistency)
- **Fixed circular Exploration-era eurekas**: Changed Astronomy ("Build an Observatory" → "Build a Harbor"), Education ("Build a University" → "Build 3 Libraries"), Military Tactics ("Build a Barracks" → "Train 3 Melee units"), Banking ("Build a Bank" → "Build a Market"), Refrigeration ("Harvest a Whale or Pearls" → "Harvest a Whale resource"), Steel duplicate ("Build a Forge" kept - Metallurgy is prerequisite).
- **Fixed circular Modern-era eurekas**: Changed Radio ("Build a Broadcast Tower" → "Build a Stock Exchange", Stock Exchange requires Banking Exploration civic), Electricity ("Build a Power Plant" → "Build a Factory", Factory requires Steam Power Exploration tech, prerequisite of Electricity).

### Version 3.6 (March 2026)
- **Defined Open Borders Tourism bonus**: The Tourism formula includes "Open Borders bonus" but no value was specified. Added definition: +25% Tourism toward civilizations that have granted you Open Borders (via diplomatic agreement, unlocked by Enlightenment civic).
- **Added City Walls building**: Cities referenced "Walls" for sight radius and Great Wall referenced "walls" for production, but no Walls building existed. Added Walls (Engineering, 120 Production, +3 Defense strength, +1 City sight radius, +1 Amenity) to the Encampment district.
- **Clarified Great Wall wonder wording**: Changed "+1 Culture per tile with walls" to "+1 Culture per worked tile in cities with Walls built" to clarify it applies to all worked tiles in cities that have built the Walls building.
- **Clarified Machu Picchu wonder wording**: Changed "+2 Gold to all mountain trade routes" to "+2 Gold to all trade routes that pass through Mountain tiles" to clarify that the bonus applies to any trade route crossing mountains, not just routes specifically designated as "mountain routes."
- **Clarified Age Victory carry-over calculation**: Added formula detail: carry-over bonus (+15% production) applies if Era Score ≥ 20, and the +50 Age Victory bonus counts toward this threshold check.
- **Clarified Suzerain for All victory scaling**: Added "(scales with city-state count setting)" to clarify the objective adapts based on map size configuration.

### Version 3.5 (March 2026)
- **Fixed Japan extra space indent**: Line 74 had 4 spaces before "2. Japan" instead of 3, making it inconsistent with other civilization entries.
- **Fixed Tsingy extra space indent**: Natural Wonders numbered list had an extra space before "8. Tsingy" (3 spaces instead of 2), making it inconsistent.
- **Fixed circular Steam Power eureka**: "Build a Factory" was impossible since Factory requires Steam Power. Changed to "Build an Industrial Zone district" which can be built once Engineering (a prerequisite) is researched.
- **Fixed circular Printing eureka**: "Build a University AND own 2 Libraries" was impossible since University requires Education, which requires Printing. Changed to "Build 3 Libraries" (Libraries require Writing, which is a root technology).
- **Fixed circular Steel eureka**: "Build an Ironworks" was impossible since Ironworks building requires Steel technology. Changed to "Build a Forge" (Forge requires Metallurgy, a prerequisite of Steel).
- **Added civic prerequisites to Modern era civic tree**: Added Prerequisite column to the Civic Tree table (3.3.4). Added missing prerequisites: Urbanization (Civil Engineering), Replaceable Parts (Civil Engineering), Conservation (Urbanization), Mass Media (Replaceable Parts), Global Warming (Mass Media), Social Media (Mass Media). All Modern era civics now have proper dependency chains.
- **Added Oil Well, Coal Mine, and Aluminum Mine to Tile Improvements table**: These strategic resource improvements were referenced in the "Resource-specific improvements" section but had no corresponding entry in the main Tile Improvements table. Also clarified that Quarry yields +2 Production on Stone/Marble resources.
- **Fixed Chichen Itza "Gunpowder units"**: Changed to "units requiring Military Tactics technology" since there is no "Gunpowder" technology in the spec.
- **Clarified Colossus wonder wording**: Changed "+3 Gold per Harbor" to "+2 Gold per Harbor in the building's city" to clarify it's city-local like Great Library, not empire-wide.
- **Clarified Great Library wonder wording**: Changed "+2 Science per University" to "+1 Science per University" (correcting the per-building bonus) and added clarification that effects apply to the building's city only.

### Version 3.4 (March 2026)
- **Fixed circular Education/Printing dependency**: Section 3.3.2 prerequisite table had Education requiring Printing AND Printing requiring Education. Changed Printing's prerequisite from Education to Medieval Faires (the previous Exploration civic), breaking the cycle.
- **Removed duplicate changelog entries**: Version 2.8 and 2.9 both contained identical entries for "Added 6 missing buildings," "Added Stone and Marble," "Fixed Aqueduct," and "Fixed City-State Envoy schedule." Removed the duplicate entries from v2.8, keeping them only in v2.9 where they belong.
- **Moved Fascism government to Modern era**: Fascism was listed as an Exploration-era government but is historically and mechanically a Modern-era government. Moved it from Exploration to Modern in the Government Types table, placing it between Democracy and Digital Democracy.
- **Added missing Corporations civic**: Corporations civic was referenced in Modern Age mechanics but did not appear in the Civic Tree table. Added Corporations (Modern, 380 Culture, Inspiration: Have 5 unique resource types improved).
- **Added prerequisites to Modern Era Technologies table**: Added missing prerequisite column. Filled in: Electricity (Steam Power), Computers (Electricity), Telephones (Electricity), Satellites (Rocketry), Advanced Computing (Computers), Plastics (Refining), Robotics (Electricity), Laser (Advanced Computing). Also removed standalone Electricty from prerequisites table since it's now in 3.3.3.
- **Clarified Government change cost tiers**: Changed "Tier 1/2/3" labels to explicitly map to era names (Tier 1 = Antiquity, Tier 2 = Exploration, Tier 3 = Modern) to avoid confusion with Policy card tiers.
- **Defined trade route distanceBonus**: Added formula definition: distanceBonus = number of road or railroad tiles along the trade route path.
- **Clarified victory tie-breaker Technologies**: Changed "Technologies × 3" to "Technologies Researched × 3" to clarify it counts completed technologies, not available or total technologies.
- **Added Floodplains and Oasis tile features**: Both were referenced in Farm improvement, Desert tile row, and Egypt's civilization ability, but had no formal definition. Added formal Tile Features table with base yields and spawn conditions.
- **Added Nuclear Weapon definition**: Referenced in Uranium resource and Domination Victory, but had no unit definition. Added Nuclear Device unit (Strength 150, Range 7, destroys cities/units, creates Fallout terrain, requires Uranium consumed on use).
- **Expanded Modern Age mechanics**: Space Race, Corporations, Industrial Zones, Railroad Networks, and Nuclear Weapons were listed as Modern Age mechanics but had no definitions. Added detailed descriptions for each.
- **Added Exploration & Modern Era Units**: Units referenced in Unit Classes table (Bombards, Cuirassier, Caravelle, Galleass, Ship of the Line, Steamship) had no definitions. Added a reference table noting their class and key attributes.
- **Added National Parks definition**: Only mentioned in passing (requires Naturalist unit). Added full mechanics: valid terrain (4 adjacent natural tiles in workable radius), +10 Tourism per park, 1 park per Naturalist.
- **Added Power yield type**: Referenced in Factory (+2 Power) and Power Plant (+1 Production per adjacent Factory) but Power was never defined as a yield. Added to Yield Types table.
- **Added Aerodrome district**: Referenced by Airfield improvement (+2 Air capacity) and Advanced Flight Eureka (Build 3 Airports), but no Aerodrome district was defined. Added as a district (Flight technology, +2 Air capacity, +25% Production toward air units).
- **Added Stable building**: +1 Production, +15 XP to cavalry units, enables Light Cavalry training. Referenced by Horse Riding Eureka trigger.
- **Added Gallery building**: +2 Culture, +1 Great Art slot, +1 Great Artist point. Referenced as a storage location for Great Works of Art alongside Museum.
- **Added Copper as Strategic Resource**: Copper (Antiquity+) distributed 3-5 per player region, used for early melee units. Also referenced in the Mining eureka trigger.
- **Added Reefs tile feature definition**: Special coastal feature providing +1 Production to Harbor district and +1 Science to adjacent Campus districts. Nan Madol Suzerain bonus references this.
- **Added Moai tile improvement**: +2 Culture, built on Coast shoreline tiles. Referenced by Rapa Nui city-state Suzerain bonus.
- **Fixed Launch Pad wording**: Corrected "Rocketry campus district" to "Campus district (requires Rocketry technology researched)" — Rocketry is a technology, not a district type.
- **Added Wonder costs note**: Added overview to Section 6 clarifying that World Wonder costs range from 300-700 Production, scale with game speed, and are defined in wonders.json.

### Version 3.1 (March 2026)
- **Fixed Natural Wonders section header count**: Updated from "World Wonders (8)" to "World Wonders (9)" to match the actual count (including Pyramids).
- **Fixed Promotion Trees Ranger clarity**: Added note that Ranger (+25% attack from hills/forest) is available to ranged and melee classes, matching the Level 2+ class-based unlock system.
- **Consolidated duplicate Version 2.8 changelog entries**: Combined two separate Version 2.8 blocks (one from v2.9 review, one from v2.8 review) into a single comprehensive Version 2.8 entry containing all fixes from that review cycle.

### Version 3.0 (March 2026)
- **Fixed World Wonders count**: Updated header from "8 total" to "9 total" to account for the Pyramids wonder added in v2.8.
- **Fixed Religion founding order**: Corrected sequence so Pantheon (20 Faith) is established before Religion (8 Prophet points), matching standard game progression. Pantheon is more accessible and should come first.
- **Fixed Diplomatic Victory Favor requirement**: Clarified that 20+ Diplomatic Favor provides a per-game advantage at World Congress votes, with the primary win condition being "Win 4/6 World Congress votes at game end." Removed contradictory "per turn" language.
- **Fixed City Capture "keep 50% of buildings"**: Clarified that buildings are selected randomly for retention, districts are reduced to 1 if present, and the original owner loses the city.
- **Verified Combat Formula**: Confirmed subtraction formula is correct. Defender bonuses reduce damage (lower EffectiveStrength), and the `max(1, EffectiveStrength)` floor prevents negative damage.
- **Fixed Japan numbering**: Corrected extra space indent on line 74.

### Version 2.9 (March 2026)
- **Added 6 missing buildings to Buildings table**: Palace (auto-built in capital), Water Mill (+2 Production, +1 Food to adjacent farms), Monument (+2 Culture), Forge (+1 Production, +1 Gold, +15% military production), Ironworks (+4 Production, +1 from adjacent mines/quarries), Observatory (+2 Science, +50% Campus Science). All are referenced in Eureka/Inspiration triggers.
- **Added Stone and Marble to Bonus Resources**: Both added with +1-2 Production yield, enabling Quarry improvement and Pyramids wonder to function as described.
- **Fixed Aqueduct table entry**: Corrected from building row to district row with proper "(District, not a building)" classification.
- **Fixed City-State Envoy schedule**: Added 2 starting envoys at game start (distributed across chosen city-states) so players can compete for early Suzerain. Revised schedule: 2 at game start + 1 at turn 6 + 3 at turn 12 + 6 at turn 18.

### Version 2.8 (March 2026)
- **Fixed Egypt's Pyramids**: Added Pyramids as the 9th World Wonder, providing +2 Production from Mines on Hills tiles and +1 Culture per Quarry on Stone or Marble. Corrected Egypt's civilization entry to reference the Pyramids wonder.
- **Fixed Hanging Gardens**: Clarified "+1 Food per farm per city" (not empire-wide, preventing extreme yield stacking).
- **Fixed Petra**: Clarified desert tile bonuses apply to the building's city and worked tiles empire-wide.
- **Fixed Farm Tile Improvement**: Added Floodplains as a valid tile for Farm building, enabling Egypt's civilization ability to function as described.
- **Fixed Era Score "Complete a Trade Route"**: Changed "No" (not repeatable) to "Yes" and clarified that domestic routes do not grant Era Score. International routes can be re-established each turn for repeatable Era Score.
- **Fixed Cheat Mode Toggle Location**: Corrected from "Settings → Cheat Mode toggle" to "Game Setup → Advanced → Cheat Mode toggle", matching the actual Game Setup UI.
- **Fixed Japan Civilization Description**: Changed from "Production/Flight bonus" (Flight is Modern) to "Production bonus, coastal/naval warfare specialty".

### Version 2.7 (March 2026)
- **Fixed Sailing prerequisite**: Changed from "Bronze Working" to none (—"). Bronze Working is a Civic, not a Technology.
- **Fixed Navigation prerequisite**: Simplified to only require Optics. Removed orphaned Compass dependency (Compass was unreachable).
- **Fixed Steel prerequisite**: Corrected from Metallurgy to Iron Working. Steel is a prerequisite for Refining and Military Tactics, forming the path: Iron Working → Steel → Refining → Combustion.
- **Fixed Education prerequisite** (Civic Tree): Changed from Philosophy to Printing, keeping all Exploration Civics in a coherent dependency chain.
- **Fixed Refrigeration prerequisite** (Civic Tree): Changed from Printing to Education, keeping the Exploration Civic chain coherent.
- **Fixed Mercantilism typo**: Corrected "Mercantalism" to "Mercantilism" in the Exploration Civics list.

### Version 2.6 (March 2026)
- **Fixed Cheat Mode Production Slider**: Corrected description from "Gold generation" to "Production for building units, buildings, and districts".
- **Fixed Combat Formula**: Added minimum damage floor (1) to prevent negative damage when defender has higher strength. Refactored formula for clarity.
- **Fixed Artifact Source**: Great Naturalists (not Great Artists) create Artifacts. Added Great Naturalist as a separate Great Person type.
- **Fixed Barbarian Leaders**: Changed from "Exploration Age only" to "all eras" with scaling by era.
- **Clarified Science Victory Rocket Parts**: Cities can work on multiple Rocket Parts in parallel, not sequentially.
- **Added Simultaneous Turn Mode**: Multiplayer now supports both Sequential and Simultaneous turn options.

### Version 2.4 (March 2026)
- **Fixed Age Transition Contradiction**: Clarified that age transition by turn limit is forced, not optional. Players may voluntarily transition early once 2 objectives are complete, but reaching the turn limit triggers forced transition regardless of objective completion.
- **Fixed AI Competitiveness Column**: Added missing columns (Starting Resources, AI Aggression) and clarified how difficulty multipliers affect gameplay.
- **Fixed Cultural Victory Formula**: Clarified Great Works categories (Art, Writing, Music, Artifact) and added definition for Artifacts from Great Artists.
- **Fixed Mercantalism Typo**: Corrected to "Mercantilism".
- **Added Warmonger System Details**: Added War Weariness formula, Grievances calculation, and effects on gameplay.
- **Added Suzerain System Definition**: Defined how to become Suzerain (3 envoys), how competing works, and bonus application.
- **Added Treasure Fleet Definition**: Defined Treasure Fleets as special naval trade routes with one-time use mechanics.
- **Added Colonial Settlement Definition**: Defined colonial settlements as cities on different continents with production bonuses.
- **Added City Growth Formula**: Defined how food surplus translates to population growth, including housing and amenity interactions.
- **Added Crisis System Definition**: Defined crisis types, resolution mechanics, and rewards/penalties.


