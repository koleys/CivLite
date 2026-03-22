import type { Player, Unit, GameSettings, MapData, UnitId, TileCoord } from '@/game/entities/types';

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
  type: 'UNIT_MOVED' | 'UNIT_DIED' | 'CITY_FOUNDED' | 'COMBAT_OCCURRED' | 'TECH_COMPLETED' | 'VICTORY';
  message: string;
  data?: Record<string, unknown>;
}

export class GameEngine {
  private players: Player[];
  private currentPlayerIndex: number;
  private turnNumber: number;
  private map: MapData;
  private actions: GameAction[];
  private events: GameEvent[];

  constructor(
    players: Player[],
    _settings: GameSettings,
    map: MapData
  ) {
    this.players = players;
    this.currentPlayerIndex = 0;
    this.turnNumber = 1;
    this.map = map;
    this.actions = [];
    this.events = [];
  }

  getCurrentPlayer(): Player {
    return this.players[this.currentPlayerIndex];
  }

  getCurrentPlayerId(): number {
    return this.currentPlayerIndex;
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
      type: 'UNIT_MOVED',
      message: `Player ${this.currentPlayerIndex} ended turn`,
    });
  }

  endTurn(): TurnResult {
    this.refreshUnitMovement();
    this.processCityProduction();
    this.processGrowth();
    this.processResearch();

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
      if (city.currentProduction) {
        const production = 3;
        city.currentProduction.progress += production;
      }
    });
  }

  private processGrowth(): void {
    const player = this.getCurrentPlayer();
    player.cities.forEach(city => {
      const foodSurplus = 2;
      city.foodStockpile += foodSurplus;

      if (city.foodStockpile >= city.foodForGrowth) {
        city.population += 1;
        city.foodStockpile = city.foodStockpile - city.foodForGrowth;
        city.foodForGrowth = city.population * 2 + 4;
        city.housingUsed = city.population;
      }
    });
  }

  private processResearch(): void {
    const player = this.getCurrentPlayer();
    if (player.currentResearch) {
      const sciencePerTurn = 2;
      player.currentResearch.progress += sciencePerTurn;
    }
  }

  private processEndOfRound(): void {
    this.events.push({
      type: 'UNIT_MOVED',
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

    const moves: TileCoord[] = [];
    const range = Math.floor(unit.movement);

    for (let dy = -range; dy <= range; dy++) {
      for (let dx = -range; dx <= range; dx++) {
        if (dx === 0 && dy === 0) continue;

        const x = unit.x + dx;
        const y = unit.y + dy;

        if (x >= 0 && x < this.map.width && y >= 0 && y < this.map.height) {
          const tile = this.map.tiles.get(`${x},${y}`);
          if (tile && tile.terrain !== 'mountain') {
            moves.push({ x, y });
          }
        }
      }
    }

    return moves;
  }

  canFoundCity(settler: Unit): boolean {
    const tile = this.map.tiles.get(`${settler.x},${settler.y}`);
    if (!tile) return false;
    if (tile.cityId) return false;
    if (settler.type !== 'settler') return false;

    const minDistance = 3;
    for (const player of this.players) {
      for (const city of player.cities) {
        const dx = Math.abs(city.x - settler.x);
        const dy = Math.abs(city.y - settler.y);
        if (dx < minDistance && dy < minDistance) {
          return false;
        }
      }
    }

    return true;
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
