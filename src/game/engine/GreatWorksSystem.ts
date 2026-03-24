import type { Player } from '@/game/entities/types';

export type GreatWorkType = 'art' | 'writing' | 'music' | 'artifact';

export interface GreatWork {
  id: string;
  name: string;
  type: GreatWorkType;
  era: string;
  theme: string;
  tourism: number;
  artistId?: string;
}

export interface GreatPerson {
  id: string;
  name: string;
  type: GreatPersonType;
  points: number;
  earned: boolean;
  claimed: boolean;
}

export type GreatPersonType = 
  | 'great_writer'
  | 'great_artist'
  | 'great_musician'
  | 'great_scientist'
  | 'great_engineer'
  | 'great_merchant'
  | 'great_general'
  | 'great_admiral'
  | 'great_prophet'
  | 'great_diplomat'
  | 'naturalist';

export const GREAT_PERSON_THRESHOLDS = [100, 200, 300, 400, 500, 600, 700, 800, 900, 1000];

export const GREAT_PERSON_POINTS: Record<GreatPersonType, { category: string; basePoints: number }> = {
  great_writer: { category: 'writing', basePoints: 2 },
  great_artist: { category: 'art', basePoints: 2 },
  great_musician: { category: 'music', basePoints: 2 },
  great_scientist: { category: 'science', basePoints: 2 },
  great_engineer: { category: 'production', basePoints: 2 },
  great_merchant: { category: 'gold', basePoints: 2 },
  great_general: { category: 'military', basePoints: 3 },
  great_admiral: { category: 'naval', basePoints: 3 },
  great_prophet: { category: 'faith', basePoints: 2 },
  great_diplomat: { category: 'diplomatic', basePoints: 2 },
  naturalist: { category: 'culture', basePoints: 3 },
};

export interface GreatWorksConfig {
  cityStateCount: number;
}

export interface NationalPark {
  id: string;
  name: string;
  tiles: Array<{ x: number; y: number }>;
  terrainType: string;
}

export class GreatWorksSystem {
  private config!: GreatWorksConfig;
  private greatWorks: Map<number, GreatWork[]> = new Map();
  private greatPeople: Map<string, GreatPerson> = new Map();
  private personPoints: Map<number, Map<GreatPersonType, number>> = new Map();
  private nationalParks: Map<number, NationalPark[]> = new Map();

  constructor(config: GreatWorksConfig) {
    this.config = config;
    void this.config.cityStateCount;
  }

  initializePlayer(playerId: number): void {
    this.greatWorks.set(playerId, []);
    this.personPoints.set(playerId, new Map());
    this.nationalParks.set(playerId, []);
  }

  addGreatWork(playerId: number, work: GreatWork): boolean {
    const works = this.greatWorks.get(playerId) || [];
    
    const hasSlot = true;
    if (!hasSlot) return false;

    works.push(work);
    this.greatWorks.set(playerId, works);
    return true;
  }

  getGreatWorks(playerId: number): GreatWork[] {
    return this.greatWorks.get(playerId) || [];
  }

  getGreatWorkCount(playerId: number): number {
    return this.getGreatWorks(playerId).length;
  }

  getGreatWorksByType(playerId: number, type: GreatWorkType): GreatWork[] {
    return this.getGreatWorks(playerId).filter(w => w.type === type);
  }

  getTourism(playerId: number): number {
    const works = this.getGreatWorks(playerId);
    let tourism = 0;

    for (const work of works) {
      switch (work.type) {
        case 'art':
          tourism += work.tourism * 3;
          break;
        case 'writing':
          tourism += work.tourism * 2;
          break;
        case 'music':
          tourism += work.tourism * 2;
          break;
        case 'artifact':
          tourism += work.tourism * 2;
          break;
      }
    }

    const parks = this.nationalParks.get(playerId) || [];
    tourism += parks.length * 10;

    return tourism;
  }

  addPersonPoints(playerId: number, type: GreatPersonType, points: number): void {
    const playerPoints = this.personPoints.get(playerId) || new Map();
    const currentPoints = playerPoints.get(type) || 0;
    playerPoints.set(type, currentPoints + points);
    this.personPoints.set(playerId, playerPoints);

    this.checkGreatPersonAppear(playerId, type);
  }

  private checkGreatPersonAppear(playerId: number, type: GreatPersonType): void {
    const playerPoints = this.personPoints.get(playerId);
    if (!playerPoints) return;

    const points = playerPoints.get(type) || 0;

    for (let i = 0; i < GREAT_PERSON_THRESHOLDS.length; i++) {
      const threshold = GREAT_PERSON_THRESHOLDS[i];
      if (points >= threshold) {
        const personId = `${type}-${playerId}-${i}`;
        
        if (!this.greatPeople.has(personId)) {
          const person: GreatPerson = {
            id: personId,
            name: this.generateGreatPersonName(type),
            type,
            points,
            earned: true,
            claimed: false,
          };
          this.greatPeople.set(personId, person);
        }
      }
    }
  }

  private generateGreatPersonName(type: GreatPersonType): string {
    const names: Record<GreatPersonType, string[]> = {
      great_writer: ['Shakespeare', 'Homer', 'Tolstoy'],
      great_artist: ['Michelangelo', 'Da Vinci', 'Picasso'],
      great_musician: ['Mozart', 'Beethoven', 'Bach'],
      great_scientist: ['Einstein', 'Newton', 'Curie'],
      great_engineer: ['Tesla', 'Edison', 'Da Vinci'],
      great_merchant: ['Rossi', 'Medici', 'Soros'],
      great_general: ['Caesar', 'Napoleon', 'Hannibal'],
      great_admiral: ['Nelson', 'Zheng He', 'Drake'],
      great_prophet: ['Prophet 1', 'Prophet 2', 'Prophet 3'],
      great_diplomat: ['Diplomat 1', 'Diplomat 2', 'Diplomat 3'],
      naturalist: ['Darwin', 'John Muir', 'Rachel Carson'],
    };

    const typeNames = names[type] || ['Unknown'];
    return typeNames[Math.floor(Math.random() * typeNames.length)];
  }

  getAvailableGreatPeople(_playerId: number): GreatPerson[] {
    const available: GreatPerson[] = [];
    
    for (const [, person] of this.greatPeople) {
      if (person.earned && !person.claimed) {
        available.push(person);
      }
    }

    return available;
  }

  claimGreatPerson(personId: string): boolean {
    const person = this.greatPeople.get(personId);
    if (!person || !person.earned || person.claimed) return false;

    person.claimed = true;
    return true;
  }

  canEstablishNationalPark(playerId: number): boolean {
    const naturalist = this.getAvailableGreatPeople(playerId).find(p => p.type === 'naturalist');
    return !!naturalist;
  }

  establishNationalPark(
    playerId: number,
    name: string,
    tiles: Array<{ x: number; y: number }>,
    terrainType: string
  ): boolean {
    const parks = this.nationalParks.get(playerId) || [];
    
    const terrainTypes = new Set(parks.map(p => p.terrainType));
    if (terrainTypes.has(terrainType)) {
      return false;
    }

    const park: NationalPark = {
      id: `park-${Date.now()}`,
      name,
      tiles,
      terrainType,
    };

    parks.push(park);
    this.nationalParks.set(playerId, parks);

    return true;
  }

  getNationalParks(playerId: number): NationalPark[] {
    return this.nationalParks.get(playerId) || [];
  }

  getThemingBonus(works: GreatWork[]): number {
    if (works.length < 2) return 0;

    const themes = new Set(works.map(w => w.theme));
    if (themes.size === 1 && works.length >= 3) {
      return works.length * 2;
    }
    
    return 0;
  }

  canPlaceWorkInCity(_cityId: string, _work: GreatWork): boolean {
    return true;
  }

  getGreatPersonPoints(playerId: number, type: GreatPersonType): number {
    return this.personPoints.get(playerId)?.get(type) || 0;
  }

  calculateGreatPersonPointsPerTurn(player: Player): Map<GreatPersonType, number> {
    const points = new Map<GreatPersonType, number>();

    for (const city of player.cities) {
      const buildingCount = city.buildings.length;
      
      const typePoints: GreatPersonType[] = ['great_writer', 'great_artist', 'great_musician'];
      for (const type of typePoints) {
        const current = points.get(type) || 0;
        points.set(type, current + 1);
      }

      if (buildingCount >= 3) {
        const sciencePoints: GreatPersonType[] = ['great_scientist', 'great_engineer'];
        for (const type of sciencePoints) {
          const current = points.get(type) || 0;
          points.set(type, current + 1);
        }
      }
    }

    return points;
  }
}

export function createGreatWorksSystem(config: GreatWorksConfig): GreatWorksSystem {
  return new GreatWorksSystem(config);
}
