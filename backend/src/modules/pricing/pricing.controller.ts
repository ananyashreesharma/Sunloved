import { Controller, Get, Param } from '@nestjs/common';
import { PricingService } from './pricing.service';

@Controller('prices')
export class PricingController {
  constructor(private readonly pricingService: PricingService) {}

  /**
   * GET /api/prices/:productId
   * Returns prices for a product across all retailers
   */
  @Get(':productId')
  async getPricesForProduct(@Param('productId') productId: string) {
    return await this.pricingService.getPricesForProduct(productId);
  }

  /**
   * GET /api/prices/:productId/comparison
   * Returns detailed price comparison including stats
   */
  @Get(':productId/comparison')
  async getPriceComparison(@Param('productId') productId: string) {
    return await this.pricingService.getPriceComparison(productId);
  }
}
