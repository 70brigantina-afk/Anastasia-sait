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

async function softPatch(leftRatio, topRatio, wRatio, hRatio, blur = 5, opacity = 0.95) {
  const left = Math.max(0, Math.round(w * leftRatio));
  const top = Math.max(0, Math.round(h * topRatio));
  const width = Math.min(Math.round(w * wRatio), w - left);
  const height = Math.min(Math.round(h * hRatio), h - top);

  const patch = await sharp(src)
    .extract({ left, top, width, height })
    .blur(blur)
    .modulate({ brightness: 1.03, saturation: 0.96 })
    .toBuffer();

  const svg = Buffer.from(`
<svg width="${width}" height="${height}">
  <defs>
    <radialGradient id="g" cx="50%" cy="45%" r="68%">
      <stop offset="0%" stop-color="white" stop-opacity="${opacity}"/>
      <stop offset="55%" stop-color="white" stop-opacity="${opacity * 0.75}"/>
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
  // Тонкая горизонтальная полоса справа на лбу
  await softPatch(0.69, 0.085, 0.2, 0.035, 10, 1),
  await softPatch(0.7, 0.07, 0.18, 0.06, 7, 0.95),
  await softPatch(0.72, 0.05, 0.16, 0.1, 5.5, 0.9),
  await softPatch(0.66, 0.06, 0.22, 0.12, 4.5, 0.85),
  await softPatch(0.74, 0.09, 0.12, 0.05, 8, 1),
];

await sharp(src).composite(composites).png().toFile(out);

// Re-optimize hero only
const clean = out;
const opt = path.join(root, "public/images/anastasia/optimized");
for (const width of [640, 960, 1280, 1672]) {
  const pipeline = sharp(clean).resize({ width, withoutEnlargement: true, fit: "inside" });
  await pipeline.clone().webp({ quality: 86 }).toFile(path.join(opt, `hero-seated-${width}.webp`));
  await pipeline.clone().jpeg({ quality: 90, mozjpeg: true }).toFile(path.join(opt, `hero-seated-${width}.jpg`));
}

console.log("Aggressive forehead fix + hero rebuild done");
