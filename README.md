# Sunloved

Sunloved helps people find **evidence-backed skincare alternatives**: compare formulations, ethics signals, and value without hype. This repository is a **monorepo** with a Next.js storefront and a NestJS API backed by **PostgreSQL** (via Prisma).

---

## Repository layout

| Path | Role |
|------|------|
| `frontend/` | Next.js 14 (App Router), React 18, Tailwind, TanStack Query, Zustand |
| `backend/` | NestJS 10 REST API, Prisma ORM, PostgreSQL |

There is **no shared npm workspace** at the root: install and run **each** app from its own folder.

```bash
git clone <your-repo-url> sunloved
cd sunloved
```

---

## Architecture (high level)

```text
Browser (Next.js)
    │
    │  fetch( NEXT_PUBLIC_API_BASE /api/... )
    ▼
NestJS (global prefix `/api`)
    │
    │  Prisma Client
    ▼
PostgreSQL
```

- **Frontend** renders UI, calls the API over HTTP, and caches server results with **TanStack Query** so lists and detail pages stay fast and consistent.
- **Backend** owns validation (class-validator), consistent JSON shape (`TransformInterceptor`), and errors (`AllExceptionsFilter`).
- **Database** holds catalog, brands, comparisons, pricing hooks, etc. (see `backend/prisma/schema.prisma`).

---

## Design decisions (what we use and why)

### Frontend

| Choice | Why here |
|--------|----------|
| **Next.js App Router** | File-based routes, React Server Components where useful (e.g. home page can fetch initial product hits on the server). |
| **TanStack Query** | Server state (products, prices, comparisons) with caching, deduping, and `initialData` from the server for smoother hydration. Avoids duplicating that logic in Redux/RTK. |
| **Zustand** | Small **client-only UI state** (e.g. header dropdowns, search history) without boilerplate. Not used as a second cache for API data. |
| **`lib/api.ts`** | Single place for `fetch` URLs and env-based `API_BASE`; keeps hooks thin. |
| **`lib/query-keys.ts`** | Stable query keys for React Query—important when invalidating or prefetching. |
| **Tailwind + `globals.css`** | Utility-first styling; global tokens and a few component layers (e.g. mesh page, pastel stack). |

### Home page experience

| Piece | Purpose |
|-------|---------|
| **`MeshParallaxBackground`** (in root layout) | Full-viewport mesh image with scroll-driven zoom/blur/fade (respects `prefers-reduced-motion`). |
| **`sunloved-scroll-story` + `scroll-story.css`** | Optional **scroll-driven** section animations where the browser supports `animation-timeline: scroll()`; otherwise static fallbacks. |
| **`ss-pastel-stack` + `PopularSwapsPastelBackdrop`** | One pastel geometric field behind **Popular Swaps through subscribe**, with a soft top blend into the hero (see `globals.css`). |
| **Section `id`s (`masthead`, `tiles`, …)** | Anchor targets for the in-page story nav. |

### Backend

| Choice | Why here |
|--------|----------|
| **NestJS modules** | Clear boundaries: products, ingredients, comparisons, pricing, admin, scraper. |
| **Prisma** | Type-safe DB access and migrations; `DATABASE_URL` + optional `DIRECT_URL` for pooler vs direct Postgres (e.g. Supabase). |
| **`dotenv` in `main.ts` with `override: true`** | Ensures `backend/.env` wins over a stray `PORT` from the parent shell so local ports stay predictable. |
| **CORS allowlist** | Dev-friendly list of localhost origins in `main.ts`; extend or use `FRONTEND_URL` for deployment. |

---

## Prerequisites

- **Node.js** 18+ (20 LTS recommended)
- **PostgreSQL** reachable from your machine (local Docker, Supabase, etc.)
- **npm** (ships with Node)

---

## Run locally (step by step)

### 1. Database

1. Create an empty PostgreSQL database.
2. Copy env template and fill connection strings:

   ```bash
   cd backend
   cp .env.example .env
   ```

   Set at least **`DATABASE_URL`**. For hosted Postgres (e.g. Supabase), also set **`DIRECT_URL`** to the non-pooler URL for migrations when required.

### 2. Backend API

```bash
cd backend
npm install
npx prisma generate
```

Apply schema to the database (pick one workflow your team uses):

- **Migrations:** `npm run prisma:migrate` (creates/applies migration history), or  
- **Push (quick local sync):** `npx prisma db push`

Optional seed (if your project uses it):

```bash
npm run prisma:seed
```

Start the API:

```bash
npm run start:dev
```

Default port is **`3001`** (`PORT` in `.env` overrides). The HTTP API lives under **`http://localhost:3001/api`**.

### 3. Frontend

```bash
cd frontend
npm install
```

Create **`frontend/.env.local`** (see **`frontend/.env.example`**) so the browser calls the correct API:

```env
NEXT_PUBLIC_API_BASE=http://localhost:3001/api
```

If your API runs on another port, change this to match (and ensure `backend` CORS allows your Next origin, usually `http://localhost:3000`).

Start Next.js:

```bash
npm run dev
```

Open **`http://localhost:3000`**.

---

## Environment variables (cheat sheet)

| Variable | Where | Meaning |
|----------|--------|---------|
| `DATABASE_URL` | `backend/.env` | Postgres connection (often pooler) |
| `DIRECT_URL` | `backend/.env` | Direct Postgres URL for Prisma when needed |
| `PORT` | `backend/.env` | API port (default `3001`) |
| `FRONTEND_URL` | `backend/.env` | Extra CORS origin in production |
| `NEXT_PUBLIC_API_BASE` | `frontend/.env.local` | Base URL for all `lib/api.ts` requests (must include `/api`) |

---

## Useful commands

```bash
# Backend
cd backend && npm run start:dev    # dev API
cd backend && npm run build        # production build
cd backend && npm run lint

# Frontend
cd frontend && npm run dev         # dev server
cd frontend && npm run build       # production build
cd frontend && npm run lint
```

---

## Troubleshooting

| Symptom | Things to check |
|---------|------------------|
| **CORS errors** | API `PORT` and `NEXT_PUBLIC_API_BASE` match; origin is in `main.ts` allowlist or `FRONTEND_URL`. |
| **ECONNREFUSED from Next** | Backend running; URL in `.env.local` has correct port and `/api` suffix. |
| **Prisma / migration errors** | `DATABASE_URL` correct; try `npx prisma db push` for a fresh local DB; run `npx prisma generate` after schema changes. |
| **Wrong API port** | Set `PORT` in `backend/.env` and point `NEXT_PUBLIC_API_BASE` at the same port. |

---

## Further reading inside the repo

- `frontend/THEME.md` — design tokens, Tailwind `sun.*` colors, where to add new styles
- `frontend/styles/sunloved-tokens.css` — CSS variable source of truth
- `backend/prisma/schema.prisma` — data model
- `frontend/lib/api.ts` — HTTP client surface
- `frontend/hooks/use-sunloved-queries.ts` — React Query hooks per domain
- `frontend/styles/scroll-story.css` — scroll-linked home animations (feature-detected)
- `frontend/components/home/*` — home-only section building blocks

---

## License

See package metadata in `frontend/package.json` and `backend/package.json` (backend is marked `UNLICENSED` unless you change it).
