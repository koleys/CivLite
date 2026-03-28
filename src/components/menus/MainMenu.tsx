import { useState, useEffect } from 'react';
import { useGameStore, formatSeed, parseSeed } from '@/store/gameStore';
import { getOpenRouterKey, saveOpenRouterKey, clearOpenRouterKey, testOpenRouterKey } from '@/utils/apiKey';
import {
  ALL_FREE_MODELS, DEFAULT_MODEL_PRIORITY,
  getModelPriority, saveModelPriority,
  getModelName, getSpeedLabel, getContextLabel,
} from '@/utils/aiModels';
import type { GameSettings } from '@/game/entities/types';

type Panel = 'main' | 'newgame' | 'settings';

function randomSeed(): number {
  return (Math.random() * 0xffffffff) >>> 0;
}

type KeyStatus = 'idle' | 'testing' | 'ok' | 'error';

function SettingsPanel({ onBack }: { onBack: () => void }) {
  const settings       = useGameStore((s) => s.settings);
  const updateSettings = useGameStore((s) => s.updateSettings);

  const [local, setLocal]         = useState({ ...settings });
  const [aiMode, setAiMode]       = useState<'random' | 'openrouter'>(() =>
    getOpenRouterKey() ? 'openrouter' : 'random',
  );
  const [apiKey,  setApiKey]      = useState(() => getOpenRouterKey() ?? '');
  const [keyStatus, setKeyStatus] = useState<KeyStatus>('idle');
  const [keyMsg,  setKeyMsg]      = useState('');

  // Model priority list (user-editable)
  const [modelList, setModelList] = useState<string[]>(() => getModelPriority());
  const [addCandidate, setAddCandidate] = useState('');

  // Models not yet in the list
  const available = ALL_FREE_MODELS.filter(m => !modelList.includes(m.id));

  // Sync keyStatus badge when apiKey changes
  useEffect(() => { setKeyStatus('idle'); setKeyMsg(''); }, [apiKey]);
  // Sync addCandidate when available list changes
  useEffect(() => {
    if (available.length && !available.find(m => m.id === addCandidate)) {
      setAddCandidate(available[0].id);
    }
  }, [available, addCandidate]);

  const moveUp   = (i: number) => setModelList(l => { const n = [...l]; [n[i-1], n[i]] = [n[i], n[i-1]]; return n; });
  const moveDown = (i: number) => setModelList(l => { const n = [...l]; [n[i], n[i+1]] = [n[i+1], n[i]]; return n; });
  const remove   = (id: string) => setModelList(l => l.filter(m => m !== id));
  const addModel = () => {
    if (addCandidate && !modelList.includes(addCandidate)) {
      setModelList(l => [...l, addCandidate]);
    }
  };
  const resetModels = () => setModelList([...DEFAULT_MODEL_PRIORITY]);

  const handleTestKey = async () => {
    if (!apiKey.trim()) { setKeyStatus('error'); setKeyMsg('Enter a key first'); return; }
    setKeyStatus('testing');
    setKeyMsg('Testing…');
    const result = await testOpenRouterKey(apiKey);
    setKeyStatus(result.ok ? 'ok' : 'error');
    setKeyMsg(result.ok ? '✓ Key is valid' : `✗ ${result.error}`);
  };

  const handleSave = () => {
    updateSettings(local);
    if (aiMode === 'openrouter' && apiKey.trim()) {
      saveOpenRouterKey(apiKey.trim());
    } else {
      clearOpenRouterKey();
    }
    saveModelPriority(modelList);
    onBack();
  };

  return (
    <div className="new-game-panel settings-panel">
      <h2 className="panel-title">Settings</h2>

      <div className="option-row">
        <label className="option-label">Map Size</label>
        <select
          className="option-select"
          value={local.mapSize}
          onChange={(e) => setLocal((s) => ({ ...s, mapSize: e.target.value as GameSettings['mapSize'] }))}
        >
          <option value="tiny">Tiny (40×25)</option>
          <option value="small">Small (60×38)</option>
          <option value="standard">Standard (80×50)</option>
          <option value="large">Large (100×62)</option>
          <option value="huge">Huge (128×80)</option>
        </select>
      </div>

      <div className="option-row">
        <label className="option-label">Difficulty</label>
        <select
          className="option-select"
          value={local.difficulty}
          onChange={(e) => setLocal((s) => ({ ...s, difficulty: e.target.value as GameSettings['difficulty'] }))}
        >
          <option value="beginner">Beginner</option>
          <option value="easy">Easy</option>
          <option value="standard">Standard</option>
          <option value="deity">Deity</option>
        </select>
      </div>

      <div className="option-row">
        <label className="option-label">Game Speed</label>
        <select
          className="option-select"
          value={local.gameSpeed ?? 'standard'}
          onChange={(e) => setLocal((s) => ({ ...s, gameSpeed: e.target.value as GameSettings['gameSpeed'] }))}
        >
          <option value="online">Online (Quick)</option>
          <option value="standard">Standard</option>
          <option value="marathon">Marathon (Slow)</option>
        </select>
      </div>

      <div className="option-row">
        <label className="option-label">AI Players</label>
        <select
          className="option-select"
          value={local.aiCount ?? 2}
          onChange={(e) => setLocal((s) => ({ ...s, aiCount: Number(e.target.value) }))}
        >
          <option value={1}>1</option>
          <option value={2}>2</option>
          <option value={3}>3</option>
          <option value={4}>4</option>
          <option value={5}>5</option>
        </select>
      </div>

      {/* ── AI Opponent Mode ────────────────────────────────────────────── */}
      <div className="settings-section-title">🤖 AI Opponent</div>

      <div className="option-row">
        <label className="option-label">AI Mode</label>
        <select
          className="option-select"
          value={aiMode}
          onChange={(e) => setAiMode(e.target.value as 'random' | 'openrouter')}
        >
          <option value="random">Built-in (Random)</option>
          <option value="openrouter">OpenRouter LLM</option>
        </select>
      </div>

      {aiMode === 'openrouter' && (
        <>
          <div className="option-row api-key-row">
            <label className="option-label">API Key</label>
            <input
              type="password"
              className="api-key-input"
              value={apiKey}
              onChange={(e) => setApiKey(e.target.value)}
              placeholder="sk-or-v1-…"
              autoComplete="off"
              spellCheck={false}
            />
          </div>
          <div className="api-key-actions">
            <button
              className="api-test-btn"
              onClick={handleTestKey}
              disabled={keyStatus === 'testing'}
            >
              {keyStatus === 'testing' ? '…' : 'Test Connection'}
            </button>
            {keyMsg && (
              <span className={`api-key-status api-key-status--${keyStatus}`}>
                {keyMsg}
              </span>
            )}
          </div>
          <p className="api-key-hint">
            Get a free key at{' '}
            <a href="https://openrouter.ai" target="_blank" rel="noreferrer">openrouter.ai</a>.
            Key saved in browser cookie + localStorage.
            Falls back to built-in AI if the API is unavailable.
          </p>

          {/* ── Model priority list ──────────────────────────────────── */}
          <div className="model-section-title">
            Model Priority
            <button className="model-reset-btn" onClick={resetModels} title="Restore defaults">↺ Reset</button>
          </div>

          {modelList.length === 0 && (
            <p className="model-empty-hint">No models in list — add at least one below.</p>
          )}

          <ol className="model-priority-list">
            {modelList.map((id, i) => (
              <li key={id} className="model-row">
                <span className="model-rank">#{i + 1}</span>
                <span className="model-name" title={id}>{getModelName(id)}</span>
                <span className="model-ctx">{getContextLabel(id)}</span>
                <span className="model-speed">{getSpeedLabel(id)}</span>
                <div className="model-actions">
                  <button className="model-btn" onClick={() => moveUp(i)}   disabled={i === 0}                   title="Move up">↑</button>
                  <button className="model-btn" onClick={() => moveDown(i)} disabled={i === modelList.length - 1} title="Move down">↓</button>
                  <button className="model-btn model-btn--remove" onClick={() => remove(id)} title="Remove">×</button>
                </div>
              </li>
            ))}
          </ol>

          {available.length > 0 && (
            <div className="model-add-row">
              <select
                className="model-add-select"
                value={addCandidate}
                onChange={(e) => setAddCandidate(e.target.value)}
              >
                {available.map(m => (
                  <option key={m.id} value={m.id}>
                    {m.name} ({m.family}) · {m.contextK}K ctx · {m.speed === 'fast' ? '⚡' : m.speed === 'medium' ? '🔄' : '🧠'} {m.speed}
                  </option>
                ))}
              </select>
              <button className="model-add-btn" onClick={addModel}>+ Add</button>
            </div>
          )}
        </>
      )}

      <div className="panel-actions">
        <button className="menu-btn primary" onClick={handleSave}>
          Save &amp; Apply
        </button>
        <button className="menu-btn" onClick={onBack}>
          Cancel
        </button>
      </div>
    </div>
  );
}

export function MainMenu() {
  const startGame      = useGameStore((s) => s.startGame);
  const startTutorial  = useGameStore((s) => s.startTutorial);
  const settings       = useGameStore((s) => s.settings);

  const [panel, setPanel]       = useState<Panel>('main');
  const [seedInput, setSeedInput] = useState(() => formatSeed(randomSeed()));
  const [mapSize, setMapSize]   = useState<GameSettings['mapSize']>(settings.mapSize ?? 'standard');
  const [difficulty, setDifficulty] = useState<GameSettings['difficulty']>(settings.difficulty ?? 'standard');

  const handleRollSeed = () => setSeedInput(formatSeed(randomSeed()));

  const handleStartGame = () => {
    const seed = parseSeed(seedInput);
    startGame({ mapSeed: seed, mapSize, difficulty });
  };

  const handleQuickStart = () => {
    startGame({ mapSeed: randomSeed(), mapSize: settings.mapSize ?? 'standard', difficulty: settings.difficulty ?? 'standard' });
  };

  return (
    <div className="main-menu">
      <div className="menu-container">
        <h1 className="game-title">CivLite</h1>
        <p className="subtitle">Browser-Based 4X Strategy Game</p>

        {panel === 'main' && (
          <div className="menu-buttons">
            <button className="menu-btn primary" onClick={() => setPanel('newgame')}>
              New Game
            </button>
            <button className="menu-btn" onClick={handleQuickStart}>
              Quick Start
            </button>
            <button className="menu-btn" disabled>Continue Game</button>
            <button className="menu-btn" onClick={() => setPanel('settings')}>Settings</button>
            <button className="menu-btn tutorial-btn" onClick={startTutorial}>📖 Tutorial</button>
          </div>
        )}

        {panel === 'newgame' && (
          <div className="new-game-panel">
            <h2 className="panel-title">New Game</h2>

            <div className="option-row">
              <label className="option-label">Map Size</label>
              <select
                className="option-select"
                value={mapSize}
                onChange={(e) => setMapSize(e.target.value as GameSettings['mapSize'])}
              >
                <option value="tiny">Tiny (40×25)</option>
                <option value="small">Small (60×38)</option>
                <option value="standard">Standard (80×50)</option>
                <option value="large">Large (100×62)</option>
                <option value="huge">Huge (128×80)</option>
              </select>
            </div>

            <div className="option-row">
              <label className="option-label">Difficulty</label>
              <select
                className="option-select"
                value={difficulty}
                onChange={(e) => setDifficulty(e.target.value as GameSettings['difficulty'])}
              >
                <option value="beginner">Beginner</option>
                <option value="easy">Easy</option>
                <option value="standard">Standard</option>
                <option value="deity">Deity</option>
              </select>
            </div>

            <div className="option-row seed-row">
              <label className="option-label">Map Seed</label>
              <input
                className="seed-input"
                type="text"
                maxLength={12}
                value={seedInput}
                onChange={(e) => setSeedInput(e.target.value.toUpperCase())}
                placeholder="Seed code or number"
                spellCheck={false}
              />
              <button className="dice-btn" title="Roll random seed" onClick={handleRollSeed}>
                🎲
              </button>
            </div>
            <p className="seed-hint">Share this code to replay the same map</p>

            <div className="panel-actions">
              <button className="menu-btn primary" onClick={handleStartGame}>
                Start Game
              </button>
              <button className="menu-btn" onClick={() => setPanel('main')}>
                Back
              </button>
            </div>
          </div>
        )}

        {panel === 'settings' && (
          <SettingsPanel onBack={() => setPanel('main')} />
        )}

        <div className="version-info">
          <p>Version 1.0.0 – Phase 1 MVP</p>
        </div>
      </div>

      <style>{`
        .main-menu {
          width: 100vw;
          height: 100vh;
          display: flex;
          align-items: center;
          justify-content: center;
          background: linear-gradient(135deg, #1a1a2e 0%, #16213e 100%);
        }

        .menu-container {
          text-align: center;
          padding: 3rem;
          background: rgba(22, 33, 62, 0.8);
          border-radius: 16px;
          border: 1px solid rgba(233, 69, 96, 0.3);
          box-shadow: 0 8px 32px rgba(0, 0, 0, 0.4);
          min-width: 380px;
        }

        .game-title {
          font-size: 4rem;
          font-weight: 700;
          color: #e94560;
          margin-bottom: 0.5rem;
          text-shadow: 0 0 20px rgba(233, 69, 96, 0.5);
        }

        .subtitle {
          color: #a0a0a0;
          font-size: 1.2rem;
          margin-bottom: 3rem;
        }

        .menu-buttons {
          display: flex;
          flex-direction: column;
          gap: 1rem;
          margin-bottom: 2rem;
        }

        .menu-btn {
          padding: 0.9rem 2.5rem;
          font-size: 1.1rem;
          border: none;
          border-radius: 8px;
          cursor: pointer;
          transition: all 0.2s;
          background: #0f3460;
          color: #eaeaea;
        }

        .menu-btn:hover:not(:disabled) {
          background: #1a4a7a;
          transform: translateY(-2px);
        }

        .menu-btn:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }

        .menu-btn.primary {
          background: #e94560;
          color: white;
        }

        .menu-btn.primary:hover:not(:disabled) {
          background: #ff6b8a;
        }

        /* New Game + Settings panels */
        .new-game-panel {
          text-align: left;
        }

        .panel-title {
          text-align: center;
          color: #e94560;
          font-size: 1.6rem;
          margin-bottom: 1.5rem;
        }

        .option-row {
          display: flex;
          align-items: center;
          gap: 0.75rem;
          margin-bottom: 1rem;
        }

        .option-label {
          color: #a0a0a0;
          font-size: 0.95rem;
          width: 100px;
          flex-shrink: 0;
        }

        .option-select {
          flex: 1;
          padding: 0.5rem 0.75rem;
          background: #0f3460;
          color: #eaeaea;
          border: 1px solid rgba(233, 69, 96, 0.4);
          border-radius: 6px;
          font-size: 0.95rem;
          cursor: pointer;
        }
        .settings-section-title {
          font-size: 0.9rem;
          font-weight: 700;
          color: #e94560;
          text-transform: uppercase;
          letter-spacing: 0.05em;
          margin: 1.25rem 0 0.5rem;
          border-top: 1px solid rgba(233,69,96,0.25);
          padding-top: 1rem;
        }
        .api-key-row { align-items: center; }
        .api-key-input {
          flex: 1;
          padding: 0.5rem 0.75rem;
          background: #0f3460;
          color: #eaeaea;
          border: 1px solid rgba(233,69,96,0.4);
          border-radius: 6px;
          font-size: 0.9rem;
          font-family: monospace;
        }
        .api-key-actions {
          display: flex;
          align-items: center;
          gap: 0.75rem;
          margin-bottom: 0.5rem;
          padding-left: 108px;
        }
        .api-test-btn {
          padding: 0.4rem 1rem;
          background: #16213e;
          border: 1px solid rgba(233,69,96,0.5);
          border-radius: 6px;
          color: #eaeaea;
          cursor: pointer;
          font-size: 0.85rem;
        }
        .api-test-btn:disabled { opacity: 0.5; cursor: default; }
        .api-key-status { font-size: 0.85rem; }
        .api-key-status--ok    { color: #4caf50; }
        .api-key-status--error { color: #e94560; }
        .api-key-status--testing { color: #ffcc44; }
        .api-key-hint {
          font-size: 0.78rem;
          color: #888;
          padding-left: 108px;
          margin-bottom: 0.75rem;
          line-height: 1.5;
        }
        .api-key-hint a { color: #4a90d9; text-decoration: underline; }

        /* ── Model priority list ───────────────────────────────────────── */
        .model-section-title {
          display: flex; align-items: center; justify-content: space-between;
          font-size: 0.82rem; font-weight: 700; color: #ccc;
          text-transform: uppercase; letter-spacing: 0.05em;
          margin: 0.75rem 0 0.4rem; padding-left: 108px;
        }
        .model-reset-btn {
          background: none; border: 1px solid rgba(255,255,255,0.2);
          border-radius: 4px; color: #aaa; font-size: 0.75rem;
          cursor: pointer; padding: 2px 6px;
        }
        .model-reset-btn:hover { border-color: #e94560; color: #e94560; }
        .model-empty-hint { font-size: 0.8rem; color: #e94560; padding-left: 108px; margin: 0 0 0.5rem; }
        .model-priority-list {
          list-style: none; padding: 0; margin: 0 0 0.5rem; padding-left: 108px;
        }
        .model-row {
          display: flex; align-items: center; gap: 6px;
          padding: 4px 6px; margin-bottom: 3px;
          background: rgba(255,255,255,0.04); border-radius: 5px;
        }
        .model-rank { font-size: 0.72rem; color: #888; width: 22px; flex-shrink: 0; }
        .model-name { flex: 1; font-size: 0.82rem; color: #eaeaea; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
        .model-ctx  { font-size: 0.7rem; color: #778; white-space: nowrap; flex-shrink: 0; }
        .model-speed { font-size: 0.72rem; color: #aaa; white-space: nowrap; flex-shrink: 0; }
        .model-actions { display: flex; gap: 3px; flex-shrink: 0; }
        .model-btn {
          background: rgba(255,255,255,0.08); border: 1px solid rgba(255,255,255,0.15);
          border-radius: 3px; color: #ccc; font-size: 0.78rem; cursor: pointer;
          width: 22px; height: 22px; padding: 0; line-height: 1;
        }
        .model-btn:disabled { opacity: 0.25; cursor: default; }
        .model-btn:not(:disabled):hover { background: rgba(233,69,96,0.2); border-color: #e94560; color: #e94560; }
        .model-btn--remove:not(:disabled):hover { background: rgba(231,76,60,0.3); border-color: #e74c3c; color: #e74c3c; }
        .model-add-row {
          display: flex; gap: 8px; align-items: center;
          padding-left: 108px; margin-bottom: 0.75rem;
        }
        .model-add-select {
          flex: 1; padding: 0.4rem 0.6rem; background: #0f3460; color: #eaeaea;
          border: 1px solid rgba(233,69,96,0.4); border-radius: 6px; font-size: 0.82rem;
        }
        .model-add-btn {
          padding: 0.4rem 0.9rem; background: rgba(233,69,96,0.15);
          border: 1px solid rgba(233,69,96,0.5); border-radius: 6px;
          color: #e94560; font-size: 0.82rem; cursor: pointer; white-space: nowrap;
        }
        .model-add-btn:hover { background: rgba(233,69,96,0.3); }

        .seed-row {
          align-items: center;
        }

        .seed-input {
          flex: 1;
          padding: 0.5rem 0.75rem;
          background: #0f3460;
          color: #e0e0e0;
          border: 1px solid rgba(233, 69, 96, 0.4);
          border-radius: 6px;
          font-size: 1rem;
          font-family: monospace;
          letter-spacing: 0.08em;
          text-transform: uppercase;
        }

        .seed-input:focus {
          outline: none;
          border-color: #e94560;
        }

        .dice-btn {
          background: none;
          border: 1px solid rgba(233, 69, 96, 0.4);
          border-radius: 6px;
          padding: 0.4rem 0.6rem;
          font-size: 1.2rem;
          cursor: pointer;
          transition: background 0.15s;
        }

        .dice-btn:hover {
          background: rgba(233, 69, 96, 0.2);
        }

        .seed-hint {
          color: #666;
          font-size: 0.8rem;
          margin: -0.5rem 0 1.2rem 0;
          padding-left: 100px;
        }

        .panel-actions {
          display: flex;
          flex-direction: column;
          gap: 0.75rem;
          margin-top: 1.5rem;
        }

        .version-info {
          color: #555;
          font-size: 0.85rem;
          margin-top: 2rem;
        }
      `}</style>
    </div>
  );
}
