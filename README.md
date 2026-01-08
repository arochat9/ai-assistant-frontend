# AI Assistant Frontend

Monorepo for AI Assistant web application deployed to Fly.io.

## Architecture

**Single-app deployment:** Express backend serves the built React frontend as static files.

```
├── middleware/          # Express backend (Node.js + TypeScript)
├── web-frontend/        # React + Vite frontend (TypeScript)
└── shared/              # Shared types/schemas (ESM modules)
```

### How it works
1. Frontend builds to static files (`web-frontend/dist/`)
2. Express serves those files + handles `/api/*` routes
3. Same server = no CORS issues, single deployment

## Deployment

### Automatic via GitHub Actions
Push to `master` → GitHub Actions builds & deploys to Fly.io automatically.

**Required GitHub Secrets:**
- `FOUNDRY_TOKEN` - NPM registry authentication (build-time)
- `FLY_API_TOKEN` - Fly.io deployment (`fly auth token`)

### Build Process (Docker)
1. Build `shared/` package (ESM modules)
2. Install & build `web-frontend/` (Vite → static files)
3. Install & build `middleware/` (TypeScript → Node.js)
4. Express serves frontend + API routes on port 3000

**Key files:**
- `middleware/Dockerfile` - Multi-stage build
- `middleware/fly.toml` - Fly.io config
- `.github/workflows/deploy.yml` - Auto-deploy on push

## Local Development

### Run backend
```bash
cd middleware
npm run dev  # Runs on http://localhost:3000
```

### Run frontend
```bash
cd web-frontend
npm run dev  # Runs on http://localhost:5173
```

**Environment:**
- `web-frontend/.env` contains `VITE_API_URL=http://localhost:3000`
- In production, API calls use relative URLs (same server)

### Shared package
Any changes to `shared/` require rebuilding:
```bash
cd shared
npm run build
```

Or run in watch mode (auto-rebuilds on changes):
```bash
cd shared
npm run watch
```

## Important Notes

- **ESM modules:** `shared/` outputs ESM (requires `.js` extensions in imports)
- **Build-time secrets:** `FOUNDRY_TOKEN` is injected during Docker build via `--build-secret`
- **Runtime secrets:** Set in Fly.io dashboard (not in GitHub)
- **Port binding:** Express listens on `0.0.0.0:3000` (required by Fly.io)
