import { createFileRoute, Link } from "@tanstack/react-router";
import { Minus, Plus, ShoppingBag, Trash2 } from "lucide-react";
import { AppShell } from "@/components/AppShell";
import { EmptyState } from "@/components/States";
import { useCart } from "@/hooks/useCart";
import { useReferral } from "@/hooks/useReferral";
import { formatPrice } from "@/lib/format";

export const Route = createFileRoute("/_authenticated/carrito")({
  ssr: false,
  head: () => ({
    meta: [
      { title: "Carrito — Trippy Land Store" },
      { name: "description", content: "Revisa tus dulces antes de pedir a domicilio." },
    ],
  }),
  component: CartPage,
});

function CartPage() {
  const { cart: rows, setQuantity, removeItem, clearCart } = useCart();
  const { getAdjustedPrice } = useReferral();
  // Calculate subtotal with adjusted prices
  const subtotal = rows.reduce((sum, r) => sum + getAdjustedPrice(r.products?.price ?? 0) * r.quantity, 0);

  return (
    <AppShell>
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-[34px] font-bold tracking-tight text-foreground">
          Carrito Trippy
        </h1>
      </div>

      {rows.length === 0 ? (
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
                  className="relative overflow-hidden rounded-[28px] bg-red-500"
                >
                  <div className="absolute right-0 top-0 bottom-0 flex w-24 items-center justify-center">
                    <Trash2 className="size-6 text-white" />
                  </div>
                  
                  <div className="relative flex w-full overflow-x-auto snap-x snap-mandatory [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
                    <div className="flex min-w-full shrink-0 snap-start gap-4 rounded-[28px] bg-[#1E1F24] p-4">
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
                          </div>
                          <p className="mt-1 text-[13px] font-medium text-muted-foreground">
                            {formatPrice(getAdjustedPrice(row.products?.price ?? 0))} c/u
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
                            {formatPrice(getAdjustedPrice(row.products?.price ?? 0) * row.quantity)}
                          </span>
                        </div>
                      </div>
                    </div>
                    
                    <button 
                      className="w-24 shrink-0 snap-end" 
                      onClick={() => removeItem(row.id)}
                      aria-label="Eliminar"
                    />
                  </div>
                </li>
              );
            })}
          </ul>

          {/* Resumen transparente HIG */}
          <div className="mt-4 flex justify-end">
            <button
              onClick={() => clearCart()}
              className="flex items-center gap-2 text-[14px] font-semibold text-muted-foreground hover:text-red-400 active:scale-95 transition-all px-4 py-2"
            >
              <Trash2 className="size-4" /> Vaciar carrito
            </button>
          </div>
          
          <div className="mb-12 mt-6 rounded-[32px] bg-surface-2/40 p-6 shadow-sm">
            <div className="flex items-center justify-between text-sm">
              <span className="font-medium text-muted-foreground">Subtotal</span>
              <span className="text-[15px] font-bold text-foreground">{formatPrice(subtotal)}</span>
            </div>
            
            <div className="mt-6">
              <Link
                to="/checkout"
                className="flex h-[54px] w-full items-center justify-center rounded-full bg-primary text-[16px] font-bold text-primary-foreground shadow-sm transition-transform active:scale-95"
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
