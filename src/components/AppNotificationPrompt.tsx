import { useState, useEffect } from "react";
import { Check, Share, PlusSquare, Sparkles, Loader2, ArrowDown } from "lucide-react";
import { toast } from "sonner";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { usePushNotifications } from "@/hooks/usePushNotifications";
import { LogoEye } from "@/components/Logo";

export function AppNotificationPrompt() {
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

  useEffect(() => {
    if (typeof window === "undefined") return;

    if (isSubscribed || permission === "denied") {
      return;
    }

    const dismissed = sessionStorage.getItem("tls_app_push_dismissed");
    if (dismissed) {
      return;
    }

    const checkAndShow = (delayMs = 1500) => {
      const completed = localStorage.getItem("tls_onboarding_completed");
      // Si el onboarding aún no se completa, esperar al evento
      if (completed !== "true") {
        return;
      }
      const timer = setTimeout(() => {
        setIsOpen(true);
      }, delayMs);
      return timer;
    };

    const initialTimer = checkAndShow(1500);

    const handleOnboardingDone = () => {
      setTimeout(() => {
        setIsOpen(true);
      }, 1500);
    };

    window.addEventListener("tls_onboarding_done", handleOnboardingDone);

    return () => {
      if (initialTimer) clearTimeout(initialTimer);
      window.removeEventListener("tls_onboarding_done", handleOnboardingDone);
    };
  }, [isSubscribed, permission]);

  const handleClose = () => {
    setIsOpen(false);
    try {
      sessionStorage.setItem("tls_app_push_dismissed", "true");
    } catch {
      // ignore
    }
  };

  const handleActivate = async () => {
    // Si hay un pedido reciente en localStorage, vincularlo
    let recentOrderId: string | undefined;
    try {
      const orders = JSON.parse(localStorage.getItem("tls_my_orders") || "[]");
      if (Array.isArray(orders) && orders.length > 0) {
        recentOrderId = orders[0];
      }
    } catch {
      // ignore
    }

    const res = await subscribe({ orderId: recentOrderId });
    if (res.success) {
      toast.success("Avisos activados con éxito");
      setIsOpen(false);
    } else if (res.needsIOSInstall) {
      // Mostrará instrucciones de iOS
    } else {
      toast.error(res.error || "No se pudieron activar las notificaciones");
    }
  };

  if (!isSupported && !needsIOSInstall) {
    return null;
  }

  return (
    <Dialog
      open={isOpen}
      onOpenChange={(open) => {
        if (!open) handleClose();
        else setIsOpen(true);
      }}
    >
      <DialogContent className="max-w-md rounded-[32px] bg-surface-2/95 border-border/60 p-6 shadow-2xl backdrop-blur-xl">
        {/* Caso A: iPhone en Safari regular (Instrucciones visuales para PWA) */}
        {needsIOSInstall && (
          <div className="space-y-4">
            <DialogHeader className="text-left">
              <div className="flex items-center gap-2 text-primary font-bold text-xs uppercase tracking-wider">
                <LogoEye className="size-5 inline-block" />
                <span>Trippy Land Store</span>
              </div>
              <DialogTitle className="text-[20px] font-extrabold text-foreground pt-1 leading-snug">
                Recibe avisos de tu pedido con tu celular bloqueado
              </DialogTitle>
              <DialogDescription className="text-[13px] text-muted-foreground pt-1.5 leading-relaxed">
                Apple exige que agregues Trippy Land a tu inicio para poder enviarte notificaciones y hacer vibrar tu celular:
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

            <div className="flex items-center justify-center gap-1.5 text-[11px] font-semibold text-muted-foreground animate-bounce pt-1">
              <span>El botón compartir está abajo en tu pantalla</span>
              <ArrowDown className="size-3.5 text-primary" />
            </div>
          </div>
        )}

        {/* Caso B: Android, Computador o iPhone instalado en pantalla de inicio */}
        {!needsIOSInstall && (
          <div className="space-y-4">
            {!isSubscribed ? (
              <>
                <DialogHeader className="text-center sm:text-left">
                  <div className="mx-auto sm:mx-0 flex size-16 items-center justify-center rounded-3xl bg-surface-2 p-3 shadow-inner ring-1 ring-border/50">
                    <LogoEye className="w-12 h-auto text-primary filter drop-shadow-[0_0_12px_rgba(255,252,235,0.25)]" />
                  </div>
                  <DialogTitle className="text-[22px] font-extrabold text-foreground pt-3 leading-snug">
                    ¿Deseas recibir avisos de tu pedido en tiempo real?
                  </DialogTitle>
                  <DialogDescription className="text-[13px] text-muted-foreground pt-1.5 leading-relaxed">
                    Te notificaremos y <span className="font-bold text-foreground">haremos vibrar tu celular</span> al instante cuando la tienda acepte tu orden, vaya en camino o el repartidor llegue afuera, incluso si tienes el celular bloqueado.
                  </DialogDescription>
                </DialogHeader>

                <div className="flex flex-col gap-2.5 pt-2">
                  <button
                    type="button"
                    onClick={handleActivate}
                    disabled={loading}
                    className="flex h-12 w-full items-center justify-center gap-2 rounded-full bg-primary font-extrabold text-primary-foreground shadow-lg shadow-primary/25 transition-transform active:scale-95 disabled:opacity-50"
                  >
                    {loading ? (
                      <Loader2 className="size-5 animate-spin" />
                    ) : (
                      <>
                        <LogoEye className="size-5 inline-block" />
                        <span>Activar avisos ahora</span>
                      </>
                    )}
                  </button>

                  <button
                    type="button"
                    onClick={handleClose}
                    className="h-10 text-xs font-semibold text-muted-foreground hover:text-foreground transition-colors"
                  >
                    Quizás más tarde
                  </button>
                </div>
              </>
            ) : (
              <>
                <DialogHeader className="text-center sm:text-left">
                  <div className="mx-auto sm:mx-0 flex size-16 items-center justify-center rounded-3xl bg-emerald-500/15 text-emerald-400 ring-8 ring-emerald-500/10">
                    <Check className="size-8" />
                  </div>
                  <DialogTitle className="text-[22px] font-extrabold text-foreground pt-3 leading-snug">
                    Avisos activados con éxito
                  </DialogTitle>
                  <DialogDescription className="text-[13px] text-muted-foreground pt-1.5 leading-relaxed">
                    Tu celular recibirá alertas en pantalla bloqueada con sonido y vibración cada vez que haya novedades sobre tus pedidos.
                  </DialogDescription>
                </DialogHeader>

                <button
                  type="button"
                  onClick={handleClose}
                  className="flex h-11 w-full items-center justify-center rounded-full bg-surface-2 font-bold text-foreground transition-colors hover:bg-surface"
                >
                  Continuar
                </button>
              </>
            )}
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
