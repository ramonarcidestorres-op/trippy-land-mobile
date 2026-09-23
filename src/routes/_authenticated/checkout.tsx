import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useRef, useState } from "react";
import { Banknote, MapPin, Plus, ShoppingBag } from "lucide-react";
import { toast } from "sonner";
import { AppShell } from "@/components/AppShell";
import { EmptyState, ErrorState } from "@/components/States";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useAuth } from "@/hooks/useAuth";
import { cartQuery, cartSubtotal, deliveryFeesQuery } from "@/lib/queries";
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
      { property: "og:title", content: "Checkout — Trippy Land Store" },
      {
        property: "og:description",
        content: "Confirma tu dirección y paga en efectivo al recibir.",
      },
    ],
  }),
  component: CheckoutPage,
});

function CheckoutPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { data, isLoading, error, refetch } = useQuery(cartQuery(user?.id));

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

  const rows = data ?? [];
  const subtotal = cartSubtotal(rows);
  const unavailable = rows.filter((r) => r.products?.is_available === false);
  const selected = addressStore.list().find((a) => a.id === selectedId) ?? null;
  const applicableFee = (fees ?? []).find(
    (f) => subtotal >= f.min_subtotal && (f.max_subtotal === null || subtotal <= f.max_subtotal)
  );
  const deliveryCost = applicableFee ? applicableFee[`${deliveryType}_fee`] : 0;
  const total = subtotal + deliveryCost;

  async function placeOrder() {
    if (lock.current || !user) return;
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
      const { data: orderId, error: rpcError } = await supabase.rpc("place_order", {
        p_delivery_address: composeAddress(selected),
        p_delivery_type: deliveryType,
        p_payment_method: "cash",
      });
      if (rpcError || !orderId) throw new Error(rpcError?.message ?? "No se creó el pedido");

      await supabase.from("cart_items").delete().eq("user_id", user.id);
      await queryClient.invalidateQueries({ queryKey: ["cart"] });
      await queryClient.invalidateQueries({ queryKey: ["orders"] });

      navigate({ to: "/pedido/$id", params: { id: orderId }, search: { nuevo: true } });
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "No pudimos crear tu pedido");
      lock.current = false;
      setPlacing(false);
    }
  }

  if (isLoading) {
    return (
      <AppShell>
        <div className="space-y-3">
          <div className="h-28 animate-pulse rounded-2xl bg-surface-2" />
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

  if (rows.length === 0) {
    return (
      <AppShell>
        <EmptyState
          icon={<ShoppingBag className="size-7" />}
          title="No hay nada para pedir"
          description="Agrega productos al carrito para continuar con el checkout."
          action={
            <Button asChild variant="secondary">
              <Link to="/catalogo" search={{}}>Ir al catálogo</Link>
            </Button>
          }
        />
      </AppShell>
    );
  }

  return (
    <AppShell>
      <h1 className="text-xl font-bold">Checkout</h1>

      <section className="mt-4 rounded-2xl border border-border/60 bg-card p-4">
        <h2 className="flex items-center gap-2 text-sm font-semibold mb-3">
          <MapPin className="size-4 text-candy-lime" /> Dirección de entrega
        </h2>
        
        <AddressManager />
      </section>

      <section className="mt-4 rounded-2xl border border-border/60 bg-card p-4">
        <h2 className="text-sm font-semibold">Tipo de entrega</h2>
        <div className="mt-3 grid grid-cols-2 gap-3">
          <button
            onClick={() => setDeliveryType("normal")}
            className={cn(
              "flex flex-col items-center justify-center rounded-xl border p-3 text-center transition-colors",
              deliveryType === "normal"
                ? "border-primary bg-primary/10"
                : "border-border bg-surface hover:bg-surface-2",
            )}
          >
            <span className="font-semibold text-sm">Normal</span>
            <span className="text-[11px] text-muted-foreground mt-0.5">~40 min</span>
            {applicableFee && (
              <span className="mt-1 font-bold text-primary">{formatPrice(applicableFee.normal_fee)}</span>
            )}
          </button>
          <button
            onClick={() => setDeliveryType("fast")}
            className={cn(
              "flex flex-col items-center justify-center rounded-xl border p-3 text-center transition-colors",
              deliveryType === "fast"
                ? "border-primary bg-primary/10"
                : "border-border bg-surface hover:bg-surface-2",
            )}
          >
            <span className="font-semibold text-sm">Rápida 🚀</span>
            <span className="text-[11px] text-muted-foreground mt-0.5">~20 min</span>
            {applicableFee && (
              <span className="mt-1 font-bold text-primary">{formatPrice(applicableFee.fast_fee)}</span>
            )}
          </button>
        </div>
        {!applicableFee && (
          <p className="mt-3 text-xs text-destructive">
            No se encontraron tarifas configuradas para este subtotal.
          </p>
        )}
      </section>

      <section className="mt-4 rounded-2xl border border-border/60 bg-card p-4">
        <h2 className="text-sm font-semibold">Resumen</h2>
        <ul className="mt-3 space-y-2 text-sm">
          {rows.map((r) => (
            <li key={r.id} className="flex items-center justify-between gap-3">
              <span className="min-w-0 truncate text-muted-foreground">
                {r.quantity} × {r.products?.name}
              </span>
              <span>{formatPrice(Number(r.products?.price ?? 0) * r.quantity)}</span>
            </li>
          ))}
        </ul>
        <div className="mt-4 space-y-1.5 border-t border-border pt-3 text-sm">
          <div className="flex items-center justify-between">
            <span className="text-muted-foreground">Subtotal</span>
            <span>{formatPrice(subtotal)}</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-muted-foreground">Domicilio</span>
            <span>{applicableFee ? formatPrice(deliveryCost) : "..."}</span>
          </div>
          <div className="flex items-center justify-between pt-1 text-base font-bold">
            <span>Total</span>
            <span className="candy-text">{formatPrice(total)}</span>
          </div>
        </div>
      </section>

      <section className="mt-4 flex items-center gap-3 rounded-2xl border border-border/60 bg-card p-4">
        <Banknote className="size-5 text-candy-lime" />
        <div>
          <p className="text-sm font-medium">Pago en efectivo</p>
          <p className="text-xs text-muted-foreground">Pagas al domiciliario cuando recibes.</p>
        </div>
      </section>

      {unavailable.length > 0 && (
        <p className="mt-3 text-sm text-destructive">
          Hay productos agotados en tu carrito. Quítalos para poder confirmar.
        </p>
      )}

      <Button
        className="mt-5 h-12 w-full candy-gradient text-base font-semibold text-primary-foreground"
        onClick={placeOrder}
        disabled={placing || unavailable.length > 0 || !applicableFee}
      >
        {placing ? "Creando pedido…" : `Confirmar pedido · ${formatPrice(total)}`}
      </Button>
    </AppShell>
  );
}
