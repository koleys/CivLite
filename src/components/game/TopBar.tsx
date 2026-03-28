import { useGameStore } from '@/store/gameStore';
import { Button } from '@/components/ui';

export function TopBar() {
  const turn = useGameStore((s) => s.turn);
  const age = useGameStore((s) => s.age);
  const players = useGameStore((s) => s.players);
  const currentPlayer = useGameStore((s) => s.currentPlayer);
  const endTurn = useGameStore((s) => s.endTurn);

  const humanPlayer = players.find((p) => p.isHuman);
  const currentPlayerData = players.find((p) => p.id === currentPlayer);

  const formatAge = (a: string) => {
    switch (a) {
      case 'antiquity': return 'Antiquity';
      case 'exploration': return 'Exploration';
      case 'modern': return 'Modern';
      default: return a;
    }
  };

  const formatGold = (gold: number) => {
    if (gold >= 0) return `+${gold}`;
    return `${gold}`;
  };

  return (
    <div className="top-bar">
      <div className="top-bar-left">
        <div className="turn-display">
          <span className="turn-label">Turn</span>
          <span className="turn-number">{turn}</span>
        </div>
        <div className="age-display">
          <span className="age-icon">🏛️</span>
          <span className="age-name">{formatAge(age)}</span>
        </div>
      </div>

      <div className="top-bar-center">
        {humanPlayer && (
          <div className="player-stats">
            <div className="stat-item gold">
              <span className="stat-icon">💰</span>
              <span className="stat-value">{formatGold(humanPlayer.gold)}</span>
            </div>
            <div className="stat-item score">
              <span className="stat-label">Score</span>
              <span className="stat-value">{humanPlayer.score}</span>
            </div>
            <div className="stat-item era-score">
              <span className="stat-icon">⭐</span>
              <span className="stat-value">{humanPlayer.eraScore}</span>
            </div>
          </div>
        )}
      </div>

      <div className="top-bar-right">
        <div className="turn-actions">
          {currentPlayerData?.isHuman && (
            <Button variant="primary" size="md" onClick={endTurn}>
              End Turn
            </Button>
          )}
        </div>
      </div>

      <style>{`
        .top-bar {
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          height: 56px;
          padding: 0 1rem;
          background: linear-gradient(180deg, rgba(22, 33, 62, 0.98) 0%, rgba(22, 33, 62, 0.95) 100%);
          display: flex;
          justify-content: space-between;
          align-items: center;
          border-bottom: 2px solid rgba(233, 69, 96, 0.4);
          z-index: 100;
          box-shadow: 0 2px 8px rgba(0, 0, 0, 0.3);
        }

        .top-bar-left {
          display: flex;
          align-items: center;
          gap: 1.5rem;
        }

        .turn-display {
          display: flex;
          flex-direction: column;
          align-items: center;
          line-height: 1.1;
        }

        .turn-label {
          font-size: 0.65rem;
          text-transform: uppercase;
          letter-spacing: 0.1em;
          color: #a0a0a0;
        }

        .turn-number {
          font-size: 1.5rem;
          font-weight: 700;
          color: #e94560;
          font-variant-numeric: tabular-nums;
        }

        .age-display {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          padding: 0.4rem 0.8rem;
          background: rgba(233, 69, 96, 0.15);
          border-radius: 6px;
          border: 1px solid rgba(233, 69, 96, 0.3);
        }

        .age-icon {
          font-size: 1.2rem;
        }

        .age-name {
          font-size: 0.9rem;
          font-weight: 600;
          color: #e94560;
          text-transform: uppercase;
          letter-spacing: 0.05em;
        }

        .top-bar-center {
          flex: 1;
          display: flex;
          justify-content: center;
        }

        .player-stats {
          display: flex;
          align-items: center;
          gap: 1.5rem;
        }

        .stat-item {
          display: flex;
          align-items: center;
          gap: 0.4rem;
        }

        .stat-icon {
          font-size: 1rem;
        }

        .stat-label {
          font-size: 0.7rem;
          text-transform: uppercase;
          letter-spacing: 0.05em;
          color: #a0a0a0;
        }

        .stat-value {
          font-size: 1rem;
          font-weight: 600;
          color: #fff;
          font-variant-numeric: tabular-nums;
        }

        .stat-item.gold .stat-value {
          color: #f1c40f;
        }

        .stat-item.era-score .stat-value {
          color: #9b59b6;
        }

        .top-bar-right {
          display: flex;
          align-items: center;
          gap: 1rem;
        }

        .turn-actions {
          display: flex;
          align-items: center;
        }
      `}</style>
    </div>
  );
}
