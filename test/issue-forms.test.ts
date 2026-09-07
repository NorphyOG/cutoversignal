import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import test from "node:test";

const paths = [
  ".github/ISSUE_TEMPLATE/ews-scan-feedback.yml",
  ".github/ISSUE_TEMPLATE/pilot-interest.yml"
];

const expectedSources = [
  "October 2026 EWS retirement readiness brief",
  "Exchange Online EWS Migration Readiness Checklist",
  "Repository README",
  "GitHub search, topic, or recommendation",
  "Direct repository link",
  "Other or not sure"
];

for (const path of paths) {
  test(`${path} uses the bounded source-attribution contract`, () => {
    const form = readFileSync(resolve(path), "utf8");
    const sourceBlock = form.match(/  - type: dropdown\r?\n    id: source_surface\r?\n([\s\S]*?)(?=\r?\n  - type:|$)/)?.[1];

    assert.ok(sourceBlock, "missing source_surface dropdown");
    assert.match(sourceBlock, /label: Discovery source/);
    assert.match(sourceBlock, /category-only attribution/);
    assert.match(sourceBlock, /validations:\r?\n      required: true/);
    for (const source of expectedSources) assert.ok(sourceBlock.includes(`- "${source}"`), source);
    assert.equal((sourceBlock.match(/^        - /gm) ?? []).length, expectedSources.length);
    assert.doesNotMatch(sourceBlock, /type: (?:input|textarea)/);
  });
}
