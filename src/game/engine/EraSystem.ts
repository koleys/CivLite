import type { Player, GameAge, GameSpeed } from '@/game/entities/types';

export interface EraScoreAction {
  action: string;
  eraScore: number;
  repeatable: boolean;
}

export const ERA_SCORE_ACTIONS: Record<string, EraScoreAction> = {
  found_city: { action: 'Found a city', eraScore: 5, repeatable: true },
  construct_wonder: { action: 'Construct a Wonder', eraScore: 10, repeatable: true },
  kill_unit: { action: 'Kill a unit', eraScore: 1, repeatable: true },
  kill_barbarian_leader: { action: 'Kill a Barbarian Leader', eraScore: 8, repeatable: true },
  recruit_great_person: { action: 'Recruit a Great Person', eraScore: 8, repeatable: true },
  discover_natural_wonder: { action: 'Discover a Natural Wonder', eraScore: 5, repeatable: true },
  establish_religion: { action: 'Establish a Religion', eraScore: 10, repeatable: false },
  win_crisis: { action: 'Win a Crisis', eraScore: 5, repeatable: true },
  land_new_continent: { action: 'Land on a new continent', eraScore: 5, repeatable: true },
  complete_trade_route: { action: 'Complete a Trade Route', eraScore: 2, repeatable: true },
  build_unique: { action: 'Build a unique unit/building', eraScore: 3, repeatable: true },
  gain_city_diplomatic: { action: 'Gain a city via diplomatic means', eraScore: 5, repeatable: true },
  kill_advanced_unit: { action: 'Kill a unit from a more advanced era', eraScore: 3, repeatable: true },
};

export interface LegacyObjective {
  id: string;
  description: string;
  target: number;
  progress: number;
  completed: boolean;
}

export interface LegacyPath {
  objectives: LegacyObjective[];
  selected: string[];
}

export interface EraConfig {
  gameSpeed: GameSpeed;
}

export const AGE_TURN_LIMITS: Record<GameAge, Record<GameSpeed, number>> = {
  antiquity: {
    online: 67,
    standard: 100,
    marathon: 300,
  },
  exploration: {
    online: 67,
    standard: 100,
    marathon: 300,
  },
  modern: {
    online: 67,
    standard: 100,
    marathon: 300,
  },
};

export const LEGACY_OBJECTIVES: Record<GameAge, string[]> = {
  antiquity: [
    'construct_3_wonders',
    'reach_10_population',
    'establish_5_trade_routes',
    'research_5_technologies',
    'control_8_cities',
  ],
  exploration: [
    'establish_3_colonies',
    'control_15_cities',
    'have_3_religions',
    'establish_10_trade_routes',
    'build_5_unique_units',
  ],
  modern: [
    'launch_spaceship',
    'control_25_cities',
    'control_50_percent_population',
    'win_any_victory',
    'become_suzerain_all_city_states',
  ],
};

export class EraSystem {
  private player: Player;
  private config: EraConfig;
  private eraScore: number = 0;
  private age: GameAge = 'antiquity';
  private legacyPath: LegacyPath;
  private carryOverBonus: number = 0;
  private continentsVisited: Set<string> = new Set();
  private newContinentsThisAge: number = 0;

  constructor(player: Player, config: EraConfig) {
    this.player = player;
    this.config = config;
    this.legacyPath = this.initializeLegacyPath('antiquity');
  }

  private initializeLegacyPath(age: GameAge): LegacyPath {
    const objectives = LEGACY_OBJECTIVES[age].map((id) => ({
      id,
      description: this.getObjectiveDescription(id),
      target: this.getObjectiveTarget(id),
      progress: 0,
      completed: false,
    }));

    return {
      objectives,
      selected: [],
    };
  }

  private getObjectiveDescription(id: string): string {
    const descriptions: Record<string, string> = {
      construct_3_wonders: 'Construct 3 Wonders',
      reach_10_population: 'Reach 10 population in capital',
      establish_5_trade_routes: 'Establish 5 trade routes',
      research_5_technologies: 'Research 5 technologies',
      control_8_cities: 'Control 8+ cities',
      establish_3_colonies: 'Establish colonies on 3 continents',
      control_15_cities: 'Control 15+ cities',
      have_3_religions: 'Have 3 distinct religions',
      establish_10_trade_routes: 'Establish 10+ international trade routes',
      build_5_unique_units: 'Build 5 unique units',
      launch_spaceship: 'Launch spaceship to Alpha Centauri',
      control_25_cities: 'Control 25+ cities',
      control_50_percent_population: 'Control 50%+ of the world\'s total population',
      win_any_victory: 'Win any other victory condition',
      become_suzerain_all_city_states: 'Be Suzerain of all city-states',
    };
    return descriptions[id] || id;
  }

  private getObjectiveTarget(id: string): number {
    const targets: Record<string, number> = {
      construct_3_wonders: 3,
      reach_10_population: 10,
      establish_5_trade_routes: 5,
      research_5_technologies: 5,
      control_8_cities: 8,
      establish_3_colonies: 3,
      control_15_cities: 15,
      have_3_religions: 3,
      establish_10_trade_routes: 10,
      build_5_unique_units: 5,
      launch_spaceship: 1,
      control_25_cities: 25,
      control_50_percent_population: 50,
      win_any_victory: 1,
      become_suzerain_all_city_states: 1,
    };
    return targets[id] || 1;
  }

  getEraScore(): number {
    return this.eraScore;
  }

  getAge(): GameAge {
    return this.age;
  }

  addEraScore(action: string, amount?: number): void {
    const eraAction = ERA_SCORE_ACTIONS[action];
    if (!eraAction) return;

    if (!eraAction.repeatable && this.hasCompletedAction(action)) {
      return;
    }

    const score = amount ?? eraAction.eraScore;
    this.eraScore += score;
  }

  private hasCompletedAction(action: string): boolean {
    if (action === 'establish_religion') {
      return this.player.cities.some((c) => c.buildings.includes('temple'));
    }
    return false;
  }

  getEraScoreUnlocks(): { tier2: boolean; tier3: boolean; carryOver: boolean } {
    return {
      tier2: this.eraScore >= 15,
      tier3: this.eraScore >= 25,
      carryOver: this.eraScore >= 20,
    };
  }

  getCarryOverBonus(): number {
    return this.carryOverBonus;
  }

  getTurnLimit(): number {
    return AGE_TURN_LIMITS[this.age][this.config.gameSpeed];
  }

  canVoluntarilyTransition(): boolean {
    const completedCount = this.legacyPath.objectives.filter((o) => o.completed).length;
    return completedCount >= 2;
  }

  shouldForcedTransition(turn: number): boolean {
    return turn >= this.getTurnLimit();
  }

  selectLegacyObjectives(objectiveIds: string[]): void {
    if (objectiveIds.length !== 3) return;
    this.legacyPath.selected = objectiveIds;
  }

  updateObjectiveProgress(objectiveId: string, progress: number): void {
    const objective = this.legacyPath.objectives.find((o) => o.id === objectiveId);
    if (!objective) return;

    objective.progress = progress;
    if (progress >= objective.target) {
      objective.completed = true;
    }
  }

  getLegacyPath(): LegacyPath {
    return this.legacyPath;
  }

  getSelectedObjectives(): string[] {
    return this.legacyPath.selected;
  }

  getCompletedObjectives(): number {
    return this.legacyPath.objectives.filter((o) => o.completed).length;
  }

  hasAgeVictory(): boolean {
    return this.legacyPath.selected.length === 3 &&
      this.legacyPath.objectives.every((o) => o.completed);
  }

  transitionAge(turn: number): { newAge: GameAge; hasAgeVictory: boolean; penalty: number } | null {
    if (this.age === 'modern') return null; // Modern Age ends only via victory condition

    const hasVictory = this.hasAgeVictory();
    let penalty = 0;
    const completedCount = this.getCompletedObjectives();

    if (hasVictory) {
      this.eraScore += 50;
    }

    if (this.shouldForcedTransition(turn) && completedCount < 2) {
      penalty = 20;
      this.autoSelectObjectives();
    }

    if (this.eraScore >= 20) {
      this.carryOverBonus = 15;
    }

    this.eraScore = 0;
    this.newContinentsThisAge = 0;

    let newAge: GameAge;
    if (this.age === 'antiquity') {
      newAge = 'exploration';
    } else if (this.age === 'exploration') {
      newAge = 'modern';
    } else {
      newAge = 'modern';
    }

    this.age = newAge;
    this.legacyPath = this.initializeLegacyPath(newAge);

    return { newAge, hasAgeVictory: hasVictory, penalty };
  }

  private autoSelectObjectives(): void {
    const sortedObjectives = [...this.legacyPath.objectives].sort(
      (a, b) => b.progress / b.target - a.progress / a.target
    );

    this.legacyPath.selected = sortedObjectives.slice(0, 2).map((o) => o.id);
    sortedObjectives.slice(0, 2).forEach((o) => (o.completed = true));
  }

  recordContinentVisit(continentId: string): void {
    if (!this.continentsVisited.has(continentId)) {
      this.continentsVisited.add(continentId);
      this.newContinentsThisAge++;
      this.addEraScore('land_new_continent');
    }
  }

  processCityGrowth(): void {
    const capital = this.player.cities.find((c) => c.isOriginalCapital);
    if (capital && capital.population >= 10) {
      this.updateObjectiveProgress('reach_10_population', capital.population);
    }

    this.updateObjectiveProgress('control_8_cities', this.player.cities.length);
    this.updateObjectiveProgress('control_15_cities', this.player.cities.length);
    this.updateObjectiveProgress('control_25_cities', this.player.cities.length);
  }

  processTradeRoutes(routeCount: number): void {
    this.updateObjectiveProgress('establish_5_trade_routes', routeCount);
    this.updateObjectiveProgress('establish_10_trade_routes', routeCount);
  }

  processTechnologies(techCount: number): void {
    this.updateObjectiveProgress('research_5_technologies', techCount);
  }

  processWonders(wonderCount: number): void {
    this.updateObjectiveProgress('construct_3_wonders', wonderCount);
  }

  getProductionBonus(): number {
    return this.carryOverBonus / 100;
  }
}

export function createEraSystem(player: Player, config: EraConfig): EraSystem {
  return new EraSystem(player, config);
}
