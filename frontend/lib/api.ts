const API_BASE =
  process.env.NEXT_PUBLIC_API_BASE || 'http://localhost:2000/api';

// For dev: if frontend is on 3002, ensure backend is on 2000
// const API_BASE = 'http://localhost:2000/api';

export async function searchProducts(query: string, page: number = 1, pageSize: number = 20, filters?: any) {
  const params = new URLSearchParams({
    query: query || '',
    page: page.toString(),
    pageSize: pageSize.toString(),
    ...(filters?.brand && { brand: filters.brand }),
    ...(filters?.category && { category: filters.category }),
    ...(filters?.minPrice && { minPrice: filters.minPrice.toString() }),
    ...(filters?.maxPrice && { maxPrice: filters.maxPrice.toString() }),
    ...(filters?.sort && { sort: filters.sort }),
  });
  
  const res = await fetch(`${API_BASE}/products/search?${params.toString()}`, {
    cache: 'no-store',
  });
  if (!res.ok) throw new Error('Failed to search products');
  const result = await res.json();
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

