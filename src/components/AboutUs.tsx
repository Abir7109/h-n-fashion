import { ShieldCheck, Compass, Lock, User, PhoneCall, Mail, MapPin, Leaf, Target, Award, CheckCircle } from "lucide-react";

const contactInfo = {
  phone: "+880 1603 521341",
  email: "humayun@handnfashionbd.com",
  address: "Flat-A2, 1st Floor, House No-14, Road No-18, Sector-10, Uttara, Dhaka-1230, Bangladesh",
};

export default function AboutUs({ onNavigate }: { onNavigate: (path: string) => void }) {
  return (
    <div className="min-h-screen bg-[#f8fafc]">
      {/* Hero Section */}
      <section className="bg-gradient-to-r from-[#0b1329] to-[#1a2744] text-white py-16 px-4 border-b-4 border-[#feae2c]">
        <div className="max-w-5xl mx-auto text-center">
          <span className="text-[#feae2c] font-mono text-[10px] font-bold tracking-widest uppercase block mb-3">About Us</span>
          <h1 className="font-display font-black text-3xl sm:text-5xl text-white tracking-tight mb-4">
            Welcome to <span className="text-[#feae2c]">H&N Fashion BD</span>
          </h1>
          <p className="text-slate-300 text-sm sm:text-base max-w-3xl mx-auto leading-relaxed">
            Greetings from Bangladesh! We are a 100% export-oriented Ready-Made Garment (RMG) manufacturer, importer, and exporter buying office based in Dhaka. We specialize in knit, woven, and sweater garments, offering comprehensive services across the textile and apparel industry.
          </p>
        </div>
      </section>

      {/* What We Do */}
      <section className="max-w-5xl mx-auto px-4 py-16">
        <div className="bg-white border border-slate-200 rounded-2xl p-8 sm:p-12 shadow-lg">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
            <div className="space-y-6">
              <div>
                <span className="text-[#feae2c] font-mono text-[9px] font-bold tracking-widest uppercase block mb-2">Our Services</span>
                <h2 className="font-display font-black text-2xl text-[#0b1329] uppercase">What We Do</h2>
              </div>
              <p className="text-sm text-slate-600 leading-relaxed">
                From product conceptualization to production and final delivery, we provide full support in complete supply chain management. Our services encompass meticulous merchandising and strict quality control procedures to ensure every product meets the highest global standards.
              </p>
              <div className="flex flex-wrap gap-3">
                {["Knit Garments", "Woven Garments", "Sweater", "Sourcing", "QC Inspection", "Supply Chain"].map((item) => (
                  <span key={item} className="text-[10px] font-bold bg-[#0b1329]/5 text-[#0b1329] px-3 py-1.5 rounded-full border border-[#0b1329]/10 uppercase tracking-wider">
                    {item}
                  </span>
                ))}
              </div>
            </div>
            <div className="space-y-6">
              <div>
                <span className="text-[#feae2c] font-mono text-[9px] font-bold tracking-widest uppercase block mb-2">Quality & Safety</span>
                <h2 className="font-display font-black text-2xl text-[#0b1329] uppercase">Our Standards</h2>
              </div>
              <p className="text-sm text-slate-600 leading-relaxed">
                Quality is at the core of our operations. We deploy a dedicated Quality Control (QC) team of 15 highly qualified technical experts who work directly in our partner factories. They rigorously inspect workmanship, labeling, and packaging to maintain an AQL 2.5 standard (or as required by our clients).
              </p>
              <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-4 space-y-3">
                <div className="flex items-start gap-3">
                  <ShieldCheck size={16} className="text-emerald-600 mt-0.5 shrink-0" />
                  <div>
                    <span className="text-xs font-bold text-emerald-800 block">Product Safety</span>
                    <p className="text-[11px] text-emerald-700">We follow a comprehensive needle policy to guarantee safety.</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <Leaf size={16} className="text-emerald-600 mt-0.5 shrink-0" />
                  <div>
                    <span className="text-xs font-bold text-emerald-800 block">Eco-Friendly</span>
                    <p className="text-[11px] text-emerald-700">We exclusively use azo-free dyes and environmentally safe chemicals, ensuring the safest and highest quality garments for our valuable customers.</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Vision & Mission */}
      <section className="bg-[#0b1329] text-white py-16 px-4">
        <div className="max-w-5xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-8">
          <div className="bg-white/5 border border-white/10 rounded-2xl p-8 space-y-4">
            <Compass size={28} className="text-[#feae2c]" />
            <h3 className="font-display font-black text-xl uppercase text-white">Our Vision</h3>
            <p className="text-sm text-slate-300 leading-relaxed">
              To be the most preferred sourcing agency for garments, home textiles, bags, and other products for global clients, while also providing automated warehousing and re-distribution solutions worldwide.
            </p>
          </div>
          <div className="bg-white/5 border border-white/10 rounded-2xl p-8 space-y-4">
            <Target size={28} className="text-[#feae2c]" />
            <h3 className="font-display font-black text-xl uppercase text-white">Our Mission</h3>
            <p className="text-sm text-slate-300 leading-relaxed">
              To conduct our business in a way that continuously upholds our reputation for unyielding credibility and integrity among our clients, vendors, and employees.
            </p>
          </div>
        </div>
      </section>

      {/* Confidentiality & Trust */}
      <section className="max-w-5xl mx-auto px-4 py-16">
        <div className="bg-white border border-slate-200 rounded-2xl p-8 sm:p-12 shadow-lg">
          <div className="flex items-center gap-4 mb-6">
            <Lock size={24} className="text-[#feae2c]" />
            <div>
              <span className="text-[#feae2c] font-mono text-[9px] font-bold tracking-widest uppercase block">Trust & Security</span>
              <h2 className="font-display font-black text-2xl text-[#0b1329] uppercase">Confidentiality & Trust</h2>
            </div>
          </div>
          <p className="text-sm text-slate-600 leading-relaxed max-w-3xl">
            We deeply value the trust placed in us by our partners. Our vendors are bound by strict confidentiality agreements, ensuring that all shared information, designs, and business strategies are completely secure and protected.
          </p>
        </div>
      </section>

      {/* Leadership */}
      <section className="bg-white border-t border-slate-200 py-16 px-4">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-10">
            <span className="text-[#feae2c] font-mono text-[9px] font-bold tracking-widest uppercase block mb-2">Our Team</span>
            <h2 className="font-display font-black text-2xl sm:text-3xl text-[#0b1329] uppercase">Meet Our Leadership</h2>
          </div>
          <div className="max-w-md mx-auto bg-[#0b1329] rounded-2xl p-8 text-center border border-white/10 shadow-xl">
            <div className="w-20 h-20 bg-[#feae2c]/20 rounded-full flex items-center justify-center mx-auto mb-4 border-2 border-[#feae2c]">
              <User size={36} className="text-[#feae2c]" />
            </div>
            <h3 className="font-display font-black text-xl text-white">Humayun Kabir</h3>
            <p className="text-[#feae2c] font-mono text-[10px] font-bold uppercase tracking-widest mb-4">Managing Director</p>
            <p className="text-sm text-slate-300 leading-relaxed">
              As the driving force behind H&N Fashion BD, Humayun leads a dedicated team committed to excellence in the apparel sourcing industry. Under his leadership, the company continues to foster strong global partnerships and deliver top-tier textile solutions.
            </p>
          </div>
        </div>
      </section>

      {/* Contact Info */}
      <section className="bg-[#0b1329] text-white py-16 px-4">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-10">
            <span className="text-[#feae2c] font-mono text-[9px] font-bold tracking-widest uppercase block mb-2">Get In Touch</span>
            <h2 className="font-display font-black text-2xl sm:text-3xl text-white uppercase">Contact Information</h2>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
            <div className="bg-white/5 border border-white/10 rounded-xl p-6 text-center space-y-3">
              <PhoneCall size={24} className="text-[#feae2c] mx-auto" />
              <p className="text-xs text-slate-400 uppercase tracking-wider font-mono">Phone</p>
              <a href={`tel:${contactInfo.phone}`} className="text-sm font-bold text-white hover:text-[#feae2c] transition-colors">{contactInfo.phone}</a>
            </div>
            <div className="bg-white/5 border border-white/10 rounded-xl p-6 text-center space-y-3">
              <Mail size={24} className="text-[#feae2c] mx-auto" />
              <p className="text-xs text-slate-400 uppercase tracking-wider font-mono">Email</p>
              <a href={`mailto:${contactInfo.email}`} className="text-sm font-bold text-white hover:text-[#feae2c] transition-colors">{contactInfo.email}</a>
            </div>
            <div className="bg-white/5 border border-white/10 rounded-xl p-6 text-center space-y-3">
              <MapPin size={24} className="text-[#feae2c] mx-auto" />
              <p className="text-xs text-slate-400 uppercase tracking-wider font-mono">Address</p>
              <p className="text-sm font-bold text-white">{contactInfo.address}</p>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
