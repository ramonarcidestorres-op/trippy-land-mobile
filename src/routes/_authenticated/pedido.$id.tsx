import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Check, MapPin, Receipt, Clock, Rocket } from "lucide-react";
import { AppShell } from "@/components/AppShell";
import { EmptyState, ErrorState } from "@/components/States";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { orderQuery, orderHistoryQuery } from "@/lib/queries";
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
  const queryClient = useQueryClient();
  const { data, isLoading, error, refetch } = useQuery(orderQuery(id, user?.id));
  const { data: history } = useQuery(orderHistoryQuery(data?.id));

  useEffect(() => {
    if (!data?.id) return;
    
    const channel = supabase
      .channel(`order-${data.id}`)
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "orders", filter: `id=eq.${data.id}` },
        () => {
          queryClient.invalidateQueries({ queryKey: ["order", id] });
          queryClient.invalidateQueries({ queryKey: ["orders"] });
        }
      )
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "order_status_history", filter: `order_id=eq.${data.id}` },
        (payload) => {
          queryClient.invalidateQueries({ queryKey: ["order_history", data.id] });
          const newStatus = payload.new.status;
          if (newStatus && STATUS_LABELS[newStatus as keyof typeof STATUS_LABELS]) {
            toast.success(`El pedido ahora está: ${STATUS_LABELS[newStatus as keyof typeof STATUS_LABELS]}`);
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [data?.id, id, queryClient]);

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
  const subtotal = data.subtotal ?? data.order_items.reduce(
    (s, i) => s + Number(i.price_at_time) * i.quantity,
    0,
  );
  const deliveryFee = data.delivery_fee ?? (Number(data.total) - subtotal);

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
        <h2 className="text-sm font-semibold">Estado de entrega</h2>
        {data.delivery_type === "fast" && (
          <div className="mt-2 flex items-center gap-1.5 text-xs text-primary font-medium bg-primary/10 w-max px-2 py-1 rounded-md">
            <Rocket className="size-3" /> Domicilio Rápido
          </div>
        )}
        {cancelled ? (
          <div className="mt-3 rounded-lg bg-destructive/10 p-3 border border-destructive/20">
            <p className="text-sm text-destructive font-semibold">Este pedido fue cancelado.</p>
            {data.cancel_reason && (
              <p className="text-xs text-destructive/80 mt-1">Motivo: {data.cancel_reason}</p>
            )}
          </div>
        ) : (
          <ol className="mt-3 space-y-0">
            {ORDER_STATUSES.map((status, i) => {
              const done = i <= currentIndex;
              const historyEvent = history?.find((h) => h.status === status);
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
                  <div className="pb-5">
                    <p
                      className={cn(
                        "text-sm",
                        done ? "font-medium" : "text-muted-foreground",
                      )}
                    >
                      {STATUS_LABELS[status]}
                    </p>
                    {historyEvent && (
                      <p className="text-[10px] text-muted-foreground flex items-center gap-1 mt-0.5">
                        <Clock className="size-2.5" />
                        {new Date(historyEvent.created_at ?? "").toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </p>
                    )}
                  </div>
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
          <Row label="Domicilio" value={formatPrice(deliveryFee)} />
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
