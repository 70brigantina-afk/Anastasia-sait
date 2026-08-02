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
    file: "portrait-seated-blazer.png",
    base: "hero-seated",
    widths: [640, 960, 1280, 1672],
    quality: 86,
  },
  {
    file: "portrait-armchair-notebook.png",
    base: "about-armchair",
    widths: [480, 800, 1200],
    quality: 84,
  },
  {
    file: "portrait-standing-full.png",
    base: "cta-standing",
    widths: [480, 800, 1200],
    quality: 84,
  },
  {
    file: "portrait-walking-suit.png",
    base: "format-walking",
    widths: [480, 800, 1200],
    quality: 84,
  },
];

for (const job of jobs) {
  const input = path.join(srcDir, job.file);
  const meta = await sharp(input).metadata();

  for (const width of job.widths) {
    const targetWidth = Math.min(width, meta.width);
    const outWebp = path.join(outDir, `${job.base}-${targetWidth}.webp`);
    const outJpg = path.join(outDir, `${job.base}-${targetWidth}.jpg`);

    const pipeline = sharp(input).resize({
      width: targetWidth,
      withoutEnlargement: true,
      fit: "inside",
    });

    await pipeline
      .clone()
      .webp({ quality: job.quality, effort: 5 })
      .toFile(outWebp);

    await pipeline
      .clone()
      .jpeg({ quality: job.quality + 4, mozjpeg: true })
      .toFile(outJpg);

    const infoWebp = await sharp(outWebp).metadata();
    console.log(
      `${path.basename(outWebp)} → ${infoWebp.width}x${infoWebp.height}`
    );
  }
}

console.log("Done optimizing portraits.");
