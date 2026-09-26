import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export function useStoreStatus() {
  const queryClient = useQueryClient();
  const [isToggling, setIsToggling] = useState(false);

  const { data: isOpen = true, isLoading } = useQuery({
    queryKey: ["store_status"],
    staleTime: 1000 * 15,
    queryFn: async (): Promise<boolean> => {
      try {
        const { data, error } = await supabase
          .from("app_config")
          .select("value")
          .eq("key", "store_is_open")
          .maybeSingle();

        if (error) {
          console.warn("Could not fetch store status:", error.message);
          return true;
        }

        if (!data) return true;
        return data.value === "true" || data.value === true;
      } catch (err) {
        console.error("Error reading store status:", err);
        return true;
      }
    },
  });

  // Listen to realtime changes on app_config
  useEffect(() => {
    const channelId = `store-status-${Math.random().toString(36).substring(2, 9)}`;
    const channel = supabase
      .channel(channelId)
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "app_config" },
        (payload) => {
          const newRow = payload.new as { key?: string; value?: string } | undefined;
          if (newRow?.key === "store_is_open") {
            const newVal = newRow.value === "true" || (newRow.value as unknown) === true;
            queryClient.setQueryData(["store_status"], newVal);
          } else {
            queryClient.invalidateQueries({ queryKey: ["store_status"] });
          }
        }
      );

    channel.subscribe();

    return () => {
      try {
        supabase.removeChannel(channel);
      } catch {
        // ignore cleanup error
      }
    };
  }, [queryClient]);

  const toggleStoreStatus = async (forcedValue?: boolean) => {
    if (isToggling) return isOpen;
    const targetValue = forcedValue !== undefined ? forcedValue : !isOpen;
    
    setIsToggling(true);
    // Optimistic update
    queryClient.setQueryData(["store_status"], targetValue);

    try {
      const { error } = await supabase.from("app_config").upsert(
        {
          key: "store_is_open",
          value: String(targetValue),
        },
        { onConflict: "key" }
      );

      if (error) throw error;

      toast.success(
        targetValue
          ? "🟢 Tienda ABIERTA — Ahora los clientes pueden pedir"
          : "🔴 Tienda CERRADA — Se mostrará el aviso a los clientes"
      );
      queryClient.setQueryData(["store_status"], targetValue);
      return targetValue;
    } catch (err: any) {
      // Rollback
      queryClient.setQueryData(["store_status"], isOpen);
      toast.error("Error al actualizar estado de la tienda: " + (err?.message || "Intenta de nuevo"));
      return isOpen;
    } finally {
      setIsToggling(false);
    }
  };

  return {
    isOpen,
    isLoading,
    isToggling,
    toggleStoreStatus,
  };
}

