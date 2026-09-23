import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { Candy, Minus, Plus } from "lucide-react";
import { toast } from "sonner";
import { AppShell } from "@/components/AppShell";
import { EmptyState, ErrorState } from "@/components/States";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/hooks/useAuth";
import { addToCart, productQuery } from "@/lib/queries";
import { formatPrice } from "@/lib/format";

export const Route = createFileRoute("/producto/$id")({
  ssr: false,
  head: () => ({
    meta: [
      { title: "Producto — Trippy Land Store" },
      { name: "description", content: "Detalle del producto y compra a domicilio." },
      { property: "og:title", content: "Producto — Trippy Land Store" },
      { property: "og:description", content: "Detalle del producto y compra a domicilio." },
    ],
  }),
  component: ProductPage,
});

function ProductPage() {
  const { id } = Route.useParams();
  const { user } = useAuth();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [qty, setQty] = useState(1);
  const [busy, setBusy] = useState(false);
  const { data, isLoading, error, refetch } = useQuery(productQuery(id));

  if (isLoading) {
    return (
      <AppShell>
        <div className="aspect-square w-full animate-pulse rounded-3xl bg-surface-2" />
        <div className="mt-4 space-y-3">
          <div className="h-6 w-2/3 animate-pulse rounded bg-surface-2" />
          <div className="h-4 w-1/3 animate-pulse rounded bg-surface-2" />
          <div className="h-20 w-full animate-pulse rounded bg-surface-2" />
        </div>
      </AppShell>
    );
  }

  if (error) {
    return (
      <AppShell>
        <ErrorState error={error} onRetry={() => refetch()} />
      </AppShell>
    );
  }

  if (!data) {
    return (
      <AppShell>
        <EmptyState
          icon={<Candy className="size-7" />}
          title="Producto no encontrado"
          description="Puede que ya no esté publicado."
        />
      </AppShell>
    );
  }

  const available = data.is_available !== false;

  async function handleAdd() {
    if (!data || busy) return;
    if (!available) return;
    if (!user) {
      navigate({ to: "/auth", search: { redirect: `/producto/${id}` } });
      return;
    }
    setBusy(true);
    try {
      await addToCart(user.id, data.id, qty);
      await queryClient.invalidateQueries({ queryKey: ["cart"] });
      toast.success("Agregado al carrito");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "No pudimos agregarlo al carrito");
    } finally {
      setBusy(false);
    }
  }

  return (
    <AppShell>
      <div className="relative aspect-square w-full overflow-hidden rounded-3xl border border-border/60 bg-surface-2 md:max-w-md">
        {data.image_url ? (
          <img src={data.image_url} alt={data.name} className="size-full object-cover" />
        ) : (
          <div className="grid size-full place-items-center text-muted-foreground">
            <Candy className="size-10" />
          </div>
        )}
      </div>

      <div className="mt-5 space-y-3">
        {data.categories?.name && (
          <Badge variant="secondary" className="bg-surface-2">
            {data.categories.name}
          </Badge>
        )}
        <h1 className="text-2xl font-bold leading-tight">{data.name}</h1>
        <p className="text-xl font-semibold candy-text">{formatPrice(data.price)}</p>
        <p className={available ? "text-sm text-success" : "text-sm text-destructive"}>
          {available ? "Disponible" : "Agotado por ahora"}
        </p>
        {data.description && (
          <p className="text-sm leading-relaxed text-muted-foreground">{data.description}</p>
        )}

        <dl className="grid grid-cols-3 gap-2 text-center text-xs">
          {data.weight_g != null && (
            <Detail label="Peso" value={`${Number(data.weight_g)} g`} />
          )}
          {data.thc_percentage != null && (
            <Detail label="THC" value={`${Number(data.thc_percentage)}%`} />
          )}
          {data.cbd_percentage != null && (
            <Detail label="CBD" value={`${Number(data.cbd_percentage)}%`} />
          )}
        </dl>
      </div>

      <div className="mt-6 flex items-center gap-3">
        <div className="flex items-center gap-1 rounded-full border border-border bg-surface p-1">
          <Button
            size="icon"
            variant="ghost"
            className="size-9 rounded-full"
            onClick={() => setQty((q) => Math.max(1, q - 1))}
            aria-label="Quitar una unidad"
          >
            <Minus className="size-4" />
          </Button>
          <span className="w-8 text-center text-sm font-semibold">{qty}</span>
          <Button
            size="icon"
            variant="ghost"
            className="size-9 rounded-full"
            onClick={() => setQty((q) => q + 1)}
            aria-label="Agregar una unidad"
          >
            <Plus className="size-4" />
          </Button>
        </div>
        <Button
          className="h-12 flex-1 candy-gradient text-base font-semibold text-primary-foreground"
          disabled={!available || busy}
          onClick={handleAdd}
        >
          {available ? (busy ? "Agregando…" : "Agregar al carrito") : "No disponible"}
        </Button>
      </div>
    </AppShell>
  );
}

function Detail({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border border-border/60 bg-surface px-2 py-3">
      <dt className="text-muted-foreground">{label}</dt>
      <dd className="mt-0.5 font-semibold">{value}</dd>
    </div>
  );
}
