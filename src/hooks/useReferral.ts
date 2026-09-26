import { useEffect, useState, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";

const EVENT_NAME = "trippy_ref_updated";
const STORAGE_KEY = "trippy_ref_code";
const STORAGE_PCT_KEY = "trippy_ref_pct";

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

export function getStoredPercentage(): number {
  if (typeof window === "undefined") return 20;
  try {
    const saved = localStorage.getItem(STORAGE_PCT_KEY);
    if (saved) {
      const num = Number(saved);
      if (!isNaN(num) && num >= 0) return num;
    }
  } catch {
    // ignore
  }
  return 20; // Default 20%
}

function clearReferralEverywhere() {
  if (typeof window === "undefined") return;
  try {
    localStorage.removeItem(STORAGE_KEY);
    localStorage.removeItem(STORAGE_PCT_KEY);
    sessionStorage.removeItem(STORAGE_KEY);
    sessionStorage.removeItem(STORAGE_PCT_KEY);
    removeCookie(STORAGE_KEY);
    removeCookie(STORAGE_PCT_KEY);
  } catch {
    // ignore
  }
}

function saveReferralEverywhere(code: string | null, pct?: number) {
  if (typeof window === "undefined") return;
  if (code) {
    const clean = code.trim().toUpperCase();
    try {
      localStorage.setItem(STORAGE_KEY, clean);
      sessionStorage.setItem(STORAGE_KEY, clean);
      setCookie(STORAGE_KEY, clean);
      if (pct !== undefined) {
        localStorage.setItem(STORAGE_PCT_KEY, String(pct));
        sessionStorage.setItem(STORAGE_PCT_KEY, String(pct));
        setCookie(STORAGE_PCT_KEY, String(pct));
      }
    } catch {
      // ignore
    }
  } else {
    clearReferralEverywhere();
  }
}

export function useReferral() {
  const [referralCode, setReferralState] = useState<string | null>(getStoredReferral());
  const [commissionPercentage, setCommissionPercentage] = useState<number>(getStoredPercentage());

  // Sincronizar porcentaje desde Supabase cuando hay un código de referido activo
  useEffect(() => {
    if (!referralCode) {
      setCommissionPercentage(0);
      return;
    }

    let isMounted = true;
    async function fetchReferralConfig() {
      try {
        const { data, error } = await supabase
          .from("referrals")
          .select("code, commission_percentage, is_active")
          .ilike("code", referralCode!)
          .maybeSingle();

        if (!error && data && isMounted) {
          if (data.is_active === false) {
            // Referido pausado
            setCommissionPercentage(0);
          } else {
            const pct = Number(data.commission_percentage) || 20;
            setCommissionPercentage(pct);
            saveReferralEverywhere(referralCode, pct);
          }
        }
      } catch (e) {
        console.warn("Could not fetch referral details:", e);
      }
    }

    fetchReferralConfig();
    return () => {
      isMounted = false;
    };
  }, [referralCode]);

  useEffect(() => {
    const handleUpdate = () => {
      setReferralState(getStoredReferral());
      setCommissionPercentage(getStoredPercentage());
    };
    window.addEventListener(EVENT_NAME, handleUpdate);
    return () => window.removeEventListener(EVENT_NAME, handleUpdate);
  }, []);

  const setReferralCode = (code: string | null, percentage = 20) => {
    if (code) {
      saveReferralEverywhere(code, percentage);
    } else {
      clearReferralEverywhere();
    }
    window.dispatchEvent(new Event(EVENT_NAME));
    setReferralState(code ? code.trim().toUpperCase() : null);
    setCommissionPercentage(code ? percentage : 0);
  };

  const getAdjustedPrice = useCallback(
    (basePrice: number | string) => {
      const price = Number(basePrice);
      if (referralCode && commissionPercentage > 0) {
        // Incremento dinámico según el porcentaje configurado para el referido
        return Math.round(price * (1 + commissionPercentage / 100));
      }
      // Precio original base de la tienda
      return price;
    },
    [referralCode, commissionPercentage]
  );

  const getCommissionAmount = useCallback(
    (basePrice: number | string) => {
      const price = Number(basePrice);
      if (referralCode && commissionPercentage > 0) {
        return Math.round(price * (commissionPercentage / 100));
      }
      return 0;
    },
    [referralCode, commissionPercentage]
  );

  return { 
    referralCode, 
    commissionPercentage, 
    setReferralCode, 
    getAdjustedPrice,
    getCommissionAmount 
  };
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

