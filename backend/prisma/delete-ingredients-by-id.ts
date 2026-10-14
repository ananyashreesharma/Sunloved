import { PrismaClient } from "@prisma/client"
import fs from "node:fs"

function chunk<T>(arr: T[], size: number): T[][] {
  const out: T[][] = []
  for (let i = 0; i < arr.length; i += size) out.push(arr.slice(i, i + size))
  return out
}

async function main() {
  const fileArgIdx = process.argv.indexOf("--file")
  const file =
    fileArgIdx !== -1 ? process.argv[fileArgIdx + 1] : "prisma/data/delete-ingredient-ids.txt"

  const raw = fs.readFileSync(file, "utf8")
  const ids = raw
    .split(/\r?\n/)
    .map((s) => s.trim().toLowerCase())
    .filter(Boolean)

  const uniqueIds = [...new Set(ids)]
  if (uniqueIds.length === 0) {
    console.log("No IDs found.")
    return
  }

  const prisma = new PrismaClient()
  const BATCH = 500

  let deletedProductIngredients = 0
  let deletedIngredients = 0

  try {
    for (const batch of chunk(uniqueIds, BATCH)) {
      const r1 = await prisma.productIngredient.deleteMany({
        where: { ingredientId: { in: batch } },
      })
      deletedProductIngredients += r1.count
    }

    for (const batch of chunk(uniqueIds, BATCH)) {
      const r2 = await prisma.ingredient.deleteMany({
        where: { id: { in: batch } },
      })
      deletedIngredients += r2.count
    }

    console.log(
      JSON.stringify(
        {
          ingredientIdsRequested: uniqueIds.length,
          deletedProductIngredients,
          deletedIngredients,
        },
        null,
        2,
      ),
    )
  } finally {
    await prisma.$disconnect()
  }
}

main().catch((e) => {
  console.error(e)
  process.exit(1)
})

