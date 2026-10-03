import { queryOptions } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import type { Database } from "@/integrations/supabase/types";

export type Product = Database["public"]["Tables"]["products"]["Row"];
export type Category = Database["public"]["Tables"]["categories"]["Row"];
export type CartRow = Database["public"]["Tables"]["cart_items"]["Row"] & {
  products: Product | null;
};
export type Order = Database["public"]["Tables"]["orders"]["Row"];
export type OrderItem = Database["public"]["Tables"]["order_items"]["Row"] & {
  products: Pick<Product, "id" | "name" | "image_url"> | null;
};
export type DeliveryFee = Database["public"]["Tables"]["delivery_fees"]["Row"];
export type OrderStatusHistory = Database["public"]["Tables"]["order_status_history"]["Row"];

function unwrap<T>(res: { data: T | null; error: { message: string } | null }): T {
  if (res.error) throw new Error(res.error.message);
  return (res.data ?? []) as T;
}

const CACHE_CATS_KEY = "tls_cached_categories";
const CACHE_PRODS_KEY = "tls_cached_products";

export function getCachedCategories(): Category[] | undefined {
  if (typeof window === "undefined") return undefined;
  try {
    const raw = localStorage.getItem(CACHE_CATS_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) return parsed;
    }
  } catch {
    // ignore
  }
  return undefined;
}

export function saveCachedCategories(cats: Category[]) {
  if (typeof window === "undefined" || !cats || cats.length === 0) return;
  try {
    localStorage.setItem(CACHE_CATS_KEY, JSON.stringify(cats));
  } catch {
    // ignore
  }
}

export function getCachedProducts(): Product[] | undefined {
  if (typeof window === "undefined") return undefined;
  try {
    const raw = localStorage.getItem(CACHE_PRODS_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) return parsed;
    }
  } catch {
    // ignore
  }
  return undefined;
}

export function saveCachedProducts(prods: Product[]) {
  if (typeof window === "undefined" || !prods || prods.length === 0) return;
  try {
    localStorage.setItem(CACHE_PRODS_KEY, JSON.stringify(prods));
  } catch {
    // ignore
  }
}

export const categoriesQuery = () =>
  queryOptions({
    queryKey: ["categories"],
    staleTime: 1000 * 60 * 10,
    placeholderData: () => getCachedCategories(),
    queryFn: async () => {
      try {
        const { data, error } = await supabase.from("categories").select("*").order("name");
        if (error) throw error;
        const cats = (data || []) as Category[];
        
        const getPriority = (c: Category) => {
          const s = (c.name + " " + c.slug).toLowerCase();
          if (s.includes("sintético") || s.includes("sintetico") || s.includes("sintetic")) return 1;
          if (s.includes("weed") || s.includes("mota")) return 2;
          if (s.includes("coca") || s.includes("perico")) return 3;
          return 99;
        };

        const sorted = cats.sort((a, b) => {
          const pA = getPriority(a);
          const pB = getPriority(b);
          if (pA !== pB) return pA - pB;
          return a.name.localeCompare(b.name);
        });

        if (sorted.length > 0) {
          saveCachedCategories(sorted);
        }
        return sorted;
      } catch (err) {
        const cached = getCachedCategories();
        if (cached && cached.length > 0) return cached;
        throw err;
      }
    }
  });

export const productsQuery = (opts: { search?: string | undefined; categoryId?: string | null | undefined } = {}) =>
  queryOptions({
    queryKey: ["products", opts.search ?? "", opts.categoryId ?? ""],
    staleTime: 1000 * 60 * 5,
    placeholderData: (prev) => {
      if (prev) return prev;
      if (!opts.search && !opts.categoryId) return getCachedProducts();
      return undefined;
    },
    queryFn: async () => {
      try {
        const { data, error } = await supabase
          .from("products")
          .select("*, categories:categories(id, name, slug)")
          .order("created_at", { ascending: false });
          
        if (error) throw error;
        let prods = (data || []) as (Product & { categories?: { id: string; name: string; slug: string } | null })[];
        
        // If it was an unfiltered query, persist to localStorage for 0ms cold starts
        if (!opts.categoryId && !opts.search && prods.length > 0) {
          saveCachedProducts(prods as any);
        }

        // 1. Filtrar por ID de categoría si está seleccionada
        if (opts.categoryId) {
          prods = prods.filter((p) => p.category_id === opts.categoryId);
        }

        // 2. Búsqueda inteligente multi-campo y por categorías
        if (opts.search && opts.search.trim()) {
          const rawQuery = opts.search.trim();
          const cleanQuery = rawQuery
            .toLowerCase()
            .normalize("NFD")
            .replace(/[\u0300-\u036f]/g, "");
          const tokens = cleanQuery.split(/\s+/).filter(Boolean);

          prods = prods.filter((p) => {
            const catName = p.categories?.name || "";
            const catSlug = p.categories?.slug || "";
            
            // Texto searchable combinado
            const searchable = [
              p.name,
              p.description,
              p.effects,
              p.strain_type,
              catName,
              catSlug,
            ]
              .filter(Boolean)
              .join(" ")
              .toLowerCase()
              .normalize("NFD")
              .replace(/[\u0300-\u036f]/g, "");

            // Verificar si todos los tokens buscados coinciden con algún campo o sinónimo
            return tokens.every((token) => {
              if (searchable.includes(token)) return true;

              // Sinónimos y asociaciones de categorías
              if (["edible", "edibles", "comestible", "comestibles", "gomita", "gomitas", "gummies", "chocolate", "chocolatina", "chocolatinas", "brownie", "dulce", "dulces"].includes(token)) {
                return catSlug.includes("edibles") || catName.toLowerCase().includes("edible");
              }
              if (["sintetico", "sinteticos", "synthetic", "synthetics", "quimico", "quimicos", "tussi", "tusi", "2cb", "mdma", "keta", "ketamina", "ghb", "popper", "lsd", "nexus", "molly", "extasis"].includes(token)) {
                return catSlug.includes("sintetic") || catName.toLowerCase().includes("synth");
              }
              if (["weed", "mota", "hierba", "yerba", "cannabis", "marihuana", "flor", "cogollo", "indoor", "sativa", "indica", "hibrida"].includes(token)) {
                return catSlug.includes("weed") || catName.toLowerCase().includes("cannabis") || catSlug.includes("pre-roll") || catName.toLowerCase().includes("joint");
              }
              if (["preroll", "prerolls", "pre-roll", "pre-rolls", "armado", "armados", "joint", "joints", "porro", "bareto"].includes(token)) {
                return catSlug.includes("pre-roll") || catName.toLowerCase().includes("joint");
              }
              if (["farma", "farmacia", "pharmacy", "pastilla", "pastillas", "medicamento", "medicamentos", "clonazepam", "xanax", "metadona", "ritalin", "ritalina", "oxy", "oxycodona", "rivotril"].includes(token)) {
                return catSlug.includes("farmacia") || catName.toLowerCase().includes("pharmacy");
              }
              if (["psico", "psicodelico", "psicodelicos", "psychedelic", "psychedelics", "dmt", "hongo", "hongos", "shroom", "shrooms"].includes(token)) {
                return catSlug.includes("psychedel") || catName.toLowerCase().includes("psychedel");
              }
              if (["extracto", "extractos", "extract", "extracts", "vape", "vaporizador", "vaporizadores", "rosin", "resin", "live resin", "gotas", "hachis", "polen", "kief"].includes(token)) {
                return catSlug.includes("extract") || catName.toLowerCase().includes("extract");
              }
              if (["sex", "sexo", "sexual", "sexuales", "potencializador", "ereccion", "erección", "lubricante", "vigor"].includes(token)) {
                return catSlug.includes("sex") || catName.toLowerCase().includes("sex");
              }
              if (["coca", "cocaina", "perico", "blanca", "lavada", "pura"].includes(token)) {
                return catSlug.includes("coca") || catName.toLowerCase().includes("coca");
              }

              return false;
            });
          });
        }

        return prods;
      } catch (err) {
        if (!opts.categoryId && !opts.search) {
          const cached = getCachedProducts();
          if (cached && cached.length > 0) return cached;
        }
        throw err;
      }
    },
  });

export const productQuery = (id: string) =>
  queryOptions({
    queryKey: ["product", id],
    staleTime: 1000 * 60 * 5,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("products")
        .select("*, categories(name, slug)")
        .eq("id", id)
        .maybeSingle();
      if (error) throw new Error(error.message);
      return data as (Product & { categories: { name: string; slug: string } | null }) | null;
    },
  });

export const cartQuery = (userId: string | undefined) =>
  queryOptions({
    queryKey: ["cart", userId],
    enabled: Boolean(userId),
    staleTime: 1000 * 60,
    queryFn: async () =>
      unwrap<CartRow[]>(
        await supabase
          .from("cart_items")
          .select("*, products(*)")
          .eq("user_id", userId!)
          .order("created_at"),
      ),
  });

export const ordersQuery = (userId: string | undefined) =>
  queryOptions({
    queryKey: ["orders", userId],
    staleTime: 1000 * 30,
    queryFn: async (): Promise<(Order & { order_items?: OrderItem[] })[]> => {
      let localIds: string[] = [];
      try {
        localIds = JSON.parse(localStorage.getItem("tls_my_orders") || "[]");
      } catch {
        // ignore storage errors
      }

      if (!userId && localIds.length === 0) return [];

      let query = supabase
        .from("orders")
        .select("*, order_items(*, products(name, image_url))");

      if (userId && localIds.length > 0) {
        query = query.or(`user_id.eq.${userId},id.in.(${localIds.join(",")})`);
      } else if (userId) {
        query = query.eq("user_id", userId);
      } else {
        query = query.in("id", localIds);
      }

      const { data, error } = await query
        .order("created_at", { ascending: false })
        .limit(50);
      if (error) throw new Error(error.message);
      return (data || []) as (Order & { order_items?: OrderItem[] })[];
    },
  });

export const orderQuery = (id: string) =>
  queryOptions({
    queryKey: ["order", id],
    staleTime: 1000 * 10,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("orders")
        .select("*, order_items(*, products(id, name, image_url))")
        .eq("id", id)
        .maybeSingle();
      if (error) throw new Error(error.message);
      return data as (Order & { order_items: OrderItem[] }) | null;
    },
  });

export const orderHistoryQuery = (orderId: string | undefined) =>
  queryOptions({
    queryKey: ["order_history", orderId],
    enabled: Boolean(orderId),
    queryFn: async () =>
      unwrap<OrderStatusHistory[]>(
        await supabase
          .from("order_status_history")
          .select("*")
          .eq("order_id", orderId!)
          .order("created_at", { ascending: true }),
      ),
  });

export type AdminOrder = Order & {
  order_items: (OrderItem & { products: Pick<Product, "id" | "name" | "image_url"> | null })[];
  profiles: { id: string; full_name: string | null; phone: string | null } | null;
};

export const allOrdersQuery = () =>
  queryOptions({
    queryKey: ["admin_orders"],
    refetchInterval: 15000,
    queryFn: async (): Promise<AdminOrder[]> => {
      // 1. Obtener órdenes con items y detalles de productos (limitado a los 200 más recientes para escalabilidad)
      const { data: rawOrders, error: ordersErr } = await supabase
        .from("orders")
        .select("*, order_items(*, products(id, name, image_url))")
        .order("created_at", { ascending: false })
        .limit(200);

      if (ordersErr) throw new Error(ordersErr.message);
      if (!rawOrders || rawOrders.length === 0) return [];

      // 2. Obtener perfiles de usuarios de forma independiente para evitar errores de relación en Supabase
      const userIds = Array.from(new Set(rawOrders.map((o) => o.user_id).filter(Boolean))) as string[];
      let profilesMap = new Map<string, { id: string; full_name: string | null; phone: string | null }>();

      if (userIds.length > 0) {
        try {
          const { data: profilesData } = await supabase
            .from("profiles")
            .select("id, full_name, phone")
            .in("id", userIds);

          if (profilesData) {
            profilesMap = new Map(profilesData.map((p) => [p.id, p]));
          }
        } catch {
          // Si falla la consulta de perfiles, los pedidos siguen cargando sin bloquear la interfaz
        }
      }

      return rawOrders.map((order) => ({
        ...order,
        profiles: order.user_id ? (profilesMap.get(order.user_id) ?? null) : null,
      })) as AdminOrder[];
    },
  });

export const deliveryFeesQuery = () =>
  queryOptions({
    queryKey: ["delivery_fees"],
    queryFn: async () =>
      unwrap<DeliveryFee[]>(
        await supabase
          .from("delivery_fees")
          .select("*")
          .order("min_subtotal", { ascending: false }),
      ),
  });

export function cartSubtotal(rows: CartRow[]): number {
  return rows.reduce((sum, r) => sum + Number(r.products?.price ?? 0) * r.quantity, 0);
}

export async function addToCart(userId: string, productId: string, quantity: number) {
  const { data: existing, error: readErr } = await supabase
    .from("cart_items")
    .select("id, quantity")
    .eq("user_id", userId)
    .eq("product_id", productId)
    .maybeSingle();
  if (readErr) throw new Error(readErr.message);

  if (existing) {
    const { error } = await supabase
      .from("cart_items")
      .update({ quantity: existing.quantity + quantity })
      .eq("id", existing.id);
    if (error) throw new Error(error.message);
    return;
  }
  const { error } = await supabase
    .from("cart_items")
    .insert({ user_id: userId, product_id: productId, quantity });
  if (error) throw new Error(error.message);
}

export type Referral = {
  id: string;
  code: string;
  name: string;
  commission_percentage: number;
  phone: string | null;
  is_active: boolean;
  notes: string | null;
  created_at: string;
  updated_at: string;
};

export const referralsQuery = () =>
  queryOptions({
    queryKey: ["referrals"],
    staleTime: 1000 * 30,
    queryFn: async (): Promise<Referral[]> => {
      const { data, error } = await supabase
        .from("referrals")
        .select("*")
        .order("created_at", { ascending: false });
      if (error) throw new Error(error.message);
      return (data || []) as Referral[];
    },
  });

