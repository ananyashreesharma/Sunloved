const API_BASE =
  process.env.NEXT_PUBLIC_API_BASE || 'http://localhost:2000/api';

export async function searchProducts(query: string) {
  const res = await fetch(`${API_BASE}/products/search?query=${encodeURIComponent(query)}`);
  if (!res.ok) throw new Error('Failed to search products');
  return res.json();
}

export async function getProduct(id: string) {
  const res = await fetch(`${API_BASE}/products/${id}`);
  if (!res.ok) throw new Error('Failed to fetch product');
  return res.json();
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
  return res.json();
}

