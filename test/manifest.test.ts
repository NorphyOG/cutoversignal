import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { mkdtempSync, mkdirSync, readdirSync, readFileSync, symlinkSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join, relative, resolve } from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const ignoredDirectories = new Set([".git", "node_modules"]);

function collect(directory: string, manifestRoot = root): string[] {
  const files: string[] = [];
  for (const entry of readdirSync(directory, { withFileTypes: true })) {
    const entryPath = join(directory, entry.name);
    if (entry.isSymbolicLink()) {
      throw new Error(`symbolic links are not permitted in the release tree: ${relative(manifestRoot, entryPath)}`);
    }
    if (entry.isDirectory()) {
      if (!ignoredDirectories.has(entry.name)) files.push(...collect(entryPath, manifestRoot));
    } else if (entry.isFile()) {
      const path = relative(manifestRoot, entryPath).replaceAll("\\", "/");
      if (path !== "MANIFEST.sha256") files.push(path);
    }
  }
  return files.sort();
}

test("manifest covers every distributed repository file and every digest matches", () => {
  const entries = readFileSync(join(root, "MANIFEST.sha256"), "utf8").trim().split(/\r?\n/).map((line) => {
    const match = line.match(/^([a-f0-9]{64})  (.+)$/);
    assert.ok(match, `invalid manifest line: ${line}`);
    return { hash: match[1], path: match[2] };
  });

  assert.deepEqual(entries.map((entry) => entry.path).sort(), collect(root));
  for (const entry of entries) {
    const actual = createHash("sha256").update(readFileSync(join(root, entry.path))).digest("hex");
    assert.equal(actual, entry.hash, entry.path);
  }
});

test("manifest inventory rejects symbolic links instead of silently omitting them", () => {
  const fixtureRoot = mkdtempSync(join(tmpdir(), "cutoversignal-manifest-"));
  const target = mkdtempSync(join(tmpdir(), "cutoversignal-manifest-target-"));
  mkdirSync(join(target, "nested"));
  symlinkSync(target, join(fixtureRoot, "linked"), process.platform === "win32" ? "junction" : "dir");

  assert.throws(() => collect(fixtureRoot, fixtureRoot), /symbolic links are not permitted/);
});
