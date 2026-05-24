import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { tenantApi, clientApi, bookingApi, invoiceApi } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { Building2, UserCheck, Plane, Receipt, Check, ArrowRight, ArrowLeft, Sparkles } from "lucide-react";

const STEPS = [
  { id: 1, title: "Company Profile", icon: Building2, desc: "Set up your organization details" },
  { id: 2, title: "First Client", icon: UserCheck, desc: "Add your first client" },
  { id: 3, title: "First Booking", icon: Plane, desc: "Create a booking" },
  { id: 4, title: "First Invoice", icon: Receipt, desc: "Generate an invoice" },
];

const Onboarding = () => {
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [skippable] = useState(true);
  const navigate = useNavigate();
  const { toast } = useToast();
  const { refreshTenant } = useAuth();

  // Step 1: Company
  const [companyName, setCompanyName] = useState("");
  const [companyPhone, setCompanyPhone] = useState("");
  const [companyAddress, setCompanyAddress] = useState("");

  // Step 2: Client
  const [clientName, setClientName] = useState("");
  const [clientPhone, setClientPhone] = useState("");
  const [clientEmail, setClientEmail] = useState("");
  const [createdClientId, setCreatedClientId] = useState("");

  // Step 3: Booking
  const [bookingType, setBookingType] = useState<"tour" | "ticket" | "hotel" | "visa">("tour");
  const [bookingAmount, setBookingAmount] = useState(0);
  const [bookingCost, setBookingCost] = useState(0);
  const [createdBookingId, setCreatedBookingId] = useState("");

  // Step 4: Invoice (auto from booking)
  const [invoiceCreated, setInvoiceCreated] = useState(false);

  const handleStep1 = async () => {
    setLoading(true);
    try {
      await tenantApi.update({ name: companyName } as any);
      await refreshTenant();
      toast({ title: "Company profile saved!" });
      setStep(2);
    } catch (err: any) {
      toast({ title: "Failed to save", description: err.message, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  const handleStep2 = async () => {
    setLoading(true);
    try {
      const client = await clientApi.create({ name: clientName, phone: clientPhone, email: clientEmail } as any);
      setCreatedClientId(client.id);
      toast({ title: "Client added!" });
      setStep(3);
    } catch (err: any) {
      toast({ title: "Failed", description: err.message, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  const handleStep3 = async () => {
    setLoading(true);
    try {
      const profit = bookingAmount - bookingCost;
      const booking = await bookingApi.create({
        type: bookingType,
        clientId: createdClientId,
        amount: bookingAmount,
        cost: bookingCost,
        profit,
        status: "confirmed",
      } as any);
      setCreatedBookingId(booking.id);
      toast({ title: "Booking created!" });
      setStep(4);
    } catch (err: any) {
      toast({ title: "Failed", description: err.message, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  const handleStep4 = async () => {
    setLoading(true);
    try {
      await invoiceApi.create({
        bookingId: createdBookingId,
        totalAmount: bookingAmount,
        paidAmount: 0,
        dueAmount: bookingAmount,
        status: "unpaid",
      } as any);
      setInvoiceCreated(true);
      toast({ title: "Invoice generated!" });
    } catch (err: any) {
      toast({ title: "Failed", description: err.message, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  const goToDashboard = () => {
    localStorage.setItem("onboarding_complete", "true");
    navigate("/dashboard");
  };

  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center px-4 py-8">
      {/* Progress */}
      <div className="w-full max-w-2xl mb-8">
        <div className="flex items-center justify-between mb-2">
          {STEPS.map((s, i) => (
            <div key={s.id} className="flex items-center flex-1">
              <div className={`flex items-center justify-center w-10 h-10 rounded-full border-2 transition-all ${
                step > s.id
                  ? "bg-primary border-primary text-primary-foreground"
                  : step === s.id
                  ? "border-primary text-primary bg-primary/10"
                  : "border-muted text-muted-foreground"
              }`}>
                {step > s.id ? <Check className="h-5 w-5" /> : <s.icon className="h-5 w-5" />}
              </div>
              {i < STEPS.length - 1 && (
                <div className={`flex-1 h-0.5 mx-2 ${step > s.id ? "bg-primary" : "bg-muted"}`} />
              )}
            </div>
          ))}
        </div>
        <div className="flex justify-between text-xs text-muted-foreground">
          {STEPS.map((s) => (
            <span key={s.id} className={step === s.id ? "text-primary font-medium" : ""}>
              {s.title}
            </span>
          ))}
        </div>
      </div>

      <Card className="w-full max-w-lg">
        <CardHeader className="text-center">
          <CardTitle className="text-xl">{STEPS[step - 1].title}</CardTitle>
          <CardDescription>{STEPS[step - 1].desc}</CardDescription>
        </CardHeader>
        <CardContent>
          {/* Step 1: Company Profile */}
          {step === 1 && (
            <div className="space-y-4">
              <div className="space-y-2">
                <Label>Company Name</Label>
                <Input value={companyName} onChange={(e) => setCompanyName(e.target.value)} placeholder="Your Travel Agency" required />
              </div>
              <div className="space-y-2">
                <Label>Phone</Label>
                <Input value={companyPhone} onChange={(e) => setCompanyPhone(e.target.value)} placeholder="+880..." />
              </div>
              <div className="space-y-2">
                <Label>Address</Label>
                <Input value={companyAddress} onChange={(e) => setCompanyAddress(e.target.value)} placeholder="Dhaka, Bangladesh" />
              </div>
              <div className="flex gap-2">
                <Button onClick={handleStep1} className="flex-1" disabled={!companyName || loading}>
                  {loading ? "Saving…" : "Continue"} <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </div>
            </div>
          )}

          {/* Step 2: First Client */}
          {step === 2 && (
            <div className="space-y-4">
              <div className="space-y-2">
                <Label>Client Name</Label>
                <Input value={clientName} onChange={(e) => setClientName(e.target.value)} placeholder="Ahmed Rahman" required />
              </div>
              <div className="space-y-2">
                <Label>Phone</Label>
                <Input value={clientPhone} onChange={(e) => setClientPhone(e.target.value)} placeholder="+8801711..." required />
              </div>
              <div className="space-y-2">
                <Label>Email</Label>
                <Input type="email" value={clientEmail} onChange={(e) => setClientEmail(e.target.value)} placeholder="client@email.com" />
              </div>
              <div className="flex gap-2">
                <Button variant="outline" onClick={() => setStep(1)}><ArrowLeft className="mr-2 h-4 w-4" /> Back</Button>
                <Button onClick={handleStep2} className="flex-1" disabled={!clientName || !clientPhone || loading}>
                  {loading ? "Saving…" : "Continue"} <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </div>
            </div>
          )}

          {/* Step 3: First Booking */}
          {step === 3 && (
            <div className="space-y-4">
              <div className="space-y-2">
                <Label>Booking Type</Label>
                <Select value={bookingType} onValueChange={(v) => setBookingType(v as any)}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="tour">Tour Package</SelectItem>
                    <SelectItem value="ticket">Air Ticket</SelectItem>
                    <SelectItem value="hotel">Hotel</SelectItem>
                    <SelectItem value="visa">Visa</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Selling Price (৳)</Label>
                  <Input type="number" min={0} value={bookingAmount || ""} onChange={(e) => setBookingAmount(parseFloat(e.target.value) || 0)} />
                </div>
                <div className="space-y-2">
                  <Label>Cost (৳)</Label>
                  <Input type="number" min={0} value={bookingCost || ""} onChange={(e) => setBookingCost(parseFloat(e.target.value) || 0)} />
                </div>
              </div>
              <div className="text-sm text-muted-foreground">
                Profit: <strong className={bookingAmount - bookingCost >= 0 ? "text-green-600" : "text-destructive"}>
                  ৳{(bookingAmount - bookingCost).toFixed(2)}
                </strong>
              </div>
              <div className="flex gap-2">
                <Button variant="outline" onClick={() => setStep(2)}><ArrowLeft className="mr-2 h-4 w-4" /> Back</Button>
                <Button onClick={handleStep3} className="flex-1" disabled={!bookingAmount || loading}>
                  {loading ? "Saving…" : "Continue"} <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </div>
            </div>
          )}

          {/* Step 4: Invoice */}
          {step === 4 && (
            <div className="space-y-4 text-center">
              {!invoiceCreated ? (
                <>
                  <p className="text-muted-foreground">
                    Generate an invoice for the booking of <strong>৳{bookingAmount.toLocaleString()}</strong>.
                  </p>
                  <div className="flex gap-2 justify-center">
                    <Button variant="outline" onClick={() => setStep(3)}><ArrowLeft className="mr-2 h-4 w-4" /> Back</Button>
                    <Button onClick={handleStep4} disabled={loading}>
                      {loading ? "Generating…" : "Generate Invoice"} <Receipt className="ml-2 h-4 w-4" />
                    </Button>
                  </div>
                </>
              ) : (
                <div className="py-4 space-y-4">
                  <div className="rounded-full bg-green-100 dark:bg-green-900 p-4 mx-auto w-fit">
                    <Sparkles className="h-10 w-10 text-green-600" />
                  </div>
                  <h3 className="text-lg font-semibold">You're all set! 🎉</h3>
                  <p className="text-sm text-muted-foreground">
                    Your company profile, first client, booking, and invoice are ready. Head to your dashboard to explore all features.
                  </p>
                  <Button onClick={goToDashboard} size="lg" className="gap-2">
                    <Sparkles className="h-4 w-4" /> Go to Dashboard
                  </Button>
                </div>
              )}
            </div>
          )}

          {/* Skip */}
          {skippable && step < 4 && (
            <div className="mt-4 text-center">
              <Button variant="link" className="text-muted-foreground" onClick={goToDashboard}>
                Skip onboarding →
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default Onboarding;
