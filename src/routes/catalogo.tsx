import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { Search, Box, Droplets, Leaf, Pill, Flame, Plus } from "lucide-react";
import { AppShell } from "@/components/AppShell";
import { ProductCard, ProductCardSkeleton } from "@/components/ProductCard";
import { EmptyState, ErrorState } from "@/components/States";
import { Input } from "@/components/ui/input";
import { categoriesQuery, productsQuery } from "@/lib/queries";
import { cn } from "@/lib/utils";

type CatalogSearch = { q?: string; categoria?: string };

export const Route = createFileRoute("/catalogo")({
  ssr: false,
  validateSearch: (search: Record<string, unknown>): CatalogSearch => ({
    q: typeof search.q === "string" ? search.q : undefined,
    categoria: typeof search.categoria === "string" ? search.categoria : undefined,
  }),
  head: () => ({
    meta: [
      { title: "Catálogo — Trippy Land Store" },
      { name: "description", content: "Explora todos los dulces disponibles por categoría." },
    ],
  }),
  component: CatalogPage,
});

// Helper for discrete category icons
function getCategoryIcon(slug: string) {
  switch (slug) {
    case "sinteticos":
      return <Pill className="size-4" />;
    case "weed":
      return <Leaf className="size-4" />;
    case "pre-rolls":
      return <Flame className="size-4" />;
    case "farmacia":
      return <Plus className="size-4" />;
    case "coca":
      return <Droplets className="size-4" />;
    default:
      return <Box className="size-4" />;
  }
}

function CatalogPage() {
  const { q, categoria } = Route.useSearch();
  const navigate = useNavigate({ from: "/catalogo" });
  const [term, setTerm] = useState(q ?? "");

  const categories = useQuery(categoriesQuery());
  const activeCategory = categories.data?.find((c) => c.slug === categoria) ?? null;
  const products = useQuery(
    productsQuery({ search: q, categoryId: activeCategory?.id ?? null }),
  );

  function applySearch(value: string) {
    navigate({ search: (prev) => ({ ...prev, q: value.trim() || undefined }) });
  }

  return (
    <AppShell>
      <h1 className="text-xl font-bold tracking-wide">Catálogo</h1>

      <form
        className="relative mt-4"
        onSubmit={(e) => {
          e.preventDefault();
          applySearch(term);
        }}
      >
        <Search className="absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          value={term}
          onChange={(e) => setTerm(e.target.value)}
          onBlur={() => applySearch(term)}
          placeholder="Buscar por nombre…"
          className="h-12 rounded-xl bg-surface border-border/50 pl-10 focus-visible:ring-[#F5F5DC]/30 focus-visible:border-[#F5F5DC]/50 transition-all text-base"
        />
      </form>

      <div className="mt-6 flex overflow-x-auto pb-2 scrollbar-none gap-2">
        <button
          onClick={() => navigate({ search: (prev) => ({ ...prev, categoria: undefined }) })}
          className={cn(
            "flex shrink-0 items-center gap-2 rounded-xl border px-4 py-2 text-sm transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#F5F5DC]/30",
            !categoria 
              ? "border-[#F5F5DC]/40 bg-[#F5F5DC]/10 text-[#F5F5DC] shadow-[0_0_15px_rgba(245,245,220,0.05)]" 
              : "border-border/40 bg-surface text-foreground/80 active:scale-95 md:hover:bg-surface-2"
          )}
        >
          <Box className="size-4 opacity-70" />
          <span className="font-medium">Todo</span>
        </button>
        {categories.data?.map((c) => {
          const isActive = categoria === c.slug;
          return (
            <button
              key={c.id}
              onClick={() => navigate({ search: (prev) => ({ ...prev, categoria: c.slug }) })}
              className={cn(
                "flex shrink-0 items-center gap-2 rounded-xl border px-4 py-2 text-sm transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#F5F5DC]/30",
                isActive
                  ? "border-[#F5F5DC]/40 bg-[#F5F5DC]/10 text-[#F5F5DC] shadow-[0_0_15px_rgba(245,245,220,0.05)]"
                  : "border-border/40 bg-surface text-foreground/80 active:scale-95 md:hover:bg-surface-2"
              )}
            >
              <div className={cn("opacity-70", isActive && "opacity-100")}>
                {c.icon_url ? (
                  <img src={c.icon_url} alt="" className="size-4 object-contain" />
                ) : (
                  getCategoryIcon(c.slug)
                )}
              </div>
              <span className="font-medium">{c.name}</span>
            </button>
          );
        })}
      </div>

      <div className="mt-6">
        {products.isLoading ? (
          <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
            {[0, 1, 2, 3, 4, 5].map((i) => (
              <ProductCardSkeleton key={i} />
            ))}
          </div>
        ) : products.error ? (
          <ErrorState error={products.error} onRetry={() => products.refetch()} />
        ) : products.data?.length ? (
          <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
            {products.data.map((p) => (
              <ProductCard key={p.id} product={p} />
            ))}
          </div>
        ) : (
          <EmptyState
            icon={<Box className="size-7" />}
            title="Sin resultados"
            description="Prueba con otra búsqueda o cambia de categoría."
          />
        )}
      </div>
    </AppShell>
  );
}
