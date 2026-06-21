import { useGameStore } from '@/store/gameStore';
import {
  GOVERNMENTS,
  POLICY_CARDS,
  GOVERNMENT_COST_MULTIPLIERS,
} from '@/game/engine/GovernmentSystem';
import type {
  GovernmentType,
} from '@/game/engine/GovernmentSystem';

interface GovernmentPanelProps {
  onClose: () => void;
}

const SLOT_LABELS: Record<string, string> = {
  military: '⚔ Military',
  economic: '💰 Economic',
  diplomatic: '🕊 Diplomatic',
  religious: '🙏 Religious',
  industrial: '⚙ Industrial',
  scientific: '🔬 Scientific',
};

export function GovernmentPanel({ onClose }: GovernmentPanelProps) {
  const players = useGameStore((s) => s.players);
  const settings = useGameStore((s) => s.settings);
  const setGovernment = useGameStore((s) => s.setGovernment);
  const equipPolicy = useGameStore((s) => s.equipPolicy);
  const unequipPolicy = useGameStore((s) => s.unequipPolicy);

  const human = players.find((p) => p.id === 0);
  if (!human) return null;

  const currentGovId = (human.government as GovernmentType) ?? 'chiefdom';
  const currentGov = GOVERNMENTS[currentGovId];
  const activePolicies = human.activePolicies ?? [];
  const multiplier = GOVERNMENT_COST_MULTIPLIERS[settings.gameSpeed];

  const allGovs = Object.values(GOVERNMENTS);
  const antiquityGovs = allGovs.filter((g) => g.era === 'antiquity');

  return (
    <div className="gov-overlay" role="dialog" aria-label="Government & Policies">
      <div className="gov-backdrop" onClick={onClose} />
      <div className="gov-panel">
        <div className="gov-header">
          <h2>🏛 Government</h2>
          <button className="gov-close" onClick={onClose}>
            ✕
          </button>
        </div>

        <div className="gov-body">
          {/* Current Government */}
          <div className="gov-current">
            <div className="gov-current-title">{currentGov.name}</div>
            <div className="gov-current-bonus">{currentGov.bonus}</div>
            <div className="gov-current-slots">
              {Object.entries(currentGov.slots).map(([slot, count]) =>
                count ? (
                  <span key={slot} className="gov-slot-badge">
                    {SLOT_LABELS[slot] ?? slot} ×{count}
                  </span>
                ) : null,
              )}
            </div>
          </div>

          {/* Available Governments */}
          <section className="gov-section">
            <h3>Available Governments</h3>
            <div className="gov-list">
              {antiquityGovs.map((gov) => {
                const cost = Math.floor(gov.cost * multiplier);
                const isCurrent = gov.id === currentGovId;
                const canAfford = human.gold >= cost;
                return (
                  <div
                    key={gov.id}
                    className={`gov-item${isCurrent ? ' gov-item--current' : ''}`}
                  >
                    <div className="gov-item-name">{gov.name}</div>
                    <div className="gov-item-bonus">{gov.bonus}</div>
                    <div className="gov-item-slots">
                      {Object.entries(gov.slots).map(([slot, count]) =>
                        count ? (
                          <span key={slot} className="gov-slot-badge small">
                            {SLOT_LABELS[slot] ?? slot} ×{count}
                          </span>
                        ) : null,
                      )}
                    </div>
                    {!isCurrent && (
                      <button
                        className="gov-switch-btn"
                        disabled={!canAfford}
                        onClick={() => {
                          setGovernment(gov.id);
                        }}
                      >
                        Switch ({cost === 0 ? 'Free' : `${cost} 💰`})
                      </button>
                    )}
                  </div>
                );
              })}
            </div>
          </section>

          {/* Policy Cards */}
          <section className="gov-section">
            <h3>Policy Cards</h3>
            <div className="policy-slots">
              {Object.entries(currentGov.slots).map(([slotType, maxSlots]) => {
                if (!maxSlots) return null;
                const equipped = activePolicies.filter(
                  (id) => POLICY_CARDS[id]?.slotType === slotType,
                );
                const available = Object.values(POLICY_CARDS).filter(
                  (c) =>
                    c.slotType === slotType &&
                    !activePolicies.includes(c.id) &&
                    c.era === 'antiquity',
                );
                return (
                  <div key={slotType} className="policy-slot-group">
                    <div className="policy-slot-label">
                      {SLOT_LABELS[slotType] ?? slotType} ({equipped.length}/{maxSlots})
                    </div>
                    <div className="policy-equipped">
                      {equipped.map((id) => {
                        const card = POLICY_CARDS[id];
                        return (
                          <div key={id} className="policy-card equipped">
                            <span className="policy-card-name">{card.name}</span>
                            <span className="policy-card-desc">{card.description}</span>
                            <button
                              className="policy-remove-btn"
                              onClick={() => unequipPolicy(id)}
                            >
                              ✕
                            </button>
                          </div>
                        );
                      })}
                      {equipped.length === 0 && (
                        <div className="policy-empty">No card equipped</div>
                      )}
                    </div>
                    <div className="policy-available">
                      {available.map((card) => (
                        <div
                          key={card.id}
                          className="policy-card available"
                          onClick={() => {
                            if (equipped.length < maxSlots) {
                              equipPolicy(card.id, slotType);
                            }
                          }}
                        >
                          <span className="policy-card-name">{card.name}</span>
                          <span className="policy-card-desc">{card.description}</span>
                          <span className="policy-card-tier">Tier {card.tier}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          </section>
        </div>
      </div>

      <style>{`
        .gov-overlay {
          position: fixed; inset: 0; z-index: 500;
          display: flex; align-items: center; justify-content: center;
        }
        .gov-backdrop {
          position: absolute; inset: 0;
          background: rgba(0,0,0,0.65);
        }
        .gov-panel {
          position: relative;
          background: rgba(12, 22, 48, 0.98);
          border: 1px solid rgba(233,69,96,0.5);
          border-radius: 12px;
          width: min(700px, 95vw);
          max-height: 85vh;
          display: flex; flex-direction: column;
          box-shadow: 0 8px 40px rgba(0,0,0,0.7);
          overflow: hidden;
        }
        .gov-header {
          display: flex; align-items: center; gap: 1rem;
          padding: 1rem 1.25rem 0.75rem;
          border-bottom: 1px solid rgba(233,69,96,0.3);
          flex-shrink: 0;
        }
        .gov-header h2 { font-size: 1.25rem; font-weight: bold; color: #e94560; margin: 0; }
        .gov-close {
          margin-left: auto; background: none; border: none;
          color: #888; font-size: 1.2rem; cursor: pointer;
        }
        .gov-close:hover { color: #e94560; }
        .gov-body {
          overflow-y: auto; padding: 1rem 1.25rem 1.25rem; flex: 1;
        }
        .gov-current {
          background: rgba(233,69,96,0.08);
          border: 1px solid rgba(233,69,96,0.25);
          border-radius: 8px; padding: 0.75rem 1rem; margin-bottom: 1rem;
        }
        .gov-current-title { font-size: 1.1rem; font-weight: bold; color: #e94560; }
        .gov-current-bonus { font-size: 0.85rem; color: #ccc; margin-top: 2px; }
        .gov-current-slots { display: flex; gap: 0.4rem; margin-top: 0.4rem; flex-wrap: wrap; }
        .gov-slot-badge {
          font-size: 0.75rem; padding: 0.15rem 0.45rem;
          background: rgba(116,185,255,0.15); border-radius: 4px;
          color: #74b9ff;
        }
        .gov-slot-badge.small { font-size: 0.7rem; padding: 0.1rem 0.35rem; }
        .gov-section { margin-bottom: 1.25rem; }
        .gov-section h3 {
          font-size: 0.9rem; font-weight: bold; color: #a0b0c0;
          text-transform: uppercase; letter-spacing: 0.08em;
          margin: 0 0 0.6rem;
          border-bottom: 1px solid rgba(255,255,255,0.08);
          padding-bottom: 0.3rem;
        }
        .gov-list { display: flex; flex-direction: column; gap: 0.5rem; }
        .gov-item {
          background: rgba(255,255,255,0.03);
          border: 1px solid rgba(255,255,255,0.1);
          border-radius: 6px; padding: 0.6rem 0.8rem;
          display: flex; align-items: center; gap: 0.75rem; flex-wrap: wrap;
        }
        .gov-item--current {
          border-color: rgba(233,69,96,0.5);
          background: rgba(233,69,96,0.08);
        }
        .gov-item-name { font-weight: 600; color: #ddd; min-width: 120px; }
        .gov-item-bonus { font-size: 0.82rem; color: #aaa; flex: 1; }
        .gov-item-slots { display: flex; gap: 0.3rem; flex-wrap: wrap; }
        .gov-switch-btn {
          padding: 0.3rem 0.7rem; border: 1px solid rgba(233,69,96,0.4);
          border-radius: 4px; background: rgba(233,69,96,0.1);
          color: #e94560; font-size: 0.8rem; cursor: pointer;
        }
        .gov-switch-btn:hover:not(:disabled) { background: rgba(233,69,96,0.25); }
        .gov-switch-btn:disabled { opacity: 0.4; cursor: not-allowed; }
        .policy-slots { display: flex; flex-direction: column; gap: 0.75rem; }
        .policy-slot-group {
          background: rgba(255,255,255,0.02);
          border: 1px solid rgba(255,255,255,0.06);
          border-radius: 6px; padding: 0.5rem 0.7rem;
        }
        .policy-slot-label {
          font-size: 0.8rem; font-weight: 600; color: #a0b0c0;
          margin-bottom: 0.3rem;
        }
        .policy-equipped { display: flex; gap: 0.4rem; flex-wrap: wrap; margin-bottom: 0.3rem; }
        .policy-available { display: flex; gap: 0.4rem; flex-wrap: wrap; }
        .policy-card {
          padding: 0.35rem 0.6rem; border-radius: 4px;
          font-size: 0.78rem; cursor: pointer;
          display: flex; flex-direction: column; gap: 1px;
          transition: background 0.12s;
        }
        .policy-card.equipped {
          background: rgba(46,204,113,0.15);
          border: 1px solid rgba(46,204,113,0.35);
          position: relative; padding-right: 1.5rem;
        }
        .policy-card.available {
          background: rgba(255,255,255,0.04);
          border: 1px solid rgba(255,255,255,0.1);
        }
        .policy-card.available:hover {
          background: rgba(116,185,255,0.12);
          border-color: rgba(116,185,255,0.4);
        }
        .policy-card-name { font-weight: 600; color: #ddd; }
        .policy-card-desc { font-size: 0.72rem; color: #999; }
        .policy-card-tier { font-size: 0.68rem; color: #666; }
        .policy-remove-btn {
          position: absolute; top: 4px; right: 6px;
          background: none; border: none; color: #888;
          font-size: 0.7rem; cursor: pointer;
        }
        .policy-remove-btn:hover { color: #e74c3c; }
        .policy-empty { font-size: 0.75rem; color: #555; font-style: italic; }
      `}</style>
    </div>
  );
}
