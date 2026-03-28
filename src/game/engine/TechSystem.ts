import type { Player, GameAge, GameSpeed } from '@/game/entities/types';

export interface Technology {
  id: string;
  name: string;
  era: GameAge;
  cost: number;
  prerequisites: string[];
  eurekaTrigger: string;
  eurekaBonus: number;
  unlocks: string[];
}

export interface TechResearch {
  techId: string;
  progress: number;
  eurekaTriggered: boolean;
  turnsRemaining: number;
}

export interface TechConfig {
  gameSpeed: GameSpeed;
  difficulty: string;
}

export const TECH_COST_MULTIPLIERS: Record<GameSpeed, number> = {
  online: 0.67,
  standard: 1.0,
  marathon: 3.0,
};

export const TECHNOLOGIES: Record<string, Technology> = {
  mining: {
    id: 'mining',
    name: 'Mining',
    era: 'antiquity',
    cost: 20,
    prerequisites: [],
    eurekaTrigger: 'Mine a resource tile',
    eurekaBonus: 0.5,
    unlocks: ['bronze_working', 'masonry', 'construction'],
  },
  bronze_working: {
    id: 'bronze_working',
    name: 'Bronze Working',
    era: 'antiquity',
    cost: 35,
    prerequisites: ['mining'],
    eurekaTrigger: 'Kill a unit with a melee unit',
    eurekaBonus: 0.5,
    unlocks: ['iron_working'],
  },
  masonry: {
    id: 'masonry',
    name: 'Masonry',
    era: 'antiquity',
    cost: 25,
    prerequisites: ['mining'],
    eurekaTrigger: 'Build 3 Mines',
    eurekaBonus: 0.5,
    unlocks: ['construction'],
  },
  pottery: {
    id: 'pottery',
    name: 'Pottery',
    era: 'antiquity',
    cost: 20,
    prerequisites: [],
    eurekaTrigger: 'Build 3 Farms',
    eurekaBonus: 0.5,
    unlocks: [],
  },
  writing: {
    id: 'writing',
    name: 'Writing',
    era: 'antiquity',
    cost: 40,
    prerequisites: [],
    eurekaTrigger: 'Earn 100 Gold',
    eurekaBonus: 0.5,
    unlocks: [],
  },
  mathematics: {
    id: 'mathematics',
    name: 'Mathematics',
    era: 'antiquity',
    cost: 45,
    prerequisites: [],
    eurekaTrigger: 'Train a Scout unit',
    eurekaBonus: 0.5,
    unlocks: [],
  },
  iron_working: {
    id: 'iron_working',
    name: 'Iron Working',
    era: 'antiquity',
    cost: 65,
    prerequisites: ['bronze_working'],
    eurekaTrigger: 'Train a Swordsman unit',
    eurekaBonus: 0.5,
    unlocks: ['metallurgy', 'construction'],
  },
  construction: {
    id: 'construction',
    name: 'Construction',
    era: 'antiquity',
    cost: 55,
    prerequisites: ['masonry', 'iron_working'],
    eurekaTrigger: 'Build 3 Forts',
    eurekaBonus: 0.5,
    unlocks: ['engineering'],
  },
  currency: {
    id: 'currency',
    name: 'Currency',
    era: 'antiquity',
    cost: 60,
    prerequisites: ['pottery'],
    eurekaTrigger: 'Build a Market',
    eurekaBonus: 0.5,
    unlocks: [],
  },
  philosophy: {
    id: 'philosophy',
    name: 'Philosophy',
    era: 'antiquity',
    cost: 70,
    prerequisites: ['writing'],
    eurekaTrigger: 'Build a Shrine',
    eurekaBonus: 0.5,
    unlocks: [],
  },
  horse_riding: {
    id: 'horse_riding',
    name: 'Horse Riding',
    era: 'antiquity',
    cost: 50,
    prerequisites: [],
    eurekaTrigger: 'Build a Pasture',
    eurekaBonus: 0.5,
    unlocks: [],
  },
  archery: {
    id: 'archery',
    name: 'Archery',
    era: 'antiquity',
    cost: 35,
    prerequisites: [],
    eurekaTrigger: 'Train an Archer unit',
    eurekaBonus: 0.5,
    unlocks: [],
  },
  sailing: {
    id: 'sailing',
    name: 'Sailing',
    era: 'antiquity',
    cost: 35,
    prerequisites: [],
    eurekaTrigger: 'Discover a Coast tile',
    eurekaBonus: 0.5,
    unlocks: ['optics', 'shipbuilding'],
  },
  calendar: {
    id: 'calendar',
    name: 'Calendar',
    era: 'antiquity',
    cost: 45,
    prerequisites: [],
    eurekaTrigger: 'Harvest a luxury resource',
    eurekaBonus: 0.5,
    unlocks: [],
  },
  engineering: {
    id: 'engineering',
    name: 'Engineering',
    era: 'antiquity',
    cost: 100,
    prerequisites: ['construction'],
    eurekaTrigger: 'Build a Road',
    eurekaBonus: 0.5,
    unlocks: [],
  },
  animal_husbandry: {
    id: 'animal_husbandry',
    name: 'Animal Husbandry',
    era: 'antiquity',
    cost: 30,
    prerequisites: [],
    eurekaTrigger: 'Build a Pasture',
    eurekaBonus: 0.5,
    unlocks: ['horse_riding'],
  },
  universities: {
    id: 'universities',
    name: 'Universities',
    era: 'exploration',
    cost: 220,
    prerequisites: ['education'],
    eurekaTrigger: 'Build a University',
    eurekaBonus: 0.5,
    unlocks: [],
  },
  refining: {
    id: 'refining',
    name: 'Refining',
    era: 'exploration',
    cost: 230,
    prerequisites: ['steel'],
    eurekaTrigger: 'Discover an Oil resource',
    eurekaBonus: 0.5,
    unlocks: ['combustion', 'plastics'],
  },
  paper: {
    id: 'paper',
    name: 'Paper',
    era: 'exploration',
    cost: 90,
    prerequisites: [],
    eurekaTrigger: 'Build a Library',
    eurekaBonus: 0.5,
    unlocks: ['printing'],
  },
  printing: {
    id: 'printing',
    name: 'Printing',
    era: 'exploration',
    cost: 150,
    prerequisites: ['paper'],
    eurekaTrigger: 'Build 3 Libraries',
    eurekaBonus: 0.5,
    unlocks: ['banking', 'education'],
  },
  optics: {
    id: 'optics',
    name: 'Optics',
    era: 'exploration',
    cost: 80,
    prerequisites: ['sailing'],
    eurekaTrigger: 'Build a Harbor',
    eurekaBonus: 0.5,
    unlocks: ['astronomy', 'compass', 'cartography'],
  },
  compass: {
    id: 'compass',
    name: 'Compass',
    era: 'exploration',
    cost: 100,
    prerequisites: ['sailing'],
    eurekaTrigger: 'Explore 3 coasts',
    eurekaBonus: 0.5,
    unlocks: ['navigation'],
  },
  cartography: {
    id: 'cartography',
    name: 'Cartography',
    era: 'exploration',
    cost: 150,
    prerequisites: ['optics'],
    eurekaTrigger: 'Have a unit enter an unexplored tile',
    eurekaBonus: 0.5,
    unlocks: [],
  },
  shipbuilding: {
    id: 'shipbuilding',
    name: 'Shipbuilding',
    era: 'exploration',
    cost: 120,
    prerequisites: ['sailing'],
    eurekaTrigger: 'Build a Harbor',
    eurekaBonus: 0.5,
    unlocks: [],
  },
  astronomy: {
    id: 'astronomy',
    name: 'Astronomy',
    era: 'exploration',
    cost: 140,
    prerequisites: ['optics'],
    eurekaTrigger: 'Build a Harbor',
    eurekaBonus: 0.5,
    unlocks: [],
  },
  navigation: {
    id: 'navigation',
    name: 'Navigation',
    era: 'exploration',
    cost: 180,
    prerequisites: ['compass'],
    eurekaTrigger: 'Reach the New World',
    eurekaBonus: 0.5,
    unlocks: [],
  },
  metallurgy: {
    id: 'metallurgy',
    name: 'Metallurgy',
    era: 'exploration',
    cost: 200,
    prerequisites: ['iron_working'],
    eurekaTrigger: 'Train a Heavy Cavalry unit',
    eurekaBonus: 0.5,
    unlocks: ['steel', 'steam_power'],
  },
  steel: {
    id: 'steel',
    name: 'Steel',
    era: 'exploration',
    cost: 200,
    prerequisites: ['iron_working'],
    eurekaTrigger: 'Build a Forge',
    eurekaBonus: 0.5,
    unlocks: ['refining', 'military_tactics'],
  },
  military_tactics: {
    id: 'military_tactics',
    name: 'Military Tactics',
    era: 'exploration',
    cost: 180,
    prerequisites: ['steel'],
    eurekaTrigger: 'Train 3 Melee units',
    eurekaBonus: 0.5,
    unlocks: [],
  },
  education: {
    id: 'education',
    name: 'Education',
    era: 'exploration',
    cost: 200,
    prerequisites: ['printing'],
    eurekaTrigger: 'Build 3 Libraries',
    eurekaBonus: 0.5,
    unlocks: ['universities', 'banking', 'refrigeration'],
  },
  refrigeration: {
    id: 'refrigeration',
    name: 'Refrigeration',
    era: 'exploration',
    cost: 180,
    prerequisites: ['education'],
    eurekaTrigger: 'Harvest a Whale resource',
    eurekaBonus: 0.5,
    unlocks: [],
  },
  banking: {
    id: 'banking',
    name: 'Banking',
    era: 'exploration',
    cost: 220,
    prerequisites: ['education', 'printing'],
    eurekaTrigger: 'Build a Market',
    eurekaBonus: 0.5,
    unlocks: [],
  },
  steam_power: {
    id: 'steam_power',
    name: 'Steam Power',
    era: 'exploration',
    cost: 250,
    prerequisites: ['metallurgy'],
    eurekaTrigger: 'Build an Industrial Zone district',
    eurekaBonus: 0.5,
    unlocks: ['electricity', 'combustion'],
  },
  radio: {
    id: 'radio',
    name: 'Radio',
    era: 'modern',
    cost: 350,
    prerequisites: [],
    eurekaTrigger: 'Build a Stock Exchange',
    eurekaBonus: 0.5,
    unlocks: [],
  },
  electricity: {
    id: 'electricity',
    name: 'Electricity',
    era: 'modern',
    cost: 300,
    prerequisites: ['steam_power'],
    eurekaTrigger: 'Build a Factory',
    eurekaBonus: 0.5,
    unlocks: ['nuclear_fission', 'computers', 'telephones', 'robotics'],
  },
  computers: {
    id: 'computers',
    name: 'Computers',
    era: 'modern',
    cost: 500,
    prerequisites: ['electricity'],
    eurekaTrigger: 'Build a Research Lab',
    eurekaBonus: 0.5,
    unlocks: ['advanced_computing'],
  },
  telephones: {
    id: 'telephones',
    name: 'Telephones',
    era: 'modern',
    cost: 400,
    prerequisites: ['electricity'],
    eurekaTrigger: 'Build a Stock Exchange',
    eurekaBonus: 0.5,
    unlocks: [],
  },
  plastics: {
    id: 'plastics',
    name: 'Plastics',
    era: 'modern',
    cost: 450,
    prerequisites: ['refining'],
    eurekaTrigger: 'Discover Oil resource',
    eurekaBonus: 0.5,
    unlocks: [],
  },
  combustion: {
    id: 'combustion',
    name: 'Combustion',
    era: 'modern',
    cost: 500,
    prerequisites: ['steam_power', 'refining'],
    eurekaTrigger: 'Build a Fort',
    eurekaBonus: 0.5,
    unlocks: ['flight', 'rocketry'],
  },
  flight: {
    id: 'flight',
    name: 'Flight',
    era: 'modern',
    cost: 400,
    prerequisites: ['combustion'],
    eurekaTrigger: 'Build an Aerodrome',
    eurekaBonus: 0.5,
    unlocks: ['advanced_flight'],
  },
  advanced_flight: {
    id: 'advanced_flight',
    name: 'Advanced Flight',
    era: 'modern',
    cost: 550,
    prerequisites: ['flight'],
    eurekaTrigger: 'Build 3 Airports',
    eurekaBonus: 0.5,
    unlocks: [],
  },
  rocketry: {
    id: 'rocketry',
    name: 'Rocketry',
    era: 'modern',
    cost: 700,
    prerequisites: ['combustion'],
    eurekaTrigger: 'Build a Rocket Artillery',
    eurekaBonus: 0.5,
    unlocks: ['satellites'],
  },
  nuclear_fission: {
    id: 'nuclear_fission',
    name: 'Nuclear Fission',
    era: 'modern',
    cost: 850,
    prerequisites: ['electricity'],
    eurekaTrigger: 'Build a Nuclear Plant',
    eurekaBonus: 0.5,
    unlocks: ['fusion'],
  },
  robotics: {
    id: 'robotics',
    name: 'Robotics',
    era: 'modern',
    cost: 750,
    prerequisites: ['electricity'],
    eurekaTrigger: 'Build a Factory',
    eurekaBonus: 0.5,
    unlocks: [],
  },
  satellites: {
    id: 'satellites',
    name: 'Satellites',
    era: 'modern',
    cost: 800,
    prerequisites: ['rocketry'],
    eurekaTrigger: 'Build a Solar Plant',
    eurekaBonus: 0.5,
    unlocks: [],
  },
  laser: {
    id: 'laser',
    name: 'Laser',
    era: 'modern',
    cost: 900,
    prerequisites: ['advanced_computing'],
    eurekaTrigger: 'Build 3 Research Labs',
    eurekaBonus: 0.5,
    unlocks: [],
  },
  advanced_computing: {
    id: 'advanced_computing',
    name: 'Advanced Computing',
    era: 'modern',
    cost: 1200,
    prerequisites: ['fusion'],
    eurekaTrigger: 'Build a Supercomputer',
    eurekaBonus: 0.5,
    unlocks: ['supercomputer', 'laser'],
  },
  fusion: {
    id: 'fusion',
    name: 'Fusion',
    era: 'modern',
    cost: 1100,
    prerequisites: ['nuclear_fission'],
    eurekaTrigger: 'Reach Fusion tech',
    eurekaBonus: 0.5,
    unlocks: ['advanced_computing'],
  },
};

export class TechSystem {
  private player: Player;
  private config: TechConfig;
  private currentResearch: TechResearch | null = null;

  constructor(player: Player, config: TechConfig) {
    this.player = player;
    this.config = config;
  }

  getAdjustedCost(techId: string): number {
    const tech = TECHNOLOGIES[techId];
    if (!tech) return 100;

    const multiplier = TECH_COST_MULTIPLIERS[this.config.gameSpeed];
    let cost = tech.cost * multiplier;

    if (this.currentResearch?.techId === techId && this.currentResearch.eurekaTriggered) {
      cost *= (1 - tech.eurekaBonus);
    }

    return Math.floor(cost);
  }

  startResearch(techId: string): boolean {
    const tech = TECHNOLOGIES[techId];
    if (!tech) return false;

    if (!this.canResearch(techId)) return false;

    const cost = this.getAdjustedCost(techId);
    const turnsRemaining = Math.ceil(cost / this.getSciencePerTurn());

    this.currentResearch = {
      techId,
      progress: 0,
      eurekaTriggered: false,
      turnsRemaining,
    };

    return true;
  }

  processTurn(): { completed: string | null; progress: number } {
    if (!this.currentResearch) {
      return { completed: null, progress: 0 };
    }

    const sciencePerTurn = this.getSciencePerTurn();
    this.currentResearch.progress += sciencePerTurn;

    const cost = this.getAdjustedCost(this.currentResearch.techId);

    if (this.currentResearch.progress >= cost) {
      const completedTech = this.currentResearch.techId;
      this.player.technologies.add(completedTech);
      const progressBeforeComplete = this.currentResearch.progress;
      this.currentResearch = null;
      return { completed: completedTech, progress: progressBeforeComplete };
    }

    return { completed: null, progress: this.currentResearch.progress };
  }

  canResearch(techId: string): boolean {
    const tech = TECHNOLOGIES[techId];
    if (!tech) return false;

    if (this.player.technologies.has(techId)) return false;

    if (this.currentResearch?.techId === techId) return false;

    const prerequisitesMet = tech.prerequisites.every((prereq) =>
      this.player.technologies.has(prereq)
    );

    return prerequisitesMet;
  }

  triggerEureka(techId: string): void {
    if (!this.currentResearch || this.currentResearch.techId !== techId) return;
    if (this.currentResearch.eurekaTriggered) return;

    this.currentResearch.eurekaTriggered = true;
  }

  getSciencePerTurn(): number {
    let science = 0;
    for (const city of this.player.cities) {
      science += 1; // base per city
      if (city.buildings.includes('library')) science += 2;
      if (city.buildings.includes('university')) science += 4;
      if (city.buildings.includes('research_lab')) science += 6;
    }
    return Math.max(1, science);
  }

  getAvailableTechnologies(): string[] {
    const available: string[] = [];

    for (const techId of Object.keys(TECHNOLOGIES)) {
      if (this.canResearch(techId)) {
        available.push(techId);
      }
    }

    return available;
  }

  getCurrentResearch(): TechResearch | null {
    return this.currentResearch;
  }

  setCurrentResearch(research: TechResearch | null): void {
    this.currentResearch = research;
  }

  getUnlocks(techId: string): string[] {
    const tech = TECHNOLOGIES[techId];
    return tech?.unlocks ?? [];
  }

  hasTech(techId: string): boolean {
    return this.player.technologies.has(techId);
  }

  getResearchProgress(): number {
    if (!this.currentResearch) return 0;
    const cost = this.getAdjustedCost(this.currentResearch.techId);
    return (this.currentResearch.progress / cost) * 100;
  }
}

export function createTechSystem(player: Player, config: TechConfig): TechSystem {
  return new TechSystem(player, config);
}

export function checkEurekaTrigger(
  trigger: string,
  context: {
    unitKilled?: boolean;
    unitTrained?: string;
    mineBuilt?: number;
    farmBuilt?: number;
    goldEarned?: number;
    fortBuilt?: number;
    roadBuilt?: boolean;
    harborBuilt?: boolean;
    libraryBuilt?: number;
    coastExplored?: number;
    unexploredEntered?: boolean;
    resourceMined?: string;
    goldResource?: number;
    newContinent?: boolean;
    heavyCavalryTrained?: boolean;
    meleeKills?: number;
  }
): boolean {
  const triggerLower = trigger.toLowerCase();

  if (triggerLower.includes('mine a resource') && context.resourceMined) return true;
  if (triggerLower.includes('kill a unit') && context.unitKilled) return true;
  if (triggerLower.includes('train a') && context.unitTrained) return true;
  if (triggerLower.includes('build 3 mines') && (context.mineBuilt ?? 0) >= 3) return true;
  if (triggerLower.includes('build 3 farms') && (context.farmBuilt ?? 0) >= 3) return true;
  if (triggerLower.includes('earn 100 gold') && (context.goldEarned ?? 0) >= 100) return true;
  if (triggerLower.includes('build 3 forts') && (context.fortBuilt ?? 0) >= 3) return true;
  if (triggerLower.includes('build a road') && context.roadBuilt) return true;
  if (triggerLower.includes('build a harbor') && context.harborBuilt) return true;
  if (triggerLower.includes('build 3 libraries') && (context.libraryBuilt ?? 0) >= 3) return true;
  if (triggerLower.includes('explore 3 coasts') && (context.coastExplored ?? 0) >= 3) return true;
  if (triggerLower.includes('unexplored tile') && context.unexploredEntered) return true;
  if (triggerLower.includes('harvest') && context.resourceMined) return true;
  if (triggerLower.includes('new world') && context.newContinent) return true;
  if (triggerLower.includes('heavy cavalry') && context.heavyCavalryTrained) return true;
  if (triggerLower.includes('3 melee') && (context.meleeKills ?? 0) >= 3) return true;

  return false;
}
