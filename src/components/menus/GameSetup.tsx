import { useState } from 'react';
import { Button, Dropdown, Slider } from '@/components/ui';
import type { GameSettings } from '@/game/entities/types';

interface GameSetupProps {
  onStartGame: (settings: GameSettings) => void;
  onBack: () => void;
}

const mapSizeOptions = [
  { value: 'duel', label: 'Duel (40x30, 2 players)' },
  { value: 'small', label: 'Small (60x45, 4 players)' },
  { value: 'standard', label: 'Standard (80x60, 6 players)' },
  { value: 'large', label: 'Large (100x75, 8 players)' },
  { value: 'huge', label: 'Huge (120x90, 12 players)' },
];

const mapTypeOptions = [
  { value: 'continents', label: 'Continents' },
  { value: 'islands', label: 'Islands' },
  { value: 'pangaea', label: 'Pangaea' },
  { value: 'shuffle', label: 'Shuffle' },
];

const difficultyOptions = [
  { value: 'beginner', label: 'Beginner' },
  { value: 'easy', label: 'Easy' },
  { value: 'standard', label: 'Standard' },
  { value: 'deity', label: 'Deity' },
];

const gameSpeedOptions = [
  { value: 'online', label: 'Online (~67 turns/age)' },
  { value: 'standard', label: 'Standard (~100 turns/age)' },
  { value: 'marathon', label: 'Marathon (~300 turns/age)' },
];

export function GameSetup({ onStartGame, onBack }: GameSetupProps) {
  const getInitialSettings = (): GameSettings => ({
    mapSize: 'standard',
    gameSpeed: 'standard',
    difficulty: 'standard',
    mapSeed: Date.now(),
    mapType: 'continents',
    aiCount: 2,
    cityStateCount: 8,
    victoriesEnabled: {
      domination: true,
      science: true,
      culture: true,
      religious: true,
      diplomatic: true,
      age: true,
    },
    barbarians: true,
    resources: 'standard',
  });

  const [settings, setSettings] = useState<GameSettings>(getInitialSettings);

  const [showAdvanced, setShowAdvanced] = useState(false);
  const [aiType, setAiType] = useState<'random' | 'openrouter'>('random');
  const [cheatMode, setCheatMode] = useState(false);

  const handleStart = () => {
    onStartGame(settings);
  };

  const randomizeSeed = () => {
    setSettings(prev => ({ ...prev, mapSeed: Date.now() }));
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-900 to-blue-950 flex items-center justify-center p-4">
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl max-w-2xl w-full p-8">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100 mb-8 text-center">
          Game Setup
        </h1>

        <div className="space-y-6">
          <div className="grid grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Map Size
              </label>
              <Dropdown
                options={mapSizeOptions}
                value={settings.mapSize}
                onChange={(v) => setSettings(prev => ({ ...prev, mapSize: v as GameSettings['mapSize'] }))}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Map Type
              </label>
              <Dropdown
                options={mapTypeOptions}
                value={settings.mapType || 'continents'}
                onChange={(v) => setSettings(prev => ({ ...prev, mapType: v as GameSettings['mapType'] }))}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Difficulty
              </label>
              <Dropdown
                options={difficultyOptions}
                value={settings.difficulty}
                onChange={(v) => setSettings(prev => ({ ...prev, difficulty: v as GameSettings['difficulty'] }))}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Game Speed
              </label>
              <Dropdown
                options={gameSpeedOptions}
                value={settings.gameSpeed}
                onChange={(v) => setSettings(prev => ({ ...prev, gameSpeed: v as GameSettings['gameSpeed'] }))}
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Map Seed: {settings.mapSeed}
            </label>
            <div className="flex gap-2">
              <input
                type="number"
                value={settings.mapSeed}
                onChange={(e) => setSettings(prev => ({ ...prev, mapSeed: parseInt(e.target.value) || 0 }))}
                className="flex-1 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
              />
              <Button variant="secondary" onClick={randomizeSeed}>
                🎲 Random
              </Button>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                AI Opponents
              </label>
              <Slider
                value={settings.aiCount || 2}
                min={0}
                max={7}
                onChange={(e) => setSettings(prev => ({ ...prev, aiCount: parseInt(e.target.value) }))}
                formatValue={(v) => v.toString()}
              />
              <span className="text-sm text-gray-500">{settings.aiCount || 2} AI players</span>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                City-States
              </label>
              <Slider
                value={settings.cityStateCount || 8}
                min={4}
                max={16}
                onChange={(e) => setSettings(prev => ({ ...prev, cityStateCount: parseInt(e.target.value) }))}
                formatValue={(v) => v.toString()}
              />
              <span className="text-sm text-gray-500">{settings.cityStateCount || 8} city-states</span>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Victory Conditions
            </label>
            <div className="grid grid-cols-3 gap-2">
              {Object.entries(settings.victoriesEnabled ?? {
                domination: true,
                science: true,
                culture: true,
                religious: true,
                diplomatic: true,
                age: true,
              }).map(([victory, enabled]) => (
                <label key={victory} className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={enabled}
                    onChange={(e) => setSettings(prev => ({
                      ...prev,
                      victoriesEnabled: {
                        domination: true,
                        science: true,
                        culture: true,
                        religious: true,
                        diplomatic: true,
                        age: true,
                        ...prev.victoriesEnabled,
                        [victory]: e.target.checked,
                      }
                    }))}
                    className="rounded border-gray-300"
                  />
                  <span className="text-sm capitalize">{victory}</span>
                </label>
              ))}
            </div>
          </div>

          <button
            onClick={() => setShowAdvanced(!showAdvanced)}
            className="text-sm text-blue-600 hover:text-blue-700"
          >
            {showAdvanced ? '▼' : '▶'} Advanced Options
          </button>

          {showAdvanced && (
            <div className="space-y-4 p-4 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
              <div>
                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={settings.barbarians}
                    onChange={(e) => setSettings(prev => ({ ...prev, barbarians: e.target.checked }))}
                    className="rounded border-gray-300"
                  />
                  <span className="text-sm">Enable Barbarians</span>
                </label>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Resources
                </label>
                <div className="flex gap-4">
                  {(['sparse', 'standard', 'abundant'] as const).map(res => (
                    <label key={res} className="flex items-center gap-2">
                      <input
                        type="radio"
                        name="resources"
                        checked={settings.resources === res}
                        onChange={() => setSettings(prev => ({ ...prev, resources: res }))}
                      />
                      <span className="text-sm capitalize">{res}</span>
                    </label>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  AI Opponent Type
                </label>
                <div className="space-y-2">
                  <label className="flex items-center gap-2">
                    <input
                      type="radio"
                      name="aiType"
                      checked={aiType === 'random'}
                      onChange={() => setAiType('random')}
                    />
                    <span className="text-sm">Built-in Random AI (default)</span>
                  </label>
                  <label className="flex items-center gap-2">
                    <input
                      type="radio"
                      name="aiType"
                      checked={aiType === 'openrouter'}
                      onChange={() => setAiType('openrouter')}
                    />
                    <span className="text-sm">OpenRouter LLM (requires API key)</span>
                  </label>
                </div>
              </div>

              <div>
                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={cheatMode}
                    onChange={(e) => setCheatMode(e.target.checked)}
                    className="rounded border-gray-300"
                  />
                  <span className="text-sm">Enable Cheat Mode</span>
                </label>
              </div>
            </div>
          )}
        </div>

        <div className="flex justify-between mt-8">
          <Button variant="secondary" onClick={onBack}>
            Back
          </Button>
          <Button onClick={handleStart}>
            Start Game →
          </Button>
        </div>
      </div>
    </div>
  );
}
