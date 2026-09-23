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

function unwrap<T>(res: { data: T | null; error: { message: string } | null }): T {
  if (res.error) throw new Error(res.error.message);
  return (res.data ?? []) as T;
}

export const categoriesQuery = () =>
  queryOptions({
    queryKey: ["categories"],
    queryFn: async () =>
      unwrap<Category[]>(await supabase.from("categories").select("*").order("name")),
  });

export const productsQuery = (opts: { search?: string; categoryId?: string | null } = {}) =>
  queryOptions({
    queryKey: ["products", opts.search ?? "", opts.categoryId ?? ""],
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
    enabled: Boolean(userId),
    queryFn: async () =>
      unwrap<Order[]>(
        await supabase
          .from("orders")
          .select("*")
          .eq("user_id", userId!)
          .order("created_at", { ascending: false }),
      ),
  });

export const orderQuery = (id: string, userId: string | undefined) =>
  queryOptions({
    queryKey: ["order", id, userId],
    enabled: Boolean(userId),
    refetchInterval: 15000,
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
