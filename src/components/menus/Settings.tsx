import { useState } from 'react';
import { Button, Slider, Tabs } from '@/components/ui';

interface SettingsProps {
  onClose: () => void;
}

export function Settings({ onClose }: SettingsProps) {
  const [musicVolume, setMusicVolume] = useState(80);
  const [sfxVolume, setSfxVolume] = useState(60);
  const [quality, setQuality] = useState('auto');
  const [animations, setAnimations] = useState(true);
  const [particles, setParticles] = useState(true);
  const [uiScale, setUiScale] = useState(100);
  const [autoSave, setAutoSave] = useState(true);
  const [tileRecommendations, setTileRecommendations] = useState(true);
  const [yieldIcons, setYieldIcons] = useState(true);
  const [apiKey, setApiKey] = useState('');
  const [apiKeyVisible, setApiKeyVisible] = useState(false);
  const [timeout, setTimeout] = useState(30);

  const tabs = [
    {
      id: 'audio',
      label: 'Audio',
      content: (
        <div className="space-y-6">
          <div>
            <Slider
              label="Music Volume"
              value={musicVolume}
              onChange={(e) => setMusicVolume(parseInt(e.target.value))}
              min={0}
              max={100}
            />
          </div>
          <div>
            <Slider
              label="Sound Effects"
              value={sfxVolume}
              onChange={(e) => setSfxVolume(parseInt(e.target.value))}
              min={0}
              max={100}
            />
          </div>
        </div>
      ),
    },
    {
      id: 'video',
      label: 'Video',
      content: (
        <div className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Quality
            </label>
            <div className="flex gap-4">
              {['lite', 'medium', 'high', 'auto'].map((q) => (
                <label key={q} className="flex items-center gap-2">
                  <input
                    type="radio"
                    name="quality"
                    checked={quality === q}
                    onChange={() => setQuality(q)}
                    className="rounded border-gray-300"
                  />
                  <span className="text-sm capitalize">{q}</span>
                </label>
              ))}
            </div>
            <p className="text-xs text-gray-500 mt-1">
              Auto-detect recommends based on your hardware
            </p>
          </div>
          <div className="space-y-3">
            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={animations}
                onChange={(e) => setAnimations(e.target.checked)}
                className="rounded border-gray-300"
              />
              <span className="text-sm">Animations</span>
            </label>
            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={particles}
                onChange={(e) => setParticles(e.target.checked)}
                className="rounded border-gray-300"
              />
              <span className="text-sm">Particles</span>
            </label>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              UI Scale: {uiScale}%
            </label>
            <Slider
              value={uiScale}
              onChange={(e) => setUiScale(parseInt(e.target.value))}
              min={75}
              max={150}
              formatValue={(v) => `${v}%`}
            />
          </div>
        </div>
      ),
    },
    {
      id: 'gameplay',
      label: 'Gameplay',
      content: (
        <div className="space-y-6">
          <div>
            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={autoSave}
                onChange={(e) => setAutoSave(e.target.checked)}
                className="rounded border-gray-300"
              />
              <span className="text-sm">Auto-Save</span>
            </label>
            {autoSave && (
              <p className="text-xs text-gray-500 mt-1 ml-6">
                Every 5 turns
              </p>
            )}
          </div>
          <div>
            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={tileRecommendations}
                onChange={(e) => setTileRecommendations(e.target.checked)}
                className="rounded border-gray-300"
              />
              <span className="text-sm">Tile Recommendations</span>
            </label>
          </div>
          <div>
            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={yieldIcons}
                onChange={(e) => setYieldIcons(e.target.checked)}
                className="rounded border-gray-300"
              />
              <span className="text-sm">Yield Icons</span>
            </label>
          </div>
        </div>
      ),
    },
    {
      id: 'ai',
      label: 'AI Config',
      content: (
        <div className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              OpenRouter API Key
            </label>
            <div className="flex gap-2">
              <input
                type={apiKeyVisible ? 'text' : 'password'}
                value={apiKey}
                onChange={(e) => setApiKey(e.target.value)}
                placeholder="Enter API key..."
                className="flex-1 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
              />
              <Button
                variant="secondary"
                size="sm"
                onClick={() => setApiKeyVisible(!apiKeyVisible)}
              >
                {apiKeyVisible ? 'Hide' : 'Show'}
              </Button>
              <Button variant="secondary" size="sm">
                Test
              </Button>
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Model Priority
            </label>
            <div className="space-y-1 text-sm text-gray-600 dark:text-gray-400">
              <p>1. deepseek/deepseek-r1 (fast reasoning)</p>
              <p>2. meta-llama/llama-3.3-70b-instruct</p>
              <p>3. qwen/qwen-3-235b-a22b</p>
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Timeout: {timeout}s
            </label>
            <Slider
              value={timeout}
              onChange={(e) => setTimeout(parseInt(e.target.value))}
              min={10}
              max={120}
              formatValue={(v) => `${v}s`}
            />
          </div>
        </div>
      ),
    },
    {
      id: 'hotkeys',
      label: 'Hotkeys',
      content: (
        <div className="space-y-2 text-sm">
          <div className="grid grid-cols-2 gap-2">
            <span className="text-gray-500">Move Unit</span>
            <span className="font-mono">Click / Arrow Keys</span>
            <span className="text-gray-500">End Turn</span>
            <span className="font-mono">Space</span>
            <span className="text-gray-500">Zoom</span>
            <span className="font-mono">Scroll / +/-</span>
            <span className="text-gray-500">Pan</span>
            <span className="font-mono">WASD / Drag</span>
            <span className="text-gray-500">Fortify</span>
            <span className="font-mono">F</span>
            <span className="text-gray-500">Sleep</span>
            <span className="font-mono">Z</span>
            <span className="text-gray-500">Alert</span>
            <span className="font-mono">Alt+A</span>
            <span className="text-gray-500">Skip Turn</span>
            <span className="font-mono">.</span>
          </div>
        </div>
      ),
    },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-900 to-blue-950 flex items-center justify-center p-4">
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl max-w-2xl w-full p-8">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
            Settings
          </h1>
          <Button variant="ghost" onClick={onClose}>
            ✕
          </Button>
        </div>

        <Tabs tabs={tabs} />

        <div className="mt-6 pt-6 border-t border-gray-200 dark:border-gray-700 flex justify-between">
          <Button variant="secondary" onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={onClose}>
            Save Settings
          </Button>
        </div>
      </div>
    </div>
  );
}
