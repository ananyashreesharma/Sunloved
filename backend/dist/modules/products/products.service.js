"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ProductsService = void 0;
const common_1 = require("@nestjs/common");
let ProductsService = class ProductsService {
    constructor() {
        this.products = [
            {
                id: 'the-ordinary-niacinamide-10-zinc-1',
                name: 'Niacinamide 10% + Zinc 1%',
                brand: 'The Ordinary',
                category: 'Serum',
                imageUrl: 'https://example.com/ordinary-niacinamide.jpg',
                tags: ['Niacinamide', 'Brightening', 'Budget-friendly'],
                ingredientSummary: 'Hydrating and brightening formula with niacinamide and zinc PCA. Low irritation risk for most skin types.',
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
                ingredientSummary: 'Simple niacinamide serum focused on oil control and texture. Lightweight and suitable for oily to combination skin.',
                actives: ['Niacinamide'],
                dupes: [],
                prices: [
                    { retailer: 'amazon', amount: 499, currency: 'INR', best: true },
                ],
            },
        ];
    }
    search(query) {
        const q = query.toLowerCase();
        return this.products
            .filter((p) => p.name.toLowerCase().includes(q) ||
            p.brand.toLowerCase().includes(q))
            .map((p) => ({
            id: p.id,
            name: p.name,
            brand: p.brand,
            imageUrl: p.imageUrl,
            category: p.category,
            tags: p.tags,
        }));
    }
    findOne(id) {
        return this.products.find((p) => p.id === id);
    }
};
exports.ProductsService = ProductsService;
exports.ProductsService = ProductsService = __decorate([
    (0, common_1.Injectable)()
], ProductsService);
//# sourceMappingURL=products.service.js.map