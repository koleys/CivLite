# Prerequisites - CivLite Development Environment

This document outlines all assets, resources, and dependencies required to start developing and deploy the CivLite project.

---

## 1. Hardware Requirements

### Development Machine

| Component | Minimum | Recommended |
|-----------|---------|-------------|
| **CPU** | Dual-core 2GHz | Quad-core 3GHz+ |
| **RAM** | 8 GB | 16 GB |
| **Storage** | 1 GB free | 5 GB free (faster builds) |
| **Display** | 1280x720 | 1920x1080 |
| **GPU** | Integrated (WebGL 1.0) | Discrete GPU (WebGL 2.0+) |

### Testing Devices

| Device | Purpose |
|--------|---------|
| Desktop/laptop | Primary development |
| Mid-range laptop | Test Medium quality preset |
| Low-end device | Test Lite quality preset |
| Mobile device (optional) | Responsive testing |

---

## 2. Software Requirements

### Required Tools

| Software | Version | Purpose | Download |
|----------|---------|---------|----------|
| **Node.js** | 18.x LTS or 20.x LTS | Runtime | [nodejs.org](https://nodejs.org) |
| **npm** | 9.x+ | Package manager | Ships with Node.js |
| **Git** | 2.40+ | Version control | [git-scm.com](https://git-scm.com) |
| **VS Code** | Latest | IDE (recommended) | [code.visualstudio.com](https://code.visualstudio.com) |

### Required Accounts

| Service | Purpose | Required For | Signup |
|---------|---------|-------------|--------|
| **GitHub** | Repository hosting | Code storage, CI/CD | [github.com](https://github.com) |
| **Vercel** | Frontend deployment | Production hosting | [vercel.com](https://vercel.com) (free tier) |
| **Supabase** | Backend services | Database, auth, storage, realtime | [supabase.com](https://supabase.com) (free tier) |
| **OpenRouter** | LLM AI | AI opponents (optional) | [openrouter.ai](https://openrouter.ai) (free tier) |

---

## 3. Assets Required

### 3.1 Audio Assets

> ⚠️ **Note**: Audio is referenced in SPEC.md (Music, SFX) but not yet implemented. These assets must be created or licensed.

#### Music

| Asset | Duration | Format | Purpose |
|-------|----------|--------|---------|
| **Main Menu Theme** | 2-3 min loop | OGG, MP3 | Main menu screen |
| **Antiquity Age Theme** | 3-5 min loop | OGG, MP3 | Gameplay (Antiquity) |
| **Exploration Age Theme** | 3-5 min loop | OGG, MP3 | Gameplay (Exploration) |
| **Modern Age Theme** | 3-5 min loop | OGG, MP3 | Gameplay (Modern) |
| **Victory Fanfare** | 15-30 sec | OGG, MP3 | Victory screen |
| **Defeat Theme** | 30-60 sec | OGG, MP3 | Defeat screen |

#### Sound Effects

| Asset Category | Count | Format | Purpose |
|----------------|-------|--------|---------|
| **Unit Movement** | ~10 | WAV/MP3 | Unit moves on map |
| **Combat Sounds** | ~20 | WAV/MP3 | Attacks, hits, misses |
| **Building Sounds** | ~15 | WAV/MP3 | Construction, completion |
| **UI Sounds** | ~25 | WAV/MP3 | Clicks, notifications, alerts |
| **Ambient Sounds** | ~5 | WAV/MP3 | City ambiance, nature |
| **Era Transition** | ~3 | WAV/MP3 | Age transition events |
| **Victory/Defeat** | ~5 | WAV/MP3 | Victory/defeat moments |

**Total Audio Estimate**: ~100-150 files, ~200-500 MB

### 3.2 Visual Assets

#### UI Graphics

| Asset | Format | Size/Count | Purpose |
|-------|--------|------------|---------|
| **Logo** | SVG, PNG (1x, 2x, 4x) | ~500x500px | Main menu, favicon |
| **Icons - Yields** | PNG or SVG | 11 icons (32x32 base) | Food, Gold, Science, Culture, Faith, Production, Amenities, Housing, Diplomatic Favor, Power, Era Score |
| **Icons - Units** | PNG or SVG | ~50 icons (32x32 base) | All unit types per era |
| **Icons - Buildings** | PNG or SVG | ~40 icons (32x32 base) | All building types |
| **Icons - Technologies** | PNG or SVG | ~60 icons (32x32 base) | Tech tree icons |
| **Icons - Civics** | PNG or SVG | ~40 icons (32x32 base) | Civic tree icons |
| **Icons - Resources** | PNG or SVG | ~30 icons (32x32 base) | Bonus, luxury, strategic resources |
| **Icons - Actions** | PNG or SVG | ~30 icons (24x24 base) | Attack, fortify, sleep, alert, etc. |
| **Button Sprites** | PNG | 3 states each (normal, hover, pressed) | All UI buttons |
| **Panel Backgrounds** | PNG | Tileable | Modal backgrounds |
| **Progress Bars** | PNG | Tileable | Health bars, production bars |
| **Badge Icons** | PNG or SVG | ~20 | Notifications, achievements |
| **Cursor Icons** | PNG | ~10 | Custom cursors |

#### Map Graphics

| Asset | Format | Size/Count | Purpose |
|-------|--------|------------|---------|
| **Terrain Tiles** | PNG (Lite) / WebGL (Med/High) | ~15 base tiles | Grassland, Plains, Desert, Tundra, Snow, Hills, Mountains, Coast, Lake, Ocean |
| **Tile Features** | PNG | ~10 | Forest, Floodplains, Oasis, Reef |
| **Resource Icons** | PNG or Sprite | ~30 | Wheat, Cattle, Horses, Iron, Oil, etc. |
| **Improvement Sprites** | PNG or Sprite | ~15 | Farm, Mine, Quarry, Camp, Fort, Road, etc. |
| **Natural Wonder Graphics** | PNG / 3D Model | 8 | Mt. Sinai, Lake Victoria, Krakatoa, etc. |
| **World Wonder Graphics** | PNG / 3D Model | 9 | Great Library, Colossus, etc. |
| **City Sprites** | PNG Sprite Sheet | ~50 states | Capital, large, medium, small cities |
| **Unit Sprites** | PNG Sprite Sheet | ~50 units | Warrior, Archer, Settler, etc. |
| **Unit Animations** | PNG Sprite Sheet | ~100 animations | Idle, move (4 dirs), attack, fortify, etc. |
| **Fog of War Overlay** | PNG | Tileable | Fog alpha overlay |
| **Selection Highlight** | PNG | Animated | Selected tile border |
| **Movement Range Overlay** | PNG | Tileable + animated | Blue movement highlight |
| **Attack Range Overlay** | PNG | Tileable | Red attack highlight |

#### UI Panels

| Asset | Format | Size | Purpose |
|-------|--------|------|---------|
| **City Panel Background** | PSD → PNG | ~600x800px | City management modal |
| **Government Panel Background** | PSD → PNG | ~700x600px | Government/policy UI |
| **Tech Tree Panel** | PSD → PNG | ~1200x800px | Technology display |
| **Religion Panel Background** | PSD → PNG | ~600x600px | Religion management |
| **Trade Panel Background** | PSD → PNG | ~500x600px | Trade route management |
| **Diplomacy Panel Background** | PSD → PNG | ~700x500px | Diplomatic interactions |
| **Leader Portraits** | PNG | ~50 portraits | Leader selection, diplomacy |
| **Civilization Banners** | PNG | ~30 | Civ selection, diplomacy |

**Total Visual Estimate**: ~500-1000 files, ~500 MB - 2 GB (depending on quality)

### 3.3 3D Assets (Medium/High Quality Presets)

| Asset | Format | Count | Purpose |
|-------|--------|-------|---------|
| **Terrain Tiles (3D)** | GLTF/GLB | ~15 | Low-poly terrain meshes |
| **Unit Models** | GLTF/GLB | ~50 | 3D unit models |
| **City Models** | GLTF/GLB | ~5 base + variants | City 3D representation |
| **Wonder Models** | GLTF/GLB | ~17 | Natural + World Wonders |
| **Particle Effects** | Custom shader/particles | ~20 | Combat, explosions, building |

---

## 4. Development Dependencies

### Core Dependencies

Install via `npm install`:

```json
{
  "dependencies": {
    "react": "^18.2.0",
    "react-dom": "^18.2.0",
    "zustand": "^4.5.0",
    "immer": "^10.0.0",
    "socket.io-client": "^4.7.0"
  },
  "devDependencies": {
    "typescript": "^5.3.0",
    "vite": "^5.0.0",
    "@types/react": "^18.2.0",
    "@types/react-dom": "^18.2.0",
    "eslint": "^8.56.0",
    "prettier": "^3.1.0",
    "vitest": "^1.2.0",
    "@testing-library/react": "^14.1.0"
  }
}
```

### Additional Dependencies (for Full Features)

```json
{
  "dependencies": {
    "@supabase/supabase-js": "^2.39.0",
    "@supabase/auth-helpers-react": "^0.5.0",
    "react-router-dom": "^6.21.0"
  }
}
```

---

## 5. Supabase + Vercel Deployment Requirements

### 5.1 Supabase Setup

#### Create Supabase Project

1. Go to [supabase.com](https://supabase.com)
2. Create new project
3. Note down credentials from Settings → API:
   - **Project URL**: `https://[project-id].supabase.co`
   - **anon/public key**: `eyJhbGciOiJIUzI1NiIs...`
   - **service_role key**: `eyJhbGciOiJIUzI1NiIs...` (server-side only)

#### Required Supabase Services

| Service | Purpose | Free Tier Limits |
|---------|---------|------------------|
| **PostgreSQL** | Game saves, leaderboards, user data | 500 MB |
| **Auth** | Player authentication | 50k MAU |
| **Storage** | Profile pictures, replay files | 1 GB |
| **Realtime** | Multiplayer sync | 200 concurrent |

#### Database Schema (for Multiplayer)

```sql
-- Users table
CREATE TABLE profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id),
  username TEXT UNIQUE NOT NULL,
  avatar_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Game saves (cloud saves)
CREATE TABLE saves (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id),
  save_data JSONB NOT NULL,
  save_name TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Leaderboards
CREATE TABLE leaderboards (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id),
  score INTEGER NOT NULL,
  game_mode TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable Row Level Security (RLS)
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE saves ENABLE ROW LEVEL SECURITY;
ALTER TABLE leaderboards ENABLE ROW LEVEL SECURITY;
```

### 5.2 Vercel Setup

#### Create Vercel Project

1. Install Vercel CLI: `npm i -g vercel`
2. Or connect GitHub repo at [vercel.com](https://vercel.com)

#### Environment Variables (Vercel Dashboard)

| Variable | Value | Purpose |
|----------|-------|---------|
| `VITE_SUPABASE_URL` | `https://xxx.supabase.co` | Supabase connection |
| `VITE_SUPABASE_ANON_KEY` | `eyJhbGci...` | Supabase anon key |
| `VITE_APP_URL` | `https://your-app.vercel.app` | App URL for CORS |

### 5.3 Local Development Environment

Create `.env.local` file (DO NOT COMMIT):

```env
# Supabase
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key
VITE_SUPABASE_SERVICE_KEY=your-service-role-key

# Optional
VITE_APP_URL=http://localhost:5173
```

### 5.4 Deployment Checklist

- [ ] Create Supabase project
- [ ] Set up database tables
- [ ] Configure RLS policies
- [ ] Create Vercel project
- [ ] Link repository to Vercel
- [ ] Add environment variables
- [ ] Configure custom domain (optional)
- [ ] Set up CI/CD pipeline
- [ ] Configure build command: `npm run build`
- [ ] Configure output directory: `dist`

---

## 6. Third-Party Services & APIs

| Service | Purpose | Cost | Setup |
|---------|---------|------|-------|
| **OpenRouter** | LLM AI opponents | Free tier available | [openrouter.ai](https://openrouter.ai) |
| **Cloudflare** (optional) | CDN, DDoS protection | Free tier available | [cloudflare.com](https://cloudflare.com) |
| **Sentry** (optional) | Error tracking | Free tier available | [sentry.io](https://sentry.io) |

---

## 7. Project Setup Checklist

### Step 1: Environment Setup

```bash
# Install Node.js 18+ (use nvm if needed)
nvm install 18
nvm use 18

# Verify
node --version  # 18.x.x
npm --version   # 9.x.x

# Install Git (if not installed)
# Download from git-scm.com

# Clone repository
git clone <repo-url>
cd CivLite
```

### Step 2: Install Dependencies

```bash
npm install
```

### Step 3: Configure Environment

```bash
# Create .env.local
cp .env.example .env.local

# Edit with your credentials:
# - VITE_SUPABASE_URL
# - VITE_SUPABASE_ANON_KEY
```

### Step 4: Verify Build

```bash
npm run typecheck   # Should pass
npm run lint         # Should pass
npm run build        # Should succeed
```

### Step 5: Start Development

```bash
npm run dev          # Start at localhost:5173
```

---

## 8. Asset Creation Workflow

### For Placeholder Assets (Development)

1. Use colored rectangles/shapes for units
2. Use basic terrain colors for tiles
3. Use text for icons initially
4. Replace with final assets before launch

### For Final Assets (Production)

| Asset Type | Recommended Tools | Export Format |
|------------|-------------------|---------------|
| **2D Sprites** | Aseprite, Photoshop | PNG (1x, 2x, 4x) |
| **UI Graphics** | Figma, Sketch | SVG, PNG |
| **3D Models** | Blender | GLTF/GLB |
| **Audio** | Audacity, FL Studio | OGG, MP3, WAV |
| **Icons** | Figma, Illustrator | SVG |

---

## 9. Browser Requirements

| Browser | Min Version | WebGL | IndexedDB | WebSocket |
|---------|------------|-------|----------|-----------|
| Chrome | 110+ | 2.0 | ✅ | ✅ |
| Firefox | 115+ | 2.0 | ✅ | ✅ |
| Safari | 16+ | 2.0 | ✅ | ✅ |
| Edge | 110+ | 2.0 | ✅ | ✅ |

---

## 10. Troubleshooting

### Node.js Version Issues
```bash
# Use nvm to manage versions
nvm install 18
nvm use 18
```

### npm Install Fails
```bash
rm -rf node_modules package-lock.json
npm cache clean --force
npm install
```

### Supabase Connection Issues
- Verify environment variables
- Check RLS policies
- Test in Supabase dashboard

### Build Fails
```bash
npm run lint:fix
npm run typecheck
```

---

## 11. Free Deployment Recommendations

### Frontend Hosting (Choose One)

| Platform | Free Tier | Bandwidth | Custom Domain | Notes |
|----------|-----------|-----------|--------------|-------|
| **Vercel** | Hobby | 100GB/mo | ✅ | Best for Next.js, but works with Vite. Auto-deploys from GitHub. |
| **Netlify** | Starter | 100GB/mo | ✅ | Drag-and-drop deploy. Good free SSL. |
| **Cloudflare Pages** | Free | Unlimited | ✅ | Fast CDN, unlimited bandwidth. Best for static sites. |
| **GitHub Pages** | Free | 100GB soft limit | ✅ (with custom domain) | Direct GitHub integration. No server-side features. |
| **Render** | Free | 100GB | ✅ | Sleeps after 15min inactivity (slow wake). |

**Recommended**: **Cloudflare Pages** or **Vercel**

#### Cloudflare Pages (Best Free Option)
```bash
# Install Wrangler CLI
npm install -g wrangler

# Deploy directly
wrangler pages deploy dist
```

#### Vercel
```bash
# Install Vercel CLI
npm i -g vercel

# Deploy
vercel
```

### Backend/Database (Choose One)

| Platform | Free Tier | Database | Auth | Storage | Realtime | Notes |
|----------|-----------|----------|------|---------|---------|-------|
| **Supabase** | Free | 500MB | ✅ (50k MAU) | 1GB | ✅ (200 concurrent) | Best Firebase alternative. PostgreSQL-based. |
| **Firebase** | Spark | 1GB | ✅ (Unlimited) | 5GB | ✅ | Google-owned. Good for auth + realtime. |
| **PlanetScale** | Starter | 5GB | ❌ | ❌ | ❌ | MySQL. Serverless. Good for reads. |
| **MongoDB Atlas** | Free | 512MB | ✅ | ❌ | ❌ | Document database. Mongoose-friendly. |
| **Turso** | Free | 9GB total | ❌ | ❌ | ❌ | SQLite at edge. Very fast reads. |
| **Convex** | Free | 10GB | ✅ | ✅ | ✅ | Purpose-built for real-time games. Best DX. |

**Recommended**: **Supabase** (most features) or **Convex** (best for games)

#### Supabase (Recommended for Games)
- PostgreSQL for structured game data
- Built-in auth with OAuth
- Realtime subscriptions for multiplayer
- Row Level Security for user data protection

#### Convex (Alternative for Real-time Games)
- Built specifically for real-time applications
- Automatic conflict resolution
- TypeScript-first
- Excellent for turn-based games

### AI Backend (LLM Opponents)

| Platform | Free Tier | Models | Notes |
|----------|-----------|--------|-------|
| **OpenRouter** | Free credits | Many | Best variety. CivLite's designed choice. |
| **Groq** | Free | Llama, Mixtral | Fast inference. Good free tier. |
| **Together AI** | $5 free credit | Many | Pay-as-you-go after. |
| **Ollama** | Free (self-hosted) | Local models | Run Llama locally. No API needed. |
| **Perplexity API** | Free | Sonar | Good for simple AI. |

**Recommended**: **OpenRouter** (variety) or **Ollama** (fully free, local)

#### Ollama (Completely Free, Local)
```bash
# Install Ollama
curl -fsSL https://ollama.com/install.sh | sh

# Pull a model
ollama pull llama3.2

# Use in your AI integration
```

### Complete Free Stack Examples

#### Option 1: Zero-Cost Stack (Fully Free)
```
Frontend: GitHub Pages / Cloudflare Pages
Database: LocalStorage + IndexedDB (client-side)
AI: Ollama (local) or Built-in Random AI
Cost: $0/month
```
**Best for**: Solo development, prototyping, learning

#### Option 2: Modern Free Stack
```
Frontend: Vercel (free)
Database: Supabase (free tier)
AI: OpenRouter (free credits) or Ollama
CDN: Cloudflare (free)
Cost: $0/month (up to limits)
```
**Best for**: Production games with cloud saves

#### Option 3: Scalable Free Stack
```
Frontend: Cloudflare Pages (unlimited)
Database: Supabase (free tier) or Convex
Auth: Supabase Auth / Clerk (free tier)
AI: OpenRouter + Ollama fallback
Realtime: Supabase Realtime / Pusher (free tier)
Error Tracking: Sentry (free tier)
Cost: $0/month (up to limits)
```
**Best for**: Public release with multiplayer

---

## 12. Cost Estimates (Monthly)

| Service | Free Tier | Paid (if needed) |
|---------|-----------|------------------|
| **Vercel** | Hobby (100GB bandwidth) | Pro: $20/mo |
| **Netlify** | Starter (100GB) | Pro: $19/mo |
| **Cloudflare Pages** | Unlimited | Pro: $20/mo |
| **Supabase** | 500MB DB, 1GB Storage | Pro: $25/mo |
| **Convex** | 10GB | Pay-as-you-go |
| **OpenRouter** | Free credits | Pay-as-you-go |
| **Ollama** | Free (local) | - |
| **Domain** | - | ~$10-15/yr |
| **Total** | Free to start | ~$45-65/mo |

---

## 13. File Checklist Summary

### Required for MVP (No Backend)
- [x] `npm install` all dependencies
- [ ] Placeholder sprites (can be basic shapes)
- [ ] Placeholder audio (can be silent)
- [ ] GitHub account
- [ ] Vercel account (for deployment)

### Required for Full Game
- [ ] 100+ audio files (music, SFX)
- [ ] 500+ visual assets (sprites, icons, tiles)
- [ ] 50+ 3D models (for Medium/High presets)
- [ ] Supabase project (for multiplayer/cloud saves)
- [ ] Custom domain (optional)

### Required for Production
- [ ] All placeholder assets replaced
- [ ] CDN setup (Cloudflare or Vercel Edge)
- [ ] Error monitoring (Sentry)
- [ ] Analytics (optional)
- [ ] Privacy policy / terms of service
