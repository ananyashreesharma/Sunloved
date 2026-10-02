import { PrismaClient } from "@prisma/client"

function chunk<T>(arr: T[], size: number): T[][] {
  const out: T[][] = []
  for (let i = 0; i < arr.length; i += size) out.push(arr.slice(i, i + size))
  return out
}

function parseArgs(argv: string[]): Record<string, string | boolean> {
  const out: Record<string, string | boolean> = {}
  for (const a of argv) {
    if (!a.startsWith("--")) continue
    const [k, v] = a.slice(2).split("=")
    out[k] = v === undefined ? true : v
  }
  return out
}

async function main() {
  const args = parseArgs(process.argv.slice(2))
  const apply = args["apply"] === true
  const deleteOrphans = args["delete-orphans"] === true

  const prisma = new PrismaClient()

  try {
    const products = await prisma.product.findMany({
      where: {
        // Only delete connections for products whose ingredients were sourced from Amazon.
        // We intentionally DO NOT use URL matching (e.g. nykaa.com contains "a.co").
        OR: [
          { source: { startsWith: "verified:amazon", mode: "insensitive" as const } },
          { source: { contains: "amazon", mode: "insensitive" as const } },
          { source: { contains: "amazon-in", mode: "insensitive" as const } },
        ],
      },
      select: { id: true, name: true, brand: { select: { name: true } }, url: true, source: true },
    })

    const productIds = products.map((p) => p.id)
    const linkCount = productIds.length
      ? await prisma.productIngredient.count({ where: { productId: { in: productIds } } })
      : 0

    if (!apply) {
      console.log(
        JSON.stringify(
          {
            matchedProducts: products.length,
            matchedProductIngredients: linkCount,
            sample: products.slice(0, 10).map((p) => ({
              productId: p.id,
              brand: p.brand?.name ?? null,
              name: p.name,
              url: p.url ?? null,
              source: p.source ?? null,
            })),
            next: "Re-run with --apply to delete product_ingredients for these products.",
            note: deleteOrphans
              ? "You set --delete-orphans, but dry-run does not delete anything."
              : "By default this ONLY unlinks product_ingredients. Do not pass --delete-orphans unless you explicitly want to delete unused ingredients too.",
          },
          null,
          2,
        ),
      )
      return
    }

    let deletedLinks = 0
    for (const batch of chunk(productIds, 500)) {
      const r = await prisma.productIngredient.deleteMany({ where: { productId: { in: batch } } })
      deletedLinks += r.count
    }

    let deletedOrphanIngredients = 0
    if (deleteOrphans) {
      // Delete ingredients that are no longer referenced by any product_ingredients row.
      // (Safe: does not touch ingredients still used by other products.)
      const r = await prisma.ingredient.deleteMany({
        where: { productIngredients: { none: {} } },
      })
      deletedOrphanIngredients = r.count
    }

    console.log(
      JSON.stringify(
        {
          matchedProducts: products.length,
          deletedProductIngredients: deletedLinks,
          deletedOrphanIngredients,
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

