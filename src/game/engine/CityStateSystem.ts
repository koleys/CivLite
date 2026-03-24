import type { MapData, TileCoord } from '@/game/entities/types';

export type CityStateType =
  | 'cultural'
  | 'scientific'
  | 'mercantile'
  | 'religious'
  | 'militaristic'
  | 'industrial'
  | 'maritime'
  | 'diplomatic';

export interface CityState {
  id: string;
  name: string;
  type: CityStateType;
  x: number;
  y: number;
  cityId: string;
  suzerain: number | null;
  envoys: Map<number, number>;
  bonus: string;
}

export interface EnvoyBonus {
  envoys: number;
  bonus: string;
}

export const CITY_STATE_TYPES: Record<CityStateType, { name: string; bonus: string; unit: string }> = {
  cultural: {
    name: 'Cultural',
    bonus: '+3 Culture per turn',
    unit: 'Great Writer',
  },
  scientific: {
    name: 'Scientific',
    bonus: '+3 Science per turn',
    unit: 'Great Scientist',
  },
  mercantile: {
    name: 'Mercantile',
    bonus: '+3 Gold per turn',
    unit: 'Great Merchant',
  },
  religious: {
    name: 'Religious',
    bonus: '+3 Faith per turn',
    unit: 'Great Prophet',
  },
  militaristic: {
    name: 'Militaristic',
    bonus: '+15% Production towards military units',
    unit: 'Great General',
  },
  industrial: {
    name: 'Industrial',
    bonus: '+4 Production per turn',
    unit: 'Great Engineer',
  },
  maritime: {
    name: 'Maritime',
    bonus: '+2 Food to all cities',
    unit: 'Great Admiral',
  },
  diplomatic: {
    name: 'Diplomatic',
    bonus: '+2 Diplomatic Favor per turn',
    unit: 'Great Diplomat',
  },
};

export const ENVOY_BONUSES: Record<CityStateType, EnvoyBonus[]> = {
  cultural: [
    { envoys: 1, bonus: '+1 Culture' },
    { envoys: 3, bonus: '+1 Culture, +1 Great Writer point' },
    { envoys: 6, bonus: '+2 Culture, +2 Great Writer points, +20% Culture' },
  ],
  scientific: [
    { envoys: 1, bonus: '+1 Science' },
    { envoys: 3, bonus: '+1 Science, +1 Great Scientist point' },
    { envoys: 6, bonus: '+2 Science, +2 Great Scientist points, +20% Science' },
  ],
  mercantile: [
    { envoys: 1, bonus: '+1 Gold' },
    { envoys: 3, bonus: '+1 Gold, +1 Great Merchant point' },
    { envoys: 6, bonus: '+2 Gold, +2 Great Merchant points, +1 Amenity' },
  ],
  religious: [
    { envoys: 1, bonus: '+1 Faith' },
    { envoys: 3, bonus: '+1 Faith, +1 Great Prophet point' },
    { envoys: 6, bonus: '+2 Faith, +2 Great Prophet points, +20% Faith' },
  ],
  militaristic: [
    { envoys: 1, bonus: '+10% Production towards military' },
    { envoys: 3, bonus: '+10%, +1 Great General point' },
    { envoys: 6, bonus: '+20%, +2 Great General points, casus belli' },
  ],
  industrial: [
    { envoys: 1, bonus: '+1 Production' },
    { envoys: 3, bonus: '+1 Production, +1 Great Engineer point' },
    { envoys: 6, bonus: '+2 Production, +2 Great Engineer points' },
  ],
  maritime: [
    { envoys: 1, bonus: '+1 Food' },
    { envoys: 3, bonus: '+1 Food, +1 Great Admiral point' },
    { envoys: 6, bonus: '+2 Food, +2 Great Admiral points' },
  ],
  diplomatic: [
    { envoys: 1, bonus: '+1 Diplomatic Favor' },
    { envoys: 3, bonus: '+2 Diplomatic Favor, +1 Great Diplomat point' },
    { envoys: 6, bonus: '+3 Diplomatic Favor, +2 Great Diplomat points' },
  ],
};

export interface CityStateConfig {
  map: MapData;
  cityStateCount: number;
}

export class CityStateSystem {
  private config: CityStateConfig;
  private cityStates: Map<string, CityState> = new Map();
  private envoys: Map<string, Map<number, number>> = new Map();

  constructor(config: CityStateConfig) {
    this.config = config;
  }

  initializeCityStates(): void {
    const types: CityStateType[] = [
      'cultural', 'scientific', 'mercantile', 'religious',
      'militaristic', 'industrial', 'maritime', 'diplomatic'
    ];

    for (let i = 0; i < this.config.cityStateCount; i++) {
      const type = types[i % types.length];
      const position = this.findValidPosition();

      if (!position) continue;

      const cityState: CityState = {
        id: `citystate-${i}`,
        name: this.generateCityStateName(type, i),
        type,
        x: position.x,
        y: position.y,
        cityId: `city-${Date.now()}-${i}`,
        suzerain: null,
        envoys: new Map(),
        bonus: CITY_STATE_TYPES[type].bonus,
      };

      this.cityStates.set(cityState.id, cityState);
      this.envoys.set(cityState.id, new Map());
    }
  }

  private findValidPosition(): TileCoord | null {
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

      return { x, y };
    }

    return null;
  }

  private generateCityStateName(type: CityStateType, index: number): string {
    const names: Record<CityStateType, string[]> = {
      cultural: ['Athens', 'Vienna', 'Paris'],
      scientific: ['Babylon', 'Alexandria', 'Kyoto'],
      mercantile: ['Venice', 'Genoa', 'Singapore'],
      religious: ['Vatican', 'Mecca', 'Jerusalem'],
      militaristic: ['Sparta', 'Rome', 'Berlin'],
      industrial: ['Manchester', 'Detroit', 'Osaka'],
      maritime: ['Lisbon', 'Amsterdam', 'Sydney'],
      diplomatic: ['Geneva', 'Stockholm', 'Vienna'],
    };

    const typeNames = names[type] || ['City'];
    return typeNames[index % typeNames.length];
  }

  investEnvoy(cityStateId: string, playerId: number): boolean {
    const cityState = this.cityStates.get(cityStateId);
    if (!cityState) return false;

    const playerEnvoys = this.envoys.get(cityStateId)?.get(playerId) || 0;
    this.envoys.set(cityStateId, this.envoys.get(cityStateId) || new Map());
    this.envoys.get(cityStateId)!.set(playerId, playerEnvoys + 1);

    this.updateSuzerain(cityStateId);

    return true;
  }

  private updateSuzerain(cityStateId: string): void {
    const cityStateEnvoys = this.envoys.get(cityStateId);
    if (!cityStateEnvoys) return;

    let maxEnvoys = 0;
    let suzerainId: number | null = null;

    for (const [playerId, envoyCount] of cityStateEnvoys) {
      const contested = Array.from(cityStateEnvoys.values()).filter(e => e >= envoyCount).length > 1;
      const requiredEnvoys = contested ? 3 : 2;

      if (envoyCount >= requiredEnvoys && envoyCount > maxEnvoys) {
        maxEnvoys = envoyCount;
        suzerainId = playerId;
      }
    }

    const cityStateToUpdate = this.cityStates.get(cityStateId);
    if (cityStateToUpdate) {
      cityStateToUpdate.suzerain = suzerainId;
    }
  }

  getSuzerain(cityStateId: string): number | null {
    return this.cityStates.get(cityStateId)?.suzerain ?? null;
  }

  getEnvoys(cityStateId: string, playerId: number): number {
    return this.envoys.get(cityStateId)?.get(playerId) ?? 0;
  }

  getCityStates(): CityState[] {
    return Array.from(this.cityStates.values());
  }

  getCityStateById(id: string): CityState | undefined {
    return this.cityStates.get(id);
  }

  getCityStatesByType(type: CityStateType): CityState[] {
    return Array.from(this.cityStates.values()).filter(cs => cs.type === type);
  }

  getBonusForPlayer(playerId: number): { culture: number; science: number; gold: number; faith: number; production: number; diplomaticFavor: number; amenity: number } {
    const bonuses = {
      culture: 0,
      science: 0,
      gold: 0,
      faith: 0,
      production: 0,
      diplomaticFavor: 0,
      amenity: 0,
    };

    for (const [, cityState] of this.cityStates) {
      const envoyCount = this.envoys.get(cityState.id)?.get(playerId) ?? 0;

      if (envoyCount >= 1) {
        if (cityState.type === 'cultural') bonuses.culture += 1;
        if (cityState.type === 'scientific') bonuses.science += 1;
        if (cityState.type === 'mercantile') bonuses.gold += 1;
        if (cityState.type === 'religious') bonuses.faith += 1;
        if (cityState.type === 'industrial') bonuses.production += 1;
        if (cityState.type === 'diplomatic') bonuses.diplomaticFavor += 1;
      }

      if (envoyCount >= 3) {
        if (cityState.type === 'cultural') bonuses.culture += 1;
        if (cityState.type === 'scientific') bonuses.science += 1;
        if (cityState.type === 'mercantile') bonuses.gold += 1;
        if (cityState.type === 'religious') bonuses.faith += 1;
        if (cityState.type === 'industrial') bonuses.production += 1;
        if (cityState.type === 'diplomatic') bonuses.diplomaticFavor += 2;
      }

      if (envoyCount >= 6) {
        if (cityState.type === 'cultural') bonuses.culture += 2;
        if (cityState.type === 'scientific') bonuses.science += 2;
        if (cityState.type === 'mercantile') {
          bonuses.gold += 2;
          bonuses.amenity += 1;
        }
        if (cityState.type === 'religious') bonuses.faith += 2;
        if (cityState.type === 'industrial') bonuses.production += 2;
        if (cityState.type === 'diplomatic') bonuses.diplomaticFavor += 3;
      }

      if (cityState.suzerain === playerId) {
        if (cityState.type === 'maritime') bonuses.culture += 2;
      }
    }

    return bonuses;
  }

  checkAllSuzerain(playerId: number): boolean {
    return Array.from(this.cityStates.values()).every(cs => cs.suzerain === playerId);
  }

  getTotalCityStateCount(): number {
    return this.cityStates.size;
  }

  getSuzerainCount(playerId: number): number {
    return Array.from(this.cityStates.values()).filter(cs => cs.suzerain === playerId).length;
  }
}

export function createCityStateSystem(config: CityStateConfig): CityStateSystem {
  return new CityStateSystem(config);
}
