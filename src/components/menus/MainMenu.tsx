import { useGameStore } from '@/store/gameStore';
import type { GameSettings } from '@/game/entities/types';

export function MainMenu() {
  const startGame = useGameStore((s) => s.startGame);

  const handleStartGame = (settings: Partial<GameSettings>) => {
    startGame(settings);
  };

  return (
    <div className="main-menu">
      <div className="menu-container">
        <h1 className="game-title">CivLite</h1>
        <p className="subtitle">Browser-Based 4X Strategy Game</p>
        
        <div className="menu-buttons">
          <button 
            className="menu-btn primary"
            onClick={() => handleStartGame({})}
          >
            New Game
          </button>
          
          <button 
            className="menu-btn"
            onClick={() => {
              const seed = Date.now();
              handleStartGame({ mapSeed: seed });
            }}
          >
            Quick Start (Standard)
          </button>
          
          <button className="menu-btn" disabled>
            Continue Game
          </button>
          
          <button className="menu-btn" disabled>
            Settings
          </button>
        </div>

        <div className="version-info">
          <p>Version 1.0.0 - Phase 1 MVP</p>
          <p className="hint">Press Space or click to start</p>
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
          padding: 1rem 3rem;
          font-size: 1.2rem;
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

        .menu-btn.primary:hover {
          background: #ff6b8a;
        }

        .version-info {
          color: #666;
          font-size: 0.9rem;
        }

        .hint {
          margin-top: 0.5rem;
          color: #888;
        }
      `}</style>
    </div>
  );
}
