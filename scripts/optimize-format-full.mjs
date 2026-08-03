import sharp from "sharp";
import { mkdir } from "fs/promises";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(__dirname, "..");
const input = path.join(root, "public/images/anastasia/originals/portrait-format-full.png");
const outDir = path.join(root, "public/images/anastasia/optimized");
await mkdir(outDir, { recursive: true });

const meta = await sharp(input).metadata();
console.log(`source: ${meta.width}x${meta.height}`);

for (const width of [480, 800, 1024]) {
  const tw = Math.min(width, meta.width);
  const pipeline = sharp(input).resize({
    width: tw,
    withoutEnlargement: true,
    fit: "inside",
  });
  const info = await pipeline
    .clone()
    .webp({ quality: 86, effort: 5 })
    .toFile(path.join(outDir, `format-full-${tw}.webp`));
  await pipeline
    .clone()
    .jpeg({ quality: 90, mozjpeg: true })
    .toFile(path.join(outDir, `format-full-${tw}.jpg`));
  console.log(`saved format-full-${tw} (${info.width}x${info.height})`);
}
