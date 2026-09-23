import { Link } from "@tanstack/react-router";
import { Candy } from "lucide-react";
import { formatPrice } from "@/lib/format";
import type { Product } from "@/lib/queries";

export function ProductCard({ product }: { product: Product }) {
  const available = product.is_available !== false;
  return (
    <Link
      to="/producto/$id"
      params={{ id: product.id }}
      className="group overflow-hidden rounded-2xl border border-border/60 bg-card transition-colors hover:border-primary/60"
    >
      <div className="relative aspect-square overflow-hidden bg-surface-2">
        {product.image_url ? (
          <img
            src={product.image_url}
            alt={product.name}
            loading="lazy"
            className="size-full object-cover transition-transform duration-500 group-hover:scale-105"
          />
        ) : (
          <div className="grid size-full place-items-center text-muted-foreground">
            <Candy className="size-8" />
          </div>
        )}
        {!available && (
          <div className="absolute inset-0 grid place-items-center bg-background/70 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            Agotado
          </div>
        )}
      </div>
      <div className="space-y-1 p-3">
        <p className="line-clamp-2 text-sm font-medium leading-snug">{product.name}</p>
        <p className="text-sm font-semibold candy-text">{formatPrice(product.price)}</p>
      </div>
    </Link>
  );
}

export function ProductCardSkeleton() {
  return (
    <div className="overflow-hidden rounded-2xl border border-border/60 bg-card">
      <div className="aspect-square animate-pulse bg-surface-2" />
      <div className="space-y-2 p-3">
        <div className="h-3.5 w-4/5 animate-pulse rounded bg-surface-2" />
        <div className="h-3.5 w-1/3 animate-pulse rounded bg-surface-2" />
      </div>
    </div>
  );
}
