import { useState, useMemo } from "react";
import AdminLayout from "@/components/AdminLayout";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import {
  BarChart, Bar, LineChart, Line, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, AreaChart, Area,
} from "recharts";
import {
  TrendingUp, TrendingDown, DollarSign, Building2, Users, Crown,
  Download, UserPlus, AlertTriangle, Activity, BarChart3,
} from "lucide-react";

const COLORS = ["#3b82f6", "#10b981", "#f59e0b", "#8b5cf6", "#ef4444", "#06b6d4"];

// ── Mock Data ──
const mrrData = [
  { month: "Oct", mrr: 68000, arr: 816000 }, { month: "Nov", mrr: 74000, arr: 888000 },
  { month: "Dec", mrr: 82000, arr: 984000 }, { month: "Jan", mrr: 78000, arr: 936000 },
  { month: "Feb", mrr: 89000, arr: 1068000 }, { month: "Mar", mrr: 95000, arr: 1140000 },
];

const tenantGrowth = [
  { month: "Oct", newTenants: 12, totalTenants: 145, churned: 2 },
  { month: "Nov", newTenants: 18, totalTenants: 161, churned: 3 },
  { month: "Dec", newTenants: 22, totalTenants: 180, churned: 4 },
  { month: "Jan", newTenants: 15, totalTenants: 191, churned: 5 },
  { month: "Feb", newTenants: 20, totalTenants: 206, churned: 3 },
  { month: "Mar", newTenants: 28, totalTenants: 231, churned: 4 },
];

const planDist = [
  { name: "Free", value: 65, color: "#94a3b8" }, { name: "Basic", value: 48, color: "#3b82f6" },
  { name: "Pro", value: 52, color: "#8b5cf6" }, { name: "Business", value: 25, color: "#10b981" },
  { name: "Enterprise", value: 5, color: "#f59e0b" },
];

const revenueByPlan = [
  { plan: "Free", revenue: 0, tenants: 65 }, { plan: "Basic", revenue: 38400, tenants: 48 },
  { plan: "Pro", revenue: 78000, tenants: 52 }, { plan: "Business", revenue: 75000, tenants: 25 },
  { plan: "Enterprise", revenue: 49500, tenants: 5 },
];

const overduePayments = [
  { tenantName: "Dream Trips", plan: "Pro", amount: 1500, dueDate: "2026-03-15", daysPastDue: 17 },
  { tenantName: "Sky Wings", plan: "Basic", amount: 800, dueDate: "2026-03-20", daysPastDue: 12 },
  { tenantName: "Royal Travels", plan: "Business", amount: 3000, dueDate: "2026-03-25", daysPastDue: 7 },
];

const collectedVsDue = [
  { month: "Oct", collected: 62000, due: 68000 }, { month: "Nov", collected: 70000, due: 74000 },
  { month: "Dec", collected: 78000, due: 82000 }, { month: "Jan", collected: 71000, due: 78000 },
  { month: "Feb", collected: 84000, due: 89000 }, { month: "Mar", collected: 88000, due: 95000 },
];

const topTenants = [
  { name: "Acme Travel", plan: "Business", mrr: 3000, users: 12, bookings: 145 },
  { name: "Globe Tours", plan: "Pro", plan_mrr: 1500, users: 8, bookings: 98 },
  { name: "Star Holidays", plan: "Business", mrr: 3000, users: 15, bookings: 210 },
  { name: "Royal Travels", plan: "Pro", mrr: 1500, users: 6, bookings: 67 },
  { name: "Dream Trips", plan: "Enterprise", mrr: 9900, users: 25, bookings: 320 },
];

const AdminReports = () => {
  const [period, setPeriod] = useState("6m");

  const stats = useMemo(() => {
    const latestMrr = mrrData[mrrData.length - 1].mrr;
    const prevMrr = mrrData[mrrData.length - 2].mrr;
    const mrrGrowth = ((latestMrr - prevMrr) / prevMrr * 100).toFixed(1);
    const totalTenants = tenantGrowth[tenantGrowth.length - 1].totalTenants;
    const churnRate = ((tenantGrowth[tenantGrowth.length - 1].churned / tenantGrowth[tenantGrowth.length - 2].totalTenants) * 100).toFixed(1);
    const totalOverdue = overduePayments.reduce((s, p) => s + p.amount, 0);
    return { latestMrr, mrrGrowth, totalTenants, churnRate, totalOverdue, totalUsers: 847, activeSubs: 130 };
  }, []);

  const handleExport = (reportName: string) => {
    let csv = "";
    if (reportName === "mrr") {
      csv = "Month,MRR,ARR\n" + mrrData.map((d) => `${d.month},${d.mrr},${d.arr}`).join("\n");
    } else if (reportName === "tenants") {
      csv = "Month,New,Total,Churned\n" + tenantGrowth.map((d) => `${d.month},${d.newTenants},${d.totalTenants},${d.churned}`).join("\n");
    } else if (reportName === "overdue") {
      csv = "Tenant,Plan,Amount,Due Date,Days Past Due\n" + overduePayments.map((d) => `${d.tenantName},${d.plan},${d.amount},${d.dueDate},${d.daysPastDue}`).join("\n");
    }
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a"); a.href = url; a.download = `admin-${reportName}.csv`;
    document.body.appendChild(a); a.click(); document.body.removeChild(a); URL.revokeObjectURL(url);
  };

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Platform Reports</h1>
            <p className="text-muted-foreground">Revenue, growth, churn, and financial analytics</p>
          </div>
          <Select value={period} onValueChange={setPeriod}>
            <SelectTrigger className="w-[160px]"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="3m">Last 3 Months</SelectItem>
              <SelectItem value="6m">Last 6 Months</SelectItem>
              <SelectItem value="12m">Last 12 Months</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Stats */}
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-7">
          <Card><CardContent className="pt-6"><div className="flex items-center gap-3"><DollarSign className="h-8 w-8 text-green-600" /><div><p className="text-2xl font-bold">৳{stats.latestMrr.toLocaleString()}</p><p className="text-xs text-muted-foreground">MRR</p><p className="text-[10px] text-green-600 flex items-center gap-0.5"><TrendingUp className="h-3 w-3" />{stats.mrrGrowth}%</p></div></div></CardContent></Card>
          <Card><CardContent className="pt-6"><div className="flex items-center gap-3"><BarChart3 className="h-8 w-8 text-primary" /><div><p className="text-2xl font-bold">৳{(stats.latestMrr * 12).toLocaleString()}</p><p className="text-xs text-muted-foreground">ARR</p></div></div></CardContent></Card>
          <Card><CardContent className="pt-6"><div className="flex items-center gap-3"><Building2 className="h-8 w-8 text-blue-500" /><div><p className="text-2xl font-bold">{stats.totalTenants}</p><p className="text-xs text-muted-foreground">Total Agencies</p></div></div></CardContent></Card>
          <Card><CardContent className="pt-6"><div className="flex items-center gap-3"><Crown className="h-8 w-8 text-purple-500" /><div><p className="text-2xl font-bold">{stats.activeSubs}</p><p className="text-xs text-muted-foreground">Active Subs</p></div></div></CardContent></Card>
          <Card><CardContent className="pt-6"><div className="flex items-center gap-3"><Users className="h-8 w-8 text-indigo-500" /><div><p className="text-2xl font-bold">{stats.totalUsers}</p><p className="text-xs text-muted-foreground">Total Users</p></div></div></CardContent></Card>
          <Card><CardContent className="pt-6"><div className="flex items-center gap-3"><TrendingDown className="h-8 w-8 text-red-500" /><div><p className="text-2xl font-bold">{stats.churnRate}%</p><p className="text-xs text-muted-foreground">Churn Rate</p></div></div></CardContent></Card>
          <Card className="border-red-300 dark:border-red-600"><CardContent className="pt-6"><div className="flex items-center gap-3"><AlertTriangle className="h-8 w-8 text-red-500" /><div><p className="text-2xl font-bold">৳{stats.totalOverdue.toLocaleString()}</p><p className="text-xs text-muted-foreground">Overdue</p></div></div></CardContent></Card>
        </div>

        <Tabs defaultValue="revenue" className="space-y-4">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="revenue">Revenue</TabsTrigger>
            <TabsTrigger value="growth">Agency Growth</TabsTrigger>
            <TabsTrigger value="plans">Plan Analytics</TabsTrigger>
            <TabsTrigger value="overdue">Overdue & Churn</TabsTrigger>
          </TabsList>

          {/* Revenue */}
          <TabsContent value="revenue" className="space-y-4">
            <div className="flex justify-end"><Button variant="outline" size="sm" onClick={() => handleExport("mrr")}><Download className="mr-1 h-4 w-4" /> Export</Button></div>
            <div className="grid gap-4 lg:grid-cols-2">
              <Card>
                <CardHeader><CardTitle className="text-base">MRR Trend</CardTitle></CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={280}>
                    <AreaChart data={mrrData}>
                      <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                      <XAxis dataKey="month" tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 11 }} />
                      <YAxis tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 11 }} tickFormatter={(v) => `৳${(v/1000).toFixed(0)}k`} />
                      <Tooltip formatter={(v: number) => [`৳${v.toLocaleString()}`, "MRR"]} />
                      <Area type="monotone" dataKey="mrr" stroke="hsl(var(--primary))" fill="hsl(var(--primary))" fillOpacity={0.15} strokeWidth={2} />
                    </AreaChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
              <Card>
                <CardHeader><CardTitle className="text-base">Collected vs Due</CardTitle></CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={280}>
                    <BarChart data={collectedVsDue}>
                      <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                      <XAxis dataKey="month" tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 11 }} />
                      <YAxis tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 11 }} tickFormatter={(v) => `৳${(v/1000).toFixed(0)}k`} />
                      <Tooltip formatter={(v: number) => `৳${v.toLocaleString()}`} />
                      <Bar dataKey="collected" fill="#10b981" radius={[4,4,0,0]} name="Collected" />
                      <Bar dataKey="due" fill="#f59e0b" radius={[4,4,0,0]} name="Due" />
                    </BarChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
            </div>
            {/* Revenue by Plan */}
            <Card>
              <CardHeader><CardTitle className="text-base">Revenue by Plan</CardTitle></CardHeader>
              <CardContent>
                <Table>
                  <TableHeader><TableRow>
                    <TableHead>Plan</TableHead><TableHead className="text-right">Agencies</TableHead><TableHead className="text-right">Monthly Revenue</TableHead><TableHead className="text-right">% of MRR</TableHead>
                  </TableRow></TableHeader>
                  <TableBody>
                    {revenueByPlan.map((r) => (
                      <TableRow key={r.plan}>
                        <TableCell><Badge variant="secondary" className="capitalize">{r.plan}</Badge></TableCell>
                        <TableCell className="text-right">{r.tenants}</TableCell>
                        <TableCell className="text-right font-semibold">৳{r.revenue.toLocaleString()}</TableCell>
                        <TableCell className="text-right text-muted-foreground">{stats.latestMrr > 0 ? ((r.revenue/stats.latestMrr)*100).toFixed(1) : 0}%</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Tenant Growth */}
          <TabsContent value="growth" className="space-y-4">
            <div className="flex justify-end"><Button variant="outline" size="sm" onClick={() => handleExport("tenants")}><Download className="mr-1 h-4 w-4" /> Export</Button></div>
            <div className="grid gap-4 lg:grid-cols-2">
              <Card>
                <CardHeader><CardTitle className="text-base">Agency Growth</CardTitle></CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={280}>
                    <LineChart data={tenantGrowth}>
                      <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                      <XAxis dataKey="month" tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 11 }} />
                      <YAxis tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 11 }} />
                      <Tooltip />
                      <Line type="monotone" dataKey="totalTenants" stroke="hsl(var(--primary))" strokeWidth={2} name="Total" />
                      <Line type="monotone" dataKey="newTenants" stroke="#10b981" strokeWidth={2} name="New" />
                      <Line type="monotone" dataKey="churned" stroke="#ef4444" strokeWidth={2} name="Churned" />
                    </LineChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
              <Card>
                <CardHeader><CardTitle className="text-base">Top Agencies</CardTitle></CardHeader>
                <CardContent>
                  <Table>
                    <TableHeader><TableRow><TableHead>Agency</TableHead><TableHead>Plan</TableHead><TableHead className="text-right">Users</TableHead><TableHead className="text-right">Bookings</TableHead></TableRow></TableHeader>
                    <TableBody>
                      {topTenants.map((t) => (
                        <TableRow key={t.name}>
                          <TableCell className="font-medium">{t.name}</TableCell>
                          <TableCell><Badge variant="outline" className="capitalize">{t.plan}</Badge></TableCell>
                          <TableCell className="text-right">{t.users}</TableCell>
                          <TableCell className="text-right">{t.bookings}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Plan Analytics */}
          <TabsContent value="plans" className="space-y-4">
            <div className="grid gap-4 lg:grid-cols-2">
              <Card>
                <CardHeader><CardTitle className="text-base">Plan Distribution</CardTitle></CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={280}>
                    <PieChart>
                      <Pie data={planDist} cx="50%" cy="50%" outerRadius={100} dataKey="value" label={({ name, percent }) => `${name} ${(percent*100).toFixed(0)}%`}>
                        {planDist.map((d, i) => <Cell key={i} fill={d.color} />)}
                      </Pie>
                      <Tooltip />
                    </PieChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
              <Card>
                <CardHeader><CardTitle className="text-base">Plan Breakdown</CardTitle></CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {planDist.map((p) => {
                      const total = planDist.reduce((s, d) => s + d.value, 0);
                      const pct = Math.round((p.value / total) * 100);
                      return (
                        <div key={p.name} className="space-y-1.5">
                          <div className="flex items-center justify-between text-sm">
                            <span className="font-medium">{p.name}</span>
                            <span className="text-muted-foreground">{p.value} agencies ({pct}%)</span>
                          </div>
                          <div className="h-2 rounded-full bg-muted overflow-hidden">
                            <div className="h-full rounded-full" style={{ width: `${pct}%`, backgroundColor: p.color }} />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Overdue & Churn */}
          <TabsContent value="overdue" className="space-y-4">
            <div className="flex justify-end"><Button variant="outline" size="sm" onClick={() => handleExport("overdue")}><Download className="mr-1 h-4 w-4" /> Export</Button></div>
            <div className="grid gap-4 lg:grid-cols-2">
              <Card>
                <CardHeader>
                  <CardTitle className="text-base flex items-center gap-2"><AlertTriangle className="h-4 w-4 text-red-500" /> Overdue Payments</CardTitle>
                </CardHeader>
                <CardContent>
                  <Table>
                    <TableHeader><TableRow><TableHead>Agency</TableHead><TableHead>Plan</TableHead><TableHead className="text-right">Amount</TableHead><TableHead>Due</TableHead><TableHead className="text-right">Days Late</TableHead></TableRow></TableHeader>
                    <TableBody>
                      {overduePayments.map((p, i) => (
                        <TableRow key={i}>
                          <TableCell className="font-medium">{p.tenantName}</TableCell>
                          <TableCell><Badge variant="outline" className="capitalize">{p.plan}</Badge></TableCell>
                          <TableCell className="text-right font-semibold text-red-600">৳{p.amount.toLocaleString()}</TableCell>
                          <TableCell className="text-muted-foreground">{p.dueDate}</TableCell>
                          <TableCell className="text-right"><Badge variant="destructive">{p.daysPastDue}d</Badge></TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>
              <Card>
                <CardHeader><CardTitle className="text-base">Monthly Churn</CardTitle></CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={250}>
                    <BarChart data={tenantGrowth}>
                      <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                      <XAxis dataKey="month" tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 11 }} />
                      <YAxis tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 11 }} />
                      <Tooltip />
                      <Bar dataKey="churned" fill="#ef4444" radius={[4,4,0,0]} name="Churned" />
                    </BarChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </AdminLayout>
  );
};

export default AdminReports;
