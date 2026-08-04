import sharp from "sharp";
import fs from "fs";
import path from "path";

const outDir = "public/images/reviews/avatars";

async function circleFrom(src, left, top, size, name) {
  const mask = Buffer.from(
    '<svg width="192" height="192"><circle cx="96" cy="96" r="96" fill="white"/></svg>'
  );
  const square = await sharp(src)
    .extract({ left, top, width: size, height: size })
    .resize(192, 192)
    .png()
    .toBuffer();

  await sharp(square)
    .composite([{ input: mask, blend: "dest-in" }])
    .png()
    .toFile(path.join(outDir, `${name}.png`));

  await sharp(square)
    .composite([{ input: mask, blend: "dest-in" }])
    .webp({ quality: 82 })
    .toFile(path.join(outDir, `${name}.webp`));

  await sharp(src)
    .extract({
      left: Math.max(0, left - 24),
      top: Math.max(0, top - 24),
      width: size + 48,
      height: size + 48,
    })
    .resize(180)
    .png()
    .toFile(path.join(outDir, `${name}-check.png`));

  console.log("ok", name, { left, top, size });
}

const grid = path.join(outDir, "_grid");
if (fs.existsSync(grid)) {
  for (const f of fs.readdirSync(grid)) fs.unlinkSync(path.join(grid, f));
  fs.rmdirSync(grid);
}

await circleFrom(
  "public/images/reviews/originals/review-svetlana-v.jpg",
  110,
  101,
  88,
  "avatar-svetlana-v"
);
await circleFrom(
  "public/images/reviews/originals/review-elena-v.jpg",
  137,
  95,
  85,
  "avatar-elena"
);

for (const f of [
  "58a92d78-85d1-44d4-bf5c-7fb42313f09f.jpg",
  "74bcc59c-3988-4135-8660-b28922bc6265.jpg",
]) {
  if (fs.existsSync(f)) {
    fs.unlinkSync(f);
    console.log("removed", f);
  }
}

console.log("done");
