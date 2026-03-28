# CivLite

A browser-based 4X strategy game inspired by Civilization VII — turn-based empire building across three ages on procedurally generated maps.

## Quick Start

```bash
npm install && npm run dev
```

Open [http://localhost:5173](http://localhost:5173).

## Controls

| Input | Action |
|-------|--------|
| Left-click | Select / cycle units |
| Right-click | Move selected unit / context menu |
| Arrow keys | Pan camera |
| + / - | Zoom in / out |
| Mouse wheel | Zoom |
| Space | End turn |
| T | Toggle tile yields overlay |
| Escape | Deselect / close menus |
| Edge hover | Auto-pan |

## Commands

```bash
npm run dev           # Dev server at localhost:5173
npm run build         # Production build → dist/
npm run test          # Run unit tests
npm run test:e2e      # Playwright end-to-end tests
npm run typecheck     # TypeScript type checking
npm run lint          # ESLint
```

## Tech

React 18, TypeScript, Zustand + Immer, Vite, Vitest, Playwright, Canvas 2D, IndexedDB

## Docs

- [Game Specification](Docs/SPEC.md)
- [Architecture](Docs/ARCHITECTURE.md)
- [Contributing](Docs/CONTRIBUTING.md)
