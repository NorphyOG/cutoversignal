import assert from "node:assert/strict";
import { mkdtempSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import test from "node:test";
import { scanRepository } from "../src/scanner.ts";

test("clean extracted package detects a positive EWS fixture", () => {
  const root = mkdtempSync(join(tmpdir(), "codex-ews-lite-positive-"));
  writeFileSync(join(root, "Mail.cs"), [
    "using Microsoft.Exchange.WebServices.Data;",
    "var service = new ExchangeService();",
    "service.FindItems(WellKnownFolderName.Inbox, view);"
  ].join("\n"));

  const report = scanRepository(root);
  assert.equal(report.verdict, "EWS_MIGRATION_REQUIRED");
  assert.ok(report.findings.some((finding) => finding.ruleId === "EWS001"));
  assert.ok(report.findings.some((finding) => finding.ruleId === "EWS008"));
});

test("clean extracted package preserves the bounded negative verdict", () => {
  const root = mkdtempSync(join(tmpdir(), "codex-ews-lite-negative-"));
  writeFileSync(join(root, "GraphOnly.ts"), "const client = new GraphServiceClient();");

  const report = scanRepository(root);
  assert.equal(report.verdict, "EWS_NOT_DETECTED");
  assert.equal(report.findings.length, 0);
  assert.match(report.limitations.join(" "), /Static evidence only/);
});
