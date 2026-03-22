import { useGameStore } from '@/store/gameStore';
import { Button, Tabs, ProgressBar } from '@/components/ui';
import type { City } from '@/game/entities/types';

interface CityPanelProps {
  cityId: string;
  onClose: () => void;
}

export function CityPanel({ cityId, onClose }: CityPanelProps) {
  const currentPlayer = useGameStore((s) => s.players.find(p => p.id === s.currentPlayer));
  const city = currentPlayer?.cities.find(c => c.id === cityId);

  if (!city) {
    return null;
  }

  return (
    <div className="fixed inset-y-0 right-0 w-96 bg-white dark:bg-gray-800 shadow-xl z-40 flex flex-col">
      <div className="p-4 border-b border-gray-200 dark:border-gray-700">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100">{city.name}</h2>
          <Button variant="ghost" size="sm" onClick={onClose}>✕</Button>
        </div>
        <div className="mt-2 flex gap-4 text-sm text-gray-600 dark:text-gray-400">
          <span>Population: {city.population}</span>
          <span className={city.amenities >= city.amenitiesRequired ? 'text-green-600' : 'text-red-600'}>
            Amenities: {city.amenities}/{city.amenitiesRequired}
          </span>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto">
        <Tabs
          tabs={[
            {
              id: 'citizens',
              label: 'Citizens',
              content: <CitizensTab city={city} />,
            },
            {
              id: 'build',
              label: 'Build',
              content: <BuildTab city={city} />,
            },
            {
              id: 'stats',
              label: 'Stats',
              content: <StatsTab city={city} />,
            },
            {
              id: 'defense',
              label: 'Defense',
              content: <DefenseTab city={city} />,
            },
          ]}
        />
      </div>
    </div>
  );
}

function CitizensTab({ city }: { city: City }) {
  const growthProgress = city.foodForGrowth > 0 ? (city.foodStockpile / city.foodForGrowth) * 100 : 0;
  
  return (
    <div className="p-4 space-y-4">
      <div>
        <h3 className="font-semibold mb-2 text-gray-900 dark:text-gray-100">Growth</h3>
        <ProgressBar
          value={city.foodStockpile}
          max={city.foodForGrowth}
          label="Food"
          showValue
          variant={growthProgress > 80 ? 'success' : 'default'}
        />
        <p className="text-xs text-gray-500 mt-1">
          {city.foodForGrowth - city.foodStockpile} food until next citizen
        </p>
      </div>

      <div>
        <h3 className="font-semibold mb-2 text-gray-900 dark:text-gray-100">Worked Tiles</h3>
        <div className="grid grid-cols-2 gap-2">
          {city.tiles.map((tile, i) => (
            <div
              key={i}
              className="p-2 bg-gray-100 dark:bg-gray-700 rounded text-sm"
            >
              Tile ({tile.x}, {tile.y})
            </div>
          ))}
        </div>
      </div>

      <div>
        <h3 className="font-semibold mb-2 text-gray-900 dark:text-gray-100">Specialists</h3>
        <div className="space-y-1 text-sm text-gray-600 dark:text-gray-400">
          <div>Scientists: {city.specialistSlots?.scientist || 0}</div>
          <div>Merchants: {city.specialistSlots?.merchant || 0}</div>
          <div>Artists: {city.specialistSlots?.artist || 0}</div>
        </div>
      </div>
    </div>
  );
}

function BuildTab({ city }: { city: City }) {
  const productionPerTurn = 3;

  return (
    <div className="p-4 space-y-4">
      <div>
        <h3 className="font-semibold mb-2 text-gray-900 dark:text-gray-100">Production</h3>
        <ProgressBar
          value={city.currentProduction?.progress || 0}
          max={city.currentProduction?.cost || 100}
          label={city.currentProduction?.name || 'Nothing'}
          showValue
        />
        <p className="text-xs text-gray-500 mt-1">
          {productionPerTurn} production per turn
        </p>
      </div>

      <div>
        <h3 className="font-semibold mb-2 text-gray-900 dark:text-gray-100">Build Queue</h3>
        {city.buildQueue.length === 0 ? (
          <p className="text-sm text-gray-500">Queue is empty</p>
        ) : (
          <ul className="space-y-1">
            {city.buildQueue.map((item, i) => (
              <li key={i} className="p-2 bg-gray-100 dark:bg-gray-700 rounded text-sm">
                {item.name}
              </li>
            ))}
          </ul>
        )}
      </div>

      <div>
        <h3 className="font-semibold mb-2 text-gray-900 dark:text-gray-100">Available</h3>
        <div className="grid grid-cols-2 gap-2">
          <Button variant="secondary" size="sm">Warrior</Button>
          <Button variant="secondary" size="sm">Settler</Button>
          <Button variant="secondary" size="sm">Worker</Button>
          <Button variant="secondary" size="sm">Scout</Button>
        </div>
      </div>
    </div>
  );
}

function StatsTab({ city }: { city: City }) {
  return (
    <div className="p-4 space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <StatCard label="Food" value="+5/turn" />
        <StatCard label="Production" value="+3/turn" />
        <StatCard label="Gold" value="+2/turn" />
        <StatCard label="Science" value="+1/turn" />
        <StatCard label="Culture" value="+1/turn" />
        <StatCard label="Faith" value="+0/turn" />
      </div>

      <div>
        <h3 className="font-semibold mb-2 text-gray-900 dark:text-gray-100">Buildings</h3>
        {city.buildings.length === 0 ? (
          <p className="text-sm text-gray-500">No buildings constructed</p>
        ) : (
          <ul className="space-y-1">
            {city.buildings.map((building, i) => (
              <li key={i} className="p-2 bg-gray-100 dark:bg-gray-700 rounded text-sm">
                {building}
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}

function DefenseTab({ city }: { city: City }) {
  const defenseStrength = 10 + (city.buildings.includes('walls') ? 10 : 0);

  return (
    <div className="p-4 space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <StatCard label="Defense" value={defenseStrength.toString()} />
        <StatCard label="Garrison HP" value="100/100" />
      </div>

      <div>
        <h3 className="font-semibold mb-2 text-gray-900 dark:text-gray-100">Garrisoned Unit</h3>
        {city.garrison ? (
          <div className="p-2 bg-gray-100 dark:bg-gray-700 rounded">
            Garrisoned
          </div>
        ) : (
          <p className="text-sm text-gray-500">No garrison</p>
        )}
      </div>

      <div>
        <h3 className="font-semibold mb-2 text-gray-900 dark:text-gray-100">Walls</h3>
        <p className="text-sm">
          {city.buildings.includes('walls') ? 'Built' : 'Not built'}
        </p>
      </div>
    </div>
  );
}

function StatCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="p-3 bg-gray-100 dark:bg-gray-700 rounded">
      <div className="text-xs text-gray-500">{label}</div>
      <div className="font-semibold text-gray-900 dark:text-gray-100">{value}</div>
    </div>
  );
}
