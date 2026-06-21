import { useRef, useEffect, useCallback } from 'react';
import { useGameStore } from '@/store/gameStore';
import { TECHNOLOGIES, TECH_COST_MULTIPLIERS } from '@/game/engine/TechSystem';
import { getUnlocks } from '@/game/engine/UnlockManager';

const ERA_LABEL: Record<string, string> = {
  antiquity:   '🏛 Antiquity',
  exploration: '⛵ Exploration',
  modern:      '⚙️ Modern',
};

interface TechTreePanelProps {
  onClose: () => void;
}

function unlockSummary(techId: string): string[] {
  const u = getUnlocks(techId);
  const items: string[] = [];
  for (const unit of u.unitTypes) items.push(unit.replace(/_/g, ' '));
  for (const b of u.buildings) items.push(b.replace(/_/g, ' '));
  for (const i of u.improvements) items.push(i.replace(/_/g, ' '));
  return items;
}

export function TechTreePanel({ onClose }: TechTreePanelProps) {
  const players      = useGameStore(s => s.players);
  const setResearch  = useGameStore(s => s.setResearch);
  const human        = players.find(p => p.id === 0);
  const speed        = useGameStore(s => s.settings.gameSpeed);
  const svgRef       = useRef<SVGSVGElement>(null);

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
    const cost = Math.floor((TECHNOLOGIES[techId]?.cost ?? 1) * TECH_COST_MULTIPLIERS[speed]);
    return Math.min(100, Math.round((researching.progress / cost) * 100));
  };

  const statusColor = (s: string) => {
    switch (s) {
      case 'done':      return '#2ecc71';
      case 'active':    return '#74b9ff';
      case 'available': return '#f1c40f';
      default:          return '#555';
    }
  };

  // Draw SVG prerequisite lines between tech cards
  const drawLines = useCallback(() => {
    const svg = svgRef.current;
    if (!svg) return;
    const container = svg.parentElement;
    if (!container) return;
    svg.innerHTML = '';

    for (const tech of Object.values(TECHNOLOGIES)) {
      for (const prereqId of tech.prerequisites) {
        const fromEl = container.querySelector(`[data-tech-id="${prereqId}"]`) as HTMLElement;
        const toEl   = container.querySelector(`[data-tech-id="${tech.id}"]`) as HTMLElement;
        if (!fromEl || !toEl) continue;

        const svgRect = svg.getBoundingClientRect();
        const fromRect = fromEl.getBoundingClientRect();
        const toRect   = toEl.getBoundingClientRect();

        const x1 = fromRect.left + fromRect.width / 2 - svgRect.left;
        const y1 = fromRect.top  + fromRect.height   - svgRect.top;
        const x2 = toRect.left   + toRect.width / 2  - svgRect.left;
        const y2 = toRect.top                        - svgRect.top;

        const line = document.createElementNS('http://www.w3.org/2000/svg', 'line');
        line.setAttribute('x1', String(x1));
        line.setAttribute('y1', String(y1));
        line.setAttribute('x2', String(x2));
        line.setAttribute('y2', String(y2));

        const fromStatus = getStatus(prereqId);
        const toStatus   = getStatus(tech.id);
        let color = 'rgba(255,255,255,0.15)';
        if (fromStatus === 'done' && (toStatus === 'done' || toStatus === 'active' || toStatus === 'available')) {
          color = 'rgba(46,204,113,0.5)';
        } else if (fromStatus === 'done' && toStatus === 'locked') {
          color = 'rgba(255,255,255,0.08)';
        } else if (toStatus === 'active') {
          color = 'rgba(116,185,255,0.4)';
        } else if (toStatus === 'available') {
          color = 'rgba(241,196,15,0.35)';
        }
        line.setAttribute('stroke', color);
        line.setAttribute('stroke-width', '2');
        line.setAttribute('stroke-linecap', 'round');
        svg.appendChild(line);
      }
    }
  }, [known, researching]);

  // Redraw lines after render
  useEffect(() => {
    const timer = setTimeout(drawLines, 50);
    return () => clearTimeout(timer);
  }, [drawLines, researching, known.size]);

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
              <div className="tech-grid" style={{ position: 'relative' }}>
                <svg
                  ref={svgRef}
                  style={{
                    position: 'absolute',
                    inset: 0,
                    width: '100%',
                    height: '100%',
                    pointerEvents: 'none',
                    zIndex: 0,
                  }}
                />
                {(byEra[era] ?? []).map(tech => {
                  const status = getStatus(tech.id);
                  const pct    = progressPct(tech.id);
                  const unlocks = unlockSummary(tech.id);
                  return (
                    <button
                      key={tech.id}
                      data-tech-id={tech.id}
                      className={`tech-card tech-card--${status}`}
                      style={{ position: 'relative', zIndex: 1 }}
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
                      {unlocks.length > 0 && (
                        <span className="tech-unlocks">
                          Unlocks: {unlocks.join(', ')}
                        </span>
                      )}
                      <div className="tech-status-bar" style={{ background: statusColor(status) }} />
                      {status === 'active' && (
                        <div className="tech-progress-bar">
                          <div className="tech-progress-fill" style={{ width: `${pct}%` }} />
                        </div>
                      )}
                      {status === 'done'      && <span className="tech-badge done">✓</span>}
                      {status === 'locked'    && <span className="tech-badge locked">🔒</span>}
                      {status === 'active'    && <span className="tech-badge active">⚗️ {pct}%</span>}
                      {status === 'available' && <span className="tech-badge available">★</span>}
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
          grid-template-columns: repeat(auto-fill, minmax(180px, 1fr));
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
          overflow: hidden;
        }
        .tech-card--available {
          border-color: rgba(241,196,15,0.5);
          cursor: pointer;
        }
        .tech-card--available:hover {
          background: rgba(241,196,15,0.1);
          border-color: #f1c40f;
        }
        .tech-card--active {
          border-color: rgba(116,185,255,0.6);
          background: rgba(116,185,255,0.08);
        }
        .tech-card--done {
          border-color: rgba(46,204,113,0.25);
          opacity: 0.6; cursor: default;
        }
        .tech-card--locked {
          opacity: 0.35; cursor: not-allowed;
        }
        .tech-status-bar {
          position: absolute; bottom: 0; left: 0; right: 0;
          height: 3px; border-radius: 0 0 8px 8px;
        }
        .tech-name { font-size: 0.87rem; font-weight: 600; }
        .tech-cost { font-size: 0.75rem; color: #888; }
        .tech-unlocks {
          font-size: 0.7rem; color: #999; font-style: italic;
          line-height: 1.2;
        }
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
        .tech-badge.done      { color: #2ecc71; }
        .tech-badge.locked    { color: #666; }
        .tech-badge.active    { color: #74b9ff; }
        .tech-badge.available { color: #f1c40f; }
      `}</style>
    </div>
  );
}
