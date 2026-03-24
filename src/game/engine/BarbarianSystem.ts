import type { Unit, Player, MapData, TileCoord, GameAge, Difficulty } from '@/game/entities/types';

export interface BarbarianCamp {
  id: string;
  x: number;
  y: number;
  turnSpawned: number;
  hasActiveScout: boolean;
  scoutReported: boolean;
}

export interface BarbarianConfig {
  map: MapData;
  players: Player[];
  difficulty: Difficulty;
  age: GameAge;
  turn: number;
}

export interface BarbarianUnit {
  scout: number;
  raider: number;
  leader: number;
}

const CAMP_SCALING: Record<GameAge, Record<Difficulty, BarbarianUnit>> = {
  antiquity: {
    beginner: { scout: 0, raider: 0, leader: 0 },
    easy: { scout: 4, raider: 6, leader: 10 },
    standard: { scout: 4, raider: 6, leader: 10 },
    deity: { scout: 6, raider: 9, leader: 15 },
  },
  exploration: {
    beginner: { scout: 0, raider: 0, leader: 0 },
    easy: { scout: 8, raider: 14, leader: 18 },
    standard: { scout: 8, raider: 14, leader: 18 },
    deity: { scout: 12, raider: 21, leader: 27 },
  },
  modern: {
    beginner: { scout: 0, raider: 0, leader: 0 },
    easy: { scout: 16, raider: 28, leader: 36 },
    standard: { scout: 16, raider: 28, leader: 36 },
    deity: { scout: 24, raider: 42, leader: 54 },
  },
};

const UNIT_SPAWN_INTERVALS: Record<Difficulty, number> = {
  beginner: Infinity,
  easy: 12,
  standard: 8,
  deity: 6,
};

const AGE_SPAWN_INTERVALS: Record<Difficulty, number> = {
  beginner: 60,
  easy: 60,
  standard: 30,
  deity: 20,
};

const MAX_CAMPS = 8;
const MIN_CAMP_SPACING = 10;
const MIN_START_DISTANCE = 8;

export class BarbarianSystem {
  private camps: BarbarianCamp[] = [];
  private config: BarbarianConfig;
  private nextSpawnTurn: number;
  private nextUnitSpawnTurn: number;

  constructor(config: BarbarianConfig) {
    this.config = config;
    this.nextSpawnTurn = 1;
    this.nextUnitSpawnTurn = 1;
  }

  initializeCamps(totalPlayers: number): void {
    const campCount = Math.min(Math.floor(totalPlayers / 2) + 1, MAX_CAMPS);
    
    for (let i = 0; i < campCount; i++) {
      const position = this.findValidCampPosition();
      if (position) {
        this.camps.push({
          id: `camp-${Date.now()}-${i}`,
          x: position.x,
          y: position.y,
          turnSpawned: this.config.turn,
          hasActiveScout: true,
          scoutReported: false,
        });

        this.spawnInitialScout(position);
      }
    }
  }

  private findValidCampPosition(): TileCoord | null {
    const { map } = this.config;
    let attempts = 0;
    const maxAttempts = 100;

    while (attempts < maxAttempts) {
      const x = Math.floor(Math.random() * map.width);
      const y = Math.floor(Math.random() * map.height);

      const tile = map.tiles.get(`${x},${y}`);
      if (!tile || tile.terrain === 'ocean' || tile.terrain === 'mountain' || tile.cityId) {
        attempts++;
        continue;
      }

      if (!this.isFarEnoughFromPlayers(x, y)) {
        attempts++;
        continue;
      }

      if (!this.isFarEnoughFromCamps(x, y)) {
        attempts++;
        continue;
      }

      return { x, y };
    }

    return null;
  }

  private isFarEnoughFromPlayers(x: number, y: number): boolean {
    const { players } = this.config;
    
    for (const player of players) {
      for (const city of player.cities) {
        const distance = Math.abs(city.x - x) + Math.abs(city.y - y);
        if (distance < MIN_START_DISTANCE) return false;
      }
      
      for (const unit of player.units) {
        const distance = Math.abs(unit.x - x) + Math.abs(unit.y - y);
        if (distance < MIN_START_DISTANCE) return false;
      }
    }

    return true;
  }

  private isFarEnoughFromCamps(x: number, y: number): boolean {
    for (const camp of this.camps) {
      const distance = Math.abs(camp.x - x) + Math.abs(camp.y - y);
      if (distance < MIN_CAMP_SPACING) return false;
    }
    return true;
  }

  private spawnInitialScout(position: TileCoord): void {
    const { map, players } = this.config;
    const strength = CAMP_SCALING[this.config.age][this.config.difficulty].scout;
    
    if (strength <= 0) return;

    const scout: Unit = {
      id: `barbarian-scout-${Date.now()}`,
      type: 'scout',
      owner: -1,
      x: position.x,
      y: position.y,
      health: 100,
      maxHealth: 100,
      movement: 2,
      maxMovement: 2,
      strength,
      strengthBase: strength,
      hasActed: true,
    };

    const tile = map.tiles.get(`${position.x},${position.y}`);
    if (tile) {
      tile.units.push(scout.id);
    }

    const barbarianPlayer = players.find(p => p.id === -1);
    if (barbarianPlayer) {
      barbarianPlayer.units.push(scout);
    }
  }

  processTurn(): { newUnits: Unit[]; newCamps: BarbarianCamp[]; events: string[] } {
    const newUnits: Unit[] = [];
    const newCamps: BarbarianCamp[] = [];
    const events: string[] = [];

    this.processCampSpawns(newCamps, events);
    this.processUnitSpawns(newUnits, events);
    this.processScoutBehavior(events);

    this.nextSpawnTurn = this.config.turn + this.getCampSpawnInterval();
    this.nextUnitSpawnTurn = this.config.turn + this.getUnitSpawnInterval();

    return { newUnits, newCamps, events };
  }

  private processCampSpawns(newCamps: BarbarianCamp[], events: string[]): void {
    if (this.camps.length >= MAX_CAMPS) return;
    if (this.config.turn < this.nextSpawnTurn) return;

    const difficultyMultiplier = this.getDifficultyMultiplier();
    if (Math.random() > difficultyMultiplier) return;

    const position = this.findValidCampPosition();
    if (position) {
      const camp: BarbarianCamp = {
        id: `camp-${Date.now()}`,
        x: position.x,
        y: position.y,
        turnSpawned: this.config.turn,
        hasActiveScout: true,
        scoutReported: false,
      };
      
      this.camps.push(camp);
      newCamps.push(camp);
      events.push(`New barbarian camp spawned at (${position.x}, ${position.y})`);

      this.spawnInitialScout(position);
    }
  }

  private processUnitSpawns(newUnits: Unit[], events: string[]): void {
    void events;
    if (this.config.turn < this.nextUnitSpawnTurn) return;

    for (const camp of this.camps) {
      const unitType = this.determineUnitType(camp);
      if (!unitType) continue;

      const strength = CAMP_SCALING[this.config.age][this.config.difficulty][unitType];
      
      const unit: Unit = {
        id: `barbarian-${unitType}-${Date.now()}`,
        type: unitType === 'scout' ? 'scout' : unitType === 'leader' ? 'warrior' : 'warrior',
        owner: -1,
        x: camp.x,
        y: camp.y,
        health: 100,
        maxHealth: 100,
        movement: unitType === 'scout' ? 2 : 3,
        maxMovement: unitType === 'scout' ? 2 : 3,
        strength,
        strengthBase: strength,
        hasActed: false,
      };

      const tile = this.config.map.tiles.get(`${camp.x},${camp.y}`);
      if (tile) {
        tile.units.push(unit.id);
      }

      const barbarianPlayer = this.config.players.find(p => p.id === -1);
      if (barbarianPlayer) {
        barbarianPlayer.units.push(unit);
      }

      newUnits.push(unit);

      if (unitType === 'scout') {
        camp.hasActiveScout = true;
      }
    }
  }

  private determineUnitType(camp: BarbarianCamp): 'scout' | 'raider' | 'leader' | null {
    if (!camp.hasActiveScout) {
      return 'scout';
    }

    const leaderChance = 0.3;
    if (this.config.turn % 20 === 0 && Math.random() < leaderChance) {
      return 'leader';
    }

    return 'raider';
  }

  private processScoutBehavior(events: string[]): void {
    const { players, map } = this.config;

    for (const camp of this.camps) {
      if (!camp.hasActiveScout) continue;

      const scoutTile = map.tiles.get(`${camp.x},${camp.y}`);
      if (!scoutTile) continue;

      const scout = scoutTile.units
        .map((id) => players.flatMap((p) => p.units).find((u) => u.id === id))
        .find((u) => u?.type === 'scout' && u.owner === -1);

      if (!scout) continue;

      for (const player of players) {
        if (player.id === -1) continue;

        for (const city of player.cities) {
          const distance = Math.abs(scout.x - city.x) + Math.abs(scout.y - city.y);
          if (distance <= 2) {
            if (!camp.scoutReported) {
              camp.scoutReported = true;
              events.push(`Barbarian scout discovered player ${player.name}! Raiding parties incoming!`);
            }
          }
        }
      }
    }
  }

  private getCampSpawnInterval(): number {
    const baseInterval = AGE_SPAWN_INTERVALS[this.config.difficulty];
    const multiplier = this.getDifficultyMultiplier();
    return Math.floor(baseInterval / multiplier);
  }

  private getUnitSpawnInterval(): number {
    const baseInterval = UNIT_SPAWN_INTERVALS[this.config.difficulty];
    return baseInterval;
  }

  private getDifficultyMultiplier(): number {
    const multipliers: Record<Difficulty, number> = {
      beginner: 0,
      easy: 0.5,
      standard: 1.0,
      deity: 1.5,
    };
    return multipliers[this.config.difficulty] || 1.0;
  }

  getCamps(): BarbarianCamp[] {
    return [...this.camps];
  }

  getCampAt(x: number, y: number): BarbarianCamp | undefined {
    return this.camps.find((c) => c.x === x && c.y === y);
  }

  removeCamp(campId: string): void {
    const campIndex = this.camps.findIndex((c) => c.id === campId);
    if (campIndex !== -1) {
      const camp = this.camps[campIndex];
      const tile = this.config.map.tiles.get(`${camp.x},${camp.y}`);
      if (tile) {
        tile.units = [];
      }
      this.camps.splice(campIndex, 1);
    }
  }

  addEraScoreForKill(unitType: string): { eraScore: number; gold: number } {
    if (unitType === 'scout') {
      return { eraScore: 1, gold: 0 };
    }
    if (unitType === 'raider') {
      return { eraScore: 1, gold: 5 };
    }
    if (unitType === 'leader') {
      return { eraScore: 8, gold: 10 };
    }
    return { eraScore: 0, gold: 0 };
  }

  getRazeCampReward(): { gold: number; eraScore: number } {
    return { gold: 10, eraScore: 2 };
  }

  updateConfig(config: Partial<BarbarianConfig>): void {
    Object.assign(this.config, config);
  }
}

export function createBarbarianSystem(config: BarbarianConfig): BarbarianSystem {
  return new BarbarianSystem(config);
}
