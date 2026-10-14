/**
 * Applies Prisma migrations to Supabase (or any Postgres URL in .env).
 *
 * Prefer pasting the full **URI** from Supabase → Settings → Database → Connection string
 * (URI tab) into DATABASE_URL / DIRECT_URL in .env — avoids host typos.
 *
 * If .env uses {{SUPABASE_DB_PASSWORD}}, pass the real password (special chars OK):
 *   SUPABASE_DB_PASSWORD='your-password' npm run migrate:supabase
 *
 * One-shot without editing .env (password still shell history — use with care):
 *   SUPABASE_DATABASE_URL='postgresql://...' npm run migrate:supabase
 *
 * Password contains @ # : ? / etc.? Use SUPABASE_DB_PASSWORD (encoded automatically)
 * or paste the URI exactly as Supabase shows it (already encoded).
 */
const { spawnSync } = require("child_process")
const fs = require("fs")
const path = require("path")

const root = path.join(__dirname, "..")
const envPath = path.join(root, ".env")

function parseEnvFile(key) {
  if (!fs.existsSync(envPath)) return undefined
  const raw = fs.readFileSync(envPath, "utf8")
  for (const line of raw.split("\n")) {
    const trimmed = line.trim()
    if (!trimmed || trimmed.startsWith("#")) continue
    const prefix = `${key}=`
    if (trimmed.startsWith(prefix)) {
      let v = trimmed.slice(prefix.length).trim()
      if ((v.startsWith('"') && v.endsWith('"')) || (v.startsWith("'") && v.endsWith("'"))) {
        v = v.slice(1, -1)
      }
      return v
    }
  }
  return undefined
}

function injectPassword(url, pass) {
  if (!url || !url.includes("{{SUPABASE_DB_PASSWORD}}")) return url
  if (!pass) return null
  return url.split("{{SUPABASE_DB_PASSWORD}}").join(encodeURIComponent(pass))
}

/** sslmode + longer timeout — helps some networks; safe for Supabase. */
function withPostgresDefaults(urlString) {
  if (!urlString) return urlString
  try {
    const u = new URL(urlString)
    if (!u.searchParams.get("sslmode")) u.searchParams.set("sslmode", "require")
    if (!u.searchParams.get("connect_timeout")) u.searchParams.set("connect_timeout", "60")
    return u.toString()
  } catch {
    return urlString
  }
}

/* Full URI from shell overrides file (paste from Supabase dashboard). */
let databaseUrl =
  process.env.SUPABASE_DATABASE_URL ||
  parseEnvFile("DATABASE_URL") ||
  process.env.DATABASE_URL
let directUrl =
  process.env.SUPABASE_DIRECT_URL || parseEnvFile("DIRECT_URL") || process.env.DIRECT_URL

const pass = process.env.SUPABASE_DB_PASSWORD

databaseUrl = injectPassword(databaseUrl, pass)
directUrl = injectPassword(directUrl, pass)

if (databaseUrl == null || directUrl == null) {
  console.error(`
Could not build database URL (missing password for placeholder).

  Supabase → Project Settings → Database:
  • Copy the **URI** (Connection string) into backend/.env as DATABASE_URL and DIRECT_URL, or
  • Keep {{SUPABASE_DB_PASSWORD}} in .env and run:
      SUPABASE_DB_PASSWORD="your-password" npm run migrate:supabase

  If the password has @ # : / ? — use SUPABASE_DB_PASSWORD (this script encodes it), do not paste raw into the URI.
`)
  process.exit(1)
}

if (!directUrl) directUrl = databaseUrl

databaseUrl = withPostgresDefaults(databaseUrl)
directUrl = withPostgresDefaults(directUrl)

try {
  const u = new URL(databaseUrl)
  console.error(`[migrate:supabase] Target host: ${u.hostname} (port ${u.port || "5432"})`)
} catch {
  console.error("[migrate:supabase] Could not parse DATABASE_URL as a URL — check .env.")
  process.exit(1)
}

const result = spawnSync("npx", ["prisma", "migrate", "deploy"], {
  cwd: root,
  stdio: "inherit",
  env: {
    ...process.env,
    DATABASE_URL: databaseUrl,
    DIRECT_URL: directUrl,
  },
})

if (result.status !== 0) {
  console.error(`
If you see P1001 (can't reach database server):
  • Confirm the Supabase project is **not paused** (Dashboard → resume if needed).
  • Copy **Database Settings → Connection string → URI** again (host must match what Supabase shows).
  • On some networks, direct host db.*.supabase.co only works over IPv6 — use Supabase **IPv4 add-on**
    or try another network / disable VPN.
  • Run from repo: cd Sunloved-2/backend && npm run migrate:supabase

If you see P1000 (auth failed): wrong password, or special characters in the password must be
  URL-encoded in the URI (or use SUPABASE_DB_PASSWORD with {{SUPABASE_DB_PASSWORD}} in .env).
`)
}

process.exit(result.status === null ? 1 : result.status)
