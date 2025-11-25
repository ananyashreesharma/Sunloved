import { Injectable, Inject, forwardRef } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { ComparisonsService } from '../comparisons/comparisons.service';
import { SearchProductsDto } from './dto/search-products.dto';

export interface ProductListItem {
  id: string;
  name: string;
  brand: string;
  imageUrl?: string;
  category?: string;
  tags?: string[];
}

export interface ProductDetail extends ProductListItem {
  volume?: string;
  description?: string;
  pricePerUnit?: number | string;
  currentPrice?: number;
  originalProduct?: string;
  ingredientSummary?: string;
  actives?: string[];
  dupes?: ProductListItem[];
  prices?: {
    retailer: string;
    amount: number;
    currency: string;
    best?: boolean;
  }[];
  crueltyFree?: boolean;
  vegan?: boolean;
  fragranceFree?: boolean;
  alcoholFree?: boolean;
  fungalAcneSafe?: boolean;
  parabenFree?: boolean;
  sulfateFree?: boolean;
  siliconesFree?: boolean;
  sourcesCheckedDaysAgo?: number;
}

@Injectable()
export class ProductsService {
  constructor(
    private prisma: PrismaService,
    @Inject(forwardRef(() => ComparisonsService))
    private comparisonsService: ComparisonsService,
  ) {}

  // OLD MOCK DATA (fallback if DB not set up)
  private readonly mockProducts: ProductDetail[] = [
    {
      id: 'the-ordinary-niacinamide-10-zinc-1',
      name: 'Niacinamide 10% + Zinc 1%',
      brand: 'The Ordinary',
      category: 'Serum',
      imageUrl: 'https://example.com/ordinary-niacinamide.jpg',
      tags: ['Niacinamide', 'Brightening', 'Budget-friendly'],
      ingredientSummary:
        'Hydrating and brightening formula with niacinamide and zinc PCA. Low irritation risk for most skin types.',
      actives: ['Niacinamide', 'Zinc PCA'],
      dupes: [
        {
          id: 'minimalist-niacinamide-10',
          name: '10% Niacinamide Face Serum',
          brand: 'Minimalist',
          category: 'Serum',
          imageUrl: 'https://example.com/minimalist-niacinamide.jpg',
          tags: ['Niacinamide', 'Oil-control'],
        },
      ],
      prices: [
        { retailer: 'sephora', amount: 5.0, currency: 'USD', best: true },
        { retailer: 'amazon', amount: 6.0, currency: 'USD', best: false },
      ],
    },
    {
      id: 'minimalist-niacinamide-10',
      name: '10% Niacinamide Face Serum',
      brand: 'Minimalist',
      category: 'Serum',
      imageUrl: 'https://example.com/minimalist-niacinamide.jpg',
      tags: ['Niacinamide', 'Oil-control'],
      ingredientSummary:
        'Simple niacinamide serum focused on oil control and texture. Lightweight and suitable for oily to combination skin.',
      actives: ['Niacinamide'],
      dupes: [],
      prices: [
        { retailer: 'amazon', amount: 499, currency: 'INR', best: true },
      ],
    },
  ];

  // Search using Prisma with filters + pagination
  async search(params: SearchProductsDto): Promise<{
    data: ProductDetail[];
    meta: {
      page: number;
      pageSize: number;
      total: number;
      totalPages: number;
    };
  }> {
    try {
      const {
        query,
        brand,
        category,
        minPrice,
        maxPrice,
        page = 1,
        pageSize = 20,
        sort = 'relevance',
      } = params;

      const skip = (page - 1) * pageSize;

      // Build AND conditions array to combine text search with filters
      const andConditions: any[] = [];

      // RUTHLESS: Only show products with ingredients
      andConditions.push({
        ingredients: {
          some: {}, // At least one ingredient link exists
        },
      });

      // Text search (only if query is not wildcard "*")
      if (query && query !== '*') {
        const q = query.toLowerCase();
        andConditions.push({
          OR: [
            { name: { contains: q, mode: 'insensitive' } },
            { brand: { name: { contains: q, mode: 'insensitive' } } },
            { category: { contains: q, mode: 'insensitive' } },
            { description: { contains: q, mode: 'insensitive' } },
            {
              ingredients: {
                some: {
                  ingredient: {
                    OR: [
                      { inciName: { contains: q, mode: 'insensitive' } },
                      { displayName: { contains: q, mode: 'insensitive' } },
                    ],
                  },
                },
              },
            },
          ],
        });
      }

      // Brand filter
      if (brand) {
        andConditions.push({
          brand: { name: { equals: brand, mode: 'insensitive' } },
        });
      }

      // Category filter
      if (category) {
        andConditions.push({ category: { equals: category, mode: 'insensitive' } });
      }

      // Price filter (by lowest price across retailers)
      if (minPrice !== undefined || maxPrice !== undefined) {
        andConditions.push({
          prices: {
            some: {
              amount: {
                ...(minPrice !== undefined ? { gte: minPrice } : {}),
                ...(maxPrice !== undefined ? { lte: maxPrice } : {}),
              },
            },
          },
        });
      }

      // Combine all conditions with AND
      const where: any = andConditions.length > 0 ? { AND: andConditions } : {};

      // Determine sort order
      let orderBy: any = { name: 'asc' };
      if (sort === 'price_asc') {
        orderBy = { prices: { _min: { amount: 'asc' } } };
      } else if (sort === 'price_desc') {
        orderBy = { prices: { _max: { amount: 'desc' } } };
      } else if (sort === 'newest') {
        orderBy = { createdAt: 'desc' };
      }

      // Execute query with transaction
      const [products, total] = await this.prisma.$transaction([
        this.prisma.product.findMany({
          where,
          skip,
          take: pageSize,
          orderBy,
          include: {
            brand: true,
            ethics: true,
            ingredients: {
              include: {
                ingredient: true,
              },
              orderBy: {
                position: 'asc',
              },
            },
            prices: {
              include: {
                retailer: true,
              },
            },
          },
        }),
        this.prisma.product.count({ where }),
      ]);

      // Transform to ProductDetail
      const data = products.map((p) => {
        // Format volume
        let volume: string | undefined;
        if (p.volumeValue && p.volumeUnit) {
          volume = `${p.volumeValue}${p.volumeUnit}`;
        } else if (p.volumeValue) {
          volume = p.volumeValue.toString();
        }

        // Get effective ethics (product-level or brand-level)
        const isCrueltyFree = p.ethics?.isCrueltyFree ?? p.brand.isCrueltyFree;
        const isVegan = p.ethics?.isVegan ?? p.brand.isVeganBrand;

        return {
          id: p.id,
          name: p.name,
          brand: p.brand.name,
          volume: volume,
          description: p.description || undefined,
          category: p.category || undefined,
          imageUrl: p.imageUrl || undefined,
          pricePerUnit: p.pricePerUnit ? Number(p.pricePerUnit) : undefined,
          currentPrice: p.price ? Number(p.price) : undefined,
          originalProduct: p.originalProductId || undefined,
          crueltyFree: isCrueltyFree,
          vegan: isVegan,
          fragranceFree: p.ethics?.isFragranceFree ?? false,
          alcoholFree: p.ethics?.isAlcoholFree ?? false,
          fungalAcneSafe: false, // TODO: Calculate from ingredients
          parabenFree: p.ethics?.isParabenFree ?? false,
          sulfateFree: p.ethics?.isSulfateFree ?? false,
          siliconesFree: false, // TODO: Add to schema if needed
          sourcesCheckedDaysAgo: p.ethics?.lastVerifiedAt
            ? Math.floor(
                (Date.now() - p.ethics.lastVerifiedAt.getTime()) /
                  (1000 * 60 * 60 * 24),
              )
            : undefined,
          actives: p.ingredients.map((pi) => pi.ingredient.inciName),
        };
      });

      return {
        data,
        meta: {
          page,
          pageSize,
          total,
          totalPages: Math.ceil(total / pageSize),
        },
      };
    } catch (error) {
      console.error('Search error:', error.message);
      // Fallback to mock data with pagination
      const q = params.query?.toLowerCase() || '';
      const filtered = this.mockProducts.filter(
        (p) =>
          p.name.toLowerCase().includes(q) ||
          p.brand.toLowerCase().includes(q) ||
          p.description?.toLowerCase().includes(q) ||
          p.actives?.some((a) => a.toLowerCase().includes(q)),
      );

      const page = params.page || 1;
      const pageSize = params.pageSize || 20;
      const skip = (page - 1) * pageSize;
      const total = filtered.length;

      return {
        data: filtered.slice(skip, skip + pageSize).map((p) => ({
          id: p.id,
          name: p.name,
          brand: p.brand,
          imageUrl: p.imageUrl,
          category: p.category,
        })),
        meta: {
          page,
          pageSize,
          total,
          totalPages: Math.ceil(total / pageSize),
        },
      };
    }
  }

  // Get full details using Prisma
  async findOne(id: string): Promise<ProductDetail | undefined> {
    try {
      const product = await this.prisma.product.findUnique({
        where: { id },
        include: {
          brand: true,
          ethics: true,
          ingredients: {
            include: {
              ingredient: true,
            },
            orderBy: {
              position: 'asc',
            },
          },
          prices: {
            include: {
              retailer: true,
            },
          },
        },
      });

      if (!product) return undefined;

      // RUTHLESS: Only return products with ingredients
      if (!product.ingredients || product.ingredients.length === 0) {
        return undefined;
      }

      // Format volume
      let volume: string | undefined;
      if (product.volumeValue && product.volumeUnit) {
        volume = `${product.volumeValue}${product.volumeUnit}`;
      } else if (product.volumeValue) {
        volume = product.volumeValue.toString();
      }

      // Get effective ethics (product-level or brand-level)
      const isCrueltyFree = product.ethics?.isCrueltyFree ?? product.brand.isCrueltyFree;
      const isVegan = product.ethics?.isVegan ?? product.brand.isVeganBrand;

      // Calculate days since last verified
      const sourcesCheckedDaysAgo = product.ethics?.lastVerifiedAt
        ? Math.floor(
            (Date.now() - product.ethics.lastVerifiedAt.getTime()) /
              (1000 * 60 * 60 * 24),
          )
        : undefined;

      // Get similar products (dupes) asynchronously
      let dupes = [];
      try {
        const comparisons = await this.comparisonsService.findSimilarProducts(product.id);
        dupes = comparisons.slice(0, 3).map((c) => ({
          id: c.id,
          name: c.name,
          brand: c.brand,
          category: c.category,
          imageUrl: c.imageUrl,
          similarityScore: c.similarityScore,
          matchType: c.matchType,
          savingsPercent: c.savingsPercent,
        }));
      } catch (error) {
        console.error('Error fetching dupes:', error.message);
        // Dupes are optional, so we continue without them
      }

      return {
        id: product.id,
        name: product.name,
        brand: product.brand.name,
        volume: volume,
        description: product.description || undefined,
        imageUrl: product.imageUrl || undefined,
        category: product.category || undefined,
        pricePerUnit: product.pricePerUnit ? Number(product.pricePerUnit) : undefined,
        currentPrice: product.price ? Number(product.price) : undefined,
        originalProduct: product.originalProductId || undefined,
        crueltyFree: isCrueltyFree,
        vegan: isVegan,
        fragranceFree: product.ethics?.isFragranceFree ?? false,
        alcoholFree: product.ethics?.isAlcoholFree ?? false,
        fungalAcneSafe: false, // TODO: Calculate from ingredients
        parabenFree: product.ethics?.isParabenFree ?? false,
        sulfateFree: product.ethics?.isSulfateFree ?? false,
        siliconesFree: false, // TODO: Add to schema if needed
        sourcesCheckedDaysAgo,
        actives: product.ingredients.map((pi) => pi.ingredient.inciName),
        dupes: dupes.length > 0 ? dupes : undefined,
      };
    } catch (error) {
      console.error('Database not connected, using mock data:', error.message);
      // Fallback to mock data
      return this.mockProducts.find((p) => p.id === id);
    }
  }
}
