import { useGameStore } from '@/store/gameStore';
import { MainMenu } from '@/components/menus/MainMenu';
import { GameCanvas } from '@/components/game/GameCanvas';

function App() {
  const phase = useGameStore((s) => s.phase);

  if (phase === 'menu' || phase === 'setup') {
    return <MainMenu />;
  }

  return <GameCanvas />;
}

export default App;
