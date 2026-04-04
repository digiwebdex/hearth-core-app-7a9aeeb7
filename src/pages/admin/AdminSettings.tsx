import { useState } from "react";
import AdminLayout from "@/components/AdminLayout";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import {
  Settings, Globe, Mail, CreditCard, Upload, Save, Loader2, CheckCircle2,
  Send, Eye, EyeOff, Shield, MessageSquare, Smartphone,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { smsApi, type SmsConfig } from "@/lib/smsApi";

// ── Types ──
interface GeneralSettings {
  appName: string;
  logoUrl: string;
  currency: string;
  currencySymbol: string;
  timezone: string;
  maintenanceMode: boolean;
  supportEmail: string;
  metaDescription: string;
}

interface EmailSettings {
  smtpHost: string;
  smtpPort: number;
  smtpSecure: boolean;
  smtpUser: string;
  smtpPass: string;
  fromName: string;
  fromEmail: string;
  enabled: boolean;
}

interface PaymentSettings {
  sslcommerzStoreId: string;
  sslcommerzStorePass: string;
  sslcommerzSandbox: boolean;
  sslcommerzEnabled: boolean;
  bkashAppKey: string;
  bkashAppSecret: string;
  bkashUsername: string;
  bkashPassword: string;
  bkashSandbox: boolean;
  bkashEnabled: boolean;
  manualPaymentEnabled: boolean;
  manualPaymentInstructions: string;
}

interface DomainSettings {
  mainDomain: string;
  subdomainPrefix: string;
  sslEnabled: boolean;
  customDomainEnabled: boolean;
  defaultSubdomain: string;
}

interface SmsSettings {
  provider: "sslwireless" | "bulksms";
  apiKey: string;
  senderId: string;
  baseUrl: string;
  enabled: boolean;
}

// ── Defaults ──
const defaultGeneral: GeneralSettings = {
  appName: "Travel Agency Website & Software Solution",
  logoUrl: "",
  currency: "BDT",
  currencySymbol: "৳",
  timezone: "Asia/Dhaka",
  maintenanceMode: false,
  supportEmail: "support@travelagencyweb.com",
  metaDescription: "Complete Travel Agency Website & Software Solution",
};

const defaultEmail: EmailSettings = {
  smtpHost: "",
  smtpPort: 587,
  smtpSecure: false,
  smtpUser: "",
  smtpPass: "",
  fromName: "TAWSS",
  fromEmail: "noreply@travelagencyweb.com",
  enabled: false,
};

const defaultPayment: PaymentSettings = {
  sslcommerzStoreId: "",
  sslcommerzStorePass: "",
  sslcommerzSandbox: true,
  sslcommerzEnabled: false,
  bkashAppKey: "",
  bkashAppSecret: "",
  bkashUsername: "",
  bkashPassword: "",
  bkashSandbox: true,
  bkashEnabled: false,
  manualPaymentEnabled: true,
  manualPaymentInstructions: "Send payment to bKash: 01XXXXXXXXX\nOr transfer to bank: [Account Details]",
};

const defaultDomain: DomainSettings = {
  mainDomain: "travelagencyweb.com",
  subdomainPrefix: "app",
  sslEnabled: true,
  customDomainEnabled: true,
  defaultSubdomain: "{company}.travelagencyweb.com",
};

const defaultSms: SmsSettings = {
  provider: "sslwireless",
  apiKey: "",
  senderId: "",
  baseUrl: "",
  enabled: false,
};

const AdminSettings = () => {
  const [general, setGeneral] = useState<GeneralSettings>(defaultGeneral);
  const [email, setEmail] = useState<EmailSettings>(defaultEmail);
  const [payment, setPayment] = useState<PaymentSettings>(defaultPayment);
  const [domain, setDomain] = useState<DomainSettings>(defaultDomain);
  const [sms, setSms] = useState<SmsSettings>(defaultSms);
  const [saving, setSaving] = useState(false);
  const [testEmail, setTestEmail] = useState("");
  const [testPhone, setTestPhone] = useState("");
  const [showPasswords, setShowPasswords] = useState<Record<string, boolean>>({});
  const { toast } = useToast();

  const togglePass = (key: string) => setShowPasswords((p) => ({ ...p, [key]: !p[key] }));

  const handleSave = async (section: string) => {
    setSaving(true);
    // Simulated API call
    await new Promise((r) => setTimeout(r, 800));
    setSaving(false);
    toast({ title: `${section} settings saved`, description: "Changes will take effect immediately." });
  };

  const handleTestEmail = async () => {
    if (!testEmail) return;
    toast({ title: "Test email sent", description: `Sent to ${testEmail}` });
    setTestEmail("");
  };

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight flex items-center gap-2">
            <Settings className="h-8 w-8" /> System Settings
          </h1>
          <p className="text-muted-foreground">Configure global platform settings</p>
        </div>

        <Tabs defaultValue="general" className="space-y-4">
          <TabsList className="grid w-full grid-cols-5">
            <TabsTrigger value="general" className="gap-1.5"><Settings className="h-4 w-4" /> General</TabsTrigger>
            <TabsTrigger value="email" className="gap-1.5"><Mail className="h-4 w-4" /> Email</TabsTrigger>
            <TabsTrigger value="sms" className="gap-1.5"><Smartphone className="h-4 w-4" /> SMS</TabsTrigger>
            <TabsTrigger value="payment" className="gap-1.5"><CreditCard className="h-4 w-4" /> Payment</TabsTrigger>
            <TabsTrigger value="domain" className="gap-1.5"><Globe className="h-4 w-4" /> Domain</TabsTrigger>
          </TabsList>

          {/* ════════ GENERAL ════════ */}
          <TabsContent value="general">
            <Card>
              <CardHeader>
                <CardTitle>General Settings</CardTitle>
                <CardDescription>Basic platform configuration</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label>Application Name</Label>
                    <Input value={general.appName} onChange={(e) => setGeneral({ ...general, appName: e.target.value })} />
                  </div>
                  <div className="space-y-2">
                    <Label>Support Email</Label>
                    <Input type="email" value={general.supportEmail} onChange={(e) => setGeneral({ ...general, supportEmail: e.target.value })} />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>Logo</Label>
                  <div className="flex items-center gap-4">
                    {general.logoUrl ? (
                      <img src={general.logoUrl} alt="Logo" className="h-12 w-12 rounded-md object-cover border" />
                    ) : (
                      <div className="h-12 w-12 rounded-md border border-dashed flex items-center justify-center">
                        <Upload className="h-5 w-5 text-muted-foreground" />
                      </div>
                    )}
                    <Input
                      type="url"
                      placeholder="Logo URL (e.g. https://example.com/logo.png)"
                      value={general.logoUrl}
                      onChange={(e) => setGeneral({ ...general, logoUrl: e.target.value })}
                      className="flex-1"
                    />
                  </div>
                </div>

                <div className="grid gap-4 md:grid-cols-3">
                  <div className="space-y-2">
                    <Label>Currency</Label>
                    <Select value={general.currency} onValueChange={(v) => setGeneral({ ...general, currency: v })}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="BDT">BDT - Bangladeshi Taka</SelectItem>
                        <SelectItem value="USD">USD - US Dollar</SelectItem>
                        <SelectItem value="EUR">EUR - Euro</SelectItem>
                        <SelectItem value="GBP">GBP - British Pound</SelectItem>
                        <SelectItem value="SAR">SAR - Saudi Riyal</SelectItem>
                        <SelectItem value="INR">INR - Indian Rupee</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Currency Symbol</Label>
                    <Input value={general.currencySymbol} onChange={(e) => setGeneral({ ...general, currencySymbol: e.target.value })} maxLength={5} />
                  </div>
                  <div className="space-y-2">
                    <Label>Timezone</Label>
                    <Select value={general.timezone} onValueChange={(v) => setGeneral({ ...general, timezone: v })}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Asia/Dhaka">Asia/Dhaka (GMT+6)</SelectItem>
                        <SelectItem value="Asia/Kolkata">Asia/Kolkata (GMT+5:30)</SelectItem>
                        <SelectItem value="Asia/Riyadh">Asia/Riyadh (GMT+3)</SelectItem>
                        <SelectItem value="UTC">UTC (GMT+0)</SelectItem>
                        <SelectItem value="America/New_York">America/New_York (EST)</SelectItem>
                        <SelectItem value="Europe/London">Europe/London (GMT)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>Meta Description</Label>
                  <Textarea value={general.metaDescription} onChange={(e) => setGeneral({ ...general, metaDescription: e.target.value })} rows={2} maxLength={300} />
                </div>

                <div className="flex items-center justify-between rounded-lg border p-4">
                  <div>
                    <p className="font-medium">Maintenance Mode</p>
                    <p className="text-sm text-muted-foreground">Temporarily disable the platform for all tenants</p>
                  </div>
                  <Switch checked={general.maintenanceMode} onCheckedChange={(v) => setGeneral({ ...general, maintenanceMode: v })} />
                </div>

                <Button onClick={() => handleSave("General")} disabled={saving}>
                  {saving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
                  Save General Settings
                </Button>
              </CardContent>
            </Card>
          </TabsContent>

          {/* ════════ EMAIL ════════ */}
          <TabsContent value="email">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2"><Mail className="h-5 w-5 text-primary" /> Email / SMTP Settings</CardTitle>
                <CardDescription>Configure SMTP server for sending emails platform-wide</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="flex items-center justify-between rounded-lg border p-4">
                  <div>
                    <p className="font-medium">Enable Email System</p>
                    <p className="text-sm text-muted-foreground">Allow sending emails from the platform</p>
                  </div>
                  <Switch checked={email.enabled} onCheckedChange={(v) => setEmail({ ...email, enabled: v })} />
                </div>

                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label>SMTP Host</Label>
                    <Input placeholder="smtp.gmail.com" value={email.smtpHost} onChange={(e) => setEmail({ ...email, smtpHost: e.target.value })} />
                  </div>
                  <div className="space-y-2">
                    <Label>SMTP Port</Label>
                    <Input type="number" placeholder="587" value={email.smtpPort} onChange={(e) => setEmail({ ...email, smtpPort: parseInt(e.target.value) || 587 })} />
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <Switch checked={email.smtpSecure} onCheckedChange={(v) => setEmail({ ...email, smtpSecure: v })} />
                  <Label>Use SSL/TLS</Label>
                </div>

                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label>SMTP Username</Label>
                    <Input placeholder="your@email.com" value={email.smtpUser} onChange={(e) => setEmail({ ...email, smtpUser: e.target.value })} />
                  </div>
                  <div className="space-y-2">
                    <Label>SMTP Password</Label>
                    <div className="relative">
                      <Input
                        type={showPasswords.smtp ? "text" : "password"}
                        placeholder="••••••••"
                        value={email.smtpPass}
                        onChange={(e) => setEmail({ ...email, smtpPass: e.target.value })}
                      />
                      <Button type="button" variant="ghost" size="icon" className="absolute right-1 top-1/2 -translate-y-1/2 h-7 w-7" onClick={() => togglePass("smtp")}>
                        {showPasswords.smtp ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
                      </Button>
                    </div>
                  </div>
                </div>

                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label>From Name</Label>
                    <Input placeholder="GLOBEX Travel" value={email.fromName} onChange={(e) => setEmail({ ...email, fromName: e.target.value })} />
                  </div>
                  <div className="space-y-2">
                    <Label>From Email</Label>
                    <Input type="email" placeholder="noreply@travelagencyweb.com" value={email.fromEmail} onChange={(e) => setEmail({ ...email, fromEmail: e.target.value })} />
                  </div>
                </div>

                <Button onClick={() => handleSave("Email")} disabled={saving}>
                  {saving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
                  Save Email Settings
                </Button>

                {/* Test Email */}
                <div className="pt-4 border-t">
                  <h4 className="text-sm font-semibold mb-3">Send Test Email</h4>
                  <div className="flex gap-2">
                    <Input placeholder="test@example.com" type="email" value={testEmail} onChange={(e) => setTestEmail(e.target.value)} className="max-w-xs" />
                    <Button variant="outline" onClick={handleTestEmail} disabled={!testEmail}>
                      <Send className="mr-2 h-4 w-4" /> Send Test
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* ════════ PAYMENT ════════ */}
          <TabsContent value="payment">
            <div className="space-y-4">
              {/* SSLCommerz */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <CreditCard className="h-5 w-5 text-primary" /> SSLCommerz Configuration
                  </CardTitle>
                  <CardDescription>Accept Visa, Mastercard, Mobile Banking & Internet Banking</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center justify-between rounded-lg border p-4">
                    <div>
                      <p className="font-medium">Enable SSLCommerz</p>
                      <p className="text-sm text-muted-foreground">Allow tenants to accept online payments</p>
                    </div>
                    <Switch checked={payment.sslcommerzEnabled} onCheckedChange={(v) => setPayment({ ...payment, sslcommerzEnabled: v })} />
                  </div>
                  <div className="grid gap-4 md:grid-cols-2">
                    <div className="space-y-2">
                      <Label>Store ID</Label>
                      <Input placeholder="your_store_id" value={payment.sslcommerzStoreId} onChange={(e) => setPayment({ ...payment, sslcommerzStoreId: e.target.value })} />
                    </div>
                    <div className="space-y-2">
                      <Label>Store Password</Label>
                      <div className="relative">
                        <Input
                          type={showPasswords.ssl ? "text" : "password"}
                          placeholder="••••••••"
                          value={payment.sslcommerzStorePass}
                          onChange={(e) => setPayment({ ...payment, sslcommerzStorePass: e.target.value })}
                        />
                        <Button type="button" variant="ghost" size="icon" className="absolute right-1 top-1/2 -translate-y-1/2 h-7 w-7" onClick={() => togglePass("ssl")}>
                          {showPasswords.ssl ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
                        </Button>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <Switch checked={payment.sslcommerzSandbox} onCheckedChange={(v) => setPayment({ ...payment, sslcommerzSandbox: v })} />
                    <Label>Sandbox Mode (Testing)</Label>
                  </div>
                </CardContent>
              </Card>

              {/* bKash */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Shield className="h-5 w-5 text-pink-500" /> bKash Configuration
                  </CardTitle>
                  <CardDescription>Accept payments via bKash mobile wallet</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center justify-between rounded-lg border p-4">
                    <div>
                      <p className="font-medium">Enable bKash</p>
                      <p className="text-sm text-muted-foreground">Allow bKash payment gateway for tenants</p>
                    </div>
                    <Switch checked={payment.bkashEnabled} onCheckedChange={(v) => setPayment({ ...payment, bkashEnabled: v })} />
                  </div>
                  <div className="grid gap-4 md:grid-cols-2">
                    <div className="space-y-2">
                      <Label>App Key</Label>
                      <Input placeholder="bKash App Key" value={payment.bkashAppKey} onChange={(e) => setPayment({ ...payment, bkashAppKey: e.target.value })} />
                    </div>
                    <div className="space-y-2">
                      <Label>App Secret</Label>
                      <div className="relative">
                        <Input
                          type={showPasswords.bkashSecret ? "text" : "password"}
                          placeholder="••••••••"
                          value={payment.bkashAppSecret}
                          onChange={(e) => setPayment({ ...payment, bkashAppSecret: e.target.value })}
                        />
                        <Button type="button" variant="ghost" size="icon" className="absolute right-1 top-1/2 -translate-y-1/2 h-7 w-7" onClick={() => togglePass("bkashSecret")}>
                          {showPasswords.bkashSecret ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
                        </Button>
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label>Username</Label>
                      <Input placeholder="bKash Username" value={payment.bkashUsername} onChange={(e) => setPayment({ ...payment, bkashUsername: e.target.value })} />
                    </div>
                    <div className="space-y-2">
                      <Label>Password</Label>
                      <div className="relative">
                        <Input
                          type={showPasswords.bkashPass ? "text" : "password"}
                          placeholder="••••••••"
                          value={payment.bkashPassword}
                          onChange={(e) => setPayment({ ...payment, bkashPassword: e.target.value })}
                        />
                        <Button type="button" variant="ghost" size="icon" className="absolute right-1 top-1/2 -translate-y-1/2 h-7 w-7" onClick={() => togglePass("bkashPass")}>
                          {showPasswords.bkashPass ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
                        </Button>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <Switch checked={payment.bkashSandbox} onCheckedChange={(v) => setPayment({ ...payment, bkashSandbox: v })} />
                    <Label>Sandbox Mode (Testing)</Label>
                  </div>
                </CardContent>
              </Card>

              {/* Manual Payment */}
              <Card>
                <CardHeader>
                  <CardTitle>Manual Payment Instructions</CardTitle>
                  <CardDescription>Instructions shown to tenants for manual/bank payments</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center justify-between rounded-lg border p-4">
                    <div>
                      <p className="font-medium">Enable Manual Payment</p>
                      <p className="text-sm text-muted-foreground">Allow tenants to submit manual payment requests</p>
                    </div>
                    <Switch checked={payment.manualPaymentEnabled} onCheckedChange={(v) => setPayment({ ...payment, manualPaymentEnabled: v })} />
                  </div>
                  <div className="space-y-2">
                    <Label>Payment Instructions</Label>
                    <Textarea
                      value={payment.manualPaymentInstructions}
                      onChange={(e) => setPayment({ ...payment, manualPaymentInstructions: e.target.value })}
                      rows={4}
                      placeholder="Enter payment instructions for tenants..."
                    />
                  </div>
                </CardContent>
              </Card>

              <Button onClick={() => handleSave("Payment")} disabled={saving}>
                {saving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
                Save Payment Settings
              </Button>
            </div>
          </TabsContent>

          {/* ════════ DOMAIN ════════ */}
          <TabsContent value="domain">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2"><Globe className="h-5 w-5 text-primary" /> Domain Settings</CardTitle>
                <CardDescription>Configure main domain and subdomain allocation for tenants</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label>Main Domain</Label>
                    <Input value={domain.mainDomain} onChange={(e) => setDomain({ ...domain, mainDomain: e.target.value })} placeholder="travelagencyweb.com" />
                    <p className="text-xs text-muted-foreground">The primary domain where the platform is hosted</p>
                  </div>
                  <div className="space-y-2">
                    <Label>Subdomain Prefix</Label>
                    <Input value={domain.subdomainPrefix} onChange={(e) => setDomain({ ...domain, subdomainPrefix: e.target.value })} placeholder="app" />
                    <p className="text-xs text-muted-foreground">Prefix used for tenant subdomains</p>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>Default Subdomain Pattern</Label>
                  <Input value={domain.defaultSubdomain} onChange={(e) => setDomain({ ...domain, defaultSubdomain: e.target.value })} placeholder="{company}.travelagencyweb.com" />
                  <p className="text-xs text-muted-foreground">Use {"{company}"} as placeholder for tenant name</p>
                </div>

                <div className="space-y-3">
                  <div className="flex items-center justify-between rounded-lg border p-4">
                    <div>
                      <p className="font-medium">SSL/HTTPS</p>
                      <p className="text-sm text-muted-foreground">Force HTTPS on all tenant domains</p>
                    </div>
                    <Switch checked={domain.sslEnabled} onCheckedChange={(v) => setDomain({ ...domain, sslEnabled: v })} />
                  </div>
                  <div className="flex items-center justify-between rounded-lg border p-4">
                    <div>
                      <p className="font-medium">Custom Domain Support</p>
                      <p className="text-sm text-muted-foreground">Allow tenants to connect their own domains (Pro+ plans)</p>
                    </div>
                    <Switch checked={domain.customDomainEnabled} onCheckedChange={(v) => setDomain({ ...domain, customDomainEnabled: v })} />
                  </div>
                </div>

                <div className="rounded-lg border bg-muted/50 p-4">
                  <p className="text-sm font-medium mb-2">DNS Configuration Guide</p>
                  <div className="space-y-1 text-xs text-muted-foreground font-mono">
                    <p>A Record: @ → Your Server IP</p>
                    <p>A Record: *.{domain.mainDomain} → Your Server IP</p>
                    <p>CNAME: www → {domain.mainDomain}</p>
                  </div>
                </div>

                <Button onClick={() => handleSave("Domain")} disabled={saving}>
                  {saving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
                  Save Domain Settings
                </Button>
              </CardContent>
            </Card>
          </TabsContent>

          {/* ════════ SMS ════════ */}
          <TabsContent value="sms">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <MessageSquare className="h-5 w-5 text-primary" /> SMS Gateway Settings
                </CardTitle>
                <CardDescription>Configure SMS provider for sending notifications and OTPs</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="flex items-center justify-between rounded-lg border p-4">
                  <div>
                    <p className="font-medium">Enable SMS System</p>
                    <p className="text-sm text-muted-foreground">Allow sending SMS from the platform</p>
                  </div>
                  <Switch checked={sms.enabled} onCheckedChange={(v) => setSms({ ...sms, enabled: v })} />
                </div>

                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label>SMS Provider</Label>
                    <Select value={sms.provider} onValueChange={(v: "sslwireless" | "bulksms") => setSms({ ...sms, provider: v })}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="sslwireless">SSL Wireless</SelectItem>
                        <SelectItem value="bulksms">BulkSMS BD</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Sender ID</Label>
                    <Input
                      placeholder="e.g. GLOBEX"
                      value={sms.senderId}
                      onChange={(e) => setSms({ ...sms, senderId: e.target.value })}
                    />
                    <p className="text-xs text-muted-foreground">Approved sender ID from your provider</p>
                  </div>
                </div>

                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label>API Key</Label>
                    <div className="relative">
                      <Input
                        type={showPasswords.smsApi ? "text" : "password"}
                        placeholder="••••••••"
                        value={sms.apiKey}
                        onChange={(e) => setSms({ ...sms, apiKey: e.target.value })}
                      />
                      <Button type="button" variant="ghost" size="icon" className="absolute right-1 top-1/2 -translate-y-1/2 h-7 w-7" onClick={() => togglePass("smsApi")}>
                        {showPasswords.smsApi ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
                      </Button>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label>Base URL</Label>
                    <Input
                      placeholder={sms.provider === "sslwireless" ? "https://smsplus.sslwireless.com/api/v3" : "https://bulksmsbd.net/api"}
                      value={sms.baseUrl}
                      onChange={(e) => setSms({ ...sms, baseUrl: e.target.value })}
                    />
                    <p className="text-xs text-muted-foreground">Provider API endpoint URL</p>
                  </div>
                </div>

                <Button onClick={() => handleSave("SMS")} disabled={saving}>
                  {saving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
                  Save SMS Settings
                </Button>

                {/* Test SMS */}
                <div className="pt-4 border-t">
                  <h4 className="text-sm font-semibold mb-3">Send Test SMS</h4>
                  <div className="flex gap-2">
                    <Input
                      placeholder="01XXXXXXXXX"
                      type="tel"
                      value={testPhone}
                      onChange={(e) => setTestPhone(e.target.value)}
                      className="max-w-xs"
                    />
                    <Button variant="outline" onClick={async () => {
                      if (!testPhone) return;
                      try {
                        const res = await smsApi.testSms(testPhone);
                        toast({ title: "Test SMS sent!", description: res.success ? "Delivered" : res.error });
                        setTestPhone("");
                      } catch (err: any) {
                        toast({ title: "Test failed", description: err.message, variant: "destructive" });
                      }
                    }} disabled={!testPhone}>
                      <Send className="mr-2 h-4 w-4" /> Send Test
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </AdminLayout>
  );
};

export default AdminSettings;
