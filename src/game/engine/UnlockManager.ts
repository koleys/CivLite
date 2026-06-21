import type { Player, City } from '@/game/entities/types';

export interface UnlockEffects {
  unitTypes: string[];
  buildings: string[];
  improvements: string[];
  actions: string[];
}

export const UNIT_COSTS: Record<string, number> = {
  warrior: 30,
  scout: 20,
  settler: 80,
  archer: 40,
  swordsman: 60,
  horseman: 50,
  spearman: 35,
  catapult: 80,
  crossbowman: 70,
  pikeman: 55,
  charioteer: 60,
  musketman: 100,
  cavalry: 120,
  cannon: 130,
  cuirassier: 150,
  rifleman: 180,
  artillery: 220,
  infantry: 250,
  tank: 350,
  fighter: 300,
  bomber: 400,
  battleship: 500,
  submarine: 450,
  galleass: 120,
  frigate: 180,
  ship_of_the_line: 250,
  galley: 40,
  caravel: 80,
  caravelle: 120,
  trireme: 50,
  samurai: 150,
  jet_fighter: 500,
  great_general: 0,
  great_admiral: 0,
  nuclear_device: 0,
  missionary: 0,
  apostle: 0,
};

export const BUILDING_COSTS: Record<string, number> = {
  granary: 40,
  library: 50,
  monument: 30,
  shrine: 35,
  market: 60,
  temple: 80,
  university: 100,
  bank: 120,
  broadcast_center: 150,
  arena: 50,
  aqueduct: 80,
  sewer: 100,
  neighborhood: 120,
  workshop: 80,
  forge: 90,
  harbor: 100,
  stock_exchange: 200,
  factory: 180,
  research_lab: 220,
  aerodrome: 200,
  solar_plant: 250,
  nuclear_plant: 300,
  supercomputer: 400,
};

export const TECH_UNLOCK_EFFECTS: Record<string, UnlockEffects> = {
  mining: { unitTypes: [], buildings: [], improvements: ['mine'], actions: [] },
  bronze_working: { unitTypes: ['swordsman'], buildings: [], improvements: [], actions: [] },
  masonry: { unitTypes: [], buildings: [], improvements: ['quarry'], actions: [] },
  pottery: { unitTypes: [], buildings: ['granary'], improvements: ['farm'], actions: [] },
  writing: { unitTypes: [], buildings: ['library'], improvements: [], actions: [] },
  mathematics: { unitTypes: [], buildings: [], improvements: [], actions: [] },
  iron_working: { unitTypes: [], buildings: [], improvements: [], actions: [] },
  construction: { unitTypes: [], buildings: [], improvements: ['fort'], actions: [] },
  currency: { unitTypes: [], buildings: ['market'], improvements: [], actions: [] },
  philosophy: { unitTypes: [], buildings: ['shrine', 'temple'], improvements: [], actions: [] },
  horse_riding: { unitTypes: ['horseman', 'charioteer'], buildings: [], improvements: ['pasture'], actions: [] },
  archery: { unitTypes: ['archer', 'crossbowman'], buildings: [], improvements: [], actions: [] },
  sailing: { unitTypes: ['galley', 'trireme'], buildings: ['harbor'], improvements: ['fishing_boat'], actions: [] },
  calendar: { unitTypes: [], buildings: [], improvements: [], actions: [] },
  engineering: { unitTypes: [], buildings: [], improvements: ['road'], actions: [] },
  animal_husbandry: { unitTypes: [], buildings: [], improvements: ['pasture'], actions: [] },
  universities: { unitTypes: [], buildings: ['university'], improvements: [], actions: [] },
  refining: { unitTypes: [], buildings: [], improvements: [], actions: [] },
  paper: { unitTypes: [], buildings: [], improvements: [], actions: [] },
  printing: { unitTypes: [], buildings: [], improvements: [], actions: [] },
  optics: { unitTypes: [], buildings: [], improvements: [], actions: [] },
  compass: { unitTypes: [], buildings: [], improvements: [], actions: [] },
  cartography: { unitTypes: ['caravel', 'caravelle'], buildings: [], improvements: [], actions: [] },
  shipbuilding: { unitTypes: ['galleass'], buildings: [], improvements: [], actions: [] },
  astronomy: { unitTypes: [], buildings: [], improvements: [], actions: [] },
  navigation: { unitTypes: ['frigate', 'ship_of_the_line'], buildings: [], improvements: [], actions: [] },
  metallurgy: { unitTypes: ['cuirassier'], buildings: ['forge'], improvements: [], actions: [] },
  steel: { unitTypes: [], buildings: [], improvements: [], actions: [] },
  military_tactics: { unitTypes: ['pikeman'], buildings: [], improvements: [], actions: [] },
  education: { unitTypes: [], buildings: ['university', 'research_lab'], improvements: [], actions: [] },
  refrigeration: { unitTypes: [], buildings: [], improvements: [], actions: [] },
  banking: { unitTypes: [], buildings: ['bank'], improvements: [], actions: [] },
  steam_power: { unitTypes: [], buildings: ['factory'], improvements: [], actions: [] },
  radio: { unitTypes: [], buildings: ['stock_exchange', 'broadcast_center'], improvements: [], actions: [] },
  electricity: { unitTypes: [], buildings: [], improvements: [], actions: [] },
  computers: { unitTypes: [], buildings: ['supercomputer'], improvements: [], actions: [] },
  telephones: { unitTypes: [], buildings: [], improvements: [], actions: [] },
  plastics: { unitTypes: [], buildings: [], improvements: [], actions: [] },
  combustion: { unitTypes: ['tank', 'submarine'], buildings: [], improvements: [], actions: [] },
  flight: { unitTypes: ['fighter'], buildings: ['aerodrome'], improvements: [], actions: [] },
  advanced_flight: { unitTypes: ['bomber'], buildings: [], improvements: [], actions: [] },
  rocketry: { unitTypes: [], buildings: [], improvements: [], actions: [] },
  nuclear_fission: { unitTypes: ['nuclear_device'], buildings: ['nuclear_plant'], improvements: [], actions: [] },
  robotics: { unitTypes: [], buildings: [], improvements: [], actions: [] },
  satellites: { unitTypes: [], buildings: ['solar_plant'], improvements: [], actions: [] },
  laser: { unitTypes: [], buildings: [], improvements: [], actions: [] },
  advanced_computing: { unitTypes: ['jet_fighter'], buildings: [], improvements: [], actions: [] },
  fusion: { unitTypes: [], buildings: [], improvements: [], actions: [] },
};

export function getUnlocks(techId: string): UnlockEffects {
  return TECH_UNLOCK_EFFECTS[techId] ?? { unitTypes: [], buildings: [], improvements: [], actions: [] };
}

export function getAvailableProductionItems(
  player: Player,
  _city: City,
): Array<{ name: string; type: 'unit' | 'building'; cost: number }> {
  const items: Array<{ name: string; type: 'unit' | 'building'; cost: number }> = [];

  // Units: available if the player has the prerequisite tech
  for (const [unitType, cost] of Object.entries(UNIT_COSTS)) {
    if (cost === 0) continue; // Skip great persons etc.
    const techRequired = getTechForUnit(unitType);
    if (!techRequired || player.technologies.has(techRequired)) {
      items.push({ name: unitType, type: 'unit', cost });
    }
  }

  // Buildings: available if the player has the prerequisite tech
  for (const [building, cost] of Object.entries(BUILDING_COSTS)) {
    const techRequired = getTechForBuilding(building);
    if (!techRequired || player.technologies.has(techRequired)) {
      items.push({ name: building, type: 'building', cost });
    }
  }

  return items;
}

function getTechForUnit(unitType: string): string | null {
  for (const [techId, effects] of Object.entries(TECH_UNLOCK_EFFECTS)) {
    if (effects.unitTypes.includes(unitType)) return techId;
  }
  // Default: warrior and scout are available from the start
  if (unitType === 'warrior' || unitType === 'scout' || unitType === 'settler') return null;
  return null;
}

function getTechForBuilding(building: string): string | null {
  for (const [techId, effects] of Object.entries(TECH_UNLOCK_EFFECTS)) {
    if (effects.buildings.includes(building)) return techId;
  }
  // Monument is available from the start
  if (building === 'monument') return null;
  return null;
}
