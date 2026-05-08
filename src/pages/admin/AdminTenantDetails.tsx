import { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import AdminLayout from "@/components/AdminLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogClose } from "@/components/ui/dialog";
import {
  ArrowLeft, Building2, Mail, Globe, Calendar, Crown, Users, BookOpen,
  DollarSign, Ban, CheckCircle, ArrowUpCircle, AlertTriangle,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { PLANS, type PlanType } from "@/lib/plans";

interface TenantDetail {
  id: string;
  name: string;
  ownerName: string;
  ownerEmail: string;
  domain: string;
  plan: PlanType;
  planExpiry: string;
  status: "active" | "suspended";
  createdAt: string;
  stats: {
    totalUsers: number;
    totalClients: number;
    totalBookings: number;
    totalRevenue: number;
  };
}

const mockTenants: Record<string, TenantDetail> = {
  t1: { id: "t1", name: "Acme Travel", ownerName: "John Doe", ownerEmail: "john@acme.com", domain: "acme.travelsaas.com", plan: "pro", planExpiry: "2026-04-01", status: "active", createdAt: "2025-01-15", stats: { totalUsers: 8, totalClients: 245, totalBookings: 1280, totalRevenue: 3200000 } },
  t2: { id: "t2", name: "Globe Tours", ownerName: "Jane Smith", ownerEmail: "jane@globe.com", domain: "globe.travelsaas.com", plan: "basic", planExpiry: "2026-03-15", status: "active", createdAt: "2025-02-20", stats: { totalUsers: 3, totalClients: 85, totalBookings: 340, totalRevenue: 890000 } },
  t3: { id: "t3", name: "Star Holidays", ownerName: "Ali Khan", ownerEmail: "ali@star.com", domain: "", plan: "free", planExpiry: "", status: "suspended", createdAt: "2025-03-01", stats: { totalUsers: 1, totalClients: 12, totalBookings: 28, totalRevenue: 45000 } },
};

const AdminTenantDetails = () => {
  const { tenantId } = useParams<{ tenantId: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();

  const [tenant, setTenant] = useState<TenantDetail | null>(mockTenants[tenantId || ""] || null);
  const [changePlanOpen, setChangePlanOpen] = useState(false);
  const [newPlan, setNewPlan] = useState<PlanType>("basic");

  if (!tenant) {
    return (
      <AdminLayout>
        <div className="space-y-4">
          <Button variant="ghost" onClick={() => navigate("/admin/tenants")}>
            <ArrowLeft className="mr-2 h-4 w-4" /> Back to Agencies
          </Button>
          <p className="text-muted-foreground text-center py-12">Agency not found.</p>
        </div>
      </AdminLayout>
    );
  }

  const toggleStatus = () => {
    const next = tenant.status === "active" ? "suspended" : "active";
    setTenant({ ...tenant, status: next });
    toast({
      title: next === "suspended" ? "Agency Suspended" : "Agency Activated",
      description: tenant.name,
      variant: next === "suspended" ? "destructive" : "default",
    });
  };

  const handleChangePlan = () => {
    const planInfo = PLANS.find((p) => p.id === newPlan);
    setTenant({ ...tenant, plan: newPlan });
    setChangePlanOpen(false);
    toast({ title: "Plan Changed", description: `${tenant.name} → ${planInfo?.name || newPlan}` });
  };

  const statusColor = tenant.status === "active"
    ? "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200"
    : "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200";

  const currentPlanInfo = PLANS.find((p) => p.id === tenant.plan);

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center gap-4 flex-wrap">
          <Button variant="ghost" size="sm" onClick={() => navigate("/admin/tenants")}>
            <ArrowLeft className="mr-1 h-4 w-4" /> Back
          </Button>
          <div className="flex-1">
            <h1 className="text-2xl font-bold tracking-tight">{tenant.name}</h1>
            <p className="text-sm text-muted-foreground">Agency ID: {tenant.id}</p>
          </div>
          <span className={`inline-flex items-center rounded-full px-3 py-1 text-sm font-medium capitalize ${statusColor}`}>
            {tenant.status}
          </span>
        </div>

        {/* Info + Subscription */}
        <div className="grid gap-4 md:grid-cols-2">
          {/* Company Info */}
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
                  <p className="font-medium">{tenant.ownerName}</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <Mail className="h-5 w-5 text-muted-foreground" />
                <div>
                  <p className="text-xs text-muted-foreground">Email</p>
                  <p className="font-medium">{tenant.ownerEmail}</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <Globe className="h-5 w-5 text-muted-foreground" />
                <div>
                  <p className="text-xs text-muted-foreground">Domain</p>
                  <p className="font-medium">{tenant.domain || "No custom domain"}</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <Calendar className="h-5 w-5 text-muted-foreground" />
                <div>
                  <p className="text-xs text-muted-foreground">Created</p>
                  <p className="font-medium">{tenant.createdAt}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Subscription */}
          <Card>
            <CardHeader><CardTitle className="text-lg">Subscription</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center gap-3">
                <Crown className="h-5 w-5 text-primary" />
                <div>
                  <p className="text-xs text-muted-foreground">Current Plan</p>
                  <Badge variant="secondary" className="capitalize text-sm">{currentPlanInfo?.name || tenant.plan}</Badge>
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
                  <p className="font-medium">{tenant.planExpiry || "No expiry (Free plan)"}</p>
                </div>
              </div>
              {currentPlanInfo && (
                <div className="pt-2">
                  <p className="text-xs text-muted-foreground mb-2">Features</p>
                  <div className="flex flex-wrap gap-1">
                    {currentPlanInfo.features.slice(0, 6).map((f) => (
                      <Badge key={f} variant="outline" className="text-xs">{f}</Badge>
                    ))}
                    {currentPlanInfo.features.length > 6 && (
                      <Badge variant="outline" className="text-xs">+{currentPlanInfo.features.length - 6} more</Badge>
                    )}
                  </div>
                </div>
              )}
              <Button className="w-full mt-2" variant="outline" onClick={() => { setNewPlan(tenant.plan); setChangePlanOpen(true); }}>
                <ArrowUpCircle className="mr-2 h-4 w-4" /> Change Plan
              </Button>
            </CardContent>
          </Card>
        </div>

        {/* Statistics */}
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <Users className="h-8 w-8 text-primary" />
                <div>
                  <p className="text-2xl font-bold">{tenant.stats.totalUsers}</p>
                  <p className="text-xs text-muted-foreground">Total Users</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <Users className="h-8 w-8 text-blue-500" />
                <div>
                  <p className="text-2xl font-bold">{tenant.stats.totalClients}</p>
                  <p className="text-xs text-muted-foreground">Total Clients</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <BookOpen className="h-8 w-8 text-emerald-500" />
                <div>
                  <p className="text-2xl font-bold">{tenant.stats.totalBookings.toLocaleString()}</p>
                  <p className="text-xs text-muted-foreground">Total Bookings</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <DollarSign className="h-8 w-8 text-amber-500" />
                <div>
                  <p className="text-2xl font-bold">৳{tenant.stats.totalRevenue.toLocaleString()}</p>
                  <p className="text-xs text-muted-foreground">Total Revenue</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Actions */}
        <Card>
          <CardHeader><CardTitle className="text-lg">Actions</CardTitle></CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-3">
              {tenant.status === "active" ? (
                <Button variant="destructive" onClick={toggleStatus}>
                  <Ban className="mr-2 h-4 w-4" /> Suspend Agency
                </Button>
              ) : (
                <Button onClick={toggleStatus}>
                  <CheckCircle className="mr-2 h-4 w-4" /> Activate Agency
                </Button>
              )}
              <Button variant="outline" onClick={() => { setNewPlan(tenant.plan); setChangePlanOpen(true); }}>
                <Crown className="mr-2 h-4 w-4" /> Change Plan
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Change Plan Dialog */}
        <Dialog open={changePlanOpen} onOpenChange={setChangePlanOpen}>
          <DialogContent>
            <DialogHeader><DialogTitle>Change Plan — {tenant.name}</DialogTitle></DialogHeader>
            <p className="text-sm text-muted-foreground">
              Current: <Badge variant="secondary" className="capitalize ml-1">{currentPlanInfo?.name}</Badge>
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
            {newPlan !== tenant.plan && (
              <div className="rounded-md border p-3 mt-2">
                <p className="text-xs text-muted-foreground mb-1">This will immediately update the agency's feature access.</p>
                {PLANS.find((p) => p.id === newPlan) && (
                  <div className="flex flex-wrap gap-1">
                    {PLANS.find((p) => p.id === newPlan)!.features.slice(0, 4).map((f) => (
                      <Badge key={f} variant="outline" className="text-xs">{f}</Badge>
                    ))}
                  </div>
                )}
              </div>
            )}
            <div className="flex gap-2 mt-4">
              <Button className="flex-1" onClick={handleChangePlan} disabled={newPlan === tenant.plan}>
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
