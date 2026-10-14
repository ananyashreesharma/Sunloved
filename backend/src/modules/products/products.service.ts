import { createHash } from 'crypto';
import { Injectable, Inject, forwardRef } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import { ComparisonsService } from '../comparisons/comparisons.service';
import { SearchProductsDto } from './dto/search-products.dto';
import { scoreProductSearchMatch } from './product-search-match';

export interface ProductListItem {
  id: string;
  name: string;
  brand: string;
  imageUrl?: string;
  /** Leaf category display name (taxonomy) or legacy text */
  category?: string;
  categorySlug?: string;
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
  overallScore?: number | null;
  /** 0–100 when search used relevance ranking */
  matchScore?: number;
  /** INCI/display names that matched the query */
  matchedIngredients?: string[];
  /** First few INCI names for quick preview in search UI */
  ingredientPreview?: string[];
  /** Ordered INCI rows with safety hints from catalog */
  ingredientRows?: Array<{
    inciName: string;
    displayName?: string | null;
    zone?: string | null;
    safetyRating?: string | null;
    shortDescription?: string | null;
    isParaben?: boolean;
    isFragrance?: boolean;
  }>;
}

/** Derive ingredient-based boolean flags from a product's ingredient list. */
function deriveIngredientFlags(ingredients: Array<{ ingredient: { isParaben: boolean; isSulfate: boolean; isFragrance: boolean; inciName: string } }>) {
  const parabenFree = ingredients.every((pi) => !pi.ingredient.isParaben);
  const sulfateFree = ingredients.every((pi) => !pi.ingredient.isSulfate);
  const fragranceFree = ingredients.every((pi) => !pi.ingredient.isFragrance);
  const alcoholFree = ingredients.every((pi) => {
    const n = pi.ingredient.inciName.toLowerCase();
    return !n.includes('alcohol') && !n.includes('ethanol');
  });
  const siliconesFree = ingredients.every((pi) => {
    const n = pi.ingredient.inciName.toLowerCase();
    return !n.includes('dimethicone') && !n.includes('silicone') && !n.includes('siloxane');
  });
  return { parabenFree, sulfateFree, fragranceFree, alcoholFree, siliconesFree };
}

@Injectable()
export class ProductsService {
  constructor(
    private prisma: PrismaService,
    @Inject(forwardRef(() => ComparisonsService))
    private comparisonsService: ComparisonsService,
  ) {}

  async search(params: SearchProductsDto): Promise<{
    data: ProductDetail[];
    meta: {
      page: number;
      pageSize: number;
      total: number;
      totalPages: number;
      matchRanked?: boolean;
      matchRankNote?: string;
    };
  }> {
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
    const andConditions: any[] = [];

    if (query && query !== '*') {
      const q = query.toLowerCase();
      andConditions.push({
        OR: [
          { name: { contains: q, mode: 'insensitive' } },
          { brand: { name: { contains: q, mode: 'insensitive' } } },
          { categoryLegacy: { contains: q, mode: 'insensitive' } },
          { category: { name: { contains: q, mode: 'insensitive' } } },
          { category: { slug: { contains: q, mode: 'insensitive' } } },
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

    if (brand) {
      andConditions.push({
        brand: { name: { equals: brand, mode: 'insensitive' } },
      });
    }

    // Category filter: match legacy label, taxonomy slug, or taxonomy name
    if (category) {
      const c = category.trim();
      andConditions.push({
        OR: [
          { categoryLegacy: { equals: c, mode: 'insensitive' } },
          { category: { slug: { equals: c, mode: 'insensitive' } } },
          { category: { name: { equals: c, mode: 'insensitive' } } },
        ],
      });
    }

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

    const where: any =
      andConditions.length > 0
        ? { AND: [{ deletedAt: null }, ...andConditions] }
        : { deletedAt: null };

    let orderBy: any = { name: 'asc' };
    if (sort === 'price_asc') {
      orderBy = { prices: { _min: { amount: 'asc' } } };
    } else if (sort === 'price_desc') {
      orderBy = { prices: { _max: { amount: 'desc' } } };
    } else if (sort === 'newest') {
      orderBy = { createdAt: 'desc' };
    }

    const qTrimmed = (query && query !== '*' ? query : '').trim();
    const useSmartRank =
      sort === 'relevance' && qTrimmed.length > 0;

    const total = await this.prisma.product.count({ where });
    const RANK_MAX = 500;

    const listInclude = {
      brand: true,
      ingredients: {
        where: { moderationStatus: 'approved' as const },
        include: { ingredient: true },
        orderBy: { position: 'asc' as const },
      },
      prices: { include: { retailer: true } },
      category: true,
    };

    if (useSmartRank && total <= RANK_MAX) {
      const allProducts = await this.prisma.product.findMany({
        where,
        include: listInclude,
      });
      const scored = allProducts.map((p) => {
        const { score, matchedIngredients } = scoreProductSearchMatch(qTrimmed, p);
        return { p, score, matchedIngredients };
      });
      scored.sort((a, b) => {
        if (b.score !== a.score) return b.score - a.score;
        return a.p.name.localeCompare(b.p.name);
      });
      const pageSlice = scored.slice(skip, skip + pageSize);
      const data = pageSlice.map(({ p, score, matchedIngredients }) =>
        this.mapSearchListRow(p, {
          matchScore: score,
          matchedIngredients,
        }),
      );
      return {
        data,
        meta: {
          page,
          pageSize,
          total,
          totalPages: Math.ceil(total / pageSize) || 1,
          matchRanked: true,
        },
      };
    }

    const products = await this.prisma.product.findMany({
      where,
      skip,
      take: pageSize,
      orderBy,
      include: listInclude,
    });

    const data = products.map((p) => {
      if (useSmartRank && total > RANK_MAX) {
        const { score, matchedIngredients } = scoreProductSearchMatch(qTrimmed, p);
        return this.mapSearchListRow(p, {
          matchScore: score,
          matchedIngredients,
        });
      }
      return this.mapSearchListRow(p);
    });

    if (useSmartRank && total > RANK_MAX) {
      data.sort((a, b) => (b.matchScore ?? 0) - (a.matchScore ?? 0));
    }

    return {
      data,
      meta: {
        page,
        pageSize,
        total,
        totalPages: Math.ceil(total / pageSize) || 1,
        ...(useSmartRank && total > RANK_MAX
          ? { matchRanked: false, matchRankNote: 'large_catalog_page_hint' }
          : {}),
      },
    };
  }

  private mapSearchListRow(
    p: {
      id: string;
      name: string;
      volumeValue: any;
      volumeUnit: string | null;
      description: string | null;
      imageUrl: string | null;
      pricePerUnit: any;
      price: any;
      originalProductId: string | null;
      categoryLegacy: string;
      brand: {
        name: string;
        isCrueltyFree: boolean;
        isVeganBrand: boolean;
      };
      category: { name: string; slug: string } | null;
      ingredients: Array<{
        ingredient: { inciName: string; isParaben: boolean; isSulfate: boolean; isFragrance: boolean };
      }>;
    },
    extra?: { matchScore?: number; matchedIngredients?: string[] },
  ): ProductDetail {
    let volume: string | undefined;
    if (p.volumeValue && p.volumeUnit) {
      volume = `${p.volumeValue}${p.volumeUnit}`;
    } else if (p.volumeValue) {
      volume = p.volumeValue.toString();
    }

    const flags = deriveIngredientFlags(p.ingredients);
    const ingredientPreview = p.ingredients
      .slice(0, 10)
      .map((pi) => pi.ingredient.inciName);

    return {
      id: p.id,
      name: p.name,
      brand: p.brand.name,
      volume,
      description: p.description || undefined,
      category: (p.category?.name ?? p.categoryLegacy) || undefined,
      categorySlug: p.category?.slug,
      imageUrl: p.imageUrl || undefined,
      pricePerUnit: p.pricePerUnit ? Number(p.pricePerUnit) : undefined,
      currentPrice: p.price ? Number(p.price) : undefined,
      originalProduct: p.originalProductId || undefined,
      crueltyFree: p.brand.isCrueltyFree,
      vegan: p.brand.isVeganBrand,
      ...flags,
      fungalAcneSafe: false,
      sourcesCheckedDaysAgo: undefined,
      actives: p.ingredients.map((pi) => pi.ingredient.inciName),
      ingredientPreview,
      ...(extra?.matchScore != null ? { matchScore: extra.matchScore } : {}),
      ...(extra?.matchedIngredients?.length
        ? { matchedIngredients: extra.matchedIngredients }
        : {}),
    };
  }

  async findOne(id: string): Promise<ProductDetail | undefined> {
    const product = await this.prisma.product.findFirst({
      where: { id, deletedAt: null },
      include: {
        brand: true,
        ingredients: {
          where: { moderationStatus: 'approved' },
          include: { ingredient: true },
          orderBy: { position: 'asc' },
        },
        prices: { include: { retailer: true } },
        category: true,
      },
    });

    if (!product) return undefined;

    let volume: string | undefined;
    if (product.volumeValue && product.volumeUnit) {
      volume = `${product.volumeValue}${product.volumeUnit}`;
    } else if (product.volumeValue) {
      volume = product.volumeValue.toString();
    }

    const flags = deriveIngredientFlags(product.ingredients);

    let dupes: any[] = [];
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
    } catch {
      // Dupes are optional — if comparison fails, continue without them
    }

    const sortedPrices = [...product.prices].sort(
      (a, b) => Number(a.amount) - Number(b.amount),
    );
    const pricesDetail =
      sortedPrices.length > 0
        ? sortedPrices.map((p, i) => ({
            retailer: p.retailer.name,
            amount: Number(p.amount),
            currency: p.currency,
            best: i === 0,
          }))
        : undefined;

    const ingredientRows = product.ingredients.map((pi) => ({
      inciName: pi.ingredient.inciName,
      displayName: pi.ingredient.displayName,
      zone: pi.ingredient.zone,
      safetyRating: pi.ingredient.safetyRating,
      shortDescription: pi.ingredient.shortDescription,
      isParaben: pi.ingredient.isParaben,
      isFragrance: pi.ingredient.isFragrance,
    }));

    return {
      id: product.id,
      name: product.name,
      brand: product.brand.name,
      volume,
      description: product.description || undefined,
      imageUrl: product.imageUrl || undefined,
      category: (product.category?.name ?? product.categoryLegacy) || undefined,
      categorySlug: product.category?.slug,
      pricePerUnit: product.pricePerUnit ? Number(product.pricePerUnit) : undefined,
      currentPrice: product.price ? Number(product.price) : undefined,
      originalProduct: product.originalProductId || undefined,
      crueltyFree: product.brand.isCrueltyFree,
      vegan: product.brand.isVeganBrand,
      ...flags,
      fungalAcneSafe: false,
      sourcesCheckedDaysAgo: undefined,
      actives: product.ingredients.map((pi) => pi.ingredient.inciName),
      dupes: dupes.length > 0 ? dupes : undefined,
      prices: pricesDetail,
      overallScore: product.overallScore != null ? Number(product.overallScore) : null,
      ingredientRows,
    };
  }

  /**
   * Type-ahead search for the checker: every word must match the product or brand name
   * ("himalaya neem"), only products with an ingredient list, the user's country's formulation
   * first. One query, a handful of results.
   */
  async find(q: string, country?: string) {
    const tokens = q.toLowerCase().split(/\s+/).map((t) => t.replace(/[%_\\]/g, '')).filter((t) => t.length > 0).slice(0, 6);
    if (!tokens.length || q.trim().length < 2) return [];
    const conditions = tokens.map((t) => Prisma.sql`(lower(p.name) LIKE ${'%' + t + '%'} OR lower(b.name) LIKE ${'%' + t + '%'})`);
    const rows = await this.prisma.$queryRaw<{ id: string; name: string; brand: string; country: string | null; n: number }[]>`
      SELECT p.id, p.name, b.name AS brand, p.country,
             (SELECT count(*)::int FROM product_ingredients pi WHERE pi."productId" = p.id) AS n
      FROM products p JOIN brands b ON b.id = p."brandId"
      WHERE p."deletedAt" IS NULL AND ${Prisma.join(conditions, ' AND ')}
        AND EXISTS (SELECT 1 FROM product_ingredients pi WHERE pi."productId" = p.id)
      ORDER BY (p.country = ${country ?? ''}) DESC,
               (lower(p.name) LIKE ${tokens[0] + '%'} OR lower(b.name) LIKE ${tokens[0] + '%'}) DESC,
               length(p.name)
      LIMIT 8`;
    return rows.map((r) => ({ id: r.id, name: r.name, brand: r.brand, country: r.country, ingredientCount: r.n }));
  }

  /** A product's ingredient list in label order, as text the checker reads like a pasted label. */
  async label(id: string) {
    const product = await this.prisma.product.findFirst({
      where: { id, deletedAt: null },
      select: {
        id: true,
        name: true,
        country: true,
        brand: { select: { name: true } },
        ingredients: {
          where: { moderationStatus: 'approved' },
          orderBy: { position: 'asc' },
          select: { ingredient: { select: { inciName: true } } },
        },
      },
    });
    if (!product) return null;
    return {
      id: product.id,
      name: product.name,
      brand: product.brand.name,
      country: product.country,
      inci: product.ingredients.map((i) => i.ingredient.inciName).join(', '),
    };
  }

  /** Products in the clean catalogue for a country (with an ingredient list). */
  async coverage(country: string) {
    if (!country) return { country, products: 0 };
    const products = await this.prisma.product.count({ where: { deletedAt: null, country, ingredients: { some: {} } } });
    return { country, products };
  }

  /** Queue a checked label for review; the same country + name + list just counts again. */
  async submitLabel(country: string, name: string, ingredients: string) {
    const norm = (s: string) => s.normalize('NFKC').toLowerCase().replace(/\s+/g, ' ').trim();
    const fingerprint = createHash('sha256').update(`${country}|${norm(name)}|${norm(ingredients)}`).digest('hex');
    await this.prisma.labelSubmission.upsert({
      where: { fingerprint },
      update: { timesSeen: { increment: 1 } },
      create: { country, name: name.trim(), ingredients: ingredients.trim(), fingerprint },
    });
  }

  /** Products with a known label, for the sitemap. */
  async index() {
    return this.prisma.$queryRaw<{ id: string; updatedAt: Date }[]>`
      SELECT p.id, p."updatedAt" FROM products p
      WHERE p."deletedAt" IS NULL AND EXISTS (SELECT 1 FROM product_ingredients pi WHERE pi."productId" = p.id)
      ORDER BY p.id`;
  }
}
