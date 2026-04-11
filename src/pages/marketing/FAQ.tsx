import { useState } from "react";
import { Link } from "react-router-dom";
import MarketingLayout from "@/components/MarketingLayout";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ChevronDown, HelpCircle, MessageCircle } from "lucide-react";

const BRAND = "Travel Agency Website & Software Solution";

const faqCategories = [
  {
    category: "General",
    questions: [
      { q: `What is ${BRAND}?`, a: `${BRAND} is a complete travel agency management platform. It helps you manage leads, create quotations, confirm bookings, generate invoices, track payments, handle vendors, and run reports — all in one place. It's built specifically for travel agencies and tour operators.` },
      { q: `Who is this platform designed for?`, a: "It's designed for travel agencies, tour operators, Hajj/Umrah service providers, and any business that handles travel bookings. Whether you're a single-person agency or a team of 50+, the platform scales with your needs." },
      { q: "Can I use this for Hajj and Umrah services?", a: "Yes. We have a dedicated Hajj/Umrah module that handles pilgrim registration, package creation with hotel class and transport, room allocation, family grouping, mahram tracking, installment plans, and departure management." },
      { q: "Do I need any technical knowledge to use this?", a: "No. Our platform is designed for travel professionals, not developers. The interface is straightforward — if you can use Facebook or WhatsApp, you can use our platform." },
    ],
  },
  {
    category: "Pricing & Plans",
    questions: [
      { q: "Is there a free plan?", a: "Yes. The Free plan includes up to 50 clients, 50 bookings per month, basic invoicing, and a subdomain website. It's a great way to get started without any commitment." },
      { q: "What's included in the 14-day free trial?", a: "All paid plans come with a 14-day free trial. You get full access to every feature in your chosen plan — no credit card required. If you don't upgrade after the trial, you'll be moved to the Free plan." },
      { q: "Can I upgrade or downgrade my plan later?", a: "Absolutely. You can upgrade at any time and the change takes effect immediately. Downgrading is also possible at the end of your billing cycle. Your data is always preserved." },
      { q: "What payment methods do you accept?", a: "We accept bank transfer, bKash, and SSLCommerz for subscription payments. For Enterprise plans, we can arrange custom billing." },
    ],
  },
  {
    category: "Features & Capabilities",
    questions: [
      { q: "Can I create and send quotations to clients?", a: "Yes. The quotation builder lets you add multiple items with pricing, apply discounts, and generate professional PDF quotations. You can track their status (Draft, Sent, Approved, Rejected, Expired) and convert approved quotes directly into bookings." },
      { q: "How does the booking management work?", a: "Bookings support multiple types: tours, flights, hotels, visas, and transport. Each booking can have travelers with passport details, vendor assignments, document uploads, an operations checklist, and a full event timeline. You can also track payment status per booking." },
      { q: "Can I manage vendor costs and track profitability?", a: "Yes. You can assign vendor costs to bookings, track vendor bills (Unpaid, Partial, Paid, Overdue), and see booking-level profitability showing selling price minus vendor cost for gross profit margins." },
      { q: "What reports are available?", a: "Reports include: sales analytics, lead-to-booking conversion, payment collection vs outstanding, vendor payable summaries, staff performance comparisons, and booking-level profitability. All reports support date range filters and CSV export." },
      { q: "Can I control what my team members can access?", a: "Yes. Role-based access control lets you define permissions per module (create, edit, delete, approve, export). Built-in roles include Owner, Manager, Accountant, Sales Agent, and Operations staff. You can also create custom roles." },
    ],
  },
  {
    category: "Security & Data",
    questions: [
      { q: "Is my data secure?", a: "Yes. Each agency gets a completely isolated workspace. Your data is never shared with other agencies. We use encrypted connections, secure authentication, and regular backups." },
      { q: "Can I export my data?", a: "Yes. Most reports and tables support CSV export. You can also export client lists, booking data, and financial records at any time." },
      { q: "Where is the data stored?", a: "Your data is stored on secure servers. We follow industry-standard practices for data protection and privacy. See our Privacy Policy for full details." },
    ],
  },
  {
    category: "Support",
    questions: [
      { q: "How do I get support?", a: "Free plan users get community support. Basic and Pro plans include email support with 24-hour response times. Business and Enterprise plans get priority support with faster response and dedicated contacts." },
      { q: "Do you offer onboarding help?", a: "Yes. All paid plans include basic onboarding guidance. Enterprise plans get a dedicated onboarding manager who helps with data migration, team training, and custom setup." },
      { q: "Can I request a new feature?", a: "Absolutely. We actively listen to our users. You can submit feature requests through our support channel. Many current features were built based on travel agency feedback." },
    ],
  },
];

const FAQ = () => {
  const [openItems, setOpenItems] = useState<Record<string, boolean>>({});

  const toggle = (key: string) => {
    setOpenItems((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  return (
    <MarketingLayout
      title={`FAQ — ${BRAND}`}
      description={`Frequently asked questions about ${BRAND} — pricing, features, security, and support for travel agencies and tour operators.`}
    >
      {/* Hero */}
      <section className="py-16 md:py-24">
        <div className="container mx-auto px-4 text-center">
          <Badge className="mb-6 bg-amber-400/10 text-amber-400 border-amber-400/25 text-sm px-4 py-1.5">
            <HelpCircle className="mr-1.5 h-3.5 w-3.5 inline" />Help Center
          </Badge>
          <h1 className="text-4xl md:text-5xl font-extrabold tracking-tight mb-4">
            Frequently Asked Questions
          </h1>
          <p className="text-lg text-white/45 max-w-2xl mx-auto">
            Everything you need to know about our platform. Can't find what you're looking for? <Link to="/contact-us" className="text-amber-400 hover:underline">Contact our team</Link>.
          </p>
        </div>
      </section>

      {/* FAQ */}
      <section className="pb-20">
        <div className="container mx-auto px-4 max-w-4xl">
          <div className="space-y-10">
            {faqCategories.map((cat) => (
              <div key={cat.category}>
                <h2 className="text-xl font-bold mb-4 text-amber-400">{cat.category}</h2>
                <div className="space-y-2">
                  {cat.questions.map((item, i) => {
                    const key = `${cat.category}-${i}`;
                    const isOpen = openItems[key];
                    return (
                      <div key={key} className="rounded-xl border border-white/8 bg-white/[0.02] overflow-hidden">
                        <button
                          onClick={() => toggle(key)}
                          className="w-full flex items-center justify-between px-5 py-4 text-left hover:bg-white/[0.03] transition-colors"
                        >
                          <span className="font-medium text-sm pr-4">{item.q}</span>
                          <ChevronDown className={`h-4 w-4 text-white/35 shrink-0 transition-transform ${isOpen ? "rotate-180" : ""}`} />
                        </button>
                        {isOpen && (
                          <div className="px-5 pb-4">
                            <p className="text-sm text-white/45 leading-relaxed">{item.a}</p>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-16 bg-[#0f1729]">
        <div className="container mx-auto px-4 text-center">
          <MessageCircle className="h-10 w-10 text-amber-400 mx-auto mb-4" />
          <h2 className="text-2xl font-bold mb-3">Still Have Questions?</h2>
          <p className="text-white/45 max-w-md mx-auto mb-6">
            Our team is happy to help. Book a personalized demo or send us a message.
          </p>
          <div className="flex gap-4 justify-center flex-wrap">
            <Link to="/demo">
              <Button size="lg" className="bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white px-8 shadow-lg shadow-amber-500/25">
                Book a Demo
              </Button>
            </Link>
            <Link to="/contact-us">
              <Button size="lg" variant="outline" className="border-white/15 bg-white/5 text-white hover:bg-white/10 px-8">
                Contact Support
              </Button>
            </Link>
          </div>
        </div>
      </section>
    </MarketingLayout>
  );
};

export default FAQ;
