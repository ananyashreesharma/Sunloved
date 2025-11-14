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
export declare class ProductsService {
    private readonly products;
    search(query: string): ProductListItem[];
    findOne(id: string): ProductDetail | undefined;
}
