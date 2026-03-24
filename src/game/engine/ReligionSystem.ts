import type { Player, Unit, GameAge } from '@/game/entities/types';

export interface Religion {
  id: string;
  name: string;
  founder: number;
  holyCityId: string;
  followers: Map<string, number>;
  beliefs: string[];
}

export interface Belief {
  id: string;
  name: string;
  type: 'follower' | 'foliage' | 'enhancer' | 'pantheon';
  effect: string;
}

export const BELIEFS: Record<string, Belief> = {
  religious_settlements: {
    id: 'religious_settlements',
    name: 'Religious Settlements',
    type: 'pantheon',
    effect: '+15% City Growth',
  },
  stone_circles: {
    id: 'stone_circles',
    name: 'Stone Circles',
    type: 'pantheon',
    effect: '+2 Faith from Quarries',
  },
  desert_faith: {
    id: 'desert_faith',
    name: 'Desert Faith',
    type: 'pantheon',
    effect: '+1 Faith from Desert tiles',
  },
  fertility_rites: {
    id: 'fertility_rites',
    name: 'Fertility Rites',
    type: 'pantheon',
    effect: '-15% Food required for population growth',
  },
  goddess_war: {
    id: 'goddess_war',
    name: 'Goddess of War',
    type: 'pantheon',
    effect: '+5 Combat Strength for units near your cities',
  },
  divine_prophets: {
    id: 'divine_prophets',
    name: 'Divine Prophets',
    type: 'pantheon',
    effect: '+25% Great Prophet points',
  },
  church_property: {
    id: 'church_property',
    name: 'Church Property',
    type: 'follower',
    effect: '+2 Gold per Temple',
  },
  tithe: {
    id: 'tithe',
    name: 'Tithe',
    type: 'follower',
    effect: '+1 Gold per 4 followers',
  },
  religious_unity: {
    id: 'religious_unity',
    name: 'Religious Unity',
    type: 'follower',
    effect: '+5% Culture per city following this religion',
  },
  religious_center: {
    id: 'religious_center',
    name: 'Religious Center',
    type: 'follower',
    effect: '+2 Faith in cities with a Temple',
  },
  missionary_zeal: {
    id: 'missionary_zeal',
    name: 'Missionary Zeal',
    type: 'enhancer',
    effect: '-25% cost of missionary spread',
  },
  holy_order: {
    id: 'holy_order',
    name: 'Holy Order',
    type: 'enhancer',
    effect: '-30% cost of purchasing missionaries/apostles with Faith',
  },
  reformation: {
    id: 'reformation',
    name: 'Reformation',
    type: 'enhancer',
    effect: '+25% Religious pressure',
  },
  religious_texts: {
    id: 'religious_texts',
    name: 'Religious Texts',
    type: 'enhancer',
    effect: '+100% religious spread from trade routes',
  },
};

export interface GreatProphetPoints {
  faith: number;
  points: number;
}

export interface ReligionConfig {
  age: GameAge;
}

export class ReligionSystem {
  private player: Player;
  private config: ReligionConfig;
  private faith: number = 0;
  private greatProphetPoints: number = 0;
  private hasFoundedReligion: boolean = false;
  private hasPantheon: boolean = false;
  private religion: Religion | null = null;
  private citiesWithReligion: Set<string> = new Set();

  constructor(player: Player, config: ReligionConfig) {
    this.player = player;
    this.config = config;
  }

  getFaith(): number {
    return this.faith;
  }

  addFaith(amount: number): void {
    this.faith += amount;
  }

  getGreatProphetPoints(): number {
    return this.greatProphetPoints;
  }

  addGreatProphetPoints(amount: number): void {
    this.greatProphetPoints += amount;
  }

  canFoundPantheon(): boolean {
    return !this.hasPantheon && this.faith >= 20;
  }

  foundPantheon(beliefId: string): boolean {
    if (!this.canFoundPantheon()) return false;

    this.faith -= 20;
    this.hasPantheon = true;
    void beliefId;

    return true;
  }

  canFoundReligion(): boolean {
    if (this.hasFoundedReligion) return false;
    if (this.config.age === 'modern') return false;
    return this.greatProphetPoints >= 8;
  }

  foundReligion(name: string, holyCityId: string, beliefs: string[]): boolean {
    if (!this.canFoundReligion()) return false;

    this.greatProphetPoints -= 8;
    this.hasFoundedReligion = true;

    this.religion = {
      id: `religion-${this.player.id}`,
      name,
      founder: this.player.id,
      holyCityId,
      followers: new Map(),
      beliefs,
    };

    const holyCity = this.player.cities.find((c) => c.id === holyCityId);
    if (holyCity) {
      this.citiesWithReligion.add(holyCityId);
      this.religion.followers.set(holyCityId, 100);
    }

    return true;
  }

  canTrainMissionary(): boolean {
    return this.hasFoundedReligion && this.faith >= 25;
  }

  canTrainApostle(): boolean {
    return this.hasFoundedReligion && this.faith >= 50;
  }

  trainMissionary(): boolean {
    if (!this.canTrainMissionary()) return false;
    this.faith -= 25;
    return true;
  }

  trainApostle(): boolean {
    if (!this.canTrainApostle()) return false;
    this.faith -= 50;
    return true;
  }

  spreadReligion(unit: Unit, cityId: string): void {
    if (!this.religion) return;
    if (!this.hasFoundedReligion) return;

    const city = this.player.cities.find((c) => c.id === cityId);
    if (!city) return;

    const currentFollowers = this.religion.followers.get(cityId) || 0;
    const unitType = unit.type as string;
    const spreadAmount = unitType === 'apostle' ? 50 : 25;

    this.religion.followers.set(cityId, Math.min(100, currentFollowers + spreadAmount));
    this.citiesWithReligion.add(cityId);
  }

  getReligiousFollowers(cityId: string): number {
    if (!this.religion) return 0;
    return this.religion.followers.get(cityId) || 0;
  }

  hasMajorityInCity(cityId: string): boolean {
    if (!this.religion) return false;
    const followers = this.religion.followers.get(cityId) || 0;
    return followers > 50;
  }

  hasReligionInCity(cityId: string): boolean {
    return this.citiesWithReligion.has(cityId);
  }

  getReligion(): Religion | null {
    return this.religion;
  }

  hasFoundedReligionCheck(): boolean {
    return this.hasFoundedReligion;
  }

  getFaithPerTurn(): number {
    const cityCount = this.player.cities.length;
    let faith = cityCount * 2;

    return faith;
  }

  getGreatProphetPointsPerTurn(): number {
    const cityCount = this.player.cities.length;
    let points = cityCount * 1;

    return points;
  }

  checkReligiousVictory(otherPlayers: Player[]): boolean {
    if (this.config.age === 'modern') return false;
    if (!this.hasFoundedReligion) return false;

    for (const otherPlayer of otherPlayers) {
      if (otherPlayer.id === this.player.id) continue;

      let totalFollowers = 0;
      let totalPopulation = 0;

      for (const city of otherPlayer.cities) {
        totalPopulation += city.population;
        const followers = this.religion?.followers.get(city.id) || 0;
        totalFollowers += Math.floor((followers / 100) * city.population);
      }

      if (totalPopulation > 0 && (totalFollowers / totalPopulation) <= 0.5) {
        return false;
      }
    }

    return true;
  }

  processTurn(): void {
    this.faith += this.getFaithPerTurn();
    this.greatProphetPoints += this.getGreatProphetPointsPerTurn();
  }

  isAvailable(): boolean {
    return this.config.age !== 'modern';
  }
}

export function createReligionSystem(player: Player, config: ReligionConfig): ReligionSystem {
  return new ReligionSystem(player, config);
}
