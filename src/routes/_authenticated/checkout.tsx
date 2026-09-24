import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useRef, useState } from "react";
import { Banknote, MapPin, ShoppingBag } from "lucide-react";
import { toast } from "sonner";
import { AppShell } from "@/components/AppShell";
import { EmptyState } from "@/components/States";
import { useCart } from "@/hooks/useCart";
import { useReferral } from "@/hooks/useReferral";
import { deliveryFeesQuery } from "@/lib/queries";
import { supabase } from "@/integrations/supabase/client";
import { formatPrice } from "@/lib/format";
import { addressStore, composeAddress } from "@/lib/address";
import { AddressManager } from "@/components/AddressManager";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/_authenticated/checkout")({
  head: () => ({
    meta: [
      { title: "Checkout — Trippy Land Store" },
      { name: "description", content: "Confirma tu dirección y paga en efectivo al recibir." },
    ],
  }),
  component: CheckoutPage,
});

function CheckoutPage() {
  const { cart: rows, clearCart } = useCart();
  const { referralCode, getAdjustedPrice } = useReferral();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const [selectedId, setSelectedId] = useState<string | null>(null);
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
  const selected = addressStore.list().find((a) => a.id === selectedId) ?? null;
  const applicableFee = (fees ?? []).find(
    (f) => subtotal >= f.min_subtotal && (f.max_subtotal === null || subtotal <= f.max_subtotal)
  );
  const deliveryCost = applicableFee ? applicableFee[`${deliveryType}_fee`] : 0;
  const total = subtotal + deliveryCost;

  async function placeOrder() {
    if (lock.current) return;
    if (rows.length === 0) return;
    if (unavailable.length > 0) {
      toast.error("Quita del carrito los productos que ya no están disponibles.");
      return;
    }
    if (!selected) {
      toast.error("Selecciona o agrega una dirección de entrega.");
      return;
    }
    lock.current = true;
    setPlacing(true);
    try {
      const { data: orderId, error: rpcError } = await supabase.rpc("place_order_guest", {
        p_delivery_address: composeAddress(selected),
        p_delivery_type: deliveryType,
        p_payment_method: "cash",
        p_cart_items: rows,
        p_referral_code: referralCode,
      });
      if (rpcError || !orderId) throw new Error(rpcError?.message ?? "No se creó el pedido");

      clearCart();
      await queryClient.invalidateQueries({ queryKey: ["orders"] });

      navigate({ to: "/pedido/$id", params: { id: orderId }, search: { nuevo: true } });
    } catch (e) {
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
        <section className={cn(
          "rounded-[32px] p-5 transition-all",
          !selected ? "bg-surface-2/80 border border-primary/40 shadow-sm" : "bg-surface-2/60"
        )}>
          <h2 className="mb-4 flex items-center gap-2 text-[15px] font-semibold text-foreground">
            <MapPin className="size-4" /> Dirección de entrega {!selected && <span className="text-xs text-primary font-bold">(Requerida)</span>}
          </h2>
          <AddressManager />
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
