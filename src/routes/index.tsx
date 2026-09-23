import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { Candy, Search, Sparkles } from "lucide-react";
import { AppShell } from "@/components/AppShell";
import { ProductCard, ProductCardSkeleton } from "@/components/ProductCard";
import { EmptyState, ErrorState } from "@/components/States";
import { Input } from "@/components/ui/input";
import { categoriesQuery, productsQuery } from "@/lib/queries";

export const Route = createFileRoute("/")({
  ssr: false,
  head: () => ({
    meta: [
      { title: "Trippy Land Store — Dulces a domicilio" },
      {
        name: "description",
        content: "Pide dulces a domicilio en minutos. Catálogo, carrito y pago en efectivo.",
      },
      { property: "og:title", content: "Trippy Land Store — Dulces a domicilio" },
      {
        property: "og:description",
        content: "Pide dulces a domicilio en minutos. Catálogo, carrito y pago en efectivo.",
      },
    ],
  }),
  component: HomePage,
});

function HomePage() {
  const [search, setSearch] = useState("");
  const categories = useQuery(categoriesQuery());
  const products = useQuery(productsQuery());

  return (
    <AppShell>
      <section className="relative overflow-hidden rounded-3xl border border-border/60 bg-card p-5">
        <div className="pointer-events-none absolute -right-10 -top-10 size-40 rounded-full candy-gradient opacity-25 blur-2xl" />
        <p className="inline-flex items-center gap-1.5 rounded-full bg-surface-2 px-3 py-1 text-[11px] text-candy-lime">
          <Sparkles className="size-3" /> Entrega a domicilio · Pago en efectivo
        </p>
        <h1 className="mt-3 text-2xl font-bold leading-tight">
          Dulces que <span className="candy-text">viajan</span> hasta tu puerta
        </h1>
        <div className="relative mt-4">
          <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Buscar dulces…"
            className="h-11 rounded-full bg-surface-2 pl-9"
          />
        </div>
        {search.trim() && (
          <Link
            to="/catalogo"
            search={{ q: search.trim() }}
            className="mt-3 inline-block text-xs text-primary underline underline-offset-4"
          >
            Ver resultados para “{search.trim()}” en el catálogo
          </Link>
        )}
      </section>

      <section className="mt-7">
        <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-muted-foreground">
          Categorías
        </h2>
        {categories.isLoading ? (
          <div className="flex gap-2">
            {[0, 1, 2].map((i) => (
              <div key={i} className="h-9 w-24 animate-pulse rounded-full bg-surface-2" />
            ))}
          </div>
        ) : categories.error ? (
          <ErrorState error={categories.error} onRetry={() => categories.refetch()} />
        ) : categories.data?.length ? (
          <div className="flex flex-wrap gap-2">
            {categories.data.map((c) => (
              <Link
                key={c.id}
                to="/catalogo"
                search={{ categoria: c.slug }}
                className="rounded-full border border-border bg-surface px-4 py-2 text-sm transition-colors hover:border-primary hover:text-primary"
              >
                {c.name}
              </Link>
            ))}
          </div>
        ) : (
          <p className="text-sm text-muted-foreground">
            Aún no hay categorías cargadas en el sistema.
          </p>
        )}
      </section>

      <section className="mt-7">
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
            Destacados
          </h2>
          <Link to="/catalogo" className="text-xs text-primary">
            Ver todo
          </Link>
        </div>
        {products.isLoading ? (
          <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
            {[0, 1, 2, 3].map((i) => (
              <ProductCardSkeleton key={i} />
            ))}
          </div>
        ) : products.error ? (
          <ErrorState error={products.error} onRetry={() => products.refetch()} />
        ) : products.data?.length ? (
          <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
            {products.data.slice(0, 8).map((p) => (
              <ProductCard key={p.id} product={p} />
            ))}
          </div>
        ) : (
          <EmptyState
            icon={<Candy className="size-7" />}
            title="Todavía no hay productos"
            description="Cuando el equipo publique productos en el panel, aparecerán aquí al instante."
          />
        )}
      </section>
    </AppShell>
  );
}
