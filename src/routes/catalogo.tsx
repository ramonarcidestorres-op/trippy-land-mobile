import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { Candy, Search } from "lucide-react";
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
      { property: "og:title", content: "Catálogo — Trippy Land Store" },
      {
        property: "og:description",
        content: "Explora todos los dulces disponibles por categoría.",
      },
    ],
  }),
  component: CatalogPage,
});

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
      <h1 className="text-xl font-bold">Catálogo</h1>

      <form
        className="relative mt-3"
        onSubmit={(e) => {
          e.preventDefault();
          applySearch(term);
        }}
      >
        <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          value={term}
          onChange={(e) => setTerm(e.target.value)}
          onBlur={() => applySearch(term)}
          placeholder="Buscar por nombre…"
          className="h-11 rounded-full bg-surface-2 pl-9"
        />
      </form>

      <div className="mt-4 flex flex-wrap gap-2">
        <button
          onClick={() => navigate({ search: (prev) => ({ ...prev, categoria: undefined }) })}
          className={cn(
            "rounded-full border px-4 py-1.5 text-sm",
            !categoria ? "border-primary bg-primary/15 text-primary" : "border-border bg-surface",
          )}
        >
          Todo
        </button>
        {categories.data?.map((c) => (
          <button
            key={c.id}
            onClick={() => navigate({ search: (prev) => ({ ...prev, categoria: c.slug }) })}
            className={cn(
              "rounded-full border px-4 py-1.5 text-sm",
              categoria === c.slug
                ? "border-primary bg-primary/15 text-primary"
                : "border-border bg-surface",
            )}
          >
            {c.name}
          </button>
        ))}
      </div>

      <div className="mt-5">
        {products.isLoading ? (
          <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
            {[0, 1, 2, 3, 4, 5].map((i) => (
              <ProductCardSkeleton key={i} />
            ))}
          </div>
        ) : products.error ? (
          <ErrorState error={products.error} onRetry={() => products.refetch()} />
        ) : products.data?.length ? (
          <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
            {products.data.map((p) => (
              <ProductCard key={p.id} product={p} />
            ))}
          </div>
        ) : (
          <EmptyState
            icon={<Candy className="size-7" />}
            title="Sin resultados"
            description="Prueba con otra búsqueda o cambia de categoría."
          />
        )}
      </div>
    </AppShell>
  );
}
