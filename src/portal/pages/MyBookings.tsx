import { useQuery } from "@tanstack/react-query";
import { portalApi } from "@/lib/portalApi";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

export default function MyBookings() {
  const { data, isLoading, error } = useQuery({
    queryKey: ["portal-bookings"],
    queryFn: portalApi.bookings,
  });

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl font-semibold">My Bookings</h1>
        <p className="text-sm text-muted-foreground">All trips booked under your email.</p>
      </div>

      {isLoading && <p className="text-muted-foreground">Loading…</p>}
      {error && <p className="text-destructive">{(error as Error).message}</p>}
      {data && data.length === 0 && (
        <Card>
          <CardContent className="py-12 text-center text-muted-foreground">
            No bookings yet.
          </CardContent>
        </Card>
      )}

      <div className="grid gap-3">
        {data?.map((b) => (
          <Card key={b.id}>
            <CardContent className="p-4 flex flex-wrap items-start justify-between gap-3">
              <div>
                <div className="font-medium">{b.title || b.destination || "Booking"}</div>
                <div className="text-sm text-muted-foreground">
                  {b.destination} · {b.travelDateFrom || "TBD"}
                  {b.travelDateTo ? ` → ${b.travelDateTo}` : ""}
                </div>
                {b.tenantName && (
                  <div className="text-xs text-muted-foreground mt-1">
                    Agency: {b.tenantName}
                  </div>
                )}
              </div>
              <div className="text-right space-y-1">
                <div className="flex gap-2 justify-end">
                  <Badge variant="outline">{b.status}</Badge>
                  <Badge>{b.paymentStatus}</Badge>
                </div>
                <div className="text-sm">
                  ৳{b.paidAmount.toLocaleString()} / ৳{b.amount.toLocaleString()}
                </div>
                {b.dueAmount > 0 && (
                  <div className="text-xs text-destructive">
                    Due: ৳{b.dueAmount.toLocaleString()}
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
