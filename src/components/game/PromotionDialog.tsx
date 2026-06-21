import { useMemo } from 'react';
import { useGameStore } from '@/store/gameStore';
import { getAvailablePromotions, getUnitClass, PROMOTIONS } from '@/game/engine/PromotionSystem';
import type { PromotionType } from '@/game/engine/PromotionSystem';

interface PromotionDialogProps {
  unitId: string;
}

export function PromotionDialog({ unitId }: PromotionDialogProps) {
  const unit = useGameStore((s) =>
    s.players.flatMap(p => p.units).find(u => u.id === unitId)
  );
  const awardPromotion = useGameStore((s) => s.awardPromotion);

  const available = useMemo(() => {
    if (!unit) return [];
    const unitClass = getUnitClass(unit.type);
    const currentPromos = (unit.promotions?.promotions ?? []) as PromotionType[];
    return getAvailablePromotions(unitClass, currentPromos);
  }, [unit]);

  if (!unit || !unit.pendingPromotion || available.length === 0) return null;

  return (
    <div className="fixed inset-0 flex items-center justify-center z-50 bg-black/50">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl p-6 max-w-sm w-full">
        <h3 className="text-lg font-bold text-gray-900 dark:text-gray-100 mb-1">
          Promotion Available!
        </h3>
        <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
          {unit.type} reached Level {unit.promotions?.level ?? 1}
        </p>
        <div className="space-y-2">
          {available.map((promoId) => {
            const promo = PROMOTIONS[promoId];
            return (
              <button
                key={promoId}
                className="w-full text-left p-3 bg-gray-100 dark:bg-gray-700 rounded hover:bg-blue-100 dark:hover:bg-blue-900 transition-colors"
                onClick={() => awardPromotion(unitId, promoId)}
              >
                <div className="font-medium text-gray-900 dark:text-gray-100">{promo.name}</div>
                <div className="text-xs text-gray-500">{promo.description}</div>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
