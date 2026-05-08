import { useState, useMemo, useEffect } from "react";
import { adminApi, type AdminTenant } from "@/lib/api";
import AdminLayout from "@/components/AdminLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogClose } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import {
  Search, ArrowUpCircle, ArrowDownCircle, CalendarPlus, XCircle, Eye, Crown,
  Users, AlertTriangle, RefreshCcw, Pause, Play, DollarSign, Clock, CheckCircle2,
  TrendingUp, Ban, Download,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import {
  PLANS, type PlanType, type SubscriptionStatus, type BillingCycle,
  type TenantSubscription, checkUsage, getLimitLabel,
} from "@/lib/plans";

const STATUS_META: { value: SubscriptionStatus; label: string; color: string; icon: any }[] = [
  { value: "trial", label: "Trial", color: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200", icon: Clock },
  { value: "active", label: "Active", color: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200", icon: CheckCircle2 },
  { value: "overdue", label: "Overdue", color: "bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200", icon: AlertTriangle },
  { value: "expired", label: "Expired", color: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200", icon: XCircle },
  { value: "suspended", label: "Suspended", color: "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200", icon: Pause },
  { value: "cancelled", label: "Cancelled", color: "bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200", icon: Ban },
];

const getStatusMeta = (s: SubscriptionStatus) => STATUS_META.find((x) => x.value === s) || STATUS_META[1];

const planOrder: PlanType[] = ["free", "basic", "pro", "business", "enterprise"];

function getPlanPrice(planId: string, cycle: BillingCycle): number {
  const p = PLANS.find((x) => x.id === planId);
  if (!p) return 0;
  const v = cycle === "yearly" ? p.yearlyPrice : p.monthlyPrice;
  return v < 0 ? 0 : v;
}

function tenantToSubscription(t: AdminTenant): TenantSubscription {
  const owner = t.users?.find((u) => u.role === "tenant_owner") || t.users?.[0];
  const plan = (t.subscriptionPlan || "free") as PlanType;
  const status = ((t.subscriptionStatus || "active") as SubscriptionStatus);
  const billingCycle: BillingCycle = "monthly";
  const startDate = t.createdAt ? t.createdAt.split("T")[0] : "";
  const endDate = t.subscriptionExpiry ? t.subscriptionExpiry.split("T")[0] : "";
  return {
    id: t.id,
    tenantId: t.id,
    tenantName: t.name,
    ownerEmail: owner?.email || "—",
    plan,
    billingCycle,
    price: getPlanPrice(plan, billingCycle),
    startDate,
    endDate,
    status,
    autoRenew: false,
    usedUsers: t._count?.users || 0,
    usedBookings: t._count?.bookings || 0,
  };
}

const AdminSubscriptions = () => {
  const [subscriptions, setSubscriptions] = useState<TenantSubscription[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let alive = true;
    adminApi.getTenants()
      .then((tenants) => { if (alive) setSubscriptions(tenants.map(tenantToSubscription)); })
      .catch(() => {})
      .finally(() => { if (alive) setLoading(false); });
    return () => { alive = false; };
  }, []);

  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [planFilter, setPlanFilter] = useState("all");
  const { toast } = useToast();

  const [actionType, setActionType] = useState<"upgrade" | "downgrade" | "extend" | "cancel" | "view" | "suspend" | "reactivate" | "renew" | null>(null);
  const [selectedSub, setSelectedSub] = useState<TenantSubscription | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [newPlan, setNewPlan] = useState<PlanType>("basic");
  const [newCycle, setNewCycle] = useState<BillingCycle>("monthly");
  const [extendUnit, setExtendUnit] = useState<"days" | "months">("months");
  const [extendValue, setExtendValue] = useState("1");
  const [actionReason, setActionReason] = useState("");

  const filtered = useMemo(() => {
    return subscriptions.filter((s) => {
      const matchSearch = s.tenantName.toLowerCase().includes(search.toLowerCase()) ||
        s.ownerEmail.toLowerCase().includes(search.toLowerCase());
      const matchStatus = statusFilter === "all" || s.status === statusFilter;
      const matchPlan = planFilter === "all" || s.plan === planFilter;
      return matchSearch && matchStatus && matchPlan;
    });
  }, [subscriptions, search, statusFilter, planFilter]);

  // Stats
  const stats = useMemo(() => {
    const active = subscriptions.filter((s) => s.status === "active" || s.status === "trial");
    const mrr = active.reduce((sum, s) => {
      if (s.billingCycle === "yearly") return sum + Math.round(s.price / 12);
      return sum + s.price;
    }, 0);
    return {
      total: subscriptions.length,
      active: subscriptions.filter((s) => s.status === "active").length,
      trial: subscriptions.filter((s) => s.status === "trial").length,
      overdue: subscriptions.filter((s) => s.status === "overdue").length,
      expired: subscriptions.filter((s) => s.status === "expired").length,
      suspended: subscriptions.filter((s) => s.status === "suspended").length,
      cancelled: subscriptions.filter((s) => s.status === "cancelled").length,
      mrr,
      arr: mrr * 12,
    };
  }, [subscriptions]);

  const statusCounts = useMemo(() => {
    const counts: Record<string, number> = { all: subscriptions.length };
    STATUS_META.forEach((s) => { counts[s.value] = subscriptions.filter((sub) => sub.status === s.value).length; });
    return counts;
  }, [subscriptions]);

  const openAction = (sub: TenantSubscription, type: typeof actionType) => {
    setSelectedSub(sub);
    setActionType(type);
    setActionReason("");
    if (type === "upgrade") {
      const idx = planOrder.indexOf(sub.plan);
      setNewPlan(planOrder[Math.min(idx + 1, planOrder.length - 1)]);
    } else if (type === "downgrade") {
      const idx = planOrder.indexOf(sub.plan);
      setNewPlan(planOrder[Math.max(idx - 1, 0)]);
    }
    setNewCycle(sub.billingCycle);
    setExtendValue("1"); setExtendUnit("months");
    setDialogOpen(true);
  };

  const handleUpgrade = () => {
    if (!selectedSub) return;
    const planInfo = PLANS.find((p) => p.id === newPlan);
    const price = newCycle === "yearly" ? (planInfo?.yearlyPrice || 0) : (planInfo?.price || 0);
    setSubscriptions((prev) => prev.map((s) =>
      s.id === selectedSub.id ? { ...s, plan: newPlan, billingCycle: newCycle, price, status: "active" } : s
    ));
    toast({ title: "Plan Upgraded", description: `${selectedSub.tenantName} → ${newPlan.toUpperCase()} (${newCycle})` });
    setDialogOpen(false);
  };

  const handleDowngrade = () => {
    if (!selectedSub) return;
    const planInfo = PLANS.find((p) => p.id === newPlan);
    const price = newCycle === "yearly" ? (planInfo?.yearlyPrice || 0) : (planInfo?.price || 0);
    setSubscriptions((prev) => prev.map((s) =>
      s.id === selectedSub.id ? { ...s, plan: newPlan, billingCycle: newCycle, price } : s
    ));
    toast({ title: "Plan Downgraded", description: `${selectedSub.tenantName} → ${newPlan.toUpperCase()}` });
    setDialogOpen(false);
  };

  const handleExtend = () => {
    if (!selectedSub) return;
    const val = parseInt(extendValue) || 1;
    const base = selectedSub.endDate ? new Date(selectedSub.endDate) : new Date();
    if (extendUnit === "months") base.setMonth(base.getMonth() + val);
    else base.setDate(base.getDate() + val);
    const newEnd = base.toISOString().split("T")[0];
    setSubscriptions((prev) => prev.map((s) =>
      s.id === selectedSub.id ? { ...s, endDate: newEnd, status: "active" } : s
    ));
    toast({ title: "Subscription Extended", description: `Expires ${newEnd}` });
    setDialogOpen(false);
  };

  const handleCancel = () => {
    if (!selectedSub) return;
    setSubscriptions((prev) => prev.map((s) =>
      s.id === selectedSub.id ? { ...s, status: "cancelled" as SubscriptionStatus, cancelReason: actionReason, cancelledAt: new Date().toISOString() } : s
    ));
    toast({ title: "Cancelled", variant: "destructive" });
    setDialogOpen(false);
  };

  const handleSuspend = () => {
    if (!selectedSub) return;
    setSubscriptions((prev) => prev.map((s) =>
      s.id === selectedSub.id ? { ...s, status: "suspended" as SubscriptionStatus, suspendReason: actionReason, suspendedAt: new Date().toISOString() } : s
    ));
    toast({ title: "Suspended" });
    setDialogOpen(false);
  };

  const handleReactivate = () => {
    if (!selectedSub) return;
    const end = new Date(); end.setMonth(end.getMonth() + 1);
    setSubscriptions((prev) => prev.map((s) =>
      s.id === selectedSub.id ? { ...s, status: "active" as SubscriptionStatus, endDate: end.toISOString().split("T")[0] } : s
    ));
    toast({ title: "Reactivated" });
    setDialogOpen(false);
  };

  const handleRenew = () => {
    if (!selectedSub) return;
    const start = new Date();
    const end = new Date();
    if (selectedSub.billingCycle === "yearly") end.setFullYear(end.getFullYear() + 1);
    else end.setMonth(end.getMonth() + 1);
    setSubscriptions((prev) => prev.map((s) =>
      s.id === selectedSub.id ? { ...s, status: "active" as SubscriptionStatus, startDate: start.toISOString().split("T")[0], endDate: end.toISOString().split("T")[0], lastPaymentDate: start.toISOString().split("T")[0] } : s
    ));
    toast({ title: "Renewed" });
    setDialogOpen(false);
  };

  const daysUntilExpiry = (endDate: string) => {
    if (!endDate) return null;
    return Math.ceil((new Date(endDate).getTime() - Date.now()) / (1000 * 60 * 60 * 24));
  };

  const getUpgradePlans = (current: PlanType) => planOrder.slice(planOrder.indexOf(current) + 1).filter((p) => p !== "enterprise");
  const getDowngradePlans = (current: PlanType) => planOrder.slice(0, planOrder.indexOf(current));

  // Export
  const handleExport = () => {
    const headers = ["Tenant", "Email", "Plan", "Cycle", "Price", "Status", "Start", "End", "Auto-Renew"];
    const rows = filtered.map((s) => [s.tenantName, s.ownerEmail, s.plan, s.billingCycle, s.price, s.status, s.startDate, s.endDate || "", s.autoRenew ? "Yes" : "No"]);
    const csv = [headers.join(","), ...rows.map((r) => r.map((c) => `"${c}"`).join(","))].join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a"); a.href = url; a.download = "subscriptions.csv";
    document.body.appendChild(a); a.click(); document.body.removeChild(a); URL.revokeObjectURL(url);
  };

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Subscription Management</h1>
            <p className="text-muted-foreground">Manage tenant subscriptions, trials, and billing</p>
          </div>
          <Button variant="outline" size="sm" onClick={handleExport}><Download className="mr-1 h-4 w-4" /> Export</Button>
        </div>

        {/* Stats */}
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-8">
          <Card><CardContent className="pt-6"><p className="text-xs text-muted-foreground">MRR</p><p className="text-xl font-bold">৳{stats.mrr.toLocaleString()}</p></CardContent></Card>
          <Card><CardContent className="pt-6"><p className="text-xs text-muted-foreground">ARR</p><p className="text-xl font-bold">৳{stats.arr.toLocaleString()}</p></CardContent></Card>
          <Card><CardContent className="pt-6"><p className="text-xs text-muted-foreground">Active</p><p className="text-xl font-bold text-green-600">{stats.active}</p></CardContent></Card>
          <Card><CardContent className="pt-6"><p className="text-xs text-muted-foreground">Trial</p><p className="text-xl font-bold text-blue-600">{stats.trial}</p></CardContent></Card>
          <Card className={stats.overdue > 0 ? "border-orange-300 dark:border-orange-600" : ""}><CardContent className="pt-6"><p className="text-xs text-muted-foreground">Overdue</p><p className="text-xl font-bold text-orange-600">{stats.overdue}</p></CardContent></Card>
          <Card><CardContent className="pt-6"><p className="text-xs text-muted-foreground">Expired</p><p className="text-xl font-bold">{stats.expired}</p></CardContent></Card>
          <Card><CardContent className="pt-6"><p className="text-xs text-muted-foreground">Suspended</p><p className="text-xl font-bold text-destructive">{stats.suspended}</p></CardContent></Card>
          <Card><CardContent className="pt-6"><p className="text-xs text-muted-foreground">Cancelled</p><p className="text-xl font-bold">{stats.cancelled}</p></CardContent></Card>
        </div>

        {/* Filters */}
        <div className="space-y-3">
          <div className="flex flex-wrap gap-2">
            <Button variant={statusFilter === "all" ? "default" : "outline"} size="sm" onClick={() => setStatusFilter("all")}>
              All ({statusCounts.all})
            </Button>
            {STATUS_META.map((s) => (
              <Button key={s.value} variant={statusFilter === s.value ? "default" : "outline"} size="sm" onClick={() => setStatusFilter(s.value)}>
                {s.label} ({statusCounts[s.value] || 0})
              </Button>
            ))}
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <div className="flex items-center gap-2 flex-1 min-w-[200px] max-w-sm">
              <Search className="h-4 w-4 text-muted-foreground" />
              <Input placeholder="Search company or email…" value={search} onChange={(e) => setSearch(e.target.value)} />
            </div>
            <Select value={planFilter} onValueChange={setPlanFilter}>
              <SelectTrigger className="w-[150px]"><SelectValue placeholder="Plan" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Plans</SelectItem>
                {PLANS.map((p) => <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Table */}
        <Card>
          <CardHeader><CardTitle>Subscriptions ({filtered.length})</CardTitle></CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Company</TableHead>
                  <TableHead>Plan</TableHead>
                  <TableHead>Cycle</TableHead>
                  <TableHead className="text-right">Price</TableHead>
                  <TableHead>Period</TableHead>
                  <TableHead>Usage</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="w-[200px]">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.length === 0 ? (
                  <TableRow><TableCell colSpan={8} className="text-center text-muted-foreground py-8">{loading ? "Loading subscriptions…" : "No subscriptions found."}</TableCell></TableRow>
                ) : (
                  filtered.map((sub) => {
                    const meta = getStatusMeta(sub.status);
                    const days = daysUntilExpiry(sub.endDate);
                    const expiringSoon = days !== null && days > 0 && days <= 7 && (sub.status === "active" || sub.status === "trial");
                    const usage = checkUsage(sub);
                    const nearLimitCount = usage.filter((u) => u.isNearLimit).length;
                    const atLimitCount = usage.filter((u) => u.isAtLimit).length;
                    return (
                      <TableRow key={sub.id} className={sub.status === "cancelled" || sub.status === "suspended" ? "opacity-60" : ""}>
                        <TableCell>
                          <div>
                            <p className="font-medium">{sub.tenantName}</p>
                            <p className="text-xs text-muted-foreground">{sub.ownerEmail}</p>
                          </div>
                        </TableCell>
                        <TableCell><Badge variant="secondary" className="capitalize">{sub.plan}</Badge></TableCell>
                        <TableCell className="text-sm capitalize">{sub.billingCycle}</TableCell>
                        <TableCell className="text-right font-semibold text-sm">
                          {sub.price === 0 ? "Free" : `৳${sub.price.toLocaleString()}`}
                        </TableCell>
                        <TableCell className="text-xs text-muted-foreground">
                          <div>{sub.startDate}</div>
                          <div className="flex items-center gap-1">
                            {sub.endDate || "—"}
                            {expiringSoon && <AlertTriangle className="h-3 w-3 text-yellow-500" />}
                          </div>
                          {sub.status === "trial" && sub.trialEndDate && (
                            <div className="text-blue-600 text-[10px]">Trial ends: {sub.trialEndDate}</div>
                          )}
                        </TableCell>
                        <TableCell>
                          {atLimitCount > 0 ? (
                            <Badge variant="destructive" className="text-[10px]">{atLimitCount} at limit</Badge>
                          ) : nearLimitCount > 0 ? (
                            <Badge className="bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-200 text-[10px]">{nearLimitCount} near limit</Badge>
                          ) : (
                            <span className="text-xs text-muted-foreground">OK</span>
                          )}
                        </TableCell>
                        <TableCell>
                          <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${meta.color}`}>{meta.label}</span>
                          {sub.autoRenew && sub.status === "active" && <span className="text-[10px] text-muted-foreground ml-1">🔄</span>}
                        </TableCell>
                        <TableCell>
                          <div className="flex gap-1 flex-wrap">
                            <Button variant="ghost" size="icon" className="h-7 w-7" title="View" onClick={() => openAction(sub, "view")}><Eye className="h-3.5 w-3.5" /></Button>
                            {(sub.status === "active" || sub.status === "trial") && (
                              <>
                                {getUpgradePlans(sub.plan).length > 0 && (
                                  <Button variant="ghost" size="icon" className="h-7 w-7" title="Upgrade" onClick={() => openAction(sub, "upgrade")}><ArrowUpCircle className="h-3.5 w-3.5 text-green-600" /></Button>
                                )}
                                {getDowngradePlans(sub.plan).length > 0 && (
                                  <Button variant="ghost" size="icon" className="h-7 w-7" title="Downgrade" onClick={() => openAction(sub, "downgrade")}><ArrowDownCircle className="h-3.5 w-3.5 text-yellow-600" /></Button>
                                )}
                                <Button variant="ghost" size="icon" className="h-7 w-7" title="Extend" onClick={() => openAction(sub, "extend")}><CalendarPlus className="h-3.5 w-3.5 text-blue-600" /></Button>
                                <Button variant="ghost" size="icon" className="h-7 w-7" title="Suspend" onClick={() => openAction(sub, "suspend")}><Pause className="h-3.5 w-3.5 text-orange-600" /></Button>
                                <Button variant="ghost" size="icon" className="h-7 w-7" title="Cancel" onClick={() => openAction(sub, "cancel")}><XCircle className="h-3.5 w-3.5 text-destructive" /></Button>
                              </>
                            )}
                            {(sub.status === "expired" || sub.status === "overdue") && (
                              <Button variant="ghost" size="icon" className="h-7 w-7" title="Renew" onClick={() => openAction(sub, "renew")}><RefreshCcw className="h-3.5 w-3.5 text-green-600" /></Button>
                            )}
                            {sub.status === "suspended" && (
                              <Button variant="ghost" size="icon" className="h-7 w-7" title="Reactivate" onClick={() => openAction(sub, "reactivate")}><Play className="h-3.5 w-3.5 text-green-600" /></Button>
                            )}
                          </div>
                        </TableCell>
                      </TableRow>
                    );
                  })
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        {/* ═══════ ACTION DIALOG ═══════ */}
        <Dialog open={dialogOpen} onOpenChange={(o) => { setDialogOpen(o); if (!o) { setActionType(null); setSelectedSub(null); } }}>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            {selectedSub && actionType === "view" && (() => {
              const usage = checkUsage(selectedSub);
              return (
                <>
                  <DialogHeader><DialogTitle>Subscription Details — {selectedSub.tenantName}</DialogTitle></DialogHeader>
                  <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-2 text-sm">
                      <span className="text-muted-foreground">Plan:</span>
                      <Badge variant="secondary" className="capitalize w-fit">{selectedSub.plan}</Badge>
                      <span className="text-muted-foreground">Billing:</span>
                      <span className="capitalize">{selectedSub.billingCycle}</span>
                      <span className="text-muted-foreground">Price:</span>
                      <span className="font-semibold">{selectedSub.price === 0 ? "Free" : `৳${selectedSub.price.toLocaleString()}/${selectedSub.billingCycle === "yearly" ? "yr" : "mo"}`}</span>
                      <span className="text-muted-foreground">Status:</span>
                      <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium w-fit ${getStatusMeta(selectedSub.status).color}`}>{getStatusMeta(selectedSub.status).label}</span>
                      <span className="text-muted-foreground">Period:</span>
                      <span>{selectedSub.startDate} → {selectedSub.endDate || "—"}</span>
                      <span className="text-muted-foreground">Auto-Renew:</span>
                      <span>{selectedSub.autoRenew ? "Yes" : "No"}</span>
                      {selectedSub.trialEndDate && <><span className="text-muted-foreground">Trial Ends:</span><span className="text-blue-600">{selectedSub.trialEndDate}</span></>}
                      {selectedSub.cancelReason && <><span className="text-muted-foreground">Cancel Reason:</span><span className="text-destructive">{selectedSub.cancelReason}</span></>}
                      {selectedSub.suspendReason && <><span className="text-muted-foreground">Suspend Reason:</span><span className="text-orange-600">{selectedSub.suspendReason}</span></>}
                    </div>

                    <Separator />
                    <h4 className="text-sm font-medium">Usage & Limits</h4>
                    <div className="grid gap-2">
                      {usage.map((u) => (
                        <div key={u.resource} className="space-y-1">
                          <div className="flex items-center justify-between text-xs">
                            <span className={u.isAtLimit ? "text-destructive font-medium" : u.isNearLimit ? "text-amber-600 font-medium" : "text-muted-foreground"}>
                              {u.resource}
                            </span>
                            <span className="text-muted-foreground">
                              {u.used.toLocaleString()} / {u.isUnlimited ? "∞" : u.limit.toLocaleString()}
                              {u.isAtLimit && " ⚠️"}
                            </span>
                          </div>
                          {!u.isUnlimited && u.limit > 0 && (
                            <Progress value={u.percentage} className={`h-1.5 ${u.isAtLimit ? "[&>div]:bg-destructive" : u.isNearLimit ? "[&>div]:bg-amber-500" : ""}`} />
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                  <DialogClose asChild><Button variant="outline" className="mt-4 w-full">Close</Button></DialogClose>
                </>
              );
            })()}

            {selectedSub && actionType === "upgrade" && (
              <>
                <DialogHeader><DialogTitle>Upgrade — {selectedSub.tenantName}</DialogTitle></DialogHeader>
                <p className="text-sm text-muted-foreground">Current: <Badge variant="secondary" className="capitalize ml-1">{selectedSub.plan}</Badge> ({selectedSub.billingCycle})</p>
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>New Plan</Label>
                      <Select value={newPlan} onValueChange={(v) => setNewPlan(v as PlanType)}>
                        <SelectTrigger><SelectValue /></SelectTrigger>
                        <SelectContent>
                          {getUpgradePlans(selectedSub.plan).map((p) => {
                            const plan = PLANS.find((x) => x.id === p);
                            return <SelectItem key={p} value={p}>{plan?.name} (৳{plan?.price}/mo)</SelectItem>;
                          })}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label>Billing Cycle</Label>
                      <Select value={newCycle} onValueChange={(v) => setNewCycle(v as BillingCycle)}>
                        <SelectTrigger><SelectValue /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="monthly">Monthly</SelectItem>
                          <SelectItem value="yearly">Yearly (save 20%)</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  <Button onClick={handleUpgrade} className="w-full">Confirm Upgrade</Button>
                </div>
              </>
            )}

            {selectedSub && actionType === "downgrade" && (
              <>
                <DialogHeader><DialogTitle>Downgrade — {selectedSub.tenantName}</DialogTitle></DialogHeader>
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>New Plan</Label>
                      <Select value={newPlan} onValueChange={(v) => setNewPlan(v as PlanType)}>
                        <SelectTrigger><SelectValue /></SelectTrigger>
                        <SelectContent>
                          {getDowngradePlans(selectedSub.plan).map((p) => {
                            const plan = PLANS.find((x) => x.id === p);
                            return <SelectItem key={p} value={p}>{plan?.name} (৳{plan?.price}/mo)</SelectItem>;
                          })}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label>Billing Cycle</Label>
                      <Select value={newCycle} onValueChange={(v) => setNewCycle(v as BillingCycle)}>
                        <SelectTrigger><SelectValue /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="monthly">Monthly</SelectItem>
                          <SelectItem value="yearly">Yearly</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  <Button onClick={handleDowngrade} variant="secondary" className="w-full">Confirm Downgrade</Button>
                </div>
              </>
            )}

            {selectedSub && actionType === "extend" && (
              <>
                <DialogHeader><DialogTitle>Extend — {selectedSub.tenantName}</DialogTitle></DialogHeader>
                <p className="text-sm text-muted-foreground">Current expiry: {selectedSub.endDate || "N/A"}</p>
                <div className="flex gap-4 mt-2">
                  <Input type="number" min={1} value={extendValue} onChange={(e) => setExtendValue(e.target.value)} className="w-24" />
                  <Select value={extendUnit} onValueChange={(v) => setExtendUnit(v as "days" | "months")}>
                    <SelectTrigger className="w-32"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="days">Days</SelectItem>
                      <SelectItem value="months">Months</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <Button onClick={handleExtend} className="w-full mt-4">Extend Subscription</Button>
              </>
            )}

            {selectedSub && actionType === "renew" && (
              <>
                <DialogHeader><DialogTitle>Renew — {selectedSub.tenantName}</DialogTitle></DialogHeader>
                <p className="text-sm text-muted-foreground">
                  Renew {selectedSub.plan} plan ({selectedSub.billingCycle}) for ৳{selectedSub.price.toLocaleString()}
                </p>
                <Button onClick={handleRenew} className="w-full mt-4">Confirm Renewal</Button>
              </>
            )}

            {selectedSub && actionType === "suspend" && (
              <>
                <DialogHeader><DialogTitle>Suspend — {selectedSub.tenantName}</DialogTitle></DialogHeader>
                <p className="text-sm text-muted-foreground">The tenant will lose access until reactivated.</p>
                <div className="space-y-2 mt-2">
                  <Label>Reason</Label>
                  <Textarea value={actionReason} onChange={(e) => setActionReason(e.target.value)} placeholder="Reason for suspension..." rows={3} />
                </div>
                <Button onClick={handleSuspend} variant="destructive" className="w-full mt-4" disabled={!actionReason.trim()}>Suspend</Button>
              </>
            )}

            {selectedSub && actionType === "reactivate" && (
              <>
                <DialogHeader><DialogTitle>Reactivate — {selectedSub.tenantName}</DialogTitle></DialogHeader>
                <p className="text-sm text-muted-foreground">This will reactivate the subscription with 1 month added.</p>
                <Button onClick={handleReactivate} className="w-full mt-4">Reactivate</Button>
              </>
            )}

            {selectedSub && actionType === "cancel" && (
              <>
                <DialogHeader><DialogTitle>Cancel — {selectedSub.tenantName}</DialogTitle></DialogHeader>
                <p className="text-sm text-muted-foreground">This action cannot be undone easily.</p>
                <div className="space-y-2 mt-2">
                  <Label>Cancellation Reason</Label>
                  <Textarea value={actionReason} onChange={(e) => setActionReason(e.target.value)} placeholder="Why is this being cancelled?" rows={3} />
                </div>
                <Button onClick={handleCancel} variant="destructive" className="w-full mt-4" disabled={!actionReason.trim()}>Confirm Cancellation</Button>
              </>
            )}
          </DialogContent>
        </Dialog>
      </div>
    </AdminLayout>
  );
};

export default AdminSubscriptions;
