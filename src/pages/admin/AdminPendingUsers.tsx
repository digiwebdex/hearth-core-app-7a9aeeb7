import { useEffect, useState } from "react";
import AdminLayout from "@/components/AdminLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { CheckCircle2, XCircle, RefreshCw, UserPlus } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { adminApi, type PendingUser } from "@/lib/api";

const AdminPendingUsers = () => {
  const [users, setUsers] = useState<PendingUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [approveTarget, setApproveTarget] = useState<PendingUser | null>(null);
  const [rejectTarget, setRejectTarget] = useState<PendingUser | null>(null);
  const [reason, setReason] = useState("");
  const [working, setWorking] = useState(false);
  const { toast } = useToast();

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const data = await adminApi.getPendingUsers();
      setUsers(data);
    } catch (err: any) {
      toast({ variant: "destructive", title: "Failed to load", description: err.message });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchUsers(); }, []);

  const handleApprove = async () => {
    if (!approveTarget) return;
    setWorking(true);
    try {
      await adminApi.approveUser(approveTarget.id);
      toast({ title: "User approved", description: `${approveTarget.email} can now log in.` });
      setApproveTarget(null);
      fetchUsers();
    } catch (err: any) {
      toast({ variant: "destructive", title: "Approval failed", description: err.message });
    } finally {
      setWorking(false);
    }
  };

  const handleReject = async () => {
    if (!rejectTarget) return;
    setWorking(true);
    try {
      await adminApi.rejectUser(rejectTarget.id, reason.trim() || undefined);
      toast({ title: "User rejected", description: rejectTarget.email });
      setRejectTarget(null);
      setReason("");
      fetchUsers();
    } catch (err: any) {
      toast({ variant: "destructive", title: "Rejection failed", description: err.message });
    } finally {
      setWorking(false);
    }
  };

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Pending Signups</h1>
            <p className="text-sm text-muted-foreground">Review and approve new agency registrations.</p>
          </div>
          <Button variant="outline" size="sm" onClick={fetchUsers} disabled={loading}>
            <RefreshCw className={`mr-2 h-4 w-4 ${loading ? "animate-spin" : ""}`} />
            Refresh
          </Button>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <UserPlus className="h-5 w-5" />
              Awaiting Approval
              {!loading && <Badge variant="secondary">{users.length}</Badge>}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="space-y-2">
                <Skeleton className="h-12 w-full" />
                <Skeleton className="h-12 w-full" />
                <Skeleton className="h-12 w-full" />
              </div>
            ) : users.length === 0 ? (
              <div className="py-12 text-center text-muted-foreground">
                <CheckCircle2 className="mx-auto mb-2 h-10 w-10 text-emerald-500/60" />
                No pending signups right now.
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Agency</TableHead>
                    <TableHead>Submitted</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {users.map((u) => (
                    <TableRow key={u.id}>
                      <TableCell className="font-medium">{u.name}</TableCell>
                      <TableCell>{u.email}</TableCell>
                      <TableCell>{u.tenant?.name || "-"}</TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {new Date(u.createdAt).toLocaleString()}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          <Button size="sm" onClick={() => setApproveTarget(u)}>
                            <CheckCircle2 className="mr-1 h-4 w-4" /> Approve
                          </Button>
                          <Button size="sm" variant="destructive" onClick={() => setRejectTarget(u)}>
                            <XCircle className="mr-1 h-4 w-4" /> Reject
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </div>

      <AlertDialog open={!!approveTarget} onOpenChange={(o) => !o && setApproveTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Approve this user?</AlertDialogTitle>
            <AlertDialogDescription>
              {approveTarget?.name} ({approveTarget?.email}) will be able to log in immediately and start a 14-day Pro trial.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={working}>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleApprove} disabled={working}>
              {working ? "Approving…" : "Approve"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <Dialog open={!!rejectTarget} onOpenChange={(o) => { if (!o) { setRejectTarget(null); setReason(""); } }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Reject {rejectTarget?.email}?</DialogTitle>
          </DialogHeader>
          <div className="space-y-2">
            <Label htmlFor="reason">Reason (optional, shown on login attempt)</Label>
            <Textarea id="reason" value={reason} onChange={(e) => setReason(e.target.value)} rows={3} />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => { setRejectTarget(null); setReason(""); }} disabled={working}>Cancel</Button>
            <Button variant="destructive" onClick={handleReject} disabled={working}>
              {working ? "Rejecting…" : "Reject"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </AdminLayout>
  );
};

export default AdminPendingUsers;
