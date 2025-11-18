#!/usr/bin/env python3
"""
Python-based CSV Import Script for Sunloved
Better data cleaning, ingredient parsing, and validation than JavaScript
"""

import csv
import json
import re
import sys
import requests
import time
from typing import List, Dict, Optional, Tuple
from urllib.parse import quote

# Configuration
ADMIN_KEY = "VITrJCdveiGHxYwtEEcrA0MKjYCxMmz70bmmR0mG7dc="
BASE_URL = "http://localhost:9000/api"
BATCH_SIZE = 50

# Colors for terminal output
class Colors:
    RED = '\033[0;31m'
    GREEN = '\033[0;32m'
    YELLOW = '\033[1;33m'
    CYAN = '\033[0;36m'
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
        r'^sunscreen',
        r'^moisturizer',
        r'^serum',
        r'^cream',
        r'^lotion',
        r'^gel',
        r'^treatment',
        r'^product',
        r'^formula',
        r'^solution',
        r'^ml\s*$',
        r'^oz\s*$',
        r'^\d+\s*ml',
        r'^\d+\s*oz',
        r'^\d+\s*fl\s*oz',
        r'^size:',
        r'^volume:',
        r'^quantity:',
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


def normalize_category(category: str) -> str:
    """
    Normalize category name to match backend enum
    """
    if not category:
        return "Serum"
    
    category_lower = category.lower().strip()
    
    category_map = {
        'moisturiser': 'Moisturizer',
        'moisturizer': 'Moisturizer',
        'moisturizing': 'Moisturizer',
        'moisturising': 'Moisturizer',
        'cream': 'Moisturizer',
        'lotion': 'Moisturizer',
        'emulsion': 'Moisturizer',
        'serum': 'Serum',
        'essence': 'Essence',
        'ampoule': 'Serum',
        'booster': 'Serum',
        'cleanser': 'Cleanser',
        'cleansing': 'Cleanser',
        'wash': 'Cleanser',
        'soap': 'Cleanser',
        'gel': 'Cleanser',
        'toner': 'Toner',
        'toning': 'Toner',
        'sunscreen': 'Sunscreen',
        'sunblock': 'Sunscreen',
        'spf': 'Sunscreen',
        'mask': 'Mask',
        'face mask': 'Mask',
        'sheet mask': 'Mask',
        'oil': 'Oil',
        'facial oil': 'Oil',
        'exfoliator': 'Exfoliator',
        'scrub': 'Exfoliator',
        'peel': 'Exfoliator',
        'treatment': 'Treatment',
    }
    
    return category_map.get(category_lower, 'Serum')


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


def parse_csv_file(file_path: str) -> List[Dict]:
    """
    Parse CSV file and return cleaned product data
    """
    products = []
    
    try:
        with open(file_path, 'r', encoding='utf-8') as f:
            # Try to detect delimiter
            sample = f.read(1024)
            f.seek(0)
            sniffer = csv.Sniffer()
            delimiter = sniffer.sniff(sample).delimiter
            
            reader = csv.DictReader(f, delimiter=delimiter)
            
            for row_num, row in enumerate(reader, start=2):  # Start at 2 (header is row 1)
                try:
                    # Find product name column (flexible matching)
                    name = None
                    for key in row.keys():
                        if any(term in key.lower() for term in ['name', 'product', 'title']):
                            name = row[key].strip() if row[key] else None
                            break
                    
                    if not name:
                        print_colored(f"  Row {row_num}: Skipping - no product name", Colors.YELLOW)
                        continue
                    
                    # Find brand column
                    brand = "Unknown"
                    for key in row.keys():
                        if any(term in key.lower() for term in ['brand', 'manufacturer', 'company']):
                            brand = row[key].strip() if row[key] else "Unknown"
                            break
                    
                    # Find ingredients column
                    ingredients_raw = None
                    for key in row.keys():
                        if any(term in key.lower() for term in ['ingredient', 'ingredients']):
                            ingredients_raw = row[key].strip() if row[key] else None
                            break
                    
                    if not ingredients_raw or len(ingredients_raw) < 5:
                        print_colored(f"  Row {row_num}: Skipping '{name}' - no valid ingredients", Colors.YELLOW)
                        continue
                    
                    # Parse ingredients
                    ingredient_list = parse_ingredient_list(ingredients_raw)
                    if len(ingredient_list) == 0:
                        print_colored(f"  Row {row_num}: Skipping '{name}' - no valid ingredients after cleaning", Colors.YELLOW)
                        continue
                    
                    # Find category column
                    category = "Serum"  # Default
                    for key in row.keys():
                        if any(term in key.lower() for term in ['category', 'type', 'product_type']):
                            if row[key]:
                                category = normalize_category(row[key].strip())
                            break
                    
                    # If category not found, analyze product name
                    if category == "Serum":
                        category = analyze_product_name_for_category(name)
                    
                    # Find volume column
                    volume = None
                    for key in row.keys():
                        if any(term in key.lower() for term in ['volume', 'size', 'quantity', 'amount', 'ml', 'oz']):
                            if row[key]:
                                volume = row[key].strip()
                            break
                    
                    # Create product object
                    product = {
                        'name': name,
                        'brand': brand,
                        'category': category,
                        'volume': volume or 'N/A',
                        'rawIngredientList': ingredients_raw,
                        'source': 'csv_import'
                    }
                    
                    products.append(product)
                    
                except Exception as e:
                    print_colored(f"  Row {row_num}: Error parsing row - {str(e)}", Colors.RED)
                    continue
    
    except FileNotFoundError:
        print_colored(f"Error: File not found: {file_path}", Colors.RED)
        sys.exit(1)
    except Exception as e:
        print_colored(f"Error reading CSV file: {str(e)}", Colors.RED)
        sys.exit(1)
    
    return products


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
    
    # Create CSV format for backend
    csv_lines = ['product_name,brand,category,volume,rawIngredientList,source']
    for p in scraped_products:
        # Escape CSV values
        name = p['name'].replace('"', '""')
        brand = p['brand'].replace('"', '""')
        category = p['category']
        volume = p['volume'].replace('"', '""')
        ingredients = p['rawIngredientList'].replace('"', '""')
        source = p['source']
        csv_lines.append(f'"{name}","{brand}","{category}","{volume}","{ingredients}","{source}"')
    
    csv_content = '\n'.join(csv_lines)
    
    try:
        response = requests.post(
            f"{BASE_URL}/scraper/import/csv",
            headers={
                'x-admin-key': ADMIN_KEY,
                'Content-Type': 'application/json'
            },
            json={'csv': csv_content},
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


def main():
    if len(sys.argv) < 2:
        print_colored("Usage: python3 import-csv-python.py <csv_file> [batch_size]", Colors.RED)
        sys.exit(1)
    
    csv_file = sys.argv[1]
    batch_size = int(sys.argv[2]) if len(sys.argv) > 2 else BATCH_SIZE
    
    print_colored("╔════════════════════════════════════════════════════════════╗", Colors.CYAN)
    print_colored("║   PYTHON CSV IMPORT (Enhanced Data Cleaning)             ║", Colors.CYAN)
    print_colored("╚════════════════════════════════════════════════════════════╝", Colors.CYAN)
    print()
    print_colored(f"File: {csv_file}", Colors.CYAN)
    print_colored(f"Batch Size: {batch_size} products per batch", Colors.CYAN)
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
    print_colored("Parsing and cleaning CSV file...", Colors.CYAN)
    products = parse_csv_file(csv_file)
    
    if len(products) == 0:
        print_colored("No valid products found in CSV file", Colors.RED)
        sys.exit(1)
    
    print_colored(f"✓ Parsed {len(products)} valid products", Colors.GREEN)
    print()
    
    # Calculate batches
    total_batches = (len(products) + batch_size - 1) // batch_size
    
    print_colored("Starting batch import...", Colors.CYAN)
    print()
    
    total_created = 0
    total_linked = 0
    total_skipped = 0
    
    for i in range(0, len(products), batch_size):
        batch_num = (i // batch_size) + 1
        batch = products[i:i + batch_size]
        
        print_colored(f"Processing batch {batch_num}/{total_batches} (products {i+1}-{min(i+batch_size, len(products))})...", Colors.CYAN)
        
        created, linked, skipped = import_batch(batch, batch_num, total_batches)
        
        total_created += created
        total_linked += linked
        total_skipped += skipped
        
        if created > 0:
            print_colored(f"  ✓ Batch {batch_num}: {created} products created, {linked} ingredients linked", Colors.GREEN)
        else:
            print_colored(f"  ○ Batch {batch_num}: {skipped} products skipped (already exist), {linked} ingredients linked", Colors.YELLOW)
        
        # Small delay between batches
        time.sleep(1)
    
    print()
    print_colored("════════════════════════════════════════════════════════════", Colors.CYAN)
    print_colored("FINAL RESULTS", Colors.CYAN)
    print_colored("════════════════════════════════════════════════════════════", Colors.CYAN)
    print()
    print_colored(f"Total batches processed: {total_batches}", Colors.CYAN)
    print_colored(f"Total products created: {total_created}", Colors.GREEN)
    print_colored(f"Total products skipped: {total_skipped} (already exist)", Colors.YELLOW)
    print_colored(f"Total ingredient links: {total_linked}", Colors.GREEN)
    print()
    print_colored("Import complete!", Colors.GREEN)


if __name__ == '__main__':
    main()

