import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

export interface RetailerPrice {
  id: string;
  retailer: string;
  retailerSlug: string;
  amount: number;
  currency: string;
  best: boolean;
  lastCheckedAt: Date;
}

@Injectable()
export class PricingService {
  constructor(private prisma: PrismaService) {}

  /**
   * Get all prices for a product, sorted by amount (cheapest first)
   */
  async getPricesForProduct(productId: string): Promise<RetailerPrice[]> {
    // Verify product exists
    const product = await this.prisma.product.findUnique({
      where: { id: productId },
    });

    if (!product) {
      throw new NotFoundException(`Product with ID ${productId} not found`);
    }

    // Get all prices for this product with retailer info
    const prices = await this.prisma.productPrice.findMany({
      where: { productId },
      include: { retailer: true },
      orderBy: { amount: 'asc' }, // Cheapest first
    });

    if (prices.length === 0) {
      return [];
    }

    // Find the minimum price to mark as "best"
    const minPrice = prices[0].amount;

    // Transform to response format
    return prices.map((price, index) => ({
      id: price.id,
      retailer: price.retailer.name,
      retailerSlug: price.retailer.slug,
      amount: Number(price.amount),
      currency: price.currency,
      best: index === 0, // First (cheapest) is best
      lastCheckedAt: price.lastCheckedAt,
    }));
  }

  /**
   * Get price comparison info for a product
   * Returns min, max, average, and savings potential
   */
  async getPriceComparison(productId: string) {
    const prices = await this.getPricesForProduct(productId);

    if (prices.length === 0) {
      return {
        productId,
        prices: [],
        stats: null,
      };
    }

    const amounts = prices.map((p) => p.amount);
    const minPrice = Math.min(...amounts);
    const maxPrice = Math.max(...amounts);
    const avgPrice = amounts.reduce((a, b) => a + b, 0) / amounts.length;
    const savingsPercent = Math.round(((maxPrice - minPrice) / maxPrice) * 100);

    return {
      productId,
      prices,
      stats: {
        minPrice,
        maxPrice,
        avgPrice: Math.round(avgPrice * 100) / 100,
        savingsPercent,
        retailerCount: prices.length,
      },
    };
  }
}
