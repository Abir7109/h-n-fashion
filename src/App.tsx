import React, { useState, useEffect } from "react";
import { 
  Building, Package, MessageSquare, CheckCircle, ChevronRight, Download, Filter, 
  MapPin, PhoneCall, ShieldCheck, Mail, ArrowUpRight, Lock, ExternalLink, HelpCircle,
  ArrowLeft, FileText, Check, Award, Compass, Truck, ChevronLeft, X, Maximize2, ZoomIn,
  Menu, FileCheck, CreditCard, Anchor, TrendingUp
} from "lucide-react";
import { Product, CATEGORIES } from "./types";
import InquiryModal from "./components/InquiryModal";
import ManifestModal from "./components/ManifestModal";
import AdminPanel from "./components/AdminPanel";
import { trackPageView, trackProductView, fetchRecommendations } from "./utils/analytics";
import localProducts from "./data/products.json";

const factoryInsideImg = "/src/assets/images/garment_factory_inside_1779255984639.png";

export default function App() {
  // Simple custom router based on window path updates
  const [currentPath, setCurrentPath] = useState(window.location.pathname);

  useEffect(() => {
    const handleLocationChange = () => {
      setCurrentPath(window.location.pathname);
    };
    window.addEventListener("popstate", handleLocationChange);
    return () => {
      window.removeEventListener("popstate", handleLocationChange);
    };
  }, []);

  // Switch paths comfortably
  const navigateTo = (path: string) => {
    window.history.pushState({}, "", path);
    window.dispatchEvent(new PopStateEvent("popstate"));
  };

  // Helper to parse dynamic URLs
  const getRouteParams = () => {
    if (currentPath.startsWith("/product/")) {
      return { route: "product", id: currentPath.substring("/product/".length) };
    }
    if (currentPath.startsWith("/category/")) {
      return { route: "category", slug: decodeURIComponent(currentPath.substring("/category/".length)) };
    }
    if (currentPath.startsWith("/admin")) {
      return { route: "admin" };
    }
    if (currentPath === "/products" || currentPath === "/all-products") {
      return { route: "products" };
    }
    return { route: "home" };
  };

  // Public portal states
  const [products, setProducts] = useState<Product[]>([]);
  const [recommendedProducts, setRecommendedProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [searchQuery, setSearchQuery] = useState("");

  // Product Compact Gallery and Slidable Lightbox States
  const [activeImageIndex, setActiveImageIndex] = useState(0);
  const [isLightboxOpen, setIsLightboxOpen] = useState(false);

  // Modal interaction states for popups
  const [selectedInquiryProduct, setSelectedInquiryProduct] = useState<Product | null>(null);
  const [isInquiryOpen, setIsInquiryOpen] = useState(false);
  const [selectedManifestProduct, setSelectedManifestProduct] = useState<Product | null>(null);
  const [isManifestOpen, setIsManifestOpen] = useState(false);

  // General sourcing form states
  const [generalName, setGeneralName] = useState("");
  const [generalEmail, setGeneralEmail] = useState("");
  const [generalCompany, setGeneralCompany] = useState("");
  const [generalMessage, setGeneralMessage] = useState("");
  const [generalSuccess, setGeneralSuccess] = useState(false);
  const [generalError, setGeneralError] = useState("");
  const [generalSubmitting, setGeneralSubmitting] = useState(false);

  // Dynamic Product Page Inquiry Form States
  const [pFormName, setPFormName] = useState("");
  const [pFormEmail, setPFormEmail] = useState("");
  const [pFormCompany, setPFormCompany] = useState("");
  const [pFormVolume, setPFormVolume] = useState("FCL (Full Container Load - 20ft)");
  const [pFormMessage, setPFormMessage] = useState("");
  const [pFormSuccess, setPFormSuccess] = useState(false);
  const [pFormSubmitting, setPFormSubmitting] = useState(false);
  const [pFormError, setPFormError] = useState("");

  // Dynamic Category Page Inquiry Form States
  const [catFormName, setCatFormName] = useState("");
  const [catFormEmail, setCatFormEmail] = useState("");
  const [catFormCompany, setCatFormCompany] = useState("");
  const [catFormSpecs, setCatFormSpecs] = useState("");
  const [catFormSuccess, setCatFormSuccess] = useState(false);
  const [catFormSubmitting, setCatFormSubmitting] = useState(false);

  // Quick success indicator toast
  const [notifSuccess, setNotifSuccess] = useState(false);

  // Mobile navigation drawer toggle
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  // Floating WhatsApp widget toggle
  const [isWhatsAppOpen, setIsWhatsAppOpen] = useState(false);

  // Cookie consent state
  const [cookieConsent, setCookieConsent] = useState(true);

  useEffect(() => {
    const accepted = localStorage.getItem("hn_cookie_consent");
    if (!accepted) setCookieConsent(false);
  }, []);

  // Fetch products from full-stack api and reset indices on navigation
  useEffect(() => {
    fetchProducts();
    setActiveImageIndex(0);
    setIsMobileMenuOpen(false); // Close mobile drawer on routing
    trackPageView(currentPath);
  }, [currentPath]);

  const fetchProducts = async () => {
    setLoading(true);
    try {
      const response = await fetch("/api/products");
      if (response.ok) {
        const data = await response.json();
        setProducts(data);
        setLoading(false);
        fetchRecommendations().then(setRecommendedProducts);
        return;
      }
    } catch (err) {
      console.error("Communications error fetching products", err);
    }
    setProducts(localProducts as Product[]);
    setLoading(false);
  };

  // Submit General B2B Inquiry form
  const handleGeneralSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!generalName || !generalEmail || !generalCompany || !generalMessage) {
      setGeneralError("Complete all fields before sending sourcing request.");
      return;
    }
    setGeneralSubmitting(true);
    setGeneralError("");
    try {
      const response = await fetch("/api/inquiries", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          fullName: generalName,
          email: generalEmail,
          company: generalCompany,
          message: generalMessage,
          categories: ["General Sourcing Inquiry"]
        })
      });
      if (response.ok) {
        setGeneralSuccess(true);
        setGeneralName("");
        setGeneralEmail("");
        setGeneralCompany("");
        setGeneralMessage("");
      } else {
        throw new Error("Target server error.");
      }
    } catch (err) {
      setGeneralError("Failed to register inquiry on database. Try again.");
    } finally {
      setGeneralSubmitting(false);
    }
  };

  // Submit embedded product-pinned inquiry
  const handleProductPageInquirySubmit = async (e: React.FormEvent, targetProduct: Product) => {
    e.preventDefault();
    if (!pFormName || !pFormEmail || !pFormCompany) {
      setPFormError("Contact Name, Email and Company are required.");
      return;
    }
    setPFormSubmitting(true);
    setPFormError("");
    try {
      const response = await fetch("/api/inquiries", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          fullName: pFormName,
          email: pFormEmail,
          company: pFormCompany,
          categories: [targetProduct.category],
          message: pFormMessage || `Inquiry for SKU #${targetProduct.sku} - target loading volume: ${pFormVolume}.`,
          productTitle: targetProduct.title,
          productSku: targetProduct.sku
        }),
      });
      if (response.ok) {
        setPFormSuccess(true);
        setPFormName("");
        setPFormEmail("");
        setPFormCompany("");
        setPFormMessage("");
        setNotifSuccess(true);
        setTimeout(() => setNotifSuccess(false), 5000);
      } else {
        throw new Error("Sourcing server reported error.");
      }
    } catch (e: any) {
      setPFormError(e.message || "Communications error transacting data.");
    } finally {
      setPFormSubmitting(false);
    }
  };

  // Submit embedded category page inquiry
  const handleCategoryPageInquirySubmit = async (e: React.FormEvent, targetCategoryName: string) => {
    e.preventDefault();
    if (!catFormName || !catFormEmail || !catFormCompany) {
      alert("Name, Email, and Company are required.");
      return;
    }
    setCatFormSubmitting(true);
    try {
      const response = await fetch("/api/inquiries", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          fullName: catFormName,
          email: catFormEmail,
          company: catFormCompany,
          categories: [targetCategoryName],
          message: catFormSpecs || `Bulk sourcing inquiry for entire Category: ${targetCategoryName}.`
        }),
      });
      if (response.ok) {
        setCatFormSuccess(true);
        setCatFormName("");
        setCatFormEmail("");
        setCatFormCompany("");
        setCatFormSpecs("");
      }
    } catch (err) {
      console.error(err);
    } finally {
      setCatFormSubmitting(false);
    }
  };

  // Render Virtual Manifest Certification Downloader
  const downloadCertifiedSpecs = (product: Product) => {
    const content = `
========================================
    STOCKLOT BD - EXPORT SPECIFICATION CERTIFICATE
========================================
Product Title       : ${product.title}
SKU Reference Code  : #${product.sku}
Sourcing Category   : ${product.category}
Quality Classification: ${product.status} (Verified Export Quality)
Fabric Composition  : ${product.material}
Total Cargo Volume  : ${product.qty.toLocaleString()} Pcs
Minimum order Limit : ${product.moq.toLocaleString()} Pcs

SIZE GRID DISTRIBUTION (Complies with AQL Standard Ratio 1:2:2:1)
- Small (S)         : ${Math.round(product.qty * 0.16).toLocaleString()} Pcs
- Medium (M)        : ${Math.round(product.qty * 0.34).toLocaleString()} Pcs
- Large (L)         : ${Math.round(product.qty * 0.34).toLocaleString()} Pcs
- Extra Large (XL)  : ${Math.round(product.qty * 0.16).toLocaleString()} Pcs

PACKAGING & CONTAINER FILL SPECS:
- Individual Carton : Moisture-proof heat-sealed poly bagging
- Master Cargo Carton: Heavy-weight 5-wall cardboard cartons (12-24 Pcs)
- Moisture Control  : Sealed inside containers with dry-bag moisture treatments
- 20ft container fill: (~28,000 - 32,000 Pcs volume capacity)
----------------------------------------
Authenticated by Independent SGS AQL-1.5 Inspections Desk, Dhaka office.
========================================
    `;
    const blob = new Blob([content], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `HN_Fashion_Specs_${product.sku}.txt`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Get dynamic multiple product images based on category or product specs
  const getProductImages = (prod: Product): string[] => {
    const mainImage = prod.image;
    const category = (prod.category || "").toLowerCase();
    
    // High-fidelity specific alternate photos matching the products exactly
    const alternates: { [key: string]: string[] } = {
      "t-shirts": [
        "https://images.unsplash.com/photo-1583743814966-8936f5b7be1a?auto=format&fit=crop&q=80&w=800", // folded in warehouse
        "https://images.unsplash.com/photo-1576566588028-4147f3842f27?auto=format&fit=crop&q=80&w=800", // wearing t-shirt
        "https://images.unsplash.com/photo-1503342217505-b0a15ec3261c?auto=format&fit=crop&q=80&w=800", // t-shirt close up
      ],
      "intimates": [
        "https://images.unsplash.com/photo-1616606103915-dea7be788566?auto=format&fit=crop&q=80&w=800", // lace detail
        "https://images.unsplash.com/photo-1525507119028-ed4c629a60a3?auto=format&fit=crop&q=80&w=800", // folded sets
        "https://images.unsplash.com/photo-1562572159-4ebcd318f4dd?auto=format&fit=crop&q=80&w=800", // hanger display
      ],
      "denim": [
        "https://images.unsplash.com/photo-1541099649105-f69ad21f3246?auto=format&fit=crop&q=80&w=800", // folded jeans stack
        "https://images.unsplash.com/photo-1516257984-b1b4d707412e?auto=format&fit=crop&q=80&w=800", // back pocket label
        "https://images.unsplash.com/photo-1576995853123-5a10305d93c0?auto=format&fit=crop&q=80&w=800", // pocket rivets
      ],
      "shirts": [
        "https://images.unsplash.com/photo-1602810318383-e386cc2a3ccf?auto=format&fit=crop&q=80&w=800", // rolled sleeves close-up
        "https://images.unsplash.com/photo-1603252109303-2751441dd157?auto=format&fit=crop&q=80&w=800", // stacked clothes table
        "https://images.unsplash.com/photo-1586528116311-ad8dd3c8310d?auto=format&fit=crop&q=80&w=800", // shipping cargo
      ],
      "kids wear": [
        "https://images.unsplash.com/photo-1522771739844-6a9f6d5f14af?auto=format&fit=crop&q=80&w=800", // cozy pile child clothes
        "https://images.unsplash.com/photo-1503919545889-aef636e10ad4?auto=format&fit=crop&q=80&w=800", // dynamic kids selection
        "https://images.unsplash.com/photo-1519457431-44ccd64a579b?auto=format&fit=crop&q=80&w=400", // detail seam
      ],
      "activewear": [
        "https://images.unsplash.com/photo-1483721310020-03333e577078?auto=format&fit=crop&q=80&w=800", // active lifestyle
        "https://images.unsplash.com/photo-1517838277536-f5f99be501cd?auto=format&fit=crop&q=80&w=800", // sports layout
        "https://images.unsplash.com/photo-1578575437130-527eed3abbec?auto=format&fit=crop&q=80&w=800", // boxes
      ],
      "outerwear": [
        "https://images.unsplash.com/photo-1544923246-77307dd654cb?auto=format&fit=crop&q=80&w=800", // zipper
        "https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?auto=format&fit=crop&q=80&w=800", // weave
        "https://images.unsplash.com/photo-1586528116311-ad8dd3c8310d?auto=format&fit=crop&q=80&w=800", // shipping
      ]
    };

    const selectedCategoryAlts = alternates[category] || [
      "https://images.unsplash.com/photo-1586528116311-ad8dd3c8310d?auto=format&fit=crop&q=80&w=800",
      "https://images.unsplash.com/photo-1578575437130-527eed3abbec?auto=format&fit=crop&q=80&w=800",
      "https://images.unsplash.com/photo-1603252109303-2751441dd157?auto=format&fit=crop&q=80&w=800",
    ];

    const mainZoom = `${mainImage.split("?")[0]}?auto=format&fit=crop&q=80&w=800&rect=100,100,600,600`;

    return [
      mainImage,
      selectedCategoryAlts[0] || "https://images.unsplash.com/photo-1586528116311-ad8dd3c8310d?auto=format&fit=crop&q=80&w=800",
      selectedCategoryAlts[1] || "https://images.unsplash.com/photo-1578575437130-527eed3abbec?auto=format&fit=crop&q=80&w=800",
      selectedCategoryAlts[2] || mainZoom
    ];
  };

  // Lightbox keyboard navigation
  useEffect(() => {
    if (!isLightboxOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      const activeId = getRouteParams().id;
      const prod = products.find(p => p.id === activeId || p.sku === activeId);
      if (!prod) return;
      
      const imgList = getProductImages(prod);
      const maxIdx = imgList.length - 1;

      if (e.key === "Escape") {
        setIsLightboxOpen(false);
      } else if (e.key === "ArrowLeft") {
        setActiveImageIndex((prev) => (prev === 0 ? maxIdx : prev - 1));
      } else if (e.key === "ArrowRight") {
        setActiveImageIndex((prev) => (prev === maxIdx ? 0 : prev + 1));
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [isLightboxOpen, products, currentPath]);

  // Track product page views
  useEffect(() => {
    const params = getRouteParams();
    if (params.route === "product" && params.id) {
      const prod = products.find(p => p.id === params.id || p.sku === params.id);
      if (prod) trackProductView(prod.id, prod.category);
    }
  }, [currentPath, products]);

  // If path is admin, direct straight into the secure administrative ledger
  const routeParams = getRouteParams();
  if (routeParams.route === "admin") {
    return <AdminPanel />;
  }

  // Filter products reactively by search query and category (for homepage layout)
  const filteredProducts = products.filter((p) => {
    const matchesCategory = selectedCategory === "All" || p.category.toLowerCase() === selectedCategory.toLowerCase();
    const matchesQuery = p.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
                         p.sku.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         p.category.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         p.material.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         (p.status && p.status.toLowerCase().includes(searchQuery.toLowerCase()));
    return matchesCategory && matchesQuery;
  });

  // Category specific SEO details mapper
  const getCategorySEO = (catSlug: string) => {
    const clean = catSlug.toLowerCase();
    if (clean.includes("denim")) {
      return {
        heading: "Bangladesh's Direct Overstock Denim Sourcing Gateway",
        keywords: "denim stock lot jeans wholesale Bangladesh, surplus clothing overstock supplier Bangladesh, pure export stock lot clothing Bangladesh",
        description: "Examine our premium export-quality denim stock lot jeans wholesale Bangladesh catalog. Connecting wholesale importers directly with Dhaka's top compliant garment manufacturers to buy pure export stock lot clothing Bangladesh with standard packaging. We supply certified, non‑reject surplus garments wholesale Bangladesh direct from physical Dhaka ready stock lots."
      };
    } else if (clean.includes("t-shirt") || clean.includes("polo") || clean.includes("shirt")) {
      return {
        heading: "Dhaka Centralized Wholesale Stock Lot T-Shirts & Polos Clearance Office",
        keywords: "wholesale stock lot t shirts Bangladesh, stock lot polo shirts exporter Bangladesh, garment stock lot Bangladesh",
        description: "Secure factory overrun wholesale stock lot t shirts Bangladesh and stock lot polo shirts exporter Bangladesh allocations at unmatched factory-clearance prices. Audited to peak BGMEA export standards, moisture-proof treated and boxed inside high-strength master cartons for instant maritime shipping."
      };
    } else if (clean.includes("kid")) {
      return {
        heading: "Direct Factory Children Clothing Stock Lot Garments Bangladesh",
        keywords: "children clothing stock lot garments Bangladesh, mixed size stock lot garments Bangladesh, export quality stock lot garments ready stock Bangladesh",
        description: "Secure export-quality children clothing stock lot garments Bangladesh containers mapped with balanced mixed size stock lot garments Bangladesh ratio distributions. Sealed moisture-controlled ready stock lot cargo, direct departures out of Dhaka warehouse hub."
      };
    }
    return {
      heading: `Compliant ${catSlug} Garment Stock Lot Bangladesh Exporter Hub`,
      keywords: "surplus clothing overstock supplier Bangladesh, buy stock lot garments from Bangladesh, export quality stock lot garments Bangladesh",
      description: `Acquire direct export quality stock lot garments Bangladesh ready stock allocations of category ${catSlug} under fully verified SGS packing audits. Safe B2B shipping protocols via Chittagong sea port to Western docks.`
    };
  };

  // Reusable Category Navigation filter header (includes "🏠 Home" as requested!)
  const renderCategoryFilterHeader = () => {
    return (
      <div className="flex flex-col gap-3 border-b border-slate-200 pb-4">
        <div className="flex flex-wrap gap-1.5 items-center -mx-1 px-1">
          <button
            onClick={() => {
              setSelectedCategory("All");
              navigateTo("/");
            }}
            className={`px-2.5 py-1.5 rounded text-[10px] font-bold uppercase transition-all flex items-center gap-1 shrink-0 ${
              routeParams.route === "home" && selectedCategory === "All"
                ? "bg-slate-900 text-[#feae2c] border border-slate-900"
                : "bg-white border border-slate-200 text-slate-700 hover:bg-slate-50"
            }`}
          >
            Home ({products.length})
          </button>
          
          {CATEGORIES.map((cat) => {
            const count = products.filter((p) => p.category === cat).length;
            const isCatActive = routeParams.route === "category" && routeParams.slug?.toLowerCase() === cat.toLowerCase();
            return (
              <button
                type="button"
                key={cat}
                onClick={() => {
                  setSelectedCategory(cat);
                  navigateTo(`/category/${encodeURIComponent(cat)}`);
                }}
                className={`px-2.5 py-1.5 rounded text-[10px] font-semibold uppercase cursor-pointer transition-all shrink-0 ${
                  isCatActive
                    ? "bg-primary text-white border border-primary"
                    : "bg-white border border-slate-200 text-slate-700 hover:bg-slate-50"
                }`}
              >
                {cat} ({count})
              </button>
            );
          })}
        </div>
      </div>
    );
  };

  // Render product grid
  const renderProductGrid = (items: Product[]) => {
    if (items.length === 0) {
      return (
        <div className="p-6 text-center text-slate-500 italic">
          No products found
        </div>
      );
    }
    return (
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
        {items.map((p) => (
          <div
            key={p.id}
            onClick={() => navigateTo(`/product/${p.id}`)}
            className="group bg-white border border-slate-200 rounded-lg overflow-hidden shadow-sm hover:shadow-lg hover:border-primary/30 transition-all cursor-pointer"
          >
            {/* Image Wrapper */}
            <div className="relative bg-slate-100 h-40 xs:h-48 sm:h-56 overflow-hidden">
              <img
                src={p.image}
                alt={p.title}
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                referrerPolicy="no-referrer"
              />
              
              {/* Category Overlays */}
              <span className="absolute top-1 left-1 bg-slate-900/90 text-white font-mono font-bold text-[6px] xs:text-[8px] tracking-wider uppercase px-1 py-0.5 rounded">
                {p.category}
              </span>

              {p.featured && (
                <span className="absolute top-1 right-1 bg-[#feae2c] text-indigo-950 font-black text-[5px] xs:text-[7px] uppercase px-1 py-0.5 rounded shadow">
                  Featured
                </span>
              )}

              <div className="absolute bottom-1 left-1 bg-slate-950/80 text-white font-mono text-[6px] xs:text-[8px] px-1 rounded">
                #{p.sku}
              </div>
            </div>

            {/* Product Info */}
            <div className="p-3 sm:p-4 space-y-2 flex-1">
              <h4 className="font-display font-bold text-xs sm:text-sm text-[#0b1329] group-hover:text-primary transition-colors line-clamp-2 leading-snug">
                {p.title}
              </h4>
              <div className="flex items-center gap-2 text-[10px] sm:text-xs">
                <span className="bg-[#0b1329]/10 text-[#0b1329] px-2 py-0.5 rounded font-semibold">{p.category}</span>
                <span className="text-slate-400">#{p.sku}</span>
              </div>
              <div className="flex justify-between items-center pt-2 border-t border-slate-100">
                <div>
                  <span className="text-[9px] text-slate-400 uppercase">Ready</span>
                  <p className="font-bold text-primary text-sm">{p.qty.toLocaleString()} pcs</p>
                </div>
                <span className="text-[9px] sm:text-[10px] px-2 py-1 bg-emerald-50 text-emerald-700 rounded border border-emerald-200 font-semibold">{p.status}</span>
              </div>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setSelectedInquiryProduct(p);
                  setIsInquiryOpen(true);
                }}
                className="w-full py-2 bg-[#feae2c] hover:bg-[#0b1329] hover:text-white text-[#0b1329] font-bold text-[10px] sm:text-xs uppercase tracking-wide rounded transition-all mt-2"
              >
                Inquire Now
              </button>
            </div>
          </div>
        ))}
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-[#f8fafc] text-slate-950 flex flex-col font-sans w-full max-w-full overflow-x-hidden">
      
      {/* Dynamic Success Alert toast */}
      {notifSuccess && (
        <div className="fixed bottom-6 right-6 z-110 bg-primary border-2 border-secondary text-white p-4 rounded-lg shadow-2xl animate-bounce flex items-center gap-3">
          <div className="bg-[#feae2c] text-indigo-950 rounded-full p-1.5 font-bold text-xs">✓</div>
          <div>
            <span className="font-bold block text-xs uppercase tracking-wider text-[#feae2c]">B2B Order Allocated</span>
            <p className="text-[11px] text-white/80">Our Dhaka export executive will email you within 2 hours.</p>
          </div>
        </div>
      )}

      {/* Primary Top Bar (Admin Buttons cleanly removed!) */}
      <nav id="navbar" className="bg-[#0b1329] text-white border-b border-white/5 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 py-3 sm:py-4 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3 cursor-pointer" onClick={() => navigateTo("/")}>
            <div className="w-10 h-10 sm:w-12 sm:h-12 bg-white rounded-lg flex items-center justify-center p-1 border border-white/10 shadow-lg overflow-hidden shrink-0">
              <img 
                src="https://i.postimg.cc/j5vCrPgD/Whats-App-Image-2026-05-20-at-11-10-59-AM.jpg" 
                alt="H and N Fashion BD Logo" 
                className="w-full h-full object-contain"
                referrerPolicy="no-referrer"
                onError={(e) => {
                  e.currentTarget.style.display = 'none';
                  const p = e.currentTarget.parentElement;
                  if (p) {
                    const fallback = p.querySelector('.logo-fallback') as HTMLElement;
                    if (fallback) fallback.classList.remove('hidden');
                  }
                }}
              />
              <div className="logo-fallback hidden w-full h-full bg-[#feae2c] text-indigo-950 font-black text-[10px] sm:text-xs rounded flex items-center justify-center tracking-wider">
                H&N
              </div>
            </div>
            <div>
              <h1 className="font-display font-black text-xs sm:text-sm tracking-tight uppercase text-white flex items-center gap-1.5 leading-none mb-1">
                H and N Fashion BD
                <span className="bg-[#feae2c] text-indigo-950 text-[7px] sm:text-[8px] font-black px-1 sm:px-1.5 py-0.5 rounded-full font-mono">B2B</span>
              </h1>
              <p className="text-[9px] sm:text-[10px] text-slate-400 font-mono tracking-wider">
                BANGLADESH DIRECT SURPLUS PORTAL
              </p>
            </div>
          </div>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center gap-6 text-xs font-semibold text-slate-300 whitespace-nowrap">
            <a 
              href="#products"
              onClick={(e) => { e.preventDefault(); document.getElementById("products")?.scrollIntoView({ behavior: "smooth" }); }}
              className="hover:text-secondary transition-colors uppercase tracking-wider shrink-0"
            >
              Products
            </a>
            <a 
              href="#inquiry"
              onClick={(e) => { e.preventDefault(); document.getElementById("inquiry")?.scrollIntoView({ behavior: "smooth" }); }}
              className="hover:text-secondary transition-colors uppercase tracking-wider shrink-0"
            >
              Get Quote
            </a>
          </div>

          {/* Hamburger Menu Toggle Button for Android/Mobile views */}
          <button 
            type="button"
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            className="md:hidden text-white hover:text-[#feae2c] focus:outline-none p-1.5 rounded bg-white/5 border border-white/10 active:scale-95 transition-all"
            aria-label="Toggle Menu"
          >
            {isMobileMenuOpen ? <X size={20} /> : <Menu size={20} />}
          </button>
        </div>

        {/* Mobile Menu */}
        {isMobileMenuOpen && (
          <div className="md:hidden bg-[#0a1122] border-t border-white/5 px-4 py-4 space-y-3 animate-fadeIn">
            <a 
              href="#products"
              onClick={(e) => { e.preventDefault(); setIsMobileMenuOpen(false); document.getElementById("products")?.scrollIntoView({ behavior: "smooth" }); }}
              className="block py-2.5 px-3 rounded-lg text-xs font-bold uppercase tracking-wider text-slate-200 hover:text-[#feae2c] transition-all"
            >
              Products
            </a>
            <a 
              href="#inquiry"
              onClick={(e) => { e.preventDefault(); setIsMobileMenuOpen(false); document.getElementById("inquiry")?.scrollIntoView({ behavior: "smooth" }); }}
              className="block py-2.5 px-3 rounded-lg text-xs font-bold uppercase tracking-wider text-slate-200 hover:text-[#feae2c] transition-all"
            >
              Get Quote
            </a>
          </div>
        )}
      </nav>

      {/* Main Body Router Resolver */}
      {routeParams.route === "home" && (
        <>
{/* Product-Focused Hero */}
          <section className="bg-gradient-to-r from-[#0b1329] to-[#1a2744] text-white py-6 sm:py-10 px-4 border-b-4 border-[#feae2c]">
            <div className="max-w-7xl mx-auto">
              <div className="flex flex-col lg:flex-row items-center gap-6 lg:gap-8">
                <div className="flex-1 text-center lg:text-left space-y-3">
                  <h2 className="font-display font-black text-2xl xs:text-3xl sm:text-4xl text-white tracking-tight">
                    Stock Lot Garments <span className="text-[#feae2c]">From Bangladesh</span>
                  </h2>
                  <p className="text-slate-300 text-sm">
                    T-shirts, jeans, intimates, kids wear at wholesale prices. Verified AQL quality.
                  </p>
                  <div className="flex flex-wrap justify-center lg:justify-start gap-3 pt-2">
                    <a
                      href="#products"
                      className="bg-[#feae2c] hover:bg-[#ffc933] text-slate-950 font-bold px-5 py-2.5 rounded text-xs uppercase tracking-wider shadow-lg transition-colors flex items-center gap-2"
                    >
                      Browse Products
                      <ChevronRight size={14} />
                    </a>
                    <a
                      href="#inquiry"
                      className="bg-white/10 hover:bg-white/15 text-white border border-white/20 font-bold px-5 py-2.5 rounded text-xs uppercase tracking-wider transition-colors"
                    >
                      Get Quote
                    </a>
                  </div>
                </div>
                <div className="flex gap-4 flex-wrap justify-center">
                  <div className="bg-white/10 border border-white/10 rounded-xl p-4 text-center min-w-[120px]">
                    <span className="text-2xl font-black text-[#feae2c]">{products.length}</span>
                    <p className="text-[10px] text-slate-400 mt-1">Active Lots</p>
                  </div>
                  <div className="bg-white/10 border border-white/10 rounded-xl p-4 text-center min-w-[120px]">
                    <span className="text-2xl font-black text-[#feae2c]">
                      {(products.reduce((acc, p) => acc + p.qty, 0) / 1000).toFixed(0)}K
                    </span>
                    <p className="text-[10px] text-slate-400 mt-1">Total Pcs</p>
                  </div>
                  <div className="bg-white/10 border border-white/10 rounded-xl p-4 text-center min-w-[120px]">
                    <span className="text-2xl font-black text-emerald-400">AQL 1.5</span>
                    <p className="text-[10px] text-slate-400 mt-1">Verified</p>
                  </div>
                </div>
              </div>
            </div>
          </section>

          {/* Marquee Moving Ticker Bar */}
          <div className="bg-slate-900 border-y border-slate-800 py-3 overflow-hidden flex items-center">
            <div className="ticker-scroll">
              {[...Array(4)].map((_, i) => (
                <div key={i} className="flex items-center gap-8 whitespace-nowrap text-[10px] font-mono font-bold tracking-widest text-slate-400 uppercase">
                  <span className="text-[#feae2c]">● Live Dhaka Allocations Loaded</span>
                  <span>• VERIFIED AQL 1.5 LOGISTICS PROTOCOLS</span>
                  <span className="text-[#feae2c]">• EXPORT PACKING COMPLIANT</span>
                  <span>• BRANDED DENIM & COTTON T-SHIRTS LIVE</span>
                  <span>• SHIP DIRECT FROM CHITTAGONG SEA PORT</span>
                  <span>• CERTIFICATES SGS VERIFIED EXCLUDING FACTORY REJECT</span>
                </div>
              ))}
            </div>
          </div>

          {/* Active Inventory Listing Section with dynamic search and counters */}
          <section id="products" className="max-w-7xl mx-auto px-3 sm:px-4 py-6 sm:py-12 space-y-4 flex-1">
            <div className="bg-white border border-slate-200 rounded-xl p-3 sm:p-5 space-y-4">
              <div className="flex flex-col gap-3">
                <div>
                  <h3 className="font-display font-black text-base sm:text-lg text-primary uppercase">
                    Available Stock Lots
                  </h3>
                  <p className="text-[11px] text-slate-500">{filteredProducts.length} products</p>
                </div>
                <div className="flex flex-col xs:flex-row gap-2 w-full">
                  <button
                    type="button"
                    onClick={() => navigateTo("/products")}
                    className="bg-[#0b1329] hover:bg-slate-900 text-white font-bold text-[10px] uppercase tracking-wider px-3 py-2 rounded-lg shrink-0 flex items-center justify-center gap-1.5"
                  >
                    <Package size={11} className="text-[#feae2c]" />
                    <span>All</span>
                  </button>
                  <div className="relative min-w-0">
                    <input
                      type="text"
                      placeholder="Search..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="w-full bg-[#f8fafc] border border-slate-300 rounded-lg py-2 pl-9 pr-10 text-xs outline-none focus:border-primary shadow-sm"
                    />
                    <div className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-sm">🔍</div>
                    {searchQuery && (
                      <button
                        onClick={() => setSearchQuery("")}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                      >
                        <X size={14} />
                      </button>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Categories Filter */}
            {renderCategoryFilterHeader()}

            {/* Render loading or loaded dynamic grid */}
            {loading ? (
              <div className="p-20 text-center space-y-3">
                <div className="w-8 h-8 border-4 border-t-transparent border-primary rounded-full animate-spin mx-auto"></div>
                <p className="text-xs font-mono text-slate-500">Retrieving cargo catalogs...</p>
              </div>
            ) : (
              renderProductGrid(filteredProducts)
            )}

            {/* Divider line */}
            <div className="border-t border-slate-200"></div>

            {/* Recommended Products Section */}
            {recommendedProducts.length > 3 && (
              <div className="pt-6">
                <div className="flex items-center gap-2 mb-4">
                  <TrendingUp size={16} className="text-[#feae2c]" />
                  <h3 className="font-display font-black text-base uppercase text-[#0b1329]">Recommended for You</h3>
                  <span className="bg-[#feae2c]/10 text-[#feae2c] text-[8px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider">Based on your interest</span>
                </div>
                <div className="flex gap-3 overflow-x-auto pb-3 snap-x snap-mandatory scrollbar-none -mx-3 px-3">
                  {recommendedProducts.map((p) => (
                    <div
                      key={p.id}
                      onClick={() => navigateTo(`/product/${p.id}`)}
                      className="snap-start shrink-0 w-[200px] xs:w-[220px] sm:w-[240px] group bg-white border border-slate-200 rounded-lg overflow-hidden shadow-sm hover:shadow-lg hover:border-primary/30 transition-all cursor-pointer"
                    >
                      <div className="relative bg-slate-100 h-36 xs:h-40 sm:h-44 overflow-hidden">
                        <img src={p.image} alt={p.title}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                          referrerPolicy="no-referrer" />
                        <span className="absolute top-1 left-1 bg-slate-900/90 text-white font-mono font-bold text-[6px] xs:text-[8px] tracking-wider uppercase px-1 py-0.5 rounded">
                          {p.category}
                        </span>
                        {p.featured && (
                          <span className="absolute top-1 right-1 bg-[#feae2c] text-indigo-950 font-black text-[5px] xs:text-[7px] uppercase px-1 py-0.5 rounded shadow">
                            Featured
                          </span>
                        )}
                        <div className="absolute bottom-1 left-1 bg-slate-950/80 text-white font-mono text-[6px] xs:text-[8px] px-1 rounded">
                          #{p.sku}
                        </div>
                      </div>
                      <div className="p-2.5 sm:p-3 space-y-1.5">
                        <h4 className="font-display font-bold text-[11px] sm:text-xs text-[#0b1329] group-hover:text-primary transition-colors line-clamp-2 leading-snug">
                          {p.title}
                        </h4>
                        <div className="flex items-center gap-1.5 text-[9px] sm:text-[10px]">
                          <span className="bg-[#0b1329]/10 text-[#0b1329] px-1.5 py-0.5 rounded font-semibold">{p.category}</span>
                          <span className="text-slate-400">#{p.sku}</span>
                        </div>
                        <div className="flex justify-between items-center pt-1.5 border-t border-slate-100">
                          <div>
                            <span className="text-[7px] text-slate-400 uppercase">Ready</span>
                            <p className="font-bold text-primary text-[11px] sm:text-xs">{p.qty.toLocaleString()} pcs</p>
                          </div>
                          <span className="text-[7px] sm:text-[9px] px-1.5 py-0.5 bg-emerald-50 text-emerald-700 rounded border border-emerald-200 font-semibold">{p.status}</span>
                        </div>
                        <button
                          onClick={(e) => { e.stopPropagation(); setSelectedInquiryProduct(p); setIsInquiryOpen(true); }}
                          className="w-full py-1.5 bg-[#feae2c] hover:bg-[#0b1329] hover:text-white text-[#0b1329] font-bold text-[9px] sm:text-[10px] uppercase tracking-wide rounded transition-all"
                        >
                          Inquire Now
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </section>

          {/* Trust Badges */}
          <section className="bg-[#0b1329] text-white py-8 px-4">
            <div className="max-w-7xl mx-auto">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="p-4 bg-white/5 border border-white/10 rounded-xl text-center">
                  <ShieldCheck size={20} className="mx-auto text-[#feae2c] mb-2" />
                  <span className="text-xs font-bold">AQL 1.5 Verified</span>
                </div>
                <div className="p-4 bg-white/5 border border-white/10 rounded-xl text-center">
                  <Truck size={20} className="mx-auto text-[#feae2c] mb-2" />
                  <span className="text-xs font-bold">Chittagong Port</span>
                </div>
                <div className="p-4 bg-white/5 border border-white/10 rounded-xl text-center">
                  <Award size={20} className="mx-auto text-[#feae2c] mb-2" />
                  <span className="text-xs font-bold">Factory Direct</span>
                </div>
                <div className="p-4 bg-white/5 border border-white/10 rounded-xl text-center">
                  <CheckCircle size={20} className="mx-auto text-emerald-400 mb-2" />
                  <span className="text-xs font-bold">Ready to Ship</span>
                </div>
              </div>
            </div>
          </section>

          {/* General Sourcing Import Desk Form */}
          <section id="inquiry" className="max-w-7xl mx-auto px-3 sm:px-4 py-10 sm:py-16">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-8 items-stretch bg-white border border-slate-200 rounded-xl overflow-hidden shadow-lg">
              
              <div className="lg:col-span-5 bg-[#0b1329] text-white p-5 sm:p-8 lg:p-12 space-y-6 flex flex-col justify-between">
                <div>
                  <span className="text-[#feae2c] font-mono text-[10px] font-bold tracking-widest uppercase block mb-1">
                    Dhaka Operations Office
                  </span>
                  <h3 className="font-display font-black text-xl xs:text-2xl uppercase text-white leading-tight">
                    Submit Custom Sourcing Specs
                  </h3>
                  <p className="text-xs text-slate-300 leading-relaxed mt-4">
                    Have precise surplus container targets? Specify your desired garment assortment category, sizing ranges, fiber composition parameters, or target wholesale prices, and our Uttara sourcing desk will find certified factory overruns to meet your specs.
                  </p>
                </div>

                <div className="space-y-4 pt-6 border-t border-white/10 text-xs text-slate-300">
                  <div className="bg-white/5 border border-white/10 px-3.5 py-3 rounded-lg space-y-1">
                    <span className="text-[9px] uppercase tracking-wider font-mono font-bold text-[#feae2c] block">Key Executive</span>
                    <p className="font-display font-black text-white text-sm">Humayun Kabir</p>
                    <p className="text-slate-400 text-[10px] uppercase tracking-wider font-mono">Managing Director</p>
                  </div>

                  <div className="flex items-start gap-3 pt-2">
                    <MapPin size={16} className="text-[#feae2c] mt-0.5 shrink-0" />
                    <span className="leading-relaxed">Flat-A2, 1st Floor, House No-14, Road No-18, Sector-10, Uttara, Dhaka-1230, Bangladesh</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <Mail size={16} className="text-[#feae2c] shrink-0" />
                    <a href="mailto:humayun@handnfashionbd.com" className="hover:text-[#feae2c] transition-colors">humayun@handnfashionbd.com</a>
                  </div>
                  <div className="flex items-center gap-3">
                    <PhoneCall size={16} className="text-[#feae2c] shrink-0" />
                    <a href="tel:+8801603521341" className="font-mono hover:text-[#feae2c] transition-colors">+880 1603 521341</a>
                  </div>
                  <div className="flex items-center gap-3">
                    <Compass size={16} className="text-[#feae2c] shrink-0" />
                    <a href="https://www.handnfashionbd.com" target="_blank" rel="noopener noreferrer" className="font-mono hover:text-[#feae2c] transition-colors">www.handnfashionbd.com</a>
                  </div>
                </div>
              </div>

              <div className="lg:col-span-7 p-5 sm:p-8 lg:p-12">
                <h4 className="font-display font-extrabold text-lg text-primary mb-6">
                  B2B IMPORT DISPATCH DESK
                </h4>

                <form onSubmit={handleGeneralSubmit} className="space-y-4 font-sans">
                  {generalSuccess ? (
                    <div className="p-4 bg-emerald-50 border border-emerald-500/20 text-emerald-800 rounded-lg text-xs font-semibold space-y-1">
                      <span className="font-bold uppercase block text-indigo-950">Sourcing Request Submitted Successfully!</span>
                      <p className="font-normal text-slate-600">Our logistics team has cataloged your requirements and is verifying compliant factory clearances in Dhaka. Our export executive will email you shortly.</p>
                    </div>
                  ) : (
                    <>
                      {generalError && (
                        <div className="p-3 bg-red-50 border border-red-200 text-red-600 rounded text-xs font-bold">
                          {generalError}
                        </div>
                      )}

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-[10px] font-mono font-bold uppercase text-slate-500 mb-1">
                            Contact Person Name *
                          </label>
                          <input
                            type="text"
                            value={generalName}
                            onChange={(e) => setGeneralName(e.target.value)}
                            placeholder="John Parker"
                            className="w-full border border-slate-300 rounded p-2.5 text-xs outline-none focus:border-indigo-950 focus:ring-1 focus:ring-indigo-950"
                            required
                          />
                        </div>
                        <div>
                          <label className="block text-[10px] font-mono font-bold uppercase text-slate-500 mb-1">
                            Business Email Address *
                          </label>
                          <input
                            type="email"
                            value={generalEmail}
                            onChange={(e) => setGeneralEmail(e.target.value)}
                            placeholder="john@americanretail.com"
                            className="w-full border border-slate-300 rounded p-2.5 text-xs outline-none focus:border-indigo-950 focus:ring-1 focus:ring-indigo-950"
                            required
                          />
                        </div>
                      </div>

                      <div>
                        <label className="block text-[10px] font-mono font-bold uppercase text-slate-500 mb-1">
                          Distributor / Retailer Brand Name *
                        </label>
                        <input
                          type="text"
                          value={generalCompany}
                          onChange={(e) => setGeneralCompany(e.target.value)}
                          placeholder="Apparel Co-op Global"
                          className="w-full border border-slate-300 rounded p-2.5 text-xs outline-none focus:border-indigo-950 focus:ring-1 focus:ring-indigo-950"
                          required
                        />
                      </div>

                      <div>
                        <label className="block text-[10px] font-mono font-bold uppercase text-slate-500 mb-1">
                          Sourcing Requirements details (Assortments, target volumes, destinations) *
                        </label>
                        <textarea
                          rows={4}
                          value={generalMessage}
                          onChange={(e) => setGeneralMessage(e.target.value)}
                          placeholder="Specify the garment cargo required (e.g. polo shirts, denim jeans), pieces quantity target, exit port details, and standard B2B transaction terms required."
                          className="w-full border border-slate-300 rounded p-2.5 text-xs outline-none focus:border-indigo-950 focus:ring-1 focus:ring-indigo-950"
                          required
                        />
                      </div>

                      <div>
                        <button
                          type="submit"
                          disabled={generalSubmitting}
                          className="w-full bg-slate-900 hover:bg-slate-950 text-[#feae2c] p-3 font-display font-black text-xs uppercase tracking-wider rounded-lg shadow transition-all cursor-pointer disabled:opacity-50"
                        >
                          {generalSubmitting ? "Dispatching to Dhaka desk..." : "Submit General Import Inquiry"}
                        </button>
                      </div>
                    </>
                  )}
                </form>
              </div>
            </div>
          </section>
        </>
      )}

      {/* ALL PRODUCTS CATALOG HUB PAGE */}
      {routeParams.route === "products" && (
        <div className="flex-1 max-w-7xl mx-auto px-2.5 xs:px-4 py-8 space-y-8 w-full animate-fadeIn">
          {/* Breadcrumbs */}
          <div className="flex items-center gap-2 text-xs font-mono text-slate-500">
            <span className="hover:text-primary cursor-pointer" onClick={() => navigateTo("/")}>Home</span>
            <span>/</span>
            <span className="font-bold text-slate-800">All Products Catalog</span>
          </div>

          {/* Catalog Hub Banner */}
          <div className="bg-slate-900 rounded-xl text-white p-4 sm:p-6 lg:p-8 relative overflow-hidden border-l-4 border-[#feae2c] shadow-sm">
            <div className="absolute inset-0 opacity-5 pointer-events-none" style={{ backgroundImage: "radial-gradient(#ffffff 0.5px, transparent 0.9px)", backgroundSize: "32px 32px" }}></div>
            <div className="relative z-10 flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6">
              <div className="space-y-2.5 max-w-xl text-left">
                <span className="px-2 py-0.5 bg-white/10 rounded font-mono text-[9px] font-bold text-[#feae2c] uppercase tracking-wider">
                  Verified B2B Dhaka Clearance Registry
                </span>
                <h2 className="font-display font-black text-lg xs:text-xl sm:text-2xl text-white uppercase tracking-tight">
                  Unified Export Garment Surplus Catalog
                </h2>
                <details className="text-[10px] sm:text-xs text-slate-400 cursor-pointer select-none group border-t border-white/10 pt-2 bg-transparent">
                  <summary className="hover:text-[#feae2c] transition-colors outline-none font-sans font-semibold flex items-center gap-1">
                    About this unified catalog & direct loading safety
                  </summary>
                  <p className="mt-2 text-[11px] text-slate-350 leading-relaxed bg-white/5 p-2.5 rounded border border-white/5">
                    View and clear high-volume factory surplus clothing overstock directly from physical ready stocklots. Select active lots across multiple apparel categories, review inspection specifications, download packing indexes, and tranship compliance sheets safely. Guaranteed Authentic • Direct Warehouse Loading • AQL 1.5 Quality Specifications.
                  </p>
                </details>
              </div>

              {/* Dynamic Counters Card */}
              <div className="bg-white/5 border border-white/10 p-3 sm:p-4 rounded-lg shrink-0 w-full lg:w-64 space-y-2">
                <span className="text-[9px] font-mono uppercase text-[#feae2c] block border-b border-white/5 pb-1">B2B Live Registry Data</span>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <span className="text-slate-400 font-mono text-[8.5px] block uppercase">Active Lots:</span>
                    <span className="text-sm xs:text-base font-bold font-display text-white">{products.length} Items</span>
                  </div>
                  <div>
                    <span className="text-slate-400 font-mono text-[8.5px] block uppercase">Total Volume:</span>
                    <span className="text-sm xs:text-base font-bold font-mono text-[#feae2c]">
                      {products.reduce((acc, p) => acc + p.qty, 0).toLocaleString()} <span className="text-[7.5px] text-white/55">PCS</span>
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Live Navigation Tabs & Search bar inside the catalog */}
          <div className="space-y-4 p-3 xs:p-4 sm:p-6 bg-white border border-slate-200 rounded-xl shadow-xs">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
              <div>
                <h3 className="font-display font-black text-base uppercase text-[#0b1329]">
                  Inventory Search Desk & Categories
                </h3>
                <p className="text-xs text-slate-500">Filter consolidated lots instantly by category selection or typing keywords.</p>
              </div>

              {/* Instant Search */}
              <div className="relative w-full md:w-72">
                <input
                  type="text"
                  placeholder="Search products..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full bg-[#f8fafc] border border-slate-300 rounded-lg p-2.5 pl-9 text-xs font-mono outline-none focus:border-primary focus:ring-1 focus:ring-primary shadow-sm transition-all"
                />
                <div className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-sm">🔍</div>
                {searchQuery && (
                  <button
                    onClick={() => setSearchQuery("")}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                  >
                    <X size={14} />
                  </button>
                )}
              </div>
            </div>

            <div className="pt-2">
              {renderCategoryFilterHeader()}
            </div>
          </div>

          {/* Unified Grid */}
          <div className="space-y-5">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-200 pb-3">
              <h3 className="font-display font-black text-sm xs:text-base sm:text-lg uppercase text-slate-800 flex flex-wrap items-center gap-1.5 sm:gap-2">
                📦 Consolidated Surplus Inventory Cargo Grid
                <span className="bg-[#0b1329] text-[#feae2c] text-[10px] sm:text-xs px-2.5 py-0.5 rounded-full font-bold font-mono">
                  {filteredProducts.length} Lots Found
                </span>
              </h3>

              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery("")}
                  className="text-xs text-slate-400 hover:text-slate-900 cursor-pointer font-semibold underline"
                >
                  Clear search query
                </button>
              )}
            </div>

            {loading ? (
              <div className="p-20 text-center space-y-3">
                <div className="w-8 h-8 border-4 border-t-transparent border-primary rounded-full animate-spin mx-auto"></div>
                <p className="text-xs font-mono text-slate-500">Scanning consolidated registries...</p>
              </div>
            ) : (
              renderProductGrid(filteredProducts)
            )}
          </div>

          {/* Consolidated B2B Custom Specs Desk */}
          <div className="bg-white border border-slate-200 rounded-xl p-4 sm:p-8 max-w-4xl mx-auto shadow-sm">
            <div className="text-center space-y-1 mb-8">
              <span className="text-[10px] font-mono text-[#feae2c] font-bold uppercase tracking-wider block">Custom Sourcing Hub</span>
              <h4 className="font-display font-black text-lg uppercase text-primary">Custom Sourcing Specifications Inquiry</h4>
              <p className="text-xs text-slate-500 max-w-xl mx-auto">
                Need customized bulk quantities or assortments not listed in our consolidated overstock cargo grid? Complete our sourcing mandate form below, and our team will quote inside 2 hours.
              </p>
            </div>

            <form onSubmit={handleGeneralSubmit} className="space-y-4 text-xs font-sans">
              {generalSuccess ? (
                <div className="p-6 bg-emerald-50 border border-emerald-250 text-emerald-800 rounded-lg font-semibold text-center space-y-1">
                  <span className="font-black uppercase text-indigo-950 block">Bulk Sourcing Request cataloged!</span>
                  <p className="font-normal text-slate-600">Our Uttara clearing desk has filed your dynamic document sheet specifications and will contact you shortly.</p>
                </div>
              ) : (
                <>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <div>
                      <label className="block text-[10px] font-mono font-bold text-slate-500 mb-1 uppercase">Full Sourcing Contact *</label>
                      <input
                        type="text"
                        value={generalName}
                        onChange={(e) => setGeneralName(e.target.value)}
                        placeholder="John Park"
                        required
                        className="w-full border border-slate-300 rounded p-2 text-xs focus:ring-1 focus:ring-slate-900 outline-none"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-mono font-bold text-slate-500 mb-1 uppercase">Business Email *</label>
                      <input
                        type="email"
                        value={generalEmail}
                        onChange={(e) => setGeneralEmail(e.target.value)}
                        placeholder="john@globalapparel.com"
                        required
                        className="w-full border border-slate-300 rounded p-2 text-xs focus:ring-1 focus:ring-slate-900 outline-none"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-mono font-bold text-slate-500 mb-1 uppercase">Company Distributor Brand *</label>
                      <input
                        type="text"
                        value={generalCompany}
                        onChange={(e) => setGeneralCompany(e.target.value)}
                        placeholder="Retail Operations USA"
                        required
                        className="w-full border border-slate-300 rounded p-2 text-xs focus:ring-1 focus:ring-slate-900 outline-none"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-[10px] font-mono font-bold text-slate-500 mb-1 uppercase">Sourcing Requirements Details (Assortment, quantity target, pricing levels) *</label>
                    <textarea
                      rows={4}
                      value={generalMessage}
                      onChange={(e) => setGeneralMessage(e.target.value)}
                      placeholder="Specify your desired garment composition ratio, MOQ, exit port terms, target pricing etc."
                      required
                      className="w-full border border-slate-300 rounded p-2.5 text-xs focus:ring-1 focus:ring-slate-900 outline-none"
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={generalSubmitting}
                    className="w-full bg-slate-900 hover:bg-slate-950 text-[#feae2c] p-3 font-display font-black text-xs uppercase tracking-wider rounded-lg shadow cursor-pointer disabled:opacity-50"
                  >
                    {generalSubmitting ? "Transmitting customized specs..." : "Request Bulk Consolidated Quotation"}
                  </button>
                </>
              )}
            </form>
          </div>
        </div>
      )}

      {/* DYNAMIC INDIVIDUAL CATEGORIES PAGES */}
      {routeParams.route === "category" && (
        <div className="flex-1 max-w-7xl mx-auto px-2.5 xs:px-4 py-8 space-y-8 w-full">
          {/* Breadcrumb Navigation */}
          <div className="flex items-center gap-2 text-xs font-mono text-slate-500">
            <span className="hover:text-primary cursor-pointer" onClick={() => navigateTo("/")}>Home</span>
            <span>/</span>
            <span className="hover:text-primary cursor-pointer" onClick={() => navigateTo("/")}>Category Sourcing</span>
            <span>/</span>
            <span className="font-bold text-slate-800">{routeParams.slug}</span>
          </div>

          {/* Category Banner with structured SEO details cleanly tucked away */}
          {(() => {
            const seo = getCategorySEO(routeParams.slug || "Surplus");
            return (
              <div className="bg-slate-900 rounded-xl text-white p-4 sm:p-6 lg:p-8 relative overflow-hidden border-l-4 border-[#feae2c] shadow-sm">
                <div className="absolute inset-0 opacity-5 pointer-events-none" style={{ backgroundImage: "radial-gradient(#ffffff 0.5px, transparent 0.9px)", backgroundSize: "32px 32px" }}></div>
                <div className="relative z-10 max-w-4xl space-y-3 text-left">
                  <span className="px-2 py-0.5 bg-white/10 rounded font-mono text-[9px] font-bold text-[#feae2c] uppercase tracking-wider">
                    COMPLIANT DIRECT CLEARANCE
                  </span>
                  <h2 className="font-display font-black text-lg xs:text-xl sm:text-2xl text-white uppercase tracking-tight">
                    {seo.heading}
                  </h2>
                  <details className="text-[10px] sm:text-xs text-slate-400 cursor-pointer select-none group border-t border-white/10 pt-2 bg-transparent">
                    <summary className="hover:text-[#feae2c] transition-colors outline-none font-sans font-semibold flex items-center gap-1">
                      Sourcing compliance details & SEO indexing metadata
                    </summary>
                    <div className="mt-2 text-[11px] font-sans text-slate-300 leading-relaxed space-y-2 p-2.5 bg-white/5 rounded border border-white/5 max-w-3xl">
                      <p>{seo.description}</p>
                      <p className="text-[9px] font-mono text-slate-400 border-t border-white/5 pt-1.5 italic">
                        Target search tags: {seo.keywords}
                      </p>
                    </div>
                  </details>
                </div>
              </div>
            );
          })()}

          {/* Live Navigation Tabs matching the dynamic category context */}
          {renderCategoryFilterHeader()}

          {/* Matching product list cargo */}
          <div className="space-y-4">
            <h3 className="font-display font-black text-sm xs:text-base sm:text-lg uppercase text-slate-800 flex flex-wrap items-center gap-1.5 sm:gap-2">
              📂 ACTIVE {routeParams.slug?.toUpperCase()} STOCK LOTS
              <span className="bg-[#0b1329] text-[#feae2c] font-mono text-[9px] sm:text-[10px] px-2 py-0.5 rounded font-bold">
                {products.filter(p => p.category.toLowerCase() === routeParams.slug?.toLowerCase()).length} cargo batches
              </span>
            </h3>
            
            {loading ? (
              <div className="p-20 text-center space-y-3">
                <div className="w-8 h-8 border-4 border-t-transparent border-primary rounded-full animate-spin mx-auto"></div>
                <p className="text-xs font-mono text-slate-500">Scanning matching lot indices...</p>
              </div>
            ) : (
              renderProductGrid(
                products.filter(p => p.category.toLowerCase() === routeParams.slug?.toLowerCase())
              )
            )}
          </div>

          {/* Embedded category inquiry form block */}
          <div className="bg-white border border-slate-200 rounded-xl p-4 sm:p-8 max-w-3xl mx-auto shadow-sm">
            <div className="text-center space-y-1 mb-6">
              <span className="text-[10px] font-mono text-[#feae2c] font-bold uppercase tracking-wider block">Dhaka B2B Desk</span>
              <h4 className="font-display font-black text-base uppercase text-primary">Bulk Category Sourcing Mandate</h4>
              <p className="text-xs text-slate-500">Need specific customized configurations for entire category {routeParams.slug}? Transmit specifications directly.</p>
            </div>

            <form onSubmit={(e) => handleCategoryPageInquirySubmit(e, routeParams.slug || "Category")} className="space-y-4 text-xs font-sans">
              {catFormSuccess ? (
                <div className="p-4 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-lg font-semibold space-y-1 text-center">
                  <span className="font-black uppercase text-[#feae2c] block">Category Sourcing Specs Dispatched!</span>
                  <p className="font-normal text-slate-600">Our Uttara clearing desk has filed your document sheet parameters and will return quotations inside 2 hours.</p>
                </div>
              ) : (
                <>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-[10px] font-mono font-bold text-slate-500 mb-1 uppercase">Full Sourcing Contact *</label>
                      <input
                        type="text"
                        value={catFormName}
                        onChange={(e) => setCatFormName(e.target.value)}
                        placeholder="John Park"
                        required
                        className="w-full border border-slate-300 rounded p-2 text-xs focus:ring-1 focus:ring-slate-900 outline-none"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-mono font-bold text-slate-500 mb-1 uppercase">Business Email *</label>
                      <input
                        type="email"
                        value={catFormEmail}
                        onChange={(e) => setCatFormEmail(e.target.value)}
                        placeholder="john@globalapparel.com"
                        required
                        className="w-full border border-slate-300 rounded p-2 text-xs focus:ring-1 focus:ring-slate-900 outline-none"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-[10px] font-mono font-bold text-slate-500 mb-1 uppercase">Company Distributor Brand *</label>
                    <input
                      type="text"
                      value={catFormCompany}
                      onChange={(e) => setCatFormCompany(e.target.value)}
                      placeholder="Retail Operations USA"
                      required
                      className="w-full border border-slate-300 rounded p-2 text-xs focus:ring-1 focus:ring-slate-900 outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] font-mono font-bold text-slate-500 mb-1 uppercase">Requirements Specs (MOQ targets, custom composition, target pricing) *</label>
                    <textarea
                      rows={3}
                      value={catFormSpecs}
                      onChange={(e) => setCatFormSpecs(e.target.value)}
                      placeholder={`Enter bulk targets for category: ${routeParams.slug}...`}
                      required
                      className="w-full border border-slate-300 rounded p-2 text-xs focus:ring-1 focus:ring-slate-900 outline-none"
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={catFormSubmitting}
                    className="w-full bg-slate-900 hover:bg-slate-950 text-[#feae2c] p-2.5 font-display font-black text-xs uppercase tracking-wider rounded shadow cursor-pointer disabled:opacity-50"
                  >
                    {catFormSubmitting ? "Transmitting Requirements..." : `Request Bulk Sourcing Quotation for ${routeParams.slug}`}
                  </button>
                </>
              )}
            </form>
          </div>
        </div>
      )}

      {/* DYNAMIC INDIVIDUAL PRODUCT PAGES */}
      {routeParams.route === "product" && (
        <div className="flex-1 max-w-7xl mx-auto px-4 py-8 space-y-6 w-full">
          
          {(() => {
            const prod = products.find(p => p.id === routeParams.id || p.sku === routeParams.id);
            if (!prod) {
              return (
                <div className="p-16 border rounded bg-white text-center text-slate-500 italic max-w-md mx-auto space-y-4">
                  <p>Product Sourcing Index not found or currently updating.</p>
                  <button onClick={() => navigateTo("/")} className="px-4 py-2 bg-slate-900 text-[#feae2c] font-bold text-xs uppercase rounded cursor-pointer">
                    Return to Dhaka Hub Catalog
                  </button>
                </div>
              );
            }

            return (
              <>
                {/* Breadcrumbs */}
                <div className="flex items-center gap-2 text-xs font-mono text-slate-500">
                  <span className="hover:text-primary cursor-pointer" onClick={() => navigateTo("/")}>Home</span>
                  <span>/</span>
                  <span className="hover:text-primary cursor-pointer" onClick={() => navigateTo(`/category/${encodeURIComponent(prod.category)}`)}>{prod.category}</span>
                  <span>/</span>
                  <span className="font-bold text-slate-800">SKU #{prod.sku}</span>
                </div>

                {/* Return anchor */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pt-2 border-b border-slate-100 pb-5">
                  <button
                    onClick={() => navigateTo("/")}
                    className="inline-flex items-center gap-1.5 text-xs font-bold uppercase text-slate-700 hover:text-indigo-950 cursor-pointer"
                  >
                    <ArrowLeft size={14} /> Back to Sourcing clearing home page
                  </button>

                  <div className="font-mono text-[9px] uppercase tracking-wider text-slate-400 bg-slate-50 px-2.5 py-1 rounded border border-slate-200/60 max-w-max">
                    Secure RMG Portal • Verifiably Online
                  </div>
                </div>

                {/* Aesthetic Prime Product Page Header (For all views!) */}
                <div className="space-y-2 pt-2">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="px-2.5 py-0.5 bg-[#0b1329] text-[#feae2c] border border-white/5 rounded font-mono text-[9px] font-bold uppercase tracking-wider">
                      {prod.category} Allocation Batch
                    </span>
                    <span className="px-2.5 py-0.5 bg-emerald-50 text-emerald-700 border border-emerald-200 rounded font-mono text-[9px] font-bold uppercase tracking-wider flex items-center gap-1">
                      <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse"></span> Dhaka Verified Batch
                    </span>
                  </div>
                  <h2 className="font-display font-black text-2xl sm:text-3xl lg:text-4xl text-[#0b1329] leading-tight uppercase">
                    {prod.title}
                  </h2>
                  <p className="text-xs text-slate-400 font-mono">
                    Export Lot Entry Ref: <span className="text-indigo-950 font-bold select-all font-mono">SKU #{prod.sku}</span> | Chittagong Customs Seal Eligible
                  </p>
                </div>

                {/* Dynamic Product Detail Double Column Block */}
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
                  
                  {/* Left Column - Compact Cargo Image Slider with Lightbox Trigger & Manifest Downloader */}
                  <div className="lg:col-span-5 space-y-5">
                    <div className="bg-white border border-slate-200 p-3 rounded-2xl shadow-sm flex flex-col items-center">
                      
                      {/* Active Main Product Photo Grid Container - Elegant Frame & Auto-Scaling */}
                      <div className="relative w-full h-[210px] xs:h-[250px] sm:h-[340px] md:h-[380px] lg:h-[410px] overflow-hidden rounded-xl bg-slate-50 border-2 border-slate-200 shadow-inner cursor-zoom-in group select-none flex items-center justify-center p-2.5">
                        
                        {/* Decorative Premium Frame Corner Crosshairs */}
                        <div className="absolute top-2.5 left-2.5 w-2.5 h-2.5 border-t border-l border-slate-350 pointer-events-none opacity-60"></div>
                        <div className="absolute top-2.5 right-2.5 w-2.5 h-2.5 border-t border-r border-slate-350 pointer-events-none opacity-60"></div>
                        <div className="absolute bottom-2.5 left-2.5 w-2.5 h-2.5 border-b border-l border-slate-350 pointer-events-none opacity-60"></div>
                        <div className="absolute bottom-2.5 right-2.5 w-2.5 h-2.5 border-b border-r border-slate-350 pointer-events-none opacity-60"></div>

                        {/* Top-Right Premium Frame Meta Indicator Badge & View All Button */}
                        <div className="absolute top-2.5 right-3 z-20 flex items-center gap-1.5 origin-top-right scale-90 sm:scale-100">
                          <span className="hidden xs:inline-block font-mono text-[7px] text-slate-400 uppercase tracking-widest bg-white/80 backdrop-blur-xs px-1.5 py-1 rounded border border-slate-150">
                            H&N DATA
                          </span>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              navigateTo("/products");
                            }}
                            className="bg-[#feae2c] hover:bg-[#0b1329] hover:text-[#feae2c] text-indigo-950 font-display font-black text-[9px] uppercase tracking-wider px-2 py-1 rounded shadow border border-[#feae2c]/20 flex items-center gap-1 cursor-pointer transition-all active:scale-95 duration-150 animate-fadeIn"
                            title="View all factory products together"
                          >
                            <Package size={9} />
                            View All
                          </button>
                        </div>

                        {(() => {
                          const imgList = getProductImages(prod);
                          const currentImageUrl = imgList[activeImageIndex] || prod.image;
                          
                          const handlePrev = (e: React.MouseEvent) => {
                            e.stopPropagation();
                            setActiveImageIndex((prev) => (prev === 0 ? imgList.length - 1 : prev - 1));
                          };
                          
                          const handleNext = (e: React.MouseEvent) => {
                            e.stopPropagation();
                            setActiveImageIndex((prev) => (prev === imgList.length - 1 ? 0 : prev + 1));
                          };

                          return (
                            <>
                              <img
                                src={currentImageUrl}
                                alt={prod.title}
                                onClick={() => setIsLightboxOpen(true)}
                                className="max-w-full max-h-full object-contain transition-transform duration-350 hover:scale-[1.02]"
                                referrerPolicy="no-referrer"
                              />

                              {/* Hover previous/next controllers */}
                              <button
                                onClick={handlePrev}
                                className="absolute top-1/2 -translate-y-1/2 left-3 bg-white/95 text-slate-900 p-2.5 rounded-full border border-slate-200 shadow-md hover:bg-white hover:text-primary transition-all duration-200 scale-100 lg:scale-90 opacity-100 lg:opacity-0 lg:group-hover:opacity-100 lg:group-hover:scale-100 cursor-pointer flex items-center justify-center animate-fadeIn z-10"
                                title="Previous Image"
                              >
                                <ChevronLeft size={16} className="stroke-[2.5]" />
                              </button>

                              <button
                                onClick={handleNext}
                                className="absolute top-1/2 -translate-y-1/2 right-3 bg-white/95 text-slate-900 p-2.5 rounded-full border border-slate-200 shadow-md hover:bg-white hover:text-primary transition-all duration-200 scale-100 lg:scale-90 opacity-100 lg:opacity-0 lg:group-hover:opacity-100 lg:group-hover:scale-100 cursor-pointer flex items-center justify-center animate-fadeIn z-10"
                                title="Next Image"
                              >
                                <ChevronRight size={16} className="stroke-[2.5]" />
                              </button>

                              {/* Lightbox Trigger Badge overlay */}
                              <div 
                                onClick={() => setIsLightboxOpen(true)}
                                className="absolute bottom-3 right-3 bg-slate-950/80 backdrop-blur-md text-white p-2 rounded-lg opacity-100 lg:opacity-0 lg:group-hover:opacity-100 transition-opacity duration-200 flex items-center gap-1.5 text-[9px] uppercase font-mono tracking-wider font-bold shadow border border-white/5 active:scale-95 cursor-pointer animate-fadeIn z-10"
                              >
                                <ZoomIn size={12} className="text-[#feae2c]" /> Fullscreen Slider
                              </div>

                              {/* Thumbnail indicator dots overlay */}
                              <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex gap-1.5 bg-slate-950/40 backdrop-blur-xs px-2.5 py-1 rounded-full border border-white/5 pointer-events-none md:opacity-0 md:group-hover:opacity-100 transition-opacity">
                                {imgList.map((_, idx) => (
                                  <span 
                                    key={idx}
                                    className={`w-1.5 h-1.5 rounded-full transition-all duration-300 ${
                                      activeImageIndex === idx ? "bg-[#feae2c] w-3" : "bg-white/60"
                                    }`}
                                  />
                                ))}
                              </div>
                            </>
                          );
                        })()}
                      </div>

                      {/* Small Bottom Horizontal Gallery Thumbnail strip */}
                      <div className="grid grid-cols-4 gap-2 w-full mt-3">
                        {(() => {
                          const imgList = getProductImages(prod);
                          return imgList.map((imgUrl, idx) => {
                            const isSelected = activeImageIndex === idx;
                            return (
                              <button
                                key={idx}
                                onClick={() => setActiveImageIndex(idx)}
                                className={`relative aspect-square rounded-lg border-2 overflow-hidden transition-all duration-150 bg-slate-50 cursor-pointer hover:opacity-100 ${
                                  isSelected 
                                    ? "border-[#feae2c] shadow-sm ring-1 ring-[#feae2c]/30 scale-102" 
                                    : "border-slate-200 opacity-70 hover:border-slate-300"
                                }`}
                              >
                                <img
                                  src={imgUrl}
                                  alt={`Product Thumbnail ${idx + 1}`}
                                  className="w-full h-full object-cover"
                                  referrerPolicy="no-referrer"
                                />
                              </button>
                            );
                          });
                        })()}
                      </div>

                    </div>

                    {/* Desktop Only Compliance Audit & Certified Specs Button */}
                    <div className="hidden lg:block space-y-5">
                      {/* Inspection Certificate Info Graphic */}
                      <div className="bg-slate-950 text-white p-5 rounded-xl border border-white/5 space-y-4">
                        <div className="flex items-center justify-between border-b border-white/5 pb-2">
                          <span className="text-[10px] font-mono text-[#feae2c] font-bold uppercase">Compliance Audit Stamp</span>
                          <span className="text-[9px] bg-emerald-500/20 text-emerald-400 border border-emerald-500/20 px-1.5 py-0.2 rounded font-mono uppercase">Passed</span>
                        </div>
                        
                        <div className="space-y-2.5 text-xs font-mono text-slate-300">
                          <div className="flex justify-between">
                            <span className="text-slate-500">Standard Class:</span>
                            <span className="font-bold">AQL 1.5 Quality Inspected</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-slate-500">Origin Quality:</span>
                            <span className="font-bold text-[#feae2c]">pure export surplus lot</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-slate-500">Ocean Logistics:</span>
                            <span className="font-bold">Seal Moisture-Controlled Container</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-slate-500">Exit Anchorage:</span>
                            <span className="font-bold text-slate-400">Direct Dhaka clearing Depot</span>
                          </div>
                        </div>
                      </div>

                      {/* Certified specifications button - downloads TXT specs file directly onto client page! */}
                      <button
                        onClick={() => downloadCertifiedSpecs(prod)}
                        className="w-full py-2.5 border border-[#feae2c]/30 hover:border-[#feae2c]/65 text-[#feae2c] font-display font-black text-[10px] uppercase tracking-wider rounded-lg flex items-center justify-center gap-2 cursor-pointer transition-all hover:bg-white/5"
                      >
                        <Download size={13} />
                        Download Certified Specs Manifest
                      </button>
                    </div>

                  </div>

                  {/* Right Column - Spec specifications & embedded dynamic inquiry form */}
                  <div className="lg:col-span-7 space-y-6">

                    {/* Sourcing Parameters Table */}
                    <div className="bg-white border border-slate-200 rounded-xl overflow-hidden overflow-x-auto max-w-full w-full shadow-sm">
                      <table className="w-full text-left font-mono text-[10px] sm:text-xs">
                        <thead>
                          <tr className="bg-[#f1f5f9] text-[#0b1329] font-display font-bold uppercase tracking-wide text-[9px] sm:text-[10px] border-b border-slate-200">
                            <th className="p-2 sm:p-3">Specification Name</th>
                            <th className="p-2 sm:p-3 text-right">Verified Logistics parameters</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 font-sans">
                          <tr className="hover:bg-slate-50">
                            <td className="p-2 sm:p-3 text-slate-500 font-semibold">Total batch ready-to-ship volume</td>
                            <td className="p-2 sm:p-3 text-right font-mono font-bold text-primary text-xs sm:text-sm">{prod.qty.toLocaleString()} Pcs</td>
                          </tr>
                          <tr className="hover:bg-slate-50">
                            <td className="p-2 sm:p-3 text-slate-500 font-semibold">Minimum sourcing allocation (MOQ)</td>
                            <td className="p-2 sm:p-3 text-right font-mono font-bold text-slate-800 bg-slate-50/50">{prod.moq.toLocaleString()} Pcs</td>
                          </tr>
                          <tr className="hover:bg-slate-50">
                            <td className="p-2 sm:p-3 text-slate-500 font-semibold">Fabric properties & composition</td>
                            <td className="p-2 sm:p-3 text-right text-indigo-950 font-bold">{prod.material}</td>
                          </tr>
                          <tr className="hover:bg-slate-50">
                            <td className="p-2 sm:p-3 text-slate-500 font-semibold">Quality Inspection Certificate Class</td>
                            <td className="p-2 sm:p-3 text-right text-emerald-700 font-bold">{prod.status}</td>
                          </tr>
                          <tr className="hover:bg-slate-50">
                            <td className="p-2 sm:p-3 text-slate-500 font-semibold">Sizing scale ratio matrix</td>
                            <td className="p-2 sm:p-3 text-right font-mono font-bold text-slate-800">S - XL (Standard ratio 1:2:2:1)</td>
                          </tr>
                          <tr className="hover:bg-slate-50">
                            <td className="p-2 sm:p-3 text-slate-500 font-semibold">Moisture clearance control treatment</td>
                            <td className="p-2 sm:p-3 text-right text-emerald-700 font-semibold">Applied (Moisture indicators verified)</td>
                          </tr>
                          <tr className="hover:bg-slate-50">
                            <td className="p-2 sm:p-3 text-slate-500 font-semibold">Standard carton bulk packing</td>
                            <td className="p-2 sm:p-3 text-right text-slate-800">Moisture sealed single polybag, 24 Pcs per 5-ply cardboard Master carton</td>
                          </tr>
                        </tbody>
                      </table>
                    </div>

                    {/* Integrated product detailed inquiry card block */}
                    <div className="bg-[#0b1329] text-white rounded-xl p-6 lg:p-8 space-y-5 shadow-lg border border-white/5">
                      <div className="border-b border-white/5 pb-3">
                        <span className="text-[10px] font-mono text-[#feae2c] font-bold uppercase tracking-widest block">Direct Dispatch Desk</span>
                        <h4 className="font-display font-black text-sm uppercase text-white">Book Stock Overstock Allocation</h4>
                        <p className="text-xs text-slate-400 mt-1">Specify your desired container quantities, departure target port, and transaction credentials to initiate live container reservation.</p>
                      </div>

                      <form onSubmit={(e) => handleProductPageInquirySubmit(e, prod)} className="space-y-4 text-xs font-sans">
                        {pFormSuccess ? (
                          <div className="p-4 bg-emerald-500/10 border border-emerald-500/20 text-emerald-300 rounded-lg font-semibold text-center space-y-1">
                            <span className="text-[#feae2c] font-black uppercase block">B2B ALLOCATION CLAIM INITIATED</span>
                            <p className="font-normal text-slate-350">Your sourcing manifest has been routed to our Dhaka headquarters office. Our representative will contact you with booking contracts shortly.</p>
                          </div>
                        ) : (
                          <>
                            {pFormError && (
                              <div className="p-3 bg-red-500/15 border border-red-500/30 text-red-300 rounded font-bold">
                                {pFormError}
                              </div>
                            )}

                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                              <div>
                                <label className="block text-[9px] font-mono font-bold uppercase text-slate-400 mb-1">Contact Full Name *</label>
                                <input
                                  type="text"
                                  value={pFormName}
                                  onChange={(e) => setPFormName(e.target.value)}
                                  placeholder="John Park"
                                  className="w-full bg-slate-900 border border-white/10 rounded p-2 text-xs text-white outline-none focus:border-[#feae2c]"
                                  required
                                />
                              </div>
                              <div>
                                <label className="block text-[9px] font-mono font-bold uppercase text-slate-400 mb-1">Business Email Address *</label>
                                <input
                                  type="email"
                                  value={pFormEmail}
                                  onChange={(e) => setPFormEmail(e.target.value)}
                                  placeholder="john@globalapparel.com"
                                  className="w-full bg-slate-900 border border-white/10 rounded p-2 text-xs text-white outline-none focus:border-[#feae2c]"
                                  required
                                />
                              </div>
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                              <div>
                                <label className="block text-[9px] font-mono font-bold uppercase text-slate-400 mb-1">Distributor / Retailer Brand Name *</label>
                                <input
                                  type="text"
                                  value={pFormCompany}
                                  onChange={(e) => setPFormCompany(e.target.value)}
                                  placeholder="UK Retail Imports"
                                  className="w-full bg-slate-900 border border-white/10 rounded p-2 text-xs text-white outline-none focus:border-[#feae2c]"
                                  required
                                />
                              </div>
                              <div>
                                <label className="block text-[9px] font-mono font-bold uppercase text-slate-400 mb-1">Sourcing target volume</label>
                                <select 
                                  value={pFormVolume}
                                  onChange={(e) => setPFormVolume(e.target.value)}
                                  className="w-full bg-slate-900 border border-white/10 text-white rounded p-2 text-xs outline-none focus:border-[#feae2c]"
                                >
                                  <option>LCL (Less than Container Load)</option>
                                  <option>FCL (Full Container Load - 20ft)</option>
                                  <option>Multi-FCL (40ft High-Cube Cargoes)</option>
                                </select>
                              </div>
                            </div>

                            <div>
                              <label className="block text-[9px] font-mono font-bold uppercase text-slate-400 mb-1">Inquiry Specs / comments</label>
                              <textarea
                                rows={3}
                                value={pFormMessage}
                                onChange={(e) => setPFormMessage(e.target.value)}
                                placeholder={`Interested in booking allocation for target overstock: "${prod.title}" (SKU: #${prod.sku}). Port exit: Chittagong.`}
                                className="w-full bg-slate-900 border border-white/10 rounded p-2 text-xs text-white outline-none focus:border-[#feae2c]"
                              />
                            </div>

                             <button
                               type="submit"
                               disabled={pFormSubmitting}
                               className="w-full py-2.5 bg-[#feae2c] hover:bg-white text-[#0b1329] font-display font-black text-xs uppercase tracking-wider rounded-lg shadow cursor-pointer disabled:opacity-50 transition-colors"
                             >
                               {pFormSubmitting ? "Transmitting Requirements..." : "Transmit B2B Sourcing Specs"}
                             </button>
                           </>
                         )}
                       </form>
                     </div>

                     {/* Direct Contact Buttons */}
                     <div className="space-y-4">
                       <div className="flex justify-center space-x-3">
                          {/* WhatsApp Button */}
                          <a
                            href={`https://wa.me/8801603521341?text=Hello,%20I%20am%20interested%20in%20purchasing%20${encodeURIComponent(prod.title)}%20(SKU:%20${prod.sku}).%20Please%20provide%20more%20details%20and%20pricing.%20Thank%20you!`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex-1 flex items-center justify-center gap-1.5 px-4 py-2 bg-[#25D366] text-white font-bold text-xs uppercase rounded-lg hover:bg-[#128C7E] hover:shadow-lg hover:scale-[1.02] transition-all"
                          >
                            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                              <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" fill="#ffffff"/>
                            </svg>
                            WhatsApp
                          </a>
                          
                          {/* WeChat Button */}
                          <a
                            href={`https://weixin.qq.com/cgi-bin/readtemplate?t=find_external_link&lang=en_US&wechat_real_url=https%3A%2F%2Fweixin.qq.com%2Fcgi-bin%2Fmmwebwx-bin%2Fwebwxgetcontact`}
                            target="_blank"
                            rel="noopener noreferrer"
                            onClick={(e) => { try { window.open('weixin://', '_blank'); } catch(_) { window.open('https://weixin.qq.com'); } }}
                            className="flex-1 flex items-center justify-center gap-1.5 px-4 py-2 bg-[#07C160] text-white font-bold text-xs uppercase rounded-lg hover:bg-[#06AD54] hover:shadow-lg hover:scale-[1.02] transition-all"
                          >
                            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                              <path d="M8.5 2C4.364 2 1 4.695 1 8.5c0 1.897.944 3.596 2.434 4.728l-.525 1.886 2.167-1.083a6.92 6.92 0 001.424.256c.112.008.225.013.339.013.469 0 .925-.048 1.363-.136C9.066 15.092 11.135 16.5 13.639 16.5c.413 0 .816-.032 1.208-.093l2.625 1.313-.531-1.906C17.942 14.846 18.5 13.554 18.5 12c0-.163-.008-.324-.023-.483.791-.408 1.486-.945 2.057-1.59C21.5 8.852 22 7.718 22 6.5 22 4.015 19.537 2 16.5 2c-1.647 0-3.147.527-4.278 1.398C11.29 3.14 10.15 3 8.968 3c-.239 0-.473.009-.706.026C7.912 2.375 7.222 2 8.5 2zm-4 3.5a1 1 0 110 2 1 1 0 010-2zm5 0a1 1 0 110 2 1 1 0 010-2zm-5 4a1 1 0 110 2 1 1 0 010-2zm5 0a1 1 0 110 2 1 1 0 010-2zm10-2a1 1 0 110 2 1 1 0 010-2zm-4 0a1 1 0 110 2 1 1 0 010-2zm-4 6c-.55 0-1-.45-1-1s.45-1 1-1 1 .45 1 1-.45 1-1 1zm6 0c-.55 0-1-.45-1-1s.45-1 1-1 1 .45 1 1-.45 1-1 1z" fill="#ffffff"/>
                            </svg>
                            WeChat
                          </a>
                       </div>
                     </div>
                     {/* Mobile Only Compliance Audit & Certified Specs Button */}
                    <div className="block lg:hidden space-y-5 mt-6">
                      {/* Inspection Certificate Info Graphic */}
                      <div className="bg-[#0b1329] text-white p-5 rounded-xl border border-white/5 space-y-4">
                        <div className="flex items-center justify-between border-b border-white/5 pb-2">
                          <span className="text-[10px] font-mono text-[#feae2c] font-bold uppercase">Compliance Audit Stamp</span>
                          <span className="text-[9px] bg-emerald-500/20 text-emerald-400 border border-emerald-500/20 px-1.5 py-0.2 rounded font-mono uppercase">Passed</span>
                        </div>
                        
                        <div className="space-y-2.5 text-xs font-mono text-slate-300">
                          <div className="flex justify-between">
                            <span className="text-slate-500">Standard Class:</span>
                            <span className="font-bold">AQL 1.5 Quality Inspected</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-slate-500">Origin Quality:</span>
                            <span className="font-bold text-[#feae2c]">pure export surplus lot</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-slate-500">Ocean Logistics:</span>
                            <span className="font-bold">Seal Moisture-Controlled Container</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-slate-500">Exit Anchorage:</span>
                            <span className="font-bold text-slate-400">Direct Dhaka clearing Depot</span>
                          </div>
                        </div>
                      </div>

                      {/* Certified specifications button - downloads TXT specs file directly onto client page! */}
                      <button
                        onClick={() => downloadCertifiedSpecs(prod)}
                        className="w-full py-2.5 border border-[#feae2c]/30 hover:border-[#feae2c]/65 text-[#feae2c] font-display font-black text-[10px] uppercase tracking-wider rounded-lg flex items-center justify-center gap-2 cursor-pointer transition-all hover:bg-white/5"
                      >
                        <Download size={13} />
                        Download Certified Specs Manifest
                      </button>
                    </div>

                  </div>

                </div>
              </>
            );
          })()}

        </div>
      )}

      <footer className="bg-[#0b1329] text-slate-300 py-8 px-4 border-t border-white/5 font-mono text-xs mt-auto">
        <div className="max-w-7xl mx-auto grid grid-cols-1 sm:grid-cols-3 gap-6 sm:gap-8">
          <div className="space-y-3">
            <h5 className="font-display font-black text-sm uppercase text-white">H and N Fashion BD</h5>
            <p className="text-[11px] text-slate-400">Bangladesh's premier B2B garment wholesale. Export quality surplus at wholesale prices.</p>
          </div>
          <div>
            <h6 className="font-display font-bold uppercase text-[10px] tracking-wider text-slate-400 mb-3">Categories</h6>
            <ul className="space-y-1.5 text-[11px] font-sans">
              <li><span className="hover:text-[#feae2c] cursor-pointer" onClick={() => navigateTo("/category/T-Shirts")}>T-Shirts & Polos</span></li>
              <li><span className="hover:text-[#feae2c] cursor-pointer" onClick={() => navigateTo("/category/Denim")}>Denim Jeans</span></li>
              <li><span className="hover:text-[#feae2c] cursor-pointer" onClick={() => navigateTo("/category/Intimates")}>Intimates</span></li>
              <li><span className="hover:text-[#feae2c] cursor-pointer" onClick={() => navigateTo("/category/Kids Wear")}>Kids Wear</span></li>
            </ul>
          </div>
          <div>
            <h6 className="font-display font-bold uppercase text-[10px] tracking-wider text-slate-400 mb-3">Contact</h6>
            <ul className="space-y-1 text-[11px]">
              <li>+880 1603 521341</li>
              <li>humayun@handnfashionbd.com</li>
              <li>Uttara, Dhaka, Bangladesh</li>
            </ul>
          </div>
        </div>
        <div className="max-w-7xl mx-auto pt-6 mt-6 border-t border-white/5 text-center text-[10px] text-slate-500">
          <p>© 2026 H and N Fashion BD. All Rights Reserved.</p>
        </div>
      </footer>

      {/* Slidable Lightbox Overlay */}
      {isLightboxOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/98 backdrop-blur-md flex flex-col justify-between p-4 sm:p-6 select-none animate-fadeIn">
          {/* Header */}
          <div className="flex items-center justify-between w-full text-white max-w-7xl mx-auto border-b border-white/10 pb-4">
            <div>
              <span className="font-mono text-[9px] uppercase text-[#feae2c] tracking-widest font-bold">Secure Sourcing Showcase</span>
              <h3 className="font-display font-black text-xs sm:text-sm uppercase tracking-tight text-white line-clamp-1">
                {(products.find(p => p.id === routeParams.id || p.sku === routeParams.id))?.title}
              </h3>
            </div>
            
            <button
              onClick={() => setIsLightboxOpen(false)}
              className="p-1.5 rounded-full bg-white/10 hover:bg-white/20 text-white transition-all cursor-pointer flex items-center justify-center hover:scale-105"
            >
              <X size={18} />
            </button>
          </div>

          {/* Core Viewer Area with Sliding Transitions */}
          <div className="relative flex-1 flex items-center justify-center max-w-4xl w-full mx-auto my-4 overflow-hidden">
            {(() => {
              const prod = products.find(p => p.id === routeParams.id || p.sku === routeParams.id);
              if (!prod) return null;
              const imgList = getProductImages(prod);
              const maxIdx = imgList.length - 1;
              
              const prevImage = () => {
                setActiveImageIndex((prev) => (prev === 0 ? maxIdx : prev - 1));
              };
              
              const nextImage = () => {
                setActiveImageIndex((prev) => (prev === maxIdx ? 0 : prev + 1));
              };

              return (
                <>
                  {/* Left navigation arrow */}
                  <button
                    onClick={prevImage}
                    className="absolute left-2 sm:left-4 z-50 p-2.5 sm:p-3 rounded-full bg-[#feae2c] hover:bg-white text-[#0b1329] hover:text-black transition-all shadow-xl hover:scale-105 cursor-pointer"
                  >
                    <ChevronLeft size={20} className="stroke-[3]" />
                  </button>

                  {/* Main centered photo wrapper */}
                  <div className="w-full h-full max-h-[65vh] flex items-center justify-center relative p-2">
                    <img
                      src={imgList[activeImageIndex]}
                      alt={prod.title}
                      className="max-w-full max-h-full object-contain rounded-xl shadow-2xl border border-white/10"
                      referrerPolicy="no-referrer"
                    />

                    {/* Numeric tracking badge */}
                    <div className="absolute bottom-4 bg-slate-900/90 text-[#feae2c] font-mono text-[9px] uppercase font-bold px-3 py-1 rounded-full border border-white/5 shadow">
                      Image {activeImageIndex + 1} / {imgList.length}
                    </div>
                  </div>

                  {/* Right navigation arrow */}
                  <button
                    onClick={nextImage}
                    className="absolute right-2 sm:right-4 z-50 p-2.5 sm:p-3 rounded-full bg-[#feae2c] hover:bg-white text-[#0b1329] hover:text-black transition-all shadow-xl hover:scale-105 cursor-pointer"
                  >
                    <ChevronRight size={20} className="stroke-[3]" />
                  </button>
                </>
              );
            })()}
          </div>

          {/* Footer Area with Synchronized Thumbnail Strips & Instructions */}
          <div className="w-full max-w-2xl mx-auto pb-4 space-y-3">
            {(() => {
              const prod = products.find(p => p.id === routeParams.id || p.sku === routeParams.id);
              if (!prod) return null;
              const imgList = getProductImages(prod);

              return (
                <>
                  {/* Lightbox thumbnail list */}
                  <div className="flex gap-2 justify-center">
                    {imgList.map((img, idx) => (
                      <button
                        key={idx}
                        onClick={() => setActiveImageIndex(idx)}
                        className={`relative w-10 h-10 rounded-lg overflow-hidden border-2 cursor-pointer transition-all ${
                          activeImageIndex === idx 
                            ? "border-[#feae2c] scale-105 shadow-md"
                            : "border-white/10 hover:border-white/30 opacity-60 hover:opacity-100"
                        }`}
                      >
                        <img
                          src={img}
                          alt="thumbnail preview"
                          className="w-full h-full object-cover"
                          referrerPolicy="no-referrer"
                        />
                      </button>
                    ))}
                  </div>

                  {/* Keyboard instruction helpful label */}
                  <div className="text-center font-mono text-[8px] uppercase tracking-wider text-slate-500">
                    Use Left ◀ / Right ▶ Arrow Keys to slide • Press Esc to close
                  </div>
                </>
              );
            })()}
          </div>
        </div>
      )}

      {/* Cookie Consent Popup */}
      {!cookieConsent && (
        <div className="fixed bottom-6 left-6 z-50 max-w-sm animate-fadeIn">
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 p-5">
            <div className="flex items-start gap-3 mb-3">
              <div className="w-9 h-9 bg-[#0b1329] rounded-full flex items-center justify-center shrink-0">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#feae2c" strokeWidth="2">
                  <circle cx="12" cy="12" r="10"/>
                  <path d="M12 8v4M12 16h.01"/>
                </svg>
              </div>
              <div>
                <h4 className="font-display font-bold text-sm text-[#0b1329]">Cookie Consent</h4>
                <p className="text-[11px] text-slate-500 mt-0.5 leading-relaxed">
                  We use cookies to analyze your browsing behavior and recommend products you may like. By clicking "Accept", you consent to our use of cookies.
                </p>
              </div>
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => {
                  localStorage.setItem("hn_cookie_consent", "true");
                  setCookieConsent(true);
                }}
                className="flex-1 bg-[#0b1329] hover:bg-slate-800 text-white font-bold text-[10px] uppercase tracking-wider py-2.5 rounded-xl transition-all"
              >
                Accept
              </button>
              <button
                onClick={() => {
                  localStorage.setItem("hn_cookie_consent", "true");
                  setCookieConsent(true);
                }}
                className="px-4 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-[10px] uppercase tracking-wider py-2.5 rounded-xl transition-all"
              >
                Decline
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Floating WhatsApp Widget */}
      <div className="fixed bottom-6 right-6 z-50 flex flex-col items-end gap-3">
        {isWhatsAppOpen && (
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 p-5 w-72 animate-fadeIn">
            <div className="flex items-start justify-between mb-3">
              <div className="flex items-center gap-2.5">
                <div className="w-10 h-10 bg-[#25D366] rounded-full flex items-center justify-center shrink-0">
                  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" fill="#ffffff"/>
                  </svg>
                </div>
                <div>
                  <p className="font-bold text-sm text-slate-900">H&N Fashion BD</p>
                  <p className="text-[10px] text-slate-500">+880 1603 521341</p>
                </div>
              </div>
              <button
                onClick={() => setIsWhatsAppOpen(false)}
                className="text-slate-400 hover:text-slate-700 transition-colors p-1"
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M18 6L6 18M6 6l12 12"/>
                </svg>
              </button>
            </div>
            <p className="text-xs text-slate-600 mb-4 leading-relaxed">
              Chat with us directly on WhatsApp. Our team will respond within hours.
            </p>
            <a
              href="https://wa.me/8801603521341?text=Hello!%20I%27m%20interested%20in%20your%20products.%20Can%20we%20talk%20more%20about%20it%3F"
              target="_blank"
              rel="noopener noreferrer"
              className="w-full flex items-center justify-center gap-2 bg-[#25D366] hover:bg-[#128C7E] text-white font-bold text-xs uppercase tracking-wider py-3 rounded-xl transition-all hover:shadow-lg"
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" fill="#ffffff"/>
              </svg>
              Contact
            </a>
          </div>
        )}
        <button
          onClick={() => setIsWhatsAppOpen(!isWhatsAppOpen)}
          className="w-14 h-14 bg-[#25D366] hover:bg-[#128C7E] text-white rounded-full shadow-2xl hover:shadow-lg flex items-center justify-center transition-all hover:scale-110 active:scale-95"
        >
          {isWhatsAppOpen ? (
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <path d="M18 6L6 18M6 6l12 12"/>
            </svg>
          ) : (
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" fill="#ffffff"/>
            </svg>
          )}
        </button>
      </div>

      {/* Inquiry Modal */}
      <InquiryModal
        product={selectedInquiryProduct}
        isOpen={isInquiryOpen}
        onClose={() => {
          setIsInquiryOpen(false);
          setSelectedInquiryProduct(null);
        }}
        onSuccess={() => {
          setNotifSuccess(true);
          setTimeout(() => setNotifSuccess(false), 5000);
          fetchProducts();
        }}
      />

      {/* Manifest detailed specs modal */}
      <ManifestModal
        product={selectedManifestProduct}
        isOpen={isManifestOpen}
        onClose={() => {
          setIsManifestOpen(false);
          setSelectedManifestProduct(null);
        }}
        onInquire={() => {
          setSelectedInquiryProduct(selectedManifestProduct);
          setIsInquiryOpen(true);
        }}
      />

    </div>
  );
}
