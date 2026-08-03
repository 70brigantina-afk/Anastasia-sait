import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), "..");
const mustExist = [
  "index.html",
  "education.html",
  "privacy.html",
  "consent.html",
  "rules.html",
  "404.html",
  "robots.txt",
  "sitemap.xml",
  "favicon.svg",
  "LAUNCH_CHECKLIST.md",
  "SEO_PLAN.md",
  "js/config.js",
  "js/main.js",
  "css/styles.css",
  "public/images/anastasia/optimized/hero-tablet-1024.jpg",
  "public/images/anastasia/optimized/about-armchair-800.jpg",
  "public/images/anastasia/optimized/format-full-576.jpg",
  "public/images/anastasia/optimized/hero-seated-960.jpg",
  "public/images/education/optimized/diploma-main-1100.jpg",
];

let ok = true;
for (const rel of mustExist) {
  const full = path.join(root, rel);
  const exists = fs.existsSync(full);
  console.log((exists ? "OK  " : "MISS") + " " + rel);
  if (!exists) ok = false;
}

const index = fs.readFileSync(path.join(root, "index.html"), "utf8");
const checks = [
  ["reviews hidden", /id="reviews"[^>]*hidden/.test(index)],
  ["no Связаться nav", !index.includes(">Связаться<")],
  ["Записаться nav", index.includes(">Записаться<")],
  ["consent link", index.includes("consent.html")],
  ["rules link", index.includes("rules.html")],
];
for (const [label, pass] of checks) {
  console.log((pass ? "OK  " : "FAIL") + " " + label);
  if (!pass) ok = false;
}

process.exit(ok ? 0 : 1);
