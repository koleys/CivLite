import { useGameStore } from '@/store/gameStore';
import { TECHNOLOGIES } from '@/game/engine/TechSystem';

const ERA_LABEL: Record<string, string> = {
  antiquity:   '🏛 Antiquity',
  exploration: '⛵ Exploration',
  modern:      '⚙️ Modern',
};

interface TechTreePanelProps {
  onClose: () => void;
}

export function TechTreePanel({ onClose }: TechTreePanelProps) {
  const players      = useGameStore(s => s.players);
  const setResearch  = useGameStore(s => s.setResearch);
  const human        = players.find(p => p.id === 0);

  if (!human) return null;

  const known       = human.technologies;
  const researching = human.currentResearch;

  // Group techs by era
  const byEra: Record<string, typeof TECHNOLOGIES[string][]> = {};
  Object.values(TECHNOLOGIES).forEach(tech => {
    (byEra[tech.era] ??= []).push(tech);
  });
  const eras = ['antiquity', 'exploration', 'modern'];

  const getStatus = (techId: string) => {
    if (known.has(techId))                        return 'done';
    if (researching?.techId === techId)           return 'active';
    const tech = TECHNOLOGIES[techId];
    if (tech.prerequisites.every(p => known.has(p))) return 'available';
    return 'locked';
  };

  const progressPct = (techId: string) => {
    if (researching?.techId !== techId) return 0;
    const cost = TECHNOLOGIES[techId]?.cost ?? 1;
    return Math.min(100, Math.round((researching.progress / cost) * 100));
  };

  return (
    <div className="tech-overlay" role="dialog" aria-label="Technology Tree">
      <div className="tech-backdrop" onClick={onClose} />
      <div className="tech-panel">
        <div className="tech-panel-header">
          <h2>🔬 Technology</h2>
          {researching && (
            <span className="tech-researching-badge">
              Researching: <strong>{TECHNOLOGIES[researching.techId]?.name ?? researching.techId}</strong>
              &nbsp;({progressPct(researching.techId)}%)
            </span>
          )}
          <button className="tech-close-btn" onClick={onClose}>✕</button>
        </div>

        <div className="tech-era-list">
          {eras.map(era => (
            <section key={era} className="tech-era-section">
              <h3 className="tech-era-title">{ERA_LABEL[era]}</h3>
              <div className="tech-grid">
                {(byEra[era] ?? []).map(tech => {
                  const status = getStatus(tech.id);
                  const pct    = progressPct(tech.id);
                  return (
                    <button
                      key={tech.id}
                      className={`tech-card tech-card--${status}`}
                      onClick={() => {
                        if (status === 'available') {
                          setResearch(tech.id);
                          onClose();
                        }
                      }}
                      disabled={status === 'locked' || status === 'done' || status === 'active'}
                      title={
                        status === 'locked'
                          ? `Requires: ${tech.prerequisites.join(', ')}`
                          : `Eureka: ${tech.eurekaTrigger}`
                      }
                    >
                      <span className="tech-name">{tech.name}</span>
                      <span className="tech-cost">📚 {tech.cost}</span>
                      {status === 'active' && (
                        <div className="tech-progress-bar">
                          <div className="tech-progress-fill" style={{ width: `${pct}%` }} />
                        </div>
                      )}
                      {status === 'done'      && <span className="tech-badge done">✓</span>}
                      {status === 'locked'    && <span className="tech-badge locked">🔒</span>}
                      {status === 'active'    && <span className="tech-badge active">⚗️ {pct}%</span>}
                    </button>
                  );
                })}
              </div>
            </section>
          ))}
        </div>
      </div>

      <style>{`
        .tech-overlay {
          position: fixed; inset: 0; z-index: 500;
          display: flex; align-items: center; justify-content: center;
        }
        .tech-backdrop {
          position: absolute; inset: 0;
          background: rgba(0,0,0,0.65);
        }
        .tech-panel {
          position: relative;
          background: rgba(12, 22, 48, 0.98);
          border: 1px solid rgba(233,69,96,0.5);
          border-radius: 12px;
          width: min(860px, 95vw);
          max-height: 85vh;
          display: flex; flex-direction: column;
          box-shadow: 0 8px 40px rgba(0,0,0,0.7);
          overflow: hidden;
        }
        .tech-panel-header {
          display: flex; align-items: center; gap: 1rem;
          padding: 1rem 1.25rem 0.75rem;
          border-bottom: 1px solid rgba(233,69,96,0.3);
          flex-shrink: 0;
        }
        .tech-panel-header h2 {
          font-size: 1.25rem; font-weight: bold; color: #e94560; margin: 0;
        }
        .tech-researching-badge {
          font-size: 0.82rem; color: #74b9ff;
          background: rgba(116,185,255,0.1);
          padding: 0.2rem 0.6rem; border-radius: 4px;
        }
        .tech-close-btn {
          margin-left: auto;
          background: none; border: none;
          color: #888; font-size: 1.2rem; cursor: pointer;
        }
        .tech-close-btn:hover { color: #e94560; }
        .tech-era-list {
          overflow-y: auto;
          padding: 1rem 1.25rem 1.25rem;
          flex: 1;
        }
        .tech-era-section { margin-bottom: 1.5rem; }
        .tech-era-title {
          font-size: 0.9rem; font-weight: bold;
          color: #a0b0c0; text-transform: uppercase;
          letter-spacing: 0.08em; margin: 0 0 0.6rem;
          border-bottom: 1px solid rgba(255,255,255,0.08);
          padding-bottom: 0.3rem;
        }
        .tech-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(160px, 1fr));
          gap: 0.5rem;
        }
        .tech-card {
          position: relative;
          background: rgba(255,255,255,0.04);
          border: 1px solid rgba(255,255,255,0.12);
          border-radius: 8px;
          padding: 0.55rem 0.7rem;
          text-align: left;
          cursor: pointer;
          color: #d0d8e8;
          transition: background 0.15s, border-color 0.15s;
          display: flex; flex-direction: column; gap: 0.2rem;
        }
        .tech-card--available {
          border-color: rgba(46,204,113,0.45);
          cursor: pointer;
        }
        .tech-card--available:hover {
          background: rgba(46,204,113,0.12);
          border-color: #2ecc71;
        }
        .tech-card--active {
          border-color: rgba(116,185,255,0.6);
          background: rgba(116,185,255,0.08);
        }
        .tech-card--done {
          opacity: 0.45; cursor: default;
          border-color: rgba(255,255,255,0.08);
        }
        .tech-card--locked {
          opacity: 0.35; cursor: not-allowed;
        }
        .tech-name { font-size: 0.87rem; font-weight: 600; }
        .tech-cost { font-size: 0.75rem; color: #888; }
        .tech-progress-bar {
          height: 4px; background: rgba(255,255,255,0.1);
          border-radius: 2px; margin-top: 2px; overflow: hidden;
        }
        .tech-progress-fill {
          height: 100%; background: #74b9ff;
          border-radius: 2px; transition: width 0.3s;
        }
        .tech-badge {
          position: absolute; top: 4px; right: 6px;
          font-size: 0.72rem;
        }
        .tech-badge.done   { color: #2ecc71; }
        .tech-badge.locked { color: #666; }
        .tech-badge.active { color: #74b9ff; }
      `}</style>
    </div>
  );
}
