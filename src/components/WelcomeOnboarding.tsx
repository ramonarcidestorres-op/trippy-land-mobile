import { useState, useEffect } from "react";
import { Logo, LogoEye } from "@/components/Logo";
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

    // Transición del Splash al Onboarding después de la animación inicial de zoom
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
    }, 450);
  };

  if (!show) return null;

  return (
    <div
      className={cn(
        "fixed inset-0 z-50 flex flex-col justify-between bg-black text-white select-none transition-opacity duration-500 overflow-y-auto",
        phase === "exiting" ? "opacity-0 pointer-events-none scale-105" : "opacity-100"
      )}
      style={{
        paddingTop: "max(env(safe-area-inset-top), 20px)",
        paddingBottom: "max(env(safe-area-inset-bottom), 24px)",
      }}
    >
      {/* Luz ambiental sutil de fondo */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div
          className="absolute left-1/2 top-1/3 -translate-x-1/2 -translate-y-1/2 size-[320px] sm:size-[440px] rounded-full blur-[90px] opacity-25"
          style={{
            background: "radial-gradient(circle, rgba(255, 252, 235, 0.35) 0%, rgba(255, 255, 255, 0.05) 50%, transparent 80%)",
          }}
        />
      </div>

      {/* FASE 1: SPLASH SCREEN (Animación de Zoom con Logo SVG y texto "• STORE •") */}
      {phase === "splash" && (
        <div className="relative z-10 flex flex-1 flex-col items-center justify-center px-6 animate-in fade-in zoom-in-95 duration-1000">
          <div className="relative flex items-center justify-center">
            {/* Halo suave detrás del logo */}
            <div className="absolute size-48 rounded-full bg-white/10 blur-2xl animate-pulse" />
            <Logo className="relative w-56 sm:w-64 h-auto drop-shadow-[0_10px_35px_rgba(255,252,235,0.25)] animate-[pulse_2s_ease-in-out_infinite]" />
          </div>

          <div className="mt-8 flex items-center gap-2 text-[11px] font-bold uppercase tracking-[0.3em] text-[#8E8E93] animate-pulse">
            <span className="size-1 rounded-full bg-[#8E8E93]" />
            <span>STORE</span>
            <span className="size-1 rounded-full bg-[#8E8E93]" />
          </div>
        </div>
      )}

      {/* FASE 2: ONBOARDING (Inspirado exactamente en la referencia del diseño) */}
      {phase !== "splash" && (
        <div className="relative z-10 flex flex-1 flex-col justify-between px-6 sm:px-8 max-w-sm mx-auto w-full animate-in fade-in duration-700">
          {/* Mitad Superior: Ícono Ojo completo flotante con iluminación */}
          <div className="flex flex-1 items-center justify-center py-6">
            <div className="relative flex items-center justify-center">
              <div className="absolute size-44 rounded-full bg-white/10 blur-2xl" />
              <LogoEye className="relative w-48 sm:w-56 h-auto drop-shadow-[0_12px_35px_rgba(255,252,235,0.28)]" />
            </div>
          </div>

          {/* Mitad Inferior: Textos y Botón estilo exacto de la referencia */}
          <div className="space-y-3.5 pb-2">
            {/* Pill Badge */}
            <div>
              <span className="inline-block rounded-lg border border-white/15 bg-white/[0.06] px-3 py-1 text-[11px] font-medium tracking-wide text-[#E5E5EA] backdrop-blur-md">
                Store
              </span>
            </div>

            {/* Texto Grande */}
            <h1 className="text-[28px] sm:text-[32px] font-extrabold tracking-tight text-white leading-[1.15]">
              Trippy Land Store.
            </h1>

            {/* Texto Pequeño Informativo en Minúsculas Normales */}
            <p className="text-[12px] leading-relaxed text-[#8E8E93] font-normal">
              Toda la información que manejamos aquí es totalmente privada y confidencial. No almacenamos datos personales innecesarios. Plataforma exclusiva por invitación de referido.
            </p>

            {/* Botón Blanco Pill (único botón de entrar) */}
            <div className="pt-2.5">
              <button
                onClick={handleEnter}
                className="flex h-13 w-full items-center justify-center rounded-full bg-white text-black font-extrabold text-[15px] shadow-[0_10px_30px_rgba(255,255,255,0.2)] transition-transform duration-200 hover:bg-[#F2F2F7] active:scale-[0.98]"
              >
                Entrar a la tienda
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
