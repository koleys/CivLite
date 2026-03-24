import type { Player, GameAge, GameSpeed } from '@/game/entities/types';

export type GovernmentType =
  | 'chiefdom'
  | 'classical_republic'
  | 'monarchy'
  | 'theocracy'
  | 'merchant_republic'
  | 'constitutional_monarchy'
  | 'communism'
  | 'democracy'
  | 'fascism'
  | 'digital_democracy';

export interface Government {
  id: GovernmentType;
  name: string;
  era: GameAge;
  bonus: string;
  slots: PolicySlots;
  cost: number;
}

export interface PolicySlots {
  military?: number;
  economic?: number;
  diplomatic?: number;
  religious?: number;
  industrial?: number;
  scientific?: number;
}

export interface PolicyCard {
  id: string;
  name: string;
  description: string;
  effect: string;
  slotType: keyof PolicySlots;
  tier: 1 | 2 | 3;
  era: GameAge;
}

export interface GovernmentConfig {
  gameSpeed: GameSpeed;
}

export const GOVERNMENTS: Record<GovernmentType, Government> = {
  chiefdom: {
    id: 'chiefdom',
    name: 'Chiefdom',
    era: 'antiquity',
    bonus: '+20% Production',
    slots: { military: 1, economic: 1 },
    cost: 0,
  },
  classical_republic: {
    id: 'classical_republic',
    name: 'Classical Republic',
    era: 'antiquity',
    bonus: '+2 Envoys',
    slots: { military: 1, economic: 2 },
    cost: 100,
  },
  monarchy: {
    id: 'monarchy',
    name: 'Monarchy',
    era: 'antiquity',
    bonus: '+20% Gold',
    slots: { military: 2, economic: 1 },
    cost: 100,
  },
  theocracy: {
    id: 'theocracy',
    name: 'Theocracy',
    era: 'antiquity',
    bonus: '+2 Faith',
    slots: { military: 1, religious: 1 },
    cost: 100,
  },
  merchant_republic: {
    id: 'merchant_republic',
    name: 'Merchant Republic',
    era: 'exploration',
    bonus: '+50% Trade Routes',
    slots: { economic: 1, diplomatic: 1 },
    cost: 200,
  },
  constitutional_monarchy: {
    id: 'constitutional_monarchy',
    name: 'Constitutional Monarchy',
    era: 'modern',
    bonus: '+2 Gold per Campus',
    slots: { military: 1, economic: 1, diplomatic: 1 },
    cost: 400,
  },
  communism: {
    id: 'communism',
    name: 'Communism',
    era: 'modern',
    bonus: '+4 Housing',
    slots: { economic: 2, industrial: 1 },
    cost: 400,
  },
  democracy: {
    id: 'democracy',
    name: 'Democracy',
    era: 'modern',
    bonus: '+1 Gold per 10 Population',
    slots: { economic: 2, diplomatic: 1 },
    cost: 400,
  },
  fascism: {
    id: 'fascism',
    name: 'Fascism',
    era: 'modern',
    bonus: '+50% Production towards units',
    slots: { military: 3 },
    cost: 400,
  },
  digital_democracy: {
    id: 'digital_democracy',
    name: 'Digital Democracy',
    era: 'modern',
    bonus: '+30% Science',
    slots: { economic: 1, diplomatic: 1, scientific: 1 },
    cost: 600,
  },
};

export const POLICY_CARDS: Record<string, PolicyCard> = {
  agriculture: {
    id: 'agriculture',
    name: 'Agriculture',
    description: '+15% Food',
    effect: '+15% food',
    slotType: 'economic',
    tier: 1,
    era: 'antiquity',
  },
  mining: {
    id: 'mining',
    name: 'Mining',
    description: '+15% Production',
    effect: '+15% production',
    slotType: 'economic',
    tier: 1,
    era: 'antiquity',
  },
  bronze_working: {
    id: 'bronze_working',
    name: 'Bronze Working',
    description: '+25% Production towards melee units',
    effect: '+25% melee production',
    slotType: 'military',
    tier: 1,
    era: 'antiquity',
  },
  masonry: {
    id: 'masonry',
    name: 'Masonry',
    description: '+20% Production towards walls',
    effect: '+20% walls',
    slotType: 'military',
    tier: 1,
    era: 'antiquity',
  },
  foreign_trade: {
    id: 'foreign_trade',
    name: 'Foreign Trade',
    description: '+2 Gold from trade routes',
    effect: '+2 trade gold',
    slotType: 'economic',
    tier: 1,
    era: 'antiquity',
  },
  military_tradition: {
    id: 'military_tradition',
    name: 'Military Tradition',
    description: '+25% XP from combat',
    effect: '+25% combat XP',
    slotType: 'military',
    tier: 2,
    era: 'antiquity',
  },
  recordkeeping: {
    id: 'recordkeeping',
    name: 'Record Keeping',
    description: '+15% Science',
    effect: '+15% science',
    slotType: 'scientific',
    tier: 2,
    era: 'antiquity',
  },
  meditation: {
    id: 'meditation',
    name: 'Meditation',
    description: '+20% Faith',
    effect: '+20% faith',
    slotType: 'religious',
    tier: 2,
    era: 'antiquity',
  },
  exploitation: {
    id: 'exploitation',
    name: 'Exploitation',
    description: '+1 Production from mines',
    effect: '+1 mine production',
    slotType: 'economic',
    tier: 2,
    era: 'antiquity',
  },
  civilization: {
    id: 'civilization',
    name: 'Civilization',
    description: '+25% Culture',
    effect: '+25% culture',
    slotType: 'diplomatic',
    tier: 3,
    era: 'antiquity',
  },
  wonders: {
    id: 'wonders',
    name: 'Wonders',
    description: '-15% Wonder production cost',
    effect: '-15% wonder cost',
    slotType: 'military',
    tier: 3,
    era: 'antiquity',
  },
  oration: {
    id: 'oration',
    name: 'Oration',
    description: '+2 Gold per city',
    effect: '+2 city gold',
    slotType: 'economic',
    tier: 3,
    era: 'antiquity',
  },
  mercantilism: {
    id: 'mercantilism',
    name: 'Mercantilism',
    description: '+25% Gold',
    effect: '+25% gold',
    slotType: 'economic',
    tier: 2,
    era: 'exploration',
  },
  colonialism: {
    id: 'colonialism',
    name: 'Colonialism',
    description: '+50% Production towards colonial settlements',
    effect: '+50% colonial',
    slotType: 'economic',
    tier: 2,
    era: 'exploration',
  },
  naval_tradition: {
    id: 'naval_tradition',
    name: 'Naval Tradition',
    description: '+25% Naval unit strength',
    effect: '+25% naval',
    slotType: 'military',
    tier: 2,
    era: 'exploration',
  },
  industrialization: {
    id: 'industrialization',
    name: 'Industrialization',
    description: '+20% Production',
    effect: '+20% production',
    slotType: 'industrial',
    tier: 3,
    era: 'modern',
  },
  mobilization: {
    id: 'mobilization',
    name: 'Mobilization',
    description: '+50% Production towards military units',
    effect: '+50% military',
    slotType: 'military',
    tier: 3,
    era: 'modern',
  },
  globalization: {
    id: 'globalization',
    name: 'Globalization',
    description: '+30% Science',
    effect: '+30% science',
    slotType: 'scientific',
    tier: 3,
    era: 'modern',
  },
  treaty_organization: {
    id: 'treaty_organization',
    name: 'Treaty Organization',
    description: '+4 Diplomatic Favor per turn',
    effect: '+4 favor',
    slotType: 'diplomatic',
    tier: 3,
    era: 'modern',
  },
};

export const GOVERNMENT_COST_MULTIPLIERS: Record<GameSpeed, number> = {
  online: 0.67,
  standard: 1.0,
  marathon: 3.0,
};

export class GovernmentSystem {
  private player: Player;
  private config: GovernmentConfig;
  private currentGovernment: GovernmentType;
  private activePolicies: string[] = [];

  constructor(player: Player, config: GovernmentConfig) {
    this.player = player;
    this.config = config;
    this.currentGovernment = 'chiefdom';
  }

  getGovernment(): GovernmentType {
    return this.currentGovernment;
  }

  getGovernmentData(): Government {
    return GOVERNMENTS[this.currentGovernment];
  }

  canChangeGovernment(): boolean {
    const cost = this.getChangeCost();
    return this.player.gold >= cost && this.player.cities.length > 0;
  }

  getChangeCost(): number {
    const gov = GOVERNMENTS[this.currentGovernment];
    const multiplier = GOVERNMENT_COST_MULTIPLIERS[this.config.gameSpeed];
    return Math.floor(gov.cost * multiplier);
  }

  changeGovernment(newGovernment: GovernmentType): boolean {
    if (!this.canAffordGovernment(newGovernment)) return false;

    const cost = this.getChangeCost();
    this.player.gold -= cost;
    this.currentGovernment = newGovernment;

    return true;
  }

  canAffordGovernment(government: GovernmentType): boolean {
    const gov = GOVERNMENTS[government];
    const multiplier = GOVERNMENT_COST_MULTIPLIERS[this.config.gameSpeed];
    const cost = Math.floor(gov.cost * multiplier);
    return this.player.gold >= cost;
  }

  canActivatePolicy(policyId: string, eraScore: number): boolean {
    const policy = POLICY_CARDS[policyId];
    if (!policy) return false;

    if (this.activePolicies.includes(policyId)) return false;

    if (policy.tier === 2 && eraScore < 15) return false;
    if (policy.tier === 3 && eraScore < 25) return false;

    const gov = this.getGovernmentData();
    const slotType = policy.slotType;
    const usedSlots = this.getUsedSlots(slotType);
    const totalSlots = gov.slots[slotType] || 0;

    return usedSlots < totalSlots;
  }

  activatePolicy(policyId: string): boolean {
    const policy = POLICY_CARDS[policyId];
    if (!policy) return false;

    const gov = this.getGovernmentData();
    const slotType = policy.slotType;
    const usedSlots = this.getUsedSlots(slotType);
    const totalSlots = gov.slots[slotType] || 0;

    if (usedSlots >= totalSlots) return false;

    this.activePolicies.push(policyId);
    return true;
  }

  deactivatePolicy(policyId: string): boolean {
    const index = this.activePolicies.indexOf(policyId);
    if (index === -1) return false;

    this.activePolicies.splice(index, 1);
    return true;
  }

  getActivePolicies(): string[] {
    return [...this.activePolicies];
  }

  getActivePolicyData(): PolicyCard[] {
    return this.activePolicies.map((id) => POLICY_CARDS[id]).filter(Boolean);
  }

  private getUsedSlots(slotType: keyof PolicySlots): number {
    return this.activePolicies.filter((id) => POLICY_CARDS[id]?.slotType === slotType).length;
  }

  getAvailablePolicies(eraScore: number): string[] {
    const available: string[] = [];

    for (const [policyId, policy] of Object.entries(POLICY_CARDS)) {
      if (this.activePolicies.includes(policyId)) continue;

      if (policy.tier === 2 && eraScore < 15) continue;
      if (policy.tier === 3 && eraScore < 25) continue;

      if (this.canActivatePolicy(policyId, eraScore)) {
        available.push(policyId);
      }
    }

    return available;
  }

  getBonusMultiplier(bonusType: string): number {
    let multiplier = 1.0;

    switch (bonusType) {
      case 'production':
        if (this.currentGovernment === 'chiefdom') multiplier += 0.2;
        if (this.currentGovernment === 'fascism') multiplier += 0.5;
        break;
      case 'gold':
        if (this.currentGovernment === 'monarchy') multiplier += 0.2;
        break;
      case 'faith':
        if (this.currentGovernment === 'theocracy') multiplier += 0.2;
        break;
      case 'science':
        if (this.currentGovernment === 'digital_democracy') multiplier += 0.3;
        break;
      case 'trade_routes':
        if (this.currentGovernment === 'merchant_republic') multiplier += 0.5;
        break;
      case 'housing':
        if (this.currentGovernment === 'communism') multiplier += 4;
        break;
      case 'population_gold':
        if (this.currentGovernment === 'democracy') multiplier += 0.1;
        break;
    }

    for (const policyId of this.activePolicies) {
      const policy = POLICY_CARDS[policyId];
      if (!policy) continue;

      if (policy.effect.includes('production') && bonusType === 'production') {
        multiplier += this.extractBonus(policy.effect);
      }
      if (policy.effect.includes('gold') && bonusType === 'gold') {
        multiplier += this.extractBonus(policy.effect);
      }
      if (policy.effect.includes('science') && bonusType === 'science') {
        multiplier += this.extractBonus(policy.effect);
      }
      if (policy.effect.includes('faith') && bonusType === 'faith') {
        multiplier += this.extractBonus(policy.effect);
      }
    }

    return multiplier;
  }

  private extractBonus(effect: string): number {
    const match = effect.match(/\+(\d+)%/);
    if (match) {
      return parseInt(match[1], 10) / 100;
    }
    return 0;
  }

  getAvailableGovernments(): GovernmentType[] {
    const available: GovernmentType[] = [];

    for (const govId of Object.keys(GOVERNMENTS)) {
      if (this.canAffordGovernment(govId as GovernmentType)) {
        available.push(govId as GovernmentType);
      }
    }

    return available;
  }

  setGovernment(government: GovernmentType): void {
    if (GOVERNMENTS[government]) {
      this.currentGovernment = government;
    }
  }

  setActivePolicies(policies: string[]): void {
    this.activePolicies = policies;
  }
}

export function createGovernmentSystem(player: Player, config: GovernmentConfig): GovernmentSystem {
  return new GovernmentSystem(player, config);
}
