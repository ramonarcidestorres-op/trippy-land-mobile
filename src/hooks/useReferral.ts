import { useEffect, useState, useCallback } from "react";

const EVENT_NAME = "trippy_ref_updated";

export function getStoredReferral() {
  if (typeof window === "undefined") return null;
  return localStorage.getItem("trippy_ref_code");
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
      localStorage.setItem("trippy_ref_code", code.toUpperCase());
    } else {
      localStorage.removeItem("trippy_ref_code");
    }
    window.dispatchEvent(new Event(EVENT_NAME));
    setReferralState(code ? code.toUpperCase() : null);
  };

  const getAdjustedPrice = useCallback((basePrice: number | string) => {
    const price = Number(basePrice);
    if (referralCode) {
      // Incremento del 30% para comisionistas
      return Math.round(price * 1.30);
    }
    return price;
  }, [referralCode]);

  return { referralCode, setReferralCode, getAdjustedPrice };
}

export function processUrlForReferral() {
  if (typeof window === "undefined") return;
  const params = new URLSearchParams(window.location.search);
  const ref = params.get("ref");
  if (ref) {
    localStorage.setItem("trippy_ref_code", ref.toUpperCase());
    window.dispatchEvent(new Event(EVENT_NAME));
  }
}
