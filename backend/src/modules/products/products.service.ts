import { Injectable } from '@nestjs/common';

export interface ProductListItem {
  id: string;
  name: string;
  brand: string;
  imageUrl?: string;
  category?: string;
  tags?: string[];
}

export interface ProductDetail extends ProductListItem {
  ingredientSummary?: string;
  actives?: string[];
  dupes?: ProductListItem[];
  prices?: {
    retailer: string;
    amount: number;
    currency: string;
    best?: boolean;
  }[];
}

@Injectable()
export class ProductsService {
  // Temporary "fake DB"
  private readonly products: ProductDetail[] = [
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

  // Very basic search by name/brand
  search(query: string): ProductListItem[] {
    const q = query.toLowerCase();

    return this.products
      .filter(
        (p) =>
          p.name.toLowerCase().includes(q) ||
          p.brand.toLowerCase().includes(q),
      )
      .map((p) => ({
        id: p.id,
        name: p.name,
        brand: p.brand,
        imageUrl: p.imageUrl,
        category: p.category,
        tags: p.tags,
      }));
  }

  // Get full details
  findOne(id: string): ProductDetail | undefined {
    return this.products.find((p) => p.id === id);
  }
}
