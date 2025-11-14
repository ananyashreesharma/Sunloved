import { Controller, Get, Query, Param, NotFoundException } from '@nestjs/common';
import { ProductsService, ProductDetail, ProductListItem } from './products.service';

@Controller('products')
export class ProductsController {
  constructor(private readonly productsService: ProductsService) {}

  // GET /api/products/search?query=niacinamide
  @Get('search')
  search(@Query('query') query: string): ProductListItem[] {
    if (!query) return [];
    return this.productsService.search(query);
  }

  // GET /api/products/:id
  @Get(':id')
  getOne(@Param('id') id: string): ProductDetail {
    const product = this.productsService.findOne(id);
    if (!product) {
      throw new NotFoundException('Product not found');
    }
    return product;
  }
}
