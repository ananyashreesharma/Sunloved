const API_BASE =
  process.env.NEXT_PUBLIC_API_BASE || 'http://localhost:3001/api';

export async function searchProducts(query: string, page: number = 1, pageSize: number = 20, filters?: any) {
  const params = new URLSearchParams({
    page: page.toString(),
    pageSize: pageSize.toString(),
  });
  
  // Only add query if it's not empty
  if (query && query.trim() !== '') {
    params.set('query', query);
  }
  
  // Add filters
  if (filters?.brand) params.set('brand', filters.brand);
  if (filters?.category) params.set('category', filters.category);
  if (filters?.minPrice !== undefined) params.set('minPrice', filters.minPrice.toString());
  if (filters?.maxPrice !== undefined) params.set('maxPrice', filters.maxPrice.toString());
  if (filters?.sort) params.set('sort', filters.sort);
  
  const url = `${API_BASE}/products/search?${params.toString()}`;
  console.log('🌐 API Request:', url);
  
  const res = await fetch(url, {
    cache: 'no-store',
  });
  
  if (!res.ok) {
    const errorText = await res.text();
    console.error('❌ API Error:', res.status, errorText);
    throw new Error(`Failed to search products: ${res.status} ${errorText}`);
  }
  
  const result = await res.json();
  console.log('📦 API Response:', { 
    dataCount: result.data?.length || 0, 
    meta: result.meta,
    hasProducts: !!result.products 
  });
  
  // Return data array for backward compatibility, but also include meta
  return {
    products: result.data,
    ...result,
  };
}

export async function getProduct(id: string) {
  const res = await fetch(`${API_BASE}/products/${id}`);
  if (!res.ok) throw new Error('Failed to fetch product');
  const result = await res.json();
  // Extract data from standardized response format
  return result.data || result;
}

export async function analyzeIngredients(ingredients: string) {
  const res = await fetch(`${API_BASE}/ingredients/analyze`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ ingredients }),
  });
  if (!res.ok) throw new Error('Failed to analyze ingredients');
  const result = await res.json();
  // Extract data from standardized response format
  return result.data || result;
}

export async function getProductPrices(productId: string) {
  const res = await fetch(`${API_BASE}/prices/${productId}`);
  if (!res.ok) throw new Error('Failed to fetch prices');
  const result = await res.json();
  // Extract data from standardized response format
  return result.data || result;
}

export async function getComparisons(productId: string) {
  const res = await fetch(`${API_BASE}/comparisons/${productId}`);
  if (!res.ok) throw new Error('Failed to fetch comparisons');
  const result = await res.json();
  // Extract data from standardized response format
  return result.data || result;
}

export async function generateProductSummary(productData: {
  name: string;
  brand: string;
  category?: string;
  description?: string;
  ingredients?: string[];
  fragranceFree?: boolean;
  alcoholFree?: boolean;
  parabenFree?: boolean;
  sulfateFree?: boolean;
  crueltyFree?: boolean;
  vegan?: boolean;
}) {
  const res = await fetch(`${API_BASE}/ai/summary`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(productData),
    cache: 'no-store',
  });
  
  if (!res.ok) {
    const errorText = await res.text();
    console.error('❌ AI Summary Error:', res.status, errorText);
    throw new Error(`Failed to generate summary: ${res.status} ${errorText}`);
  }
  
  const result = await res.json();
  return result.data || null;
}

