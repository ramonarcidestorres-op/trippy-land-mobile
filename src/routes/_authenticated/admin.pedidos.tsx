import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { MapPin, Search, Filter } from "lucide-react";
import { AppShell } from "@/components/AppShell";
import { EmptyState, ErrorState } from "@/components/States";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/useAuth";
import { allOrdersQuery } from "@/lib/queries";
import { supabase } from "@/integrations/supabase/client";
import { formatDate, formatPrice, ORDER_STATUSES, STATUS_LABELS } from "@/lib/format";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/_authenticated/admin/pedidos")({
  head: () => ({
    meta: [{ title: "Administración de Pedidos" }],
  }),
  component: AdminPedidosPage,
});

function AdminPedidosPage() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const { data: orders, isLoading, error, refetch } = useQuery(allOrdersQuery());
  const [filter, setFilter] = useState<string>("all");

  useEffect(() => {
    const channel = supabase
      .channel("admin-orders-all")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "orders" },
        () => {
          queryClient.invalidateQueries({ queryKey: ["admin_orders"] });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [queryClient]);

  if (user?.role !== "admin") {
    return (
      <AppShell>
        <EmptyState
          icon={<Filter className="size-7" />}
          title="Acceso denegado"
          description="Necesitas permisos de administrador para ver esta página."
        />
      </AppShell>
    );
  }

  if (isLoading) {
    return (
      <AppShell>
        <div className="space-y-4">
          <div className="h-10 animate-pulse rounded-2xl bg-surface-2" />
          <div className="h-24 animate-pulse rounded-2xl bg-surface-2" />
          <div className="h-24 animate-pulse rounded-2xl bg-surface-2" />
        </div>
      </AppShell>
    );
  }

  if (error) {
    return (
      <AppShell>
        <ErrorState error={error} onRetry={() => refetch()} />
      </AppShell>
    );
  }

  const filteredOrders = orders?.filter((o) => filter === "all" || o.status === filter) ?? [];

  async function updateStatus(orderId: string, newStatus: string, currentStatus: string) {
    const currentIndex = ORDER_STATUSES.indexOf(currentStatus as any);
    const newIndex = ORDER_STATUSES.indexOf(newStatus as any);

    if (currentStatus === "cancelled") {
      toast.error("No se puede cambiar el estado de un pedido cancelado.");
      return;
    }
    if (newStatus !== "cancelled" && newIndex <= currentIndex) {
      toast.error("No se puede retroceder a un estado anterior.");
      return;
    }

    let cancelReason = null;
    if (newStatus === "cancelled") {
      const reason = prompt("¿Motivo de cancelación?");
      if (!reason) return;
      cancelReason = reason;
    }

    const { error } = await supabase
      .from("orders")
      .update({ status: newStatus, cancel_reason: cancelReason })
      .eq("id", orderId);

    if (error) {
      toast.error(error.message);
    } else {
      toast.success("Estado actualizado con éxito");
      queryClient.invalidateQueries({ queryKey: ["admin_orders"] });
    }
  }

  return (
    <AppShell>
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-xl font-bold">Gestión de Pedidos</h1>
      </div>

      <div className="mb-4 flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
        <button
          onClick={() => setFilter("all")}
          className={cn(
            "rounded-full px-4 py-1.5 text-sm font-medium whitespace-nowrap",
            filter === "all" ? "bg-primary text-primary-foreground" : "bg-surface-2 text-muted-foreground"
          )}
        >
          Todos
        </button>
        {ORDER_STATUSES.map((status) => (
          <button
            key={status}
            onClick={() => setFilter(status)}
            className={cn(
              "rounded-full px-4 py-1.5 text-sm font-medium whitespace-nowrap",
              filter === status ? "bg-primary text-primary-foreground" : "bg-surface-2 text-muted-foreground"
            )}
          >
            {STATUS_LABELS[status]}
          </button>
        ))}
        <button
          onClick={() => setFilter("cancelled")}
          className={cn(
            "rounded-full px-4 py-1.5 text-sm font-medium whitespace-nowrap",
            filter === "cancelled" ? "bg-destructive text-destructive-foreground" : "bg-surface-2 text-muted-foreground"
          )}
        >
          Cancelados
        </button>
      </div>

      <div className="space-y-4">
        {filteredOrders.length === 0 ? (
          <EmptyState
            icon={<Search className="size-7" />}
            title="Sin resultados"
            description="No hay pedidos con este filtro."
          />
        ) : (
          filteredOrders.map((order) => {
            const isCancelled = order.status === "cancelled";

            return (
              <div key={order.id} className="rounded-2xl border border-border/60 bg-card p-4">
                <div className="flex justify-between items-start mb-3">
                  <div>
                    <h3 className="font-bold text-sm">Pedido #{order.id.slice(0, 8).toUpperCase()}</h3>
                    <p className="text-xs text-muted-foreground">{formatDate(order.created_at)}</p>
                  </div>
                  <div className="text-right">
                    <p className="font-bold text-candy-lime">{formatPrice(order.total)}</p>
                    <span className={cn(
                      "text-xs px-2 py-0.5 rounded-full font-medium inline-block mt-1",
                      isCancelled ? "bg-destructive/20 text-destructive" :
                      order.status === "delivered" ? "bg-success/20 text-success" :
                      "bg-primary/20 text-primary"
                    )}>
                      {isCancelled ? "Cancelado" : STATUS_LABELS[order.status as keyof typeof STATUS_LABELS]}
                    </span>
                  </div>
                </div>

                <div className="bg-surface-2 rounded-xl p-3 mb-4 flex items-start gap-2">
                  <MapPin className="size-4 shrink-0 mt-0.5 text-muted-foreground" />
                  <p className="text-sm">{order.delivery_address}</p>
                </div>

                <div className="flex gap-2 flex-wrap">
                  {order.status === "pending" && (
                    <>
                      <Button size="sm" className="flex-1 bg-primary text-primary-foreground hover:bg-primary/90" onClick={() => updateStatus(order.id, "preparing", order.status)}>
                        Aceptar Pedido
                      </Button>
                      <Button size="sm" variant="destructive" className="flex-1" onClick={() => updateStatus(order.id, "cancelled", order.status)}>
                        Rechazar
                      </Button>
                    </>
                  )}
                  {order.status === "preparing" && (
                    <Button size="sm" className="w-full candy-gradient text-primary-foreground" onClick={() => updateStatus(order.id, "dispatched", order.status)}>
                      Marcar como Despachado
                    </Button>
                  )}
                  {order.status === "dispatched" && (
                    <Button size="sm" className="w-full bg-success hover:bg-success/90 text-success-foreground" onClick={() => updateStatus(order.id, "delivered", order.status)}>
                      Marcar como Entregado
                    </Button>
                  )}
                  {!isCancelled && order.status !== "pending" && order.status !== "delivered" && (
                     <Button size="sm" variant="outline" className="w-full mt-2 border-destructive text-destructive hover:bg-destructive/10" onClick={() => updateStatus(order.id, "cancelled", order.status)}>
                      Cancelar
                    </Button>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>
    </AppShell>
  );
}
