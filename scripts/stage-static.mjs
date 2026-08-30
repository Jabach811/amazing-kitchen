import { cp, mkdir, rm } from "node:fs/promises";
import { resolve } from "node:path";

const root = resolve(import.meta.dirname, "..");
const publicDirectory = resolve(root, "public");
const rootFiles = [
  "index.html",
  "menu.html",
  "script.js",
  "styles.css",
  "apple-touch-icon.png",
  "favicon.svg",
  "og-image.png",
  "robots.txt",
  "sitemap.xml",
];

await rm(publicDirectory, { recursive: true, force: true });
await mkdir(publicDirectory, { recursive: true });

await Promise.all(
  rootFiles.map((file) => cp(resolve(root, file), resolve(publicDirectory, file))),
);
await cp(resolve(root, "v2"), resolve(publicDirectory, "v2"), { recursive: true });
