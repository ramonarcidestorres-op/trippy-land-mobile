import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useState, useEffect } from "react";
import { 
  ChevronLeft, 
  Heart, 
  ShoppingCart, 
  Minus, 
  Plus, 
  Check, 
  ArrowRight,
  Candy
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

  // Check if product is already in cart
  const cartItem = cart.find((i) => i.product_id === id);
  const isAlreadyInCart = Boolean(cartItem);

  const [qty, setQty] = useState(cartItem ? cartItem.quantity : 1);
  const [isFavorite, setIsFavorite] = useState(false);

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

  const handleClose = () => {
    if (window.history.length > 1) {
      window.history.back();
    } else {
      navigate({ to: "/catalogo" });
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

  if (isLoading) {
    return (
      <div className="fixed inset-0 z-50 flex flex-col justify-end bg-black/30 backdrop-blur-[2px] animate-in fade-in duration-200">
        <div 
          className="flex-1 w-full min-h-[14vh] cursor-pointer" 
          onClick={handleClose} 
          aria-label="Cerrar modal"
        />
        <div className="relative w-full max-w-lg mx-auto bg-[#F4F4F4] rounded-t-[36px] p-5 h-[83vh] flex flex-col justify-between animate-pulse shadow-2xl">
          <div className="flex justify-between items-center pt-2">
            <div className="size-11 rounded-full bg-white/80" />
            <div className="size-11 rounded-full bg-white/80" />
          </div>
          <div className="my-auto size-48 rounded-full bg-white/60 mx-auto" />
          <div className="rounded-t-[32px] bg-white p-6 space-y-4">
            <div className="h-6 w-2/3 bg-neutral-200 rounded-lg" />
            <div className="h-4 w-full bg-neutral-200 rounded-lg" />
            <div className="h-12 w-full bg-neutral-200 rounded-2xl" />
          </div>
        </div>
      </div>
    );
  }

  if (error || !product) {
    return (
      <div className="fixed inset-0 z-50 flex flex-col justify-end bg-black/30 backdrop-blur-[2px]">
        <div 
          className="flex-1 w-full min-h-[14vh] cursor-pointer" 
          onClick={handleClose} 
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
                onClick={handleClose}
                className="mt-4 inline-flex h-11 items-center justify-center rounded-full bg-black px-6 text-sm font-bold text-white shadow-md transition-transform active:scale-95"
              >
                Cerrar
              </button>
            }
          />
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

  return (
    <div className="fixed inset-0 z-50 flex flex-col justify-end bg-black/35 backdrop-blur-[2px] animate-in fade-in duration-300">
      {/* Zona de fondo clickeable para cerrar */}
      <div 
        className="flex-1 w-full min-h-[12vh] cursor-pointer" 
        onClick={handleClose} 
        aria-label="Cerrar modal"
      />

      {/* ============================================================ */}
      {/* TARJETA DE PRODUCTO SEGÚN NUEVA REFERENCIA (FONDO SUAVE + CARD BLANCA) */}
      {/* ============================================================ */}
      <div className="relative w-full max-w-lg mx-auto bg-[#F4F4F4] rounded-t-[36px] shadow-2xl flex flex-col max-h-[85vh] h-[85vh] overflow-hidden animate-in slide-in-from-bottom duration-300 ease-out">
        
        {/* CABECERA SUPERIOR FLOTANTE (BOTÓN ATRÁS Y FAVORITO + CARRITO) */}
        <div className="px-5 pt-4 pb-2 flex items-center justify-between shrink-0 z-10">
          {/* Botón Volver circular blanco */}
          <button
            type="button"
            onClick={handleClose}
            className="flex size-11 items-center justify-center rounded-full bg-white text-neutral-800 shadow-md transition-transform active:scale-90"
            aria-label="Volver"
          >
            <ChevronLeft className="size-6 stroke-[2.5]" />
          </button>

          <div className="flex items-center gap-2.5">
            {/* Botón Favorito circular blanco */}
            <button
              type="button"
              onClick={toggleFavorite}
              className={cn(
                "flex size-11 items-center justify-center rounded-full bg-white shadow-md transition-transform active:scale-90",
                isFavorite ? "text-red-500" : "text-neutral-700 hover:text-black"
              )}
              aria-label="Favorito"
            >
              <Heart className={cn("size-5", isFavorite && "fill-current")} />
            </button>

            {/* Botón Carrito circular blanco con badge */}
            <Link
              to="/carrito"
              className="relative flex size-11 items-center justify-center rounded-full bg-white shadow-md transition-transform active:scale-90 text-neutral-800"
              aria-label="Ver Carrito"
            >
              <ShoppingCart className="size-5" />
              {cartTotalCount > 0 && (
                <span className="absolute -top-1 -right-1 flex size-5 items-center justify-center rounded-full bg-black text-[10px] font-black text-white ring-2 ring-white">
                  {cartTotalCount}
                </span>
              )}
            </Link>
          </div>
        </div>

        {/* ============================================================ */}
        {/* SECCIÓN HERO CENTRAL: IMAGEN DEL PRODUCTO */}
        {/* ============================================================ */}
        <div className="flex-1 flex items-center justify-center p-4 relative min-h-0">
          <div className="relative aspect-square w-full max-w-[240px] drop-shadow-[0_20px_30px_rgba(0,0,0,0.15)] transition-transform duration-500 hover:scale-105">
            <img
              src={img}
              alt={product.name}
              className="size-full object-contain filter drop-shadow-[0_12px_24px_rgba(0,0,0,0.12)]"
            />
            {!available && (
              <div className="absolute inset-0 grid place-items-center rounded-3xl bg-black/75 text-[11px] font-black uppercase tracking-widest text-white backdrop-blur-sm">
                Agotado
              </div>
            )}
          </div>
        </div>

        {/* ============================================================ */}
        {/* CARD INFERIOR EN BLANCO: TÍTULO, DESCRIPCIÓN, PRECIO, SELECTOR Y BOTÓN NEGRO */}
        {/* ============================================================ */}
        <div className="bg-white rounded-t-[36px] p-6 pb-[max(env(safe-area-inset-bottom),24px)] shadow-[0_-10px_30px_rgba(0,0,0,0.06)] space-y-5 shrink-0">
          
          {/* TÍTULO Y DESCRIPCIÓN */}
          <div className="space-y-1.5">
            <h1 className="text-2xl sm:text-[26px] font-black tracking-tight text-neutral-900 leading-tight">
              {product.name}
            </h1>
            <p className="text-[13px] text-neutral-500 font-medium leading-relaxed line-clamp-2">
              {product.description || "Fórmula e ingredientes seleccionados de primera calidad listos para disfrutar."}
            </p>
          </div>

          {/* FILA DE PRECIO Y SELECTOR DE CANTIDAD */}
          <div className="flex items-center justify-between pt-1">
            {/* Precio real */}
            <div>
              <p className="text-2xl sm:text-[28px] font-black tracking-tight text-neutral-900 leading-none">
                {formatPrice(singlePrice)}
              </p>
            </div>

            {/* Selector de Cantidad [-] 1 [+] en píldora gris clara */}
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

          {/* BOTÓN PRINCIPAL EN NEGRO SÓLIDO */}
          <div>
            {isAlreadyInCart ? (
              <Link
                to="/carrito"
                className="w-full h-14 rounded-2xl bg-black text-white font-black text-base flex items-center justify-center gap-2 shadow-xl hover:bg-neutral-900 active:scale-[0.98] transition-all"
              >
                <Check className="size-5 stroke-[3]" />
                <span>Ir al Carrito</span>
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
