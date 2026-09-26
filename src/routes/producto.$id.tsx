import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect } from "react";
import { openProductModal } from "@/hooks/useProductModal";

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

  useEffect(() => {
    if (id) {
      openProductModal(id);
      // Navegar inmediatamente a /catalogo como fondo activo sin romper la historia
      navigate({ to: "/catalogo", replace: true });
    }
  }, [id, navigate]);

  return null;
}
