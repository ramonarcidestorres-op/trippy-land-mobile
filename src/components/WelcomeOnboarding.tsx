import { useState, useEffect } from "react";
import { Sparkles, ArrowRight, Shield, KeyRound, EyeOff } from "lucide-react";
import { Logo } from "@/components/Logo";
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

    // Si ya tiene pedidos previos registrados en su dispositivo, omitir onboarding
    try {
      const orders = JSON.parse(localStorage.getItem("tls_my_orders") || "[]");
      if (Array.isArray(orders) && orders.length > 0) {
        localStorage.setItem("tls_onboarding_completed", "true");
        return;
      }
    } catch {
      // ignore
    }

    setShow(true);

    // Transición del Splash al Onboarding después de la animación inicial
    const splashTimer = setTimeout(() => {
      setPhase("onboarding");
    }, 1500);

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
    }, 450);
  };

  if (!show) return null;

  return (
    <div
      className={cn(
        "fixed inset-0 z-50 flex flex-col justify-between bg-[#08080A] text-white select-none transition-opacity duration-500 overflow-y-auto",
        phase === "exiting" ? "opacity-0 pointer-events-none scale-105" : "opacity-100"
      )}
      style={{
        paddingTop: "max(env(safe-area-inset-top), 20px)",
        paddingBottom: "max(env(safe-area-inset-bottom), 20px)",
      }}
    >
      {/* Luz ambiental de fondo (Glow suave de lujo) */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div
          className="absolute left-1/2 top-1/4 -translate-x-1/2 -translate-y-1/2 size-[320px] sm:size-[420px] rounded-full blur-[85px] opacity-30 transition-opacity duration-1000"
          style={{
            background: "radial-gradient(circle, rgba(255, 252, 235, 0.3) 0%, rgba(255, 255, 255, 0.05) 50%, transparent 80%)",
          }}
        />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_bottom,rgba(255,255,255,0.02)_0%,transparent_70%)]" />
      </div>

      {/* FASE 1: SPLASH SCREEN (Logo SVG con zoom y resplandor) */}
      {phase === "splash" && (
        <div className="relative z-10 flex flex-1 flex-col items-center justify-center px-6 animate-in fade-in zoom-in-95 duration-1000">
          <div className="relative flex items-center justify-center">
            <div className="absolute size-48 rounded-full bg-white/10 blur-2xl animate-pulse" />
            <Logo className="relative w-56 sm:w-64 h-auto drop-shadow-[0_10px_30px_rgba(255,252,235,0.2)] animate-[pulse_2s_ease-in-out_infinite]" />
          </div>

          <div className="mt-6 flex items-center gap-2 text-[10px] font-bold uppercase tracking-[0.25em] text-[#A0A0A8] animate-pulse">
            <span className="size-1 rounded-full bg-white/70" />
            <span>Acceso Privado</span>
            <span className="size-1 rounded-full bg-white/70" />
          </div>
        </div>
      )}

      {/* FASE 2: ONBOARDING ELEGANTE */}
      {phase !== "splash" && (
        <div className="relative z-10 flex flex-1 flex-col justify-between px-6 sm:px-8 max-w-sm mx-auto w-full animate-in fade-in slide-in-from-bottom-5 duration-700">
          {/* Header Superior: Logo SVG con iluminación */}
          <div className="pt-2 sm:pt-4 flex flex-col items-center text-center">
            <div className="relative mb-3 flex items-center justify-center">
              <div className="absolute size-32 rounded-full bg-white/10 blur-xl" />
              <Logo className="relative w-40 sm:w-44 h-auto drop-shadow-[0_8px_20px_rgba(255,252,235,0.18)]" />
            </div>

            <div className="inline-flex items-center gap-1.5 rounded-full border border-white/10 bg-white/[0.04] px-3 py-0.5 text-[10px] font-bold uppercase tracking-[0.18em] text-[#D8D8D8] backdrop-blur-md mb-2">
              <Sparkles className="size-2.5 text-[#fffceb]" />
              Acceso Exclusivo & Privado
            </div>

            <h1 className="text-[19px] sm:text-[21px] font-bold tracking-tight text-white leading-tight">
              Bienvenidos a <span className="text-[#fffceb]">Trippy Land Store</span>
            </h1>
          </div>

          {/* Cuerpo Informativo: Letras más pequeñas y elegantes */}
          <div className="my-4 space-y-3">
            <div className="rounded-2xl border border-white/10 bg-[#141418]/80 p-4 backdrop-blur-xl shadow-lg space-y-2.5 text-left">
              <p className="text-[12.5px] leading-relaxed text-[#D0D0D8]">
                Toda la información que manejamos aquí es <strong className="text-white font-semibold">totalmente privada y confidencial</strong>. No almacenamos datos personales innecesarios.
              </p>
              
              <div className="h-px w-full bg-white/5" />

              <p className="text-[12px] leading-relaxed text-[#9D9DA8]">
                Por tu seguridad, esta plataforma no está abierta a todo público. Si llegaste hasta acá, es gracias a la invitación de un <span className="text-white font-medium">referido autorizado</span>.
              </p>
            </div>

            {/* Nuevos Iconos e Indicadores de Confianza */}
            <div className="grid grid-cols-3 gap-2 text-center">
              <div className="flex flex-col items-center rounded-xl border border-white/5 bg-[#121215]/50 py-2.5 px-1.5">
                <EyeOff className="size-3.5 text-[#fffceb] mb-1 opacity-90" />
                <span className="text-[9.5px] font-semibold text-[#D4D4DC] leading-tight">100% Discreto</span>
              </div>
              <div className="flex flex-col items-center rounded-xl border border-white/5 bg-[#121215]/50 py-2.5 px-1.5">
                <KeyRound className="size-3.5 text-[#fffceb] mb-1 opacity-90" />
                <span className="text-[9.5px] font-semibold text-[#D4D4DC] leading-tight">Por Invitación</span>
              </div>
              <div className="flex flex-col items-center rounded-xl border border-white/5 bg-[#121215]/50 py-2.5 px-1.5">
                <Shield className="size-3.5 text-[#fffceb] mb-1 opacity-90" />
                <span className="text-[9.5px] font-semibold text-[#D4D4DC] leading-tight">Pago en Efectivo</span>
              </div>
            </div>
          </div>

          {/* Botón Inferior: Entrar */}
          <div className="pt-2 pb-1">
            <button
              onClick={handleEnter}
              className="group relative flex h-12 w-full items-center justify-center gap-2 rounded-full bg-white text-black font-bold text-[14px] shadow-[0_8px_25px_rgba(255,255,255,0.18)] transition-all duration-300 hover:bg-[#F0F0EB] active:scale-[0.97]"
            >
              <span>Entrar a la tienda</span>
              <ArrowRight className="size-4 transition-transform duration-300 group-hover:translate-x-1" />
            </button>
            <p className="mt-2 text-center text-[9px] uppercase tracking-[0.2em] text-[#66666E]">
              Trippy Land Store • Acceso Seguro
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
