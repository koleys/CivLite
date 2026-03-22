import { useRef, useEffect } from 'react';
import { useGameStore, selectMap, selectCamera } from '@/store/gameStore';

const TERRAIN_COLORS: Record<string, string> = {
  ocean: '#2d5a7b',
  coast: '#4a8db7',
  grassland: '#4a8c4a',
  plains: '#c4a35a',
  desert: '#c9a86c',
  tundra: '#8f9e8f',
  snow: '#e8f0f0',
  mountain: '#6b6b6b',
};

export function Minimap() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const map = useGameStore(selectMap);
  const camera = useGameStore(selectCamera);

  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext('2d');
    if (!canvas || !ctx || !map) return;

    ctx.fillStyle = '#1a1a2e';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    const scaleX = canvas.width / map.width;
    const scaleY = canvas.height / map.height;

    map.tiles.forEach((tile) => {
      const x = tile.x * scaleX;
      const y = tile.y * scaleY;
      const w = Math.max(1, scaleX);
      const h = Math.max(1, scaleY);

      ctx.fillStyle = TERRAIN_COLORS[tile.terrain] || '#333';
      ctx.fillRect(x, y, w, h);

      if (tile.cityId) {
        ctx.fillStyle = '#e94560';
        ctx.fillRect(x, y, w, h);
      }
    });

    const viewportW = (canvas.width / 10) * camera.zoom;
    const viewportH = (canvas.height / 10) * camera.zoom;
    const viewportX = camera.x * scaleX - viewportW / 2;
    const viewportY = camera.y * scaleY - viewportH / 2;

    ctx.strokeStyle = '#e94560';
    ctx.lineWidth = 2;
    ctx.strokeRect(viewportX, viewportY, viewportW, viewportH);

    ctx.fillStyle = 'rgba(233, 69, 96, 0.15)';
    ctx.fillRect(viewportX, viewportY, viewportW, viewportH);

  }, [map, camera]);

  return (
    <div className="minimap-container">
      <canvas ref={canvasRef} width={180} height={135} />
      <style>{`
        .minimap-container {
          position: absolute;
          bottom: 1rem;
          right: 1rem;
          border-radius: 8px;
          overflow: hidden;
          border: 2px solid rgba(233, 69, 96, 0.5);
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.4);
          background: #1a1a2e;
        }
      `}</style>
    </div>
  );
}
