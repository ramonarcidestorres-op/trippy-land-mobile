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
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/_authenticated/carrito")({
  head: () => ({
    meta: [
      { title: "Carrito — Trippy Land Store" },
      { name: "description", content: "Revisa tus dulces antes de pedir a domicilio." },
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
      <h1 className="mb-6 text-[34px] font-bold tracking-tight text-foreground">
        Carrito
      </h1>

      {isLoading ? (
        <div className="mt-4 space-y-4">
          {[0, 1, 2].map((i) => (
            <div key={i} className="h-28 animate-pulse rounded-[24px] bg-surface-2/60" />
          ))}
        </div>
      ) : error ? (
        <div className="mt-4 rounded-3xl bg-surface-2/40 p-8 text-center">
          <ErrorState error={error} onRetry={() => refetch()} />
        </div>
      ) : rows.length === 0 ? (
        <div className="mt-10">
          <EmptyState
            icon={<ShoppingBag className="size-7" />}
            title="Tu carrito está vacío"
            description="Agrega tus antojos favoritos desde el catálogo."
            action={
              <Link
                to="/catalogo"
                search={{}}
                className="mt-4 flex h-12 w-full items-center justify-center rounded-full bg-primary font-bold text-primary-foreground shadow-sm transition-transform active:scale-95"
              >
                Explorar catálogo
              </Link>
            }
          />
        </div>
      ) : (
        <div className="pb-8">
          <ul className="space-y-4">
            {rows.map((row) => {
              // Fallback image handling
              const s = row.products?.name.toLowerCase() || "";
              let imgUrl = row.products?.image_url;
              if (!imgUrl) {
                if (s.includes("gom")) imgUrl = "https://images.unsplash.com/photo-1582058091505-f87a2e55a40f?w=400&q=80";
                else if (s.includes("choco")) imgUrl = "https://images.unsplash.com/photo-1606312619070-d48b4c652a52?w=400&q=80";
                else imgUrl = "https://images.unsplash.com/photo-1550258987-190a2d41a8ba?w=400&q=80";
              }

              return (
                <li
                  key={row.id}
                  className="flex gap-4 rounded-[28px] bg-surface-2/60 p-4 transition-all"
                >
                  <div className="size-20 shrink-0 overflow-hidden rounded-2xl bg-surface">
                    <img
                      src={imgUrl}
                      alt={row.products?.name}
                      loading="lazy"
                      className="size-full object-cover"
                    />
                  </div>
                  
                  <div className="flex min-w-0 flex-1 flex-col justify-between">
                    <div>
                      <div className="flex items-start justify-between">
                        <h3 className="line-clamp-1 pr-2 text-[15px] font-semibold leading-tight text-foreground">
                          {row.products?.name}
                        </h3>
                        <button
                          className="flex size-7 shrink-0 items-center justify-center rounded-full bg-surface text-muted-foreground transition-transform active:scale-90"
                          onClick={() => removeItem(row.id)}
                          aria-label="Eliminar"
                        >
                          <Trash2 className="size-3.5" />
                        </button>
                      </div>
                      <p className="mt-1 text-[13px] font-medium text-muted-foreground">
                        {formatPrice(row.products?.price)} c/u
                      </p>
                      {row.products?.is_available === false && (
                        <p className="mt-0.5 text-[11px] font-bold text-red-400">
                          No disponible
                        </p>
                      )}
                    </div>
                    
                    <div className="mt-3 flex items-center justify-between">
                      <div className="flex items-center gap-1 rounded-full bg-surface p-1">
                        <button
                          className="flex size-7 items-center justify-center rounded-full bg-surface-2 transition-transform active:scale-90"
                          onClick={() => setQuantity(row.id, row.quantity - 1)}
                          disabled={row.quantity <= 1}
                        >
                          <Minus className="size-3.5" />
                        </button>
                        <span className="w-6 text-center text-[13px] font-bold">{row.quantity}</span>
                        <button
                          className="flex size-7 items-center justify-center rounded-full bg-surface-2 transition-transform active:scale-90"
                          onClick={() => setQuantity(row.id, row.quantity + 1)}
                        >
                          <Plus className="size-3.5" />
                        </button>
                      </div>
                      <span className="text-[15px] font-bold text-foreground">
                        {formatPrice(Number(row.products?.price ?? 0) * row.quantity)}
                      </span>
                    </div>
                  </div>
                </li>
              );
            })}
          </ul>

          {/* Resumen transparente HIG */}
          <div className="mt-8 rounded-[32px] bg-surface-2/40 p-6">
            <div className="flex items-center justify-between text-sm">
              <span className="font-medium text-muted-foreground">Subtotal</span>
              <span className="text-[15px] font-bold text-foreground">{formatPrice(subtotal)}</span>
            </div>
            
            <div className="mt-6">
              <Link
                to="/checkout"
                className="flex h-[52px] w-full items-center justify-center rounded-full bg-primary text-[16px] font-bold text-primary-foreground shadow-sm transition-transform active:scale-95"
              >
                Proceder al pago
              </Link>
            </div>
          </div>
        </div>
      )}
    </AppShell>
  );
}
