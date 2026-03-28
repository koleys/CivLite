/**
 * CheatPanel — QA/debug overlay toggled with Ctrl+D during gameplay.
 * Lets testers quickly add resources, spawn units, skip turns, etc.
 */

import { useState } from 'react';
import { useGameStore } from '@/store/gameStore';

const SPAWN_TYPES = [
  'warrior', 'archer', 'swordsman', 'horseman', 'settler',
  'catapult', 'cannon', 'cavalry', 'infantry', 'tank',
];

export function CheatPanel({ onClose }: { onClose: () => void }) {
  const cheatAddResources = useGameStore((s) => s.cheatAddResources);
  const cheatRevealMap    = useGameStore((s) => s.cheatRevealMap);
  const cheatSpawnUnit    = useGameStore((s) => s.cheatSpawnUnit);
  const cheatSkipTurns    = useGameStore((s) => s.cheatSkipTurns);
  const turn              = useGameStore((s) => s.turn);
  const players           = useGameStore((s) => s.players);

  const [spawnType, setSpawnType] = useState('warrior');
  const [skipCount, setSkipCount] = useState(10);
  const [feedback, setFeedback]   = useState('');

  const human = players.find(p => !p.isAI);

  const flash = (msg: string) => {
    setFeedback(msg);
    setTimeout(() => setFeedback(''), 2000);
  };

  return (
    <div className="cheat-panel">
      <div className="cheat-header">
        <span>🛠 Cheat Panel</span>
        <button className="cheat-close" onClick={onClose}>✕</button>
      </div>

      <div className="cheat-status">
        Turn: <b>{turn}</b> &nbsp;|&nbsp;
        Gold: <b>{human?.gold ?? 0}</b> &nbsp;|&nbsp;
        Cities: <b>{human?.cities.length ?? 0}</b>
      </div>

      {feedback && <div className="cheat-feedback">{feedback}</div>}

      <div className="cheat-section-title">Resources</div>
      <div className="cheat-row">
        <button className="cheat-btn gold"   onClick={() => { cheatAddResources(500, 0, 0, 0);   flash('+500 Gold'); }}>+500 💰 Gold</button>
        <button className="cheat-btn sci"    onClick={() => { cheatAddResources(0, 200, 0, 0);   flash('+200 Science'); }}>+200 🔬 Science</button>
        <button className="cheat-btn prod"   onClick={() => { cheatAddResources(0, 0, 200, 0);   flash('+200 Production'); }}>+200 ⚙️ Prod</button>
        <button className="cheat-btn cult"   onClick={() => { cheatAddResources(0, 0, 0, 200);   flash('+200 Culture'); }}>+200 🎭 Culture</button>
      </div>
      <div className="cheat-row">
        <button className="cheat-btn all"    onClick={() => { cheatAddResources(1000, 500, 500, 500); flash('All resources +'); }}>All ++</button>
      </div>

      <div className="cheat-section-title">Units</div>
      <div className="cheat-row">
        <select className="cheat-select" value={spawnType} onChange={e => setSpawnType(e.target.value)}>
          {SPAWN_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
        </select>
        <button className="cheat-btn spawn" onClick={() => { cheatSpawnUnit(spawnType); flash(`Spawned ${spawnType}`); }}>Spawn</button>
      </div>

      <div className="cheat-section-title">Time</div>
      <div className="cheat-row">
        <input
          type="number"
          className="cheat-input"
          value={skipCount}
          min={1}
          max={100}
          onChange={e => setSkipCount(Number(e.target.value))}
        />
        <button className="cheat-btn skip" onClick={() => { cheatSkipTurns(skipCount); flash(`Skipped ${skipCount} turns`); }}>Skip turns</button>
      </div>

      <div className="cheat-section-title">Map</div>
      <div className="cheat-row">
        <button className="cheat-btn reveal" onClick={() => { cheatRevealMap(); flash('Map revealed'); }}>👁 Reveal All</button>
      </div>

      <style>{`
        .cheat-panel {
          position: fixed;
          top: 50px;
          right: 20px;
          width: 280px;
          background: rgba(10,15,30,0.97);
          border: 1px solid #e94560;
          border-radius: 8px;
          padding: 0;
          z-index: 9999;
          font-family: inherit;
          box-shadow: 0 4px 24px rgba(0,0,0,0.7);
        }
        .cheat-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 8px 12px;
          background: rgba(233,69,96,0.2);
          border-bottom: 1px solid rgba(233,69,96,0.3);
          font-weight: 700;
          font-size: 0.9rem;
          color: #e94560;
        }
        .cheat-close {
          background: none;
          border: none;
          color: #e94560;
          cursor: pointer;
          font-size: 1rem;
          padding: 0;
        }
        .cheat-status {
          padding: 6px 12px;
          font-size: 0.78rem;
          color: #aaa;
          border-bottom: 1px solid rgba(255,255,255,0.08);
        }
        .cheat-feedback {
          padding: 4px 12px;
          font-size: 0.78rem;
          color: #4caf50;
          background: rgba(76,175,80,0.1);
          text-align: center;
        }
        .cheat-section-title {
          padding: 6px 12px 2px;
          font-size: 0.7rem;
          font-weight: 700;
          color: #888;
          text-transform: uppercase;
          letter-spacing: 0.08em;
        }
        .cheat-row {
          display: flex;
          gap: 6px;
          padding: 4px 10px;
          flex-wrap: wrap;
        }
        .cheat-btn {
          padding: 4px 10px;
          border-radius: 5px;
          border: 1px solid rgba(255,255,255,0.15);
          background: rgba(255,255,255,0.07);
          color: #eaeaea;
          font-size: 0.78rem;
          cursor: pointer;
          white-space: nowrap;
        }
        .cheat-btn:hover { background: rgba(255,255,255,0.15); }
        .cheat-btn.gold  { border-color: #f1c40f44; color: #f1c40f; }
        .cheat-btn.sci   { border-color: #3498db44; color: #3498db; }
        .cheat-btn.prod  { border-color: #e67e2244; color: #e67e22; }
        .cheat-btn.cult  { border-color: #9b59b644; color: #9b59b6; }
        .cheat-btn.all   { border-color: #2ecc7144; color: #2ecc71; }
        .cheat-btn.spawn { border-color: #e9456044; color: #e94560; }
        .cheat-btn.skip  { border-color: #16a08544; color: #1abc9c; }
        .cheat-btn.reveal{ border-color: #a0a0a044; }
        .cheat-select {
          flex: 1;
          padding: 3px 6px;
          background: #0f3460;
          color: #eaeaea;
          border: 1px solid rgba(255,255,255,0.2);
          border-radius: 5px;
          font-size: 0.78rem;
        }
        .cheat-input {
          width: 60px;
          padding: 3px 6px;
          background: #0f3460;
          color: #eaeaea;
          border: 1px solid rgba(255,255,255,0.2);
          border-radius: 5px;
          font-size: 0.78rem;
        }
      `}</style>
    </div>
  );
}
