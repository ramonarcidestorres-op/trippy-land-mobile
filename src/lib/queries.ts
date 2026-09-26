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

export const categoriesQuery = () =>
  queryOptions({
    queryKey: ["categories"],
    staleTime: 1000 * 60 * 10,
    queryFn: async () => {
      const cats = unwrap<Category[]>(await supabase.from("categories").select("*").order("name"));
      
      const getPriority = (c: Category) => {
        const s = (c.name + " " + c.slug).toLowerCase();
        if (s.includes("sintético") || s.includes("sintetico") || s.includes("sintetic")) return 1;
        if (s.includes("weed") || s.includes("mota")) return 2;
        if (s.includes("coca") || s.includes("perico")) return 3;
        return 99;
      };

      return cats.sort((a, b) => {
        const pA = getPriority(a);
        const pB = getPriority(b);
        if (pA !== pB) return pA - pB;
        return a.name.localeCompare(b.name);
      });
    }
  });

export const productsQuery = (opts: { search?: string | undefined; categoryId?: string | null | undefined } = {}) =>
  queryOptions({
    queryKey: ["products", opts.search ?? "", opts.categoryId ?? ""],
    staleTime: 1000 * 60 * 5,
    queryFn: async () => {
      let q = supabase.from("products").select("*").order("created_at", { ascending: false });
      if (opts.categoryId) q = q.eq("category_id", opts.categoryId);
      if (opts.search) q = q.ilike("name", `%${opts.search}%`);
      return unwrap<Product[]>(await q);
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

      const { data, error } = await query.order("created_at", { ascending: false });
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
    refetchInterval: 5000,
    queryFn: async (): Promise<AdminOrder[]> => {
      // 1. Obtener órdenes con items y detalles de productos
      const { data: rawOrders, error: ordersErr } = await supabase
        .from("orders")
        .select("*, order_items(*, products(id, name, image_url))")
        .order("created_at", { ascending: false });

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

