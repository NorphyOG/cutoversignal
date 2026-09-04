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

test("detects .NET project and PowerShell EWS references", () => {
  const root = mkdtempSync(join(tmpdir(), "codex-ews-lite-project-files-"));
  writeFileSync(join(root, "Legacy.csproj"), [
    "<Project>",
    "  <ItemGroup>",
    "    <PackageReference Include=\"Microsoft.Exchange.WebServices\" Version=\"2.2.0\" />",
    "  </ItemGroup>",
    "</Project>"
  ].join("\n"));
  writeFileSync(join(root, "connect.ps1"), [
    "Add-Type -AssemblyName 'Microsoft.Exchange.WebServices'",
    "$service = New-Object Microsoft.Exchange.WebServices.Data.ExchangeService"
  ].join("\n"));

  const report = scanRepository(root);
  assert.equal(report.filesScanned, 2);
  assert.equal(report.verdict, "EWS_MIGRATION_REQUIRED");
  assert.equal(report.findings.filter((finding) => finding.ruleId === "EWS001").length, 3);
});

test("does not classify generic item and folder names without EWS context", () => {
  const root = mkdtempSync(join(tmpdir(), "codex-ews-lite-generic-names-"));
  writeFileSync(join(root, "Inventory.ts"), [
    "const FolderId = 'warehouse';",
    "function GetItem(id: string) { return inventory.get(id); }"
  ].join("\n"));

  const report = scanRepository(root);
  assert.equal(report.verdict, "EWS_NOT_DETECTED");
  assert.equal(report.findings.length, 0);
});

test("keeps EWS folder and item operations when a stronger file-level signal exists", () => {
  const root = mkdtempSync(join(tmpdir(), "codex-ews-lite-contextual-ops-"));
  writeFileSync(join(root, "Mailbox.cs"), [
    "using Microsoft.Exchange.WebServices.Data;",
    "var item = service.GetItem(id);",
    "var folder = new FolderId(value);"
  ].join("\n"));

  const report = scanRepository(root);
  assert.ok(report.findings.some((finding) => finding.ruleId === "EWS007"));
  assert.ok(report.findings.some((finding) => finding.ruleId === "EWS008"));
});
