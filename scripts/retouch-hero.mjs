import sharp from "sharp";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(__dirname, "..");
const src = path.join(
  root,
  "public/images/anastasia/originals/portrait-seated-blazer.png"
);
const out = path.join(
  root,
  "public/images/anastasia/originals/portrait-seated-blazer-clean.png"
);

const meta = await sharp(src).metadata();
const w = meta.width;
const h = meta.height;

async function softPatch(leftRatio, topRatio, wRatio, hRatio, blur = 4.5) {
  const left = Math.round(w * leftRatio);
  const top = Math.round(h * topRatio);
  const width = Math.round(w * wRatio);
  const height = Math.round(h * hRatio);

  const patch = await sharp(src)
    .extract({ left, top, width, height })
    .blur(blur)
    .modulate({ brightness: 1.02, saturation: 0.98 })
    .toBuffer();

  const svg = Buffer.from(`
<svg width="${width}" height="${height}">
  <defs>
    <radialGradient id="g" cx="50%" cy="48%" r="58%">
      <stop offset="0%" stop-color="white" stop-opacity="0.95"/>
      <stop offset="55%" stop-color="white" stop-opacity="0.7"/>
      <stop offset="100%" stop-color="white" stop-opacity="0"/>
    </radialGradient>
  </defs>
  <rect width="100%" height="100%" fill="url(#g)"/>
</svg>`);

  const masked = await sharp(patch)
    .ensureAlpha()
    .composite([{ input: svg, blend: "dest-in" }])
    .png()
    .toBuffer();

  return { input: masked, left, top, blend: "over" };
}

const composites = [
  await softPatch(0.6, 0.05, 0.28, 0.15, 5),
  await softPatch(0.63, 0.08, 0.22, 0.1, 3.2),
];

await sharp(src).composite(composites).png().toFile(out);
console.log("Stronger forehead retouch saved");
