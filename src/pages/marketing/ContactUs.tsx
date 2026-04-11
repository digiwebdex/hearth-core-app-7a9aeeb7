import { useState } from "react";
import MarketingLayout from "@/components/MarketingLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { Phone, Mail, MapPin, Clock, Send, MessageCircle } from "lucide-react";
import { publicApi } from "@/lib/publicApi";

const ContactUs = () => {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({ name: "", email: "", phone: "", subject: "", message: "" });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await publicApi.submitContact(form);
      toast({ title: "Message Sent!", description: "We'll get back to you within 24 hours." });
      setForm({ name: "", email: "", phone: "", subject: "", message: "" });
    } catch (err: any) {
      toast({ title: "Error", description: err.message || "Failed to send. Please try again.", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  return (
    <MarketingLayout
      title="Contact Us — Travel Agency Website & Software Solution"
      description="Get in touch with us for support, sales inquiries, or partnership opportunities."
    >
      {/* Hero */}
      <section className="py-16 md:py-20">
        <div className="container mx-auto px-4 text-center">
          <Badge className="mb-6 bg-amber-400/10 text-amber-400 border-amber-400/25 text-sm px-4 py-1.5">
            <MessageCircle className="mr-1.5 h-3.5 w-3.5 inline" />We're Here to Help
          </Badge>
          <h1 className="text-4xl md:text-5xl font-extrabold tracking-tight mb-4">
            Contact Us
          </h1>
          <p className="text-lg text-white/45 max-w-2xl mx-auto">
            Have a question about our platform, need help with your account, or want to explore partnership opportunities? We'd love to hear from you.
          </p>
        </div>
      </section>

      {/* Form + Info */}
      <section className="pb-20">
        <div className="container mx-auto px-4">
          <div className="grid lg:grid-cols-5 gap-10 max-w-6xl mx-auto">
            {/* Form */}
            <div className="lg:col-span-3">
              <Card className="bg-white/[0.04] border-white/8 text-white">
                <CardHeader>
                  <CardTitle>Send Us a Message</CardTitle>
                </CardHeader>
                <CardContent>
                  <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="grid sm:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label className="text-white/60">Name *</Label>
                        <Input value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} placeholder="Your name" required className="bg-white/5 border-white/12 text-white placeholder:text-white/25" />
                      </div>
                      <div className="space-y-2">
                        <Label className="text-white/60">Phone</Label>
                        <Input value={form.phone} onChange={(e) => setForm((f) => ({ ...f, phone: e.target.value }))} placeholder="+880 1XXX-XXXXXX" className="bg-white/5 border-white/12 text-white placeholder:text-white/25" />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label className="text-white/60">Email *</Label>
                      <Input type="email" value={form.email} onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))} placeholder="you@company.com" required className="bg-white/5 border-white/12 text-white placeholder:text-white/25" />
                    </div>
                    <div className="space-y-2">
                      <Label className="text-white/60">Subject *</Label>
                      <Input value={form.subject} onChange={(e) => setForm((f) => ({ ...f, subject: e.target.value }))} placeholder="How can we help?" required className="bg-white/5 border-white/12 text-white placeholder:text-white/25" />
                    </div>
                    <div className="space-y-2">
                      <Label className="text-white/60">Message *</Label>
                      <Textarea value={form.message} onChange={(e) => setForm((f) => ({ ...f, message: e.target.value }))} placeholder="Tell us more about your inquiry..." rows={5} required className="bg-white/5 border-white/12 text-white placeholder:text-white/25" />
                    </div>
                    <Button type="submit" disabled={loading} className="w-full h-11 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white shadow-lg shadow-amber-500/20">
                      <Send className="mr-2 h-4 w-4" />{loading ? "Sending..." : "Send Message"}
                    </Button>
                  </form>
                </CardContent>
              </Card>
            </div>

            {/* Contact Info */}
            <div className="lg:col-span-2 space-y-6">
              {[
                { icon: Phone, title: "Phone", value: "+880 1234-567890", sub: "Sat-Thu, 9 AM - 7 PM" },
                { icon: Mail, title: "Email", value: "support@travelagencyweb.com", sub: "We reply within 24 hours" },
                { icon: MapPin, title: "Office", value: "Dhaka, Bangladesh", sub: "By appointment only" },
                { icon: Clock, title: "Business Hours", value: "Saturday - Thursday", sub: "9:00 AM - 7:00 PM (BST)" },
              ].map((item) => (
                <div key={item.title} className="p-5 rounded-xl bg-white/[0.04] border border-white/8">
                  <div className="flex gap-4">
                    <div className="w-10 h-10 rounded-lg bg-amber-400/10 flex items-center justify-center shrink-0">
                      <item.icon className="h-5 w-5 text-amber-400" />
                    </div>
                    <div>
                      <h3 className="font-semibold mb-0.5">{item.title}</h3>
                      <p className="text-sm text-white/60">{item.value}</p>
                      <p className="text-xs text-white/35">{item.sub}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>
    </MarketingLayout>
  );
};

export default ContactUs;
