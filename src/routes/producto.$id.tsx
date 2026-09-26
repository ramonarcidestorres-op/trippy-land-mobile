import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useState, useEffect } from "react";
import { 
  ChevronLeft, 
  Heart, 
  ShoppingBag, 
  Minus, 
  Plus, 
  Sparkles, 
  Check, 
  ArrowRight,
  Candy,
  Share2
} from "lucide-react";
import { toast } from "sonner";
import { useCart } from "@/hooks/useCart";
import { useReferral } from "@/hooks/useReferral";
import { productQuery } from "@/lib/queries";
import { formatPrice } from "@/lib/format";
import { cn } from "@/lib/utils";
import { EmptyState } from "@/components/States";

export const Route = createFileRoute("/producto/$id")({
  ssr: false,
  head: () => ({
    meta: [
      { title: "Detalle del Producto — Trippy Land Store" },
      { name: "description", content: "Detalle del producto, efectos y compra a domicilio." },
    ],
  }),
  component: ProductDetailPage,
});

export function ProductDetailPage() {
  const { id } = Route.useParams();
  const navigate = useNavigate();
  const { cart, addToCart, setQuantity } = useCart();
  const { getAdjustedPrice } = useReferral();
  
  const { data: product, isLoading, error } = useQuery(productQuery(id));

  // Check if product is already in cart
  const cartItem = cart.find((i) => i.product_id === id);
  const isAlreadyInCart = Boolean(cartItem);

  const [qty, setQty] = useState(cartItem ? cartItem.quantity : 1);
  const [isFavorite, setIsFavorite] = useState(false);
  const [activeDot, setActiveDot] = useState(0);

  // Sync qty if cart updates
  useEffect(() => {
    if (cartItem) {
      setQty(cartItem.quantity);
    }
  }, [cartItem?.quantity]);

  // Load favorite state from localStorage
  useEffect(() => {
    try {
      const favs = JSON.parse(localStorage.getItem("tls_favorites") || "[]");
      setIsFavorite(favs.includes(id));
    } catch {
      // ignore
    }
  }, [id]);

  const toggleFavorite = () => {
    try {
      const favs = JSON.parse(localStorage.getItem("tls_favorites") || "[]");
      let nextFavs: string[];
      if (favs.includes(id)) {
        nextFavs = favs.filter((f: string) => f !== id);
        setIsFavorite(false);
        toast.info("Eliminado de tus favoritos");
      } else {
        nextFavs = [...favs, id];
        setIsFavorite(true);
        toast.success("❤️ Guardado en tus favoritos");
      }
      localStorage.setItem("tls_favorites", JSON.stringify(nextFavs));
    } catch {
      setIsFavorite(!isFavorite);
    }
  };

  const handleQtyMinus = () => {
    if (qty > 1) {
      const next = qty - 1;
      setQty(next);
      if (isAlreadyInCart) {
        setQuantity(id, next);
      }
    }
  };

  const handleQtyPlus = () => {
    const next = qty + 1;
    setQty(next);
    if (isAlreadyInCart) {
      setQuantity(id, next);
    }
  };

  const handleAddToCart = () => {
    if (!product || product.is_available === false) return;
    addToCart(product, qty);
    toast.success(`✓ "${product.name}" agregado al carrito (${qty})`);
  };

  const cartTotalCount = cart.reduce((sum, item) => sum + item.quantity, 0);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background text-foreground flex flex-col justify-between p-4 max-w-lg mx-auto animate-pulse">
        <div className="flex justify-between items-center pt-2">
          <div className="size-10 rounded-full bg-surface-2" />
          <div className="flex gap-2">
            <div className="size-10 rounded-full bg-surface-2" />
            <div className="size-10 rounded-full bg-surface-2" />
          </div>
        </div>
        <div className="my-8 space-y-4">
          <div className="h-8 w-3/4 bg-surface-2 rounded-xl" />
          <div className="h-64 w-full bg-surface-2 rounded-3xl" />
          <div className="h-20 w-full bg-surface-2 rounded-2xl" />
        </div>
        <div className="h-16 w-full bg-surface-2 rounded-full mb-4" />
      </div>
    );
  }

  if (error || !product) {
    return (
      <div className="min-h-screen bg-background text-foreground p-4 flex flex-col justify-center max-w-lg mx-auto">
        <EmptyState
          icon={<Candy className="size-8 text-primary" />}
          title="Producto no disponible"
          description="Este producto no existe o fue retirado del catálogo."
          action={
            <Link
              to="/catalogo"
              className="mt-4 inline-flex h-11 items-center justify-center rounded-full bg-primary px-6 text-sm font-bold text-primary-foreground shadow-md transition-transform active:scale-95"
            >
              Volver al Catálogo
            </Link>
          }
        />
      </div>
    );
  }

  const available = product.is_available !== false;
  const singlePrice = getAdjustedPrice(product.price);
  const totalPrice = singlePrice * qty;

  // Fallback image if none
  const fallbackImg = product.name.toLowerCase().includes("gom") 
    ? "https://images.unsplash.com/photo-1582058091505-f87a2e55a40f?w=600&q=80"
    : product.name.toLowerCase().includes("choco")
    ? "https://images.unsplash.com/photo-1606312619070-d48b4c652a52?w=600&q=80"
    : "https://images.unsplash.com/photo-1550258987-190a2d41a8ba?w=600&q=80";

  const img = product.image_url || fallbackImg;

  // Values for THC, CBD, Weight/Effects
  const thcValue = product.thc_percentage != null ? Number(product.thc_percentage) : 80;
  const cbdValue = product.cbd_percentage != null ? Number(product.cbd_percentage) : 20;
  const weightVal = product.weight_g != null ? Number(product.weight_g) : 3;
  const weightPercent = Math.min(100, Math.max(15, weightVal * 25));

  const categoryName = product.categories?.name || product.strain_type || "Flores";
  const familyName = product.strain_type || (product.name.toLowerCase().includes("indoor") ? "Indoor" : "Premium");

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col justify-between max-w-lg mx-auto relative overflow-x-hidden animate-in slide-in-from-bottom-5 duration-300">
      {/* ============================================================ */}
      {/* CABECERA SUPERIOR (< ATRÁS, FAVORITO, CARRITO) */}
      {/* ============================================================ */}
      <div className="sticky top-0 z-30 bg-background/90 backdrop-blur-xl px-4 pt-[max(env(safe-area-inset-top),14px)] pb-2 flex items-center justify-between">
        <button
          type="button"
          onClick={() => {
            if (window.history.length > 1) {
              window.history.back();
            } else {
              navigate({ to: "/catalogo" });
            }
          }}
          className="flex size-10 items-center justify-center rounded-full bg-surface-2 border border-border/40 text-foreground shadow-sm transition-transform active:scale-90"
          aria-label="Volver"
        >
          <ChevronLeft className="size-6" />
        </button>

        <div className="flex items-center gap-2">
          {/* Botón Favorito */}
          <button
            type="button"
            onClick={toggleFavorite}
            className={cn(
              "flex size-10 items-center justify-center rounded-full border transition-transform active:scale-90 shadow-sm",
              isFavorite
                ? "bg-red-500/20 border-red-500/40 text-red-400"
                : "bg-surface-2 border-border/40 text-muted-foreground hover:text-foreground"
            )}
            aria-label="Favorito"
          >
            <Heart className={cn("size-5", isFavorite && "fill-current")} />
          </button>

          {/* Botón Carrito */}
          <Link
            to="/carrito"
            className="relative flex size-10 items-center justify-center rounded-full bg-surface-2 border border-border/40 text-foreground transition-transform active:scale-90 shadow-sm"
            aria-label="Ver Carrito"
          >
            <ShoppingBag className="size-5 text-foreground" />
            {cartTotalCount > 0 && (
              <span className="absolute -top-1 -right-1 flex size-5 items-center justify-center rounded-full bg-primary text-[10px] font-black text-primary-foreground ring-2 ring-background">
                {cartTotalCount}
              </span>
            )}
          </Link>
        </div>
      </div>

      {/* ============================================================ */}
      {/* CONTENIDO PRINCIPAL DE LA HOJA DE PRODUCTO */}
      {/* ============================================================ */}
      <div className="flex-1 px-4 pt-2 pb-32 space-y-6">
        {/* TÍTULO Y CALIFICACIÓN */}
        <div className="text-right">
          <h1 className="text-[28px] sm:text-[32px] font-black tracking-tight text-white leading-tight">
            {product.name}
          </h1>

          {/* Estrellas blanco crema */}
          <div className="flex justify-end items-center gap-1 mt-1 text-primary text-xs">
            {"★".repeat(5)}
          </div>
        </div>

        {/* METADATOS: TIPO Y FAMILIA */}
        <div className="flex justify-end items-center gap-4 text-right">
          <div className="border-r border-border/30 pr-4">
            <span className="text-[10px] font-extrabold uppercase tracking-wider text-muted-foreground block">
              TIPO
            </span>
            <span className="text-xs font-bold text-foreground block">
              {categoryName}
            </span>
          </div>

          <div>
            <span className="text-[10px] font-extrabold uppercase tracking-wider text-muted-foreground block">
              FAMILIA
            </span>
            <span className="text-xs font-bold text-foreground block">
              {familyName}
            </span>
          </div>
        </div>

        {/* ============================================================ */}
        {/* SECCIÓN HERO (IMAGEN PNG A LA IZQUIERDA, PRECIO Y GRAMOS A LA DERECHA) */}
        {/* ============================================================ */}
        <div className="grid grid-cols-12 gap-3 items-center min-h-[220px]">
          {/* Imagen PNG en perspectiva limpia */}
          <div className="col-span-6 sm:col-span-7 flex items-center justify-center relative">
            <div className="relative aspect-square w-full max-w-[210px] drop-shadow-[0_15px_30px_rgba(0,0,0,0.7)] transition-transform duration-500 hover:scale-105">
              <img
                src={img}
                alt={product.name}
                className="size-full object-contain filter drop-shadow-[0_10px_20px_rgba(0,0,0,0.5)]"
              />
              {!available && (
                <div className="absolute inset-0 grid place-items-center rounded-3xl bg-background/85 text-[11px] font-black uppercase tracking-widest text-red-400 border border-red-500/30 backdrop-blur-sm">
                  Agotado
                </div>
              )}
            </div>
          </div>

          {/* Bloque de Precio y Contenido */}
          <div className="col-span-6 sm:col-span-5 flex flex-col items-end justify-center space-y-4 text-right pl-2">
            <div>
              <span className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider block">
                Precio
              </span>
              <p className="text-[26px] sm:text-[32px] font-black tracking-tight text-white leading-none mt-1">
                {formatPrice(singlePrice)}
              </p>
            </div>

            {/* Badge Contenido / Gramos */}
            <div className="rounded-full bg-surface-2/90 border border-border/50 px-3.5 py-1.5 shadow-inner">
              <span className="text-[10px] font-extrabold uppercase tracking-wider text-muted-foreground mr-1.5">
                CONTENIDO
              </span>
              <span className="text-[12px] font-black text-primary">
                {product.weight_g ? `${product.weight_g} gramos` : "3 gramos"}
              </span>
            </div>
          </div>
        </div>

        {/* ============================================================ */}
        {/* BARRAS DE EFECTOS / NIVELES (THC, CBD, PESO) */}
        {/* ============================================================ */}
        <div className="space-y-3 pt-2">
          {/* THC */}
          <div className="flex items-center gap-4">
            <span className="w-14 text-right text-[11px] font-black tracking-wider text-muted-foreground shrink-0 uppercase">
              THC
            </span>
            <div className="flex-1 h-2 rounded-full bg-surface-2 overflow-hidden border border-border/30">
              <div
                className="h-full rounded-full bg-primary transition-all duration-500 shadow-[0_0_8px_rgba(255,255,255,0.25)]"
                style={{ width: `${Math.min(100, Math.max(10, thcValue))}%` }}
              />
            </div>
          </div>

          {/* CBD */}
          <div className="flex items-center gap-4">
            <span className="w-14 text-right text-[11px] font-black tracking-wider text-muted-foreground shrink-0 uppercase">
              CBD
            </span>
            <div className="flex-1 h-2 rounded-full bg-surface-2 overflow-hidden border border-border/30">
              <div
                className="h-full rounded-full bg-primary transition-all duration-500 shadow-[0_0_8px_rgba(255,255,255,0.25)]"
                style={{ width: `${Math.min(100, Math.max(10, cbdValue))}%` }}
              />
            </div>
          </div>

          {/* PESO / INTENSIDAD */}
          <div className="flex items-center gap-4">
            <span className="w-14 text-right text-[11px] font-black tracking-wider text-muted-foreground shrink-0 uppercase">
              PESO
            </span>
            <div className="flex-1 h-2 rounded-full bg-surface-2 overflow-hidden border border-border/30">
              <div
                className="h-full rounded-full bg-primary transition-all duration-500 shadow-[0_0_8px_rgba(255,255,255,0.25)]"
                style={{ width: `${weightPercent}%` }}
              />
            </div>
          </div>

          {/* Puntos de Paginación visuales estilo app */}
          <div className="flex items-center justify-start gap-1.5 pl-6 pt-2">
            <span
              onClick={() => setActiveDot(0)}
              className={cn(
                "size-2 rounded-full transition-all cursor-pointer",
                activeDot === 0 ? "bg-primary ring-2 ring-primary/30" : "bg-surface-2"
              )}
            />
            <span
              onClick={() => setActiveDot(1)}
              className={cn(
                "size-1.5 rounded-full transition-all cursor-pointer",
                activeDot === 1 ? "bg-primary ring-2 ring-primary/30" : "bg-surface-2"
              )}
            />
            <span
              onClick={() => setActiveDot(2)}
              className={cn(
                "size-1.5 rounded-full transition-all cursor-pointer",
                activeDot === 2 ? "bg-primary ring-2 ring-primary/30" : "bg-surface-2"
              )}
            />
          </div>
        </div>

        {/* ============================================================ */}
        {/* DESCRIPCIÓN Y DETALLES DE EFECTOS */}
        {/* ============================================================ */}
        <div className="pt-2 space-y-2 border-t border-border/20">
          {product.effects && (
            <div className="flex items-center gap-1.5 text-[11px] font-bold text-primary">
              <Sparkles className="size-3.5 shrink-0" />
              <span>{product.effects}</span>
            </div>
          )}

          <p className="text-[13px] leading-relaxed text-muted-foreground">
            {product.description || "Excelente variedad para relajación profunda y creatividad seleccionada especialmente para ti."}
          </p>
        </div>
      </div>

      {/* ============================================================ */}
      {/* BARRA FLOTANTE DE ACCIÓN (SELECTOR DE CANTIDAD Y AGREGAR / IR AL CARRITO) */}
      {/* ============================================================ */}
      <div className="fixed inset-x-0 bottom-0 z-40 mx-auto max-w-lg px-4 pb-[max(env(safe-area-inset-bottom),14px)] pt-3 bg-gradient-to-t from-background via-background/95 to-transparent">
        <div className="flex items-center gap-3">
          {/* Selector de Cantidad: [-] QTY [+] */}
          <div className="flex h-13 items-center justify-between rounded-2xl bg-surface-2 border border-border/50 px-3.5 gap-3 shadow-lg">
            <button
              type="button"
              onClick={handleQtyMinus}
              disabled={!available || qty <= 1}
              className="flex size-7 items-center justify-center rounded-lg bg-surface border border-border/40 text-foreground transition-transform active:scale-90 disabled:opacity-40"
              aria-label="Disminuir cantidad"
            >
              <Minus className="size-3.5" />
            </button>

            <span className="w-5 text-center text-sm font-black text-foreground">
              {qty}
            </span>

            <button
              type="button"
              onClick={handleQtyPlus}
              disabled={!available}
              className="flex size-7 items-center justify-center rounded-lg bg-surface border border-border/40 text-foreground transition-transform active:scale-90 disabled:opacity-40"
              aria-label="Aumentar cantidad"
            >
              <Plus className="size-3.5" />
            </button>
          </div>

          {/* Botón Principal: Agregar al Carrito O Ir al Carrito */}
          {isAlreadyInCart ? (
            <Link
              to="/carrito"
              className="flex-1 h-13 rounded-2xl bg-primary text-primary-foreground font-black text-sm flex items-center justify-center gap-2 shadow-xl transition-all active:scale-[0.98] hover:bg-primary/90"
            >
              <Check className="size-4.5 stroke-[3]" />
              <span>Ir al Carrito</span>
              <ArrowRight className="size-4 ml-1" />
            </Link>
          ) : (
            <button
              type="button"
              disabled={!available}
              onClick={handleAddToCart}
              className={cn(
                "flex-1 h-13 rounded-2xl font-black text-sm flex items-center justify-between px-5 shadow-xl transition-all active:scale-[0.98]",
                available
                  ? "bg-primary text-primary-foreground hover:bg-primary/90"
                  : "bg-surface-2 text-muted-foreground opacity-50 cursor-not-allowed"
              )}
            >
              <span>{available ? "Agregar al Carrito" : "Agotado"}</span>
              {available && (
                <span className="text-xs font-black opacity-90">
                  {formatPrice(totalPrice)}
                </span>
              )}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
