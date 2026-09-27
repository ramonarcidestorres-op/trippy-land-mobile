import { supabase } from "@/integrations/supabase/client";

const DEVICE_ID_KEY = "tls_admin_device_id";

/**
 * Obtiene o crea un ID único persistente para este navegador/dispositivo.
 */
export function getOrCreateDeviceId(): string {
  if (typeof window === "undefined") return "server-device";
  try {
    let id = localStorage.getItem(DEVICE_ID_KEY);
    if (!id || id.length < 10) {
      if (typeof crypto !== "undefined" && crypto.randomUUID) {
        id = crypto.randomUUID();
      } else {
        id = `dev_${Math.random().toString(36).slice(2)}_${Date.now()}`;
      }
      localStorage.setItem(DEVICE_ID_KEY, id);
    }
    return id;
  } catch {
    return "temp_device_" + Date.now();
  }
}

/**
 * Genera un nombre amigable e intuitivo del dispositivo según el navegador y OS.
 */
export function getFriendlyDeviceName(): string {
  if (typeof window === "undefined" || !navigator) return "Dispositivo Desconocido";

  const ua = navigator.userAgent;
  let os = "Dispositivo";
  let browser = "Navegador";

  // Detección de Sistema Operativo / Dispositivo
  if (/iPhone/i.test(ua)) os = "iPhone";
  else if (/iPad/i.test(ua)) os = "iPad";
  else if (/Android/i.test(ua)) {
    const match = ua.match(/Android\s+([\d.]+)/i);
    os = match ? `Android ${match[1]}` : "Android";
  } else if (/Windows NT 10.0/i.test(ua)) os = "Windows PC";
  else if (/Macintosh|Mac OS/i.test(ua)) os = "Mac";
  else if (/Linux/i.test(ua)) os = "Linux";

  // Detección de Navegador
  if (/CriOS|Chrome/i.test(ua) && !/Edg/i.test(ua)) browser = "Chrome";
  else if (/Safari/i.test(ua) && !/Chrome/i.test(ua)) browser = "Safari";
  else if (/Firefox|FxiOS/i.test(ua)) browser = "Firefox";
  else if (/Edg/i.test(ua)) browser = "Edge";
  else if (/Opera|OPR/i.test(ua)) browser = "Opera";

  return `${os} • ${browser}`;
}

export type AdminDeviceResult = {
  success: boolean;
  status?: "existing_device" | "new_device_registered" | "device_limit_reached";
  device_count?: number;
  max_devices?: number;
  device_id?: string;
  error?: string;
};

export type AdminDeviceRecord = {
  id: string;
  device_id: string;
  device_name: string;
  user_agent?: string;
  last_active_at: string;
  created_at: string;
  user_id?: string;
};

/**
 * Verifica o registra el dispositivo actual ante la base de datos (Máximo 3 dispositivos admin).
 */
export async function verifyOrRegisterAdminDevice(): Promise<AdminDeviceResult> {
  const deviceId = getOrCreateDeviceId();
  const deviceName = getFriendlyDeviceName();
  const userAgent = typeof navigator !== "undefined" ? navigator.userAgent : "";

  try {
    const { data, error } = await supabase.rpc("verify_or_register_admin_device", {
      p_device_id: deviceId,
      p_device_name: deviceName,
      p_user_agent: userAgent,
    });

    if (error) {
      return {
        success: false,
        error: error.message,
      };
    }

    return (data as AdminDeviceResult) || { success: false, error: "Respuesta inválida" };
  } catch (err: any) {
    return {
      success: false,
      error: err?.message || "Error al verificar dispositivo",
    };
  }
}

/**
 * Desvincula un dispositivo administrador registrado por su device_id.
 */
export async function revokeAdminDevice(deviceId: string): Promise<{ success: boolean; error?: string }> {
  try {
    const { data, error } = await supabase.rpc("revoke_admin_device", {
      p_device_id: deviceId,
    });

    if (error) {
      return { success: false, error: error.message };
    }

    return { success: (data as any)?.success ?? true };
  } catch (err: any) {
    return { success: false, error: err?.message || "Error al desvincular dispositivo" };
  }
}

/**
 * Lista todos los dispositivos autorizados actuales (máximo 3).
 */
export async function listAdminDevices(): Promise<AdminDeviceRecord[]> {
  try {
    const { data, error } = await supabase
      .from("admin_devices")
      .select("*")
      .order("last_active_at", { ascending: false });

    if (error) {
      console.error("Error fetching admin devices:", error);
      return [];
    }

    return (data as AdminDeviceRecord[]) || [];
  } catch {
    return [];
  }
}
