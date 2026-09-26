import { useState, useEffect, useRef, useTransition } from "react";
import { Link, useNavigate } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { 
  ChevronLeft, 
  Heart, 
  ShoppingCart, 
  Minus, 
  Plus, 
  Sparkles,
  Candy
} from "lucide-react";
import { toast } from "sonner";
import { useCart } from "@/hooks/useCart";
import { useReferral } from "@/hooks/useReferral";
import { useProductModal } from "@/hooks/useProductModal";
import { productQuery, type Product } from "@/lib/queries";
import { formatPrice } from "@/lib/format";
import { cn } from "@/lib/utils";

export function ProductDetailSheet() {
  const { isOpen, product: initialProduct, productId, closeProduct } = useProductModal();
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const { cart, addToCart, setQuantity } = useCart();
  const { getAdjustedPrice } = useReferral();

  const id = productId || initialProduct?.id || "";

  // Query product data with initial cached fallback
  const { data: product, isLoading } = useQuery({
    ...productQuery(id),
    enabled: Boolean(id) && isOpen,
    initialData: () => {
      if (initialProduct) return initialProduct as (Product & { categories: { name: string; slug: string } | null });
      if (!id) return undefined;
      const allQueries = queryClient.getQueriesData<Product[]>({ queryKey: ["products"] });
      for (const [_, list] of allQueries) {
        if (Array.isArray(list)) {
          const match = list.find((p) => p.id === id);
          if (match) return match as (Product & { categories: { name: string; slug: string } | null });
        }
      }
      return undefined;
    },
  });

  // Check if product is already in cart
  const cartItem = cart.find((i) => i.product_id === id);
  const isAlreadyInCart = Boolean(cartItem);

  const [qty, setQty] = useState(1);
  const [isFavorite, setIsFavorite] = useState(false);

  // Animation & Swipe-down physics states
  const [isRendered, setIsRendered] = useState(false);
  const [isEntering, setIsEntering] = useState(false);
  const [isExiting, setIsExiting] = useState(false);
  const [backdropOpacity, setBackdropOpacity] = useState(0);

  const sheetRef = useRef<HTMLDivElement>(null);
  const startYRef = useRef(0);
  const lastYRef = useRef(0);
  const lastTimeRef = useRef(0);
  const velocityRef = useRef(0);
  const isDraggingRef = useRef(false);
  const currentDragYRef = useRef(0);

  // Synchronize open / close transitions
  useEffect(() => {
    if (isOpen) {
      setIsRendered(true);
      setIsExiting(false);
      // Small tick for CSS transition mount
      const raf = requestAnimationFrame(() => {
        setIsEntering(true);
        setBackdropOpacity(1);
        if (sheetRef.current) {
          sheetRef.current.style.transform = "translate3d(0, 0, 0)";
        }
      });
      return () => cancelAnimationFrame(raf);
    } else {
      if (isRendered && !isExiting) {
        handleDismissAnimation();
      }
    }
  }, [isOpen]);

  // Sync qty with cart
  useEffect(() => {
    if (cartItem) {
      setQty(cartItem.quantity);
    } else {
      setQty(1);
    }
  }, [cartItem?.quantity, id]);

  // Load favorite state
  useEffect(() => {
    if (!id) return;
    try {
      const favs = JSON.parse(localStorage.getItem("tls_favorites") || "[]");
      setIsFavorite(favs.includes(id));
    } catch {
      // ignore
    }
  }, [id]);

  const handleDismissAnimation = (instant = false) => {
    if (isExiting) return;
    if (instant) {
      setIsRendered(false);
      setIsEntering(false);
      closeProduct();
      return;
    }

    setIsExiting(true);
    setBackdropOpacity(0);
    if (sheetRef.current) {
      sheetRef.current.style.transition = "transform 0.28s cubic-bezier(0.32, 0.72, 0, 1), opacity 0.24s ease-out";
      sheetRef.current.style.transform = "translate3d(0, 100%, 0)";
      sheetRef.current.style.opacity = "0.85";
    }

    setTimeout(() => {
      setIsRendered(false);
      setIsEntering(false);
      setIsExiting(false);
      closeProduct();
    }, 280);
  };

  const handleTouchStart = (e: React.TouchEvent) => {
    if (isExiting) return;
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
    if (!isDraggingRef.current || isExiting) return;
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
      appliedY = deltaY;
      const progress = Math.min(1, deltaY / 380);
      setBackdropOpacity(Math.max(0.1, 1 - progress * 0.85));
    } else {
      // Elastic rubber band when dragging up
      appliedY = -Math.pow(Math.abs(deltaY), 0.72) * 1.2;
    }

    currentDragYRef.current = appliedY;

    if (sheetRef.current) {
      sheetRef.current.style.transform = `translate3d(0, ${appliedY}px, 0)`;
    }
  };

  const handleTouchEnd = () => {
    if (!isDraggingRef.current || isExiting) return;
    isDraggingRef.current = false;

    const finalY = currentDragYRef.current;
    const velocity = velocityRef.current;

    if (finalY > 75 || (finalY > 25 && velocity > 0.35)) {
      handleDismissAnimation();
    } else {
      // Smooth spring return
      setBackdropOpacity(1);
      currentDragYRef.current = 0;
      if (sheetRef.current) {
        sheetRef.current.style.transition = "transform 0.32s cubic-bezier(0.2, 0.9, 0.3, 1)";
        sheetRef.current.style.transform = "translate3d(0, 0, 0)";
      }
    }
  };

  const toggleFavorite = () => {
    if (!id) return;
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
    const activeItem = product || initialProduct;
    if (!activeItem || activeItem.is_available === false) return;

    if (isAlreadyInCart) {
      setQuantity(id, qty);
      toast.success(`✓ "${activeItem.name}" actualizado (${qty})`);
    } else {
      addToCart(activeItem, qty);
      toast.success(`✓ "${activeItem.name}" agregado al carrito (${qty})`);
    }

    // Dismiss smoothly with silky slide down
    handleDismissAnimation();
  };

  if (!isRendered && !isOpen) return null;

  const activeProd = product || initialProduct;
  const available = activeProd ? activeProd.is_available !== false : true;
  const singlePrice = activeProd ? getAdjustedPrice(activeProd.price) : 0;
  const totalPrice = singlePrice * qty;

  const fallbackImg = activeProd?.name.toLowerCase().includes("gom")
    ? "https://images.unsplash.com/photo-1582058091505-f87a2e55a40f?w=600&q=80"
    : activeProd?.name.toLowerCase().includes("choco")
    ? "https://images.unsplash.com/photo-1606312619070-d48b4c652a52?w=600&q=80"
    : "https://images.unsplash.com/photo-1550258987-190a2d41a8ba?w=600&q=80";

  const img = activeProd?.image_url || fallbackImg;
  const categoryName = (activeProd as any)?.categories?.name || activeProd?.strain_type || "Premium";

  const hasSpecs = Boolean(
    activeProd?.weight_g || 
    activeProd?.thc_percentage != null || 
    activeProd?.cbd_percentage != null || 
    activeProd?.effects
  );

  const cartTotalCount = cart.reduce((sum, item) => sum + item.quantity, 0);

  return (
    <div 
      className="fixed inset-0 z-50 flex flex-col justify-end bg-black/60 backdrop-blur-sm transition-opacity duration-300"
      style={{ opacity: backdropOpacity, willChange: "opacity" }}
    >
      {/* Clickable backdrop zone */}
      <div 
        className="fixed inset-0 cursor-pointer" 
        onClick={() => handleDismissAnimation()} 
        aria-label="Cerrar modal"
      />

      {/* ============================================================ */}
      {/* BOTTOM SHEET MODAL (OVERLAY DIRECTAMENTE SOBRE HOME/CATALOGO) */}
      {/* ============================================================ */}
      <div 
        ref={sheetRef}
        style={{
          transform: isEntering ? "translate3d(0, 0, 0)" : "translate3d(0, 100%, 0)",
          transition: isDraggingRef.current ? "none" : "transform 0.34s cubic-bezier(0.32, 0.72, 0, 1)",
          willChange: "transform",
        }}
        className="relative z-10 w-full max-w-lg mx-auto bg-white rounded-t-[36px] shadow-[0_-20px_50px_rgba(0,0,0,0.5)] flex flex-col h-[92dvh] max-h-[92dvh] overflow-hidden select-none border-t border-white/20"
      >
        {/* TOP SECTION: DRAG HANDLE + HEADER + PRODUCT HERO */}
        <div
          className="flex flex-col flex-1 touch-none cursor-grab active:cursor-grabbing min-h-0 bg-[#F2F2F5]"
          onTouchStart={handleTouchStart}
          onTouchMove={handleTouchMove}
          onTouchEnd={handleTouchEnd}
        >
          {/* DRAG HANDLE BAR */}
          <div className="pt-2.5 pb-1 flex justify-center shrink-0">
            <div className="w-12 h-1.5 rounded-full bg-neutral-300/80 hover:bg-neutral-400 transition-colors" />
          </div>

          {/* FLOATING HEADER (BACK BUTTON + FAVORITES + CART) */}
          <div className="px-5 pt-2 pb-2 flex items-center justify-between shrink-0 z-20">
            {/* White Circular Back Button */}
            <button
              type="button"
              onClick={() => handleDismissAnimation()}
              onTouchStart={(e) => e.stopPropagation()}
              onTouchEnd={(e) => e.stopPropagation()}
              className="flex size-12 items-center justify-center rounded-full bg-white shadow-md border border-neutral-100 text-neutral-900 transition-transform active:scale-90 hover:bg-neutral-50 cursor-pointer"
              aria-label="Cerrar"
            >
              <ChevronLeft className="size-6 stroke-[2.5]" />
            </button>

            <div 
              className="flex items-center gap-3"
              onTouchStart={(e) => e.stopPropagation()}
              onTouchEnd={(e) => e.stopPropagation()}
            >
              {/* White Circular Favorite Button */}
              <button
                type="button"
                onClick={toggleFavorite}
                className={cn(
                  "flex size-12 items-center justify-center rounded-full bg-white shadow-md border border-neutral-100 transition-transform active:scale-90 hover:bg-neutral-50 cursor-pointer",
                  isFavorite ? "text-red-500" : "text-neutral-900"
                )}
                aria-label="Favorito"
              >
                <Heart className={cn("size-5.5", isFavorite && "fill-current")} />
              </button>

              {/* White Circular Cart Button with Badge */}
              <button
                type="button"
                onClick={() => {
                  handleDismissAnimation(true);
                  navigate({ to: "/carrito" });
                }}
                className="relative flex size-12 items-center justify-center rounded-full bg-white shadow-md border border-neutral-100 transition-transform active:scale-90 text-neutral-900 hover:bg-neutral-50 cursor-pointer"
                aria-label="Ver Carrito"
              >
                <ShoppingCart className="size-5.5" />
                {cartTotalCount > 0 && (
                  <span className="absolute -top-1 -right-1 flex size-5 items-center justify-center rounded-full bg-black text-[10px] font-black text-white ring-2 ring-white">
                    {cartTotalCount}
                  </span>
                )}
              </button>
            </div>
          </div>

          {/* PRODUCT HERO IMAGE WITH SOFT GLOW */}
          <div className="flex-1 flex items-center justify-center p-4 relative min-h-0">
            <div className="absolute size-60 rounded-full bg-[radial-gradient(circle,rgba(255,255,255,0.95)_0%,rgba(235,235,242,0.6)_50%,transparent_75%)] blur-md pointer-events-none" />

            <div className="relative size-56 sm:size-64 flex items-center justify-center z-10 pointer-events-none">
              {activeProd ? (
                <img
                  src={img}
                  alt={activeProd.name}
                  className="max-h-full max-w-full object-contain filter drop-shadow-[0_16px_24px_rgba(0,0,0,0.18)]"
                />
              ) : (
                <Candy className="size-20 text-neutral-400 animate-pulse" />
              )}
              {!available && (
                <div className="absolute inset-0 grid place-items-center rounded-3xl bg-black/85 text-[11px] font-black uppercase tracking-widest text-red-400 border border-red-500/30 backdrop-blur-sm">
                  Agotado
                </div>
              )}
            </div>
          </div>
        </div>

        {/* ============================================================ */}
        {/* WHITE BOTTOM CONTENT (SEAMLESS COVERAGE TO THE SCREEN BOTTOM) */}
        {/* ============================================================ */}
        <div className="bg-white rounded-t-[36px] p-6 pt-5 pb-[max(env(safe-area-inset-bottom),28px)] shadow-[0_-15px_40px_rgba(0,0,0,0.12)] space-y-4 shrink-0 overflow-y-auto max-h-[55dvh]">
          {/* CATEGORY BADGE + TITLE & DESCRIPTION */}
          <div className="space-y-1.5">
            {categoryName && (
              <div>
                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full bg-black text-white text-[10.5px] font-black uppercase tracking-wider shadow-sm">
                  {categoryName}
                </span>
              </div>
            )}
            
            <h1 className="text-2xl sm:text-[28px] font-bold tracking-tight text-neutral-950 leading-tight pt-0.5">
              {activeProd?.name || "Cargando..."}
            </h1>
            
            <p className="text-[13px] sm:text-[14px] text-neutral-500 font-normal leading-relaxed">
              {activeProd?.description || "The ready-to-drink formula offers a smooth, creamy texture in a compact bottle that's easy to carry."}
            </p>
          </div>

          {/* ADAPTIVE SPECS / EFFECTS */}
          {hasSpecs && activeProd && (
            <div className="space-y-2.5 pt-2 border-t border-neutral-100">
              {(activeProd.weight_g != null || activeProd.thc_percentage != null || activeProd.cbd_percentage != null) && (
                <div className="flex flex-wrap items-center gap-1.5">
                  {activeProd.weight_g != null && (
                    <span className="inline-flex items-center px-2.5 py-1 rounded-full text-[11px] font-bold bg-neutral-100 text-neutral-800 border border-neutral-200/60">
                      ⚖️ {activeProd.weight_g} gramos
                    </span>
                  )}
                  {activeProd.thc_percentage != null && (
                    <span className="inline-flex items-center px-2.5 py-1 rounded-full text-[11px] font-bold bg-neutral-100 text-neutral-800 border border-neutral-200/60">
                      THC: {activeProd.thc_percentage}%
                    </span>
                  )}
                  {activeProd.cbd_percentage != null && (
                    <span className="inline-flex items-center px-2.5 py-1 rounded-full text-[11px] font-bold bg-neutral-100 text-neutral-800 border border-neutral-200/60">
                      CBD: {activeProd.cbd_percentage}%
                    </span>
                  )}
                </div>
              )}

              {activeProd.effects && (
                <div className="flex items-start gap-2.5 text-[12px] font-medium text-neutral-700 bg-neutral-50 p-3 rounded-2xl border border-neutral-200/60 leading-relaxed">
                  <Sparkles className="size-4 text-neutral-800 shrink-0 mt-0.5" />
                  <div className="flex-1 min-w-0">
                    <p className="whitespace-pre-line">{activeProd.effects}</p>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* PRICE & QUANTITY SELECTOR */}
          <div className="flex items-center justify-between pt-1">
            <div>
              <span className="text-2xl sm:text-[28px] font-bold tracking-tight text-neutral-950 leading-none">
                {formatPrice(totalPrice)}
              </span>
              {qty > 1 && (
                <span className="text-[11px] font-semibold text-neutral-400 block mt-1">
                  {formatPrice(singlePrice)} c/u
                </span>
              )}
            </div>

            <div className="flex items-center gap-3 sm:gap-4">
              <button
                type="button"
                onClick={handleQtyMinus}
                disabled={!available || qty <= 1}
                className="flex size-10 items-center justify-center text-neutral-800 hover:text-black transition-transform active:scale-80 disabled:opacity-20 cursor-pointer"
                aria-label="Disminuir cantidad"
              >
                <Minus className="size-6 stroke-[2.5]" />
              </button>

              <span className="min-w-6 text-center text-lg sm:text-xl font-bold text-neutral-950">
                {qty}
              </span>

              <button
                type="button"
                onClick={handleQtyPlus}
                disabled={!available}
                className="flex size-10 items-center justify-center text-neutral-800 hover:text-black transition-transform active:scale-80 disabled:opacity-20 cursor-pointer"
                aria-label="Aumentar cantidad"
              >
                <Plus className="size-6 stroke-[2.5]" />
              </button>
            </div>
          </div>

          {/* MAIN ACTION PILL BUTTON */}
          <div className="pt-2">
            <button
              type="button"
              disabled={!available || !activeProd}
              onClick={handleAddToCart}
              className={cn(
                "w-full h-14 rounded-full font-bold text-base flex items-center justify-center gap-2 shadow-xl transition-all active:scale-[0.98] cursor-pointer",
                available && activeProd
                  ? "bg-black text-white hover:bg-neutral-900"
                  : "bg-neutral-200 text-neutral-400 cursor-not-allowed"
              )}
            >
              {available && activeProd ? (
                <span>{isAlreadyInCart ? "Actualizar Carrito" : "Agregar al Carrito"} • {formatPrice(totalPrice)}</span>
              ) : (
                <span>Agotado</span>
              )}
            </button>
          </div>
        </div>

      </div>
    </div>
  );
}
