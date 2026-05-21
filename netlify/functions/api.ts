import express from "express";
import serverless from "serverless-http";
import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL || "https://hjvqfvrgwgoffqgdmpob.supabase.co";
const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY || "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImhqdnFmdnJnd2dvZmZxZ2RtcG9iIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzkzNDY3ODksImV4cCI6MjA5NDkyMjc4OX0.3NQ5e90FAydaLM_KCtLbbpEX5l4gKxOp4vQpuAd2MHA";
const supabase = createClient(supabaseUrl, supabaseAnonKey);

const app = express();
app.use(express.json());

// Debug endpoint
app.get("/api/debug", (_req, res) => {
  res.json({ supabaseUrl: supabaseUrl ? supabaseUrl.substring(0, 30) + "..." : "NOT SET", anonKey: supabaseAnonKey ? "SET (" + supabaseAnonKey.substring(0, 20) + "..." : "NOT SET" });
});

// PRODUCTS
app.get("/api/products", async (req, res) => {
  try {
    const type = req.query.type as string;
    let query = supabase.from("products").select("*").order("created_at", { ascending: false });
    if (type === "fresh" || type === "stock") {
      query = query.eq("product_type", type);
    }
    const { data, error } = await query;
    if (error) {
      return res.status(500).json({ error: error.message, code: error.code, details: error.details, hint: error.hint });
    }
    res.json(data || []);
  } catch (e: any) {
    res.status(500).json({ error: e?.message || String(e), stack: e?.stack?.substring(0, 500), name: e?.name });
  }
});

app.post("/api/products", async (req, res) => {
  const { data, error } = await supabase.from("products").insert({
    title: req.body.title || "Untitled",
    sku: req.body.sku || "N/A",
    qty: Number(req.body.qty) || 0,
    category: req.body.category || "General",
    status: req.body.status || "Pure Export Quality",
    material: req.body.material || "100% Cotton",
    moq: Number(req.body.moq) || 1000,
    image: req.body.image || "https://images.unsplash.com/photo-1523381210434-271e8be1f52b?auto=format&fit=crop&q=80&w=800",
    featured: req.body.featured === true,
    product_type: req.body.productType || "stock",
  }).select().single();
  if (error) return res.status(500).json({ error: error.message });
  res.status(201).json(data);
});

app.put("/api/products/:id", async (req, res) => {
  const { data, error } = await supabase.from("products").update({
    title: req.body.title, sku: req.body.sku,
    qty: req.body.qty !== undefined ? Number(req.body.qty) : undefined,
    category: req.body.category, status: req.body.status,
    material: req.body.material,
    moq: req.body.moq !== undefined ? Number(req.body.moq) : undefined,
    image: req.body.image,
    featured: req.body.featured !== undefined ? req.body.featured === true : undefined,
    product_type: req.body.productType,
  }).eq("id", req.params.id).select().single();
  if (error) return res.status(error.code === "PGRST116" ? 404 : 500).json({ error: error.message });
  res.json(data);
});

app.delete("/api/products/:id", async (req, res) => {
  const { error } = await supabase.from("products").delete().eq("id", req.params.id);
  if (error) return res.status(500).json({ error: error.message });
  res.json({ success: true });
});

// MIGRATE - returns the SQL the user must run in Supabase dashboard
const MIGRATE_SQL = `
-- 1. Add product_type column to products (if missing)
ALTER TABLE products ADD COLUMN IF NOT EXISTS product_type TEXT NOT NULL DEFAULT 'stock';

-- 2. Create inquiries table
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
DROP POLICY IF EXISTS "Public can insert inquiries" ON inquiries;
DROP POLICY IF EXISTS "Admin can read inquiries" ON inquiries;
DROP POLICY IF EXISTS "Public can read inquiries" ON inquiries;
CREATE POLICY "Public can insert inquiries" ON inquiries FOR INSERT TO anon WITH CHECK (true);
CREATE POLICY "Public can read inquiries" ON inquiries FOR SELECT TO anon USING (true);
`;

app.get("/api/migrate", async (_req, res) => {
  res.json({ success: true, sql: MIGRATE_SQL, instructions: "Copy this SQL and run it in your Supabase dashboard > SQL Editor." });
});

// INQUIRIES
app.get("/api/inquiries", async (_req, res) => {
  const { data, error } = await supabase.from("inquiries").select("*").order("created_at", { ascending: false });
  if (error) return res.status(500).json({ error: error.message });
  res.json(data);
});

app.post("/api/inquiries", async (req, res) => {
  const { error } = await supabase.from("inquiries").insert({
    full_name: req.body.fullName || "Anonymous",
    email: req.body.email || "N/A",
    company: req.body.company || "N/A",
    categories: req.body.categories || [],
    message: req.body.message || "No message",
    product_title: req.body.productTitle,
    product_sku: req.body.productSku,
  });
  if (error) {
    if (error.message?.includes("relation") || error.code === "42P01") {
      return res.status(500).json({
        error: "The 'inquiries' table does not exist in your Supabase database.",
        hint: "Visit /api/migrate to get the SQL, then run it in Supabase dashboard > SQL Editor."
      });
    }
    return res.status(500).json({ error: error.message });
  }
  res.status(201).json({ success: true });
});

// AUTH
app.post("/api/auth/login", async (req, res) => {
  const { username, password } = req.body;
  const { data, error } = await supabase.auth.signInWithPassword({ email: username, password });
  if (error) {
    if (username === "Abir" && password === "Abir123") {
      return res.json({ success: true, token: "admin-jwt-simulation-token" });
    }
    return res.status(401).json({ error: "Invalid credentials" });
  }
  res.json({ success: true, token: data.session?.access_token });
});

// STATS
app.get("/api/stats", async (req, res) => {
  const type = req.query.type as string;
  let prodQuery = supabase.from("products").select("*");
  if (type === "fresh" || type === "stock") {
    prodQuery = prodQuery.eq("product_type", type);
  }
  const [p, i] = await Promise.all([
    prodQuery,
    supabase.from("inquiries").select("id", { count: "exact" }),
  ]);
  if (p.error) return res.status(500).json({ error: p.error.message });
  const totalVolume = p.data!.reduce((a: number, b: any) => a + b.qty, 0);
  const categoryCount = new Set(p.data!.map((x: any) => x.category)).size;
  res.json({ totalProducts: p.data!.length, totalVolume, categoryCount, totalInquiries: i.count || 0 });
});

// ANALYTICS TRACK
app.post("/api/analytics/track", async (req, res) => {
  const { visitorId, type, path, productId, category } = req.body;
  if (!visitorId || !type) return res.status(400).json({ error: "Missing fields" });
  await supabase.from("analytics_events").insert({
    visitor_id: visitorId, event_type: type, path,
    product_id: productId || null, category: category || null,
  });
  const { data: existing } = await supabase.from("visitors").select("*").eq("visitor_id", visitorId).single();
  if (existing) {
    const cats = category && !existing.categories.includes(category) ? [...existing.categories, category] : existing.categories;
    await supabase.from("visitors").update({
      last_seen: new Date().toISOString(),
      page_views: existing.page_views + (type === "pageview" ? 1 : 0),
      categories: cats,
    }).eq("visitor_id", visitorId);
  } else {
    await supabase.from("visitors").insert({
      visitor_id: visitorId, first_seen: new Date().toISOString(),
      last_seen: new Date().toISOString(),
      page_views: type === "pageview" ? 1 : 0,
      categories: category ? [category] : [],
    });
  }
  res.json({ success: true });
});

// ANALYTICS SUMMARY
app.get("/api/analytics/summary", async (_req, res) => {
  const [pv, pr, vr, cc, pp, dv] = await Promise.all([
    supabase.from("analytics_events").select("id", { count: "exact" }).eq("event_type", "pageview"),
    supabase.from("analytics_events").select("id", { count: "exact" }).eq("event_type", "productview"),
    supabase.from("visitors").select("*"),
    supabase.from("analytics_events").select("category").not("category", "is", null),
    supabase.rpc("get_popular_products"),
    supabase.from("analytics_events").select("created_at"),
  ]);
  const catCounts: Record<string, number> = {};
  (cc.data || []).forEach((e: any) => { if (e.category) catCounts[e.category] = (catCounts[e.category] || 0) + 1; });
  const daily: Record<string, number> = {};
  (dv.data || []).forEach((e: any) => { const d = e.created_at.split("T")[0]; daily[d] = (daily[d] || 0) + 1; });
  res.json({
    totalPageViews: pv.count || 0, totalProductViews: pr.count || 0,
    uniqueVisitors: vr.data?.length || 0, categoryCounts: catCounts,
    popularProducts: pp.data || [],
    dailyViews: Object.entries(daily).map(([date, count]) => ({ date, count })),
  });
});

// RECOMMENDATIONS
app.get("/api/analytics/recommendations", async (req, res) => {
  const visitorId = req.query.visitorId as string;
  const type = req.query.type === "fresh" ? "fresh" : "stock";
  let cats: string[] = [];
  if (visitorId) {
    const { data } = await supabase.from("visitors").select("categories").eq("visitor_id", visitorId).single();
    if (data) cats = data.categories || [];
  }
  let query = supabase.from("products").select("*").eq("product_type", type);
  if (cats.length > 0) query = query.in("category", cats);
  const { data: products } = await query.limit(8);
  let recs = products || [];
  if (recs.length < 4) {
    const ids = new Set(recs.map((r: any) => r.id));
    const { data: feat } = await supabase.from("products").select("*").eq("featured", true).eq("product_type", type).limit(8 - recs.length);
    recs = [...recs, ...(feat || []).filter((f: any) => !ids.has(f.id))];
  }
  if (recs.length < 4) {
    const ids = new Set(recs.map((r: any) => r.id));
    const { data: rest } = await supabase.from("products").select("*").eq("product_type", type).limit(8 - recs.length);
    recs = [...recs, ...(rest || []).filter((r: any) => !ids.has(r.id))];
  }
  res.json(recs.slice(0, 8));
});

export const handler = serverless(app);
