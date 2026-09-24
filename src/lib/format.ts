export function formatPrice(value: number | string | null | undefined): string {
  const n = typeof value === "string" ? Number(value) : (value ?? 0);
  return new Intl.NumberFormat("es-CO", {
    style: "currency",
    currency: "COP",
    maximumFractionDigits: 0,
  }).format(Number.isFinite(n) ? n : 0);
}

export function formatDate(value: string): string {
  return new Intl.DateTimeFormat("es-CO", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value));
}

export function formatRelativeTime(value: string): string {
  const date = new Date(value);
  const now = new Date();
  const diffSec = Math.floor((now.getTime() - date.getTime()) / 1000);
  if (diffSec < 60) return "Hace un momento";
  const diffMin = Math.floor(diffSec / 60);
  if (diffMin < 60) return `Hace ${diffMin} min`;
  const diffHour = Math.floor(diffMin / 60);
  if (diffHour < 24) return `Hace ${diffHour} h`;
  const diffDay = Math.floor(diffHour / 24);
  return `Hace ${diffDay} d`;
}

/** Valores reales del CHECK constraint orders_status_check en Supabase. */
export const ORDER_STATUSES = [
  "pending",
  "accepted",
  "in_transit",
  "arrived",
  "delivered",
] as const;

export type OrderStatus = (typeof ORDER_STATUSES)[number] | "cancelled" | "preparing" | "ready" | "dispatched";

export const STATUS_LABELS: Record<string, string> = {
  pending: "Recibido",
  accepted: "Tienda Aceptó",
  preparing: "En preparación",
  in_transit: "En camino",
  dispatched: "Despachado",
  arrived: "Llegó",
  delivered: "Entregado",
  cancelled: "Cancelado",
};
