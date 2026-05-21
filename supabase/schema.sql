-- ============================================================
-- H&N Fashion BD - Supabase Database Schema
-- Run this in your Supabase SQL Editor (Dashboard > SQL Editor)
-- ============================================================

-- 1. PRODUCTS TABLE
CREATE TABLE IF NOT EXISTS products (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  sku TEXT NOT NULL UNIQUE,
  qty INTEGER NOT NULL DEFAULT 0,
  category TEXT NOT NULL DEFAULT 'General',
  status TEXT NOT NULL DEFAULT 'Pure Export Quality',
  material TEXT NOT NULL DEFAULT '100% Cotton',
  moq INTEGER NOT NULL DEFAULT 1000,
  image TEXT NOT NULL DEFAULT 'https://images.unsplash.com/photo-1523381210434-271e8be1f52b?auto=format&fit=crop&q=80&w=800',
  featured BOOLEAN NOT NULL DEFAULT false,
  added_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Enable Row Level Security
ALTER TABLE products ENABLE ROW LEVEL SECURITY;

-- Public can read products
CREATE POLICY "Public can read products"
  ON products FOR SELECT
  TO anon
  USING (true);

-- Only authenticated admin can insert/update/delete
CREATE POLICY "Admin can insert products"
  ON products FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Admin can update products"
  ON products FOR UPDATE
  TO authenticated
  USING (true);

CREATE POLICY "Admin can delete products"
  ON products FOR DELETE
  TO authenticated
  USING (true);

-- 2. INQUIRIES TABLE
CREATE TABLE IF NOT EXISTS inquiries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  full_name TEXT NOT NULL,
  email TEXT NOT NULL,
  company TEXT NOT NULL,
  categories TEXT[] DEFAULT '{}',
  message TEXT NOT NULL DEFAULT '',
  product_title TEXT,
  product_sku TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE inquiries ENABLE ROW LEVEL SECURITY;

-- Public can insert inquiries (contact form)
CREATE POLICY "Public can insert inquiries"
  ON inquiries FOR INSERT
  TO anon
  WITH CHECK (true);

-- Only authenticated admin can read inquiries
CREATE POLICY "Admin can read inquiries"
  ON inquiries FOR SELECT
  TO authenticated
  USING (true);

-- 3. ANALYTICS EVENTS TABLE
CREATE TABLE IF NOT EXISTS analytics_events (
  id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  visitor_id TEXT NOT NULL,
  event_type TEXT NOT NULL CHECK (event_type IN ('pageview', 'productview')),
  path TEXT,
  product_id UUID REFERENCES products(id) ON DELETE SET NULL,
  category TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Index for fast queries
CREATE INDEX IF NOT EXISTS idx_analytics_visitor ON analytics_events(visitor_id);
CREATE INDEX IF NOT EXISTS idx_analytics_type ON analytics_events(event_type);
CREATE INDEX IF NOT EXISTS idx_analytics_date ON analytics_events(created_at);

ALTER TABLE analytics_events ENABLE ROW LEVEL SECURITY;

-- Public can insert analytics events
CREATE POLICY "Public can insert analytics"
  ON analytics_events FOR INSERT
  TO anon
  WITH CHECK (true);

-- Only authenticated admin can read analytics
CREATE POLICY "Admin can read analytics"
  ON analytics_events FOR SELECT
  TO authenticated
  USING (true);

-- 4. VISITORS TABLE (for unique visitor tracking)
CREATE TABLE IF NOT EXISTS visitors (
  visitor_id TEXT PRIMARY KEY,
  first_seen TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  last_seen TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  page_views INTEGER NOT NULL DEFAULT 1,
  categories TEXT[] DEFAULT '{}',
  user_agent TEXT
);

ALTER TABLE visitors ENABLE ROW LEVEL SECURITY;

-- Public can upsert visitors
CREATE POLICY "Public can upsert visitors"
  ON visitors FOR INSERT
  TO anon
  WITH CHECK (true);

CREATE POLICY "Public can update visitors"
  ON visitors FOR UPDATE
  TO anon
  USING (true);

-- Only authenticated admin can read visitors
CREATE POLICY "Admin can read visitors"
  ON visitors FOR SELECT
  TO authenticated
  USING (true);

-- 5. ADMIN USERS (managed via Supabase Auth, but we'll store profiles)
CREATE TABLE IF NOT EXISTS admin_profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  username TEXT NOT NULL UNIQUE,
  display_name TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE admin_profiles ENABLE ROW LEVEL SECURITY;

-- Admin can read their own profile
CREATE POLICY "Admin can read own profile"
  ON admin_profiles FOR SELECT
  TO authenticated
  USING (auth.uid() = id);

-- ============================================================
-- FUNCTIONS / VIEWS FOR DASHBOARD STATS
-- ============================================================

-- Get popular products by view count
CREATE OR REPLACE FUNCTION get_popular_products()
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  result JSON;
BEGIN
  SELECT json_agg(popular) INTO result FROM (
    SELECT p.id, p.title, p.sku, p.category, COUNT(*) AS views
    FROM analytics_events ae
    JOIN products p ON p.id::text = ae.product_id
    WHERE ae.event_type = 'productview' AND ae.product_id IS NOT NULL
    GROUP BY p.id, p.title, p.sku, p.category
    ORDER BY views DESC
    LIMIT 10
  ) popular;
  RETURN result;
END;
$$;

-- Get dashboard stats
CREATE OR REPLACE FUNCTION get_dashboard_stats()
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  result JSON;
BEGIN
  SELECT json_build_object(
    'totalProducts', (SELECT COUNT(*) FROM products),
    'totalVolume', (SELECT COALESCE(SUM(qty), 0) FROM products),
    'categoryCount', (SELECT COUNT(DISTINCT category) FROM products),
    'totalInquiries', (SELECT COUNT(*) FROM inquiries)
  ) INTO result;
  RETURN result;
END;
$$;

-- Get analytics summary
CREATE OR REPLACE FUNCTION get_analytics_summary()
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  result JSON;
BEGIN
  SELECT json_build_object(
    'totalPageViews', (SELECT COUNT(*) FROM analytics_events WHERE event_type = 'pageview'),
    'totalProductViews', (SELECT COUNT(*) FROM analytics_events WHERE event_type = 'productview'),
    'uniqueVisitors', (SELECT COUNT(*) FROM visitors),
    'categoryCounts', (
      SELECT json_object_agg(cat, cnt) FROM (
        SELECT COALESCE(category, 'Unknown') AS cat, COUNT(*) AS cnt
        FROM analytics_events
        WHERE category IS NOT NULL
        GROUP BY category
        ORDER BY cnt DESC
      ) cats
    ),
    'popularProducts', (
      SELECT json_agg(popular) FROM (
        SELECT p.id, p.title, p.sku, p.category, COUNT(*) AS views
        FROM analytics_events ae
        JOIN products p ON p.id::text = ae.product_id
        WHERE ae.event_type = 'productview' AND ae.product_id IS NOT NULL
        GROUP BY p.id, p.title, p.sku, p.category
        ORDER BY views DESC
        LIMIT 10
      ) popular
    ),
    'dailyViews', (
      SELECT json_agg(daily) FROM (
        SELECT DATE(created_at) AS date, COUNT(*) AS count
        FROM analytics_events
        GROUP BY DATE(created_at)
        ORDER BY date DESC
        LIMIT 30
      ) daily
    )
  ) INTO result;
  RETURN result;
END;
$$;

-- ============================================================
-- SEED DATA (Optional - run if you want sample products)
-- ============================================================

-- INSERT INTO products (title, sku, qty, category, status, material, moq, featured, image)
-- VALUES
--   ('LADIES FULL ZIP HOODIE WITH KANGAROO POCKET SWEATER', '786-160426', 44000, 'Women', 'Shipment Cancel - In Factory', '52% Rayon 28% Polyester 7GG', 2000, true, '/product-images/women/WhatsApp Image 2026-05-19 at 10.54.44 PM.jpeg'),
--   ('MEN''S V-NECK SWEATER - AMAZON ESSENTIALS', 'AMZ-2024', 5500, 'Men', 'Shipment Cancel - Super Intact', '100% Cotton 12GG', 1000, true, '/product-images/men/WhatsApp Image 2026-05-19 at 10.55.40 PM.jpeg');
