# Sunloved

Sunloved helps people find **evidence-backed skincare alternatives**: compare formulations, ethics signals, and value without hype. This repository is a **monorepo** with a Next.js storefront, a NestJS API backed by **PostgreSQL** (via Prisma), and a native mobile app.

---

## Repository layout

| Path | Role |
|------|------|
| `frontend/` | Next.js 14 (App Router), React 18, Tailwind, TanStack Query, Zustand |
| `backend/` | NestJS 10 REST API, Prisma ORM, PostgreSQL |
| `mobile/` | SkinLens — Expo/React Native app (routine tracking + ingredient checking). See `mobile/README.md`. |

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

1. Create an empty PostgreSQL database (e.g. [Supabase](https://supabase.com) → New project).
2. Copy env template and fill connection strings:

   ```bash
   cd backend
   cp .env.example .env
   ```

   Set **`DATABASE_URL`** and **`DIRECT_URL`**. For Supabase, use the **direct** connection string (host `db.<project-ref>.supabase.co`, port **5432**, `?sslmode=require`) for both when you run migrations from your machine; the pooler URL (port **6543**) is optional for app runtime if you prefer it, but Prisma migrate is most reliable with a direct session URL.

### 2. Backend API

```bash
cd backend
npm install
npx prisma generate
```

Apply the schema using **migrations** (recommended for any shared or hosted DB):

| Situation | Command |
|-----------|---------|
| **First time / CI / Supabase** | `npm run prisma:deploy` — applies existing SQL in `backend/prisma/migrations` |
| **Local dev, changing `schema.prisma`** | `npm run prisma:migrate` or `npm run prisma:migrate:dev -- --name init` — creates a new migration and applies it |
| **Quick prototype only** | `npx prisma db push` — no migration files (avoid for production) |

Optional seed (sample catalog for Popular Swaps / search):

```bash
npm run prisma:seed
```

Verify the database is wired:

```bash
npm run start:dev
# In another terminal:
curl -s http://localhost:3001/api/health/db
```

You should see `database: "connected"` inside the JSON `data` object.

The SQL under `supabase/migrations/` mirrors the same schema for Supabase CLI or the SQL Editor; **do not** run it on a database that already had `prisma migrate deploy` applied.

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

## Deploying the backend

`backend/render.yaml` is a ready-to-use [Render](https://render.com) blueprint (free tier works for launch). To deploy:

1. Push this repo to GitHub (if not already).
2. On Render: **New → Blueprint**, point it at the repo — it reads `backend/render.yaml` and creates the web service automatically.
3. Fill in the env vars Render leaves blank in its dashboard (**Environment** tab): `DATABASE_URL`/`DIRECT_URL` (your Supabase direct connection string, `?sslmode=require`), `JWT_SECRET`/`JWT_REFRESH_SECRET` (`openssl rand -hex 32`, two different values), `INTERNAL_API_KEY` (matches `frontend/.env`'s value), `FRONTEND_URL` (your deployed frontend's origin, for CORS), and `RESEND_API_KEY`/`RESEND_FROM_EMAIL` (see below — without these, mobile login's email code never actually reaches anyone). `TWILIO_*`/`OPENAI_API_KEY` are optional.
4. Deploy. The blueprint runs `prisma migrate deploy` before boot, so the schema applies automatically; health check is `/api/health`.
5. Point `frontend/.env.local`'s `NEXT_PUBLIC_API_BASE` and the mobile app's `EXPO_PUBLIC_API_BASE` at the deployed URL (`https://<service>.onrender.com/api`).

**Email delivery (required for mobile login to actually work in production):** sign up at [resend.com](https://resend.com), verify a sending domain (or use their shared `onboarding@resend.dev` sender while testing), create an API key, and set `RESEND_API_KEY`/`RESEND_FROM_EMAIL`. Without these set, the backend still runs, but OTP codes only get logged server-side — no email ever reaches a real user (`backend/src/modules/auth/auth.service.ts`'s `sendEmailOtp`).

---

## Useful commands

```bash
# Backend
cd backend && npm run start:dev    # dev API
cd backend && npm run build        # production build
cd backend && npm run lint
# Supabase migrate (password from dashboard → Settings → Database):
#   cd backend && SUPABASE_DB_PASSWORD="…" npm run migrate:supabase

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
| **Prisma / migration errors** | `DATABASE_URL` / `DIRECT_URL` correct (Supabase: direct `:5432`); run `npm run prisma:deploy`; `npx prisma generate` after schema changes; check `/api/health/db`. |
| **P1001 can’t reach Supabase** | Project not paused; paste URI from Supabase (don’t guess host). Some networks need IPv4 add-on or no VPN. Use `cd …/backend && npm run migrate:supabase`. |
| **Password has `@`** | Don’t put it raw inside the URI — use `{{SUPABASE_DB_PASSWORD}}` + `SUPABASE_DB_PASSWORD` env, or paste Supabase’s full copied URI. |
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

## Mobile app (SkinLens)

`mobile/` is a separate Expo/React Native app — not a client of the `frontend/`+`backend/` pair above, it talks to `backend/` directly over HTTP. See `mobile/README.md` for setup and an overview of how it's put together (guest-first local storage, email OTP login, i18n).

```bash
cd mobile
npm install
npx expo start
```

---

## License

See package metadata in `frontend/package.json` and `backend/package.json` (backend is marked `UNLICENSED` unless you change it).
