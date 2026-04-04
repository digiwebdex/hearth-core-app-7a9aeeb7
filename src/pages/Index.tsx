import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import MarketingLayout from "@/components/MarketingLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { PLANS, type PlanType } from "@/lib/plans";
import {
  Plane, Globe, Users, CreditCard, BarChart3, Shield, Moon, Receipt,
  Check, X, ArrowRight, Star, Zap, Crown, Rocket, Gem,
  Target, FileText, Store, UserCheck, MapPin, ChevronDown, Quote,
} from "lucide-react";

const BRAND = "Travel Agency Website & Software Solution";

const planIcons: Record<string, React.ElementType> = { free: Star, basic: Zap, pro: Crown, business: Rocket, enterprise: Gem };

const features = [
  { icon: Target, title: "Leads & CRM", desc: "Capture inquiries from any source and convert them into loyal clients with stage-based pipelines" },
  { icon: FileText, title: "Quotations", desc: "Build itemized travel quotations with PDF export and one-click conversion to bookings" },
  { icon: Plane, title: "Booking Management", desc: "Handle tours, flights, hotels, and visa bookings with traveler docs and vendor tracking" },
  { icon: Receipt, title: "Invoices & Payments", desc: "Generate invoices, collect installments via bKash, SSLCommerz, or bank transfer" },
  { icon: Store, title: "Vendor Management", desc: "Track vendor costs, payables, and calculate booking-level profitability" },
  { icon: Shield, title: "Team & Permissions", desc: "Role-based access for owners, managers, sales agents, accountants, and operations" },
  { icon: BarChart3, title: "Reports & Analytics", desc: "Sales, leads, payments, vendors, staff performance, and profitability reports" },
  { icon: Moon, title: "Hajj & Umrah", desc: "Pilgrim management, room allocation, family grouping, and installment plans" },
];

const testimonials = [
  { name: "Rafiq Ahmed", role: "Owner, Al-Baraka Tours", text: "Before this platform, we managed everything on spreadsheets. Now our team handles 3x more bookings with less confusion. The quotation-to-booking flow alone saved us hours every week." },
  { name: "Fatima Begum", role: "Operations Manager, Skyway Travel", text: "The vendor payable tracking is a game changer. We finally know exactly how much we owe each hotel and transport partner — and our profit margins are visible in real time." },
  { name: "Kamal Hossain", role: "Director, Noor Hajj Services", text: "The Hajj/Umrah module is exactly what we needed. Managing 500+ pilgrims with room allocation, installment plans, and document tracking used to be a nightmare. Not anymore." },
];

const faqItems = [
  { q: "Who is this platform for?", a: "It's built for travel agencies, tour operators, ticketing offices, and Hajj/Umrah service providers in Bangladesh and beyond." },
  { q: "Is there a free plan?", a: "Yes — start with up to 50 clients and 50 bookings for free. Upgrade when you're ready." },
  { q: "Do I need technical skills?", a: "No. If you can use WhatsApp, you can use our platform. No coding or IT team required." },
  { q: "Can I try paid features before committing?", a: "All paid plans include a 14-day free trial with full feature access. No credit card needed." },
];

const Index = () => {
  const { toast } = useToast();
  const { register } = useAuth();
  const navigate = useNavigate();
  const [selectedPlan, setSelectedPlan] = useState<string | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({ companyName: "", ownerName: "", email: "", phone: "", password: "", address: "", website: "", employees: "", message: "" });
  const [openFaq, setOpenFaq] = useState<number | null>(null);

  const handleSelectPlan = (planId: string) => { setSelectedPlan(planId); setDialogOpen(true); };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const newUser = await register({ name: form.ownerName, email: form.email, password: form.password, tenantName: form.companyName });
      toast({ title: "Registration Successful!", description: `Welcome — ${PLANS.find(p => p.id === selectedPlan)?.name} plan` });
      setDialogOpen(false);
      navigate(newUser.role === "owner" ? "/admin" : "/dashboard");
    } catch (err: any) {
      toast({ variant: "destructive", title: "Registration Failed", description: err.message });
    } finally { setLoading(false); }
  };

  const update = (key: string, val: string) => setForm((p) => ({ ...p, [key]: val }));

  const visiblePlans = PLANS.filter((p) => p.id !== "enterprise");

  return (
    <MarketingLayout
      title={`${BRAND} — Complete Travel Agency Management`}
      description="Manage your travel agency online — leads, quotations, bookings, invoices, payments, vendors, reports, and Hajj/Umrah. Built for agencies in Bangladesh."
    >
      {/* ───── Hero ───── */}
      <section className="relative overflow-hidden py-24 md:py-36">
        <div className="absolute inset-0 opacity-20" style={{
          backgroundImage: "radial-gradient(circle at 30% 40%, #06b6d4 0%, transparent 50%), radial-gradient(circle at 70% 60%, #0ea5e9 0%, transparent 50%)",
        }} />
        <div className="container mx-auto px-4 text-center relative">
          <Badge className="mb-6 bg-cyan-400/10 text-cyan-400 border-cyan-400/30 text-sm px-4 py-1.5">
            🚀 #1 Travel Agency Software in Bangladesh
          </Badge>
          <h1 className="text-4xl md:text-6xl lg:text-7xl font-extrabold tracking-tight mb-6 leading-tight">
            Run Your Entire Travel<br />
            Agency <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-blue-400">From One Platform</span>
          </h1>
          <p className="text-lg md:text-xl text-white/60 max-w-3xl mx-auto mb-10">
            From the first phone call to the final boarding pass — manage leads, send quotations, confirm bookings, collect payments, and track vendors. All in one place.
          </p>
          <div className="flex gap-4 justify-center flex-wrap">
            <Link to="/pricing">
              <Button size="lg" className="bg-gradient-to-r from-cyan-500 to-blue-500 hover:from-cyan-600 hover:to-blue-600 text-white px-8 h-12 text-base">
                <Zap className="mr-2 h-5 w-5" />Start Free Trial
              </Button>
            </Link>
            <Link to="/demo">
              <Button size="lg" variant="outline" className="border-white/20 bg-transparent text-white hover:bg-white/5 px-8 h-12 text-base">
                Book a Demo<ArrowRight className="ml-2 h-5 w-5" />
              </Button>
            </Link>
          </div>

          {/* Stats */}
          <div className="mt-20 grid grid-cols-2 md:grid-cols-4 gap-6 max-w-3xl mx-auto">
            {[
              { val: "500+", label: "Travel Agencies" },
              { val: "50K+", label: "Bookings Managed" },
              { val: "99.9%", label: "Uptime" },
              { val: "24/7", label: "Support" },
            ].map((s) => (
              <div key={s.label} className="text-center">
                <p className="text-3xl font-bold text-cyan-400">{s.val}</p>
                <p className="text-sm text-white/50 mt-1">{s.label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ───── Workflow ───── */}
      <section className="py-20 bg-[#0d1d35]">
        <div className="container mx-auto px-4">
          <div className="text-center mb-14">
            <Badge className="mb-4 bg-cyan-400/10 text-cyan-400 border-cyan-400/30">How It Works</Badge>
            <h2 className="text-3xl md:text-4xl font-bold mb-4">From Inquiry to Trip — Simplified</h2>
            <p className="text-white/50 max-w-2xl mx-auto">
              A complete workflow that mirrors how travel agencies actually operate.
            </p>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 max-w-5xl mx-auto">
            {[
              { icon: Target, label: "Capture Lead", sub: "From any source" },
              { icon: FileText, label: "Send Quote", sub: "Professional PDF" },
              { icon: UserCheck, label: "Win Client", sub: "Auto-convert" },
              { icon: Plane, label: "Book Trip", sub: "All travel types" },
              { icon: Receipt, label: "Collect Payment", sub: "Multiple methods" },
              { icon: MapPin, label: "Manage Trip", sub: "Docs & operations" },
            ].map((step, i) => (
              <div key={step.label} className="flex flex-col items-center text-center">
                <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-cyan-500/20 to-blue-500/20 flex items-center justify-center mb-3 relative">
                  <step.icon className="h-7 w-7 text-cyan-400" />
                  <span className="absolute -top-2 -right-2 w-6 h-6 rounded-full bg-cyan-400 text-[#0a1628] text-xs font-bold flex items-center justify-center">{i + 1}</span>
                </div>
                <h3 className="font-semibold text-sm mb-0.5">{step.label}</h3>
                <p className="text-xs text-white/40">{step.sub}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ───── Features ───── */}
      <section className="py-24">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <Badge className="mb-4 bg-cyan-400/10 text-cyan-400 border-cyan-400/30">Features</Badge>
            <h2 className="text-3xl md:text-4xl font-bold mb-4">Built for Travel Professionals</h2>
            <p className="text-white/50 max-w-2xl mx-auto">
              Every module is designed around how travel agencies actually work — not generic business software.
            </p>
          </div>
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {features.map((f) => (
              <div key={f.title} className="p-6 rounded-2xl bg-white/5 border border-white/10 hover:border-cyan-400/30 hover:bg-white/[0.07] transition-all group">
                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-cyan-500/20 to-blue-500/20 flex items-center justify-center mb-4 group-hover:from-cyan-500/30 group-hover:to-blue-500/30 transition-all">
                  <f.icon className="h-6 w-6 text-cyan-400" />
                </div>
                <h3 className="font-semibold text-lg mb-2">{f.title}</h3>
                <p className="text-sm text-white/50">{f.desc}</p>
              </div>
            ))}
          </div>
          <div className="text-center mt-10">
            <Link to="/features">
              <Button variant="outline" className="border-white/20 bg-transparent text-white hover:bg-white/5">
                See All Features<ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* ───── Pricing Preview ───── */}
      <section className="py-24 bg-[#0d1d35]">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <Badge className="mb-4 bg-cyan-400/10 text-cyan-400 border-cyan-400/30">Pricing</Badge>
            <h2 className="text-3xl md:text-4xl font-bold mb-4">Plans for Every Agency Size</h2>
            <p className="text-white/50 max-w-2xl mx-auto">
              Start free. Upgrade when you need more power. 14-day trial on all paid plans.
            </p>
          </div>
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4 max-w-6xl mx-auto">
            {visiblePlans.map((plan) => {
              const Icon = planIcons[plan.id] || Star;
              const isHighlighted = plan.badge === "Most Popular" || plan.badge === "Best Value";
              return (
                <Card key={plan.id} className={`relative overflow-hidden bg-white/5 border-white/10 text-white ${isHighlighted ? "ring-2 ring-cyan-400 border-cyan-400/50 md:scale-105 z-10" : "hover:border-white/20"} transition-all`}>
                  {plan.badge && (
                    <div className={`absolute top-0 right-0 text-white text-xs font-bold px-3 py-1 rounded-bl-xl ${plan.badge === "Most Popular" ? "bg-gradient-to-r from-cyan-500 to-blue-500" : "bg-gradient-to-r from-emerald-500 to-teal-500"}`}>
                      {plan.badge.toUpperCase()}
                    </div>
                  )}
                  <CardHeader className="pb-2 text-center">
                    <Icon className="mx-auto h-8 w-8 text-cyan-400 mb-2" />
                    <CardTitle className="text-lg">{plan.name}</CardTitle>
                    <CardDescription className="text-white/50 text-xs">{plan.description}</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="text-center">
                      {plan.price === 0 ? (
                        <span className="text-3xl font-extrabold text-cyan-400">Free</span>
                      ) : (
                        <>
                          <span className="text-3xl font-extrabold text-cyan-400">৳{plan.price.toLocaleString()}</span>
                          <span className="text-white/50 text-sm ml-1">/month</span>
                        </>
                      )}
                    </div>
                    <Separator className="bg-white/10" />
                    <ul className="space-y-2">
                      {plan.features.slice(0, 4).map((f) => (
                        <li key={f} className="flex items-start gap-2 text-xs"><Check className="h-3.5 w-3.5 text-cyan-400 mt-0.5 shrink-0" /><span className="text-white/70">{f}</span></li>
                      ))}
                    </ul>
                    <Button className={`w-full h-10 text-sm ${isHighlighted ? "bg-gradient-to-r from-cyan-500 to-blue-500 hover:from-cyan-600 hover:to-blue-600 text-white" : "bg-white/10 hover:bg-white/15 text-white"}`} onClick={() => handleSelectPlan(plan.id)}>
                      {plan.price === 0 ? "Start Free" : "Start Trial"}<ArrowRight className="ml-2 h-4 w-4" />
                    </Button>
                  </CardContent>
                </Card>
              );
            })}
          </div>
          <div className="text-center mt-10">
            <Link to="/pricing">
              <Button variant="outline" className="border-white/20 bg-transparent text-white hover:bg-white/5">
                Compare All Plans<ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* ───── Testimonials ───── */}
      <section className="py-24">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <Badge className="mb-4 bg-cyan-400/10 text-cyan-400 border-cyan-400/30">Testimonials</Badge>
            <h2 className="text-3xl md:text-4xl font-bold mb-4">Trusted by Travel Agencies</h2>
            <p className="text-white/50">Hear from agencies already using our platform</p>
          </div>
          <div className="grid gap-6 md:grid-cols-3 max-w-5xl mx-auto">
            {testimonials.map((t) => (
              <Card key={t.name} className="bg-white/5 border-white/10 text-white">
                <CardContent className="pt-6">
                  <Quote className="h-8 w-8 text-cyan-400/30 mb-3" />
                  <p className="text-sm text-white/60 mb-4 leading-relaxed">{t.text}</p>
                  <Separator className="bg-white/10 mb-3" />
                  <div>
                    <p className="font-semibold text-sm">{t.name}</p>
                    <p className="text-xs text-white/40">{t.role}</p>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* ───── FAQ ───── */}
      <section className="py-24 bg-[#0d1d35]">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <Badge className="mb-4 bg-cyan-400/10 text-cyan-400 border-cyan-400/30">FAQ</Badge>
            <h2 className="text-3xl md:text-4xl font-bold mb-4">Common Questions</h2>
          </div>
          <div className="max-w-2xl mx-auto space-y-2">
            {faqItems.map((item, i) => (
              <div key={i} className="rounded-xl border border-white/10 bg-white/[0.03] overflow-hidden">
                <button onClick={() => setOpenFaq(openFaq === i ? null : i)} className="w-full flex items-center justify-between px-5 py-4 text-left hover:bg-white/[0.02]">
                  <span className="font-medium text-sm pr-4">{item.q}</span>
                  <ChevronDown className={`h-4 w-4 text-white/40 shrink-0 transition-transform ${openFaq === i ? "rotate-180" : ""}`} />
                </button>
                {openFaq === i && <div className="px-5 pb-4"><p className="text-sm text-white/50">{item.a}</p></div>}
              </div>
            ))}
          </div>
          <div className="text-center mt-8">
            <Link to="/faq">
              <Button variant="outline" className="border-white/20 bg-transparent text-white hover:bg-white/5">
                See All FAQs<ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* ───── Final CTA ───── */}
      <section className="py-24">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-3xl md:text-4xl font-bold mb-4">Ready to Modernize Your Travel Agency?</h2>
          <p className="text-white/50 max-w-xl mx-auto mb-8">
            Join hundreds of travel agencies already using our platform. Start free — no credit card required.
          </p>
          <div className="flex gap-4 justify-center flex-wrap">
            <Link to="/pricing">
              <Button size="lg" className="bg-gradient-to-r from-cyan-500 to-blue-500 hover:from-cyan-600 hover:to-blue-600 text-white px-8 h-12 text-base">
                Start Free Trial
              </Button>
            </Link>
            <Link to="/demo">
              <Button size="lg" variant="outline" className="border-white/20 bg-transparent text-white hover:bg-white/5 px-8 h-12 text-base">
                Schedule a Demo
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* ───── Registration Dialog ───── */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto bg-[#0f1f38] border-white/10 text-white">
          <DialogHeader>
            <DialogTitle className="text-xl">Subscribe to <span className="text-cyan-400">{PLANS.find((p) => p.id === selectedPlan)?.name}</span> Plan</DialogTitle>
            <DialogDescription className="text-white/50">Fill in your company details to get started with a 14-day free trial.</DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4 mt-4">
            <div className="p-3 rounded-lg bg-cyan-400/10 border border-cyan-400/20 flex items-center justify-between">
              <span className="text-sm font-medium">{PLANS.find((p) => p.id === selectedPlan)?.name} Plan</span>
              <span className="font-bold text-cyan-400">{(() => { const p = PLANS.find((p) => p.id === selectedPlan); return p?.price === -1 ? "Custom Pricing" : p?.price === 0 ? "Free" : `৳${p?.price.toLocaleString()}/mo`; })()}</span>
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2"><Label className="text-white/70">Company Name *</Label><Input value={form.companyName} onChange={(e) => update("companyName", e.target.value)} placeholder="Your Travel Agency" required className="bg-white/5 border-white/15 text-white placeholder:text-white/30" /></div>
              <div className="space-y-2"><Label className="text-white/70">Owner Name *</Label><Input value={form.ownerName} onChange={(e) => update("ownerName", e.target.value)} placeholder="Full name" required className="bg-white/5 border-white/15 text-white placeholder:text-white/30" /></div>
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2"><Label className="text-white/70">Email *</Label><Input type="email" value={form.email} onChange={(e) => update("email", e.target.value)} placeholder="you@company.com" required className="bg-white/5 border-white/15 text-white placeholder:text-white/30" /></div>
              <div className="space-y-2"><Label className="text-white/70">Phone *</Label><Input value={form.phone} onChange={(e) => update("phone", e.target.value)} placeholder="+880 1XXX-XXXXXX" required className="bg-white/5 border-white/15 text-white placeholder:text-white/30" /></div>
            </div>
            <div className="space-y-2"><Label className="text-white/70">Password *</Label><Input type="password" value={form.password} onChange={(e) => update("password", e.target.value)} placeholder="Min 8 characters" required minLength={8} className="bg-white/5 border-white/15 text-white placeholder:text-white/30" /></div>
            <Button type="submit" disabled={loading} className="w-full h-11 bg-gradient-to-r from-cyan-500 to-blue-500 hover:from-cyan-600 hover:to-blue-600 text-white">
              {loading ? "Creating Account..." : "Start 14-Day Free Trial"}
            </Button>
            <p className="text-center text-xs text-white/30">Already have an account? <Link to="/login" className="text-cyan-400 underline">Sign in</Link></p>
          </form>
        </DialogContent>
      </Dialog>
    </MarketingLayout>
  );
};

export default Index;