import { useRef, useEffect, useCallback, useState, useMemo } from 'react';
import { useGameStore, selectMap, selectCamera, selectSelectedUnit, selectSeed, formatSeed } from '@/store/gameStore';
import { TileManager } from '@/game/engine/TileManager';
import { CheatPanel } from './CheatPanel';
import { TutorialOverlay } from './TutorialOverlay';
import { TechTreePanel } from './TechTreePanel';
import type { TileCoord, MapData, Camera, Tile, Unit, City } from '@/game/entities/types';
import { preloadImages, getImg } from '@/utils/imageCache';
import { ASSET_PATHS } from '@/assets/AssetManifest';

const EDGE_ZONE = 60; // px from canvas edge that triggers auto-panning

interface TooltipData {
  screenX: number;
  screenY: number;
  tile: Tile;
  units: Array<{ unit: Unit; playerName: string; isHuman: boolean }>;
  city: City | null;
}

interface ContextMenuData {
  screenX: number;
  screenY: number;
  worldX: number;
  worldY: number;
}

const HEX_SIZE = 38;
const HEX_W    = HEX_SIZE * Math.sqrt(3);   // ≈ 65.82
const HEX_H    = HEX_SIZE * 2;              // 76
const HEX_Y_STEP = HEX_SIZE * 1.5;         // 57
// Keep for backward-compat with any remaining TILE_SIZE usages:
const TILE_SIZE = Math.round(HEX_W);        // ≈ 66

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

// ── Unit icon rendering helpers ───────────────────────────────────────────────

const UNIT_ICON_SIZE = 24;

/** Emoji icon for every unit type (SPEC §UnitType). Falls back to first letter. */
const UNIT_ICONS: Record<string, string> = {
  // ── Melee ──────────────────────────────────────────────────────────────
  warrior:          '⚔',   // crossed swords
  swordsman:        '🗡',   // dagger
  spearman:         '🏹',   // closest available to spear
  pikeman:          '🔱',   // trident
  infantry:         '🪖',   // military helmet
  musketman:        '🔫',   // pistol / musket
  rifleman:         '🎯',   // target / rifle
  samurai:          '⚔',
  crossbowman:      '🏹',
  // ── Mounted ────────────────────────────────────────────────────────────
  horseman:         '🐴',
  cavalry:          '🐴',
  charioteer:       '🏇',
  cuirassier:       '🏇',
  // ── Ranged / Siege ─────────────────────────────────────────────────────
  archer:           '🏹',
  catapult:         '💣',
  cannon:           '💣',
  artillery:        '💥',
  // ── Civilian ───────────────────────────────────────────────────────────
  settler:          '🏡',
  scout:            '🔭',
  missionary:       '✝',
  apostle:          '☮',
  // ── Naval ──────────────────────────────────────────────────────────────
  galley:           '⛵',
  trireme:          '⛵',
  caravel:          '🚢',
  caravelle:        '🚢',
  galleass:         '🛥',
  ship_of_the_line: '🛥',
  frigate:          '🛥',
  battleship:       '⚓',
  submarine:        '🤿',
  // ── Air ────────────────────────────────────────────────────────────────
  fighter:          '✈',
  bomber:           '✈',
  jet_fighter:      '🚀',
  // ── Special ────────────────────────────────────────────────────────────
  great_general:    '⭐',
  great_admiral:    '⚓',
  nuclear_device:   '☢',
  tank:             '🛡',
};

/** World tile (col, row) → world-space pixel center */
function tileCenter(col: number, row: number): { cx: number; cy: number } {
  return {
    cx: col * HEX_W + (row & 1) * HEX_W * 0.5,
    cy: row * HEX_Y_STEP,
  };
}

/** Trace a pointy-top hexagon path of radius r centred at (cx, cy) */
function hexPath(ctx: CanvasRenderingContext2D, cx: number, cy: number, r: number): void {
  ctx.beginPath();
  for (let i = 0; i < 6; i++) {
    const a = (Math.PI / 3) * i - Math.PI / 6;
    const px = cx + r * Math.cos(a);
    const py = cy + r * Math.sin(a);
    i === 0 ? ctx.moveTo(px, py) : ctx.lineTo(px, py);
  }
  ctx.closePath();
}

/** Pixel → nearest tile in odd-r offset coords (for click/hover hit-testing) */
function pixelToHex(px: number, py: number): { col: number; row: number } {
  const approxRow = py / HEX_Y_STEP;
  let bestCol = 0, bestRow = 0, bestDist = Infinity;
  for (let rowTry = Math.floor(approxRow) - 1; rowTry <= Math.ceil(approxRow) + 1; rowTry++) {
    const offset = (rowTry & 1) ? HEX_W * 0.5 : 0;
    const approxCol = (px - offset) / HEX_W;
    for (let colTry = Math.floor(approxCol) - 1; colTry <= Math.ceil(approxCol) + 1; colTry++) {
      const { cx, cy } = tileCenter(colTry, rowTry);
      const d = (px - cx) ** 2 + (py - cy) ** 2;
      if (d < bestDist) { bestDist = d; bestCol = colTry; bestRow = rowTry; }
    }
  }
  return { col: bestCol, row: bestRow };
}

/** Returns slot positions (tile-local px) for up to 4 unit icons. */
function getUnitSlots(count: number): Array<{ ox: number; oy: number }> {
  const s  = UNIT_ICON_SIZE;
  const near = 3;
  const far  = TILE_SIZE - s - near;   // 37
  const mid  = Math.floor((TILE_SIZE - s) / 2); // 20
  switch (Math.min(count, 4)) {
    case 1:  return [{ ox: mid,  oy: mid  }];
    case 2:  return [{ ox: near, oy: mid  }, { ox: far,  oy: mid  }];
    case 3:  return [{ ox: near, oy: near }, { ox: far,  oy: near }, { ox: mid, oy: far }];
    default: return [
      { ox: near, oy: near }, { ox: far, oy: near },
      { ox: near, oy: far  }, { ox: far, oy: far  },
    ];
  }
}

/** Draws a single 24×24 unit icon at tile-local offset (ox, oy). */
function drawUnitIcon(
  ctx: CanvasRenderingContext2D,
  unit: Unit,
  tileX: number, tileY: number,
  ox: number, oy: number,
  size: number,
  isSelected: boolean,
  isHuman: boolean,
): void {
  const cx = tileX + ox + size / 2;
  const cy = tileY + oy + size / 2;

  // Background badge
  const bgColor = isSelected
    ? '#f1c40f'
    : isHuman ? '#2980b9' : '#c0392b';
  ctx.fillStyle = bgColor;
  ctx.beginPath();
  ctx.arc(cx, cy, size / 2, 0, Math.PI * 2);
  ctx.fill();

  if (isSelected) {
    ctx.strokeStyle = '#fff';
    ctx.lineWidth = 1.5;
    ctx.stroke();
  }

  // Try SVG image first
  const svgKey = unit.type as keyof typeof ASSET_PATHS.units;
  const svgSrc = ASSET_PATHS.units[svgKey];
  const svgImg = svgSrc ? getImg(svgSrc) : null;

  if (svgImg) {
    const pad = 3;
    ctx.save();
    ctx.beginPath();
    ctx.arc(cx, cy, size / 2 - 1, 0, Math.PI * 2);
    ctx.clip();
    ctx.drawImage(svgImg, cx - size / 2 + pad, cy - size / 2 + pad, size - pad * 2, size - pad * 2);
    ctx.restore();
  } else {
    // Emoji fallback
    const icon = UNIT_ICONS[unit.type] ?? unit.type[0].toUpperCase();
    ctx.globalAlpha = isHuman ? 1 : 0.9;
    ctx.font = `${Math.round(size * 0.58)}px "Segoe UI Emoji","Apple Color Emoji","Noto Color Emoji",sans-serif`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillStyle = '#fff';
    ctx.fillText(icon, cx, cy + 1);
    ctx.globalAlpha = 1;
  }

  // Acted dim overlay
  if (unit.hasActed) {
    ctx.fillStyle = 'rgba(0,0,0,0.55)';
    ctx.beginPath();
    ctx.arc(cx, cy, size / 2, 0, Math.PI * 2);
    ctx.fill();
  }

  // HP bar — 2 px strip at bottom of icon
  const ax = tileX + ox;
  const ay = tileY + oy;
  const hpFrac = Math.max(0, unit.health / unit.maxHealth);
  ctx.fillStyle = 'rgba(0,0,0,0.5)';
  ctx.fillRect(ax, ay + size - 2, size, 2);
  ctx.fillStyle = hpFrac > 0.5 ? '#27ae60' : hpFrac > 0.25 ? '#e67e22' : '#e74c3c';
  ctx.fillRect(ax, ay + size - 2, Math.ceil(size * hpFrac), 2);
}

export function GameCanvas() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [canvasSize, setCanvasSize] = useState({ width: 0, height: 0 });
  const [imagesReady, setImagesReady] = useState(false);
  // City founding overlay state
  const [cityNameOverlay, setCityNameOverlay] = useState<{ x: number; y: number } | null>(null);
  const [cityNameInput, setCityNameInput] = useState('');
  // New: tooltip, context menu, edge panning
  const [tooltip, setTooltip] = useState<TooltipData | null>(null);
  const [contextMenu, setContextMenu] = useState<ContextMenuData | null>(null);
  const [edgePanDir, setEdgePanDir] = useState({ dx: 0, dy: 0 });
  const [showTechPanel, setShowTechPanel] = useState(false);
  const [mapCursor, setMapCursor] = useState<'crosshair' | 'grab' | 'grabbing'>('crosshair');
  
  const map = useGameStore(selectMap);
  const camera = useGameStore(selectCamera);
  const selectedUnit = useGameStore(selectSelectedUnit);
  const setCamera = useGameStore((s) => s.setCamera);
  const selectTile = useGameStore((s) => s.selectTile);
  const selectUnit = useGameStore((s) => s.selectUnit);
  const moveUnit = useGameStore((s) => s.moveUnit);
  const panCamera = useGameStore((s) => s.panCamera);
  const zoomCamera = useGameStore((s) => s.zoomCamera);
  const endTurn = useGameStore((s) => s.endTurn);
  const toggleTileYields = useGameStore((s) => s.toggleTileYields);
  const skipUnit = useGameStore((s) => s.skipUnit);
  const foundCity = useGameStore((s) => s.foundCity);
  const turn = useGameStore((s) => s.turn);
  const phase = useGameStore((s) => s.phase);
  const aiThinking = useGameStore((s) => s.aiThinking);
  const showTileYields = useGameStore((s) => s.showTileYields);
  const players = useGameStore((s) => s.players);
  const humanPlayer = players.find(p => p.id === 0) ?? null;
  const mapSeed = useGameStore(selectSeed);
  const cityStates = useGameStore((s) => s.cityStates);
  const cheatMode = useGameStore((s) => s.cheatMode);
  const tutorialActive = useGameStore((s) => s.tutorialActive);
  const toggleCheatMode = useGameStore((s) => s.toggleCheatMode);
  const updateCanvasSize = useGameStore((s) => s.updateCanvasSize);

  // Keep a stable ref to panCamera for use in RAF loops
  const panCameraRef = useRef(panCamera);
  panCameraRef.current = panCamera;

  // Edge-panning RAF loop
  useEffect(() => {
    if (edgePanDir.dx === 0 && edgePanDir.dy === 0) return;
    let rafId: number;
    const loop = () => {
      panCameraRef.current(edgePanDir.dx * 0.15, edgePanDir.dy * 0.15);
      rafId = requestAnimationFrame(loop);
    };
    rafId = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(rafId);
  }, [edgePanDir]);

  // Computed yields for human player (sum working tiles of all cities)
  const humanYields = useMemo(() => {
    const human = players.find(p => p.id === 0);
    const totals = { food: 0, production: 0, gold: 0, science: 0, culture: 0 };
    if (!human || !map) return totals;
    const tm = new TileManager(map);
    human.cities.forEach(city => {
      city.tiles.forEach(coord => {
        const tile = map.tiles.get(`${coord.x},${coord.y}`);
        if (tile) {
          const y = tm.calculateTileYield(tile);
          totals.food       += y.food;
          totals.production += y.production;
          totals.gold       += y.gold;
          totals.science    += y.science;
          totals.culture    += y.culture;
        }
      });
      // City-centre bonuses
      totals.production += 1;
      totals.science    += 1;
    });
    return totals;
  }, [players, map]);

  // Stable TileManager for tooltip yield calculation
  const tileManager = useMemo(() => map ? new TileManager(map) : null, [map]);

  // All human units on the selected unit's tile — drives the stack panel
  const selectedTileUnits = useMemo(() => {
    if (!selectedUnit) return [];
    return (players.find(p => p.id === 0)?.units ?? [])
      .filter(u => u.x === selectedUnit.x && u.y === selectedUnit.y);
  }, [selectedUnit, players]);

  // Expose store for e2e tests
  useEffect(() => {
    (window as any).__civlite_store__ = useGameStore;
  }, []);

  useEffect(() => {
    const terrainSrcs = Object.values(ASSET_PATHS.terrain) as string[];
    const unitSrcs    = Object.values(ASSET_PATHS.units)   as string[];
    preloadImages([...terrainSrcs, ...unitSrcs], () => setImagesReady(true));
  }, []);

  useEffect(() => {
    const handleResize = () => {
      if (containerRef.current) {
        const w = containerRef.current.clientWidth;
        const h = containerRef.current.clientHeight;
        setCanvasSize({ width: w, height: h });
        updateCanvasSize(w, h);
      }
    };
    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [updateCanvasSize]);

  const screenToWorld = useCallback((screenX: number, screenY: number): TileCoord => {
    const { cx: camCx, cy: camCy } = tileCenter(camera.x, camera.y);
    const worldPx = (screenX - canvasSize.width  / 2) / camera.zoom + camCx;
    const worldPy = (screenY - canvasSize.height / 2) / camera.zoom + camCy;
    const { col, row } = pixelToHex(worldPx, worldPy);
    return { x: col, y: row };
  }, [camera, canvasSize]);

  const handleClick = useCallback((e: React.MouseEvent) => {
    // If we were dragging, swallow this click and reset the flag
    if (suppressNextClick.current) {
      suppressNextClick.current = false;
      return;
    }
    const rect = canvasRef.current?.getBoundingClientRect();
    if (!rect) return;

    if (contextMenu) { setContextMenu(null); return; }
    if (cityNameOverlay) { setCityNameOverlay(null); return; }

    const mx = e.clientX - rect.left;
    const my = e.clientY - rect.top;
    const worldCoord = screenToWorld(mx, my);
    if (!map) return;

    const tile = map.tiles.get(`${worldCoord.x},${worldCoord.y}`);
    if (!tile) return;

    selectTile(worldCoord);

    const player = players.find(p => p.id === 0);
    if (!player) return;

    const unitsOnTile = player.units.filter(u => u.x === tile.x && u.y === tile.y);
    if (unitsOnTile.length === 0) { selectUnit(null); return; }

    // Sub-tile hit-test: determine which icon slot the click landed in
    const { cx: htx, cy: hty } = tileCenter(worldCoord.x, worldCoord.y);
    const { cx: camCx, cy: camCy } = tileCenter(camera.x, camera.y);
    const tileScreenX = (htx - HEX_W / 2 - camCx) * camera.zoom + canvasSize.width  / 2;
    const tileScreenY = (hty - HEX_H / 2 - camCy) * camera.zoom + canvasSize.height / 2;
    const localX = (mx - tileScreenX) / camera.zoom;
    const localY = (my - tileScreenY) / camera.zoom;

    const slots  = getUnitSlots(unitsOnTile.length);
    const hitIdx = slots.findIndex(s =>
      localX >= s.ox && localX < s.ox + UNIT_ICON_SIZE &&
      localY >= s.oy && localY < s.oy + UNIT_ICON_SIZE,
    );

    const toSelect = hitIdx >= 0 && hitIdx < unitsOnTile.length
      ? unitsOnTile[hitIdx]
      : (unitsOnTile.find(u => !u.hasActed) ?? unitsOnTile[0]);

    selectUnit(toSelect.id);
  }, [map, camera, canvasSize, players, contextMenu, cityNameOverlay, screenToWorld, selectTile, selectUnit]);

  // Right-click: move unit directly if valid target, else show context menu
  const handleContextMenu = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    const rect = canvasRef.current?.getBoundingClientRect();
    if (!rect || !map) return;
    const worldCoord = screenToWorld(e.clientX - rect.left, e.clientY - rect.top);
    const tile = map.tiles.get(`${worldCoord.x},${worldCoord.y}`);
    if (!tile) return;

    // Direct move when unit is selected and tile is a valid target
    if (selectedUnit && !selectedUnit.hasActed) {
      const dist = Math.max(Math.abs(tile.x - selectedUnit.x), Math.abs(tile.y - selectedUnit.y));
      const passable = tile.terrain !== 'ocean' && tile.terrain !== 'mountain' && !tile.cityId;
      const notSameTile = tile.x !== selectedUnit.x || tile.y !== selectedUnit.y;
      if (notSameTile && dist <= selectedUnit.movement && passable) {
        moveUnit(selectedUnit.id, worldCoord);
        return;
      }
    }

    // Otherwise open context menu
    setContextMenu({ screenX: e.clientX, screenY: e.clientY, worldX: worldCoord.x, worldY: worldCoord.y });
  }, [map, selectedUnit, screenToWorld, moveUnit]);

  // Close context menu when clicking anywhere outside it
  useEffect(() => {
    if (!contextMenu) return;
    const close = () => setContextMenu(null);
    window.addEventListener('click', close, { once: true, capture: true });
    return () => window.removeEventListener('click', close, { capture: true });
  }, [contextMenu]);

  // Use a non-passive native wheel listener so preventDefault() actually works
  const zoomCameraRef = useRef(zoomCamera);
  zoomCameraRef.current = zoomCamera;
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const onWheel = (e: WheelEvent) => {
      e.preventDefault();
      zoomCameraRef.current(e.deltaY > 0 ? -0.1 : 0.1);
    };
    canvas.addEventListener('wheel', onWheel, { passive: false });
    return () => canvas.removeEventListener('wheel', onWheel);
  }, []);

  const isDragging = useRef(false);
  const lastPos = useRef({ x: 0, y: 0 });
  const dragStartPos = useRef({ x: 0, y: 0 });
  const suppressNextClick = useRef(false);

  // Pixels of movement before a left-button press is treated as a drag (not a click)
  const DRAG_THRESHOLD = 5;

  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    // Middle button OR Alt+left = legacy pan; left button alone = new drag-to-pan
    if (e.button === 1 || e.button === 0) {
      isDragging.current = false;
      suppressNextClick.current = false;
      dragStartPos.current = { x: e.clientX, y: e.clientY };
      lastPos.current = { x: e.clientX, y: e.clientY };
    }
  }, []);

  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    const rect = canvasRef.current?.getBoundingClientRect();
    if (!rect) return;
    const mx = e.clientX - rect.left;
    const my = e.clientY - rect.top;

    // ── Edge panning ────────────────────────────────────────────────────────
    let edx = 0, edy = 0;
    if (mx < EDGE_ZONE) edx = -1;
    else if (mx > rect.width - EDGE_ZONE) edx = 1;
    if (my < EDGE_ZONE) edy = -1;
    else if (my > rect.height - EDGE_ZONE) edy = 1;
    setEdgePanDir(prev => (prev.dx === edx && prev.dy === edy) ? prev : { dx: edx, dy: edy });

    // ── Tooltip ─────────────────────────────────────────────────────────────
    if (map) {
      const wc = screenToWorld(mx, my);
      const tile = map.tiles.get(`${wc.x},${wc.y}`);
      if (tile) {
        const units = players.flatMap(p =>
          p.units
            .filter(u => u.x === tile.x && u.y === tile.y)
            .map(u => ({ unit: u, playerName: p.name, isHuman: p.isHuman }))
        );
        const city = players.flatMap(p => p.cities).find(c => c.id === tile.cityId) ?? null;
        setTooltip({ screenX: e.clientX, screenY: e.clientY, tile, units, city });
      } else {
        setTooltip(null);
      }
    }

    // ── Middle-button / left-button drag pan ─────────────────────────────────
    // Activate drag once the cursor moves beyond the threshold
    if (!isDragging.current) {
      const totalDx = Math.abs(e.clientX - dragStartPos.current.x);
      const totalDy = Math.abs(e.clientY - dragStartPos.current.y);
      // Only for left or middle button held (buttons bitmask: 1=left, 4=middle)
      if ((e.buttons & 5) !== 0 && totalDx + totalDy > DRAG_THRESHOLD) {
        isDragging.current = true;
        suppressNextClick.current = true;
        setMapCursor('grabbing');
      }
    }
    if (isDragging.current && (e.buttons & 5) !== 0) {
      const dx = (lastPos.current.x - e.clientX) / (HEX_W * camera.zoom);
      const dy = (lastPos.current.y - e.clientY) / (HEX_Y_STEP * camera.zoom);
      panCamera(dx, dy);
      lastPos.current = { x: e.clientX, y: e.clientY };
    } else if (!isDragging.current && e.buttons === 0) {
      setMapCursor('crosshair');
    }
  }, [map, players, camera.zoom, screenToWorld, panCamera]);

  const handleMouseUp = useCallback(() => {
    isDragging.current = false;
    setMapCursor('crosshair');
    // suppressNextClick stays true until handleClick consumes it
  }, []);

  const handleMouseLeave = useCallback(() => {
    isDragging.current = false;
    suppressNextClick.current = false;
    setMapCursor('crosshair');
    setEdgePanDir({ dx: 0, dy: 0 });
    setTooltip(null);
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext('2d');
    if (!canvas || !ctx || !map) return;

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    ctx.save();
    ctx.translate(canvas.width / 2, canvas.height / 2);
    ctx.scale(camera.zoom, camera.zoom);
    const { cx: camCx, cy: camCy } = tileCenter(camera.x, camera.y);
    ctx.translate(-camCx, -camCy);

    // ── Viewport culling ────────────────────────────────────────────────────
    const halfW = (canvas.width  / 2) / camera.zoom / HEX_W   + 1;
    const halfH = (canvas.height / 2) / camera.zoom / HEX_Y_STEP + 1;
    const CULL_PAD = 2;
    const minX = Math.max(0,            Math.floor(camera.x - halfW - CULL_PAD));
    const maxX = Math.min(map.width-1,  Math.ceil (camera.x + halfW + CULL_PAD));
    const minY = Math.max(0,            Math.floor(camera.y - halfH - CULL_PAD));
    const maxY = Math.min(map.height-1, Math.ceil (camera.y + halfH + CULL_PAD));

    for (let ty = minY; ty <= maxY; ty++) {
      for (let tx = minX; tx <= maxX; tx++) {
        const tile = map.tiles.get(`${tx},${ty}`);
        if (!tile) continue;

        const { cx, cy } = tileCenter(tx, ty);

        // ── Terrain base (SVG image clipped to hex, or solid colour fallback) ───
        hexPath(ctx, cx, cy, HEX_SIZE);
        const terrainSrc = ASSET_PATHS.terrain[tile.terrain as keyof typeof ASSET_PATHS.terrain];
        const terrainImg = terrainSrc ? getImg(terrainSrc) : null;
        if (terrainImg) {
          ctx.save();
          hexPath(ctx, cx, cy, HEX_SIZE);
          ctx.clip();
          ctx.drawImage(terrainImg, cx - HEX_W/2, cy - HEX_SIZE, HEX_W, HEX_H);
          ctx.restore();
        } else {
          ctx.fillStyle = TERRAIN_COLORS[tile.terrain] || '#333';
          ctx.fill();
        }

        // ── Thin hex grid line ───────────────────────────────────────────────────
        ctx.strokeStyle = 'rgba(0,0,0,0.22)';
        ctx.lineWidth = 0.6;
        ctx.stroke(); // reuse last hexPath

        // ── Feature overlay ──────────────────────────────────────────────────────
        if (tile.feature) {
          const featureSrc = (ASSET_PATHS.terrain as Record<string, string>)[tile.feature];
          const featureImg = featureSrc ? getImg(featureSrc) : null;
          if (featureImg) {
            ctx.save();
            hexPath(ctx, cx, cy, HEX_SIZE);
            ctx.clip();
            ctx.drawImage(featureImg, cx - HEX_W/2, cy - HEX_SIZE, HEX_W, HEX_H);
            ctx.restore();
          } else if (FEATURE_COLORS[tile.feature]) {
            ctx.fillStyle = FEATURE_COLORS[tile.feature];
            ctx.globalAlpha = 0.45;
            hexPath(ctx, cx, cy, HEX_SIZE);
            ctx.fill();
            ctx.globalAlpha = 1;
          }
        }

        // ── Resource dot ─────────────────────────────────────────────────────────
        if (tile.resource) {
          ctx.fillStyle = '#f1c40f';
          ctx.beginPath();
          ctx.arc(cx, cy, 5, 0, Math.PI * 2);
          ctx.fill();
        }

        // ── City / city-state on tile ────────────────────────────────────────────
        if (tile.cityId) {
          const cityObj = players.flatMap(p => p.cities).find(c => c.id === tile.cityId);
          const csObj   = cityStates.find(cs => cs.id === tile.cityId);
          if (csObj) {
            // City State: purple hex fill + ⭐ icon
            ctx.fillStyle = '#6c3483';
            hexPath(ctx, cx, cy, HEX_SIZE - 2);
            ctx.fill();
            ctx.strokeStyle = '#d7bde2';
            ctx.lineWidth = 1.5;
            ctx.stroke();
            ctx.fillStyle = '#fff';
            ctx.font = `bold ${Math.round(HEX_SIZE * 0.7)}px "Segoe UI Emoji","Apple Color Emoji",sans-serif`;
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText('⭐', cx, cy - 4);
            ctx.font = 'bold 7px sans-serif';
            ctx.textBaseline = 'alphabetic';
            const label = csObj.name.length > 7 ? csObj.name.slice(0, 6) + '…' : csObj.name;
            ctx.fillText(label, cx, cy + HEX_SIZE - 8);
          } else if (cityObj) {
            ctx.fillStyle = '#c0392b';
            hexPath(ctx, cx, cy, HEX_SIZE - 4);
            ctx.fill();
            ctx.fillStyle = '#fff';
            ctx.font = 'bold 9px sans-serif';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText(
              cityObj.name.length > 7 ? cityObj.name.slice(0, 6) + '…' : cityObj.name,
              cx, cy - 4
            );
            ctx.font = '8px sans-serif';
            ctx.fillText(`Pop ${cityObj.population}`, cx, cy + 8);
          }
        }
      }
    }

    // ── Movement range highlight (drawn under units so icons appear on top) ──
    if (selectedUnit && !selectedUnit.hasActed) {
      const range = selectedUnit.movement;
      const reachable = new Set<string>();
      for (let dy = -range; dy <= range; dy++) {
        for (let dx = -range; dx <= range; dx++) {
          if (dx === 0 && dy === 0) continue;
          if (Math.max(Math.abs(dx), Math.abs(dy)) > range) continue;
          const tx2 = selectedUnit.x + dx;
          const ty2 = selectedUnit.y + dy;
          const t = map.tiles.get(`${tx2},${ty2}`);
          if (t && t.terrain !== 'ocean' && t.terrain !== 'mountain' && !t.cityId) {
            reachable.add(`${tx2},${ty2}`);
          }
        }
      }

      // Fill pass: semi-transparent green fill on reachable tiles
      ctx.fillStyle = 'rgba(46, 204, 113, 0.18)';
      reachable.forEach(key => {
        const [rtx, rty] = key.split(',').map(Number);
        const { cx: rcx, cy: rcy } = tileCenter(rtx, rty);
        hexPath(ctx, rcx, rcy, HEX_SIZE - 1);
        ctx.fill();
      });

      // Border pass: bright green outline — only on outer edges (no adjacent reachable neighbour)
      ctx.strokeStyle = '#00ff7f'; // bright spring green — very visible
      ctx.lineWidth = 3;
      ctx.shadowColor = '#00ff7f';
      ctx.shadowBlur = 6;
      reachable.forEach(key => {
        const [rtx, rty] = key.split(',').map(Number);
        const { cx: rcx, cy: rcy } = tileCenter(rtx, rty);
        hexPath(ctx, rcx, rcy, HEX_SIZE - 1);
        ctx.stroke();
      });
      ctx.shadowBlur = 0;
    }

    // ── Units — small icons in a 2×2 grid per tile ──────────────────────────
    // Build per-tile unit stacks
    const tileStacks = new Map<string, Array<{ unit: Unit; isHuman: boolean }>>();
    players.forEach(player => {
      player.units.forEach(unit => {
        const k = `${unit.x},${unit.y}`;
        if (!tileStacks.has(k)) tileStacks.set(k, []);
        tileStacks.get(k)!.push({ unit, isHuman: player.isHuman });
      });
    });

    tileStacks.forEach((stack, key) => {
      const [tx, ty] = key.split(',').map(Number);
      if (tx < minX || tx > maxX || ty < minY || ty > maxY) return;
      const { cx: htx, cy: hty } = tileCenter(tx, ty);
      const tileX = htx - HEX_W / 2;
      const tileY = hty - HEX_H / 2;
      const slots = getUnitSlots(stack.length);
      const visible = Math.min(stack.length, 4);

      for (let i = 0; i < visible; i++) {
        const { unit, isHuman } = stack[i];
        const { ox, oy } = slots[i];
        drawUnitIcon(ctx, unit, tileX, tileY, ox, oy, UNIT_ICON_SIZE,
          selectedUnit?.id === unit.id, isHuman);
      }

      // "+N" overflow badge when more than 4 units share a tile
      if (stack.length > 4) {
        const bx = tileX + HEX_W - 15;
        const by = tileY + HEX_H - 13;
        ctx.fillStyle = 'rgba(0,0,0,0.82)';
        ctx.fillRect(bx, by, 14, 12);
        ctx.fillStyle = '#ffd700';
        ctx.font = 'bold 8px sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText(`+${stack.length - 4}`, bx + 7, by + 9);
      }
    });

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

  }, [map, camera, selectedUnit, players, cityStates, turn, showTileYields, canvasSize, imagesReady]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      switch (e.key) {
        case ' ':
          e.preventDefault();
          if (!aiThinking) endTurn();
          break;
        case 't':
        case 'T':
          toggleTileYields();
          break;
        case 'd':
        case 'D':
          if (e.ctrlKey || e.metaKey) {
            e.preventDefault();
            toggleCheatMode();
          }
          break;
        case 'r':
        case 'R':
          if (!e.ctrlKey && !e.metaKey) setShowTechPanel(v => !v);
          break;
        case 'Escape':
          if (showTechPanel) { setShowTechPanel(false); break; }
          selectUnit(null);
          selectTile(null);
          setContextMenu(null);
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
  }, [endTurn, toggleTileYields, selectUnit, selectTile, panCamera, zoomCamera, toggleCheatMode, showTechPanel]);

  if (phase !== 'playing') return null;

  // Context menu tile/unit helpers
  const ctxTile = contextMenu ? map?.tiles.get(`${contextMenu.worldX},${contextMenu.worldY}`) : null;
  const ctxHumanUnits = contextMenu
    ? (players.find(p => p.id === 0)?.units.filter(u => u.x === contextMenu.worldX && u.y === contextMenu.worldY) ?? [])
    : [];
  const ctxCanMove = selectedUnit && !selectedUnit.hasActed && ctxTile &&
    ctxTile.terrain !== 'ocean' && ctxTile.terrain !== 'mountain' && !ctxTile.cityId &&
    (ctxTile.x !== selectedUnit.x || ctxTile.y !== selectedUnit.y) &&
    Math.max(Math.abs(ctxTile.x - selectedUnit.x), Math.abs(ctxTile.y - selectedUnit.y)) <= selectedUnit.movement;

  return (
    <div ref={containerRef} className="game-container">
      <canvas
        ref={canvasRef}
        width={canvasSize.width}
        height={canvasSize.height}
        onClick={handleClick}
        onContextMenu={handleContextMenu}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseLeave}
        style={{ display: 'block', cursor: mapCursor }}
      />

      {/* ── Top bar ──────────────────────────────────────────────────────── */}
      <div className="top-bar">
        <span className="turn-info">Turn {turn} – Antiquity Age</span>
        {/* Treasury + science progress inline in top bar */}
        {humanPlayer && (
          <span className="topbar-resources">
            <span title={`Treasury: ${humanPlayer.gold} gold`}>💰 {humanPlayer.gold}</span>
            <span title={`Science per turn: +${humanYields.science}`}>🔬 +{humanYields.science}</span>
            {humanPlayer.currentResearch && (
              <span title={`Researching: ${humanPlayer.currentResearch.techId} (${humanPlayer.currentResearch.progress} progress)`}>
                📚 {humanPlayer.currentResearch.techId.replace(/_/g,' ')}
              </span>
            )}
            <span title="Score">⭐ {humanPlayer.score}</span>
          </span>
        )}
        {aiThinking && (
          <span className="ai-thinking-indicator" title="AI opponents are choosing their moves">
            🤖 AI thinking…
          </span>
        )}
        <span className="controls-hint">
          Arrows: Pan &nbsp;|&nbsp; +/−: Zoom &nbsp;|&nbsp; Space: End Turn &nbsp;|&nbsp; R: Research
        </span>
        <span className="seed-display" title="Map seed — share to replay this map">
          🗺 {formatSeed(mapSeed)}
        </span>
        <button
          className={`cheat-toggle-btn${cheatMode ? ' cheat-toggle-btn--active' : ''}`}
          onClick={toggleCheatMode}
          title="Toggle Cheat Panel (Ctrl+D)"
        >🛠</button>
      </div>

      {/* ── Always-visible yields panel (top-right) ─────────────────────── */}
      <div className="yields-panel">
        <span className="yield-item" title="Food per turn">🍎 {humanYields.food}</span>
        <span className="yield-item" title="Production per turn">⚙️ {humanYields.production}</span>
        <span className="yield-item" title="Gold per turn">💰 +{humanYields.gold}</span>
        <span className="yield-item" title="Science per turn">🔬 +{humanYields.science}</span>
        <span className="yield-item" title="Culture per turn">🎭 {humanYields.culture}</span>
      </div>

      {/* ── Unit stack panel (bottom-left) ─────────────────────────────── */}
      <div className={`unit-stack-panel${selectedUnit ? ' unit-stack-panel--visible' : ''}`}>
        {selectedUnit && (
          <>
            <div className="usp-header">
              <span className="usp-pos">({selectedUnit.x}, {selectedUnit.y})</span>
              <span className="usp-count">
                {selectedTileUnits.length} unit{selectedTileUnits.length !== 1 ? 's' : ''}
              </span>
              <button className="usp-close" onClick={() => selectUnit(null)}>✕</button>
            </div>

            <div className="usp-list">
              {selectedTileUnits.map((unit) => (
                <div
                  key={unit.id}
                  className={[
                    'usp-row',
                    unit.id === selectedUnit.id ? 'usp-row--active' : '',
                    unit.hasActed ? 'usp-row--acted' : '',
                  ].join(' ')}
                  onClick={() => selectUnit(unit.id)}
                  title={`Select ${unit.type}`}
                >
                  {/* Colour swatch / icon */}
                  <div className="usp-swatch">
                    {unit.type === 'settler' ? '🏗' :
                     unit.type === 'warrior' ? '⚔' :
                     unit.type === 'scout'   ? '◉' : '●'}
                  </div>

                  {/* Stats */}
                  <div className="usp-info">
                    <div className="usp-name">{unit.type}</div>
                    <div className="usp-bars">
                      <div className="usp-hp-track">
                        <div
                          className="usp-hp-fill"
                          style={{
                            width: `${(unit.health / unit.maxHealth) * 100}%`,
                            background:
                              unit.health / unit.maxHealth > 0.5 ? '#27ae60' :
                              unit.health / unit.maxHealth > 0.25 ? '#e67e22' : '#e74c3c',
                          }}
                        />
                      </div>
                      <span className="usp-mv">
                        {unit.hasActed ? '—' : `👣${unit.movement}/${unit.maxMovement}`}
                      </span>
                    </div>
                  </div>

                  {/* Per-unit action buttons */}
                  <div className="usp-btns">
                    {unit.type === 'settler' && !unit.hasActed && (
                      <button
                        className="usp-btn"
                        title="Found City here"
                        onClick={(e) => {
                          e.stopPropagation();
                          selectUnit(unit.id);
                          setCityNameInput(`City ${turn}`);
                          setCityNameOverlay({ x: unit.x, y: unit.y });
                        }}
                      >🏛</button>
                    )}
                    {!unit.hasActed && (
                      <button
                        className="usp-btn usp-btn--skip"
                        title="Skip this unit's turn"
                        onClick={(e) => {
                          e.stopPropagation();
                          skipUnit(unit.id);
                          // Auto-advance selection to the next ready unit on the same tile
                          const next = selectedTileUnits.find(u => u.id !== unit.id && !u.hasActed);
                          selectUnit(next?.id ?? null);
                        }}
                      >⏭</button>
                    )}
                  </div>
                </div>
              ))}
            </div>

            {!selectedUnit.hasActed && (
              <div className="usp-hint">RClick tile → move selected unit</div>
            )}
          </>
        )}
      </div>

      {/* ── City founding overlay ─────────────────────────────────────────── */}
      {cityNameOverlay && (
        <div className="city-overlay" onClick={(e) => e.stopPropagation()}>
          <div className="city-overlay-box">
            <h3>Found City</h3>
            <p className="city-coords">at ({cityNameOverlay.x}, {cityNameOverlay.y})</p>
            <input
              className="city-name-input"
              type="text"
              value={cityNameInput}
              onChange={(e) => setCityNameInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && cityNameInput.trim()) {
                  foundCity(cityNameInput.trim(), cityNameOverlay.x, cityNameOverlay.y);
                  setCityNameOverlay(null);
                } else if (e.key === 'Escape') {
                  setCityNameOverlay(null);
                }
              }}
              autoFocus
              maxLength={32}
              placeholder="City name…"
            />
            <div className="city-overlay-actions">
              <button
                className="city-btn primary"
                onClick={() => {
                  if (cityNameInput.trim()) {
                    foundCity(cityNameInput.trim(), cityNameOverlay.x, cityNameOverlay.y);
                    setCityNameOverlay(null);
                  }
                }}
              >
                Found
              </button>
              <button className="city-btn" onClick={() => setCityNameOverlay(null)}>
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Hover tooltip ────────────────────────────────────────────────── */}
      {tooltip && (() => {
        const tx = Math.min(tooltip.screenX + 16, window.innerWidth  - 220);
        const ty = Math.min(tooltip.screenY + 16, window.innerHeight - 200);
        const yields = tileManager ? tileManager.calculateTileYield(tooltip.tile) : null;
        return (
          <div className="game-tooltip" style={{ left: tx, top: ty }}>
            <div className="tt-title">
              {tooltip.tile.terrain.charAt(0).toUpperCase() + tooltip.tile.terrain.slice(1)}
              {tooltip.tile.feature ? ` (${tooltip.tile.feature})` : ''}
            </div>
            {tooltip.tile.resource && (
              <div className="tt-row">📦 Resource: <b>{tooltip.tile.resource}</b></div>
            )}
            {tooltip.tile.improvement && tooltip.tile.improvement !== 'none' && (
              <div className="tt-row">🔧 Improvement: <b>{tooltip.tile.improvement}</b></div>
            )}
            {yields && (
              <div className="tt-yields">
                {yields.food       > 0 && <span>🍎{yields.food}</span>}
                {yields.production > 0 && <span>⚙️{yields.production}</span>}
                {yields.gold       > 0 && <span>💰{yields.gold}</span>}
                {yields.science    > 0 && <span>🔬{yields.science}</span>}
                {yields.culture    > 0 && <span>🎭{yields.culture}</span>}
              </div>
            )}
            {tooltip.city && (
              <div className="tt-city">
                🏛 <b>{tooltip.city.name}</b> Pop {tooltip.city.population}
                &nbsp;({tooltip.city.foodStockpile}/{tooltip.city.foodForGrowth} food)
              </div>
            )}
            {cityStates.find(cs => cs.x === tooltip.tile.x && cs.y === tooltip.tile.y) && (() => {
              const cs = cityStates.find(c => c.x === tooltip.tile.x && c.y === tooltip.tile.y)!;
              return (
                <div className="tt-city" style={{ color: '#d7bde2' }}>
                  ⭐ <b>{cs.name}</b> — {cs.type} city state
                  <div style={{ fontSize: '0.78rem', color: '#b2bec3', marginTop: 2 }}>{cs.bonus}</div>
                  {cs.suzerain !== null && <div style={{ fontSize: '0.75rem' }}>Suzerain: Player {cs.suzerain}</div>}
                </div>
              );
            })()}
            {tooltip.units.map(({ unit, playerName, isHuman }) => (
              <div key={unit.id} className={`tt-unit${isHuman ? ' tt-unit--human' : ''}`}>
                {isHuman ? '🔵' : '🔴'} {unit.type} &nbsp;
                ❤️{unit.health} &nbsp; 👣{unit.movement}/{unit.maxMovement}
                {unit.strength > 0 && <> ⚔️{unit.strength}</>}
                <span className="tt-owner"> [{playerName}]</span>
              </div>
            ))}
            <div className="tt-coord">({tooltip.tile.x}, {tooltip.tile.y})</div>
          </div>
        );
      })()}

      {/* ── Right-click context menu ──────────────────────────────────────── */}
      {contextMenu && (() => {
        const mx = Math.min(contextMenu.screenX, window.innerWidth  - 200);
        const my = Math.min(contextMenu.screenY, window.innerHeight - 220);
        const settler = ctxHumanUnits.find(u => u.type === 'settler' && !u.hasActed);
        const anyUnit  = ctxHumanUnits.find(u => !u.hasActed);
        return (
          <div className="context-menu" style={{ left: mx, top: my }}
               onClick={e => e.stopPropagation()}>
            {ctxCanMove && (
              <button className="ctx-item" onClick={() => {
                moveUnit(selectedUnit!.id, { x: contextMenu.worldX, y: contextMenu.worldY });
                setContextMenu(null);
              }}>▶ Move Here</button>
            )}
            {settler && (
              <button className="ctx-item ctx-item--green" onClick={() => {
                setCityNameInput(`City ${turn}`);
                setCityNameOverlay({ x: contextMenu.worldX, y: contextMenu.worldY });
                setContextMenu(null);
              }}>🏛 Found City</button>
            )}
            {anyUnit && (
              <button className="ctx-item" onClick={() => {
                selectUnit(anyUnit.id);
                setContextMenu(null);
              }}>👆 Select Unit</button>
            )}
            {anyUnit && (
              <button className="ctx-item ctx-item--dim" onClick={() => {
                skipUnit(anyUnit.id);
                selectUnit(null);
                setContextMenu(null);
              }}>⏭ Skip Turn</button>
            )}
            {/* Always available: examine tile info */}
            {ctxTile && (
              <button className="ctx-item ctx-item--dim" onClick={() => {
                setContextMenu(null);
                // Show tile info via tooltip at context menu position
                const tile = ctxTile;
                const unitsHere = players.flatMap(p => p.units.filter(u => u.x === tile.x && u.y === tile.y))
                  .map(unit => ({
                    unit,
                    playerName: players.find(p => p.units.some(u => u.id === unit.id))?.name ?? '?',
                    isHuman: !players.find(p => p.units.some(u => u.id === unit.id))?.isAI,
                  }));
                setTooltip({
                  screenX: contextMenu.screenX,
                  screenY: contextMenu.screenY,
                  tile,
                  units: unitsHere,
                  city: players.flatMap(p => p.cities).find(c => c.x === tile.x && c.y === tile.y) ?? null,
                });
              }}>🔍 Examine Tile ({contextMenu.worldX},{contextMenu.worldY})</button>
            )}
            <button className="ctx-item ctx-item--cancel" onClick={() => setContextMenu(null)}>
              ✕ Cancel
            </button>
          </div>
        );
      })()}

      <Minimap map={map} camera={camera} canvasSize={canvasSize} setCamera={setCamera} panCamera={panCamera} />

      {cheatMode && <CheatPanel onClose={toggleCheatMode} />}
      {tutorialActive && <TutorialOverlay />}
      {showTechPanel && <TechTreePanel onClose={() => setShowTechPanel(false)} />}

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
          top: 0; left: 0; right: 0;
          padding: 0.6rem 1rem;
          background: rgba(22, 33, 62, 0.9);
          display: flex;
          justify-content: space-between;
          align-items: center;
          border-bottom: 1px solid rgba(233, 69, 96, 0.3);
          z-index: 20;
        }

        .turn-info { font-size: 1.1rem; font-weight: bold; color: #e94560; }
        .topbar-resources {
          display: flex; gap: 0.9rem; align-items: center;
          font-size: 0.88rem; color: #d0dce8;
        }
        .topbar-resources span { cursor: default; }
        .topbar-resources span:hover { color: #fff; }
        .cheat-toggle-btn {
          background: none;
          border: 1px solid rgba(255,255,255,0.2);
          border-radius: 5px;
          padding: 3px 8px;
          color: #aaa;
          cursor: pointer;
          font-size: 1rem;
        }
        .cheat-toggle-btn:hover { color: #e94560; border-color: #e94560; }
        .cheat-toggle-btn--active { color: #e94560; border-color: #e94560; background: rgba(233,69,96,0.1); }
        .ai-thinking-indicator {
          font-size: 0.85rem; color: #ffcc44; font-weight: 600;
          animation: ai-pulse 1.2s ease-in-out infinite;
        }
        @keyframes ai-pulse { 0%,100% { opacity: 1; } 50% { opacity: 0.35; } }
        .controls-hint { color: #a0a0a0; font-size: 0.8rem; }
        .seed-display {
          font-size: 0.85rem; font-family: monospace; letter-spacing: 0.07em;
          color: #8090a0; user-select: all; cursor: copy;
          padding: 0.2rem 0.5rem;
          border: 1px solid rgba(128,144,160,0.3); border-radius: 4px;
        }
        .seed-display:hover { color: #b0c0d0; border-color: rgba(128,144,160,0.6); }

        /* Yields panel — always visible, top-right */
        .yields-panel {
          position: absolute;
          top: 48px;
          right: 1rem;
          display: flex;
          gap: 0.6rem;
          padding: 0.4rem 0.75rem;
          background: rgba(22, 33, 62, 0.92);
          border: 1px solid rgba(233, 69, 96, 0.25);
          border-radius: 8px;
          z-index: 20;
        }
        .yield-item {
          font-size: 0.9rem;
          color: #e0e0e0;
          display: flex;
          align-items: center;
          gap: 3px;
        }

        /* Unit stack panel */
        .unit-stack-panel {
          position: absolute; bottom: 1rem; left: 1rem;
          background: rgba(22, 33, 62, 0.96);
          border: 1px solid rgba(233, 69, 96, 0.35);
          border-radius: 8px; min-width: 230px; max-width: 290px;
          display: none; z-index: 20;
          box-shadow: 0 4px 20px rgba(0,0,0,0.6);
        }
        .unit-stack-panel--visible { display: block; }

        .usp-header {
          display: flex; align-items: center; gap: 0.5rem;
          padding: 0.4rem 0.65rem 0.3rem;
          border-bottom: 1px solid rgba(255,255,255,0.08);
        }
        .usp-pos   { font-size: 0.72rem; color: #778; font-family: monospace; }
        .usp-count { font-size: 0.75rem; color: #aaa; flex: 1; text-align: right; }
        .usp-close {
          background: none; border: none; color: #e94560; cursor: pointer;
          font-size: 0.85rem; padding: 0 2px; line-height: 1;
        }
        .usp-close:hover { color: #ff6b8a; }

        .usp-list { max-height: 260px; overflow-y: auto; }

        .usp-row {
          display: flex; align-items: center; gap: 0.45rem;
          padding: 0.32rem 0.65rem; cursor: pointer;
          border-bottom: 1px solid rgba(255,255,255,0.04);
          transition: background 0.1s;
        }
        .usp-row:hover       { background: rgba(255,255,255,0.06); }
        .usp-row--active     {
          background: rgba(233,69,96,0.14);
          border-left: 3px solid #e94560;
          padding-left: calc(0.65rem - 3px);
        }
        .usp-row--acted      { opacity: 0.5; }

        .usp-swatch {
          width: 22px; height: 22px; border-radius: 3px;
          background: rgba(52,152,219,0.3);
          display: flex; align-items: center; justify-content: center;
          font-size: 0.78rem; flex-shrink: 0;
        }

        .usp-info    { flex: 1; min-width: 0; }
        .usp-name    { font-size: 0.8rem; color: #dde; text-transform: capitalize; font-weight: 500; }
        .usp-bars    { display: flex; align-items: center; gap: 0.4rem; margin-top: 2px; }
        .usp-hp-track {
          flex: 1; height: 4px; background: rgba(255,255,255,0.1);
          border-radius: 2px; overflow: hidden;
        }
        .usp-hp-fill { height: 100%; border-radius: 2px; transition: width 0.2s; }
        .usp-mv      { font-size: 0.68rem; color: #888; white-space: nowrap; }

        .usp-btns { display: flex; gap: 3px; flex-shrink: 0; }
        .usp-btn  {
          background: rgba(255,255,255,0.1); border: 1px solid rgba(255,255,255,0.15);
          border-radius: 4px; color: #ccc; font-size: 0.78rem; cursor: pointer;
          padding: 2px 5px; line-height: 1.4; transition: background 0.12s;
        }
        .usp-btn:hover       { background: rgba(255,255,255,0.22); color: #fff; }
        .usp-btn--skip       { color: #888; }
        .usp-btn--skip:hover { color: #e67e22; background: rgba(230,126,34,0.2); }

        .usp-hint {
          font-size: 0.7rem; color: #27ae60; font-style: italic;
          padding: 0.28rem 0.65rem;
          border-top: 1px solid rgba(255,255,255,0.06);
        }

        /* Hover tooltip */
        .game-tooltip {
          position: fixed;
          z-index: 200;
          background: rgba(10, 20, 45, 0.97);
          border: 1px solid rgba(233, 69, 96, 0.45);
          border-radius: 8px;
          padding: 0.6rem 0.85rem;
          min-width: 160px;
          max-width: 240px;
          font-size: 0.82rem;
          color: #d0d8e8;
          pointer-events: none;
          box-shadow: 0 4px 16px rgba(0,0,0,0.6);
        }
        .tt-title { font-size: 0.95rem; font-weight: bold; color: #e94560; margin-bottom: 4px; }
        .tt-row   { margin: 2px 0; }
        .tt-yields { display: flex; gap: 8px; margin: 4px 0; flex-wrap: wrap; }
        .tt-yields span { font-size: 0.82rem; }
        .tt-city  { margin-top: 4px; border-top: 1px solid rgba(255,255,255,0.1); padding-top: 4px; }
        .tt-unit  { margin-top: 4px; border-top: 1px solid rgba(255,255,255,0.1); padding-top: 4px; font-size: 0.8rem; }
        .tt-unit--human { color: #74b9ff; }
        .tt-owner { color: #888; font-size: 0.75rem; }
        .tt-coord { margin-top: 4px; color: #555; font-size: 0.75rem; font-family: monospace; }

        /* Right-click context menu */
        .context-menu {
          position: fixed;
          z-index: 300;
          background: rgba(22, 33, 62, 0.97);
          border: 1px solid rgba(233, 69, 96, 0.5);
          border-radius: 8px;
          padding: 0.3rem 0;
          min-width: 160px;
          box-shadow: 0 6px 24px rgba(0,0,0,0.7);
        }
        .ctx-item {
          display: block; width: 100%; text-align: left;
          padding: 0.5rem 1rem; background: none; border: none;
          color: #d0d8e8; font-size: 0.9rem; cursor: pointer;
          transition: background 0.12s;
        }
        .ctx-item:hover { background: rgba(233, 69, 96, 0.25); }
        .ctx-item--green { color: #2ecc71; }
        .ctx-item--dim   { color: #888; }
        .ctx-item--cancel { border-top: 1px solid rgba(255,255,255,0.1); color: #e94560; margin-top: 2px; }

        /* City founding overlay */
        .city-overlay {
          position: absolute; inset: 0;
          display: flex; align-items: center; justify-content: center;
          background: rgba(0,0,0,0.55); z-index: 100;
        }
        .city-overlay-box {
          background: rgba(22, 33, 62, 0.98);
          border: 1px solid rgba(233, 69, 96, 0.5);
          border-radius: 12px; padding: 1.5rem 2rem; min-width: 280px;
          box-shadow: 0 8px 32px rgba(0,0,0,0.6);
        }
        .city-overlay-box h3 { color: #e94560; font-size: 1.3rem; margin-bottom: 0.25rem; }
        .city-coords { color: #666; font-size: 0.8rem; margin-bottom: 1rem; }
        .city-name-input {
          width: 100%; padding: 0.6rem 0.8rem;
          background: #0f3460; color: #eaeaea;
          border: 1px solid rgba(233, 69, 96, 0.4);
          border-radius: 6px; font-size: 1rem;
          margin-bottom: 1rem; box-sizing: border-box;
        }
        .city-name-input:focus { outline: none; border-color: #e94560; }
        .city-overlay-actions { display: flex; gap: 0.75rem; }
        .city-btn {
          flex: 1; padding: 0.6rem; border: none; border-radius: 6px;
          cursor: pointer; font-size: 0.95rem;
          background: #0f3460; color: #eaeaea; transition: background 0.15s;
        }
        .city-btn:hover { background: #1a4a7a; }
        .city-btn.primary { background: #e94560; color: white; }
        .city-btn.primary:hover { background: #ff6b8a; }
      `}</style>
    </div>
  );
}

function Minimap({
  map, camera, canvasSize, setCamera, panCamera,
}: {
  map: MapData | null;
  camera: Camera;
  canvasSize: { width: number; height: number };
  setCamera: (partial: Partial<Camera>) => void;
  panCamera: (dx: number, dy: number) => void;
}) {
  const MINI_W = 200;
  const MINI_H = 150;
  const terrainRef = useRef<HTMLCanvasElement>(null);
  const isDragging = useRef(false);

  // Draw terrain only when the map changes (expensive, not needed on every pan)
  useEffect(() => {
    if (!map) return;
    const canvas = terrainRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    const tw = MINI_W / map.width;
    const th = MINI_H / map.height;
    ctx.clearRect(0, 0, MINI_W, MINI_H);
    map.tiles.forEach((tile) => {
      ctx.fillStyle = TERRAIN_COLORS[tile.terrain] || '#333';
      ctx.fillRect(tile.x * tw, tile.y * th, Math.ceil(tw + 0.5), Math.ceil(th + 0.5));
      // Forest/hills tint
      if (tile.feature === 'forest') { ctx.fillStyle = 'rgba(30,80,30,0.55)'; ctx.fillRect(tile.x * tw, tile.y * th, Math.ceil(tw), Math.ceil(th)); }
      if (tile.feature === 'hills')  { ctx.fillStyle = 'rgba(100,80,50,0.45)'; ctx.fillRect(tile.x * tw, tile.y * th, Math.ceil(tw), Math.ceil(th)); }
    });
  }, [map]);

  if (!map) return null;

  // Compute viewport box geometry (CSS pixels relative to minimap div)
  const tw = MINI_W / map.width;
  const th = MINI_H / map.height;
  const vpW = Math.min(MINI_W, (canvasSize.width  / HEX_W     / camera.zoom) * tw);
  const vpH = Math.min(MINI_H, (canvasSize.height / HEX_Y_STEP / camera.zoom) * th);
  const vpX = Math.max(0, Math.min(MINI_W - vpW, camera.x * tw - vpW / 2));
  const vpY = Math.max(0, Math.min(MINI_H - vpH, camera.y * th - vpH / 2));

  // Click anywhere on minimap to jump camera there
  const handleMinimapMouseDown = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const mx = e.clientX - rect.left;
    const my = e.clientY - rect.top;
    setCamera({ x: mx / tw, y: my / th });
  };

  // Drag the viewport box to pan the big map
  const handleBoxMouseDown = (e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();
    isDragging.current = true;
    let lastX = e.clientX;
    let lastY = e.clientY;

    const onMove = (me: MouseEvent) => {
      if (!isDragging.current) return;
      const dx = (me.clientX - lastX) / tw;
      const dy = (me.clientY - lastY) / th;
      lastX = me.clientX;
      lastY = me.clientY;
      panCamera(dx, dy);
    };
    const onUp = () => {
      isDragging.current = false;
      window.removeEventListener('mousemove', onMove);
      window.removeEventListener('mouseup', onUp);
    };
    window.addEventListener('mousemove', onMove);
    window.addEventListener('mouseup', onUp);
  };

  return (
    <div
      className="minimap"
      onMouseDown={handleMinimapMouseDown}
      style={{ width: MINI_W, height: MINI_H }}
    >
      <canvas ref={terrainRef} width={MINI_W} height={MINI_H} style={{ display: 'block', position: 'absolute', inset: 0 }} />
      {/* CSS viewport indicator — zero-lag sync, draggable */}
      <div
        className="minimap-vp"
        style={{ left: vpX, top: vpY, width: vpW, height: vpH }}
        onMouseDown={handleBoxMouseDown}
        onClick={e => e.stopPropagation()}
      />
      <style>{`
        .minimap {
          position: absolute; bottom: 1rem; right: 1rem;
          border-radius: 4px;
          border: 1px solid rgba(233,69,96,0.5);
          overflow: hidden;
          box-shadow: 0 2px 16px rgba(0,0,0,0.6);
          z-index: 20;
          cursor: crosshair;
          flex-shrink: 0;
        }
        .minimap-vp {
          position: absolute;
          border: 2px solid #e94560;
          background: rgba(233,69,96,0.12);
          box-sizing: border-box;
          cursor: grab;
          pointer-events: auto;
          transition: background 0.1s;
        }
        .minimap-vp:hover  { background: rgba(233,69,96,0.22); }
        .minimap-vp:active { cursor: grabbing; background: rgba(233,69,96,0.28); }
      `}</style>
    </div>
  );
}
