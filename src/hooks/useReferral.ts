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
      background_color: "#0e0e0e",
      theme_color: "#0e0e0e",
      orientation: "portrait",
      icons: [
        {
          src: "/tripi-logo-app.png",
          sizes: "192x192",
          type: "image/png",
          purpose: "any",
        },
        {
          src: "/tripi-logo-app.png",
          sizes: "512x512",
          type: "image/png",
          purpose: "any",
        },
        {
          src: "/tripi-logo-app.png",
          sizes: "192x192",
          type: "image/png",
          purpose: "maskable",
        },
        {
          src: "/tripi-logo-app.png",
          sizes: "512x512",
          type: "image/png",
          purpose: "maskable",
        },
        {
          src: "/tripi-logo-app.png",
          sizes: "180x180",
          type: "image/png",
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

let cachedReferral: string | null | undefined = undefined;

export function getStoredReferral(): string | null {
  if (typeof window === "undefined") return null;

  if (cachedReferral !== undefined) {
    return cachedReferral;
  }

  // 1. Revisar si la URL actual trae un código de referido explícito (?ref=CODIGO)
  const urlRef = new URLSearchParams(window.location.search).get("ref");
  if (urlRef && urlRef.trim() !== "") {
    const clean = urlRef.trim().toUpperCase();
    cachedReferral = clean;
    saveReferralEverywhere(clean);
    return clean;
  }

  // 2. Si la URL NO tiene ?ref=, significa que el usuario entró por el link original directo.
  cachedReferral = null;
  clearReferralEverywhere();
  return null;
}

function clearReferralEverywhere() {
  if (typeof window === "undefined") return;
  try {
    localStorage.removeItem(STORAGE_KEY);
    sessionStorage.removeItem(STORAGE_KEY);
    removeCookie(STORAGE_KEY);
  } catch {
    // ignore
  }
}

function saveReferralEverywhere(code: string | null) {
  if (typeof window === "undefined") return;
  if (code) {
    const clean = code.trim().toUpperCase();
    try {
      localStorage.setItem(STORAGE_KEY, clean);
      sessionStorage.setItem(STORAGE_KEY, clean);
      setCookie(STORAGE_KEY, clean);
    } catch {
      // ignore
    }
  } else {
    clearReferralEverywhere();
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
    if (code) {
      saveReferralEverywhere(code);
    } else {
      clearReferralEverywhere();
    }
    window.dispatchEvent(new Event(EVENT_NAME));
    setReferralState(code ? code.trim().toUpperCase() : null);
  };

  const getAdjustedPrice = useCallback(
    (basePrice: number | string) => {
      const price = Number(basePrice);
      if (referralCode) {
        // Incremento del 40% ÚNICAMENTE cuando se accede mediante enlace de referido
        return Math.round(price * 1.4);
      }
      // Precio original base de la tienda
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
  } else {
    clearReferralEverywhere();
  }
  window.dispatchEvent(new Event(EVENT_NAME));
}
