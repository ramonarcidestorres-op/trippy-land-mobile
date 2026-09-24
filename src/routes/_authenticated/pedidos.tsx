import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { Receipt, ChevronRight, Package, ArrowLeft, Clock } from "lucide-react";
import { AppShell } from "@/components/AppShell";
import { EmptyState, ErrorState } from "@/components/States";
import { useAuth } from "@/hooks/useAuth";
import { ordersQuery } from "@/lib/queries";
import { formatDate, formatRelativeTime, formatPrice, STATUS_LABELS } from "@/lib/format";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/_authenticated/pedidos")({
  head: () => ({
    meta: [
      { title: "Mis pedidos — Trippy Land Store" },
      { name: "description", content: "Historial y seguimiento de tus pedidos." },
    ],
  }),
  component: OrdersPage,
});

function OrdersPage() {
  const { user } = useAuth();
  const { data, isLoading, error, refetch } = useQuery(ordersQuery(user?.id));

  return (
    <AppShell>
      <div className="space-y-6 pb-24">
        {/* Cabecera */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link
              to="/"
              className="flex size-10 shrink-0 items-center justify-center rounded-full bg-surface-2/80 transition-transform active:scale-90"
              aria-label="Volver al inicio"
            >
              <ArrowLeft className="size-5 text-foreground" />
            </Link>
            <div>
              <h1 className="text-[26px] font-extrabold tracking-tight text-foreground">
                Mis Pedidos
              </h1>
              <p className="text-[13px] text-muted-foreground">
                Historial y seguimiento en vivo
              </p>
            </div>
          </div>
        </div>

        {isLoading ? (
          <div className="space-y-3 pt-2">
            {[0, 1, 2].map((i) => (
              <div key={i} className="h-28 animate-pulse rounded-[24px] bg-surface-2/60" />
            ))}
          </div>
        ) : error ? (
          <div className="pt-4">
            <ErrorState error={error} onRetry={() => refetch()} />
          </div>
        ) : data && data.length > 0 ? (
          <div className="space-y-3 pt-1">
            {data.map((order) => {
              const items = order.order_items ?? [];
              const itemsText = items.map((i) => `${i.quantity}× ${(i as any).products?.name || "Producto"}`).join(", ");
              const isDelivered = order.status === "delivered";
              const isCancelled = order.status === "cancelled";

              return (
                <Link
                  key={order.id}
                  to="/pedido/$id"
                  params={{ id: order.id }}
                  className="block overflow-hidden rounded-[24px] border border-border/40 bg-surface-2/70 p-4 transition-all hover:border-primary/50 active:scale-[0.98]"
                >
                  <div className="flex items-start justify-between gap-2 border-b border-border/20 pb-3">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-[16px] font-extrabold text-foreground">
                          #{order.id.slice(0, 8).toUpperCase()}
                        </span>
                      </div>
                      <div className="mt-1 flex items-center gap-1.5 text-[12px] text-muted-foreground">
                        <Clock className="size-3 text-primary/80" />
                        <span>{formatRelativeTime(order.created_at)}</span>
                        <span>•</span>
                        <span>{formatDate(order.created_at)}</span>
                      </div>
                    </div>

                    <div className="text-right">
                      <span className="text-[16px] font-extrabold text-foreground">
                        {formatPrice(order.total)}
                      </span>
                      <div>
                        <span
                          className={cn(
                            "mt-1 inline-block rounded-full px-2.5 py-0.5 text-[11px] font-bold",
                            isCancelled && "bg-destructive/20 text-destructive",
                            isDelivered && "bg-surface-2 text-muted-foreground",
                            !isCancelled && !isDelivered && "bg-primary/20 text-primary animate-pulse"
                          )}
                        >
                          {STATUS_LABELS[order.status] ?? order.status}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Resumen de productos si existen */}
                  {items.length > 0 && (
                    <div className="pt-2.5 flex items-center justify-between text-[13px] text-muted-foreground">
                      <span className="line-clamp-1 flex-1 pr-2">
                        {itemsText}
                      </span>
                      <ChevronRight className="size-4 shrink-0 text-muted-foreground" />
                    </div>
                  )}

                  {/* Dirección de entrega */}
                  {order.delivery_address && (
                    <div className="mt-2 text-[12px] text-muted-foreground/80 line-clamp-1">
                      📍 {order.delivery_address}
                    </div>
                  )}
                </Link>
              );
            })}
          </div>
        ) : (
          <div className="pt-8">
            <EmptyState
              icon={<Receipt className="size-8 text-primary" />}
              title="Aún no tienes pedidos"
              description="Cuando hagas tu pedido aparecerá aquí para que puedas hacerle seguimiento en tiempo real."
              action={
                <Link
                  to="/catalogo"
                  search={{}}
                  className="mt-4 flex h-12 w-full items-center justify-center rounded-full bg-primary font-bold text-primary-foreground shadow-sm transition-transform active:scale-95"
                >
                  Explorar catálogo
                </Link>
              }
            />
          </div>
        )}
      </div>
    </AppShell>
  );
}
