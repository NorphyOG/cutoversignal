import { writeFileSync } from "node:fs";
import { resolve } from "node:path";
import { renderMarkdown, scanRepository } from "./scanner.mjs";

const VERSION = "0.3.1";
const args = process.argv.slice(2);
const positionals           = [];
let formatOption                    ;
let outputOption                    ;
let showHelp = false;
let showVersion = false;

for (let index = 0; index < args.length; index += 1) {
  const arg = args[index];
  if (arg === "--help" || arg === "-h") {
    showHelp = true;
  } else if (arg === "--version" || arg === "-v") {
    showVersion = true;
  } else if (arg === "--format" || arg === "-f") {
    formatOption = args[index + 1];
    if (!formatOption || formatOption.startsWith("-")) {
      console.error(`${arg} requires markdown or json`);
      process.exit(2);
    }
    index += 1;
  } else if (arg === "--out" || arg === "-o") {
    outputOption = args[index + 1];
    if (!outputOption || outputOption.startsWith("-")) {
      console.error(`${arg} requires a file path`);
      process.exit(2);
    }
    index += 1;
  } else if (arg.startsWith("-")) {
    console.error(`Unknown option: ${arg}`);
    process.exit(2);
  } else {
    positionals.push(arg);
  }
}

if (showHelp) {
  process.stdout.write([
    "CutoverSignal — Exchange Web Services migration readiness scanner",
    "",
    "Usage:",
    "  cutoversignal [repository] [--format markdown|json] [--out report-file]",
    "",
    "Exit codes:",
    "  0  No configured EWS signature detected",
    "  1  EWS evidence detected and review is required",
    "  2  Invalid command-line input",
    ""
  ].join("\n"));
  process.exit(0);
}

if (showVersion) {
  process.stdout.write(`${VERSION}\n`);
  process.exit(0);
}

if (positionals.length > 3) {
  console.error("Expected at most repository, format, and output positional values");
  process.exit(2);
}

const input = positionals[0] ?? ".";
const format = formatOption ?? positionals[1] ?? "markdown";
const output = outputOption ?? positionals[2];

if (format !== "markdown" && format !== "json") {
  console.error("--format must be markdown or json");
  process.exit(2);
}

const report = scanRepository(resolve(input));
const rendered = format === "json" ? `${JSON.stringify(report, null, 2)}\n` : renderMarkdown(report);
if (output) writeFileSync(resolve(output), rendered, "utf8");
else process.stdout.write(rendered);

process.exitCode = report.verdict === "EWS_MIGRATION_REQUIRED" ? 1 : 0;
