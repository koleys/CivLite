import { useGameStore } from '@/store/gameStore';
import { Button } from '@/components/ui';

interface UnitPanelProps {
  unitId: string;
  onClose: () => void;
}

export function UnitPanel({ unitId, onClose }: UnitPanelProps) {
  const unit = useGameStore((s) =>
    s.players.flatMap(p => p.units).find(u => u.id === unitId)
  );
  const skipUnit = useGameStore((s) => s.skipUnit);

  if (!unit) return null;

  const healthPercent = (unit.health / unit.maxHealth) * 100;
  const movementPercent = (unit.movement / unit.maxMovement) * 100;

  const getHealthColor = () => {
    if (healthPercent > 66) return 'bg-green-500';
    if (healthPercent > 33) return 'bg-yellow-500';
    return 'bg-red-500';
  };

  const handleFortify = () => {
    useGameStore.setState((state) => {
      const u = state.players.flatMap(p => p.units).find(u => u.id === unitId);
      if (u) {
        u.fortificationTurns = (u.fortificationTurns ?? 0) + 1;
        u.hasActed = true;
      }
    });
  };

  const handleSkipTurn = () => {
    skipUnit(unitId);
  };

  const level = unit.promotions?.level ?? 1;
  const promotions = unit.promotions?.promotions ?? [];

  return (
    <div className="fixed bottom-4 left-4 w-80 bg-white dark:bg-gray-800 rounded-lg shadow-xl z-40">
      <div className="p-4 border-b border-gray-200 dark:border-gray-700">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-blue-500 rounded flex items-center justify-center text-white text-lg">
              {getUnitIcon(unit.type)}
            </div>
            <div>
              <h3 className="font-semibold text-gray-900 dark:text-gray-100">
                {formatUnitType(unit.type)}
              </h3>
              <p className="text-xs text-gray-500">
                Level {level}
                {unit.promotions?.xp !== undefined && ` · ${unit.promotions.xp} XP`}
              </p>
            </div>
          </div>
          <Button variant="ghost" size="sm" onClick={onClose}>✕</Button>
        </div>
      </div>

      <div className="p-4 space-y-3">
        <div>
          <div className="flex justify-between text-sm mb-1">
            <span className="text-gray-600 dark:text-gray-400">Health</span>
            <span className="text-gray-900 dark:text-gray-100">{unit.health}/{unit.maxHealth}</span>
          </div>
          <div className="h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
            <div
              className={`h-full ${getHealthColor()} transition-all`}
              style={{ width: `${healthPercent}%` }}
            />
          </div>
        </div>

        <div>
          <div className="flex justify-between text-sm mb-1">
            <span className="text-gray-600 dark:text-gray-400">Movement</span>
            <span className="text-gray-900 dark:text-gray-100">{unit.movement}/{unit.maxMovement}</span>
          </div>
          <div className="h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
            <div
              className="h-full bg-blue-500 transition-all"
              style={{ width: `${movementPercent}%` }}
            />
          </div>
        </div>

        <div className="flex justify-between text-sm">
          <span className="text-gray-600 dark:text-gray-400">Strength</span>
          <span className="text-gray-900 dark:text-gray-100 font-medium">{unit.strength}</span>
        </div>

        {promotions.length > 0 && (
          <div>
            <span className="text-xs text-gray-500">Promotions:</span>
            <div className="flex flex-wrap gap-1 mt-1">
              {promotions.map((p) => (
                <span key={p} className="px-1.5 py-0.5 bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 rounded text-xs">
                  {p}
                </span>
              ))}
            </div>
          </div>
        )}
      </div>

      <div className="p-4 border-t border-gray-200 dark:border-gray-700">
        <div className="grid grid-cols-4 gap-2">
          <Button variant="secondary" size="sm" onClick={() => {}} title="Attack" disabled={unit.hasActed}>
            ⚔️
          </Button>
          <Button variant="secondary" size="sm" onClick={handleFortify} title="Fortify" disabled={unit.hasActed}>
            🛡️
          </Button>
          <Button variant="secondary" size="sm" onClick={() => {}} title="Sleep" disabled={unit.hasActed}>
            💤
          </Button>
          <Button variant="secondary" size="sm" onClick={handleSkipTurn} title="Skip Turn">
            ⏭️
          </Button>
        </div>
      </div>
    </div>
  );
}

function getUnitIcon(type: string): string {
  switch (type) {
    case 'warrior':
    case 'swordsman':
    case 'infantry':
      return '⚔️';
    case 'archer':
    case 'crossbowman':
      return '🏹';
    case 'settler':
      return '🏠';
    case 'scout':
      return '🔍';
    case 'horseman':
    case 'cavalry':
      return '🐎';
    default:
      return '❓';
  }
}

function formatUnitType(type: string): string {
  return type
    .split('_')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
}
