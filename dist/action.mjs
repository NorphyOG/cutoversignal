import { appendFileSync, mkdtempSync, realpathSync, statSync, writeFileSync } from "node:fs";
import { isAbsolute, join, relative, resolve, sep } from "node:path";
import { pathToFileURL } from "node:url";
import { renderMarkdown, scanRepository,                 } from "./scanner.mjs";










function required(environment                   , key        )         {
  const value = environment[key]?.trim();
  if (!value) throw new Error(`${key} is required`);
  return value;
}

function parseBoolean(value        , key        )          {
  if (value === "true") return true;
  if (value === "false") return false;
  throw new Error(`${key} must be true or false`);
}

function isOutside(parent        , candidate        )          {
  const scoped = relative(parent, candidate);
  return scoped === ".." || scoped.startsWith(`..${sep}`) || isAbsolute(scoped);
}

function resolveScanRoot(workspace        , candidate        )         {
  const lexical = resolve(workspace, candidate);
  if (isOutside(workspace, lexical)) {
    throw new Error("path must resolve inside GITHUB_WORKSPACE");
  }
  const resolved = realpathSync.native(lexical);
  if (isOutside(workspace, resolved)) {
    throw new Error("path must resolve inside GITHUB_WORKSPACE");
  }
  return resolved;
}

const WINDOWS_RESERVED_FILENAME = /^(con|prn|aux|nul|com[1-9]|lpt[1-9])(?:\.|$)/i;

function validateReportFilename(candidate        )         {
  if (!/^[A-Za-z0-9][A-Za-z0-9._-]{0,127}$/.test(candidate)
    || candidate === "."
    || candidate === ".."
    || candidate.endsWith(".")
    || WINDOWS_RESERVED_FILENAME.test(candidate)) {
    throw new Error("output must be a safe filename without directories");
  }
  return candidate;
}

function resolveReportPath(runnerTemp        , filename        )         {
  const reportDirectory = mkdtempSync(join(runnerTemp, "cutoversignal-"));
  const reportPath = join(reportDirectory, filename);
  if (isOutside(runnerTemp, reportPath)) {
    throw new Error("report path must stay inside RUNNER_TEMP");
  }
  return reportPath;
}

function canonicalDirectory(environment                   , key        )         {
  try {
    const directory = realpathSync.native(resolve(required(environment, key)));
    if (!statSync(directory).isDirectory()) throw new Error("not a directory");
    return directory;
  } catch {
    throw new Error(`${key} must name an existing directory`);
  }
}

function reportFilename(environment                   )         {
  const raw = environment.CUTOVERSIGNAL_REPORT_OUTPUT;
  const candidate = raw?.trim() || "ews-exit-scan-report.md";
  if (raw !== undefined && raw !== raw.trim()) {
    throw new Error("output must not have leading or trailing whitespace");
  }
  return validateReportFilename(candidate);
}

function writeOutput(path        , key        , value        )       {
  appendFileSync(path, `${key}=${value}\n`, "utf8");
}

export function runAction(environment                    = process.env)               {
  const workspace = canonicalDirectory(environment, "GITHUB_WORKSPACE");
  const runnerTemp = canonicalDirectory(environment, "RUNNER_TEMP");
  const githubOutput = required(environment, "GITHUB_OUTPUT");
  const githubSummary = required(environment, "GITHUB_STEP_SUMMARY");
  const scanPath = resolveScanRoot(workspace, environment.CUTOVERSIGNAL_SCAN_PATH?.trim() || ".");
  const outputFilename = reportFilename(environment);
  const format = environment.CUTOVERSIGNAL_REPORT_FORMAT?.trim() || "markdown";
  const failOnFindings = parseBoolean(environment.CUTOVERSIGNAL_FAIL_ON_FINDINGS?.trim() || "true", "fail-on-findings");

  if (format !== "markdown" && format !== "json") {
    throw new Error("format must be markdown or json");
  }
  const report = scanRepository(scanPath);
  const rendered = format === "json" ? `${JSON.stringify(report, null, 2)}\n` : renderMarkdown(report);
  const reportPath = resolveReportPath(runnerTemp, outputFilename);
  writeFileSync(reportPath, rendered, { encoding: "utf8", flag: "wx", mode: 0o600 });

  const shouldFail = failOnFindings && report.verdict === "EWS_MIGRATION_REQUIRED";
  writeOutput(githubOutput, "verdict", report.verdict);
  writeOutput(githubOutput, "finding_count", String(report.findings.length));
  writeOutput(githubOutput, "report_path", reportPath);
  writeOutput(githubOutput, "should_fail", String(shouldFail));

  appendFileSync(githubSummary, [
    "## CutoverSignal EWS Exit Scan",
    "",
    `- Verdict: **${report.verdict}**`,
    `- Files scanned: **${report.filesScanned}**`,
    `- Findings: **${report.findings.length}**`,
    `- Detailed report upload requested: **${environment.CUTOVERSIGNAL_UPLOAD_REPORT === "true" ? "yes" : "no"}**`,
    "",
    "The summary intentionally excludes filenames and evidence snippets.",
    ""
  ].join("\n"), "utf8");

  return { verdict: report.verdict, findingCount: report.findings.length, reportPath, shouldFail };
}

if (process.argv[1] && import.meta.url === pathToFileURL(resolve(process.argv[1])).href) {
  try {
    runAction();
  } catch (error) {
    console.error(error instanceof Error ? error.message : String(error));
    process.exitCode = 2;
  }
}
