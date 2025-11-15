import { Controller, Get, Param, NotFoundException } from '@nestjs/common';
import { ComparisonsService, ProductComparison } from './comparisons.service';

@Controller('comparisons')
export class ComparisonsController {
  constructor(private readonly comparisonsService: ComparisonsService) {}

  /**
   * GET /api/comparisons/:productId
   * 
   * Returns a ranked list of similar products (dupes) with:
   * - Similarity scores (0-100)
   * - Shared actives (ingredients)
   * - Savings percent
   * - Human-readable reason for match
   * - Match type (best-value, closest-match, sensitive-safe)
   * 
   * Response:
   * {
   *   "data": [
   *     {
   *       "id": "...",
   *       "name": "...",
   *       "brand": "...",
   *       "similarity": 87,
   *       "sharedActives": ["Niacinamide", "Zinc PCA"],
   *       "savingsPercent": 32,
   *       "reason": "Shares Niacinamide, Zinc PCA, 87% ingredient overlap, ~32% cheaper.",
   *       "matchType": "best-value"
   *     }
   *   ],
   *   "meta": {
   *     "productId": "...",
   *     "count": 5
   *   }
   * }
   */
  @Get(':productId')
  async getSimilarProducts(@Param('productId') productId: string) {
    try {
      const comparisons = await this.comparisonsService.findSimilarProducts(productId);
      // Response will be automatically wrapped with { data, meta } by TransformInterceptor
      // But we can add the productId to meta if we return it with the meta
      return {
        data: comparisons,
        meta: {
          productId,
          count: comparisons.length,
        },
      };
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      throw new NotFoundException('Could not find similar products');
    }
  }
}
