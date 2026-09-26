import { Link } from "@tanstack/react-router";
import { Plus, Loader2 } from "lucide-react";
import { useCart } from "@/hooks/useCart";
import { formatPrice } from "@/lib/format";
import { type Product } from "@/lib/queries";
import { useReferral } from "@/hooks/useReferral";
import { useState } from "react";
import { toast } from "sonner";

export function ProductCard({ product }: { product: Product }) {
  const available = product.is_available !== false;
  const { addToCart } = useCart();
  const { getAdjustedPrice } = useReferral();
  const [busy, setBusy] = useState(false);

  async function handleAdd(e: React.MouseEvent) {
    e.preventDefault();
    if (!available || busy) return;
    
    setBusy(true);
    try {
      addToCart(product, 1);
      toast.success("Agregado al carrito");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Error al agregar");
    } finally {
      setBusy(false);
    }
  }
  
  // Use unsplash fallbacks for the images to match the premium dark look if none exists
  const fallbackImg = product.name.toLowerCase().includes("gom") 
    ? "https://images.unsplash.com/photo-1582058091505-f87a2e55a40f?w=400&q=80"
    : product.name.toLowerCase().includes("choco")
    ? "https://images.unsplash.com/photo-1606312619070-d48b4c652a52?w=400&q=80"
    : "https://images.unsplash.com/photo-1550258987-190a2d41a8ba?w=400&q=80";

  const img = product.image_url || fallbackImg;

  return (
    <div className="group relative flex w-full flex-col overflow-hidden rounded-[26px] bg-surface-2/90 border border-border/40 pb-4 transition-all focus-within:ring-2 focus-within:ring-primary/30 active:scale-[0.98] shadow-sm">
      <Link
        to="/producto/$id"
        params={{ id: product.id }}
        className="relative z-10 mx-auto mt-5 block aspect-square w-32 drop-shadow-[0_8px_16px_rgba(0,0,0,0.4)] transition-transform duration-500"
      >
        <img
          src={img}
          alt={product.name}
          loading="lazy"
          className="size-full object-contain transition-transform duration-500 group-hover:scale-110"
        />
        {!available && (
          <div className="absolute inset-0 grid place-items-center rounded-2xl bg-background/85 text-[10px] font-black uppercase tracking-widest text-red-400 border border-red-500/30 backdrop-blur-sm">
            Agotado
          </div>
        )}
      </Link>
      
      <div className="relative z-10 mt-4 flex flex-1 flex-col px-3.5">
        <Link 
          to="/producto/$id"
          params={{ id: product.id }}
          className="outline-none"
        >
          <h3 className="line-clamp-1 text-[15px] font-bold text-foreground">
            {product.name}
          </h3>
          <p className="mt-0.5 line-clamp-2 text-[11px] text-muted-foreground leading-relaxed">
            {product.description || "Delicioso producto seleccionado especialmente para ti."}
          </p>
        </Link>
        
        <div className="mt-3.5 flex items-center justify-between pt-1 border-t border-border/20">
          <p className="text-[15px] font-extrabold tracking-tight text-foreground">
            {formatPrice(getAdjustedPrice(product.price))}
          </p>
          
          {available && (
            <button 
              onClick={handleAdd}
              disabled={busy}
              className="flex size-8 shrink-0 items-center justify-center rounded-full bg-surface hover:bg-primary hover:text-black border border-border/60 text-foreground transition-all active:scale-90 disabled:opacity-50 shadow-sm"
              aria-label="Agregar al carrito"
            >
              {busy ? <Loader2 className="size-3.5 animate-spin" /> : <Plus className="size-4" strokeWidth={2.5} />}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

export function ProductCardSkeleton() {
  return (
    <div className="relative flex w-full flex-col overflow-hidden rounded-[26px] bg-surface-2/90 border border-border/40 pb-4">
      <div className="relative z-10 mx-auto mt-5 aspect-square w-32 animate-pulse rounded-2xl bg-surface" />
      <div className="relative z-10 mt-4 flex flex-1 flex-col px-3.5 space-y-2">
        <div className="space-y-1.5">
          <div className="h-4 w-3/4 animate-pulse rounded bg-surface" />
          <div className="h-3 w-full animate-pulse rounded bg-surface" />
        </div>
        <div className="mt-3.5 flex items-center justify-between pt-1 border-t border-border/20">
          <div className="h-4 w-16 animate-pulse rounded bg-surface" />
          <div className="size-8 animate-pulse rounded-full bg-surface" />
        </div>
      </div>
    </div>
  );
}

