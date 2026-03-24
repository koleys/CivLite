import type { Player, City, MapData, GameAge } from '@/game/entities/types';

export interface TradeRoute {
  id: string;
  originCityId: string;
  destinationCityId: string;
  ownerId: number;
  destinationPlayerId: number;
  routeType: 'domestic' | 'international' | 'colonial';
  yields: TradeYields;
  distance: number;
  active: boolean;
}

export interface TradeYields {
  gold: number;
  production: number;
  science: number;
  culture: number;
  faith: number;
}

export interface TradeConfig {
  map: MapData;
  age: GameAge;
}

export class TradeSystem {
  private player: Player;
  private config: TradeConfig;
  private tradeRoutes: TradeRoute[] = [];
  private internationalRoutesCompleted: number = 0;

  constructor(player: Player, config: TradeConfig) {
    this.player = player;
    this.config = config;
  }

  getTradeRoutes(): TradeRoute[] {
    return [...this.tradeRoutes];
  }

  getActiveRoutes(): TradeRoute[] {
    return this.tradeRoutes.filter((r) => r.active);
  }

  getRouteCapacity(): number {
    const baseCapacity = 2;
    const populationBonus = Math.floor(this.player.cities.reduce((sum, c) => sum + c.population, 0) / 50);
    return baseCapacity + populationBonus;
  }

  canEstablishRoute(originCityId: string, destinationCityId: string): boolean {
    if (this.getActiveRoutes().length >= this.getRouteCapacity()) {
      return false;
    }

    const originCity = this.player.cities.find((c) => c.id === originCityId);
    if (!originCity) return false;

    const destinationPlayerId = this.findPlayerByCity(destinationCityId);
    if (destinationPlayerId === undefined) return false;

    const distance = this.calculateDistance(originCity, destinationCityId);
    if (distance < 3) return false;

    return true;
  }

  establishTradeRoute(originCityId: string, destinationCityId: string): TradeRoute | null {
    if (!this.canEstablishRoute(originCityId, destinationCityId)) {
      return null;
    }

    const originCity = this.player.cities.find((c) => c.id === originCityId);
    if (!originCity) return null;

    const destinationPlayerId = this.findPlayerByCity(destinationCityId);
    if (destinationPlayerId === undefined) return null;

    const distance = this.calculateDistance(originCity, destinationCityId);
    const routeType = this.determineRouteType(originCity, destinationCityId, destinationPlayerId);
    const yields = this.calculateYields(originCityId, destinationCityId, distance, routeType);

    const route: TradeRoute = {
      id: `route-${Date.now()}`,
      originCityId,
      destinationCityId,
      ownerId: this.player.id,
      destinationPlayerId,
      routeType,
      yields,
      distance,
      active: true,
    };

    this.tradeRoutes.push(route);

    if (routeType === 'international' && distance >= 10) {
      this.internationalRoutesCompleted++;
    }

    return route;
  }

  private findPlayerByCity(cityId: string): number | undefined {
    for (const route of this.tradeRoutes) {
      if (route.destinationCityId === cityId) {
        return route.destinationPlayerId;
      }
    }
    return this.player.id;
  }

  private determineRouteType(
    originCity: City,
    destinationCityId: string,
    destinationPlayerId: number
  ): 'domestic' | 'international' | 'colonial' {
    if (destinationPlayerId !== this.player.id) {
      return 'international';
    }

    const destCity = this.player.cities.find((c) => c.id === destinationCityId);
    if (!destCity) return 'domestic';

    const originContinent = this.getContinent(originCity.x, originCity.y);
    const destContinent = this.getContinent(destCity.x, destCity.y);

    if (originContinent !== destContinent) {
      return 'colonial';
    }

    return 'domestic';
  }

  private getContinent(x: number, y: number): string {
    return `continent-${Math.floor(x / 20)}-${Math.floor(y / 20)}`;
  }

  private calculateDistance(originCity: City, destinationCityId: string): number {
    const destCity = this.player.cities.find((c) => c.id === destinationCityId);
    if (!destCity) return 0;

    const dx = Math.abs(originCity.x - destCity.x);
    const dy = Math.abs(originCity.y - destCity.y);

    return Math.floor(Math.sqrt(dx * dx + dy * dy));
  }

  private calculateYields(
    _originCityId: string,
    _destinationCityId: string,
    distance: number,
    routeType: 'domestic' | 'international' | 'colonial'
  ): TradeYields {
    const baseGold = Math.max(1, Math.floor(distance / 3));
    const yields: TradeYields = {
      gold: baseGold,
      production: 0,
      science: 0,
      culture: 0,
      faith: 0,
    };

    if (routeType === 'colonial') {
      yields.production = 2;
    }

    if (this.config.age === 'exploration' || this.config.age === 'modern') {
      if (routeType === 'colonial') {
        yields.gold += 3;
      }
    }

    return yields;
  }

  processTurn(): TradeYields {
    const totalYields: TradeYields = {
      gold: 0,
      production: 0,
      science: 0,
      culture: 0,
      faith: 0,
    };

    for (const route of this.tradeRoutes) {
      if (!route.active) continue;

      totalYields.gold += route.yields.gold;
      totalYields.production += route.yields.production;
      totalYields.science += route.yields.science;
      totalYields.culture += route.yields.culture;
      totalYields.faith += route.yields.faith;
    }

    return totalYields;
  }

  cancelRoute(routeId: string): boolean {
    const index = this.tradeRoutes.findIndex((r) => r.id === routeId);
    if (index === -1) return false;

    this.tradeRoutes.splice(index, 1);
    return true;
  }

  getRouteCount(): number {
    return this.tradeRoutes.filter((r) => r.active).length;
  }

  getInternationalRouteCount(): number {
    return this.internationalRoutesCompleted;
  }

  getEraScoreFromRoutes(): number {
    let eraScore = 0;

    for (const route of this.tradeRoutes) {
      if (route.active && route.routeType === 'international' && route.distance >= 10) {
        eraScore += 2;
      }
    }

    return eraScore;
  }

  processCityCapture(capturedCityId: string): void {
    this.tradeRoutes = this.tradeRoutes.filter(
      (r) => r.originCityId !== capturedCityId && r.destinationCityId !== capturedCityId
    );
  }

  processCityDestruction(destroyedCityId: string): void {
    this.tradeRoutes = this.tradeRoutes.filter(
      (r) => r.originCityId !== destroyedCityId && r.destinationCityId !== destroyedCityId
    );
  }

  setRoutes(routes: TradeRoute[]): void {
    this.tradeRoutes = routes;
  }
}

export function createTradeSystem(player: Player, config: TradeConfig): TradeSystem {
  return new TradeSystem(player, config);
}
