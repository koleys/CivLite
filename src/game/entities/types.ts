export type TerrainType = 'ocean' | 'coast' | 'grassland' | 'plains' | 'desert' | 'tundra' | 'snow' | 'mountain';
export type TerrainFeature = 'forest' | 'hills' | 'floodplains' | 'oasis' | 'reefs';
export type ResourceType = 'wheat' | 'cattle' | 'sheep' | 'deer' | 'furs' | 'stone' | 'marble' | 'fish' | 'iron' | 'gold' | 'silver';
export type ImprovementType = 'farm' | 'mine' | 'quarry' | 'pasture' | 'camp' | 'fishing_boat' | 'fort' | 'road' | 'railroad' | 'none';

export interface TileCoord {
  x: number;
  y: number;
}

export interface Tile {
  id: string;
  x: number;
  y: number;
  terrain: TerrainType;
  feature: TerrainFeature | null;
  resource: ResourceType | null;
  improvement: ImprovementType;
  owner: number | null;
  cityId: string | null;
  units: UnitId[];
}

export interface SpecialistSlots {
  scientist: number;
  merchant: number;
  artist: number;
}

export interface CurrentProduction {
  name: string;
  type: 'unit' | 'building' | 'wonder' | 'project';
  cost: number;
  progress: number;
}

export interface City {
  id: string;
  name: string;
  owner: number;
  x: number;
  y: number;
  population: number;
  tiles: TileCoord[];
  buildings: string[];
  currentProduction: CurrentProduction | null;
  buildQueue: CurrentProduction[];
  foodStockpile: number;
  foodForGrowth: number;
  amenities: number;
  amenitiesRequired: number;
  housing: number;
  housingUsed: number;
  specialistSlots: SpecialistSlots;
  isOriginalCapital: boolean;
  garrison: string | null;
  turnFounded: number;
  turnsOfGarrison: number;
  liberationStatus: 'none' | 'liberatable' | 'liberated';
  wasFoundedBy: number | null;
  isBeingRazed: boolean;
  razeTurnsRemaining: number;
}

export type UnitType = 
  | 'warrior' | 'settler' | 'scout' | 'archer' | 'swordsman' | 'horseman'
  | 'galley' | 'caravel' | 'caravelle'
  | 'fighter' | 'bomber' | 'jet_fighter'
  | 'musketman' | 'samurai' | 'infantry' | 'tank'
  | 'catapult' | 'cannon' | 'artillery'
  | 'great_general' | 'great_admiral' | 'nuclear_device'
  | 'missionary' | 'apostle' | 'crossbowman' | 'charioteer' | 'cavalry'
  | 'cuirassier' | 'galleass' | 'ship_of_the_line'
  | 'spearman' | 'pikeman' | 'rifleman' | 'trireme' | 'frigate' | 'battleship' | 'submarine';

export interface UnitPromotions {
  level: number;
  xp: number;
  promotions: string[];
}

export interface Unit {
  id: string;
  type: UnitType;
  owner: number;
  x: number;
  y: number;
  health: number;
  maxHealth: number;
  movement: number;
  maxMovement: number;
  strength: number;
  strengthBase: number;
  hasActed: boolean;
  promotions?: UnitPromotions;
  fortificationTurns?: number;
}

export type PlayerId = number;

export interface CurrentResearch {
  techId: string;
  progress: number;
}

export interface Player {
  id: PlayerId;
  name: string;
  isAI: boolean;
  isHuman: boolean;
  gold: number;
  cities: City[];
  units: Unit[];
  technologies: Set<string>;
  currentResearch: CurrentResearch | null;
  score: number;
  eraScore: number;
}

export type GamePhase = 'menu' | 'setup' | 'playing' | 'paused' | 'ended';
export type GameSpeed = 'online' | 'standard' | 'marathon';
export type MapSize = 'tiny' | 'duel' | 'small' | 'standard' | 'large' | 'huge';
export type Difficulty = 'beginner' | 'easy' | 'standard' | 'deity';

export interface VictorySettings {
  domination: boolean;
  science: boolean;
  culture: boolean;
  religious: boolean;
  diplomatic: boolean;
  age: boolean;
}

export interface GameSettings {
  mapSize: MapSize;
  gameSpeed: GameSpeed;
  difficulty: Difficulty;
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

export type GameAge = 'antiquity' | 'exploration' | 'modern';

export interface Camera {
  x: number;
  y: number;
  zoom: number;
}

export interface CityStateData {
  id: string;
  name: string;
  type: string;
  x: number;
  y: number;
  bonus: string;
  suzerain: number | null;
  envoys: Record<number, number>;
}

export interface GameState {
  phase: GamePhase;
  turn: number;
  age: GameAge;
  currentPlayer: PlayerId;
  settings: GameSettings;
  camera: Camera;
  map: MapData | null;
  players: Player[];
  selectedUnit: UnitId | null;
  selectedTile: TileCoord | null;
  showTileYields: boolean;
  nextId: number;
  cityStates: CityStateData[];
}

export interface MapData {
  width: number;
  height: number;
  tiles: Map<string, Tile>;
  seed: number;
}

export type UnitId = string;
export type TileId = string;
export type CityId = string;
