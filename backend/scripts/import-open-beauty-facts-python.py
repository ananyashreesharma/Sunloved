#!/usr/bin/env python3
"""
Python-based Open Beauty Facts Import Script for Sunloved
Better data cleaning, ingredient parsing, and validation than JavaScript
"""

import json
import re
import sys
import requests
import time
from typing import List, Dict, Optional, Tuple

# Configuration
ADMIN_KEY = "VITrJCdveiGHxYwtEEcrA0MKjYCxMmz70bmmR0mG7dc="
BASE_URL = "http://localhost:9000/api"
OPEN_BEAUTY_FACTS_URL = "https://world.openbeautyfacts.org"
BATCH_SIZE = 50
WAIT_BETWEEN_REQUESTS = 2  # Seconds

# Colors for terminal output
class Colors:
    RED = '\033[0;31m'
    GREEN = '\033[0;32m'
    YELLOW = '\033[1;33m'
    CYAN = '\033[0;36m'
    BLUE = '\033[0;34m'
    NC = '\033[0m'  # No Color


def print_colored(message: str, color: str = Colors.NC):
    """Print colored message"""
    print(f"{color}{message}{Colors.NC}")


def clean_ingredient_name(ingredient: str) -> Optional[str]:
    """
    Clean and validate ingredient name
    Removes invalid entries like "children's sunscreen", percentages, etc.
    """
    if not ingredient:
        return None
    
    # Remove leading/trailing whitespace
    ingredient = ingredient.strip()
    
    # Skip if too short (likely not a real ingredient)
    if len(ingredient) < 3:
        return None
    
    # Skip if it's clearly not an ingredient (common false positives)
    invalid_patterns = [
        r'^children\'?s?\s+',
        r'^adult\'?s?\s+',
        r'^baby\s+',
        r'^infant\s+',
        r'^toddler\s+',
        r'^kids?\s+',
        r'^spf\s*\d+',
        r'^\d+\s*spf',
        r'^water\s*resistant',
        r'^broad\s*spectrum',
        r'^uv\s*protection',
        r'^sunscreen\s*$',
        r'^moisturizer\s*$',
        r'^serum\s*$',
        r'^cream\s*$',
        r'^lotion\s*$',
        r'^gel\s*$',
        r'^treatment\s*$',
        r'^product\s*$',
        r'^formula\s*$',
        r'^solution\s*$',
        r'^ml\s*$',
        r'^oz\s*$',
        r'^\d+\s*ml\s*$',
        r'^\d+\s*oz\s*$',
        r'^\d+\s*fl\s*oz\s*$',
        r'^size:',
        r'^volume:',
        r'^quantity:',
        r'^en:',
        r'^fr:',
        r'^de:',
        r'^es:',
    ]
    
    ingredient_lower = ingredient.lower()
    for pattern in invalid_patterns:
        if re.match(pattern, ingredient_lower):
            return None
    
    # Remove percentages and concentrations
    ingredient = re.sub(r'\d+[\d.]*\s*%', '', ingredient)
    
    # Remove parenthetical notes (but keep INCI names in parentheses)
    # Only remove if it's clearly a note, not an INCI name
    ingredient = re.sub(r'\([^)]*(?:note|see|refer|ml|oz|size|volume|quantity)[^)]*\)', '', ingredient, flags=re.IGNORECASE)
    
    # Remove common prefixes that aren't part of ingredient names
    ingredient = re.sub(r'^(contains|may contain|with|includes|plus|and|or)\s+', '', ingredient, flags=re.IGNORECASE)
    
    # Remove language prefixes (en:, fr:, etc.)
    ingredient = re.sub(r'^(en|fr|de|es|it|pt):', '', ingredient, flags=re.IGNORECASE)
    
    # Clean up extra whitespace
    ingredient = ' '.join(ingredient.split())
    
    # Skip if cleaned ingredient is too short or empty
    if len(ingredient) < 3:
        return None
    
    # Skip if it's just a number or mostly numbers
    if re.match(r'^\d+[\d.\s]*$', ingredient):
        return None
    
    return ingredient


def parse_ingredient_list(raw_list: str) -> List[str]:
    """
    Parse raw ingredient list into clean ingredient names
    Handles INCI format, comma-separated, with proper cleaning
    """
    if not raw_list or len(raw_list.strip()) < 5:
        return []
    
    # Split by comma (handles INCI format)
    raw_ingredients = [ing.strip() for ing in raw_list.split(',')]
    
    cleaned_ingredients = []
    for ingredient in raw_ingredients:
        cleaned = clean_ingredient_name(ingredient)
        if cleaned:
            cleaned_ingredients.append(cleaned)
    
    # Remove duplicates while preserving order
    seen = set()
    unique_ingredients = []
    for ing in cleaned_ingredients:
        ing_lower = ing.lower()
        if ing_lower not in seen:
            seen.add(ing_lower)
            unique_ingredients.append(ing)
    
    # Limit to 30 ingredients max per product
    return unique_ingredients[:30]


def has_valid_ingredients(product: Dict) -> bool:
    """
    Check if product has valid ingredient data
    More thorough than JavaScript version
    """
    # Check multiple ingredient fields
    ingredient_fields = [
        product.get('ingredients_text'),
        product.get('ingredients_text_en'),
        product.get('ingredients_text_fr'),
        product.get('ingredients_text_de'),
        product.get('ingredients_text_es'),
        product.get('ingredients_text_with_allergens'),
    ]
    
    for field in ingredient_fields:
        if field and isinstance(field, str) and len(field.strip()) >= 5:
            # Validate that it contains actual ingredients, not just metadata
            parsed = parse_ingredient_list(field)
            if len(parsed) > 0:
                return True
    
    # Check ingredients_tags array
    if product.get('ingredients_tags') and isinstance(product.get('ingredients_tags'), list):
        tags = product.get('ingredients_tags', [])
        if len(tags) > 0:
            # Validate tags
            valid_tags = [tag for tag in tags if tag and isinstance(tag, str) and len(tag.strip()) >= 3]
            if len(valid_tags) > 0:
                return True
    
    # Check structured ingredients array
    if product.get('ingredients') and isinstance(product.get('ingredients'), list):
        ingredients = product.get('ingredients', [])
        if len(ingredients) > 0:
            return True
    
    # Fallback: extract from product name
    product_name = product.get('product_name', '')
    if product_name:
        # Check for common ingredient keywords in name
        ingredient_keywords = [
            'niacinamide', 'hyaluronic', 'vitamin c', 'vit c', 'retinol', 'peptide',
            'salicylic', 'glycolic', 'lactic', 'azelaic', 'tranexamic', 'ceramide',
            'snail', 'centella', 'argan', 'jojoba', 'rosehip', 'squalane', 'collagen',
            'elastin', 'coenzyme', 'coq10', 'alpha hydroxy', 'aha', 'beta hydroxy',
            'bha', 'polyhydroxy', 'pha',
        ]
        name_lower = product_name.lower()
        for keyword in ingredient_keywords:
            if keyword in name_lower:
                return True
    
    return False


def extract_ingredients_from_product(product: Dict) -> Optional[str]:
    """
    Extract ingredient list from product, prioritizing best quality sources
    """
    # Priority 1: English ingredients text
    if product.get('ingredients_text_en') and len(product.get('ingredients_text_en', '').strip()) >= 5:
        return product.get('ingredients_text_en').strip()
    
    # Priority 2: Generic ingredients_text
    if product.get('ingredients_text') and len(product.get('ingredients_text', '').strip()) >= 5:
        return product.get('ingredients_text').strip()
    
    # Priority 3: Other language variants
    for lang in ['fr', 'de', 'es']:
        field = f'ingredients_text_{lang}'
        if product.get(field) and len(product.get(field, '').strip()) >= 5:
            return product.get(field).strip()
    
    # Priority 4: Ingredients with allergens
    if product.get('ingredients_text_with_allergens') and len(product.get('ingredients_text_with_allergens', '').strip()) >= 5:
        return product.get('ingredients_text_with_allergens').strip()
    
    # Priority 5: Ingredients tags (array)
    if product.get('ingredients_tags') and isinstance(product.get('ingredients_tags'), list):
        tags = [tag for tag in product.get('ingredients_tags', []) if tag and isinstance(tag, str)]
        if len(tags) > 0:
            return ', '.join(tags)
    
    # Priority 6: Structured ingredients
    if product.get('ingredients') and isinstance(product.get('ingredients'), list):
        ingredients = product.get('ingredients', [])
        names = []
        for ing in ingredients:
            if isinstance(ing, dict) and ing.get('name'):
                names.append(ing.get('name'))
            elif isinstance(ing, str):
                names.append(ing)
        if len(names) > 0:
            return ', '.join(names)
    
    return None


def map_category_tag(tag: str) -> Optional[str]:
    """
    Map Open Beauty Facts category tag to our category enum
    More comprehensive than JavaScript version
    """
    if not tag or not isinstance(tag, str):
        return None
    
    # Remove language prefix (en:, fr:, etc.)
    clean_tag = re.sub(r'^(en|fr|de|es|it|pt):', '', tag.lower())
    
    category_map = {
        # Serums
        'serum': 'Serum',
        'serums': 'Serum',
        'face-serum': 'Serum',
        'face-serums': 'Serum',
        
        # Moisturizers
        'cream': 'Moisturizer',
        'creams': 'Moisturizer',
        'moisturizer': 'Moisturizer',
        'moisturizers': 'Moisturizer',
        'moisturising': 'Moisturizer',
        'face-cream': 'Moisturizer',
        'face-creams': 'Moisturizer',
        'lotion': 'Moisturizer',
        'lotions': 'Moisturizer',
        'emulsion': 'Moisturizer',
        'emulsions': 'Moisturizer',
        
        # Cleansers
        'cleanser': 'Cleanser',
        'cleansers': 'Cleanser',
        'face-cleanser': 'Cleanser',
        'face-cleansers': 'Cleanser',
        'wash': 'Cleanser',
        'soap': 'Cleanser',
        'soaps': 'Cleanser',
        'gel': 'Cleanser',
        'cleansing-gel': 'Cleanser',
        
        # Toners
        'toner': 'Toner',
        'toners': 'Toner',
        'face-toner': 'Toner',
        
        # Sunscreens
        'sunscreen': 'Sunscreen',
        'sunscreens': 'Sunscreen',
        'sunblock': 'Sunscreen',
        'sun-protection': 'Sunscreen',
        'spf': 'Sunscreen',
        
        # Masks
        'mask': 'Mask',
        'masks': 'Mask',
        'face-mask': 'Mask',
        'sheet-mask': 'Mask',
        
        # Essences
        'essence': 'Essence',
        'essences': 'Essence',
        
        # Oils
        'oil': 'Oil',
        'oils': 'Oil',
        'facial-oil': 'Oil',
        
        # Exfoliators
        'exfoliator': 'Exfoliator',
        'exfoliators': 'Exfoliator',
        'scrub': 'Exfoliator',
        'peel': 'Exfoliator',
        
        # Treatments
        'treatment': 'Treatment',
        'treatments': 'Treatment',
    }
    
    return category_map.get(clean_tag)


def analyze_product_name_for_category(name: str) -> str:
    """
    Analyze product name to determine category if not provided
    """
    if not name:
        return "Serum"
    
    name_lower = name.lower()
    
    # Check for category keywords in name
    if any(word in name_lower for word in ['moisturiz', 'cream', 'lotion', 'emulsion']):
        return 'Moisturizer'
    if any(word in name_lower for word in ['cleanser', 'wash', 'cleansing', 'soap']):
        return 'Cleanser'
    if any(word in name_lower for word in ['toner', 'toning']):
        return 'Toner'
    if any(word in name_lower for word in ['sunscreen', 'sunblock', 'spf']):
        return 'Sunscreen'
    if any(word in name_lower for word in ['mask']):
        return 'Mask'
    if any(word in name_lower for word in ['oil']):
        return 'Oil'
    if any(word in name_lower for word in ['exfoliat', 'scrub', 'peel']):
        return 'Exfoliator'
    if any(word in name_lower for word in ['serum', 'essence', 'ampoule', 'booster']):
        return 'Serum'
    
    return 'Serum'  # Default


def parse_brand(brands: any) -> str:
    """
    Parse brand from Open Beauty Facts format (can be string or array)
    """
    if not brands:
        return "Unknown"
    
    if isinstance(brands, list):
        if len(brands) > 0:
            return brands[0].strip()
        return "Unknown"
    
    if isinstance(brands, str):
        # Take first brand if comma-separated
        return brands.split(',')[0].strip()
    
    return "Unknown"


def parse_category(categories_tags: any, product_name: str) -> str:
    """
    Parse category from Open Beauty Facts format
    """
    category = "Serum"  # Default
    
    if categories_tags:
        tags = []
        if isinstance(categories_tags, list):
            tags = categories_tags
        elif isinstance(categories_tags, str):
            tags = [tag.strip() for tag in categories_tags.split(',')]
        
        # Try to find a valid category from tags
        for tag in tags:
            if tag:
                mapped = map_category_tag(tag)
                if mapped:
                    category = mapped
                    break
        
        # If no valid category found, analyze product name
        if category == "Serum":
            category = analyze_product_name_for_category(product_name)
    else:
        # No category tags, analyze product name
        category = analyze_product_name_for_category(product_name)
    
    return category


def parse_open_beauty_facts_product(product: Dict) -> Optional[Dict]:
    """
    Parse Open Beauty Facts product to our format
    Returns None if product is invalid (no ingredients, etc.)
    """
    # Check if product has valid ingredients
    if not has_valid_ingredients(product):
        return None
    
    # Extract ingredients
    raw_ingredient_list = extract_ingredients_from_product(product)
    if not raw_ingredient_list or len(raw_ingredient_list.strip()) < 5:
        return None
    
    # Validate ingredients by parsing them
    parsed_ingredients = parse_ingredient_list(raw_ingredient_list)
    if len(parsed_ingredients) == 0:
        return None
    
    # Parse product data
    product_name = product.get('product_name', 'Unknown Product')
    if not product_name or product_name == 'Unknown Product':
        return None
    
    brand = parse_brand(product.get('brands'))
    category = parse_category(product.get('categories_tags'), product_name)
    volume = product.get('quantity') or 'N/A'
    
    return {
        'name': product_name,
        'brand': brand,
        'category': category,
        'volume': volume,
        'rawIngredientList': raw_ingredient_list,
        'source': 'openbeautyfacts'
    }


def fetch_open_beauty_facts_products(query: str, limit: int = 100, require_ingredients: bool = True) -> List[Dict]:
    """
    Fetch products from Open Beauty Facts API
    """
    try:
        # Fetch more products if we need to filter for ingredients
        fetch_limit = limit * 10 if require_ingredients else limit
        fetch_limit = min(fetch_limit, 500)  # Cap at 500
        
        params = {
            'search_terms': query,
            'action': 'process',
            'json': 1,
            'page_size': fetch_limit,
            'fields': 'product_name,brands,categories_tags,countries,quantity,code,ingredients_text,ingredients_text_en,ingredients_text_fr,ingredients_text_de,ingredients_text_es,ingredients_tags,ingredients_text_with_allergens,ingredients'
        }
        
        response = requests.get(
            f"{OPEN_BEAUTY_FACTS_URL}/cgi/search.pl",
            params=params,
            timeout=30
        )
        response.raise_for_status()
        
        data = response.json()
        products = data.get('products', [])
        
        if require_ingredients:
            # Filter products with valid ingredients
            before_count = len(products)
            valid_products = []
            for product in products:
                if has_valid_ingredients(product):
                    valid_products.append(product)
                    if len(valid_products) >= limit:
                        break
            
            pass_rate = (len(valid_products) / before_count * 100) if before_count > 0 else 0
            print_colored(f"  FLEXIBLE FILTER: {len(valid_products)} products with valid ingredients (filtered from {before_count} total, {pass_rate:.1f}% passed)", Colors.CYAN)
            return valid_products
        
        return products[:limit]
    
    except Exception as e:
        print_colored(f"  Error fetching from Open Beauty Facts: {str(e)}", Colors.RED)
        raise


def import_batch(products: List[Dict], batch_num: int, total_batches: int) -> Tuple[int, int, int]:
    """
    Import a batch of products to the backend API
    Returns: (created, linked, skipped)
    """
    # Convert to format expected by backend
    scraped_products = []
    for p in products:
        scraped_products.append({
            'name': p['name'],
            'brand': p['brand'],
            'category': p['category'],
            'volume': p['volume'],
            'rawIngredientList': p['rawIngredientList'],
            'source': p['source']
        })
    
    try:
        response = requests.post(
            f"{BASE_URL}/scraper/import/raw",
            headers={
                'x-admin-key': ADMIN_KEY,
                'Content-Type': 'application/json'
            },
            json={'products': scraped_products},
            timeout=60
        )
        
        response.raise_for_status()
        data = response.json()
        
        if data.get('error'):
            print_colored(f"  Batch {batch_num}: API Error - {data['error']}", Colors.RED)
            return (0, 0, len(products))
        
        result = data.get('data', {})
        created = result.get('productsCreated', 0)
        linked = result.get('linkedSuccessfully', 0)
        processed = result.get('totalProcessed', 0)
        skipped = processed - created
        
        return (created, linked, skipped)
    
    except requests.exceptions.RequestException as e:
        print_colored(f"  Batch {batch_num}: Request failed - {str(e)}", Colors.RED)
        return (0, 0, len(products))


def import_category(query: str, limit: int, description: str) -> Tuple[int, int, int]:
    """
    Import products for a specific category/query
    Returns: (created, linked, skipped)
    """
    print_colored(f"Importing: {description} (query: \"{query}\", limit: {limit})", Colors.BLUE)
    
    try:
        # Fetch products
        products = fetch_open_beauty_facts_products(query, limit, require_ingredients=True)
        
        if len(products) == 0:
            print_colored(f"  No products found for query: {query}", Colors.YELLOW)
            return (0, 0, 0)
        
        # Parse products
        parsed_products = []
        for product in products:
            parsed = parse_open_beauty_facts_product(product)
            if parsed:
                parsed_products.append(parsed)
        
        if len(parsed_products) == 0:
            print_colored(f"  No valid products after parsing for query: {query}", Colors.YELLOW)
            return (0, 0, 0)
        
        print_colored(f"  Parsed {len(parsed_products)} valid products from {len(products)} fetched", Colors.CYAN)
        
        # Import in batches
        total_created = 0
        total_linked = 0
        total_skipped = 0
        
        for i in range(0, len(parsed_products), BATCH_SIZE):
            batch = parsed_products[i:i + BATCH_SIZE]
            batch_num = (i // BATCH_SIZE) + 1
            total_batches = (len(parsed_products) + BATCH_SIZE - 1) // BATCH_SIZE
            
            created, linked, skipped = import_batch(batch, batch_num, total_batches)
            total_created += created
            total_linked += linked
            total_skipped += skipped
            
            time.sleep(WAIT_BETWEEN_REQUESTS)
        
        print_colored(f"  ✓ {description}: {total_created} products created, {total_linked} ingredients linked", Colors.GREEN)
        
        return (total_created, total_linked, total_skipped)
    
    except Exception as e:
        print_colored(f"  ✗ Failed to import {description}: {str(e)}", Colors.RED)
        return (0, 0, 0)


def main():
    if len(sys.argv) < 2:
        print_colored("Usage: python3 import-open-beauty-facts-python.py <query> [limit]", Colors.RED)
        print_colored("  Example: python3 import-open-beauty-facts-python.py 'niacinamide' 100", Colors.CYAN)
        sys.exit(1)
    
    query = sys.argv[1]
    limit = int(sys.argv[2]) if len(sys.argv) > 2 else 100
    
    print_colored("╔════════════════════════════════════════════════════════════╗", Colors.CYAN)
    print_colored("║   PYTHON OPEN BEAUTY FACTS IMPORT                          ║", Colors.CYAN)
    print_colored("║   Enhanced Data Cleaning & Validation                     ║", Colors.CYAN)
    print_colored("╚════════════════════════════════════════════════════════════╝", Colors.CYAN)
    print()
    print_colored(f"Query: {query}", Colors.CYAN)
    print_colored(f"Limit: {limit} products", Colors.CYAN)
    print_colored(f"Base URL: {BASE_URL}", Colors.CYAN)
    print()
    
    # Test connection
    print_colored("Testing connection...", Colors.CYAN)
    try:
        response = requests.get(
            f"{BASE_URL}/scraper/stats",
            headers={'x-admin-key': ADMIN_KEY},
            timeout=5
        )
        response.raise_for_status()
        print_colored("✓ Connection successful", Colors.GREEN)
    except Exception as e:
        print_colored(f"✗ Cannot reach backend: {str(e)}", Colors.RED)
        sys.exit(1)
    
    print()
    
    # Import
    created, linked, skipped = import_category(query, limit, f"Products matching '{query}'")
    
    print()
    print_colored("════════════════════════════════════════════════════════════", Colors.CYAN)
    print_colored("FINAL RESULTS", Colors.CYAN)
    print_colored("════════════════════════════════════════════════════════════", Colors.CYAN)
    print()
    print_colored(f"Products created: {created}", Colors.GREEN)
    print_colored(f"Products skipped: {skipped} (already exist)", Colors.YELLOW)
    print_colored(f"Ingredient links: {linked}", Colors.GREEN)
    print()
    print_colored("Import complete!", Colors.GREEN)


if __name__ == '__main__':
    main()

