import React, { useState } from "react";
import { X, FileText, Download, Check, HelpCircle } from "lucide-react";
import { Product } from "../types";

interface ManifestModalProps {
  product: Product | null;
  isOpen: boolean;
  onClose: () => void;
  onInquire: () => void;
}

export default function ManifestModal({ product, isOpen, onClose, onInquire }: ManifestModalProps) {
  const [downloading, setDownloading] = useState(false);
  const [downloaded, setDownloaded] = useState(false);

  if (!isOpen || !product) return null;

  const handleDownload = () => {
    setDownloading(true);
    setDownloaded(false);
    setTimeout(() => {
      setDownloading(false);
      setDownloaded(true);
      // Trigger a clean virtual text download
      const content = `
========================================
    STOCKLOT BD - EXPORT MANIFEST
========================================
Product Title: ${product.title}
SKU Code     : #${product.sku}
Category     : ${product.category}
Quality Class: ${product.status}
Materials    : ${product.material}
Total Quantity: ${product.qty.toLocaleString()} Pcs
MOQ Allocation: ${product.moq.toLocaleString()} Pcs

SIZE BREAKDOWN (Standard Ratio S-XL: 1:2:2:1)
- Small  : ${Math.round(product.qty * 0.16).toLocaleString()} Pcs
- Medium : ${Math.round(product.qty * 0.34).toLocaleString()} Pcs
- Large  : ${Math.round(product.qty * 0.34).toLocaleString()} Pcs
- Extra Large: ${Math.round(product.qty * 0.16).toLocaleString()} Pcs

PACKAGING AND CARTON LOGISTICS:
- Master Poly: Packaged in 12 Pcs Master Carton
- Moisture-Proof Treated: Yes
- Cargo Loading Capacity: (~32,000 Pcs per 20ft container)
----------------------------------------
Verified by Independent AQL-1.5 Inspector.
========================================
      `;
      const blob = new Blob([content], { type: "text/plain" });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `HN_Manifest_${product.sku}.txt`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }, 1800);
  };

  return (
    <div className="fixed inset-0 z-100 flex items-center justify-center p-2.5 sm:p-4 bg-primary/60 backdrop-blur-sm">
      <div className="relative w-full max-w-4xl bg-[#f7f9fc] rounded-lg shadow-2xl border border-outline-variant overflow-hidden max-h-[96vh] sm:max-h-[95vh] flex flex-col">
        {/* Header */}
        <div className="bg-primary text-white p-4 sm:p-5 flex justify-between items-center">
          <div className="flex items-center gap-2">
            <span className="bg-success-emerald/20 text-success-emerald border border-success-emerald/30 text-[9px] sm:text-[10px] font-mono uppercase px-2 py-0.5 sm:px-2.5 sm:py-1 rounded">
              AQL 2.5 CERTIFIED
            </span>
            <span className="text-white/60 font-mono text-[11px] sm:text-xs">Lot specs verified</span>
          </div>
          <button
            onClick={onClose}
            className="text-white/80 hover:text-white transition-colors p-1 hover:bg-white/10 rounded"
          >
            <X size={20} />
          </button>
        </div>

        {/* Inner Content Grid */}
        <div className="overflow-y-auto p-4 sm:p-6 flex-1">
          <div className="grid grid-cols-1 md:grid-cols-12 gap-5 sm:gap-6">
            {/* Gallery Column */}
            <div className="md:col-span-5 space-y-3 sm:space-y-4">
              <div className="bg-white border border-outline-variant p-2 rounded-md">
                <img
                  src={product.image}
                  alt={product.title}
                  className="w-full h-44 md:h-auto md:aspect-[4/5] object-cover rounded"
                  referrerPolicy="no-referrer"
                />
              </div>
              
              <div className="grid grid-cols-4 gap-2">
                <div className="aspect-square bg-white border border-secondary rounded shadow-sm flex items-center justify-center overflow-hidden">
                  <img src={product.image} alt="prev-1" className="w-full h-full object-cover scale-110" referrerPolicy="no-referrer" />
                </div>
                <div className="aspect-square bg-slate-100 border border-outline-variant rounded flex items-center justify-center text-on-surface-variant font-mono font-bold text-[10px] sm:text-xs">
                  Ratio
                </div>
                <div className="aspect-square bg-slate-100 border border-outline-variant rounded flex items-center justify-center text-on-surface-variant font-mono font-bold text-[10px] sm:text-xs">
                  AQL
                </div>
                <div className="aspect-square bg-slate-100 border border-outline-variant rounded flex items-center justify-center text-on-surface-variant font-mono font-bold text-[10px] sm:text-xs">
                  Pack
                </div>
              </div>

              <div className="p-3 sm:p-4 bg-primary text-white rounded-md space-y-1 sm:space-y-2">
                <h5 className="font-display font-semibold text-[11px] sm:text-xs py-1 border-b border-white/10 uppercase tracking-wider text-secondary-fixed">
                  Audit Logistics
                </h5>
                <div className="grid grid-cols-2 gap-2 text-[11px] sm:text-xs">
                  <div>
                    <span className="text-white/60 block">Cargo Carrier:</span>
                    <span className="font-bold">Maersk / MSC</span>
                  </div>
                  <div>
                    <span className="text-white/60 block">Inspection:</span>
                    <span className="font-bold">SGS Certified</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Document Data Specifications */}
            <div className="md:col-span-7 flex flex-col justify-between">
              <div>
                <span className="text-xs font-mono font-bold uppercase tracking-wider text-secondary block mb-1">
                  {product.category} Surplus Allocation
                </span>
                <h3 className="font-display font-black text-xl text-primary leading-tight mb-2">
                  {product.title}
                </h3>
                <p className="text-xs text-on-surface-variant mb-4">
                  Export Lot Reference: <span className="font-mono font-semibold text-primary">#{product.sku}</span> | Added On: {new Date(product.addedAt).toLocaleDateString()}
                </p>

                {/* Spec Table */}
                <div className="border border-outline-variant rounded overflow-hidden shadow-sm mb-6 bg-white">
                  <table className="w-full text-left font-mono text-xs">
                    <thead>
                      <tr className="bg-primary text-white font-display uppercase tracking-wider text-[10px]">
                        <th className="p-3">Specification</th>
                        <th className="p-3 text-right">Verified Logisitcs</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-outline-variant/60">
                      <tr className="hover:bg-slate-50">
                        <td className="p-3 text-on-surface-variant font-sans font-medium">Total Lot Quantity</td>
                        <td className="p-3 text-right font-semibold text-primary">{product.qty.toLocaleString()} Pcs</td>
                      </tr>
                      <tr className="bg-slate-50 hover:bg-slate-150">
                        <td className="p-3 text-on-surface-variant font-sans font-medium">Size Breakdown Ratio</td>
                        <td className="p-3 text-right font-semibold text-primary">S - XL (Ratio 1:2:2:1)</td>
                      </tr>
                      <tr className="hover:bg-slate-50">
                        <td className="p-3 text-on-surface-variant font-sans font-medium">Cargo Stock Status</td>
                        <td className="p-3 text-right font-semibold text-primary">{product.status}</td>
                      </tr>
                      <tr className="bg-slate-50 hover:bg-slate-150">
                        <td className="p-3 text-on-surface-variant font-sans font-medium">Fabric Properties</td>
                        <td className="p-3 text-right font-semibold text-primary">{product.material}</td>
                      </tr>
                      <tr className="hover:bg-slate-50">
                        <td className="p-3 text-on-surface-variant font-sans font-medium">Standard Master Pack</td>
                        <td className="p-3 text-right font-semibold text-primary">Single Poly / 12 Pcs Carton</td>
                      </tr>
                      <tr className="bg-slate-50 hover:bg-slate-150 font-bold">
                        <td className="p-3 text-on-surface-variant font-sans text-secondary">Export MOQ Requirement</td>
                        <td className="p-3 text-right text-secondary-container bg-primary/95 font-bold uppercase">
                          {product.moq.toLocaleString()} Pcs
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>

                {/* Logistics Badges */}
                <div className="grid grid-cols-3 gap-3 mb-6">
                  <div className="p-3 bg-surface-container border border-outline-variant rounded text-center">
                    <span className="block text-[10px] font-bold text-on-surface-variant/70 uppercase">Global</span>
                    <span className="font-display font-bold text-xs text-primary">Sea Shipping</span>
                  </div>
                  <div className="p-3 bg-surface-container border border-outline-variant rounded text-center">
                    <span className="block text-[10px] font-bold text-on-surface-variant/70 uppercase">AQL Pass</span>
                    <span className="font-display font-bold text-xs text-primary">AQL 2.5 Audit</span>
                  </div>
                  <div className="p-3 bg-surface-container border border-outline-variant rounded text-center">
                    <span className="block text-[10px] font-bold text-on-surface-variant/70 uppercase">Document</span>
                    <span className="font-display font-bold text-xs text-primary">Clean Bill Cargo</span>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="grid grid-cols-2 gap-3 pt-4 border-t border-outline-variant/60">
                <button
                  onClick={handleDownload}
                  disabled={downloading}
                  className={`py-3.5 px-4 font-display font-bold text-xs uppercase tracking-wider border rounded flex items-center justify-center gap-2 transition-all cursor-pointer ${
                    downloaded
                      ? "border-success-emerald text-success-emerald bg-success-emerald/5"
                      : "border-primary text-primary hover:bg-primary/5"
                  }`}
                >
                  {downloading ? (
                    <>
                      <div className="w-4 h-4 border-2 border-t-transparent border-primary rounded-full animate-spin"></div>
                      Compiling...
                    </>
                  ) : downloaded ? (
                    <>
                      <Check size={16} />
                      Manifest Saved
                    </>
                  ) : (
                    <>
                      <Download size={16} />
                      Get Packlist Manifest
                    </>
                  )}
                </button>
                <button
                  onClick={() => {
                    onInquire();
                    onClose();
                  }}
                  className="py-3.5 px-4 font-display font-bold text-xs uppercase tracking-wider bg-secondary-container text-on-secondary-fixed hover:bg-secondary hover:text-white rounded flex items-center justify-center gap-2 shadow transition-colors cursor-pointer"
                >
                  <FileText size={16} />
                  Book Cargo Call
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
