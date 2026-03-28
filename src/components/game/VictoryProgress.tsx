import { ProgressBar } from '@/components/ui';

export interface VictoryProgressData {
  domination: { controlledCapitals: number; totalCapitals: number; progress: number };
  science: { technologiesComplete: number; totalTechnologies: number; progress: number };
  culture: { tourists: number; requiredTourists: number; progress: number };
  religious: { citiesWithReligion: number; totalCities: number; progress: number };
  diplomatic: { votesWon: number; requiredVotes: number; progress: number };
  age: { objectivesCompleted: number; totalObjectives: number; progress: number };
}

interface VictoryProgressProps {
  progress: VictoryProgressData;
  className?: string;
}

const victoryConfig = {
  domination: {
    icon: '🏆',
    label: 'Domination',
    color: 'text-red-500',
    getProgress: (p: VictoryProgressData['domination']) => p.progress,
  },
  science: {
    icon: '🔬',
    label: 'Science',
    color: 'text-blue-500',
    getProgress: (p: VictoryProgressData['science']) => p.progress,
  },
  culture: {
    icon: '🎭',
    label: 'Cultural',
    color: 'text-purple-500',
    getProgress: (p: VictoryProgressData['culture']) => p.progress,
  },
  religious: {
    icon: '⛪',
    label: 'Religious',
    color: 'text-yellow-500',
    getProgress: (p: VictoryProgressData['religious']) => p.progress,
  },
  diplomatic: {
    icon: '🏳️',
    label: 'Diplomatic',
    color: 'text-gray-500',
    getProgress: (p: VictoryProgressData['diplomatic']) => p.progress,
  },
  age: {
    icon: '⭐',
    label: 'Age',
    color: 'text-amber-500',
    getProgress: (p: VictoryProgressData['age']) => p.progress,
  },
};

export function VictoryProgress({ progress, className = '' }: VictoryProgressProps) {
  return (
    <div className={`bg-white dark:bg-gray-800 rounded-lg shadow-lg p-4 ${className}`}>
      <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">
        Victory Progress
      </h3>
      <div className="space-y-3">
        {Object.entries(victoryConfig).map(([key, config]) => {
          const data = progress[key as keyof VictoryProgressData] as { progress: number };
          return (
            <div key={key} className="flex items-center gap-2">
              <span className={config.color} title={config.label}>
                {config.icon}
              </span>
              <div className="flex-1">
                <ProgressBar
                  value={config.getProgress(data as never)}
                  max={100}
                  size="sm"
                />
              </div>
              <span className="text-xs text-gray-500 w-8 text-right">
                {Math.round(config.getProgress(data as never))}%
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
