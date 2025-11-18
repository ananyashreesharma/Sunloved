import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

export interface ProductComparison {
  id: string;
  name: string;
  brand: string;
  category?: string;
  imageUrl?: string;
  pricePerUnit?: number;
  currentPrice?: number;
  similarityScore: number;
  matchType: 'closest-match' | 'best-value' | 'sensitive-safe';
  savingsPercent?: number;
  sharedActives?: string[]; // Shared ingredients
  reason?: string; // Human-readable explanation
  formulationDifference?: {
    percentage: number; // 0-100, how different
    mightContainBiotech?: boolean; // Flag if likely biotech/proprietary
    explanation?: string; // Why it's different (biotech, formulation approach, etc.)
    recommendation?: string; // What to do about it
  };
}

@Injectable()
export class ComparisonsService {
  constructor(private prisma: PrismaService) {}

  /**
   * Calculate Jaccard similarity between two sets
   * Jaccard = |intersection| / |union|
   */
  private calculateJaccardSimilarity(set1: Set<string>, set2: Set<string>): number {
    const intersection = new Set([...set1].filter((x) => set2.has(x)));
    const union = new Set([...set1, ...set2]);

    if (union.size === 0) return 0;
    return (intersection.size / union.size) * 100; // Return as percentage 0-100
  }

  /**
   * Determine match type based on similarity and price
   */
  private determineMatchType(
    similarity: number,
    priceRatio: number,
    baseFungalAcneSafe: boolean,
    candidateFungalAcneSafe: boolean,
  ): 'closest-match' | 'best-value' | 'sensitive-safe' {
    // Sensitive-safe if it has fungal acne safe when base doesn't
    if (!baseFungalAcneSafe && candidateFungalAcneSafe) {
      return 'sensitive-safe';
    }

    // Best-value if significantly cheaper (20%+ savings) and still similar enough
    if (priceRatio < 0.8 && similarity >= 70) {
      return 'best-value';
    }

    // Otherwise closest match
    return 'closest-match';
  }

  /**
   * Find shared ingredients between base and candidate products
   */
  private getSharedActives(
    baseIngredients: Array<{ ingredient: { name: string } }>,
    candidateIngredients: Array<{ ingredient: { name: string } }>,
  ): string[] {
    const baseNames = new Set(baseIngredients.map((pi) => pi.ingredient.name.toLowerCase()));
    const candidateNames = candidateIngredients
      .map((pi) => pi.ingredient.name)
      .filter((name) => baseNames.has(name.toLowerCase()));

    return candidateNames;
  }

  /**
   * Generate human-readable reason for why this is a match
   */
  private generateReason(
    similarity: number,
    savingsPercent: number,
    sharedActives: string[],
    matchType: string,
  ): string {
    const parts: string[] = [];

    // Add shared actives if any
    if (sharedActives.length > 0) {
      const activesList = sharedActives.slice(0, 3).join(', ');
      const moreSuffix = sharedActives.length > 3 ? `, +${sharedActives.length - 3} more` : '';
      parts.push(`Shares ${activesList}${moreSuffix}`);
    }

    // Add similarity
    parts.push(`${similarity}% ingredient overlap`);

    // Add savings if applicable
    if (savingsPercent > 0) {
      parts.push(`~${savingsPercent}% cheaper`);
    } else if (savingsPercent < 0) {
      parts.push(`~${Math.abs(savingsPercent)}% more expensive`);
    }

    return parts.join(', ') + '.';
  }

  /**
   * Biotech/proprietary ingredient keywords
   * These indicate a product might have unique/hard-to-replicate formulations
   */
  private biotechKeywords = [
    // Biotech fermentation-derived
    'neossance', 'amyris', 'squalane', 'ferment',
    // Biodesigned proteins
    'humacoll', 'geltor', 'collagen', 'elastin', 'elastapure', 'collume',
    // Proprietary technologies
    'proprietary', 'patented', 'exclusive', 'biotech', 'bioidentical',
    'lab-derived', 'lab-made', 'precision fermentation', 'bioengineered',
    // Specific brand technologies
    'matrixyl', 'syn-ake', 'argireline', 'hyaluronate',
    'peptide', 'biomimetic', 'polypeptide', 'marine collagen',
  ];

  /**
   * Detect if an ingredient list likely contains biotech/proprietary ingredients
   */
  private detectBiotechIngredients(
    baseIngredients: string[],
    candidateIngredients: string[],
  ): { hasBiotech: boolean; biotechItems: string[] } {
    const allIngredients = [...baseIngredients, ...candidateIngredients];
    const biotechItems: string[] = [];

    allIngredients.forEach((ingredient) => {
      const lower = ingredient.toLowerCase();
      this.biotechKeywords.forEach((keyword) => {
        if (lower.includes(keyword) && !biotechItems.includes(ingredient)) {
          biotechItems.push(ingredient);
        }
      });
    });

    return {
      hasBiotech: biotechItems.length > 0,
      biotechItems,
    };
  }

  /**
   * Generate formulation difference explanation
   */
  private generateFormulationExplanation(
    similarity: number,
    sharedActives: string[],
    biotechInfo: { hasBiotech: boolean; biotechItems: string[] },
  ): {
    explanation: string;
    recommendation: string;
  } {
    const difference = 100 - similarity;

    if (difference <= 20) {
      return {
        explanation:
          'Very similar formulation with only minor ingredient variations.',
        recommendation: 'Safe to switch; minimal differences in results expected.',
      };
    }

    if (difference <= 40) {
      return {
        explanation: `${difference}% of ingredients differ. The formulation approach is similar, but some unique components may affect efficacy.`,
        recommendation: 'Patch test before full switch. Results may vary slightly.',
      };
    }

    if (difference <= 60) {
      return {
        explanation: `${difference}% formulation difference. This product has a notably different ingredient profile despite key actives match.`,
        recommendation:
          'Strong formulation differences. Test on small area first. Results may differ significantly.',
      };
    }

    // High difference - likely biotech
    if (biotechInfo.hasBiotech) {
      return {
        explanation: `This product likely uses proprietary/biotech ingredients (${biotechInfo.biotechItems.slice(0, 2).join(', ')}, etc.) making it ${difference}% different. These can't be easily replicated and may offer unique benefits.`,
        recommendation:
          'This is a premium/unique formulation. Not a true "dupe" but may deliver different results. Consider both product philosophies.',
      };
    }

    return {
      explanation: `${difference}% ingredient difference. Only ${sharedActives.length} shared active(s). Quite different formulations.`,
      recommendation:
        'Very different products. Not recommended as a direct replacement. Try if interested in exploring alternatives.',
    };
  }

  /**
   * Get similar products (dupes) for a given product
   */
  async findSimilarProducts(productId: string): Promise<ProductComparison[]> {
    // Get base product with ingredients
    const baseProduct = await this.prisma.product.findUnique({
      where: { id: productId },
      include: {
        ingredients: {
          include: {
            ingredient: true,
          },
        },
        ethicsData: true,
      },
    });

    if (!baseProduct) {
      throw new NotFoundException(`Product with ID ${productId} not found`);
    }

    // RUTHLESS: Base product must have ingredients
    if (!baseProduct.ingredients || baseProduct.ingredients.length === 0) {
      throw new NotFoundException(
        `Product with ID ${productId} has no ingredients and cannot be compared`,
      );
    }

    // RUTHLESS: Get all other products WITH ingredients only
    const allProducts = await this.prisma.product.findMany({
      where: {
        id: { not: productId }, // Exclude the base product
        ingredients: {
          some: {}, // At least one ingredient link exists
        },
      },
      include: {
        ingredients: {
          include: {
            ingredient: true,
          },
        },
        ethicsData: true,
      },
    });

    // Extract ingredient IDs from base product
    const baseIngredientIds = new Set(
      baseProduct.ingredients.map((pi) => pi.ingredientId),
    );

    // Calculate similarity for each candidate product
    const comparisons: ProductComparison[] = allProducts
      .filter((candidate) => {
        // RUTHLESS: Skip products without ingredients (extra safety check)
        return candidate.ingredients && candidate.ingredients.length > 0;
      })
      .map((candidate) => {
        // Extract ingredient IDs from candidate
        const candidateIngredientIds = new Set(
          candidate.ingredients.map((pi) => pi.ingredientId),
        );

        // Calculate Jaccard similarity
        const similarity = this.calculateJaccardSimilarity(
          baseIngredientIds,
          candidateIngredientIds,
        );

        // Get shared actives (ingredients)
        const sharedActives = this.getSharedActives(
          baseProduct.ingredients,
          candidate.ingredients,
        );

        // Calculate savings percent (if applicable)
        const basePricePerUnit = baseProduct.pricePerUnit || baseProduct.currentPrice || 0;
        const candidatePricePerUnit =
          candidate.pricePerUnit || candidate.currentPrice || 0;

        let savingsPercent = 0;
        let priceRatio = 1;

        if (basePricePerUnit > 0 && candidatePricePerUnit > 0) {
          priceRatio = candidatePricePerUnit / basePricePerUnit;
          savingsPercent = Math.round((1 - priceRatio) * 100);
        }

        // Determine match type
        const matchType = this.determineMatchType(
          similarity,
          priceRatio,
          baseProduct.ethicsData?.fungalAcneSafe || false,
          candidate.ethicsData?.fungalAcneSafe || false,
        );

        // Generate human-readable reason
        const reason = this.generateReason(
          Math.round(similarity),
          savingsPercent,
          sharedActives,
          matchType,
        );

        // Detect biotech ingredients and formulation differences
        const baseIngredientNames = baseProduct.ingredients.map((pi) => pi.ingredient.name);
        const candidateIngredientNames = candidate.ingredients.map((pi) => pi.ingredient.name);
        const biotechInfo = this.detectBiotechIngredients(
          baseIngredientNames,
          candidateIngredientNames,
        );
        const formulationExplanation = this.generateFormulationExplanation(
          Math.round(similarity),
          sharedActives,
          biotechInfo,
        );

        return {
          id: candidate.id,
          name: candidate.name,
          brand: candidate.brand,
          category: candidate.category || undefined,
          imageUrl: candidate.imageUrl || undefined,
          pricePerUnit: candidate.pricePerUnit || undefined,
          currentPrice: candidate.currentPrice || undefined,
          similarityScore: Math.round(similarity),
          matchType,
          savingsPercent: savingsPercent !== 0 ? savingsPercent : undefined,
          sharedActives: sharedActives.length > 0 ? sharedActives : undefined,
          reason,
          formulationDifference: {
            percentage: Math.round(100 - similarity),
            mightContainBiotech: biotechInfo.hasBiotech,
            explanation: formulationExplanation.explanation,
            recommendation: formulationExplanation.recommendation,
          },
        };
      })
      .filter((c) => c.similarityScore > 0) // Only include products with at least 1 ingredient in common
      .sort((a, b) => {
        // Sort: best-value > closest-match > sensitive-safe, then by similarity
        const typeOrder = {
          'closest-match': 1,
          'best-value': 0,
          'sensitive-safe': 2,
        };
        const typeDiff = typeOrder[a.matchType] - typeOrder[b.matchType];
        if (typeDiff !== 0) return typeDiff;
        return b.similarityScore - a.similarityScore;
      })
      .slice(0, 10); // Return top 10 dupes

    return comparisons;
  }
}
