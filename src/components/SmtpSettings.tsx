import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Mail, Send, Loader2, CheckCircle2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { emailApi, type SmtpConfig } from "@/lib/emailApi";

const defaultConfig: SmtpConfig = {
  host: "",
  port: 587,
  secure: false,
  user: "",
  pass: "",
  fromName: "",
  fromEmail: "",
};

const SmtpSettings = () => {
  const [config, setConfig] = useState<SmtpConfig>(defaultConfig);
  const [testEmail, setTestEmail] = useState("");
  const [saving, setSaving] = useState(false);
  const [testing, setTesting] = useState(false);
  const { toast } = useToast();

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      await emailApi.updateSmtpConfig(config);
      toast({ title: "SMTP settings saved" });
    } catch (err: any) {
      toast({ title: "Failed to save", description: err.message, variant: "destructive" });
    } finally {
      setSaving(false);
    }
  };

  const handleTest = async () => {
    if (!testEmail) return;
    setTesting(true);
    try {
      const res = await emailApi.testSmtp(testEmail);
      toast({ title: "Test email sent!", description: res.message });
    } catch (err: any) {
      toast({ title: "Test failed", description: err.message, variant: "destructive" });
    } finally {
      setTesting(false);
    }
  };

  const update = (field: keyof SmtpConfig, value: string | number | boolean) =>
    setConfig((c) => ({ ...c, [field]: value }));

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Mail className="h-5 w-5 text-primary" />
          SMTP Email Configuration
        </CardTitle>
        <CardDescription>
          Configure your SMTP server to send booking confirmations and invoices
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSave} className="space-y-6">
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label>SMTP Host</Label>
              <Input placeholder="smtp.gmail.com" value={config.host} onChange={(e) => update("host", e.target.value)} required />
            </div>
            <div className="space-y-2">
              <Label>Port</Label>
              <Input type="number" placeholder="587" value={config.port} onChange={(e) => update("port", parseInt(e.target.value) || 587)} required />
            </div>
          </div>

          <div className="flex items-center gap-3">
            <Switch checked={config.secure} onCheckedChange={(v) => update("secure", v)} />
            <Label>Use SSL/TLS</Label>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label>Username</Label>
              <Input placeholder="your@email.com" value={config.user} onChange={(e) => update("user", e.target.value)} required />
            </div>
            <div className="space-y-2">
              <Label>Password</Label>
              <Input type="password" placeholder="••••••••" value={config.pass} onChange={(e) => update("pass", e.target.value)} required />
            </div>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label>From Name</Label>
              <Input placeholder="Skyline Travel" value={config.fromName} onChange={(e) => update("fromName", e.target.value)} required />
            </div>
            <div className="space-y-2">
              <Label>From Email</Label>
              <Input type="email" placeholder="noreply@travelagencyweb.com" value={config.fromEmail} onChange={(e) => update("fromEmail", e.target.value)} required />
            </div>
          </div>

          <Button type="submit" disabled={saving}>
            {saving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <CheckCircle2 className="mr-2 h-4 w-4" />}
            Save Configuration
          </Button>
        </form>

        {/* Test Email */}
        <div className="mt-6 pt-6 border-t">
          <h4 className="text-sm font-semibold mb-3">Send Test Email</h4>
          <div className="flex gap-2">
            <Input placeholder="test@example.com" type="email" value={testEmail} onChange={(e) => setTestEmail(e.target.value)} className="max-w-xs" />
            <Button variant="outline" onClick={handleTest} disabled={testing || !testEmail}>
              {testing ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Send className="mr-2 h-4 w-4" />}
              Send Test
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default SmtpSettings;
