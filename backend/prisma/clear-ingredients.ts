import { PrismaClient } from "@prisma/client"

async function safeDeleteMany<T extends { deleteMany: (args: any) => Promise<{ count: number }> }>(
  model: T,
): Promise<{ count: number }> {
  try {
    return await model.deleteMany({})
  } catch (e: any) {
    // Prisma P2021: table does not exist
    if (e?.code === "P2021") return { count: 0 }
    throw e
  }
}

async function main() {
  const prisma = new PrismaClient()

  try {
    const deletedProductIngredients = await safeDeleteMany(prisma.productIngredient)
    const deletedIngredientConflicts = await safeDeleteMany(prisma.ingredientConflict)
    const deletedProfileOverrides = await safeDeleteMany(prisma.profileIngredientOverride)
    const deletedIngredients = await safeDeleteMany(prisma.ingredient)

    console.log(
      JSON.stringify(
        {
          deletedProductIngredients: deletedProductIngredients.count,
          deletedIngredientConflicts: deletedIngredientConflicts.count,
          deletedProfileIngredientOverrides: deletedProfileOverrides.count,
          deletedIngredients: deletedIngredients.count,
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

