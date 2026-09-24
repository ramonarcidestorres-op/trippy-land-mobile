import { useState, useEffect } from "react";
import { Bell, BellOff, BellRing, Check, Share, PlusSquare, X, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { usePushNotifications } from "@/hooks/usePushNotifications";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { cn } from "@/lib/utils";

interface PushNotificationButtonProps {
  variant: "admin" | "customer";
  targetUserId?: string;
  orderId?: string;
  className?: string;
}

export function PushNotificationButton({ variant, targetUserId, orderId, className }: PushNotificationButtonProps) {
  const {
    isSupported,
    needsIOSInstall,
    permission,
    isSubscribed,
    loading,
    subscribe,
    unsubscribe,
  } = usePushNotifications();

  const [showIOSModal, setShowIOSModal] = useState(false);

  // Si el usuario ya había otorgado permisos en su navegador, registrar automáticamente este pedido
  useEffect(() => {
    if (permission === "granted" && !isSubscribed) {
      subscribe({ targetUserId, orderId, role: variant }).catch(() => {});
    }
  }, [orderId, permission, isSubscribed, subscribe, targetUserId, variant]);

  const handleTestPush = async (e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      const reg = await navigator.serviceWorker.ready;
      const sub = await reg.pushManager.getSubscription();
      if (!sub) {
        toast.error("No se encontró suscripción activa en este navegador.");
        return;
      }
      toast.info("⏳ Bloquea tu celular AHORA. La notificación llegará en 4 segundos...", { duration: 5000 });
      setTimeout(async () => {
        try {
          await fetch("https://cdmoyqxorxecbmqbsafz.supabase.co/functions/v1/send-order-push", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              test: true,
              endpoint: sub.endpoint,
              order_id: orderId,
              role: variant,
            }),
          });
        } catch {
          // ignore
        }
      }, 4000);
    } catch (err: any) {
      toast.error("Error al preparar prueba: " + (err?.message || ""));
    }
  };

  const handleToggle = async () => {
    if (isSubscribed) {
      const res = await unsubscribe();
      if (res.success) {
        toast.info("Avisos desactivados");
      } else {
        toast.error(res.error || "No se pudo desactivar");
      }
      return;
    }

    if (needsIOSInstall) {
      setShowIOSModal(true);
      return;
    }

    const res = await subscribe({ targetUserId, orderId, role: variant });
    if (res.success) {
      toast.success(
        variant === "admin"
          ? "🔔 ¡Avisos de pedidos activados con éxito!"
          : "🔔 ¡Avisos de tu pedido activados con éxito!"
      );
    } else if (res.needsIOSInstall) {
      setShowIOSModal(true);
    } else {
      toast.error(res.error || "No se pudieron activar las notificaciones");
    }
  };

  if (!isSupported && !needsIOSInstall) {
    return null; // El navegador no soporta Push (ej. WebViews antiguas)
  }

  const label = isSubscribed
    ? variant === "admin"
      ? "Avisos activos"
      : "Avisos de pedido activos"
    : variant === "admin"
    ? "Activar avisos de pedidos"
    : "Activar avisos de mi pedido";

  return (
    <>
      <button
        type="button"
        onClick={handleToggle}
        disabled={loading || permission === "denied"}
        className={cn(
          "inline-flex items-center justify-center gap-2 rounded-2xl px-4 py-2.5 text-xs font-bold transition-all active:scale-95 disabled:opacity-50",
          isSubscribed
            ? "bg-primary/15 text-primary border border-primary/30 hover:bg-primary/20"
            : "bg-surface-2/90 text-foreground border border-border/40 hover:bg-surface-2",
          className
        )}
      >
        {loading ? (
          <Loader2 className="size-4 animate-spin text-primary" />
        ) : isSubscribed ? (
          <>
            <BellRing className="size-4 text-primary" />
            <span>{label}</span>
            <Check className="size-3.5 text-primary ml-0.5" />
            <span
              role="button"
              onClick={handleTestPush}
              className="ml-1 rounded-lg bg-primary/25 px-2 py-0.5 text-[10px] font-extrabold uppercase text-primary hover:bg-primary/40 active:scale-90 transition-all"
              title="Toca y bloquea tu celular para probar"
            >
              Probar
            </span>
          </>
        ) : (
          <>
            <Bell className="size-4 text-primary" />
            <span>{label}</span>
          </>
        )}
      </button>

      {/* Modal de instrucciones para iPhone / iOS */}
      <Dialog open={showIOSModal} onOpenChange={setShowIOSModal}>
        <DialogContent className="max-w-sm rounded-[32px] bg-surface-2 border-border p-6 shadow-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-[18px] font-extrabold text-foreground">
              <PlusSquare className="size-5 text-primary" />
              Añade a Pantalla de Inicio
            </DialogTitle>
            <DialogDescription className="text-[13px] text-muted-foreground pt-1">
              En iPhone, Apple requiere que agregues la app a tu pantalla de inicio para poder enviarte notificaciones en segundo plano:
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-3.5 pt-3 text-[13px]">
            <div className="flex items-start gap-3 rounded-2xl bg-surface p-3 border border-border/30">
              <span className="flex size-6 shrink-0 items-center justify-center rounded-full bg-primary/20 font-bold text-primary text-xs">
                1
              </span>
              <p className="text-foreground">
                Toca el botón <span className="font-bold">Compartir</span> <Share className="inline size-4 mx-0.5 text-primary" /> en la barra inferior de Safari.
              </p>
            </div>

            <div className="flex items-start gap-3 rounded-2xl bg-surface p-3 border border-border/30">
              <span className="flex size-6 shrink-0 items-center justify-center rounded-full bg-primary/20 font-bold text-primary text-xs">
                2
              </span>
              <p className="text-foreground">
                Baja y selecciona <span className="font-bold">"Añadir a pantalla de inicio"</span>.
              </p>
            </div>

            <div className="flex items-start gap-3 rounded-2xl bg-surface p-3 border border-border/30">
              <span className="flex size-6 shrink-0 items-center justify-center rounded-full bg-primary/20 font-bold text-primary text-xs">
                3
              </span>
              <p className="text-foreground">
                Abre Trippy Land desde tu pantalla de inicio y toca <span className="font-bold text-primary">"Activar avisos"</span>.
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={() => setShowIOSModal(false)}
            className="mt-4 flex h-12 w-full items-center justify-center rounded-full bg-primary font-bold text-primary-foreground shadow-sm transition-transform active:scale-95"
          >
            Entendido
          </button>
        </DialogContent>
      </Dialog>
    </>
  );
}
