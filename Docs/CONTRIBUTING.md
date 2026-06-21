# Contributing to CivLite

## Prerequisites

| Tool | Version | Notes |
|------|---------|-------|
| Node.js | 18.x LTS or 20.x LTS | [nodejs.org](https://nodejs.org) |
| npm | 9.x+ | Ships with Node.js |
| Git | 2.40+ | [git-scm.com](https://git-scm.com) |

Chrome 110+, Firefox 115+, or Edge 110+ required. IndexedDB must be enabled for save/load.

---

## Development Setup

```bash
git clone <repo-url>
cd CivLite
npm install

# Verify the baseline
npm run typecheck   # should pass
npm run lint        # should pass
npm run build       # should succeed

# Start development server
npm run dev         # http://localhost:3000
```

---

## Development Commands

```bash
npm run dev             # Dev server
npm run build           # Production build → dist/
npm run preview         # Preview production build locally
npm run lint            # Run ESLint
npm run lint:fix        # Auto-fix ESLint issues
npm run typecheck       # TypeScript type checking
npm run test            # Run all unit tests (vitest)
npm run test:watch      # Watch mode
npm run test:coverage   # Coverage report
npm run test:e2e        # Playwright end-to-end tests
```

---

## Project Structure

For the full architecture, directory structure, state management, game loop, and system details, see [ARCHITECTURE.md](./ARCHITECTURE.md).

For the game design specification, see [SPEC.md](./SPEC.md).

For the implementation roadmap and task checklists, see [implementation_blueprint.md](./implementation_blueprint.md).

---

## TDD Approach

Follow Red-Green-Refactor: write a failing test, write minimal code to pass it, then refactor. All new features should have tests before implementation. Run `npm run test` after each change to keep the suite green.

---

## Commit Conventions

Use [Conventional Commits](https://www.conventionalcommits.org/):

```
feat: add combat resolver
fix: resolve city growth calculation
docs: update architecture
refactor: extract unlock manager
test: add integration tests
```

---

## Technical Decisions

| Decision | Choice | Rationale |
|----------|--------|-----------|
| UI Framework | React 19 | Mature, great ecosystem |
| Language | TypeScript 5 | Type safety critical for game logic |
| Build Tool | Vite 8 | Fast dev experience |
| State Management | Zustand + Immer | Lightweight, direct mutation in actions |
| Rendering | Canvas 2D | Works on all devices without WebGL |
| Persistence | IndexedDB (`idb`) | Client-side, handles large game state |
| Unit Testing | Vitest 4 | Fast, native ESM, Vite-compatible |
| E2E Testing | Playwright | Reliable cross-browser automation |
| Hex Grid | Offset coordinates | Even/odd row distinction for neighbor calc |
