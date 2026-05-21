-- ============================================================
-- H&N Fashion BD - Supabase Migration
-- Run this in Supabase Dashboard > SQL Editor
-- ============================================================

-- 1. Add product_type column to existing products table
ALTER TABLE products ADD COLUMN IF NOT EXISTS product_type TEXT NOT NULL DEFAULT 'stock';

-- 2. Update existing stock products
UPDATE products SET product_type = 'stock' WHERE product_type IS NULL OR product_type = '';

-- 3. Insert fresh goods products
INSERT INTO products (title, sku, qty, category, status, material, moq, featured, image, product_type)
SELECT * FROM (VALUES
  ('PREMIUM COTTON T-SHIRT - SOLID COLORS', 'FRESH-TS-001', 25000, 'T-Shirt', 'Factory Fresh - Ready to Ship', '100% Combed Cotton 30s', 2000, true, '/product-images/fresh/t-shirt.jpg', 'fresh'),
  ('CLASSIC POLO SHIRT - PIQUE COTTON', 'FRESH-PS-001', 18000, 'Polo Shirt', 'Factory Fresh - Ready to Ship', '100% Cotton Pique 220gsm', 1500, true, '/product-images/fresh/polo-shirt.jpg', 'fresh'),
  ('BASIC TANK TOP - RIBBED COTTON', 'FRESH-TT-001', 30000, 'Tank Top', 'Factory Fresh - Ready to Ship', '95% Cotton 5% Elastane 180gsm', 2000, true, '/product-images/fresh/tank-top.jpg', 'fresh'),
  ('HIGH WAIST LEGGINGS - NYLON SPANDEX', 'FRESH-LG-001', 22000, 'Leggings', 'Factory Fresh - Ready to Ship', '80% Nylon 20% Spandex 200gsm', 1500, true, '/product-images/fresh/leggings.jpg', 'fresh'),
  ('CARGO PANT - COTTON TWILL', 'FRESH-PT-001', 15000, 'Pant', 'Factory Fresh - Ready to Ship', '100% Cotton Twill 300gsm', 1000, false, '/product-images/fresh/pant.jpg', 'fresh'),
  ('FLEECE JOGGER - COTTON POLY BLEND', 'FRESH-JG-001', 20000, 'Jogger', 'Factory Fresh - Ready to Ship', '60% Cotton 40% Polyester 280gsm', 1500, false, '/product-images/fresh/jogger.jpg', 'fresh'),
  ('PULLOVER HOODIE - HEAVY FLEECE', 'FRESH-HD-001', 12000, 'Hoodie', 'Factory Fresh - Ready to Ship', '80% Cotton 20% Polyester 350gsm', 1000, true, '/product-images/fresh/hoodie.jpg', 'fresh'),
  ('COTTON BOXER BRIEF - MULTIPACK', 'FRESH-BX-001', 40000, 'Boxer', 'Factory Fresh - Ready to Ship', '95% Cotton 5% Elastane 160gsm', 3000, true, '/product-images/fresh/boxer.jpg', 'fresh'),
  ('FORMAL SHIRT - OXFORD COTTON', 'FRESH-SH-001', 16000, 'Shirt', 'Factory Fresh - Ready to Ship', '100% Cotton Oxford 180gsm', 1000, false, '/product-images/fresh/shirt.jpg', 'fresh'),
  ('CLASSIC DENIM PANT - 5 POCKET', 'FRESH-DP-001', 14000, 'Denim Pant', 'Factory Fresh - Ready to Ship', '100% Cotton Denim 12oz', 1000, true, '/product-images/fresh/denim-pant.jpg', 'fresh'),
  ('DENIM SHIRT - WESTERN STYLE', 'FRESH-DS-001', 11000, 'Denim Shirt', 'Factory Fresh - Ready to Ship', '100% Cotton Denim 8oz', 1000, false, '/product-images/fresh/denim-shirt.jpg', 'fresh')
) AS s(title, sku, qty, category, status, material, moq, featured, image, product_type)
WHERE NOT EXISTS (SELECT 1 FROM products WHERE sku LIKE 'FRESH-%' LIMIT 1);
