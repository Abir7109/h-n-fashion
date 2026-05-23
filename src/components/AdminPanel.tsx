import React, { useState, useEffect, useMemo } from "react";
import {
  Package, MessageSquare, Plus, Edit2, Trash2,
  LogOut, Globe, Search, RefreshCw, X, Eye, TrendingUp,
  Users, DollarSign, BarChart3, PieChart, Activity, Bell,
  FolderOpen, Clock, CheckCircle, AlertCircle, Menu,
  ChevronDown, Filter, Download, MoreHorizontal
} from "lucide-react";
import { Product, Inquiry, Stats, CATEGORIES } from "../types";

export default function AdminPanel() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [authError, setAuthError] = useState("");
  const [token, setToken] = useState<string | null>(null);

  const [products, setProducts] = useState<Product[]>([]);
  const [inquiries, setInquiries] = useState<Inquiry[]>([]);
  const [stats, setStats] = useState<Stats>({
    totalProducts: 0, totalVolume: 0, categoryCount: 0, totalInquiries: 0
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [activeTab, setActiveTab] = useState<"dashboard" | "analytics" | "products" | "inquiries">("dashboard");
  const [sidebarOpen, setSidebarOpen] = useState(true);

  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [title, setTitle] = useState("");
  const [sku, setSku] = useState("");
  const [qty, setQty] = useState("");
  const [category, setCategory] = useState("T-Shirts");
  const [status, setStatus] = useState("Pure Export Quality");
  const [material, setMaterial] = useState("100% Cotton");
  const [moq, setMoq] = useState("");
  const [image, setImage] = useState("");
  const [featured, setFeatured] = useState(false);
  const [productType, setProductType] = useState<'stock' | 'fresh'>('stock');
  const [images, setImages] = useState<string[]>([]);
  const [uploading, setUploading] = useState(false);
  const [freshCategories] = useState(["T-Shirt", "Polo Shirt", "Tank Top", "Leggings", "Pant", "Jogger", "Hoodie", "Boxer", "Shirt", "Denim Pant", "Denim Shirt"]);

  const [selectedInquiry, setSelectedInquiry] = useState<Inquiry | null>(null);
  const [inquiryFilter, setInquiryFilter] = useState<"all" | "today" | "week">("all");

  // Analytics state
  const [analyticsData, setAnalyticsData] = useState<any>(null);
  const [analyticsLoading, setAnalyticsLoading] = useState(false);

  useEffect(() => {
    const savedToken = localStorage.getItem("admin_token");
    if (savedToken) { setToken(savedToken); setIsAuthenticated(true); }
  }, []);

  useEffect(() => {
    if (isAuthenticated) { fetchAdminData(); fetchAnalytics(); }
  }, [isAuthenticated]);

  const fetchAdminData = async () => {
    setLoading(true); setError("");
    try {
      const [prodRes, inqRes, statsRes] = await Promise.all([
        fetch("/api/products"), fetch("/api/inquiries"), fetch("/api/stats")
      ]);
      if (!prodRes.ok || !inqRes.ok || !statsRes.ok) throw new Error("Failed to pull data.");
      setProducts(await prodRes.json());
      setInquiries(await inqRes.json());
      setStats(await statsRes.json());
    } catch (err: any) {
      setError(err.message || "Communications error.");
    } finally { setLoading(false); }
  };

  const fetchAnalytics = async () => {
    setAnalyticsLoading(true);
    try {
      const res = await fetch("/api/analytics/summary");
      if (res.ok) setAnalyticsData(await res.json());
    } catch {} finally { setAnalyticsLoading(false); }
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault(); setAuthError("");
    try {
      const response = await fetch("/api/auth/login", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password })
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Authentication failed.");
      localStorage.setItem("admin_token", data.token);
      setToken(data.token); setIsAuthenticated(true); setAuthError("");
    } catch (err: any) { setAuthError(err.message || "Invalid credentials."); }
  };

  const handleLogout = () => {
    localStorage.removeItem("admin_token");
    setToken(null); setIsAuthenticated(false);
  };

  const openAddForm = () => {
    setEditingProduct(null);
    setTitle(""); setSku(""); setQty("100000");
    setCategory("T-Shirts"); setStatus("Pure Export Quality");
    setMaterial("100% Cotton"); setMoq("5000");
    setImage("");
    setImages([]);
    setFeatured(false); setProductType('stock'); setIsFormOpen(true);
  };

  const openEditForm = (prod: Product) => {
    setEditingProduct(prod); setTitle(prod.title); setSku(prod.sku);
    setQty(prod.qty.toString()); setCategory(prod.category);
    setStatus(prod.status); setMaterial(prod.material); setMoq(prod.moq.toString());
    setImage(prod.image); setFeatured(prod.featured);
    setImages((prod as any).images || []);
    setProductType((prod as any).product_type || prod.productType || 'stock'); setIsFormOpen(true);
  };

  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title || !sku || !qty || !moq) { alert("Fill all required fields."); return; }
    const payload = { title, sku, qty: Number(qty), category, status, material, moq: Number(moq), image: images[0] || image, images, featured, productType };
    try {
      const response = editingProduct
        ? await fetch(`/api/products/${editingProduct.id}`, { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload) })
        : await fetch("/api/products", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload) });
      if (!response.ok) {
        const errData = await response.json();
        throw new Error(errData.error || "Failed to save.");
      }
      setIsFormOpen(false); fetchAdminData();
    } catch (err: any) { alert(err.message || "Error."); }
  };

  const handleDeleteProduct = async (id: string) => {
    if (!confirm("Delete this product permanently?")) return;
    try {
      const res = await fetch(`/api/products/${id}`, { method: "DELETE" });
      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.error || "Delete failed.");
      }
      fetchAdminData();
    } catch (err: any) { alert(err.message); }
  };

  const filterProduct = (p: Product) => {
    const matchesSearch = p.title.toLowerCase().includes(searchTerm.toLowerCase()) || p.sku.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = selectedCategory === "All" || p.category === selectedCategory;
    return matchesSearch && matchesCategory;
  };

  const freshFiltered = products.filter(p => ((p as any).product_type || p.productType || "stock") === "fresh" && filterProduct(p));
  const stockFiltered = products.filter(p => ((p as any).product_type || p.productType || "stock") === "stock" && filterProduct(p));

  const recentInquiries = useMemo(() => {
    const now = new Date();
    return inquiries.filter(inq => {
      const d = new Date(inq.createdAt);
      if (inquiryFilter === "today") return d.toDateString() === now.toDateString();
      if (inquiryFilter === "week") return (now.getTime() - d.getTime()) < 7 * 24 * 60 * 60 * 1000;
      return true;
    });
  }, [inquiries, inquiryFilter]);

  const categoryData = useMemo(() => {
    const map = new Map<string, number>();
    products.forEach(p => map.set(p.category, (map.get(p.category) || 0) + p.qty));
    return Array.from(map.entries()).map(([name, value]) => ({ name, value }));
  }, [products]);

  const maxCatValue = Math.max(...categoryData.map(d => d.value), 1);
  const totalProductsVolume = products.reduce((a, p) => a + p.qty, 0);

  const navItems = [
    { id: "dashboard", label: "Dashboard", icon: BarChart3 },
    { id: "analytics", label: "Analytics", icon: Activity },
    { id: "products", label: "Products", icon: Package },
    { id: "inquiries", label: "Inquiries", icon: MessageSquare },
  ] as const;

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[#0b1329] via-[#111d3a] to-[#162248] flex items-center justify-center p-4 relative overflow-hidden">
        <div className="absolute inset-0 opacity-[0.03] pointer-events-none" style={{ backgroundImage: "radial-gradient(circle at 25% 25%, #ffffff 0.5px, transparent 1px)", backgroundSize: "40px 40px" }}></div>
        <div className="absolute top-20 left-10 w-72 h-72 bg-[#feae2c]/5 rounded-full blur-3xl"></div>
        <div className="absolute bottom-20 right-10 w-96 h-96 bg-[#25D366]/5 rounded-full blur-3xl"></div>

        <div className="relative w-full max-w-md">
          <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-3xl shadow-2xl overflow-hidden">
            <div className="p-8 text-center border-b border-white/5">
              <div className="w-16 h-16 mx-auto bg-gradient-to-br from-[#feae2c] to-[#ffc933] rounded-2xl flex items-center justify-center mb-4 shadow-lg shadow-[#feae2c]/20">
                <svg width="30" height="30" viewBox="0 0 24 24" fill="none" stroke="#0b1329" strokeWidth="2">
                  <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"/>
                </svg>
              </div>
              <h2 className="font-display font-black text-xl text-white uppercase tracking-wider">H&N Fashion BD</h2>
              <p className="text-xs text-slate-400 mt-1 font-mono">Administrator Dashboard</p>
            </div>

            <form onSubmit={handleLogin} className="p-8 space-y-5">
              {authError && (
                <div className="p-3 bg-red-500/10 border border-red-500/20 text-red-300 rounded-xl text-xs font-bold flex items-center gap-2">
                  <AlertCircle size={14} /> {authError}
                </div>
              )}

              <div>
                <label className="block text-[10px] font-mono font-bold uppercase text-slate-400 mb-1.5">Username</label>
                <input
                  type="text" value={username} onChange={e => setUsername(e.target.value)}
                  placeholder="Abir"
                  className="w-full bg-white/5 border border-white/10 rounded-xl p-3 text-sm text-white outline-none focus:border-[#feae2c] focus:ring-1 focus:ring-[#feae2c]/30 transition-all"
                  required
                />
              </div>

              <div>
                <label className="block text-[10px] font-mono font-bold uppercase text-slate-400 mb-1.5">Password</label>
                <input
                  type="password" value={password} onChange={e => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full bg-white/5 border border-white/10 rounded-xl p-3 text-sm text-white outline-none focus:border-[#feae2c] focus:ring-1 focus:ring-[#feae2c]/30 transition-all"
                  required
                />
              </div>

              <button
                type="submit"
                className="w-full bg-gradient-to-r from-[#feae2c] to-[#ffc933] hover:from-[#e09d25] hover:to-[#f0b92e] text-[#0b1329] font-display font-black text-xs uppercase tracking-wider py-3.5 rounded-xl transition-all shadow-lg shadow-[#feae2c]/20 cursor-pointer"
              >
                Access Dashboard
              </button>
            </form>

            <div className="bg-white/[0.02] border-t border-white/5 p-4 text-center">
              <a href="/" onClick={e => { e.preventDefault(); window.history.pushState({}, "", "/"); window.dispatchEvent(new PopStateEvent("popstate")); }}
                className="text-xs text-slate-500 hover:text-[#feae2c] font-semibold flex items-center justify-center gap-1.5 transition-colors">
                <Globe size={14} /> Back to Website
              </a>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0b1329] flex">
      {/* Sidebar */}
      <aside className={`${sidebarOpen ? "w-64" : "w-16"} bg-[#0a1122] border-r border-white/5 transition-all duration-300 flex flex-col shrink-0`}>
        <div className="p-4 border-b border-white/5 flex items-center gap-3">
          <button onClick={() => setSidebarOpen(!sidebarOpen)} className="text-slate-400 hover:text-white p-1.5 rounded-lg hover:bg-white/5 transition-all">
            <Menu size={18} />
          </button>
          {sidebarOpen && (
            <div className="flex items-center gap-2 overflow-hidden">
              <div className="w-7 h-7 bg-gradient-to-br from-[#feae2c] to-[#ffc933] rounded-lg flex items-center justify-center shrink-0">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#0b1329" strokeWidth="2.5">
                  <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"/>
                </svg>
              </div>
              <span className="text-xs font-display font-black text-white uppercase tracking-wider whitespace-nowrap">Admin Panel</span>
            </div>
          )}
        </div>

        <nav className="flex-1 p-3 space-y-1">
          {navItems.map(item => (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                activeTab === item.id
                  ? "bg-[#feae2c]/10 text-[#feae2c] border border-[#feae2c]/20"
                  : "text-slate-400 hover:text-white hover:bg-white/5 border border-transparent"
              }`}
            >
              <item.icon size={18} />
              {sidebarOpen && <span className="uppercase tracking-wider">{item.label}</span>}
            </button>
          ))}
        </nav>

        <div className="p-3 border-t border-white/5 space-y-1">
          <button onClick={() => { window.history.pushState({}, "", "/"); window.dispatchEvent(new PopStateEvent("popstate")); }}
            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-semibold text-slate-400 hover:text-white hover:bg-white/5 transition-all border border-transparent cursor-pointer">
            <Globe size={18} />
            {sidebarOpen && <span className="uppercase tracking-wider">Website</span>}
          </button>
          <button onClick={handleLogout}
            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-semibold text-red-400 hover:text-red-300 hover:bg-red-500/10 transition-all border border-transparent cursor-pointer">
            <LogOut size={18} />
            {sidebarOpen && <span className="uppercase tracking-wider">Logout</span>}
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 overflow-auto">
        {/* Top Bar */}
        <header className="bg-[#0a1122]/80 backdrop-blur-md border-b border-white/5 sticky top-0 z-40">
          <div className="px-6 py-3 flex items-center justify-between">
            <div>
              <h1 className="font-display font-black text-sm text-white uppercase tracking-wider">
                {activeTab === "dashboard" ? "Dashboard" : activeTab === "analytics" ? "Analytics" : activeTab === "products" ? "Product Management" : "Inquiry Management"}
              </h1>
              <p className="text-[10px] text-slate-500 font-mono">
                {new Date().toLocaleDateString("en-US", { weekday: "long", year: "numeric", month: "long", day: "numeric" })}
              </p>
            </div>
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-2 bg-white/5 px-3 py-1.5 rounded-xl border border-white/5">
                <div className="w-2 h-2 bg-emerald-400 rounded-full animate-pulse"></div>
                <span className="text-[10px] font-mono text-slate-400">Live</span>
              </div>
              <button onClick={() => { fetchAdminData(); fetchAnalytics(); }} className="p-2 text-slate-400 hover:text-white hover:bg-white/5 rounded-lg transition-all cursor-pointer">
                <RefreshCw size={16} className={loading ? "animate-spin" : ""} />
              </button>
            </div>
          </div>
        </header>

        <div className="p-6 space-y-6">
          {error && (
            <div className="p-4 bg-red-500/10 border border-red-500/20 text-red-300 rounded-xl text-xs font-bold flex items-center gap-2">
              <AlertCircle size={14} /> {error}
            </div>
          )}

          {/* Dashboard Tab */}
          {activeTab === "dashboard" && (
            <>
              {/* Stats Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {[
                  { label: "Total Products", value: stats.totalProducts, icon: Package, color: "from-blue-500 to-blue-600", bg: "bg-blue-500/10" },
                  { label: "Total Volume (Pcs)", value: totalProductsVolume.toLocaleString(), icon: TrendingUp, color: "from-emerald-500 to-emerald-600", bg: "bg-emerald-500/10" },
                  { label: "Categories", value: stats.categoryCount, icon: FolderOpen, color: "from-purple-500 to-purple-600", bg: "bg-purple-500/10" },
                  { label: "B2B Inquiries", value: stats.totalInquiries, icon: MessageSquare, color: "from-[#feae2c] to-[#ffc933]", bg: "bg-[#feae2c]/10" },
                ].map((item, i) => (
                  <div key={i} className="bg-[#0a1122] border border-white/5 rounded-2xl p-5 hover:border-white/10 transition-all">
                    <div className="flex items-start justify-between">
                      <div>
                        <span className="text-[10px] font-mono text-slate-500 font-bold uppercase tracking-wider">{item.label}</span>
                        <p className={`font-display font-black text-2xl mt-1 bg-gradient-to-r ${item.color} bg-clip-text text-transparent`}>
                          {item.value}
                        </p>
                      </div>
                      <div className={`${item.bg} p-3 rounded-xl`}>
                        <item.icon size={20} className="text-slate-300" />
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Charts Row */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Category Distribution Bar Chart */}
                <div className="lg:col-span-2 bg-[#0a1122] border border-white/5 rounded-2xl p-6">
                  <div className="flex items-center justify-between mb-6">
                    <div>
                      <h3 className="font-display font-bold text-sm text-white uppercase tracking-wider">Category Distribution</h3>
                      <p className="text-[10px] text-slate-500 font-mono">Volume by category in pieces</p>
                    </div>
                    <div className="p-2 bg-white/5 rounded-lg">
                      <BarChart3 size={18} className="text-[#feae2c]" />
                    </div>
                  </div>
                  <div className="space-y-4">
                    {categoryData.map((cat, idx) => {
                      const pct = (cat.value / maxCatValue) * 100;
                      const colors = ["from-[#feae2c] to-[#ffc933]", "from-emerald-400 to-emerald-500", "from-blue-400 to-blue-500", "from-purple-400 to-purple-500", "from-pink-400 to-pink-500", "from-cyan-400 to-cyan-500"];
                      return (
                        <div key={idx}>
                          <div className="flex justify-between text-xs mb-1.5">
                            <span className="font-semibold text-slate-300">{cat.name}</span>
                            <span className="font-mono text-slate-400">{cat.value.toLocaleString()} pcs</span>
                          </div>
                          <div className="h-2.5 bg-white/5 rounded-full overflow-hidden">
                            <div
                              className={`h-full rounded-full bg-gradient-to-r ${colors[idx % colors.length]} transition-all duration-1000`}
                              style={{ width: `${pct}%` }}
                            ></div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Quick Info & Recent Activity */}
                <div className="bg-[#0a1122] border border-white/5 rounded-2xl p-6">
                  <div className="flex items-center justify-between mb-6">
                    <div>
                      <h3 className="font-display font-bold text-sm text-white uppercase tracking-wider">Quick Overview</h3>
                      <p className="text-[10px] text-slate-500 font-mono">Key metrics at a glance</p>
                    </div>
                    <div className="p-2 bg-white/5 rounded-lg">
                      <Activity size={18} className="text-emerald-400" />
                    </div>
                  </div>

                  <div className="space-y-4">
                    {[
                      { label: "Avg Volume / Product", value: `${Math.round(totalProductsVolume / (products.length || 1)).toLocaleString()} pcs`, icon: Package },
                      { label: "Inquiry Rate", value: `${inquiries.length > 0 ? ((inquiries.length / (products.length || 1)) * 100).toFixed(0) : 0}%`, icon: TrendingUp },
                      { label: "Featured Products", value: products.filter(p => p.featured).length.toString(), icon: CheckCircle },
                      { label: "Active Categories", value: stats.categoryCount.toString(), icon: FolderOpen },
                    ].map((item, i) => (
                      <div key={i} className="flex items-center gap-3 p-3 bg-white/[0.02] rounded-xl border border-white/5">
                        <div className="p-2 bg-white/5 rounded-lg">
                          <item.icon size={14} className="text-slate-400" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-[10px] text-slate-500 font-mono truncate">{item.label}</p>
                          <p className="text-xs font-bold text-white">{item.value}</p>
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Recent Inquiries Mini List */}
                  <div className="mt-6 pt-6 border-t border-white/5">
                    <h4 className="font-display font-bold text-[10px] text-slate-400 uppercase tracking-wider mb-3">Recent Inquiries</h4>
                    <div className="space-y-2">
                      {inquiries.slice(0, 3).length === 0 ? (
                        <p className="text-[10px] text-slate-600 italic">No recent inquiries</p>
                      ) : (
                        inquiries.slice(0, 3).map(inq => (
                          <div key={inq.id} className="flex items-center gap-2 p-2 bg-white/[0.02] rounded-lg">
                            <div className="w-6 h-6 bg-[#feae2c]/10 rounded-full flex items-center justify-center shrink-0">
                              <Users size={10} className="text-[#feae2c]" />
                            </div>
                            <div className="min-w-0 flex-1">
                              <p className="text-[10px] font-semibold text-slate-300 truncate">{inq.fullName}</p>
                              <p className="text-[8px] text-slate-600 font-mono truncate">{inq.company}</p>
                            </div>
                            <span className="text-[8px] text-slate-600 font-mono">{new Date(inq.createdAt).toLocaleDateString()}</span>
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                </div>
              </div>

              {/* Bottom Row - Latest Products & Inquiries */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Latest Products */}
                <div className="bg-[#0a1122] border border-white/5 rounded-2xl p-6">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="font-display font-bold text-sm text-white uppercase tracking-wider">Latest Products</h3>
                    <button onClick={() => setActiveTab("products")} className="text-[10px] font-semibold text-[#feae2c] hover:text-[#ffc933] transition-colors cursor-pointer">
                      View All →
                    </button>
                  </div>
                  <div className="space-y-2">
                    {products.slice(0, 5).length === 0 ? (
                      <p className="text-xs text-slate-600 italic">No products yet</p>
                    ) : (
                      products.slice(0, 5).map(p => (
                        <div key={p.id} className="flex items-center gap-3 p-2.5 bg-white/[0.02] rounded-xl border border-white/5 hover:bg-white/[0.04] transition-all">
                          <img src={p.image} alt="" className="w-10 h-10 rounded-lg object-cover bg-white/5" referrerPolicy="no-referrer" />
                          <div className="flex-1 min-w-0">
                            <p className="text-xs font-semibold text-slate-200 truncate">{p.title}</p>
                            <div className="flex items-center gap-2 mt-0.5">
                              <span className="text-[8px] font-mono text-slate-500">SKU #{p.sku}</span>
                              <span className="text-[8px] px-1.5 py-0.5 bg-white/5 text-slate-400 rounded font-mono">{p.category}</span>
                            </div>
                          </div>
                          <span className="text-[10px] font-mono text-emerald-400 font-bold">{p.qty.toLocaleString()}</span>
                        </div>
                      ))
                    )}
                  </div>
                </div>

                {/* Latest Inquiries */}
                <div className="bg-[#0a1122] border border-white/5 rounded-2xl p-6">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="font-display font-bold text-sm text-white uppercase tracking-wider">Latest Inquiries</h3>
                    <button onClick={() => setActiveTab("inquiries")} className="text-[10px] font-semibold text-[#feae2c] hover:text-[#ffc933] transition-colors cursor-pointer">
                      View All →
                    </button>
                  </div>
                  <div className="space-y-2">
                    {inquiries.slice(0, 5).length === 0 ? (
                      <p className="text-xs text-slate-600 italic">No inquiries yet</p>
                    ) : (
                      inquiries.slice(0, 5).map(inq => (
                        <div key={inq.id} className="flex items-start gap-3 p-2.5 bg-white/[0.02] rounded-xl border border-white/5 hover:bg-white/[0.04] transition-all">
                          <div className="w-9 h-9 bg-[#feae2c]/10 rounded-full flex items-center justify-center shrink-0">
                            <Users size={14} className="text-[#feae2c]" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-xs font-semibold text-slate-200">{inq.fullName}</p>
                            <p className="text-[9px] text-slate-500 truncate">{inq.company} • {inq.email}</p>
                            {inq.productTitle && (
                              <p className="text-[9px] text-slate-600 truncate mt-0.5">
                                <span className="text-[#feae2c]">Product:</span> {inq.productTitle}
                              </p>
                            )}
                          </div>
                          <span className="text-[8px] text-slate-600 font-mono shrink-0">{new Date(inq.createdAt).toLocaleDateString()}</span>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              </div>
            </>
          )}

          {/* Analytics Tab */}
          {activeTab === "analytics" && (
            <>
              {analyticsLoading ? (
                <div className="flex items-center justify-center py-20">
                  <div className="w-8 h-8 border-2 border-[#feae2c] border-t-transparent rounded-full animate-spin"></div>
                  <span className="ml-3 text-xs text-slate-500 font-mono">Loading analytics...</span>
                </div>
              ) : !analyticsData ? (
                <div className="bg-[#0a1122] border border-white/5 rounded-2xl p-10 text-center">
                  <Activity size={32} className="mx-auto text-slate-600 mb-3" />
                  <p className="text-slate-500 text-sm">No analytics data yet. Visit the website to generate data.</p>
                </div>
              ) : (
                <>
                  {/* Analytics Stats Cards */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                    <div className="bg-[#0a1122] border border-white/5 rounded-2xl p-5">
                      <div className="flex items-start justify-between">
                        <div>
                          <span className="text-[10px] font-mono text-slate-500 uppercase font-bold">Page Views</span>
                          <p className="font-display font-black text-2xl mt-1 text-white">{analyticsData.totalPageViews}</p>
                        </div>
                        <div className="bg-blue-500/10 p-3 rounded-xl"><Activity size={20} className="text-blue-400" /></div>
                      </div>
                    </div>
                    <div className="bg-[#0a1122] border border-white/5 rounded-2xl p-5">
                      <div className="flex items-start justify-between">
                        <div>
                          <span className="text-[10px] font-mono text-slate-500 uppercase font-bold">Unique Visitors</span>
                          <p className="font-display font-black text-2xl mt-1 text-white">{analyticsData.uniqueVisitors}</p>
                        </div>
                        <div className="bg-purple-500/10 p-3 rounded-xl"><Users size={20} className="text-purple-400" /></div>
                      </div>
                    </div>
                    <div className="bg-[#0a1122] border border-white/5 rounded-2xl p-5">
                      <div className="flex items-start justify-between">
                        <div>
                          <span className="text-[10px] font-mono text-slate-500 uppercase font-bold">Product Views</span>
                          <p className="font-display font-black text-2xl mt-1 text-white">{analyticsData.totalProductViews}</p>
                        </div>
                        <div className="bg-emerald-500/10 p-3 rounded-xl"><Package size={20} className="text-emerald-400" /></div>
                      </div>
                    </div>
                    <div className="bg-[#0a1122] border border-white/5 rounded-2xl p-5">
                      <div className="flex items-start justify-between">
                        <div>
                          <span className="text-[10px] font-mono text-slate-500 uppercase font-bold">Avg Views/Visitor</span>
                          <p className="font-display font-black text-2xl mt-1 text-white">
                            {analyticsData.uniqueVisitors > 0 ? (analyticsData.totalPageViews / analyticsData.uniqueVisitors).toFixed(1) : 0}
                          </p>
                        </div>
                        <div className="bg-[#feae2c]/10 p-3 rounded-xl"><TrendingUp size={20} className="text-[#feae2c]" /></div>
                      </div>
                    </div>
                  </div>

                  {/* Charts Row */}
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {/* Daily Views Chart */}
                    <div className="bg-[#0a1122] border border-white/5 rounded-2xl p-6">
                      <div className="flex items-center justify-between mb-6">
                        <h3 className="font-display font-bold text-sm text-white uppercase">Daily Page Views</h3>
                      </div>
                      {analyticsData.dailyViews && analyticsData.dailyViews.length > 0 ? (
                        <div className="space-y-2">
                          {analyticsData.dailyViews.slice(-7).map((day: any, i: number) => {
                            const max = Math.max(...analyticsData.dailyViews.map((d: any) => d.count), 1);
                            const pct = (day.count / max) * 100;
                            return (
                              <div key={i}>
                                <div className="flex justify-between text-xs mb-1">
                                  <span className="text-slate-400 font-mono">{new Date(day.date).toLocaleDateString("en", { weekday: "short", month: "short", day: "numeric" })}</span>
                                  <span className="text-slate-300 font-bold">{day.count}</span>
                                </div>
                                <div className="h-2 bg-white/5 rounded-full overflow-hidden">
                                  <div className="h-full bg-gradient-to-r from-[#feae2c] to-[#ffc933] rounded-full transition-all" style={{ width: `${pct}%` }}></div>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      ) : (
                        <p className="text-slate-600 text-xs">No daily data yet</p>
                      )}
                    </div>

                    {/* Category Interests */}
                    <div className="bg-[#0a1122] border border-white/5 rounded-2xl p-6">
                      <div className="flex items-center justify-between mb-6">
                        <h3 className="font-display font-bold text-sm text-white uppercase">Category Interest</h3>
                      </div>
                      {analyticsData.categoryCounts && Object.keys(analyticsData.categoryCounts).length > 0 ? (
                        <div className="space-y-3">
                          {Object.entries(analyticsData.categoryCounts)
                            .sort(([, a]: any, [, b]: any) => b - a)
                            .map(([cat, count]: any, i: number) => {
                              const max = Math.max(...Object.values(analyticsData.categoryCounts) as number[], 1);
                              const pct = (count / max) * 100;
                              const colors = ["#feae2c", "#34d399", "#60a5fa", "#a78bfa", "#f472b6", "#22d3ee"];
                              return (
                                <div key={i}>
                                  <div className="flex justify-between text-xs mb-1">
                                    <span className="text-slate-300 font-semibold">{cat}</span>
                                    <span className="text-slate-400 font-mono">{count} views</span>
                                  </div>
                                  <div className="h-3 bg-white/5 rounded-full overflow-hidden">
                                    <div className="h-full rounded-full transition-all" style={{ width: `${pct}%`, backgroundColor: colors[i % colors.length] }}></div>
                                  </div>
                                </div>
                              );
                            })}
                        </div>
                      ) : (
                        <p className="text-slate-600 text-xs">No category data yet</p>
                      )}
                    </div>
                  </div>

                  {/* Popular Products */}
                  {analyticsData.popularProducts && analyticsData.popularProducts.length > 0 && (
                    <div className="bg-[#0a1122] border border-white/5 rounded-2xl p-6">
                      <div className="flex items-center justify-between mb-4">
                        <h3 className="font-display font-bold text-sm text-white uppercase">Popular Products</h3>
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        {analyticsData.popularProducts.map((p: any, i: number) => (
                          <div key={p.id} className="flex items-center gap-3 p-2.5 bg-white/[0.02] rounded-xl border border-white/5 hover:bg-white/[0.04] transition-all">
                            <span className="text-[#feae2c] font-black text-sm font-mono w-5">#{i + 1}</span>
                            <div className="flex-1 min-w-0">
                              <p className="text-xs font-semibold text-slate-200 truncate">{p.title}</p>
                              <div className="flex items-center gap-2 mt-0.5">
                                <span className="text-[8px] font-mono text-slate-500">SKU #{p.sku}</span>
                                <span className="text-[8px] px-1.5 py-0.5 bg-white/5 text-slate-400 rounded">{p.category}</span>
                              </div>
                            </div>
                            <span className="text-xs font-mono text-emerald-400 font-bold">{p.views} views</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </>
              )}
            </>
          )}

          {/* Products Tab */}
          {activeTab === "products" && (
            <div className="space-y-6">
              {/* Search & Filters */}
              <div className="bg-[#0a1122] border border-white/5 rounded-2xl p-4">
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-4">
                  <div>
                    <h3 className="font-display font-bold text-sm text-white uppercase tracking-wider">Product Inventory</h3>
                    <p className="text-[10px] text-slate-500 font-mono">{products.length} products</p>
                  </div>
                  <button onClick={openAddForm}
                    className="px-4 py-2 bg-gradient-to-r from-[#feae2c] to-[#ffc933] text-[#0b1329] font-display font-black text-[10px] uppercase tracking-wider rounded-xl hover:shadow-lg hover:shadow-[#feae2c]/20 transition-all flex items-center gap-2 cursor-pointer">
                    <Plus size={14} /> Add Product
                  </button>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="relative">
                    <Search size={14} className="absolute left-3 top-3 text-slate-500" />
                    <input type="text" placeholder="Search by title or SKU..." value={searchTerm}
                      onChange={e => setSearchTerm(e.target.value)}
                      className="w-full text-xs font-mono bg-white/5 border border-white/10 rounded-xl pl-9 p-2.5 text-white outline-none focus:border-[#feae2c] placeholder:text-slate-600" />
                  </div>
                  <div>
                    <select value={selectedCategory} onChange={e => setSelectedCategory(e.target.value)}
                      className="w-full text-xs bg-white/5 border border-white/10 rounded-xl p-2.5 text-white outline-none focus:border-[#feae2c]">
                      <option value="All" className="bg-[#0a1122]">All Categories</option>
                      {[...CATEGORIES, ...freshCategories].map(cat => <option key={cat} value={cat} className="bg-[#0a1122]">{cat}</option>)}
                    </select>
                  </div>
                </div>
              </div>

              {/* Fresh Goods Section */}
              <div className="bg-[#0a1122] border border-emerald-500/20 rounded-2xl overflow-hidden">
                <div className="p-4 border-b border-emerald-500/10 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <span className="w-2.5 h-2.5 rounded-full bg-emerald-400"></span>
                    <h4 className="font-display font-bold text-sm text-white uppercase tracking-wider">Fresh Goods</h4>
                    <span className="bg-emerald-500/10 text-emerald-400 text-[9px] font-bold px-2 py-0.5 rounded-full">{freshFiltered.length} products</span>
                  </div>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-left font-mono text-xs">
                    <thead className="bg-white/[0.02] text-slate-400 border-b border-white/5">
                      <tr className="uppercase font-display font-bold text-[9px] tracking-wider">
                        <th className="p-3 text-center w-10">F</th>
                        <th className="p-3">Product</th>
                        <th className="p-3">Category</th>
                        <th className="p-3 text-right">Qty</th>
                        <th className="p-3 text-right">MOQ</th>
                        <th className="p-3 text-center">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-white/5">
                      {freshFiltered.length === 0 ? (
                        <tr><td colSpan={6} className="p-8 text-center text-slate-600 italic">No fresh products found</td></tr>
                      ) : (
                        freshFiltered.map(p => (
                          <tr key={p.id} className="hover:bg-white/[0.02] transition-colors">
                            <td className="p-3 text-center">
                              <span className={`inline-block w-2 h-2 rounded-full ${p.featured ? "bg-[#feae2c]" : "bg-slate-600"}`} />
                            </td>
                            <td className="p-3">
                              <div className="flex items-center gap-3">
                                <img src={p.image} alt="" className="w-10 h-10 rounded-lg object-cover bg-white/5" referrerPolicy="no-referrer" />
                                <div>
                                  <span className="text-[9px] font-mono bg-emerald-500/10 text-emerald-400 px-1.5 py-0.5 rounded font-semibold">SKU #{p.sku}</span>
                                  <h4 className="font-bold text-xs text-slate-200 mt-0.5 line-clamp-1">{p.title}</h4>
                                </div>
                              </div>
                            </td>
                            <td className="p-3">
                              <span className="bg-white/5 text-slate-300 font-bold uppercase text-[9px] px-2 py-1 rounded-lg">{p.category}</span>
                            </td>
                            <td className="p-3 text-right font-bold text-emerald-400">{p.qty.toLocaleString()}</td>
                            <td className="p-3 text-right text-slate-400">{p.moq.toLocaleString()}</td>
                            <td className="p-3">
                              <div className="flex items-center justify-center gap-1">
                                <button onClick={() => openEditForm(p)}
                                  className="p-1.5 px-2.5 hover:bg-white/5 border border-white/10 text-slate-400 hover:text-white rounded-lg transition-all cursor-pointer">
                                  <Edit2 size={12} />
                                </button>
                                <button onClick={() => handleDeleteProduct(p.id)}
                                  className="p-1.5 px-2.5 hover:bg-red-500/10 border border-white/10 text-red-400 hover:text-red-300 rounded-lg transition-all cursor-pointer">
                                  <Trash2 size={12} />
                                </button>
                              </div>
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Stock Goods Section */}
              <div className="bg-[#0a1122] border border-[#feae2c]/20 rounded-2xl overflow-hidden">
                <div className="p-4 border-b border-[#feae2c]/10 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <span className="w-2.5 h-2.5 rounded-full bg-[#feae2c]"></span>
                    <h4 className="font-display font-bold text-sm text-white uppercase tracking-wider">Stock Goods</h4>
                    <span className="bg-[#feae2c]/10 text-[#feae2c] text-[9px] font-bold px-2 py-0.5 rounded-full">{stockFiltered.length} products</span>
                  </div>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-left font-mono text-xs">
                    <thead className="bg-white/[0.02] text-slate-400 border-b border-white/5">
                      <tr className="uppercase font-display font-bold text-[9px] tracking-wider">
                        <th className="p-3 text-center w-10">F</th>
                        <th className="p-3">Product</th>
                        <th className="p-3">Category</th>
                        <th className="p-3 text-right">Qty</th>
                        <th className="p-3 text-right">MOQ</th>
                        <th className="p-3 text-center">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-white/5">
                      {stockFiltered.length === 0 ? (
                        <tr><td colSpan={6} className="p-8 text-center text-slate-600 italic">No stock products found</td></tr>
                      ) : (
                        stockFiltered.map(p => (
                          <tr key={p.id} className="hover:bg-white/[0.02] transition-colors">
                            <td className="p-3 text-center">
                              <span className={`inline-block w-2 h-2 rounded-full ${p.featured ? "bg-[#feae2c]" : "bg-slate-600"}`} />
                            </td>
                            <td className="p-3">
                              <div className="flex items-center gap-3">
                                <img src={p.image} alt="" className="w-10 h-10 rounded-lg object-cover bg-white/5" referrerPolicy="no-referrer" />
                                <div>
                                  <span className="text-[9px] font-mono bg-[#feae2c]/10 text-[#feae2c] px-1.5 py-0.5 rounded font-semibold">SKU #{p.sku}</span>
                                  <h4 className="font-bold text-xs text-slate-200 mt-0.5 line-clamp-1">{p.title}</h4>
                                </div>
                              </div>
                            </td>
                            <td className="p-3">
                              <span className="bg-white/5 text-slate-300 font-bold uppercase text-[9px] px-2 py-1 rounded-lg">{p.category}</span>
                            </td>
                            <td className="p-3 text-right font-bold text-emerald-400">{p.qty.toLocaleString()}</td>
                            <td className="p-3 text-right text-slate-400">{p.moq.toLocaleString()}</td>
                            <td className="p-3">
                              <div className="flex items-center justify-center gap-1">
                                <button onClick={() => openEditForm(p)}
                                  className="p-1.5 px-2.5 hover:bg-white/5 border border-white/10 text-slate-400 hover:text-white rounded-lg transition-all cursor-pointer">
                                  <Edit2 size={12} />
                                </button>
                                <button onClick={() => handleDeleteProduct(p.id)}
                                  className="p-1.5 px-2.5 hover:bg-red-500/10 border border-white/10 text-red-400 hover:text-red-300 rounded-lg transition-all cursor-pointer">
                                  <Trash2 size={12} />
                                </button>
                              </div>
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* Inquiries Tab */}
          {activeTab === "inquiries" && (
            <div className="bg-[#0a1122] border border-white/5 rounded-2xl overflow-hidden">
              <div className="p-5 border-b border-white/5 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                  <h3 className="font-display font-bold text-sm text-white uppercase tracking-wider">B2B Inquiries</h3>
                  <p className="text-[10px] text-slate-500 font-mono">{recentInquiries.length} inquiries</p>
                </div>
                <div className="flex gap-2">
                  {(["all", "today", "week"] as const).map(f => (
                    <button key={f} onClick={() => setInquiryFilter(f)}
                      className={`px-3 py-1.5 rounded-lg text-[10px] font-bold uppercase tracking-wider transition-all cursor-pointer ${
                        inquiryFilter === f ? "bg-[#feae2c]/10 text-[#feae2c] border border-[#feae2c]/20" : "text-slate-500 hover:text-white border border-transparent"
                      }`}>
                      {f}
                    </button>
                  ))}
                </div>
              </div>

              <div className="divide-y divide-white/5">
                {recentInquiries.length === 0 ? (
                  <div className="p-8 text-center text-slate-600 italic text-xs">No inquiries found</div>
                ) : (
                  recentInquiries.map(inq => (
                    <div key={inq.id} className="p-4 hover:bg-white/[0.02] transition-colors">
                      <div className="flex items-start justify-between mb-2">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 bg-[#feae2c]/10 rounded-full flex items-center justify-center">
                            <Users size={16} className="text-[#feae2c]" />
                          </div>
                          <div>
                            <h4 className="font-display font-bold text-sm text-white">{inq.fullName}</h4>
                            <span className="text-[10px] text-slate-500">{inq.company}</span>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="text-[9px] font-mono text-slate-600">{new Date(inq.createdAt).toLocaleDateString()}</span>
                          <button onClick={() => setSelectedInquiry(inq)}
                            className="p-1.5 px-2.5 border border-white/10 text-slate-400 hover:text-white hover:bg-white/5 rounded-lg text-[10px] font-bold flex items-center gap-1 transition-all cursor-pointer">
                            <Eye size={12} /> View
                          </button>
                        </div>
                      </div>
                      {inq.productTitle && (
                        <div className="ml-13 bg-white/[0.02] p-2 rounded-lg border border-white/5 flex items-center gap-2">
                          <Package size={12} className="text-[#feae2c] shrink-0" />
                          <span className="text-xs text-slate-400">{inq.productTitle}</span>
                          <span className="text-[8px] font-mono bg-[#feae2c]/10 text-[#feae2c] px-1.5 py-0.5 rounded ml-auto shrink-0">#{inq.productSku}</span>
                        </div>
                      )}
                      <p className="ml-13 text-[11px] text-slate-500 mt-1.5 line-clamp-2">"{inq.message}"</p>
                      <div className="ml-13 mt-2">
                        <span className="text-[9px] font-mono text-emerald-400">{inq.email}</span>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}
        </div>
      </main>

      {/* Product Form Modal */}
      {isFormOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="relative w-full max-w-xl bg-[#0a1122] border border-white/10 rounded-2xl shadow-2xl overflow-hidden max-h-[90vh] flex flex-col">
            <div className="p-5 border-b border-white/5 flex justify-between items-center">
              <div>
                <h3 className="font-display font-bold text-sm text-white uppercase">
                  {editingProduct ? "Edit Product" : "Add New Product"}
                </h3>
                <p className="text-[10px] text-slate-500 font-mono">Fill in all product specifications</p>
              </div>
              <button onClick={() => setIsFormOpen(false)} className="text-slate-400 hover:text-white p-1 hover:bg-white/5 rounded-lg transition-all cursor-pointer">
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleFormSubmit} className="p-6 overflow-y-auto space-y-4 flex-1">
              <div>
                <label className="block text-[10px] font-mono font-bold uppercase text-slate-400 mb-1">Product Title *</label>
                <input type="text" value={title} onChange={e => setTitle(e.target.value)}
                  placeholder="e.g., Premium Cotton T-Shirts"
                  required
                  className="w-full bg-white/5 border border-white/10 rounded-xl p-2.5 text-xs text-white outline-none focus:border-[#feae2c] placeholder:text-slate-600" />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[10px] font-mono font-bold uppercase text-slate-400 mb-1">SKU *</label>
                  <input type="text" value={sku} onChange={e => setSku(e.target.value)}
                    placeholder="e.g., SKU-001" required
                    className="w-full bg-white/5 border border-white/10 rounded-xl p-2.5 text-xs text-white outline-none focus:border-[#feae2c] placeholder:text-slate-600" />
                </div>
                <div>
                  <label className="block text-[10px] font-mono font-bold uppercase text-slate-400 mb-1">Category *</label>
                  <select value={category} onChange={e => setCategory(e.target.value)}
                    className="w-full bg-white/5 border border-white/10 rounded-xl p-2.5 text-xs text-white outline-none focus:border-[#feae2c]">
                    {CATEGORIES.map(cat => <option key={cat} value={cat} className="bg-[#0a1122]">{cat}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-[10px] font-mono font-bold uppercase text-slate-400 mb-1">Product Type</label>
                  <select value={productType} onChange={e => setProductType(e.target.value as 'stock' | 'fresh')}
                    className="w-full bg-white/5 border border-white/10 rounded-xl p-2.5 text-xs text-white outline-none focus:border-[#feae2c]">
                    <option value="stock" className="bg-[#0a1122]">Stock Goods</option>
                    <option value="fresh" className="bg-[#0a1122]">Fresh Goods</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[10px] font-mono font-bold uppercase text-slate-400 mb-1">Quantity (Pcs) *</label>
                  <input type="number" value={qty} onChange={e => setQty(e.target.value)}
                    placeholder="10000" required
                    className="w-full bg-white/5 border border-white/10 rounded-xl p-2.5 text-xs text-white outline-none focus:border-[#feae2c] placeholder:text-slate-600 font-mono" />
                </div>
                <div>
                  <label className="block text-[10px] font-mono font-bold uppercase text-slate-400 mb-1">MOQ *</label>
                  <input type="number" value={moq} onChange={e => setMoq(e.target.value)}
                    placeholder="1000" required
                    className="w-full bg-white/5 border border-white/10 rounded-xl p-2.5 text-xs text-white outline-none focus:border-[#feae2c] placeholder:text-slate-600 font-mono" />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[10px] font-mono font-bold uppercase text-slate-400 mb-1">Status</label>
                  <input type="text" value={status} onChange={e => setStatus(e.target.value)}
                    placeholder="Pure Export Quality"
                    className="w-full bg-white/5 border border-white/10 rounded-xl p-2.5 text-xs text-white outline-none focus:border-[#feae2c] placeholder:text-slate-600" />
                </div>
                <div>
                  <label className="block text-[10px] font-mono font-bold uppercase text-slate-400 mb-1">Material</label>
                  <input type="text" value={material} onChange={e => setMaterial(e.target.value)}
                    placeholder="100% Cotton"
                    className="w-full bg-white/5 border border-white/10 rounded-xl p-2.5 text-xs text-white outline-none focus:border-[#feae2c] placeholder:text-slate-600" />
                </div>
              </div>

              <div>
                <label className="block text-[10px] font-mono font-bold uppercase text-slate-400 mb-2">Product Images (max 3)</label>
                <div className="grid grid-cols-3 gap-2 mb-2">
                  {images.map((url, i) => (
                    <div key={i} className="relative group aspect-square bg-white/5 rounded-xl border border-white/10 overflow-hidden">
                      <img src={url} alt="" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                      <button type="button" onClick={() => setImages(prev => prev.filter((_, idx) => idx !== i))}
                        className="absolute top-1 right-1 w-5 h-5 bg-red-500/80 hover:bg-red-500 text-white rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer text-[10px] font-bold">
                        ×
                      </button>
                    </div>
                  ))}
                  {images.length < 3 && (
                    <label className={`aspect-square bg-white/5 border-2 border-dashed border-white/10 hover:border-[#feae2c]/50 rounded-xl flex flex-col items-center justify-center gap-1 cursor-pointer transition-all ${uploading ? "opacity-50 pointer-events-none" : ""}`}>
                      <input type="file" hidden multiple accept="image/*" disabled={uploading}
                        onChange={async (e) => {
                          const files = e.target.files;
                          if (!files?.length) return;
                          setUploading(true);
                          try {
                            const fd = new FormData();
                            for (const f of Array.from(files)) fd.append("files", f);
                            const res = await fetch("/api/upload", { method: "POST", body: fd });
                            if (!res.ok) throw new Error("Upload failed");
                            const data = await res.json();
                            setImages(prev => [...prev, ...data.urls].slice(0, 3));
                          } catch (err: any) { alert(err.message); }
                          finally { setUploading(false); e.target.value = ""; }
                        }} />
                      {uploading ? (
                        <div className="w-5 h-5 border-2 border-[#feae2c] border-t-transparent rounded-full animate-spin" />
                      ) : (
                        <>
                          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-slate-500">
                            <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4M17 8l-5-5-5 5M12 3v12" />
                          </svg>
                          <span className="text-[8px] text-slate-500 font-mono">Upload</span>
                        </>
                      )}
                    </label>
                  )}
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-[9px] font-mono text-slate-500">{images.length} / 3 images</span>
                  {image && images.length === 0 && (
                    <span className="text-[9px] font-mono text-slate-500">Using existing: <span className="text-[#feae2c] truncate max-w-[150px] inline-block align-bottom">{image.split("/").pop()}</span></span>
                  )}
                </div>
              </div>

              <div className="flex items-center gap-2 pt-2 border-t border-white/5">
                <input type="checkbox" id="featuredCheck" checked={featured} onChange={e => setFeatured(e.target.checked)}
                  className="rounded border-white/10 bg-white/5 text-[#feae2c] focus:ring-[#feae2c] cursor-pointer" />
                <label htmlFor="featuredCheck" className="text-xs text-slate-400 font-semibold cursor-pointer">Featured Product</label>
              </div>

              <button type="submit"
                className="w-full bg-gradient-to-r from-[#feae2c] to-[#ffc933] hover:from-[#e09d25] hover:to-[#f0b92e] text-[#0b1329] font-display font-black text-xs uppercase tracking-wider py-3 rounded-xl transition-all cursor-pointer">
                {editingProduct ? "Update Product" : "Add Product"}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Inquiry Detail Modal */}
      {selectedInquiry && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="relative w-full max-w-lg bg-[#0a1122] border border-white/10 rounded-2xl shadow-2xl overflow-hidden">
            <div className="p-5 border-b border-white/5 flex justify-between items-center">
              <div>
                <h4 className="font-display font-bold text-sm text-white uppercase">Inquiry Details</h4>
                <p className="text-[10px] text-slate-500 font-mono">Ref: {selectedInquiry.id}</p>
              </div>
              <button onClick={() => setSelectedInquiry(null)} className="text-slate-400 hover:text-white p-1 hover:bg-white/5 rounded-lg transition-all cursor-pointer">
                <X size={16} />
              </button>
            </div>

            <div className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4 border-b border-white/5 pb-3 text-xs">
                <div>
                  <span className="text-slate-500 block text-[9px] font-mono uppercase">Name</span>
                  <span className="font-bold text-white">{selectedInquiry.fullName}</span>
                </div>
                <div>
                  <span className="text-slate-500 block text-[9px] font-mono uppercase">Company</span>
                  <span className="font-bold text-white">{selectedInquiry.company}</span>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4 border-b border-white/5 pb-3 text-xs">
                <div>
                  <span className="text-slate-500 block text-[9px] font-mono uppercase">Email</span>
                  <span className="text-emerald-400 select-all">{selectedInquiry.email}</span>
                </div>
                <div>
                  <span className="text-slate-500 block text-[9px] font-mono uppercase">Date</span>
                  <span className="text-slate-400">{new Date(selectedInquiry.createdAt).toLocaleString()}</span>
                </div>
              </div>

              {selectedInquiry.productTitle && (
                <div className="p-3 bg-white/[0.02] rounded-xl border border-white/5">
                  <span className="block text-[8px] font-mono text-slate-500 uppercase mb-1">Product</span>
                  <h5 className="font-display font-bold text-sm text-white">{selectedInquiry.productTitle}</h5>
                  <span className="inline-block mt-1 bg-[#feae2c]/10 text-[#feae2c] border border-[#feae2c]/20 font-mono font-bold text-[9px] px-2 py-0.5 rounded-lg uppercase">
                    SKU #{selectedInquiry.productSku}
                  </span>
                </div>
              )}

              {selectedInquiry.categories && selectedInquiry.categories.length > 0 && (
                <div>
                  <span className="block text-[8px] font-mono text-slate-500 uppercase mb-1">Categories</span>
                  <div className="flex flex-wrap gap-1.5">
                    {selectedInquiry.categories.map((cat, i) => (
                      <span key={i} className="text-[10px] font-bold bg-white/5 border border-white/10 text-slate-300 px-2 py-0.5 rounded-lg">{cat}</span>
                    ))}
                  </div>
                </div>
              )}

              <div>
                <span className="block text-[8px] font-mono text-slate-500 uppercase mb-1">Message</span>
                <p className="p-3 bg-white/[0.02] rounded-xl border border-white/5 text-xs text-slate-400 leading-relaxed">
                  "{selectedInquiry.message}"
                </p>
              </div>

              <button onClick={() => setSelectedInquiry(null)}
                className="w-full py-2.5 bg-white/5 hover:bg-white/10 text-white border border-white/10 rounded-xl text-xs font-display font-bold uppercase tracking-wider transition-all cursor-pointer">
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
