import type { Player, Unit, City, MapData, TileCoord, GameAge, GameSpeed, Difficulty } from '@/game/entities/types';

export type AIStrategy = 
  | 'military'
  | 'cultural'
  | 'scientific'
  | 'religious'
  | 'domination'
  | 'expansion'
  | 'diplomatic';

export interface AIAction {
  type: 'move' | 'attack' | 'build_city' | 'build_unit' | 'build_building' | 'research' | 'found_religion' | 'spread_religion' | 'end_turn';
  target?: TileCoord;
  unitId?: string;
  cityId?: string;
  buildTarget?: string;
  techId?: string;
}

export interface AIConfig {
  player: Player;
  allPlayers: Player[];
  map: MapData;
  difficulty: Difficulty;
  age: GameAge;
  gameSpeed: GameSpeed;
  turn: number;
}

const STRATEGY_WEIGHTS: Record<AIStrategy, number> = {
  military: 0.3,
  cultural: 0.15,
  scientific: 0.2,
  religious: 0.1,
  domination: 0.1,
  expansion: 0.1,
  diplomatic: 0.05,
};

export class RandomAI {
  private config: AIConfig;
  private currentStrategy: AIStrategy;
  private strategyRerollTurn: number;
  private pendingActions: AIAction[] = [];

  constructor(config: AIConfig) {
    this.config = config;
    this.currentStrategy = this.selectInitialStrategy();
    this.strategyRerollTurn = config.turn + 20;
  }

  private selectInitialStrategy(): AIStrategy {
    const weights = Object.entries(STRATEGY_WEIGHTS);
    const totalWeight = weights.reduce((sum, [, weight]) => sum + weight, 0);
    let random = Math.random() * totalWeight;

    for (const [strategy, weight] of weights) {
      random -= weight;
      if (random <= 0) {
        return strategy as AIStrategy;
      }
    }

    return 'military';
  }

  processTurn(): AIAction[] {
    this.pendingActions = [];

    if (this.config.turn >= this.strategyRerollTurn) {
      this.currentStrategy = this.selectInitialStrategy();
      this.strategyRerollTurn = this.config.turn + 20;
    }

    this.manageCities();
    this.manageUnits();
    this.manageResearch();

    if (this.pendingActions.length === 0) {
      this.pendingActions.push({ type: 'end_turn' });
    }

    return this.pendingActions;
  }

  private manageCities(): void {
    const { player } = this.config;

    for (const city of player.cities) {
      if (!city.currentProduction) {
        const buildChoice = this.selectBuildChoice(city);
        if (buildChoice) {
          city.currentProduction = {
            name: buildChoice,
            type: this.getProductionType(buildChoice),
            cost: this.getProductionCost(buildChoice),
            progress: 0,
          };
        }
      }

      if (city.population >= 3 && player.units.filter((u) => u.type === 'settler').length === 0) {
        const settler = this.canBuildSettler(city);
        if (settler) {
          city.currentProduction = {
            name: 'settler',
            type: 'unit',
            cost: this.getProductionCost('settler'),
            progress: 0,
          };
        }
      }
    }
  }

  private selectBuildChoice(city: City): string | null {
    const unitChoices = ['warrior', 'archer', 'settler'];
    void city;

    const strategy = this.currentStrategy;

    if (strategy === 'military' || strategy === 'domination') {
      const militaryUnits = ['warrior', 'archer', 'swordsman', 'horseman'];
      return militaryUnits[Math.floor(Math.random() * militaryUnits.length)];
    }

    if (strategy === 'scientific') {
      const scienceBuildings = ['library', 'university'];
      return scienceBuildings[Math.floor(Math.random() * scienceBuildings.length)];
    }

    if (strategy === 'cultural') {
      const cultureBuildings = ['monument', 'amphitheater', 'museum'];
      return cultureBuildings[Math.floor(Math.random() * cultureBuildings.length)];
    }

    if (strategy === 'religious') {
      const religiousBuildings = ['shrine', 'temple'];
      return religiousBuildings[Math.floor(Math.random() * religiousBuildings.length)];
    }

    return unitChoices[Math.floor(Math.random() * unitChoices.length)];
  }

  private getProductionType(target: string): 'unit' | 'building' | 'wonder' {
    const units = ['warrior', 'archer', 'settler', 'swordsman', 'horseman', 'scout'];
    if (units.includes(target)) return 'unit';
    return 'building';
  }

  private getProductionCost(target: string): number {
    const costs: Record<string, number> = {
      warrior: 40,
      archer: 50,
      settler: 80,
      swordsman: 80,
      horseman: 80,
      scout: 30,
      monument: 75,
      shrine: 50,
      granary: 100,
      library: 80,
      university: 160,
      amphitheater: 100,
      museum: 200,
    };
    return costs[target] || 50;
  }

  private canBuildSettler(city: City): boolean {
    return city.population >= 3 && city.currentProduction?.name !== 'settler';
  }

  private manageUnits(): void {
    const { player } = this.config;

    const militaryUnits = player.units.filter((u) => u.type !== 'settler' && u.type !== 'scout');

    for (const unit of militaryUnits) {
      if (unit.hasActed) continue;

      const action = this.decideUnitAction(unit);
      if (action) {
        this.pendingActions.push(action);
      }
    }

    const settlers = player.units.filter((u) => u.type === 'settler');
    for (const settler of settlers) {
      if (settler.hasActed) continue;

      const validLocation = this.findCityLocation(settler.x, settler.y);
      if (validLocation) {
        this.pendingActions.push({
          type: 'build_city',
          target: validLocation,
          unitId: settler.id,
        });
      } else {
        const moveTarget = this.findNearbyValidTile(settler.x, settler.y);
        if (moveTarget) {
          this.pendingActions.push({
            type: 'move',
            target: moveTarget,
            unitId: settler.id,
          });
        }
      }
    }

    const scouts = player.units.filter((u) => u.type === 'scout');
    for (const scout of scouts) {
      if (scout.hasActed) continue;

      const exploreTarget = this.findUnexploredTile(scout.x, scout.y);
      if (exploreTarget) {
        this.pendingActions.push({
          type: 'move',
          target: exploreTarget,
          unitId: scout.id,
        });
      }
    }
  }

  private decideUnitAction(unit: Unit): AIAction | null {
    if (this.currentStrategy === 'military' || this.currentStrategy === 'domination') {
      const enemyTile = this.findNearestEnemy(unit);
      if (enemyTile) {
        return {
          type: 'attack',
          target: enemyTile,
          unitId: unit.id,
        };
      }
    }

    const validMove = this.findNearbyValidTile(unit.x, unit.y);
    if (validMove) {
      return {
        type: 'move',
        target: validMove,
        unitId: unit.id,
      };
    }

    return null;
  }

  private findNearestEnemy(unit: Unit): TileCoord | null {
    const { player } = this.config;
    let nearest: TileCoord | null = null;
    let minDistance = Infinity;

    for (const enemy of this.getAllEnemyUnits(player.id)) {
      const distance = Math.abs(unit.x - enemy.x) + Math.abs(unit.y - enemy.y);
      if (distance < minDistance && distance <= unit.movement) {
        minDistance = distance;
        nearest = { x: enemy.x, y: enemy.y };
      }
    }

    return nearest;
  }

  private getAllEnemyUnits(playerId: number): Unit[] {
    const enemies: Unit[] = [];
    for (const p of this.config.allPlayers) {
      if (p.id !== playerId && p.id !== -1) {
        enemies.push(...p.units);
      }
    }
    return enemies;
  }

  private findNearbyValidTile(x: number, y: number): TileCoord | null {
    const { map } = this.config;

    for (let dy = -3; dy <= 3; dy++) {
      for (let dx = -3; dx <= 3; dx++) {
        if (dx === 0 && dy === 0) continue;

        const nx = x + dx;
        const ny = y + dy;

        if (nx < 0 || nx >= map.width || ny < 0 || ny >= map.height) continue;

        const tile = map.tiles.get(`${nx},${ny}`);
        if (tile && tile.terrain !== 'ocean' && tile.terrain !== 'mountain' && !tile.cityId) {
          return { x: nx, y: ny };
        }
      }
    }

    return null;
  }

  private findUnexploredTile(x: number, y: number): TileCoord | null {
    const { map } = this.config;

    for (let dy = -5; dy <= 5; dy++) {
      for (let dx = -5; dx <= 5; dx++) {
        if (dx === 0 && dy === 0) continue;

        const nx = x + dx;
        const ny = y + dy;

        if (nx < 0 || nx >= map.width || ny < 0 || ny >= map.height) continue;

        return { x: nx, y: ny };
      }
    }

    return null;
  }

  private findCityLocation(x: number, y: number): TileCoord | null {
    const { map } = this.config;

    for (let dy = -4; dy <= 4; dy++) {
      for (let dx = -4; dx <= 4; dx++) {
        if (dx === 0 && dy === 0) continue;

        const nx = x + dx;
        const ny = y + dy;

        if (nx < 0 || nx >= map.width || ny < 0 || ny >= map.height) continue;

        const tile = map.tiles.get(`${nx},${ny}`);
        if (!tile || tile.terrain === 'ocean' || tile.terrain === 'mountain' || tile.cityId) {
          continue;
        }

        let tooClose = false;
        for (const p of this.config.allPlayers) {
          for (const city of p.cities) {
            const distance = Math.abs(nx - city.x) + Math.abs(ny - city.y);
            if (distance < 3) {
              tooClose = true;
              break;
            }
          }
        }

        if (!tooClose) {
          return { x: nx, y: ny };
        }
      }
    }

    return null;
  }

  private manageResearch(): void {
    const { player } = this.config;

    if (!player.currentResearch) {
      const techChoices = [
        'mining',
        'pottery',
        'animal_husbandry',
        'archery',
        'horse_riding',
      ];

      const strategy = this.currentStrategy;

      if (strategy === 'scientific') {
        techChoices.push('writing', 'mathematics', 'philosophy');
      }

      const choice = techChoices[Math.floor(Math.random() * techChoices.length)];
      
      player.currentResearch = {
        techId: choice,
        progress: 0,
      };
    }
  }

  getStrategy(): AIStrategy {
    return this.currentStrategy;
  }

  setStrategy(strategy: AIStrategy): void {
    this.currentStrategy = strategy;
  }
}

export function createRandomAI(config: AIConfig): RandomAI {
  return new RandomAI(config);
}
