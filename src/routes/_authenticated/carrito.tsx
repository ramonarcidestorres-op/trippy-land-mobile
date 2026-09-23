import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Minus, Plus, ShoppingBag, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { AppShell } from "@/components/AppShell";
import { EmptyState, ErrorState } from "@/components/States";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/useAuth";
import { cartQuery, cartSubtotal } from "@/lib/queries";
import { supabase } from "@/integrations/supabase/client";
import { formatPrice } from "@/lib/format";

export const Route = createFileRoute("/_authenticated/carrito")({
  head: () => ({
    meta: [
      { title: "Carrito — Trippy Land Store" },
      { name: "description", content: "Revisa tus dulces antes de pedir a domicilio." },
      { property: "og:title", content: "Carrito — Trippy Land Store" },
      { property: "og:description", content: "Revisa tus dulces antes de pedir a domicilio." },
    ],
  }),
  component: CartPage,
});

function CartPage() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const { data, isLoading, error, refetch } = useQuery(cartQuery(user?.id));

  async function setQuantity(id: string, quantity: number) {
    if (quantity < 1) return;
    const { error: err } = await supabase.from("cart_items").update({ quantity }).eq("id", id);
    if (err) toast.error(err.message);
    await queryClient.invalidateQueries({ queryKey: ["cart"] });
  }

  async function removeItem(id: string) {
    const { error: err } = await supabase.from("cart_items").delete().eq("id", id);
    if (err) toast.error(err.message);
    await queryClient.invalidateQueries({ queryKey: ["cart"] });
  }

  const rows = data ?? [];
  const subtotal = cartSubtotal(rows);

  return (
    <AppShell>
      <h1 className="text-xl font-bold">Tu carrito</h1>

      {isLoading ? (
        <div className="mt-4 space-y-3">
          {[0, 1, 2].map((i) => (
            <div key={i} className="h-24 animate-pulse rounded-2xl bg-surface-2" />
          ))}
        </div>
      ) : error ? (
        <div className="mt-4">
          <ErrorState error={error} onRetry={() => refetch()} />
        </div>
      ) : rows.length === 0 ? (
        <div className="mt-4">
          <EmptyState
            icon={<ShoppingBag className="size-7" />}
            title="Tu carrito está vacío"
            description="Agrega dulces desde el catálogo y vuelve aquí."
            action={
              <Button asChild variant="secondary">
                <Link to="/catalogo">Ir al catálogo</Link>
              </Button>
            }
          />
        </div>
      ) : (
        <>
          <ul className="mt-4 space-y-3">
            {rows.map((row) => (
              <li
                key={row.id}
                className="flex gap-3 rounded-2xl border border-border/60 bg-card p-3"
              >
                <div className="size-20 shrink-0 overflow-hidden rounded-xl bg-surface-2">
                  {row.products?.image_url && (
                    <img
                      src={row.products.image_url}
                      alt={row.products.name}
                      loading="lazy"
                      className="size-full object-cover"
                    />
                  )}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium">{row.products?.name}</p>
                  <p className="text-xs text-muted-foreground">
                    {formatPrice(row.products?.price)} c/u
                  </p>
                  {row.products?.is_available === false && (
                    <p className="text-xs text-destructive">Este producto ya no está disponible</p>
                  )}
                  <div className="mt-2 flex items-center justify-between">
                    <div className="flex items-center gap-1 rounded-full border border-border bg-surface p-0.5">
                      <Button
                        size="icon"
                        variant="ghost"
                        className="size-7 rounded-full"
                        onClick={() => setQuantity(row.id, row.quantity - 1)}
                        disabled={row.quantity <= 1}
                        aria-label="Quitar una unidad"
                      >
                        <Minus className="size-3.5" />
                      </Button>
                      <span className="w-6 text-center text-xs font-semibold">{row.quantity}</span>
                      <Button
                        size="icon"
                        variant="ghost"
                        className="size-7 rounded-full"
                        onClick={() => setQuantity(row.id, row.quantity + 1)}
                        aria-label="Agregar una unidad"
                      >
                        <Plus className="size-3.5" />
                      </Button>
                    </div>
                    <span className="text-sm font-semibold">
                      {formatPrice(Number(row.products?.price ?? 0) * row.quantity)}
                    </span>
                  </div>
                </div>
                <Button
                  size="icon"
                  variant="ghost"
                  className="size-8 text-muted-foreground"
                  onClick={() => removeItem(row.id)}
                  aria-label="Eliminar del carrito"
                >
                  <Trash2 className="size-4" />
                </Button>
              </li>
            ))}
          </ul>

          <div className="mt-5 rounded-2xl border border-border/60 bg-card p-4">
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Subtotal</span>
              <span className="font-semibold">{formatPrice(subtotal)}</span>
            </div>
            <Button
              asChild
              className="mt-4 h-12 w-full candy-gradient text-base font-semibold text-primary-foreground"
            >
              <Link to="/checkout">Continuar al checkout</Link>
            </Button>
          </div>
        </>
      )}
    </AppShell>
  );
}
