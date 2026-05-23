import express from "express";
import path from "path";
import { createClient } from "@supabase/supabase-js";
import { createServer as createViteServer } from "vite";
import dotenv from "dotenv";
import multer from "multer";
import ImageKit from "imagekit";

dotenv.config();

const PORT = 3000;
const supabaseUrl = process.env.VITE_SUPABASE_URL || "";
const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY || "";

if (!supabaseUrl || !supabaseAnonKey) {
  console.error("ERROR: VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY must be set in .env");
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseAnonKey);
const supabaseAdmin = createClient(supabaseUrl, process.env.SUPABASE_SERVICE_ROLE_KEY || supabaseAnonKey, {
  auth: { autoRefreshToken: false, persistSession: false }
});

const MAX_PRODUCTS = Number(process.env.MAX_PRODUCTS) || 5;
const MAX_IMAGES = Number(process.env.MAX_IMAGES_PER_PRODUCT) || 3;

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    if (file.mimetype.startsWith("image/")) cb(null, true);
    else cb(new Error("Only image files are allowed"));
  }
});

const imagekit = process.env.IMAGEKIT_PRIVATE_KEY && process.env.IMAGEKIT_PRIVATE_KEY !== "your_private_key"
  ? new ImageKit({
      publicKey: process.env.IMAGEKIT_PUBLIC_KEY || "",
      privateKey: process.env.IMAGEKIT_PRIVATE_KEY || "",
      urlEndpoint: process.env.IMAGEKIT_URL_ENDPOINT || "",
    })
  : null;

async function startServer() {
  const app = express();
  app.use(express.json());

  app.use((req, res, next) => {
    console.log(`[${new Date().toISOString()}] ${req.method} ${req.path}`);
    next();
  });

  // HYBRID UPLOAD: Supabase Storage (primary) → ImageKit (fallback) → base64 (last resort)
  async function ensureStorageBucket() {
    const { data: buckets } = await supabaseAdmin.storage.listBuckets();
    if (!buckets?.find(b => b.name === "products")) {
      await supabaseAdmin.storage.createBucket("products", {
        public: true,
        fileSizeLimit: 10 * 1024 * 1024,
        allowedMimeTypes: ["image/jpeg", "image/png", "image/webp", "image/gif"],
      });
    }
  }

  app.post("/api/upload", upload.array("files", MAX_IMAGES), async (req, res) => {
    try {
      const files = req.files as Express.Multer.File[];
      if (!files || files.length === 0) return res.status(400).json({ error: "No files provided" });

      const urls: string[] = [];
      const errors: string[] = [];
      let usedFallback = false;

      for (const file of files) {
        const ext = file.originalname.split(".").pop() || "jpg";
        const fileName = `product_${Date.now()}_${Math.random().toString(36).slice(2, 8)}.${ext}`;
        let uploaded = false;

        // TIER 1: Supabase Storage
        if (process.env.SUPABASE_SERVICE_ROLE_KEY && process.env.SUPABASE_SERVICE_ROLE_KEY !== "your_service_role_key") {
          try {
            await ensureStorageBucket();
            const { error: uploadErr } = await supabaseAdmin.storage
              .from("products")
              .upload(fileName, file.buffer, { contentType: file.mimetype, upsert: false });
            if (!uploadErr) {
              const { data: { publicUrl } } = supabaseAdmin.storage.from("products").getPublicUrl(fileName);
              urls.push(publicUrl);
              uploaded = true;
            } else {
              errors.push(`Supabase: ${uploadErr.message}`);
            }
          } catch (sbErr: any) {
            errors.push(`Supabase: ${sbErr.message}`);
          }
        }

        // TIER 2: ImageKit fallback
        if (!uploaded && imagekit) {
          try {
            const result = await imagekit.upload({
              file: file.buffer,
              fileName,
              folder: "/h-n-fashion/products",
              useUniqueFileName: true,
            });
            urls.push(result.url);
            uploaded = true;
            usedFallback = true;
          } catch (ikErr: any) {
            errors.push(`ImageKit: ${ikErr.message}`);
          }
        }

        // TIER 3: base64 last resort
        if (!uploaded) {
          urls.push(`data:${file.mimetype};base64,${file.buffer.toString("base64")}`);
          usedFallback = true;
        }
      }

      res.json({
        urls,
        ...(usedFallback ? { warning: "Primary storage unavailable, used fallback." } : {}),
        ...(errors.length > 0 ? { errors } : {}),
      });
    } catch (e: any) {
      res.status(500).json({ error: e?.message || String(e) });
    }
  });

  // PRODUCTS API
  app.get("/api/products", async (req, res) => {
    try {
      const type = req.query.type as string;
      let query = supabase.from("products").select("*").order("created_at", { ascending: false });
      if (type === "fresh" || type === "stock") {
        query = query.eq("product_type", type);
      }
      const { data, error } = await query;
      if (error) return res.status(500).json({ error: error.message });
      res.json(data || []);
    } catch (e: any) {
      res.status(500).json({ error: e?.message || String(e) });
    }
  });

  app.post("/api/products", async (req, res) => {
    const { count, error: countErr } = await supabaseAdmin
      .from("products")
      .select("id", { count: "exact", head: true });
    if (countErr) return res.status(500).json({ error: countErr.message });
    if (count! >= MAX_PRODUCTS) {
      return res.status(400).json({
        error: `Product limit reached (max ${MAX_PRODUCTS}). Delete an existing product before adding a new one.`
      });
    }

    const images: string[] = req.body.images || [];
    const { data, error } = await supabaseAdmin
      .from("products")
      .insert({
        title: req.body.title || "Untitled Product",
        sku: req.body.sku || "N/A",
        qty: Number(req.body.qty) || 0,
        category: req.body.category || "General",
        status: req.body.status || "Pure Export Quality",
        material: req.body.material || "100% Cotton",
        moq: Number(req.body.moq) || 1000,
        image: images[0] || req.body.image || "https://images.unsplash.com/photo-1523381210434-271e8be1f52b?auto=format&fit=crop&q=80&w=800",
        images: images.length > 0 ? images : null,
        featured: req.body.featured === true,
        product_type: req.body.productType || "stock",
      })
      .select()
      .single();
    if (error) return res.status(500).json({ error: error.message });
    res.status(201).json(data);
  });

  app.put("/api/products/:id", async (req, res) => {
    const images: string[] | undefined = req.body.images;
    const updateData: any = {
      title: req.body.title,
      sku: req.body.sku,
      qty: req.body.qty !== undefined ? Number(req.body.qty) : undefined,
      category: req.body.category,
      status: req.body.status,
      material: req.body.material,
      moq: req.body.moq !== undefined ? Number(req.body.moq) : undefined,
      image: images ? images[0] : req.body.image,
      featured: req.body.featured !== undefined ? req.body.featured === true : undefined,
      product_type: req.body.productType,
    };
    if (images !== undefined) updateData.images = images.length > 0 ? images : null;

    const { data, error } = await supabaseAdmin
      .from("products")
      .update(updateData)
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
    const { error } = await supabaseAdmin
      .from("products")
      .delete()
      .eq("id", req.params.id);
    if (error) {
      console.error("Delete error:", error);
      return res.status(500).json({ error: error.message });
    }
    res.json({ success: true, message: "Product deleted" });
  });

  // MIGRATE - returns the SQL the user must run in Supabase dashboard
  const MIGRATE_SQL = `
-- 1. Add product_type column to products (if missing)
ALTER TABLE products ADD COLUMN IF NOT EXISTS product_type TEXT NOT NULL DEFAULT 'stock';

-- 2. Add images array column for multiple product images
ALTER TABLE products ADD COLUMN IF NOT EXISTS images TEXT[] DEFAULT '{}';

-- 3. Create inquiries table
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

-- 4. Create storage bucket for product images
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
SELECT 'products', 'products', true, 10485760, '{image/jpeg,image/png,image/webp,image/gif}'
WHERE NOT EXISTS (SELECT 1 FROM storage.buckets WHERE id = 'products');
`;

  app.get("/api/migrate", async (_req, res) => {
    res.json({ success: true, sql: MIGRATE_SQL, instructions: "Copy this SQL and run it in Supabase dashboard > SQL Editor. Also set SUPABASE_SERVICE_ROLE_KEY in your .env (get it from Supabase Dashboard > Settings > API)." });
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

    const recType = req.query.type === "fresh" ? "fresh" : "stock";
    let query = supabase.from("products").select("*").eq("product_type", recType);

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
