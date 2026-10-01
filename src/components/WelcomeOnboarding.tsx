import { useState, useEffect, useRef } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { Logo, LogoEye } from "@/components/Logo";
import { cn } from "@/lib/utils";
import { supabase } from "@/integrations/supabase/client";
import { categoriesQuery, productsQuery } from "@/lib/queries";
import { preloadPriorityImages } from "@/lib/image-optimizer";

type StartupPhase = "loading" | "onboarding" | "exiting_loading" | "exiting_onboarding" | "closed";

export function WelcomeOnboarding() {
  const queryClient = useQueryClient();
  const [phase, setPhase] = useState<StartupPhase>("loading");
  const [progress, setProgress] = useState<number>(10);
  
  const isMountedRef = useRef(true);
  const hasExitedLoadingRef = useRef(false);
  const safetyTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const exitTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    isMountedRef.current = true;
    hasExitedLoadingRef.current = false;

    // Verificar estrictamente si el usuario ya completó el onboarding según el indicador existente
    const checkOnboardingStatus = (): boolean => {
      try {
        return localStorage.getItem("tls_onboarding_completed") === "true";
      } catch {
        return false;
      }
    };

    const isAlreadyOnboarded = checkOnboardingStatus();

    const finishLoading = (wasMeasuredSuccess: boolean) => {
      if (!isMountedRef.current || hasExitedLoadingRef.current) return;
      hasExitedLoadingRef.current = true;

      if (safetyTimerRef.current) {
        clearTimeout(safetyTimerRef.current);
        safetyTimerRef.current = null;
      }

      if (wasMeasuredSuccess) {
        setProgress(100);
      }

      if (isAlreadyOnboarded) {
        setPhase("exiting_loading");
        exitTimerRef.current = setTimeout(() => {
          if (isMountedRef.current) setPhase("closed");
        }, 350);
      } else {
        setPhase("onboarding");
        // En segundo plano, precargar las demás imágenes mientras el usuario lee el onboarding
        try {
          const cachedProds = queryClient.getQueryData<any[]>(["products", "", ""]) || [];
          const moreImages = cachedProds.slice(3, 8).map((p) => p?.image_url).filter(Boolean);
          preloadPriorityImages(moreImages, 3000).catch(() => {});
        } catch {
          // ignore
        }
      }
    };

    // Tareas reales de preparación inicial con medición de progreso
    async function initializeApp() {
      let currentProgress = 15;
      const updateProg = (inc: number) => {
        if (!isMountedRef.current || hasExitedLoadingRef.current) return;
        currentProgress = Math.min(95, currentProgress + inc);
        setProgress(currentProgress);
      };

      try {
        // Tarea 1: Comprobar sesión de auth (Supabase Auth)
        const authPromise = supabase.auth.getSession().catch(() => null).then(() => updateProg(25));

        // Tarea 2: Pre-calentar caché de categorías
        const catsPromise = queryClient.ensureQueryData(categoriesQuery())
          .catch(() => null)
          .then((cats) => {
            updateProg(25);
            return cats;
          });

        // Tarea 3: Pre-calentar caché de productos
        const prodsPromise = queryClient.ensureQueryData(productsQuery())
          .catch(() => null)
          .then((prods) => {
            updateProg(25);
            return prods;
          });

        // Tarea 4: Consulta de estado de la tienda
        const configPromise = supabase
          .from("app_config")
          .select("value")
          .eq("key", "store_is_open")
          .maybeSingle()
          .catch(() => null)
          .then(() => updateProg(10));

        // Esperar que las tareas esenciales finalicen
        const [_, catsData, prodsData] = await Promise.allSettled([
          authPromise,
          catsPromise,
          prodsPromise,
          configPromise,
        ]);

        // Tarea 5: Precargar únicamente las primeras imágenes prioritarias de Home
        const productsList = prodsData.status === "fulfilled" && Array.isArray(prodsData.value) ? prodsData.value : [];
        const categoriesList = catsData.status === "fulfilled" && Array.isArray(catsData.value) ? catsData.value : [];

        const priorityImages: string[] = [];
        // Top 3 productos visibles en el Tinder stack
        productsList.slice(0, 3).forEach((p) => {
          if (p?.image_url) priorityImages.push(p.image_url);
        });
        // Íconos de las primeras 4 categorías
        categoriesList.slice(0, 4).forEach((c) => {
          if (c?.icon_url) priorityImages.push(c.icon_url);
        });

        // Precarga no bloqueante con timeout estricto de 700ms
        await preloadPriorityImages(priorityImages, 700).catch(() => {});
        updateProg(10);
      } catch (err) {
        console.warn("[Startup] Non-critical initialization error:", err);
      } finally {
        if (isMountedRef.current && !hasExitedLoadingRef.current) {
          finishLoading(true);
        }
      }
    }

    // Safety timeout: garantía de que la pantalla de carga se retire sin marcar 100% artificial ni bloquear si la red es lenta
    safetyTimerRef.current = setTimeout(() => {
      if (!hasExitedLoadingRef.current && isMountedRef.current) {
        finishLoading(false);
      }
    }, 1200);

    initializeApp();

    return () => {
      isMountedRef.current = false;
      if (safetyTimerRef.current) clearTimeout(safetyTimerRef.current);
      if (exitTimerRef.current) clearTimeout(exitTimerRef.current);
    };
  }, [queryClient]);

  const handleEnter = () => {
    if (exitTimerRef.current) {
      clearTimeout(exitTimerRef.current);
    }
    setPhase("exiting_onboarding");
    try {
      localStorage.setItem("tls_onboarding_completed", "true");
      window.dispatchEvent(new Event("tls_onboarding_done"));
    } catch {
      // ignore
    }
    exitTimerRef.current = setTimeout(() => {
      if (isMountedRef.current) setPhase("closed");
    }, 350);
  };

  if (phase === "closed") return null;

  const isExiting = phase === "exiting_loading" || phase === "exiting_onboarding";
  const showLoading = phase === "loading" || phase === "exiting_loading";
  const showOnboarding = phase === "onboarding" || phase === "exiting_onboarding";

  return (
    <div
      className={cn(
        "fixed inset-0 z-50 flex flex-col justify-between bg-[#0a0a0a] text-white select-none transition-all duration-350 overflow-y-auto",
        isExiting ? "opacity-0 pointer-events-none scale-[1.02]" : "opacity-100 scale-100"
      )}
      style={{
        paddingTop: "max(env(safe-area-inset-top), 20px)",
        paddingBottom: "max(env(safe-area-inset-bottom), 24px)",
      }}
    >
      {/* Luz ambiental sutil de fondo */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div
          className="absolute left-1/2 top-1/3 -translate-x-1/2 -translate-y-1/2 size-[320px] sm:size-[440px] rounded-full blur-[100px] opacity-20"
          style={{
            background: "radial-gradient(circle, rgba(255, 252, 235, 0.4) 0%, rgba(255, 255, 255, 0.05) 50%, transparent 80%)",
          }}
        />
      </div>

      {/* ============================================================ */}
      {/* FASE 1: PANTALLA INICIAL DE CARGA (SPLASH PRE-ONBOARDING)    */}
      {/* ============================================================ */}
      {showLoading && (
        <div className="relative z-10 flex flex-1 flex-col items-center justify-center px-6 animate-in fade-in duration-300">
          <div className="relative flex flex-col items-center justify-center">
            {/* Halo suave detrás del logo */}
            <div className="absolute size-48 rounded-full bg-white/5 blur-2xl animate-pulse" />
            <Logo className="relative w-56 sm:w-64 h-auto drop-shadow-[0_10px_35px_rgba(255,252,235,0.25)]" />

            <div className="mt-6 flex items-center gap-2 text-[10px] font-bold uppercase tracking-[0.35em] text-[#8E8E93]">
              <span className="size-1 rounded-full bg-[#8E8E93]" />
              <span>STORE</span>
              <span className="size-1 rounded-full bg-[#8E8E93]" />
            </div>

            {/* Barra de progreso fina y elegante */}
            <div className="mt-8 w-44 sm:w-52 h-[2.5px] rounded-full bg-white/10 overflow-hidden relative shadow-inner">
              <div
                className="h-full rounded-full bg-gradient-to-r from-[#fffceb] via-white to-[#fffceb] transition-all duration-250 ease-out shadow-[0_0_10px_rgba(255,252,235,0.8)]"
                style={{
                  width: `${Math.max(8, progress)}%`,
                }}
              />
            </div>
          </div>
        </div>
      )}

      {/* ============================================================ */}
      {/* FASE 2: ONBOARDING (SOLO PARA USUARIOS NUEVOS)              */}
      {/* ============================================================ */}
      {showOnboarding && (
        <div className="relative z-10 flex flex-1 flex-col justify-between px-6 sm:px-8 max-w-sm mx-auto w-full animate-in fade-in zoom-in-98 duration-500">
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
                type="button"
                onClick={handleEnter}
                className="flex h-13 w-full items-center justify-center rounded-full bg-white text-black font-extrabold text-[15px] shadow-[0_10px_30px_rgba(255,255,255,0.2)] transition-transform duration-200 hover:bg-[#F2F2F7] active:scale-[0.98] cursor-pointer select-none"
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
