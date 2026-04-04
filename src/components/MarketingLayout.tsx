import { Link, useLocation } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Menu, X, Phone, Mail, MapPin } from "lucide-react";
import { useState, useEffect } from "react";
import logoImg from "@/assets/logo.png";

const navLinks = [
  { label: "Features", path: "/features" },
  { label: "Pricing", path: "/pricing" },
  { label: "FAQ", path: "/faq" },
  { label: "Contact", path: "/contact-us" },
];

interface Props {
  children: React.ReactNode;
  title?: string;
  description?: string;
}

const BRAND = "Travel Agency Website & Software Solution";
const BRAND_SHORT = "TAWSS";
const DOMAIN = "travelagencyweb.com";
const PUBLISHED_DOMAIN = "hearth-core-app.lovable.app";

const MarketingLayout = ({ children, title, description }: Props) => {
  const location = useLocation();
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    if (title) document.title = title;
    const pageUrl = `https://${DOMAIN}${location.pathname === "/" ? "" : location.pathname}`;
    const ogImage = `https://${PUBLISHED_DOMAIN}/images/og-share-v2.png`;
    if (description) {
      const setMeta = (sel: string, attr: string, val: string) => {
        let el = document.querySelector(sel);
        if (!el) { el = document.createElement("meta"); const a = sel.match(/\[(\w+)="([^"]+)"\]/); if (a) el.setAttribute(a[1], a[2]); document.head.appendChild(el); }
        el.setAttribute(attr, val);
      };
      setMeta('meta[name="description"]', "content", description);
      setMeta('meta[property="og:description"]', "content", description);
      setMeta('meta[name="twitter:description"]', "content", description);
    }
    if (title) {
      const setMeta = (sel: string, attr: string, val: string) => {
        let el = document.querySelector(sel);
        if (el) el.setAttribute(attr, val);
      };
      setMeta('meta[property="og:title"]', "content", title);
      setMeta('meta[name="twitter:title"]', "content", title);
    }
    // Update URL-based tags
    const updateAttr = (sel: string, attr: string, val: string) => { const el = document.querySelector(sel); if (el) el.setAttribute(attr, val); };
    updateAttr('link[rel="canonical"]', "href", pageUrl);
    updateAttr('meta[property="og:url"]', "content", pageUrl);
    updateAttr('meta[property="og:image"]', "content", ogImage);
    updateAttr('meta[name="twitter:image"]', "content", ogImage);
    return () => { document.title = `${BRAND} — Complete Travel Agency Management`; };
  }, [title, description, location.pathname]);

  useEffect(() => { setMenuOpen(false); }, [location.pathname]);

  return (
    <div className="min-h-screen bg-[#0a1628] text-white">
      {/* Navbar */}
      <header className="sticky top-0 z-50 border-b border-white/10 bg-[#0a1628]/95 backdrop-blur">
        <div className="container mx-auto flex h-16 items-center justify-between px-4">
          <Link to="/" className="flex items-center gap-2.5">
            <img src={logoImg} alt={BRAND} className="h-9 w-auto" />
            <span className="text-lg font-bold tracking-wide hidden sm:inline">
              <span className="text-white">{BRAND_SHORT}</span>
            </span>
          </Link>

          {/* Desktop */}
          <nav className="hidden md:flex items-center gap-7 text-sm">
            {navLinks.map((link) => (
              <Link
                key={link.path}
                to={link.path}
                className={`transition-colors hover:text-white ${
                  location.pathname === link.path ? "text-cyan-400 font-medium" : "text-white/60"
                }`}
              >
                {link.label}
              </Link>
            ))}
            <Link to="/demo">
              <Button size="sm" variant="outline" className="border-cyan-400/40 text-cyan-400 hover:bg-cyan-400/10">
                Book a Demo
              </Button>
            </Link>
            <Link to="/login">
              <Button size="sm" className="bg-gradient-to-r from-cyan-500 to-blue-500 hover:from-cyan-600 hover:to-blue-600 text-white">
                Login
              </Button>
            </Link>
          </nav>

          {/* Mobile toggle */}
          <button className="md:hidden text-white" onClick={() => setMenuOpen(!menuOpen)}>
            {menuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
          </button>
        </div>

        {/* Mobile nav */}
        {menuOpen && (
          <div className="md:hidden border-t border-white/10 bg-[#0a1628] px-4 pb-4">
            {navLinks.map((link) => (
              <Link
                key={link.path}
                to={link.path}
                className={`block py-2.5 text-sm ${
                  location.pathname === link.path ? "text-cyan-400 font-medium" : "text-white/60"
                }`}
              >
                {link.label}
              </Link>
            ))}
            <Link to="/demo" className="block py-2.5">
              <Button size="sm" variant="outline" className="w-full border-cyan-400/40 text-cyan-400">Book a Demo</Button>
            </Link>
            <Link to="/login" className="block pt-1">
              <Button size="sm" className="w-full bg-gradient-to-r from-cyan-500 to-blue-500 text-white">Login</Button>
            </Link>
          </div>
        )}
      </header>

      {/* Content */}
      <main>{children}</main>

      {/* Footer */}
      <footer className="border-t border-white/10 pt-16 pb-8">
        <div className="container mx-auto px-4">
          <div className="grid gap-10 md:grid-cols-2 lg:grid-cols-4">
            <div>
              <div className="flex items-center gap-2 mb-4">
                <img src={logoImg} alt={BRAND} className="h-8 w-auto" />
                <span className="font-bold text-lg">{BRAND_SHORT}</span>
              </div>
              <p className="text-sm text-white/40 leading-relaxed">
                {BRAND}. From inquiry to trip completion — manage leads, quotations, bookings, invoices, and vendors in one place.
              </p>
            </div>
            <div>
              <h4 className="font-semibold mb-4">Product</h4>
              <div className="space-y-2.5 text-sm text-white/40">
                <Link to="/features" className="block hover:text-white/70">Features</Link>
                <Link to="/pricing" className="block hover:text-white/70">Pricing</Link>
                <Link to="/demo" className="block hover:text-white/70">Book a Demo</Link>
                <Link to="/faq" className="block hover:text-white/70">FAQ</Link>
              </div>
            </div>
            <div>
              <h4 className="font-semibold mb-4">Company</h4>
              <div className="space-y-2.5 text-sm text-white/40">
                <Link to="/contact-us" className="block hover:text-white/70">Contact Us</Link>
                <Link to="/privacy" className="block hover:text-white/70">Privacy Policy</Link>
                <Link to="/terms" className="block hover:text-white/70">Terms of Service</Link>
              </div>
            </div>
            <div>
              <h4 className="font-semibold mb-4">Contact</h4>
              <div className="space-y-3 text-sm text-white/40">
                <div className="flex items-center gap-2">
                  <Phone className="h-4 w-4 text-cyan-400/60" />
                  <span>+880 1234-567890</span>
                </div>
                <div className="flex items-center gap-2">
                  <Mail className="h-4 w-4 text-cyan-400/60" />
                  <span>support@travelagencyweb.com</span>
                </div>
                <div className="flex items-center gap-2">
                  <MapPin className="h-4 w-4 text-cyan-400/60" />
                  <span>Dhaka, Bangladesh</span>
                </div>
              </div>
            </div>
          </div>
          <div className="mt-12 pt-6 border-t border-white/10 flex flex-col md:flex-row items-center justify-between gap-4">
            <p className="text-sm text-white/30">
              © {new Date().getFullYear()} {BRAND}. All rights reserved.
            </p>
            <div className="flex gap-6 text-sm text-white/30">
              <Link to="/privacy" className="hover:text-white/50">Privacy</Link>
              <Link to="/terms" className="hover:text-white/50">Terms</Link>
              <Link to="/contact-us" className="hover:text-white/50">Support</Link>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default MarketingLayout;