import { createContext, useContext, useState, useEffect } from "react";
import { publicApi, type TenantPublic, type PackagePublic } from "@/lib/publicApi";
import { websiteApi, templateDefaults, type WebsiteConfig } from "@/lib/websiteApi";
import { resolveHostname, fetchTenantByDomain, type DomainResolution } from "@/lib/domainResolver";
import DomainErrorPage from "@/components/DomainErrorPage";

// Demo fallback
const demoTenant: TenantPublic = {
  id: "demo",
  name: "Travel Agency Website & Software Solution",
  slug: "tawss",
  description: "Your trusted partner for unforgettable travel experiences. We specialize in curated tours, flight bookings, hotel reservations, and visa assistance across the globe.",
  phone: "+880 1234-567890",
  email: "info@travelagencyweb.com",
  address: "123 Travel Plaza, Suite 400, Dhaka, Bangladesh",
  website: "https://travelagencyweb.com",
  socialLinks: { facebook: "#", instagram: "#", twitter: "#" },
};

const demoPackages: PackagePublic[] = [
  { id: "1", name: "Cox's Bazar Beach Getaway", description: "3 days of sun, sand, and relaxation at the world's longest beach.", price: 15000, duration: "3 Days / 2 Nights", type: "tour", image: "", highlights: ["Beach resort stay", "Seafood dinner", "Boat ride", "Airport transfer"] },
  { id: "2", name: "Bangkok & Pattaya Explorer", description: "Explore vibrant Thailand with guided city tours and island hopping.", price: 45000, duration: "5 Days / 4 Nights", type: "tour", image: "", highlights: ["City tour", "Coral Island trip", "Thai cooking class", "Night market"] },
  { id: "3", name: "Dubai Luxury Package", description: "Experience the grandeur of Dubai with desert safari and Burj Khalifa visit.", price: 85000, duration: "4 Days / 3 Nights", type: "tour", image: "", highlights: ["Desert safari", "Burj Khalifa", "Dubai Mall", "Dhow cruise dinner"] },
  { id: "4", name: "Malaysia Visa Processing", description: "Fast-track visa processing for Malaysia with document assistance.", price: 5000, duration: "5-7 Working Days", type: "visa", image: "", highlights: ["Document review", "Application filing", "Status tracking", "Express option"] },
  { id: "5", name: "Dhaka to Bangkok Flight", description: "Round-trip economy class tickets with flexible dates.", price: 28000, duration: "Round Trip", type: "ticket", image: "", highlights: ["20kg baggage", "Meal included", "Flexible dates", "Insurance option"] },
  { id: "6", name: "Maldives Honeymoon", description: "Romantic overwater villa stay in the Maldives paradise.", price: 150000, duration: "5 Days / 4 Nights", type: "hotel", image: "", highlights: ["Overwater villa", "Couple spa", "Sunset cruise", "All-inclusive meals"] },
];

interface WebsiteContextType {
  tenant: TenantPublic;
  packages: PackagePublic[];
  websiteConfig: WebsiteConfig;
  loading: boolean;
  domainResolution: DomainResolution | null;
}

const WebsiteContext = createContext<WebsiteContextType>({
  tenant: demoTenant,
  packages: demoPackages,
  websiteConfig: templateDefaults["travel-agency"],
  loading: false,
  domainResolution: null,
});

export const useWebsite = () => useContext(WebsiteContext);

export const WebsiteProvider = ({ slug: propSlug, children }: { slug?: string; children: React.ReactNode }) => {
  const [tenant, setTenant] = useState<TenantPublic>(demoTenant);
  const [packages, setPackages] = useState<PackagePublic[]>(demoPackages);
  const [websiteConfig, setWebsiteConfig] = useState<WebsiteConfig>(templateDefaults["travel-agency"]);
  const [loading, setLoading] = useState(false);
  const [domainResolution, setDomainResolution] = useState<DomainResolution | null>(null);
  const [domainError, setDomainError] = useState<{ hostname: string; error?: string } | null>(null);

  useEffect(() => {
    const resolution = resolveHostname();
    setDomainResolution(resolution);

    // If a prop slug is provided, use it directly
    const identifier = propSlug || resolution.slug;

    async function loadTenantData() {
      setLoading(true);
      setDomainError(null);

      try {
        if (identifier) {
          // Slug-based resolution (subdomain or prop)
          const [t, p, w] = await Promise.all([
            publicApi.getTenant(identifier),
            publicApi.getPackages(identifier),
            websiteApi.getPublicConfig(identifier),
          ]);
          setTenant(t);
          setPackages(p);
          setWebsiteConfig(w);
        } else if (resolution.type === "custom-domain" && resolution.customDomain) {
          // Custom domain resolution
          const [t, p, w] = await Promise.all([
            publicApi.getTenantByDomain(resolution.customDomain),
            publicApi.getPackagesByDomain(resolution.customDomain),
            websiteApi.getPublicConfigByDomain(resolution.customDomain),
          ]);
          setTenant(t);
          setPackages(p);
          setWebsiteConfig(w);
        }
        // main-app type with no slug → use demo data (already set)
      } catch (err: any) {
        // If we were trying to resolve a real tenant (not demo), show error
        if (identifier || resolution.type === "custom-domain") {
          setDomainError({
            hostname: resolution.hostname,
            error: err.message,
          });
        }
      } finally {
        setLoading(false);
      }
    }

    if (identifier || resolution.type === "custom-domain") {
      loadTenantData();
    }
  }, [propSlug]);

  // Show domain error page if tenant resolution failed
  if (domainError) {
    return <DomainErrorPage hostname={domainError.hostname} error={domainError.error} />;
  }

  return (
    <WebsiteContext.Provider value={{ tenant, packages, websiteConfig, loading, domainResolution }}>
      {children}
    </WebsiteContext.Provider>
  );
};
