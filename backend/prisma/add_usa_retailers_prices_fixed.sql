-- Add USA-based retailers only (Sephora, Amazon, Ulta Beauty)
INSERT INTO retailers (id, name, slug, url, "createdAt", "updatedAt") VALUES
('ret-sephora', 'Sephora', 'sephora', 'https://www.sephora.com', NOW(), NOW()),
('ret-ulta', 'Ulta Beauty', 'ulta', 'https://www.ulta.com', NOW(), NOW())
ON CONFLICT (slug) DO NOTHING;

-- Now add all product prices using USA retailers only
INSERT INTO product_prices (id, "productId", "retailerId", amount, currency, "lastCheckedAt", "createdAt", "updatedAt") VALUES
-- prod-1: Ordinary Niacinamide - USA retailers
('pp-1', 'prod-1', (SELECT id FROM retailers WHERE slug = 'sephora' LIMIT 1), 16.5, 'USD', NOW(), NOW(), NOW()),
('pp-2', 'prod-1', (SELECT id FROM retailers WHERE slug = 'amazon' LIMIT 1), 17.99, 'USD', NOW(), NOW(), NOW()),
('pp-3', 'prod-1', (SELECT id FROM retailers WHERE slug = 'ulta' LIMIT 1), 16.0, 'USD', NOW(), NOW(), NOW()),
-- prod-2: Minimalist Niacinamide - USA retailers
('pp-4', 'prod-2', (SELECT id FROM retailers WHERE slug = 'sephora' LIMIT 1), 18.6, 'USD', NOW(), NOW(), NOW()),
('pp-5', 'prod-2', (SELECT id FROM retailers WHERE slug = 'amazon' LIMIT 1), 19.5, 'USD', NOW(), NOW(), NOW()),
('pp-5b', 'prod-2', (SELECT id FROM retailers WHERE slug = 'ulta' LIMIT 1), 18.99, 'USD', NOW(), NOW(), NOW()),
-- prod-3: LRP Anthelios - USA retailers
('pp-7', 'prod-3', (SELECT id FROM retailers WHERE slug = 'sephora' LIMIT 1), 21.6, 'USD', NOW(), NOW(), NOW()),
('pp-8', 'prod-3', (SELECT id FROM retailers WHERE slug = 'amazon' LIMIT 1), 22.99, 'USD', NOW(), NOW(), NOW()),
('pp-9', 'prod-3', (SELECT id FROM retailers WHERE slug = 'ulta' LIMIT 1), 20.99, 'USD', NOW(), NOW(), NOW()),
-- prod-4: Krave Barrier - USA retailers
('pp-10', 'prod-4', (SELECT id FROM retailers WHERE slug = 'sephora' LIMIT 1), 27.9, 'USD', NOW(), NOW(), NOW()),
('pp-11', 'prod-4', (SELECT id FROM retailers WHERE slug = 'amazon' LIMIT 1), 29.95, 'USD', NOW(), NOW(), NOW()),
('pp-12', 'prod-4', (SELECT id FROM retailers WHERE slug = 'ulta' LIMIT 1), 26.99, 'USD', NOW(), NOW(), NOW()),
-- prod-5: CeraVe Cream - USA retailers
('pp-13', 'prod-5', (SELECT id FROM retailers WHERE slug = 'sephora' LIMIT 1), 20.0, 'USD', NOW(), NOW(), NOW()),
('pp-14', 'prod-5', (SELECT id FROM retailers WHERE slug = 'amazon' LIMIT 1), 18.99, 'USD', NOW(), NOW(), NOW()),
('pp-15', 'prod-5', (SELECT id FROM retailers WHERE slug = 'ulta' LIMIT 1), 19.99, 'USD', NOW(), NOW(), NOW()),
-- prod-6: Paula's Choice - USA retailers
('pp-16', 'prod-6', (SELECT id FROM retailers WHERE slug = 'sephora' LIMIT 1), 70.0, 'USD', NOW(), NOW(), NOW()),
('pp-17', 'prod-6', (SELECT id FROM retailers WHERE slug = 'amazon' LIMIT 1), 72.5, 'USD', NOW(), NOW(), NOW()),
('pp-17b', 'prod-6', (SELECT id FROM retailers WHERE slug = 'ulta' LIMIT 1), 69.99, 'USD', NOW(), NOW(), NOW()),
-- prod-7: Neutrogena Toner - USA retailers
('pp-18', 'prod-7', (SELECT id FROM retailers WHERE slug = 'sephora' LIMIT 1), 10.0, 'USD', NOW(), NOW(), NOW()),
('pp-19', 'prod-7', (SELECT id FROM retailers WHERE slug = 'amazon' LIMIT 1), 9.99, 'USD', NOW(), NOW(), NOW()),
('pp-20', 'prod-7', (SELECT id FROM retailers WHERE slug = 'ulta' LIMIT 1), 10.5, 'USD', NOW(), NOW(), NOW()),
-- prod-8: LRP Cleanser - USA retailers
('pp-20b', 'prod-8', (SELECT id FROM retailers WHERE slug = 'sephora' LIMIT 1), 12.0, 'USD', NOW(), NOW(), NOW()),
('pp-20c', 'prod-8', (SELECT id FROM retailers WHERE slug = 'amazon' LIMIT 1), 13.99, 'USD', NOW(), NOW(), NOW()),
('pp-20d', 'prod-8', (SELECT id FROM retailers WHERE slug = 'ulta' LIMIT 1), 12.5, 'USD', NOW(), NOW(), NOW()),
-- prod-9: Isntree Toner - USA retailers only (Amazon carries it)
('pp-21', 'prod-9', (SELECT id FROM retailers WHERE slug = 'amazon' LIMIT 1), 19.99, 'USD', NOW(), NOW(), NOW())
ON CONFLICT (id) DO NOTHING;

SELECT '✅ Checkpoint 8 COMPLETE! USA retailers (Sephora, Amazon, Ulta) + 26 product prices' as status;

