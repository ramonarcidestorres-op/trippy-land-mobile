import { useEffect, useState, useCallback } from "react";

const EVENT_NAME = "trippy_ref_updated";
const STORAGE_KEY = "trippy_ref_code";

function getCookie(name: string): string | null {
  if (typeof document === "undefined") return null;
  const match = document.cookie.match(new RegExp("(^|;\\s*)(" + name + ")=([^;]*)"));
  return match ? decodeURIComponent(match[3]) : null;
}

function setCookie(name: string, value: string, days = 365) {
  if (typeof document === "undefined") return;
  const expires = new Date(Date.now() + days * 864e5).toUTCString();
  document.cookie = `${name}=${encodeURIComponent(value)}; expires=${expires}; path=/; SameSite=Lax`;
}

function removeCookie(name: string) {
  if (typeof document === "undefined") return;
  document.cookie = `${name}=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/; SameSite=Lax`;
}

/**
 * Actualiza el archivo de manifiesto PWA dinámicamente en el navegador.
 * Cuando el usuario añade la app a la pantalla de inicio en iPhone Safari,
 * Safari lee el "start_url" del manifiesto. Al incluir ?ref=CODIGO,
 * la app instalada en el inicio SIEMPRE se abrirá con el enlace de referido.
 */
export function syncReferralManifest(refCode: string | null) {
  if (typeof window === "undefined" || typeof document === "undefined") return;
  try {
    const link = document.querySelector('link[rel="manifest"]') as HTMLLinkElement;
    if (!link) return;

    const startUrl = refCode ? `/?ref=${encodeURIComponent(refCode.toUpperCase())}` : "/";

    const manifestData = {
      name: "Trippy Land Store",
      short_name: "Trippy Land",
      description: "Dulces y snacks a domicilio en minutos. Pago contra entrega en efectivo.",
      start_url: startUrl,
      display: "standalone",
      background_color: "#0b0b0d",
      theme_color: "#0b0b0d",
      orientation: "portrait",
      icons: [
        {
          src: "/favicon.png",
          sizes: "192x192",
          type: "image/png",
          purpose: "any maskable",
        },
        {
          src: "/favicon.png",
          sizes: "512x512",
          type: "image/png",
          purpose: "any maskable",
        },
      ],
    };

    const blob = new Blob([JSON.stringify(manifestData, null, 2)], { type: "application/manifest+json" });
    const blobUrl = URL.createObjectURL(blob);
    link.setAttribute("href", blobUrl);
  } catch (e) {
    console.error("Error updating manifest with referral:", e);
  }
}

export function getStoredReferral(): string | null {
  if (typeof window === "undefined") return null;

  // 1. Revisar URL primero
  const urlRef = new URLSearchParams(window.location.search).get("ref");
  if (urlRef) {
    const clean = urlRef.trim().toUpperCase();
    saveReferralEverywhere(clean);
    return clean;
  }

  // 2. Revisar localStorage
  const localRef = localStorage.getItem(STORAGE_KEY);
  if (localRef) {
    const clean = localRef.trim().toUpperCase();
    setCookie(STORAGE_KEY, clean);
    return clean;
  }

  // 3. Revisar Cookie (compartida entre Safari navegador y PWA en iOS)
  const cookieRef = getCookie(STORAGE_KEY);
  if (cookieRef) {
    const clean = cookieRef.trim().toUpperCase();
    localStorage.setItem(STORAGE_KEY, clean);
    return clean;
  }

  return null;
}

function saveReferralEverywhere(code: string | null) {
  if (typeof window === "undefined") return;
  if (code) {
    const clean = code.trim().toUpperCase();
    localStorage.setItem(STORAGE_KEY, clean);
    setCookie(STORAGE_KEY, clean);
    syncReferralManifest(clean);

    // Mantener ?ref= en la barra de URL para que si Safari hace WebClip tome la URL con referido
    try {
      const url = new URL(window.location.href);
      if (url.searchParams.get("ref") !== clean) {
        url.searchParams.set("ref", clean);
        window.history.replaceState({}, "", url.toString());
      }
    } catch {
      // ignore
    }
  } else {
    localStorage.removeItem(STORAGE_KEY);
    removeCookie(STORAGE_KEY);
    syncReferralManifest(null);
  }
}

export function useReferral() {
  const [referralCode, setReferralState] = useState<string | null>(getStoredReferral());

  useEffect(() => {
    const handleUpdate = () => {
      setReferralState(getStoredReferral());
    };
    window.addEventListener(EVENT_NAME, handleUpdate);
    return () => window.removeEventListener(EVENT_NAME, handleUpdate);
  }, []);

  const setReferralCode = (code: string | null) => {
    saveReferralEverywhere(code);
    window.dispatchEvent(new Event(EVENT_NAME));
    setReferralState(code ? code.trim().toUpperCase() : null);
  };

  const getAdjustedPrice = useCallback(
    (basePrice: number | string) => {
      const price = Number(basePrice);
      if (referralCode) {
        // Incremento del 40% para comisionistas
        return Math.round(price * 1.4);
      }
      return price;
    },
    [referralCode]
  );

  return { referralCode, setReferralCode, getAdjustedPrice };
}

export function processUrlForReferral() {
  if (typeof window === "undefined") return;
  const current = getStoredReferral();
  if (current) {
    saveReferralEverywhere(current);
    window.dispatchEvent(new Event(EVENT_NAME));
  }
}

