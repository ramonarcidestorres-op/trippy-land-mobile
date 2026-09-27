/**
 * Trippy Land Store — Sistema de Rate Limiting (Control de Frecuencia / Protección contra Bots y Spam)
 * 
 * Implementa un algoritmo de ventana deslizante (sliding window log)
 * para regular la frecuencia de peticiones a nivel de:
 * 1. Rutas y navegación de la app
 * 2. Consultas y mutaciones a la API de Supabase
 * 3. Formulario de Checkout y creación de pedidos
 * 4. Autenticación (Login, Registro y Recuperación)
 * 5. Búsquedas y filtros en Catálogo
 * 6. Registro de suscripciones Push y contacto
 */

import { toast } from "sonner";

export type RateLimitCategory = 
  | "api"        // Peticiones generales a Supabase
  | "checkout"   // Envío de órdenes de compra
  | "auth"       // Intentos de login, signup, password reset
  | "search"     // Búsquedas en tiempo real
  | "routes"     // Transiciones y cambios de ruta
  | "push"       // Registro o pruebas de notificaciones
  | "contact"    // Envío de WhatsApp de contacto
  | "admin";     // Mutaciones de catálogo por admin

interface RateLimitConfig {
  maxRequests: number; // Número máximo permitido
  windowMs: number;    // Ventana de tiempo en milisegundos
  defaultMessage: string;
}

const LIMIT_CONFIGS: Record<RateLimitCategory, RateLimitConfig> = {
  api: {
    maxRequests: 60,
    windowMs: 10 * 1000, // 60 llamadas cada 10 seg
    defaultMessage: "Límite de peticiones alcanzado. Por favor espera unos segundos.",
  },
  checkout: {
    maxRequests: 3,
    windowMs: 30 * 1000, // 3 pedidos cada 30 seg
    defaultMessage: "Has intentado enviar varios pedidos seguidos. Por favor espera unos segundos.",
  },
  auth: {
    maxRequests: 5,
    windowMs: 60 * 1000, // 5 intentos por minuto
    defaultMessage: "Demasiados intentos de acceso. Por seguridad, espera un minuto.",
  },
  search: {
    maxRequests: 25,
    windowMs: 10 * 1000, // 25 búsquedas cada 10 seg
    defaultMessage: "Estás buscando demasiado rápido. Espera un momento.",
  },
  routes: {
    maxRequests: 35,
    windowMs: 10 * 1000, // 35 cambios de página cada 10 seg
    defaultMessage: "Navegación demasiado rápida. Por favor espera un momento.",
  },
  push: {
    maxRequests: 6,
    windowMs: 60 * 1000, // 6 peticiones por minuto
    defaultMessage: "Demasiadas solicitudes de avisos. Intenta más tarde.",
  },
  contact: {
    maxRequests: 3,
    windowMs: 60 * 1000, // 3 envíos de número por minuto
    defaultMessage: "Espera un momento antes de volver a enviar tu número de contacto.",
  },
  admin: {
    maxRequests: 30,
    windowMs: 10 * 1000, // 30 acciones admin cada 10 seg
    defaultMessage: "Acciones administrativas demasiado rápidas. Espera un momento.",
  },
};

// Almacén en memoria de marcas de tiempo por categoría y clave
const rateLimitStore = new Map<string, number[]>();

/**
 * Limpia marcas de tiempo antiguas fuera de la ventana.
 */
function cleanOldTimestamps(timestamps: number[], windowMs: number, now: number): number[] {
  const cutoff = now - windowMs;
  return timestamps.filter((t) => t > cutoff);
}

/**
 * Evalúa y consume un ticket de rate limit para una categoría y clave específica.
 */
export function consumeRateLimit(
  category: RateLimitCategory,
  customKey?: string,
  overrideConfig?: Partial<RateLimitConfig>
): {
  allowed: boolean;
  remaining: number;
  resetMs: number;
  waitSeconds: number;
} {
  const now = Date.now();
  const config = { ...LIMIT_CONFIGS[category], ...overrideConfig };
  const storeKey = `${category}:${customKey || "global"}`;

  const currentTimestamps = cleanOldTimestamps(
    rateLimitStore.get(storeKey) || [],
    config.windowMs,
    now
  );

  if (currentTimestamps.length >= config.maxRequests) {
    const oldest = currentTimestamps[0] || now;
    const resetMs = Math.max(0, oldest + config.windowMs - now);
    const waitSeconds = Math.ceil(resetMs / 1000);

    rateLimitStore.set(storeKey, currentTimestamps);
    return {
      allowed: false,
      remaining: 0,
      resetMs,
      waitSeconds,
    };
  }

  // Registrar la petición actual
  currentTimestamps.push(now);
  rateLimitStore.set(storeKey, currentTimestamps);

  return {
    allowed: true,
    remaining: config.maxRequests - currentTimestamps.length,
    resetMs: config.windowMs,
    waitSeconds: 0,
  };
}

/**
 * Verifica el límite y muestra automáticamente una alerta de notificación si se sobrepasó.
 * Retorna `true` si la acción es PERMITIDA, o `false` si fue BLOQUEADA por exceso.
 */
let lastToastTime = 0;

export function checkAndNotifyRateLimit(
  category: RateLimitCategory,
  customMessage?: string,
  customKey?: string
): boolean {
  const result = consumeRateLimit(category, customKey);

  if (!result.allowed) {
    const now = Date.now();
    // Evitar spam visual de toasts (máximo 1 cada 2 segundos)
    if (now - lastToastTime > 2000) {
      lastToastTime = now;
      const msg = customMessage || LIMIT_CONFIGS[category].defaultMessage;
      toast.error(`${msg} (${result.waitSeconds}s restante${result.waitSeconds > 1 ? "s" : ""})`);
    }
    return false;
  }

  return true;
}

/**
 * Helper para verificar si una petición de API está dentro de los límites
 */
export function isApiRateLimited(url?: string): boolean {
  const res = consumeRateLimit("api", url ? new URL(url, "https://local").pathname : undefined);
  return !res.allowed;
}
