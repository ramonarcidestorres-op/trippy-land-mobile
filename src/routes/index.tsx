import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { Candy, Search, Sparkles } from "lucide-react";
import { AppShell } from "@/components/AppShell";
import { FeaturedTinderStack } from "@/components/FeaturedTinderStack";
import { EmptyState } from "@/components/States";
import { Input } from "@/components/ui/input";
import { categoriesQuery, productsQuery } from "@/lib/queries";
import { getCategoryImageUrl } from "@/lib/productImages";

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
      {/* Saludo / Título Principal */}
      <div className="mb-5">
        <h1 className="text-[34px] font-bold tracking-tight text-foreground">
          Trippy Land
        </h1>
      </div>

      {/* Buscador minimalista HIG */}
      <div className="relative mb-6 shadow-sm">
        <Search className="absolute left-4 top-1/2 size-5 -translate-y-1/2 text-muted-foreground" />
        <Input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="¿Qué vas a pedir hoy?"
          className="h-14 rounded-full bg-surface-2/70 border border-border/30 pl-12 pr-12 text-[16px] font-medium text-foreground placeholder:text-muted-foreground focus-visible:ring-1 focus-visible:ring-white/30 focus-visible:border-white/40"
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

      {/* Categorías Visuales con Carga Inmediata */}
      <section className="mb-8">
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
            {categories.data.map((c) => {
              const n = (c.name || "").toLowerCase();
              const s = (c.slug || "").toLowerCase();
              
              const imgUrl = getCategoryImageUrl(c);
              
              let activeColor = "bg-primary text-primary-foreground";
              if (n.includes("coca") || s.includes("coca")) {
                activeColor = "bg-[#F5F5F0] text-black";
              } else if (n.includes("pre-roll") || n.includes("joint") || s.includes("pre-roll")) {
                activeColor = "bg-[#9EAB91] text-black";
              } else if (n.includes("weed") || n.includes("cannabis") || s.includes("weed")) {
                activeColor = "bg-[#9EAB91] text-black";
              } else if (n.includes("farm") || n.includes("pharm") || s.includes("farm")) {
                activeColor = "bg-[#A7C7E7] text-black";
              } else if (n.includes("sint") || n.includes("synth") || s.includes("sint")) {
                activeColor = "bg-[#FCA5A5] text-black";
              } else if (n.includes("psych") || n.includes("psic") || s.includes("psych")) {
                activeColor = "bg-[#BDB2FF] text-black";
              } else if (n.includes("extract") || s.includes("extract")) {
                activeColor = "bg-[#E59866] text-black";
              }

              const isActive = selectedCategory === c.id;
              const colorClasses = isActive ? activeColor : "bg-surface-2/60 text-foreground";

              return (
                <button
                  key={c.id}
                  onClick={() => setSelectedCategory(isActive ? null : c.id)}
                  className={`group relative flex w-[95px] shrink-0 snap-center flex-col items-center justify-between overflow-hidden rounded-[32px] p-2 transition-transform active:scale-95 cursor-pointer touch-manipulation ${colorClasses}`}
                  style={{ minHeight: "140px" }}
                >
                  <div className="relative mt-1 aspect-square w-[75px] overflow-hidden rounded-full bg-transparent flex items-center justify-center">
                    <img 
                      src={imgUrl} 
                      alt={c.name} 
                      loading="eager"
                      fetchPriority="high"
                      decoding="async"
                      className="size-full object-cover transition-transform group-hover:scale-110" 
                    />
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

      {/* Sección Destacados: Cartas Tipo Tinder */}
      <section className="mb-8">
        <div className="mb-5 flex items-center justify-between">
          <h2 className="text-[22px] font-black tracking-tight text-foreground">
            Destacados
          </h2>
          <Link 
            to="/catalogo" 
            search={selectedCategory ? { categoria: categories.data?.find(c => c.id === selectedCategory)?.slug } : {}} 
            className="text-xs text-primary font-bold transition-opacity active:opacity-70 ml-auto"
          >
            Ver catálogo completo →
          </Link>
        </div>

        {products.isLoading ? (
          <div className="w-full max-w-[340px] sm:max-w-[360px] mx-auto h-[380px] rounded-[34px] bg-surface-2/60 animate-pulse border border-border/40" />
        ) : products.error ? (
          <div className="rounded-3xl bg-surface-2/40 p-8 text-center">
            <p className="text-sm text-muted-foreground">No se pudieron cargar los productos.</p>
          </div>
        ) : products.data?.length ? (
          <FeaturedTinderStack products={products.data} />
        ) : (
          <EmptyState
            icon={<Candy className="size-7" />}
            title="Todavía no hay productos"
            description="Cuando el equipo publique productos en el panel, aparecerán aquí al instante."
          />
        )}
      </section>

      {/* Banner Tarjeta Trippy Credi */}
      <section className="mb-10 flex justify-center">
        <div className="w-full max-w-[340px] sm:max-w-[360px] aspect-[315/196] rounded-[22px] overflow-hidden shadow-[0_12px_32px_rgba(0,0,0,0.45)] border border-white/10 transition-transform active:scale-[0.98]">
          <img
            src="/credi-card.svg"
            alt="Trippy Land Credi Card"
            className="size-full object-cover select-none pointer-events-none"
            loading="lazy"
          />
        </div>
      </section>
    </AppShell>
  );
}
