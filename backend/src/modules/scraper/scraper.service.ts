import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import axios } from 'axios';

export interface OpenBeautyFactsProduct {
  product_name: string;
  brands: string;
  categories_tags: string;
  countries?: string;
  quantity?: string;
  code?: string;
  ingredients_text?: string;
  ingredients?: Array<{ name: string }>;
}

export interface KaggeSephora {
  Product_Name: string;
  Brand: string;
  Product_Type: string;
  Ingredients: string;
  Price?: number;
}

export interface ScrapedProduct {
  name: string;
  brand: string;
  category: string;
  volume?: string;
  barcode?: string;
  rawIngredientList: string;
  source: 'openbeautyfacts' | 'kaggle_sephora' | 'kaggle_skincare';
}

export interface ImportResult {
  totalProcessed: number;
  productsCreated: number;
  ingredientsCreated: number;
  linkedSuccessfully: number;
  errors: Array<{ row: number; error: string }>;
}

@Injectable()
export class ScraperService {
  private readonly logger = new Logger(ScraperService.name);
  private readonly openBeautyFactsUrl = 'https://world.openbeautyfacts.org/api/v0';

  constructor(private prisma: PrismaService) {}

  /**
   * Fetch products from Open Beauty Facts API
   * Filters for beauty/cosmetics products in specified countries
   */
  async fetchOpenBeautyFactsProducts(
    query: string,
    limit: number = 100,
  ): Promise<OpenBeautyFactsProduct[]> {
    try {
      this.logger.log(`Fetching from Open Beauty Facts: ${query}`);

      const response = await axios.get(`${this.openBeautyFactsUrl}/cgi/search.pl`, {
        params: {
          search_terms: query,
          action: 'process',
          json: 1,
          page_size: limit,
          fields:
            'product_name,brands,categories_tags,countries,quantity,code,ingredients_text,ingredients',
        },
        timeout: 10000,
      });

      const products = response.data.products || [];
      this.logger.log(`Fetched ${products.length} products from Open Beauty Facts`);

      return products;
    } catch (error) {
      this.logger.error(`Error fetching from Open Beauty Facts: ${error.message}`);
      throw error;
    }
  }

  /**
   * Parse Open Beauty Facts product to standardized format
   */
  parseOpenBeautyFactsProduct(product: OpenBeautyFactsProduct): ScrapedProduct {
    // Extract brand (first brand in comma-separated list)
    const brand = product.brands ? product.brands.split(',')[0].trim() : 'Unknown';

    // Map categories to our category system
    let category = 'Serum'; // Default
    if (product.categories_tags) {
      const categoryTag = product.categories_tags.split(',')[0].toLowerCase();
      category = this.mapCategoryTag(categoryTag);
    }

    // Extract volume/size
    const volume = product.quantity || undefined;

    // Raw ingredient list
    const rawIngredientList =
      product.ingredients_text ||
      (product.ingredients ? product.ingredients.map((i) => i.name).join(', ') : '');

    return {
      name: product.product_name || 'Unknown Product',
      brand,
      category,
      volume,
      barcode: product.code,
      rawIngredientList,
      source: 'openbeautyfacts',
    };
  }

  /**
   * Parse Kaggle Sephora product to standardized format
   */
  parseKaggleSephoraProduct(product: KaggeSephora): ScrapedProduct {
    return {
      name: product.Product_Name || 'Unknown Product',
      brand: product.Brand || 'Unknown',
      category: this.mapProductType(product.Product_Type),
      rawIngredientList: product.Ingredients || '',
      source: 'kaggle_sephora',
    };
  }

  /**
   * Map Open Beauty Facts category tags to our categories
   */
  private mapCategoryTag(tag: string): string {
    const categoryMap: Record<string, string> = {
      serum: 'Serum',
      cream: 'Moisturizer',
      moisturizer: 'Moisturizer',
      face_cream: 'Moisturizer',
      lotion: 'Moisturizer',
      gel: 'Cleanser',
      cleanser: 'Cleanser',
      wash: 'Cleanser',
      toner: 'Toner',
      essence: 'Essence',
      mask: 'Mask',
      sunscreen: 'Sunscreen',
      spf: 'Sunscreen',
      emulsion: 'Moisturizer',
      oil: 'Oil',
      treatment: 'Treatment',
      exfoliator: 'Exfoliator',
      scrub: 'Exfoliator',
    };

    return categoryMap[tag] || 'Serum'; // Default to Serum if unknown
  }

  /**
   * Map Kaggle product type to our categories
   */
  private mapProductType(type: string): string {
    const typeMap: Record<string, string> = {
      serum: 'Serum',
      moisturiser: 'Moisturizer',
      moisturizer: 'Moisturizer',
      cleanser: 'Cleanser',
      toner: 'Toner',
      essence: 'Essence',
      mask: 'Mask',
      sunscreen: 'Sunscreen',
      oil: 'Oil',
      treatment: 'Treatment',
      scrub: 'Exfoliator',
    };

    return typeMap[type.toLowerCase()] || 'Serum';
  }

  /**
   * Parse raw ingredient list into individual ingredients
   * Handles INCI format (comma-separated, sometimes with concentrations)
   */
  parseIngredientList(rawList: string): string[] {
    if (!rawList) return [];

    return rawList
      .split(',')
      .map((ingredient) => {
        // Remove percentages, brackets, and extra whitespace
        return ingredient
          .replace(/\([^)]*\)/g, '') // Remove (parenthetical)
          .replace(/\d+[\d.]*%/g, '') // Remove percentages
          .trim();
      })
      .filter((ingredient) => ingredient.length > 2) // Filter out very short strings
      .slice(0, 30); // Limit to 30 ingredients max per product
  }

  /**
   * Extract INCI/ingredient names from raw list and find/create in DB
   * Creates a fuzzy match to existing ingredients
   */
  async linkProductToIngredients(
    productId: string,
    rawIngredientList: string,
    position: number = 0,
  ): Promise<number> {
    const ingredientNames = this.parseIngredientList(rawIngredientList);
    let linkedCount = 0;

    for (const ingredientName of ingredientNames) {
      try {
        // Find or create ingredient
        let ingredient = await this.prisma.ingredient.findFirst({
          where: {
            name: {
              contains: ingredientName.substring(0, 10),
              mode: 'insensitive',
            },
          },
        });

        if (!ingredient) {
          // Create new ingredient
          ingredient = await this.prisma.ingredient.create({
            data: {
              name: ingredientName,
              function: this.guessIngredientFunction(ingredientName),
            },
          });
        }

        // Link to product
        await this.prisma.productIngredient.upsert({
          where: {
            productId_ingredientId: {
              productId,
              ingredientId: ingredient.id,
            },
          },
          create: {
            productId,
            ingredientId: ingredient.id,
            position: position + linkedCount,
          },
          update: {
            position: position + linkedCount,
          },
        });

        linkedCount++;
      } catch (error) {
        this.logger.warn(`Failed to link ingredient "${ingredientName}": ${error.message}`);
      }
    }

    return linkedCount;
  }

  /**
   * Guess ingredient function based on name
   */
  private guessIngredientFunction(name: string): string {
    const lowerName = name.toLowerCase();

    if (
      lowerName.includes('glycerin') ||
      lowerName.includes('hyaluronic') ||
      lowerName.includes('humectant')
    )
      return 'Humectant';
    if (
      lowerName.includes('oil') ||
      lowerName.includes('emollient') ||
      lowerName.includes('butter')
    )
      return 'Emollient';
    if (
      lowerName.includes('acid') ||
      lowerName.includes('exfoliat') ||
      lowerName.includes('pha')
    )
      return 'Exfoliant';
    if (lowerName.includes('niacinamide') || lowerName.includes('vitamin'))
      return 'Active';
    if (
      lowerName.includes('water') ||
      lowerName.includes('aqua') ||
      lowerName.includes('extract')
    )
      return 'Hydrating Agent';
    if (lowerName.includes('fragrance') || lowerName.includes('parfum'))
      return 'Fragrance';
    if (lowerName.includes('preservative'))
      return 'Preservative';

    return 'Other';
  }

  /**
   * Bulk import scraped products into database
   */
  async bulkImportProducts(
    scrapedProducts: ScrapedProduct[],
  ): Promise<ImportResult> {
    const result: ImportResult = {
      totalProcessed: scrapedProducts.length,
      productsCreated: 0,
      ingredientsCreated: 0,
      linkedSuccessfully: 0,
      errors: [],
    };

    for (let i = 0; i < scrapedProducts.length; i++) {
      try {
        const scraped = scrapedProducts[i];

        // Check if product already exists
        const existingProduct = await this.prisma.product.findFirst({
          where: {
            AND: [
              { name: { equals: scraped.name, mode: 'insensitive' } },
              { brand: { equals: scraped.brand, mode: 'insensitive' } },
            ],
          },
        });

        if (existingProduct) {
          this.logger.log(`Product already exists: ${scraped.name} by ${scraped.brand}`);
          continue;
        }

        // Create product
        const product = await this.prisma.product.create({
          data: {
            name: scraped.name,
            brand: scraped.brand,
            category: scraped.category,
            volume: scraped.volume,
            description: `Sourced from ${scraped.source}`,
            barcode: scraped.barcode,
          },
        });

        result.productsCreated++;

        // Link ingredients
        const linkedCount = await this.linkProductToIngredients(
          product.id,
          scraped.rawIngredientList,
        );

        result.linkedSuccessfully += linkedCount;

        this.logger.log(
          `Created product: ${product.name} with ${linkedCount} ingredients`,
        );
      } catch (error) {
        this.logger.error(`Error importing product at row ${i}: ${error.message}`);
        result.errors.push({
          row: i,
          error: error.message,
        });
      }
    }

    this.logger.log(`Import complete: ${result.productsCreated} products created`);
    return result;
  }

  /**
   * Get import statistics
   */
  async getImportStats(): Promise<{
    totalProducts: number;
    totalIngredients: number;
    productsWithIngredients: number;
    averageIngredientsPerProduct: number;
    categoryBreakdown: Record<string, number>;
  }> {
    const products = await this.prisma.product.findMany({
      include: {
        ingredients: true,
      },
    });

    const totalProducts = products.length;
    const totalIngredients = await this.prisma.ingredient.count();
    const productsWithIngredients = products.filter((p) => p.ingredients.length > 0).length;
    const averageIngredientsPerProduct =
      productsWithIngredients > 0
        ? products.reduce((sum, p) => sum + p.ingredients.length, 0) / productsWithIngredients
        : 0;

    const categoryBreakdown: Record<string, number> = {};
    products.forEach((p) => {
      categoryBreakdown[p.category || 'Unknown'] =
        (categoryBreakdown[p.category || 'Unknown'] || 0) + 1;
    });

    return {
      totalProducts,
      totalIngredients,
      productsWithIngredients,
      averageIngredientsPerProduct: Math.round(averageIngredientsPerProduct * 100) / 100,
      categoryBreakdown,
    };
  }
}

