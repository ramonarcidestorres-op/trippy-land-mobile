import { useState, useEffect } from "react";
import { Check, Share, PlusSquare, Sparkles, ChevronRight, Lock, Loader2, ArrowDown } from "lucide-react";
import { toast } from "sonner";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { usePushNotifications } from "@/hooks/usePushNotifications";
import { LogoEye } from "@/components/Logo";
import { cn } from "@/lib/utils";

interface OrderNotificationPromptModalProps {
  orderId: string;
  targetUserId?: string;
}

export function OrderNotificationPromptModal({ orderId, targetUserId }: OrderNotificationPromptModalProps) {
  const {
    isSupported,
    needsIOSInstall,
    isIOS,
    isStandalone,
    permission,
    isSubscribed,
    loading,
    subscribe,
  } = usePushNotifications();

  const [isOpen, setIsOpen] = useState(false);
  const [testSent, setTestSent] = useState(false);
  const [testLoading, setTestLoading] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") return;

    // Si ya está suscrito o el permiso fue explícitamente denegado en el navegador, no molestamos con modal automático
    if (isSubscribed || permission === "denied") {
      return;
    }

    // Verificar si ya cerró este prompt en esta sesión para este pedido
    const dismissed = sessionStorage.getItem(`tls_prompt_dismissed_${orderId}`);
    if (dismissed) {
      return;
    }

    // Aparecer automáticamente a los 700ms tras entrar a la pantalla de tracking
    const timer = setTimeout(() => {
      setIsOpen(true);
    }, 700);

    return () => clearTimeout(timer);
  }, [orderId, isSubscribed, permission]);

  const handleClose = () => {
    setIsOpen(false);
    try {
      sessionStorage.setItem(`tls_prompt_dismissed_${orderId}`, "true");
    } catch {
      // ignore
    }
  };

  const handleActivate = async () => {
    const res = await subscribe({ targetUserId, orderId });
    if (res.success) {
      toast.success("Avisos activados con éxito");
    } else if (res.needsIOSInstall) {
      // Ya mostrará la vista de iOS
    } else {
      toast.error(res.error || "No se pudieron activar las notificaciones");
    }
  };

  const handleTestNotification = async () => {
    setTestLoading(true);
    try {
      const reg = await navigator.serviceWorker.ready;
      const sub = await reg.pushManager.getSubscription();
      if (!sub) {
        toast.error("No se encontró suscripción activa.");
        setTestLoading(false);
        return;
      }

      toast.info("⏳ Bloquea tu celular AHORA. La notificación llegará en 4 segundos...", { duration: 5000 });
      setTestSent(true);

      setTimeout(async () => {
        try {
          await fetch("https://cdmoyqxorxecbmqbsafz.supabase.co/functions/v1/send-order-push", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              test: true,
              endpoint: sub.endpoint,
              order_id: orderId,
            }),
          });
        } catch {
          // ignore
        } finally {
          setTestLoading(false);
        }
      }, 4000);
    } catch (err: any) {
      setTestLoading(false);
      toast.error("Error al preparar prueba: " + (err?.message || ""));
    }
  };

  if (!isSupported && !needsIOSInstall) {
    return null;
  }

  return (
    <Dialog open={isOpen} onOpenChange={(open) => {
      if (!open) handleClose();
      else setIsOpen(true);
    }}>
      <DialogContent className="p-5 sm:p-6 border-border/60">
        {/* Caso A: iPhone en Safari regular (Instrucciones visuales para PWA) */}
        {needsIOSInstall && (
          <div className="space-y-4">
            <DialogHeader className="text-left">
              <div className="flex items-center gap-2 text-primary font-bold text-xs uppercase tracking-wider">
                <Sparkles className="size-4" />
                Apple iPhone / Safari
              </div>
              <DialogTitle className="text-[20px] font-extrabold text-foreground pt-1 leading-snug">
                Recibe avisos de tu pedido con tu celular bloqueado
              </DialogTitle>
              <DialogDescription className="text-[13px] text-muted-foreground pt-1.5 leading-relaxed">
                Apple exige que añadas Trippy Land a tu inicio para poder enviarte notificaciones y hacer vibrar tu celular:
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-2.5 pt-1 text-[13px]">
              <div className="flex items-start gap-3 rounded-2xl bg-surface/90 p-3.5 border border-border/40">
                <span className="flex size-7 shrink-0 items-center justify-center rounded-full bg-primary/20 font-extrabold text-primary text-xs">
                  1
                </span>
                <p className="text-foreground leading-snug">
                  Toca el botón <span className="font-bold text-primary">Compartir</span>{" "}
                  <Share className="inline size-4 mx-0.5 text-primary align-text-bottom" /> en la barra inferior de Safari.
                </p>
              </div>

              <div className="flex items-start gap-3 rounded-2xl bg-surface/90 p-3.5 border border-border/40">
                <span className="flex size-7 shrink-0 items-center justify-center rounded-full bg-primary/20 font-extrabold text-primary text-xs">
                  2
                </span>
                <p className="text-foreground leading-snug">
                  Baja en el menú y toca <span className="font-bold">"Añadir a pantalla de inicio"</span>{" "}
                  <PlusSquare className="inline size-4 mx-0.5 text-primary align-text-bottom" />.
                </p>
              </div>

              <div className="flex items-start gap-3 rounded-2xl bg-surface/90 p-3.5 border border-border/40">
                <span className="flex size-7 shrink-0 items-center justify-center rounded-full bg-primary/20 font-extrabold text-primary text-xs">
                  3
                </span>
                <p className="text-foreground leading-snug">
                  Abre Trippy Land desde tu pantalla de inicio y toca <span className="font-bold text-primary">"Activar avisos"</span>.
                </p>
              </div>
            </div>

            <div className="pt-2 flex flex-col gap-2">
              <button
                type="button"
                onClick={handleClose}
                className="flex h-12 w-full items-center justify-center rounded-full bg-primary font-bold text-primary-foreground shadow-sm transition-transform active:scale-95"
              >
                Entendido, voy a añadirla
              </button>
            </div>

            {/* Flecha indicadora animada apuntando a la barra de Safari */}
            <div className="flex items-center justify-center gap-1.5 text-[11px] font-semibold text-muted-foreground animate-bounce pt-1">
              <span>El botón compartir está abajo en tu pantalla</span>
              <ArrowDown className="size-3.5 text-primary" />
            </div>
          </div>
        )}

        {/* Caso B: Android, Computador o iPhone instalado en inicio */}
        {!needsIOSInstall && (
          <div className="space-y-4">
            {!isSubscribed ? (
              <>
                <DialogHeader className="text-center items-center">
                  <div className="flex size-14 items-center justify-center rounded-2xl bg-surface p-3 shadow-inner ring-1 ring-border/50">
                    <LogoEye className="w-10 h-auto text-primary filter drop-shadow-[0_0_10px_rgba(255,252,235,0.25)]" />
                  </div>
                  <DialogTitle className="text-[20px] font-extrabold text-foreground pt-2 leading-snug">
                    ¿Deseas recibir avisos de tu pedido en tiempo real?
                  </DialogTitle>
                  <DialogDescription className="text-[13px] text-muted-foreground pt-1 leading-relaxed">
                    Te notificaremos y <span className="font-bold text-foreground">haremos vibrar tu celular</span> al instante cuando la tienda acepte tu orden, vaya en camino o el repartidor llegue afuera, incluso si tienes el celular bloqueado.
                  </DialogDescription>
                </DialogHeader>

                <div className="flex flex-col gap-2 pt-2">
                  <button
                    type="button"
                    onClick={handleActivate}
                    disabled={loading}
                    className="flex h-12 w-full items-center justify-center gap-2 rounded-full bg-white font-extrabold text-black text-[15px] shadow-lg transition-transform active:scale-95 disabled:opacity-50 hover:bg-[#F2F2F7]"
                  >
                    {loading ? (
                      <Loader2 className="size-5 animate-spin text-black" />
                    ) : (
                      <>
                        <LogoEye className="size-4.5 inline-block text-black" />
                        <span>Activar avisos ahora</span>
                      </>
                    )}
                  </button>

                  <button
                    type="button"
                    onClick={handleClose}
                    className="h-9 text-xs font-semibold text-muted-foreground hover:text-foreground transition-colors"
                  >
                    Quizás más tarde
                  </button>
                </div>
              </>
            ) : (
              <>
                <DialogHeader className="text-center sm:text-left">
                  <div className="mx-auto sm:mx-0 flex size-14 items-center justify-center rounded-3xl bg-emerald-500/15 text-emerald-400 ring-8 ring-emerald-500/10">
                    <Check className="size-7" />
                  </div>
                  <DialogTitle className="text-[22px] font-extrabold text-foreground pt-3 leading-snug">
                    ¡Avisos activados con éxito!
                  </DialogTitle>
                  <DialogDescription className="text-[13px] text-muted-foreground pt-1.5 leading-relaxed">
                    Tu celular ya está vinculado a este pedido. Puedes hacer una prueba ahora mismo para ver cómo vibra y se enciende con la pantalla bloqueada:
                  </DialogDescription>
                </DialogHeader>

                <div className="flex flex-col gap-2.5 pt-2">
                  <button
                    type="button"
                    onClick={handleTestNotification}
                    disabled={testLoading}
                    className="flex h-12 w-full items-center justify-center gap-2 rounded-full bg-surface text-foreground border border-primary/40 font-extrabold shadow-sm transition-transform active:scale-95 disabled:opacity-50 hover:bg-surface-2"
                  >
                    {testLoading ? (
                      <Loader2 className="size-4 animate-spin text-primary" />
                    ) : (
                      <>
                        <Lock className="size-4 text-primary" />
                        <span>{testSent ? "Probar de nuevo" : "Probar con pantalla bloqueada"}</span>
                      </>
                    )}
                  </button>

                  <button
                    type="button"
                    onClick={handleClose}
                    className="flex h-11 w-full items-center justify-center rounded-full bg-primary font-bold text-primary-foreground shadow-sm transition-transform active:scale-95"
                  >
                    Listo, ver seguimiento
                  </button>
                </div>
              </>
            )}
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
