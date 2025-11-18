#!/bin/bash

# CSV Batch Import Script
# Imports large CSV files in batches to avoid request size limits

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
BATCH_SIZE="${BATCH_SIZE:-50}"  # Import 50 products at a time

# Check if CSV file is provided
if [ -z "$1" ]; then
  echo -e "${RED}Error: CSV file path required${NC}"
  echo ""
  echo "Usage:"
  echo "  ./import-csv-batch.sh /path/to/products.csv [batch_size]"
  echo ""
  echo "  batch_size: Number of products per batch (default: 50)"
  exit 1
fi

CSV_FILE="$1"
if [ -n "$2" ]; then
  BATCH_SIZE="$2"
fi

# Resolve to absolute path (handles ~ and relative paths)
if [ "${CSV_FILE#/}" = "$CSV_FILE" ]; then
  # Relative path
  CSV_FILE="$(cd "$(dirname "$CSV_FILE")" && pwd)/$(basename "$CSV_FILE")"
else
  # Absolute path or starts with ~
  if [ "${CSV_FILE#~}" != "$CSV_FILE" ]; then
    CSV_FILE="${CSV_FILE/#~\//$HOME/}"
  fi
fi

# Check if file exists
if [ ! -f "$CSV_FILE" ]; then
  echo -e "${RED}Error: File not found: $CSV_FILE${NC}"
  exit 1
fi

# Check if file is readable
if [ ! -r "$CSV_FILE" ]; then
  echo -e "${RED}Error: File is not readable: $CSV_FILE${NC}"
  echo -e "${YELLOW}Tip: Don't use 'sudo' - the script doesn't need root privileges${NC}"
  exit 1
fi

echo -e "${CYAN}╔════════════════════════════════════════════════════════════╗${NC}"
echo -e "${CYAN}║   CSV BATCH IMPORT                                        ║${NC}"
echo -e "${CYAN}╚════════════════════════════════════════════════════════════╝${NC}"
echo ""
echo -e "${CYAN}File:${NC} $CSV_FILE"
echo -e "${CYAN}Batch Size:${NC} $BATCH_SIZE products per batch"
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

# Count total lines
TOTAL_LINES=$(wc -l < "$CSV_FILE" | tr -d ' ')
TOTAL_PRODUCTS=$((TOTAL_LINES - 1)) # Subtract header
TOTAL_BATCHES=$(( (TOTAL_PRODUCTS + BATCH_SIZE - 1) / BATCH_SIZE ))

echo -e "${CYAN}File Statistics:${NC}"
echo -e "  Total products: ${GREEN}$TOTAL_PRODUCTS${NC}"
echo -e "  Batch size: ${GREEN}$BATCH_SIZE${NC}"
echo -e "  Total batches: ${GREEN}$TOTAL_BATCHES${NC}"
echo ""

# Read header
HEADER=$(head -1 "$CSV_FILE")
echo -e "${CYAN}CSV Header:${NC} $HEADER"
echo ""

# Counters
TOTAL_CREATED=0
TOTAL_LINKED=0
TOTAL_ERRORS=0
TOTAL_SKIPPED=0
BATCH_NUM=0

# Process in batches
echo -e "${CYAN}Starting batch import...${NC}"
echo ""

# Read all lines except header
tail -n +2 "$CSV_FILE" > /tmp/csv_data.txt

# Split into batches and process
for ((i=0; i<TOTAL_PRODUCTS; i+=BATCH_SIZE)); do
  BATCH_NUM=$((BATCH_NUM + 1))
  END=$((i + BATCH_SIZE))
  if [ $END -gt $TOTAL_PRODUCTS ]; then
    END=$TOTAL_PRODUCTS
  fi
  
  echo -e "${CYAN}Processing batch $BATCH_NUM/$TOTAL_BATCHES (products $((i+1))-$END)...${NC}"
  
  # Extract batch (header + batch lines)
  BATCH_CSV="$HEADER\n$(sed -n "$((i+1)),${END}p" /tmp/csv_data.txt)"
  
  # Escape for JSON
  BATCH_JSON=$(echo -e "$BATCH_CSV" | jq -Rs .)
  
  # Import batch
  RESPONSE=$(curl -s -X POST "$BASE_URL/scraper/import/csv" \
    -H "x-admin-key: $ADMIN_KEY" \
    -H "Content-Type: application/json" \
    -d "{\"csv\": $BATCH_JSON}")
  
  # Check for errors
  ERROR=$(echo "$RESPONSE" | jq -r '.error // null')
  if [ "$ERROR" != "null" ] && [ -n "$ERROR" ]; then
    echo -e "${RED}✗ Batch $BATCH_NUM failed${NC}"
    echo "$RESPONSE" | jq '.error'
    TOTAL_ERRORS=$((TOTAL_ERRORS + 1))
    continue
  fi
  
  # Extract results
  CREATED=$(echo "$RESPONSE" | jq -r '.data.productsCreated // 0')
  LINKED=$(echo "$RESPONSE" | jq -r '.data.linkedSuccessfully // 0')
  PROCESSED=$(echo "$RESPONSE" | jq -r '.data.totalProcessed // 0')
  SKIPPED=$((PROCESSED - CREATED))
  
  TOTAL_CREATED=$((TOTAL_CREATED + CREATED))
  TOTAL_LINKED=$((TOTAL_LINKED + LINKED))
  TOTAL_SKIPPED=$((TOTAL_SKIPPED + SKIPPED))
  
  if [ "$CREATED" -gt 0 ]; then
    echo -e "${GREEN}✓ Batch $BATCH_NUM: $CREATED products created, $LINKED ingredients linked${NC}"
  else
    echo -e "${YELLOW}○ Batch $BATCH_NUM: $SKIPPED products skipped (already exist), $LINKED ingredients linked${NC}"
  fi
  
  # Small delay between batches
  sleep 1
done

# Cleanup
rm -f /tmp/csv_data.txt

echo ""
echo -e "${CYAN}════════════════════════════════════════════════════════════${NC}"
echo -e "${CYAN}FINAL RESULTS${NC}"
echo -e "${CYAN}════════════════════════════════════════════════════════════${NC}"
echo ""
echo -e "Total batches processed: ${GREEN}$TOTAL_BATCHES${NC}"
echo -e "Total products created: ${GREEN}$TOTAL_CREATED${NC}"
echo -e "Total products skipped: ${YELLOW}$TOTAL_SKIPPED${NC} (already exist)"
echo -e "Total ingredient links: ${GREEN}$TOTAL_LINKED${NC}"
if [ "$TOTAL_ERRORS" -gt 0 ]; then
  echo -e "Batches with errors: ${RED}$TOTAL_ERRORS${NC}"
fi

echo ""
echo -e "${CYAN}Current database stats:${NC}"
STATS=$(curl -s -H "x-admin-key: $ADMIN_KEY" "$BASE_URL/scraper/stats")
echo "$STATS" | jq -r '.data | "  Total Products: \(.totalProducts)\n  Products with Ingredients: \(.productsWithIngredients)\n  Total Ingredients: \(.totalIngredients)"'

echo ""
echo -e "${GREEN}Import complete!${NC}"

