-- Sunloved Database Fresh Seed for PostgreSQL (Run in Supabase SQL Editor)
-- This DELETES all existing data and starts fresh

-- Delete all existing data (in correct order to avoid FK conflicts)
DELETE FROM product_prices;
DELETE FROM product_ingredients;
DELETE FROM ethics_data;
DELETE FROM products;
DELETE FROM ingredients;
DELETE FROM retailers;

-- ==================== INSERT FRESH DATA ====================

-- Retailers
INSERT INTO retailers (id, name, slug, url, "createdAt", "updatedAt") VALUES
('ret-1', 'Sephora', 'sephora', 'https://www.sephora.com', NOW(), NOW()),
('ret-2', 'Amazon', 'amazon', 'https://www.amazon.com', NOW(), NOW()),
('ret-3', 'Ulta Beauty', 'ulta', 'https://www.ulta.com', NOW(), NOW()),
('ret-4', 'Nykaa', 'nykaa', 'https://www.nykaa.com', NOW(), NOW());

-- Ingredients
INSERT INTO ingredients (id, name, "scientificName", category, "function", "isIrritant", "fungalAcneSafe", "createdAt") VALUES
('ing-1', 'Niacinamide', 'Niacinamide', 'Active', 'Brightening, oil control, barrier support', false, true, NOW()),
('ing-2', 'Zinc PCA', 'Zinc PCA', 'Active', 'Oil control, astringent', false, true, NOW()),
('ing-3', 'Hyaluronic Acid', 'Hyaluronic Acid', 'Humectant', 'Hydration, humectant', false, true, NOW()),
('ing-4', 'Centella Asiatica', 'Centella Asiatica', 'Soothing', 'Anti-inflammatory, barrier repair', false, true, NOW()),
('ing-5', 'Tocopherol', 'Tocopherol (Vitamin E)', 'Antioxidant', 'Antioxidant, skin conditioning', false, true, NOW()),
('ing-6', 'Glycerin', 'Glycerin', 'Humectant', 'Hydration', false, true, NOW());

-- Products
INSERT INTO products (id, name, brand, volume, description, category, "pricePerUnit", "currentPrice", "imageUrl", "createdAt", "updatedAt") VALUES
('prod-1', 'Niacinamide 10% + Zinc 1%', 'The Ordinary', '30ml', 'Lightweight serum with niacinamide and zinc PCA. Hydrating and brightening formula.', 'Serum', 0.55, 16.5, 'https://example.com/ordinary-niacinamide.jpg', NOW(), NOW()),
('prod-2', '10% Niacinamide Face Serum', 'Minimalist', '30ml', 'Simple niacinamide serum for oil control. Lightweight and suitable for oily skin.', 'Serum', 0.62, 18.6, 'https://example.com/minimalist-niacinamide.jpg', NOW(), NOW()),
('prod-3', 'Anthelios Melt-in Milk', 'La Roche-Posay', '90ml', 'Broad-spectrum chemical filters in elegant formula suitable for daily use.', 'Sunscreen', 0.24, 21.6, 'https://example.com/lrp-anthelios.jpg', NOW(), NOW()),
('prod-4', 'Great Barrier Relief', 'Krave Beauty', '60ml', 'Ceramide and centella-rich serum for barrier support. Hydrating treatment.', 'Serum', 0.47, 27.9, 'https://example.com/krave-barrier.jpg', NOW(), NOW()),
('prod-5', 'Moisturizing Cream', 'CeraVe', '340ml', 'Rich moisturizer with ceramides and hyaluronic acid. Fragrance-free.', 'Moisturizer', 0.06, 20.0, 'https://example.com/cerave-cream.jpg', NOW(), NOW()),
('prod-6', 'Niacinamide Booster', 'Paulas Choice', '30ml', 'Stabilized niacinamide serum for pore refinement and skin texture.', 'Serum', 2.33, 70.0, 'https://example.com/paulas-niacinamide.jpg', NOW(), NOW()),
('prod-7', 'Alcohol-Free Toner', 'Neutrogena', '200ml', 'Gentle alcohol-free toner for all skin types. Hydrating formula.', 'Toner', 0.05, 10.0, 'https://example.com/neutrogena-toner.jpg', NOW(), NOW()),
('prod-8', 'Toleriane Purifying Foaming Cleanser', 'La Roche-Posay', '150ml', 'Soap-free cleanser that removes impurities without disrupting barrier.', 'Cleanser', 0.2, 12.0, 'https://example.com/lrp-cleanser.jpg', NOW(), NOW()),
('prod-9', 'Hyaluronic Acid Plus Toner', 'Isntree', '200ml', 'K-beauty hydrating toner with multiple types of hyaluronic acid.', 'Toner', 0.09, 18.0, 'https://example.com/isntree-toner.jpg', NOW(), NOW());

-- Product-Ingredient Relationships
INSERT INTO product_ingredients (product_id, ingredient_id, position, concentration) VALUES
('prod-1', 'ing-1', 1, 'high'),
('prod-1', 'ing-2', 2, 'medium'),
('prod-2', 'ing-1', 1, 'high'),
('prod-3', 'ing-5', 3, 'medium'),
('prod-4', 'ing-4', 1, 'high'),
('prod-4', 'ing-3', 2, 'medium'),
('prod-5', 'ing-3', 1, 'medium'),
('prod-5', 'ing-6', 2, 'high'),
('prod-6', 'ing-1', 1, 'high'),
('prod-7', 'ing-6', 1, 'high'),
('prod-9', 'ing-3', 1, 'high'),
('prod-9', 'ing-6', 2, 'high');

-- Ethics Data
INSERT INTO ethics_data (id, product_id, "crueltyFree", vegan, "fragranceFree", "alcoholFree", "fungalAcneSafe", "parabenFree", "sulfateFree", "siliconesFree", "lastVerifiedAt", "sourceUrl", "createdAt", "updatedAt") VALUES
('eth-1', 'prod-1', true, true, true, true, true, true, true, false, NOW() - INTERVAL '12 days', 'https://theordinary.com', NOW(), NOW()),
('eth-2', 'prod-2', true, true, true, true, true, true, true, true, NOW() - INTERVAL '5 days', 'https://minimalist.in', NOW(), NOW()),
('eth-3', 'prod-3', false, false, true, false, true, false, true, true, NOW() - INTERVAL '45 days', 'https://laroche-posay.com', NOW(), NOW()),
('eth-4', 'prod-4', true, true, false, true, true, true, false, true, NOW() - INTERVAL '20 days', 'https://kravebeauty.com', NOW(), NOW()),
('eth-5', 'prod-5', false, false, true, false, false, false, false, false, NOW() - INTERVAL '30 days', 'https://cerave.com', NOW(), NOW()),
('eth-6', 'prod-6', true, true, true, true, false, true, true, true, NOW() - INTERVAL '10 days', 'https://paulaschoice.com', NOW(), NOW()),
('eth-7', 'prod-7', false, false, false, true, true, true, true, false, NOW() - INTERVAL '60 days', 'https://neutrogena.com', NOW(), NOW()),
('eth-8', 'prod-8', false, false, true, true, true, false, true, false, NOW() - INTERVAL '15 days', 'https://laroche-posay.com', NOW(), NOW()),
('eth-9', 'prod-9', true, true, true, true, true, true, true, true, NOW() - INTERVAL '7 days', 'https://isntree.com', NOW(), NOW());

-- Product Prices
INSERT INTO product_prices (id, product_id, retailer_id, amount, currency, "lastCheckedAt", "createdAt", "updatedAt") VALUES
('pp-1', 'prod-1', 'ret-1', 16.5, 'USD', NOW(), NOW(), NOW()),
('pp-2', 'prod-1', 'ret-2', 17.99, 'USD', NOW(), NOW(), NOW()),
('pp-3', 'prod-1', 'ret-3', 16.0, 'USD', NOW(), NOW(), NOW()),
('pp-4', 'prod-2', 'ret-1', 18.6, 'USD', NOW(), NOW(), NOW()),
('pp-5', 'prod-2', 'ret-2', 19.5, 'USD', NOW(), NOW(), NOW()),
('pp-6', 'prod-2', 'ret-4', 499, 'INR', NOW(), NOW(), NOW()),
('pp-7', 'prod-3', 'ret-1', 21.6, 'USD', NOW(), NOW(), NOW()),
('pp-8', 'prod-3', 'ret-2', 22.99, 'USD', NOW(), NOW(), NOW()),
('pp-9', 'prod-3', 'ret-3', 20.99, 'USD', NOW(), NOW(), NOW()),
('pp-10', 'prod-4', 'ret-1', 27.9, 'USD', NOW(), NOW(), NOW()),
('pp-11', 'prod-4', 'ret-2', 29.95, 'USD', NOW(), NOW(), NOW()),
('pp-12', 'prod-4', 'ret-3', 26.99, 'USD', NOW(), NOW(), NOW()),
('pp-13', 'prod-5', 'ret-1', 20.0, 'USD', NOW(), NOW(), NOW()),
('pp-14', 'prod-5', 'ret-2', 18.99, 'USD', NOW(), NOW(), NOW()),
('pp-15', 'prod-5', 'ret-3', 19.99, 'USD', NOW(), NOW(), NOW()),
('pp-16', 'prod-6', 'ret-1', 70.0, 'USD', NOW(), NOW(), NOW()),
('pp-17', 'prod-6', 'ret-2', 72.5, 'USD', NOW(), NOW(), NOW()),
('pp-18', 'prod-7', 'ret-1', 10.0, 'USD', NOW(), NOW(), NOW()),
('pp-19', 'prod-7', 'ret-2', 9.99, 'USD', NOW(), NOW(), NOW()),
('pp-20', 'prod-7', 'ret-3', 10.5, 'USD', NOW(), NOW(), NOW()),
('pp-21', 'prod-9', 'ret-4', 18.0, 'USD', NOW(), NOW(), NOW()),
('pp-22', 'prod-9', 'ret-2', 19.99, 'USD', NOW(), NOW(), NOW());

SELECT 'Fresh seeding complete! 9 products with 4 retailers and pricing data ready.' as status;

