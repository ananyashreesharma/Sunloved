import { PrismaClient, IngredientZone } from "@prisma/client"
import * as https from "https"

const prisma = new PrismaClient()

// ─── Helpers ──────────────────────────────────────────────────────────────────

function slugify(inci: string): string {
  return inci
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, " ")  // commas, parens, slashes → space
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .trim()
    .replace(/^-|-$/g, "")
}

function isGarbage(name: string): boolean {
  return (
    name.includes(".png") || name.includes(".jpg") || name.includes(".webp") ||
    name.includes("_AC_") || name.startsWith("'") || name.startsWith("(") ||
    name.length < 3 || /^\d+_/.test(name)
  )
}

function decodeEntities(s: string): string {
  return s
    .replace(/&nbsp;/g, " ").replace(/&amp;/g, "&").replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'").replace(/&rsquo;/g, "'").replace(/&lsquo;/g, "'")
    .replace(/&ldquo;/g, '"').replace(/&rdquo;/g, '"').replace(/&rsquo;/g, "'")
    .replace(/&hellip;/g, "…").replace(/&mdash;/g, "—").replace(/&ndash;/g, "–")
}

function stripTags(s: string): string {
  return decodeEntities(s.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim())
}

const BADGE_ZONE: Record<string, IngredientZone> = {
  superstar: "green",
  goodie:    "green",
  icky:      "red",
  "so-so":   "yellow",
  mixed:     "yellow",
  caution:   "yellow",
}

const SKIP_RE = /also.called|what.it.does|official cosing|comedogenicit|irritancy:|^[a-z -]+ (superstar|goodie|icky|so.so|mixed)\b/i
const JUNK_RE  = /cookie|copyright|privacy policy|terms of use|all rights/i

interface ParseResult {
  zone: IngredientZone | null
  shortDescription: string | null
}

function parsePage(html: string): ParseResult {
  // strip scripts / styles
  const clean = html
    .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, "")
    .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, "")

  const paras = [...clean.matchAll(/<p[^>]*>([\s\S]*?)<\/p>/gi)].map(m => stripTags(m[1]))

  // Badge: look inside the first 6 paras for a zone keyword
  let zone: IngredientZone | null = null  // "green" | "yellow" | "red"
  for (const p of paras.slice(0, 6)) {
    for (const [kw, z] of Object.entries(BADGE_ZONE)) {
      if (new RegExp(`\\b${kw}\\b`, "i").test(p)) { zone = z; break }
    }
    if (zone) break
  }

  // Description: first para that reads like real prose (>80 chars, no metadata patterns)
  const shortDescription = paras.find(
    p => p.length > 80 && !SKIP_RE.test(p) && !JUNK_RE.test(p)
  ) ?? null

  return { zone, shortDescription: shortDescription ? shortDescription.slice(0, 500) : null }
}

// ─── Fetch with basic retry ────────────────────────────────────────────────────

async function fetchPage(url: string): Promise<{ status: number; body: string }> {
  return new Promise((resolve, reject) => {
    const req = https.get(url, {
      headers: {
        "User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36",
        "Accept": "text/html",
      },
      timeout: 12000,
    }, res => {
      const chunks: Buffer[] = []
      res.on("data", c => chunks.push(c))
      res.on("end", () => resolve({ status: res.statusCode ?? 0, body: Buffer.concat(chunks).toString("utf-8") }))
    })
    req.on("error", reject)
    req.on("timeout", () => { req.destroy(); reject(new Error("timeout")) })
  })
}

function sleep(ms: number) { return new Promise(r => setTimeout(r, ms)) }

// ─── Main ─────────────────────────────────────────────────────────────────────

async function main() {
  const args = process.argv.slice(2)
  const dryRun   = args.includes("--dry-run")
  const limitArg = args.find(a => a.startsWith("--limit="))
  const limit    = limitArg ? parseInt(limitArg.split("=")[1]) : undefined
  const skipDone = !args.includes("--redo")   // skip ingredients that already have a description

  console.log(`INCIDecoder scraper | dry=${dryRun} limit=${limit ?? "all"} skipDone=${skipDone}\n`)

  const where = skipDone ? { shortDescription: null } : {}
  const ingredients = await prisma.ingredient.findMany({
    where,
    select: { id: true, inciName: true },
    take: limit,
    orderBy: { inciName: "asc" },
  })

  console.log(`Fetching ${ingredients.length} ingredients…\n`)

  const stats = { ok: 0, noDesc: 0, notFound: 0, error: 0 }

  for (let i = 0; i < ingredients.length; i++) {
    const { id, inciName } = ingredients[i]

    if (isGarbage(inciName)) {
      console.log(`[${i + 1}/${ingredients.length}] SKIP garbage: ${inciName}`)
      continue
    }

    const slug = slugify(inciName)
    const url  = `https://incidecoder.com/ingredients/${slug}`

    try {
      const { status, body } = await fetchPage(url)

      if (status === 404) {
        stats.notFound++
        if (i % 50 === 0 || dryRun) console.log(`[${i + 1}/${ingredients.length}] 404  ${inciName}`)
        await sleep(700)
        continue
      }

      const { zone, shortDescription } = parsePage(body)

      const label = zone
        ? `[${zone.padEnd(5)}]`
        : "[?    ]"

      if (i % 10 === 0 || dryRun) {
        console.log(`[${i + 1}/${ingredients.length}] ${label} ${inciName}`)
        if (shortDescription) console.log(`         ${shortDescription.slice(0, 120)}`)
      }

      if (shortDescription || zone) {
        stats.ok++
        if (!dryRun) {
          await prisma.ingredient.update({
            where: { id },
            data: {
              ...(shortDescription ? { shortDescription } : {}),
              ...(zone ? { zone } : {}),
            },
          })
        }
      } else {
        stats.noDesc++
      }

    } catch (err) {
      stats.error++
      console.error(`ERROR ${inciName}: ${(err as Error).message}`)
      await sleep(2000) // back off on errors
    }

    // Rate-limit: 1 request/sec to be respectful
    await sleep(1000)
  }

  console.log(`\nDone. ok=${stats.ok} noDesc=${stats.noDesc} notFound=${stats.notFound} error=${stats.error}`)
  await prisma.$disconnect()
}

main().catch(e => { console.error(e); process.exit(1) })
