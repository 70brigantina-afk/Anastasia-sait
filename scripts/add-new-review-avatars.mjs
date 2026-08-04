import sharp from "sharp";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), "..");
const originals = path.join(root, "public/images/reviews/originals");
const avatars = path.join(root, "public/images/reviews/avatars");
fs.mkdirSync(originals, { recursive: true });
fs.mkdirSync(avatars, { recursive: true });

const mask = Buffer.from(
  '<svg width="192" height="192"><circle cx="96" cy="96" r="96" fill="#fff"/></svg>'
);

async function circleFrom(src, left, top, size, name) {
  const buf = await sharp(src)
    .extract({ left, top, width: size, height: size })
    .resize(192, 192, { kernel: "lanczos3" })
    .png()
    .toBuffer();

  await sharp(buf)
    .composite([{ input: mask, blend: "dest-in" }])
    .png()
    .toFile(path.join(avatars, `${name}.png`));

  await sharp(buf)
    .composite([{ input: mask, blend: "dest-in" }])
    .webp({ quality: 84 })
    .toFile(path.join(avatars, `${name}.webp`));

  await sharp(src)
    .extract({ left: Math.max(0, left - 20), top: Math.max(0, top - 20), width: Math.min(size + 40, 200), height: Math.min(size + 40, 200) })
    .png()
    .toFile(path.join(avatars, `${name}-check.png`));

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
    font-family="Segoe UI, Arial, sans-serif" font-size="64" font-weight="700" fill="#fff">${letters}</text>
</svg>`);
  await sharp(svg).png().toFile(path.join(avatars, `${name}.png`));
  await sharp(svg).webp({ quality: 90 }).toFile(path.join(avatars, `${name}.webp`));
  console.log("saved", name, "initials");
}

const svetlanaSrc = path.join(root, "58a92d78-85d1-44d4-bf5c-7fb42313f09f.jpg");
const elenaSrc = path.join(root, "74bcc59c-3988-4135-8660-b28922bc6265.jpg");

fs.copyFileSync(svetlanaSrc, path.join(originals, "review-svetlana-v.jpg"));
fs.copyFileSync(elenaSrc, path.join(originals, "review-elena-v.jpg"));

const sMeta = await sharp(svetlanaSrc).metadata();
const eMeta = await sharp(elenaSrc).metadata();
console.log("svetlana", sMeta.width, sMeta.height);
console.log("elena", eMeta.width, eMeta.height);

// Telegram header avatars are usually top-left; try a few crops then fall back to initials
try {
  // Svetlana V: small circular avatar in chat header area (top)
  await circleFrom(svetlanaSrc, 28, 70, 72, "avatar-svetlana-v");
} catch (e) {
  console.log("svetlana crop failed", e.message);
  await initials("avatar-svetlana-v", "СВ", "#6d8496", "#9aafc0");
}

try {
  // Elena: avatar next to name in header
  await circleFrom(elenaSrc, 24, 68, 78, "avatar-elena");
} catch (e) {
  console.log("elena crop failed", e.message);
  await initials("avatar-elena", "ЕВ", "#8ba8a1", "#4a5d59");
}

console.log("done");
