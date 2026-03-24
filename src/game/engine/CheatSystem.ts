export interface CheatConfig {
  enabled: boolean;
  production: number;
  gold: number;
  science: number;
  culture: number;
  faith: number;
  food: number;
  movement: number;
  combat: number;
  build: number;
}

export const DEFAULT_CHEAT_CONFIG: CheatConfig = {
  enabled: false,
  production: 1,
  gold: 1,
  science: 1,
  culture: 1,
  faith: 1,
  food: 1,
  movement: 1,
  combat: 1,
  build: 1,
};

export const CHEAT_SLIDER_LIMITS = {
  production: { min: 1, max: 100, default: 1 },
  gold: { min: 1, max: 100, default: 1 },
  science: { min: 1, max: 100, default: 1 },
  culture: { min: 1, max: 100, default: 1 },
  faith: { min: 1, max: 100, default: 1 },
  food: { min: 1, max: 100, default: 1 },
  movement: { min: 1, max: 10, default: 1 },
  combat: { min: 1, max: 10, default: 1 },
  build: { min: 1, max: 100, default: 1 },
};

export class CheatSystem {
  private config: CheatConfig;

  constructor(config: Partial<CheatConfig> = {}) {
    this.config = { ...DEFAULT_CHEAT_CONFIG, ...config };
  }

  isEnabled(): boolean {
    return this.config.enabled;
  }

  enable(): void {
    this.config.enabled = true;
  }

  disable(): void {
    this.config.enabled = false;
  }

  toggle(): void {
    this.config.enabled = !this.config.enabled;
  }

  setMultiplier(type: keyof Omit<CheatConfig, 'enabled'>, value: number): void {
    const limits = CHEAT_SLIDER_LIMITS[type];
    if (limits) {
      this.config[type] = Math.max(limits.min, Math.min(limits.max, value));
    }
  }

  getMultiplier(type: keyof Omit<CheatConfig, 'enabled'>): number {
    return this.config[type] || 1;
  }

  getConfig(): CheatConfig {
    return { ...this.config };
  }

  applyProductionMultiplier(base: number): number {
    if (!this.config.enabled) return base;
    return Math.floor(base * this.config.production);
  }

  applyGoldMultiplier(base: number): number {
    if (!this.config.enabled) return base;
    return Math.floor(base * this.config.gold);
  }

  applyScienceMultiplier(base: number): number {
    if (!this.config.enabled) return base;
    return Math.floor(base * this.config.science);
  }

  applyCultureMultiplier(base: number): number {
    if (!this.config.enabled) return base;
    return Math.floor(base * this.config.culture);
  }

  applyFaithMultiplier(base: number): number {
    if (!this.config.enabled) return base;
    return Math.floor(base * this.config.faith);
  }

  applyFoodMultiplier(base: number): number {
    if (!this.config.enabled) return base;
    return Math.floor(base * this.config.food);
  }

  applyMovementMultiplier(base: number): number {
    if (!this.config.enabled) return base;
    return Math.floor(base * this.config.movement);
  }

  applyCombatMultiplier(base: number): number {
    if (!this.config.enabled) return base;
    return Math.floor(base * this.config.combat);
  }

  applyBuildMultiplier(base: number): number {
    if (!this.config.enabled) return base;
    return Math.floor(base / this.config.build);
  }

  applyAllMultipliers(yields: {
    production?: number;
    gold?: number;
    science?: number;
    culture?: number;
    faith?: number;
    food?: number;
  }): {
    production: number;
    gold: number;
    science: number;
    culture: number;
    faith: number;
    food: number;
  } {
    return {
      production: this.applyProductionMultiplier(yields.production || 0),
      gold: this.applyGoldMultiplier(yields.gold || 0),
      science: this.applyScienceMultiplier(yields.science || 0),
      culture: this.applyCultureMultiplier(yields.culture || 0),
      faith: this.applyFaithMultiplier(yields.faith || 0),
      food: this.applyFoodMultiplier(yields.food || 0),
    };
  }

  reset(): void {
    this.config = { ...DEFAULT_CHEAT_CONFIG };
  }

  loadFromStorage(): void {
    try {
      const saved = localStorage.getItem('civlite_cheat_config');
      if (saved) {
        const parsed = JSON.parse(saved);
        this.config = { ...DEFAULT_CHEAT_CONFIG, ...parsed };
      }
    } catch {
      this.reset();
    }
  }

  saveToStorage(): void {
    try {
      localStorage.setItem('civlite_cheat_config', JSON.stringify(this.config));
    } catch {
      console.error('Failed to save cheat config');
    }
  }
}

export function createCheatSystem(config?: Partial<CheatConfig>): CheatSystem {
  return new CheatSystem(config);
}
