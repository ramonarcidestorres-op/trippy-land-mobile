import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { Search, Box, Droplets, Leaf, Pill, Flame, PlusSquare } from "lucide-react";
import { AppShell } from "@/components/AppShell";
import { ProductCard, ProductCardSkeleton } from "@/components/ProductCard";
import { EmptyState, ErrorState } from "@/components/States";
import { Input } from "@/components/ui/input";
import { categoriesQuery, productsQuery } from "@/lib/queries";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/")({
  ssr: false,
  head: () => ({
    meta: [
      { title: "Trippy Land Store" },
      { name: "description", content: "Tienda exclusiva. Catálogo, carrito y pedidos." },
    ],
  }),
  component: HomePage,
});

// Helper for discrete category icons
function getCategoryIcon(slug: string) {
  switch (slug) {
    case "sinteticos":
      return <Pill className="size-5 opacity-70" />;
    case "weed":
      return <Leaf className="size-5 opacity-70" />;
    case "pre-rolls":
      return <Flame className="size-5 opacity-70" />;
    case "farmacia":
      return <PlusSquare className="size-5 opacity-70" />;
    case "coca":
      return <Droplets className="size-5 opacity-70" />;
    default:
      return <Box className="size-5 opacity-70" />;
  }
}

function HomePage() {
  const [search, setSearch] = useState("");
  const categories = useQuery(categoriesQuery());
  const products = useQuery(productsQuery());

  return (
    <AppShell>
      <section className="relative overflow-hidden rounded-3xl border border-border/40 bg-[#0a0a0a] p-6 shadow-sm">
        <div className="flex flex-col items-center text-center">
          {/* Logo container with generous padding to handle the black margins in the original image */}
          <div className="mb-4 flex h-24 w-full items-center justify-center p-2">
            <img 
              src="/logo.png" 
              alt="Trippy Land Logo" 
              className="h-full max-h-full w-auto object-contain"
              onError={(e) => {
                // Fallback to text if image is not present yet
                (e.target as HTMLImageElement).style.display = 'none';
                (e.target as HTMLImageElement).nextElementSibling?.classList.remove('hidden');
              }}
            />
            <div className="hidden flex-col items-center">
              <span className="text-3xl font-serif text-[#F5F5DC] tracking-widest">TRIPPY LAND</span>
            </div>
          </div>
          
          <p className="mt-2 text-sm text-muted-foreground max-w-[250px]">
            Explora nuestro catálogo exclusivo
          </p>
        </div>

        <div className="relative mt-6">
          <Search className="absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Buscar..."
            className="h-12 rounded-xl bg-surface border-border/50 pl-10 focus-visible:ring-[#F5F5DC]/30 focus-visible:border-[#F5F5DC]/50 transition-all text-base"
          />
        </div>
        {search.trim() && (
          <Link
            to="/catalogo"
            search={(prev: any) => ({ ...prev, q: search.trim() })}
            className="mt-4 block text-center text-sm text-[#F5F5DC]/80 underline underline-offset-4 active:text-[#F5F5DC]"
          >
            Ver resultados para "{search.trim()}"
          </Link>
        )}
      </section>

      <section className="mt-8">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">
            Categorías
          </h2>
        </div>
        {categories.isLoading ? (
          <div className="grid grid-cols-2 gap-3">
            {[0, 1, 2, 3].map((i) => (
              <div key={i} className="h-16 animate-pulse rounded-xl bg-surface-2" />
            ))}
          </div>
        ) : categories.error ? (
          <ErrorState error={categories.error} onRetry={() => categories.refetch()} />
        ) : categories.data?.length ? (
          <div className="grid grid-cols-2 gap-3">
            {categories.data.map((c) => (
              <Link
                key={c.id}
                to="/catalogo"
                search={(prev: any) => ({ ...prev, categoria: c.slug })}
                className={cn(
                  "flex items-center gap-3 rounded-xl border border-border/40 bg-surface px-4 py-3",
                  "transition-all active:scale-[0.98] active:bg-surface-2 active:border-[#F5F5DC]/20 md:hover:bg-surface-2",
                  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#F5F5DC]/30"
                )}
              >
                <div className="text-[#F5F5DC]">
                  {c.icon_url ? (
                    <img src={c.icon_url} alt="" className="size-5 object-contain opacity-80" />
                  ) : (
                    getCategoryIcon(c.slug)
                  )}
                </div>
                <span className="text-sm font-medium tracking-wide text-foreground/90">{c.name}</span>
              </Link>
            ))}
          </div>
        ) : (
          <p className="text-sm text-muted-foreground">
            No hay categorías disponibles.
          </p>
        )}
      </section>

      <section className="mt-10">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">
            Destacados
          </h2>
          <Link 
            to="/catalogo" 
            className="text-xs font-medium text-[#F5F5DC]/80 active:text-[#F5F5DC] md:hover:text-[#F5F5DC]"
          >
            Ver todo
          </Link>
        </div>
        {products.isLoading ? (
          <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
            {[0, 1, 2, 3].map((i) => (
              <ProductCardSkeleton key={i} />
            ))}
          </div>
        ) : products.error ? (
          <ErrorState error={products.error} onRetry={() => products.refetch()} />
        ) : products.data?.length ? (
          <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
            {products.data.slice(0, 8).map((p) => (
              <ProductCard key={p.id} product={p} />
            ))}
          </div>
        ) : (
          <EmptyState
            icon={<Box className="size-7" />}
            title="Sin productos"
            description="No hay productos disponibles por ahora."
          />
        )}
      </section>
    </AppShell>
  );
}
