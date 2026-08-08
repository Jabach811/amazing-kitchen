import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const files = ["index.html", "menu.html", "script.js", "styles.css"];

test("build staging keeps the published pages byte-for-byte identical", async () => {
  for (const file of files) {
    const [source, staged] = await Promise.all([
      readFile(file),
      readFile(`public/${file}`),
    ]);
    assert.deepEqual(staged, source, `${file} changed while being staged`);
  }
});

test("build staging includes the alternate v2 site", async () => {
  const [source, staged] = await Promise.all([
    readFile("v2/index.html"),
    readFile("public/v2/index.html"),
  ]);
  assert.deepEqual(staged, source);
});

test("uses an available React DOM type package version", async () => {
  const packageJson = JSON.parse(await readFile("package.json", "utf8"));
  assert.equal(packageJson.devDependencies["@types/react-dom"], "19.2.3");
});

test("uses portable environment syntax for the local hosting commands", async () => {
  const packageJson = JSON.parse(await readFile("package.json", "utf8"));
  assert.match(packageJson.scripts.build, /&& cross-env WRANGLER_LOG_PATH=/);
  assert.equal(packageJson.devDependencies["cross-env"], "7.0.3");
});

test("includes the framework's required server-component plugin", async () => {
  const packageJson = JSON.parse(await readFile("package.json", "utf8"));
  assert.equal(packageJson.devDependencies["@vitejs/plugin-rsc"], "0.5.26");
});

test("includes the framework's local server renderer", async () => {
  const packageJson = JSON.parse(await readFile("package.json", "utf8"));
  assert.equal(packageJson.devDependencies["react-server-dom-webpack"], "19.2.6");
});
