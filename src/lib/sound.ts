/**
 * Utilidad de Sonido de Notificación estilo WhatsApp
 * Produce el característico tono armónico de dos notas de WhatsApp
 * tanto por Web Audio API (cero latencia) como por reproducción de audio WAV.
 */

let sharedAudioContext: AudioContext | null = null;

function getAudioContext(): AudioContext | null {
  if (typeof window === "undefined") return null;
  const AudioContextClass =
    window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
  if (!AudioContextClass) return null;

  if (!sharedAudioContext || sharedAudioContext.state === "closed") {
    sharedAudioContext = new AudioContextClass();
  }
  return sharedAudioContext;
}

/**
 * Sintetiza el tono de WhatsApp exactamente con dos armónicos resonantes:
 * - Nota 1: 1174.66 Hz (Re6) con caída rápida
 * - Nota 2: 1760.00 Hz (La6) con brillo y resonancia
 */
export function playWhatsAppChime() {
  if (typeof window === "undefined") return;

  // 1. Vibración estilo WhatsApp en dispositivos móviles compatibles
  if (typeof navigator !== "undefined" && "vibrate" in navigator) {
    try {
      navigator.vibrate([100, 50, 100]);
    } catch {
      // Ignorar restricciones de vibración
    }
  }

  // 2. Intentar reproducir archivo de audio pre-cargado
  try {
    const audio = new Audio("/notification.wav");
    audio.volume = 0.85;
    const playPromise = audio.play();
    if (playPromise !== undefined) {
      playPromise.catch(() => {
        // Si el navegador bloquea autoplay de elemento Audio, usar Web Audio API
        synthesizeWhatsAppTone();
      });
      return;
    }
  } catch {
    // Continuar a síntesis
  }

  synthesizeWhatsAppTone();
}

export function synthesizeWhatsAppTone() {
  try {
    const ctx = getAudioContext();
    if (!ctx) return;

    const execute = () => {
      const now = ctx.currentTime;

      // --- NOTA 1: D6 (1174.66 Hz) con armónicos ---
      const osc1 = ctx.createOscillator();
      const osc1Harmonic = ctx.createOscillator();
      const gain1 = ctx.createGain();

      osc1.type = "sine";
      osc1.frequency.setValueAtTime(1174.66, now);

      osc1Harmonic.type = "sine";
      osc1Harmonic.frequency.setValueAtTime(2349.32, now); // 2do armónico

      gain1.gain.setValueAtTime(0.001, now);
      gain1.gain.linearRampToValueAtTime(0.65, now + 0.005);
      gain1.gain.exponentialRampToValueAtTime(0.001, now + 0.18);

      osc1.connect(gain1);
      osc1Harmonic.connect(gain1);
      gain1.connect(ctx.destination);

      osc1.start(now);
      osc1Harmonic.start(now);
      osc1.stop(now + 0.18);
      osc1Harmonic.stop(now + 0.18);

      // --- NOTA 2: A6 (1760.00 Hz) con resonancia ---
      const t2 = now + 0.085;
      const osc2 = ctx.createOscillator();
      const osc2Harmonic = ctx.createOscillator();
      const osc2Third = ctx.createOscillator();
      const gain2 = ctx.createGain();

      osc2.type = "sine";
      osc2.frequency.setValueAtTime(1760.00, t2);

      osc2Harmonic.type = "sine";
      osc2Harmonic.frequency.setValueAtTime(3520.00, t2);

      osc2Third.type = "sine";
      osc2Third.frequency.setValueAtTime(5280.00, t2);

      gain2.gain.setValueAtTime(0.001, t2);
      gain2.gain.linearRampToValueAtTime(0.8, t2 + 0.005);
      gain2.gain.exponentialRampToValueAtTime(0.001, t2 + 0.55);

      osc2.connect(gain2);
      osc2Harmonic.connect(gain2);
      osc2Third.connect(gain2);
      gain2.connect(ctx.destination);

      osc2.start(t2);
      osc2Harmonic.start(t2);
      osc2Third.start(t2);
      osc2.stop(t2 + 0.55);
      osc2Harmonic.stop(t2 + 0.55);
      osc2Third.stop(t2 + 0.55);
    };

    if (ctx.state === "suspended") {
      ctx.resume().then(execute).catch(() => {});
    } else {
      execute();
    }
  } catch {
    // Si no es posible reproducir audio, ignorar silenciosamente
  }
}

export const playNotificationSound = playWhatsAppChime;
