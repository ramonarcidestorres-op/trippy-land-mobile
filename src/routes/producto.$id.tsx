import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { Candy, Minus, Plus, ChevronLeft } from "lucide-react";
import { toast } from "sonner";
import { AppShell } from "@/components/AppShell";
import { EmptyState } from "@/components/States";
import { useCart } from "@/hooks/useCart";
import { useReferral } from "@/hooks/useReferral";
import { productQuery } from "@/lib/queries";
import { formatPrice } from "@/lib/format";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/producto/$id")({
  ssr: false,
  head: () => ({
    meta: [
      { title: "Producto — Trippy Land Store" },
      { name: "description", content: "Detalle del producto y compra a domicilio." },
    ],
  }),
  component: ProductPage,
});

function ProductPage() {
  const { id } = Route.useParams();
  const { addToCart } = useCart();
  const { getAdjustedPrice } = useReferral();
  const [qty, setQty] = useState(1);
  const [busy, setBusy] = useState(false);
  const { data, isLoading, error } = useQuery(productQuery(id));

  if (isLoading) {
    return (
      <AppShell>
        <div className="-mx-4 -mt-4 mb-6 aspect-square w-[calc(100%+32px)] animate-pulse bg-surface-2/60" />
        <div className="space-y-4 px-2">
          <div className="h-8 w-2/3 animate-pulse rounded-lg bg-surface-2/60" />
          <div className="h-6 w-1/3 animate-pulse rounded-lg bg-surface-2/60" />
          <div className="mt-8 h-24 w-full animate-pulse rounded-2xl bg-surface-2/60" />
        </div>
      </AppShell>
    );
  }

  if (error || !data) {
    return (
      <AppShell>
        <div className="pt-10">
          <EmptyState
            icon={<Candy className="size-7" />}
            title="Producto no disponible"
            description="Puede que ya no esté publicado o hubo un error."
          />
        </div>
      </AppShell>
    );
  }

  const available = data.is_available !== false;

  async function handleAdd() {
    if (!data || busy || !available) return;
    setBusy(true);
    try {
      addToCart(data, qty);
      toast.success("Agregado al carrito");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "No pudimos agregarlo al carrito");
    } finally {
      setBusy(false);
    }
  }

  // Determine fallback image if none provided
  const s = data.name.toLowerCase();
  let imgUrl = data.image_url;
  if (!imgUrl) {
    if (s.includes("gom")) imgUrl = "https://images.unsplash.com/photo-1582058091505-f87a2e55a40f?w=800&q=80";
    else if (s.includes("choco")) imgUrl = "https://images.unsplash.com/photo-1606312619070-d48b4c652a52?w=800&q=80";
    else imgUrl = "https://images.unsplash.com/photo-1550258987-190a2d41a8ba?w=800&q=80";
  }

  return (
    <AppShell>
      {/* Back button overlay */}
      <div className="absolute left-4 top-4 z-40">
        <button
          onClick={() => window.history.back()}
          className="flex size-10 items-center justify-center rounded-full bg-background/50 backdrop-blur-md transition-transform active:scale-90"
        >
          <ChevronLeft className="size-6 text-foreground" />
        </button>
      </div>

      {/* Hero Image (Breaks out of container padding) */}
      <div className="-mx-4 -mt-4 relative mb-6 aspect-square w-[calc(100%+32px)] bg-surface-2 overflow-hidden">
        <img
          src={imgUrl}
          alt={data.name}
          className="size-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-background via-background/20 to-transparent" />
      </div>

      <div className="mb-32">
        <div className="mb-2 flex items-center justify-between">
          {data.categories?.name && (
            <span className="rounded-full bg-primary/15 px-3 py-1 text-xs font-bold uppercase tracking-wider text-primary">
              {data.categories.name}
            </span>
          )}
          <span className={cn("text-xs font-bold uppercase tracking-wider", available ? "text-green-400" : "text-muted-foreground")}>
            {available ? "Disponible" : "Agotado"}
          </span>
        </div>

        <h1 className="mb-2 text-[32px] font-bold leading-tight tracking-tight text-foreground">
          {data.name}
        </h1>
        
        <p className="mb-6 text-[28px] font-bold tracking-tight text-foreground">
          {formatPrice(getAdjustedPrice(data.price))}
        </p>

        {data.description && (
          <p className="mb-8 text-[15px] leading-relaxed text-muted-foreground">
            {data.description}
          </p>
        )}

        {/* Nutritional / Details (If any exist) */}
        {(data.weight_g != null || data.thc_percentage != null || data.cbd_percentage != null) && (
          <div className="grid grid-cols-3 gap-3">
            {data.weight_g != null && <Detail label="Peso" value={`${Number(data.weight_g)}g`} />}
            {data.thc_percentage != null && <Detail label="THC" value={`${Number(data.thc_percentage)}%`} />}
            {data.cbd_percentage != null && <Detail label="CBD" value={`${Number(data.cbd_percentage)}%`} />}
          </div>
        )}
      </div>

      {/* Floating Bottom Action Bar */}
      <div className="fixed inset-x-0 bottom-[80px] z-40 mx-auto max-w-5xl px-4 md:bottom-4 md:px-0">
        <div className="flex h-16 items-center gap-4 rounded-full bg-surface-2/90 p-2 pl-4 pr-2 shadow-2xl ring-1 ring-border/50 backdrop-blur-xl">
          {/* Quantity Selector */}
          <div className="flex items-center gap-3">
            <button
              className="flex size-10 items-center justify-center rounded-full bg-surface transition-transform active:scale-90"
              onClick={() => setQty((q) => Math.max(1, q - 1))}
              disabled={!available}
            >
              <Minus className="size-4" />
            </button>
            <span className="w-4 text-center text-[15px] font-bold">{qty}</span>
            <button
              className="flex size-10 items-center justify-center rounded-full bg-surface transition-transform active:scale-90"
              onClick={() => setQty((q) => q + 1)}
              disabled={!available}
            >
              <Plus className="size-4" />
            </button>
          </div>

          {/* Add to Cart Button */}
          <button
            className="flex h-12 flex-1 items-center justify-between rounded-full bg-primary px-6 transition-transform active:scale-95 disabled:opacity-50 disabled:active:scale-100"
            disabled={!available || busy}
            onClick={handleAdd}
          >
            <span className="text-[15px] font-bold text-primary-foreground">
              {available ? (busy ? "Agregando..." : "Agregar") : "Agotado"}
            </span>
            <span className="text-[15px] font-bold text-primary-foreground opacity-90">
              {formatPrice(getAdjustedPrice(data.price) * qty)}
            </span>
          </button>
        </div>
      </div>
    </AppShell>
  );
}

function Detail({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex flex-col items-center justify-center rounded-[24px] bg-surface-2/60 p-4">
      <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">{label}</span>
      <span className="mt-1 text-lg font-bold text-foreground">{value}</span>
    </div>
  );
}
