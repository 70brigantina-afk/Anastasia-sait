import sharp from "sharp";
import { mkdir } from "fs/promises";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(__dirname, "..");
const srcDir = path.join(root, "public/images/anastasia/originals");
const outDir = path.join(root, "public/images/anastasia/optimized");
await mkdir(outDir, { recursive: true });

const jobs = [
  {
    file: "portrait-tablet.png",
    base: "hero-tablet",
    widths: [640, 960, 1024],
    quality: 86,
  },
  {
    file: "portrait-arms-crossed.png",
    base: "cta-arms",
    widths: [480, 800, 1024],
    quality: 84,
  },
];

for (const job of jobs) {
  const input = path.join(srcDir, job.file);
  const meta = await sharp(input).metadata();
  console.log(`${job.file}: ${meta.width}x${meta.height}`);

  for (const width of job.widths) {
    const tw = Math.min(width, meta.width);
    const pipeline = sharp(input).resize({
      width: tw,
      withoutEnlargement: true,
      fit: "inside",
    });

    const webp = path.join(outDir, `${job.base}-${tw}.webp`);
    const jpg = path.join(outDir, `${job.base}-${tw}.jpg`);
    await pipeline.clone().webp({ quality: job.quality, effort: 5 }).toFile(webp);
    await pipeline
      .clone()
      .jpeg({ quality: job.quality + 4, mozjpeg: true })
      .toFile(jpg);
    console.log(`saved ${job.base}-${tw}`);
  }
}

console.log("Done.");
