#!/usr/bin/env node

import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";

const cliPath = fileURLToPath(new URL("../src/cli.ts", import.meta.url));
const result = spawnSync(process.execPath, [
  "--disable-warning=ExperimentalWarning",
  "--experimental-strip-types",
  cliPath,
  ...process.argv.slice(2)
], {
  stdio: "inherit"
});

if (result.error) {
  console.error(`Unable to start CutoverSignal: ${result.error.message}`);
  process.exitCode = 1;
} else if (result.signal) {
  console.error(`CutoverSignal stopped after signal ${result.signal}`);
  process.exitCode = 1;
} else {
  process.exitCode = result.status ?? 1;
}
