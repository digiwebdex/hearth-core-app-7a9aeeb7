import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import AdminLayout from "@/components/AdminLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogClose } from "@/components/ui/dialog";
import {
  ArrowLeft, Building2, Mail, Calendar, Crown, Users, BookOpen,
  DollarSign, Ban, CheckCircle, ArrowUpCircle,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { PLANS, type PlanType } from "@/lib/plans";
import { adminApi, type AdminTenant } from "@/lib/api";

const AdminTenantDetails = () => {
  const { tenantId } = useParams<{ tenantId: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();

  const [tenant, setTenant] = useState<AdminTenant | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [changePlanOpen, setChangePlanOpen] = useState(false);
  const [newPlan, setNewPlan] = useState<PlanType>("basic");

  useEffect(() => {
    if (!tenantId) return;
    setLoading(true);
    setError(null);
    adminApi.getTenant(tenantId)
      .then((t) => setTenant(t))
      .catch((err) => setError(err?.message || "Failed to load agency"))
      .finally(() => setLoading(false));
  }, [tenantId]);

  if (loading) {
    return (
      <AdminLayout>
        <p className="text-muted-foreground text-center py-12">Loading agency…</p>
      </AdminLayout>
    );
  }

  if (!tenant) {
    return (
      <AdminLayout>
        <div className="space-y-4">
          <Button variant="ghost" onClick={() => navigate("/admin/tenants")}>
            <ArrowLeft className="mr-2 h-4 w-4" /> Back to Agencies
          </Button>
          <p className="text-muted-foreground text-center py-12">
            {error || "Agency not found."}
          </p>
        </div>
      </AdminLayout>
    );
  }

  const owner =
    tenant.users?.find((u) => u.id === tenant.ownerId) ||
    tenant.users?.find((u) => u.role === "tenant_owner") ||
    tenant.users?.[0];

  const status = (tenant.subscriptionStatus === "suspended" ? "suspended" : "active") as "active" | "suspended";
  const plan = (tenant.subscriptionPlan || "free") as PlanType;
  const currentPlanInfo = PLANS.find((p) => p.id === plan);

  const toggleStatus = async () => {
    const next = status === "active" ? "suspended" : "active";
    try {
      const updated = await adminApi.updateTenant(tenant.id, { subscriptionStatus: next });
      setTenant({ ...tenant, ...updated });
      toast({
        title: next === "suspended" ? "Agency Suspended" : "Agency Activated",
        description: tenant.name,
        variant: next === "suspended" ? "destructive" : "default",
      });
    } catch (err: any) {
      toast({ title: "Failed", description: err?.message || "Update failed", variant: "destructive" });
    }
  };

  const handleChangePlan = async () => {
    try {
      const updated = await adminApi.updateTenant(tenant.id, { subscriptionPlan: newPlan });
      setTenant({ ...tenant, ...updated });
      setChangePlanOpen(false);
      const planInfo = PLANS.find((p) => p.id === newPlan);
      toast({ title: "Plan Changed", description: `${tenant.name} → ${planInfo?.name || newPlan}` });
    } catch (err: any) {
      toast({ title: "Failed", description: err?.message || "Update failed", variant: "destructive" });
    }
  };

  const statusColor = status === "active"
    ? "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200"
    : "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200";

  const counts = tenant._count || { users: tenant.users?.length || 0, bookings: 0 };
  const clientsCount = (tenant._count as any)?.clients ?? 0;

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex items-center gap-4 flex-wrap">
          <Button variant="ghost" size="sm" onClick={() => navigate("/admin/tenants")}>
            <ArrowLeft className="mr-1 h-4 w-4" /> Back
          </Button>
          <div className="flex-1">
            <h1 className="text-2xl font-bold tracking-tight">{tenant.name}</h1>
            <p className="text-sm text-muted-foreground">Agency ID: {tenant.id}</p>
          </div>
          <span className={`inline-flex items-center rounded-full px-3 py-1 text-sm font-medium capitalize ${statusColor}`}>
            {status}
          </span>
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          <Card>
            <CardHeader><CardTitle className="text-lg">Company Information</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center gap-3">
                <Building2 className="h-5 w-5 text-muted-foreground" />
                <div>
                  <p className="text-xs text-muted-foreground">Company Name</p>
                  <p className="font-medium">{tenant.name}</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <Users className="h-5 w-5 text-muted-foreground" />
                <div>
                  <p className="text-xs text-muted-foreground">Owner</p>
                  <p className="font-medium">{owner?.name || "—"}</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <Mail className="h-5 w-5 text-muted-foreground" />
                <div>
                  <p className="text-xs text-muted-foreground">Email</p>
                  <p className="font-medium">{owner?.email || "—"}</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <Calendar className="h-5 w-5 text-muted-foreground" />
                <div>
                  <p className="text-xs text-muted-foreground">Created</p>
                  <p className="font-medium">{new Date(tenant.createdAt).toLocaleDateString()}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader><CardTitle className="text-lg">Subscription</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center gap-3">
                <Crown className="h-5 w-5 text-primary" />
                <div>
                  <p className="text-xs text-muted-foreground">Current Plan</p>
                  <Badge variant="secondary" className="capitalize text-sm">{currentPlanInfo?.name || plan}</Badge>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <DollarSign className="h-5 w-5 text-muted-foreground" />
                <div>
                  <p className="text-xs text-muted-foreground">Price</p>
                  <p className="font-semibold">
                    {currentPlanInfo?.price === 0 ? "Free" : currentPlanInfo?.price === -1 ? "Custom" : `৳${currentPlanInfo?.price.toLocaleString()}/mo`}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <Calendar className="h-5 w-5 text-muted-foreground" />
                <div>
                  <p className="text-xs text-muted-foreground">Expiry Date</p>
                  <p className="font-medium">
                    {tenant.subscriptionExpiry ? new Date(tenant.subscriptionExpiry).toLocaleDateString() : "No expiry"}
                  </p>
                </div>
              </div>
              <Button className="w-full mt-2" variant="outline" onClick={() => { setNewPlan(plan); setChangePlanOpen(true); }}>
                <ArrowUpCircle className="mr-2 h-4 w-4" /> Change Plan
              </Button>
            </CardContent>
          </Card>
        </div>

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <Card><CardContent className="pt-6"><div className="flex items-center gap-3">
            <Users className="h-8 w-8 text-primary" />
            <div><p className="text-2xl font-bold">{counts.users}</p><p className="text-xs text-muted-foreground">Total Users</p></div>
          </div></CardContent></Card>
          <Card><CardContent className="pt-6"><div className="flex items-center gap-3">
            <Users className="h-8 w-8 text-blue-500" />
            <div><p className="text-2xl font-bold">{clientsCount}</p><p className="text-xs text-muted-foreground">Total Clients</p></div>
          </div></CardContent></Card>
          <Card><CardContent className="pt-6"><div className="flex items-center gap-3">
            <BookOpen className="h-8 w-8 text-emerald-500" />
            <div><p className="text-2xl font-bold">{counts.bookings}</p><p className="text-xs text-muted-foreground">Total Bookings</p></div>
          </div></CardContent></Card>
          <Card><CardContent className="pt-6"><div className="flex items-center gap-3">
            <DollarSign className="h-8 w-8 text-amber-500" />
            <div><p className="text-2xl font-bold">—</p><p className="text-xs text-muted-foreground">Total Revenue</p></div>
          </div></CardContent></Card>
        </div>

        <Card>
          <CardHeader><CardTitle className="text-lg">Actions</CardTitle></CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-3">
              {status === "active" ? (
                <Button variant="destructive" onClick={toggleStatus}>
                  <Ban className="mr-2 h-4 w-4" /> Suspend Agency
                </Button>
              ) : (
                <Button onClick={toggleStatus}>
                  <CheckCircle className="mr-2 h-4 w-4" /> Activate Agency
                </Button>
              )}
              <Button variant="outline" onClick={() => { setNewPlan(plan); setChangePlanOpen(true); }}>
                <Crown className="mr-2 h-4 w-4" /> Change Plan
              </Button>
            </div>
          </CardContent>
        </Card>

        <Dialog open={changePlanOpen} onOpenChange={setChangePlanOpen}>
          <DialogContent>
            <DialogHeader><DialogTitle>Change Plan — {tenant.name}</DialogTitle></DialogHeader>
            <p className="text-sm text-muted-foreground">
              Current: <Badge variant="secondary" className="capitalize ml-1">{currentPlanInfo?.name || plan}</Badge>
            </p>
            <div className="space-y-2">
              <Label>New Plan</Label>
              <Select value={newPlan} onValueChange={(v) => setNewPlan(v as PlanType)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {PLANS.filter((p) => p.id !== "enterprise").map((p) => (
                    <SelectItem key={p.id} value={p.id} className="capitalize">
                      {p.name} — {p.price === 0 ? "Free" : `৳${p.price.toLocaleString()}/mo`}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex gap-2 mt-4">
              <Button className="flex-1" onClick={handleChangePlan} disabled={newPlan === plan}>
                Confirm Change
              </Button>
              <DialogClose asChild><Button variant="outline">Cancel</Button></DialogClose>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </AdminLayout>
  );
};

export default AdminTenantDetails;
