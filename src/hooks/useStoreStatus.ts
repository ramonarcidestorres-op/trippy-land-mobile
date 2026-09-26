import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export function useStoreStatus() {
  const queryClient = useQueryClient();

  const { data: isOpen = true, isLoading } = useQuery({
    queryKey: ["store_status"],
    staleTime: 1000 * 30, // 30 seconds
    queryFn: async (): Promise<boolean> => {
      try {
        const { data, error } = await supabase
          .from("app_config")
          .select("value")
          .eq("key", "store_is_open")
          .maybeSingle();

        if (error) {
          console.warn("Could not fetch store status:", error.message);
          return true; // Default to open if error
        }

        if (!data) return true;
        return data.value === "true" || data.value === true;
      } catch (err) {
        console.error("Error reading store status:", err);
        return true;
      }
    },
  });

  // Listen to realtime changes on app_config with a unique channel ID per component instance
  useEffect(() => {
    const channelId = `store-status-${Math.random().toString(36).substring(2, 9)}`;
    const channel = supabase
      .channel(channelId)
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "app_config" },
        (payload) => {
          const row = (payload.new || payload.old) as { key?: string; value?: string } | undefined;
          if (row?.key === "store_is_open" || !row?.key) {
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
    const targetValue = forcedValue !== undefined ? forcedValue : !isOpen;
    
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
      queryClient.invalidateQueries({ queryKey: ["store_status"] });
      return targetValue;
    } catch (err: any) {
      // Rollback
      queryClient.setQueryData(["store_status"], isOpen);
      toast.error("Error al actualizar estado de la tienda: " + (err?.message || "Intenta de nuevo"));
      return isOpen;
    }
  };

  return {
    isOpen,
    isLoading,
    toggleStoreStatus,
  };
}
