import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { stripTypeScriptTypes } from "node:module";
import { dirname, resolve } from "node:path";

const targets = [
  ["src/scanner.ts", "dist/scanner.mjs"],
  ["src/cli.ts", "dist/cli.mjs"],
  ["src/action.ts", "dist/action.mjs"]
];

for (const [sourcePath, outputPath] of targets) {
  const source = readFileSync(resolve(sourcePath), "utf8");
  const compiled = stripTypeScriptTypes(source, { mode: "strip" })
    .replaceAll('"./scanner.ts"', '"./scanner.mjs"');
  const absoluteOutput = resolve(outputPath);
  mkdirSync(dirname(absoluteOutput), { recursive: true });
  writeFileSync(absoluteOutput, compiled, "utf8");
}
