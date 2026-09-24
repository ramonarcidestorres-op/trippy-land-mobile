import { useState, useEffect } from "react";
import { BellRing, Check, Share, PlusSquare, Sparkles, Lock, Loader2, ArrowDown, ShieldAlert } from "lucide-react";
import { toast } from "sonner";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { usePushNotifications } from "@/hooks/usePushNotifications";

export function AdminNotificationPromptModal() {
  const {
    isSupported,
    needsIOSInstall,
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

    if (isSubscribed || permission === "denied") {
      return;
    }

    const dismissed = sessionStorage.getItem("tls_admin_prompt_dismissed");
    if (dismissed) {
      return;
    }

    const timer = setTimeout(() => {
      setIsOpen(true);
    }, 800);

    return () => clearTimeout(timer);
  }, [isSubscribed, permission]);

  const handleClose = () => {
    setIsOpen(false);
    try {
      sessionStorage.setItem("tls_admin_prompt_dismissed", "true");
    } catch {
      // ignore
    }
  };

  const handleActivate = async () => {
    const res = await subscribe({ role: "admin" });
    if (res.success) {
      toast.success("🔔 ¡Alertas de nuevos pedidos activadas!");
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
              role: "admin",
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
      <DialogContent className="max-w-md rounded-[32px] bg-surface-2/95 border-border/60 p-6 shadow-2xl backdrop-blur-xl">
        {/* Caso A: iPhone Safari regular (PWA) */}
        {needsIOSInstall && (
          <div className="space-y-4">
            <DialogHeader className="text-left">
              <div className="flex items-center gap-2 text-primary font-bold text-xs uppercase tracking-wider">
                <Sparkles className="size-4" />
                Panel Admin en iPhone
              </div>
              <DialogTitle className="text-[20px] font-extrabold text-foreground pt-1 leading-snug">
                Recibe alertas de nuevos pedidos con tu celular bloqueado
              </DialogTitle>
              <DialogDescription className="text-[13px] text-muted-foreground pt-1.5 leading-relaxed">
                Apple exige que añadas el panel a tu pantalla de inicio para poder enviarte notificaciones push cuando entre un nuevo pedido:
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
                  Baja y toca <span className="font-bold">"Añadir a pantalla de inicio"</span>{" "}
                  <PlusSquare className="inline size-4 mx-0.5 text-primary align-text-bottom" />.
                </p>
              </div>

              <div className="flex items-start gap-3 rounded-2xl bg-surface/90 p-3.5 border border-border/40">
                <span className="flex size-7 shrink-0 items-center justify-center rounded-full bg-primary/20 font-extrabold text-primary text-xs">
                  3
                </span>
                <p className="text-foreground leading-snug">
                  Abre el panel desde tu pantalla de inicio y toca <span className="font-bold text-primary">"Activar alertas"</span>.
                </p>
              </div>
            </div>

            <div className="pt-2 flex flex-col gap-2">
              <button
                type="button"
                onClick={handleClose}
                className="flex h-12 w-full items-center justify-center rounded-full bg-primary font-bold text-primary-foreground shadow-sm transition-transform active:scale-95"
              >
                Entendido, voy a añadirlo
              </button>
            </div>

            <div className="flex items-center justify-center gap-1.5 text-[11px] font-semibold text-muted-foreground animate-bounce pt-1">
              <span>El botón compartir está abajo en Safari</span>
              <ArrowDown className="size-3.5 text-primary" />
            </div>
          </div>
        )}

        {/* Caso B: Android, PC o iPhone ya en inicio */}
        {!needsIOSInstall && (
          <div className="space-y-4">
            {!isSubscribed ? (
              <>
                <DialogHeader className="text-center sm:text-left">
                  <div className="mx-auto sm:mx-0 flex size-14 items-center justify-center rounded-3xl bg-primary/15 text-primary ring-8 ring-primary/10">
                    <BellRing className="size-7 animate-pulse" />
                  </div>
                  <DialogTitle className="text-[22px] font-extrabold text-foreground pt-3 leading-snug">
                    ¿Activar alertas de nuevos pedidos?
                  </DialogTitle>
                  <DialogDescription className="text-[13px] text-muted-foreground pt-1.5 leading-relaxed">
                    Recibirás una notificación y vibración instantánea en este dispositivo cada vez que un cliente confirme un pedido, incluso con la pantalla apagada o bloqueada.
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
                        <BellRing className="size-5" />
                        <span>Activar alertas de pedidos</span>
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
                  <div className="mx-auto sm:mx-0 flex size-14 items-center justify-center rounded-3xl bg-emerald-500/15 text-emerald-400 ring-8 ring-emerald-500/10">
                    <Check className="size-7" />
                  </div>
                  <DialogTitle className="text-[22px] font-extrabold text-foreground pt-3 leading-snug">
                    ¡Alertas de Administrador Activas!
                  </DialogTitle>
                  <DialogDescription className="text-[13px] text-muted-foreground pt-1.5 leading-relaxed">
                    Este dispositivo está listo para recibir avisos de nuevos pedidos. Puedes hacer una prueba con la pantalla bloqueada:
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
                    Entendido, ir al panel
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
