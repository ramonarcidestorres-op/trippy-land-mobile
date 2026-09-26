import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery, useQueryClient, useIsFetching } from "@tanstack/react-query";
import { useEffect, useState, useRef } from "react";
import { toast } from "sonner";
import { 
  MapPin, 
  Search, 
  Bike, 
  Store, 
  CheckCircle2, 
  XCircle, 
  Clock, 
  ExternalLink, 
  MessageCircle, 
  Copy, 
  Check, 
  ShoppingBag, 
  TrendingUp, 
  Rocket,
  ShieldCheck,
  Volume2,
  VolumeX,
  RotateCw,
  Navigation,
  User,
  Package,
  Layers,
  Plus,
  Pencil,
  Trash2,
  Power
} from "lucide-react";
import { AppShell } from "@/components/AppShell";
import { PushNotificationButton } from "@/components/PushNotificationButton";
import { AdminNotificationPromptModal } from "@/components/AdminNotificationPromptModal";
import { EmptyState, ErrorState } from "@/components/States";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogFooter,
  DialogDescription
} from "@/components/ui/dialog";
import { useAuth } from "@/hooks/useAuth";
import { useStoreStatus } from "@/hooks/useStoreStatus";
import { allOrdersQuery, categoriesQuery, productsQuery, type AdminOrder, type Product, type Category } from "@/lib/queries";
import { supabase } from "@/integrations/supabase/client";
import { formatDate, formatRelativeTime, formatPrice, formatCompactPrice, STATUS_LABELS, ORDER_STATUSES } from "@/lib/format";
import { playWhatsAppChime } from "@/lib/sound";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/_authenticated/admin/pedidos")({
  head: () => ({
    meta: [{ title: "Panel de Administración — Trippy Land" }],
  }),
  component: AdminPedidosPage,
});

function playChime() {
  playWhatsAppChime();
}

type AdminTab = "pedidos" | "productos" | "categorias";

export function AdminPedidosPage() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const { isOpen, toggleStoreStatus } = useStoreStatus();
  const [activeTab, setActiveTab] = useState<AdminTab>("pedidos");

  // --- PEDIDOS STATE ---
  const isFetching = useIsFetching({ queryKey: ["admin_orders"] });
  const { data: orders, isLoading: ordersLoading, error: ordersError, refetch: refetchOrders } = useQuery(allOrdersQuery());
  const [filter, setFilter] = useState<string>("all");
  const [orderSearch, setOrderSearch] = useState<string>("");
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // --- PRODUCTOS & CATEGORIAS STATE ---
  const { data: categories = [], isLoading: catsLoading } = useQuery(categoriesQuery());
  const { data: products = [], isLoading: prodsLoading } = useQuery(productsQuery());
  const [prodSearch, setProdSearch] = useState<string>("");
  const [prodCatFilter, setProdCatFilter] = useState<string>("all");

  // Product Dialog state
  const [prodDialogOpen, setProdDialogOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [prodName, setProdName] = useState("");
  const [prodCategoryId, setProdCategoryId] = useState("");
  const [prodPrice, setProdPrice] = useState("");
  const [prodDescription, setProdDescription] = useState("");
  const [prodImageUrl, setProdImageUrl] = useState("");
  const [prodIsAvailable, setProdIsAvailable] = useState(true);
  const [prodSaving, setProdSaving] = useState(false);

  // Category Dialog state
  const [catDialogOpen, setCatDialogOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [catName, setCatName] = useState("");
  const [catSlug, setCatSlug] = useState("");
  const [catIconUrl, setCatIconUrl] = useState("");
  const [catSaving, setCatSaving] = useState(false);

  // Preferencia de sonido de campana
  const [soundEnabled, setSoundEnabled] = useState<boolean>(() => {
    try {
      return localStorage.getItem("tls_admin_sound") !== "false";
    } catch {
      return true;
    }
  });

  const soundRef = useRef(soundEnabled);
  soundRef.current = soundEnabled;

  const toggleSound = () => {
    const next = !soundEnabled;
    setSoundEnabled(next);
    try {
      localStorage.setItem("tls_admin_sound", String(next));
    } catch {
      // ignore
    }
    if (next) {
      playChime();
      toast.success("🔔 Sonido activado (timbre de prueba)");
    } else {
      toast.info("Sonido de notificaciones desactivado");
    }
  };

  const testChime = (e: React.MouseEvent) => {
    e.stopPropagation();
    playChime();
    toast.success("🔔 Timbre de prueba reproducido");
  };

  // Asegurar que la suscripción push actual quede registrada con rol de admin
  useEffect(() => {
    if (typeof window === "undefined" || !("serviceWorker" in navigator)) return;
    navigator.serviceWorker.ready.then((reg) => {
      reg.pushManager.getSubscription().then(async (sub) => {
        if (sub) {
          const jsonSub = sub.toJSON();
          if (jsonSub.keys?.p256dh && jsonSub.keys?.auth) {
            await supabase.from("push_subscriptions").upsert(
              {
                endpoint: sub.endpoint,
                p256dh: jsonSub.keys.p256dh,
                auth: jsonSub.keys.auth,
                user_id: user?.id || null,
                role: "admin",
              },
              { onConflict: "endpoint" }
            );
          }
        }
      });
    }).catch(() => {});
  }, [user]);

  // Escucha en tiempo real de nuevos pedidos
  useEffect(() => {
    const channelId = `admin-orders-${Math.random().toString(36).substring(2, 9)}`;
    const channel = supabase
      .channel(channelId)
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "orders" },
        () => {
          queryClient.invalidateQueries({ queryKey: ["admin_orders"] });
          if (soundRef.current) {
            playChime();
          }
          toast.success("🔔 ¡Nuevo pedido recibido!");
        }
      )
      .on(
        "postgres_changes",
        { event: "UPDATE", schema: "public", table: "orders" },
        () => {
          queryClient.invalidateQueries({ queryKey: ["admin_orders"] });
        }
      );

    channel.subscribe();

    return () => {
      try {
        supabase.removeChannel(channel);
      } catch {
        // ignore
      }
    };
  }, [queryClient]);

  if (user?.role !== "admin") {
    return (
      <AppShell>
        <div className="py-12">
          <EmptyState
            icon={<ShieldCheck className="size-8 text-primary" />}
            title="Acceso de Administrador Requerido"
            description="Inicia sesión con una cuenta autorizada de administrador para acceder a este panel."
            action={
              <Link
                to="/auth"
                className="mt-4 inline-flex h-11 items-center justify-center rounded-full bg-primary px-6 text-sm font-bold text-primary-foreground shadow-sm transition-transform active:scale-95"
              >
                Iniciar sesión como Admin
              </Link>
            }
          />
        </div>
      </AppShell>
    );
  }

  const allOrdersList = orders ?? [];

  // Métricas
  const totalSales = allOrdersList
    .filter((o) => o.status !== "cancelled")
    .reduce((sum, o) => sum + Number(o.total || 0), 0);
  
  const activeOrders = allOrdersList.filter(
    (o) => o.status === "pending" || o.status === "accepted" || o.status === "preparing" || o.status === "in_transit" || o.status === "dispatched" || o.status === "arrived"
  ).length;

  const pendingCount = allOrdersList.filter((o) => o.status === "pending").length;

  // Filtrado de pedidos
  const filteredOrders = allOrdersList.filter((order) => {
    if (filter === "pending" && order.status !== "pending") return false;
    if (filter === "accepted" && order.status !== "accepted" && order.status !== "preparing") return false;
    if (filter === "in_transit" && order.status !== "in_transit" && order.status !== "dispatched") return false;
    if (filter === "arrived" && order.status !== "arrived") return false;
    if (filter === "delivered" && order.status !== "delivered") return false;
    if (filter === "cancelled" && order.status !== "cancelled") return false;

    if (orderSearch.trim()) {
      const q = orderSearch.toLowerCase().trim();
      const matchId = order.id.toLowerCase().includes(q);
      const matchAddress = (order.delivery_address || "").toLowerCase().includes(q);
      const matchPhone = (order.whatsapp_contact || "").toLowerCase().includes(q) || (order.profiles?.phone || "").toLowerCase().includes(q);
      const matchCustomer = (order.profiles?.full_name || "").toLowerCase().includes(q);
      const matchItems = order.order_items?.some((i) => (i.products?.name || "").toLowerCase().includes(q));
      if (!matchId && !matchAddress && !matchPhone && !matchCustomer && !matchItems) return false;
    }

    return true;
  });

  // Filtrado de productos
  const filteredProducts = (products ?? []).filter((p) => {
    if (prodCatFilter !== "all" && p.category_id !== prodCatFilter) return false;
    if (prodSearch.trim()) {
      const q = prodSearch.toLowerCase().trim();
      const matchName = p.name.toLowerCase().includes(q);
      const matchDesc = (p.description || "").toLowerCase().includes(q);
      if (!matchName && !matchDesc) return false;
    }
    return true;
  });

  async function updateOrderStatus(orderId: string, newStatus: string, defaultMoto?: string) {
    let motoDetails = defaultMoto;
    let cancelReason: string | null = null;

    if (newStatus === "arrived") {
      const moto = prompt(
        "¿Qué vehículo o moto realiza la entrega?",
        defaultMoto || "NMAX Negra - Placa TLC-42D"
      );
      if (moto === null) return;
      motoDetails = moto || "NMAX Negra";
    }

    if (newStatus === "cancelled") {
      const reason = prompt("Indica el motivo de cancelación:");
      if (reason === null) return;
      cancelReason = reason || "Cancelado por la tienda";
    }

    queryClient.setQueryData(["admin_orders"], (old: AdminOrder[] | undefined) => {
      if (!old) return old;
      return old.map((o) =>
        o.id === orderId
          ? {
              ...o,
              status: newStatus,
              status_details: motoDetails ?? o.status_details,
              cancel_reason: cancelReason ?? o.cancel_reason,
            }
          : o
      );
    });

    const updatePayload: Record<string, unknown> = { status: newStatus };
    if (motoDetails !== undefined) updatePayload.status_details = motoDetails;
    if (cancelReason !== null) updatePayload.cancel_reason = cancelReason;

    const { error: updErr } = await supabase
      .from("orders")
      .update(updatePayload)
      .eq("id", orderId);

    if (updErr) {
      toast.error("Error al actualizar estado: " + updErr.message);
      queryClient.invalidateQueries({ queryKey: ["admin_orders"] });
    } else {
      const label = STATUS_LABELS[newStatus] || newStatus;
      toast.success(`Pedido actualizado a: ${label}`);
      queryClient.invalidateQueries({ queryKey: ["admin_orders"] });
      queryClient.invalidateQueries({ queryKey: ["order", orderId] });
    }
  }

  function copyAddress(address: string, id: string) {
    navigator.clipboard.writeText(address);
    setCopiedId(id);
    toast.success("Dirección copiada");
    setTimeout(() => setCopiedId(null), 2000);
  }

  function getMapsUrl(address: string): string {
    const coordsMatch = address.match(/\(([-0-9.]+),\s*([-0-9.]+)\)/);
    if (coordsMatch) {
      return `https://www.google.com/maps/search/?api=1&query=${coordsMatch[1]},${coordsMatch[2]}`;
    }
    return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(address + ", Medellín")}`;
  }

  function getWhatsAppUrl(phone: string, orderId: string): string {
    const clean = phone.replace(/\D/g, "");
    const waNumber = clean.startsWith("57") ? clean : `57${clean}`;
    const text = encodeURIComponent(`Hola, te escribimos de Trippy Land sobre tu pedido #${orderId.slice(0, 8).toUpperCase()}`);
    return `https://wa.me/${waNumber}?text=${text}`;
  }

  // --- TOGGLE DISPONIBILIDAD DE PRODUCTO ---
  async function toggleProductAvailability(product: Product) {
    const nextVal = product.is_available === false ? true : false;
    
    // Optimistic update
    queryClient.setQueryData(["products", "", ""], (old: Product[] | undefined) => {
      if (!old) return old;
      return old.map((p) => (p.id === product.id ? { ...p, is_available: nextVal } : p));
    });

    const { error } = await supabase
      .from("products")
      .update({ is_available: nextVal })
      .eq("id", product.id);

    if (error) {
      toast.error("Error al cambiar disponibilidad: " + error.message);
      queryClient.invalidateQueries({ queryKey: ["products"] });
    } else {
      toast.success(
        nextVal
          ? `🟢 "${product.name}" disponible`
          : `🔴 "${product.name}" agotado`
      );
      queryClient.invalidateQueries({ queryKey: ["products"] });
      queryClient.invalidateQueries({ queryKey: ["product", product.id] });
    }
  }

  // --- PRODUCT CRUD ---
  function openCreateProductModal() {
    setEditingProduct(null);
    setProdName("");
    setProdCategoryId(categories[0]?.id || "");
    setProdPrice("");
    setProdDescription("");
    setProdImageUrl("");
    setProdIsAvailable(true);
    setProdDialogOpen(true);
  }

  function openEditProductModal(prod: Product) {
    setEditingProduct(prod);
    setProdName(prod.name);
    setProdCategoryId(prod.category_id || categories[0]?.id || "");
    setProdPrice(String(prod.price || ""));
    setProdDescription(prod.description || "");
    setProdImageUrl(prod.image_url || "");
    setProdIsAvailable(prod.is_available !== false);
    setProdDialogOpen(true);
  }

  async function handleSaveProduct(e: React.FormEvent) {
    e.preventDefault();
    if (!prodName.trim()) {
      toast.error("El nombre del producto es obligatorio");
      return;
    }
    const numPrice = Number(prodPrice);
    if (isNaN(numPrice) || numPrice < 0) {
      toast.error("Ingresa un precio válido");
      return;
    }

    setProdSaving(true);
    try {
      const payload = {
        name: prodName.trim(),
        category_id: prodCategoryId || null,
        price: numPrice,
        description: prodDescription.trim() || null,
        image_url: prodImageUrl.trim() || null,
        is_available: prodIsAvailable,
      };

      if (editingProduct) {
        const { error } = await supabase
          .from("products")
          .update(payload)
          .eq("id", editingProduct.id);
        if (error) throw error;
        toast.success("Producto actualizado");
      } else {
        const { error } = await supabase
          .from("products")
          .insert(payload);
        if (error) throw error;
        toast.success("Producto creado con éxito");
      }

      setProdDialogOpen(false);
      queryClient.invalidateQueries({ queryKey: ["products"] });
    } catch (err: any) {
      toast.error("Error al guardar producto: " + (err.message || "Error inesperado"));
    } finally {
      setProdSaving(false);
    }
  }

  async function handleDeleteProduct(prod: Product) {
    if (!confirm(`¿Estás seguro de eliminar el producto "${prod.name}"?`)) return;

    try {
      const { error } = await supabase
        .from("products")
        .delete()
        .eq("id", prod.id);

      if (error) throw error;
      toast.success("Producto eliminado");
      queryClient.invalidateQueries({ queryKey: ["products"] });
    } catch (err: any) {
      toast.error("No se pudo eliminar: " + (err.message || ""));
    }
  }

  // --- CATEGORY CRUD ---
  function openCreateCategoryModal() {
    setEditingCategory(null);
    setCatName("");
    setCatSlug("");
    setCatIconUrl("");
    setCatDialogOpen(true);
  }

  function openEditCategoryModal(cat: Category) {
    setEditingCategory(cat);
    setCatName(cat.name);
    setCatSlug(cat.slug);
    setCatIconUrl(cat.icon_url || "");
    setCatDialogOpen(true);
  }

  async function handleSaveCategory(e: React.FormEvent) {
    e.preventDefault();
    if (!catName.trim()) {
      toast.error("El nombre de la categoría es obligatorio");
      return;
    }
    const slugVal = catSlug.trim() || catName.trim().toLowerCase().replace(/\s+/g, "-").replace(/[^a-z0-9-]/g, "");

    setCatSaving(true);
    try {
      const payload = {
        name: catName.trim(),
        slug: slugVal,
        icon_url: catIconUrl.trim() || null,
      };

      if (editingCategory) {
        const { error } = await supabase
          .from("categories")
          .update(payload)
          .eq("id", editingCategory.id);
        if (error) throw error;
        toast.success("Categoría actualizada");
      } else {
        const { error } = await supabase
          .from("categories")
          .insert(payload);
        if (error) throw error;
        toast.success("Categoría creada con éxito");
      }

      setCatDialogOpen(false);
      queryClient.invalidateQueries({ queryKey: ["categories"] });
    } catch (err: any) {
      toast.error("Error al guardar categoría: " + (err.message || ""));
    } finally {
      setCatSaving(false);
    }
  }

  async function handleDeleteCategory(cat: Category) {
    const productsInCat = (products ?? []).filter((p) => p.category_id === cat.id).length;
    if (productsInCat > 0) {
      toast.error(`No puedes eliminar esta categoría porque tiene ${productsInCat} productos asignados.`);
      return;
    }
    if (!confirm(`¿Eliminar la categoría "${cat.name}"?`)) return;

    try {
      const { error } = await supabase
        .from("categories")
        .delete()
        .eq("id", cat.id);

      if (error) throw error;
      toast.success("Categoría eliminada");
      queryClient.invalidateQueries({ queryKey: ["categories"] });
    } catch (err: any) {
      toast.error("No se pudo eliminar la categoría: " + (err.message || ""));
    }
  }

  return (
    <AppShell>
      {/* Modal automático para activar avisos de nuevos pedidos y guía iOS */}
      <AdminNotificationPromptModal />

      <div className="space-y-4 pb-24 max-w-full overflow-hidden">
        {/* ============================================================ */}
        {/* INTERRUPTOR PRINCIPAL: ABRIR / CERRAR TIENDA (MOBILE FIRST) */}
        {/* ============================================================ */}
        <div className="rounded-[24px] border border-border/50 bg-surface-2/90 p-4 shadow-lg backdrop-blur-xl">
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-3 min-w-0">
              <div className={cn(
                "size-11 rounded-2xl flex items-center justify-center shrink-0 transition-colors",
                isOpen ? "bg-emerald-500/20 text-emerald-400" : "bg-red-500/20 text-red-400"
              )}>
                <Store className="size-5.5" />
              </div>

              <div className="min-w-0">
                <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground block">
                  Recepción de Pedidos
                </span>
                <div className={cn(
                  "text-[15px] font-black flex items-center gap-1.5 truncate",
                  isOpen ? "text-emerald-400" : "text-red-400"
                )}>
                  <span>{isOpen ? "TIENDA ABIERTA" : "TIENDA CERRADA"}</span>
                  <span className={cn(
                    "size-2 rounded-full shrink-0",
                    isOpen ? "bg-emerald-400 animate-pulse" : "bg-red-400"
                  )} />
                </div>
              </div>
            </div>

            {/* Switch táctil estilizado iOS */}
            <button
              type="button"
              role="switch"
              aria-checked={isOpen}
              onClick={() => toggleStoreStatus()}
              className={cn(
                "relative inline-flex h-8 w-15 shrink-0 cursor-pointer rounded-full p-0.5 transition-colors duration-200 ease-in-out focus:outline-none shadow-inner active:scale-95",
                isOpen ? "bg-emerald-500" : "bg-red-600"
              )}
              title={isOpen ? "Toca para Cerrar la tienda" : "Toca para Abrir la tienda"}
            >
              <span
                className={cn(
                  "pointer-events-none inline-block size-7 transform rounded-full bg-white shadow-md ring-0 transition duration-200 ease-in-out",
                  isOpen ? "translate-x-7" : "translate-x-0"
                )}
              />
            </button>
          </div>

          <p className="mt-2.5 text-[11px] text-muted-foreground border-t border-border/20 pt-2 leading-tight">
            {isOpen 
              ? "🟢 Clientes pueden agregar al carrito y enviar pedidos."
              : "🔴 Tienda en pausa. Clientes ven aviso de cierre y checkout bloqueado."}
          </p>
        </div>

        {/* ============================================================ */}
        {/* CONTROLES RÁPIDOS COMPACTOS (MOBILE FIRST) */}
        {/* ============================================================ */}
        <div className="grid grid-cols-4 gap-2">
          {/* Push notifications */}
          <div className="col-span-2">
            <PushNotificationButton variant="admin" />
          </div>

          {/* Botón de Sonido */}
          <button
            type="button"
            onClick={toggleSound}
            className={cn(
              "flex items-center justify-center gap-1.5 h-10 rounded-2xl px-2 text-xs font-bold border transition-all active:scale-95",
              soundEnabled
                ? "border-primary/40 bg-primary/10 text-primary"
                : "border-border/40 bg-surface-2 text-muted-foreground"
            )}
            title={soundEnabled ? "Sonido activado (clic para silenciar)" : "Silencio (clic para activar sonido)"}
          >
            {soundEnabled ? <Volume2 className="size-4 shrink-0" /> : <VolumeX className="size-4 shrink-0" />}
            <span className="text-[11px]">{soundEnabled ? "Sonido" : "Mute"}</span>
          </button>

          {/* Botón de Refrescar Datos */}
          <button
            type="button"
            onClick={() => {
              refetchOrders();
              queryClient.invalidateQueries({ queryKey: ["products"] });
              queryClient.invalidateQueries({ queryKey: ["categories"] });
              toast.success("Datos actualizados");
            }}
            className="flex items-center justify-center h-10 rounded-2xl border border-border/40 bg-surface-2 text-muted-foreground hover:text-foreground transition-all active:scale-95"
            title="Actualizar datos"
          >
            <RotateCw className={cn("size-4", isFetching > 0 && "animate-spin text-primary")} />
          </button>
        </div>

        {/* ============================================================ */}
        {/* PESTAÑAS PRINCIPALES DEL PANEL (GRID MOBILE FIRST) */}
        {/* ============================================================ */}
        <div className="grid grid-cols-3 gap-1.5 rounded-2xl bg-surface-2/80 p-1 border border-border/40">
          <button
            type="button"
            onClick={() => setActiveTab("pedidos")}
            className={cn(
              "flex items-center justify-center gap-1 h-10 rounded-xl text-xs font-bold transition-all active:scale-95 truncate px-1",
              activeTab === "pedidos"
                ? "bg-primary text-primary-foreground shadow-md"
                : "text-muted-foreground hover:text-foreground"
            )}
          >
            <Package className="size-3.5 shrink-0" />
            <span className="truncate">Pedidos</span>
            {pendingCount > 0 && (
              <span className={cn(
                "size-4 rounded-full flex items-center justify-center text-[10px] font-extrabold shrink-0",
                activeTab === "pedidos" ? "bg-black text-white" : "bg-primary text-primary-foreground"
              )}>
                {pendingCount}
              </span>
            )}
          </button>

          <button
            type="button"
            onClick={() => setActiveTab("productos")}
            className={cn(
              "flex items-center justify-center gap-1 h-10 rounded-xl text-xs font-bold transition-all active:scale-95 truncate px-1",
              activeTab === "productos"
                ? "bg-primary text-primary-foreground shadow-md"
                : "text-muted-foreground hover:text-foreground"
            )}
          >
            <ShoppingBag className="size-3.5 shrink-0" />
            <span className="truncate">Productos</span>
            <span className={cn(
              "text-[10px] font-semibold opacity-75 shrink-0",
              activeTab === "productos" ? "text-white" : "text-muted-foreground"
            )}>
              {products?.length ?? 0}
            </span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab("categorias")}
            className={cn(
              "flex items-center justify-center gap-1 h-10 rounded-xl text-xs font-bold transition-all active:scale-95 truncate px-1",
              activeTab === "categorias"
                ? "bg-primary text-primary-foreground shadow-md"
                : "text-muted-foreground hover:text-foreground"
            )}
          >
            <Layers className="size-3.5 shrink-0" />
            <span className="truncate">Categorías</span>
            <span className={cn(
              "text-[10px] font-semibold opacity-75 shrink-0",
              activeTab === "categorias" ? "text-white" : "text-muted-foreground"
            )}>
              {categories?.length ?? 0}
            </span>
          </button>
        </div>

        {/* ============================================================ */}
        {/* TAB 1: GESTIÓN DE PEDIDOS */}
        {/* ============================================================ */}
        {activeTab === "pedidos" && (
          <div className="space-y-4">
            {/* Tarjetas KPI de Resumen (Mobile First) */}
            <div className="grid grid-cols-3 gap-2">
              <div className="rounded-2xl border border-border/40 bg-surface-2/60 p-3 flex flex-col justify-between">
                <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1">
                  <Clock className="size-3 text-primary shrink-0" /> Nuevos
                </span>
                <p className="mt-1 text-xl font-extrabold text-foreground">
                  {pendingCount}
                </p>
              </div>

              <div className="rounded-2xl border border-border/40 bg-surface-2/60 p-3 flex flex-col justify-between">
                <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1">
                  <Bike className="size-3 text-amber-400 shrink-0" /> Activos
                </span>
                <p className="mt-1 text-xl font-extrabold text-amber-400">
                  {activeOrders}
                </p>
              </div>

              <div className="rounded-2xl border border-border/40 bg-surface-2/60 p-3 flex flex-col justify-between">
                <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1">
                  <TrendingUp className="size-3 text-candy-lime shrink-0" /> Ventas
                </span>
                <p className="mt-1 text-base sm:text-lg font-extrabold text-candy-lime truncate">
                  {formatCompactPrice(totalSales)}
                </p>
              </div>
            </div>

            {/* Buscador de pedidos */}
            <div className="relative">
              <Search className="absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                value={orderSearch}
                onChange={(e) => setOrderSearch(e.target.value)}
                placeholder="Buscar por ID, cliente, dirección..."
                className="h-11 rounded-2xl bg-surface-2/60 border-border/40 pl-10 text-[13px] text-foreground placeholder:text-muted-foreground"
              />
            </div>

            {/* Filtros por pestaña de estado con scroll horizontal táctil */}
            <div className="flex gap-1.5 overflow-x-auto pb-1 scrollbar-hide">
              {[
                { key: "all", label: "Todos", count: allOrdersList.length },
                { key: "pending", label: "Recibidos", count: allOrdersList.filter((o) => o.status === "pending").length },
                { key: "accepted", label: "Tienda Aceptó", count: allOrdersList.filter((o) => o.status === "accepted" || o.status === "preparing").length },
                { key: "in_transit", label: "En Camino", count: allOrdersList.filter((o) => o.status === "in_transit" || o.status === "dispatched").length },
                { key: "arrived", label: "Llegó", count: allOrdersList.filter((o) => o.status === "arrived").length },
                { key: "delivered", label: "Entregados", count: allOrdersList.filter((o) => o.status === "delivered").length },
                { key: "cancelled", label: "Cancelados", count: allOrdersList.filter((o) => o.status === "cancelled").length },
              ].map((tab) => {
                const isSelected = filter === tab.key;
                return (
                  <button
                    key={tab.key}
                    type="button"
                    onClick={() => setFilter(tab.key)}
                    className={cn(
                      "flex items-center gap-1 whitespace-nowrap rounded-full px-3 py-1.5 text-xs font-bold transition-all active:scale-95 shrink-0",
                      isSelected
                        ? "bg-primary text-primary-foreground shadow-sm"
                        : "bg-surface-2/60 text-muted-foreground hover:bg-surface-2 hover:text-foreground"
                    )}
                  >
                    <span>{tab.label}</span>
                    <span className={cn(
                      "rounded-full px-1.5 py-0.2 text-[10px]",
                      isSelected ? "bg-black/20 text-white" : "bg-surface text-muted-foreground"
                    )}>
                      {tab.count}
                    </span>
                  </button>
                );
              })}
            </div>

            {/* Lista de Pedidos */}
            <div className="space-y-3">
              {ordersLoading ? (
                <div className="space-y-3 pt-2">
                  <div className="h-28 animate-pulse rounded-3xl bg-surface-2/60" />
                  <div className="h-44 animate-pulse rounded-3xl bg-surface-2/60" />
                </div>
              ) : ordersError ? (
                <ErrorState error={ordersError} onRetry={() => refetchOrders()} />
              ) : filteredOrders.length === 0 ? (
                <div className="rounded-3xl bg-surface-2/40 p-8 text-center border border-border/30">
                  <EmptyState
                    icon={<Search className="size-7" />}
                    title="No hay pedidos"
                    description={
                      orderSearch
                        ? "No se encontraron pedidos con la búsqueda."
                        : "No hay pedidos con el estado seleccionado."
                    }
                  />
                </div>
              ) : (
                filteredOrders.map((order) => {
                  const isCancelled = order.status === "cancelled";
                  const isDelivered = order.status === "delivered";
                  const isPending = order.status === "pending";
                  const isAccepted = order.status === "accepted" || order.status === "preparing";
                  const isInTransit = order.status === "in_transit" || order.status === "dispatched";
                  const isArrived = order.status === "arrived";
                  const items = order.order_items ?? [];
                  const phone = order.whatsapp_contact || order.profiles?.phone;
                  const customerName = order.profiles?.full_name;

                  return (
                    <div
                      key={order.id}
                      className="overflow-hidden rounded-[24px] border border-border/50 bg-surface-2/70 p-4 shadow-sm transition-all"
                    >
                      {/* Encabezado del Pedido */}
                      <div className="flex items-start justify-between gap-2 border-b border-border/30 pb-2.5">
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="text-[15px] font-extrabold text-foreground">
                              #{order.id.slice(0, 8).toUpperCase()}
                            </span>
                            {order.delivery_type === "fast" && (
                              <span className="flex items-center gap-1 rounded-full bg-primary/20 px-2 py-0.5 text-[9px] font-bold text-primary">
                                <Rocket className="size-2.5" /> Rápido
                              </span>
                            )}
                          </div>
                          <div className="mt-0.5 flex items-center gap-1.5 text-[11px] text-muted-foreground">
                            <span className="font-semibold text-primary/90">
                              {formatRelativeTime(order.created_at)}
                            </span>
                            <span>•</span>
                            <span>{formatDate(order.created_at)}</span>
                          </div>
                          {customerName && (
                            <div className="mt-0.5 flex items-center gap-1 text-[11px] text-foreground/90 font-medium">
                              <User className="size-3 text-muted-foreground" />
                              <span>{customerName}</span>
                            </div>
                          )}
                        </div>

                        <div className="text-right">
                          <span className="text-[16px] font-extrabold text-candy-lime">
                            {formatPrice(order.total)}
                          </span>
                          <div>
                            <span
                              className={cn(
                                "inline-block rounded-full px-2 py-0.5 text-[10px] font-bold mt-0.5",
                                isCancelled && "bg-destructive/20 text-destructive",
                                isPending && "bg-primary/20 text-primary",
                                isAccepted && "bg-sky-500/20 text-sky-400",
                                isInTransit && "bg-amber-500/20 text-amber-400",
                                isArrived && "bg-emerald-500/20 text-emerald-400 animate-pulse",
                                isDelivered && "bg-emerald-500/20 text-emerald-400"
                              )}
                            >
                              {STATUS_LABELS[order.status] ?? order.status}
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* Dirección de Entrega y Contacto */}
                      <div className="my-2.5 space-y-1.5 rounded-2xl bg-surface/70 p-3 text-[12px]">
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex items-start gap-1.5 min-w-0">
                            <MapPin className="mt-0.5 size-3.5 shrink-0 text-primary" />
                            <span className="font-medium text-foreground leading-snug break-words">
                              {order.delivery_address || "Sin dirección especificada"}
                            </span>
                          </div>
                          <div className="flex items-center gap-1 shrink-0">
                            {order.delivery_address && (
                              <>
                                <a
                                  href={getMapsUrl(order.delivery_address)}
                                  target="_blank"
                                  rel="noreferrer"
                                  className="p-1 text-muted-foreground hover:text-primary active:scale-90"
                                  title="Ver en Google Maps"
                                >
                                  <Navigation className="size-3.5" />
                                </a>
                                <button
                                  type="button"
                                  onClick={() => copyAddress(order.delivery_address!, order.id)}
                                  className="p-1 text-muted-foreground hover:text-foreground active:scale-90"
                                  title="Copiar dirección"
                                >
                                  {copiedId === order.id ? (
                                    <Check className="size-3.5 text-emerald-400" />
                                  ) : (
                                    <Copy className="size-3.5" />
                                  )}
                                </button>
                              </>
                            )}
                          </div>
                        </div>

                        {phone && (
                          <div className="flex items-center justify-between pt-1 border-t border-border/20">
                            <span className="text-muted-foreground flex items-center gap-1 text-[11px] font-semibold">
                              <MessageCircle className="size-3 text-emerald-400" /> WhatsApp: {phone}
                            </span>
                            <a
                              href={getWhatsAppUrl(phone, order.id)}
                              target="_blank"
                              rel="noreferrer"
                              className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-400 hover:underline"
                            >
                              Abrir Chat
                            </a>
                          </div>
                        )}

                        {order.status_details && (
                          <div className="pt-1 text-[11px] text-muted-foreground flex items-center gap-1">
                            <Bike className="size-3 text-amber-400" />
                            <span>Vehículo:</span>
                            <span className="font-bold text-foreground">{order.status_details}</span>
                          </div>
                        )}

                        {order.cancel_reason && (
                          <div className="pt-1 text-[11px] text-red-400 font-medium">
                            Motivo: {order.cancel_reason}
                          </div>
                        )}
                      </div>

                      {/* Lista de Productos Comprados */}
                      {items.length > 0 && (
                        <div className="mb-3 space-y-1.5 border-t border-border/20 pt-2.5">
                          <p className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
                            Productos ({items.length})
                          </p>
                          <div className="space-y-1 max-h-36 overflow-y-auto pr-1">
                            {items.map((item) => (
                              <div
                                key={item.id}
                                className="flex items-center justify-between text-[12px] py-0.5 border-b border-border/10 last:border-none"
                              >
                                <div className="flex items-center gap-2 min-w-0 pr-2">
                                  {item.products?.image_url && (
                                    <img
                                      src={item.products.image_url}
                                      alt=""
                                      className="size-6 rounded-md object-cover shrink-0 bg-surface"
                                    />
                                  )}
                                  <span className="truncate text-foreground font-medium">
                                    <span className="font-bold text-primary">{item.quantity}×</span>{" "}
                                    {item.products?.name ?? "Producto"}
                                  </span>
                                </div>
                                <span className="shrink-0 text-muted-foreground font-medium text-[11px]">
                                  {formatPrice(Number(item.price_at_time) * item.quantity)}
                                </span>
                              </div>
                            ))}
                          </div>

                          {/* Desglose de Totales */}
                          <div className="pt-1.5 text-[11px] text-muted-foreground space-y-0.5 border-t border-border/10">
                            {order.delivery_fee !== null && (
                              <div className="flex justify-between">
                                <span>Domicilio ({order.delivery_type === "fast" ? "Rápido" : "Normal"}):</span>
                                <span className="font-semibold text-foreground">{formatPrice(order.delivery_fee)}</span>
                              </div>
                            )}
                            <div className="flex justify-between">
                              <span>Método de pago:</span>
                              <span className="font-semibold text-foreground">
                                {order.payment_method === "cash" ? "Efectivo al recibir" : order.payment_method}
                              </span>
                            </div>
                            {order.referral_code && (
                              <div className="flex justify-between">
                                <span>Referido:</span>
                                <span className="font-bold text-candy-lime">{order.referral_code}</span>
                              </div>
                            )}
                          </div>
                        </div>
                      )}

                      {/* Botonera de Acciones de Estado */}
                      <div className="space-y-2 pt-1.5 border-t border-border/30">
                        <div className="flex flex-wrap gap-1.5">
                          {isPending && (
                            <>
                              <Button
                                size="sm"
                                className="flex-1 bg-primary text-primary-foreground hover:bg-primary/90 font-bold h-9 rounded-xl text-xs"
                                onClick={() => updateOrderStatus(order.id, "accepted")}
                              >
                                <Store className="mr-1 size-3.5" /> Aceptar
                              </Button>
                              <Button
                                size="sm"
                                variant="destructive"
                                className="h-9 rounded-xl px-3"
                                onClick={() => updateOrderStatus(order.id, "cancelled")}
                                title="Cancelar pedido"
                              >
                                <XCircle className="size-4" />
                              </Button>
                            </>
                          )}

                          {isAccepted && (
                            <>
                              <Button
                                size="sm"
                                className="flex-1 bg-amber-500 text-white hover:bg-amber-600 font-bold h-9 rounded-xl text-xs"
                                onClick={() => updateOrderStatus(order.id, "in_transit")}
                              >
                                <Bike className="mr-1 size-3.5" /> Despachar (En Camino)
                              </Button>
                              <Button
                                size="sm"
                                variant="outline"
                                className="h-9 rounded-xl border-destructive text-destructive hover:bg-destructive/10 text-xs px-2.5"
                                onClick={() => updateOrderStatus(order.id, "cancelled")}
                              >
                                Cancelar
                              </Button>
                            </>
                          )}

                          {isInTransit && (
                            <>
                              <Button
                                size="sm"
                                className="flex-1 bg-emerald-500 text-white hover:bg-emerald-600 font-bold h-9 rounded-xl text-xs"
                                onClick={() => updateOrderStatus(order.id, "arrived")}
                              >
                                <MapPin className="mr-1 size-3.5" /> Marcar Llegó
                              </Button>
                              <Button
                                size="sm"
                                variant="outline"
                                className="h-9 rounded-xl border-destructive text-destructive hover:bg-destructive/10 text-xs px-2.5"
                                onClick={() => updateOrderStatus(order.id, "cancelled")}
                              >
                                Cancelar
                              </Button>
                            </>
                          )}

                          {isArrived && (
                            <Button
                              size="sm"
                              className="flex-1 bg-emerald-600 text-white hover:bg-emerald-700 font-bold h-9 rounded-xl text-xs"
                              onClick={() => updateOrderStatus(order.id, "delivered")}
                            >
                              <CheckCircle2 className="mr-1 size-3.5" /> Marcar Entregado
                            </Button>
                          )}

                          <Link
                            to="/pedido/$id"
                            params={{ id: order.id }}
                            target="_blank"
                            className="inline-flex h-9 items-center justify-center rounded-xl bg-surface px-2.5 text-xs font-semibold text-muted-foreground hover:text-foreground transition-all active:scale-95"
                          >
                            <ExternalLink className="size-3.5 mr-1" /> Tracking
                          </Link>
                        </div>

                        {/* Selector de escape manual para cualquier estado */}
                        <div className="flex items-center justify-end gap-1.5 text-[11px] text-muted-foreground">
                          <span>Estado:</span>
                          <select
                            value={order.status}
                            onChange={(e) => updateOrderStatus(order.id, e.target.value)}
                            className="rounded-lg bg-surface px-2 py-1 text-xs font-semibold text-foreground border border-border/40 outline-none"
                          >
                            {ORDER_STATUSES.map((st) => (
                              <option key={st} value={st}>
                                {STATUS_LABELS[st] ?? st}
                              </option>
                            ))}
                            <option value="cancelled">Cancelado</option>
                          </select>
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        )}

        {/* ============================================================ */}
        {/* TAB 2: GESTIÓN DE PRODUCTOS & STOCK */}
        {/* ============================================================ */}
        {activeTab === "productos" && (
          <div className="space-y-4">
            <div className="flex items-center justify-between gap-2">
              <div>
                <h2 className="text-lg font-extrabold text-foreground">Catálogo de Productos</h2>
                <p className="text-[11px] text-muted-foreground">
                  Gestiona precios, descripciones y disponibilidad en 1 toque.
                </p>
              </div>

              <Button
                onClick={openCreateProductModal}
                className="bg-primary text-primary-foreground hover:bg-primary/90 font-bold rounded-2xl h-10 px-3.5 shadow-md flex items-center gap-1.5 shrink-0 text-xs"
              >
                <Plus className="size-3.5" strokeWidth={3} />
                <span>Nuevo</span>
              </Button>
            </div>

            {/* Buscador y filtro por categoría */}
            <div className="flex flex-col gap-2">
              <div className="relative">
                <Search className="absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  value={prodSearch}
                  onChange={(e) => setProdSearch(e.target.value)}
                  placeholder="Buscar producto por nombre..."
                  className="h-11 rounded-2xl bg-surface-2/60 border-border/40 pl-10 text-[13px]"
                />
              </div>

              <select
                value={prodCatFilter}
                onChange={(e) => setProdCatFilter(e.target.value)}
                className="h-10 rounded-2xl bg-surface-2/60 border border-border/40 px-3 text-xs font-semibold text-foreground outline-none"
              >
                <option value="all">Todas las categorías ({products?.length ?? 0})</option>
                {categories.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Listado de Productos */}
            {prodsLoading ? (
              <div className="grid grid-cols-1 gap-2.5 pt-1">
                {[0, 1, 2, 3].map((i) => (
                  <div key={i} className="h-24 animate-pulse rounded-2xl bg-surface-2/60" />
                ))}
              </div>
            ) : filteredProducts.length === 0 ? (
              <div className="rounded-3xl bg-surface-2/40 p-8 text-center border border-border/30">
                <EmptyState
                  icon={<ShoppingBag className="size-7" />}
                  title="No se encontraron productos"
                  description="Prueba con otro término de búsqueda o crea uno nuevo."
                />
              </div>
            ) : (
              <div className="grid grid-cols-1 gap-2.5">
                {filteredProducts.map((prod) => {
                  const isAvailable = prod.is_available !== false;
                  const cat = categories.find((c) => c.id === prod.category_id);
                  const img = prod.image_url || "/tripi-logo-app.png";

                  return (
                    <div
                      key={prod.id}
                      className={cn(
                        "flex flex-col justify-between rounded-[22px] border p-3.5 bg-surface-2/70 transition-all shadow-sm",
                        isAvailable ? "border-border/50" : "border-red-500/30 bg-red-950/10"
                      )}
                    >
                      <div className="flex items-start gap-3">
                        <div className="size-14 shrink-0 overflow-hidden rounded-xl bg-surface p-1 border border-border/40 flex items-center justify-center">
                          <img
                            src={img}
                            alt={prod.name}
                            className="size-full object-cover rounded-lg"
                            onError={(e) => {
                              (e.target as HTMLElement).setAttribute("src", "/tripi-logo-app.png");
                            }}
                          />
                        </div>

                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-1.5">
                            {cat && (
                              <span className="rounded bg-surface px-1.5 py-0.2 text-[9px] font-bold text-muted-foreground uppercase">
                                {cat.name}
                              </span>
                            )}
                            <span className={cn(
                              "rounded px-1.5 py-0.2 text-[9px] font-extrabold uppercase",
                              isAvailable ? "bg-emerald-500/15 text-emerald-400" : "bg-red-500/15 text-red-400"
                            )}>
                              {isAvailable ? "Disponible" : "Agotado"}
                            </span>
                          </div>

                          <h3 className="font-bold text-[13px] text-foreground truncate mt-0.5">
                            {prod.name}
                          </h3>

                          <p className="text-[11px] text-muted-foreground line-clamp-1">
                            {prod.description || "Sin descripción"}
                          </p>

                          <p className="text-[13px] font-black text-candy-lime mt-0.5">
                            {formatPrice(prod.price)}
                          </p>
                        </div>
                      </div>

                      {/* Botones de control del producto */}
                      <div className="mt-2.5 flex items-center justify-between gap-2 border-t border-border/30 pt-2.5">
                        {/* Interruptor rápido de stock */}
                        <button
                          type="button"
                          onClick={() => toggleProductAvailability(prod)}
                          className={cn(
                            "flex items-center gap-1.5 h-8 rounded-xl px-2.5 text-[11px] font-bold transition-all active:scale-95 border",
                            isAvailable
                              ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/30 hover:bg-emerald-500/20"
                              : "bg-red-500/20 text-red-400 border-red-500/40 hover:bg-red-500/30"
                          )}
                          title="Alternar entre Disponible y Agotado"
                        >
                          <span className={cn("size-2 rounded-full", isAvailable ? "bg-emerald-400" : "bg-red-400")} />
                          <span>{isAvailable ? "Marcar Agotado" : "Habilitar Stock"}</span>
                        </button>

                        <div className="flex items-center gap-1.5">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => openEditProductModal(prod)}
                            className="h-8 rounded-xl px-2.5 text-xs font-semibold"
                          >
                            <Pencil className="size-3 mr-1" /> Editar
                          </Button>

                          <Button
                            size="sm"
                            variant="destructive"
                            onClick={() => handleDeleteProduct(prod)}
                            className="h-8 rounded-xl px-2 text-xs font-semibold"
                            title="Eliminar producto"
                          >
                            <Trash2 className="size-3.5" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* ============================================================ */}
        {/* TAB 3: GESTIÓN DE CATEGORÍAS */}
        {/* ============================================================ */}
        {activeTab === "categorias" && (
          <div className="space-y-4">
            <div className="flex items-center justify-between gap-2">
              <div>
                <h2 className="text-lg font-extrabold text-foreground">Categorías</h2>
                <p className="text-[11px] text-muted-foreground">
                  Organiza las secciones de la tienda (Sintéticos, Weed, Farmacia, etc.).
                </p>
              </div>

              <Button
                onClick={openCreateCategoryModal}
                className="bg-primary text-primary-foreground hover:bg-primary/90 font-bold rounded-2xl h-10 px-3.5 shadow-md flex items-center gap-1.5 shrink-0 text-xs"
              >
                <Plus className="size-3.5" strokeWidth={3} />
                <span>Nueva</span>
              </Button>
            </div>

            {catsLoading ? (
              <div className="grid grid-cols-1 gap-2.5 pt-1">
                {[0, 1, 2, 3].map((i) => (
                  <div key={i} className="h-20 animate-pulse rounded-2xl bg-surface-2/60" />
                ))}
              </div>
            ) : categories.length === 0 ? (
              <div className="rounded-3xl bg-surface-2/40 p-8 text-center border border-border/30">
                <EmptyState
                  icon={<Layers className="size-7" />}
                  title="No hay categorías registradas"
                  description="Crea tu primera categoría para organizar los productos."
                />
              </div>
            ) : (
              <div className="grid grid-cols-1 gap-2.5">
                {categories.map((cat) => {
                  const prodCount = (products ?? []).filter((p) => p.category_id === cat.id).length;
                  const iconUrl = cat.icon_url || `/categorias/${cat.name}.png`;

                  return (
                    <div
                      key={cat.id}
                      className="flex items-center justify-between rounded-[22px] border border-border/50 bg-surface-2/70 p-3 shadow-sm"
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="size-11 shrink-0 overflow-hidden rounded-xl bg-surface p-1 border border-border/40 flex items-center justify-center">
                          <img
                            src={iconUrl}
                            alt={cat.name}
                            className="size-full object-contain"
                            onError={(e) => {
                              (e.target as HTMLElement).setAttribute("src", "/tripi-logo-app.png");
                            }}
                          />
                        </div>

                        <div className="min-w-0">
                          <h3 className="font-bold text-[13px] text-foreground truncate">{cat.name}</h3>
                          <p className="text-[10px] text-muted-foreground font-mono truncate">slug: {cat.slug}</p>
                          <span className="inline-block mt-0.5 rounded-full bg-surface px-1.5 py-0.2 text-[9px] font-semibold text-primary">
                            {prodCount} productos
                          </span>
                        </div>
                      </div>

                      <div className="flex items-center gap-1.5 shrink-0">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => openEditCategoryModal(cat)}
                          className="h-8 rounded-xl px-2.5 text-xs font-semibold"
                        >
                          <Pencil className="size-3 mr-1" /> Editar
                        </Button>

                        <Button
                          size="sm"
                          variant="destructive"
                          onClick={() => handleDeleteCategory(cat)}
                          className="h-8 rounded-xl px-2 text-xs font-semibold"
                          title="Eliminar categoría"
                        >
                          <Trash2 className="size-3.5" />
                        </Button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}
      </div>

      {/* ============================================================ */}
      {/* MODAL CREAR / EDITAR PRODUCTO */}
      {/* ============================================================ */}
      <Dialog open={prodDialogOpen} onOpenChange={setProdDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="text-lg font-bold">
              {editingProduct ? "Editar Producto" : "Nuevo Producto"}
            </DialogTitle>
            <DialogDescription className="text-xs text-muted-foreground">
              Define los datos principales que verán los clientes en la tienda.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSaveProduct} className="space-y-3 pt-2">
            <div>
              <label className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground block mb-1">
                Nombre del producto *
              </label>
              <Input
                value={prodName}
                onChange={(e) => setProdName(e.target.value)}
                placeholder="Ej. Cali (Californiana) x 3gr"
                className="h-10 rounded-xl bg-surface border-border/60 text-xs"
                required
              />
            </div>

            <div className="grid grid-cols-2 gap-2.5">
              <div>
                <label className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground block mb-1">
                  Categoría
                </label>
                <select
                  value={prodCategoryId}
                  onChange={(e) => setProdCategoryId(e.target.value)}
                  className="w-full h-10 rounded-xl bg-surface border border-border/60 px-2.5 text-xs font-semibold text-foreground outline-none"
                >
                  <option value="">Sin categoría</option>
                  {categories.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground block mb-1">
                  Precio (COP) *
                </label>
                <Input
                  type="number"
                  value={prodPrice}
                  onChange={(e) => setProdPrice(e.target.value)}
                  placeholder="Ej. 170000"
                  className="h-10 rounded-xl bg-surface border-border/60 text-xs"
                  required
                />
              </div>
            </div>

            <div>
              <label className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground block mb-1">
                URL de Imagen
              </label>
              <Input
                value={prodImageUrl}
                onChange={(e) => setProdImageUrl(e.target.value)}
                placeholder="https://... o /tripi-logo-app.png"
                className="h-10 rounded-xl bg-surface border-border/60 text-xs"
              />
              {prodImageUrl && (
                <div className="mt-1.5 flex items-center gap-2">
                  <span className="text-[10px] text-muted-foreground">Vista previa:</span>
                  <img
                    src={prodImageUrl}
                    alt="Preview"
                    className="size-7 rounded-lg object-cover border border-border"
                    onError={(e) => {
                      (e.target as HTMLElement).style.display = "none";
                    }}
                  />
                </div>
              )}
            </div>

            <div>
              <label className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground block mb-1">
                Descripción
              </label>
              <Textarea
                value={prodDescription}
                onChange={(e) => setProdDescription(e.target.value)}
                placeholder="Detalles del producto..."
                className="rounded-xl bg-surface border-border/60 min-h-[60px] text-xs"
              />
            </div>

            <div className="flex items-center justify-between rounded-xl bg-surface p-2.5 border border-border/40">
              <div>
                <span className="text-xs font-bold text-foreground block">Disponibilidad Inmediata</span>
                <span className="text-[10px] text-muted-foreground">¿Disponible para agregar al carrito?</span>
              </div>
              <button
                type="button"
                onClick={() => setProdIsAvailable(!prodIsAvailable)}
                className={cn(
                  "px-2.5 py-1 rounded-lg text-xs font-bold transition-all",
                  prodIsAvailable
                    ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30"
                    : "bg-red-500/20 text-red-400 border border-red-500/30"
                )}
              >
                {prodIsAvailable ? "🟢 DISPONIBLE" : "🔴 AGOTADO"}
              </button>
            </div>

            <DialogFooter className="pt-2 flex flex-row gap-2 justify-end">
              <Button
                type="button"
                variant="outline"
                onClick={() => setProdDialogOpen(false)}
                className="rounded-xl flex-1 text-xs h-9"
              >
                Cancelar
              </Button>
              <Button
                type="submit"
                disabled={prodSaving}
                className="bg-primary text-primary-foreground font-bold rounded-xl flex-1 text-xs h-9"
              >
                {prodSaving ? "Guardando..." : editingProduct ? "Actualizar" : "Crear Producto"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* ============================================================ */}
      {/* MODAL CREAR / EDITAR CATEGORÍA */}
      {/* ============================================================ */}
      <Dialog open={catDialogOpen} onOpenChange={setCatDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="text-lg font-bold">
              {editingCategory ? "Editar Categoría" : "Nueva Categoría"}
            </DialogTitle>
            <DialogDescription className="text-xs text-muted-foreground">
              Define el nombre y el ícono visual para la navegación de los clientes.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSaveCategory} className="space-y-3 pt-2">
            <div>
              <label className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground block mb-1">
                Nombre de la categoría *
              </label>
              <Input
                value={catName}
                onChange={(e) => {
                  setCatName(e.target.value);
                  if (!editingCategory) {
                    setCatSlug(e.target.value.toLowerCase().replace(/\s+/g, "-").replace(/[^a-z0-9-]/g, ""));
                  }
                }}
                placeholder="Ej. Sintéticos, Weed, Bebidas..."
                className="h-10 rounded-xl bg-surface border-border/60 text-xs"
                required
              />
            </div>

            <div>
              <label className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground block mb-1">
                Slug (identificador URL)
              </label>
              <Input
                value={catSlug}
                onChange={(e) => setCatSlug(e.target.value)}
                placeholder="ej. sinteticos"
                className="h-10 rounded-xl bg-surface border-border/60 text-xs font-mono"
              />
            </div>

            <div>
              <label className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground block mb-1">
                URL de Icono / Imagen
              </label>
              <Input
                value={catIconUrl}
                onChange={(e) => setCatIconUrl(e.target.value)}
                placeholder="/categorias/sintéticos.png o https://..."
                className="h-10 rounded-xl bg-surface border-border/60 text-xs"
              />
            </div>

            <DialogFooter className="pt-2 flex flex-row gap-2 justify-end">
              <Button
                type="button"
                variant="outline"
                onClick={() => setCatDialogOpen(false)}
                className="rounded-xl flex-1 text-xs h-9"
              >
                Cancelar
              </Button>
              <Button
                type="submit"
                disabled={catSaving}
                className="bg-primary text-primary-foreground font-bold rounded-xl flex-1 text-xs h-9"
              >
                {catSaving ? "Guardando..." : editingCategory ? "Actualizar" : "Crear Categoría"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </AppShell>
  );
}
