import type { Player, GameAge, GameSpeed } from '@/game/entities/types';

export interface Civic {
  id: string;
  name: string;
  era: GameAge;
  cost: number;
  prerequisites: string[];
  inspirationTrigger: string;
  inspirationBonus: number;
  unlocks: string[];
}

export interface CivicResearch {
  civicId: string;
  progress: number;
  inspirationTriggered: boolean;
  turnsRemaining: number;
}

export interface CivicConfig {
  gameSpeed: GameSpeed;
}

export const CIVIC_COST_MULTIPLIERS: Record<GameSpeed, number> = {
  online: 0.67,
  standard: 1.0,
  marathon: 3.0,
};

export const CIVICS: Record<string, Civic> = {
  early_empire: {
    id: 'early_empire',
    name: 'Early Empire',
    era: 'antiquity',
    cost: 20,
    prerequisites: [],
    inspirationTrigger: 'Meet another civilization',
    inspirationBonus: 0.5,
    unlocks: [],
  },
  craftsmanship: {
    id: 'craftsmanship',
    name: 'Craftsmanship',
    era: 'antiquity',
    cost: 25,
    prerequisites: [],
    inspirationTrigger: 'Train 3 melee units',
    inspirationBonus: 0.5,
    unlocks: [],
  },
  military_tradition: {
    id: 'military_tradition',
    name: 'Military Tradition',
    era: 'antiquity',
    cost: 40,
    prerequisites: [],
    inspirationTrigger: 'Win a battle',
    inspirationBonus: 0.5,
    unlocks: [],
  },
  early_politics: {
    id: 'early_politics',
    name: 'Early Politics',
    era: 'antiquity',
    cost: 45,
    prerequisites: [],
    inspirationTrigger: 'Build a Palace',
    inspirationBonus: 0.5,
    unlocks: [],
  },
  foreign_trade: {
    id: 'foreign_trade',
    name: 'Foreign Trade',
    era: 'antiquity',
    cost: 55,
    prerequisites: [],
    inspirationTrigger: 'Establish a Trade Route',
    inspirationBonus: 0.5,
    unlocks: [],
  },
  recording_history: {
    id: 'recording_history',
    name: 'Recording History',
    era: 'antiquity',
    cost: 60,
    prerequisites: [],
    inspirationTrigger: 'Build a Monument',
    inspirationBonus: 0.5,
    unlocks: [],
  },
  mysticism: {
    id: 'mysticism',
    name: 'Mysticism',
    era: 'antiquity',
    cost: 65,
    prerequisites: [],
    inspirationTrigger: 'Build a Shrine',
    inspirationBonus: 0.5,
    unlocks: [],
  },
  bronze_working_civic: {
    id: 'bronze_working_civic',
    name: 'Bronze Working',
    era: 'antiquity',
    cost: 70,
    prerequisites: [],
    inspirationTrigger: 'Discover a Natural Wonder',
    inspirationBonus: 0.5,
    unlocks: [],
  },
  iron_working_civic: {
    id: 'iron_working_civic',
    name: 'Iron Working',
    era: 'antiquity',
    cost: 80,
    prerequisites: ['bronze_working_civic'],
    inspirationTrigger: 'Improve Iron resource',
    inspirationBonus: 0.5,
    unlocks: [],
  },
  naval_tradition: {
    id: 'naval_tradition',
    name: 'Naval Tradition',
    era: 'antiquity',
    cost: 85,
    prerequisites: [],
    inspirationTrigger: 'Build a Harbor',
    inspirationBonus: 0.5,
    unlocks: [],
  },
  coinage: {
    id: 'coinage',
    name: 'Coinage',
    era: 'antiquity',
    cost: 90,
    prerequisites: [],
    inspirationTrigger: 'Earn 50 Gold',
    inspirationBonus: 0.5,
    unlocks: [],
  },
  medieval_faires: {
    id: 'medieval_faires',
    name: 'Medieval Faires',
    era: 'exploration',
    cost: 100,
    prerequisites: [],
    inspirationTrigger: 'Build a University',
    inspirationBonus: 0.5,
    unlocks: [],
  },
  printing_press: {
    id: 'printing_press',
    name: 'Printing Press',
    era: 'exploration',
    cost: 140,
    prerequisites: [],
    inspirationTrigger: 'Have 3 Libraries',
    inspirationBonus: 0.5,
    unlocks: [],
  },
  navigation_civic: {
    id: 'navigation_civic',
    name: 'Navigation',
    era: 'exploration',
    cost: 160,
    prerequisites: [],
    inspirationTrigger: 'Establish an international trade route to a continent you did not start on',
    inspirationBonus: 0.5,
    unlocks: [],
  },
  enlightenment: {
    id: 'enlightenment',
    name: 'Enlightenment',
    era: 'exploration',
    cost: 180,
    prerequisites: [],
    inspirationTrigger: 'Recruit a Great Person',
    inspirationBonus: 0.5,
    unlocks: [],
  },
  military_drill: {
    id: 'military_drill',
    name: 'Military Drill',
    era: 'exploration',
    cost: 200,
    prerequisites: [],
    inspirationTrigger: 'Build a Barracks',
    inspirationBonus: 0.5,
    unlocks: [],
  },
  economics: {
    id: 'economics',
    name: 'Economics',
    era: 'exploration',
    cost: 220,
    prerequisites: [],
    inspirationTrigger: 'Build a Bank',
    inspirationBonus: 0.5,
    unlocks: [],
  },
  humanism: {
    id: 'humanism',
    name: 'Humanism',
    era: 'exploration',
    cost: 250,
    prerequisites: [],
    inspirationTrigger: 'Build 3 Temples',
    inspirationBonus: 0.5,
    unlocks: [],
  },
  exploration: {
    id: 'exploration',
    name: 'Exploration',
    era: 'exploration',
    cost: 280,
    prerequisites: [],
    inspirationTrigger: 'Land on 2 continents you did not start on',
    inspirationBonus: 0.5,
    unlocks: [],
  },
  reformation: {
    id: 'reformation',
    name: 'Reformation',
    era: 'exploration',
    cost: 300,
    prerequisites: [],
    inspirationTrigger: 'Found a Religion',
    inspirationBonus: 0.5,
    unlocks: [],
  },
  mercantilism: {
    id: 'mercantilism',
    name: 'Mercantilism',
    era: 'exploration',
    cost: 320,
    prerequisites: [],
    inspirationTrigger: 'Have 5 luxury resources connected',
    inspirationBonus: 0.5,
    unlocks: [],
  },
  corporations: {
    id: 'corporations',
    name: 'Corporations',
    era: 'exploration',
    cost: 380,
    prerequisites: [],
    inspirationTrigger: 'Have 5 unique resource types improved',
    inspirationBonus: 0.5,
    unlocks: [],
  },
  natural_history: {
    id: 'natural_history',
    name: 'Natural History',
    era: 'modern',
    cost: 350,
    prerequisites: [],
    inspirationTrigger: 'Build 3 Museums',
    inspirationBonus: 0.5,
    unlocks: [],
  },
  civil_engineering: {
    id: 'civil_engineering',
    name: 'Civil Engineering',
    era: 'modern',
    cost: 400,
    prerequisites: [],
    inspirationTrigger: 'Build 3 Aqueducts',
    inspirationBonus: 0.5,
    unlocks: ['urbanization', 'replaceable_parts', 'electrification'],
  },
  urbanization: {
    id: 'urbanization',
    name: 'Urbanization',
    era: 'modern',
    cost: 450,
    prerequisites: ['civil_engineering'],
    inspirationTrigger: 'Reach 10 population in a city',
    inspirationBonus: 0.5,
    unlocks: ['conservation'],
  },
  replaceable_parts: {
    id: 'replaceable_parts',
    name: 'Replaceable Parts',
    era: 'modern',
    cost: 500,
    prerequisites: ['civil_engineering'],
    inspirationTrigger: 'Build a Factory',
    inspirationBonus: 0.5,
    unlocks: ['mass_media'],
  },
  conservation: {
    id: 'conservation',
    name: 'Conservation',
    era: 'modern',
    cost: 550,
    prerequisites: ['urbanization'],
    inspirationTrigger: 'Plant 3 Forests',
    inspirationBonus: 0.5,
    unlocks: [],
  },
  electrification: {
    id: 'electrification',
    name: 'Electrification',
    era: 'modern',
    cost: 600,
    prerequisites: ['civil_engineering'],
    inspirationTrigger: 'Build a Power Plant',
    inspirationBonus: 0.5,
    unlocks: [],
  },
  mass_media: {
    id: 'mass_media',
    name: 'Mass Media',
    era: 'modern',
    cost: 700,
    prerequisites: ['replaceable_parts'],
    inspirationTrigger: 'Build 3 Broadcast Towers',
    inspirationBonus: 0.5,
    unlocks: ['global_warming', 'social_media'],
  },
  global_warming: {
    id: 'global_warming',
    name: 'Global Warming',
    era: 'modern',
    cost: 800,
    prerequisites: ['mass_media'],
    inspirationTrigger: 'Trigger a climate crisis',
    inspirationBonus: 0.5,
    unlocks: [],
  },
  social_media: {
    id: 'social_media',
    name: 'Social Media',
    era: 'modern',
    cost: 900,
    prerequisites: ['mass_media'],
    inspirationTrigger: 'Reach 100 population in a city',
    inspirationBonus: 0.5,
    unlocks: [],
  },
};

export class CivicSystem {
  private player: Player;
  private config: CivicConfig;
  private currentResearch: CivicResearch | null = null;
  private civics: Set<string> = new Set();

  constructor(player: Player, config: CivicConfig) {
    this.player = player;
    this.config = config;
  }

  getAdjustedCost(civicId: string): number {
    const civic = CIVICS[civicId];
    if (!civic) return 100;

    const multiplier = CIVIC_COST_MULTIPLIERS[this.config.gameSpeed];
    let cost = civic.cost * multiplier;

    if (this.currentResearch?.civicId === civicId && this.currentResearch.inspirationTriggered) {
      cost *= (1 - civic.inspirationBonus);
    }

    return Math.floor(cost);
  }

  startResearch(civicId: string): boolean {
    const civic = CIVICS[civicId];
    if (!civic) return false;

    if (!this.canResearch(civicId)) return false;

    const cost = this.getAdjustedCost(civicId);
    const turnsRemaining = Math.ceil(cost / this.getCulturePerTurn());

    this.currentResearch = {
      civicId,
      progress: 0,
      inspirationTriggered: false,
      turnsRemaining,
    };

    return true;
  }

  processTurn(): { completed: string | null; progress: number } {
    if (!this.currentResearch) {
      return { completed: null, progress: 0 };
    }

    const culturePerTurn = this.getCulturePerTurn();
    this.currentResearch.progress += culturePerTurn;

    const cost = this.getAdjustedCost(this.currentResearch.civicId);

    if (this.currentResearch.progress >= cost) {
      const completedCivic = this.currentResearch.civicId;
      this.civics.add(completedCivic);
      const progressBeforeComplete = this.currentResearch.progress;
      this.currentResearch = null;
      return { completed: completedCivic, progress: progressBeforeComplete };
    }

    return { completed: null, progress: this.currentResearch.progress };
  }

  canResearch(civicId: string): boolean {
    const civic = CIVICS[civicId];
    if (!civic) return false;

    if (this.civics.has(civicId)) return false;

    if (this.currentResearch?.civicId === civicId) return false;

    const prerequisitesMet = civic.prerequisites.every((prereq) =>
      this.civics.has(prereq)
    );

    return prerequisitesMet;
  }

  triggerInspiration(civicId: string): void {
    if (!this.currentResearch || this.currentResearch.civicId !== civicId) return;
    if (this.currentResearch.inspirationTriggered) return;

    this.currentResearch.inspirationTriggered = true;
  }

  getCulturePerTurn(): number {
    const cityCount = this.player.cities.length;
    const culture = cityCount * 2;
    return culture;
  }

  getAvailableCivics(): string[] {
    const available: string[] = [];

    for (const civicId of Object.keys(CIVICS)) {
      if (this.canResearch(civicId)) {
        available.push(civicId);
      }
    }

    return available;
  }

  getCurrentResearch(): CivicResearch | null {
    return this.currentResearch;
  }

  setCurrentResearch(research: CivicResearch | null): void {
    this.currentResearch = research;
  }

  getUnlocks(civicId: string): string[] {
    const civic = CIVICS[civicId];
    return civic?.unlocks ?? [];
  }

  hasCivic(civicId: string): boolean {
    return this.civics.has(civicId);
  }

  getResearchProgress(): number {
    if (!this.currentResearch) return 0;
    const cost = this.getAdjustedCost(this.currentResearch.civicId);
    return (this.currentResearch.progress / cost) * 100;
  }

  getCivics(): Set<string> {
    return new Set(this.civics);
  }

  setCivics(civics: Set<string>): void {
    this.civics = new Set(civics);
  }
}

export function createCivicSystem(player: Player, config: CivicConfig): CivicSystem {
  return new CivicSystem(player, config);
}

export function checkInspirationTrigger(
  trigger: string,
  context: {
    metCiv?: boolean;
    meleeTrained?: number;
    battleWon?: boolean;
    palaceBuilt?: boolean;
    tradeRouteEstablished?: boolean;
    monumentBuilt?: boolean;
    shrineBuilt?: boolean;
    naturalWonderDiscovered?: boolean;
    ironImproved?: boolean;
    harborBuilt?: boolean;
    goldEarned?: number;
    universityBuilt?: boolean;
    libraryBuilt?: number;
    greatPersonRecruited?: boolean;
    barracksBuilt?: boolean;
    bankBuilt?: boolean;
    templeBuilt?: number;
    continentsVisited?: number;
    religionFounded?: boolean;
    luxuryConnected?: number;
    uniqueResourcesImproved?: number;
    museumBuilt?: number;
    aqueductBuilt?: number;
    cityPop10?: boolean;
    factoryBuilt?: boolean;
    forestPlanted?: number;
    powerPlantBuilt?: boolean;
    broadcastTowerBuilt?: number;
    cityPop100?: boolean;
  }
): boolean {
  const triggerLower = trigger.toLowerCase();

  if (triggerLower.includes('meet another') && context.metCiv) return true;
  if (triggerLower.includes('3 melee') && (context.meleeTrained ?? 0) >= 3) return true;
  if (triggerLower.includes('win a battle') && context.battleWon) return true;
  if (triggerLower.includes('palace') && context.palaceBuilt) return true;
  if (triggerLower.includes('trade route') && context.tradeRouteEstablished) return true;
  if (triggerLower.includes('monument') && context.monumentBuilt) return true;
  if (triggerLower.includes('shrine') && context.shrineBuilt) return true;
  if (triggerLower.includes('natural wonder') && context.naturalWonderDiscovered) return true;
  if (triggerLower.includes('iron') && context.ironImproved) return true;
  if (triggerLower.includes('harbor') && context.harborBuilt) return true;
  if (triggerLower.includes('50 gold') && (context.goldEarned ?? 0) >= 50) return true;
  if (triggerLower.includes('university') && context.universityBuilt) return true;
  if (triggerLower.includes('3 libraries') && (context.libraryBuilt ?? 0) >= 3) return true;
  if (triggerLower.includes('great person') && context.greatPersonRecruited) return true;
  if (triggerLower.includes('barracks') && context.barracksBuilt) return true;
  if (triggerLower.includes('bank') && context.bankBuilt) return true;
  if (triggerLower.includes('3 temples') && (context.templeBuilt ?? 0) >= 3) return true;
  if (triggerLower.includes('2 continents') && (context.continentsVisited ?? 0) >= 2) return true;
  if (triggerLower.includes('religion') && context.religionFounded) return true;
  if (triggerLower.includes('5 luxury') && (context.luxuryConnected ?? 0) >= 5) return true;
  if (triggerLower.includes('5 unique') && (context.uniqueResourcesImproved ?? 0) >= 5) return true;
  if (triggerLower.includes('3 museums') && (context.museumBuilt ?? 0) >= 3) return true;
  if (triggerLower.includes('3 aqueducts') && (context.aqueductBuilt ?? 0) >= 3) return true;
  if (triggerLower.includes('10 population') && context.cityPop10) return true;
  if (triggerLower.includes('factory') && context.factoryBuilt) return true;
  if (triggerLower.includes('3 forests') && (context.forestPlanted ?? 0) >= 3) return true;
  if (triggerLower.includes('power plant') && context.powerPlantBuilt) return true;
  if (triggerLower.includes('3 broadcast') && (context.broadcastTowerBuilt ?? 0) >= 3) return true;
  if (triggerLower.includes('100 population') && context.cityPop100) return true;

  return false;
}
