-- Sunloved Database Seed - Products Only (Run in Supabase SQL Editor)
-- This skips retailers (already exist) and only seeds products, ingredients, and prices

-- Ingredients (if not already present)
INSERT INTO ingredients (id, name, "scientificName", category, "function", "isIrritant", "fungalAcneSafe", "createdAt") VALUES
('ing-niacinamide', 'Niacinamide', 'Niacinamide', 'Active', 'Brightening, oil control, barrier support', false, true, NOW()),
('ing-zinc', 'Zinc PCA', 'Zinc PCA', 'Active', 'Oil control, astringent', false, true, NOW()),
('ing-hyaluronic', 'Hyaluronic Acid', 'Hyaluronic Acid', 'Humectant', 'Hydration, humectant', false, true, NOW()),
('ing-centella', 'Centella Asiatica', 'Centella Asiatica', 'Soothing', 'Anti-inflammatory, barrier repair', false, true, NOW()),
('ing-tocopherol', 'Tocopherol', 'Tocopherol (Vitamin E)', 'Antioxidant', 'Antioxidant, skin conditioning', false, true, NOW()),
('ing-glycerin', 'Glycerin', 'Glycerin', 'Humectant', 'Hydration', false, true, NOW())
ON CONFLICT (id) DO NOTHING;

-- Products
INSERT INTO products (id, name, brand, volume, description, category, "pricePerUnit", "currentPrice", "imageUrl", "createdAt", "updatedAt") VALUES
('prod-ordinary-niacinamide', 'Niacinamide 10% + Zinc 1%', 'The Ordinary', '30ml', 'A lightweight serum containing niacinamide and zinc PCA. Hydrating and brightening formula with low irritation risk for most skin types.', 'Serum', 0.55, 16.5, 'https://example.com/ordinary-niacinamide.jpg', NOW(), NOW()),
('prod-minimalist-niacinamide', '10% Niacinamide Face Serum', 'Minimalist', '30ml', 'Simple niacinamide serum focused on oil control and texture. Lightweight and suitable for oily to combination skin.', 'Serum', 0.62, 18.6, 'https://example.com/minimalist-niacinamide.jpg', NOW(), NOW()),
('prod-lrp-anthelios', 'Anthelios Melt-in Milk', 'La Roche-Posay', '90ml', 'Broad-spectrum chemical filters in a cosmetically elegant, fragrance-free formula suitable for daily use.', 'Sunscreen', 0.24, 21.6, 'https://example.com/lrp-anthelios.jpg', NOW(), NOW()),
('prod-krave-barrier', 'Great Barrier Relief', 'Krave Beauty', '60ml', 'Ceramide and centella-rich barrier support serum. Lightweight hydrating treatment for compromised or sensitive skin.', 'Serum', 0.47, 27.9, 'https://example.com/krave-barrier.jpg', NOW(), NOW()),
('prod-cerave-cream', 'Moisturizing Cream', 'CeraVe', '340ml', 'Rich moisturizer with ceramides and hyaluronic acid. Fragrance-free, hypoallergenic, and non-comedogenic.', 'Moisturizer', 0.06, 20.0, 'https://example.com/cerave-cream.jpg', NOW(), NOW()),
('prod-paulas-niacinamide', 'Niacinamide Booster', 'Paula''s Choice', '30ml', 'Stabilized niacinamide serum for visible pore refinement and improved skin texture. Advanced formulation for sensitive skin.', 'Serum', 2.33, 70.0, 'https://example.com/paulas-niacinamide.jpg', NOW(), NOW()),
('prod-neutrogena-toner', 'Alcohol-Free Toner', 'Neutrogena', '200ml', 'Gentle alcohol-free toner for all skin types. Hydrating formula with no harsh drying agents.', 'Toner', 0.05, 10.0, 'https://example.com/neutrogena-toner.jpg', NOW(), NOW()),
('prod-lrp-cleanser', 'Toleriane Purifying Foaming Cleanser', 'La Roche-Posay', '150ml', 'Soap-free foaming cleanser that removes makeup and impurities without disrupting skin barrier. Suitable for sensitive skin.', 'Cleanser', 0.2, 12.0, 'https://example.com/lrp-cleanser.jpg', NOW(), NOW()),
('prod-isntree-toner', 'Hyaluronic Acid Plus Toner', 'Isntree', '200ml', 'K-beauty hydrating toner with 5 types of hyaluronic acid. Lightweight, watery texture for maximum hydration.', 'Toner', 0.09, 18.0, 'https://example.com/isntree-toner.jpg', NOW(), NOW())
ON CONFLICT (id) DO NOTHING;

-- Product-Ingredient Relationships
INSERT INTO product_ingredients (product_id, ingredient_id, position, concentration) VALUES
('prod-ordinary-niacinamide', 'ing-niacinamide', 1, 'high'),
('prod-ordinary-niacinamide', 'ing-zinc', 2, 'medium'),
('prod-minimalist-niacinamide', 'ing-niacinamide', 1, 'high'),
('prod-lrp-anthelios', 'ing-tocopherol', 3, 'medium'),
('prod-krave-barrier', 'ing-centella', 1, 'high'),
('prod-krave-barrier', 'ing-hyaluronic', 2, 'medium'),
('prod-cerave-cream', 'ing-hyaluronic', 1, 'medium'),
('prod-cerave-cream', 'ing-glycerin', 2, 'high'),
('prod-paulas-niacinamide', 'ing-niacinamide', 1, 'high'),
('prod-neutrogena-toner', 'ing-glycerin', 1, 'high'),
('prod-isntree-toner', 'ing-hyaluronic', 1, 'high'),
('prod-isntree-toner', 'ing-glycerin', 2, 'high')
ON CONFLICT DO NOTHING;

-- Ethics Data
INSERT INTO ethics_data (id, product_id, "crueltyFree", vegan, "fragranceFree", "alcoholFree", "fungalAcneSafe", "parabenFree", "sulfateFree", "siliconesFree", "lastVerifiedAt", "sourceUrl", "createdAt", "updatedAt") VALUES
('eth-1', 'prod-ordinary-niacinamide', true, true, true, true, true, true, true, false, NOW() - INTERVAL '12 days', 'https://theordinary.com', NOW(), NOW()),
('eth-2', 'prod-minimalist-niacinamide', true, true, true, true, true, true, true, true, NOW() - INTERVAL '5 days', 'https://minimalist.in', NOW(), NOW()),
('eth-3', 'prod-lrp-anthelios', false, false, true, false, true, false, true, true, NOW() - INTERVAL '45 days', 'https://laroche-posay.com', NOW(), NOW()),
('eth-4', 'prod-krave-barrier', true, true, false, true, true, true, false, true, NOW() - INTERVAL '20 days', 'https://kravebeauty.com', NOW(), NOW()),
('eth-5', 'prod-cerave-cream', false, false, true, false, false, false, false, false, NOW() - INTERVAL '30 days', 'https://cerave.com', NOW(), NOW()),
('eth-6', 'prod-paulas-niacinamide', true, true, true, true, false, true, true, true, NOW() - INTERVAL '10 days', 'https://paulaschoice.com', NOW(), NOW()),
('eth-7', 'prod-neutrogena-toner', false, false, false, true, true, true, true, false, NOW() - INTERVAL '60 days', 'https://neutrogena.com', NOW(), NOW()),
('eth-8', 'prod-lrp-cleanser', false, false, true, true, true, false, true, false, NOW() - INTERVAL '15 days', 'https://laroche-posay.com', NOW(), NOW()),
('eth-9', 'prod-isntree-toner', true, true, true, true, true, true, true, true, NOW() - INTERVAL '7 days', 'https://isntree.com', NOW(), NOW())
ON CONFLICT (id) DO NOTHING;

-- Product Prices
INSERT INTO product_prices (id, product_id, retailer_id, amount, currency, "lastCheckedAt", "createdAt", "updatedAt") VALUES
('pp-1', 'prod-ordinary-niacinamide', (SELECT id FROM retailers WHERE slug = 'sephora'), 16.5, 'USD', NOW(), NOW(), NOW()),
('pp-2', 'prod-ordinary-niacinamide', (SELECT id FROM retailers WHERE slug = 'amazon'), 17.99, 'USD', NOW(), NOW(), NOW()),
('pp-3', 'prod-ordinary-niacinamide', (SELECT id FROM retailers WHERE slug = 'ulta'), 16.0, 'USD', NOW(), NOW(), NOW()),
('pp-4', 'prod-minimalist-niacinamide', (SELECT id FROM retailers WHERE slug = 'sephora'), 18.6, 'USD', NOW(), NOW(), NOW()),
('pp-5', 'prod-minimalist-niacinamide', (SELECT id FROM retailers WHERE slug = 'amazon'), 19.5, 'USD', NOW(), NOW(), NOW()),
('pp-6', 'prod-minimalist-niacinamide', (SELECT id FROM retailers WHERE slug = 'nykaa'), 499, 'INR', NOW(), NOW(), NOW()),
('pp-7', 'prod-lrp-anthelios', (SELECT id FROM retailers WHERE slug = 'sephora'), 21.6, 'USD', NOW(), NOW(), NOW()),
('pp-8', 'prod-lrp-anthelios', (SELECT id FROM retailers WHERE slug = 'amazon'), 22.99, 'USD', NOW(), NOW(), NOW()),
('pp-9', 'prod-lrp-anthelios', (SELECT id FROM retailers WHERE slug = 'ulta'), 20.99, 'USD', NOW(), NOW(), NOW()),
('pp-10', 'prod-krave-barrier', (SELECT id FROM retailers WHERE slug = 'sephora'), 27.9, 'USD', NOW(), NOW(), NOW()),
('pp-11', 'prod-krave-barrier', (SELECT id FROM retailers WHERE slug = 'amazon'), 29.95, 'USD', NOW(), NOW(), NOW()),
('pp-12', 'prod-krave-barrier', (SELECT id FROM retailers WHERE slug = 'ulta'), 26.99, 'USD', NOW(), NOW(), NOW()),
('pp-13', 'prod-cerave-cream', (SELECT id FROM retailers WHERE slug = 'sephora'), 20.0, 'USD', NOW(), NOW(), NOW()),
('pp-14', 'prod-cerave-cream', (SELECT id FROM retailers WHERE slug = 'amazon'), 18.99, 'USD', NOW(), NOW(), NOW()),
('pp-15', 'prod-cerave-cream', (SELECT id FROM retailers WHERE slug = 'ulta'), 19.99, 'USD', NOW(), NOW(), NOW()),
('pp-16', 'prod-paulas-niacinamide', (SELECT id FROM retailers WHERE slug = 'sephora'), 70.0, 'USD', NOW(), NOW(), NOW()),
('pp-17', 'prod-paulas-niacinamide', (SELECT id FROM retailers WHERE slug = 'amazon'), 72.5, 'USD', NOW(), NOW(), NOW()),
('pp-18', 'prod-neutrogena-toner', (SELECT id FROM retailers WHERE slug = 'sephora'), 10.0, 'USD', NOW(), NOW(), NOW()),
('pp-19', 'prod-neutrogena-toner', (SELECT id FROM retailers WHERE slug = 'amazon'), 9.99, 'USD', NOW(), NOW(), NOW()),
('pp-20', 'prod-neutrogena-toner', (SELECT id FROM retailers WHERE slug = 'ulta'), 10.5, 'USD', NOW(), NOW(), NOW()),
('pp-21', 'prod-isntree-toner', (SELECT id FROM retailers WHERE slug = 'nykaa'), 18.0, 'USD', NOW(), NOW(), NOW()),
('pp-22', 'prod-isntree-toner', (SELECT id FROM retailers WHERE slug = 'amazon'), 19.99, 'USD', NOW(), NOW(), NOW())
ON CONFLICT DO NOTHING;

SELECT 'Seeding complete!' as status;

