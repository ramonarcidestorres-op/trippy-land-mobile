import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";

export const VAPID_PUBLIC_KEY = "BOYL9RtuGiIigziik4eue0JR3egVG2m-Tw-XgQPnIctY-w9mpiJSlzywqVNRoI4MN_hkCKaNCvmZR0fSpSKLJmE";

function urlBase64ToUint8Array(base64String: string): Uint8Array {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/");
  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);
  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}

export function usePushNotifications() {
  const { user } = useAuth();
  const [isSupported, setIsSupported] = useState<boolean>(false);
  const [isIOS, setIsIOS] = useState<boolean>(false);
  const [isStandalone, setIsStandalone] = useState<boolean>(false);
  const [permission, setPermission] = useState<NotificationPermission>("default");
  const [isSubscribed, setIsSubscribed] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(false);

  useEffect(() => {
    if (typeof window === "undefined") return;

    const supported =
      "serviceWorker" in navigator &&
      "PushManager" in window &&
      "Notification" in window;
    setIsSupported(supported);

    const ios = /iPad|iPhone|iPod/.test(navigator.userAgent) && !(window as any).MSStream;
    setIsIOS(ios);

    const standalone =
      window.matchMedia("(display-mode: standalone)").matches ||
      Boolean((navigator as any).standalone);
    setIsStandalone(standalone);

    if ("Notification" in window) {
      setPermission(Notification.permission);
    }

    // Verificar si ya está suscrito
    if (supported) {
      navigator.serviceWorker.ready.then((reg) => {
        reg.pushManager.getSubscription().then((sub) => {
          setIsSubscribed(Boolean(sub));
        });
      }).catch(() => {});
    }
  }, []);

  const subscribe = useCallback(
    async (
      options?: string | { targetUserId?: string; orderId?: string }
    ): Promise<{ success: boolean; error?: string; needsIOSInstall?: boolean }> => {
      if (typeof window === "undefined") return { success: false, error: "Navegador no disponible" };

      const targetUserId = typeof options === "string" ? options : options?.targetUserId;
      const orderId = typeof options === "object" ? options?.orderId : undefined;

      // En iOS, las notificaciones web push requieren que la web esté añadida a la pantalla de inicio
      if (isIOS && !isStandalone) {
        return { success: false, needsIOSInstall: true };
      }

      if (!isSupported) {
        return { success: false, error: "Tu navegador no soporta notificaciones push" };
      }

      setLoading(true);
      try {
        // 1. Solicitar permiso al usuario
        const perm = await Notification.requestPermission();
        setPermission(perm);

        if (perm !== "granted") {
          setLoading(false);
          return { success: false, error: "Permiso de notificaciones no concedido" };
        }

        // 2. Registrar y esperar el Service Worker
        await navigator.serviceWorker.register("/sw.js");
        const reg = await navigator.serviceWorker.ready;

        // 3. Crear suscripción Web Push con la clave pública VAPID
        const convertedVapidKey = urlBase64ToUint8Array(VAPID_PUBLIC_KEY);
        let sub = await reg.pushManager.getSubscription();

        if (!sub) {
          sub = await reg.pushManager.subscribe({
            userVisibleOnly: true,
            applicationServerKey: convertedVapidKey,
          });
        }

        const jsonSub = sub.toJSON();
        const p256dh = jsonSub.keys?.p256dh;
        const authKey = jsonSub.keys?.auth;

        if (!p256dh || !authKey) {
          throw new Error("No se pudieron obtener las claves criptográficas de la suscripción");
        }

        const effectiveUserId = targetUserId || user?.id || null;

        // 4. Guardar suscripción en Supabase (soporta usuario y/o pedido)
        const payload: Record<string, unknown> = {
          endpoint: sub.endpoint,
          p256dh,
          auth: authKey,
          user_id: effectiveUserId,
        };

        if (orderId) {
          payload.order_id = orderId;
        }

        const { error: dbErr } = await supabase
          .from("push_subscriptions")
          .upsert(payload, { onConflict: "endpoint" });

        if (dbErr) {
          throw new Error(dbErr.message);
        }

        setIsSubscribed(true);
        setLoading(false);
        return { success: true };
      } catch (e: any) {
        setLoading(false);
        return { success: false, error: e?.message || "Error al activar notificaciones" };
      }
    },
    [isIOS, isStandalone, isSupported, user?.id]
  );

  const unsubscribe = useCallback(async (): Promise<{ success: boolean; error?: string }> => {
    if (!isSupported) return { success: false };

    setLoading(true);
    try {
      const reg = await navigator.serviceWorker.ready;
      const sub = await reg.pushManager.getSubscription();

      if (sub) {
        await supabase.from("push_subscriptions").delete().eq("endpoint", sub.endpoint);
        await sub.unsubscribe();
      }

      setIsSubscribed(false);
      setLoading(false);
      return { success: true };
    } catch (e: any) {
      setLoading(false);
      return { success: false, error: e?.message || "Error al desactivar notificaciones" };
    }
  }, [isSupported]);

  return {
    isSupported,
    isIOS,
    isStandalone,
    needsIOSInstall: isIOS && !isStandalone,
    permission,
    isSubscribed,
    loading,
    subscribe,
    unsubscribe,
  };
}
