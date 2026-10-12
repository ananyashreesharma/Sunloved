# The clean product catalogue

SkinLens products are built one country at a time, from first-hand sources only. One CSV per
country (`IN.csv`, `GB.csv`, …), same columns as `TEMPLATE.csv`:

| Column | Required | What goes in it |
|---|---|---|
| country | yes | Two-letter code of the market this formula is sold in (`IN`, `GB`, `US`). The same product name can have a different list in each country. |
| brand | yes | Brand as printed. |
| name | yes | Product name as printed, without size. |
| ingredients | yes | The full ingredient list exactly as printed, in order. |
| source_type | yes | `pack_photo`, `brand_website`, `brand_submission` or `regulator`. |
| source_url | for brand_website | The brand's own product page. Retailer and review sites are refused. |
| category | no | cleanser, toner, serum, moisturiser, sunscreen, mask, treatment… |
| checked_by, checked_on | recommended | Who read the label and when (YYYY-MM-DD). |

Rules:
- Read the list off the pack or the brand's own site. Never copy from Amazon, Flipkart, Nykaa,
  INCIDecoder, Sephora or similar: their lists are often outdated, and copying breaks their terms.
- Keep the pack photo for anything entered from a pack, so a correction can be checked.
- Ingredients SkinLens doesn't know yet are added unrated (shown as "no information", never as fine)
  and listed by the import, so they can be rated.

Check a file, then import it:

    npx ts-node --transpile-only prisma/import-clean-products.ts prisma/catalog/IN.csv
    npx ts-node --transpile-only prisma/import-clean-products.ts prisma/catalog/IN.csv --apply
