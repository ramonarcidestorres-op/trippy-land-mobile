import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useState, useEffect, useRef } from "react";
import { 
  ChevronLeft, 
  Heart, 
  ShoppingCart, 
  Minus, 
  Plus, 
  Check, 
  ArrowRight,
  Candy,
  Sparkles
} from "lucide-react";
import { toast } from "sonner";
import { useCart } from "@/hooks/useCart";
import { useReferral } from "@/hooks/useReferral";
import { productQuery, productsQuery } from "@/lib/queries";
import { formatPrice } from "@/lib/format";
import { cn } from "@/lib/utils";
import { EmptyState } from "@/components/States";
import { AppShell } from "@/components/AppShell";
import { ProductCard } from "@/components/ProductCard";

export const Route = createFileRoute("/producto/$id")({
  ssr: false,
  head: () => ({
    meta: [
      { title: "Detalle del Producto — Trippy Land Store" },
      { name: "description", content: "Detalle del producto y compra a domicilio." },
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
  const { data: bgProducts = [] } = useQuery(productsQuery());

  // Check if product is already in cart
  const cartItem = cart.find((i) => i.product_id === id);
  const isAlreadyInCart = Boolean(cartItem);

  const [qty, setQty] = useState(cartItem ? cartItem.quantity : 1);
  const [isFavorite, setIsFavorite] = useState(false);

  // Swipe-down to close state & physics
  const [isClosing, setIsClosing] = useState(false);
  const [backdropOpacity, setBackdropOpacity] = useState(1);
  const sheetRef = useRef<HTMLDivElement>(null);
  const startYRef = useRef(0);
  const lastYRef = useRef(0);
  const lastTimeRef = useRef(0);
  const velocityRef = useRef(0);
  const isDraggingRef = useRef(false);
  const currentDragYRef = useRef(0);

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

  const handleClose = (instant = false) => {
    if (isClosing) return;
    if (instant) {
      if (window.history.length > 1) {
        window.history.back();
      } else {
        navigate({ to: "/catalogo" });
      }
      return;
    }

    setIsClosing(true);
    setBackdropOpacity(0);
    if (sheetRef.current) {
      sheetRef.current.style.transition = "transform 0.28s cubic-bezier(0.32, 0.72, 0, 1), opacity 0.25s ease-out";
      sheetRef.current.style.transform = "translate3d(0, 100%, 0)";
      sheetRef.current.style.opacity = "0.7";
    }

    setTimeout(() => {
      if (window.history.length > 1) {
        window.history.back();
      } else {
        navigate({ to: "/catalogo" });
      }
    }, 260);
  };

  const handleTouchStart = (e: React.TouchEvent) => {
    if (isClosing) return;
    const touch = e.touches[0];
    startYRef.current = touch.clientY;
    lastYRef.current = touch.clientY;
    lastTimeRef.current = Date.now();
    velocityRef.current = 0;
    isDraggingRef.current = true;
    currentDragYRef.current = 0;

    if (sheetRef.current) {
      sheetRef.current.style.transition = "none";
    }
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (!isDraggingRef.current || isClosing) return;
    const touch = e.touches[0];
    const currentY = touch.clientY;
    const now = Date.now();
    const dt = Math.max(1, now - lastTimeRef.current);
    const dy = currentY - lastYRef.current;
    
    velocityRef.current = dy / dt;
    lastYRef.current = currentY;
    lastTimeRef.current = now;

    const deltaY = currentY - startYRef.current;

    let appliedY = 0;
    if (deltaY > 0) {
      // Desplazamiento natural hacia abajo
      appliedY = deltaY;
      const progress = Math.min(1, deltaY / 350);
      setBackdropOpacity(Math.max(0.2, 1 - progress * 0.8));
    } else {
      // Resistencia elástica al arrastrar hacia arriba
      appliedY = -Math.pow(Math.abs(deltaY), 0.72) * 1.2;
    }

    currentDragYRef.current = appliedY;

    if (sheetRef.current) {
      sheetRef.current.style.transform = `translate3d(0, ${appliedY}px, 0)`;
    }
  };

  const handleTouchEnd = () => {
    if (!isDraggingRef.current || isClosing) return;
    isDraggingRef.current = false;

    const finalY = currentDragYRef.current;
    const velocity = velocityRef.current;

    // Condición de cierre: arrastre suficiente o flick rápido
    if (finalY > 75 || (finalY > 25 && velocity > 0.35)) {
      handleClose();
    } else {
      // Retorno elástico suave a la posición inicial
      setBackdropOpacity(1);
      currentDragYRef.current = 0;
      if (sheetRef.current) {
        sheetRef.current.style.transition = "transform 0.32s cubic-bezier(0.2, 0.9, 0.3, 1)";
        sheetRef.current.style.transform = "translate3d(0, 0, 0)";
      }
    }
  };

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

  // Background store representation
  const renderBackgroundStore = () => (
    <div className="pointer-events-none select-none scale-[0.99] origin-top transition-all">
      <AppShell>
        <div className="space-y-6 pt-2 pb-24">
          <div className="mb-2">
            <h1 className="mb-4 text-[34px] font-bold tracking-tight text-foreground">
              Catálogo
            </h1>
          </div>
          <div className="grid grid-cols-2 gap-3">
            {bgProducts.length > 0 ? (
              bgProducts.slice(0, 6).map((p) => (
                <ProductCard key={p.id} product={p} />
              ))
            ) : (
              <>
                <div className="h-48 rounded-2xl bg-surface-2 animate-pulse" />
                <div className="h-48 rounded-2xl bg-surface-2 animate-pulse" />
                <div className="h-48 rounded-2xl bg-surface-2 animate-pulse" />
                <div className="h-48 rounded-2xl bg-surface-2 animate-pulse" />
              </>
            )}
          </div>
        </div>
      </AppShell>
    </div>
  );

  if (isLoading) {
    return (
      <div className="relative min-h-screen bg-background overflow-hidden">
        {renderBackgroundStore()}
        <div className="fixed inset-0 z-50 flex flex-col justify-end bg-black/35 backdrop-blur-[2px] animate-in fade-in duration-200">
          <div 
            className="flex-1 w-full min-h-[14vh] cursor-pointer" 
            onClick={() => handleClose(true)} 
            aria-label="Cerrar modal"
          />
          <div className="relative w-full max-w-lg mx-auto bg-black/45 backdrop-blur-2xl rounded-t-[36px] p-5 h-[86vh] flex flex-col justify-between animate-pulse shadow-2xl border-t border-x border-white/15">
            <div className="flex justify-between items-center pt-2">
              <div className="size-11 rounded-full bg-white/10" />
              <div className="size-11 rounded-full bg-white/10" />
            </div>
            <div className="my-auto size-48 rounded-full bg-white/5 mx-auto" />
            <div className="rounded-t-[32px] bg-white p-6 space-y-4">
              <div className="h-6 w-2/3 bg-neutral-200 rounded-lg" />
              <div className="h-4 w-full bg-neutral-200 rounded-lg" />
              <div className="h-12 w-full bg-neutral-900 rounded-2xl" />
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error || !product) {
    return (
      <div className="relative min-h-screen bg-background overflow-hidden">
        {renderBackgroundStore()}
        <div className="fixed inset-0 z-50 flex flex-col justify-end bg-black/35 backdrop-blur-[2px]">
          <div 
            className="flex-1 w-full min-h-[14vh] cursor-pointer" 
            onClick={() => handleClose(true)} 
            aria-label="Cerrar modal"
          />
          <div className="relative w-full max-w-lg mx-auto bg-white rounded-t-[36px] p-6 h-[50vh] shadow-2xl">
            <EmptyState
              icon={<Candy className="size-8 text-black" />}
              title="Producto no disponible"
              description="Este producto no existe o fue retirado del catálogo."
              action={
                <button
                  type="button"
                  onClick={() => handleClose(true)}
                  className="mt-4 inline-flex h-11 items-center justify-center rounded-full bg-black px-6 text-sm font-bold text-white shadow-md transition-transform active:scale-95"
                >
                  Cerrar
                </button>
              }
            />
          </div>
        </div>
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

  // Has specs/effects to show
  const hasSpecs = Boolean(
    product.strain_type || 
    product.weight_g || 
    product.thc_percentage != null || 
    product.cbd_percentage != null || 
    product.effects
  );

  return (
    <div className="relative min-h-screen bg-background overflow-hidden">
      {/* VISTA DE LA TIENDA DE FONDO (Permite ver el catálogo y header real arriba del sheet) */}
      {renderBackgroundStore()}

      {/* MODAL BOTTOM SHEET OVERLAY */}
      <div 
        className="fixed inset-0 z-50 flex flex-col justify-end bg-black/35 backdrop-blur-[2px] transition-opacity duration-200"
        style={{ opacity: backdropOpacity }}
      >
        {/* Zona de fondo clickeable para cerrar */}
        <div 
          className="flex-1 w-full min-h-[10vh] cursor-pointer" 
          onClick={() => handleClose(false)} 
          aria-label="Cerrar modal"
        />

        {/* ============================================================ */}
        {/* TARJETA DE PRODUCTO: HERO TRANSLÚCIDO GLASS + CARD INFERIOR BLANCA */}
        {/* GESTO DE DESLIZAR HACIA ABAJO PARA CERRAR */}
        {/* ============================================================ */}
        <div 
          ref={sheetRef}
          className="relative w-full max-w-lg mx-auto bg-black/45 backdrop-blur-2xl rounded-t-[36px] shadow-2xl flex flex-col max-h-[88vh] h-[88vh] overflow-hidden animate-in slide-in-from-bottom duration-300 ease-out border-t border-x border-white/15 select-none touch-none"
        >
          {/* SECCIÓN SUPERIOR DE ARRASTRE (HANDLE + CABECERA + HERO) */}
          <div
            className="flex flex-col flex-1 touch-none cursor-grab active:cursor-grabbing"
            onTouchStart={handleTouchStart}
            onTouchMove={handleTouchMove}
            onTouchEnd={handleTouchEnd}
          >
            {/* BARRA SUPERIOR DE ARRASTRE (SWIPE HANDLE) */}
            <div className="pt-2.5 pb-1 flex justify-center shrink-0">
              <div className="w-12 h-1.5 rounded-full bg-white/30 hover:bg-white/50 transition-colors" />
            </div>

            {/* CABECERA SUPERIOR FLOTANTE (BOTÓN ATRÁS Y FAVORITO + CARRITO) */}
            <div className="px-5 pt-2 pb-2 flex items-center justify-between shrink-0 z-20">
              {/* Botón Volver circular */}
              <button
                type="button"
                onClick={() => handleClose(false)}
                onTouchStart={(e) => e.stopPropagation()}
                onTouchEnd={(e) => e.stopPropagation()}
                className="flex size-11 items-center justify-center rounded-full bg-white/10 backdrop-blur-md border border-white/15 text-white shadow-lg transition-transform active:scale-90 hover:bg-white/20"
                aria-label="Volver"
              >
                <ChevronLeft className="size-6 stroke-[2.5]" />
              </button>

              <div 
                className="flex items-center gap-2.5"
                onTouchStart={(e) => e.stopPropagation()}
                onTouchEnd={(e) => e.stopPropagation()}
              >
                {/* Botón Favorito */}
                <button
                  type="button"
                  onClick={toggleFavorite}
                  className={cn(
                    "flex size-11 items-center justify-center rounded-full bg-white/10 backdrop-blur-md border border-white/15 shadow-lg transition-transform active:scale-90 hover:bg-white/20",
                    isFavorite ? "text-red-400 border-red-500/30 bg-red-500/20" : "text-white/80 hover:text-white"
                  )}
                  aria-label="Favorito"
                >
                  <Heart className={cn("size-5", isFavorite && "fill-current")} />
                </button>

                {/* Botón Carrito con badge */}
                <Link
                  to="/carrito"
                  className="relative flex size-11 items-center justify-center rounded-full bg-white/10 backdrop-blur-md border border-white/15 shadow-lg transition-transform active:scale-90 text-white hover:bg-white/20"
                  aria-label="Ver Carrito"
                >
                  <ShoppingCart className="size-5" />
                  {cartTotalCount > 0 && (
                    <span className="absolute -top-1 -right-1 flex size-5 items-center justify-center rounded-full bg-white text-[10px] font-black text-black ring-2 ring-black">
                      {cartTotalCount}
                    </span>
                  )}
                </Link>
              </div>
            </div>

            {/* SECCIÓN HERO CENTRAL: IMAGEN CON ILUMINACIÓN / HALO SUAVE DETRÁS */}
            <div className="flex-1 flex items-center justify-center p-4 relative min-h-0">
              {/* Iluminación / Halo suave radial detrás del producto */}
              <div className="absolute size-52 sm:size-64 rounded-full bg-[radial-gradient(circle,rgba(255,255,255,0.22)_0%,rgba(255,255,255,0.06)_45%,transparent_70%)] blur-xl pointer-events-none" />

              {/* Imagen PNG del producto */}
              <div className="relative aspect-square w-full max-w-[240px] drop-shadow-[0_25px_40px_rgba(0,0,0,0.85)] transition-transform duration-500 hover:scale-105 z-10 pointer-events-none">
                <img
                  src={img}
                  alt={product.name}
                  className="size-full object-contain filter drop-shadow-[0_15px_30px_rgba(0,0,0,0.7)]"
                />
                {!available && (
                  <div className="absolute inset-0 grid place-items-center rounded-3xl bg-black/85 text-[11px] font-black uppercase tracking-widest text-red-400 border border-red-500/30 backdrop-blur-sm">
                    Agotado
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* ============================================================ */}
          {/* CARD INFERIOR EN BLANCO: TÍTULO, ESPECIFICACIONES, PRECIO Y BOTÓN */}
          {/* ============================================================ */}
          <div className="bg-white rounded-t-[36px] p-6 pb-[max(env(safe-area-inset-bottom),22px)] shadow-[0_-15px_35px_rgba(0,0,0,0.3)] space-y-4 shrink-0 overflow-y-auto max-h-[50vh] overscroll-contain">
          
          {/* TÍTULO Y DESCRIPCIÓN */}
          <div className="space-y-1">
            <h1 className="text-2xl sm:text-[26px] font-black tracking-tight text-neutral-900 leading-tight">
              {product.name}
            </h1>
            <p className="text-[13px] text-neutral-500 font-medium leading-relaxed">
              {product.description || "Fórmula e ingredientes seleccionados de primera calidad listos para disfrutar."}
            </p>
          </div>

          {/* ESPECIFICACIONES ADAPTATIVAS (SI EL PRODUCTO LAS TIENE) */}
          {hasSpecs && (
            <div className="space-y-2 pt-1 border-t border-neutral-100">
              {/* Badges de Tipo, Gramos y THC/CBD */}
              <div className="flex flex-wrap items-center gap-1.5">
                {product.strain_type && (
                  <span className="inline-flex items-center px-2.5 py-1 rounded-full text-[11px] font-bold bg-neutral-100 text-neutral-800 border border-neutral-200/60">
                    {product.strain_type}
                  </span>
                )}
                {product.weight_g != null && (
                  <span className="inline-flex items-center px-2.5 py-1 rounded-full text-[11px] font-bold bg-neutral-100 text-neutral-800 border border-neutral-200/60">
                    ⚖️ {product.weight_g} gramos
                  </span>
                )}
                {product.thc_percentage != null && (
                  <span className="inline-flex items-center px-2.5 py-1 rounded-full text-[11px] font-bold bg-neutral-100 text-neutral-800 border border-neutral-200/60">
                    THC: {product.thc_percentage}%
                  </span>
                )}
                {product.cbd_percentage != null && (
                  <span className="inline-flex items-center px-2.5 py-1 rounded-full text-[11px] font-bold bg-neutral-100 text-neutral-800 border border-neutral-200/60">
                    CBD: {product.cbd_percentage}%
                  </span>
                )}
              </div>

              {/* Efectos Destacados */}
              {product.effects && (
                <div className="flex items-center gap-1.5 text-[12px] font-bold text-neutral-800 bg-neutral-50 px-3 py-1.5 rounded-xl border border-neutral-200/50">
                  <Sparkles className="size-3.5 text-neutral-600 shrink-0" />
                  <span>{product.effects}</span>
                </div>
              )}
            </div>
          )}

          {/* FILA DE PRECIO (SUMA DINÁMICA) Y SELECTOR DE CANTIDAD */}
          <div className="flex items-center justify-between pt-1">
            {/* Precio dinámico según cantidad seleccionada */}
            <div>
              <p className="text-2xl sm:text-[28px] font-black tracking-tight text-neutral-900 leading-none">
                {formatPrice(totalPrice)}
              </p>
              {qty > 1 && (
                <span className="text-[11px] font-semibold text-neutral-400 block mt-1">
                  {formatPrice(singlePrice)} c/u
                </span>
              )}
            </div>

            {/* Selector de Cantidad [-] 1 [+] */}
            <div className="flex items-center rounded-full bg-neutral-100 px-3.5 py-1.5 gap-3.5 border border-neutral-200/80 shadow-sm">
              <button
                type="button"
                onClick={handleQtyMinus}
                disabled={!available || qty <= 1}
                className="flex size-7 items-center justify-center rounded-full text-neutral-700 hover:text-black transition-transform active:scale-90 disabled:opacity-30"
                aria-label="Disminuir cantidad"
              >
                <Minus className="size-4 stroke-[2.5]" />
              </button>

              <span className="w-4 text-center text-sm font-black text-neutral-900">
                {qty}
              </span>

              <button
                type="button"
                onClick={handleQtyPlus}
                disabled={!available}
                className="flex size-7 items-center justify-center rounded-full text-neutral-700 hover:text-black transition-transform active:scale-90 disabled:opacity-30"
                aria-label="Aumentar cantidad"
              >
                <Plus className="size-4 stroke-[2.5]" />
              </button>
            </div>
          </div>

          {/* BOTÓN PRINCIPAL EN NEGRO SÓLIDO (AGREGAR O IR AL CARRITO) */}
          <div>
            {isAlreadyInCart ? (
              <Link
                to="/carrito"
                className="w-full h-14 rounded-2xl bg-black text-white font-black text-base flex items-center justify-center gap-2 shadow-xl hover:bg-neutral-900 active:scale-[0.98] transition-all"
              >
                <Check className="size-5 stroke-[3]" />
                <span>Ir al Carrito • {formatPrice(totalPrice)}</span>
                <ArrowRight className="size-4 ml-1" />
              </Link>
            ) : (
              <button
                type="button"
                disabled={!available}
                onClick={handleAddToCart}
                className={cn(
                  "w-full h-14 rounded-2xl font-black text-base flex items-center justify-center gap-2 shadow-xl transition-all active:scale-[0.98]",
                  available
                    ? "bg-black text-white hover:bg-neutral-900"
                    : "bg-neutral-200 text-neutral-400 cursor-not-allowed"
                )}
              >
                {available ? (
                  <span>Agregar al Carrito • {formatPrice(totalPrice)}</span>
                ) : (
                  <span>Agotado</span>
                )}
              </button>
            )}
          </div>
        </div>

      </div>
    </div>
  );
}
