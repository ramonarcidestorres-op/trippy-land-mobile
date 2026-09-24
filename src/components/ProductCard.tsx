import { Link } from "@tanstack/react-router";
import { Plus, Loader2, Clock } from "lucide-react";
import { useCart } from "@/hooks/useCart";
import { formatPrice } from "@/lib/format";
import { type Product } from "@/lib/queries";
import { useReferral } from "@/hooks/useReferral";
import { useState } from "react";
import { toast } from "sonner";

// Sincronización forzada para Lovable
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
    <div className="group relative flex w-full flex-col overflow-hidden rounded-[28px] bg-[#1E1F24] pb-5 transition-all focus-within:ring-2 focus-within:ring-primary/30 active:scale-[0.98]">
      {/* Fondo diagonal inspirado en la referencia */}
      <div 
        className="absolute left-0 top-0 h-[55%] w-full bg-[#282A2F]" 
        style={{ clipPath: 'polygon(0 0, 100% 0, 100% 65%, 0 100%)' }} 
      />

      <Link
        to="/producto/$id"
        params={{ id: product.id }}
        className="relative z-10 mx-auto mt-6 block aspect-square w-36 drop-shadow-[0_10px_20px_rgba(0,0,0,0.5)] transition-transform duration-500"
      >
        <img
          src={img}
          alt={product.name}
          loading="lazy"
          className="size-full object-contain transition-transform duration-500 group-hover:scale-110"
        />
        {!available && (
          <div className="absolute inset-0 grid place-items-center bg-background/80 text-[11px] font-bold uppercase tracking-widest text-primary">
            Agotado
          </div>
        )}
      </Link>
      
      <div className="relative z-10 mt-6 flex flex-1 flex-col px-5">
        <Link 
          to="/producto/$id"
          params={{ id: product.id }}
          className="outline-none"
        >
          <h3 className="line-clamp-1 text-[17px] font-semibold text-white">
            {product.name}
          </h3>
          <p className="mt-1.5 line-clamp-2 text-[13px] text-[#A0A0A0]">
            {product.description || "Delicioso producto seleccionado especialmente para ti."}
          </p>
        </Link>
        
        <div className="mt-5 flex items-center justify-between">
          <div className="flex items-center text-[12px] font-medium text-[#7D7D7D]">
            <Clock className="mr-1.5 size-3.5" />
            20 min.
          </div>
          
          <div className="flex items-center gap-3">
            <p className="text-[16px] font-bold tracking-wide text-[#E63946]">
              {formatPrice(getAdjustedPrice(product.price))}
            </p>
            
            {available && (
              <button 
                onClick={handleAdd}
                disabled={busy}
                className="flex size-8 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-sm transition-transform active:scale-90 disabled:opacity-50"
                aria-label="Agregar al carrito"
              >
                {busy ? <Loader2 className="size-4 animate-spin" /> : <Plus className="size-4" strokeWidth={3} />}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export function ProductCardSkeleton() {
  return (
    <div className="relative flex w-full flex-col overflow-hidden rounded-[28px] bg-[#1E1F24] pb-5">
      <div 
        className="absolute left-0 top-0 h-[55%] w-full bg-[#282A2F]" 
        style={{ clipPath: 'polygon(0 0, 100% 0, 100% 65%, 0 100%)' }} 
      />
      <div className="relative z-10 mx-auto mt-6 aspect-square w-36 animate-pulse rounded-xl bg-surface-2" />
      <div className="relative z-10 mt-6 flex flex-1 flex-col px-5 space-y-2">
        <div className="space-y-1.5">
          <div className="h-5 w-full animate-pulse rounded bg-surface-2" />
          <div className="h-4 w-2/3 animate-pulse rounded bg-surface-2" />
        </div>
        <div className="mt-5 flex items-center justify-between">
          <div className="h-4 w-16 animate-pulse rounded bg-surface-2" />
          <div className="h-5 w-16 animate-pulse rounded bg-surface-2" />
        </div>
      </div>
    </div>
  );
}
