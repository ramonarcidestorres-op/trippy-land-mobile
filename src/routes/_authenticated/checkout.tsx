import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useRef, useState } from "react";
import { Banknote, MapPin, Navigation, ShoppingBag, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { AppShell } from "@/components/AppShell";
import { EmptyState } from "@/components/States";
import { useCart } from "@/hooks/useCart";
import { useReferral } from "@/hooks/useReferral";
import { useAuth } from "@/hooks/useAuth";
import { deliveryFeesQuery } from "@/lib/queries";
import { supabase } from "@/integrations/supabase/client";
import { formatPrice } from "@/lib/format";
import { addressStore, composeAddress } from "@/lib/address";
import { AddressManager } from "@/components/AddressManager";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/_authenticated/checkout")({
  ssr: false,
  head: () => ({
    meta: [
      { title: "Checkout — Trippy Land Store" },
      { name: "description", content: "Confirma tu dirección y paga en efectivo al recibir." },
    ],
  }),
  component: CheckoutPage,
});

function CheckoutPage() {
  const { user } = useAuth();
  const { cart: rows, clearCart } = useCart();
  const { referralCode, getAdjustedPrice } = useReferral();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [manualAddress, setManualAddress] = useState("");
  const [manualNeighborhood, setManualNeighborhood] = useState("");
  const [manualApartment, setManualApartment] = useState("");
  const [manualNotes, setManualNotes] = useState("");
  const [isEditingAddress, setIsEditingAddress] = useState(false);
  const [locating, setLocating] = useState(false);
  const [deliveryType, setDeliveryType] = useState<"normal" | "fast">("normal");
  const [placing, setPlacing] = useState(false);
  const lock = useRef(false);

  const { data: fees } = useQuery(deliveryFeesQuery());

  useEffect(() => {
    const sync = () => {
      setSelectedId(addressStore.selected()?.id ?? null);
    };
    sync();
    window.addEventListener("tls-address-change", sync);
    return () => window.removeEventListener("tls-address-change", sync);
  }, []);

  const subtotal = rows.reduce((sum, r) => sum + getAdjustedPrice(r.products?.price ?? 0) * r.quantity, 0);
  const unavailable = rows.filter((r) => r.products?.is_available === false);
  const selected = addressStore.list().find((a) => a.id === selectedId) ?? addressStore.selected() ?? null;

  // Cálculo automático según los requerimientos:
  // - Hasta 199.999: Normal 25.000 / Rápida 50.000
  // - 200.000 a 999.999: Normal 50.000 / Rápida 50.000
  // - Más de 1.000.000: 100.000
  const applicableFee = (fees ?? []).find(
    (f) => subtotal >= f.min_subtotal && (f.max_subtotal === null || subtotal <= f.max_subtotal)
  );
  const defaultFee = subtotal >= 1000000
    ? 100000
    : subtotal >= 200000
    ? 50000
    : deliveryType === "fast"
    ? 50000
    : 25000;

  const deliveryCost = applicableFee ? applicableFee[`${deliveryType}_fee`] : defaultFee;
  const total = subtotal + deliveryCost;

  async function handleGetLocation() {
    if (!navigator.geolocation) {
      toast.error("Tu navegador no soporta geolocalización.");
      return;
    }
    setLocating(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setLocating(false);
        const coords = `GPS (${pos.coords.latitude.toFixed(4)}, ${pos.coords.longitude.toFixed(4)})`;
        setManualAddress((prev) => (prev ? `${prev} [${coords}]` : coords));
        toast.success("Ubicación GPS capturada. Agrega tu calle o edificio.");
      },
      (err) => {
        setLocating(false);
        toast.error("No pudimos obtener el GPS. Escribe tu dirección manualmente.");
      },
      { enableHighAccuracy: true, timeout: 8000 }
    );
  }

  async function placeOrder() {
    if (lock.current) return;
    if (rows.length === 0) return;
    if (unavailable.length > 0) {
      toast.error("Quita del carrito los productos que ya no están disponibles.");
      return;
    }

    const effectiveAddress = selected && !isEditingAddress
      ? composeAddress(selected)
      : [
          manualAddress.trim(),
          manualNeighborhood.trim() && `Barrio: ${manualNeighborhood.trim()}`,
          manualApartment.trim() && `Apto/Casa: ${manualApartment.trim()}`,
          manualNotes.trim() && `Nota: ${manualNotes.trim()}`,
        ]
          .filter(Boolean)
          .join(" • ");

    if (!effectiveAddress || effectiveAddress.trim().length < 4) {
      toast.error("Por favor ingresa tu dirección de entrega para confirmar.");
      setIsEditingAddress(true);
      return;
    }

    // Guardar dirección en el dispositivo para futuros pedidos si se ingresó manualmente
    if ((!selected || isEditingAddress) && manualAddress.trim()) {
      addressStore.save({
        label: "Mi dirección",
        address: manualAddress.trim(),
        neighborhood: manualNeighborhood.trim() || undefined,
        apartment: manualApartment.trim() || undefined,
        notes: manualNotes.trim() || undefined,
      });
    }

    lock.current = true;
    setPlacing(true);
    try {
      const payloadCart = rows.map((r) => ({
        id: r.products?.id || r.product_id || r.id,
        product_id: r.products?.id || r.product_id || r.id,
        quantity: r.quantity,
        price: r.products?.price || 0,
      }));

      const { data: orderId, error: rpcError } = await supabase.rpc("place_order_guest", {
        p_delivery_address: effectiveAddress,
        p_delivery_type: deliveryType,
        p_payment_method: "cash",
        p_cart_items: payloadCart,
        p_referral_code: referralCode,
      });

      if (rpcError || !orderId) {
        throw new Error(rpcError?.message ?? "No se creó el pedido en el servidor");
      }

      try {
        const stored = JSON.parse(localStorage.getItem("tls_my_orders") || "[]");
        if (!stored.includes(orderId)) {
          stored.unshift(orderId);
          localStorage.setItem("tls_my_orders", JSON.stringify(stored.slice(0, 50)));
        }
      } catch {
        // ignore
      }

      // Si el navegador ya tiene permisos de notificaciones concedidos, vincular este pedido automáticamente
      if (typeof window !== "undefined" && "serviceWorker" in navigator && "Notification" in window && Notification.permission === "granted") {
        try {
          const reg = await navigator.serviceWorker.ready;
          const sub = await reg.pushManager.getSubscription();
          if (sub) {
            const jsonSub = sub.toJSON();
            if (jsonSub.keys?.p256dh && jsonSub.keys?.auth) {
              await supabase.from("push_subscriptions").upsert(
                {
                  endpoint: sub.endpoint,
                  p256dh: jsonSub.keys.p256dh,
                  auth: jsonSub.keys.auth,
                  order_id: orderId,
                  user_id: user?.id || null,
                },
                { onConflict: "endpoint" }
              );
            }
          }
        } catch {
          // ignore
        }
      }

      clearCart();
      await queryClient.invalidateQueries({ queryKey: ["orders"] });

      navigate({ to: "/pedido/$id", params: { id: orderId }, search: { nuevo: true } } as any);
    } catch (e) {
      console.error("Order creation failed:", e);
      toast.error(e instanceof Error ? e.message : "No pudimos crear tu pedido");
      lock.current = false;
      setPlacing(false);
    }
  }

  if (rows.length === 0) {
    return (
      <AppShell>
        <div className="pt-10">
          <EmptyState
            icon={<ShoppingBag className="size-7" />}
            title="Nada por aquí"
            description="Tu carrito está vacío. Agrega algo antes de confirmar."
            action={
              <Link
                to="/catalogo"
                search={{}}
                className="mt-4 flex h-12 w-full items-center justify-center rounded-full bg-primary font-bold text-primary-foreground shadow-sm transition-transform active:scale-95"
              >
                Volver al catálogo
              </Link>
            }
          />
        </div>
      </AppShell>
    );
  }

  return (
    <AppShell>
      <h1 className="mb-6 text-[34px] font-bold tracking-tight text-foreground">
        Checkout
      </h1>

      <div className="space-y-4 pb-32">
        {/* Address Card */}
        <section className="rounded-[32px] bg-surface-2/60 p-5 shadow-sm">
          <div className="mb-3 flex items-center justify-between">
            <h2 className="flex items-center gap-2 text-[15px] font-semibold text-foreground">
              <MapPin className="size-4 text-primary" /> Dirección de entrega
            </h2>
            {selected && !isEditingAddress && (
              <button
                type="button"
                onClick={() => {
                  setManualAddress(selected.address || "");
                  setManualNeighborhood(selected.neighborhood || "");
                  setManualApartment(selected.apartment || "");
                  setManualNotes(selected.notes || selected.references || "");
                  setIsEditingAddress(true);
                }}
                className="text-xs font-bold text-primary hover:underline"
              >
                Cambiar
              </button>
            )}
          </div>

          {selected && !isEditingAddress ? (
            <div className="rounded-2xl bg-surface/90 border border-border/50 p-4">
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-start gap-3 min-w-0">
                  <div className="size-9 rounded-full bg-primary/10 flex items-center justify-center shrink-0 mt-0.5">
                    <MapPin className="size-4 text-primary" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-[14px] font-bold text-foreground leading-snug break-words">{selected.address}</p>
                    {(selected.neighborhood || selected.apartment) && (
                      <p className="text-[12px] text-muted-foreground mt-0.5">
                        {[selected.neighborhood, selected.apartment].filter(Boolean).join(" • ")}
                      </p>
                    )}
                    {(selected.notes || selected.references) && (
                      <p className="text-[11px] text-muted-foreground/80 mt-1 italic">
                        Ref: {selected.notes || selected.references}
                      </p>
                    )}
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setManualAddress(selected.address || "");
                    setManualNeighborhood(selected.neighborhood || "");
                    setManualApartment(selected.apartment || "");
                    setManualNotes(selected.notes || selected.references || "");
                    setIsEditingAddress(true);
                  }}
                  className="text-[12px] font-bold text-primary px-3 py-1.5 rounded-full bg-surface-2 hover:bg-surface border border-border/40 transition-transform active:scale-95 shrink-0"
                >
                  Editar
                </button>
              </div>
            </div>
          ) : (
            <div className="space-y-3 pt-1">
              {/* Botón rápido de GPS */}
              <button
                type="button"
                onClick={handleGetLocation}
                disabled={locating}
                className="flex w-full items-center justify-center gap-2 h-11 rounded-2xl bg-surface hover:bg-surface-2 border border-border/50 text-[13px] font-semibold text-primary transition-all active:scale-[0.98] disabled:opacity-50"
              >
                {locating ? <Loader2 className="size-4 animate-spin text-primary" /> : <Navigation className="size-4 text-primary" />}
                <span>{locating ? "Obteniendo ubicación GPS..." : "Detectar mi ubicación actual con GPS"}</span>
              </button>

              {/* Lista de direcciones guardadas previamente (si existen) */}
              {addressStore.list().length > 0 && (
                <div className="pt-1">
                  <p className="text-[11px] uppercase tracking-wider font-bold text-muted-foreground/70 mb-2">
                    O selecciona una guardada:
                  </p>
                  <div className="flex flex-wrap gap-1.5">
                    {addressStore.list().map((addr) => (
                      <button
                        key={addr.id}
                        type="button"
                        onClick={() => {
                          addressStore.select(addr.id);
                          setSelectedId(addr.id);
                          setIsEditingAddress(false);
                        }}
                        className={cn(
                          "px-3 py-1.5 rounded-xl text-xs font-medium border transition-all text-left truncate max-w-full",
                          selected?.id === addr.id
                            ? "bg-primary/15 border-primary text-primary"
                            : "bg-surface border-border/40 text-muted-foreground hover:text-foreground"
                        )}
                      >
                        📍 {addr.address}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Campos estructurados claros y elegantes */}
              <div className="space-y-2.5 pt-1">
                <div>
                  <label className="text-[11px] font-semibold text-muted-foreground mb-1 block">
                    Dirección principal <span className="text-primary">*</span>
                  </label>
                  <Input
                    value={manualAddress}
                    onChange={(e) => setManualAddress(e.target.value)}
                    placeholder="Ej: Calle 45 # 12-34 o Edificio / Conjunto"
                    className="h-11 rounded-2xl bg-surface border-border/40 text-[13px] text-foreground placeholder:text-muted-foreground/60 focus-visible:ring-1 focus-visible:ring-primary"
                  />
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="text-[11px] font-semibold text-muted-foreground mb-1 block">
                      Barrio o Sector
                    </label>
                    <Input
                      value={manualNeighborhood}
                      onChange={(e) => setManualNeighborhood(e.target.value)}
                      placeholder="Ej: El Poblado"
                      className="h-11 rounded-2xl bg-surface border-border/40 text-[13px] text-foreground placeholder:text-muted-foreground/60 focus-visible:ring-1 focus-visible:ring-primary"
                    />
                  </div>
                  <div>
                    <label className="text-[11px] font-semibold text-muted-foreground mb-1 block">
                      Apto / Casa (Opcional)
                    </label>
                    <Input
                      value={manualApartment}
                      onChange={(e) => setManualApartment(e.target.value)}
                      placeholder="Ej: Apto 301, Torre 2"
                      className="h-11 rounded-2xl bg-surface border-border/40 text-[13px] text-foreground placeholder:text-muted-foreground/60 focus-visible:ring-1 focus-visible:ring-primary"
                    />
                  </div>
                </div>

                <div>
                  <label className="text-[11px] font-semibold text-muted-foreground mb-1 block">
                    Indicaciones para el repartidor (Opcional)
                  </label>
                  <Input
                    value={manualNotes}
                    onChange={(e) => setManualNotes(e.target.value)}
                    placeholder="Ej: Dejar en portería, casa de reja negra..."
                    className="h-11 rounded-2xl bg-surface border-border/40 text-[13px] text-foreground placeholder:text-muted-foreground/60 focus-visible:ring-1 focus-visible:ring-primary"
                  />
                </div>
              </div>

              {selected && isEditingAddress && (
                <div className="flex justify-end pt-1">
                  <button
                    type="button"
                    onClick={() => setIsEditingAddress(false)}
                    className="text-xs text-muted-foreground hover:text-foreground font-semibold px-2 py-1"
                  >
                    Cancelar edición
                  </button>
                </div>
              )}
            </div>
          )}
        </section>

        {/* Delivery Type */}
        <section className="rounded-[32px] bg-surface-2/60 p-5">
          <h2 className="mb-4 text-[15px] font-semibold text-foreground">Tipo de entrega</h2>
          <div className="grid grid-cols-2 gap-3">
            <button
              onClick={() => setDeliveryType("normal")}
              className={cn(
                "flex flex-col items-center justify-center rounded-[24px] border p-4 text-center transition-transform active:scale-95",
                deliveryType === "normal"
                  ? "border-transparent bg-primary text-primary-foreground shadow-md"
                  : "border-border/50 bg-surface text-foreground"
              )}
            >
              <span className="text-[15px] font-bold">Normal</span>
              <span className={cn("mt-1 text-[12px] font-medium opacity-80")}>~40 min</span>
              {applicableFee && (
                <span className="mt-2 text-[14px] font-extrabold">{formatPrice(applicableFee.normal_fee)}</span>
              )}
            </button>
            <button
              onClick={() => setDeliveryType("fast")}
              className={cn(
                "flex flex-col items-center justify-center rounded-[24px] border p-4 text-center transition-transform active:scale-95",
                deliveryType === "fast"
                  ? "border-transparent bg-primary text-primary-foreground shadow-md"
                  : "border-border/50 bg-surface text-foreground"
              )}
            >
              <span className="text-[15px] font-bold">Rápida 🚀</span>
              <span className={cn("mt-1 text-[12px] font-medium opacity-80")}>~20 min</span>
              {applicableFee && (
                <span className="mt-2 text-[14px] font-extrabold">{formatPrice(applicableFee.fast_fee)}</span>
              )}
            </button>
          </div>
        </section>

        {/* Payment Method */}
        <section className="flex items-center gap-4 rounded-[32px] bg-surface-2/60 p-5">
          <div className="flex size-12 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary">
            <Banknote className="size-6" />
          </div>
          <div>
            <p className="text-[15px] font-semibold text-foreground">Pago en efectivo</p>
            <p className="mt-0.5 text-[13px] text-muted-foreground">Pagas al recibir tu pedido.</p>
          </div>
        </section>

        {/* Summary */}
        <section className="rounded-[32px] bg-surface-2/60 p-6">
          <h2 className="mb-4 text-[15px] font-semibold text-foreground">Resumen</h2>
          <ul className="mb-6 space-y-3">
            {rows.map((r) => (
              <li key={r.id} className="flex items-start justify-between gap-4">
                <span className="text-[14px] text-muted-foreground">
                  <span className="font-semibold text-foreground">{r.quantity}</span> × {r.products?.name}
                </span>
                <span className="shrink-0 text-[14px] font-medium text-foreground">
                  {formatPrice(getAdjustedPrice(r.products?.price ?? 0) * r.quantity)}
                </span>
              </li>
            ))}
          </ul>
          
          <div className="space-y-2 border-t border-border/40 pt-4">
            <div className="flex items-center justify-between text-[14px]">
              <span className="text-muted-foreground">Subtotal</span>
              <span className="font-medium text-foreground">{formatPrice(subtotal)}</span>
            </div>
            <div className="flex items-center justify-between text-[14px]">
              <span className="text-muted-foreground">Domicilio</span>
              <span className="font-medium text-foreground">{applicableFee ? formatPrice(deliveryCost) : "..."}</span>
            </div>
            <div className="pt-2 flex items-center justify-between text-[18px] font-bold text-foreground">
              <span>Total</span>
              <span>{formatPrice(total)}</span>
            </div>
          </div>
        </section>

        {unavailable.length > 0 && (
          <p className="text-center text-sm font-semibold text-destructive">
            Quita los productos agotados de tu carrito para continuar.
          </p>
        )}
      </div>

      {/* Fixed Bottom Action */}
      <div className="fixed inset-x-0 bottom-0 z-40 mx-auto max-w-5xl bg-gradient-to-t from-background via-background/95 to-transparent px-4 pb-[max(1rem,env(safe-area-inset-bottom))] pt-4 md:bottom-4 md:px-0 md:bg-none">
        <button
          className="flex h-[56px] w-full items-center justify-center rounded-full bg-primary px-6 shadow-2xl transition-transform active:scale-95 disabled:opacity-50 disabled:active:scale-100"
          onClick={placeOrder}
          disabled={placing || unavailable.length > 0}
        >
          <span className="text-[17px] font-bold text-primary-foreground">
            {placing ? "Confirmando..." : `Confirmar pedido · ${formatPrice(total)}`}
          </span>
        </button>
      </div>
    </AppShell>
  );
}
