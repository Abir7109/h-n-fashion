import express from "express";
import path from "path";
import { createClient } from "@supabase/supabase-js";
import { createServer as createViteServer } from "vite";
import dotenv from "dotenv";

dotenv.config();

const PORT = 3000;
const supabaseUrl = process.env.VITE_SUPABASE_URL || "";
const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY || "";

if (!supabaseUrl || !supabaseAnonKey) {
  console.error("ERROR: VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY must be set in .env");
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function startServer() {
  const app = express();
  app.use(express.json());

  app.use((req, res, next) => {
    console.log(`[${new Date().toISOString()}] ${req.method} ${req.path}`);
    next();
  });

  // PRODUCTS API
  app.get("/api/products", async (req, res) => {
    const type = req.query.type as string;
    let query = supabase.from("products").select("*").order("created_at", { ascending: false });
    if (type === "fresh" || type === "stock") {
      query = query.eq("product_type", type);
    }
    const { data, error } = await query;
    if (error) {
      // Fallback: column might not exist, try without type filter
      if ((error.code === "42703" || error.message?.includes("does not exist")) && type) {
        const { data: fallback } = await supabase.from("products").select("*").order("created_at", { ascending: false });
        return res.json(fallback || []);
      }
      return res.status(500).json({ error: error.message });
    }
    res.json(data);
  });

  app.post("/api/products", async (req, res) => {
    const { data, error } = await supabase
      .from("products")
      .insert({
        title: req.body.title || "Untitled Product",
        sku: req.body.sku || "N/A",
        qty: Number(req.body.qty) || 0,
        category: req.body.category || "General",
        status: req.body.status || "Pure Export Quality",
        material: req.body.material || "100% Cotton",
        moq: Number(req.body.moq) || 1000,
        image: req.body.image || "https://images.unsplash.com/photo-1523381210434-271e8be1f52b?auto=format&fit=crop&q=80&w=800",
        featured: req.body.featured === true,
        product_type: req.body.productType || "stock",
      })
      .select()
      .single();
    if (error) return res.status(500).json({ error: error.message });
    res.status(201).json(data);
  });

  app.put("/api/products/:id", async (req, res) => {
    const { data, error } = await supabase
      .from("products")
      .update({
        title: req.body.title,
        sku: req.body.sku,
        qty: req.body.qty !== undefined ? Number(req.body.qty) : undefined,
        category: req.body.category,
        status: req.body.status,
        material: req.body.material,
        moq: req.body.moq !== undefined ? Number(req.body.moq) : undefined,
        image: req.body.image,
        featured: req.body.featured !== undefined ? req.body.featured === true : undefined,
        product_type: req.body.productType,
      })
      .eq("id", req.params.id)
      .select()
      .single();
    if (error) {
      if (error.code === "PGRST116") return res.status(404).json({ error: "Product not found" });
      return res.status(500).json({ error: error.message });
    }
    res.json(data);
  });

  app.delete("/api/products/:id", async (req, res) => {
    const { error } = await supabase
      .from("products")
      .delete()
      .eq("id", req.params.id);
    if (error) return res.status(500).json({ error: error.message });
    res.json({ success: true, message: "Product deleted" });
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
    res.json({ success: true, sql: MIGRATE_SQL, instructions: "Copy this SQL and run it in Supabase dashboard > SQL Editor." });
  });

  // INQUIRIES API
  app.get("/api/inquiries", async (_req, res) => {
    const { data, error } = await supabase
      .from("inquiries")
      .select("*")
      .order("created_at", { ascending: false });
    if (error) return res.status(500).json({ error: error.message });
    res.json(data);
  });

  app.post("/api/inquiries", async (req, res) => {
    const { error } = await supabase
      .from("inquiries")
      .insert({
        full_name: req.body.fullName || "Anonymous",
        email: req.body.email || "N/A",
        company: req.body.company || "N/A",
        categories: req.body.categories || [],
        message: req.body.message || "No message provided",
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
    const { data, error } = await supabase.auth.signInWithPassword({
      email: username,
      password,
    });
    if (error) {
      if (username === "Abir" && password === "Abir123") {
        // Fallback to hardcoded admin
        return res.json({ success: true, token: "admin-jwt-simulation-token" });
      }
      return res.status(401).json({ error: "Invalid username or password" });
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
    const { data: products, error: prodErr } = await prodQuery;
    const { data: inquiries, error: inqErr } = await supabase.from("inquiries").select("id");

    if (prodErr || inqErr) return res.status(500).json({ error: "Failed to fetch stats" });

    const totalVolume = products!.reduce((acc: number, p: any) => acc + p.qty, 0);
    const categoryCount = new Set(products!.map((p: any) => p.category)).size;

    res.json({
      totalProducts: products!.length,
      totalVolume,
      categoryCount,
      totalInquiries: inquiries!.length,
    });
  });

  // ANALYTICS TRACKING
  app.post("/api/analytics/track", async (req, res) => {
    const { visitorId, type, path, productId, category } = req.body;
    if (!visitorId || !type) return res.status(400).json({ error: "Missing required fields" });

    // Insert event
    await supabase.from("analytics_events").insert({
      visitor_id: visitorId,
      event_type: type,
      path,
      product_id: productId || null,
      category: category || null,
    });

    // Upsert visitor
    const { data: existing } = await supabase
      .from("visitors")
      .select("*")
      .eq("visitor_id", visitorId)
      .single();

    if (existing) {
      const newCategories = category && !existing.categories.includes(category)
        ? [...existing.categories, category]
        : existing.categories;
      await supabase
        .from("visitors")
        .update({
          last_seen: new Date().toISOString(),
          page_views: existing.page_views + (type === "pageview" ? 1 : 0),
          categories: newCategories,
        })
        .eq("visitor_id", visitorId);
    } else {
      await supabase.from("visitors").insert({
        visitor_id: visitorId,
        first_seen: new Date().toISOString(),
        last_seen: new Date().toISOString(),
        page_views: type === "pageview" ? 1 : 0,
        categories: category ? [category] : [],
      });
    }

    res.status(200).json({ success: true });
  });

  // ANALYTICS SUMMARY
  app.get("/api/analytics/summary", async (_req, res) => {
    const [pageViews, productViews, visitorsRes, categoryCounts, popularProducts, dailyViews] =
      await Promise.all([
        supabase.from("analytics_events").select("id", { count: "exact" }).eq("event_type", "pageview"),
        supabase.from("analytics_events").select("id", { count: "exact" }).eq("event_type", "productview"),
        supabase.from("visitors").select("*"),
        supabase.from("analytics_events").select("category").not("category", "is", null),
        supabase.rpc("get_popular_products"),
        supabase.from("analytics_events").select("created_at"),
      ]);

    const catCounts: Record<string, number> = {};
    (categoryCounts.data || []).forEach((e: any) => {
      if (e.category) catCounts[e.category] = (catCounts[e.category] || 0) + 1;
    });

    const daily: Record<string, number> = {};
    (dailyViews.data || []).forEach((e: any) => {
      const day = e.created_at.split("T")[0];
      daily[day] = (daily[day] || 0) + 1;
    });

    res.json({
      totalPageViews: pageViews.count || 0,
      totalProductViews: productViews.count || 0,
      uniqueVisitors: visitorsRes.data?.length || 0,
      categoryCounts: catCounts,
      popularProducts: popularProducts.data || [],
      dailyViews: Object.entries(daily).map(([date, count]) => ({ date, count })),
    });
  });

  // RECOMMENDATIONS
  app.get("/api/analytics/recommendations", async (req, res) => {
    const visitorId = req.query.visitorId as string;
    let recommendedCategories: string[] = [];

    if (visitorId) {
      const { data: visitor } = await supabase
        .from("visitors")
        .select("categories")
        .eq("visitor_id", visitorId)
        .single();
      if (visitor) recommendedCategories = visitor.categories || [];
    }

    let query = supabase.from("products").select("*").eq("product_type", "stock");

    if (recommendedCategories.length > 0) {
      query = query.in("category", recommendedCategories);
    }

    const { data: products } = await query.limit(8);
    let recommendations = products || [];

    if (recommendations.length < 4) {
      const existingIds = new Set(recommendations.map((p: any) => p.id));
      const { data: featured } = await supabase
        .from("products")
        .select("*")
        .eq("featured", true)
        .not("id", "in", `(${Array.from(existingIds).join(",")})`)
        .limit(8 - recommendations.length);
      recommendations = [...recommendations, ...(featured || [])];
    }

    if (recommendations.length < 4) {
      const existingIds = new Set(recommendations.map((p: any) => p.id));
      const { data: rest } = await supabase
        .from("products")
        .select("*")
        .not("id", "in", `(${Array.from(existingIds).join(",")})`)
        .limit(8 - recommendations.length);
      recommendations = [...recommendations, ...(rest || [])];
    }

    res.json(recommendations.slice(0, 8));
  });

  // Vite integration or static serving
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (_req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server starting on port ${PORT}...`);
    console.log(`Supabase URL: ${supabaseUrl}`);
    console.log(`Admin: http://localhost:${PORT}/admin`);
  });
}

startServer().catch((err) => {
  console.error("Failed to start server:", err);
});
