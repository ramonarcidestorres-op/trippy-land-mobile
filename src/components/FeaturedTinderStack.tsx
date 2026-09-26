import { useState, useRef, useEffect, useMemo } from "react";
import { Link, useNavigate } from "@tanstack/react-router";
import { Heart, ShoppingCart, ChevronLeft, ChevronRight } from "lucide-react";
import { toast } from "sonner";
import { useCart } from "@/hooks/useCart";
import { useReferral } from "@/hooks/useReferral";
import { useProductModal } from "@/hooks/useProductModal";
import { formatPrice } from "@/lib/format";
import { type Product } from "@/lib/queries";
import { cn } from "@/lib/utils";

interface MatteCardTheme {
  bg: string;
  textColor: string;
  favBtn: string;
}

const MATTE_PALETTE: MatteCardTheme[] = [
  { bg: "bg-[#9EAB91]", textColor: "text-neutral-950", favBtn: "bg-black/10 text-neutral-950 hover:bg-black/15 border-black/10" }, // Verde mate (Weed / Pre-roll)
  { bg: "bg-[#E58A8A]", textColor: "text-neutral-950", favBtn: "bg-black/10 text-neutral-950 hover:bg-black/15 border-black/10" }, // Rojo/Rosa suave mate (Sintéticos / Gomitas)
  { bg: "bg-[#A7C7E7]", textColor: "text-neutral-950", favBtn: "bg-black/10 text-neutral-950 hover:bg-black/15 border-black/10" }, // Azul claro mate (Farmacia)
  { bg: "bg-[#E59866]", textColor: "text-neutral-950", favBtn: "bg-black/10 text-neutral-950 hover:bg-black/15 border-black/10" }, // Naranja mate
  { bg: "bg-[#BDB2FF]", textColor: "text-neutral-950", favBtn: "bg-black/10 text-neutral-950 hover:bg-black/15 border-black/10" }, // Lavanda mate
  { bg: "bg-[#EAE8E1]", textColor: "text-neutral-950", favBtn: "bg-black/10 text-neutral-950 hover:bg-black/15 border-black/10" }, // Crema mate (Coca)
];

function getMatteCardTheme(product: Product, index: number): MatteCardTheme {
  const name = (product.name || "").toLowerCase();
  const catName = ((product as any).categories?.name || "").toLowerCase();

  if (catName.includes("pre-roll") || catName.includes("weed") || name.includes("flor") || name.includes("indoor") || name.includes("passion")) {
    return MATTE_PALETTE[0]; // Verde mate
  }
  if (catName.includes("sint") || name.includes("gom") || name.includes("dulce") || name.includes("straw") || name.includes("fresa") || name.includes("candy")) {
    return MATTE_PALETTE[1]; // Rojo/Rosa mate
  }
  if (catName.includes("farma") || name.includes("farma") || name.includes("syrup") || name.includes("jarabe")) {
    return MATTE_PALETTE[2]; // Azul mate
  }
  if (name.includes("orange") || name.includes("vape") || name.includes("extract")) {
    return MATTE_PALETTE[3]; // Naranja mate
  }
  if (catName.includes("psychedelics") || name.includes("hongo") || name.includes("shroom")) {
    return MATTE_PALETTE[4]; // Lavanda mate
  }
  if (catName.includes("coca") || name.includes("coca") || name.includes("white")) {
    return MATTE_PALETTE[5]; // Crema mate
  }

  return MATTE_PALETTE[index % MATTE_PALETTE.length];
}

interface FeaturedTinderStackProps {
  products: Product[];
}

export function FeaturedTinderStack({ products }: FeaturedTinderStackProps) {
  const navigate = useNavigate();
  const { addToCart } = useCart();
  const { openProduct } = useProductModal();
  const { getAdjustedPrice } = useReferral();
  const [currentIndex, setCurrentIndex] = useState(0);
  const [favorites, setFavorites] = useState<string[]>([]);

  // Dragging state for top card
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [isAnimatingOut, setIsAnimatingOut] = useState<"left" | "right" | null>(null);

  const startPosRef = useRef({ x: 0, y: 0, time: 0 });
  const lastPosRef = useRef({ x: 0, y: 0, time: 0 });
  const velocityRef = useRef(0);

  // Intent-locking refs to prevent accidental drag during page scroll
  const isIntentDeterminedRef = useRef(false);
  const isSwipingCardRef = useRef(false);

  // Sync favorites
  useEffect(() => {
    try {
      const favs = JSON.parse(localStorage.getItem("tls_favorites") || "[]");
      setFavorites(favs);
    } catch {
      // ignore
    }
  }, []);

  const toggleFavorite = (productId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      const favs = JSON.parse(localStorage.getItem("tls_favorites") || "[]");
      let nextFavs: string[];
      if (favs.includes(productId)) {
        nextFavs = favs.filter((id: string) => id !== productId);
        toast.info("Eliminado de favoritos");
      } else {
        nextFavs = [...favs, productId];
        toast.success("❤️ Guardado en favoritos");
      }
      setFavorites(nextFavs);
      localStorage.setItem("tls_favorites", JSON.stringify(nextFavs));
    } catch {
      // ignore
    }
  };

  const handleAddToCart = (product: Product, e: React.MouseEvent) => {
    e.stopPropagation();
    if (product.is_available === false) {
      toast.error("Producto agotado");
      return;
    }
    addToCart(product, 1);
    toast.success(`✓ "${product.name}" agregado al carrito`);
  };

  const total = products.length;
  if (total === 0) return null;

  const handleSwipe = (direction: "left" | "right") => {
    if (isAnimatingOut) return;
    setIsAnimatingOut(direction);
    setTimeout(() => {
      setCurrentIndex((prev) => (prev + 1) % total);
      setDragOffset({ x: 0, y: 0 });
      setIsAnimatingOut(null);
    }, 280);
  };

  const handlePrev = () => {
    if (isAnimatingOut) return;
    setCurrentIndex((prev) => (prev - 1 + total) % total);
    setDragOffset({ x: 0, y: 0 });
  };

  // Robust touch gesture handlers with scroll lock
  const handleTouchStart = (e: React.TouchEvent) => {
    if (isAnimatingOut) return;
    const touch = e.touches[0];
    startPosRef.current = { x: touch.clientX, y: touch.clientY, time: Date.now() };
    lastPosRef.current = { x: touch.clientX, y: touch.clientY, time: Date.now() };
    velocityRef.current = 0;
    isIntentDeterminedRef.current = false;
    isSwipingCardRef.current = false;
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (isAnimatingOut) return;
    const touch = e.touches[0];
    const dx = touch.clientX - startPosRef.current.x;
    const dy = touch.clientY - startPosRef.current.y;
    const absDx = Math.abs(dx);
    const absDy = Math.abs(dy);

    // Si aún no hemos determinado si el usuario quiere deslizar la carta o hacer scroll vertical
    if (!isIntentDeterminedRef.current) {
      // Si el desplazamiento vertical es mayor, es scroll de la página: NO mover la carta
      if (absDy > 8 && absDy >= absDx) {
        isIntentDeterminedRef.current = true;
        isSwipingCardRef.current = false;
        return;
      }
      // Si el desplazamiento horizontal es claro y supera 16px, es swipe de carta
      if (absDx > 16 && absDx > absDy * 1.3) {
        isIntentDeterminedRef.current = true;
        isSwipingCardRef.current = true;
        setIsDragging(true);
      }
    }

    if (!isSwipingCardRef.current) return;

    const now = Date.now();
    const dt = Math.max(1, now - lastPosRef.current.time);
    const moveX = touch.clientX - lastPosRef.current.x;
    velocityRef.current = moveX / dt;

    lastPosRef.current = { x: touch.clientX, y: touch.clientY, time: now };
    setDragOffset({ x: dx, y: dy * 0.25 });
  };

  const handleTouchEnd = () => {
    if (isAnimatingOut) return;

    if (isSwipingCardRef.current) {
      const threshold = 95;
      const velocity = velocityRef.current;

      if (dragOffset.x > threshold || (dragOffset.x > 45 && velocity > 0.45)) {
        handleSwipe("right");
      } else if (dragOffset.x < -threshold || (dragOffset.x < -45 && velocity < -0.45)) {
        handleSwipe("left");
      } else {
        setDragOffset({ x: 0, y: 0 });
      }
    } else {
      setDragOffset({ x: 0, y: 0 });
    }

    setIsDragging(false);
    isIntentDeterminedRef.current = false;
    isSwipingCardRef.current = false;
  };

  // Visible stack items (up to 3 cards)
  const visibleCards = useMemo(() => {
    const cards = [];
    for (let i = 0; i < Math.min(3, total); i++) {
      const idx = (currentIndex + i) % total;
      cards.push({ product: products[idx], stackIndex: i, productIndex: idx });
    }
    return cards;
  }, [currentIndex, products, total]);

  return (
    <div className="relative w-full select-none">
      {/* Contenedor principal de la pila de cartas */}
      <div 
        className="relative w-full h-[395px] sm:h-[420px] flex items-center justify-center touch-pan-y"
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
      >
        {visibleCards.map(({ product, stackIndex, productIndex }) => {
          const isTop = stackIndex === 0;
          const theme = getMatteCardTheme(product, productIndex);
          const isFav = favorites.includes(product.id);
          const price = getAdjustedPrice(product.price);
          const available = product.is_available !== false;

          const fallbackImg = product.name.toLowerCase().includes("gom")
            ? "https://images.unsplash.com/photo-1582058091505-f87a2e55a40f?w=600&q=80"
            : product.name.toLowerCase().includes("choco")
            ? "https://images.unsplash.com/photo-1606312619070-d48b4c652a52?w=600&q=80"
            : "https://images.unsplash.com/photo-1550258987-190a2d41a8ba?w=600&q=80";

          const img = product.image_url || fallbackImg;

          // Cálculo de transformaciones para el efecto Tinder 3D Stack
          let transformStyle = "";
          let opacity = 1;
          let zIndex = 30 - stackIndex * 10;

          if (isTop) {
            if (isAnimatingOut === "right") {
              transformStyle = "translate3d(120%, 20px, 0) rotate(22deg)";
              opacity = 0;
            } else if (isAnimatingOut === "left") {
              transformStyle = "translate3d(-120%, 20px, 0) rotate(-22deg)";
              opacity = 0;
            } else if (isDragging) {
              const rotation = dragOffset.x * 0.08;
              transformStyle = `translate3d(${dragOffset.x}px, ${dragOffset.y}px, 0) rotate(${rotation}deg)`;
            } else {
              transformStyle = "translate3d(0, 0, 0) scale(1) rotate(0deg)";
            }
          } else if (stackIndex === 1) {
            const dragProgress = Math.min(1, Math.abs(dragOffset.x) / 120);
            const scale = 0.94 + dragProgress * 0.06;
            const translateY = 12 - dragProgress * 12;
            const rot = 2 - dragProgress * 2;
            transformStyle = `translate3d(0, ${translateY}px, 0) scale(${scale}) rotate(${rot}deg)`;
            opacity = 0.95 + dragProgress * 0.05;
          } else {
            const dragProgress = Math.min(1, Math.abs(dragOffset.x) / 120);
            const scale = 0.88 + dragProgress * 0.06;
            const translateY = 24 - dragProgress * 12;
            const rot = -2 + dragProgress * 2;
            transformStyle = `translate3d(0, ${translateY}px, 0) scale(${scale}) rotate(${rot}deg)`;
            opacity = 0.85 + dragProgress * 0.15;
          }

          return (
            <div
              key={`${product.id}-${stackIndex}`}
              style={{
                zIndex,
                transform: transformStyle,
                opacity,
                transition: isDragging && isTop ? "none" : "transform 0.3s cubic-bezier(0.2, 0.9, 0.3, 1), opacity 0.28s ease",
              }}
              onClick={() => {
                if (!isDragging && Math.abs(dragOffset.x) < 5) {
                  openProduct(product);
                }
              }}
              className={cn(
                "absolute inset-x-0 mx-auto w-full max-w-[340px] sm:max-w-[360px] h-[380px] sm:h-[400px] rounded-[34px] p-6 flex flex-col justify-between shadow-[0_12px_32px_rgba(0,0,0,0.35)] cursor-pointer overflow-hidden border border-black/5",
                theme.bg
              )}
            >
              {/* SECCIÓN SUPERIOR: NOMBRE DEL PRODUCTO + BOTÓN FAVORITO */}
              <div className="relative z-10 flex items-start justify-between gap-3">
                <h3 className={cn("text-2xl sm:text-[28px] font-black tracking-tight leading-tight line-clamp-2", theme.textColor)}>
                  {product.name}
                </h3>

                <button
                  type="button"
                  onClick={(e) => toggleFavorite(product.id, e)}
                  className={cn(
                    "flex size-11 shrink-0 items-center justify-center rounded-full border transition-transform active:scale-90 shadow-sm cursor-pointer",
                    theme.favBtn
                  )}
                  aria-label="Favorito"
                >
                  <Heart className={cn("size-5", isFav && "fill-current text-red-500")} />
                </button>
              </div>

              {/* SECCIÓN CENTRAL: IMAGEN FLOTANTE DEL PRODUCTO */}
              <div className="relative z-10 flex-1 flex items-center justify-center py-2 min-h-0 pointer-events-none">
                <div className="relative size-44 sm:size-48 flex items-center justify-center">
                  <img
                    src={img}
                    alt={product.name}
                    className="max-h-full max-w-full object-contain filter drop-shadow-[0_12px_22px_rgba(0,0,0,0.22)]"
                  />
                  {!available && (
                    <div className="absolute inset-0 grid place-items-center rounded-3xl bg-black/85 text-[11px] font-black uppercase tracking-widest text-red-400 border border-red-500/30 backdrop-blur-sm">
                      Agotado
                    </div>
                  )}
                </div>
              </div>

              {/* SECCIÓN INFERIOR: PÍLDORA BLANCA FLOTANTE CON PRECIO Y BOTÓN AGREGAR */}
              <div className="relative z-10">
                <div className="w-full bg-white rounded-full p-1.5 pl-5 pr-1.5 flex items-center justify-between shadow-[0_6px_20px_rgba(0,0,0,0.15)] border border-neutral-200/50">
                  {/* Precio */}
                  <span className="text-xl sm:text-[22px] font-black text-neutral-950 tracking-tight">
                    {formatPrice(price)}
                  </span>

                  {/* Botón Negro Agregar */}
                  <button
                    type="button"
                    disabled={!available}
                    onClick={(e) => handleAddToCart(product, e)}
                    className={cn(
                      "h-10 px-4.5 rounded-full font-bold text-xs flex items-center gap-1.5 transition-transform active:scale-95 shadow-sm cursor-pointer",
                      available
                        ? "bg-black text-white hover:bg-neutral-900"
                        : "bg-neutral-200 text-neutral-400 cursor-not-allowed"
                    )}
                  >
                    <ShoppingCart className="size-3.5" />
                    <span>Agregar</span>
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* CONTROLES INFERIORES: FLECHAS Y PUNTOS INDICADORES DE TARJETA */}
      <div className="mt-4 flex items-center justify-between px-3">
        <button
          type="button"
          onClick={handlePrev}
          className="flex size-9 items-center justify-center rounded-full bg-surface-2/80 hover:bg-surface-2 text-foreground border border-border/40 transition-transform active:scale-90 cursor-pointer"
          aria-label="Anterior"
        >
          <ChevronLeft className="size-5" />
        </button>

        {/* Indicadores de puntos tipo carrusel */}
        <div className="flex items-center gap-1.5">
          {products.slice(0, Math.min(8, total)).map((_, dotIdx) => {
            const isActive = dotIdx === (currentIndex % Math.min(8, total));
            return (
              <span
                key={dotIdx}
                className={cn(
                  "h-1.5 rounded-full transition-all duration-300",
                  isActive ? "w-5 bg-foreground" : "w-1.5 bg-muted-foreground/30"
                )}
              />
            );
          })}
        </div>

        <button
          type="button"
          onClick={() => handleSwipe("right")}
          className="flex size-9 items-center justify-center rounded-full bg-surface-2/80 hover:bg-surface-2 text-foreground border border-border/40 transition-transform active:scale-90 cursor-pointer"
          aria-label="Siguiente"
        >
          <ChevronRight className="size-5" />
        </button>
      </div>
    </div>
  );
}
