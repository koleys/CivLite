import { useRef, useEffect, useCallback, useState } from 'react';
import { useGameStore, selectMap, selectCamera, selectSelectedUnit } from '@/store/gameStore';
import { getHexNeighbors } from '@/utils/pathfinding';
import type { TileCoord } from '@/game/entities/types';

const TILE_SIZE = 64;

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

const FEATURE_COLORS: Record<string, string> = {
  forest: '#2d5a2d',
  hills: '#8b7355',
  floodplains: '#5a8a5a',
  oasis: '#5aa8c9',
  reefs: '#5aa8a8',
};

export function GameCanvas() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [canvasSize, setCanvasSize] = useState({ width: 0, height: 0 });
  
  const map = useGameStore(selectMap);
  const camera = useGameStore(selectCamera);
  const selectedUnit = useGameStore(selectSelectedUnit);
  const selectTile = useGameStore((s) => s.selectTile);
  const selectUnit = useGameStore((s) => s.selectUnit);
  const moveUnit = useGameStore((s) => s.moveUnit);
  const panCamera = useGameStore((s) => s.panCamera);
  const zoomCamera = useGameStore((s) => s.zoomCamera);
  const endTurn = useGameStore((s) => s.endTurn);
  const toggleTileYields = useGameStore((s) => s.toggleTileYields);
  const foundCity = useGameStore((s) => s.foundCity);
  const turn = useGameStore((s) => s.turn);
  const phase = useGameStore((s) => s.phase);
  const showTileYields = useGameStore((s) => s.showTileYields);
  const players = useGameStore((s) => s.players);

  useEffect(() => {
    const handleResize = () => {
      if (containerRef.current) {
        setCanvasSize({
          width: containerRef.current.clientWidth,
          height: containerRef.current.clientHeight,
        });
      }
    };
    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const screenToWorld = useCallback((screenX: number, screenY: number): TileCoord => {
    const x = (screenX - canvasSize.width / 2) / (TILE_SIZE * camera.zoom) + camera.x;
    const y = (screenY - canvasSize.height / 2) / (TILE_SIZE * camera.zoom) + camera.y;
    return { x: Math.round(x), y: Math.round(y) };
  }, [camera, canvasSize]);

  const handleClick = useCallback((e: React.MouseEvent) => {
    const rect = canvasRef.current?.getBoundingClientRect();
    if (!rect) return;

    const screenX = e.clientX - rect.left;
    const screenY = e.clientY - rect.top;
    const worldCoord = screenToWorld(screenX, screenY);

    if (!map) return;

    const tile = map.tiles.get(`${worldCoord.x},${worldCoord.y}`);
    if (!tile) return;

    selectTile(worldCoord);

    if (selectedUnit && !selectedUnit.hasActed) {
      const canMove = Math.abs(tile.x - selectedUnit.x) <= 1 && 
                      Math.abs(tile.y - selectedUnit.y) <= 1;
      if (canMove && !tile.cityId) {
        moveUnit(selectedUnit.id, worldCoord);
        return;
      }
    }

    const player = players.find((p) => p.id === 0);
    if (!player) return;

    const unitOnTile = player.units.find((u) => u.x === tile.x && u.y === tile.y);
    if (unitOnTile) {
      selectUnit(unitOnTile.id);
    } else if (selectedUnit?.type === 'settler' && !tile.cityId) {
      const cityName = prompt('Enter city name:', `City ${turn}`);
      if (cityName) {
        foundCity(cityName, tile.x, tile.y);
      }
    }
  }, [map, selectedUnit, players, turn, screenToWorld, selectTile, selectUnit, moveUnit, foundCity]);

  const handleWheel = useCallback((e: React.WheelEvent) => {
    e.preventDefault();
    const delta = e.deltaY > 0 ? -0.1 : 0.1;
    zoomCamera(delta);
  }, [zoomCamera]);

  const isDragging = useRef(false);
  const lastPos = useRef({ x: 0, y: 0 });

  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    if (e.button === 1 || (e.button === 0 && e.altKey)) {
      isDragging.current = true;
      lastPos.current = { x: e.clientX, y: e.clientY };
    }
  }, []);

  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    if (isDragging.current) {
      const dx = (lastPos.current.x - e.clientX) / (TILE_SIZE * camera.zoom);
      const dy = (lastPos.current.y - e.clientY) / (TILE_SIZE * camera.zoom);
      panCamera(dx, dy);
      lastPos.current = { x: e.clientX, y: e.clientY };
    }
  }, [camera.zoom, panCamera]);

  const handleMouseUp = useCallback(() => {
    isDragging.current = false;
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext('2d');
    if (!canvas || !ctx || !map) return;

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    ctx.save();
    ctx.translate(canvas.width / 2, canvas.height / 2);
    ctx.scale(camera.zoom, camera.zoom);
    ctx.translate(-camera.x * TILE_SIZE, -camera.y * TILE_SIZE);

    map.tiles.forEach((tile) => {
      const x = tile.x * TILE_SIZE;
      const y = tile.y * TILE_SIZE;

      ctx.fillStyle = TERRAIN_COLORS[tile.terrain] || '#333';
      ctx.fillRect(x, y, TILE_SIZE, TILE_SIZE);

      ctx.strokeStyle = 'rgba(255,255,255,0.1)';
      ctx.lineWidth = 1;
      ctx.strokeRect(x, y, TILE_SIZE, TILE_SIZE);

      if (tile.feature && FEATURE_COLORS[tile.feature]) {
        ctx.fillStyle = FEATURE_COLORS[tile.feature];
        ctx.globalAlpha = 0.4;
        ctx.fillRect(x, y, TILE_SIZE, TILE_SIZE);
        ctx.globalAlpha = 1;
      }

      if (tile.resource) {
        ctx.fillStyle = '#f1c40f';
        ctx.beginPath();
        ctx.arc(x + TILE_SIZE / 2, y + TILE_SIZE / 2, 6, 0, Math.PI * 2);
        ctx.fill();
      }

      if (tile.cityId) {
        ctx.fillStyle = '#e94560';
        ctx.fillRect(x + 4, y + 4, TILE_SIZE - 8, TILE_SIZE - 8);
        ctx.fillStyle = '#fff';
        ctx.font = 'bold 12px sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText('CITY', x + TILE_SIZE / 2, y + TILE_SIZE / 2 + 4);
      }
    });

    players.forEach((player) => {
      player.units.forEach((unit) => {
        const x = unit.x * TILE_SIZE;
        const y = unit.y * TILE_SIZE;

        const unitColor = player.isHuman ? '#3498db' : '#e74c3c';
        ctx.fillStyle = unitColor;
        
        if (unit.type === 'settler') {
          ctx.fillRect(x + 8, y + 8, TILE_SIZE - 16, TILE_SIZE - 16);
        } else if (unit.type === 'warrior' || unit.type === 'scout') {
          ctx.beginPath();
          ctx.moveTo(x + TILE_SIZE / 2, y + 4);
          ctx.lineTo(x + TILE_SIZE - 4, y + TILE_SIZE - 4);
          ctx.lineTo(x + 4, y + TILE_SIZE - 4);
          ctx.closePath();
          ctx.fill();
        } else {
          ctx.beginPath();
          ctx.arc(x + TILE_SIZE / 2, y + TILE_SIZE / 2, TILE_SIZE / 3, 0, Math.PI * 2);
          ctx.fill();
        }

        ctx.strokeStyle = selectedUnit?.id === unit.id ? '#f1c40f' : '#fff';
        ctx.lineWidth = selectedUnit?.id === unit.id ? 3 : 1;
        ctx.stroke();

        if (unit.hasActed) {
          ctx.fillStyle = 'rgba(0,0,0,0.5)';
          ctx.fillRect(x, y, TILE_SIZE, TILE_SIZE);
        }
      });
    });

    if (selectedUnit && !selectedUnit.hasActed) {
      const neighbors = getHexNeighbors(selectedUnit.x, selectedUnit.y);
      neighbors.forEach(({ x, y }) => {
        const tile = map.tiles.get(`${x},${y}`);
        if (tile && !tile.cityId) {
          ctx.strokeStyle = 'rgba(46, 204, 113, 0.8)';
          ctx.lineWidth = 2;
          ctx.strokeRect(x * TILE_SIZE, y * TILE_SIZE, TILE_SIZE, TILE_SIZE);
        }
      });
    }

    ctx.restore();

    if (showTileYields && map) {
      ctx.fillStyle = 'rgba(0,0,0,0.7)';
      ctx.fillRect(0, 0, 200, 100);
      ctx.fillStyle = '#fff';
      ctx.font = '12px monospace';
      ctx.fillText(`Turn: ${turn}`, 10, 20);
      ctx.fillText(`Zoom: ${camera.zoom.toFixed(1)}x`, 10, 40);
      ctx.fillText(`Camera: ${camera.x.toFixed(0)}, ${camera.y.toFixed(0)}`, 10, 60);
    }

  }, [map, camera, selectedUnit, players, turn, showTileYields]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      switch (e.key) {
        case ' ':
          e.preventDefault();
          endTurn();
          break;
        case 't':
        case 'T':
          toggleTileYields();
          break;
        case 'Escape':
          selectUnit(null);
          selectTile(null);
          break;
        case 'ArrowUp':
          panCamera(0, -2);
          break;
        case 'ArrowDown':
          panCamera(0, 2);
          break;
        case 'ArrowLeft':
          panCamera(-2, 0);
          break;
        case 'ArrowRight':
          panCamera(2, 0);
          break;
        case '+':
        case '=':
          zoomCamera(0.1);
          break;
        case '-':
          zoomCamera(-0.1);
          break;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [endTurn, toggleTileYields, selectUnit, selectTile, panCamera, zoomCamera]);

  if (phase !== 'playing') return null;

  return (
    <div ref={containerRef} className="game-container">
      <canvas
        ref={canvasRef}
        width={canvasSize.width}
        height={canvasSize.height}
        onClick={handleClick}
        onWheel={handleWheel}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
        style={{ display: 'block', cursor: 'crosshair' }}
      />
      
      <div className="top-bar">
        <span className="turn-info">Turn {turn} - Antiquity Age</span>
        <span className="controls-hint">
          Arrow Keys: Pan | +/-: Zoom | Space: End Turn | T: Toggle Info
        </span>
      </div>

      <div className="unit-panel">
        {selectedUnit && (
          <>
            <h3>Unit: {selectedUnit.type}</h3>
            <p>Health: {selectedUnit.health}/{selectedUnit.maxHealth}</p>
            <p>Movement: {selectedUnit.movement}/{selectedUnit.maxMovement}</p>
            <p>Status: {selectedUnit.hasActed ? 'Acted' : 'Ready'}</p>
            {selectedUnit.type === 'settler' && (
              <p className="hint">Click on empty tile to found a city</p>
            )}
          </>
        )}
      </div>

      <Minimap map={map} camera={camera} />

      <style>{`
        .game-container {
          width: 100vw;
          height: 100vh;
          position: relative;
          overflow: hidden;
          background: #1a1a2e;
        }

        .top-bar {
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          padding: 1rem;
          background: rgba(22, 33, 62, 0.9);
          display: flex;
          justify-content: space-between;
          align-items: center;
          border-bottom: 1px solid rgba(233, 69, 96, 0.3);
        }

        .turn-info {
          font-size: 1.2rem;
          font-weight: bold;
          color: #e94560;
        }

        .controls-hint {
          color: #a0a0a0;
          font-size: 0.9rem;
        }

        .unit-panel {
          position: absolute;
          bottom: 1rem;
          left: 1rem;
          padding: 1rem;
          background: rgba(22, 33, 62, 0.95);
          border-radius: 8px;
          border: 1px solid rgba(233, 69, 96, 0.3);
          min-width: 200px;
        }

        .unit-panel h3 {
          margin-bottom: 0.5rem;
          color: #e94560;
          text-transform: capitalize;
        }

        .unit-panel p {
          margin: 0.25rem 0;
          color: #a0a0a0;
        }

        .unit-panel .hint {
          margin-top: 0.5rem;
          font-style: italic;
          color: #27ae60;
        }
      `}</style>
    </div>
  );
}

function Minimap({ map, camera }: { map: any; camera: any }) {
  if (!map) return null;
  
  const minimapScale = 0.05;

  return (
    <div className="minimap">
      <div 
        className="minimap-viewport"
        style={{
          left: camera.x * minimapScale,
          top: camera.y * minimapScale,
          width: 100 / map.width + '%',
          height: 100 / map.height + '%',
        }}
      />
      <style>{`
        .minimap {
          position: absolute;
          bottom: 1rem;
          right: 1rem;
          width: 180px;
          height: 135px;
          background: rgba(22, 33, 62, 0.95);
          border-radius: 8px;
          border: 1px solid rgba(233, 69, 96, 0.3);
          overflow: hidden;
        }

        .minimap-viewport {
          position: absolute;
          border: 2px solid #e94560;
          background: rgba(233, 69, 96, 0.2);
          pointer-events: none;
        }
      `}</style>
    </div>
  );
}
