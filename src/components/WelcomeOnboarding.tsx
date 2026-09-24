import { useState, useEffect } from "react";
import { ShieldCheck, Lock, Sparkles, ArrowRight, CheckCircle2 } from "lucide-react";
import { cn } from "@/lib/utils";

export function WelcomeOnboarding() {
  const [show, setShow] = useState<boolean>(false);
  const [phase, setPhase] = useState<"splash" | "onboarding" | "exiting">("splash");

  useEffect(() => {
    if (typeof window === "undefined") return;

    // Verificar si ya completó el onboarding anteriormente
    const completed = localStorage.getItem("tls_onboarding_completed");
    if (completed === "true") {
      return;
    }

    // Si ya tiene pedidos previos registrados en su dispositivo, no es su primera vez
    try {
      const orders = JSON.parse(localStorage.getItem("tls_my_orders") || "[]");
      if (Array.isArray(orders) && orders.length > 0) {
        localStorage.setItem("tls_onboarding_completed", "true");
        return;
      }
    } catch {
      // ignore
    }

    // Es la primera vez que entra: mostrar splash + onboarding
    setShow(true);

    // Transición del Splash al Onboarding después de la animación inicial de carga
    const splashTimer = setTimeout(() => {
      setPhase("onboarding");
    }, 1600);

    return () => clearTimeout(splashTimer);
  }, []);

  const handleEnter = () => {
    setPhase("exiting");
    try {
      localStorage.setItem("tls_onboarding_completed", "true");
      window.dispatchEvent(new Event("tls_onboarding_done"));
    } catch {
      // ignore
    }
    setTimeout(() => {
      setShow(false);
    }, 500);
  };

  if (!show) return null;

  return (
    <div
      className={cn(
        "fixed inset-0 z-50 flex flex-col justify-between bg-[#08080A] text-white select-none transition-opacity duration-500 overflow-y-auto",
        phase === "exiting" ? "opacity-0 pointer-events-none scale-105" : "opacity-100"
      )}
      style={{
        paddingTop: "max(env(safe-area-inset-top), 24px)",
        paddingBottom: "max(env(safe-area-inset-bottom), 24px)",
      }}
    >
      {/* Luz ambiental de fondo (Glow blanquito / dorado suave de lujo) */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div
          className="absolute left-1/2 top-1/4 -translate-x-1/2 -translate-y-1/2 size-[340px] sm:size-[460px] rounded-full blur-[90px] opacity-40 transition-opacity duration-1000"
          style={{
            background: "radial-gradient(circle, rgba(255, 252, 235, 0.35) 0%, rgba(255, 255, 255, 0.08) 50%, transparent 80%)",
          }}
        />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_bottom,rgba(255,255,255,0.03)_0%,transparent_70%)]" />
      </div>

      {/* FASE 1: SPLASH SCREEN (Logo centrado con animación suave de zoom y resplandor) */}
      {phase === "splash" && (
        <div className="relative z-10 flex flex-1 flex-col items-center justify-center px-6 animate-in fade-in zoom-in-95 duration-1000">
          <div className="relative flex items-center justify-center">
            {/* Halo de luz suave detrás del logo */}
            <div className="absolute size-44 rounded-full bg-white/10 blur-2xl animate-pulse" />
            
            <img
              src="/tripi-logo-app.png"
              alt="Trippy Land Logo"
              className="relative size-36 sm:size-44 object-contain drop-shadow-[0_15px_35px_rgba(255,255,255,0.15)] animate-[pulse_2s_ease-in-out_infinite]"
            />
          </div>

          <div className="mt-8 flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.3em] text-[#C4C4C4] animate-pulse">
            <span className="size-1.5 rounded-full bg-white" />
            <span>Acceso Privado</span>
            <span className="size-1.5 rounded-full bg-white" />
          </div>
        </div>
      )}

      {/* FASE 2: ONBOARDING COMPLETO DE BIENVENIDA */}
      {phase !== "splash" && (
        <div className="relative z-10 flex flex-1 flex-col justify-between px-6 sm:px-10 max-w-md mx-auto w-full animate-in fade-in slide-in-from-bottom-6 duration-700">
          {/* Header Superior: Logo con iluminación */}
          <div className="pt-2 sm:pt-4 flex flex-col items-center text-center">
            <div className="relative mb-5 flex items-center justify-center">
              <div className="absolute size-32 rounded-full bg-white/10 blur-xl" />
              <img
                src="/tripi-logo-app.png"
                alt="Trippy Land Logo"
                className="relative size-24 sm:size-28 object-contain drop-shadow-[0_10px_25px_rgba(255,255,255,0.18)]"
              />
            </div>

            <div className="inline-flex items-center gap-1.5 rounded-full border border-white/10 bg-white/[0.04] px-3.5 py-1 text-[11px] font-bold uppercase tracking-[0.2em] text-[#E5E5E5] backdrop-blur-md mb-3">
              <Sparkles className="size-3 text-white" />
              Acceso Exclusivo & Privado
            </div>

            <h1 className="text-[26px] sm:text-[30px] font-extrabold tracking-tight text-white leading-tight">
              Bienvenidos a <br />
              <span className="bg-gradient-to-b from-white via-[#F5F5F0] to-[#B8B8B8] bg-clip-text text-transparent">
                Trippy Land Store
              </span>
            </h1>
          </div>

          {/* Cuerpo Informativo: Seguridad, Privacidad y Referidos */}
          <div className="my-6 space-y-4">
            <div className="rounded-3xl border border-white/10 bg-[#141418]/80 p-5 backdrop-blur-xl shadow-[0_10px_30px_rgba(0,0,0,0.5)] space-y-3 text-left">
              <p className="text-[14px] leading-relaxed text-[#D6D6D6]">
                Toda la información que manejamos aquí es <strong className="text-white font-bold">totalmente privada y confidencial</strong>. No solicitamos ni almacenamos datos personales innecesarios.
              </p>
              
              <div className="h-px w-full bg-white/5" />

              <p className="text-[13px] leading-relaxed text-[#A8A8B0]">
                Por tu seguridad, esta plataforma no está abierta a todo público. Si llegaste hasta acá, es gracias a la invitación directa de un <span className="text-white font-semibold">referido autorizado</span>.
              </p>
            </div>

            {/* Pilares de Confianza */}
            <div className="grid grid-cols-3 gap-2 text-center pt-1">
              <div className="flex flex-col items-center rounded-2xl border border-white/5 bg-[#121215]/60 p-2.5">
                <Lock className="size-4 text-white mb-1.5" />
                <span className="text-[10px] font-bold text-[#E5E5E5] leading-tight">100% Privado</span>
              </div>
              <div className="flex flex-col items-center rounded-2xl border border-white/5 bg-[#121215]/60 p-2.5">
                <ShieldCheck className="size-4 text-white mb-1.5" />
                <span className="text-[10px] font-bold text-[#E5E5E5] leading-tight">Sin Datos Sensibles</span>
              </div>
              <div className="flex flex-col items-center rounded-2xl border border-white/5 bg-[#121215]/60 p-2.5">
                <CheckCircle2 className="size-4 text-white mb-1.5" />
                <span className="text-[10px] font-bold text-[#E5E5E5] leading-tight">Pago en Efectivo</span>
              </div>
            </div>
          </div>

          {/* Botón Inferior: Entrar */}
          <div className="pt-2 pb-2">
            <button
              onClick={handleEnter}
              className="group relative flex h-14 w-full items-center justify-center gap-2 rounded-full bg-white text-black font-extrabold text-[16px] shadow-[0_10px_30px_rgba(255,255,255,0.2)] transition-all duration-300 hover:bg-[#F0F0EB] hover:shadow-[0_15px_40px_rgba(255,255,255,0.3)] active:scale-[0.97]"
            >
              <span>Entrar a la tienda</span>
              <ArrowRight className="size-5 transition-transform duration-300 group-hover:translate-x-1" />
            </button>
            <p className="mt-2.5 text-center text-[10px] uppercase tracking-widest text-[#737373]">
              Trippy Land Store • Experiencia VIP
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
