import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery, useQueryClient, useIsFetching } from "@tanstack/react-query";
import { useEffect, useState, useRef } from "react";
import { toast } from "sonner";
import { 
  MapPin, 
  Search, 
  Bike, 
  Store, 
  CheckCircle2, 
  XCircle, 
  Clock, 
  ExternalLink, 
  MessageCircle, 
  Copy, 
  Check, 
  ShoppingBag, 
  TrendingUp, 
  Rocket,
  ShieldCheck,
  Volume2,
  VolumeX,
  RotateCw,
  Navigation,
  User,
  ArrowLeft
} from "lucide-react";
import { AppShell } from "@/components/AppShell";
import { PushNotificationButton } from "@/components/PushNotificationButton";
import { AdminNotificationPromptModal } from "@/components/AdminNotificationPromptModal";
import { EmptyState, ErrorState } from "@/components/States";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useAuth } from "@/hooks/useAuth";
import { allOrdersQuery, type AdminOrder } from "@/lib/queries";
import { supabase } from "@/integrations/supabase/client";
import { formatDate, formatRelativeTime, formatPrice, STATUS_LABELS, ORDER_STATUSES } from "@/lib/format";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/_authenticated/admin/pedidos")({
  head: () => ({
    meta: [{ title: "Panel de Administración — Trippy Land" }],
  }),
  component: AdminPedidosPage,
});

let sharedAudioCtx: AudioContext | null = null;

function getAudioContext(): AudioContext | null {
  try {
    if (typeof window === "undefined") return null;
    const AudioContextClass =
      window.AudioContext ||
      (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    if (!AudioContextClass) return null;
    if (!sharedAudioCtx) {
      sharedAudioCtx = new AudioContextClass();
    }
    if (sharedAudioCtx.state === "suspended") {
      sharedAudioCtx.resume();
    }
    return sharedAudioCtx;
  } catch {
    return null;
  }
}

/** Reproduce un timbre sintetizado claro cuando entra un pedido nuevo */
function playChime() {
  try {
    const ctx = getAudioContext();
    if (!ctx) return;

    const executeSound = () => {
      const now = ctx.currentTime;

      // Tono 1 (D5 - 587Hz)
      const osc1 = ctx.createOscillator();
      const gain1 = ctx.createGain();
      osc1.type = "sine";
      osc1.frequency.setValueAtTime(587.33, now);
      gain1.gain.setValueAtTime(0.6, now);
      gain1.gain.exponentialRampToValueAtTime(0.001, now + 0.35);
      osc1.connect(gain1);
      gain1.connect(ctx.destination);
      osc1.start(now);
      osc1.stop(now + 0.35);

      // Tono 2 (A5 - 880Hz)
      const osc2 = ctx.createOscillator();
      const gain2 = ctx.createGain();
      osc2.type = "sine";
      osc2.frequency.setValueAtTime(880, now + 0.12);
      gain2.gain.setValueAtTime(0.6, now + 0.12);
      gain2.gain.exponentialRampToValueAtTime(0.001, now + 0.7);
      osc2.connect(gain2);
      gain2.connect(ctx.destination);
      osc2.start(now + 0.12);
      osc2.stop(now + 0.7);
    };

    if (ctx.state === "suspended") {
      ctx.resume().then(executeSound).catch(() => {});
    } else {
      executeSound();
    }
  } catch {
    // Si el navegador bloquea audio antes de interacción, se ignora silenciosamente
  }
}

export function AdminPedidosPage() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const isFetching = useIsFetching({ queryKey: ["admin_orders"] });
  const { data: orders, isLoading, error, refetch } = useQuery(allOrdersQuery());
  
  const [filter, setFilter] = useState<string>("all");
  const [search, setSearch] = useState<string>("");
  const [copiedId, setCopiedId] = useState<string | null>(null);
  
  // Preferencia de sonido de campana
  const [soundEnabled, setSoundEnabled] = useState<boolean>(() => {
    try {
      return localStorage.getItem("tls_admin_sound") !== "false";
    } catch {
      return true;
    }
  });

  const soundRef = useRef(soundEnabled);
  soundRef.current = soundEnabled;

  const toggleSound = () => {
    const next = !soundEnabled;
    setSoundEnabled(next);
    try {
      localStorage.setItem("tls_admin_sound", String(next));
    } catch {
      // Ignorar error de storage
    }
    if (next) {
      playChime();
      toast.success("🔔 Sonido activado (timbre de prueba)");
    } else {
      toast.info("Sonido de notificaciones desactivado");
    }
  };

  const testChime = (e: React.MouseEvent) => {
    e.stopPropagation();
    playChime();
    toast.success("🔔 Timbre de prueba reproducido");
  };

  // Desbloquear audio automáticamente al primer clic o toque en la pantalla
  useEffect(() => {
    const unlock = () => {
      getAudioContext();
      window.removeEventListener("click", unlock);
      window.removeEventListener("touchstart", unlock);
    };
    window.addEventListener("click", unlock, { passive: true });
    window.addEventListener("touchstart", unlock, { passive: true });
    return () => {
      window.removeEventListener("click", unlock);
      window.removeEventListener("touchstart", unlock);
    };
  }, []);

  // Escucha en tiempo real de nuevos pedidos o cambios de estado
  useEffect(() => {
    const channel = supabase
      .channel("admin-orders-realtime")
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "orders" },
        () => {
          queryClient.invalidateQueries({ queryKey: ["admin_orders"] });
          if (soundRef.current) {
            playChime();
          }
          toast.success("🔔 ¡Nuevo pedido recibido!");
        }
      )
      .on(
        "postgres_changes",
        { event: "UPDATE", schema: "public", table: "orders" },
        () => {
          queryClient.invalidateQueries({ queryKey: ["admin_orders"] });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [queryClient]);

  if (user?.role !== "admin") {
    return (
      <AppShell>
        <div className="py-12">
          <EmptyState
            icon={<ShieldCheck className="size-8 text-primary" />}
            title="Acceso de Administrador Requerido"
            description="Inicia sesión con una cuenta autorizada de administrador para acceder a este panel."
            action={
              <Link
                to="/auth"
                className="mt-4 inline-flex h-11 items-center justify-center rounded-full bg-primary px-6 text-sm font-bold text-primary-foreground shadow-sm transition-transform active:scale-95"
              >
                Iniciar sesión como Admin
              </Link>
            }
          />
        </div>
      </AppShell>
    );
  }

  if (isLoading) {
    return (
      <AppShell>
        <div className="space-y-4 pt-4">
          <div className="h-28 animate-pulse rounded-3xl bg-surface-2/60" />
          <div className="h-44 animate-pulse rounded-3xl bg-surface-2/60" />
          <div className="h-44 animate-pulse rounded-3xl bg-surface-2/60" />
        </div>
      </AppShell>
    );
  }

  if (error) {
    return (
      <AppShell>
        <div className="pt-8">
          <ErrorState error={error} onRetry={() => refetch()} />
        </div>
      </AppShell>
    );
  }

  const allList = orders ?? [];

  // Métricas
  const totalSales = allList
    .filter((o) => o.status !== "cancelled")
    .reduce((sum, o) => sum + Number(o.total || 0), 0);
  
  const activeOrders = allList.filter(
    (o) => o.status === "pending" || o.status === "accepted" || o.status === "preparing" || o.status === "in_transit" || o.status === "dispatched" || o.status === "arrived"
  ).length;

  const pendingCount = allList.filter((o) => o.status === "pending").length;

  // Filtrado
  const filteredOrders = allList.filter((order) => {
    // Filtro por tab
    if (filter === "pending" && order.status !== "pending") return false;
    if (filter === "accepted" && order.status !== "accepted" && order.status !== "preparing") return false;
    if (filter === "in_transit" && order.status !== "in_transit" && order.status !== "dispatched") return false;
    if (filter === "arrived" && order.status !== "arrived") return false;
    if (filter === "delivered" && order.status !== "delivered") return false;
    if (filter === "cancelled" && order.status !== "cancelled") return false;

    // Filtro por buscador
    if (search.trim()) {
      const q = search.toLowerCase().trim();
      const matchId = order.id.toLowerCase().includes(q);
      const matchAddress = (order.delivery_address || "").toLowerCase().includes(q);
      const matchPhone = (order.whatsapp_contact || "").toLowerCase().includes(q) || (order.profiles?.phone || "").toLowerCase().includes(q);
      const matchCustomer = (order.profiles?.full_name || "").toLowerCase().includes(q);
      const matchItems = order.order_items?.some((i) => (i.products?.name || "").toLowerCase().includes(q));
      if (!matchId && !matchAddress && !matchPhone && !matchCustomer && !matchItems) return false;
    }

    return true;
  });

  async function updateOrderStatus(orderId: string, newStatus: string, defaultMoto?: string) {
    let motoDetails = defaultMoto;
    let cancelReason: string | null = null;

    if (newStatus === "arrived") {
      const moto = prompt(
        "¿Qué vehículo o moto realiza la entrega?",
        defaultMoto || "NMAX Negra - Placa TLC-42D"
      );
      if (moto === null) return;
      motoDetails = moto || "NMAX Negra";
    }

    if (newStatus === "cancelled") {
      const reason = prompt("Indica el motivo de cancelación:");
      if (reason === null) return;
      cancelReason = reason || "Cancelado por la tienda";
    }

    // Actualización optimista inmediata
    queryClient.setQueryData(["admin_orders"], (old: AdminOrder[] | undefined) => {
      if (!old) return old;
      return old.map((o) =>
        o.id === orderId
          ? {
              ...o,
              status: newStatus,
              status_details: motoDetails ?? o.status_details,
              cancel_reason: cancelReason ?? o.cancel_reason,
            }
          : o
      );
    });

    const updatePayload: Record<string, unknown> = { status: newStatus };
    if (motoDetails !== undefined) updatePayload.status_details = motoDetails;
    if (cancelReason !== null) updatePayload.cancel_reason = cancelReason;

    const { error: updErr } = await supabase
      .from("orders")
      .update(updatePayload)
      .eq("id", orderId);

    if (updErr) {
      toast.error("Error al actualizar estado: " + updErr.message);
      queryClient.invalidateQueries({ queryKey: ["admin_orders"] });
    } else {
      const label = STATUS_LABELS[newStatus] || newStatus;
      toast.success(`Pedido actualizado a: ${label}`);
      queryClient.invalidateQueries({ queryKey: ["admin_orders"] });
      queryClient.invalidateQueries({ queryKey: ["order", orderId] });
    }
  }

  function copyAddress(address: string, id: string) {
    navigator.clipboard.writeText(address);
    setCopiedId(id);
    toast.success("Dirección copiada");
    setTimeout(() => setCopiedId(null), 2000);
  }

  /** Extrae coordenadas o genera enlace a Google Maps */
  function getMapsUrl(address: string): string {
    const coordsMatch = address.match(/\(([-0-9.]+),\s*([-0-9.]+)\)/);
    if (coordsMatch) {
      return `https://www.google.com/maps/search/?api=1&query=${coordsMatch[1]},${coordsMatch[2]}`;
    }
    return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(address + ", Medellín")}`;
  }

  /** Construye URL sanitizada de WhatsApp sin duplicar el prefijo 57 */
  function getWhatsAppUrl(phone: string, orderId: string): string {
    const clean = phone.replace(/\D/g, "");
    const waNumber = clean.startsWith("57") ? clean : `57${clean}`;
    const text = encodeURIComponent(`Hola, te escribimos de Trippy Land sobre tu pedido #${orderId.slice(0, 8).toUpperCase()}`);
    return `https://wa.me/${waNumber}?text=${text}`;
  }

  return (
    <AppShell>
      {/* Modal automático para activar avisos de nuevos pedidos y guía iOS */}
      <AdminNotificationPromptModal />

      <div className="space-y-6 pb-24">
        {/* Cabecera del Panel */}
        <div className="flex flex-col gap-2">
          <div className="flex items-center justify-between">
            <Link
              to="/"
              className="inline-flex items-center gap-1.5 rounded-full bg-surface-2/80 px-3 py-1.5 text-xs font-semibold text-muted-foreground hover:text-foreground transition-all active:scale-95"
            >
              <ArrowLeft className="size-3.5" />
              <span>Tienda</span>
            </Link>

            <div className="flex flex-wrap items-center gap-2">
              <PushNotificationButton variant="admin" />

              <button
                type="button"
                onClick={toggleSound}
                className={cn(
                  "flex items-center gap-1.5 h-9 rounded-2xl px-2.5 text-xs font-bold border transition-all active:scale-95",
                  soundEnabled
                    ? "border-primary/40 bg-primary/10 text-primary"
                    : "border-border/40 bg-surface-2 text-muted-foreground"
                )}
                title={soundEnabled ? "Clic para desactivar sonido" : "Clic para activar sonido"}
              >
                {soundEnabled ? <Volume2 className="size-3.5" /> : <VolumeX className="size-3.5" />}
                <span className="text-[11px]">{soundEnabled ? "Sonido ON" : "Silencio"}</span>
                {soundEnabled && (
                  <span
                    role="button"
                    onClick={testChime}
                    className="ml-1 rounded-md bg-primary/20 px-1 py-0.5 text-[9px] font-extrabold uppercase text-primary hover:bg-primary/30"
                    title="Probar timbre ahora"
                  >
                    Probar
                  </span>
                )}
              </button>

              <button
                type="button"
                onClick={() => refetch()}
                className="flex size-9 items-center justify-center rounded-2xl border border-border/40 bg-surface-2 text-muted-foreground hover:text-foreground transition-all active:scale-95"
                title="Actualizar ahora"
              >
                <RotateCw className={cn("size-3.5", isFetching > 0 && "animate-spin text-primary")} />
              </button>

              <span className="flex items-center gap-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/30 px-3 py-1 text-[11px] font-bold text-emerald-400">
                <span className="size-2 rounded-full bg-emerald-400 animate-ping" />
                En vivo
              </span>
            </div>
          </div>

          <div>
            <h1 className="text-[28px] font-extrabold tracking-tight text-foreground">
              Panel de Pedidos
            </h1>
            <p className="text-[13px] text-muted-foreground">
              Despacho y control de pedidos en tiempo real
            </p>
          </div>
        </div>

        {/* Tarjetas KPI de Resumen */}
        <div className="grid grid-cols-3 gap-2.5 sm:gap-4">
          <div className="rounded-2xl border border-border/40 bg-surface-2/60 p-3.5">
            <span className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1">
              <Clock className="size-3 text-primary" /> Nuevos
            </span>
            <p className="mt-1 text-[22px] font-extrabold text-foreground">
              {pendingCount}
            </p>
          </div>

          <div className="rounded-2xl border border-border/40 bg-surface-2/60 p-3.5">
            <span className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1">
              <Bike className="size-3 text-amber-400" /> Activos
            </span>
            <p className="mt-1 text-[22px] font-extrabold text-amber-400">
              {activeOrders}
            </p>
          </div>

          <div className="rounded-2xl border border-border/40 bg-surface-2/60 p-3.5">
            <span className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1">
              <TrendingUp className="size-3 text-candy-lime" /> Ventas
            </span>
            <p className="mt-1 text-[16px] sm:text-[18px] font-extrabold text-candy-lime truncate">
              {formatPrice(totalSales)}
            </p>
          </div>
        </div>

        {/* Buscador */}
        <div className="relative">
          <Search className="absolute left-4 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Buscar por ID, cliente, dirección o producto..."
            className="h-12 rounded-2xl bg-surface-2/60 border-border/40 pl-11 text-[14px] text-foreground placeholder:text-muted-foreground"
          />
        </div>

        {/* Filtros por pestaña */}
        <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
          {[
            { key: "all", label: "Todos", count: allList.length },
            { key: "pending", label: "Recibidos", count: allList.filter((o) => o.status === "pending").length },
            { key: "accepted", label: "Tienda Aceptó", count: allList.filter((o) => o.status === "accepted" || o.status === "preparing").length },
            { key: "in_transit", label: "En Camino", count: allList.filter((o) => o.status === "in_transit" || o.status === "dispatched").length },
            { key: "arrived", label: "Llegó", count: allList.filter((o) => o.status === "arrived").length },
            { key: "delivered", label: "Entregados", count: allList.filter((o) => o.status === "delivered").length },
            { key: "cancelled", label: "Cancelados", count: allList.filter((o) => o.status === "cancelled").length },
          ].map((tab) => {
            const isSelected = filter === tab.key;
            return (
              <button
                key={tab.key}
                type="button"
                onClick={() => setFilter(tab.key)}
                className={cn(
                  "flex items-center gap-1.5 whitespace-nowrap rounded-full px-3.5 py-1.5 text-xs font-bold transition-all active:scale-95",
                  isSelected
                    ? "bg-primary text-primary-foreground shadow-sm"
                    : "bg-surface-2/60 text-muted-foreground hover:bg-surface-2 hover:text-foreground"
                )}
              >
                <span>{tab.label}</span>
                <span className={cn(
                  "rounded-full px-1.5 py-0.2 text-[10px]",
                  isSelected ? "bg-black/20 text-white" : "bg-surface text-muted-foreground"
                )}>
                  {tab.count}
                </span>
              </button>
            );
          })}
        </div>

        {/* Lista de Pedidos */}
        <div className="space-y-4">
          {filteredOrders.length === 0 ? (
            <div className="rounded-3xl bg-surface-2/40 p-8 text-center border border-border/30">
              <EmptyState
                icon={<Search className="size-7" />}
                title="No hay pedidos"
                description={
                  search
                    ? "No se encontraron pedidos que coincidan con la búsqueda."
                    : "No hay pedidos con el estado seleccionado."
                }
              />
            </div>
          ) : (
            filteredOrders.map((order) => {
              const isCancelled = order.status === "cancelled";
              const isDelivered = order.status === "delivered";
              const isPending = order.status === "pending";
              const isAccepted = order.status === "accepted" || order.status === "preparing";
              const isInTransit = order.status === "in_transit" || order.status === "dispatched";
              const isArrived = order.status === "arrived";
              const items = order.order_items ?? [];
              const phone = order.whatsapp_contact || order.profiles?.phone;
              const customerName = order.profiles?.full_name;

              return (
                <div
                  key={order.id}
                  className="overflow-hidden rounded-[28px] border border-border/50 bg-surface-2/70 p-5 shadow-sm transition-all"
                >
                  {/* Encabezado del Pedido */}
                  <div className="flex items-start justify-between gap-2 border-b border-border/30 pb-3">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-[17px] font-extrabold text-foreground">
                          #{order.id.slice(0, 8).toUpperCase()}
                        </span>
                        {order.delivery_type === "fast" && (
                          <span className="flex items-center gap-1 rounded-full bg-primary/20 px-2 py-0.5 text-[10px] font-bold text-primary">
                            <Rocket className="size-3" /> Rápido
                          </span>
                        )}
                      </div>
                      <div className="mt-1 flex items-center gap-2 text-[12px] text-muted-foreground">
                        <span className="font-semibold text-primary/90">
                          {formatRelativeTime(order.created_at)}
                        </span>
                        <span>•</span>
                        <span>{formatDate(order.created_at)}</span>
                      </div>
                      {customerName && (
                        <div className="mt-1 flex items-center gap-1 text-xs text-foreground/90 font-medium">
                          <User className="size-3 text-muted-foreground" />
                          <span>{customerName}</span>
                        </div>
                      )}
                    </div>

                    <div className="text-right">
                      <span className="text-[18px] font-extrabold text-candy-lime">
                        {formatPrice(order.total)}
                      </span>
                      <div>
                        <span
                          className={cn(
                            "inline-block rounded-full px-2.5 py-0.5 text-[11px] font-bold mt-1",
                            isCancelled && "bg-destructive/20 text-destructive",
                            isPending && "bg-primary/20 text-primary",
                            isAccepted && "bg-sky-500/20 text-sky-400",
                            isInTransit && "bg-amber-500/20 text-amber-400",
                            isArrived && "bg-emerald-500/20 text-emerald-400 animate-pulse",
                            isDelivered && "bg-emerald-500/20 text-emerald-400"
                          )}
                        >
                          {STATUS_LABELS[order.status] ?? order.status}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Dirección de Entrega y Contacto */}
                  <div className="my-3 space-y-2 rounded-2xl bg-surface/70 p-3.5 text-[13px]">
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-start gap-2">
                        <MapPin className="mt-0.5 size-4 shrink-0 text-primary" />
                        <span className="font-medium text-foreground leading-snug">
                          {order.delivery_address || "Sin dirección especificada"}
                        </span>
                      </div>
                      <div className="flex items-center gap-1 shrink-0">
                        {order.delivery_address && (
                          <>
                            <a
                              href={getMapsUrl(order.delivery_address)}
                              target="_blank"
                              rel="noreferrer"
                              className="p-1 text-muted-foreground hover:text-primary active:scale-90"
                              title="Ver en Google Maps"
                            >
                              <Navigation className="size-4" />
                            </a>
                            <button
                              type="button"
                              onClick={() => copyAddress(order.delivery_address!, order.id)}
                              className="p-1 text-muted-foreground hover:text-foreground active:scale-90"
                              title="Copiar dirección"
                            >
                              {copiedId === order.id ? (
                                <Check className="size-4 text-emerald-400" />
                              ) : (
                                <Copy className="size-4" />
                              )}
                            </button>
                          </>
                        )}
                      </div>
                    </div>

                    {phone && (
                      <div className="flex items-center justify-between pt-1 border-t border-border/20">
                        <span className="text-muted-foreground flex items-center gap-1.5 text-xs font-semibold">
                          <MessageCircle className="size-3.5 text-emerald-400" /> Tel / WhatsApp: {phone}
                        </span>
                        <a
                          href={getWhatsAppUrl(phone, order.id)}
                          target="_blank"
                          rel="noreferrer"
                          className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-400 hover:underline"
                        >
                          Abrir WhatsApp
                        </a>
                      </div>
                    )}

                    {order.status_details && (
                      <div className="pt-1 text-xs text-muted-foreground flex items-center gap-1.5">
                        <Bike className="size-3.5 text-amber-400" />
                        <span>Vehículo:</span>
                        <span className="font-bold text-foreground">{order.status_details}</span>
                      </div>
                    )}

                    {order.cancel_reason && (
                      <div className="pt-1 text-xs text-red-400 font-medium">
                        Motivo cancelación: {order.cancel_reason}
                      </div>
                    )}
                  </div>

                  {/* Lista de Productos Comprados */}
                  {items.length > 0 && (
                    <div className="mb-4 space-y-2 border-t border-border/20 pt-3">
                      <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                        Productos ({items.length})
                      </p>
                      <div className="space-y-1.5 max-h-44 overflow-y-auto pr-1">
                        {items.map((item) => (
                          <div
                            key={item.id}
                            className="flex items-center justify-between text-[13px] py-1 border-b border-border/10 last:border-none"
                          >
                            <div className="flex items-center gap-2 min-w-0 pr-2">
                              {item.products?.image_url && (
                                <img
                                  src={item.products.image_url}
                                  alt=""
                                  className="size-7 rounded-lg object-cover shrink-0 bg-surface"
                                />
                              )}
                              <span className="truncate text-foreground font-medium">
                                <span className="font-bold text-primary">{item.quantity}×</span>{" "}
                                {item.products?.name ?? "Producto"}
                              </span>
                            </div>
                            <span className="shrink-0 text-muted-foreground font-medium">
                              {formatPrice(Number(item.price_at_time) * item.quantity)}
                            </span>
                          </div>
                        ))}
                      </div>

                      {/* Desglose de Totales */}
                      <div className="pt-2 text-xs text-muted-foreground space-y-1 border-t border-border/10">
                        {order.delivery_fee !== null && (
                          <div className="flex justify-between">
                            <span>Domicilio ({order.delivery_type === "fast" ? "Rápido 🚀" : "Normal"}):</span>
                            <span className="font-semibold text-foreground">{formatPrice(order.delivery_fee)}</span>
                          </div>
                        )}
                        <div className="flex justify-between">
                          <span>Método de pago:</span>
                          <span className="font-semibold text-foreground">
                            {order.payment_method === "cash" ? "Efectivo al recibir" : order.payment_method}
                          </span>
                        </div>
                        {order.referral_code && (
                          <div className="flex justify-between">
                            <span>Código de referido:</span>
                            <span className="font-bold text-candy-lime">{order.referral_code}</span>
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Botonera de Acciones de Estado */}
                  <div className="space-y-2 pt-2 border-t border-border/30">
                    <div className="flex flex-wrap gap-2">
                      {isPending && (
                        <>
                          <Button
                            size="sm"
                            className="flex-1 bg-primary text-primary-foreground hover:bg-primary/90 font-bold h-10 rounded-xl"
                            onClick={() => updateOrderStatus(order.id, "accepted")}
                          >
                            <Store className="mr-1.5 size-4" /> Aceptar Pedido
                          </Button>
                          <Button
                            size="sm"
                            variant="destructive"
                            className="h-10 rounded-xl px-4"
                            onClick={() => updateOrderStatus(order.id, "cancelled")}
                            title="Cancelar pedido"
                          >
                            <XCircle className="size-4" />
                          </Button>
                        </>
                      )}

                      {isAccepted && (
                        <>
                          <Button
                            size="sm"
                            className="flex-1 bg-amber-500 text-white hover:bg-amber-600 font-bold h-10 rounded-xl"
                            onClick={() => updateOrderStatus(order.id, "in_transit")}
                          >
                            <Bike className="mr-1.5 size-4" /> Despachar (En Camino)
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            className="h-10 rounded-xl border-destructive text-destructive hover:bg-destructive/10"
                            onClick={() => updateOrderStatus(order.id, "cancelled")}
                          >
                            Cancelar
                          </Button>
                        </>
                      )}

                      {isInTransit && (
                        <>
                          <Button
                            size="sm"
                            className="flex-1 bg-emerald-500 text-white hover:bg-emerald-600 font-bold h-10 rounded-xl"
                            onClick={() => updateOrderStatus(order.id, "arrived")}
                          >
                            <MapPin className="mr-1.5 size-4" /> Marcar Llegó
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            className="h-10 rounded-xl border-destructive text-destructive hover:bg-destructive/10"
                            onClick={() => updateOrderStatus(order.id, "cancelled")}
                          >
                            Cancelar
                          </Button>
                        </>
                      )}

                      {isArrived && (
                        <Button
                          size="sm"
                          className="flex-1 bg-emerald-600 text-white hover:bg-emerald-700 font-bold h-10 rounded-xl"
                          onClick={() => updateOrderStatus(order.id, "delivered")}
                        >
                          <CheckCircle2 className="mr-1.5 size-4" /> Marcar Entregado
                        </Button>
                      )}

                      {/* Enlace directo para ver el tracking como el cliente */}
                      <Link
                        to="/pedido/$id"
                        params={{ id: order.id }}
                        target="_blank"
                        className="inline-flex h-10 items-center justify-center rounded-xl bg-surface px-3 text-xs font-semibold text-muted-foreground hover:text-foreground transition-all active:scale-95"
                      >
                        <ExternalLink className="size-4 mr-1" /> Tracking
                      </Link>
                    </div>

                    {/* Selector de escape manual para cualquier estado */}
                    <div className="flex items-center justify-end gap-2 pt-1 text-[11px] text-muted-foreground">
                      <span>Cambiar estado:</span>
                      <select
                        value={order.status}
                        onChange={(e) => updateOrderStatus(order.id, e.target.value)}
                        className="rounded-lg bg-surface px-2 py-1 text-xs font-semibold text-foreground border border-border/40 outline-none"
                      >
                        {ORDER_STATUSES.map((st) => (
                          <option key={st} value={st}>
                            {STATUS_LABELS[st] ?? st}
                          </option>
                        ))}
                        <option value="cancelled">Cancelado</option>
                      </select>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    </AppShell>
  );
}
