import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { Check, MapPin, Receipt } from "lucide-react";
import { AppShell } from "@/components/AppShell";
import { EmptyState, ErrorState } from "@/components/States";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/useAuth";
import { orderQuery } from "@/lib/queries";
import { formatDate, formatPrice, ORDER_STATUSES, STATUS_LABELS } from "@/lib/format";
import { cn } from "@/lib/utils";

type OrderDetailSearch = { nuevo?: boolean | undefined };

export const Route = createFileRoute("/_authenticated/pedido/$id")({
  validateSearch: (search: Record<string, unknown>): OrderDetailSearch => ({
    nuevo: search["nuevo"] === true || search["nuevo"] === "true" ? true : undefined,
  }),
  head: () => ({
    meta: [
      { title: "Detalle del pedido — Trippy Land Store" },
      { name: "description", content: "Resumen y seguimiento de tu pedido." },
      { property: "og:title", content: "Detalle del pedido — Trippy Land Store" },
      { property: "og:description", content: "Resumen y seguimiento de tu pedido." },
    ],
  }),
  component: OrderDetailPage,
});

function OrderDetailPage() {
  const { id } = Route.useParams();
  const { nuevo } = Route.useSearch();
  const { user } = useAuth();
  const { data, isLoading, error, refetch } = useQuery(orderQuery(id, user?.id));

  if (isLoading) {
    return (
      <AppShell>
        <div className="space-y-3">
          <div className="h-24 animate-pulse rounded-2xl bg-surface-2" />
          <div className="h-40 animate-pulse rounded-2xl bg-surface-2" />
        </div>
      </AppShell>
    );
  }

  if (error) {
    return (
      <AppShell>
        <ErrorState error={error} onRetry={() => refetch()} />
      </AppShell>
    );
  }

  if (!data) {
    return (
      <AppShell>
        <EmptyState
          icon={<Receipt className="size-7" />}
          title="Pedido no encontrado"
          description="No encontramos este pedido en tu historial."
        />
      </AppShell>
    );
  }

  const cancelled = data.status === "cancelled";
  const currentIndex = ORDER_STATUSES.indexOf(data.status as (typeof ORDER_STATUSES)[number]);
  const subtotal = data.order_items.reduce(
    (s, i) => s + Number(i.price_at_time) * i.quantity,
    0,
  );

  return (
    <AppShell>
      {nuevo && (
        <div className="mb-4 flex items-center gap-3 rounded-2xl border border-success/40 bg-success/10 p-4">
          <div className="grid size-10 shrink-0 place-items-center rounded-full bg-success text-success-foreground">
            <Check className="size-5" />
          </div>
          <div>
            <p className="font-semibold">¡Pedido confirmado!</p>
            <p className="text-xs text-muted-foreground">
              Pagas en efectivo al recibir. Te avisaremos cuando salga tu domicilio.
            </p>
          </div>
        </div>
      )}

      <h1 className="text-xl font-bold">Pedido #{data.id.slice(0, 8).toUpperCase()}</h1>
      <p className="text-xs text-muted-foreground">{formatDate(data.created_at)}</p>

      <section className="mt-5 rounded-2xl border border-border/60 bg-card p-4">
        <h2 className="text-sm font-semibold">Estado</h2>
        {cancelled ? (
          <p className="mt-2 text-sm text-destructive">Este pedido fue cancelado.</p>
        ) : (
          <ol className="mt-3 space-y-0">
            {ORDER_STATUSES.map((status, i) => {
              const done = i <= currentIndex;
              return (
                <li key={status} className="flex gap-3">
                  <div className="flex flex-col items-center">
                    <span
                      className={cn(
                        "grid size-5 place-items-center rounded-full border",
                        done
                          ? "border-transparent candy-gradient"
                          : "border-border bg-surface-2",
                      )}
                    >
                      {done && <Check className="size-3 text-primary-foreground" />}
                    </span>
                    {i < ORDER_STATUSES.length - 1 && (
                      <span
                        className={cn(
                          "w-px flex-1",
                          i < currentIndex ? "bg-primary" : "bg-border",
                        )}
                      />
                    )}
                  </div>
                  <span
                    className={cn(
                      "pb-5 text-sm",
                      done ? "font-medium" : "text-muted-foreground",
                    )}
                  >
                    {STATUS_LABELS[status]}
                  </span>
                </li>
              );
            })}
          </ol>
        )}
      </section>

      <section className="mt-4 rounded-2xl border border-border/60 bg-card p-4">
        <h2 className="text-sm font-semibold">Productos</h2>
        <ul className="mt-3 space-y-3">
          {data.order_items.map((item) => (
            <li key={item.id} className="flex items-center gap-3">
              <div className="size-12 shrink-0 overflow-hidden rounded-lg bg-surface-2">
                {item.products?.image_url && (
                  <img
                    src={item.products.image_url}
                    alt={item.products.name ?? "Producto"}
                    loading="lazy"
                    className="size-full object-cover"
                  />
                )}
              </div>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm">{item.products?.name ?? "Producto retirado"}</p>
                <p className="text-xs text-muted-foreground">
                  {item.quantity} × {formatPrice(item.price_at_time)}
                </p>
              </div>
              <span className="text-sm font-medium">
                {formatPrice(Number(item.price_at_time) * item.quantity)}
              </span>
            </li>
          ))}
        </ul>

        <div className="mt-4 space-y-1.5 border-t border-border pt-3 text-sm">
          <Row label="Subtotal" value={formatPrice(subtotal)} />
          <Row label="Domicilio" value={formatPrice(Number(data.total) - subtotal)} />
          <div className="flex items-center justify-between pt-1 text-base font-bold">
            <span>Total</span>
            <span className="candy-text">{formatPrice(data.total)}</span>
          </div>
          <p className="pt-1 text-xs text-muted-foreground">
            Pago: {data.payment_method === "cash" ? "Efectivo" : (data.payment_method ?? "—")}
          </p>
        </div>
      </section>

      {data.delivery_address && (
        <section className="mt-4 rounded-2xl border border-border/60 bg-card p-4">
          <h2 className="flex items-center gap-2 text-sm font-semibold">
            <MapPin className="size-4 text-candy-lime" /> Entrega
          </h2>
          <p className="mt-2 text-sm text-muted-foreground">{data.delivery_address}</p>
        </section>
      )}

      <Button asChild variant="secondary" className="mt-5 w-full">
        <Link to="/pedidos">Ver todos mis pedidos</Link>
      </Button>
    </AppShell>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-muted-foreground">{label}</span>
      <span>{value}</span>
    </div>
  );
}
