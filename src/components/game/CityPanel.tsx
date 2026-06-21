import { useMemo } from 'react';
import { useGameStore } from '@/store/gameStore';
import { Button, Tabs, ProgressBar } from '@/components/ui';
import { calculateCityYields } from '@/game/engine/CityGrowth';
import { getAvailableProductionItems } from '@/game/engine/UnlockManager';
import type { City, CurrentProduction } from '@/game/entities/types';

interface CityPanelProps {
  cityId: string;
  onClose: () => void;
}

export function CityPanel({ cityId, onClose }: CityPanelProps) {
  const city = useGameStore((s) =>
    s.players.flatMap(p => p.cities).find(c => c.id === cityId)
  );
  const map = useGameStore((s) => s.map);
  const currentPlayer = useGameStore((s) => s.players.find(p => p.id === s.currentPlayer));
  const setProduction = useGameStore((s) => s.setProduction);
  const queueProduction = useGameStore((s) => s.queueProduction);

  const yields = useMemo(() => {
    if (!city || !map) return null;
    return calculateCityYields(city, map);
  }, [city, map]);

  const availableItems = useMemo(() => {
    if (!currentPlayer || !city) return [];
    return getAvailableProductionItems(currentPlayer, city);
  }, [currentPlayer, city]);

  if (!city) return null;

  const t = yields?.totalYields;

  return (
    <div className="fixed inset-y-0 right-0 w-96 bg-white dark:bg-gray-800 shadow-xl z-40 flex flex-col">
      <div className="p-4 border-b border-gray-200 dark:border-gray-700">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100">{city.name}</h2>
          <Button variant="ghost" size="sm" onClick={onClose}>✕</Button>
        </div>
        {t && (
          <div className="mt-2 grid grid-cols-3 gap-2 text-xs text-gray-600 dark:text-gray-400">
            <span>🍎 {t.food}/t</span>
            <span>⚙️ {t.production}/t</span>
            <span>💰 {t.gold}/t</span>
            <span>🔬 {t.science}/t</span>
            <span>🎭 {t.culture}/t</span>
            <span>🙏 {t.faith}/t</span>
          </div>
        )}
        <div className="mt-2 flex gap-4 text-sm text-gray-600 dark:text-gray-400">
          <span>Pop: {city.population}</span>
          <span>Housing: {city.housingUsed}/{city.housing}</span>
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
              content: (
                <BuildTab
                  city={city}
                  availableItems={availableItems}
                  onSetProduction={(item) => setProduction(cityId, item)}
                  onQueueProduction={(item) => queueProduction(cityId, item)}
                />
              ),
            },
            {
              id: 'stats',
              label: 'Stats',
              content: <StatsTab city={city} yields={yields} />,
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
  return (
    <div className="p-4 space-y-4">
      <div>
        <h3 className="font-semibold mb-2 text-gray-900 dark:text-gray-100">Growth</h3>
        <ProgressBar
          value={city.foodStockpile}
          max={city.foodForGrowth}
          label="Food"
          showValue
          variant={city.foodForGrowth > 0 && city.foodStockpile / city.foodForGrowth > 0.8 ? 'success' : 'default'}
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

interface BuildTabProps {
  city: City;
  availableItems: Array<{ name: string; type: 'unit' | 'building'; cost: number }>;
  onSetProduction: (item: CurrentProduction) => void;
  onQueueProduction: (item: CurrentProduction) => void;
}

function BuildTab({ city, availableItems, onSetProduction, onQueueProduction }: BuildTabProps) {
  return (
    <div className="p-4 space-y-4">
      <div>
        <h3 className="font-semibold mb-2 text-gray-900 dark:text-gray-100">Current Production</h3>
        {city.currentProduction ? (
          <>
            <ProgressBar
              value={city.currentProduction.progress}
              max={city.currentProduction.cost}
              label={`${city.currentProduction.name} (${city.currentProduction.type})`}
              showValue
            />
            <p className="text-xs text-gray-500 mt-1">
              {city.currentProduction.cost - city.currentProduction.progress} production remaining
            </p>
          </>
        ) : (
          <p className="text-sm text-gray-500">Nothing being produced</p>
        )}
      </div>

      <div>
        <h3 className="font-semibold mb-2 text-gray-900 dark:text-gray-100">Build Queue</h3>
        {city.buildQueue.length === 0 ? (
          <p className="text-sm text-gray-500">Queue is empty</p>
        ) : (
          <ul className="space-y-1">
            {city.buildQueue.map((item, i) => (
              <li key={i} className="p-2 bg-gray-100 dark:bg-gray-700 rounded text-sm flex justify-between">
                <span>{item.name}</span>
                <span className="text-gray-500">{item.cost}</span>
              </li>
            ))}
          </ul>
        )}
      </div>

      <div>
        <h3 className="font-semibold mb-2 text-gray-900 dark:text-gray-100">Available</h3>
        <div className="space-y-1 max-h-60 overflow-y-auto">
          {availableItems.map((item) => (
            <div key={`${item.type}-${item.name}`} className="flex items-center justify-between p-2 bg-gray-100 dark:bg-gray-700 rounded text-sm">
              <div>
                <span className="font-medium capitalize">{item.name}</span>
                <span className="text-gray-500 ml-1 text-xs">({item.type})</span>
              </div>
              <div className="flex gap-1">
                <span className="text-gray-500 text-xs mr-1">{item.cost}</span>
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={() => onSetProduction({ name: item.name, type: item.type, cost: item.cost, progress: 0 })}
                >
                  Build
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => onQueueProduction({ name: item.name, type: item.type, cost: item.cost, progress: 0 })}
                >
                  +Q
                </Button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function StatsTab({ city, yields }: { city: City; yields: ReturnType<typeof calculateCityYields> | null }) {
  const t = yields?.totalYields;
  return (
    <div className="p-4 space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <StatCard label="Food" value={`+${t?.food ?? 0}/turn`} />
        <StatCard label="Production" value={`+${t?.production ?? 0}/turn`} />
        <StatCard label="Gold" value={`+${t?.gold ?? 0}/turn`} />
        <StatCard label="Science" value={`+${t?.science ?? 0}/turn`} />
        <StatCard label="Culture" value={`+${t?.culture ?? 0}/turn`} />
        <StatCard label="Faith" value={`+${t?.faith ?? 0}/turn`} />
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
