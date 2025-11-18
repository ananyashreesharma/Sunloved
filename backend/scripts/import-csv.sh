#!/bin/bash

# CSV Import Script
# Imports products from a CSV file

set -e

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
CYAN='\033[0;36m'
NC='\033[0m'

# Configuration
ADMIN_KEY="${ADMIN_KEY:-VITrJCdveiGHxYwtEEcrA0MKjYCxMmz70bmmR0mG7dc=}"
BASE_URL="${BASE_URL:-http://localhost:9000/api}"

# Check if CSV file is provided
if [ -z "$1" ]; then
  echo -e "${RED}Error: CSV file path required${NC}"
  echo ""
  echo "Usage:"
  echo "  ./import-csv.sh /path/to/products.csv"
  echo ""
  echo "CSV Format:"
  echo "  Required: product_name (or name), ingredients"
  echo "  Optional: product_type (or category), brand, volume, price"
  echo ""
  echo "Example CSV:"
  echo "  product_name,product_type,ingredients"
  echo "  \"Product 1\",\"Serum\",\"Ingredient 1, Ingredient 2\""
  exit 1
fi

CSV_FILE="$1"

# Check if file exists
if [ ! -f "$CSV_FILE" ]; then
  echo -e "${RED}Error: File not found: $CSV_FILE${NC}"
  exit 1
fi

echo -e "${CYAN}╔════════════════════════════════════════════════════════════╗${NC}"
echo -e "${CYAN}║   CSV PRODUCT IMPORT                                      ║${NC}"
echo -e "${CYAN}╚════════════════════════════════════════════════════════════╝${NC}"
echo ""
echo -e "${CYAN}File:${NC} $CSV_FILE"
echo -e "${CYAN}Base URL:${NC} $BASE_URL"
echo ""

# Test connection
echo -e "${CYAN}Testing connection...${NC}"
if ! curl -s -f -H "x-admin-key: $ADMIN_KEY" "$BASE_URL/scraper/stats" > /dev/null 2>&1; then
  echo -e "${RED}✗ Cannot reach backend at $BASE_URL${NC}"
  echo ""
  echo "Make sure backend is running:"
  echo "  cd backend && npm run start:dev"
  exit 1
fi
echo -e "${GREEN}✓ Connection successful${NC}"
echo ""

# Read CSV file
echo -e "${CYAN}Reading CSV file...${NC}"
if ! CSV_CONTENT=$(cat "$CSV_FILE"); then
  echo -e "${RED}✗ Failed to read CSV file${NC}"
  exit 1
fi

# Count lines (approximate product count)
LINE_COUNT=$(wc -l < "$CSV_FILE" | tr -d ' ')
PRODUCT_COUNT=$((LINE_COUNT - 1)) # Subtract header row
echo -e "${CYAN}Found:${NC} ~$PRODUCT_COUNT products (including header)"
echo ""

# Import
echo -e "${CYAN}Importing products...${NC}"
echo ""

# Escape CSV content for JSON
CSV_JSON=$(echo "$CSV_CONTENT" | jq -Rs .)

RESPONSE=$(curl -s -X POST "$BASE_URL/scraper/import/csv" \
  -H "x-admin-key: $ADMIN_KEY" \
  -H "Content-Type: application/json" \
  -d "{\"csv\": $CSV_JSON}")

# Check for errors
ERROR=$(echo "$RESPONSE" | jq -r '.error // null')
if [ "$ERROR" != "null" ] && [ -n "$ERROR" ]; then
  echo -e "${RED}✗ Import failed${NC}"
  echo "$RESPONSE" | jq '.error'
  exit 1
fi

# Extract results
PRODUCTS_CREATED=$(echo "$RESPONSE" | jq -r '.data.productsCreated // 0')
INGREDIENTS_CREATED=$(echo "$RESPONSE" | jq -r '.data.ingredientsCreated // 0')
LINKED=$(echo "$RESPONSE" | jq -r '.data.linkedSuccessfully // 0')
ERRORS=$(echo "$RESPONSE" | jq -r '.data.errors | length')

echo -e "${GREEN}✓ Import complete!${NC}"
echo ""
echo -e "${CYAN}Results:${NC}"
echo -e "  Products created: ${GREEN}$PRODUCTS_CREATED${NC}"
echo -e "  Ingredients created: ${GREEN}$INGREDIENTS_CREATED${NC}"
echo -e "  Ingredient links: ${GREEN}$LINKED${NC}"
if [ "$ERRORS" -gt 0 ]; then
  echo -e "  Errors: ${YELLOW}$ERRORS${NC}"
fi

echo ""
echo -e "${CYAN}Current database stats:${NC}"
STATS=$(curl -s -H "x-admin-key: $ADMIN_KEY" "$BASE_URL/scraper/stats")
echo "$STATS" | jq -r '.data | "  Total Products: \(.totalProducts)\n  Products with Ingredients: \(.productsWithIngredients)\n  Total Ingredients: \(.totalIngredients)"'

echo ""
echo -e "${GREEN}Done!${NC}"

