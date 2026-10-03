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

    const dismissed =
      localStorage.getItem("tls_app_push_dismissed") ||
      sessionStorage.getItem("tls_app_push_dismissed");
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
      localStorage.setItem("tls_app_push_dismissed", "true");
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
      <DialogContent className="p-6 sm:p-7 border-white/15 max-w-md w-full bg-[#0e0e0e] text-white rounded-[32px] shadow-[0_20px_60px_rgba(0,0,0,0.8)] overflow-hidden">
        {/* Luz ambiental sutil */}
        <div className="pointer-events-none absolute -top-12 left-1/2 -translate-x-1/2 size-44 rounded-full bg-white/[0.07] blur-3xl" />

        {/* Caso A: iPhone en Safari regular (Instrucciones visuales para PWA) */}
        {needsIOSInstall && (
          <div className="relative z-10 space-y-4">
            <DialogHeader className="text-left space-y-2">
              <div>
                <span className="inline-block rounded-lg border border-white/15 bg-white/[0.06] px-2.5 py-0.5 text-[10px] font-bold tracking-wider text-[#E5E5EA] uppercase backdrop-blur-md">
                  Avisos en iPhone
                </span>
              </div>
              <DialogTitle className="text-[22px] font-extrabold text-white pt-1 leading-snug tracking-tight">
                Recibe avisos de tu pedido con tu celular bloqueado
              </DialogTitle>
              <DialogDescription className="text-[12.5px] text-[#8E8E93] leading-relaxed">
                Apple exige que agregues Trippy Land a tu inicio para poder enviarte notificaciones y hacer vibrar tu celular:
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-2.5 pt-1 text-[13px]">
              <div className="flex items-start gap-3 rounded-2xl bg-white/[0.04] p-3.5 border border-white/10 backdrop-blur-sm">
                <span className="flex size-7 shrink-0 items-center justify-center rounded-full bg-white text-black font-black text-xs shadow-md">
                  1
                </span>
                <p className="text-[#EDEDED] leading-snug pt-0.5">
                  Toca el botón <span className="font-bold text-white">Compartir</span>{" "}
                  <Share className="inline size-4 mx-0.5 text-[#fffceb] align-text-bottom" /> en la barra inferior de Safari.
                </p>
              </div>

              <div className="flex items-start gap-3 rounded-2xl bg-white/[0.04] p-3.5 border border-white/10 backdrop-blur-sm">
                <span className="flex size-7 shrink-0 items-center justify-center rounded-full bg-white text-black font-black text-xs shadow-md">
                  2
                </span>
                <p className="text-[#EDEDED] leading-snug pt-0.5">
                  Baja en el menú y toca <span className="font-bold text-white">"Añadir a pantalla de inicio"</span>{" "}
                  <PlusSquare className="inline size-4 mx-0.5 text-[#fffceb] align-text-bottom" />.
                </p>
              </div>

              <div className="flex items-start gap-3 rounded-2xl bg-white/[0.04] p-3.5 border border-white/10 backdrop-blur-sm">
                <span className="flex size-7 shrink-0 items-center justify-center rounded-full bg-white text-black font-black text-xs shadow-md">
                  3
                </span>
                <p className="text-[#EDEDED] leading-snug pt-0.5">
                  Abre Trippy Land desde tu pantalla de inicio y toca <span className="font-bold text-white">"Activar avisos"</span>.
                </p>
              </div>
            </div>

            <div className="pt-2 flex flex-col gap-2">
              <button
                type="button"
                onClick={handleClose}
                className="flex h-13 w-full items-center justify-center rounded-full bg-white text-black font-extrabold text-[15px] shadow-[0_10px_30px_rgba(255,255,255,0.2)] transition-transform active:scale-[0.98] cursor-pointer hover:bg-[#F2F2F7]"
              >
                Entendido, voy a añadirla
              </button>
            </div>

            <div className="flex items-center justify-center gap-1.5 text-[11px] font-semibold text-[#8E8E93] animate-bounce pt-1">
              <span>El botón compartir está abajo en tu pantalla</span>
              <ArrowDown className="size-3.5 text-white" />
            </div>
          </div>
        )}

        {/* Caso B: Android, Computador o iPhone instalado en pantalla de inicio */}
        {!needsIOSInstall && (
          <div className="relative z-10 space-y-4">
            {!isSubscribed ? (
              <>
                <DialogHeader className="text-center items-center space-y-2">
                  <div className="flex size-14 items-center justify-center rounded-2xl bg-white/[0.06] p-3 shadow-inner border border-white/15">
                    <LogoEye className="w-10 h-auto text-[#fffceb] filter drop-shadow-[0_0_10px_rgba(255,252,235,0.25)]" />
                  </div>
                  <DialogTitle className="text-[22px] font-extrabold text-white pt-1 leading-snug tracking-tight">
                    ¿Deseas recibir avisos de tu pedido en tiempo real?
                  </DialogTitle>
                  <DialogDescription className="text-[13px] text-[#8E8E93] leading-relaxed">
                    Te notificaremos y <span className="font-bold text-white">haremos vibrar tu celular</span> al instante cuando la tienda acepte tu orden, vaya en camino o el repartidor llegue afuera.
                  </DialogDescription>
                </DialogHeader>

                <div className="flex flex-col gap-2 pt-2">
                  <button
                    type="button"
                    onClick={handleActivate}
                    disabled={loading}
                    className="flex h-13 w-full items-center justify-center gap-2 rounded-full bg-white font-extrabold text-black text-[15px] shadow-[0_10px_30px_rgba(255,255,255,0.2)] transition-transform active:scale-[0.98] disabled:opacity-50 hover:bg-[#F2F2F7] cursor-pointer"
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
                    className="h-9 text-xs font-semibold text-[#8E8E93] hover:text-white transition-colors cursor-pointer"
                  >
                    Quizás más tarde
                  </button>
                </div>
              </>
            ) : (
              <>
                <DialogHeader className="text-center sm:text-left space-y-2">
                  <div className="mx-auto sm:mx-0 flex size-14 items-center justify-center rounded-2xl bg-emerald-500/15 text-emerald-400 ring-4 ring-emerald-500/10 border border-emerald-500/30">
                    <Check className="size-7" />
                  </div>
                  <DialogTitle className="text-[22px] font-extrabold text-white pt-2 leading-snug tracking-tight">
                    Avisos activados con éxito
                  </DialogTitle>
                  <DialogDescription className="text-[13px] text-[#8E8E93] leading-relaxed">
                    Tu celular recibirá alertas en pantalla bloqueada con sonido y vibración cada vez que haya novedades sobre tus pedidos.
                  </DialogDescription>
                </DialogHeader>

                <button
                  type="button"
                  onClick={handleClose}
                  className="flex h-12 w-full items-center justify-center rounded-full bg-white text-black font-extrabold text-sm transition-transform active:scale-95 cursor-pointer hover:bg-[#F2F2F7]"
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
