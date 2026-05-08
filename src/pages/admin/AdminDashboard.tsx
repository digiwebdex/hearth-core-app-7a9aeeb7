import { useState, useEffect, useMemo } from "react";
import AdminLayout from "@/components/AdminLayout";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Building2, CreditCard, Users, Crown,
  DollarSign, UserPlus, Activity, RefreshCw,
} from "lucide-react";
import { adminApi, type AdminStats, type AdminTenant, type AdminPaymentRequest } from "@/lib/api";
import { useToast } from "@/hooks/use-toast";
import { useNavigate } from "react-router-dom";

const AdminDashboard = () => {
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [tenants, setTenants] = useState<AdminTenant[]>([]);
  const [paymentRequests, setPaymentRequests] = useState<AdminPaymentRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();
  const navigate = useNavigate();

  const fetchData = async () => {
    setLoading(true);
    try {
      const [s, t, pr] = await Promise.all([
        adminApi.getStats().catch(() => null),
        adminApi.getTenants().catch(() => []),
        adminApi.getPaymentRequests().catch(() => []),
      ]);
      if (s) setStats(s);
      setTenants(t);
      setPaymentRequests(pr);
    } catch {
      toast({ title: "Failed to load admin data", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchData(); }, []);

  const pendingPayments = paymentRequests.filter((r) => r.status === "pending").length;
  const totalApprovedRevenue = paymentRequests
    .filter((r) => r.status === "approved")
    .reduce((s, r) => s + (r.amount || 0), 0);

  const planDistribution = useMemo(() => {
    const map: Record<string, number> = {};
    tenants.forEach((t) => {
      const plan = t.subscriptionPlan || "free";
      map[plan] = (map[plan] || 0) + 1;
    });
    return Object.entries(map).map(([plan, count]) => ({ plan, count }));
  }, [tenants]);

  const statusDistribution = useMemo(() => {
    const active = tenants.filter((t) => t.subscriptionStatus === "active").length;
    const expired = tenants.filter((t) => t.subscriptionStatus === "expired").length;
    const other = tenants.length - active - expired;
    return { active, expired, other };
  }, [tenants]);

  const recentTenants = useMemo(() =>
    [...tenants].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()).slice(0, 6),
    [tenants]
  );

  const recentPayments = useMemo(() =>
    [...paymentRequests].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()).slice(0, 6),
    [paymentRequests]
  );

  const statCards = [
    { title: "Total Revenue", value: stats ? `৳${stats.totalRevenue.toLocaleString()}` : "—", icon: DollarSign },
    { title: "Total Agencies", value: stats?.totalTenants ?? tenants.length, icon: Building2 },
    { title: "Active Subscriptions", value: statusDistribution.active, icon: Crown },
    { title: "Pending Payments", value: pendingPayments, icon: CreditCard },
    { title: "Total Users", value: stats?.totalUsers ?? "—", icon: Users },
    { title: "Total Bookings", value: stats?.totalBookings ?? "—", icon: UserPlus },
  ];

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Admin Dashboard</h1>
            <p className="text-muted-foreground">Platform analytics and overview — live data</p>
          </div>
          <Button variant="outline" size="sm" onClick={fetchData} disabled={loading}>
            <RefreshCw className={`mr-2 h-4 w-4 ${loading ? "animate-spin" : ""}`} />
            Refresh
          </Button>
        </div>

        {/* Stats Grid */}
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
          {statCards.map((s) => (
            <Card key={s.title}>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-xs font-medium text-muted-foreground">{s.title}</CardTitle>
                <s.icon className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                {loading ? (
                  <Skeleton className="h-7 w-20" />
                ) : (
                  <div className="text-xl font-bold">{s.value}</div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Plan Distribution + Status */}
        <div className="grid gap-4 lg:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle>Plan Distribution</CardTitle>
              <CardDescription>Agencies by subscription plan</CardDescription>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="space-y-3">{[1,2,3].map(i => <Skeleton key={i} className="h-8 w-full" />)}</div>
              ) : planDistribution.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-6">No agencies yet</p>
              ) : (
                <div className="space-y-3">
                  {planDistribution.map((p) => {
                    const pct = tenants.length > 0 ? Math.round((p.count / tenants.length) * 100) : 0;
                    return (
                      <div key={p.plan} className="space-y-1.5">
                        <div className="flex items-center justify-between text-sm">
                          <span className="font-medium capitalize">{p.plan}</span>
                          <span className="text-muted-foreground">{p.count} ({pct}%)</span>
                        </div>
                        <div className="h-2 rounded-full bg-muted overflow-hidden">
                          <div className="h-full rounded-full bg-primary transition-all" style={{ width: `${pct}%` }} />
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Subscription Status</CardTitle>
              <CardDescription>Active vs expired agencies</CardDescription>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="space-y-3">{[1,2,3].map(i => <Skeleton key={i} className="h-8 w-full" />)}</div>
              ) : (
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Active</span>
                    <Badge className="bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200">{statusDistribution.active}</Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Expired</span>
                    <Badge variant="destructive">{statusDistribution.expired}</Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Other</span>
                    <Badge variant="secondary">{statusDistribution.other}</Badge>
                  </div>
                  <div className="pt-2 border-t">
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Total</span>
                      <span className="font-bold">{tenants.length} agencies</span>
                    </div>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Recent Tenants + Recent Payments */}
        <div className="grid gap-4 lg:grid-cols-2">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle>Recent Agencies</CardTitle>
                <CardDescription>Latest registrations</CardDescription>
              </div>
              <Button variant="ghost" size="sm" onClick={() => navigate("/admin/tenants")}>View All</Button>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="space-y-3">{[1,2,3].map(i => <Skeleton key={i} className="h-10 w-full" />)}</div>
              ) : recentTenants.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-6">No agencies yet</p>
              ) : (
                <div className="space-y-3">
                  {recentTenants.map((t) => (
                    <div key={t.id} className="flex items-center justify-between text-sm cursor-pointer hover:bg-muted/50 rounded-lg p-2 -mx-2" onClick={() => navigate(`/admin/tenants/${t.id}`)}>
                      <div>
                        <p className="font-medium">{t.name}</p>
                        <p className="text-xs text-muted-foreground">{new Date(t.createdAt).toLocaleDateString()}</p>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge variant="secondary" className="capitalize text-xs">{t.subscriptionPlan || "free"}</Badge>
                        <span className="text-xs text-muted-foreground">{t._count?.users || 0} users</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle>Recent Payments</CardTitle>
                <CardDescription>Latest payment requests</CardDescription>
              </div>
              <Button variant="ghost" size="sm" onClick={() => navigate("/admin/payments")}>View All</Button>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="space-y-3">{[1,2,3].map(i => <Skeleton key={i} className="h-10 w-full" />)}</div>
              ) : recentPayments.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-6">No payment requests yet</p>
              ) : (
                <div className="space-y-3">
                  {recentPayments.map((r) => (
                    <div key={r.id} className="flex items-center justify-between text-sm">
                      <div>
                        <p className="font-medium">৳{(r.amount || 0).toLocaleString()}</p>
                        <p className="text-xs text-muted-foreground">{r.trxId || "—"} • {r.method}</p>
                      </div>
                      <Badge className={
                        r.status === "approved" ? "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200" :
                        r.status === "rejected" ? "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200" :
                        "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200"
                      }>{r.status}</Badge>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </AdminLayout>
  );
};

export default AdminDashboard;