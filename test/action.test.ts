import assert from "node:assert/strict";
import { mkdtempSync, mkdirSync, readFileSync, symlinkSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { isAbsolute, join, relative, sep } from "node:path";
import test from "node:test";
import { runAction } from "../src/action.ts";

function fixture(source: string): Record<string, string> {
  const workspace = mkdtempSync(join(tmpdir(), "cutoversignal-action-"));
  const runnerTemp = mkdtempSync(join(tmpdir(), "cutoversignal-runner-"));
  const target = join(workspace, "target");
  mkdirSync(target);
  writeFileSync(join(target, "Mail.cs"), source, "utf8");
  return {
    GITHUB_WORKSPACE: workspace,
    RUNNER_TEMP: runnerTemp,
    GITHUB_OUTPUT: join(workspace, "github-output.txt"),
    GITHUB_STEP_SUMMARY: join(workspace, "summary.md"),
    CUTOVERSIGNAL_SCAN_PATH: "target",
    CUTOVERSIGNAL_REPORT_FORMAT: "json",
    CUTOVERSIGNAL_REPORT_OUTPUT: "ews.json",
    CUTOVERSIGNAL_FAIL_ON_FINDINGS: "true",
    CUTOVERSIGNAL_UPLOAD_REPORT: "false"
  };
}

test("action produces a bounded report and a privacy-safe summary before enforcing findings", () => {
  const environment = fixture([
    "using Microsoft.Exchange.WebServices.Data;",
    "service.FindItems(WellKnownFolderName.Inbox, view);"
  ].join("\n"));
  const result = runAction(environment);

  assert.equal(result.verdict, "EWS_MIGRATION_REQUIRED");
  assert.equal(result.shouldFail, true);
  assert.ok(result.findingCount >= 2);
  assert.match(readFileSync(environment.GITHUB_OUTPUT, "utf8"), /should_fail=true/);
  assert.match(readFileSync(result.reportPath, "utf8"), /FindItems/);
  const reportScope = relative(environment.RUNNER_TEMP, result.reportPath);
  assert.ok(reportScope && !reportScope.startsWith(`..${sep}`) && !isAbsolute(reportScope));

  const summary = readFileSync(environment.GITHUB_STEP_SUMMARY, "utf8");
  assert.match(summary, /EWS_MIGRATION_REQUIRED/);
  assert.doesNotMatch(summary, /Mail\.cs|FindItems|WellKnownFolderName/);
});

test("action keeps a clean scan green", () => {
  const environment = fixture("const client = new GraphServiceClient();");
  const result = runAction(environment);

  assert.equal(result.verdict, "EWS_NOT_DETECTED");
  assert.equal(result.findingCount, 0);
  assert.equal(result.shouldFail, false);
});

test("action rejects scan escapes and unsafe report filenames", () => {
  const scanEscape = fixture("const client = new GraphServiceClient();");
  scanEscape.CUTOVERSIGNAL_SCAN_PATH = "../outside";
  assert.throws(() => runAction(scanEscape), /path must resolve inside GITHUB_WORKSPACE/);

  for (const output of ["../outside.json", "reports/ews.json", "reports\\ews.json", "C:report.json", "CON", "nul.txt", "report.", " report.json", "report.json\npoisoned=true"]) {
    const reportEscape = fixture("const client = new GraphServiceClient();");
    reportEscape.CUTOVERSIGNAL_REPORT_OUTPUT = output;
    assert.throws(() => runAction(reportEscape), /output must/);
  }
});

test("action rejects an initial scan-root link that resolves outside the workspace", () => {
  const environment = fixture("const client = new GraphServiceClient();");
  const outside = mkdtempSync(join(tmpdir(), "cutoversignal-outside-"));
  writeFileSync(join(outside, "External.cs"), "service.FindItems(WellKnownFolderName.Inbox, view);", "utf8");
  const link = join(environment.GITHUB_WORKSPACE, "linked-root");
  symlinkSync(outside, link, process.platform === "win32" ? "junction" : "dir");
  environment.CUTOVERSIGNAL_SCAN_PATH = "linked-root";

  assert.throws(() => runAction(environment), /path must resolve inside GITHUB_WORKSPACE/);
});

test("action accepts canonical in-workspace paths whose names begin with two dots", () => {
  const environment = fixture("const client = new GraphServiceClient();");
  const legitimate = join(environment.GITHUB_WORKSPACE, "..reports");
  mkdirSync(legitimate);
  writeFileSync(join(legitimate, "Graph.ts"), "const client = new GraphServiceClient();", "utf8");
  environment.CUTOVERSIGNAL_SCAN_PATH = "..reports";

  const result = runAction(environment);
  assert.equal(result.verdict, "EWS_NOT_DETECTED");
});

test("action keeps report writes out of the workspace and uses a unique directory", () => {
  const firstEnvironment = fixture("const client = new GraphServiceClient();");
  const workspaceDecoy = join(firstEnvironment.GITHUB_WORKSPACE, "ews.json");
  writeFileSync(workspaceDecoy, "do not overwrite", "utf8");

  const first = runAction(firstEnvironment);
  const second = runAction({ ...firstEnvironment });

  assert.notEqual(first.reportPath, second.reportPath);
  assert.equal(readFileSync(workspaceDecoy, "utf8"), "do not overwrite");
  assert.equal(readFileSync(first.reportPath, "utf8").startsWith("{"), true);
  assert.equal(readFileSync(second.reportPath, "utf8").startsWith("{"), true);
});

test("action summary reflects explicit artifact upload intent", () => {
  const environment = fixture("const client = new GraphServiceClient();");
  environment.CUTOVERSIGNAL_UPLOAD_REPORT = "true";

  runAction(environment);
  assert.match(readFileSync(environment.GITHUB_STEP_SUMMARY, "utf8"), /Detailed report upload requested: \*\*yes\*\*/);
});
