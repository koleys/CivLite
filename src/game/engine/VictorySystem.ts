import type { Player, GameAge } from '@/game/entities/types';

export type VictoryType = 'domination' | 'science' | 'cultural' | 'religious' | 'diplomatic' | 'age';

export interface VictoryCondition {
  type: VictoryType;
  name: string;
  description: string;
  check: (player: Player, context: VictoryContext) => boolean;
}

export interface VictoryContext {
  players: Player[];
  age: GameAge;
  turn: number;
  spaceRaceProgress?: SpaceRaceProgress;
  worldCongress?: WorldCongressState;
  /** Maps player ID → fraction of foreign city population following that player's religion (0–1). */
  playerReligionStats?: Record<number, { foreignFollowerRatio: number }>;
}

export interface SpaceRaceProgress {
  launchPadBuilt: boolean;
  rocketParts: number;
  exoplanetLaunched: boolean;
}

export interface WorldCongressState {
  sessionNumber: number;
  votesWon: number;
  totalSessions: number;
  crisisResolved: number;
}

export interface DominationVictoryContext {
  players: Player[];
  originalCapitals: Map<number, { x: number; y: number }>;
  vassals: Set<number>;
}

export interface CulturalVictoryContext {
  players: Player[];
  greatWorks: Map<number, GreatWorksCount>;
  tourism: Map<number, number>;
  openBorders: Set<string>;
}

export interface GreatWorksCount {
  art: number;
  writing: number;
  music: number;
  artifact: number;
}

export class VictorySystem {
  private enabledVictories: Set<VictoryType>;
  private completedVictories: Map<number, VictoryType>;
  private spaceRace: Map<number, SpaceRaceProgress>;
  private culturalProgress: Map<number, number>;
  private diplomaticFavor: Map<number, number>;

  constructor(enabledVictories: VictoryType[] = ['domination', 'science', 'cultural', 'religious', 'diplomatic', 'age']) {
    this.enabledVictories = new Set(enabledVictories);
    this.completedVictories = new Map();
    this.spaceRace = new Map();
    this.culturalProgress = new Map();
    this.diplomaticFavor = new Map();
  }

  checkAllVictories(player: Player, context: VictoryContext): VictoryType | null {
    for (const victoryType of this.enabledVictories) {
      if (this.checkVictory(player, victoryType, context)) {
        this.completedVictories.set(player.id, victoryType);
        return victoryType;
      }
    }
    return null;
  }

  checkVictory(player: Player, type: VictoryType, context: VictoryContext): boolean {
    switch (type) {
      case 'domination':
        return this.checkDominationVictory(player, context);
      case 'science':
        return this.checkScienceVictory(player, context);
      case 'cultural':
        return this.checkCulturalVictory(player, context);
      case 'religious':
        return this.checkReligiousVictory(player, context);
      case 'diplomatic':
        return this.checkDiplomaticVictory(player, context);
      case 'age':
        return this.checkAgeVictory(player, context);
      default:
        return false;
    }
  }

  private checkDominationVictory(player: Player, context: VictoryContext): boolean {
    const otherPlayers = context.players.filter(p => p.id !== player.id && p.id !== -1);

    if (otherPlayers.length === 0) return false;

    for (const otherPlayer of otherPlayers) {
      const originalCapital = otherPlayer.cities.find(c => c.isOriginalCapital);
      if (!originalCapital) continue;

      const playerControlsCapital = player.cities.some(
        c => c.x === originalCapital.x && c.y === originalCapital.y
      );

      if (!playerControlsCapital) {
        return false;
      }
    }

    const playerCapital = player.cities.find(c => c.isOriginalCapital);
    return playerCapital !== undefined;
  }

  private checkScienceVictory(player: Player, context: VictoryContext): boolean {
    if (context.age !== 'modern') return false;

    const progress = this.spaceRace.get(player.id);
    if (!progress || !progress.launchPadBuilt || progress.rocketParts < 3) {
      return false;
    }

    return progress.exoplanetLaunched;
  }

  private checkCulturalVictory(player: Player, context: VictoryContext): boolean {
    const otherPlayers = context.players.filter(p => p.id !== player.id && p.cities.length > 0);
    
    for (const otherPlayer of otherPlayers) {
      const playerTourism = this.culturalProgress.get(player.id) || 0;
      const otherCulture = otherPlayer.cities.reduce((sum, c) => sum + c.population * 2, 0);
      const threshold = 10 + Math.floor(otherCulture / 20);

      if (playerTourism < threshold) {
        return false;
      }
    }

    return true;
  }

  private checkReligiousVictory(player: Player, context: VictoryContext): boolean {
    if (context.age === 'modern') return false;

    const otherPlayers = context.players.filter(p => p.id !== player.id && p.cities.length > 0);
    if (otherPlayers.length === 0) return false;

    // If no religion stats are provided, religious victory is not yet achievable
    if (!context.playerReligionStats) return false;

    const stats = context.playerReligionStats[player.id];
    if (!stats) return false;

    // Player's religion must cover >50% of ALL foreign city population
    return stats.foreignFollowerRatio > 0.5;
  }

  private checkDiplomaticVictory(_player: Player, context: VictoryContext): boolean {
    if (context.age !== 'exploration' && context.age !== 'modern') return false;
    if (!context.worldCongress) return false;

    const { votesWon, totalSessions } = context.worldCongress;
    return votesWon >= 4 && totalSessions >= 6;
  }

  private checkAgeVictory(_player: Player, _context: VictoryContext): boolean {
    return false;
  }

  setSpaceRaceProgress(playerId: number, progress: Partial<SpaceRaceProgress>): void {
    const current = this.spaceRace.get(playerId) || {
      launchPadBuilt: false,
      rocketParts: 0,
      exoplanetLaunched: false,
    };
    this.spaceRace.set(playerId, { ...current, ...progress });
  }

  getSpaceRaceProgress(playerId: number): SpaceRaceProgress | undefined {
    return this.spaceRace.get(playerId);
  }

  setCulturalProgress(playerId: number, tourism: number): void {
    this.culturalProgress.set(playerId, tourism);
  }

  getCulturalProgress(playerId: number): number {
    return this.culturalProgress.get(playerId) || 0;
  }

  setDiplomaticFavor(playerId: number, favor: number): void {
    this.diplomaticFavor.set(playerId, favor);
  }

  getDiplomaticFavor(playerId: number): number {
    return this.diplomaticFavor.get(playerId) || 0;
  }

  hasWon(playerId: number): boolean {
    return this.completedVictories.has(playerId);
  }

  getWinner(): { playerId: number; type: VictoryType } | null {
    for (const [playerId, type] of this.completedVictories) {
      return { playerId, type };
    }
    return null;
  }

  getVictoryProgress(player: Player, type: VictoryType): number {
    switch (type) {
      case 'domination': {
        const remainingCapitals = player.cities.filter(c => c.isOriginalCapital).length;
        return Math.max(0, 100 - remainingCapitals * 20);
      }
      case 'science': {
        const progress = this.spaceRace.get(player.id);
        if (!progress) return 0;
        let score = 0;
        if (progress.launchPadBuilt) score += 33;
        score += Math.min(33, progress.rocketParts * 11);
        if (progress.exoplanetLaunched) score += 34;
        return score;
      }
      case 'cultural':
        return this.culturalProgress.get(player.id) || 0;
      case 'diplomatic': {
        const favor = this.diplomaticFavor.get(player.id) || 0;
        return Math.min(100, favor);
      }
      default:
        return 0;
    }
  }

  isVictoryEnabled(type: VictoryType): boolean {
    return this.enabledVictories.has(type);
  }

  enableVictory(type: VictoryType): void {
    this.enabledVictories.add(type);
  }

  disableVictory(type: VictoryType): void {
    this.enabledVictories.delete(type);
  }

  getTieBreakerScore(player: Player): number {
    const cities = player.cities.length;
    const units = player.units.length;
    const techs = player.technologies.size;
    const gold = player.gold;
    const eraScore = player.eraScore;

    return cities * 10 + units * 5 + techs * 3 + Math.floor(gold / 10) + eraScore;
  }
}

export function createVictorySystem(enabledVictories?: VictoryType[]): VictorySystem {
  return new VictorySystem(enabledVictories);
}
