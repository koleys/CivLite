/**
 * TutorialOverlay — Step-by-step guided first-play tutorial.
 * Shows a highlighted instruction panel and dismisses per-step.
 */

import { useGameStore } from '@/store/gameStore';

interface TutorialStep {
  title: string;
  body: string;
  hint?: string;
  icon: string;
}

const TUTORIAL_STEPS: TutorialStep[] = [
  {
    icon: '👋',
    title: 'Welcome to CivLite!',
    body: 'CivLite is a 4X strategy game inspired by Civilization. Build cities, research technologies, and lead your civilization to victory!',
    hint: 'Click Next to continue the tutorial.',
  },
  {
    icon: '🏡',
    title: 'Your Settler',
    body: 'You start with a Settler and a Warrior. The Settler (🏡) can found your first city. Click it to select it.',
    hint: 'Left-click on the 🏡 icon on the map.',
  },
  {
    icon: '➡️',
    title: 'Moving Units',
    body: 'Move your units by right-clicking a nearby tile after selecting them. Units can move 2 tiles per turn. Green tiles show valid moves.',
    hint: 'Right-click an adjacent tile to move your Settler.',
  },
  {
    icon: '🏛',
    title: 'Found Your City',
    body: 'Once you find a good tile (grassland or plains near a river), Found a City! Cities produce Food, Production, Gold, Science and Culture.',
    hint: 'With the Settler selected, click "Found City" in the unit panel, or right-click → Found City.',
  },
  {
    icon: '⚙️',
    title: 'City Production',
    body: 'Cities can build units and improvements. Production accumulates each turn. Build a Warrior to defend your city!',
    hint: 'Cities automatically start building once founded. Check the yields panel (top-right).',
  },
  {
    icon: '🔬',
    title: 'Research Technology',
    body: 'Science from your cities researches technologies. Technologies unlock new units, buildings, and abilities.',
    hint: 'Science is shown in the top-right yields panel. It accumulates automatically.',
  },
  {
    icon: '⚔',
    title: 'Combat',
    body: 'Move your Warrior onto an enemy unit\'s tile to attack! Terrain gives defensive bonuses. Hills and forests are great for defense.',
    hint: 'Move a Warrior (⚔) onto a Barbarian unit to fight.',
  },
  {
    icon: '⏭',
    title: 'End Your Turn',
    body: 'When you\'re done moving units, press SPACE to end your turn. AI opponents will take their turns, then you go again.',
    hint: 'Press the SPACE key to end your turn.',
  },
  {
    icon: '🗺',
    title: 'The Minimap',
    body: 'The minimap (bottom-right) shows the full map. Click it to quickly navigate. The pink box shows your current view.',
    hint: 'Click the minimap to jump to any location.',
  },
  {
    icon: '🏆',
    title: "You're Ready!",
    body: 'Build cities, research technologies, defeat rivals, and lead your civilization to victory! Good luck!',
    hint: 'Click "Start Playing" to begin your game.',
  },
];

export function TutorialOverlay() {
  const tutorialStep   = useGameStore((s) => s.tutorialStep);
  const nextStep       = useGameStore((s) => s.nextTutorialStep);
  const prevStep       = useGameStore((s) => s.prevTutorialStep);
  const endTutorial    = useGameStore((s) => s.endTutorial);
  const phase          = useGameStore((s) => s.phase);

  // Only show when in tutorial mode
  if (phase !== 'playing' || tutorialStep >= TUTORIAL_STEPS.length) return null;

  const step = TUTORIAL_STEPS[tutorialStep];
  const isLast  = tutorialStep === TUTORIAL_STEPS.length - 1;
  const isFirst = tutorialStep === 0;

  return (
    <div className="tutorial-overlay" role="dialog" aria-label="Tutorial">
      {/* Dim backdrop — click advances */}
      <div className="tutorial-backdrop" onClick={nextStep} />

      <div className="tutorial-card">
        <div className="tutorial-progress">
          {TUTORIAL_STEPS.map((_, i) => (
            <span
              key={i}
              className={`tut-dot ${i === tutorialStep ? 'active' : i < tutorialStep ? 'done' : ''}`}
              onClick={() => {
                const store = (window as any).__civlite_store__?.getState();
                if (i < tutorialStep) store?.prevTutorialStep?.();
                else if (i > tutorialStep) store?.nextTutorialStep?.();
              }}
              style={{ cursor: 'pointer' }}
            />
          ))}
        </div>

        <div className="tutorial-icon">{step.icon}</div>
        <h3 className="tutorial-title">{step.title}</h3>
        <p className="tutorial-body">{step.body}</p>
        {step.hint && <p className="tutorial-hint">💡 {step.hint}</p>}

        <div className="tutorial-actions">
          <button className="tut-skip-btn" onClick={endTutorial}>Skip Tutorial</button>
          {!isFirst && (
            <button className="tut-prev-btn" onClick={prevStep}>← Back</button>
          )}
          <button className="tut-next-btn" onClick={isLast ? endTutorial : nextStep}>
            {isLast ? '🎮 Start Playing' : 'Next →'}
          </button>
        </div>
      </div>

      <style>{`
        .tutorial-overlay {
          position: fixed;
          inset: 0;
          z-index: 8000;
          display: flex;
          align-items: flex-end;
          justify-content: center;
          padding-bottom: 40px;
          pointer-events: none;
        }
        .tutorial-backdrop {
          position: fixed;
          inset: 0;
          background: rgba(0,0,0,0.25);
          pointer-events: auto;
          cursor: pointer;
        }
        .tutorial-card {
          position: relative;
          z-index: 1;
          pointer-events: auto;
          background: rgba(10,18,40,0.97);
          border: 2px solid #e94560;
          border-radius: 12px;
          padding: 20px 24px;
          max-width: 420px;
          width: calc(100% - 40px);
          box-shadow: 0 8px 40px rgba(0,0,0,0.8);
          animation: tut-slide-in 0.3s ease;
        }
        @keyframes tut-slide-in {
          from { transform: translateY(30px); opacity: 0; }
          to   { transform: translateY(0);    opacity: 1; }
        }
        .tutorial-progress {
          display: flex;
          gap: 5px;
          margin-bottom: 12px;
          justify-content: center;
        }
        .tut-dot {
          width: 8px; height: 8px;
          border-radius: 50%;
          background: rgba(255,255,255,0.2);
          transition: background 0.2s;
        }
        .tut-dot.active { background: #e94560; }
        .tut-dot.done   { background: rgba(233,69,96,0.4); }
        .tutorial-icon {
          font-size: 2.5rem;
          text-align: center;
          margin-bottom: 8px;
          line-height: 1;
        }
        .tutorial-title {
          font-size: 1.15rem;
          font-weight: 700;
          color: #eaeaea;
          text-align: center;
          margin: 0 0 10px;
        }
        .tutorial-body {
          font-size: 0.9rem;
          color: #c0c0c0;
          line-height: 1.55;
          margin: 0 0 10px;
          text-align: center;
        }
        .tutorial-hint {
          font-size: 0.82rem;
          color: #f1c40f;
          background: rgba(241,196,15,0.08);
          border: 1px solid rgba(241,196,15,0.2);
          border-radius: 6px;
          padding: 6px 10px;
          margin: 0 0 14px;
          text-align: center;
        }
        .tutorial-actions {
          display: flex;
          gap: 10px;
          justify-content: flex-end;
        }
        .tut-skip-btn {
          padding: 7px 14px;
          background: none;
          border: 1px solid rgba(255,255,255,0.15);
          border-radius: 7px;
          color: #888;
          font-size: 0.82rem;
          cursor: pointer;
        }
        .tut-skip-btn:hover { color: #e94560; border-color: #e94560; }
        .tut-prev-btn {
          padding: 7px 14px;
          background: none;
          border: 1px solid rgba(255,255,255,0.2);
          border-radius: 7px;
          color: #b0b0b0;
          font-size: 0.82rem;
          cursor: pointer;
        }
        .tut-prev-btn:hover { color: #fff; border-color: rgba(255,255,255,0.4); }
        .tut-next-btn {
          padding: 7px 18px;
          background: #e94560;
          border: none;
          border-radius: 7px;
          color: #fff;
          font-size: 0.88rem;
          font-weight: 600;
          cursor: pointer;
        }
        .tut-next-btn:hover { background: #c73652; }
      `}</style>
    </div>
  );
}
