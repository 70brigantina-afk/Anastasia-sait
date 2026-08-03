import { removeBackground } from "@imgly/background-removal-node";
import { writeFile, mkdir } from "fs/promises";
import path from "path";
import { fileURLToPath, pathToFileURL } from "url";
import { createRequire } from "module";

const require = createRequire(import.meta.url);
const sharp = require("sharp");

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(__dirname, "..");
const src = path.join(
  root,
  "public/images/anastasia/originals/portrait-walking-suit.png"
);
const outDir = path.join(root, "public/images/anastasia/optimized");
const cutoutPng = path.join(
  root,
  "public/images/anastasia/originals/portrait-walking-cutout.png"
);
const rawOut = path.join(
  root,
  "public/images/anastasia/originals/portrait-walking-cutout-raw.png"
);

await mkdir(outDir, { recursive: true });

console.log("Removing background (first run may download model)...");
const blob = await removeBackground(pathToFileURL(src).href, {
  model: "medium",
  output: { format: "image/png", type: "foreground" },
});

const arrayBuffer = await blob.arrayBuffer();
const rawPng = Buffer.from(arrayBuffer);
await writeFile(rawOut, rawPng);
console.log("Raw cutout saved");

const meta = await sharp(rawPng)
  .flop()
  .trim({ threshold: 8 })
  .png()
  .toFile(cutoutPng);

console.log(`Cutout: ${meta.width}x${meta.height}`);

for (const width of [480, 800, 1200]) {
  const resized = sharp(cutoutPng).resize({
    width,
    withoutEnlargement: true,
    fit: "inside",
  });

  await resized
    .clone()
    .webp({ quality: 90, alphaQuality: 90 })
    .toFile(path.join(outDir, `format-walking-cutout-${width}.webp`));

  await resized
    .clone()
    .png()
    .toFile(path.join(outDir, `format-walking-cutout-${width}.png`));

  console.log(`Saved format-walking-cutout-${width}`);
}

console.log("Done");
