import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import axios from 'axios';

export interface OpenBeautyFactsProduct {
  product_name: string;
  brands: string | string[]; // Can be string or array
  categories_tags: string | string[]; // Can be string or array
  countries?: string;
  quantity?: string;
  code?: string;
  ingredients_text?: string;
  ingredients_text_en?: string;
  ingredients_text_fr?: string;
  ingredients_text_de?: string;
  ingredients_text_es?: string;
  ingredients_tags?: string[];
  ingredients_text_with_allergens?: string;
  ingredients?: Array<{ name: string }>;
}

export interface KaggleSephora {
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
  source: 'openbeautyfacts' | 'kaggle_sephora' | 'kaggle_skincare' | 'csv_import';
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
  private readonly openBeautyFactsUrl = 'https://world.openbeautyfacts.org';

  constructor(private prisma: PrismaService) {}

  /**
   * Extract ingredient keywords from product name as fallback
   * Looks for common ingredient names in product name
   */
  private extractIngredientsFromName(productName: string): string[] {
    const name = productName.toLowerCase();
    const ingredientKeywords = [
      'niacinamide',
      'hyaluronic',
      'vitamin c',
      'vit c',
      'retinol',
      'peptide',
      'salicylic',
      'glycolic',
      'lactic',
      'azelaic',
      'tranexamic',
      'ceramide',
      'snail',
      'centella',
      'argan',
      'jojoba',
      'rosehip',
      'squalane',
      'collagen',
      'elastin',
      'coenzyme',
      'coq10',
      'alpha hydroxy',
      'aha',
      'beta hydroxy',
      'bha',
      'polyhydroxy',
      'pha',
    ];

    const found: string[] = [];
    for (const keyword of ingredientKeywords) {
      if (name.includes(keyword)) {
        found.push(keyword);
      }
    }

    return found;
  }

  /**
   * Flexible check if product has valid ingredient data
   * Accepts products with any ingredient information (less strict)
   * Falls back to extracting ingredients from product name if no ingredient data
   */
  private hasValidIngredients(product: OpenBeautyFactsProduct): boolean {
    // Check ingredients_text (main field) - reduced minimum to 5 chars
    if (product.ingredients_text && product.ingredients_text.trim().length >= 5) {
      return true;
    }

    // Check language-specific variants - reduced minimum to 5 chars
    const langVariants = [
      product.ingredients_text_en,
      product.ingredients_text_fr,
      product.ingredients_text_de,
      product.ingredients_text_es,
    ];

    for (const variant of langVariants) {
      if (variant && variant.trim().length >= 5) {
        return true;
      }
    }

    // Check ingredients_text_with_allergens - reduced minimum to 5 chars
    if (
      product.ingredients_text_with_allergens &&
      product.ingredients_text_with_allergens.trim().length >= 5
    ) {
      return true;
    }

    // Check ingredients_tags (array of ingredient names) - accept even 1 tag
    if (
      product.ingredients_tags &&
      Array.isArray(product.ingredients_tags) &&
      product.ingredients_tags.length > 0
    ) {
      return true;
    }

    // Check structured ingredients array - accept even 1 ingredient
    if (
      product.ingredients &&
      Array.isArray(product.ingredients) &&
      product.ingredients.length > 0
    ) {
      return true;
    }

    // FALLBACK: Extract ingredients from product name
    if (product.product_name) {
      const extracted = this.extractIngredientsFromName(product.product_name);
      if (extracted.length > 0) {
        return true; // Product name contains ingredient keywords
      }
    }

    // No valid ingredient data found
    return false;
  }

  /**
   * Fetch products from Open Beauty Facts API
   * RUTHLESS: Only returns products with valid ingredient data
   * @param requireIngredients - If true, only return products that have ingredient data (default: true)
   */
  async fetchOpenBeautyFactsProducts(
    query: string,
    limit: number = 100,
    requireIngredients: boolean = true,
  ): Promise<OpenBeautyFactsProduct[]> {
    try {
      this.logger.log(`Fetching from Open Beauty Facts: ${query}${requireIngredients ? ' (with ingredients only)' : ''}`);

      // Fetch many more products than needed if we're filtering for ingredients
      // Since only 15-30% have ingredients, we need to fetch 5-10x more
      // Open Beauty Facts API max page_size is typically 100, so we'll use multiple requests if needed
      const fetchLimit = requireIngredients ? Math.min(limit * 10, 500) : limit;

      const response = await axios.get(`${this.openBeautyFactsUrl}/cgi/search.pl`, {
        params: {
          search_terms: query,
          action: 'process',
          json: 1,
          page_size: fetchLimit,
          fields:
            'product_name,brands,categories_tags,countries,quantity,code,ingredients_text,ingredients_text_en,ingredients_text_fr,ingredients_text_de,ingredients_text_es,ingredients_tags,ingredients_text_with_allergens,ingredients',
        },
        timeout: 10000,
      });

      let products = response.data.products || [];

      // RUTHLESS: Filter for products with valid ingredients if required
      if (requireIngredients) {
        const beforeCount = products.length;
        products = products.filter((p: OpenBeautyFactsProduct) =>
          this.hasValidIngredients(p),
        );
        // Limit to requested amount after filtering
        products = products.slice(0, limit);
        const passRate = beforeCount > 0 ? Math.round((products.length / beforeCount) * 100) : 0;
        this.logger.log(
          `FLEXIBLE FILTER: ${products.length} products with valid ingredients (filtered from ${beforeCount} total, ${passRate}% passed)`,
        );
      } else {
        this.logger.log(`Fetched ${products.length} products from Open Beauty Facts`);
      }

      return products;
    } catch (error) {
      this.logger.error(`Error fetching from Open Beauty Facts: ${error.message}`);
      throw error;
    }
  }

  /**
   * Parse Open Beauty Facts product to standardized format
   * RUTHLESS: Returns null if product has no valid ingredients
   * Only products with ingredients_text (or variants) will be parsed
   */
  parseOpenBeautyFactsProduct(
    product: OpenBeautyFactsProduct,
  ): ScrapedProduct | null {
    // RUTHLESS: Check for valid ingredients first
    if (!this.hasValidIngredients(product)) {
      return null; // Skip products without valid ingredients
    }
    // Extract brand (handle both string and array formats)
    let brand = 'Unknown';
    if (product.brands) {
      if (Array.isArray(product.brands)) {
        brand = product.brands[0].trim();
      } else {
        brand = product.brands.split(',')[0].trim();
      }
    }

    // Map categories to our category system
    let category = 'Serum'; // Default
    if (product.categories_tags) {
      try {
        // Handle both array and string formats
        let categoryTag: string | undefined;
        if (Array.isArray(product.categories_tags)) {
          categoryTag = product.categories_tags.find(tag => tag && typeof tag === 'string' && tag.length > 0);
        } else if (typeof product.categories_tags === 'string') {
          const parts = product.categories_tags.split(',');
          categoryTag = parts.find(part => part && part.trim().length > 0);
        }
        
        if (categoryTag && typeof categoryTag === 'string' && categoryTag.trim().length > 0) {
          const mappedCategory = this.mapCategoryTag(categoryTag.trim().toLowerCase());
          if (mappedCategory) {
            category = mappedCategory;
          } else {
            // Category tag didn't match, try product name analysis
            category = this.analyzeProductNameForCategory(product.product_name || '');
          }
        } else {
          // No category tag, use product name analysis
          category = this.analyzeProductNameForCategory(product.product_name || '');
        }
      } catch (error) {
        // If category parsing fails, use product name analysis
        category = this.analyzeProductNameForCategory(product.product_name || '');
      }
    } else {
      // No categories_tags at all, use product name analysis
      category = this.analyzeProductNameForCategory(product.product_name || '');
    }

    // Extract volume/size
    const volume = product.quantity || undefined;

    // Flexible: Extract raw ingredient list from multiple fields (priority order)
    let rawIngredientList = '';
    
    // Priority 1: ingredients_text (main field) - reduced minimum to 5 chars
    if (product.ingredients_text && product.ingredients_text.trim().length >= 5) {
      rawIngredientList = product.ingredients_text.trim();
    }
    // Priority 2: Language-specific variants (English preferred) - reduced minimum to 5 chars
    else if (product.ingredients_text_en && product.ingredients_text_en.trim().length >= 5) {
      rawIngredientList = product.ingredients_text_en.trim();
    }
    // Priority 3: Other language variants - reduced minimum to 5 chars
    else if (product.ingredients_text_fr && product.ingredients_text_fr.trim().length >= 5) {
      rawIngredientList = product.ingredients_text_fr.trim();
    }
    else if (product.ingredients_text_de && product.ingredients_text_de.trim().length >= 5) {
      rawIngredientList = product.ingredients_text_de.trim();
    }
    else if (product.ingredients_text_es && product.ingredients_text_es.trim().length >= 5) {
      rawIngredientList = product.ingredients_text_es.trim();
    }
    // Priority 4: ingredients_text_with_allergens - reduced minimum to 5 chars
    else if (
      product.ingredients_text_with_allergens &&
      product.ingredients_text_with_allergens.trim().length >= 5
    ) {
      rawIngredientList = product.ingredients_text_with_allergens.trim();
    }
    // Priority 5: ingredients_tags (array) - accept even 1 tag
    else if (
      product.ingredients_tags &&
      Array.isArray(product.ingredients_tags) &&
      product.ingredients_tags.length > 0
    ) {
      rawIngredientList = product.ingredients_tags.join(', ');
    }
    // Priority 6: Structured ingredients array (last resort) - accept even 1 ingredient
    else if (product.ingredients && Array.isArray(product.ingredients) && product.ingredients.length > 0) {
      rawIngredientList = product.ingredients.map((i) => i.name).join(', ');
    }
    // Priority 7: FALLBACK - Extract from product name
    else if (product.product_name) {
      const extracted = this.extractIngredientsFromName(product.product_name);
      if (extracted.length > 0) {
        rawIngredientList = extracted.join(', ');
        this.logger.debug(
          `Extracted ingredients from product name: ${product.product_name} -> ${rawIngredientList}`,
        );
      }
    }

    // If still no ingredients found, return null (will be filtered out)
    if (!rawIngredientList || rawIngredientList.trim().length < 5) {
      return null;
    }

    return {
      name: product.product_name || 'Unknown Product',
      brand,
      category,
      volume,
      barcode: product.code,
      rawIngredientList: rawIngredientList.trim(),
      source: 'openbeautyfacts',
    };
  }

  /**
   * Parse Kaggle Sephora product to standardized format
   */
  parseKaggleSephoraProduct(product: KaggleSephora): ScrapedProduct {
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
   * Handles both "en:serum" format and plain "serum" format
   */
  private mapCategoryTag(tag: string): string {
    // Remove "en:" prefix if present
    const cleanTag = tag.replace(/^en:/, '').toLowerCase();

    const categoryMap: Record<string, string> = {
      // Serums
      serum: 'Serum',
      serums: 'Serum',
      'face-serum': 'Serum',
      'face-serums': 'Serum',
      
      // Moisturizers
      cream: 'Moisturizer',
      creams: 'Moisturizer',
      moisturizer: 'Moisturizer',
      moisturizers: 'Moisturizer',
      'face-cream': 'Moisturizer',
      'face-creams': 'Moisturizer',
      lotion: 'Moisturizer',
      lotions: 'Moisturizer',
      emulsion: 'Moisturizer',
      emulsions: 'Moisturizer',
      
      // Cleansers
      cleanser: 'Cleanser',
      cleansers: 'Cleanser',
      'face-cleanser': 'Cleanser',
      'face-cleansers': 'Cleanser',
      wash: 'Cleanser',
      soap: 'Cleanser',
      soaps: 'Cleanser',
      gel: 'Cleanser',
      'cleansing-gel': 'Cleanser',
      
      // Toners
      toner: 'Toner',
      toners: 'Toner',
      'face-toner': 'Toner',
      'face-toners': 'Toner',
      
      // Essences
      essence: 'Essence',
      essences: 'Essence',
      
      // Masks
      mask: 'Mask',
      masks: 'Mask',
      'face-mask': 'Mask',
      'face-masks': 'Mask',
      
      // Sunscreens
      sunscreen: 'Sunscreen',
      sunscreens: 'Sunscreen',
      spf: 'Sunscreen',
      'sun-protection': 'Sunscreen',
      
      // Oils
      oil: 'Oil',
      oils: 'Oil',
      'face-oil': 'Oil',
      
      // Treatments
      treatment: 'Treatment',
      treatments: 'Treatment',
      
      // Exfoliators
      exfoliator: 'Exfoliator',
      exfoliators: 'Exfoliator',
      scrub: 'Exfoliator',
      scrubs: 'Exfoliator',
      'exfoliating-scrub': 'Exfoliator',
    };

    return categoryMap[cleanTag] || null; // Return null if not found (will use name analysis)
  }

  /**
   * Analyze product name to determine category (fallback when category tag doesn't match)
   */
  private analyzeProductNameForCategory(productName: string): string {
    const name = productName.toLowerCase();

    // Cleansers
    if (
      name.includes('cleanser') ||
      name.includes('wash') ||
      name.includes('soap') ||
      name.includes('cleansing') ||
      name.includes('foam') ||
      name.includes('gel cleanser')
    ) {
      return 'Cleanser';
    }

    // Toners
    if (
      name.includes('toner') ||
      name.includes('astringent') ||
      (name.includes('cleanser') && name.includes('toner'))
    ) {
      return 'Toner';
    }

    // Moisturizers
    if (
      name.includes('moisturizer') ||
      name.includes('moisturiser') ||
      name.includes('cream') ||
      name.includes('lotion') ||
      name.includes('balm')
    ) {
      return 'Moisturizer';
    }

    // Sunscreens
    if (
      name.includes('sunscreen') ||
      name.includes('sun block') ||
      name.includes('spf') ||
      name.includes('sun protection')
    ) {
      return 'Sunscreen';
    }

    // Masks
    if (name.includes('mask') || name.includes('peel')) {
      return 'Mask';
    }

    // Exfoliators
    if (
      name.includes('scrub') ||
      name.includes('exfoliat') ||
      name.includes('peel') ||
      name.includes('polish')
    ) {
      return 'Exfoliator';
    }

    // Oils
    if (name.includes('oil') && !name.includes('serum')) {
      return 'Oil';
    }

    // Serums (default for most skincare products)
    if (
      name.includes('serum') ||
      name.includes('booster') ||
      name.includes('essence') ||
      name.includes('ampoule')
    ) {
      return 'Serum';
    }

    // Default to Serum for unknown (most skincare products are serums)
    return 'Serum';
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
        // Find or create ingredient (using inciName as the canonical name)
        let ingredient = await this.prisma.ingredient.findFirst({
          where: {
            inciName: {
              equals: ingredientName,
              mode: 'insensitive',
            },
          },
        });

        if (!ingredient) {
          // Create new ingredient
          ingredient = await this.prisma.ingredient.create({
            data: {
              inciName: ingredientName,
              displayName: ingredientName, // Use same as INCI name for now
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
   * Find or create brand
   */
  private async findOrCreateBrand(brandName: string): Promise<string> {
    // Find existing brand
    let brand = await this.prisma.brand.findFirst({
      where: {
        name: {
          equals: brandName,
          mode: 'insensitive',
        },
      },
    });

    // Create if doesn't exist
    if (!brand) {
      brand = await this.prisma.brand.create({
        data: {
          name: brandName,
          isCrueltyFree: false, // Default, can be updated later
          isVeganBrand: false,
        },
      });
      this.logger.debug(`Created new brand: ${brandName}`);
    }

    return brand.id;
  }

  /**
   * Parse volume string into value and unit
   * Examples: "30ml" -> { value: 30, unit: "ml" }
   *           "1 fl oz" -> { value: 1, unit: "fl oz" }
   */
  private parseVolume(volumeStr: string | undefined): {
    value: number | null;
    unit: string | null;
  } {
    if (!volumeStr || volumeStr === 'N/A') {
      return { value: null, unit: null };
    }

    // Match patterns like "30ml", "1 fl oz", "50g", etc.
    const match = volumeStr.match(/^(\d+\.?\d*)\s*(ml|g|oz|fl oz|fl\.?\s*oz\.?)$/i);
    if (match) {
      return {
        value: parseFloat(match[1]),
        unit: match[2].toLowerCase().replace(/\./g, ''),
      };
    }

    return { value: null, unit: null };
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

    let skippedCount = 0;

    for (let i = 0; i < scrapedProducts.length; i++) {
      try {
        const scraped = scrapedProducts[i];

        // Find or create brand
        const brandId = await this.findOrCreateBrand(scraped.brand);

        // Check if product already exists (by name + brand)
        const existingProduct = await this.prisma.product.findFirst({
          where: {
            AND: [
              { name: { equals: scraped.name, mode: 'insensitive' } },
              { brandId: brandId },
            ],
          },
        });

        if (existingProduct) {
          skippedCount++;
          // Still try to update ingredients if they're missing
          if (scraped.rawIngredientList && scraped.rawIngredientList.length >= 5) {
            const existingIngredients = await this.prisma.productIngredient.count({
              where: { productId: existingProduct.id },
            });
            if (existingIngredients === 0) {
              const linkedCount = await this.linkProductToIngredients(
                existingProduct.id,
                scraped.rawIngredientList,
              );
              if (linkedCount > 0) {
                this.logger.log(`Updated ingredients for existing product: ${scraped.name} (+${linkedCount} ingredients)`);
                result.linkedSuccessfully += linkedCount;
              }
            }
          }
          continue;
        }

        // Parse volume
        const { value: volumeValue, unit: volumeUnit } = this.parseVolume(
          scraped.volume,
        );

        // Create product
        const product = await this.prisma.product.create({
          data: {
            name: scraped.name,
            brandId: brandId,
            categoryLegacy: scraped.category,
            markets: ['US'],
            volumeValue: volumeValue,
            volumeUnit: volumeUnit,
            description: `Sourced from ${scraped.source}`,
            source: scraped.source,
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

    this.logger.log(
      `Import complete: ${result.productsCreated} products created, ${skippedCount} skipped (already exist), ${result.linkedSuccessfully} ingredients linked`,
    );
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
        category: true,
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
      const key = p.category?.name ?? p.categoryLegacy ?? 'Unknown';
      categoryBreakdown[key] = (categoryBreakdown[key] || 0) + 1;
    });

    return {
      totalProducts,
      totalIngredients,
      productsWithIngredients,
      averageIngredientsPerProduct: Math.round(averageIngredientsPerProduct * 100) / 100,
      categoryBreakdown,
    };
  }

  /**
   * Fix products missing ingredients by re-fetching from Open Beauty Facts
   * Searches for products by name and brand to find ingredient data
   */
  async fixProductsMissingIngredients(limit: number = 500): Promise<{
    totalChecked: number;
    productsFixed: number;
    ingredientsAdded: number;
    errors: Array<{ productId: string; error: string }>;
  }> {
    this.logger.log(`Starting to fix products missing ingredients (limit: ${limit})`);

    const result = {
      totalChecked: 0,
      productsFixed: 0,
      ingredientsAdded: 0,
      errors: [] as Array<{ productId: string; error: string }>,
    };

    try {
      // Find products without ingredients
      const productsWithoutIngredients = await this.prisma.product.findMany({
        where: {
          ingredients: {
            none: {},
          },
        },
        include: {
          brand: true,
        },
        take: limit,
      });

      result.totalChecked = productsWithoutIngredients.length;
      this.logger.log(`Found ${productsWithoutIngredients.length} products without ingredients`);

      for (const product of productsWithoutIngredients) {
        try {
          // Try multiple search strategies
          const searchQueries = [
            `${product.name} ${product.brand.name}`,
            product.name,
            product.brand.name,
          ];

          let matchedProduct: OpenBeautyFactsProduct | null = null;
          let foundProducts = 0;

          for (const searchQuery of searchQueries) {
            try {
              const obfProducts = await this.fetchOpenBeautyFactsProducts(searchQuery, 10);
              foundProducts += obfProducts.length;

              // Try to find a match by name similarity
              matchedProduct = obfProducts.find((p) => {
                const pName = (p.product_name || '').toLowerCase();
                const productName = product.name.toLowerCase();
                
                // Check if names are similar (at least 50% match)
                const nameWords = productName.split(/\s+/).filter(w => w.length > 3);
                const matchCount = nameWords.filter(w => pName.includes(w)).length;
                const similarity = nameWords.length > 0 ? matchCount / nameWords.length : 0;
                
                return similarity >= 0.5;
              });

              // If no match, try brand match
              if (!matchedProduct) {
                matchedProduct = obfProducts.find((p) => {
                  if (!p.brands) return false;
                  const pBrand = Array.isArray(p.brands) ? p.brands[0] : p.brands.split(',')[0];
                  const pBrandLower = pBrand.toLowerCase().trim();
                  const productBrandLower = product.brand.name.toLowerCase().trim();
                  return pBrandLower === productBrandLower || 
                         pBrandLower.includes(productBrandLower) || 
                         productBrandLower.includes(pBrandLower);
                });
              }

              if (matchedProduct) break;
            } catch (error) {
              this.logger.warn(`Search failed for "${searchQuery}": ${error.message}`);
            }

            // Small delay to avoid rate limiting
            await new Promise(resolve => setTimeout(resolve, 500));
          }

          if (matchedProduct) {
            // Check if matched product has ingredients
            if (matchedProduct.ingredients_text || matchedProduct.ingredients) {
              // Parse and link ingredients
              const parsed = this.parseOpenBeautyFactsProduct(matchedProduct);
              const linkedCount = await this.linkProductToIngredients(
                product.id,
                parsed.rawIngredientList,
              );

              if (linkedCount > 0) {
                result.productsFixed++;
                result.ingredientsAdded += linkedCount;
                this.logger.log(
                  `✓ Fixed: ${product.name} by ${product.brand.name} - added ${linkedCount} ingredients`,
                );
              } else {
                this.logger.warn(
                  `Found match but no ingredients extracted: ${product.name} (matched: ${matchedProduct.product_name})`,
                );
              }
            } else {
              this.logger.warn(
                `Found match but no ingredient data: ${product.name} (matched: ${matchedProduct.product_name})`,
              );
            }
          } else {
            this.logger.debug(
              `No match found: ${product.name} by ${product.brand.name} (searched ${foundProducts} products)`,
            );
          }
        } catch (error) {
          result.errors.push({
            productId: product.id,
            error: error.message,
          });
          this.logger.error(`Error fixing product ${product.id}: ${error.message}`);
        }

        // Delay between products to avoid rate limiting
        await new Promise(resolve => setTimeout(resolve, 1000));
      }

      this.logger.log(
        `Fix complete: ${result.productsFixed} products fixed, ${result.ingredientsAdded} ingredients added`,
      );
    } catch (error) {
      this.logger.error(`Error in fixProductsMissingIngredients: ${error.message}`);
      throw error;
    }

    return result;
  }

  /**
   * Fix incorrect categories for existing products using product name analysis
   */
  async fixProductCategories(limit: number = 100): Promise<{
    totalChecked: number;
    productsFixed: number;
    categoryChanges: Array<{ productId: string; oldCategory: string; newCategory: string }>;
    errors: Array<{ productId: string; error: string }>;
  }> {
    this.logger.log(`Starting to fix product categories (limit: ${limit})`);

    const result = {
      totalChecked: 0,
      productsFixed: 0,
      categoryChanges: [] as Array<{ productId: string; oldCategory: string; newCategory: string }>,
      errors: [] as Array<{ productId: string; error: string }>,
    };

    try {
      // Get all products (or limit)
      const products = await this.prisma.product.findMany({
        take: limit,
      });

      result.totalChecked = products.length;
      this.logger.log(`Checking ${products.length} products for category fixes`);

      for (const product of products) {
        try {
          // Analyze product name to determine correct category
          const correctCategory = this.analyzeProductNameForCategory(product.name);

          // Only update if category is different
          if (correctCategory !== product.categoryLegacy) {
            await this.prisma.product.update({
              where: { id: product.id },
              data: { categoryLegacy: correctCategory },
            });

            result.productsFixed++;
            result.categoryChanges.push({
              productId: product.id,
              oldCategory: product.categoryLegacy || 'Unknown',
              newCategory: correctCategory,
            });

            this.logger.log(
              `Fixed category: ${product.name} - ${product.categoryLegacy} → ${correctCategory}`,
            );
          }
        } catch (error) {
          result.errors.push({
            productId: product.id,
            error: error.message,
          });
          this.logger.error(`Error fixing category for product ${product.id}: ${error.message}`);
        }
      }

      this.logger.log(
        `Category fix complete: ${result.productsFixed} products fixed`,
      );
    } catch (error) {
      this.logger.error(`Error in fixProductCategories: ${error.message}`);
      throw error;
    }

    return result;
  }

  /**
   * Clean up products without ingredients
   * Deletes products that have no ingredient links
   * @param dryRun - If true, only reports what would be deleted without actually deleting
   */
  async cleanupProductsWithoutIngredients(
    dryRun: boolean = false,
  ): Promise<{
    totalFound: number;
    deleted: number;
    products: Array<{ id: string; name: string; brand: string }>;
    errors: Array<{ productId: string; error: string }>;
  }> {
    this.logger.log(
      `Starting cleanup of products without ingredients (dryRun: ${dryRun})`,
    );

    const result = {
      totalFound: 0,
      deleted: 0,
      products: [] as Array<{ id: string; name: string; brand: string }>,
      errors: [] as Array<{ productId: string; error: string }>,
    };

    try {
      // Find all products without ingredients
      const productsWithoutIngredients = await this.prisma.product.findMany({
        where: {
          ingredients: {
            none: {},
          },
        },
        include: {
          brand: true,
        },
      });

      result.totalFound = productsWithoutIngredients.length;
      result.products = productsWithoutIngredients.map((p) => ({
        id: p.id,
        name: p.name,
        brand: p.brand.name,
      }));

      this.logger.log(
        `Found ${productsWithoutIngredients.length} products without ingredients`,
      );

      if (dryRun) {
        this.logger.log(
          `DRY RUN: Would delete ${productsWithoutIngredients.length} products`,
        );
        return result;
      }

      // Delete products one by one (to handle any foreign key constraints gracefully)
      for (const product of productsWithoutIngredients) {
        try {
          await this.prisma.product.delete({
            where: { id: product.id },
          });
          result.deleted++;
          this.logger.debug(`Deleted product: ${product.name} by ${product.brand.name}`);
        } catch (error) {
          result.errors.push({
            productId: product.id,
            error: error.message,
          });
          this.logger.error(
            `Error deleting product ${product.id} (${product.name}): ${error.message}`,
          );
        }
      }

      this.logger.log(
        `Cleanup complete: ${result.deleted} products deleted (${result.errors.length} errors)`,
      );
    } catch (error) {
      this.logger.error(`Error in cleanupProductsWithoutIngredients: ${error.message}`);
      throw error;
    }

    return result;
  }

  /**
   * Delete all imported products (from scrapers)
   * Keeps seed data if needed
   * @param keepSeedData - If true, only deletes products with source from scrapers
   */
  async deleteAllImportedProducts(keepSeedData: boolean = false): Promise<{
    deleted: number;
    errors: Array<{ productId: string; error: string }>;
  }> {
    this.logger.log(
      `Starting deletion of all imported products${keepSeedData ? ' (keeping seed data)' : ''}`,
    );

    const result = {
      deleted: 0,
      errors: [] as Array<{ productId: string; error: string }>,
    };

    try {
      let productsToDelete;

      if (keepSeedData) {
        // Only delete products from scrapers (not seed data)
        productsToDelete = await this.prisma.product.findMany({
          where: {
            description: {
              contains: 'Sourced from',
            },
          },
          include: {
            brand: true,
          },
        });
      } else {
        // Delete all products
        productsToDelete = await this.prisma.product.findMany({
          include: {
            brand: true,
          },
        });
      }

      this.logger.log(`Found ${productsToDelete.length} products to delete`);

      // Delete products one by one (to handle foreign key constraints)
      for (const product of productsToDelete) {
        try {
          await this.prisma.product.delete({
            where: { id: product.id },
          });
          result.deleted++;
          this.logger.debug(`Deleted product: ${product.name} by ${product.brand.name}`);
        } catch (error) {
          result.errors.push({
            productId: product.id,
            error: error.message,
          });
          this.logger.error(
            `Error deleting product ${product.id} (${product.name}): ${error.message}`,
          );
        }
      }

      // Also delete orphaned ingredients (not linked to any product)
      const orphanedIngredients = await this.prisma.ingredient.findMany({
        where: {
          productIngredients: {
            none: {},
          },
        },
      });

      if (orphanedIngredients.length > 0) {
        this.logger.log(`Deleting ${orphanedIngredients.length} orphaned ingredients`);
        await this.prisma.ingredient.deleteMany({
          where: {
            id: {
              in: orphanedIngredients.map((i) => i.id),
            },
          },
        });
      }

      this.logger.log(
        `Cleanup complete: ${result.deleted} products deleted (${result.errors.length} errors)`,
      );
    } catch (error) {
      this.logger.error(`Error in deleteAllImportedProducts: ${error.message}`);
      throw error;
    }

    return result;
  }

  /**
   * Parse CSV data into ScrapedProduct array
   * Supports flexible column mapping
   */
  parseCSV(csvText: string): ScrapedProduct[] {
    const lines = csvText.split('\n').filter((line) => line.trim().length > 0);
    if (lines.length < 2) {
      throw new Error('CSV must have at least a header row and one data row');
    }

    // Parse header row
    const header = this.parseCSVLine(lines[0]);
    const headerLower = header.map((h) => h.toLowerCase().trim());

    // Find column indices (flexible matching)
    const findColumn = (variations: string[]): number => {
      for (const variation of variations) {
        const idx = headerLower.findIndex((h) => h.includes(variation));
        if (idx >= 0) return idx;
      }
      return -1;
    };

    const nameIdx = findColumn(['name', 'product', 'product_name', 'title']);
    const brandIdx = findColumn(['brand', 'brands', 'manufacturer', 'company']);
    const categoryIdx = findColumn(['category', 'type', 'product_type', 'product_type']);
    const ingredientsIdx = findColumn([
      'ingredients',
      'ingredient',
      'ingredients_text',
      'ingredient_list',
      'ingredient_list_text',
    ]);
    const volumeIdx = findColumn(['volume', 'size', 'quantity', 'amount', 'ml', 'oz']);
    const descriptionIdx = findColumn(['description', 'desc', 'details', 'info']);

    if (nameIdx === -1) {
      throw new Error('CSV must have a "name" or "product" column');
    }

    if (ingredientsIdx === -1) {
      throw new Error('CSV must have an "ingredients" column');
    }

    // Parse data rows
    const products: ScrapedProduct[] = [];
    for (let i = 1; i < lines.length; i++) {
      try {
        const row = this.parseCSVLine(lines[i]);
        if (row.length < header.length) {
          // Pad with empty strings if row is shorter
          while (row.length < header.length) {
            row.push('');
          }
        }

        const name = row[nameIdx]?.trim() || '';
        const brand = brandIdx >= 0 ? row[brandIdx]?.trim() || 'Unknown' : 'Unknown';
        const rawIngredientList = row[ingredientsIdx]?.trim() || '';

        // Skip rows without name or ingredients
        if (!name || !rawIngredientList || rawIngredientList.length < 5) {
          continue;
        }

        // Determine category
        let category = 'Serum'; // Default
        if (categoryIdx >= 0 && row[categoryIdx]) {
          const categoryValue = row[categoryIdx].trim().toLowerCase();
          // Direct mapping for common CSV category values
          const categoryMap: Record<string, string> = {
            moisturiser: 'Moisturizer',
            moisturizer: 'Moisturizer',
            serum: 'Serum',
            cleanser: 'Cleanser',
            toner: 'Toner',
            sunscreen: 'Sunscreen',
            mask: 'Mask',
            essence: 'Essence',
            oil: 'Oil',
            exfoliator: 'Exfoliator',
            treatment: 'Treatment',
          };
          category = categoryMap[categoryValue] || this.analyzeProductNameForCategory(row[categoryIdx].trim());
        } else {
          category = this.analyzeProductNameForCategory(name);
        }

        // Extract volume
        const volume = volumeIdx >= 0 ? row[volumeIdx]?.trim() : undefined;

        products.push({
          name,
          brand,
          category,
          volume,
          rawIngredientList,
          source: 'csv_import',
        });
      } catch (error) {
        this.logger.warn(`Error parsing CSV row ${i + 1}: ${error.message}`);
        continue;
      }
    }

    return products;
  }

  /**
   * Parse a single CSV line, handling quoted fields
   */
  private parseCSVLine(line: string): string[] {
    const result: string[] = [];
    let current = '';
    let inQuotes = false;

    for (let i = 0; i < line.length; i++) {
      const char = line[i];

      if (char === '"') {
        if (inQuotes && line[i + 1] === '"') {
          // Escaped quote
          current += '"';
          i++; // Skip next quote
        } else {
          // Toggle quote state
          inQuotes = !inQuotes;
        }
      } else if (char === ',' && !inQuotes) {
        // Field separator
        result.push(current);
        current = '';
      } else {
        current += char;
      }
    }

    // Add last field
    result.push(current);

    return result;
  }
}

