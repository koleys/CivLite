interface LoadingScreenProps {
  message?: string;
  progress?: number;
}

export function LoadingScreen({ 
  message = 'Loading...', 
  progress 
}: LoadingScreenProps) {
  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-900 to-blue-950 flex items-center justify-center">
      <div className="text-center">
        <div className="mb-8">
          <h1 className="text-5xl font-bold text-white mb-2">CivLite</h1>
          <p className="text-blue-300 text-lg">A Browser-Based Civilization</p>
        </div>

        <div className="mb-6">
          <div className="w-64 h-2 bg-blue-800 rounded-full overflow-hidden mx-auto">
            {progress !== undefined && (
              <div 
                className="h-full bg-blue-400 transition-all duration-300"
                style={{ width: `${progress}%` }}
              />
            )}
          </div>
        </div>

        <p className="text-blue-300 text-sm">{message}</p>

        <div className="mt-12 flex justify-center gap-2">
          <div className="w-2 h-2 bg-blue-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
          <div className="w-2 h-2 bg-blue-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
          <div className="w-2 h-2 bg-blue-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
        </div>
      </div>
    </div>
  );
}
