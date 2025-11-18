import { Controller, Post, Get, Body, Query, UseGuards, Logger } from '@nestjs/common';
import { ScraperService, ScrapedProduct, ImportResult } from './scraper.service';
import { AdminGuard } from '../../common/guards/admin.guard';

@Controller('scraper')
export class ScraperController {
  private readonly logger = new Logger(ScraperController.name);

  constructor(private readonly scraperService: ScraperService) {}

  /**
   * Fetch products from Open Beauty Facts API
   * Requires admin key
   *
   * GET /api/scraper/open-beauty-facts?query=serum&limit=50
   */
  @Get('open-beauty-facts')
  @UseGuards(AdminGuard)
  async fetchOpenBeautyFacts(
    @Query('query') query: string = 'serum',
    @Query('limit') limit: number = 100,
    @Query('requireIngredients') requireIngredients: string = 'true',
  ) {
    const requireIngredientsBool = requireIngredients === 'true';
    this.logger.log(
      `Fetching from Open Beauty Facts: ${query}${requireIngredientsBool ? ' (with ingredients)' : ''}`,
    );

    try {
      const products = await this.scraperService.fetchOpenBeautyFactsProducts(
        query,
        Math.min(limit, 500), // Cap at 500
        requireIngredientsBool,
      );

      const parsed = products
        .map((p) => this.scraperService.parseOpenBeautyFactsProduct(p))
        .filter((p): p is ScrapedProduct => p !== null);

      return {
        data: {
          count: parsed.length,
          products: parsed,
          source: 'openbeautyfacts',
        },
        meta: null,
        error: null,
      };
    } catch (error) {
      throw error;
    }
  }

  /**
   * Import Open Beauty Facts data in bulk
   * Requires admin key
   *
   * POST /api/scraper/import/open-beauty-facts
   * Body: { query: "serum", limit: 100 }
   */
  @Post('import/open-beauty-facts')
  @UseGuards(AdminGuard)
  async importOpenBeautyFacts(
    @Body() body: { query: string; limit?: number; requireIngredients?: boolean },
  ): Promise<{ data: ImportResult; meta: null; error: null }> {
    const { query, limit = 100, requireIngredients = true } = body;

    this.logger.log(
      `Starting import from Open Beauty Facts: ${query}${requireIngredients ? ' (ingredients required)' : ' (all products)'}`,
    );

    try {
      // Fetch products from API (with ingredient filtering by default)
      const obfProducts = await this.scraperService.fetchOpenBeautyFactsProducts(
        query,
        Math.min(limit, 500),
        requireIngredients,
      );

      // RUTHLESS: Parse to standard format, filter out nulls (products without ingredients)
      const scrapedProducts = obfProducts
        .map((p) => this.scraperService.parseOpenBeautyFactsProduct(p))
        .filter((p): p is ScrapedProduct => p !== null);

      if (scrapedProducts.length === 0) {
        this.logger.warn(
          `No products with ingredients found for query: ${query}. Try a different search term or set requireIngredients=false`,
        );
      }

      // Bulk import
      const result = await this.scraperService.bulkImportProducts(scrapedProducts);

      this.logger.log(
        `Import complete: ${result.productsCreated} products created (from ${scrapedProducts.length} valid products)`,
      );

      return {
        data: result,
        meta: null,
        error: null,
      };
    } catch (error) {
      this.logger.error(`Import failed: ${error.message}`);
      throw error;
    }
  }

  /**
   * Import products from Kaggle CSV file (uploaded as JSON)
   * Requires admin key
   *
   * POST /api/scraper/import/kaggle-sephora
   * Body: { products: [{ Product_Name: "...", Brand: "...", Product_Type: "...", Ingredients: "..." }] }
   */
  @Post('import/kaggle-sephora')
  @UseGuards(AdminGuard)
  async importKaggleSephora(@Body() body: { products: any[] }): Promise<{
    data: ImportResult;
    meta: null;
    error: null;
  }> {
    this.logger.log(`Starting import from Kaggle Sephora data: ${body.products.length} products`);

    try {
      // Parse Kaggle format to standard format
      const scrapedProducts = body.products.map((p) =>
        this.scraperService.parseKaggleSephoraProduct(p),
      );

      // Bulk import
      const result = await this.scraperService.bulkImportProducts(scrapedProducts);

      this.logger.log(`Kaggle import complete: ${result.productsCreated} products created`);

      return {
        data: result,
        meta: null,
        error: null,
      };
    } catch (error) {
      this.logger.error(`Kaggle import failed: ${error.message}`);
      throw error;
    }
  }

  /**
   * Import raw scraped products directly
   * Requires admin key
   *
   * POST /api/scraper/import/raw
   * Body: { products: ScrapedProduct[] }
   */
  @Post('import/raw')
  @UseGuards(AdminGuard)
  async importRaw(@Body() body: { products: ScrapedProduct[] }): Promise<{
    data: ImportResult;
    meta: null;
    error: null;
  }> {
    this.logger.log(`Starting raw import: ${body.products.length} products`);

    try {
      const result = await this.scraperService.bulkImportProducts(body.products);

      return {
        data: result,
        meta: null,
        error: null,
      };
    } catch (error) {
      this.logger.error(`Raw import failed: ${error.message}`);
      throw error;
    }
  }

  /**
   * Import products from CSV file
   * Requires admin key
   *
   * POST /api/scraper/import/csv
   * Body: { csv: "name,brand,ingredients\nProduct 1,Brand 1,Ingredient 1, Ingredient 2" }
   *
   * CSV Format:
   * - Required columns: name (or product/product_name), ingredients (or ingredient/ingredients_text)
   * - Optional columns: brand, category (or type/product_type), volume (or size/quantity), description
   *
   * Example CSV:
   * name,brand,category,ingredients,volume
   * "Niacinamide Serum","The Ordinary","Serum","Niacinamide, Water, Glycerin","30ml"
   */
  @Post('import/csv')
  @UseGuards(AdminGuard)
  async importCSV(@Body() body: { csv: string }): Promise<{
    data: ImportResult;
    meta: null;
    error: null;
  }> {
    this.logger.log('Starting CSV import');

    try {
      if (!body.csv || typeof body.csv !== 'string') {
        throw new Error('CSV data is required (as string)');
      }

      // Parse CSV
      const scrapedProducts = this.scraperService.parseCSV(body.csv);

      if (scrapedProducts.length === 0) {
        this.logger.warn('No valid products found in CSV');
        return {
          data: {
            totalProcessed: 0,
            productsCreated: 0,
            ingredientsCreated: 0,
            linkedSuccessfully: 0,
            errors: [],
          },
          meta: null,
          error: null,
        };
      }

      this.logger.log(`Parsed ${scrapedProducts.length} products from CSV`);

      // Bulk import
      const result = await this.scraperService.bulkImportProducts(scrapedProducts);

      this.logger.log(`CSV import complete: ${result.productsCreated} products created`);

      return {
        data: result,
        meta: null,
        error: null,
      };
    } catch (error) {
      this.logger.error(`CSV import failed: ${error.message}`);
      throw error;
    }
  }

  /**
   * Get import statistics
   * Shows database state after imports
   *
   * GET /api/scraper/stats
   */
  @Get('stats')
  async getStats() {
    this.logger.log('Fetching scraper statistics');

    try {
      const stats = await this.scraperService.getImportStats();

      return {
        data: stats,
        meta: null,
        error: null,
      };
    } catch (error) {
      this.logger.error(`Stats fetch failed: ${error.message}`);
      throw error;
    }
  }

  /**
   * Fix products missing ingredients by re-fetching from Open Beauty Facts
   * Requires admin key
   *
   * POST /api/scraper/fix/missing-ingredients
   * Body: { limit: 50 }
   */
  @Post('fix/missing-ingredients')
  @UseGuards(AdminGuard)
  async fixMissingIngredients(@Body() body: { limit?: number }): Promise<{
    data: {
      totalChecked: number;
      productsFixed: number;
      ingredientsAdded: number;
      errors: Array<{ productId: string; error: string }>;
    };
    meta: null;
    error: null;
  }> {
    const { limit = 50 } = body;

    this.logger.log(`Starting to fix products missing ingredients (limit: ${limit})`);

    try {
      const result = await this.scraperService.fixProductsMissingIngredients(limit);

      return {
        data: result,
        meta: null,
        error: null,
      };
    } catch (error) {
      this.logger.error(`Fix failed: ${error.message}`);
      throw error;
    }
  }

  /**
   * Fix incorrect categories for existing products using product name analysis
   * Requires admin key
   *
   * POST /api/scraper/fix/categories
   * Body: { limit: 100 }
   */
  @Post('fix/categories')
  @UseGuards(AdminGuard)
  async fixCategories(@Body() body: { limit?: number }): Promise<{
    data: {
      totalChecked: number;
      productsFixed: number;
      categoryChanges: Array<{ productId: string; oldCategory: string; newCategory: string }>;
      errors: Array<{ productId: string; error: string }>;
    };
    meta: null;
    error: null;
  }> {
    const { limit = 100 } = body;

    this.logger.log(`Starting to fix product categories (limit: ${limit})`);

    try {
      const result = await this.scraperService.fixProductCategories(limit);

      return {
        data: result,
        meta: null,
        error: null,
      };
    } catch (error) {
      this.logger.error(`Category fix failed: ${error.message}`);
      throw error;
    }
  }

  /**
   * Clean up products without ingredients
   * Requires admin key
   *
   * POST /api/scraper/cleanup/no-ingredients
   * Body: { dryRun: true } - Set dryRun to false to actually delete
   */
  @Post('cleanup/all-imported')
  @UseGuards(AdminGuard)
  async deleteAllImported(@Body() body: { keepSeedData?: boolean }): Promise<{
    data: {
      deleted: number;
      errors: Array<{ productId: string; error: string }>;
    };
    meta: null;
    error: null;
  }> {
    const { keepSeedData = false } = body;

    this.logger.log(
      `Starting deletion of all imported products${keepSeedData ? ' (keeping seed data)' : ''}`,
    );

    try {
      const result = await this.scraperService.deleteAllImportedProducts(keepSeedData);

      return {
        data: result,
        meta: null,
        error: null,
      };
    } catch (error) {
      this.logger.error(`Cleanup failed: ${error.message}`);
      throw error;
    }
  }

  @Post('cleanup/no-ingredients')
  @UseGuards(AdminGuard)
  async cleanupNoIngredients(@Body() body: { dryRun?: boolean }): Promise<{
    data: {
      totalFound: number;
      deleted: number;
      products: Array<{ id: string; name: string; brand: string }>;
      errors: Array<{ productId: string; error: string }>;
    };
    meta: null;
    error: null;
  }> {
    const { dryRun = true } = body; // Default to dry run for safety

    this.logger.log(
      `Starting cleanup of products without ingredients (dryRun: ${dryRun})`,
    );

    try {
      const result = await this.scraperService.cleanupProductsWithoutIngredients(dryRun);

      return {
        data: result,
        meta: null,
        error: null,
      };
    } catch (error) {
      this.logger.error(`Cleanup failed: ${error.message}`);
      throw error;
    }
  }
}

