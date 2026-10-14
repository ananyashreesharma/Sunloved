import { PrismaClient, IngredientZone } from "@prisma/client"
import * as https from "https"
import * as querystring from "querystring"

const prisma = new PrismaClient()

const SEARCH_URL = "api.tech.ec.europa.eu"
const SEARCH_PATH = "/search-api/prod/rest/search"
const API_KEY = "285a77fd-1257-4271-8507-f0c6b2961203"

// Annex II = prohibited (red)
// Annex III/IV/V/VI or cosmeticRestriction = restricted (yellow)
// Found in CosIng with no restrictions = allowed unrestricted (green)
// Not found in CosIng at all = null (unknown)
function zoneFromCosing(found: boolean, annexNo: string[], cosmeticRestriction: string[]): IngredientZone | null {
  if (!found) return null
  if (annexNo.includes("II")) return "red"
  if (annexNo.length > 0 || cosmeticRestriction.length > 0) return "yellow"
  return "green"
}

interface CosingResult {
  found: boolean
  zone: IngredientZone | null
  restriction: string | null
}

async function queryCosingByInci(inciName: string): Promise<CosingResult> {
  // CosIng stores INCI names in ALL CAPS — must uppercase for exact phrase match
  const upperInci = inciName.toUpperCase().trim()
  const qs = querystring.stringify({
    apiKey: API_KEY,
    text: `"${upperInci}"`,
    pageSize: 10,
    languages: "en",
  })

  const raw = await httpPost(`${SEARCH_PATH}?${qs}`)
  const data = JSON.parse(raw)

  for (const result of (data.results ?? [])) {
    const m = result.metadata ?? {}
    const resultInci: string[] = m.inciName ?? m.nameOfCommonIngredientsGlossary ?? []

    const matched = resultInci.some((n: string) => n.toUpperCase() === upperInci)
    if (!matched) continue

    const annexNo: string[] = m.annexNo ?? []
    const cosmeticRestriction: string[] = m.cosmeticRestriction ?? []
    const restriction = [...annexNo.map((a: string) => `Annex ${a}`), ...cosmeticRestriction].join(", ") || null

    return {
      found: true,
      zone: zoneFromCosing(true, annexNo, cosmeticRestriction),
      restriction,
    }
  }

  return { found: false, zone: null, restriction: null }
}

function httpPost(path: string): Promise<string> {
  return new Promise((resolve, reject) => {
    const req = https.request({
      hostname: SEARCH_URL,
      path,
      method: "POST",
      headers: {
        "Content-Length": 0,
        "Accept": "application/json",
        "User-Agent": "Mozilla/5.0",
        "Origin": "https://ec.europa.eu",
        "Referer": "https://ec.europa.eu/growth/tools-databases/cosing/advanced",
      },
      timeout: 15000,
    }, res => {
      const chunks: Buffer[] = []
      res.on("data", c => chunks.push(c))
      res.on("end", () => resolve(Buffer.concat(chunks).toString("utf-8")))
    })
    req.on("error", reject)
    req.on("timeout", () => { req.destroy(); reject(new Error("timeout")) })
    req.end()
  })
}

function sleep(ms: number) { return new Promise(r => setTimeout(r, ms)) }

async function main() {
  const args = process.argv.slice(2)
  const dryRun   = args.includes("--dry-run")
  const limitArg = args.find(a => a.startsWith("--limit="))
  const limit    = limitArg ? parseInt(limitArg.split("=")[1]) : undefined
  const redoAll  = args.includes("--redo")

  console.log(`CosIng scraper | dry=${dryRun} limit=${limit ?? "all"} redo=${redoAll}\n`)

  const where = redoAll ? {} : { zone: null }
  const ingredients = await prisma.ingredient.findMany({
    where,
    select: { id: true, inciName: true },
    take: limit,
    orderBy: { inciName: "asc" },
  })

  console.log(`Processing ${ingredients.length} ingredients…\n`)

  const stats = { green: 0, yellow: 0, red: 0, notInCosing: 0, error: 0 }

  for (let i = 0; i < ingredients.length; i++) {
    const { id, inciName } = ingredients[i]

    if (inciName.length < 3 || inciName.includes(".png") || inciName.includes("_AC_")) {
      continue
    }

    try {
      const result = await queryCosingByInci(inciName)

      if (!result.found) {
        if (i % 10 === 0 || dryRun) console.log(`[${i + 1}/${ingredients.length}] [--?--] ${inciName}`)
        stats.notInCosing++
      } else {
        const z = result.zone!
        const label = `[${z.padEnd(6)}]`
        const restrictionStr = result.restriction ? ` | ${result.restriction}` : ""

        if (i % 10 === 0 || dryRun || z !== "green") {
          console.log(`[${i + 1}/${ingredients.length}] ${label} ${inciName}${restrictionStr}`)
        }

        stats[z]++
        if (!dryRun) {
          await prisma.ingredient.update({
            where: { id },
            data: { zone: z },
          })
        }
      }

    } catch (err) {
      stats.error++
      console.error(`ERROR ${inciName}: ${(err as Error).message}`)
      await sleep(3000)
    }

    await sleep(500)
  }

  console.log(`\nDone. green=${stats.green} yellow=${stats.yellow} red=${stats.red} notInCosing=${stats.notInCosing} errors=${stats.error}`)
  await prisma.$disconnect()
}

main().catch(e => { console.error(e); process.exit(1) })
