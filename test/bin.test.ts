import assert from "node:assert/strict";
import { mkdtempSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";
import { spawnSync } from "node:child_process";
import test from "node:test";

const binPath = resolve("bin/cutoversignal.mjs");

test("versioned package bin exposes stable help and version output", () => {
  const version = spawnSync(process.execPath, [binPath, "--version"], { encoding: "utf8" });
  assert.equal(version.status, 0);
  assert.equal(version.stdout.trim(), "0.3.0");

  const help = spawnSync(process.execPath, [binPath, "--help"], { encoding: "utf8" });
  assert.equal(help.status, 0);
  assert.match(help.stdout, /cutoversignal \[repository\]/);
  assert.match(help.stdout, /EWS evidence detected/);
});

test("package bin preserves the finding exit code and JSON contract", () => {
  const fixture = mkdtempSync(join(tmpdir(), "cutoversignal-bin-"));
  writeFileSync(join(fixture, "Legacy.cs"), "using Microsoft.Exchange.WebServices.Data;\n");

  const scan = spawnSync(process.execPath, [binPath, fixture, "--format", "json"], { encoding: "utf8" });
  assert.equal(scan.status, 1);
  assert.equal(scan.stderr, "");

  const report = JSON.parse(scan.stdout);
  assert.equal(report.schemaVersion, "CODEX-EWS-EXIT-SCAN/v1");
  assert.equal(report.verdict, "EWS_MIGRATION_REQUIRED");
  assert.ok(report.findings.some((finding: { ruleId: string }) => finding.ruleId === "EWS001"));
});
