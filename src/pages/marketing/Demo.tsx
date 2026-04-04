import { useState } from "react";
import MarketingLayout from "@/components/MarketingLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { Calendar, CheckCircle2, Clock, Monitor, Users, Zap } from "lucide-react";
import { publicApi } from "@/lib/publicApi";

const Demo = () => {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    name: "", email: "", phone: "", company: "", teamSize: "", message: "",
  });

  const update = (key: string, val: string) => setForm((p) => ({ ...p, [key]: val }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await publicApi.submitDemo(form);
      toast({ title: "Demo Request Submitted!", description: "Our team will contact you within 24 hours to schedule your personalized demo." });
      setForm({ name: "", email: "", phone: "", company: "", teamSize: "", message: "" });
    } catch (err: any) {
      toast({ title: "Error", description: err.message || "Failed to submit. Please try again.", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  return (
    <MarketingLayout
      title="Book a Demo — Travel Agency Website & Software Solution"
      description="Schedule a personalized demo. See how our travel agency management platform can streamline your operations."
    >
      {/* Hero */}
      <section className="relative overflow-hidden py-16 md:py-24">
        <div className="absolute inset-0 opacity-15" style={{
          backgroundImage: "radial-gradient(circle at 30% 40%, #06b6d4, transparent 50%)",
        }} />
        <div className="container mx-auto px-4 text-center relative">
          <Badge className="mb-6 bg-cyan-400/10 text-cyan-400 border-cyan-400/30 text-sm px-4 py-1.5">
            <Calendar className="mr-1.5 h-3.5 w-3.5 inline" />Free Personalized Demo
          </Badge>
          <h1 className="text-4xl md:text-5xl font-extrabold tracking-tight mb-4">
            See Globex Connect in Action
          </h1>
          <p className="text-lg text-white/50 max-w-2xl mx-auto">
            Book a 30-minute walkthrough tailored to your agency's workflow. We'll show you exactly how to manage leads, quotations, bookings, and payments.
          </p>
        </div>
      </section>

      {/* Form + Benefits */}
      <section className="py-16">
        <div className="container mx-auto px-4">
          <div className="grid lg:grid-cols-2 gap-12 max-w-6xl mx-auto">
            {/* Form */}
            <Card className="bg-white/5 border-white/10 text-white">
              <CardHeader>
                <CardTitle className="text-xl">Request Your Demo</CardTitle>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div className="grid sm:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label className="text-white/70">Full Name *</Label>
                      <Input value={form.name} onChange={(e) => update("name", e.target.value)} placeholder="Your name" required className="bg-white/5 border-white/15 text-white placeholder:text-white/30" />
                    </div>
                    <div className="space-y-2">
                      <Label className="text-white/70">Company Name *</Label>
                      <Input value={form.company} onChange={(e) => update("company", e.target.value)} placeholder="Your travel agency" required className="bg-white/5 border-white/15 text-white placeholder:text-white/30" />
                    </div>
                  </div>
                  <div className="grid sm:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label className="text-white/70">Email *</Label>
                      <Input type="email" value={form.email} onChange={(e) => update("email", e.target.value)} placeholder="you@agency.com" required className="bg-white/5 border-white/15 text-white placeholder:text-white/30" />
                    </div>
                    <div className="space-y-2">
                      <Label className="text-white/70">Phone *</Label>
                      <Input value={form.phone} onChange={(e) => update("phone", e.target.value)} placeholder="+880 1XXX-XXXXXX" required className="bg-white/5 border-white/15 text-white placeholder:text-white/30" />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label className="text-white/70">Team Size</Label>
                    <Select value={form.teamSize} onValueChange={(v) => update("teamSize", v)}>
                      <SelectTrigger className="bg-white/5 border-white/15 text-white"><SelectValue placeholder="How many people?" /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="1-3">Just me / 1-3 people</SelectItem>
                        <SelectItem value="4-10">4-10 people</SelectItem>
                        <SelectItem value="11-30">11-30 people</SelectItem>
                        <SelectItem value="30+">30+ people</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label className="text-white/70">What would you like to see?</Label>
                    <Textarea value={form.message} onChange={(e) => update("message", e.target.value)} placeholder="E.g. CRM, booking management, Hajj/Umrah module, invoicing..." rows={4} className="bg-white/5 border-white/15 text-white placeholder:text-white/30" />
                  </div>
                  <Button type="submit" disabled={loading} className="w-full h-11 bg-gradient-to-r from-cyan-500 to-blue-500 hover:from-cyan-600 hover:to-blue-600 text-white">
                    {loading ? "Submitting..." : "Request Demo"}
                  </Button>
                </form>
              </CardContent>
            </Card>

            {/* Benefits */}
            <div className="space-y-8">
              <div>
                <h3 className="text-xl font-bold mb-6">What to Expect</h3>
                <div className="space-y-5">
                  {[
                    { icon: Monitor, title: "Live Product Walkthrough", desc: "See every feature in action — from lead capture to invoice generation. We'll tailor the demo to your business type." },
                    { icon: Users, title: "Q&A With Our Team", desc: "Ask anything about setup, migration, pricing, or specific travel workflows. Our team has deep travel industry experience." },
                    { icon: Zap, title: "Get Started Same Day", desc: "After the demo, you can start your 14-day free trial immediately. We'll help you import existing data if needed." },
                    { icon: Clock, title: "30 Minutes, No Pressure", desc: "A quick, focused session. No long sales pitch — just a straightforward demo of how the platform works for agencies like yours." },
                  ].map((item) => (
                    <div key={item.title} className="flex gap-4">
                      <div className="w-10 h-10 rounded-xl bg-cyan-400/10 flex items-center justify-center shrink-0">
                        <item.icon className="h-5 w-5 text-cyan-400" />
                      </div>
                      <div>
                        <h4 className="font-semibold mb-1">{item.title}</h4>
                        <p className="text-sm text-white/50">{item.desc}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="p-6 rounded-2xl bg-white/5 border border-white/10">
                <h4 className="font-semibold mb-3">Trusted by Travel Agencies</h4>
                <div className="space-y-3">
                  {[
                    "\"The demo showed us exactly how to replace our spreadsheets. We signed up the same day.\" — Al-Amin Tours",
                    "\"They understood our Hajj business perfectly. The pilgrim management module was exactly what we needed.\" — Noor Umrah Services",
                  ].map((q, i) => (
                    <p key={i} className="text-sm text-white/40 italic">{q}</p>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
    </MarketingLayout>
  );
};

export default Demo;
