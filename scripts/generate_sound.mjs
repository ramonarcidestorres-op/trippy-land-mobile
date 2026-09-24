import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const publicDir = path.resolve(__dirname, "..", "public");

function generateWhatsAppToneWav() {
  const sampleRate = 44100;
  const duration = 0.7; // seconds
  const numSamples = Math.floor(sampleRate * duration);
  const dataSize = numSamples * 2; // 16-bit mono = 2 bytes per sample
  const buffer = Buffer.alloc(44 + dataSize);

  // WAV Header
  buffer.write("RIFF", 0);
  buffer.writeUInt32LE(36 + dataSize, 4);
  buffer.write("WAVE", 8);
  buffer.write("fmt ", 12);
  buffer.writeUInt32LE(16, 16); // Subchunk1Size (16 for PCM)
  buffer.writeUInt16LE(1, 20); // AudioFormat (1 for PCM)
  buffer.writeUInt16LE(1, 22); // NumChannels (1 = Mono)
  buffer.writeUInt32LE(sampleRate, 24); // SampleRate
  buffer.writeUInt32LE(sampleRate * 2, 28); // ByteRate (SampleRate * NumChannels * BitsPerSample/8)
  buffer.writeUInt16LE(2, 32); // BlockAlign (NumChannels * BitsPerSample/8)
  buffer.writeUInt16LE(16, 34); // BitsPerSample
  buffer.write("data", 36);
  buffer.writeUInt32LE(dataSize, 40);

  // Sound parameters: Classic WhatsApp two-tone bell chime
  // Note 1: D6 (1174.66 Hz) at t = 0.0s
  // Note 2: A6 (1760.00 Hz) at t = 0.09s
  for (let i = 0; i < numSamples; i++) {
    const t = i / sampleRate;
    let sample = 0;

    // Note 1
    if (t >= 0 && t < 0.35) {
      const dt1 = t;
      const attack1 = Math.min(1, dt1 / 0.004);
      const env1 = attack1 * Math.exp(-dt1 / 0.075);
      const f1 = 1174.66;
      sample += 0.55 * env1 * Math.sin(2 * Math.PI * f1 * dt1);
      sample += 0.20 * env1 * Math.sin(2 * Math.PI * (f1 * 2) * dt1);
      sample += 0.08 * env1 * Math.sin(2 * Math.PI * (f1 * 3) * dt1);
    }

    // Note 2
    if (t >= 0.085) {
      const dt2 = t - 0.085;
      const attack2 = Math.min(1, dt2 / 0.004);
      const env2 = attack2 * Math.exp(-dt2 / 0.18);
      const f2 = 1760.00;
      sample += 0.75 * env2 * Math.sin(2 * Math.PI * f2 * dt2);
      sample += 0.25 * env2 * Math.sin(2 * Math.PI * (f2 * 2) * dt2);
      sample += 0.10 * env2 * Math.sin(2 * Math.PI * (f2 * 3) * dt2);
      sample += 0.04 * env2 * Math.sin(2 * Math.PI * (f2 * 4) * dt2);
    }

    // Soft limiter / clamping
    sample = Math.max(-1, Math.min(1, sample));
    const intSample = Math.floor(sample * 32767);
    buffer.writeInt16LE(intSample, 44 + i * 2);
  }

  return buffer;
}

const wavBuffer = generateWhatsAppToneWav();
fs.writeFileSync(path.join(publicDir, "notification.wav"), wavBuffer);
fs.writeFileSync(path.join(publicDir, "whatsapp-notification.wav"), wavBuffer);
fs.writeFileSync(path.join(publicDir, "whatsapp-notification.mp3"), wavBuffer); // alias for browsers checking .mp3

console.log("WhatsApp notification audio files created successfully!");
