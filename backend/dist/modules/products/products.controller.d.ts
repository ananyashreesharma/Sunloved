import { ProductsService, ProductDetail, ProductListItem } from './products.service';
export declare class ProductsController {
    private readonly productsService;
    constructor(productsService: ProductsService);
    search(query: string): ProductListItem[];
    getOne(id: string): ProductDetail;
}
