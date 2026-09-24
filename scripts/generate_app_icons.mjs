import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, "..");
const publicDir = path.join(rootDir, "public");

const srcLogoPng = path.join(publicDir, "tripi-logo-app.png");

if (fs.existsSync(srcLogoPng)) {
  const logoBuffer = fs.readFileSync(srcLogoPng);
  fs.writeFileSync(path.join(publicDir, "icon-512.png"), logoBuffer);
  fs.writeFileSync(path.join(publicDir, "favicon.png"), logoBuffer);
  fs.writeFileSync(path.join(publicDir, "icon-192.png"), logoBuffer);
  fs.writeFileSync(path.join(publicDir, "apple-touch-icon.png"), logoBuffer);
  console.log("Copied tripi-logo-app.png to all app icons successfully!");
} else {
  console.warn("Warning: tripi-logo-app.png not found in public directory");
}
