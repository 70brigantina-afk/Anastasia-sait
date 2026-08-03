import sharp from "sharp";
import path from "path";
import { mkdir } from "fs/promises";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(__dirname, "..");
const raw = path.join(
  root,
  "public/images/anastasia/originals/portrait-walking-studio-cutout-raw.png"
);
const cutoutPng = path.join(
  root,
  "public/images/anastasia/originals/portrait-walking-studio-cutout.png"
);
const outDir = path.join(root, "public/images/anastasia/optimized");
await mkdir(outDir, { recursive: true });

// Лицо смотрит влево — для текста слева зеркало не нужно
const meta = await sharp(raw).trim({ threshold: 10 }).png().toFile(cutoutPng);
console.log(`Cutout: ${meta.width}x${meta.height}`);

for (const width of [480, 800, 1200]) {
  const resized = sharp(cutoutPng).resize({
    width,
    withoutEnlargement: true,
    fit: "inside",
  });
  await resized
    .clone()
    .webp({ quality: 90, alphaQuality: 95 })
    .toFile(path.join(outDir, `format-studio-cutout-${width}.webp`));
  await resized
    .clone()
    .png()
    .toFile(path.join(outDir, `format-studio-cutout-${width}.png`));
  console.log(`Saved format-studio-cutout-${width}`);
}
