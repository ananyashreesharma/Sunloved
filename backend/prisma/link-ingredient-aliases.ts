/**
 * Unrated ingredient rows that are really another, rated ingredient under a different name
 * ("Purified Water", "Glycerine", "Caprylic/​Capric Triglyceride" with an invisible character,
 * "Red 40") get that ingredient's rating, description and source copied onto them, so labels and
 * products that use the other name read correctly. Never changes a row that already has a rating.
 *
 * Uses the same name rules as label reading (candidateNames). Idempotent.
 *   npm run prisma:link-aliases -- --dry-run
 */
import { PrismaClient } from '@prisma/client';
import { candidateNames } from '../src/modules/ingredients/label-parser';

const dryRun = process.argv.includes('--dry-run');

(async () => {
  const prisma = new PrismaClient();
  const unrated = await prisma.ingredient.findMany({ where: { zone: null }, select: { id: true, inciName: true } });
  const rated = await prisma.ingredient.findMany({
    where: { zone: { not: null } },
    select: { id: true, inciName: true, displayName: true, zone: true, safetyRating: true, shortDescription: true, function: true, regulatoryNotes: true, source: true, isFragrance: true, isParaben: true },
  });
  const byName = new Map<string, (typeof rated)[number]>();
  for (const r of rated) {
    for (const n of [r.inciName, r.displayName]) {
      if (!n) continue;
      const k = n.toLowerCase().replace(/[​-‍⁠﻿]/g, '').replace(/\.+$/, '').trim();
      if (!byName.has(k) || r.source === 'manual') byName.set(k, r);
    }
  }
  let linked = 0;
  const examples: string[] = [];
  for (const u of unrated) {
    const names = candidateNames(u.inciName).slice(1);
    const hit = names.map((n) => byName.get(n.toLowerCase().trim())).find(Boolean);
    if (!hit || hit.id === u.id) continue;
    linked++;
    if (examples.length < 25) examples.push(`${u.inciName}  →  ${hit.inciName} (${hit.zone})`);
    if (!dryRun) {
      await prisma.ingredient.update({
        where: { id: u.id },
        data: {
          zone: hit.zone,
          safetyRating: hit.safetyRating,
          shortDescription: hit.shortDescription,
          function: hit.function,
          regulatoryNotes: hit.regulatoryNotes,
          source: hit.source,
          isFragrance: hit.isFragrance,
          isParaben: hit.isParaben,
          displayName: hit.inciName,
        },
      });
    }
  }
  console.log(examples.join('\n'));
  console.log(`${dryRun ? '[dry run] would link' : 'Linked'} ${linked} of ${unrated.length} unrated rows.`);
  await prisma.$disconnect();
})();
