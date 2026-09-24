/**
 * Utilidad de Sonido de Notificación estilo WhatsApp
 * Produce el característico tono armónico de dos notas de WhatsApp
 * tanto por Web Audio API (cero latencia y máxima fiabilidad) como por fallback de audio.
 */

let globalAudioCtx: AudioContext | null = null;
let isUnlocked = false;

function initAndUnlockAudio() {
  if (typeof window === "undefined") return;
  try {
    const AudioContextClass =
      window.AudioContext ||
      (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    if (!AudioContextClass) return;

    if (!globalAudioCtx || globalAudioCtx.state === "closed") {
      globalAudioCtx = new AudioContextClass();
    }

    if (globalAudioCtx.state === "suspended") {
      globalAudioCtx.resume().then(() => {
        isUnlocked = true;
      }).catch(() => {});
    } else {
      isUnlocked = true;
    }
  } catch {
    // Ignorar si el navegador aún bloquea antes del primer gesto
  }
}

// Auto-desbloquear el motor de audio en el primer toque o click en la pantalla
if (typeof window !== "undefined") {
  const unlockEvents = ["pointerdown", "touchstart", "click", "keydown"];
  const handleFirstInteraction = () => {
    initAndUnlockAudio();
    unlockEvents.forEach((ev) => window.removeEventListener(ev, handleFirstInteraction, true));
  };
  unlockEvents.forEach((ev) => window.addEventListener(ev, handleFirstInteraction, { capture: true, passive: true }));
}

/**
 * Sintetiza el tono característico de dos notas de WhatsApp:
 * - Nota 1: D6 (1174.66 Hz) con armónico 2349 Hz y ataque rápido
 * - Nota 2: A6 (1760.00 Hz) con armónicos 3520 Hz y 5280 Hz con resonancia
 */
export function playWhatsAppChime() {
  if (typeof window === "undefined") return;

  // 1. Doble vibración estilo WhatsApp en móviles
  if (typeof navigator !== "undefined" && "vibrate" in navigator) {
    try {
      navigator.vibrate([100, 50, 100]);
    } catch {
      // Ignorar restricciones de vibración
    }
  }

  // 2. Síntesis Web Audio directa de alta fidelidad
  try {
    const AudioContextClass =
      window.AudioContext ||
      (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    if (!AudioContextClass) return;

    if (!globalAudioCtx || globalAudioCtx.state === "closed") {
      globalAudioCtx = new AudioContextClass();
    }

    const ctx = globalAudioCtx;

    const playTone = () => {
      const now = ctx.currentTime;

      // --- NOTA 1: D6 (1174.66 Hz) ---
      const osc1 = ctx.createOscillator();
      const osc1H = ctx.createOscillator();
      const gain1 = ctx.createGain();

      osc1.type = "sine";
      osc1.frequency.setValueAtTime(1174.66, now);

      osc1H.type = "sine";
      osc1H.frequency.setValueAtTime(2349.32, now);

      gain1.gain.setValueAtTime(0.001, now);
      gain1.gain.linearRampToValueAtTime(0.7, now + 0.004);
      gain1.gain.exponentialRampToValueAtTime(0.001, now + 0.16);

      osc1.connect(gain1);
      osc1H.connect(gain1);
      gain1.connect(ctx.destination);

      osc1.start(now);
      osc1H.start(now);
      osc1.stop(now + 0.16);
      osc1H.stop(now + 0.16);

      // --- NOTA 2: A6 (1760.00 Hz) ---
      const t2 = now + 0.085;
      const osc2 = ctx.createOscillator();
      const osc2H1 = ctx.createOscillator();
      const osc2H2 = ctx.createOscillator();
      const gain2 = ctx.createGain();

      osc2.type = "sine";
      osc2.frequency.setValueAtTime(1760.00, t2);

      osc2H1.type = "sine";
      osc2H1.frequency.setValueAtTime(3520.00, t2);

      osc2H2.type = "sine";
      osc2H2.frequency.setValueAtTime(5280.00, t2);

      gain2.gain.setValueAtTime(0.001, t2);
      gain2.gain.linearRampToValueAtTime(0.85, t2 + 0.004);
      gain2.gain.exponentialRampToValueAtTime(0.001, t2 + 0.55);

      osc2.connect(gain2);
      osc2H1.connect(gain2);
      osc2H2.connect(gain2);
      gain2.connect(ctx.destination);

      osc2.start(t2);
      osc2H1.start(t2);
      osc2H2.start(t2);
      osc2.stop(t2 + 0.55);
      osc2H1.stop(t2 + 0.55);
      osc2H2.stop(t2 + 0.55);
    };

    if (ctx.state === "suspended") {
      ctx.resume().then(playTone).catch(() => {});
    } else {
      playTone();
    }
  } catch (e) {
    console.warn("Audio chime fallback:", e);
  }
}

export const playNotificationSound = playWhatsAppChime;
