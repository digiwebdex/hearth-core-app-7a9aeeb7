import { useState } from "react";
import PublicLayout from "@/components/PublicLayout";
import { useWebsite } from "@/contexts/WebsiteContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { Phone, Mail, MapPin, Clock } from "lucide-react";
import { publicApi } from "@/lib/publicApi";

const SiteContact = () => {
  const { tenant } = useWebsite();
  const [form, setForm] = useState({ name: "", email: "", phone: "", message: "" });
  const [sending, setSending] = useState(false);
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSending(true);
    try {
      await publicApi.submitContact({ ...form, tenantSlug: tenant.slug || undefined });
      toast({ title: "Message sent!", description: "We'll get back to you within 24 hours." });
      setForm({ name: "", email: "", phone: "", message: "" });
    } catch (err: any) {
      toast({ title: "Error", description: err.message || "Failed to send. Please try again.", variant: "destructive" });
    } finally {
      setSending(false);
    }
  };

  return (
    <PublicLayout>
      {/* Header */}
      <section className="bg-primary/5 py-16">
        <div className="container mx-auto px-4 text-center">
          <h1 className="text-4xl font-extrabold tracking-tight mb-4">Contact Us</h1>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Have questions? We'd love to hear from you. Send us a message and we'll respond promptly.
          </p>
        </div>
      </section>

      <section className="py-16">
        <div className="container mx-auto px-4">
          <div className="grid gap-8 lg:grid-cols-2 max-w-5xl mx-auto">
            {/* Contact Form */}
            <Card>
              <CardHeader><CardTitle>Send us a message</CardTitle></CardHeader>
              <CardContent>
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Name</Label>
                      <Input value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} required />
                    </div>
                    <div className="space-y-2">
                      <Label>Phone</Label>
                      <Input type="tel" value={form.phone} onChange={(e) => setForm((f) => ({ ...f, phone: e.target.value }))} />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label>Email</Label>
                    <Input type="email" value={form.email} onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))} required />
                  </div>
                  <div className="space-y-2">
                    <Label>Message</Label>
                    <Textarea rows={5} value={form.message} onChange={(e) => setForm((f) => ({ ...f, message: e.target.value }))} required placeholder="Tell us about your travel plans…" />
                  </div>
                  <Button type="submit" className="w-full" disabled={sending}>
                    {sending ? "Sending…" : "Send Message"}
                  </Button>
                </form>
              </CardContent>
            </Card>

            {/* Contact Info */}
            <div className="space-y-6">
              <Card>
                <CardContent className="pt-6 space-y-4">
                  {tenant.phone && (
                    <div className="flex items-start gap-3">
                      <Phone className="h-5 w-5 text-primary mt-0.5" />
                      <div>
                        <p className="font-medium">Phone</p>
                        <p className="text-sm text-muted-foreground">{tenant.phone}</p>
                      </div>
                    </div>
                  )}
                  {tenant.email && (
                    <div className="flex items-start gap-3">
                      <Mail className="h-5 w-5 text-primary mt-0.5" />
                      <div>
                        <p className="font-medium">Email</p>
                        <p className="text-sm text-muted-foreground">{tenant.email}</p>
                      </div>
                    </div>
                  )}
                  {tenant.address && (
                    <div className="flex items-start gap-3">
                      <MapPin className="h-5 w-5 text-primary mt-0.5" />
                      <div>
                        <p className="font-medium">Address</p>
                        <p className="text-sm text-muted-foreground">{tenant.address}</p>
                      </div>
                    </div>
                  )}
                  <div className="flex items-start gap-3">
                    <Clock className="h-5 w-5 text-primary mt-0.5" />
                    <div>
                      <p className="font-medium">Business Hours</p>
                      <p className="text-sm text-muted-foreground">Sat - Thu: 9:00 AM - 7:00 PM</p>
                      <p className="text-sm text-muted-foreground">Friday: Closed</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="pt-6">
                  <h3 className="font-semibold mb-2">Follow Us</h3>
                  <div className="flex gap-3">
                    {tenant.socialLinks?.facebook && <a href={tenant.socialLinks.facebook} className="text-muted-foreground hover:text-primary text-sm">Facebook</a>}
                    {tenant.socialLinks?.instagram && <a href={tenant.socialLinks.instagram} className="text-muted-foreground hover:text-primary text-sm">Instagram</a>}
                    {tenant.socialLinks?.twitter && <a href={tenant.socialLinks.twitter} className="text-muted-foreground hover:text-primary text-sm">Twitter</a>}
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </section>
    </PublicLayout>
  );
};

export default SiteContact;
