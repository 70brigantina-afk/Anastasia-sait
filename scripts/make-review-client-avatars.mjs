import sharp from "sharp";
import path from "path";
import fs from "fs";

const dir = path.join("public", "images", "reviews", "avatars");
const originals = path.join("public", "images", "reviews", "originals");
const size = 256;

async function squareFrom(src, outBase, opts = {}) {
  const { extract, position = "centre" } = opts;
  let pipeline = sharp(src).rotate();
  if (extract) pipeline = pipeline.extract(extract);
  const pngPath = path.join(dir, `${outBase}.png`);
  const webpPath = path.join(dir, `${outBase}.webp`);
  await pipeline
    .resize(size, size, {
      fit: "cover",
      position,
      kernel: sharp.kernel.lanczos3,
    })
    .png({ compressionLevel: 9 })
    .toFile(pngPath);
  await sharp(pngPath).webp({ quality: 90 }).toFile(webpPath);
  console.log("ok", outBase);
}

const elenaSrc =
  process.argv[2] && fs.existsSync(process.argv[2])
    ? process.argv[2]
    : path.join(
        process.env.USERPROFILE || "",
        ".cursor",
        "projects",
        "c-Users-irina-Desktop-Cursor-Anastasia-sait-Anastasia-sait",
        "assets",
        "client-avatar-elena-source.png",
      );

await squareFrom(elenaSrc, "client-avatar-elena", { position: "centre" });

const svetShot = path.join(originals, "c48cabdb-2400-4e69-9bdb-e8884b81d43b.jpg");
if (fs.existsSync(svetShot)) {
  await squareFrom(svetShot, "client-avatar-svetlana", {
    extract: { left: 54, top: 32, width: 48, height: 44 },
    position: "centre",
  });
} else {
  await squareFrom(path.join(dir, "avatar-svetlana.png"), "client-avatar-svetlana", {
    position: "north",
  });
}
