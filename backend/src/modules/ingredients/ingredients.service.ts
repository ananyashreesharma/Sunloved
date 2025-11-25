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
}

export interface IngredientAnalysis {
  input: string;
  parsed: string[]; // Raw parsed ingredient names
  foundIngredients: AnalyzedIngredient[]; // Found in DB
  unknownIngredients: string[]; // Not found in DB
  summary: string;
  actives: string[]; // Active ingredients found
  tags: string[];
}

@Injectable()
export class IngredientsService {
  constructor(private prisma: PrismaService) {}

  /**
   * Analyze a comma-separated or newline-separated ingredient list
   * Returns data from DB when available
   */
  async analyze(raw: string): Promise<IngredientAnalysis> {
    // Parse input - support both commas and newlines
    const parsed = raw
      .split(/[,\n]/)
      .map((s) => s.trim())
      .filter(Boolean);

    if (parsed.length === 0) {
      return {
        input: raw,
        parsed: [],
        foundIngredients: [],
        unknownIngredients: [],
        summary: 'No ingredients provided',
        actives: [],
        tags: [],
      };
    }

    // Look up each ingredient in the database
    const foundIngredients: AnalyzedIngredient[] = [];
    const unknownIngredients: string[] = [];

    for (const ingredientName of parsed) {
      // Case-insensitive search
      const dbIngredient = await this.prisma.ingredient.findFirst({
        where: {
          OR: [
            { inciName: { contains: ingredientName, mode: 'insensitive' } },
            { displayName: { contains: ingredientName, mode: 'insensitive' } },
          ],
        },
      });

      if (dbIngredient) {
        foundIngredients.push({
          name: dbIngredient.inciName,
          scientificName: dbIngredient.displayName || undefined,
          category: undefined, // Removed from schema
          function: dbIngredient.function || undefined,
          isIrritant: false, // TODO: Calculate from irritancyRating
          fungalAcneSafe: false, // TODO: Calculate from sensitivityFlags
          found: true,
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
    };
  }
}
