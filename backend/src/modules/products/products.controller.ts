import { Controller, Get, Query, Param, NotFoundException } from '@nestjs/common';
import { ProductsService, ProductDetail } from './products.service';
import { SearchProductsDto } from './dto/search-products.dto';

@Controller('products')
export class ProductsController {
  constructor(private readonly productsService: ProductsService) {}

  /**
   * Search products with filters, pagination, and sorting
   * 
   * GET /api/products/search?query=niacinamide&brand=the-ordinary&category=serum&minPrice=5&maxPrice=50&page=1&pageSize=20&sort=price_asc
   * 
   * Query Parameters:
   * - query (optional): Text search by name, brand, description, or ingredients
   * - brand (optional): Filter by brand name
   * - category (optional): Legacy label, taxonomy leaf name, or leaf slug (e.g. face-serum)
   * - minPrice (optional): Minimum price filter
   * - maxPrice (optional): Maximum price filter
   * - page (optional, default=1): Page number for pagination
   * - pageSize (optional, default=20): Number of results per page (max 100)
   * - sort (optional, default=relevance): Sort by 'relevance', 'price_asc', 'price_desc', or 'newest'
   * 
   * Response: { data: [...], meta: { page, pageSize, total, totalPages } }
   */
  @Get('search')
  async search(@Query() queryParams: SearchProductsDto) {
    return this.productsService.search(queryParams);
  }

  /** GET /api/products/index: products with a known label (sitemap). */
  @Get('index')
  index() {
    return this.productsService.index();
  }

  /** Type-ahead: GET /api/products/find?q=himalaya%20neem&country=IN */
  @Get('find')
  find(@Query('q') q = '', @Query('country') country?: string) {
    return this.productsService.find(String(q).slice(0, 80), country && /^[A-Z]{2}$/.test(country) ? country : undefined);
  }

  /** A product's ingredient list in label order. */
  @Get(':id/label')
  async label(@Param('id') id: string) {
    const label = await this.productsService.label(id);
    if (!label) throw new NotFoundException('Product not found');
    return label;
  }

  /**
   * Get a single product with full details
   * 
   * GET /api/products/:id
   * 
   * Response: { data: { id, name, brand, description, prices, dupes, ethics, ... }, meta: {} }
   */
  @Get(':id')
  async getOne(@Param('id') id: string): Promise<ProductDetail> {
    const product = await this.productsService.findOne(id);
    if (!product) {
      throw new NotFoundException('Product not found');
    }
    return product;
  }
}
