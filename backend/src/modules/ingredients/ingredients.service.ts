import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

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

  /** Split a raw comma/newline-separated ingredient list into trimmed names. Shared by analyze() and contributions. */
  parseIngredientNames(raw: string): string[] {
    return raw
      .split(/[,\n]/)
      .map((s) => s.trim())
      .filter(Boolean);
  }

  /** Case-insensitive lookup against inciName/displayName. Shared by analyze() and contributions. */
  findIngredientByName(name: string) {
    return this.prisma.ingredient.findFirst({
      where: {
        OR: [
          { inciName: { equals: name, mode: 'insensitive' } },
          { displayName: { equals: name, mode: 'insensitive' } },
        ],
      },
    });
  }

  /**
   * Analyze a comma-separated or newline-separated ingredient list
   * Returns data from DB when available
   */
  async analyze(raw: string): Promise<IngredientAnalysis> {
    const parsed = this.parseIngredientNames(raw);

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

    for (const ingredientName of parsed) {
      const dbIngredient = await this.findIngredientByName(ingredientName);

      if (dbIngredient) {
        const irritant =
          dbIngredient.irritancyRating != null && dbIngredient.irritancyRating >= 3;
        foundIngredients.push({
          name: dbIngredient.inciName,
          scientificName: dbIngredient.displayName || undefined,
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
