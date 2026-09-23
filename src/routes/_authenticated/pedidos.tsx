import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { Receipt } from "lucide-react";
import { AppShell } from "@/components/AppShell";
import { EmptyState, ErrorState } from "@/components/States";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/useAuth";
import { ordersQuery } from "@/lib/queries";
import { formatDate, formatPrice, STATUS_LABELS } from "@/lib/format";

export const Route = createFileRoute("/_authenticated/pedidos")({
  head: () => ({
    meta: [
      { title: "Mis pedidos — Trippy Land Store" },
      { name: "description", content: "Historial y seguimiento de tus pedidos de dulces." },
      { property: "og:title", content: "Mis pedidos — Trippy Land Store" },
      {
        property: "og:description",
        content: "Historial y seguimiento de tus pedidos de dulces.",
      },
    ],
  }),
  component: OrdersPage,
});

function OrdersPage() {
  const { user } = useAuth();
  const { data, isLoading, error, refetch } = useQuery(ordersQuery(user?.id));

  return (
    <AppShell>
      <h1 className="text-xl font-bold">Mis pedidos</h1>

      {isLoading ? (
        <div className="mt-4 space-y-3">
          {[0, 1, 2].map((i) => (
            <div key={i} className="h-20 animate-pulse rounded-2xl bg-surface-2" />
          ))}
        </div>
      ) : error ? (
        <div className="mt-4">
          <ErrorState error={error} onRetry={() => refetch()} />
        </div>
      ) : data?.length ? (
        <ul className="mt-4 space-y-3">
          {data.map((order) => (
            <li key={order.id}>
              <Link
                to="/pedido/$id"
                params={{ id: order.id }}
                search={{}}
                className="flex items-center justify-between rounded-2xl border border-border/60 bg-card p-4 transition-colors hover:border-primary/60"
              >
                <div className="min-w-0">
                  <p className="text-sm font-semibold">
                    Pedido #{order.id.slice(0, 8).toUpperCase()}
                  </p>
                  <p className="text-xs text-muted-foreground">{formatDate(order.created_at)}</p>
                  <span className="mt-1 inline-block rounded-full bg-surface-2 px-2.5 py-0.5 text-[11px] text-candy-lime">
                    {STATUS_LABELS[order.status] ?? order.status}
                  </span>
                </div>
                <span className="text-sm font-semibold">{formatPrice(order.total)}</span>
              </Link>
            </li>
          ))}
        </ul>
      ) : (
        <div className="mt-4">
          <EmptyState
            icon={<Receipt className="size-7" />}
            title="Aún no tienes pedidos"
            description="Cuando hagas tu primer pedido aparecerá aquí con su seguimiento."
            action={
              <Button asChild variant="secondary">
                <Link to="/catalogo" search={{}}>Explorar catálogo</Link>
              </Button>
            }
          />
        </div>
      )}
    </AppShell>
  );
}
