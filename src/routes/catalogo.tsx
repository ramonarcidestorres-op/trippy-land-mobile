import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { Candy, Search } from "lucide-react";
import { AppShell } from "@/components/AppShell";
import { ProductCard, ProductCardSkeleton } from "@/components/ProductCard";
import { EmptyState } from "@/components/States";
import { Input } from "@/components/ui/input";
import { categoriesQuery, productsQuery } from "@/lib/queries";
import { cn } from "@/lib/utils";

type CatalogSearch = { q?: string | undefined; categoria?: string | undefined };

export const Route = createFileRoute("/catalogo")({
  ssr: false,
  validateSearch: (search: Record<string, unknown>): CatalogSearch => ({
    q: typeof search["q"] === "string" ? search["q"] : undefined,
    categoria: typeof search["categoria"] === "string" ? search["categoria"] : undefined,
  }),
  head: () => ({
    meta: [
      { title: "Catálogo — Trippy Land Store" },
      { name: "description", content: "Explora todos los dulces disponibles por categoría." },
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
    navigate({ search: (prev: CatalogSearch) => ({ ...prev, q: value.trim() || undefined }) });
  }

  return (
    <AppShell>
      <h1 className="mb-6 text-[34px] font-bold tracking-tight text-foreground">
        Catálogo
      </h1>

      <form
        className="relative mb-6 shadow-sm"
        onSubmit={(e) => {
          e.preventDefault();
          applySearch(term);
        }}
      >
        <Search className="absolute left-4 top-1/2 size-5 -translate-y-1/2 text-muted-foreground" />
        <Input
          value={term}
          onChange={(e) => setTerm(e.target.value)}
          onBlur={() => applySearch(term)}
          placeholder="Buscar dulces..."
          className="h-14 rounded-full bg-surface-2/60 border-none pl-12 pr-4 text-[15px] font-medium text-foreground placeholder:text-muted-foreground focus-visible:ring-2 focus-visible:ring-primary/50"
        />
      </form>

      <div className="mb-8 flex gap-3 overflow-x-auto pb-2 scrollbar-hide">
        <button
          onClick={() => navigate({ search: (prev: CatalogSearch) => ({ ...prev, categoria: undefined }) })}
          className={cn(
            "shrink-0 rounded-full px-5 py-2.5 text-[14px] font-semibold transition-all active:scale-95",
            !categoria ? "bg-primary text-primary-foreground shadow-sm" : "bg-surface-2/60 text-foreground hover:bg-surface-2"
          )}
        >
          Todos
        </button>
        {categories.data?.map((c) => {
          const n = c.name?.toLowerCase() || "";
          let activeColor = "bg-primary text-primary-foreground shadow-sm";
          
          if (n.includes("coca")) {
            activeColor = "bg-[#F5F5F0] text-black shadow-sm";
          } else if (n.includes("pre-roll") || n.includes("pre roll")) {
            activeColor = "bg-[#9EAB91] text-black shadow-sm";
          } else if (n.includes("weed")) {
            activeColor = "bg-[#9EAB91] text-black shadow-sm";
          } else if (n.includes("farma")) {
            activeColor = "bg-[#A7C7E7] text-black shadow-sm";
          } else if (n.includes("sint")) {
            activeColor = "bg-[#FCA5A5] text-black shadow-sm";
          }

          return (
            <button
              key={c.id}
              onClick={() => navigate({ search: (prev: CatalogSearch) => ({ ...prev, categoria: c.slug }) })}
              className={cn(
                "shrink-0 rounded-full px-5 py-2.5 text-[14px] font-semibold transition-all active:scale-95",
                categoria === c.slug
                  ? activeColor
                  : "bg-surface-2/60 text-foreground hover:bg-surface-2"
              )}
            >
              {c.name}
            </button>
          );
        })}
      </div>

      <div className="mb-8">
        {products.isLoading ? (
          <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
            {[0, 1, 2, 3, 4, 5].map((i) => (
              <ProductCardSkeleton key={i} />
            ))}
          </div>
        ) : products.error ? (
          <div className="rounded-3xl bg-surface-2/40 p-8 text-center">
            <p className="text-sm text-muted-foreground">No se pudieron cargar los productos.</p>
          </div>
        ) : products.data?.length ? (
          <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
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
