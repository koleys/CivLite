import { useGameStore } from '@/store/gameStore';
import { BELIEFS } from '@/game/engine/ReligionSystem';

interface ReligionPanelProps {
  onClose: () => void;
}

export function ReligionPanel({ onClose }: ReligionPanelProps) {
  const players = useGameStore((s) => s.players);
  const foundPantheon = useGameStore((s) => s.foundPantheon);

  const human = players.find((p) => p.id === 0);
  if (!human) return null;

  const faith = human.faith ?? 0;
  const pantheon = (human as any).pantheon as string | undefined;
  const pantheonBelief = pantheon ? BELIEFS[pantheon] : null;
  const canFound = !pantheon && faith >= 20;

  const pantheonBeliefs = Object.values(BELIEFS).filter((b) => b.type === 'pantheon');

  return (
    <div className="rel-overlay" role="dialog" aria-label="Religion">
      <div className="rel-backdrop" onClick={onClose} />
      <div className="rel-panel">
        <div className="rel-header">
          <h2>🙏 Religion</h2>
          <button className="rel-close" onClick={onClose}>
            ✕
          </button>
        </div>

        <div className="rel-body">
          <div className="rel-faith">
            <span className="rel-faith-icon">✝</span>
            <span className="rel-faith-count">{faith}</span>
            <span className="rel-faith-label">Faith</span>
          </div>

          {pantheonBelief ? (
            <div className="rel-pantheon">
              <h3>Pantheon Founded</h3>
              <div className="rel-belief-card">
                <span className="rel-belief-name">{pantheonBelief.name}</span>
                <span className="rel-belief-effect">{pantheonBelief.effect}</span>
              </div>
            </div>
          ) : (
            <div className="rel-found-section">
              <h3>Found a Pantheon</h3>
              <p className="rel-found-desc">
                Requires 20 Faith. Your pantheon grants a permanent belief bonus.
              </p>
              <div className="rel-belief-list">
                {pantheonBeliefs.map((belief) => (
                  <div
                    key={belief.id}
                    className={`rel-belief-option${canFound ? '' : ' disabled'}`}
                    onClick={() => {
                      if (canFound) foundPantheon(belief.id);
                    }}
                  >
                    <span className="rel-belief-name">{belief.name}</span>
                    <span className="rel-belief-effect">{belief.effect}</span>
                  </div>
                ))}
              </div>
              {canFound && (
                <div className="rel-found-hint">Click a belief to found your pantheon</div>
              )}
              {!canFound && !pantheon && (
                <div className="rel-found-hint muted">
                  Need {20 - faith} more Faith
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      <style>{`
        .rel-overlay {
          position: fixed; inset: 0; z-index: 500;
          display: flex; align-items: center; justify-content: center;
        }
        .rel-backdrop {
          position: absolute; inset: 0;
          background: rgba(0,0,0,0.65);
        }
        .rel-panel {
          position: relative;
          background: rgba(12, 22, 48, 0.98);
          border: 1px solid rgba(233,69,96,0.5);
          border-radius: 12px;
          width: min(520px, 95vw);
          max-height: 80vh;
          display: flex; flex-direction: column;
          box-shadow: 0 8px 40px rgba(0,0,0,0.7);
          overflow: hidden;
        }
        .rel-header {
          display: flex; align-items: center; gap: 1rem;
          padding: 1rem 1.25rem 0.75rem;
          border-bottom: 1px solid rgba(233,69,96,0.3);
          flex-shrink: 0;
        }
        .rel-header h2 { font-size: 1.25rem; font-weight: bold; color: #e94560; margin: 0; }
        .rel-close {
          margin-left: auto; background: none; border: none;
          color: #888; font-size: 1.2rem; cursor: pointer;
        }
        .rel-close:hover { color: #e94560; }
        .rel-body {
          overflow-y: auto; padding: 1rem 1.25rem 1.25rem; flex: 1;
        }
        .rel-faith {
          display: flex; align-items: center; gap: 0.5rem;
          padding: 0.75rem 1rem;
          background: rgba(155,89,182,0.1);
          border: 1px solid rgba(155,89,182,0.3);
          border-radius: 8px; margin-bottom: 1rem;
        }
        .rel-faith-icon { font-size: 1.4rem; }
        .rel-faith-count { font-size: 1.5rem; font-weight: bold; color: #9b59b6; }
        .rel-faith-label { font-size: 0.85rem; color: #999; }
        .rel-pantheon h3, .rel-found-section h3 {
          font-size: 0.9rem; font-weight: bold; color: #a0b0c0;
          text-transform: uppercase; letter-spacing: 0.08em;
          margin: 0 0 0.6rem;
        }
        .rel-belief-card {
          background: rgba(155,89,182,0.12);
          border: 1px solid rgba(155,89,182,0.3);
          border-radius: 6px; padding: 0.6rem 0.8rem;
          display: flex; flex-direction: column; gap: 2px;
        }
        .rel-found-desc { font-size: 0.82rem; color: #888; margin-bottom: 0.75rem; }
        .rel-belief-list { display: flex; flex-direction: column; gap: 0.4rem; }
        .rel-belief-option {
          background: rgba(255,255,255,0.03);
          border: 1px solid rgba(255,255,255,0.1);
          border-radius: 6px; padding: 0.5rem 0.75rem;
          cursor: pointer; transition: background 0.12s;
          display: flex; flex-direction: column; gap: 1px;
        }
        .rel-belief-option:hover:not(.disabled) {
          background: rgba(155,89,182,0.15);
          border-color: rgba(155,89,182,0.4);
        }
        .rel-belief-option.disabled { opacity: 0.5; cursor: not-allowed; }
        .rel-belief-name { font-weight: 600; color: #ddd; font-size: 0.88rem; }
        .rel-belief-effect { font-size: 0.78rem; color: #999; }
        .rel-found-hint {
          margin-top: 0.6rem; font-size: 0.8rem; color: #2ecc71;
          font-style: italic;
        }
        .rel-found-hint.muted { color: #666; }
      `}</style>
    </div>
  );
}
