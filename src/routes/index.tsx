import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { Candy, Search, ChevronDown } from "lucide-react";
import { AppShell } from "@/components/AppShell";
import { ProductCard, ProductCardSkeleton } from "@/components/ProductCard";
import { EmptyState } from "@/components/States";
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
    ],
  }),
  component: HomePage,
});

function HomePage() {
  const [search, setSearch] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const categories = useQuery(categoriesQuery());
  const products = useQuery(productsQuery({ categoryId: selectedCategory }));

  return (
    <AppShell>
      {/* Saludo y banner */}
      <div className="mb-8">
        <h1 className="mb-6 text-[34px] font-bold tracking-tight text-foreground">
          Trippy Land
        </h1>
        {/* Aquí irá el banner que el usuario proveerá */}
        <div className="w-full h-[120px] rounded-3xl bg-surface-2/60 flex items-center justify-center text-muted-foreground border border-border/50 border-dashed">
          Espacio para el Banner
        </div>
      </div>

      {/* Buscador minimalista HIG */}
      <div className="relative mb-8 shadow-sm">
        <Search className="absolute left-4 top-1/2 size-5 -translate-y-1/2 text-muted-foreground" />
        <Input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="¿Qué vas a pedir hoy?"
          className="h-14 rounded-full bg-surface-2/60 border-none pl-12 pr-12 text-[15px] font-medium text-foreground placeholder:text-muted-foreground focus-visible:ring-2 focus-visible:ring-primary/50"
        />
        {search.trim() && (
          <Link
            to="/catalogo"
            search={{ q: search.trim() }}
            className="absolute right-2 top-1/2 -translate-y-1/2 flex h-10 items-center justify-center rounded-full bg-primary px-4 text-xs font-bold text-primary-foreground transition-transform active:scale-95"
          >
            Buscar
          </Link>
        )}
      </div>

      {/* Categorías Visuales inspiradas en la referencia */}
      <section className="mb-10">
        {categories.isLoading ? (
          <div className="flex gap-4 overflow-x-auto pb-4 scrollbar-hide">
            {[0, 1, 2, 3].map((i) => (
              <div key={i} className="h-[140px] w-[95px] shrink-0 animate-pulse rounded-[32px] bg-surface-2/60" />
            ))}
          </div>
        ) : categories.error ? (
          <div className="rounded-3xl bg-surface-2/40 p-6 text-center">
            <p className="text-sm text-muted-foreground">Error al cargar categorías</p>
          </div>
        ) : categories.data?.length ? (
          <div className="flex gap-4 overflow-x-auto pb-4 scrollbar-hide snap-x snap-mandatory">
            {categories.data.map((c, index) => {
              const s = c.slug?.toLowerCase() || "";
              const n = c.name?.toLowerCase() || "";
              
              let imgUrl = c.icon_url || "https://images.unsplash.com/photo-1550258987-190a2d41a8ba?w=400&q=80";
              
              let activeColor = "bg-primary text-primary-foreground";
              if (n.includes("coca")) {
                activeColor = "bg-[#F5F5F0] text-black"; // Blanco/Crema
                if (!c.icon_url) imgUrl = "/categorias/Coca.png";
              } else if (n.includes("pre-roll") || n.includes("pre roll")) {
                activeColor = "bg-[#9EAB91] text-black"; // Verde mate
                if (!c.icon_url) imgUrl = "/categorias/Pre-Rolls.png";
              } else if (n.includes("weed")) {
                activeColor = "bg-[#9EAB91] text-black"; // Verde mate
                if (!c.icon_url) imgUrl = "/categorias/Weed.png";
              } else if (n.includes("farma")) {
                activeColor = "bg-[#A7C7E7] text-black"; // Azul claro
                if (!c.icon_url) imgUrl = "/categorias/farmacia.png";
              } else if (n.includes("sint")) {
                activeColor = "bg-[#FF3B30] text-black"; // Rojo HIG
                if (!c.icon_url) imgUrl = "/categorias/sintéticos.png";
              } else {
                if (!c.icon_url) imgUrl = `/categorias/${c.name}.png`;
              }

              const isActive = selectedCategory === c.id;
              const colorClasses = isActive ? activeColor : "bg-surface-2/60 text-foreground";

              return (
                <button
                  key={c.id}
                  onClick={() => setSelectedCategory(isActive ? null : c.id)}
                  className={`group relative flex w-[95px] shrink-0 snap-center flex-col items-center justify-between overflow-hidden rounded-[32px] p-2 transition-transform active:scale-95 ${colorClasses}`}
                  style={{ minHeight: "140px" }}
                >
                  <div className="relative mt-1 aspect-square w-[75px] overflow-hidden rounded-full bg-transparent">
                    <img src={imgUrl} alt={c.name} className="size-full object-cover transition-transform group-hover:scale-110" />
                  </div>
                  <div className="mb-3 mt-3 text-center">
                    <p className={`text-[12px] font-bold leading-tight ${isActive ? "" : "text-foreground"}`}>
                      {c.name}
                    </p>
                  </div>
                </button>
              );
            })}
          </div>
        ) : null}
      </section>

      {/* Populares */}
      <section className="mb-8">
        <div className="mb-5 flex items-center justify-between">
          <div className="flex items-center gap-1.5 cursor-pointer">
            <h2 className="text-[22px] font-bold tracking-tight text-foreground">
              Destacados
            </h2>
            <ChevronDown className="size-5 text-muted-foreground" />
          </div>
          <Link 
            to="/catalogo" 
            search={selectedCategory ? { categoria: categories.data?.find(c => c.id === selectedCategory)?.slug } : {}} 
            className="text-sm text-primary font-semibold transition-opacity active:opacity-70"
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
          <div className="rounded-3xl bg-surface-2/40 p-8 text-center">
            <p className="text-sm text-muted-foreground">No se pudieron cargar los productos.</p>
          </div>
        ) : products.data?.length ? (
          <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
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
