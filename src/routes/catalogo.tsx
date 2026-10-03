import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useState, useEffect } from "react";
import { Candy, Search, X } from "lucide-react";
import { AppShell } from "@/components/AppShell";
import { ProductCard, ProductCardSkeleton } from "@/components/ProductCard";
import { EmptyState } from "@/components/States";
import { Input } from "@/components/ui/input";
import { categoriesQuery, productsQuery } from "@/lib/queries";
import { cn } from "@/lib/utils";
import { sanitizeSearchQuery } from "@/lib/sanitize";
import { checkAndNotifyRateLimit } from "@/lib/rateLimit";
import { useLanguage, translateCategoryName } from "@/lib/i18n";

type CatalogSearch = { q?: string | undefined; categoria?: string | undefined };

export const Route = createFileRoute("/catalogo")({
  ssr: false,
  loader: async ({ context: { queryClient } }) => {
    queryClient.ensureQueryData(categoriesQuery()).catch(() => {});
    queryClient.ensureQueryData(productsQuery()).catch(() => {});
  },
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

export function CatalogPage() {
  const { lang, t } = useLanguage();
  const { q, categoria } = Route.useSearch();
  const navigate = useNavigate({ from: "/catalogo" });
  const [term, setTerm] = useState(q ?? "");

  // Sincronizar input cuando cambie el parámetro de búsqueda en la URL
  useEffect(() => {
    setTerm(q ?? "");
  }, [q]);

  const categories = useQuery(categoriesQuery());
  const activeCategory = categories.data?.find((c) => c.slug === categoria) ?? null;
  const products = useQuery(
    productsQuery({ search: q ? sanitizeSearchQuery(q) : undefined, categoryId: activeCategory?.id ?? null }),
  );

  function applySearch(value: string) {
    if (value.trim() && !checkAndNotifyRateLimit("search")) {
      return;
    }
    const clean = sanitizeSearchQuery(value);
    navigate({
      search: (prev: CatalogSearch) => {
        const next: Record<string, string> = {};
        if (prev.categoria) next["categoria"] = prev.categoria;
        if (clean) next["q"] = clean;
        return next as any;
      },
    });
  }

  function handleClearSearch() {
    setTerm("");
    navigate({
      search: (prev: CatalogSearch) => {
        const next: Record<string, string> = {};
        if (prev.categoria) next["categoria"] = prev.categoria;
        return next as any;
      },
    });
  }

  return (
    <AppShell>
      <h1 className="mb-6 text-[34px] font-bold tracking-tight text-foreground">
        {t("catalog_title")}
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
          placeholder={t("search_sweets")}
          className="h-14 rounded-full bg-surface-2/60 border-none pl-12 pr-10 text-[15px] font-medium text-foreground placeholder:text-muted-foreground focus-visible:ring-2 focus-visible:ring-primary/50"
        />
        {term.trim() && (
          <button
            type="button"
            onClick={handleClearSearch}
            className="absolute right-4 top-1/2 size-6 -translate-y-1/2 flex items-center justify-center rounded-full bg-surface-2 hover:bg-surface text-muted-foreground hover:text-foreground cursor-pointer"
            aria-label="Limpiar búsqueda"
          >
            <X className="size-3.5" />
          </button>
        )}
      </form>

      <div className="mb-8 flex gap-3 overflow-x-auto pb-2 scrollbar-hide">
        <button
          onClick={() =>
            navigate({
              search: (prev: CatalogSearch) => {
                const next: Record<string, string> = {};
                if (prev.q) next["q"] = prev.q;
                return next as any;
              },
            })
          }
          className={cn(
            "shrink-0 rounded-full px-5 py-2.5 text-[14px] font-semibold transition-all active:scale-95 cursor-pointer select-none touch-manipulation",
            !categoria ? "bg-primary text-primary-foreground shadow-sm" : "bg-surface-2/60 text-foreground hover:bg-surface-2"
          )}
        >
          {t("all")}
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

          const catName = translateCategoryName(c.name, lang);

          return (
            <button
              key={c.id}
              onClick={() => {
                // Al hacer clic en una pestaña de categoría, si la búsqueda era el nombre de esa categoría, la limpiamos para mostrar todo
                const isCatSearch = q && (
                  c.name.toLowerCase().includes(q.toLowerCase()) || 
                  c.slug.toLowerCase().includes(q.toLowerCase()) ||
                  q.toLowerCase().includes("edible") ||
                  q.toLowerCase().includes("comestible")
                );
                
                if (isCatSearch) {
                  setTerm("");
                }

                navigate({ 
                  search: (prev: CatalogSearch) => {
                    const next: Record<string, string> = { categoria: c.slug };
                    if (prev.q && !isCatSearch) {
                      next["q"] = prev.q;
                    }
                    return next as any;
                  } 
                });
              }}
              className={cn(
                "shrink-0 rounded-full px-5 py-2.5 text-[14px] font-semibold transition-all active:scale-95 cursor-pointer select-none touch-manipulation",
                categoria === c.slug
                  ? activeColor
                  : "bg-surface-2/60 text-foreground hover:bg-surface-2"
              )}
            >
              {catName}
            </button>
          );
        })}
      </div>

      <div className="mb-8">
        {products.isLoading && !products.data ? (
          <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
            {[0, 1, 2, 3, 4, 5].map((i) => (
              <ProductCardSkeleton key={i} />
            ))}
          </div>
        ) : products.error && !products.data ? (
          <div className="rounded-3xl bg-surface-2/40 p-8 text-center">
            <p className="text-sm text-muted-foreground">{t("error_loading_products")}</p>
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
            title={t("no_results")}
            description={t("no_results_desc")}
          />
        )}
      </div>
    </AppShell>
  );
}
