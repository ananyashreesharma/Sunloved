-- Complete Checkpoint 8: Add missing retailers and all product prices

-- First, get the existing retailer ID for reference
-- Then add the missing 3 retailers
INSERT INTO retailers (id, name, slug, url, "createdAt", "updatedAt") VALUES
('ret-2', 'Amazon', 'amazon', 'https://www.amazon.com', NOW(), NOW()),
('ret-3', 'Ulta Beauty', 'ulta', 'https://www.ulta.com', NOW(), NOW()),
('ret-4', 'Nykaa', 'nykaa', 'https://www.nykaa.com', NOW(), NOW())
ON CONFLICT (id) DO NOTHING;

-- Now add all product prices
-- Get retailer IDs dynamically and insert prices
INSERT INTO product_prices (id, product_id, retailer_id, amount, currency, "lastCheckedAt", "createdAt", "updatedAt") VALUES
-- prod-1: Ordinary Niacinamide
('pp-1', 'prod-1', (SELECT id FROM retailers WHERE slug = 'sephora' LIMIT 1), 16.5, 'USD', NOW(), NOW(), NOW()),
('pp-2', 'prod-1', (SELECT id FROM retailers WHERE slug = 'amazon' LIMIT 1), 17.99, 'USD', NOW(), NOW(), NOW()),
('pp-3', 'prod-1', (SELECT id FROM retailers WHERE slug = 'ulta' LIMIT 1), 16.0, 'USD', NOW(), NOW(), NOW()),
-- prod-2: Minimalist Niacinamide
('pp-4', 'prod-2', (SELECT id FROM retailers WHERE slug = 'sephora' LIMIT 1), 18.6, 'USD', NOW(), NOW(), NOW()),
('pp-5', 'prod-2', (SELECT id FROM retailers WHERE slug = 'amazon' LIMIT 1), 19.5, 'USD', NOW(), NOW(), NOW()),
('pp-6', 'prod-2', (SELECT id FROM retailers WHERE slug = 'nykaa' LIMIT 1), 499, 'INR', NOW(), NOW(), NOW()),
-- prod-3: LRP Anthelios
('pp-7', 'prod-3', (SELECT id FROM retailers WHERE slug = 'sephora' LIMIT 1), 21.6, 'USD', NOW(), NOW(), NOW()),
('pp-8', 'prod-3', (SELECT id FROM retailers WHERE slug = 'amazon' LIMIT 1), 22.99, 'USD', NOW(), NOW(), NOW()),
('pp-9', 'prod-3', (SELECT id FROM retailers WHERE slug = 'ulta' LIMIT 1), 20.99, 'USD', NOW(), NOW(), NOW()),
-- prod-4: Krave Barrier
('pp-10', 'prod-4', (SELECT id FROM retailers WHERE slug = 'sephora' LIMIT 1), 27.9, 'USD', NOW(), NOW(), NOW()),
('pp-11', 'prod-4', (SELECT id FROM retailers WHERE slug = 'amazon' LIMIT 1), 29.95, 'USD', NOW(), NOW(), NOW()),
('pp-12', 'prod-4', (SELECT id FROM retailers WHERE slug = 'ulta' LIMIT 1), 26.99, 'USD', NOW(), NOW(), NOW()),
-- prod-5: CeraVe Cream
('pp-13', 'prod-5', (SELECT id FROM retailers WHERE slug = 'sephora' LIMIT 1), 20.0, 'USD', NOW(), NOW(), NOW()),
('pp-14', 'prod-5', (SELECT id FROM retailers WHERE slug = 'amazon' LIMIT 1), 18.99, 'USD', NOW(), NOW(), NOW()),
('pp-15', 'prod-5', (SELECT id FROM retailers WHERE slug = 'ulta' LIMIT 1), 19.99, 'USD', NOW(), NOW(), NOW()),
-- prod-6: Paula's Choice
('pp-16', 'prod-6', (SELECT id FROM retailers WHERE slug = 'sephora' LIMIT 1), 70.0, 'USD', NOW(), NOW(), NOW()),
('pp-17', 'prod-6', (SELECT id FROM retailers WHERE slug = 'amazon' LIMIT 1), 72.5, 'USD', NOW(), NOW(), NOW()),
-- prod-7: Neutrogena Toner
('pp-18', 'prod-7', (SELECT id FROM retailers WHERE slug = 'sephora' LIMIT 1), 10.0, 'USD', NOW(), NOW(), NOW()),
('pp-19', 'prod-7', (SELECT id FROM retailers WHERE slug = 'amazon' LIMIT 1), 9.99, 'USD', NOW(), NOW(), NOW()),
('pp-20', 'prod-7', (SELECT id FROM retailers WHERE slug = 'ulta' LIMIT 1), 10.5, 'USD', NOW(), NOW(), NOW()),
-- prod-9: Isntree Toner
('pp-21', 'prod-9', (SELECT id FROM retailers WHERE slug = 'nykaa' LIMIT 1), 18.0, 'USD', NOW(), NOW(), NOW()),
('pp-22', 'prod-9', (SELECT id FROM retailers WHERE slug = 'amazon' LIMIT 1), 19.99, 'USD', NOW(), NOW(), NOW())
ON CONFLICT (id) DO NOTHING;

SELECT 'Checkpoint 8 Complete! Added 3 retailers and 22 product prices.' as status;

