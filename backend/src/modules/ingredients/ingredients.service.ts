import { BadRequestException, Injectable } from '@nestjs/common';
import type { Ingredient } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import { candidateNames, splitLabel } from './label-parser';

export interface AnalyzedIngredient {
  name: string;
  scientificName?: string;
  category?: string;
  function?: string;
  isIrritant: boolean;
  fungalAcneSafe: boolean;
  found: boolean; // Whether ingredient was found in DB
  /** DB traffic-light zone when present */
  zone?: string;
  safetyRating?: string;
  shortDescription?: string;
  isParaben?: boolean;
  isFragrance?: boolean;
  isSulfate?: boolean;
}

export interface IngredientAnalysis {
  input: string;
  parsed: string[]; // Raw parsed ingredient names
  foundIngredients: AnalyzedIngredient[]; // Found in DB
  unknownIngredients: string[]; // Not found in DB
  summary: string;
  actives: string[]; // Active ingredients found
  tags: string[];
  /** foundIngredients.length / parsed.length — below 0.7 the UI shows a "can't judge yet" refusal instead of a verdict */
  coverage: number;
}

@Injectable()
export class IngredientsService {
  constructor(private prisma: PrismaService) {}

  /** Split a pasted label into ingredient names (headings, percentages, footnotes handled). */
  parseIngredientNames(raw: string): string[] {
    return splitLabel(raw);
  }

  /**
   * Find an ingredient by any name it goes by on labels ("Aqua/Water/Eau", "Avobenzone", "Agua"),
   * preferring the most specific name. Case-insensitive against inciName and displayName.
   */
  async findIngredientByName(name: string) {
    return (await this.findIngredientsByNames([name])).get(name) ?? null;
  }

  /**
   * Look up a whole label in one query: every candidate name for every entry, then pick per entry.
   * A rated row under any of its names beats an unrated one under the exact printed name (catalog
   * imports left unrated rows like "Avobenzone" next to the rated INCI entry).
   */
  async findIngredientsByNames(entries: string[]): Promise<Map<string, Ingredient>> {
    const candidates = new Map(entries.map((e) => [e, candidateNames(e)]));
    const all = Array.from(new Set([...candidates.values()].flat().map((n) => n.toLowerCase())));
    const rows = all.length
      ? await this.prisma.$queryRaw<Ingredient[]>`
          SELECT * FROM ingredients
          WHERE lower("inciName") = ANY(${all}) OR lower("displayName") = ANY(${all})`
      : [];
    const byName = new Map<string, Ingredient[]>();
    for (const r of rows) {
      for (const key of [r.inciName, r.displayName]) {
        if (!key) continue;
        const k = key.toLowerCase();
        byName.set(k, [...(byName.get(k) ?? []), r]);
      }
    }
    const out = new Map<string, Ingredient>();
    for (const [entry, names] of candidates) {
      const hits = names.map((n) => byName.get(n.toLowerCase()) ?? []);
      const pick = hits.flat().find((r) => r.zone) ?? hits.flat()[0];
      if (pick) out.set(entry, pick);
    }
    return out;
  }

  /**
   * Analyze a comma-separated or newline-separated ingredient list
   * Returns data from DB when available
   */
  async analyze(raw: string): Promise<IngredientAnalysis> {
    // A real label is a few hundred characters; this keeps a pasted document from tying up the server.
    if (raw.length > 20_000) throw new BadRequestException('That is too long to be an ingredient list. Paste just the ingredients.');
    const parsed = this.parseIngredientNames(raw).slice(0, 200);

    if (parsed.length === 0) {
      return {
        input: raw,
        parsed: [],
        foundIngredients: [],
        unknownIngredients: [],
        summary: 'No ingredients provided',
        actives: [],
        tags: [],
        coverage: 0,
      };
    }

    // Look up each ingredient in the database
    const foundIngredients: AnalyzedIngredient[] = [];
    const unknownIngredients: string[] = [];

    const found = await this.findIngredientsByNames(parsed);
    for (let i = 0; i < parsed.length; i++) {
      const ingredientName = parsed[i];
      const dbIngredient = found.get(ingredientName);

      if (dbIngredient) {
        const irritant =
          dbIngredient.irritancyRating != null && dbIngredient.irritancyRating >= 3;
        foundIngredients.push({
          // The name as printed on this label ("Avobenzone", "Agua"); the standard name rides along.
          name: ingredientName,
          scientificName: dbIngredient.inciName,
          category: undefined,
          function: dbIngredient.function || undefined,
          isIrritant: irritant,
          fungalAcneSafe: false,
          found: true,
          zone: dbIngredient.zone ?? undefined,
          safetyRating: dbIngredient.safetyRating ?? undefined,
          shortDescription: dbIngredient.shortDescription ?? undefined,
          isParaben: dbIngredient.isParaben,
          isFragrance: dbIngredient.isFragrance,
          isSulfate: dbIngredient.isSulfate,
        });
      } else {
        unknownIngredients.push(ingredientName);
      }
    }

    // Generate summary
    let summary = '';
    if (foundIngredients.length === 0) {
      summary = 'None of these ingredients were found in our database.';
    } else if (unknownIngredients.length === 0) {
      summary = `✅ All ${foundIngredients.length} ingredient(s) recognized! ${
        foundIngredients.some((i) => i.fungalAcneSafe)
          ? 'Most are fungal-acne safe.'
          : ''
      }`;
    } else {
      summary = `⚠️ Found ${foundIngredients.length}/${parsed.length} ingredient(s) in database.`;
    }

    // Extract tags and actives
    const tags: Set<string> = new Set();
    const actives: string[] = [];

    foundIngredients.forEach((ing) => {
      if (ing.category) tags.add(ing.category);
      if (!ing.isIrritant) tags.add('Non-irritating');
      if (ing.fungalAcneSafe) tags.add('Fungal-acne safe');
      if (ing.isParaben) tags.add('Paraben');
      if (ing.isFragrance) tags.add('Fragrance');
      if (ing.isSulfate) tags.add('Sulfate');
      actives.push(ing.name);
    });

    return {
      input: raw,
      parsed,
      foundIngredients,
      unknownIngredients,
      summary,
      actives,
      tags: Array.from(tags),
      coverage: foundIngredients.length / parsed.length,
    };
  }

  /** A parsed ingredient name nobody recognized — logged so the catalog can be filled in. */
  async reportUnknown(name: string, context?: string): Promise<{ ok: true }> {
    const trimmed = name.trim();
    if (!trimmed) {
      return { ok: true };
    }
    await this.prisma.analyticsEvent.create({
      data: {
        eventType: 'ingredient_reported_unknown',
        properties: { name: trimmed, context: context?.trim() || undefined },
      },
    });
    return { ok: true };
  }
}
