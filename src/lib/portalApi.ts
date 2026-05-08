// Portal API client — separate token namespace from the agency app.
const BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:4000/api";
const TOKEN_KEY = "portal_token";

export function getPortalToken(): string | null {
  return localStorage.getItem(TOKEN_KEY);
}
export function setPortalToken(token: string) {
  localStorage.setItem(TOKEN_KEY, token);
}
export function clearPortalToken() {
  localStorage.removeItem(TOKEN_KEY);
}

async function req<T>(path: string, opts: RequestInit = {}): Promise<T> {
  const token = getPortalToken();
  const res = await fetch(`${BASE_URL}${path}`, {
    ...opts,
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...opts.headers,
    },
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ message: res.statusText }));
    throw new Error(err.message || "Request failed");
  }
  return res.json();
}

export interface PortalSession {
  token: string;
  email: string;
  roles: ("customer" | "supplier")[];
}

export interface PortalBooking {
  id: string;
  title?: string | null;
  destination?: string | null;
  travelDateFrom?: string | null;
  travelDateTo?: string | null;
  status: string;
  paymentStatus: string;
  amount: number;
  paidAmount: number;
  dueAmount: number;
  tenantName?: string;
}

export interface PortalPurchaseOrder {
  id: string;
  description: string;
  totalAmount: number;
  paidAmount: number;
  dueAmount: number;
  status: string;
  dueDate?: string | null;
  createdAt: string;
  tenantName?: string;
}

export const portalApi = {
  requestMagicLink: (email: string) =>
    req<{ ok: true }>("/portal/auth/request-link", {
      method: "POST",
      body: JSON.stringify({ email }),
    }),
  verify: (token: string) =>
    req<PortalSession>("/portal/auth/verify", {
      method: "POST",
      body: JSON.stringify({ token }),
    }),
  me: () => req<PortalSession>("/portal/auth/me"),
  bookings: () => req<PortalBooking[]>("/portal/bookings"),
  purchaseOrders: () => req<PortalPurchaseOrder[]>("/portal/purchase-orders"),
};
