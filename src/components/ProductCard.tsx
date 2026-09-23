import { Link } from "@tanstack/react-router";
import { Box, ShoppingCart } from "lucide-react";
import { formatPrice } from "@/lib/format";
import type { Product } from "@/lib/queries";

export function ProductCard({ product }: { product: Product }) {
  const available = product.is_available !== false;
  return (
    <div className="group flex flex-col overflow-hidden rounded-2xl border border-border/40 bg-[#0a0a0a] transition-all focus-within:ring-2 focus-within:ring-[#F5F5DC]/30 md:hover:border-border/80">
      <Link
        to="/producto/$id"
        params={{ id: product.id }}
        className="relative aspect-square overflow-hidden bg-surface-2 block outline-none"
      >
        {product.image_url ? (
          <img
            src={product.image_url}
            alt={product.name}
            loading="lazy"
            className="size-full object-cover transition-transform duration-700 md:group-hover:scale-105"
          />
        ) : (
          <div className="grid size-full place-items-center text-muted-foreground opacity-50">
            <Box className="size-8" />
          </div>
        )}
        {!available && (
          <div className="absolute inset-0 grid place-items-center bg-black/80 text-xs font-semibold uppercase tracking-widest text-[#F5F5DC]">
            Agotado
          </div>
        )}
      </Link>
      
      <div className="flex flex-1 flex-col justify-between p-3.5">
        <Link 
          to="/producto/$id"
          params={{ id: product.id }}
          className="outline-none"
        >
          <p className="line-clamp-2 text-sm font-medium leading-snug text-foreground/90">
            {product.name}
          </p>
        </Link>
        
        <div className="mt-3 flex items-center justify-between">
          <p className="text-sm font-semibold tracking-wide text-[#F5F5DC]">
            {formatPrice(product.price)}
          </p>
          {available && (
            <Link
              to="/producto/$id"
              params={{ id: product.id }}
              className="flex size-8 items-center justify-center rounded-full bg-surface-2 text-[#F5F5DC] transition-all active:scale-95 active:bg-[#F5F5DC] active:text-black md:hover:bg-surface"
              aria-label="Ver producto"
            >
              <ShoppingCart className="size-4" />
            </Link>
          )}
        </div>
      </div>
    </div>
  );
}

export function ProductCardSkeleton() {
  return (
    <div className="flex flex-col overflow-hidden rounded-2xl border border-border/40 bg-[#0a0a0a]">
      <div className="aspect-square animate-pulse bg-surface-2" />
      <div className="flex flex-1 flex-col justify-between p-3.5 space-y-3">
        <div className="space-y-2">
          <div className="h-3.5 w-full animate-pulse rounded bg-surface-2" />
          <div className="h-3.5 w-2/3 animate-pulse rounded bg-surface-2" />
        </div>
        <div className="flex items-center justify-between">
          <div className="h-4 w-16 animate-pulse rounded bg-surface-2" />
          <div className="size-8 animate-pulse rounded-full bg-surface-2" />
        </div>
      </div>
    </div>
  );
}
