import React, { useState } from "react";
import { X, Send, Check } from "lucide-react";
import { Product, CATEGORIES } from "../types";

interface InquiryModalProps {
  product?: Product | null;
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export default function InquiryModal({ product, isOpen, onClose, onSuccess }: InquiryModalProps) {
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [company, setCompany] = useState("");
  const [message, setMessage] = useState(
    product
      ? `Interested in booking stock allocations for: "${product.title}" (SKU: #${product.sku}). Please share full logistics packing manifest.`
      : ""
  );
  const [selectedCats, setSelectedCats] = useState<string[]>(
    product ? [product.category] : []
  );
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");

  if (!isOpen) return null;

  const toggleCategory = (cat: string) => {
    if (selectedCats.includes(cat)) {
      setSelectedCats(selectedCats.filter((c) => c !== cat));
    } else {
      setSelectedCats([...selectedCats, cat]);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!fullName || !email || !company) {
      setError("Please complete all required fields (Full name, Email, Company).");
      return;
    }

    setIsSubmitting(true);
    setError("");

    try {
      const response = await fetch("/api/inquiries", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          fullName,
          email,
          company,
          categories: selectedCats,
          message,
          productTitle: product?.title,
          productSku: product?.sku,
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to submit inquiry.");
      }

      onSuccess();
      onClose();
    } catch (err: any) {
      setError(err.message || "An error occurred. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-100 flex items-center justify-center p-3 sm:p-4 bg-primary/60 backdrop-blur-sm">
      <div className="relative w-full max-w-2xl bg-white rounded-lg shadow-2xl border border-outline-variant overflow-hidden max-h-[95vh] sm:max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="bg-primary text-white p-4 sm:p-5 flex justify-between items-center">
          <div>
            <h3 className="font-display font-bold text-base sm:text-lg leading-tight">Wholesale Inquiry Form</h3>
            <p className="text-[11px] sm:text-xs text-on-primary-container">
              Secure priority B2B surplus garment allocation
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-white/80 hover:text-white transition-colors p-1.5 hover:bg-white/10 rounded"
          >
            <X size={20} />
          </button>
        </div>

        {/* Content */}
        <form onSubmit={handleSubmit} className="p-4 sm:p-6 overflow-y-auto space-y-4 sm:space-y-5 flex-1">
          {error && (
            <div className="p-3 bg-error/10 border border-error/20 text-error rounded text-sm font-semibold">
              {error}
            </div>
          )}

          {product && (
            <div className="p-4 bg-primary-container/10 border border-primary-container/20 rounded-md flex items-center gap-4">
              <img
                src={product.image}
                alt={product.title}
                className="w-12 h-16 object-cover rounded shadow"
                referrerPolicy="no-referrer"
              />
              <div>
                <span className="text-[10px] font-mono font-bold tracking-wider uppercase text-secondary bg-secondary/10 px-2 py-0.5 rounded">
                  Target Cargo Lot Item
                </span>
                <h4 className="font-display font-bold text-sm text-primary mt-1">
                  {product.title}
                </h4>
                <p className="text-xs text-on-surface-variant font-mono">
                  SKU: #{product.sku} | QC Standard: AQL 1.5
                </p>
              </div>
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-[11px] font-mono font-bold text-on-surface-variant mb-1.5 uppercase">
                Full Name *
              </label>
              <input
                type="text"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                placeholder="David Smith"
                required
                className="w-full border border-outline-variant rounded p-2.5 text-sm focus:ring-1 focus:ring-secondary-container outline-none"
              />
            </div>
            <div>
              <label className="block text-[11px] font-mono font-bold text-on-surface-variant mb-1.5 uppercase">
                Business Email *
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="buyer@globalexport.com"
                required
                className="w-full border border-outline-variant rounded p-2.5 text-sm focus:ring-1 focus:ring-secondary-container outline-none"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-[11px] font-mono font-bold text-on-surface-variant mb-1.5 uppercase">
                Company Name *
              </label>
              <input
                type="text"
                value={company}
                onChange={(e) => setCompany(e.target.value)}
                placeholder="UK Apparel Distributors Ltd"
                required
                className="w-full border border-outline-variant rounded p-2.5 text-sm focus:ring-1 focus:ring-secondary-container outline-none"
              />
            </div>
            <div>
              <label className="block text-[11px] font-mono font-bold text-on-surface-variant mb-1.5 uppercase">
                Sourcing Volume
              </label>
              <select className="w-full border border-outline-variant rounded p-2.5 text-sm focus:ring-1 focus:ring-secondary-container outline-none">
                <option>LCL (Less than Container Load)</option>
                <option>FCL (Full Container Load - 20ft)</option>
                <option>Multi-FCL (40ft High-Cube Cargoes)</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-[11px] font-mono font-bold text-on-surface-variant mb-2 uppercase">
              Target Export Categories
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {CATEGORIES.map((cat) => (
                <button
                  type="button"
                  key={cat}
                  onClick={() => toggleCategory(cat)}
                  className={`flex items-center gap-2 p-2 border rounded text-xs font-semibold text-left transition-colors cursor-pointer ${
                    selectedCats.includes(cat)
                      ? "border-secondary bg-secondary-container/10 text-on-secondary-container"
                      : "border-outline-variant hover:bg-surface-container-low text-on-surface-variant"
                  }`}
                >
                  <span
                    className={`w-4 h-4 rounded border flex items-center justify-center ${
                      selectedCats.includes(cat)
                        ? "border-secondary bg-secondary-container text-white"
                        : "border-outline-variant"
                    }`}
                  >
                    {selectedCats.includes(cat) && <Check size={10} strokeWidth={3} />}
                  </span>
                  {cat}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-[11px] font-mono font-bold text-on-surface-variant mb-1.5 uppercase">
              Inquiry / Import Request Details
            </label>
            <textarea
              rows={4}
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="Provide quantities requested, target ports, payment terms (L/C, T/T), or custom packaging instructions."
              className="w-full border border-outline-variant rounded p-2.5 text-sm focus:ring-1 focus:ring-secondary-container outline-none"
            />
          </div>

          <div className="pt-2">
            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full bg-secondary-container hover:bg-secondary text-on-secondary-fixed hover:text-white transition-all font-display font-bold p-3 text-sm rounded shadow-md flex items-center justify-center gap-2 cursor-pointer disabled:opacity-55"
            >
              <Send size={16} />
              {isSubmitting ? "Transmitting B2B Request..." : "Request Wholesale Manifest Data"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
