import { Link } from "@tanstack/react-router";
import { Plus } from "lucide-react";
import { formatPrice } from "@/lib/format";
import type { Product } from "@/lib/queries";
import { useCart } from "@/hooks/useCart";

export function ProductCard({ product }: { product: Product }) {
  const available = product.is_available !== false;
  const { addItem } = useCart();
  
  // Use unsplash fallbacks for the images to match the premium dark look if none exists
  const fallbackImg = product.name.toLowerCase().includes("gom") 
    ? "https://images.unsplash.com/photo-1582058091505-f87a2e55a40f?w=400&q=80"
    : product.name.toLowerCase().includes("choco")
    ? "https://images.unsplash.com/photo-1606312619070-d48b4c652a52?w=400&q=80"
    : "https://images.unsplash.com/photo-1550258987-190a2d41a8ba?w=400&q=80";

  const img = product.image_url || fallbackImg;

  return (
    <div className="group relative flex w-full flex-col overflow-hidden rounded-[28px] bg-surface-2/60 pb-4 transition-all focus-within:ring-2 focus-within:ring-primary/30 active:scale-[0.98]">
      <Link
        to="/producto/$id"
        params={{ id: product.id }}
        className="relative z-10 mx-auto mt-4 block aspect-[4/3] w-11/12 overflow-hidden rounded-2xl bg-surface transition-transform duration-500"
      >
        <img
          src={img}
          alt={product.name}
          loading="lazy"
          className="size-full object-cover transition-transform duration-500 group-hover:scale-105"
        />
        {!available && (
          <div className="absolute inset-0 grid place-items-center bg-background/80 text-[11px] font-bold uppercase tracking-widest text-primary">
            Agotado
          </div>
        )}
      </Link>
      
      <div className="relative z-10 mt-4 flex flex-1 flex-col px-4">
        <Link 
          to="/producto/$id"
          params={{ id: product.id }}
          className="outline-none"
        >
          <h3 className="line-clamp-1 text-[15px] font-semibold leading-snug text-foreground">
            {product.name}
          </h3>
          <p className="mt-1 line-clamp-1 text-[13px] text-muted-foreground">
            {product.description || "Delicioso producto seleccionado especialmente para ti."}
          </p>
        </Link>
        
        <div className="mt-4 flex items-center justify-between">
          <p className="text-[15px] font-bold tracking-wide text-foreground">
            {formatPrice(product.price)}
          </p>
          
          {available && (
            <button 
              onClick={(e) => {
                e.preventDefault();
                addItem(product);
              }}
              className="flex size-8 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-sm transition-transform active:scale-90"
              aria-label="Agregar al carrito"
            >
              <Plus className="size-4" strokeWidth={3} />
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

export function ProductCardSkeleton() {
  return (
    <div className="relative flex w-full flex-col overflow-hidden rounded-[28px] bg-surface-2/60 pb-4">
      <div className="relative z-10 mx-auto mt-4 aspect-[4/3] w-11/12 animate-pulse rounded-2xl bg-surface" />
      <div className="relative z-10 mt-4 flex flex-1 flex-col px-4 space-y-2">
        <div className="space-y-1.5">
          <div className="h-4 w-full animate-pulse rounded bg-surface" />
          <div className="h-3 w-2/3 animate-pulse rounded bg-surface" />
        </div>
        <div className="mt-4 flex items-center justify-between">
          <div className="h-5 w-16 animate-pulse rounded bg-surface" />
          <div className="size-8 animate-pulse rounded-full bg-surface" />
        </div>
      </div>
    </div>
  );
}
