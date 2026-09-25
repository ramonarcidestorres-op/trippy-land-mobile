import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Check, MapPin, Clock, ChevronLeft, Bike, ShoppingBag, PackageCheck, Receipt, XCircle, Home } from "lucide-react";
import { Logo } from "@/components/Logo";
import { AppShell } from "@/components/AppShell";
import { PushNotificationButton } from "@/components/PushNotificationButton";
import { OrderNotificationPromptModal } from "@/components/OrderNotificationPromptModal";
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

const STATUS_ANNOUNCEMENTS: Record<string, string> = {
  accepted: "Tu pedido fue aceptado por la tienda.",
  preparing: "Tu pedido se está preparando.",
  in_transit: "Tu pedido va en camino a tu dirección.",
  dispatched: "Tu pedido va en camino.",
  arrived: "Tu repartidor llegó y está afuera en tu punto.",
  delivered: "Pedido entregado con éxito. Que lo disfrutes.",
  cancelled: "Tu pedido fue cancelado.",
};

import { playWhatsAppChime } from "@/lib/sound";

function triggerVibration() {
  try {
    if (typeof window !== "undefined" && "vibrate" in navigator) {
      navigator.vibrate([100, 50, 100]);
    }
  } catch {
    // ignore
  }
}

function playCustomerChime() {
  playWhatsAppChime();
}

function OrderDetailPage() {
  const { id } = Route.useParams();
  const { nuevo } = Route.useSearch();
  const { user } = useAuth();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { data, isLoading, error, refetch } = useQuery(orderQuery(id));
  const { data: history } = useQuery(orderHistoryQuery(data?.id));

  const [waText, setWaText] = useState("");
  const [waSending, setWaSending] = useState(false);
  const [timeLeft, setTimeLeft] = useState<number | null>(null);

  // Asegurar que retroceder en el navegador/celular lleve siempre al Inicio (Home)
  useEffect(() => {
    const handlePopState = () => {
      navigate({ to: "/" });
    };
    window.addEventListener("popstate", handlePopState);
    return () => window.removeEventListener("popstate", handlePopState);
  }, [navigate]);

  // Guardar en localStorage para acceso seguro en "Mis pedidos"
  useEffect(() => {
    if (id) {
      try {
        const stored = JSON.parse(localStorage.getItem("tls_my_orders") || "[]");
        if (!stored.includes(id)) {
          stored.unshift(id);
          localStorage.setItem("tls_my_orders", JSON.stringify(stored.slice(0, 50)));
        }
      } catch {
        // ignore
      }
    }
  }, [id]);

  useEffect(() => {
    if (!data?.id) return;
    
    const channel = supabase
      .channel(`order-${data.id}`)
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "orders", filter: `id=eq.${data.id}` },
        (payload: any) => {
          const newStatus = payload.new?.status;
          if (payload.new) {
            queryClient.setQueryData(["order", id], (old: any) => {
              if (!old) return old;
              return { ...old, ...(payload.new as object) };
            });
          }
          queryClient.invalidateQueries({ queryKey: ["order", id] });
          queryClient.invalidateQueries({ queryKey: ["orders"] });

          if (newStatus && newStatus !== payload.old?.status) {
            triggerVibration();
            playCustomerChime();
            const msg = STATUS_ANNOUNCEMENTS[newStatus] || `Estado del pedido: ${newStatus}`;
            toast.success(msg, { duration: 6000 });
          }
        }
      )
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "order_status_history", filter: `order_id=eq.${data.id}` },
        (payload: any) => {
          queryClient.invalidateQueries({ queryKey: ["order_history", data.id] });
          const histStatus = payload.new?.status;
          if (histStatus) {
            triggerVibration();
            playCustomerChime();
            const msg = STATUS_ANNOUNCEMENTS[histStatus] || "El estado de tu pedido ha cambiado";
            toast.success(msg, { duration: 6000 });
          }
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
            icon={<Receipt className="size-7 text-primary" />}
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
    { label: "Aceptado", icon: PackageCheck },
    { label: "En Camino", icon: Bike },
    { label: "Llegó", icon: MapPin },
  ];

  return (
    <AppShell>
      {/* Modal automático de activación de avisos y guía de iOS */}
      <OrderNotificationPromptModal orderId={data.id} targetUserId={data.user_id || undefined} />

      {/* Barra de navegación superior con botón explícito para volver al Inicio */}
      <div className="flex items-center justify-between gap-3 pt-2 pb-2">
        <Link
          to="/"
          className="inline-flex items-center gap-1.5 rounded-full bg-surface-2 px-4 py-2 text-xs font-extrabold text-foreground hover:bg-surface border border-border/50 transition-transform active:scale-95 shadow-sm"
          aria-label="Volver a la tienda"
        >
          <ChevronLeft className="size-4 text-primary" />
          <span>Volver al inicio</span>
        </Link>

        <Link
          to="/pedidos"
          className="inline-flex items-center gap-1.5 rounded-full bg-surface-2 px-3.5 py-2 text-xs font-bold text-foreground hover:bg-surface border border-border/40 transition-all active:scale-95 shrink-0"
        >
          <Receipt className="size-3.5 text-primary" />
          <span>Mis pedidos</span>
        </Link>
      </div>

      {/* Logo Trippy Land grande y prominente */}
      <div className="flex flex-col items-center justify-center pt-2 pb-6 text-center">
        <Logo className="w-56 sm:w-72 max-w-[85vw] h-auto object-contain filter drop-shadow-[0_12px_32px_rgba(0,0,0,0.65)]" />
      </div>

      {nuevo && (
        <div className="mb-6 flex items-center gap-3.5 rounded-[24px] bg-surface-2/80 p-4 text-foreground border border-primary/30 shadow-md">
          <div className="flex size-11 shrink-0 items-center justify-center rounded-2xl bg-primary text-primary-foreground shadow-sm">
            <Check className="size-5" />
          </div>
          <div>
            <p className="text-[16px] font-bold text-foreground">¡Pedido confirmado!</p>
            <p className="text-[13px] font-medium text-muted-foreground">
              Pagas en efectivo al recibir tu entrega.
            </p>
          </div>
        </div>
      )}

      {/* Cabecera con ID */}
      <div className="mb-6 flex items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <Link
            to="/"
            className="flex size-10 shrink-0 items-center justify-center rounded-full bg-surface-2/80 transition-transform active:scale-90 border border-border/30"
            aria-label="Ir al inicio"
          >
            <ChevronLeft className="size-5 text-foreground" />
          </Link>
          <div>
            <h1 className="text-[24px] font-extrabold leading-tight tracking-tight text-foreground">
              #{data.id.slice(0, 8).toUpperCase()}
            </h1>
            <p className="text-[12px] font-medium text-muted-foreground">{formatDate(data.created_at)}</p>
          </div>
        </div>
      </div>

      <div className="space-y-4 pb-20">
        {/* Activar avisos Push para este pedido */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 rounded-[24px] bg-surface-2/60 p-4 border border-border/30">
          <div className="min-w-0">
            <p className="text-[14px] font-bold text-foreground">Avisos de entrega en tu celular</p>
            <p className="text-[12px] text-muted-foreground">Recibe alertas en directo cuando tu orden sea aceptada o despachada.</p>
          </div>
          <PushNotificationButton 
            variant="customer" 
            targetUserId={data.user_id || undefined} 
            orderId={data.id}
            className="shrink-0" 
          />
        </div>

        {/* Seguimiento en Vivo — Estética Minimalista Unificada */}
        <section className="rounded-[28px] bg-surface-2/70 p-6 border border-border/40 backdrop-blur-md shadow-sm">
          <div className="mb-6 flex items-center justify-between">
            <div>
              <h2 className="text-[18px] font-extrabold text-foreground">Seguimiento en Vivo</h2>
              <p className="text-[12px] font-medium text-muted-foreground">Estado de tu entrega</p>
            </div>
            <div className="flex items-center gap-1.5 rounded-full bg-primary/10 border border-primary/25 px-3 py-1 text-[11px] font-bold text-primary">
              <span className="size-2 rounded-full bg-primary animate-ping" />
              En directo
            </div>
          </div>

          {/* Stepper Minimalista con Paleta Unificada */}
          {!cancelled && (
            <div className="mb-6 px-1">
              <div className="relative flex items-center justify-between">
                {/* Línea base */}
                <div className="absolute left-6 right-6 top-1/2 h-1 -translate-y-1/2 bg-surface rounded-full" />
                {/* Línea de progreso con color primario único */}
                <div 
                  className="absolute left-6 top-1/2 h-1 -translate-y-1/2 bg-primary transition-all duration-500 rounded-full" 
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
                          ? "bg-primary text-primary-foreground shadow-sm ring-4 ring-primary/20"
                          : "bg-surface-2 text-muted-foreground/40 border border-border/40"
                      )}>
                        <StepIcon className={cn("size-5", isCurrent && "animate-pulse")} />
                      </div>
                      <span className={cn(
                        "mt-2 text-[11px] tracking-tight text-center max-w-[72px]",
                        isDone ? "text-foreground font-bold" : "text-muted-foreground/50 font-medium"
                      )}>
                        {s.label}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Tarjeta de Estado Actual — Minimalista y Elegante */}
          {cancelled ? (
            <div className="rounded-[22px] bg-destructive/10 p-4 border border-destructive/30 flex items-start gap-3">
              <XCircle className="size-5 text-destructive shrink-0 mt-0.5" />
              <div>
                <p className="text-[15px] font-bold text-destructive">Pedido cancelado</p>
                {data.cancel_reason && (
                  <p className="mt-0.5 text-[12px] text-destructive/80">Motivo: {data.cancel_reason}</p>
                )}
              </div>
            </div>
          ) : data.status === "pending" ? (
            <div className="flex items-center gap-3.5 rounded-[22px] bg-surface/70 p-4 border border-border/30">
              <div className="flex size-11 shrink-0 items-center justify-center rounded-2xl bg-primary/10 text-primary border border-primary/20">
                <ShoppingBag className="size-5 animate-pulse" />
              </div>
              <div>
                <p className="text-[15px] font-bold text-foreground">Pedido recibido</p>
                <p className="text-[12px] text-muted-foreground">Tu pedido está en cola y la tienda lo confirmará en breve.</p>
              </div>
            </div>
          ) : data.status === "accepted" || data.status === "preparing" ? (
            <div className="flex items-center gap-3.5 rounded-[22px] bg-surface/70 p-4 border border-border/30">
              <div className="flex size-11 shrink-0 items-center justify-center rounded-2xl bg-primary/10 text-primary border border-primary/20">
                <PackageCheck className="size-5 animate-bounce" />
              </div>
              <div>
                <p className="text-[15px] font-bold text-foreground">¡La tienda aceptó tu pedido!</p>
                <p className="text-[12px] text-muted-foreground">Tu pedido está siendo empacado y alistado para despacho.</p>
              </div>
            </div>
          ) : data.status === "in_transit" || data.status === "dispatched" ? (
            <div className="flex items-center gap-3.5 rounded-[22px] bg-surface/70 p-4 border border-border/30">
              <div className="flex size-11 shrink-0 items-center justify-center rounded-2xl bg-primary/10 text-primary border border-primary/20">
                <Bike className="size-5 animate-pulse" />
              </div>
              <div>
                <p className="text-[15px] font-bold text-foreground">El repartidor va en camino</p>
                <p className="text-[12px] text-muted-foreground">
                  {data.delivery_type === "fast" ? "Entrega Rápida 🚀 (~15-20 min)" : "El repartidor ya va hacia tu dirección."}
                </p>
              </div>
            </div>
          ) : data.status === "arrived" || data.status === "delivered" ? (
            <div className="space-y-3.5 rounded-[22px] bg-surface/70 p-4 border border-border/30">
              <div className="flex items-center gap-3.5">
                <div className="flex size-11 shrink-0 items-center justify-center rounded-2xl bg-primary/10 text-primary border border-primary/20">
                  <MapPin className="size-5" />
                </div>
                <div>
                  <p className="text-[16px] font-extrabold text-foreground">
                    {data.status === "delivered" ? "¡Pedido entregado!" : "¡El repartidor ya llegó!"}
                  </p>
                  <p className="text-[13px] text-muted-foreground">
                    Vehículo: <span className="font-bold text-foreground">{data.status_details || "Repartidor en punto"}</span>
                  </p>
                </div>
              </div>
              
              {/* Temporizador minimalista */}
              {data.status === "arrived" && timeLeft !== null && timeLeft > 0 && (
                <div className="inline-flex items-center gap-2 rounded-full bg-surface-2 px-3 py-1 text-[13px] font-semibold text-foreground border border-border/30">
                  <Clock className="size-3.5 text-primary" />
                  <span>Tiempo de espera: {Math.floor(timeLeft / 60000)}:{(Math.floor(timeLeft / 1000) % 60).toString().padStart(2, "0")}</span>
                </div>
              )}

              {/* Formulario de WhatsApp tras 7 minutos */}
              {data.status === "arrived" && timeLeft === 0 && !data.whatsapp_contact && (
                <div className="space-y-2.5 rounded-xl bg-surface-2 p-3.5 border border-border/40">
                  <p className="text-[13px] font-semibold text-amber-400">
                    Ingresa tu número de contacto para que el repartidor pueda comunicarse:
                  </p>
                  <div className="flex gap-2">
                    <input 
                      type="tel" 
                      placeholder="Ej: 3001234567"
                      className="flex-1 rounded-xl bg-surface px-3 py-2 text-[14px] text-foreground outline-none border border-border/30 focus:border-primary"
                      value={waText}
                      onChange={(e) => setWaText(e.target.value)}
                    />
                    <button 
                      onClick={handleSendWa}
                      disabled={waSending || !waText}
                      className="rounded-xl bg-primary px-4 text-xs font-bold text-primary-foreground transition-transform active:scale-95 disabled:opacity-50"
                    >
                      {waSending ? "..." : "Enviar"}
                    </button>
                  </div>
                </div>
              )}
              
              {data.whatsapp_contact && (
                <p className="text-[12px] font-medium text-muted-foreground">
                  Número enviado: <span className="text-foreground font-semibold">{data.whatsapp_contact}</span>
                </p>
              )}
            </div>
          ) : null}
        </section>

        {/* Dirección de Entrega */}
        {data.delivery_address && (
          <section className="rounded-[28px] bg-surface-2/60 p-5 border border-border/30">
            <h2 className="mb-2 flex items-center gap-2 text-[14px] font-bold text-foreground">
              <MapPin className="size-4 text-primary" /> Dirección de Entrega
            </h2>
            <p className="text-[14px] font-medium text-muted-foreground leading-relaxed">{data.delivery_address}</p>
          </section>
        )}

        {/* Detalle y Resumen de Productos */}
        <section className="rounded-[28px] bg-surface-2/60 p-5 border border-border/30">
          <h2 className="mb-4 text-[16px] font-bold text-foreground">Resumen de la Orden</h2>
          <ul className="space-y-3">
            {items.map((item) => (
              <li key={item.id} className="flex items-center justify-between text-[14px] py-1 border-b border-border/10 last:border-none">
                <div className="min-w-0 flex-1 pr-2">
                  <p className="truncate font-medium text-foreground">
                    <span className="font-bold text-primary">{item.quantity}×</span> {item.products?.name ?? "Producto"}
                  </p>
                  <p className="text-[12px] text-muted-foreground">
                    {formatPrice(item.price_at_time)} c/u
                  </p>
                </div>
                <span className="shrink-0 font-semibold text-foreground">
                  {formatPrice(Number(item.price_at_time) * item.quantity)}
                </span>
              </li>
            ))}
          </ul>

          <div className="mt-4 space-y-1.5 border-t border-border/30 pt-3 text-[13px]">
            <Row label="Subtotal" value={formatPrice(subtotal)} />
            <Row label="Domicilio" value={formatPrice(deliveryFee)} />
            <div className="flex items-center justify-between pt-2 text-[17px] font-extrabold text-foreground">
              <span>Total</span>
              <span>{formatPrice(data.total)}</span>
            </div>
            <p className="pt-1 text-[12px] text-muted-foreground">
              Método: {data.payment_method === "cash" ? "Efectivo al recibir" : (data.payment_method ?? "—")}
            </p>
          </div>
        </section>

        {/* Botones de Navegación Finales */}
        <div className="space-y-2.5 pt-2">
          <Link
            to="/"
            className="flex h-14 w-full items-center justify-center gap-2 rounded-full bg-primary text-[15px] font-extrabold text-primary-foreground transition-transform active:scale-95 shadow-lg hover:bg-primary/90"
          >
            <Home className="size-4" />
            <span>Seguir comprando (Ir al inicio)</span>
          </Link>

          <Link
            to="/pedidos"
            className="flex h-12 w-full items-center justify-center gap-2 rounded-full bg-surface-2 border border-border/40 text-[14px] font-bold text-foreground transition-transform active:scale-95 hover:bg-surface"
          >
            <Receipt className="size-4 text-primary" />
            <span>Ver todos mis pedidos</span>
          </Link>
        </div>
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
