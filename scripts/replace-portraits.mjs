import sharp from "sharp";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(__dirname, "..");
const originalsDir = path.join(root, "public/images/anastasia/originals");
const optimizedDir = path.join(root, "public/images/anastasia/optimized");
const stagingDir = path.join(root, "public/images/anastasia/_incoming");
const assetsDir = path.join(
  process.env.USERPROFILE || "",
  ".cursor/projects/c-Users-irina-Desktop-Cursor-Anastasia-sait-Anastasia-sait/assets"
);

const jobs = [
  {
    label: "standing-white-shirt",
    match: "19_16_56",
    originals: [
      "portrait-format-full.png",
      "portrait-arms-crossed.png",
      "portrait-standing-full.png",
      "portrait-standing-medium.png",
    ],
    outputs: [
      { base: "format-full", widths: [480, 576], quality: 84 },
      { base: "cta-arms", widths: [480, 800, 1024], quality: 84 },
    ],
  },
  {
    label: "seated-sage-blazer",
    match: "19_17_05",
    originals: ["portrait-seated-blazer.png", "portrait-seated-blazer-clean.png"],
    outputs: [{ base: "hero-seated", widths: [640, 960, 1280, 1600], quality: 86 }],
  },
  {
    label: "tablet",
    match: "19_16_50",
    originals: ["portrait-tablet.png"],
    outputs: [{ base: "hero-tablet", widths: [640, 960, 1024], quality: 86 }],
  },
  {
    label: "armchair-notebook",
    match: "19_16_30",
    originals: ["portrait-armchair-notebook.png"],
    outputs: [{ base: "about-armchair", widths: [480, 800, 1200], quality: 84 }],
  },
];

function findAsset(match) {
  const files = fs.readdirSync(assetsDir);
  const found = files.find((f) => f.includes(match) && f.endsWith(".png"));
  if (!found) throw new Error("Asset not found for " + match);
  return path.join(assetsDir, found);
}

async function exportSizes(src, base, widths, quality) {
  const meta = await sharp(src).metadata();
  const done = new Set();
  for (const width of widths) {
    const tw = Math.min(width, meta.width || width);
    if (done.has(tw)) continue;
    done.add(tw);

    const webp = path.join(optimizedDir, `${base}-${tw}.webp`);
    const jpg = path.join(optimizedDir, `${base}-${tw}.jpg`);

    await sharp(src)
      .resize({ width: tw, withoutEnlargement: true, fit: "inside" })
      .webp({ quality, effort: 5 })
      .toFile(webp);

    await sharp(src)
      .resize({ width: tw, withoutEnlargement: true, fit: "inside" })
      .jpeg({ quality: Math.min(quality + 4, 92), mozjpeg: true })
      .toFile(jpg);

    const info = await sharp(webp).metadata();
    console.log(`  ${base}-${tw} → ${info.width}x${info.height}`);
  }
}

async function main() {
  fs.mkdirSync(optimizedDir, { recursive: true });
  fs.mkdirSync(originalsDir, { recursive: true });
  fs.mkdirSync(stagingDir, { recursive: true });

  for (const job of jobs) {
    const assetPath = findAsset(job.match);
    const staged = path.join(stagingDir, `${job.label}.png`);
    fs.copyFileSync(assetPath, staged);

    console.log("\n===", job.label);
    // Read via buffer — avoids Windows long-path quirks with sharp
    const buffer = fs.readFileSync(staged);
    const meta = await sharp(buffer).metadata();
    console.log("source", `${meta.width}x${meta.height}`);

    for (const name of job.originals) {
      const dest = path.join(originalsDir, name);
      await sharp(buffer).png({ compressionLevel: 9 }).toFile(dest);
      console.log("  original", name);
    }

    for (const out of job.outputs) {
      await exportSizes(buffer, out.base, out.widths, out.quality);
    }
  }

  fs.rmSync(stagingDir, { recursive: true, force: true });
  console.log("\nDone.");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
