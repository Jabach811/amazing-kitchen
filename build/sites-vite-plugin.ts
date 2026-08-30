import { access, cp, mkdir, readFile, rename, rm, writeFile } from "node:fs/promises";
import { resolve } from "node:path";
import type { Plugin } from "vite";

async function exists(path: string): Promise<boolean> {
  try {
    await access(path);
    return true;
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === "ENOENT") return false;
    throw error;
  }
}

export function sites(): Plugin {
  let root = process.cwd();

  return {
    name: "sites",
    apply: "build",
    configResolved(config) {
      root = config.root;
    },
    async closeBundle() {
      const serverDirectory = resolve(root, "dist", "server");
      const entrypoint = resolve(serverDirectory, "index.js");
      const appHandler = resolve(serverDirectory, "app-router-handler.js");
      const ssrEntrypoint = resolve(serverDirectory, "ssr", "index.js");

      if (!(await exists(entrypoint)) || !(await exists(ssrEntrypoint))) return;

      await rename(entrypoint, appHandler);
      const ssrSource = await readFile(ssrEntrypoint, "utf8");
      const rewrittenSsrSource = ssrSource.replaceAll(
        "../index.js",
        "../app-router-handler.js",
      );
      if (rewrittenSsrSource === ssrSource) {
        throw new Error("Could not retarget the generated Vinext server handler.");
      }
      await writeFile(ssrEntrypoint, rewrittenSsrSource);
      await writeFile(
        entrypoint,
        `export * from "./app-router-handler.js";\nimport appHandler from "./app-router-handler.js";\n\nexport default {\n  fetch(request, _env, _ctx) {\n    return appHandler(request);\n  },\n};\n`,
      );

      const destination = resolve(root, "dist", ".openai");
      await rm(destination, { recursive: true, force: true });
      await mkdir(destination, { recursive: true });
      await cp(resolve(root, ".openai", "hosting.json"), resolve(destination, "hosting.json"));
    },
  };
}
