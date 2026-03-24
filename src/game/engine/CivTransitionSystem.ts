import type { GameAge } from '@/game/entities/types';

export type Civilization = 
  | 'egypt' | 'greece' | 'rome' | 'persia' | 'china' | 'india' | 'babylon' | 'carthage' | 'celts' | 'harappa'
  | 'byzantium' | 'japan' | 'mongolia' | 'mali' | 'songhai' | 'ottoman' | 'spain' | 'france' | 'england' | 'aztecs' | 'inca' | 'venice'
  | 'america' | 'germany' | 'russia' | 'brazil' | 'australia' | 'canada' | 'netherlands' | 'sweden';

export interface CivilizationInfo {
  id: Civilization;
  name: string;
  era: GameAge;
  themes: string[];
  bonus: string;
  uniqueUnit?: string;
  uniqueBuilding?: string;
}

export interface CrossEraSynergy {
  tier: 1 | 2 | 3;
  eraScore: number;
  uniqueBuilding?: string;
  uniqueUnit?: string;
}

export const CIVILIZATIONS: Record<Civilization, CivilizationInfo> = {
  egypt: { id: 'egypt', name: 'Egypt', era: 'antiquity', themes: ['desert', 'river'], bonus: 'Nile bonus, Pyramid unique' },
  greece: { id: 'greece', name: 'Greece', era: 'antiquity', themes: ['mediterranean', 'war'], bonus: 'Culture bonus, Hoplite unique' },
  rome: { id: 'rome', name: 'Rome', era: 'antiquity', themes: ['mediterranean', 'war'], bonus: 'Production bonus, Legion unique' },
  persia: { id: 'persia', name: 'Persia', era: 'antiquity', themes: ['desert', 'trade'], bonus: 'Gold bonus, Immortal unique' },
  china: { id: 'china', name: 'China', era: 'antiquity', themes: ['river', 'culture'], bonus: 'Science bonus, Crossbowman unique' },
  india: { id: 'india', name: 'India', era: 'antiquity', themes: ['river', 'faith'], bonus: 'Faith bonus, Varu unique' },
  babylon: { id: 'babylon', name: 'Babylon', era: 'antiquity', themes: ['river', 'science'], bonus: 'Science bonus, Bowman unique' },
  carthage: { id: 'carthage', name: 'Carthage', era: 'antiquity', themes: ['mediterranean', 'trade'], bonus: 'Trade bonus, Quadrireme unique' },
  celts: { id: 'celts', name: 'Celts', era: 'antiquity', themes: ['faith', 'war'], bonus: 'Faith/Production bonus, Picts unique' },
  harappa: { id: 'harappa', name: 'Harappa', era: 'antiquity', themes: ['river', 'production'], bonus: 'Food/Production bonus, River bonus' },
  byzantium: { id: 'byzantium', name: 'Byzantium', era: 'exploration', themes: ['faith', 'military'], bonus: 'Faith/Military bonus' },
  japan: { id: 'japan', name: 'Japan', era: 'exploration', themes: ['coastal', 'war'], bonus: 'Production bonus, coastal/naval warfare' },
  mongolia: { id: 'mongolia', name: 'Mongolia', era: 'exploration', themes: ['war', 'horse'], bonus: 'Movement/Combat bonus' },
  mali: { id: 'mali', name: 'Mali', era: 'exploration', themes: ['desert', 'trade'], bonus: 'Gold/Faith bonus' },
  songhai: { id: 'songhai', name: 'Songhai', era: 'exploration', themes: ['desert', 'war'], bonus: 'Gold/Conquest bonus' },
  ottoman: { id: 'ottoman', name: 'Ottoman', era: 'exploration', themes: ['desert', 'war'], bonus: 'Production/Gunpowder bonus' },
  spain: { id: 'spain', name: 'Spain', era: 'exploration', themes: ['exploration', 'faith'], bonus: 'Exploration bonus' },
  france: { id: 'france', name: 'France', era: 'exploration', themes: ['culture', 'diplomacy'], bonus: 'Culture/Diplomacy bonus' },
  england: { id: 'england', name: 'England', era: 'exploration', themes: ['coastal', 'naval'], bonus: 'Naval bonus' },
  aztecs: { id: 'aztecs', name: 'Aztecs', era: 'exploration', themes: ['production', 'faith'], bonus: 'Production/Faith bonus' },
  inca: { id: 'inca', name: 'Inca', era: 'exploration', themes: ['mountain', 'food'], bonus: 'Mountain/Food bonus' },
  venice: { id: 'venice', name: 'Venice', era: 'exploration', themes: ['trade', 'diplomacy'], bonus: 'Trade/Diplomacy bonus' },
  america: { id: 'america', name: 'America', era: 'modern', themes: ['diplomacy', 'military'], bonus: 'All-round bonus' },
  germany: { id: 'germany', name: 'Germany', era: 'modern', themes: ['production', 'military'], bonus: 'Production/Military bonus' },
  russia: { id: 'russia', name: 'Russia', era: 'modern', themes: ['production', 'size'], bonus: 'Production/Size bonus' },
  brazil: { id: 'brazil', name: 'Brazil', era: 'modern', themes: ['culture', 'nature'], bonus: 'Culture/Nature bonus' },
  australia: { id: 'australia', name: 'Australia', era: 'modern', themes: ['production', 'culture'], bonus: 'Production/Culture bonus' },
  canada: { id: 'canada', name: 'Canada', era: 'modern', themes: ['culture', 'diplomacy'], bonus: 'Culture/Diplomacy bonus' },
  netherlands: { id: 'netherlands', name: 'Netherlands', era: 'modern', themes: ['trade', 'banking'], bonus: 'Trade/Banking bonus' },
  sweden: { id: 'sweden', name: 'Sweden', era: 'modern', themes: ['culture', 'diplomacy'], bonus: 'Culture/Diplomacy bonus' },
};

export const CIVILIZATION_TRANSITIONS: Record<string, Civilization[]> = {
  egypt: ['ottoman', 'persia'],
  greece: ['rome', 'byzantium'],
  rome: ['france', 'byzantium'],
  persia: ['ottoman', 'mongolia'],
  india: ['mali', 'ottoman'],
  china: ['japan', 'mongolia'],
};

export class CivTransitionSystem {
  private currentAge: GameAge;
  private previousCiv: Civilization | null;
  private availableCivilizations: Map<GameAge, Civilization[]>;

  constructor() {
    this.currentAge = 'antiquity';
    this.previousCiv = null;
    this.availableCivilizations = new Map();
    this.initializeAvailableCivilizations();
  }

  private initializeAvailableCivilizations(): void {
    const antiquityCivs = Object.keys(CIVILIZATIONS).filter(
      (id) => CIVILIZATIONS[id as Civilization].era === 'antiquity'
    ) as Civilization[];
    
    const explorationCivs = Object.keys(CIVILIZATIONS).filter(
      (id) => CIVILIZATIONS[id as Civilization].era === 'exploration'
    ) as Civilization[];
    
    const modernCivs = Object.keys(CIVILIZATIONS).filter(
      (id) => CIVILIZATIONS[id as Civilization].era === 'modern'
    ) as Civilization[];

    this.availableCivilizations.set('antiquity', antiquityCivs);
    this.availableCivilizations.set('exploration', explorationCivs);
    this.availableCivilizations.set('modern', modernCivs);
  }

  getAvailableCivilizations(age: GameAge, previousCiv?: Civilization): Civilization[] {
    const allCivs = this.availableCivilizations.get(age) || [];
    
    if (!previousCiv) {
      return allCivs;
    }

    const locked: Civilization[] = [];
    const newOptions: Civilization[] = [];

    for (const civ of allCivs) {
      if (CIVILIZATION_TRANSITIONS[previousCiv]?.includes(civ)) {
        locked.push(civ);
      } else {
        newOptions.push(civ);
      }
    }

    return [...locked, ...newOptions];
  }

  getLockedCivilizations(_age: GameAge, previousCiv: Civilization): Civilization[] {
    return CIVILIZATION_TRANSITIONS[previousCiv] || [];
  }

  calculateSynergy(previousCiv: Civilization, newCiv: Civilization): CrossEraSynergy | null {
    const prev = CIVILIZATIONS[previousCiv];
    const next = CIVILIZATIONS[newCiv];

    if (!prev || !next) return null;

    const sharedThemes = prev.themes.filter((theme) => next.themes.includes(theme));

    if (sharedThemes.length === 0) return null;

    if (sharedThemes.length === 1) {
      return { tier: 1, eraScore: 1 };
    }

    if (sharedThemes.length === 2) {
      return { tier: 2, eraScore: 2, uniqueBuilding: `Forum` };
    }

    return { tier: 3, eraScore: 3, uniqueUnit: `Elite Unit` };
  }

  getEraScoreFromSynergy(synergy: CrossEraSynergy): number {
    return synergy.eraScore;
  }

  transitionToAge(newAge: GameAge, previousCiv?: Civilization): void {
    this.previousCiv = previousCiv || null;
    this.currentAge = newAge;
  }

  getCurrentAge(): GameAge {
    return this.currentAge;
  }

  getPreviousCivilization(): Civilization | null {
    return this.previousCiv;
  }

  selectCivilization(civ: Civilization): CivilizationInfo | null {
    return CIVILIZATIONS[civ] || null;
  }
}

export function createCivTransitionSystem(): CivTransitionSystem {
  return new CivTransitionSystem();
}
