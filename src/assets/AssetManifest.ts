export const ASSET_PATHS = {
  terrain: {
    ocean: '/images/terrain/ocean.svg',
    coast: '/images/terrain/coast.svg',
    grassland: '/images/terrain/grassland.svg',
    plains: '/images/terrain/plains.svg',
    desert: '/images/terrain/desert.svg',
    tundra: '/images/terrain/tundra.svg',
    snow: '/images/terrain/snow.svg',
    mountain: '/images/terrain/mountain.svg',
    hills: '/images/terrain/hills.svg',
    forest: '/images/terrain/forest.svg',
  },
  units: {
    warrior: '/images/units/warrior.svg',
    archer: '/images/units/archer.svg',
    settler: '/images/units/settler.svg',
    scout: '/images/units/scout.svg',
    swordsman: '/images/units/swordsman.svg',
    horseman: '/images/units/horseman.svg',
    catapult: '/images/units/catapult.svg',
    galley: '/images/units/galley.svg',
    city: '/images/units/city.svg',
  },
  icons: {
    food: '/images/icons/food.svg',
    production: '/images/icons/production.svg',
    gold: '/images/icons/gold.svg',
    science: '/images/icons/science.svg',
    culture: '/images/icons/culture.svg',
    faith: '/images/icons/faith.svg',
    combat: '/images/icons/combat.svg',
    movement: '/images/icons/movement.svg',
  },
  audio: {
    music: {
      mainTheme: '/audio/music/main_theme.mp3',
      combat: '/audio/music/combat.mp3',
      peace: '/audio/music/peace.mp3',
    },
    sfx: {
      buttonClick: '/audio/sfx/click.mp3',
      cityFounded: '/audio/sfx/city_found.mp3',
      unitBuilt: '/audio/sfx/unit_built.mp3',
      combatAttack: '/audio/sfx/attack.mp3',
      techDiscovered: '/audio/sfx/tech.mp3',
      turnWarning: '/audio/sfx/warning.mp3',
      victory: '/audio/sfx/victory.mp3',
      defeat: '/audio/sfx/defeat.mp3',
    },
  },
} as const;

export type TerrainAsset = keyof typeof ASSET_PATHS.terrain;
export type UnitAsset = keyof typeof ASSET_PATHS.units;
export type IconAsset = keyof typeof ASSET_PATHS.icons;

export function getTerrainAsset(type: TerrainAsset): string {
  return ASSET_PATHS.terrain[type] || ASSET_PATHS.terrain.grassland;
}

export function getUnitAsset(type: UnitAsset): string {
  return ASSET_PATHS.units[type] || ASSET_PATHS.units.warrior;
}

export function getIconAsset(type: IconAsset): string {
  return ASSET_PATHS.icons[type] || ASSET_PATHS.icons.production;
}
