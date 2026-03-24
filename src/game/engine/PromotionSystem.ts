import type { Unit, UnitType } from '@/game/entities/types';

export type PromotionType =
  | 'aggressor'
  | 'precise'
  | 'survivor'
  | 'mobile'
  | 'berserker'
  | 'bloodthirsty'
  | 'mortar'
  | 'shrapnel'
  | 'hardened'
  | 'resilient'
  | 'swallow'
  | 'swift'
  | 'warrior'
  | 'ranger'
  | 'charge'
  | 'medic'
  | 'embark'
  | 'amphibious';

export interface Promotion {
  id: PromotionType;
  name: string;
  description: string;
  effect: string;
  prerequisites: PromotionType[];
}

export const PROMOTIONS: Record<PromotionType, Promotion> = {
  aggressor: {
    id: 'aggressor',
    name: 'Aggressor',
    description: '+5 Combat Strength',
    effect: '+5 strength',
    prerequisites: [],
  },
  precise: {
    id: 'precise',
    name: 'Precise',
    description: '+1 Range',
    effect: '+1 range',
    prerequisites: [],
  },
  survivor: {
    id: 'survivor',
    name: 'Survivor',
    description: '+10 HP',
    effect: '+10 HP',
    prerequisites: [],
  },
  mobile: {
    id: 'mobile',
    name: 'Mobile',
    description: '+1 Movement',
    effect: '+1 movement',
    prerequisites: [],
  },
  berserker: {
    id: 'berserker',
    name: 'Berserker',
    description: '+10 Combat Strength vs damaged units',
    effect: '+10 vs damaged',
    prerequisites: ['aggressor'],
  },
  bloodthirsty: {
    id: 'bloodthirsty',
    name: 'Bloodthirsty',
    description: '+5 Combat Strength',
    effect: '+5 strength',
    prerequisites: ['aggressor'],
  },
  mortar: {
    id: 'mortar',
    name: 'Mortar',
    description: '+2 Range',
    effect: '+2 range',
    prerequisites: ['precise'],
  },
  shrapnel: {
    id: 'shrapnel',
    name: 'Shrapnel',
    description: '+25% Combat Strength vs siege units',
    effect: '+25% vs siege',
    prerequisites: ['precise'],
  },
  hardened: {
    id: 'hardened',
    name: 'Hardened',
    description: 'Terrain defense bonus doubled',
    effect: 'double terrain bonus',
    prerequisites: ['survivor'],
  },
  resilient: {
    id: 'resilient',
    name: 'Resilient',
    description: '+5 Healing',
    effect: '+5 heal',
    prerequisites: ['survivor'],
  },
  swallow: {
    id: 'swallow',
    name: 'Swallow',
    description: 'Ignore enemy Zone of Control',
    effect: 'ignore ZOC',
    prerequisites: ['mobile'],
  },
  swift: {
    id: 'swift',
    name: 'Swift',
    description: '+10% Flanking bonus',
    effect: '+10% flanking',
    prerequisites: ['mobile'],
  },
  warrior: {
    id: 'warrior',
    name: 'Warrior',
    description: '+5 Combat Strength vs Barbarians',
    effect: '+5 vs barbarians',
    prerequisites: [],
  },
  ranger: {
    id: 'ranger',
    name: 'Ranger',
    description: '+25% Combat Strength when attacking from hills or forest',
    effect: '+25% hills/forest',
    prerequisites: [],
  },
  charge: {
    id: 'charge',
    name: 'Charge',
    description: '+15% Combat Strength vs units below 50% HP',
    effect: '+15% vs damaged',
    prerequisites: [],
  },
  medic: {
    id: 'medic',
    name: 'Medic',
    description: '+10 Healing to adjacent units',
    effect: '+10 heal to allies',
    prerequisites: [],
  },
  embark: {
    id: 'embark',
    name: 'Embark',
    description: 'Can cross shallow water without combat penalty',
    effect: 'embark',
    prerequisites: [],
  },
  amphibious: {
    id: 'amphibious',
    name: 'Amphibious',
    description: 'Can attack from water to land, +10% on beaches',
    effect: 'amphibious',
    prerequisites: [],
  },
};

export const XP_THRESHOLDS = [10, 30, 60, 100, 150] as const;

export interface UnitPromotions {
  level: number;
  xp: number;
  promotions: PromotionType[];
}

const UNIT_PROMOTION_TREES: Record<string, PromotionType[][]> = {
  melee: [
    ['aggressor', 'survivor', 'mobile'],
    ['berserker', 'bloodthirsty', 'hardened', 'resilient', 'swallow', 'swift'],
    ['warrior', 'ranger', 'charge', 'medic'],
  ],
  ranged: [
    ['precise', 'survivor', 'mobile'],
    ['mortar', 'shrapnel', 'hardened', 'resilient', 'swallow', 'swift'],
    ['ranger', 'charge', 'medic'],
  ],
  siege: [
    ['precise', 'survivor', 'mobile'],
    ['mortar', 'shrapnel', 'hardened', 'resilient', 'swallow', 'swift'],
    ['charge', 'medic'],
  ],
  light_cavalry: [
    ['aggressor', 'mobile'],
    ['berserker', 'bloodthirsty', 'swallow', 'swift'],
    ['warrior', 'charge', 'medic', 'embark'],
  ],
  heavy_cavalry: [
    ['aggressor', 'mobile'],
    ['berserker', 'bloodthirsty', 'swallow', 'swift'],
    ['warrior', 'charge', 'medic', 'amphibious'],
  ],
  naval_melee: [
    ['aggressor', 'survivor', 'mobile'],
    ['berserker', 'bloodthirsty', 'hardened', 'resilient'],
    ['warrior', 'charge', 'medic', 'embark'],
  ],
  naval_ranged: [
    ['precise', 'survivor', 'mobile'],
    ['mortar', 'shrapnel', 'hardened', 'resilient'],
    ['ranger', 'charge', 'medic', 'embark'],
  ],
  air: [
    ['precise', 'aggressor', 'survivor'],
    ['mortar', 'shrapnel', 'berserker', 'bloodthirsty'],
    ['ranger', 'charge', 'medic'],
  ],
  support: [
    ['survivor', 'mobile'],
    ['hardened', 'resilient', 'swallow', 'swift'],
    ['medic', 'embark'],
  ],
};

export function getUnitClass(type: UnitType): string {
  const classMap: Record<string, string> = {
    warrior: 'melee',
    swordsman: 'melee',
    musketman: 'melee',
    samurai: 'melee',
    infantry: 'melee',
    tank: 'heavy_cavalry',
    modern_armor: 'heavy_cavalry',
    archer: 'ranged',
    crossbowman: 'ranged',
    catapult: 'siege',
    cannon: 'siege',
    artillery: 'siege',
    horseman: 'light_cavalry',
    charioteer: 'light_cavalry',
    cavalry: 'light_cavalry',
    cuirassier: 'heavy_cavalry',
    galley: 'naval_melee',
    caravel: 'naval_melee',
    caravelle: 'naval_melee',
    galleass: 'naval_ranged',
    ship_of_the_line: 'naval_ranged',
    fighter: 'air',
    bomber: 'air',
    jet_fighter: 'air',
    scout: 'support',
    settler: 'support',
    great_general: 'support',
    great_admiral: 'support',
  };

  return classMap[type] || 'melee';
}

export function getPromotionTree(unitClass: string): PromotionType[][] {
  return UNIT_PROMOTION_TREES[unitClass] || UNIT_PROMOTION_TREES.melee;
}

export function getAvailablePromotions(
  unitClass: string,
  currentPromotions: PromotionType[]
): PromotionType[] {
  const tree = getPromotionTree(unitClass);
  const available: PromotionType[] = [];

  for (let level = 0; level < tree.length; level++) {
    const levelPromotions = tree[level];
    
    const canUnlockLevel = currentPromotions.length >= level;
    
    if (!canUnlockLevel) break;

    for (const promo of levelPromotions) {
      if (currentPromotions.includes(promo)) continue;

      const promoData = PROMOTIONS[promo];
      const prerequisitesMet = promoData.prerequisites.every((prereq) =>
        currentPromotions.includes(prereq)
      );

      if (prerequisitesMet) {
        available.push(promo);
      }
    }
  }

  return available;
}

export function canPromote(unitClass: string, currentPromotions: PromotionType[], xp: number): boolean {
  const currentLevel = currentPromotions.length;
  
  if (currentLevel >= XP_THRESHOLDS.length) return false;

  const requiredXp = XP_THRESHOLDS[currentLevel];
  if (xp < requiredXp) return false;

  const available = getAvailablePromotions(unitClass, currentPromotions);
  return available.length > 0;
}

export function addXp(unit: Unit, xpGained: number): number {
  const promotionsData = getPromotionData(unit);
  promotionsData.xp += xpGained;

  let newLevel = 0;
  for (let i = XP_THRESHOLDS.length - 1; i >= 0; i--) {
    if (promotionsData.xp >= XP_THRESHOLDS[i]) {
      newLevel = i + 1;
      break;
    }
  }
  promotionsData.level = newLevel;

  return promotionsData.xp;
}

export function awardPromotion(unit: Unit, promotion: PromotionType): boolean {
  const unitClass = getUnitClass(unit.type);
  const promotionsData = getPromotionData(unit);
  
  const available = getAvailablePromotions(unitClass, promotionsData.promotions);
  if (!available.includes(promotion)) {
    return false;
  }

  const promoData = PROMOTIONS[promotion];
  if (!promoData) return false;

  promotionsData.promotions.push(promotion);

  applyPromotionEffect(unit, promotion);

  return true;
}

function applyPromotionEffect(unit: Unit, promotion: PromotionType): void {
  switch (promotion) {
    case 'aggressor':
    case 'bloodthirsty':
      unit.strengthBase += 5;
      unit.strength = unit.strengthBase;
      break;
    case 'mobile':
      unit.maxMovement += 1;
      unit.movement = unit.maxMovement;
      break;
    case 'survivor':
      unit.maxHealth += 10;
      unit.health += 10;
      break;
    case 'berserker':
    case 'ranger':
    case 'charge':
    case 'warrior':
      unit.strengthBase += 5;
      unit.strength = unit.strengthBase;
      break;
  }
}

export function getPromotionData(unit: Unit): UnitPromotions {
  const extendedUnit = unit as Unit & { promotions?: UnitPromotions };
  if (!extendedUnit.promotions) {
    extendedUnit.promotions = {
      level: 0,
      xp: 0,
      promotions: [],
    };
  }
  return extendedUnit.promotions;
}

export function calculatePromotionBonus(unit: Unit, bonusType: string): number {
  const promotionsData = getPromotionData(unit);
  let bonus = 0;

  for (const promo of promotionsData.promotions) {
    switch (promo) {
      case 'aggressor':
      case 'bloodthirsty':
        if (bonusType === 'strength') bonus += 5;
        break;
      case 'berserker':
        if (bonusType === 'vs_damaged') bonus += 10;
        break;
      case 'warrior':
        if (bonusType === 'vs_barbarian') bonus += 5;
        break;
      case 'ranger':
        if (bonusType === 'hills_forest') bonus += 25;
        break;
      case 'charge':
        if (bonusType === 'vs_damaged') bonus += 15;
        break;
      case 'swift':
        if (bonusType === 'flanking') bonus += 10;
        break;
      case 'mortar':
        if (bonusType === 'range') bonus += 2;
        break;
      case 'precise':
        if (bonusType === 'range') bonus += 1;
        break;
    }
  }

  return bonus;
}

export function getCombatStrengthWithPromotions(unit: Unit): number {
  const promotionsData = getPromotionData(unit);
  let strength = unit.strengthBase;

  const unitClass = getUnitClass(unit.type);
  void unitClass;

  for (const promo of promotionsData.promotions) {
    switch (promo) {
      case 'aggressor':
      case 'bloodthirsty':
      case 'berserker':
      case 'warrior':
      case 'ranger':
      case 'charge':
        strength += 5;
        break;
    }
  }

  return strength;
}
