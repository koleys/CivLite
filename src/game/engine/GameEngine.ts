import type { Player, Unit, GameSettings, MapData, UnitId, TileCoord } from '@/game/entities/types';
import { getReachableTiles } from '@/utils/pathfinding';
import { processCityGrowth, calculateCityYields } from './CityGrowth';
import { TechSystem, TECH_COST_MULTIPLIERS } from './TechSystem';

export interface TurnResult {
  turnNumber: number;
  currentPlayer: number;
  actions: GameAction[];
  nextPlayer: number | null;
  turnComplete: boolean;
  events: GameEvent[];
}

export interface GameAction {
  type: 'MOVE' | 'ATTACK' | 'BUILD' | 'FOUND_CITY' | 'PILLAGE' | 'FORTIFY' | 'SLEEP' | 'ALERT' | 'SKIP_TURN';
  playerId: number;
  unitId?: UnitId;
  data?: Record<string, unknown>;
  timestamp: number;
}

export interface GameEvent {
  type: 'UNIT_MOVED' | 'UNIT_DIED' | 'CITY_FOUNDED' | 'PRODUCTION_COMPLETED' | 'COMBAT_OCCURRED' | 'TECH_COMPLETED' | 'VICTORY' | 'TURN_STARTED' | 'TURN_ENDED' | 'PLAYER_TURN_ENDED' | 'CITY_GREW' | 'AGE_TRANSITION' | 'ERA_SCORE_GAINED' | 'BARBARIAN_SPAWNED' | 'UNIT_PROMOTED' | 'RELIGION_FOUNDED';
  message: string;
  data?: Record<string, unknown>;
}

export class GameEngine {
  private players: Player[];
  private settings: GameSettings;
  private currentPlayerIndex: number;
  private turnNumber: number;
  private map: MapData;
  private actions: GameAction[];
  private events: GameEvent[];
  private techSystems: Map<number, TechSystem>;

  constructor(
    players: Player[],
    settings: GameSettings,
    map: MapData
  ) {
    this.players = players;
    this.settings = settings;
    this.currentPlayerIndex = 0;
    this.turnNumber = 1;
    this.map = map;
    this.actions = [];
    this.events = [];
    this.techSystems = new Map();

    for (const player of players) {
      this.techSystems.set(
        player.id,
        new TechSystem(player, {
          gameSpeed: settings.gameSpeed,
          difficulty: settings.difficulty,
        })
      );
    }
  }

  getCurrentPlayer(): Player {
    return this.players[this.currentPlayerIndex];
  }

  getCurrentPlayerId(): number {
    return this.players[this.currentPlayerIndex].id;
  }

  getTurnNumber(): number {
    return this.turnNumber;
  }

  processUnitAction(action: GameAction): TurnResult {
    this.actions.push(action);
    const player = this.players[action.playerId];

    switch (action.type) {
      case 'MOVE':
        if (action.unitId && action.data) {
          const unit = player.units.find(u => u.id === action.unitId);
          const to = action.data as unknown as TileCoord;
          if (unit && to) {
            this.moveUnit(unit, to.x, to.y);
          }
        }
        break;
      case 'SKIP_TURN':
        this.endPlayerTurn();
        break;
      case 'FORTIFY':
        if (action.unitId) {
          const unit = player.units.find(u => u.id === action.unitId);
          if (unit) {
            unit.hasActed = true;
          }
        }
        break;
      case 'SLEEP':
        if (action.unitId) {
          const unit = player.units.find(u => u.id === action.unitId);
          if (unit) {
            unit.hasActed = true;
          }
        }
        break;
    }

    return this.getTurnResult();
  }

  private moveUnit(unit: Unit, x: number, y: number): void {
    const fromKey = `${unit.x},${unit.y}`;
    const toKey = `${x},${y}`;

    const fromTile = this.map.tiles.get(fromKey);
    const toTile = this.map.tiles.get(toKey);

    if (!fromTile || !toTile) return;

    fromTile.units = fromTile.units.filter(id => id !== unit.id);
    toTile.units.push(unit.id);

    unit.x = x;
    unit.y = y;
    unit.movement -= 1;

    this.events.push({
      type: 'UNIT_MOVED',
      message: `Unit moved to (${x}, ${y})`,
    });
  }

  private endPlayerTurn(): void {
    this.events.push({
      type: 'PLAYER_TURN_ENDED',
      message: `Player ${this.currentPlayerIndex} ended their turn`,
    });
  }

  endTurn(): TurnResult {
    this.refreshUnitMovement();
    this.processCityProduction();
    this.processGrowth();
    this.processResearch();

    this.events.push({
      type: 'TURN_ENDED',
      message: `Player ${this.currentPlayerIndex} turn ended`,
    });

    this.currentPlayerIndex++;

    if (this.currentPlayerIndex >= this.players.length) {
      this.currentPlayerIndex = 0;
      this.turnNumber++;
      this.processEndOfRound();
    }

    return this.getTurnResult();
  }

  private refreshUnitMovement(): void {
    const player = this.getCurrentPlayer();
    player.units.forEach(unit => {
      unit.hasActed = false;
      unit.movement = unit.maxMovement;
    });
  }

  private processCityProduction(): void {
    const player = this.getCurrentPlayer();
    player.cities.forEach(city => {
      if (!city.currentProduction) return;

      const yields = calculateCityYields(city, this.map);
      const productionPerTurn = yields.totalYields.production;
      city.currentProduction.progress += productionPerTurn;

      if (city.currentProduction.progress >= city.currentProduction.cost) {
        this.events.push({
          type: 'PRODUCTION_COMPLETED',
          message: `${player.name}'s city ${city.name} completed ${city.currentProduction.name}`,
          data: {
            cityId: city.id,
            production: city.currentProduction.name,
            type: city.currentProduction.type,
          },
        });
        // Move to next in queue or clear
        if (city.buildQueue.length > 0) {
          city.currentProduction = city.buildQueue.shift()!;
        } else {
          city.currentProduction = null;
        }
      }
    });
  }

  private processGrowth(): void {
    const player = this.getCurrentPlayer();
    player.cities.forEach(city => {
      const result = processCityGrowth(city, this.map, this.settings.gameSpeed);
      if (result.grew) {
        this.events.push({
          type: 'CITY_GREW',
          message: `${city.name} grew to population ${city.population}`,
          data: { cityId: city.id, population: city.population },
        });
      }
    });
  }

  private processResearch(): void {
    const player = this.getCurrentPlayer();
    if (!player.currentResearch) return;

    const techSystem = this.techSystems.get(player.id);
    if (!techSystem) return;

    // Sync tech system's current research with player state
    if (!techSystem.getCurrentResearch() ||
        techSystem.getCurrentResearch()?.techId !== player.currentResearch.techId) {
      techSystem.setCurrentResearch({
        techId: player.currentResearch.techId,
        progress: player.currentResearch.progress,
        eurekaTriggered: false,
        turnsRemaining: 0,
      });
    }

    const result = techSystem.processTurn();
    player.currentResearch.progress = techSystem.getCurrentResearch()?.progress ?? player.currentResearch.progress;

    if (result.completed) {
      this.events.push({
        type: 'TECH_COMPLETED',
        message: `${player.name} researched ${result.completed}`,
        data: { techId: result.completed, playerId: player.id },
      });
      player.technologies.add(result.completed);
      player.currentResearch = null;
    }
  }

  private processEndOfRound(): void {
    this.events.push({
      type: 'TURN_STARTED',
      message: `Turn ${this.turnNumber} started`,
    });
  }

  private getTurnResult(): TurnResult {
    return {
      turnNumber: this.turnNumber,
      currentPlayer: this.currentPlayerIndex,
      actions: [...this.actions],
      nextPlayer: this.currentPlayerIndex < this.players.length - 1 
        ? this.currentPlayerIndex + 1 
        : null,
      turnComplete: this.currentPlayerIndex === 0,
      events: [...this.events],
    };
  }

  canUnitMove(unit: Unit): boolean {
    return !unit.hasActed && unit.movement > 0;
  }

  getValidMoves(unit: Unit): TileCoord[] {
    if (!this.canUnitMove(unit)) return [];

    const reachable = getReachableTiles(
      this.map,
      { x: unit.x, y: unit.y },
      unit.movement
    );

    const moves: TileCoord[] = [];
    for (const key of reachable) {
      if (key === `${unit.x},${unit.y}`) continue;
      const [x, y] = key.split(',').map(Number);
      const tile = this.map.tiles.get(key);
      if (tile && tile.terrain !== 'ocean' && tile.terrain !== 'mountain') {
        moves.push({ x, y });
      }
    }

    return moves;
  }

  canFoundCity(settler: Unit): boolean {
    const tile = this.map.tiles.get(`${settler.x},${settler.y}`);
    if (!tile) return false;
    if (tile.cityId) return false;
    if (settler.type !== 'settler') return false;
    if (tile.terrain === 'ocean' || tile.terrain === 'mountain') return false;

    const minDistance = 3;
    for (const player of this.players) {
      for (const city of player.cities) {
        const dx = Math.abs(city.x - settler.x);
        const dy = Math.abs(city.y - settler.y);
        const distance = Math.sqrt(dx * dx + dy * dy);
        if (distance < minDistance) {
          return false;
        }
      }
    }

    return true;
  }

  getTechSystem(playerId: number): TechSystem | undefined {
    return this.techSystems.get(playerId);
  }

  addEvent(event: GameEvent): void {
    this.events.push(event);
  }

  clearEvents(): void {
    this.events = [];
  }

  getEvents(): GameEvent[] {
    return [...this.events];
  }
}

export function createGameEngine(
  players: Player[],
  settings: GameSettings,
  map: MapData
): GameEngine {
  return new GameEngine(players, settings, map);
}

// Re-export for convenience
export { TECH_COST_MULTIPLIERS };

