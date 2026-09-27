/**
 * Trippy Land Store — Sanitización y Validación Estricta contra Código Malicioso / XSS / Inyecciones.
 * 
 * Limpia y valida de forma estricta los datos ingresados en formularios e inputs,
 * permitiendo únicamente los caracteres naturales esperados para cada tipo de dato.
 */

// Patrones peligrosos comunes de XSS, inyección y ejecución de scripts
const DANGEROUS_CODE_PATTERNS = [
  /<script[\s\S]*?>[\s\S]*?<\/script>/gi,
  /<style[\s\S]*?>[\s\S]*?<\/style>/gi,
  /<iframe[\s\S]*?>[\s\S]*?<\/iframe>/gi,
  /<embed[\s\S]*?>/gi,
  /<object[\s\S]*?>/gi,
  /<[\s\S]*?>/g, // Cualquier tag HTML
  /javascript\s*:/gi,
  /vbscript\s*:/gi,
  /data\s*:\s*text\/html/gi,
  /on\w+\s*=/gi, // onerror=, onclick=, onload=, etc.
  /\b(?:eval|alert|prompt|confirm|document\.cookie|window\.location)\b/gi,
  /--\s*$/g, // Comentarios SQL
  /\/\*[\s\S]*?\*\//g, // Comentarios SQL de bloque
];

/**
 * Limpia cualquier cadena eliminando caracteres de control nulos o tags de código.
 */
function stripDangerousCode(input: string): string {
  if (typeof input !== "string") return "";
  let clean = input
    // Eliminar caracteres de control y bytes nulos
    .replace(/[\u0000-\u0008\u000B-\u000C\u000E-\u001F\u007F-\u009F]/g, "")
    // Normalizar espacios múltiples
    .replace(/\r\n/g, "\n");

  // Aplicar filtros de código malicioso
  for (const pattern of DANGEROUS_CODE_PATTERNS) {
    clean = clean.replace(pattern, "");
  }

  return clean;
}

/**
 * 1. DIRECCIONES, BARRIOS, APARTAMENTOS E INDICACIONES
 * Permite: Letras, números, acentos, espacios, y caracteres típicos de dirección (#, -, °, ., ,, /, (, ), :, •, GPS, [, ]).
 * Rechaza y elimina cualquier tag <>, comillas ejecutables, scripts o caracteres de inyección.
 */
export function sanitizeAddress(input: string): string {
  if (!input) return "";
  const stripped = stripDangerousCode(input);
  // Permitir únicamente caracteres válidos para direcciones colombianas e internacionales
  return stripped
    .replace(/[^a-zA-Z0-9áéíóúÁÉÍÓÚñÑüÜ#°\-\_\.\,\/\(\)\:\•\[\]\s]/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

/**
 * 2. NOMBRES DE PERSONA
 * Permite: Letras con acentos, espacios, guiones y puntos (ej: Juan José, O'Connor, María-Fernanda).
 */
export function sanitizeName(input: string): string {
  if (!input) return "";
  const stripped = stripDangerousCode(input);
  return stripped
    .replace(/[^a-zA-Z0-9áéíóúÁÉÍÓÚñÑüÜ\s\-\.\']/g, "")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, 100);
}

/**
 * 3. CORREO ELECTRÓNICO
 * Validación estricta RFC 5322 simplificada para evitar cualquier código camuflado.
 */
export function sanitizeEmail(input: string): string {
  if (!input) return "";
  const clean = input.trim().toLowerCase().replace(/[^a-z0-9._%+\-@]/g, "");
  return clean.slice(0, 150);
}

export function isValidEmail(email: string): boolean {
  if (!email || email.length < 5 || email.length > 150) return false;
  // Regex estricto de correo
  const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
  return emailRegex.test(email);
}

/**
 * 4. NÚMEROS DE TELÉFONO Y WHATSAPP
 * Permite únicamente dígitos, el signo + inicial, espacios y guiones.
 */
export function sanitizePhone(input: string): string {
  if (!input) return "";
  const clean = input.trim().replace(/[^0-9+\-\s()]/g, "");
  return clean.slice(0, 25);
}

/**
 * 5. CÓDIGO DE REFERIDO
 * Estrictamente caracteres alfanuméricos, guiones y guiones bajos en mayúscula.
 */
export function sanitizeReferralCode(input: string): string {
  if (!input) return "";
  return input
    .toUpperCase()
    .replace(/\s+/g, "")
    .replace(/[^A-Z0-9_-]/g, "")
    .slice(0, 30);
}

/**
 * 6. BÚSQUEDA DE PRODUCTOS
 * Permite letras, números, acentos y espacios. Elimina operadores y código.
 */
export function sanitizeSearchQuery(input: string): string {
  if (!input) return "";
  const stripped = stripDangerousCode(input);
  return stripped
    .replace(/[^a-zA-Z0-9áéíóúÁÉÍÓÚñÑüÜ\s\-\.\,\#]/g, "")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, 80);
}

/**
 * 7. DESCRIPCIONES DE PRODUCTOS Y TEXTOS GENERALES
 * Preserva viñetas (✦, •, -), saltos de línea, acentos y puntuación sana, mientras elimina cualquier script o HTML.
 */
export function sanitizeProductText(input: string): string {
  if (!input) return "";
  const stripped = stripDangerousCode(input);
  return stripped
    .replace(/[^a-zA-Z0-9áéíóúÁÉÍÓÚñÑüÜ\s\n\r\.\,\:\;\!\?\(\)\-\–\—\✦\•\*\+\%\$\/]/g, "")
    .trim();
}

/**
 * 8. NÚMEROS Y PRECIOS
 * Convierte cualquier entrada a número entero o decimal limpio.
 */
export function sanitizeNumber(input: string | number, min = 0, max = 999999999): number {
  if (typeof input === "number") {
    if (isNaN(input) || !isFinite(input)) return min;
    return Math.max(min, Math.min(max, input));
  }
  if (!input) return min;
  const cleanStr = String(input).replace(/[^0-9.-]/g, "");
  const num = Number(cleanStr);
  if (isNaN(num) || !isFinite(num)) return min;
  return Math.max(min, Math.min(max, num));
}
