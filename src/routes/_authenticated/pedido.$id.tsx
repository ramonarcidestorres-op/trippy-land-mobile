import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Check, MapPin, Receipt, Clock, Rocket, ChevronLeft } from "lucide-react";
import { AppShell } from "@/components/AppShell";
import { EmptyState, ErrorState } from "@/components/States";
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
        <div className="space-y-4 pt-10">
          <div className="h-32 animate-pulse rounded-[32px] bg-surface-2/60" />
          <div className="h-64 animate-pulse rounded-[32px] bg-surface-2/60" />
        </div>
      </AppShell>
    );
  }

  if (error) {
    return (
      <AppShell>
        <div className="pt-10 rounded-[32px] bg-surface-2/40 p-8 text-center">
          <ErrorState error={error} onRetry={() => refetch()} />
        </div>
      </AppShell>
    );
  }

  if (!data) {
    return (
      <AppShell>
        <div className="pt-10">
          <EmptyState
            icon={<Receipt className="size-7" />}
            title="Pedido no encontrado"
            description="No encontramos este pedido en tu historial."
          />
        </div>
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
        <div className="mb-6 flex items-center gap-4 rounded-[28px] bg-primary p-5 text-primary-foreground shadow-lg">
          <div className="flex size-12 shrink-0 items-center justify-center rounded-full bg-white/20">
            <Check className="size-6" />
          </div>
          <div>
            <p className="text-[17px] font-bold">¡Pedido confirmado!</p>
            <p className="mt-0.5 text-[14px] font-medium opacity-90">
              Pagas en efectivo al recibir.
            </p>
          </div>
        </div>
      )}

      <div className="mb-6 flex items-start gap-4">
        {!nuevo && (
          <button
            onClick={() => window.history.back()}
            className="mt-1 flex size-10 shrink-0 items-center justify-center rounded-full bg-surface-2/60 transition-transform active:scale-90"
          >
            <ChevronLeft className="size-6 text-foreground" />
          </button>
        )}
        <div>
          <h1 className="text-[34px] font-bold leading-tight tracking-tight text-foreground">
            #{data.id.slice(0, 8).toUpperCase()}
          </h1>
          <p className="text-[15px] font-medium text-muted-foreground">{formatDate(data.created_at)}</p>
        </div>
      </div>

      <div className="space-y-4">
        {/* Tracking */}
        <section className="rounded-[32px] bg-surface-2/60 p-6">
          <div className="mb-5 flex items-center justify-between">
            <h2 className="text-[18px] font-bold text-foreground">Seguimiento</h2>
            {data.delivery_type === "fast" && (
              <span className="flex items-center gap-1.5 rounded-full bg-primary/20 px-3 py-1 text-[13px] font-bold text-primary">
                <Rocket className="size-4" /> Rápido
              </span>
            )}
          </div>
          
          {cancelled ? (
            <div className="rounded-[20px] bg-red-500/10 p-5">
              <p className="text-[15px] font-bold text-red-500">Este pedido fue cancelado.</p>
              {data.cancel_reason && (
                <p className="mt-1 text-[13px] font-medium text-red-400">Motivo: {data.cancel_reason}</p>
              )}
            </div>
          ) : (
            <ol className="relative ml-3 space-y-6">
              {ORDER_STATUSES.map((status, i) => {
                const done = i <= currentIndex;
                const historyEvent = history?.find((h) => h.status === status);
                return (
                  <li key={status} className="flex gap-4 relative">
                    <div className="flex flex-col items-center">
                      <span
                        className={cn(
                          "relative z-10 flex size-6 shrink-0 items-center justify-center rounded-full transition-colors",
                          done
                            ? "bg-primary text-primary-foreground shadow-sm shadow-primary/30"
                            : "bg-surface text-muted-foreground"
                        )}
                      >
                        {done && <Check className="size-3.5" />}
                      </span>
                      {i < ORDER_STATUSES.length - 1 && (
                        <div
                          className={cn(
                            "absolute left-3 top-6 -ml-px h-full w-[2px]",
                            i < currentIndex ? "bg-primary" : "bg-surface"
                          )}
                        />
                      )}
                    </div>
                    <div className="pt-0.5">
                      <p
                        className={cn(
                          "text-[15px] font-semibold leading-none",
                          done ? "text-foreground" : "text-muted-foreground"
                        )}
                      >
                        {STATUS_LABELS[status]}
                      </p>
                      {historyEvent && (
                        <p className="mt-1.5 flex items-center gap-1.5 text-[12px] font-medium text-muted-foreground">
                          <Clock className="size-3" />
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

        {/* Delivery Address */}
        {data.delivery_address && (
          <section className="rounded-[32px] bg-surface-2/60 p-6">
            <h2 className="mb-3 flex items-center gap-2 text-[15px] font-bold text-foreground">
              <MapPin className="size-4" /> Entrega
            </h2>
            <p className="text-[15px] font-medium text-muted-foreground leading-relaxed">{data.delivery_address}</p>
          </section>
        )}

        {/* Items & Summary */}
        <section className="rounded-[32px] bg-surface-2/60 p-6">
          <h2 className="mb-4 text-[18px] font-bold text-foreground">Detalle</h2>
          <ul className="space-y-4">
            {data.order_items.map((item) => {
              const s = item.products?.name?.toLowerCase() || "";
              let imgUrl = item.products?.image_url;
              if (!imgUrl) {
                if (s.includes("gom")) imgUrl = "https://images.unsplash.com/photo-1582058091505-f87a2e55a40f?w=400&q=80";
                else if (s.includes("choco")) imgUrl = "https://images.unsplash.com/photo-1606312619070-d48b4c652a52?w=400&q=80";
                else imgUrl = "https://images.unsplash.com/photo-1550258987-190a2d41a8ba?w=400&q=80";
              }

              return (
                <li key={item.id} className="flex items-center gap-4">
                  <div className="size-14 shrink-0 overflow-hidden rounded-2xl bg-surface">
                    <img
                      src={imgUrl}
                      alt={item.products?.name ?? "Producto"}
                      loading="lazy"
                      className="size-full object-cover"
                    />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-[15px] font-semibold text-foreground">{item.products?.name ?? "Producto retirado"}</p>
                    <p className="text-[13px] font-medium text-muted-foreground">
                      {item.quantity} × {formatPrice(item.price_at_time)}
                    </p>
                  </div>
                  <span className="shrink-0 text-[15px] font-bold text-foreground">
                    {formatPrice(Number(item.price_at_time) * item.quantity)}
                  </span>
                </li>
              );
            })}
          </ul>

          <div className="mt-6 space-y-2 border-t border-border/40 pt-4 text-[14px]">
            <Row label="Subtotal" value={formatPrice(subtotal)} />
            <Row label="Domicilio" value={formatPrice(deliveryFee)} />
            <div className="flex items-center justify-between pt-2 text-[18px] font-bold text-foreground">
              <span>Total</span>
              <span>{formatPrice(data.total)}</span>
            </div>
            <p className="pt-2 text-[13px] font-medium text-muted-foreground">
              Pago al recibir: {data.payment_method === "cash" ? "Efectivo" : (data.payment_method ?? "—")}
            </p>
          </div>
        </section>

        {!nuevo && (
          <Link
            to="/pedidos"
            className="flex h-14 w-full items-center justify-center rounded-full bg-surface-2/80 text-[16px] font-bold text-foreground transition-transform active:scale-95"
          >
            Ver todos mis pedidos
          </Link>
        )}
      </div>
    </AppShell>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between">
      <span className="font-medium text-muted-foreground">{label}</span>
      <span className="font-medium text-foreground">{value}</span>
    </div>
  );
}
