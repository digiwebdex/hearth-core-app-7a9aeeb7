import { createContext, useContext, useState, useEffect, useCallback } from "react";
import { authApi, tenantApi, type User, type Tenant } from "@/lib/api";
import type { PlanType } from "@/lib/plans";
import { mapLegacyRole, type AppRole } from "@/lib/permissions";

interface AuthContextType {
  user: User | null;
  tenant: Tenant | null;
  currentPlan: PlanType;
  appRole: AppRole;
  isSubscriptionExpired: boolean;
  isTrialActive: boolean;
  trialDaysLeft: number;
  loading: boolean;
  login: (email: string, password: string) => Promise<User>;
  register: (data: { name: string; email: string; password: string; tenantName: string }) => Promise<{ pendingApproval: boolean; message?: string; user?: User }>;
  logout: () => void;
  refreshTenant: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | null>(null);

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be inside AuthProvider");
  return ctx;
};

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [tenant, setTenant] = useState<Tenant | null>(null);
  const [loading, setLoading] = useState(true);

  const currentPlan: PlanType = (tenant?.subscriptionPlan as PlanType) || "free";
  const appRole: AppRole = user ? mapLegacyRole(user.role) : "sales_agent";

  const isTrialActive = tenant?.subscriptionStatus === "trial";
  const trialDaysLeft = (() => {
    if (!isTrialActive || !tenant?.subscriptionExpiry) return 0;
    const diff = new Date(tenant.subscriptionExpiry).getTime() - Date.now();
    return Math.max(0, Math.ceil(diff / (1000 * 60 * 60 * 24)));
  })();

  const isSubscriptionExpired = (() => {
    if (!tenant) return false;
    if (currentPlan === "free") return false;
    if (tenant.subscriptionStatus === "expired" || tenant.subscriptionStatus === "cancelled") return true;
    if (tenant.subscriptionExpiry) {
      return new Date(tenant.subscriptionExpiry) < new Date();
    }
    return false;
  })();

  const fetchTenant = async () => {
    try {
      const t = await tenantApi.get();
      setTenant(t);
    } catch {
      // Tenant fetch failed, use defaults
    }
  };

  const refreshTenant = useCallback(async () => {
    await fetchTenant();
  }, []);

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) {
      setLoading(false);
      return;
    }
    Promise.all([
      authApi.me().catch(() => { localStorage.removeItem("token"); return null; }),
      tenantApi.get().catch(() => null),
    ]).then(([u, t]) => {
      if (u) setUser(u);
      if (t) setTenant(t);
    }).finally(() => setLoading(false));
  }, []);

  const login = useCallback(async (email: string, password: string) => {
    const res = await authApi.login(email, password);
    localStorage.setItem("token", res.token);
    setUser(res.user);
    fetchTenant();
    return res.user;
  }, []);

  const register = useCallback(
    async (data: { name: string; email: string; password: string; tenantName: string }) => {
      const res = await authApi.register(data);
      // New signups are pending admin approval — no token returned
      if (res.pendingApproval || !res.token) {
        return { pendingApproval: true, message: res.message };
      }
      // Legacy path (auto-approval) — should not happen, but kept defensive
      localStorage.setItem("token", res.token);
      if (res.user) setUser(res.user);
      fetchTenant();
      return { pendingApproval: false, user: res.user };
    },
    []
  );

  const logout = useCallback(() => {
    authApi.logout().catch(() => {}); // fire-and-forget audit log
    localStorage.removeItem("token");
    setUser(null);
    setTenant(null);
  }, []);

  return (
    <AuthContext.Provider value={{ user, tenant, currentPlan, appRole, isSubscriptionExpired, isTrialActive, trialDaysLeft, loading, login, register, logout, refreshTenant }}>
      {children}
    </AuthContext.Provider>
  );
};
