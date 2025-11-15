import { Body, Controller, Post, UseGuards, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { AdminGuard } from '../../common/guards/admin.guard';

/**
 * Admin Controller
 * 
 * Protected endpoints for managing products, ingredients, and prices.
 * All endpoints require x-admin-key header.
 * 
 * Usage:
 * POST /api/admin/products -H "x-admin-key: supersecret-123" -d {...}
 * POST /api/admin/prices -H "x-admin-key: supersecret-123" -d {...}
 */
@Controller('admin')
@UseGuards(AdminGuard)
export class AdminController {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Create or update a product
   * 
   * POST /api/admin/products
   * Headers: x-admin-key: YOUR_KEY
   * 
   * Body:
   * {
   *   "id": "optional-uuid",
   *   "name": "Niacinamide 10% + Zinc 1%",
   *   "brand": "The Ordinary",
   *   "volume": "30ml",
   *   "description": "...",
   *   "category": "Serum",
   *   "pricePerUnit": 5.90,
   *   "currentPrice": 5.90,
   *   "imageUrl": "https://...",
   *   "productUrl": "https://..."
   * }
   */
  @Post('products')
  async upsertProduct(
    @Body()
    body: {
      id?: string;
      name: string;
      brand: string;
      volume?: string;
      description?: string;
      category?: string;
      pricePerUnit?: number;
      currentPrice?: number;
      imageUrl?: string;
      productUrl?: string;
      originalProduct?: string;
    },
  ) {
    try {
      if (!body.name || !body.brand) {
        throw new BadRequestException('name and brand are required');
      }

      const product = await this.prisma.product.upsert({
        where: { id: body.id || 'new-product-' + Date.now() },
        update: {
          name: body.name,
          brand: body.brand,
          volume: body.volume,
          description: body.description,
          category: body.category,
          pricePerUnit: body.pricePerUnit,
          currentPrice: body.currentPrice,
          imageUrl: body.imageUrl,
          productUrl: body.productUrl,
          originalProduct: body.originalProduct,
          updatedAt: new Date(),
        },
        create: {
          name: body.name,
          brand: body.brand,
          volume: body.volume || '',
          description: body.description || '',
          category: body.category,
          pricePerUnit: body.pricePerUnit,
          currentPrice: body.currentPrice,
          imageUrl: body.imageUrl,
          productUrl: body.productUrl,
          originalProduct: body.originalProduct,
        },
      });

      return {
        data: product,
        meta: { action: 'upsert', timestamp: new Date() },
        error: null,
      };
    } catch (error) {
      throw new BadRequestException(
        error instanceof Error ? error.message : 'Failed to upsert product',
      );
    }
  }

  /**
   * Upsert a product price for a retailer
   * 
   * POST /api/admin/prices
   * Headers: x-admin-key: YOUR_KEY
   * 
   * Body:
   * {
   *   "productId": "uuid",
   *   "retailerId": "uuid",
   *   "amount": 5.90,
   *   "currency": "USD"
   * }
   */
  @Post('prices')
  async upsertPrice(
    @Body()
    body: {
      productId: string;
      retailerId: string;
      amount: number;
      currency?: string;
    },
  ) {
    try {
      if (!body.productId || !body.retailerId || body.amount === undefined) {
        throw new BadRequestException(
          'productId, retailerId, and amount are required',
        );
      }

      // Verify product exists
      const product = await this.prisma.product.findUnique({
        where: { id: body.productId },
      });
      if (!product) {
        throw new BadRequestException(`Product not found: ${body.productId}`);
      }

      // Verify retailer exists
      const retailer = await this.prisma.retailer.findUnique({
        where: { id: body.retailerId },
      });
      if (!retailer) {
        throw new BadRequestException(
          `Retailer not found: ${body.retailerId}`,
        );
      }

      const price = await this.prisma.productPrice.upsert({
        where: {
          productId_retailerId: {
            productId: body.productId,
            retailerId: body.retailerId,
          },
        },
        update: {
          amount: body.amount,
          currency: body.currency || 'USD',
          lastCheckedAt: new Date(),
        },
        create: {
          productId: body.productId,
          retailerId: body.retailerId,
          amount: body.amount,
          currency: body.currency || 'USD',
          lastCheckedAt: new Date(),
        },
        include: {
          retailer: true,
          product: true,
        },
      });

      return {
        data: price,
        meta: { action: 'upsert', timestamp: new Date() },
        error: null,
      };
    } catch (error) {
      throw new BadRequestException(
        error instanceof Error ? error.message : 'Failed to upsert price',
      );
    }
  }

  /**
   * Create or update an ingredient
   * 
   * POST /api/admin/ingredients
   * Headers: x-admin-key: YOUR_KEY
   * 
   * Body:
   * {
   *   "name": "Niacinamide",
   *   "scientificName": "Vitamin B3",
   *   "category": "Vitamin",
   *   "function": "Brightening, antioxidant",
   *   "isIrritant": false,
   *   "fungalAcneSafe": true
   * }
   */
  @Post('ingredients')
  async upsertIngredient(
    @Body()
    body: {
      name: string;
      scientificName?: string;
      category?: string;
      function?: string;
      isIrritant?: boolean;
      fungalAcneSafe?: boolean;
    },
  ) {
    try {
      if (!body.name) {
        throw new BadRequestException('name is required');
      }

      const ingredient = await this.prisma.ingredient.upsert({
        where: { name: body.name },
        update: {
          scientificName: body.scientificName,
          category: body.category,
          function: body.function,
          isIrritant: body.isIrritant ?? false,
          fungalAcneSafe: body.fungalAcneSafe ?? true,
        },
        create: {
          name: body.name,
          scientificName: body.scientificName,
          category: body.category,
          function: body.function,
          isIrritant: body.isIrritant ?? false,
          fungalAcneSafe: body.fungalAcneSafe ?? true,
        },
      });

      return {
        data: ingredient,
        meta: { action: 'upsert', timestamp: new Date() },
        error: null,
      };
    } catch (error) {
      throw new BadRequestException(
        error instanceof Error ? error.message : 'Failed to upsert ingredient',
      );
    }
  }
}

