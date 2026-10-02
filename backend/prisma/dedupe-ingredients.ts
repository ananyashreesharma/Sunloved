/**
 * Deduplicate ingredient rows that are the same ingredient but stored under
 * multiple text variants (e.g. "1,2-Hexanediol", "1,2- Hexanediol*", "(2.2%)" etc.).
 *
 * Strategy:
 * - Compute a canonical INCI key (safe normalization only).
 * - Pick the "best" row as the keeper (most enriched fields filled).
 * - Re-point product_ingredients rows to keeper (deleting duplicates on unique conflicts).
 * - Move/merge metadata fields where keeper is missing but duplicate has values.
 * - Delete duplicate ingredient rows.
 *
 * Usage (from backend/):
 *   npx ts-node prisma/dedupe-ingredients.ts                # dry-run
 *   npx ts-node prisma/dedupe-ingredients.ts --apply        # perform changes
 *   npx ts-node prisma/dedupe-ingredients.ts --limit=200    # only first N groups
 */
import "dotenv/config";
import { Prisma, PrismaClient } from "@prisma/client";

function parseArgs(argv: string[]): Record<string, string | boolean> {
  const out: Record<string, string | boolean> = {};
  for (const a of argv) {
    if (a.startsWith("--")) {
      const [k, v] = a.slice(2).split("=");
      out[k] = v ?? true;
    }
  }
  return out;
}

function canonicalizeInci(inciName: string): string {
  let s = inciName.trim();
  // Strip common scrape markers
  s = s.replace(/^\*+/, "").replace(/\*+$/, "");
  s = s.replace(/\\+$/, ""); // trailing backslash artifacts
  // Remove trailing concentration/percent markers like "(2.2%)"
  s = s.replace(/\s*\(\s*\d+(\.\d+)?\s*%?\s*\)\s*$/g, "");
  // Normalize spaces around commas/hyphens (common in "1, 2- Hexanediol")
  s = s.replace(/,\s+/g, ",");
  s = s.replace(/-\s+/g, "-");
  s = s.replace(/\s+-\s+/g, "-");
  s = s.replace(/\s{2,}/g, " ");
  return s.trim();
}

function enrichmentScore(i: any): number {
  // Higher = better keeper candidate
  const fields: Array<[string, unknown]> = [
    ["shortDescription", i.shortDescription],
    ["description", i.description],
    ["function", i.function],
    ["zone", i.zone],
    ["safetyRating", i.safetyRating],
    ["comedogenicScore", i.comedogenicScore],
    ["irritancyRating", i.irritancyRating],
    ["aliases", Array.isArray(i.aliases) ? i.aliases.length : 0],
    ["source", i.source],
    ["lastReviewedAt", i.lastReviewedAt],
  ];
  let score = 0;
  for (const [k, v] of fields) {
    if (k === "aliases") score += (v as number) > 0 ? 1 : 0;
    else if (v !== null && v !== undefined && v !== "") score += 1;
  }
  return score;
}

function mergeIngredientData(keeper: any, other: any) {
  // Only fill missing fields; never overwrite keeper's existing info.
  const merged: Record<string, any> = {};
  const pick = (key: string) => {
    if (keeper[key] == null && other[key] != null) merged[key] = other[key];
  };
  pick("displayName");
  pick("shortDescription");
  pick("description");
  pick("zone");
  pick("function");
  pick("safetyRating");
  pick("comedogenicScore");
  pick("irritancyRating");
  pick("sensitivityFlags");
  pick("regulatoryNotes");
  pick("regionNotes");
  pick("source");
  pick("lastReviewedAt");

  // Merge aliases (union)
  const a = new Set<string>(Array.isArray(keeper.aliases) ? keeper.aliases : []);
  for (const x of Array.isArray(other.aliases) ? other.aliases : []) a.add(String(x));
  const aliases = Array.from(a).filter((x) => x && x.length < 80);
  if (aliases.length && aliases.length !== (keeper.aliases?.length ?? 0)) merged.aliases = aliases;

  // Merge boolean flags: if either says true, keep true.
  const bools = [
    "isVegan",
    "isCrueltyFree",
    "isOrganic",
    "isPregnancySafe",
    "isFragrance",
    "isParaben",
    "isSulfate",
    "isAyurvedic",
    "isPhthalate",
    "isTalc",
    "isPfas",
  ];
  for (const b of bools) {
    if (keeper[b] === false && other[b] === true) merged[b] = true;
  }

  return merged;
}

async function main() {
  const args = parseArgs(process.argv.slice(2));
  const apply = args.apply === true;
  const limitGroups = args.limit ? parseInt(String(args.limit), 10) : undefined;

  const prisma = new PrismaClient();

  const ingredients = await prisma.ingredient.findMany({
    select: {
      id: true,
      inciName: true,
      displayName: true,
      shortDescription: true,
      description: true,
      zone: true,
      function: true,
      safetyRating: true,
      comedogenicScore: true,
      irritancyRating: true,
      aliases: true,
      sensitivityFlags: true,
      regulatoryNotes: true,
      regionNotes: true,
      source: true,
      lastReviewedAt: true,
      isVegan: true,
      isCrueltyFree: true,
      isOrganic: true,
      isPregnancySafe: true,
      isFragrance: true,
      isParaben: true,
      isSulfate: true,
      isAyurvedic: true,
      isPhthalate: true,
      isTalc: true,
      isPfas: true,
    },
    orderBy: { inciName: "asc" },
  });

  const groups = new Map<string, any[]>();
  for (const ing of ingredients) {
    const key = canonicalizeInci(ing.inciName);
    const arr = groups.get(key) ?? [];
    arr.push(ing);
    groups.set(key, arr);
  }

  const dupGroups = Array.from(groups.entries()).filter(([, arr]) => arr.length > 1);
  dupGroups.sort((a, b) => b[1].length - a[1].length);

  const slice = limitGroups ? dupGroups.slice(0, limitGroups) : dupGroups;
  console.log(
    `Found ${dupGroups.length} duplicate ingredient group(s). Processing ${slice.length} group(s). apply=${apply}`,
  );

  let movedLinks = 0;
  let deletedIngredients = 0;
  let updatedKeepers = 0;
  let renamedKeepers = 0;

  const safe = async (label: string, fn: () => Promise<unknown>) => {
    try {
      return await fn();
    } catch (e) {
      if (e instanceof Prisma.PrismaClientKnownRequestError && e.code === "P2021") {
        console.warn(`Skipping ${label}: table not found in current database.`);
        return null;
      }
      throw e;
    }
  };

  for (const [canonical, arr] of slice) {
    // Choose keeper: prefer exact canonical name match, otherwise highest enrichment score.
    const sorted = [...arr].sort((x, y) => enrichmentScore(y) - enrichmentScore(x));
    const exact = sorted.find((x) => x.inciName.trim() === canonical);
    const keeper = exact ?? sorted[0];
    const dupes = sorted.filter((x) => x.id !== keeper.id);

    if (dupes.length === 0) continue;

    console.log(`\n[${canonical}] keeper="${keeper.inciName}" dupes=${dupes.length}`);
    for (const d of dupes.slice(0, 5)) console.log(`  - ${d.inciName}`);
    if (dupes.length > 5) console.log(`  - … +${dupes.length - 5} more`);

    if (!apply) continue;

    // Merge data into keeper (fill missing values from dupes)
    let mergedData: Record<string, any> = {};
    for (const d of dupes) {
      mergedData = { ...mergedData, ...mergeIngredientData({ ...keeper, ...mergedData }, d) };
    }
    if (Object.keys(mergedData).length) {
      await prisma.ingredient.update({ where: { id: keeper.id }, data: mergedData });
      updatedKeepers++;
    }

    // Rename keeper to canonical if needed and safe
    if (keeper.inciName.trim() !== canonical) {
      try {
        await prisma.ingredient.update({ where: { id: keeper.id }, data: { inciName: canonical } });
        renamedKeepers++;
        keeper.inciName = canonical;
      } catch (e) {
        // If canonical already exists (shouldn't, since we would have selected exact),
        // ignore rename.
      }
    }

    for (const d of dupes) {
      // Move product_ingredients rows
      const links = await prisma.productIngredient.findMany({
        where: { ingredientId: d.id },
        select: { id: true, productId: true },
      });

      for (const link of links) {
        try {
          await prisma.productIngredient.update({
            where: { id: link.id },
            data: { ingredientId: keeper.id },
          });
          movedLinks++;
        } catch (e) {
          // If (productId, ingredientId) already exists for keeper, delete the duplicate link.
          if (e instanceof Prisma.PrismaClientKnownRequestError && e.code === "P2002") {
            await prisma.productIngredient.delete({ where: { id: link.id } });
            movedLinks++;
            continue;
          }
          throw e;
        }
      }

      // Move profile overrides / conflicts if those tables exist
      await safe("profileIngredientOverride.updateMany", () =>
        prisma.profileIngredientOverride.updateMany({
          where: { ingredientId: d.id },
          data: { ingredientId: keeper.id },
        }),
      );

      await safe("ingredientConflict.updateMany(A)", () =>
        prisma.ingredientConflict.updateMany({
          where: { ingredientAId: d.id },
          data: { ingredientAId: keeper.id },
        }),
      );
      await safe("ingredientConflict.updateMany(B)", () =>
        prisma.ingredientConflict.updateMany({
          where: { ingredientBId: d.id },
          data: { ingredientBId: keeper.id },
        }),
      );

      // Delete duplicate ingredient
      await prisma.ingredient.delete({ where: { id: d.id } });
      deletedIngredients++;
    }
  }

  console.log(`
Done.
- keepers updated: ${updatedKeepers}
- keepers renamed: ${renamedKeepers}
- product links moved/de-duped: ${movedLinks}
- duplicate ingredients deleted: ${deletedIngredients}
`);

  await prisma.$disconnect();
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});

