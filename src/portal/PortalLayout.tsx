import { Link, NavLink, Outlet, useNavigate } from "react-router-dom";
import { Briefcase, FileText, LogOut, Plane } from "lucide-react";
import { Button } from "@/components/ui/button";
import { clearPortalToken } from "@/lib/portalApi";

export default function PortalLayout() {
  const navigate = useNavigate();
  const logout = () => {
    clearPortalToken();
    navigate("/login");
  };
  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border bg-card">
        <div className="container mx-auto flex items-center justify-between px-4 py-3">
          <Link to="/" className="flex items-center gap-2 font-semibold">
            <Plane className="h-5 w-5 text-primary" />
            <span>My Travel Portal</span>
          </Link>
          <nav className="flex items-center gap-1">
            <NavLink
              to="/bookings"
              className={({ isActive }) =>
                `flex items-center gap-2 rounded-md px-3 py-2 text-sm ${
                  isActive ? "bg-primary text-primary-foreground" : "hover:bg-muted"
                }`
              }
            >
              <Briefcase className="h-4 w-4" /> My Bookings
            </NavLink>
            <NavLink
              to="/purchase-orders"
              className={({ isActive }) =>
                `flex items-center gap-2 rounded-md px-3 py-2 text-sm ${
                  isActive ? "bg-primary text-primary-foreground" : "hover:bg-muted"
                }`
              }
            >
              <FileText className="h-4 w-4" /> Purchase Orders
            </NavLink>
            <Button variant="ghost" size="sm" onClick={logout}>
              <LogOut className="h-4 w-4" />
            </Button>
          </nav>
        </div>
      </header>
      <main className="container mx-auto px-4 py-8">
        <Outlet />
      </main>
    </div>
  );
}
