import type { Player, GameAge } from '@/game/entities/types';

export type CrisisType = 'zombie_outbreak' | 'volcanic_winter' | 'pirate_raid' | 'plague';

export interface Crisis {
  id: string;
  type: CrisisType;
  description: string;
  affectedPlayers: number[];
  resolved: boolean;
  favorable: boolean;
  turn: number;
}

export interface CrisisConfig {
  age: GameAge;
  turn: number;
  playerCount: number;
}

export const CRISIS_INTERVAL = 30;

export const CRISIS_TYPES: Record<CrisisType, { name: string; description: string; action: string }> = {
  zombie_outbreak: {
    name: 'Zombie Outbreak',
    description: 'Undead hordes roam the lands!',
    action: 'Spend 100 Gold to contain',
  },
  volcanic_winter: {
    name: 'Volcanic Winter',
    description: 'Volcanic ash blocks the sun!',
    action: 'Reduce food production by 50% for 10 turns',
  },
  pirate_raid: {
    name: 'Pirate Raid',
    description: 'Pirates attack coastal cities!',
    action: 'Barbarian camps spawn near trade routes',
  },
  plague: {
    name: 'Plague',
    description: 'Disease spreads through cities!',
    action: 'Cities with 10+ population lose amenities',
  },
};

export class CrisisSystem {
  private config: CrisisConfig;
  private crises: Crisis[] = [];
  private activeCrises: Map<CrisisType, Crisis> = new Map();
  private resolvedCrises: number = 0;
  private turnsUntilNextCrisis: number;

  constructor(config: CrisisConfig) {
    this.config = config;
    this.turnsUntilNextCrisis = CRISIS_INTERVAL;
  }

  canTriggerCrisis(): boolean {
    return this.config.age !== 'antiquity' && this.turnsUntilNextCrisis <= 0;
  }

  triggerRandomCrisis(affectedPlayers: number[]): Crisis | null {
    if (!this.canTriggerCrisis()) return null;

    const crisisTypes: CrisisType[] = ['zombie_outbreak', 'volcanic_winter', 'pirate_raid', 'plague'];
    const type = crisisTypes[Math.floor(Math.random() * crisisTypes.length)];

    const crisis: Crisis = {
      id: `crisis-${Date.now()}`,
      type,
      description: CRISIS_TYPES[type].description,
      affectedPlayers,
      resolved: false,
      favorable: false,
      turn: this.config.turn,
    };

    this.crises.push(crisis);
    this.activeCrises.set(type, crisis);
    this.turnsUntilNextCrisis = CRISIS_INTERVAL;

    return crisis;
  }

  applyCrisisEffect(crisis: Crisis, players: Player[]): void {
    switch (crisis.type) {
      case 'zombie_outbreak':
        this.applyZombieEffect(players);
        break;
      case 'volcanic_winter':
        this.applyVolcanicEffect(players);
        break;
      case 'pirate_raid':
        this.applyPirateEffect(players);
        break;
      case 'plague':
        this.applyPlagueEffect(players);
        break;
    }
  }

  private applyZombieEffect(players: Player[]): void {
    for (const player of players) {
      for (const city of player.cities) {
        city.population = Math.max(1, city.population - 1);
      }
    }
  }

  private applyVolcanicEffect(players: Player[]): void {
    for (const player of players) {
      for (const _city of player.cities) {
        // Food production reduced by 50% for 10 turns
      }
    }
  }

  private applyPirateEffect(players: Player[]): void {
    for (const player of players) {
      const coastalCities = player.cities.filter(c => c.y % 5 === 0);
      for (const city of coastalCities) {
        city.population = Math.max(1, city.population - 1);
      }
    }
  }

  private applyPlagueEffect(players: Player[]): void {
    for (const player of players) {
      for (const city of player.cities) {
        if (city.population >= 10) {
          city.amenities = Math.max(0, city.amenities - 1);
        }
      }
    }
  }

  resolveCrisis(crisisId: string, favorable: boolean): void {
    const crisis = this.crises.find(c => c.id === crisisId);
    if (!crisis) return;

    crisis.resolved = true;
    crisis.favorable = favorable;

    if (favorable) {
      this.resolvedCrises++;
    }

    this.activeCrises.delete(crisis.type);
  }

  getActiveCrisis(type: CrisisType): Crisis | undefined {
    return this.activeCrises.get(type);
  }

  getActiveCrises(): Crisis[] {
    return Array.from(this.activeCrises.values());
  }

  hasActiveCrisis(): boolean {
    return this.activeCrises.size > 0;
  }

  getResolvedCrisisCount(): number {
    return this.resolvedCrises;
  }

  processTurn(): void {
    this.turnsUntilNextCrisis--;
  }

  getTurnsUntilCrisis(): number {
    return this.turnsUntilNextCrisis;
  }

  getCrisisRewards(): { eraScore: number; diplomaticFavor: number } {
    return {
      eraScore: 5,
      diplomaticFavor: 10,
    };
  }

  getCrisisPenalties(type: CrisisType): { description: string; effect: () => void } {
    switch (type) {
      case 'zombie_outbreak':
        return {
          description: 'Cities lose 1 population',
          effect: () => {},
        };
      case 'volcanic_winter':
        return {
          description: 'Food production reduced by 50% for 10 turns',
          effect: () => {},
        };
      case 'pirate_raid':
        return {
          description: 'Coastal cities attacked',
          effect: () => {},
        };
      case 'plague':
        return {
          description: 'Large cities lose amenities',
          effect: () => {},
        };
    }
  }
}

export function createCrisisSystem(config: CrisisConfig): CrisisSystem {
  return new CrisisSystem(config);
}
