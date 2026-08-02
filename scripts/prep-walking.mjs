import sharp from "sharp";
import path from "path";
import { fileURLToPath } from "url";
import { mkdir } from "fs/promises";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(__dirname, "..");
const src = path.join(
  root,
  "public/images/anastasia/originals/portrait-walking-suit.png"
);
const outDir = path.join(root, "public/images/anastasia/optimized");
await mkdir(outDir, { recursive: true });

const meta = await sharp(src).metadata();
const w = meta.width;
const h = meta.height;

// Зеркало + кроп вокруг фигуры с запасом над головой
const flipped = await sharp(src).flop().png().toBuffer();
const flippedMeta = await sharp(flipped).metadata();

// После flop фигура слева: берём левую часть кадра
const cropW = Math.round(flippedMeta.width * 0.58);
const cropH = flippedMeta.height;
const left = Math.round(flippedMeta.width * 0.02);
const top = 0;

const cropped = sharp(flipped).extract({
  left,
  top,
  width: Math.min(cropW, flippedMeta.width - left),
  height: cropH,
});

const widths = [480, 800, 1200];
for (const width of widths) {
  const pipeline = cropped.clone().resize({
    width,
    withoutEnlargement: true,
    fit: "inside",
  });

  await pipeline
    .clone()
    .webp({ quality: 84, effort: 5 })
    .toFile(path.join(outDir, `format-walking-${width}.webp`));

  const info = await pipeline
    .clone()
    .jpeg({ quality: 88, mozjpeg: true })
    .toFile(path.join(outDir, `format-walking-${width}.jpg`));

  console.log(`format-walking-${width} → ${info.width}x${info.height}`);
}

console.log("Walking crop ready");
