import sharp from "sharp";
import { mkdir, writeFile } from "fs/promises";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(__dirname, "..");
const srcDir = path.join(root, "public/images/education/originals");
const outDir = path.join(root, "public/images/education/optimized");

await mkdir(outDir, { recursive: true });

const docs = [
  {
    file: "diploma-main-retraining.png",
    base: "diploma-main",
    widths: [720, 1100, 1400],
    quality: 78,
  },
  {
    file: "cert-self-actualization.png",
    base: "cert-self-actualization",
    widths: [480, 800, 1100],
    quality: 76,
  },
  {
    file: "cert-negative-self-attitude.png",
    base: "cert-negative-self-attitude",
    widths: [480, 800, 1100],
    quality: 76,
  },
  {
    file: "cert-self-blame.png",
    base: "cert-self-blame",
    widths: [480, 800, 1100],
    quality: 76,
  },
  {
    file: "cert-autosympathy.png",
    base: "cert-autosympathy",
    widths: [480, 800, 1100],
    quality: 76,
  },
  {
    file: "cert-field-constellations.png",
    base: "cert-field-constellations",
    widths: [480, 800, 1100],
    quality: 76,
  },
  {
    file: "cert-advanced-training.png",
    base: "cert-advanced-training",
    widths: [720, 1100, 1400],
    quality: 76,
  },
];

const manifest = [];

for (const doc of docs) {
  const input = path.join(srcDir, doc.file);
  const meta = await sharp(input).metadata();

  for (const width of doc.widths) {
    const targetWidth = Math.min(width, meta.width);
    const outWebp = path.join(outDir, `${doc.base}-${targetWidth}.webp`);
    const outJpg = path.join(outDir, `${doc.base}-${targetWidth}.jpg`);

    const resized = sharp(input).resize({
      width: targetWidth,
      withoutEnlargement: true,
      fit: "inside",
    });

    const webpInfo = await resized
      .clone()
      .webp({ quality: doc.quality, effort: 5 })
      .toFile(outWebp);

    await resized
      .clone()
      .jpeg({ quality: doc.quality + 4, mozjpeg: true })
      .toFile(outJpg);

    console.log(
      `${path.basename(outWebp)} → ${webpInfo.width}x${webpInfo.height}, ${Math.round(webpInfo.size / 1024)} KB`
    );

    if (width === doc.widths[doc.widths.length - 1]) {
      manifest.push({
        base: doc.base,
        width: webpInfo.width,
        height: webpInfo.height,
      });
    }
  }
}

await writeFile(
  path.join(outDir, "manifest.json"),
  JSON.stringify(manifest, null, 2),
  "utf8"
);

console.log("Diploma optimization complete.");
