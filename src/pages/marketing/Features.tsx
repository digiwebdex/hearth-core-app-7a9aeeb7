import { Link } from "react-router-dom";
import MarketingLayout from "@/components/MarketingLayout";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Users, FileText, Plane, Receipt, Store, Shield, BarChart3, Moon,
  Target, ArrowRight, CheckCircle2, Zap, Globe, CreditCard, Send,
  Calendar, UserCheck, Briefcase, MapPin,
} from "lucide-react";

const featureGroups = [
  {
    icon: Target,
    title: "Leads & CRM",
    desc: "Capture every travel inquiry and convert them into loyal clients with a purpose-built CRM.",
    color: "from-cyan-500/20 to-blue-500/20",
    points: [
      "Track leads from Facebook, WhatsApp, walk-ins, and referrals",
      "Stage-based pipeline: New → Contacted → Qualified → Quoted → Won",
      "Assign leads to sales agents with follow-up reminders",
      "Lead timeline with notes, calls, and quotations sent",
      "One-click conversion from lead to client and booking",
    ],
  },
  {
    icon: FileText,
    title: "Quotations & Itineraries",
    desc: "Build professional travel quotations with itemized pricing and send them directly to clients.",
    color: "from-violet-500/20 to-purple-500/20",
    points: [
      "Multi-item quotation builder with per-item pricing",
      "Status tracking: Draft → Sent → Approved → Rejected → Expired",
      "Version history for revised quotations",
      "PDF-ready and printable quote layout",
      "Convert approved quotes directly into bookings",
    ],
  },
  {
    icon: Plane,
    title: "Bookings & Operations",
    desc: "Manage tour packages, flights, hotels, and visa bookings from confirmation through departure.",
    color: "from-emerald-500/20 to-teal-500/20",
    points: [
      "Booking types: tour, flight, hotel, visa, transport, custom",
      "Traveler passport and document collection per booking",
      "Vendor assignment and cost tracking per service item",
      "Operations checklist and booking timeline",
      "Upcoming departures dashboard with payment status",
    ],
  },
  {
    icon: Receipt,
    title: "Invoices & Payments",
    desc: "Generate invoices, collect payments in installments, and track every transaction with precision.",
    color: "from-amber-500/20 to-orange-500/20",
    points: [
      "Auto-generate invoices from bookings with line items",
      "Partial payments and installment collection support",
      "Multiple methods: cash, bank, bKash, SSLCommerz, card",
      "Payment receipts and overdue reminders",
      "Refund recording with reason and audit trail",
    ],
  },
  {
    icon: Store,
    title: "Vendor Management",
    desc: "Manage hotels, airlines, transport companies, and visa partners with payable tracking.",
    color: "from-rose-500/20 to-pink-500/20",
    points: [
      "Vendor profiles with service type, contact, and notes",
      "Attach vendor cost items to bookings for margin tracking",
      "Vendor bills with payable statuses: Unpaid, Partial, Paid, Overdue",
      "Booking-level profitability: selling price − vendor cost = gross profit",
      "Vendor payment history and interaction timeline",
    ],
  },
  {
    icon: Shield,
    title: "Team & Role Management",
    desc: "Control who can access what with granular role-based permissions across every module.",
    color: "from-sky-500/20 to-indigo-500/20",
    points: [
      "Built-in roles: Owner, Manager, Accountant, Sales Agent, Operations",
      "Module-level permissions: create, edit, delete, approve, export",
      "Sales agents see only their leads and clients",
      "Accountants get finance-specific access without operational data",
      "Custom roles with permission matrix editor",
    ],
  },
  {
    icon: BarChart3,
    title: "Reports & Analytics",
    desc: "Data-driven insights into sales, payments, vendors, staff, and profitability.",
    color: "from-teal-500/20 to-cyan-500/20",
    points: [
      "Sales reports with monthly revenue and booking trends",
      "Lead conversion and quotation approval analytics",
      "Payment collection vs outstanding with overdue tracking",
      "Staff performance comparison by leads, bookings, and revenue",
      "Booking-level profitability with margin analysis",
    ],
  },
  {
    icon: Moon,
    title: "Hajj & Umrah Module",
    desc: "A specialized workflow for managing pilgrimage packages, pilgrims, room allocation, and installment plans.",
    color: "from-yellow-500/20 to-amber-500/20",
    points: [
      "Hajj/Umrah package creation with hotel class, visa, and transport",
      "Pilgrim registration with passport, mahram, and family grouping",
      "Room sharing and allocation management",
      "Installment payment plans per pilgrim",
      "Package-wise profitability and departure tracking",
    ],
  },
];

const Features = () => {
  return (
    <MarketingLayout
      title="Features — Travel Agency Website & Software Solution"
      description="Explore all features — leads, quotations, bookings, invoices, vendor management, reports, and Hajj/Umrah module for travel agencies."
    >
      {/* Hero */}
      <section className="relative overflow-hidden py-20 md:py-28">
        <div className="absolute inset-0 opacity-15" style={{
          backgroundImage: "radial-gradient(circle at 25% 50%, #06b6d4 0%, transparent 50%), radial-gradient(circle at 75% 50%, #0ea5e9 0%, transparent 50%)",
        }} />
        <div className="container mx-auto px-4 text-center relative">
          <Badge className="mb-6 bg-cyan-400/10 text-cyan-400 border-cyan-400/30 text-sm px-4 py-1.5">
            Built for Travel Agencies
          </Badge>
          <h1 className="text-4xl md:text-5xl lg:text-6xl font-extrabold tracking-tight mb-6 leading-tight">
            Everything You Need to Run<br />
            Your <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-blue-400">Travel Business</span>
          </h1>
          <p className="text-lg md:text-xl text-white/50 max-w-3xl mx-auto mb-10">
            From the first inquiry to the final trip — manage leads, quotations, bookings, invoices, vendors,
            and your team with one powerful platform.
          </p>
          <div className="flex gap-4 justify-center flex-wrap">
            <Link to="/pricing">
              <Button size="lg" className="bg-gradient-to-r from-cyan-500 to-blue-500 hover:from-cyan-600 hover:to-blue-600 text-white px-8 h-12">
                <Zap className="mr-2 h-5 w-5" />View Plans
              </Button>
            </Link>
            <Link to="/demo">
              <Button size="lg" variant="outline" className="border-white/20 text-white hover:bg-white/5 px-8 h-12">
                Book a Demo<ArrowRight className="ml-2 h-5 w-5" />
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Workflow */}
      <section className="py-16 bg-[#0d1d35]">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-2xl md:text-3xl font-bold mb-3">The Travel Agency Workflow</h2>
            <p className="text-white/50">How our platform takes you from inquiry to trip completion</p>
          </div>
          <div className="flex flex-wrap justify-center gap-4 md:gap-2 max-w-5xl mx-auto">
            {[
              { icon: Target, label: "Capture Lead" },
              { icon: FileText, label: "Send Quotation" },
              { icon: UserCheck, label: "Win Client" },
              { icon: Plane, label: "Confirm Booking" },
              { icon: Receipt, label: "Invoice & Collect" },
              { icon: MapPin, label: "Manage Trip" },
            ].map((step, i) => (
              <div key={step.label} className="flex items-center gap-2">
                <div className="flex flex-col items-center gap-2 px-4 py-3 rounded-xl bg-white/5 border border-white/10 min-w-[120px]">
                  <step.icon className="h-6 w-6 text-cyan-400" />
                  <span className="text-xs font-medium text-white/70">{step.label}</span>
                </div>
                {i < 5 && <ArrowRight className="h-4 w-4 text-white/20 hidden md:block" />}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Feature Groups */}
      <section className="py-20">
        <div className="container mx-auto px-4">
          <div className="space-y-24">
            {featureGroups.map((group, idx) => (
              <div key={group.title} className={`grid lg:grid-cols-2 gap-12 items-center ${idx % 2 === 1 ? "lg:flex-row-reverse" : ""}`}>
                <div className={idx % 2 === 1 ? "lg:order-2" : ""}>
                  <div className={`w-14 h-14 rounded-2xl bg-gradient-to-br ${group.color} flex items-center justify-center mb-5`}>
                    <group.icon className="h-7 w-7 text-cyan-400" />
                  </div>
                  <h3 className="text-2xl md:text-3xl font-bold mb-3">{group.title}</h3>
                  <p className="text-white/50 mb-6 text-lg">{group.desc}</p>
                  <ul className="space-y-3">
                    {group.points.map((pt) => (
                      <li key={pt} className="flex items-start gap-3">
                        <CheckCircle2 className="h-5 w-5 text-cyan-400 mt-0.5 shrink-0" />
                        <span className="text-white/70 text-sm">{pt}</span>
                      </li>
                    ))}
                  </ul>
                </div>
                <div className={`rounded-2xl bg-gradient-to-br ${group.color} p-8 md:p-12 flex items-center justify-center min-h-[280px] ${idx % 2 === 1 ? "lg:order-1" : ""}`}>
                  <group.icon className="h-24 w-24 text-white/20" />
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20 bg-[#0d1d35]">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-3xl md:text-4xl font-bold mb-4">Ready to Modernize Your Travel Agency?</h2>
          <p className="text-white/50 max-w-xl mx-auto mb-8">
            Join hundreds of travel agencies already using our platform to manage their business end to end.
          </p>
          <div className="flex gap-4 justify-center flex-wrap">
            <Link to="/pricing">
              <Button size="lg" className="bg-gradient-to-r from-cyan-500 to-blue-500 hover:from-cyan-600 hover:to-blue-600 text-white px-8 h-12">
                Start Free Trial
              </Button>
            </Link>
            <Link to="/demo">
              <Button size="lg" variant="outline" className="border-white/20 text-white hover:bg-white/5 px-8 h-12">
                Schedule a Demo
              </Button>
            </Link>
          </div>
        </div>
      </section>
    </MarketingLayout>
  );
};

export default Features;
