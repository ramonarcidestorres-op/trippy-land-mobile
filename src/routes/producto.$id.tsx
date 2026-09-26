import { createFileRoute } from "@tanstack/react-router";
import { useEffect } from "react";
import { openProductModal } from "@/hooks/useProductModal";
import { CatalogPage } from "./catalogo";

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

  useEffect(() => {
    if (id) {
      openProductModal(id);
    }
  }, [id]);

  return <CatalogPage />;
}
