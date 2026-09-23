import { Link } from "@tanstack/react-router";
import { ShoppingCart, Clock } from "lucide-react";
import { formatPrice } from "@/lib/format";
import type { Product } from "@/lib/queries";

export function ProductCard({ product }: { product: Product }) {
  const available = product.is_available !== false;
  
  // Use unsplash fallbacks for the images to match the premium dark look if none exists
  const fallbackImg = product.name.toLowerCase().includes("gom") 
    ? "https://images.unsplash.com/photo-1582058091505-f87a2e55a40f?w=400&q=80"
    : product.name.toLowerCase().includes("choco")
    ? "https://images.unsplash.com/photo-1606312619070-d48b4c652a52?w=400&q=80"
    : "https://images.unsplash.com/photo-1550258987-190a2d41a8ba?w=400&q=80";

  const img = product.image_url || fallbackImg;

  return (
    <div className="group relative flex w-full flex-col overflow-hidden rounded-[32px] bg-[#1a1a1a] pb-5 transition-all focus-within:ring-2 focus-within:ring-[#e5e5e5]/30">
      {/* Background angled cut effect */}
      <div 
        className="absolute inset-0 z-0 bg-[#242424]"
        style={{ clipPath: "polygon(0 0, 100% 0, 100% 45%, 0 75%)" }}
      />
      
      <Link
        to="/producto/$id"
        params={{ id: product.id }}
        className="relative z-10 mx-auto mt-6 block aspect-square w-3/4 outline-none"
      >
        <div className="relative size-full rounded-full shadow-2xl overflow-hidden bg-surface-2 transition-transform duration-500 md:group-hover:-translate-y-2 md:group-hover:scale-105">
          <img
            src={img}
            alt={product.name}
            loading="lazy"
            className="size-full object-cover"
          />
          {!available && (
            <div className="absolute inset-0 grid place-items-center bg-black/70 text-xs font-semibold uppercase tracking-widest text-white">
              Agotado
            </div>
          )}
        </div>
      </Link>
      
      <div className="relative z-10 mt-6 flex flex-1 flex-col px-5">
        <Link 
          to="/producto/$id"
          params={{ id: product.id }}
          className="outline-none"
        >
          <h3 className="line-clamp-1 text-[17px] font-medium leading-snug text-white">
            {product.name}
          </h3>
          <p className="mt-1.5 line-clamp-2 text-xs text-muted-foreground">
            {product.description || "Delicioso producto seleccionado especialmente para ti."}
          </p>
        </Link>
        
        <div className="mt-4 flex items-center justify-between">
          <div className="flex items-center gap-1.5 text-muted-foreground">
            <Clock className="size-3.5" />
            <span className="text-[11px] font-medium tracking-wide">20 min.</span>
          </div>
          <p className="text-lg font-bold tracking-wide text-[#ff2a55]">
            {formatPrice(product.price)}
          </p>
        </div>
        
        {available && (
          <div className="mt-4 hidden">
            {/* Keeping the icon here if needed later, but the reference hides it or places it elsewhere. We let the whole card be clickable. */}
          </div>
        )}
      </div>
    </div>
  );
}

export function ProductCardSkeleton() {
  return (
    <div className="relative flex w-full flex-col overflow-hidden rounded-[32px] bg-[#1a1a1a] pb-5">
      <div 
        className="absolute inset-0 z-0 bg-[#242424]"
        style={{ clipPath: "polygon(0 0, 100% 0, 100% 45%, 0 75%)" }}
      />
      <div className="relative z-10 mx-auto mt-6 aspect-square w-3/4 animate-pulse rounded-full bg-surface-2 shadow-2xl" />
      <div className="relative z-10 mt-6 flex flex-1 flex-col px-5 space-y-3">
        <div className="space-y-2">
          <div className="h-4 w-full animate-pulse rounded bg-surface-2" />
          <div className="h-3 w-2/3 animate-pulse rounded bg-surface-2" />
        </div>
        <div className="mt-4 flex items-center justify-between">
          <div className="h-3 w-16 animate-pulse rounded bg-surface-2" />
          <div className="h-5 w-16 animate-pulse rounded bg-surface-2" />
        </div>
      </div>
    </div>
  );
}
