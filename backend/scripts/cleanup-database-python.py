#!/usr/bin/env python3
"""
Python script to clean up/delete all imported products from the database
Use this before re-importing with better Python scripts
"""

import sys
import requests
import json

# Configuration
ADMIN_KEY = "VITrJCdveiGHxYwtEEcrA0MKjYCxMmz70bmmR0mG7dc="
BASE_URL = "http://localhost:9000/api"

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


def get_stats():
    """Get current database statistics"""
    try:
        response = requests.get(
            f"{BASE_URL}/scraper/stats",
            headers={'x-admin-key': ADMIN_KEY},
            timeout=5
        )
        response.raise_for_status()
        data = response.json()
        return data.get('data', {})
    except Exception as e:
        print_colored(f"Error getting stats: {str(e)}", Colors.RED)
        return None


def delete_all_imported(keep_seed_data: bool = False):
    """Delete all imported products"""
    try:
        response = requests.post(
            f"{BASE_URL}/scraper/cleanup/all-imported",
            headers={
                'x-admin-key': ADMIN_KEY,
                'Content-Type': 'application/json'
            },
            json={'keepSeedData': keep_seed_data},
            timeout=300  # 5 minutes timeout for large deletions
        )
        
        response.raise_for_status()
        data = response.json()
        
        if data.get('error'):
            print_colored(f"Error: {data['error']}", Colors.RED)
            return None
        
        return data.get('data', {})
    
    except requests.exceptions.RequestException as e:
        print_colored(f"Request failed: {str(e)}", Colors.RED)
        return None


def main():
    print_colored("╔════════════════════════════════════════════════════════════╗", Colors.CYAN)
    print_colored("║   DATABASE CLEANUP - Delete All Imported Products         ║", Colors.CYAN)
    print_colored("╚════════════════════════════════════════════════════════════╝", Colors.CYAN)
    print()
    
    # Check arguments
    keep_seed = False
    if len(sys.argv) > 1:
        if sys.argv[1] in ['--keep-seed', '-k']:
            keep_seed = True
            print_colored("Mode: Keep seed data (only delete scraped products)", Colors.YELLOW)
        elif sys.argv[1] in ['--help', '-h']:
            print_colored("Usage: python3 cleanup-database-python.py [--keep-seed]", Colors.CYAN)
            print_colored("  --keep-seed: Only delete scraped products, keep seed data", Colors.CYAN)
            sys.exit(0)
    
    if not keep_seed:
        print_colored("Mode: Delete ALL products (including seed data)", Colors.RED)
    
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
        print_colored("Make sure backend is running: cd backend && npm run start:dev", Colors.YELLOW)
        sys.exit(1)
    
    print()
    
    # Get current stats
    print_colored("Current database status:", Colors.CYAN)
    stats = get_stats()
    if stats:
        print_colored(f"  Total Products: {stats.get('totalProducts', 0)}", Colors.CYAN)
        print_colored(f"  Products with Ingredients: {stats.get('productsWithIngredients', 0)}", Colors.CYAN)
        print_colored(f"  Total Ingredients: {stats.get('totalIngredients', 0)}", Colors.CYAN)
    print()
    
    # Confirm deletion
    if not keep_seed:
        print_colored("⚠️  WARNING: This will delete ALL products from the database!", Colors.RED)
        print_colored("   This includes seed data and all imported products.", Colors.RED)
    else:
        print_colored("⚠️  This will delete all scraped/imported products.", Colors.YELLOW)
        print_colored("   Seed data will be preserved.", Colors.YELLOW)
    
    print()
    confirm = input("Are you sure you want to continue? (yes/no): ").strip().lower()
    
    if confirm not in ['yes', 'y']:
        print_colored("Cancelled.", Colors.YELLOW)
        sys.exit(0)
    
    print()
    print_colored("Deleting products...", Colors.CYAN)
    print_colored("(This may take a few minutes for large databases)", Colors.CYAN)
    print()
    
    # Delete products
    result = delete_all_imported(keep_seed)
    
    if result is None:
        print_colored("✗ Deletion failed", Colors.RED)
        sys.exit(1)
    
    deleted = result.get('deleted', 0)
    errors = result.get('errors', [])
    
    print()
    print_colored("════════════════════════════════════════════════════════════", Colors.CYAN)
    print_colored("CLEANUP RESULTS", Colors.CYAN)
    print_colored("════════════════════════════════════════════════════════════", Colors.CYAN)
    print()
    print_colored(f"Products deleted: {deleted}", Colors.GREEN)
    
    if len(errors) > 0:
        print_colored(f"Errors: {len(errors)}", Colors.YELLOW)
        for error in errors[:5]:  # Show first 5 errors
            print_colored(f"  - {error.get('productId', 'unknown')}: {error.get('error', 'unknown error')}", Colors.YELLOW)
        if len(errors) > 5:
            print_colored(f"  ... and {len(errors) - 5} more errors", Colors.YELLOW)
    
    print()
    
    # Get updated stats
    print_colored("Updated database status:", Colors.CYAN)
    stats = get_stats()
    if stats:
        print_colored(f"  Total Products: {stats.get('totalProducts', 0)}", Colors.CYAN)
        print_colored(f"  Products with Ingredients: {stats.get('productsWithIngredients', 0)}", Colors.CYAN)
        print_colored(f"  Total Ingredients: {stats.get('totalIngredients', 0)}", Colors.CYAN)
    
    print()
    print_colored("✓ Cleanup complete!", Colors.GREEN)
    print_colored("You can now re-import products using the Python scripts.", Colors.CYAN)


if __name__ == '__main__':
    main()

