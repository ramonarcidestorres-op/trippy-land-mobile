import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { Candy, Search, ChevronDown } from "lucide-react";
import { AppShell } from "@/components/AppShell";
import { AddressManager } from "@/components/AddressManager";
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
      <div className="mb-6">
        <AddressManager />
      </div>

      {/* Search Bar */}
      <div className="relative mb-8">
        <Search className="absolute left-4 top-1/2 size-5 -translate-y-1/2 text-muted-foreground" />
        <Input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search..."
          className="h-14 rounded-2xl bg-[#1a1a1a] border-none pl-12 text-base text-foreground placeholder:text-muted-foreground focus-visible:ring-1 focus-visible:ring-primary/50"
        />
        {search.trim() && (
          <Link
            to="/catalogo"
            search={{ q: search.trim() }}
            className="absolute right-4 top-1/2 -translate-y-1/2 text-xs text-primary font-medium"
          >
            Go
          </Link>
        )}
      </div>

      {/* Categories */}
      <section className="mb-8">
        {categories.isLoading ? (
          <div className="flex gap-4 overflow-x-auto pb-4 hide-scrollbar">
            {[0, 1, 2, 3].map((i) => (
              <div key={i} className="h-[120px] w-[90px] shrink-0 animate-pulse rounded-[24px] bg-[#1a1a1a]" />
            ))}
          </div>
        ) : categories.error ? (
          <div className="flex items-center justify-center p-4">
            <p className="text-sm text-muted-foreground">Las categorías no están disponibles en este momento.</p>
          </div>
        ) : categories.data?.length ? (
          <div className="flex gap-4 overflow-x-auto pb-4 hide-scrollbar snap-x snap-mandatory">
            {categories.data.map((c, index) => {
              // Get an image from Supabase icon_url or use fallback
              let imgUrl = c.icon_url || "https://images.unsplash.com/photo-1550258987-190a2d41a8ba?w=400&q=80";
              const s = c.slug?.toLowerCase() || "";
              
              if (!c.icon_url) {
                if (s.includes("gomi")) imgUrl = "https://images.unsplash.com/photo-1582058091505-f87a2e55a40f?w=400&q=80";
                else if (s.includes("choco")) imgUrl = "https://images.unsplash.com/photo-1606312619070-d48b4c652a52?w=400&q=80";
                else if (s.includes("snack") || s.includes("sal")) imgUrl = "https://images.unsplash.com/photo-1599490659213-e2b9527bd087?w=400&q=80";
                else if (s.includes("dulce")) imgUrl = "https://images.unsplash.com/photo-1575224300306-1b8da36134ec?w=400&q=80";
              }

              // Matte white active state instead of green
              const isActive = index === 1; // Just simulating an active state for visual demo since Home doesn't actually have a selected category state by default

              return (
                <Link
                  key={c.id}
                  to="/catalogo"
                  search={{ categoria: c.slug }}
                  className={`group relative flex w-[90px] shrink-0 snap-center flex-col items-center justify-between overflow-hidden rounded-[32px] p-2 transition-all duration-300 ${
                    isActive ? "bg-[#e5e5e5] text-black" : "bg-[#1a1a1a] text-white"
                  }`}
                  style={{ minHeight: "130px" }}
                >
                  <div className="relative aspect-square w-full overflow-hidden rounded-full bg-surface-2 shadow-sm">
                    <img src={imgUrl} alt={c.name} className="size-full object-cover" />
                  </div>
                  <div className="mb-2 mt-3 text-center">
                    <p className={`text-[13px] font-bold leading-tight ${isActive ? "text-black" : "text-white"}`}>
                      {c.name}
                    </p>
                    <p className={`text-[10px] ${isActive ? "text-black/60" : "text-white/50"}`}>
                      Dulces
                    </p>
                  </div>
                </Link>
              );
            })}
          </div>
        ) : (
          <p className="text-sm text-muted-foreground">
            Aún no hay categorías cargadas en el sistema.
          </p>
        )}
      </section>

      <section className="mb-8">
        <div className="mb-4 flex items-center justify-between">
          <div className="flex items-center gap-1 cursor-pointer">
            <h2 className="text-xl font-medium text-foreground">
              Popular Dishes
            </h2>
            <ChevronDown className="size-5 text-muted-foreground mt-0.5" />
          </div>
          <Link to="/catalogo" search={{}} className="text-xs text-primary font-medium">
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
          <div className="flex items-center justify-center p-8">
            <p className="text-sm text-muted-foreground">No se pudieron cargar los productos.</p>
          </div>
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
