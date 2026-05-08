import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import AdminLayout from "@/components/AdminLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Ban, CheckCircle, Eye, Search, RefreshCw, Plus } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { adminApi, type AdminTenant } from "@/lib/api";

const AdminTenants = () => {
  const navigate = useNavigate();
  const [tenants, setTenants] = useState<AdminTenant[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const { toast } = useToast();
  const [createOpen, setCreateOpen] = useState(false);
  const [creating, setCreating] = useState(false);
  const [form, setForm] = useState({
    tenantName: "",
    ownerName: "",
    ownerEmail: "",
    ownerPassword: "",
    subscriptionPlan: "basic",
    subscriptionStatus: "active",
    subscriptionMonths: 1,
  });

  const resetForm = () => setForm({
    tenantName: "", ownerName: "", ownerEmail: "", ownerPassword: "",
    subscriptionPlan: "basic", subscriptionStatus: "active", subscriptionMonths: 1,
  });

  const handleCreate = async () => {
    if (!form.tenantName || !form.ownerName || !form.ownerEmail || !form.ownerPassword) {
      toast({ title: "Missing fields", description: "All fields are required", variant: "destructive" });
      return;
    }
    setCreating(true);
    try {
      await adminApi.createTenant({ ...form, subscriptionMonths: Number(form.subscriptionMonths) });
      toast({ title: "Tenant created", description: form.tenantName });
      setCreateOpen(false);
      resetForm();
      fetchTenants();
    } catch (err: any) {
      toast({ title: "Failed to create tenant", description: err.message, variant: "destructive" });
    } finally {
      setCreating(false);
    }
  };

    setLoading(true);
    try {
      const data = await adminApi.getTenants();
      setTenants(data);
    } catch (err: any) {
      toast({ title: "Failed to load tenants", description: err.message, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchTenants(); }, []);

  const filtered = tenants.filter(
    (t) =>
      t.name.toLowerCase().includes(search.toLowerCase()) ||
      (t.users?.[0]?.email || "").toLowerCase().includes(search.toLowerCase())
  );

  const toggleSuspend = async (tenant: AdminTenant) => {
    const newStatus = tenant.subscriptionStatus === "suspended" ? "active" : "suspended";
    try {
      await adminApi.updateTenant(tenant.id, { subscriptionStatus: newStatus } as any);
      setTenants((prev) =>
        prev.map((t) => t.id === tenant.id ? { ...t, subscriptionStatus: newStatus } : t)
      );
      toast({
        title: newStatus === "suspended" ? "Company suspended" : "Company reactivated",
        description: tenant.name,
        variant: newStatus === "suspended" ? "destructive" : "default",
      });
    } catch (err: any) {
      toast({ title: "Action failed", description: err.message, variant: "destructive" });
    }
  };

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">All Tenants</h1>
            <p className="text-muted-foreground">View and manage all registered companies</p>
          </div>
          <Button variant="outline" size="sm" onClick={fetchTenants} disabled={loading}>
            <RefreshCw className={`mr-2 h-4 w-4 ${loading ? "animate-spin" : ""}`} /> Refresh
          </Button>
        </div>

        <div className="flex items-center gap-2 max-w-sm">
          <Search className="h-4 w-4 text-muted-foreground" />
          <Input placeholder="Search by name or email…" value={search} onChange={(e) => setSearch(e.target.value)} />
        </div>

        <Card>
          <CardHeader><CardTitle>Companies ({filtered.length})</CardTitle></CardHeader>
          <CardContent>
            {loading ? (
              <div className="space-y-3">{[1,2,3,4,5].map(i => <Skeleton key={i} className="h-12 w-full" />)}</div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Company</TableHead>
                    <TableHead>Owner</TableHead>
                    <TableHead>Plan</TableHead>
                    <TableHead className="text-center">Users</TableHead>
                    <TableHead className="text-center">Bookings</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Created</TableHead>
                    <TableHead className="w-[140px]">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filtered.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={8} className="text-center text-muted-foreground py-8">No tenants found.</TableCell>
                    </TableRow>
                  ) : (
                    filtered.map((t) => {
                      const owner = t.users?.find((u) => u.role === "tenant_owner" || u.role === "owner") || t.users?.[0];
                      return (
                        <TableRow key={t.id} className={t.subscriptionStatus === "suspended" ? "opacity-60" : ""}>
                          <TableCell className="font-medium">{t.name}</TableCell>
                          <TableCell>
                            <div>
                              <p className="text-sm">{owner?.name || "—"}</p>
                              <p className="text-xs text-muted-foreground">{owner?.email || "—"}</p>
                            </div>
                          </TableCell>
                          <TableCell><Badge variant="secondary" className="capitalize">{t.subscriptionPlan || "free"}</Badge></TableCell>
                          <TableCell className="text-center">{t._count?.users || 0}</TableCell>
                          <TableCell className="text-center">{t._count?.bookings || 0}</TableCell>
                          <TableCell>
                            {t.subscriptionStatus === "active" ? (
                              <Badge className="bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200">Active</Badge>
                            ) : t.subscriptionStatus === "suspended" ? (
                              <Badge variant="destructive">Suspended</Badge>
                            ) : (
                              <Badge variant="secondary" className="capitalize">{t.subscriptionStatus || "—"}</Badge>
                            )}
                          </TableCell>
                          <TableCell className="text-muted-foreground text-sm">{new Date(t.createdAt).toLocaleDateString()}</TableCell>
                          <TableCell>
                            <div className="flex gap-1">
                              <Button variant="ghost" size="icon" onClick={() => navigate(`/admin/tenants/${t.id}`)} title="View details">
                                <Eye className="h-4 w-4" />
                              </Button>
                              <Button variant="ghost" size="icon" onClick={() => toggleSuspend(t)} title={t.subscriptionStatus === "suspended" ? "Reactivate" : "Suspend"}>
                                {t.subscriptionStatus === "suspended" ? (
                                  <CheckCircle className="h-4 w-4 text-green-600" />
                                ) : (
                                  <Ban className="h-4 w-4 text-destructive" />
                                )}
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      );
                    })
                  )}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </div>
    </AdminLayout>
  );
};

export default AdminTenants;