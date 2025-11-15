-- Check what's already in the database

SELECT 'RETAILERS' as table_name, COUNT(*) as count FROM retailers
UNION ALL
SELECT 'PRODUCTS', COUNT(*) FROM products
UNION ALL
SELECT 'INGREDIENTS', COUNT(*) FROM ingredients
UNION ALL
SELECT 'PRODUCT_INGREDIENTS', COUNT(*) FROM product_ingredients
UNION ALL
SELECT 'ETHICS_DATA', COUNT(*) FROM ethics_data
UNION ALL
SELECT 'PRODUCT_PRICES', COUNT(*) FROM product_prices;

-- Show details of each table
SELECT '--- RETAILERS ---' as info;
SELECT * FROM retailers LIMIT 5;

SELECT '--- PRODUCTS ---' as info;
SELECT id, name, brand, category FROM products LIMIT 5;

SELECT '--- INGREDIENTS ---' as info;
SELECT id, name FROM ingredients LIMIT 5;

SELECT '--- PRODUCT_PRICES ---' as info;
SELECT * FROM product_prices LIMIT 5;

