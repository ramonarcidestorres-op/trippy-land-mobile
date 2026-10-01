import { useState, useEffect } from "react";
import { 
  Share, 
  PlusSquare, 
  Download, 
  X, 
  Smartphone, 
  ArrowDown, 
  MoreVertical, 
  Check, 
  Sparkles 
} from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { LogoEye } from "@/components/Logo";
import { cn } from "@/lib/utils";

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed"; platform: string }>;
}

export function InstallAppPrompt() {
  const [isStandalone, setIsStandalone] = useState(false);
  const [isIOS, setIsIOS] = useState(false);
  const [isAndroid, setIsAndroid] = useState(false);
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [isOpen, setIsOpen] = useState(false);
  const [showBanner, setShowBanner] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") return;

    // Detectar si ya está instalada como PWA (Standalone)
    const standalone =
      window.matchMedia("(display-mode: standalone)").matches ||
      Boolean((navigator as any).standalone);
    setIsStandalone(standalone);

    if (standalone) return;

    // Detectar Sistema Operativo
    const ua = navigator.userAgent || "";
    const isIosDevice = /iPad|iPhone|iPod/.test(ua) && !(window as any).MSStream;
    const isAndroidDevice = /Android/i.test(ua);

    setIsIOS(isIosDevice);
    setIsAndroid(isAndroidDevice);

    // Capturar evento nativo de instalación en Android / Chrome
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
    };

    window.addEventListener("beforeinstallprompt", handleBeforeInstallPrompt);

    // Escuchar evento de onboarding completado para abrir el aviso automáticamente
    const handleOnboardingDone = () => {
      const dismissed = sessionStorage.getItem("tls_install_dismissed");
      if (!dismissed) {
        setTimeout(() => {
          setIsOpen(true);
        }, 1200);
      }
    };
    window.addEventListener("tls_onboarding_done", handleOnboardingDone);

    // Permitir abrir el modal desde cualquier botón o menú de la app
    const handleOpenModal = () => {
      setIsOpen(true);
    };
    window.addEventListener("tls_open_install_modal", handleOpenModal);

    // Mostrar banner sutil si no está instalada y no ha sido descartada en esta sesión
    const isDismissed = sessionStorage.getItem("tls_install_dismissed") === "true";
    if (!isDismissed) {
      const timer = setTimeout(() => {
        setShowBanner(true);
      }, 2000);
      return () => clearTimeout(timer);
    }

    return () => {
      window.removeEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
      window.removeEventListener("tls_onboarding_done", handleOnboardingDone);
      window.removeEventListener("tls_open_install_modal", handleOpenModal);
    };
  }, []);

  const handleInstallClick = async () => {
    if (deferredPrompt) {
      try {
        await deferredPrompt.prompt();
        const choice = await deferredPrompt.userChoice;
        if (choice.outcome === "accepted") {
          setIsOpen(false);
          setShowBanner(false);
        }
        setDeferredPrompt(null);
      } catch (err) {
        console.warn("Error al abrir diálogo de instalación:", err);
      }
    } else {
      setIsOpen(true);
    }
  };

  const handleDismiss = () => {
    setShowBanner(false);
    setIsOpen(false);
    try {
      sessionStorage.setItem("tls_install_dismissed", "true");
    } catch {
      // ignore
    }
  };

  if (isStandalone) return null;

  return (
    <>
      {/* BANNER FLOTANTE SUTIL EN LA PARTE SUPERIOR */}
      {showBanner && !isOpen && (
        <div className="relative z-40 bg-[#121214]/95 backdrop-blur-xl border-b border-white/10 px-4 py-2.5 shadow-[0_4px_20px_rgba(0,0,0,0.5)] animate-in slide-in-from-top duration-300">
          <div className="mx-auto max-w-5xl flex items-center justify-between gap-3">
            <div 
              onClick={() => setIsOpen(true)}
              className="flex items-center gap-3 flex-1 min-w-0 cursor-pointer"
            >
              <div className="size-9 shrink-0 rounded-xl bg-black/80 p-1.5 border border-white/15 flex items-center justify-center shadow-inner">
                <LogoEye className="size-5 text-[#fffceb]" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-[13px] font-extrabold text-white leading-tight truncate tracking-tight">
                  Instala Trippy Land en tu inicio
                </p>
                <p className="text-[11px] text-[#8E8E93] leading-tight truncate">
                  {isIOS ? "Toca aquí para ver los 3 pasos de Safari" : "Acceso rápido y alertas con sonido"}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2 shrink-0">
              <button
                type="button"
                onClick={handleInstallClick}
                className="h-8.5 px-4 rounded-full bg-white text-black font-extrabold text-xs shadow-[0_4px_14px_rgba(255,255,255,0.2)] transition-transform active:scale-95 cursor-pointer select-none touch-manipulation flex items-center gap-1.5 hover:bg-[#F2F2F7]"
              >
                <Download className="size-3.5" />
                <span>Instalar</span>
              </button>

              <button
                type="button"
                onClick={handleDismiss}
                className="flex size-7 items-center justify-center rounded-full text-[#8E8E93] hover:text-white transition-colors"
                aria-label="Cerrar aviso"
              >
                <X className="size-4" />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* DIÁLOGO CON INSTRUCCIONES ESPECÍFICAS SEGÚN EL SISTEMA (iOS vs Android) */}
      <Dialog
        open={isOpen}
        onOpenChange={(open) => {
          if (!open) handleDismiss();
          else setIsOpen(true);
        }}
      >
        <DialogContent className="p-6 sm:p-7 border-white/15 max-w-md w-full bg-[#0e0e0e] text-white rounded-[32px] shadow-[0_20px_60px_rgba(0,0,0,0.8)] overflow-hidden">
          {/* Luz ambiental sutil */}
          <div className="pointer-events-none absolute -top-12 left-1/2 -translate-x-1/2 size-44 rounded-full bg-white/[0.07] blur-3xl" />

          {/* ============================================================ */}
          {/* CASO 1: IPHONE (iOS / Safari)                                */}
          {/* ============================================================ */}
          {isIOS ? (
            <div className="relative z-10 space-y-4">
              <DialogHeader className="text-left space-y-2">
                <div>
                  <span className="inline-block rounded-lg border border-white/15 bg-white/[0.06] px-2.5 py-0.5 text-[10px] font-bold tracking-wider text-[#E5E5EA] uppercase backdrop-blur-md">
                    iPhone • Safari
                  </span>
                </div>
                <DialogTitle className="text-[22px] sm:text-[24px] font-extrabold text-white tracking-tight leading-[1.2]">
                  Agrega Trippy Land a tu Inicio
                </DialogTitle>
                <DialogDescription className="text-[12.5px] text-[#8E8E93] leading-relaxed">
                  Para tener la tienda en pantalla completa y recibir avisos cuando tu pedido vaya en camino:
                </DialogDescription>
              </DialogHeader>

              <div className="space-y-2.5 pt-1 text-[13px]">
                {/* Paso 1 */}
                <div className="flex items-start gap-3 rounded-2xl bg-white/[0.04] p-3.5 border border-white/10 backdrop-blur-sm">
                  <span className="flex size-7 shrink-0 items-center justify-center rounded-full bg-white text-black font-black text-xs shadow-md">
                    1
                  </span>
                  <p className="text-[#EDEDED] leading-snug pt-0.5">
                    Toca el botón <span className="font-bold text-white">Compartir</span>{" "}
                    <Share className="inline size-4 mx-0.5 text-[#fffceb] align-text-bottom" /> en la barra inferior de Safari.
                  </p>
                </div>

                {/* Paso 2 */}
                <div className="flex items-start gap-3 rounded-2xl bg-white/[0.04] p-3.5 border border-white/10 backdrop-blur-sm">
                  <span className="flex size-7 shrink-0 items-center justify-center rounded-full bg-white text-black font-black text-xs shadow-md">
                    2
                  </span>
                  <p className="text-[#EDEDED] leading-snug pt-0.5">
                    Desplázate hacia abajo y presiona <span className="font-bold text-white">"Añadir a pantalla de inicio"</span>{" "}
                    <PlusSquare className="inline size-4 mx-0.5 text-[#fffceb] align-text-bottom" />.
                  </p>
                </div>

                {/* Paso 3 */}
                <div className="flex items-start gap-3 rounded-2xl bg-white/[0.04] p-3.5 border border-white/10 backdrop-blur-sm">
                  <span className="flex size-7 shrink-0 items-center justify-center rounded-full bg-white text-black font-black text-xs shadow-md">
                    3
                  </span>
                  <p className="text-[#EDEDED] leading-snug pt-0.5">
                    Toca <span className="font-bold text-white">"Añadir"</span> en la esquina superior derecha y ábrela desde tu pantalla principal.
                  </p>
                </div>
              </div>

              <div className="pt-2 flex flex-col gap-2">
                <button
                  type="button"
                  onClick={handleDismiss}
                  className="flex h-13 w-full items-center justify-center rounded-full bg-white text-black font-extrabold text-[15px] shadow-[0_10px_30px_rgba(255,255,255,0.2)] transition-transform active:scale-[0.98] cursor-pointer hover:bg-[#F2F2F7]"
                >
                  Entendido, voy a agregarla
                </button>
              </div>

              <div className="flex items-center justify-center gap-1.5 text-[11px] font-semibold text-[#8E8E93] animate-bounce pt-1">
                <span>El botón de compartir está abajo en Safari</span>
                <ArrowDown className="size-3.5 text-white" />
              </div>
            </div>
          ) : (
            /* ============================================================ */
            /* CASO 2: ANDROID (Google Chrome / Samsung Internet / Edge)     */
            /* ============================================================ */
            <div className="relative z-10 space-y-4">
              <DialogHeader className="text-left space-y-2">
                <div>
                  <span className="inline-block rounded-lg border border-white/15 bg-white/[0.06] px-2.5 py-0.5 text-[10px] font-bold tracking-wider text-[#E5E5EA] uppercase backdrop-blur-md">
                    Android • App Directa
                  </span>
                </div>
                <DialogTitle className="text-[22px] sm:text-[24px] font-extrabold text-white tracking-tight leading-[1.2]">
                  Instala Trippy Land en Android
                </DialogTitle>
                <DialogDescription className="text-[12.5px] text-[#8E8E93] leading-relaxed">
                  Disfruta de arranque ultrarrápido, navegación fluida y alertas de tus entregas en pantalla bloqueada:
                </DialogDescription>
              </DialogHeader>

              {/* Botón directo de 1 toque si el navegador soporta el evento nativo */}
              {deferredPrompt && (
                <div className="pt-1">
                  <button
                    type="button"
                    onClick={handleInstallClick}
                    className="flex h-13 w-full items-center justify-center gap-2.5 rounded-full bg-white text-black font-extrabold text-[15px] shadow-[0_10px_30px_rgba(255,255,255,0.25)] transition-transform active:scale-[0.98] cursor-pointer hover:bg-[#F2F2F7]"
                  >
                    <Download className="size-5 text-black" />
                    <span>Instalar aplicación ahora</span>
                  </button>
                </div>
              )}

              {/* Pasos manuales para Android */}
              <div className="space-y-2.5 pt-1 text-[13px]">
                <div className="flex items-start gap-3 rounded-2xl bg-white/[0.04] p-3.5 border border-white/10 backdrop-blur-sm">
                  <span className="flex size-7 shrink-0 items-center justify-center rounded-full bg-white text-black font-black text-xs shadow-md">
                    1
                  </span>
                  <p className="text-[#EDEDED] leading-snug pt-0.5">
                    Toca los <span className="font-bold text-white">tres puntos</span>{" "}
                    <MoreVertical className="inline size-4 mx-0.5 text-[#fffceb] align-text-bottom" /> en la esquina superior derecha de Chrome.
                  </p>
                </div>

                <div className="flex items-start gap-3 rounded-2xl bg-white/[0.04] p-3.5 border border-white/10 backdrop-blur-sm">
                  <span className="flex size-7 shrink-0 items-center justify-center rounded-full bg-white text-black font-black text-xs shadow-md">
                    2
                  </span>
                  <p className="text-[#EDEDED] leading-snug pt-0.5">
                    Selecciona <span className="font-bold text-white">"Instalar aplicación"</span> o <span className="font-bold text-white">"Añadir a la pantalla principal"</span>.
                  </p>
                </div>

                <div className="flex items-start gap-3 rounded-2xl bg-white/[0.04] p-3.5 border border-white/10 backdrop-blur-sm">
                  <span className="flex size-7 shrink-0 items-center justify-center rounded-full bg-white text-black font-black text-xs shadow-md">
                    3
                  </span>
                  <p className="text-[#EDEDED] leading-snug pt-0.5">
                    Presiona <span className="font-bold text-white">"Instalar"</span> para tener el icono en tu pantalla de inicio.
                  </p>
                </div>
              </div>

              <div className="pt-2 flex flex-col gap-2">
                <button
                  type="button"
                  onClick={handleDismiss}
                  className="flex h-11 w-full items-center justify-center rounded-full bg-white/[0.08] text-[#E5E5EA] font-bold text-sm transition-colors hover:bg-white/[0.12] hover:text-white"
                >
                  Continuar navegando
                </button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}
