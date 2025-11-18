#!/bin/bash

# Comprehensive Open Beauty Facts Import Script
# Imports ALL products with ingredients from multiple search terms
# Only imports products that have ingredient data

set -e  # Exit on error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

# Configuration
ADMIN_KEY="${ADMIN_KEY:-VITrJCdveiGHxYwtEEcrA0MKjYCxMmz70bmmR0mG7dc=}"
BASE_URL="${BASE_URL:-http://localhost:9000/api}"
WAIT_BETWEEN_REQUESTS=3  # Increased to avoid rate limiting

# Counters
TOTAL_PRODUCTS=0
TOTAL_INGREDIENTS=0
TOTAL_LINKED=0
TOTAL_ERRORS=0
TOTAL_SKIPPED=0

# Function to print colored output
print_header() {
  echo ""
  echo -e "${CYAN}╔════════════════════════════════════════════════════════════╗${NC}"
  echo -e "${CYAN}║                                                            ║${NC}"
  echo -e "${CYAN}║   SUNLOVED - COMPREHENSIVE PRODUCT IMPORT                ║${NC}"
  echo -e "${CYAN}║   Importing ALL products with ingredients                ║${NC}"
  echo -e "${CYAN}║                                                            ║${NC}"
  echo -e "${CYAN}╚════════════════════════════════════════════════════════════╝${NC}"
  echo ""
}

print_section() {
  echo ""
  echo -e "${BLUE}════════════════════════════════════════════════════════════${NC}"
  echo -e "${BLUE}$1${NC}"
  echo -e "${BLUE}════════════════════════════════════════════════════════════${NC}"
}

print_status() {
  echo -e "${GREEN}✓${NC} $1"
}

print_warning() {
  echo -e "${YELLOW}⚠${NC} $1"
}

print_error() {
  echo -e "${RED}✗${NC} $1"
}

print_info() {
  echo -e "${CYAN}ℹ${NC} $1"
}

# Function to test connection
test_connection() {
  echo -e "${CYAN}Testing connection...${NC}"
  if curl -s -f -H "x-admin-key: $ADMIN_KEY" "$BASE_URL/scraper/stats" > /dev/null 2>&1; then
    print_status "Connection successful"
    return 0
  else
    print_error "Cannot reach backend at $BASE_URL"
    echo ""
    echo "Make sure backend is running:"
    echo "  cd backend && npm run start:dev"
    return 1
  fi
}

# Function to import with a search query
import_query() {
  local query=$1
  local limit=$2
  local description=$3

  echo ""
  echo -e "${CYAN}Importing: ${description}${NC}"
  echo -e "  Query: \"${query}\""
  echo -e "  Limit: ${limit}"

  response=$(curl -s -X POST "$BASE_URL/scraper/import/open-beauty-facts" \
    -H "x-admin-key: $ADMIN_KEY" \
    -H "Content-Type: application/json" \
    -d "{\"query\": \"$query\", \"limit\": $limit, \"requireIngredients\": true}")

  # Check for errors
  error_value=$(echo "$response" | jq -r '.error // null')
  if [ "$error_value" != "null" ] && [ -n "$error_value" ]; then
    print_error "Failed to import ${description}"
    echo "$response" | jq '.error'
    TOTAL_ERRORS=$((TOTAL_ERRORS + 1))
    return 1
  fi

  # Extract numbers
  products_created=$(echo "$response" | jq -r '.data.productsCreated // 0')
  ingredients_created=$(echo "$response" | jq -r '.data.ingredientsCreated // 0')
  linked=$(echo "$response" | jq -r '.data.linkedSuccessfully // 0')
  errors_count=$(echo "$response" | jq -r '.data.errors | length')

  # Update totals
  TOTAL_PRODUCTS=$((TOTAL_PRODUCTS + products_created))
  TOTAL_INGREDIENTS=$((TOTAL_INGREDIENTS + ingredients_created))
  TOTAL_LINKED=$((TOTAL_LINKED + linked))
  TOTAL_ERRORS=$((TOTAL_ERRORS + errors_count))

  if [ "$products_created" -gt 0 ]; then
    print_status "Imported ${description}"
    echo -e "  Products created: ${GREEN}${products_created}${NC}"
    echo -e "  Ingredients created: ${GREEN}${ingredients_created}${NC}"
    echo -e "  Links created: ${GREEN}${linked}${NC}"
    if [ "$errors_count" -gt 0 ]; then
      echo -e "  Errors: ${YELLOW}${errors_count}${NC}"
    fi
  else
    print_warning "No products found with ingredients for: ${description}"
    TOTAL_SKIPPED=$((TOTAL_SKIPPED + 1))
  fi

  # Wait between requests
  sleep $WAIT_BETWEEN_REQUESTS
}

# Function to show final stats
show_stats() {
  echo ""
  print_section "FINAL STATISTICS"
  
  echo -e "Total Products Imported: ${GREEN}${TOTAL_PRODUCTS}${NC}"
  echo -e "Total Ingredients Created: ${GREEN}${TOTAL_INGREDIENTS}${NC}"
  echo -e "Total Ingredient Links: ${GREEN}${TOTAL_LINKED}${NC}"
  echo -e "Total Errors: ${RED}${TOTAL_ERRORS}${NC}"
  echo -e "Skipped (no ingredients): ${YELLOW}${TOTAL_SKIPPED}${NC}"
  
  echo ""
  print_info "Fetching current database stats..."
  
  stats=$(curl -s -H "x-admin-key: $ADMIN_KEY" "$BASE_URL/scraper/stats")
  
  total_products=$(echo "$stats" | jq -r '.data.totalProducts')
  total_ingredients=$(echo "$stats" | jq -r '.data.totalIngredients')
  products_with_ingredients=$(echo "$stats" | jq -r '.data.productsWithIngredients')
  
  echo ""
  echo -e "${CYAN}Current Database Status:${NC}"
  echo -e "  Total Products: ${GREEN}${total_products}${NC}"
  echo -e "  Products with Ingredients: ${GREEN}${products_with_ingredients}${NC}"
  echo -e "  Total Ingredients: ${GREEN}${total_ingredients}${NC}"
  echo -e "  Coverage: ${GREEN}$(( products_with_ingredients * 100 / total_products ))%${NC}"
  
  echo ""
  echo -e "${CYAN}Category Breakdown:${NC}"
  echo "$stats" | jq -r '.data.categoryBreakdown | to_entries | .[] | "  \(.key): \(.value) products"'
}

# Main import function
main() {
  print_header
  
  echo -e "${CYAN}Configuration:${NC}"
  echo -e "  Admin Key: ${ADMIN_KEY:0:10}..."
  echo -e "  Base URL: ${BASE_URL}"
  echo -e "  Wait Time: ${WAIT_BETWEEN_REQUESTS}s between requests"
  
  if ! test_connection; then
    exit 1
  fi
  
  echo ""
  print_info "Starting comprehensive import..."
  print_info "This will import products with ingredients from multiple categories"
  print_info "Estimated time: 30-60 minutes"
  echo ""
  
  # ============================================
  # PHASE 1: CORE ACTIVE INGREDIENTS
  # ============================================
  print_section "PHASE 1: CORE ACTIVE INGREDIENTS"
  echo "Importing products with key skincare actives..."
  
  import_query "niacinamide" 200 "Niacinamide products"
  import_query "hyaluronic acid" 200 "Hyaluronic Acid products"
  import_query "vitamin c" 200 "Vitamin C products"
  import_query "retinol" 200 "Retinol products"
  import_query "peptides" 150 "Peptide products"
  import_query "salicylic acid" 150 "Salicylic Acid products"
  import_query "glycolic acid" 100 "Glycolic Acid products"
  import_query "lactic acid" 100 "Lactic Acid products"
  import_query "azelaic acid" 50 "Azelaic Acid products"
  import_query "tranexamic acid" 50 "Tranexamic Acid products"
  
  # ============================================
  # PHASE 2: PRODUCT CATEGORIES
  # ============================================
  print_section "PHASE 2: PRODUCTS BY CATEGORY"
  echo "Importing products organized by category..."
  
  import_query "serum" 300 "Serums"
  import_query "moisturizer" 300 "Moisturizers"
  import_query "cleanser" 250 "Cleansers"
  import_query "toner" 200 "Toners"
  import_query "sunscreen" 200 "Sunscreens"
  import_query "mask" 200 "Masks"
  import_query "essence" 100 "Essences"
  import_query "oil" 150 "Oils"
  import_query "exfoliator" 100 "Exfoliators"
  import_query "treatment" 150 "Treatments"
  
  # ============================================
  # PHASE 3: BRAND-SPECIFIC SEARCHES
  # ============================================
  print_section "PHASE 3: POPULAR BRANDS"
  echo "Importing products from popular brands..."
  
  import_query "cerave" 100 "CeraVe products"
  import_query "the ordinary" 100 "The Ordinary products"
  import_query "paula's choice" 100 "Paula's Choice products"
  import_query "la roche posay" 100 "La Roche-Posay products"
  import_query "neutrogena" 150 "Neutrogena products"
  import_query "olay" 100 "Olay products"
  import_query "l'oreal" 150 "L'Oreal products"
  import_query "garnier" 100 "Garnier products"
  import_query "nivea" 150 "Nivea products"
  import_query "cetaphil" 50 "Cetaphil products"
  
  # ============================================
  # PHASE 4: SKIN CONCERNS
  # ============================================
  print_section "PHASE 4: SKIN CONCERNS"
  echo "Importing products for specific skin concerns..."
  
  import_query "acne" 150 "Acne treatment products"
  import_query "anti-aging" 150 "Anti-aging products"
  import_query "brightening" 100 "Brightening products"
  import_query "hydrating" 150 "Hydrating products"
  import_query "sensitive skin" 100 "Sensitive skin products"
  import_query "dark spots" 50 "Dark spot treatment products"
  import_query "wrinkles" 100 "Wrinkle treatment products"
  
  # ============================================
  # PHASE 5: ADDITIONAL PRODUCTS
  # ============================================
  print_section "PHASE 5: ADDITIONAL PRODUCTS"
  echo "Importing additional product types..."
  
  import_query "eye cream" 100 "Eye creams"
  import_query "lip balm" 50 "Lip balms"
  import_query "face mist" 50 "Face mists"
  import_query "spot treatment" 50 "Spot treatments"
  import_query "night cream" 100 "Night creams"
  import_query "day cream" 100 "Day creams"
  
  # ============================================
  # FINAL STATS
  # ============================================
  show_stats
  
  echo ""
  print_status "Import complete!"
  echo ""
  echo -e "${CYAN}Next steps:${NC}"
  echo "  1. Check the database stats above"
  echo "  2. Test product search in the frontend"
  echo "  3. Test comparisons/dupes functionality"
  echo "  4. Run this script again to import more products"
  echo ""
}

# Run main function
main

