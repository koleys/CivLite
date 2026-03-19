# CIVLite

A browser-based 4X strategy game inspired by Civilization VII, featuring the signature three-age system, legacy paths, turn-based empire building, and multiplayer capabilities.

## Features

### Three-Age System
- **Antiquity Age** (3000 BCE - 1 BCE): Ancient civilizations including Egypt, Greece, Rome, Persia, China, India, and more
- **Exploration Age** (1 CE - 1500 CE): Medieval to Renaissance era with Byzantium, Japan, Mongolia, Spain, France, and others
- **Modern Age** (1500 CE - 2050 CE): Industrial to contemporary era featuring America, Germany, Russia, Brazil, and more

### Victory Conditions
- **Domination Victory**: Control all original capitals of remaining major civilizations
- **Science Victory**: Research all technologies and launch Exoplanet Expedition
- **Cultural Victory**: Achieve Domestic Tourist status in all civilizations
- **Religious Victory**: Establish majority religion in all major civilizations (Antiquity/Exploration only)
- **Diplomatic Victory**: Win 4/6 World Congress votes
- **Age Victory**: Complete all 3 Legacy Path objectives when transitioning ages

### Core Gameplay
- Turn-based empire building with resource management
- Technology and Civic trees with Eureka/Inspiration bonuses
- Government system with policy cards
- City management, district building, and tile improvements
- Combat system with promotions and unit variety
- Barbarian camps and crisis events
- City-states with Suzerain bonuses
- Natural and World Wonders

### Multiplayer Support
- Local hot-seat multiplayer
- Online multiplayer via WebSocket

### Hardware Optimization
Three quality presets optimized for different hardware configurations:
- **Lite**: Canvas 2D, 30fps, 2GB RAM
- **Medium**: WebGL 2x scale, 45fps, 3GB RAM
- **High**: WebGL 4x scale, 60fps, 4GB+ RAM

## Tech Stack

- **Game Engine**: Custom WebGL engine
- **Frontend**: React 18+ with TypeScript
- **State Management**: Zustand or Redux Toolkit
- **Backend**: Node.js with WebSocket/Socket.io
- **Database**: IndexedDB (MVP), PostgreSQL (production)

## Getting Started

```bash
# Install dependencies
npm install

# Run development server
npm run dev

# Build for production
npm run build
```

## Documentation

See [Docs/SPEC.md](./Docs/SPEC.md) for the complete specification document.
