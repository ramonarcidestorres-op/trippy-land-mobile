import { useState, useEffect } from "react";
import { type Product } from "@/lib/queries";

type ProductModalState = {
  isOpen: boolean;
  product: Product | null;
  productId: string | null;
};

let currentState: ProductModalState = {
  isOpen: false,
  product: null,
  productId: null,
};

const listeners = new Set<(state: ProductModalState) => void>();

function notify() {
  listeners.forEach((listener) => listener(currentState));
}

export function openProductModal(item: Product | string) {
  if (typeof item === "string") {
    currentState = {
      isOpen: true,
      product: null,
      productId: item,
    };
  } else {
    currentState = {
      isOpen: true,
      product: item,
      productId: item.id,
    };
  }
  notify();
}

export function closeProductModal() {
  currentState = {
    isOpen: false,
    product: null,
    productId: null,
  };
  notify();
}

export function useProductModal() {
  const [state, setState] = useState<ProductModalState>(currentState);

  useEffect(() => {
    listeners.add(setState);
    return () => {
      listeners.delete(setState);
    };
  }, []);

  return {
    isOpen: state.isOpen,
    product: state.product,
    productId: state.productId,
    openProduct: openProductModal,
    closeProduct: closeProductModal,
  };
}
