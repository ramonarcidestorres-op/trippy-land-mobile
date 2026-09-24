import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Check, MapPin, Clock, ChevronLeft, Bike, ShoppingBag, PackageCheck } from "lucide-react";
import { Logo } from "@/components/Logo";
import { AppShell } from "@/components/AppShell";
import { EmptyState, ErrorState } from "@/components/States";
import { supabase } from "@/integrations/supabase/client";
import { orderQuery, orderHistoryQuery } from "@/lib/queries";
import { formatDate, formatPrice } from "@/lib/format";
import { cn } from "@/lib/utils";
import { useAuth } from "@/hooks/useAuth";

type OrderDetailSearch = { nuevo?: boolean | undefined };

export const Route = createFileRoute("/_authenticated/pedido/$id")({
  ssr: false,
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
  const { data, isLoading, error, refetch } = useQuery(orderQuery(id));
  const { data: history } = useQuery(orderHistoryQuery(data?.id));

  // Todos los Hooks de React DEBEN ejecutarse al inicio antes de cualquier return condicional
  const [waText, setWaText] = useState("");
  const [waSending, setWaSending] = useState(false);
  const [timeLeft, setTimeLeft] = useState<number | null>(null);

  useEffect(() => {
    if (!data?.id) return;
    
    const channel = supabase
      .channel(`order-${data.id}`)
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "orders", filter: `id=eq.${data.id}` },
        (payload) => {
          if (payload.new) {
            queryClient.setQueryData(["order", id], (old: any) => {
              if (!old) return old;
              return { ...old, ...(payload.new as object) };
            });
          }
          queryClient.invalidateQueries({ queryKey: ["order", id] });
          queryClient.invalidateQueries({ queryKey: ["orders"] });
        }
      )
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "order_status_history", filter: `order_id=eq.${data.id}` },
        () => {
          queryClient.invalidateQueries({ queryKey: ["order_history", data.id] });
          toast.success("El estado de tu pedido ha cambiado");
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [data?.id, id, queryClient]);


  useEffect(() => {
    if (data?.status !== "arrived") {
      setTimeLeft(null);
      return;
    }
    const arrivedEvent = history?.find(h => h.status === "arrived");
    if (!arrivedEvent?.created_at) return;
    
    const arrivedTime = new Date(arrivedEvent.created_at).getTime();
    const target = arrivedTime + 7 * 60 * 1000;

    const interval = setInterval(() => {
      const remaining = Math.max(0, target - Date.now());
      setTimeLeft(remaining);
      if (remaining <= 0) clearInterval(interval);
    }, 1000);
    
    return () => clearInterval(interval);
  }, [data?.status, history]);

  async function handleSendWa() {
    if (!waText || !data?.id) return;
    setWaSending(true);
    const { error } = await supabase.from("orders").update({ whatsapp_contact: waText }).eq("id", data.id);
    setWaSending(false);
    if (error) {
      toast.error("No se pudo enviar. Intenta de nuevo.");
    } else {
      toast.success("Número enviado al domiciliario.");
      queryClient.invalidateQueries({ queryKey: ["order", id] });
    }
  }

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
  const items = data.order_items ?? [];
  const subtotal = data.subtotal ?? items.reduce(
    (s, i) => s + Number(i.price_at_time ?? 0) * i.quantity,
    0,
  );
  const deliveryFee = data.delivery_fee ?? (Number(data.total ?? 0) - subtotal);

  const stepIndex =
    cancelled ? -1
    : data.status === "pending" ? 0
    : data.status === "accepted" || data.status === "preparing" ? 1
    : data.status === "in_transit" || data.status === "dispatched" ? 2
    : data.status === "arrived" || data.status === "delivered" ? 3
    : 0;

  const STEPS = [
    { label: "Recibido", icon: ShoppingBag },
    { label: "Tienda Aceptó", icon: PackageCheck },
    { label: "En Camino", icon: Bike },
    { label: "Llegó", icon: MapPin },
  ];

  return (
    <AppShell>
      {/* Logo Trippy Land grande y centrado */}
      <div className="flex flex-col items-center justify-center pt-2 pb-5 text-center">
        <Logo className="h-28 sm:h-36 w-auto object-contain drop-shadow-[0_10px_25px_rgba(0,0,0,0.5)]" />
      </div>

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
        {/* Tracking en Vivo */}
        <section className="rounded-[32px] bg-surface-2/60 p-6">
          <div className="mb-6 flex items-center justify-between">
            <div>
              <h2 className="text-[19px] font-bold text-foreground">Seguimiento en Vivo</h2>
              <p className="text-[12px] font-medium text-muted-foreground">Señal en directo del pedido</p>
            </div>
            <div className="flex items-center gap-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/30 px-3 py-1 text-[11px] font-bold text-emerald-400">
              <span className="size-2 rounded-full bg-emerald-400 animate-ping" />
              Señal en Vivo
            </div>
          </div>

          {/* Stepper visual horizontal conectado */}
          {!cancelled && (
            <div className="mb-6 px-1">
              <div className="relative flex items-center justify-between">
                <div className="absolute left-6 right-6 top-1/2 h-1 -translate-y-1/2 bg-surface" />
                <div 
                  className="absolute left-6 top-1/2 h-1 -translate-y-1/2 bg-gradient-to-r from-primary via-sky-500 via-amber-500 to-emerald-500 transition-all duration-500 rounded-full" 
                  style={{ width: `${(Math.min(stepIndex, 3) / 3) * 82}%` }}
                />
                
                {STEPS.map((s, idx) => {
                  const isDone = idx <= stepIndex;
                  const isCurrent = idx === stepIndex;
                  const StepIcon = s.icon;
                  return (
                    <div key={s.label} className="relative z-10 flex flex-col items-center">
                      <div className={cn(
                        "flex size-12 items-center justify-center rounded-2xl transition-all duration-300",
                        isDone 
                          ? idx === 0 ? "bg-primary text-primary-foreground shadow-md ring-4 ring-primary/20"
                          : idx === 1 ? "bg-sky-500 text-white shadow-md ring-4 ring-sky-500/20"
                          : idx === 2 ? "bg-amber-500 text-white shadow-md ring-4 ring-amber-500/20"
                          : "bg-emerald-500 text-white shadow-md ring-4 ring-emerald-500/20"
                          : "bg-surface text-muted-foreground border border-border/40"
                      )}>
                        <StepIcon className={cn("size-5", isCurrent && "animate-pulse")} />
                      </div>
                      <span className={cn(
                        "mt-2 text-[11px] font-bold tracking-tight text-center max-w-[72px]",
                        isDone ? "text-foreground" : "text-muted-foreground/60"
                      )}>
                        {s.label}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Tarjeta de Estado Actual */}
          {cancelled ? (
            <div className="rounded-[24px] bg-red-500/10 p-5 border border-red-500/20">
              <p className="text-[16px] font-bold text-red-500">Pedido cancelado</p>
              {data.cancel_reason && (
                <p className="mt-1 text-[13px] font-medium text-red-400">Motivo: {data.cancel_reason}</p>
              )}
            </div>
          ) : data.status === "pending" ? (
            <div className="flex items-center gap-4 rounded-[24px] bg-surface p-5 border border-border/40">
              <div className="flex size-12 shrink-0 items-center justify-center rounded-2xl bg-primary/20 text-primary">
                <ShoppingBag className="size-6 animate-pulse" />
              </div>
              <div>
                <p className="text-[16px] font-bold text-foreground">Pedido recibido</p>
                <p className="text-[13px] text-muted-foreground">Esperando que la tienda acepte tu pedido en breve...</p>
              </div>
            </div>
          ) : data.status === "accepted" || data.status === "preparing" ? (
            <div className="flex items-center gap-4 rounded-[24px] bg-sky-500/10 p-5 border border-sky-500/20">
              <div className="flex size-12 shrink-0 items-center justify-center rounded-2xl bg-sky-500/20 text-sky-400">
                <PackageCheck className="size-6 animate-bounce" />
              </div>
              <div>
                <p className="text-[16px] font-bold text-sky-400">¡La tienda aceptó tu pedido!</p>
                <p className="text-[13px] text-muted-foreground">Tu pedido está siendo empacado y alistado para despacho.</p>
              </div>
            </div>
          ) : data.status === "in_transit" || data.status === "dispatched" ? (
            <div className="flex items-center gap-4 rounded-[24px] bg-amber-500/10 p-5 border border-amber-500/20">
              <div className="flex size-12 shrink-0 items-center justify-center rounded-2xl bg-amber-500/20 text-amber-400">
                <Bike className="size-6 animate-pulse" />
              </div>
              <div>
                <p className="text-[16px] font-bold text-amber-400">El repartidor va en camino</p>
                <p className="text-[13px] text-muted-foreground">
                  {data.delivery_type === "fast" ? "Entrega Rápida 🚀 (~15-20 min)" : "El repartidor ya va hacia tu dirección."}
                </p>
              </div>
            </div>
          ) : data.status === "arrived" || data.status === "delivered" ? (
            <div className="space-y-4 rounded-[24px] bg-emerald-500/10 p-5 border border-emerald-500/20">
              <div className="flex items-center gap-4">
                <div className="flex size-12 shrink-0 items-center justify-center rounded-2xl bg-emerald-500/20 text-emerald-400">
                  <MapPin className="size-6" />
                </div>
                <div>
                  <p className="text-[17px] font-extrabold text-emerald-400">¡El repartidor ya llegó!</p>
                  <p className="text-[14px] font-bold text-foreground">
                    Vehículo: <span className="text-primary">{data.status_details || "Repartidor en punto"}</span>
                  </p>
                </div>
              </div>
              
              {/* Temporizador */}
              {data.status === "arrived" && timeLeft !== null && timeLeft > 0 && (
                <div className="inline-flex items-center gap-2 rounded-full bg-surface-2 px-3 py-1.5 text-[14px] font-semibold text-muted-foreground">
                  <Clock className="size-4 text-primary" />
                  Tiempo de espera: {Math.floor(timeLeft / 60000)}:{(Math.floor(timeLeft / 1000) % 60).toString().padStart(2, "0")}
                </div>
              )}

              {/* Formulario de WhatsApp tras 7 minutos */}
              {data.status === "arrived" && timeLeft === 0 && !data.whatsapp_contact && (
                <div className="space-y-3 rounded-2xl bg-surface p-4">
                  <p className="text-[14px] font-semibold text-yellow-500">
                    Colocar tu número de teléfono porque pasó el tiempo de espera.
                  </p>
                  <div className="flex gap-2">
                    <input 
                      type="tel" 
                      placeholder="Ej: 3001234567"
                      className="flex-1 rounded-xl bg-surface-2 px-3 py-2 text-[15px] text-foreground outline-none focus:ring-2 focus:ring-primary/50"
                      value={waText}
                      onChange={(e) => setWaText(e.target.value)}
                    />
                    <button 
                      onClick={handleSendWa}
                      disabled={waSending || !waText}
                      className="rounded-xl bg-primary px-4 font-bold text-primary-foreground transition-transform active:scale-95 disabled:opacity-50"
                    >
                      {waSending ? "..." : "Enviar"}
                    </button>
                  </div>
                </div>
              )}
              
              {data.whatsapp_contact && (
                <p className="text-[13px] font-medium text-muted-foreground">
                  Número enviado: {data.whatsapp_contact}
                </p>
              )}
            </div>
          ) : null}
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
            {items.map((item) => {
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
