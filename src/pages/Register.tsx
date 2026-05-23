import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { CheckCircle2, Clock } from "lucide-react";

const Register = () => {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [tenantName, setTenantName] = useState("");
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const { register } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const result = await register({ name, email, password, tenantName });
      if (result.pendingApproval) {
        setSubmitted(true);
        toast({
          title: "Account submitted",
          description: "Your account is pending admin approval.",
        });
      } else {
        // Defensive fallback (auto-approved path)
        navigate("/onboarding");
      }
    } catch (err: any) {
      toast({ variant: "destructive", title: "Registration failed", description: err.message });
    } finally {
      setLoading(false);
    }
  };

  if (submitted) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background px-4">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <div className="mx-auto mb-2 flex h-14 w-14 items-center justify-center rounded-full bg-primary/10">
              <CheckCircle2 className="h-7 w-7 text-primary" />
            </div>
            <CardTitle className="text-2xl">Account Submitted</CardTitle>
            <CardDescription>Thank you for signing up!</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="rounded-lg border bg-muted/40 p-4">
              <div className="flex items-start gap-3">
                <Clock className="mt-0.5 h-5 w-5 shrink-0 text-amber-500" />
                <div className="space-y-1 text-sm">
                  <p className="font-medium">Pending admin approval</p>
                  <p className="text-muted-foreground">
                    Our team has been notified and will review your account shortly.
                    You'll be able to log in as soon as your account is approved.
                  </p>
                </div>
              </div>
            </div>
            <div className="text-sm text-muted-foreground">
              <p><span className="font-medium text-foreground">Email:</span> {email}</p>
              <p><span className="font-medium text-foreground">Agency:</span> {tenantName}</p>
            </div>
            <Button asChild className="w-full" variant="outline">
              <Link to="/login">Back to Login</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl">Create your account</CardTitle>
          <CardDescription>
            Register your organization to get started.<br />
            <span className="text-xs">New accounts require admin approval before login.</span>
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">Full Name</Label>
              <Input id="name" value={name} onChange={(e) => setName(e.target.value)} required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <Input id="password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} required minLength={8} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="tenantName">Organization Name</Label>
              <Input id="tenantName" value={tenantName} onChange={(e) => setTenantName(e.target.value)} required />
            </div>
            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? "Submitting…" : "Submit for Approval"}
            </Button>
          </form>
          <p className="mt-4 text-center text-sm text-muted-foreground">
            Already have an account? <Link to="/login" className="text-primary underline">Sign in</Link>
          </p>
        </CardContent>
      </Card>
    </div>
  );
};

export default Register;
