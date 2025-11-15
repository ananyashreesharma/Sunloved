#!/bin/bash

# Open Beauty Facts Data Import Script
# Imports 1000+ products and ingredients in phases

set -e  # Exit on error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
ADMIN_KEY="${ADMIN_KEY:-your-admin-key-here}"
BASE_URL="${BASE_URL:-http://localhost:2000/api}"
WAIT_BETWEEN_REQUESTS=2

# Counters
TOTAL_PRODUCTS=0
TOTAL_INGREDIENTS=0
TOTAL_LINKED=0
TOTAL_ERRORS=0

# Function to print colored output
print_section() {
  echo -e "${BLUE}=====================================${NC}"
  echo -e "${BLUE}$1${NC}"
  echo -e "${BLUE}=====================================${NC}"
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

# Function to import category
import_category() {
  local query=$1
  local limit=$2
  local description=$3

  echo ""
  echo -e "Importing: ${BLUE}$description${NC} (query: \"$query\", limit: $limit)"

  response=$(curl -s -X POST "$BASE_URL/scraper/import/open-beauty-facts" \
    -H "x-admin-key: $ADMIN_KEY" \
    -H "Content-Type: application/json" \
    -d "{\"query\": \"$query\", \"limit\": $limit}")

  # Check if response contains error
  if echo "$response" | grep -q '"error":'; then
    print_error "Failed to import $description"
    echo "$response" | jq '.'
    return 1
  fi

  # Extract numbers from response
  products=$(echo "$response" | jq '.data.productsCreated // 0')
  ingredients=$(echo "$response" | jq '.data.ingredientsCreated // 0')
  linked=$(echo "$response" | jq '.data.linkedSuccessfully // 0')
  errors=$(echo "$response" | jq '.data.errors | length // 0')

  TOTAL_PRODUCTS=$((TOTAL_PRODUCTS + products))
  TOTAL_INGREDIENTS=$((TOTAL_INGREDIENTS + ingredients))
  TOTAL_LINKED=$((TOTAL_LINKED + linked))
  TOTAL_ERRORS=$((TOTAL_ERRORS + errors))

  print_status "Imported $description"
  echo "  Products created: $products"
  echo "  Ingredients created: $ingredients"
  echo "  Links created: $linked"
  if [ "$errors" -gt 0 ]; then
    print_warning "Errors: $errors"
  fi

  # Wait between requests to be respectful to the API
  sleep $WAIT_BETWEEN_REQUESTS
}

# Function to get and display stats
show_stats() {
  echo ""
  print_section "DATABASE STATISTICS"

  stats=$(curl -s "$BASE_URL/scraper/stats")

  echo "$stats" | jq '.data | {
    totalProducts,
    totalIngredients,
    productsWithIngredients,
    averageIngredientsPerProduct,
    categoryBreakdown
  }'
}

# Main script
main() {
  clear
  echo -e "${BLUE}"
  cat << "EOF"
  ╔════════════════════════════════════════════════════════════╗
  ║                                                            ║
  ║   SUNLOVED - OPEN BEAUTY FACTS DATA IMPORT                 ║
  ║   Building 1000+ product database with ingredients         ║
  ║                                                            ║
  ╚════════════════════════════════════════════════════════════╝
EOF
  echo -e "${NC}"

  # Verify configuration
  echo ""
  echo "Configuration:"
  echo "  Admin Key: ${ADMIN_KEY:0:10}..."
  echo "  Base URL: $BASE_URL"
  echo ""

  if [ "$ADMIN_KEY" = "your-admin-key-here" ]; then
    print_error "Admin key not set!"
    echo ""
    echo "Set your admin key with:"
    echo "  export ADMIN_KEY='your-actual-key'"
    echo ""
    exit 1
  fi

  # Test connection
  echo "Testing connection..."
  if ! curl -s -f "$BASE_URL/scraper/stats" > /dev/null; then
    print_error "Cannot reach backend at $BASE_URL"
    echo ""
    echo "Make sure backend is running:"
    echo "  cd backend && npm run start:dev"
    echo ""
    exit 1
  fi
  print_status "Connection successful"

  # Phase 1: Core Ingredients
  print_section "PHASE 1: CORE INGREDIENTS"
  echo "Building ingredient database from key skincare actives..."
  echo ""

  import_category "niacinamide" 100 "Niacinamide products"
  import_category "hyaluronic acid" 100 "Hyaluronic Acid products"
  import_category "vitamin c" 100 "Vitamin C products"
  import_category "retinol" 100 "Retinol products"
  import_category "peptides" 100 "Peptide products"

  # Phase 2: By Category
  print_section "PHASE 2: PRODUCTS BY CATEGORY"
  echo "Importing products organized by category..."
  echo ""

  import_category "serum" 150 "Serums"
  import_category "moisturizer" 150 "Moisturizers"
  import_category "cleanser" 150 "Cleansers"
  import_category "toner" 100 "Toners"
  import_category "sunscreen" 100 "Sunscreens"
  import_category "mask" 100 "Masks"
  import_category "essence" 50 "Essences"
  import_category "oil" 50 "Oils"

  # Phase 3: Supplementary
  print_section "PHASE 3: SUPPLEMENTARY PRODUCTS"
  echo "Adding additional products for diversity..."
  echo ""

  import_category "exfoliator" 75 "Exfoliators"
  import_category "treatment" 75 "Treatments"
  import_category "makeup remover" 50 "Makeup Removers"
  import_category "eye cream" 50 "Eye Creams"

  # Final stats
  show_stats

  # Summary
  print_section "IMPORT SUMMARY"
  echo ""
  echo "Cumulative Results (may include duplicates):"
  echo "  Total products processed: $TOTAL_PRODUCTS"
  echo "  Ingredients found/created: $TOTAL_INGREDIENTS"
  echo "  Product-ingredient links: $TOTAL_LINKED"
  if [ "$TOTAL_ERRORS" -gt 0 ]; then
    print_warning "Total errors: $TOTAL_ERRORS"
  fi

  echo ""
  print_status "Import complete!"
  echo ""
  echo "Next steps:"
  echo "  1. Test search: curl 'http://localhost:2000/api/products/search?query=serum'"
  echo "  2. Visit frontend: http://localhost:3000"
  echo "  3. Try searching and filtering"
  echo "  4. View comparable products"
  echo ""
}

# Run main script
main

