import sharp from "sharp";
import path from "path";
import { fileURLToPath } from "url";

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), "..");
const opt = path.join(root, "public/images/anastasia/optimized");
const originals = path.join(root, "public/images/anastasia/originals");

async function exportSizes(src, base, widths, quality) {
  const meta = await sharp(src).metadata();
  for (const width of widths) {
    const tw = Math.min(width, meta.width || width);
    await sharp(src)
      .resize({ width: tw, withoutEnlargement: true, fit: "inside" })
      .webp({ quality, effort: 5 })
      .toFile(path.join(opt, `${base}-${tw}.webp`));
    await sharp(src)
      .resize({ width: tw, withoutEnlargement: true, fit: "inside" })
      .jpeg({ quality: quality + 4, mozjpeg: true })
      .toFile(path.join(opt, `${base}-${tw}.jpg`));
    console.log("saved", `${base}-${tw}`);
  }
}

await exportSizes(
  path.join(originals, "portrait-format-full.png"),
  "format-full",
  [480, 682],
  88
);

await exportSizes(
  path.join(originals, "portrait-seated-blazer.png"),
  "hero-seated",
  [640, 960, 1024],
  90
);

console.log("done");
