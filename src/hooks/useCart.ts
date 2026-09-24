import { useEffect, useState, useCallback } from "react";
import { type Product } from "@/lib/queries";

export type CartItem = {
  id: string; // Un id único para la fila del carrito (puede ser el product_id)
  product_id: string;
  quantity: number;
  products: Product; // Para guardar la metadata del producto offline
};

const CART_EVENT = "trippy_cart_updated";

function getStoredCart(): CartItem[] {
  if (typeof window === "undefined") return [];
  try {
    const item = localStorage.getItem("trippy_cart");
    return item ? JSON.parse(item) : [];
  } catch {
    return [];
  }
}

export function useCart() {
  const [cart, setCartState] = useState<CartItem[]>(getStoredCart());

  useEffect(() => {
    const handleUpdate = () => {
      setCartState(getStoredCart());
    };
    window.addEventListener(CART_EVENT, handleUpdate);
    return () => window.removeEventListener(CART_EVENT, handleUpdate);
  }, []);

  const saveCart = (newCart: CartItem[]) => {
    localStorage.setItem("trippy_cart", JSON.stringify(newCart));
    window.dispatchEvent(new Event(CART_EVENT));
    setCartState(newCart);
  };

  const addToCart = useCallback((product: Product, quantity: number = 1) => {
    const current = getStoredCart();
    const existing = current.find((item) => item.product_id === product.id);
    if (existing) {
      existing.quantity += quantity;
      // Actualizamos la data del producto por si cambió el precio
      existing.products = product;
    } else {
      current.push({
        id: product.id,
        product_id: product.id,
        quantity,
        products: product,
      });
    }
    saveCart(current);
  }, []);

  const setQuantity = useCallback((id: string, quantity: number) => {
    if (quantity < 1) return;
    const current = getStoredCart();
    const existing = current.find((item) => item.id === id);
    if (existing) {
      existing.quantity = quantity;
      saveCart(current);
    }
  }, []);

  const removeItem = useCallback((id: string) => {
    const current = getStoredCart();
    const newCart = current.filter((item) => item.id !== id);
    saveCart(newCart);
  }, []);

  const clearCart = useCallback(() => {
    saveCart([]);
  }, []);

  return { cart, addToCart, setQuantity, removeItem, clearCart };
}
