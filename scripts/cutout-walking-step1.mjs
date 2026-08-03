import { removeBackground } from "@imgly/background-removal-node";
import { writeFile, mkdir } from "fs/promises";
import path from "path";
import { fileURLToPath, pathToFileURL } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(__dirname, "..");
const src = path.join(
  root,
  "public/images/anastasia/originals/portrait-walking-suit.png"
);
const outDir = path.join(root, "public/images/anastasia/originals");
const rawOut = path.join(outDir, "portrait-walking-cutout-raw.png");

await mkdir(outDir, { recursive: true });
console.log("Removing background...");
const blob = await removeBackground(pathToFileURL(src).href, {
  model: "medium",
  output: { format: "image/png", type: "foreground" },
});
await writeFile(rawOut, Buffer.from(await blob.arrayBuffer()));
console.log("Saved", rawOut);
