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
import { cartQuery, cartSubtotal } from "@/lib/queries";
import { supabase } from "@/integrations/supabase/client";
import { formatPrice } from "@/lib/format";
import { addressStore, composeAddress, type SavedAddress } from "@/lib/address";
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

  const [addresses, setAddresses] = useState<SavedAddress[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ label: "Casa", address: "", references: "", notes: "" });
  const [placing, setPlacing] = useState(false);
  const lock = useRef(false);

  useEffect(() => {
    const sync = () => {
      const list = addressStore.list();
      setAddresses(list);
      setSelectedId(addressStore.selected()?.id ?? null);
      setShowForm(list.length === 0);
    };
    sync();
    window.addEventListener("tls-address-change", sync);
    return () => window.removeEventListener("tls-address-change", sync);
  }, []);

  const rows = data ?? [];
  const subtotal = cartSubtotal(rows);
  const unavailable = rows.filter((r) => r.products?.is_available === false);
  const selected = addresses.find((a) => a.id === selectedId) ?? null;

  function saveAddress() {
    if (form.address.trim().length < 6) {
      toast.error("Escribe una dirección completa para la entrega.");
      return;
    }
    addressStore.save({
      label: form.label.trim() || "Mi dirección",
      address: form.address.trim(),
      references: form.references.trim(),
      notes: form.notes.trim(),
    });
    setForm({ label: "Casa", address: "", references: "", notes: "" });
    setShowForm(false);
  }

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
      const { data: order, error: orderError } = await supabase
        .from("orders")
        .insert({
          user_id: user.id,
          status: "pending",
          total: subtotal,
          delivery_address: composeAddress(selected),
          delivery_method: "delivery",
          payment_method: "cash",
        })
        .select("id")
        .single();
      if (orderError || !order) throw new Error(orderError?.message ?? "No se creó el pedido");

      const items = rows.map((r) => ({
        order_id: order.id,
        product_id: r.product_id,
        quantity: r.quantity,
        price_at_time: Number(r.products?.price ?? 0),
      }));
      const { error: itemsError } = await supabase.from("order_items").insert(items);
      if (itemsError) throw new Error(itemsError.message);

      await supabase.from("cart_items").delete().eq("user_id", user.id);
      await queryClient.invalidateQueries({ queryKey: ["cart"] });
      await queryClient.invalidateQueries({ queryKey: ["orders"] });

      navigate({ to: "/pedido/$id", params: { id: order.id }, search: { nuevo: true } });
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
              <Link to="/catalogo">Ir al catálogo</Link>
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
        <h2 className="flex items-center gap-2 text-sm font-semibold">
          <MapPin className="size-4 text-candy-lime" /> Dirección de entrega
        </h2>

        {addresses.length > 0 && (
          <ul className="mt-3 space-y-2">
            {addresses.map((a) => (
              <li key={a.id}>
                <button
                  onClick={() => addressStore.select(a.id)}
                  className={cn(
                    "w-full rounded-xl border p-3 text-left",
                    a.id === selectedId
                      ? "border-primary bg-primary/10"
                      : "border-border bg-surface",
                  )}
                >
                  <p className="text-sm font-medium">{a.label}</p>
                  <p className="text-xs text-muted-foreground">{a.address}</p>
                  {a.references && (
                    <p className="text-xs text-muted-foreground">Ref: {a.references}</p>
                  )}
                </button>
              </li>
            ))}
          </ul>
        )}

        {showForm ? (
          <div className="mt-3 space-y-3">
            <div className="space-y-1.5">
              <Label htmlFor="label">Nombre de la dirección</Label>
              <Input
                id="label"
                value={form.label}
                onChange={(e) => setForm({ ...form, label: e.target.value })}
                placeholder="Casa, trabajo…"
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="address">Dirección</Label>
              <Input
                id="address"
                value={form.address}
                onChange={(e) => setForm({ ...form, address: e.target.value })}
                placeholder="Calle 00 #00-00, barrio, ciudad"
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="references">Referencias</Label>
              <Input
                id="references"
                value={form.references}
                onChange={(e) => setForm({ ...form, references: e.target.value })}
                placeholder="Torre 2, apto 301, portería"
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="notes">Indicaciones para el domiciliario</Label>
              <Textarea
                id="notes"
                value={form.notes}
                onChange={(e) => setForm({ ...form, notes: e.target.value })}
                placeholder="Llamar al llegar, no timbrar…"
              />
            </div>
            <div className="flex gap-2">
              <Button onClick={saveAddress} className="flex-1">
                Guardar dirección
              </Button>
              {addresses.length > 0 && (
                <Button variant="ghost" onClick={() => setShowForm(false)}>
                  Cancelar
                </Button>
              )}
            </div>
          </div>
        ) : (
          <Button variant="secondary" className="mt-3 w-full" onClick={() => setShowForm(true)}>
            <Plus className="mr-1 size-4" /> Agregar otra dirección
          </Button>
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
            <span className="text-xs text-muted-foreground">Se confirma con la tienda</span>
          </div>
          <div className="flex items-center justify-between pt-1 text-base font-bold">
            <span>Total</span>
            <span className="candy-text">{formatPrice(subtotal)}</span>
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
        disabled={placing || unavailable.length > 0}
      >
        {placing ? "Creando pedido…" : `Confirmar pedido · ${formatPrice(subtotal)}`}
      </Button>
    </AppShell>
  );
}
