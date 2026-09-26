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
  AlertTriangle,
  Loader2,
  Upload,
  Image as ImageIcon,
  Users,
  Percent,
  Share2,
  Link as LinkIcon,
  DollarSign,
  Wallet,
  CheckCheck
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
import { allOrdersQuery, categoriesQuery, productsQuery, referralsQuery, type AdminOrder, type Product, type Category, type Referral } from "@/lib/queries";
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

type AdminTab = "pedidos" | "productos" | "categorias" | "referidos";

export function AdminPedidosPage() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const { isOpen, isToggling, toggleStoreStatus } = useStoreStatus();
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

  // --- REFERIDOS STATE ---
  const { data: referrals = [], isLoading: refsLoading } = useQuery(referralsQuery());
  const [refSearch, setRefSearch] = useState<string>("");
  const [refDialogOpen, setRefDialogOpen] = useState(false);
  const [editingReferral, setEditingReferral] = useState<Referral | null>(null);
  const [refName, setRefName] = useState("");
  const [refCode, setRefCode] = useState("");
  const [refCommissionPct, setRefCommissionPct] = useState("20");
  const [refPhone, setRefPhone] = useState("");
  const [refNotes, setRefNotes] = useState("");
  const [refIsActive, setRefIsActive] = useState(true);
  const [refSaving, setRefSaving] = useState(false);
  const [copiedRefCode, setCopiedRefCode] = useState<string | null>(null);
  const [deleteReferralTarget, setDeleteReferralTarget] = useState<Referral | null>(null);

  // Product Dialog state
  const [prodDialogOpen, setProdDialogOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [prodName, setProdName] = useState("");
  const [prodCategoryId, setProdCategoryId] = useState("");
  const [prodPrice, setProdPrice] = useState("");
  const [prodDescription, setProdDescription] = useState("");
  const [prodImageUrl, setProdImageUrl] = useState("");
  const [prodStrainType, setProdStrainType] = useState("");
  const [prodWeightG, setProdWeightG] = useState("");
  const [prodThc, setProdThc] = useState("");
  const [prodCbd, setProdCbd] = useState("");
  const [prodEffects, setProdEffects] = useState("");
  const [prodIsAvailable, setProdIsAvailable] = useState(true);
  const [prodSaving, setProdSaving] = useState(false);
  const [uploadingProdImg, setUploadingProdImg] = useState(false);
  const prodFileInputRef = useRef<HTMLInputElement>(null);

  // Delete Confirmation state (Replaces native browser confirm for 100% mobile compatibility)
  const [deleteProductTarget, setDeleteProductTarget] = useState<Product | null>(null);
  const [deleteCategoryTarget, setDeleteCategoryTarget] = useState<Category | null>(null);
  const [deleting, setDeleting] = useState(false);

  // Category Dialog state
  const [catDialogOpen, setCatDialogOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [catName, setCatName] = useState("");
  const [catSlug, setCatSlug] = useState("");
  const [catIconUrl, setCatIconUrl] = useState("");
  const [catSaving, setCatSaving] = useState(false);
  const [uploadingCatImg, setUploadingCatImg] = useState(false);
  const catFileInputRef = useRef<HTMLInputElement>(null);


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

  // Escucha en tiempo real de cambios en la tabla de referidos
  useEffect(() => {
    const channelId = `admin-refs-${Math.random().toString(36).substring(2, 9)}`;
    const channel = supabase
      .channel(channelId)
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "referrals" },
        () => {
          queryClient.invalidateQueries({ queryKey: ["referrals"] });
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

  // --- SUBIDA DIRECTA DE IMÁGENES A SUPABASE STORAGE ---
  async function handleFileUpload(file: File, type: "product" | "category") {
    if (!file) return;
    if (file.size > 25 * 1024 * 1024) {
      toast.error("La imagen no puede pesar más de 25MB");
      return;
    }

    if (type === "product") setUploadingProdImg(true);
    else setUploadingCatImg(true);

    try {
      const fileExt = file.name.split(".").pop()?.toLowerCase() || "png";
      const cleanFileName = `${type}s/${Date.now()}_${Math.random().toString(36).slice(2, 7)}.${fileExt}`;

      const { error: uploadError } = await supabase.storage
        .from("product-images")
        .upload(cleanFileName, file, {
          contentType: file.type || `image/${fileExt === "jpg" ? "jpeg" : fileExt}`,
          cacheControl: "3600",
          upsert: true,
        });

      if (uploadError) throw uploadError;

      const { data } = supabase.storage
        .from("product-images")
        .getPublicUrl(cleanFileName);

      if (type === "product") {
        setProdImageUrl(data.publicUrl);
        toast.success("✅ Foto del producto subida a Supabase con éxito");
      } else {
        setCatIconUrl(data.publicUrl);
        toast.success("✅ Ícono de categoría subido a Supabase con éxito");
      }
    } catch (err: any) {
      console.error("Upload error:", err);
      toast.error("Error al subir imagen a Supabase: " + (err.message || "Intenta de nuevo"));
    } finally {
      if (type === "product") {
        setUploadingProdImg(false);
        if (prodFileInputRef.current) prodFileInputRef.current.value = "";
      } else {
        setUploadingCatImg(false);
        if (catFileInputRef.current) catFileInputRef.current.value = "";
      }
    }
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
      .update({ is_available: nextVal, updated_at: new Date().toISOString() })
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
    setProdStrainType("Flores");
    setProdWeightG("3");
    setProdThc("80");
    setProdCbd("20");
    setProdEffects("Relajación profunda y creatividad");
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
    setProdStrainType(prod.strain_type || "");
    setProdWeightG(prod.weight_g != null ? String(prod.weight_g) : "");
    setProdThc(prod.thc_percentage != null ? String(prod.thc_percentage) : "");
    setProdCbd(prod.cbd_percentage != null ? String(prod.cbd_percentage) : "");
    setProdEffects(prod.effects || "");
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
      const payload: Record<string, any> = {
        name: prodName.trim(),
        category_id: prodCategoryId || null,
        price: numPrice,
        description: prodDescription.trim() || null,
        image_url: prodImageUrl.trim() || null,
        strain_type: prodStrainType.trim() || null,
        weight_g: prodWeightG ? Number(prodWeightG) : null,
        thc_percentage: prodThc ? Number(prodThc) : null,
        cbd_percentage: prodCbd ? Number(prodCbd) : null,
        effects: prodEffects.trim() || null,
        is_available: prodIsAvailable,
        updated_at: new Date().toISOString(),
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
      queryClient.invalidateQueries({ queryKey: ["product"] });
    } catch (err: any) {
      toast.error("Error al guardar producto: " + (err.message || "Error inesperado"));
    } finally {
      setProdSaving(false);
    }
  }

  // Ejecuta la eliminación real del producto de Supabase
  async function confirmExecuteDeleteProduct() {
    if (!deleteProductTarget) return;

    setDeleting(true);
    try {
      // 1. Optimistic removal
      queryClient.setQueryData(["products", "", ""], (old: Product[] | undefined) => {
        if (!old) return old;
        return old.filter((p) => p.id !== deleteProductTarget.id);
      });

      const { error } = await supabase
        .from("products")
        .delete()
        .eq("id", deleteProductTarget.id);

      if (error) throw error;

      toast.success(`Producto "${deleteProductTarget.name}" eliminado correctamente`);
      setDeleteProductTarget(null);
      queryClient.invalidateQueries({ queryKey: ["products"] });
      queryClient.invalidateQueries({ queryKey: ["product"] });
    } catch (err: any) {
      toast.error("No se pudo eliminar el producto: " + (err.message || ""));
      queryClient.invalidateQueries({ queryKey: ["products"] });
    } finally {
      setDeleting(false);
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

  // Inicia la eliminación de una categoría verificando dependencias
  function requestDeleteCategory(cat: Category) {
    const productsInCat = (products ?? []).filter((p) => p.category_id === cat.id).length;
    if (productsInCat > 0) {
      toast.error(`No puedes eliminar "${cat.name}" porque tiene ${productsInCat} productos asignados. Reasigna o elimina los productos primero.`);
      return;
    }
    setDeleteCategoryTarget(cat);
  }

  // Ejecuta la eliminación real de la categoría en Supabase
  async function confirmExecuteDeleteCategory() {
    if (!deleteCategoryTarget) return;

    setDeleting(true);
    try {
      const { error } = await supabase
        .from("categories")
        .delete()
        .eq("id", deleteCategoryTarget.id);

      if (error) throw error;

      toast.success(`Categoría "${deleteCategoryTarget.name}" eliminada`);
      setDeleteCategoryTarget(null);
      queryClient.invalidateQueries({ queryKey: ["categories"] });
    } catch (err: any) {
      toast.error("No se pudo eliminar la categoría: " + (err.message || ""));
      queryClient.invalidateQueries({ queryKey: ["categories"] });
    } finally {
      setDeleting(false);
    }
  }

  // --- REFERRAL CRUD & SHARING ---
  function sanitizeRefCode(text: string) {
    return text.toUpperCase().replace(/\s+/g, "").replace(/[^A-Z0-9_-]/g, "");
  }

  function openCreateReferralModal() {
    setEditingReferral(null);
    setRefName("");
    setRefCode("");
    setRefCommissionPct("20");
    setRefPhone("");
    setRefNotes("");
    setRefIsActive(true);
    setRefDialogOpen(true);
  }

  function openEditReferralModal(ref: Referral) {
    setEditingReferral(ref);
    setRefName(ref.name);
    setRefCode(ref.code);
    setRefCommissionPct(String(ref.commission_percentage || 20));
    setRefPhone(ref.phone || "");
    setRefNotes(ref.notes || "");
    setRefIsActive(ref.is_active !== false);
    setRefDialogOpen(true);
  }

  async function handleSaveReferral(e: React.FormEvent) {
    e.preventDefault();
    if (!refName.trim()) {
      toast.error("El nombre del referido es obligatorio");
      return;
    }
    const cleanCode = sanitizeRefCode(refCode.trim() || refName.trim());
    if (!cleanCode) {
      toast.error("Ingresa un código de referido válido");
      return;
    }
    const numPct = Number(refCommissionPct);
    if (isNaN(numPct) || numPct < 0 || numPct > 100) {
      toast.error("El porcentaje debe ser entre 0% y 100%");
      return;
    }

    setRefSaving(true);
    try {
      const payload = {
        name: refName.trim(),
        code: cleanCode,
        commission_percentage: numPct,
        phone: refPhone.trim() || null,
        notes: refNotes.trim() || null,
        is_active: refIsActive,
        updated_at: new Date().toISOString(),
      };

      if (editingReferral) {
        const { error } = await supabase
          .from("referrals")
          .update(payload)
          .eq("id", editingReferral.id);
        if (error) throw error;
        toast.success(`Referido "${cleanCode}" actualizado con éxito`);
      } else {
        const { error } = await supabase
          .from("referrals")
          .insert(payload);
        if (error) throw error;
        toast.success(`Referido "${cleanCode}" creado con éxito`);
      }

      setRefDialogOpen(false);
      queryClient.invalidateQueries({ queryKey: ["referrals"] });
    } catch (err: any) {
      toast.error("Error al guardar referido: " + (err.message || "Verifica que el código no esté repetido"));
    } finally {
      setRefSaving(false);
    }
  }

  async function toggleReferralActive(ref: Referral) {
    const nextVal = !ref.is_active;
    const { error } = await supabase
      .from("referrals")
      .update({ is_active: nextVal, updated_at: new Date().toISOString() })
      .eq("id", ref.id);

    if (error) {
      toast.error("Error al actualizar estado: " + error.message);
    } else {
      toast.success(nextVal ? `🟢 Referido "${ref.code}" activado` : `⚪ Referido "${ref.code}" pausado`);
      queryClient.invalidateQueries({ queryKey: ["referrals"] });
    }
  }

  async function confirmExecuteDeleteReferral() {
    if (!deleteReferralTarget) return;
    setDeleting(true);
    try {
      const { error } = await supabase
        .from("referrals")
        .delete()
        .eq("id", deleteReferralTarget.id);

      if (error) throw error;

      toast.success(`Referido "${deleteReferralTarget.code}" eliminado`);
      setDeleteReferralTarget(null);
      queryClient.invalidateQueries({ queryKey: ["referrals"] });
    } catch (err: any) {
      toast.error("No se pudo eliminar el referido: " + (err.message || ""));
      queryClient.invalidateQueries({ queryKey: ["referrals"] });
    } finally {
      setDeleting(false);
    }
  }

  function copyReferralLink(code: string) {
    const origin = typeof window !== "undefined" ? window.location.origin : "https://trippyland.store";
    const link = `${origin}/?ref=${encodeURIComponent(code)}`;
    navigator.clipboard.writeText(link);
    setCopiedRefCode(code);
    toast.success(`Link de referido ${code} copiado al portapapeles`);
    setTimeout(() => setCopiedRefCode(null), 2500);
  }

  function shareReferralWhatsApp(ref: Referral) {
    const origin = typeof window !== "undefined" ? window.location.origin : "https://trippyland.store";
    const link = `${origin}/?ref=${encodeURIComponent(ref.code)}`;
    const msg = encodeURIComponent(
      `¡Hola ${ref.name}! 🚀 Aquí tienes tu enlace exclusivo de Trippy Land Store:\n\n🔗 ${link}\n\nCon este link tus clientes comprarán con tu comisión del ${ref.commission_percentage}% incluida. ¡Muchos éxitos!`
    );
    const phoneClean = (ref.phone || "").replace(/\D/g, "");
    const waUrl = phoneClean
      ? `https://wa.me/${phoneClean.startsWith("57") ? phoneClean : `57${phoneClean}`}?text=${msg}`
      : `https://wa.me/?text=${msg}`;
    window.open(waUrl, "_blank");
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
              disabled={isToggling}
              aria-checked={isOpen}
              onClick={() => toggleStoreStatus()}
              className={cn(
                "relative inline-flex h-8 w-15 shrink-0 cursor-pointer rounded-full p-0.5 transition-colors duration-200 ease-in-out focus:outline-none shadow-inner active:scale-95",
                isOpen ? "bg-emerald-500" : "bg-red-600",
                isToggling && "opacity-80 cursor-wait"
              )}
              title={isOpen ? "Toca para Cerrar la tienda" : "Toca para Abrir la tienda"}
            >
              <span
                className={cn(
                  "pointer-events-none inline-flex items-center justify-center size-7 transform rounded-full bg-white shadow-md ring-0 transition duration-200 ease-in-out",
                  isOpen ? "translate-x-7" : "translate-x-0"
                )}
              >
                {isToggling && <Loader2 className="size-3.5 animate-spin text-muted-foreground" />}
              </span>
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
        {/* PESTAÑAS PRINCIPALES DEL PANEL (GRID MOBILE FIRST - 4 TABS) */}
        {/* ============================================================ */}
        <div className="grid grid-cols-4 gap-1 rounded-2xl bg-surface-2/80 p-1 border border-border/40">
          <button
            type="button"
            onClick={() => setActiveTab("pedidos")}
            className={cn(
              "flex items-center justify-center gap-1 h-10 rounded-xl text-[11px] font-bold transition-all active:scale-95 truncate px-1",
              activeTab === "pedidos"
                ? "bg-primary text-primary-foreground shadow-md"
                : "text-muted-foreground hover:text-foreground"
            )}
          >
            <Package className="size-3.5 shrink-0" />
            <span className="truncate">Pedidos</span>
            {pendingCount > 0 && (
              <span className={cn(
                "size-4 rounded-full flex items-center justify-center text-[9px] font-black shrink-0",
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
              "flex items-center justify-center gap-1 h-10 rounded-xl text-[11px] font-bold transition-all active:scale-95 truncate px-1",
              activeTab === "productos"
                ? "bg-primary text-primary-foreground shadow-md"
                : "text-muted-foreground hover:text-foreground"
            )}
          >
            <ShoppingBag className="size-3.5 shrink-0" />
            <span className="truncate">Productos</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab("categorias")}
            className={cn(
              "flex items-center justify-center gap-1 h-10 rounded-xl text-[11px] font-bold transition-all active:scale-95 truncate px-1",
              activeTab === "categorias"
                ? "bg-primary text-primary-foreground shadow-md"
                : "text-muted-foreground hover:text-foreground"
            )}
          >
            <Layers className="size-3.5 shrink-0" />
            <span className="truncate">Categorías</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab("referidos")}
            className={cn(
              "flex items-center justify-center gap-1 h-10 rounded-xl text-[11px] font-bold transition-all active:scale-95 truncate px-1",
              activeTab === "referidos"
                ? "bg-primary text-primary-foreground shadow-md"
                : "text-muted-foreground hover:text-foreground"
            )}
          >
            <Users className="size-3.5 shrink-0" />
            <span className="truncate">Referidos</span>
            <span className={cn(
              "text-[9px] font-semibold opacity-80 shrink-0",
              activeTab === "referidos" ? "text-black font-black" : "text-muted-foreground"
            )}>
              {referrals?.length ?? 0}
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
                  Gestiona precios, fotos y disponibilidad en 1 toque.
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

                          <div className="flex flex-wrap items-center gap-1.5 mt-0.5">
                            {prod.strain_type && (
                              <span className="text-[10px] font-bold text-muted-foreground bg-surface px-1.5 py-0.5 rounded">
                                {prod.strain_type}
                              </span>
                            )}
                            {prod.weight_g != null && (
                              <span className="text-[10px] font-bold text-candy-lime/90 bg-surface px-1.5 py-0.5 rounded">
                                {prod.weight_g}g
                              </span>
                            )}
                            {prod.effects && (
                              <span className="text-[10px] text-muted-foreground truncate max-w-[150px]" title={prod.effects}>
                                ✨ {prod.effects}
                              </span>
                            )}
                          </div>

                          <p className="text-[13px] font-black text-candy-lime mt-1">
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
                            onClick={() => setDeleteProductTarget(prod)}
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
                          onClick={() => requestDeleteCategory(cat)}
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

        {/* ============================================================ */}
        {/* TAB 4: GESTIÓN DE REFERIDOS / COMISIONISTAS */}
        {/* ============================================================ */}
        {activeTab === "referidos" && (
          <div className="space-y-4">
            {/* Tarjetas KPI de Referidos (Mobile First) */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              <div className="rounded-2xl border border-border/40 bg-surface-2/60 p-3 flex flex-col justify-between">
                <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1">
                  <Users className="size-3 text-primary shrink-0" /> Activos
                </span>
                <p className="mt-1 text-xl font-extrabold text-foreground">
                  {referrals.filter((r) => r.is_active !== false).length}
                </p>
              </div>

              <div className="rounded-2xl border border-border/40 bg-surface-2/60 p-3 flex flex-col justify-between">
                <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1">
                  <Package className="size-3 text-sky-400 shrink-0" /> Pedidos Links
                </span>
                <p className="mt-1 text-xl font-extrabold text-sky-400">
                  {allOrdersList.filter((o) => Boolean(o.referral_code) && o.status !== "cancelled").length}
                </p>
              </div>

              <div className="rounded-2xl border border-border/40 bg-surface-2/60 p-3 flex flex-col justify-between">
                <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1">
                  <DollarSign className="size-3 text-emerald-400 shrink-0" /> Total Ventas
                </span>
                <p className="mt-1 text-lg font-extrabold text-emerald-400 truncate">
                  {formatCompactPrice(
                    allOrdersList
                      .filter((o) => Boolean(o.referral_code) && o.status !== "cancelled")
                      .reduce((sum, o) => sum + Number(o.total || 0), 0)
                  )}
                </p>
              </div>

              <div className="rounded-2xl border border-border/40 bg-surface-2/60 p-3 flex flex-col justify-between">
                <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1">
                  <Wallet className="size-3 text-candy-lime shrink-0" /> Comisiones
                </span>
                <p className="mt-1 text-lg font-extrabold text-candy-lime truncate">
                  {formatCompactPrice(
                    allOrdersList
                      .filter((o) => Boolean(o.referral_code) && o.status !== "cancelled")
                      .reduce((sum, o) => {
                        const code = (o.referral_code || "").toUpperCase();
                        const ref = referrals.find((r) => r.code.toUpperCase() === code);
                        const pct = ref ? Number(ref.commission_percentage) : 20;
                        const comm = Number(o.total || 0) * (pct / (100 + pct));
                        return sum + comm;
                      }, 0)
                  )}
                </p>
              </div>
            </div>

            {/* Cabecera y Botón Crear */}
            <div className="flex items-center justify-between gap-2">
              <div className="min-w-0">
                <h2 className="text-lg font-extrabold text-foreground truncate">Referidos</h2>
                <p className="text-[11px] text-muted-foreground truncate">
                  Crea links con porcentaje de ganancia personalizado.
                </p>
              </div>

              <Button
                onClick={openCreateReferralModal}
                className="bg-primary text-primary-foreground hover:bg-primary/90 font-bold rounded-2xl h-10 px-3.5 shadow-md flex items-center gap-1.5 shrink-0 text-xs"
              >
                <Plus className="size-3.5" strokeWidth={3} />
                <span>Nuevo</span>
              </Button>
            </div>

            {/* Buscador de Referidos */}
            <div className="relative">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
              <Input
                value={refSearch}
                onChange={(e) => setRefSearch(e.target.value)}
                placeholder="Buscar por nombre, código #TAG o teléfono..."
                className="h-10 rounded-xl bg-surface-2 border-border/50 pl-10 text-xs"
              />
            </div>

            {/* Lista de Referidos */}
            {refsLoading ? (
              <div className="grid grid-cols-1 gap-2.5 pt-1">
                {[0, 1, 2].map((i) => (
                  <div key={i} className="h-28 animate-pulse rounded-2xl bg-surface-2/60" />
                ))}
              </div>
            ) : referrals.length === 0 ? (
              <div className="rounded-3xl bg-surface-2/40 p-8 text-center border border-border/30">
                <EmptyState
                  icon={<Users className="size-7 text-primary" />}
                  title="No hay referidos registrados"
                  description="Crea tu primer link de referido para permitir a tus socios vender con porcentaje personalizado."
                  action={
                    <Button
                      onClick={openCreateReferralModal}
                      className="mt-3 bg-primary text-primary-foreground rounded-2xl text-xs font-bold"
                    >
                      <Plus className="size-3.5 mr-1" /> Crear Primer Referido
                    </Button>
                  }
                />
              </div>
            ) : (
              <div className="grid grid-cols-1 gap-3">
                {referrals
                  .filter((r) => {
                    if (!refSearch.trim()) return true;
                    const q = refSearch.toLowerCase().trim();
                    return (
                      r.name.toLowerCase().includes(q) ||
                      r.code.toLowerCase().includes(q) ||
                      (r.phone || "").toLowerCase().includes(q)
                    );
                  })
                  .map((ref) => {
                    const origin = typeof window !== "undefined" ? window.location.origin : "https://trippyland.store";
                    const refLink = `${origin}/?ref=${ref.code}`;
                    const isCopied = copiedRefCode === ref.code;
                    
                    // Estadísticas del referido individual
                    const myOrders = allOrdersList.filter(
                      (o) => (o.referral_code || "").toUpperCase() === ref.code.toUpperCase() && o.status !== "cancelled"
                    );
                    const mySales = myOrders.reduce((sum, o) => sum + Number(o.total || 0), 0);
                    const pct = Number(ref.commission_percentage || 20);
                    const myEarnings = mySales * (pct / (100 + pct));

                    return (
                      <div
                        key={ref.id}
                        className={cn(
                          "rounded-[22px] border bg-surface-2/80 p-3.5 shadow-sm space-y-3 transition-all",
                          ref.is_active !== false ? "border-border/60" : "border-border/30 opacity-70"
                        )}
                      >
                        {/* Cabecera de la tarjeta */}
                        <div className="flex items-start justify-between gap-2">
                          <div className="min-w-0">
                            <div className="flex items-center gap-2">
                              <h3 className="font-bold text-[14px] text-foreground truncate">{ref.name}</h3>
                              <span className="font-mono text-[10px] font-extrabold uppercase bg-primary/15 text-primary px-2 py-0.5 rounded-md border border-primary/20">
                                #{ref.code}
                              </span>
                            </div>
                            {ref.notes && (
                              <p className="text-[11px] text-muted-foreground line-clamp-1 mt-0.5">{ref.notes}</p>
                            )}
                          </div>

                          <div className="flex items-center gap-1.5 shrink-0">
                            <span className="rounded-full bg-emerald-500/20 px-2.5 py-0.5 text-[10px] font-extrabold text-emerald-400 border border-emerald-500/30">
                              {ref.commission_percentage}% Ganancia
                            </span>
                            <button
                              type="button"
                              onClick={() => toggleReferralActive(ref)}
                              className={cn(
                                "size-6 rounded-full flex items-center justify-center text-[10px] font-bold transition-all",
                                ref.is_active !== false
                                  ? "bg-emerald-500/20 text-emerald-400"
                                  : "bg-zinc-700/50 text-zinc-400"
                              )}
                              title={ref.is_active !== false ? "Pausar referido" : "Activar referido"}
                            >
                              {ref.is_active !== false ? "🟢" : "⚪"}
                            </button>
                          </div>
                        </div>

                        {/* Caja del enlace generado con botones de compartir */}
                        <div className="rounded-xl bg-surface p-2 border border-border/40 flex items-center justify-between gap-2">
                          <div className="min-w-0 flex-1">
                            <span className="text-[9px] font-bold uppercase tracking-wider text-muted-foreground block">
                              Enlace de afiliado
                            </span>
                            <p className="text-[11px] font-mono text-foreground truncate">{refLink}</p>
                          </div>

                          <div className="flex items-center gap-1.5 shrink-0">
                            <Button
                              size="sm"
                              type="button"
                              onClick={() => copyReferralLink(ref.code)}
                              className={cn(
                                "h-8 rounded-xl px-2.5 text-xs font-bold transition-all",
                                isCopied
                                  ? "bg-emerald-500 text-black hover:bg-emerald-400"
                                  : "bg-surface-2 text-foreground hover:bg-surface-2/80 border border-border/50"
                              )}
                            >
                              {isCopied ? (
                                <>
                                  <Check className="size-3.5 mr-1 text-black" /> Copiado
                                </>
                              ) : (
                                <>
                                  <Copy className="size-3.5 mr-1 text-primary" /> Copiar Link
                                </>
                              )}
                            </Button>

                            <Button
                              size="sm"
                              type="button"
                              onClick={() => shareReferralWhatsApp(ref)}
                              className="h-8 rounded-xl px-2.5 text-xs font-bold bg-[#25D366]/20 text-[#25D366] hover:bg-[#25D366]/30 border border-[#25D366]/40"
                              title="Compartir link por WhatsApp"
                            >
                              <Share2 className="size-3.5 mr-1" /> WhatsApp
                            </Button>
                          </div>
                        </div>

                        {/* Métricas del referido */}
                        <div className="grid grid-cols-3 gap-1.5 bg-surface-2/60 p-2 rounded-xl border border-border/30 text-center">
                          <div>
                            <span className="text-[9px] uppercase tracking-wider text-muted-foreground block">Pedidos</span>
                            <span className="text-xs font-black text-foreground">{myOrders.length}</span>
                          </div>
                          <div>
                            <span className="text-[9px] uppercase tracking-wider text-muted-foreground block">Ventas</span>
                            <span className="text-xs font-black text-emerald-400 truncate block">{formatPrice(mySales)}</span>
                          </div>
                          <div>
                            <span className="text-[9px] uppercase tracking-wider text-muted-foreground block">Comisión</span>
                            <span className="text-xs font-black text-candy-lime truncate block">{formatPrice(myEarnings)}</span>
                          </div>
                        </div>

                        {/* Barra de acciones inferiores */}
                        <div className="flex items-center justify-between pt-1 border-t border-border/20 text-[11px]">
                          <span className="text-muted-foreground truncate">
                            {ref.phone ? `📱 ${ref.phone}` : "Sin teléfono"}
                          </span>

                          <div className="flex items-center gap-1.5">
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => openEditReferralModal(ref)}
                              className="h-7.5 rounded-xl px-2.5 text-xs font-semibold"
                            >
                              <Pencil className="size-3 mr-1" /> Editar
                            </Button>

                            <Button
                              size="sm"
                              variant="destructive"
                              onClick={() => setDeleteReferralTarget(ref)}
                              className="h-7.5 rounded-xl px-2 text-xs font-semibold"
                              title="Eliminar referido"
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
      </div>


      {/* ============================================================ */}
      {/* MODAL CREAR / EDITAR PRODUCTO CON SUBIDA DE IMAGEN DIRECTA */}
      {/* ============================================================ */}
      <Dialog open={prodDialogOpen} onOpenChange={setProdDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="text-lg font-bold">
              {editingProduct ? "Editar Producto" : "Nuevo Producto"}
            </DialogTitle>
            <DialogDescription className="text-xs text-muted-foreground">
              Define los datos principales y la foto del producto.
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

            {/* SECCIÓN DE IMAGEN CON SUBIDA DIRECTA A SUPABASE + URL FALLBACK */}
            <div className="space-y-1.5">
              <label className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground block">
                Foto del producto
              </label>

              {/* Input file oculto para cámara y galería */}
              <input
                type="file"
                ref={prodFileInputRef}
                accept="image/*"
                className="hidden"
                onChange={(e) => {
                  const f = e.target.files?.[0];
                  if (f) handleFileUpload(f, "product");
                }}
              />

              <Button
                type="button"
                variant="outline"
                disabled={uploadingProdImg}
                onClick={() => prodFileInputRef.current?.click()}
                className="rounded-xl h-11 text-xs font-bold w-full border-dashed border-primary/50 bg-primary/10 text-primary hover:bg-primary/20 flex items-center justify-center gap-2 shadow-sm active:scale-[0.98]"
              >
                {uploadingProdImg ? (
                  <>
                    <Loader2 className="size-4 animate-spin text-primary" />
                    <span>Subiendo a Supabase Storage...</span>
                  </>
                ) : (
                  <>
                    <Upload className="size-4 text-primary" />
                    <span>📸 Subir foto desde galería o cámara</span>
                  </>
                )}
              </Button>

              <div className="relative">
                <Input
                  value={prodImageUrl}
                  onChange={(e) => setProdImageUrl(e.target.value)}
                  placeholder="O pega aquí el enlace de la imagen (https://...)"
                  className="h-9 rounded-xl bg-surface border-border/60 text-[11px]"
                />
              </div>

              {prodImageUrl && (
                <div className="flex items-center gap-2.5 rounded-xl bg-surface p-2 border border-border/40">
                  <img
                    src={prodImageUrl}
                    alt="Preview"
                    className="size-11 rounded-lg object-cover border border-border shrink-0 bg-surface-2"
                    onError={(e) => {
                      (e.target as HTMLElement).style.display = "none";
                    }}
                  />
                  <div className="flex-1 min-w-0">
                    <span className="text-[11px] font-bold text-emerald-400 flex items-center gap-1">
                      <Check className="size-3" /> Foto asignada
                    </span>
                    <p className="text-[10px] text-muted-foreground truncate">{prodImageUrl}</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setProdImageUrl("")}
                    className="p-1.5 text-muted-foreground hover:text-red-400 rounded-lg hover:bg-red-500/10 transition-colors"
                    title="Quitar foto"
                  >
                    <XCircle className="size-4.5" />
                  </button>
                </div>
              )}
            </div>

            {/* ATRIBUTOS Y EFECTOS DEL PRODUCTO */}
            <div className="grid grid-cols-2 gap-2.5 pt-1">
              <div>
                <label className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground block mb-1">
                  Tipo / Familia
                </label>
                <Input
                  value={prodStrainType}
                  onChange={(e) => setProdStrainType(e.target.value)}
                  placeholder="Ej. Flores / Premium"
                  className="h-10 rounded-xl bg-surface border-border/60 text-xs"
                />
              </div>

              <div>
                <label className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground block mb-1">
                  Contenido (Gramos)
                </label>
                <Input
                  type="number"
                  step="any"
                  value={prodWeightG}
                  onChange={(e) => setProdWeightG(e.target.value)}
                  placeholder="Ej. 3"
                  className="h-10 rounded-xl bg-surface border-border/60 text-xs"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2.5">
              <div>
                <label className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground block mb-1">
                  Nivel THC (%)
                </label>
                <Input
                  type="number"
                  value={prodThc}
                  onChange={(e) => setProdThc(e.target.value)}
                  placeholder="Ej. 80"
                  className="h-10 rounded-xl bg-surface border-border/60 text-xs"
                />
              </div>

              <div>
                <label className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground block mb-1">
                  Nivel CBD (%)
                </label>
                <Input
                  type="number"
                  value={prodCbd}
                  onChange={(e) => setProdCbd(e.target.value)}
                  placeholder="Ej. 20"
                  className="h-10 rounded-xl bg-surface border-border/60 text-xs"
                />
              </div>
            </div>

            <div>
              <label className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground block mb-1">
                Efectos Destacados
              </label>
              <Input
                value={prodEffects}
                onChange={(e) => setProdEffects(e.target.value)}
                placeholder="Ej. Relajación profunda, creatividad, euforia..."
                className="h-10 rounded-xl bg-surface border-border/60 text-xs"
              />
            </div>

            <div>
              <label className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground block mb-1">
                Descripción Completa
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
                disabled={prodSaving || uploadingProdImg}
                className="bg-primary text-primary-foreground font-bold rounded-xl flex-1 text-xs h-9"
              >
                {prodSaving ? "Guardando..." : editingProduct ? "Actualizar" : "Crear Producto"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* ============================================================ */}
      {/* MODAL CREAR / EDITAR CATEGORÍA CON SUBIDA DE ÍCONO DIRECTA */}
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

            {/* SECCIÓN DE SUBIDA DE ÍCONO A SUPABASE + URL FALLBACK */}
            <div className="space-y-1.5">
              <label className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground block">
                Ícono / Imagen de Categoría
              </label>

              <input
                type="file"
                ref={catFileInputRef}
                accept="image/*"
                className="hidden"
                onChange={(e) => {
                  const f = e.target.files?.[0];
                  if (f) handleFileUpload(f, "category");
                }}
              />

              <Button
                type="button"
                variant="outline"
                disabled={uploadingCatImg}
                onClick={() => catFileInputRef.current?.click()}
                className="rounded-xl h-11 text-xs font-bold w-full border-dashed border-primary/50 bg-primary/10 text-primary hover:bg-primary/20 flex items-center justify-center gap-2 shadow-sm active:scale-[0.98]"
              >
                {uploadingCatImg ? (
                  <>
                    <Loader2 className="size-4 animate-spin text-primary" />
                    <span>Subiendo a Supabase Storage...</span>
                  </>
                ) : (
                  <>
                    <Upload className="size-4 text-primary" />
                    <span>📸 Subir ícono desde galería o cámara</span>
                  </>
                )}
              </Button>

              <div className="relative">
                <Input
                  value={catIconUrl}
                  onChange={(e) => setCatIconUrl(e.target.value)}
                  placeholder="O pega aquí el enlace del ícono (https://...)"
                  className="h-9 rounded-xl bg-surface border-border/60 text-[11px]"
                />
              </div>

              {catIconUrl && (
                <div className="flex items-center gap-2.5 rounded-xl bg-surface p-2 border border-border/40">
                  <img
                    src={catIconUrl}
                    alt="Icon preview"
                    className="size-11 rounded-lg object-contain border border-border shrink-0 bg-surface-2 p-1"
                    onError={(e) => {
                      (e.target as HTMLElement).style.display = "none";
                    }}
                  />
                  <div className="flex-1 min-w-0">
                    <span className="text-[11px] font-bold text-emerald-400 flex items-center gap-1">
                      <Check className="size-3" /> Ícono cargado
                    </span>
                    <p className="text-[10px] text-muted-foreground truncate">{catIconUrl}</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setCatIconUrl("")}
                    className="p-1.5 text-muted-foreground hover:text-red-400 rounded-lg hover:bg-red-500/10 transition-colors"
                    title="Quitar ícono"
                  >
                    <XCircle className="size-4.5" />
                  </button>
                </div>
              )}
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
                disabled={catSaving || uploadingCatImg}
                className="bg-primary text-primary-foreground font-bold rounded-xl flex-1 text-xs h-9"
              >
                {catSaving ? "Guardando..." : editingCategory ? "Actualizar" : "Crear Categoría"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* ============================================================ */}
      {/* MODAL DE CONFIRMACIÓN DE ELIMINACIÓN DE PRODUCTO (100% MOBILE) */}
      {/* ============================================================ */}
      <Dialog open={Boolean(deleteProductTarget)} onOpenChange={(open) => !open && setDeleteProductTarget(null)}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <div className="mx-auto size-12 rounded-full bg-red-500/20 text-red-400 grid place-items-center mb-2">
              <Trash2 className="size-6" />
            </div>
            <DialogTitle className="text-center text-lg font-bold">
              ¿Eliminar este producto?
            </DialogTitle>
            <DialogDescription className="text-center text-xs text-muted-foreground">
              Estás a punto de eliminar <span className="font-bold text-foreground">"{deleteProductTarget?.name}"</span> de forma permanente de tu catálogo.
            </DialogDescription>
          </DialogHeader>

          <DialogFooter className="pt-3 flex flex-col sm:flex-row gap-2">
            <Button
              type="button"
              variant="outline"
              disabled={deleting}
              onClick={() => setDeleteProductTarget(null)}
              className="rounded-xl w-full text-xs h-10"
            >
              Cancelar
            </Button>
            <Button
              type="button"
              variant="destructive"
              disabled={deleting}
              onClick={confirmExecuteDeleteProduct}
              className="rounded-xl w-full text-xs font-bold h-10 bg-red-600 hover:bg-red-700"
            >
              {deleting ? (
                <>
                  <Loader2 className="size-3.5 animate-spin mr-1.5" />
                  Eliminando...
                </>
              ) : (
                "Eliminar Producto"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ============================================================ */}
      {/* MODAL DE CONFIRMACIÓN DE ELIMINACIÓN DE CATEGORÍA (100% MOBILE) */}
      {/* ============================================================ */}
      <Dialog open={Boolean(deleteCategoryTarget)} onOpenChange={(open) => !open && setDeleteCategoryTarget(null)}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <div className="mx-auto size-12 rounded-full bg-red-500/20 text-red-400 grid place-items-center mb-2">
              <Trash2 className="size-6" />
            </div>
            <DialogTitle className="text-center text-lg font-bold">
              ¿Eliminar esta categoría?
            </DialogTitle>
            <DialogDescription className="text-center text-xs text-muted-foreground">
              Estás a punto de eliminar la categoría <span className="font-bold text-foreground">"{deleteCategoryTarget?.name}"</span>.
            </DialogDescription>
          </DialogHeader>

          <DialogFooter className="pt-3 flex flex-col sm:flex-row gap-2">
            <Button
              type="button"
              variant="outline"
              disabled={deleting}
              onClick={() => setDeleteCategoryTarget(null)}
              className="rounded-xl w-full text-xs h-10"
            >
              Cancelar
            </Button>
            <Button
              type="button"
              variant="destructive"
              disabled={deleting}
              onClick={confirmExecuteDeleteCategory}
              className="rounded-xl w-full text-xs font-bold h-10 bg-red-600 hover:bg-red-700"
            >
              {deleting ? (
                <>
                  <Loader2 className="size-3.5 animate-spin mr-1.5" />
                  Eliminando...
                </>
              ) : (
                "Eliminar Categoría"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ============================================================ */}
      {/* MODAL CREAR / EDITAR REFERIDO / COMISIONISTA */}
      {/* ============================================================ */}
      <Dialog open={refDialogOpen} onOpenChange={setRefDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="text-lg font-bold">
              {editingReferral ? "Editar Referido" : "Nuevo Referido"}
            </DialogTitle>
            <DialogDescription className="text-xs text-muted-foreground">
              Configura el nombre, código y porcentaje de comisión para este afiliado.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSaveReferral} className="space-y-3.5 pt-2">
            <div>
              <label className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground block mb-1">
                Nombre o Alias del Referido *
              </label>
              <Input
                value={refName}
                onChange={(e) => {
                  setRefName(e.target.value);
                  if (!editingReferral && !refCode) {
                    setRefCode(sanitizeRefCode(e.target.value));
                  }
                }}
                placeholder="Ej. Juan Pérez, VIP Poblado, Socio 01"
                className="h-10 rounded-xl bg-surface border-border/60 text-xs"
                required
              />
            </div>

            <div>
              <label className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground block mb-1">
                Código de Referido (Tag URL) *
              </label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 font-mono text-xs text-muted-foreground">
                  ?ref=
                </span>
                <Input
                  value={refCode}
                  onChange={(e) => setRefCode(sanitizeRefCode(e.target.value))}
                  placeholder="JUAN20"
                  className="h-10 rounded-xl bg-surface border-border/60 pl-14 text-xs font-mono font-bold uppercase tracking-wider"
                  required
                />
              </div>
              <p className="text-[10px] text-muted-foreground mt-1">
                Se usará en el link compartido: <span className="font-mono text-foreground">https://.../?ref={refCode || "CODIGO"}</span>
              </p>
            </div>

            {/* Selector de Porcentaje de Comisión */}
            <div className="rounded-xl bg-surface p-3 border border-border/40 space-y-2.5">
              <div className="flex items-center justify-between">
                <div>
                  <span className="text-xs font-bold text-foreground block">Porcentaje de Ganancia</span>
                  <span className="text-[10px] text-muted-foreground">Recargo en la tienda para este link</span>
                </div>
                <div className="flex items-center gap-1 bg-surface-2 px-2.5 py-1 rounded-lg border border-border/50">
                  <span className="text-sm font-extrabold text-candy-lime">{refCommissionPct}%</span>
                </div>
              </div>

              {/* Botones de Presets Rápidos */}
              <div className="flex flex-wrap gap-1.5 pt-1">
                {["10", "15", "20", "25", "30", "40"].map((pct) => (
                  <button
                    key={pct}
                    type="button"
                    onClick={() => setRefCommissionPct(pct)}
                    className={cn(
                      "px-2.5 py-1 rounded-lg text-xs font-bold transition-all",
                      refCommissionPct === pct
                        ? "bg-primary text-primary-foreground shadow-sm"
                        : "bg-surface-2 text-muted-foreground hover:text-foreground"
                    )}
                  >
                    {pct}%
                  </button>
                ))}
              </div>

              <div className="pt-1">
                <Input
                  type="number"
                  min="0"
                  max="100"
                  step="1"
                  value={refCommissionPct}
                  onChange={(e) => setRefCommissionPct(e.target.value)}
                  placeholder="Porcentaje personalizado (ej. 20)"
                  className="h-9 rounded-xl bg-surface-2 border-border/60 text-xs"
                />
              </div>

              <p className="text-[10px] text-muted-foreground leading-tight">
                💡 Los clientes que ingresen con este link verán los precios incrementados en un <strong className="text-foreground">{refCommissionPct}%</strong> para cubrir la ganancia del comisionista.
              </p>
            </div>

            <div className="grid grid-cols-2 gap-2.5">
              <div>
                <label className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground block mb-1">
                  WhatsApp / Teléfono
                </label>
                <Input
                  value={refPhone}
                  onChange={(e) => setRefPhone(e.target.value)}
                  placeholder="Ej. 3001234567"
                  className="h-10 rounded-xl bg-surface border-border/60 text-xs"
                />
              </div>

              <div>
                <label className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground block mb-1">
                  Estado
                </label>
                <button
                  type="button"
                  onClick={() => setRefIsActive(!refIsActive)}
                  className={cn(
                    "w-full h-10 rounded-xl text-xs font-bold border transition-all flex items-center justify-center gap-1.5",
                    refIsActive
                      ? "bg-emerald-500/20 text-emerald-400 border-emerald-500/30"
                      : "bg-zinc-800 text-zinc-400 border-border/40"
                  )}
                >
                  {refIsActive ? "🟢 Activo" : "⚪ Pausado"}
                </button>
              </div>
            </div>

            <div>
              <label className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground block mb-1">
                Notas / Observaciones
              </label>
              <Textarea
                value={refNotes}
                onChange={(e) => setRefNotes(e.target.value)}
                placeholder="Detalles sobre acuerdos de pago, contacto, etc."
                className="rounded-xl bg-surface border-border/60 min-h-[50px] text-xs"
              />
            </div>

            <DialogFooter className="pt-2 flex flex-row gap-2 justify-end">
              <Button
                type="button"
                variant="outline"
                onClick={() => setRefDialogOpen(false)}
                className="rounded-xl flex-1 text-xs h-9"
              >
                Cancelar
              </Button>
              <Button
                type="submit"
                disabled={refSaving}
                className="bg-primary text-primary-foreground font-bold rounded-xl flex-1 text-xs h-9"
              >
                {refSaving ? "Guardando..." : editingReferral ? "Actualizar" : "Crear Referido"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* ============================================================ */}
      {/* MODAL DE CONFIRMACIÓN DE ELIMINACIÓN DE REFERIDO (100% MOBILE) */}
      {/* ============================================================ */}
      <Dialog open={Boolean(deleteReferralTarget)} onOpenChange={(open) => !open && setDeleteReferralTarget(null)}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <div className="mx-auto size-12 rounded-full bg-red-500/20 text-red-400 grid place-items-center mb-2">
              <Trash2 className="size-6" />
            </div>
            <DialogTitle className="text-center text-lg font-bold">
              ¿Eliminar este referido?
            </DialogTitle>
            <DialogDescription className="text-center text-xs text-muted-foreground">
              Estás a punto de eliminar al comisionista <span className="font-bold text-foreground">"{deleteReferralTarget?.name}" (#{deleteReferralTarget?.code})</span>.
            </DialogDescription>
          </DialogHeader>

          <DialogFooter className="pt-3 flex flex-col sm:flex-row gap-2">
            <Button
              type="button"
              variant="outline"
              disabled={deleting}
              onClick={() => setDeleteReferralTarget(null)}
              className="rounded-xl w-full text-xs h-10"
            >
              Cancelar
            </Button>
            <Button
              type="button"
              variant="destructive"
              disabled={deleting}
              onClick={confirmExecuteDeleteReferral}
              className="rounded-xl w-full text-xs font-bold h-10 bg-red-600 hover:bg-red-700"
            >
              {deleting ? (
                <>
                  <Loader2 className="size-3.5 animate-spin mr-1.5" />
                  Eliminando...
                </>
              ) : (
                "Eliminar Referido"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </AppShell>

  );
}
