import { writeFileSync } from "node:fs";
import { resolve } from "node:path";
import { renderMarkdown, scanRepository } from "./scanner.ts";

const args = process.argv.slice(2);
const input = args.find((arg) => !arg.startsWith("--")) ?? ".";
const formatIndex = args.findIndex((arg) => arg === "--format" || arg === "-f");
const outputIndex = args.findIndex((arg) => arg === "--out" || arg === "-o");
const format = formatIndex >= 0 ? args[formatIndex + 1] : (args[1] ?? "markdown");
const output = outputIndex >= 0 ? args[outputIndex + 1] : args[2];

if (format !== "markdown" && format !== "json") {
  console.error("--format must be markdown or json");
  process.exit(2);
}

const report = scanRepository(resolve(input));
const rendered = format === "json" ? `${JSON.stringify(report, null, 2)}\n` : renderMarkdown(report);
if (output) writeFileSync(resolve(output), rendered, "utf8");
else process.stdout.write(rendered);

process.exitCode = report.verdict === "EWS_MIGRATION_REQUIRED" ? 1 : 0;
