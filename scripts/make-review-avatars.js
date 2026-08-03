const sharp = require("sharp");
const path = require("path");
const fs = require("fs");

const outDir = path.join("public", "images", "reviews", "avatars");
const originals = path.join("public", "images", "reviews", "originals");
fs.mkdirSync(outDir, { recursive: true });

async function circleFrom(src, left, top, size, name) {
  const meta = await sharp(src).metadata();
  if (left + size > meta.width || top + size > meta.height) {
    throw new Error(`Crop out of bounds for ${name}: ${meta.width}x${meta.height}`);
  }

  const buf = await sharp(src)
    .extract({ left, top, width: size, height: size })
    .resize(192, 192, { kernel: "lanczos3" })
    .png()
    .toBuffer();

  const mask = Buffer.from(
    '<svg width="192" height="192"><circle cx="96" cy="96" r="96" fill="#fff"/></svg>'
  );

  await sharp(buf)
    .composite([{ input: mask, blend: "dest-in" }])
    .png()
    .toFile(path.join(outDir, `${name}.png`));

  await sharp(buf)
    .composite([{ input: mask, blend: "dest-in" }])
    .webp({ quality: 84 })
    .toFile(path.join(outDir, `${name}.webp`));

  console.log("saved", name, { left, top, size });
}

async function initials(name, letters, c1, c2) {
  const svg = Buffer.from(`<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="192" height="192" viewBox="0 0 192 192">
  <defs>
    <linearGradient id="g" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0%" stop-color="${c1}"/>
      <stop offset="100%" stop-color="${c2}"/>
    </linearGradient>
  </defs>
  <circle cx="96" cy="96" r="96" fill="url(#g)"/>
  <text x="96" y="112" text-anchor="middle" dominant-baseline="middle"
    font-family="Segoe UI, Arial, sans-serif" font-size="70" font-weight="700" fill="#fff">${letters}</text>
</svg>`);
  await sharp(svg).png().toFile(path.join(outDir, `${name}.png`));
  await sharp(svg).webp({ quality: 90 }).toFile(path.join(outDir, `${name}.webp`));
  console.log("saved", name, "initials");
}

async function main() {
  const olga = path.join(originals, "a44f6b9b-d1a1-46f5-b4af-6a1567030789.jpg");
  const svet = path.join(originals, "c48cabdb-2400-4e69-9bdb-e8884b81d43b.jpg");

  // Olga: avatar in floating chat header pill
  await circleFrom(olga, 146, 90, 58, "avatar-olga");

  // Svetlana: avatar left of white bubble — refine from known good region
  const svetMeta = await sharp(svet).metadata();
  console.log("svetlana source", svetMeta.width, svetMeta.height);

  // Preview strip to help if needed
  await sharp(svet)
    .extract({ left: 0, top: 40, width: Math.min(320, svetMeta.width), height: Math.min(220, svetMeta.height - 40) })
    .png()
    .toFile(path.join(outDir, "_svet-zoom.png"));

  // Face/shoulders inside Telegram circular avatar (no wallpaper)
  await circleFrom(svet, 38, 48, 44, "avatar-svetlana");

  await initials("avatar-yana", "ЯА", "#3b86d4", "#6ec8f0");
  await initials("avatar-irina", "И", "#6d8496", "#9aafc0");
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
