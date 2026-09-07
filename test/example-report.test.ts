import assert from "node:assert/strict";
import { mkdtempSync, readFileSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import test from "node:test";
import { renderMarkdown, scanRepository } from "../src/scanner.ts";

const startMarker = "<!-- GENERATED-SCANNER-OUTPUT:START -->";
const endMarker = "<!-- GENERATED-SCANNER-OUTPUT:END -->";

function normalize(value: string): string {
  return value.replaceAll("\r\n", "\n").trim();
}

test("published synthetic example contains the exact current scanner output", () => {
  const fixtureRoot = mkdtempSync(join(tmpdir(), "cutoversignal-example-report-"));
  writeFileSync(join(fixtureRoot, "LegacyMailbox.cs"), [
    "using Microsoft.Exchange.WebServices.Data;",
    "var service = new ExchangeService();",
    "service.FindItems(WellKnownFolderName.Inbox, view);"
  ].join("\n"), "utf8");

  const document = readFileSync(new URL("../docs/EXAMPLE-REPORT-AND-PILOT-HANDOFF.md", import.meta.url), "utf8");
  const start = document.indexOf(startMarker);
  const end = document.indexOf(endMarker);
  assert.ok(start >= 0 && end > start, "generated scanner-output markers must exist in order");

  const published = document.slice(start + startMarker.length, end);
  const expected = renderMarkdown(scanRepository(fixtureRoot));
  assert.equal(normalize(published), normalize(expected));
});

test("example keeps the free report separate from the bounded paid pilot", () => {
  const document = readFileSync(new URL("../docs/EXAMPLE-REPORT-AND-PILOT-HANDOFF.md", import.meta.url), "utf8");

  assert.match(document, /The free report is evidence inventory, not a migration plan/);
  assert.match(document, /one application and one accepted source revision/);
  assert.match(document, /does not promise automatic migration/);
  assert.match(document, /creates no order, contract, invoice, reservation, checkout, or payment/);
  assert.match(document, /issues\/new\?template=pilot-interest\.yml/);
  assert.doesNotMatch(document, /Scanora|customer@example|tenant[_ -]?id|password\s*[:=]/i);
});
