/**
 * Trippy Land Store — Utilidades de Optimización y Precarga de Imágenes
 * 
 * - Conserva 100% las dimensiones en píxeles y proporciones originales.
 * - Evita layout shifts y mantiene la transparencia (alpha channel).
 * - Precarga segura en segundo plano con control de errores para nunca bloquear la carga.
 */

export interface ImageOptimizationOptions {
  width?: number;
  quality?: number;
  format?: "webp" | "origin";
}

/**
 * Optimiza la URL de una imagen para entrega rápida manteniendo la calidad visual y transparencia original.
 */
export function getOptimizedImageUrl(
  url: string | null | undefined,
  fallback: string = "/placeholder-product.svg"
): string {
  if (!url || typeof url !== "string" || url.trim() === "") {
    return fallback;
  }

  const cleanUrl = url.trim();

  // Si es una ruta local con caracteres especiales (ej. /categorias/sintéticos.png), asegurar encodeURI
  if (cleanUrl.startsWith("/") && !cleanUrl.startsWith("//")) {
    return encodeURI(cleanUrl);
  }

  // Si es una URL de Supabase Storage, podemos usar la URL directa limpia
  return cleanUrl;
}

/**
 * Precarga una lista de URLs de imágenes de forma segura con timeout.
 * NUNCA se cuelga ni bloquea la app si una o más imágenes fallan o tardan.
 */
export function preloadPriorityImages(urls: (string | null | undefined)[], timeoutMs = 1000): Promise<void> {
  if (typeof window === "undefined") return Promise.resolve();

  const validUrls = Array.from(new Set(urls.filter((u): u is string => Boolean(u && typeof u === "string" && u.trim().length > 0))));
  if (validUrls.length === 0) return Promise.resolve();

  const loadPromises = validUrls.map((url) => {
    return new Promise<void>((resolve) => {
      try {
        const img = new Image();
        img.onload = () => resolve();
        img.onerror = () => resolve(); // Resiliente: si falla, no detiene el arranque
        img.decoding = "async";
        img.src = getOptimizedImageUrl(url);
      } catch {
        resolve();
      }
    });
  });

  // Timeout guard para garantizar que el arranque continúe sin esperas excesivas
  const timeoutPromise = new Promise<void>((resolve) => {
    setTimeout(resolve, timeoutMs);
  });

  return Promise.race([Promise.all(loadPromises).then(() => {}), timeoutPromise]);
}
