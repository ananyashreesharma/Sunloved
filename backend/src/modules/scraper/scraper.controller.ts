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
  ) {
    this.logger.log(`Fetching from Open Beauty Facts: ${query}`);

    try {
      const products = await this.scraperService.fetchOpenBeautyFactsProducts(
        query,
        Math.min(limit, 500), // Cap at 500
      );

      const parsed = products.map((p) => this.scraperService.parseOpenBeautyFactsProduct(p));

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
    @Body() body: { query: string; limit?: number },
  ): Promise<{ data: ImportResult; meta: null; error: null }> {
    const { query, limit = 100 } = body;

    this.logger.log(`Starting import from Open Beauty Facts: ${query}`);

    try {
      // Fetch products from API
      const obfProducts = await this.scraperService.fetchOpenBeautyFactsProducts(
        query,
        Math.min(limit, 500),
      );

      // Parse to standard format
      const scrapedProducts = obfProducts.map((p) =>
        this.scraperService.parseOpenBeautyFactsProduct(p),
      );

      // Bulk import
      const result = await this.scraperService.bulkImportProducts(scrapedProducts);

      this.logger.log(`Import complete: ${result.productsCreated} products created`);

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
}

