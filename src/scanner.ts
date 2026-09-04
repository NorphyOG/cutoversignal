import { readdirSync, readFileSync, statSync } from "node:fs";
import { extname, join, relative, resolve } from "node:path";

export type Severity = "critical" | "high" | "medium" | "low";

export interface Finding {
  ruleId: string;
  severity: Severity;
  file: string;
  line: number;
  evidence: string;
  feature: string;
  graphDirection: string;
}

export interface ScanReport {
  schemaVersion: "CODEX-EWS-EXIT-SCAN/v1";
  root: string;
  filesScanned: number;
  findings: Finding[];
  counts: Record<Severity, number>;
  verdict: "EWS_NOT_DETECTED" | "EWS_MIGRATION_REQUIRED";
  limitations: string[];
}

interface Rule {
  id: string;
  severity: Severity;
  pattern: RegExp;
  feature: string;
  graphDirection: string;
  extensions?: string[];
  requiresEwsContext?: boolean;
}

const RULES: Rule[] = [
  { id: "EWS001", severity: "critical", pattern: /Microsoft\.Exchange\.WebServices/i, feature: ".NET EWS Managed API", graphDirection: "Replace the EWS SDK surface with Microsoft Graph SDK or REST calls.", extensions: [".cs", ".fs", ".vb", ".csproj", ".fsproj", ".vbproj", ".props", ".targets", ".config", ".xml", ".ps1", ".psm1", ".psd1"] },
  { id: "EWS002", severity: "critical", pattern: /microsoft\.exchange\.webservices/i, feature: "EWS Java API", graphDirection: "Map Java EWS calls to Microsoft Graph REST or a supported Graph SDK.", extensions: [".java", ".kt", ".properties", ".xml"] },
  { id: "EWS003", severity: "critical", pattern: /\/EWS\/Exchange\.asmx/i, feature: "Raw EWS SOAP endpoint", graphDirection: "Inventory SOAP operations and map each to Graph; flag parity gaps." },
  { id: "EWS004", severity: "high", pattern: /\bExchangeService\b/, feature: "EWS client construction", graphDirection: "Replace connection/auth bootstrap with GraphServiceClient." },
  { id: "EWS005", severity: "high", pattern: /\bImpersonatedUserId\b|\bExchangeImpersonation\b/, feature: "Mailbox impersonation", graphDirection: "Design least-privilege application access and mailbox scoping before migration." },
  { id: "EWS006", severity: "high", pattern: /\bStreamingSubscription(Connection)?\b|\bSubscribeToStreamingNotifications\b/, feature: "Streaming notifications", graphDirection: "Evaluate Graph change notifications and lifecycle handling." },
  { id: "EWS007", severity: "medium", pattern: /\bWellKnownFolderName\b|\bFolderId\b/, feature: "EWS folder addressing", graphDirection: "Map folder identifiers and well-known folders to Graph mailFolder/calendar/contact endpoints.", requiresEwsContext: true },
  { id: "EWS008", severity: "medium", pattern: /\bFindItems\b|\bGetItem\b|\bCreateItem\b|\bUpdateItem\b|\bDeleteItem\b/, feature: "EWS item operation", graphDirection: "Use the Microsoft EWS-to-Graph operation mapping and test semantic differences.", requiresEwsContext: true },
  { id: "EWS009", severity: "high", pattern: /\bExchangeCredentials\b|\bWebCredentials\b/, feature: "Legacy credential path", graphDirection: "Move to OAuth 2.0 and least-privilege Graph permissions." },
  { id: "EWS010", severity: "medium", pattern: /\bAutodiscoverUrl\b|\bGetUserSettings\b/, feature: "Autodiscover dependency", graphDirection: "Confirm whether Graph or a separate supported discovery mechanism covers the scenario." }
];

const TEXT_EXTENSIONS = new Set([".cs", ".fs", ".vb", ".csproj", ".fsproj", ".vbproj", ".props", ".targets", ".java", ".kt", ".xml", ".config", ".json", ".js", ".mjs", ".cjs", ".ts", ".py", ".ps1", ".psm1", ".psd1", ".properties", ".yml", ".yaml"]);
const IGNORED_DIRECTORIES = new Set([".git", "node_modules", "bin", "obj", "dist", "build", ".idea", ".vs"]);
const MAX_FILE_BYTES = 1_000_000;
const EWS_CONTEXT_PATTERN = /Microsoft\.Exchange\.WebServices|microsoft\.exchange\.webservices|\/EWS\/Exchange\.asmx|\bExchangeService\b|\bImpersonatedUserId\b|\bExchangeImpersonation\b|\bStreamingSubscription(?:Connection)?\b|\bSubscribeToStreamingNotifications\b|\bExchangeCredentials\b|\bWebCredentials\b|\bAutodiscoverUrl\b/i;

function redact(line: string): string {
  return line
    .replace(/(password|secret|token|api[_-]?key)(\s*[:=]\s*)["']?[^\s,"']+/gi, "$1$2<redacted>")
    .replace(/Bearer\s+[A-Za-z0-9._~+\/-]+/gi, "Bearer <redacted>")
    .trim()
    .slice(0, 240);
}

function collectFiles(root: string): string[] {
  const files: string[] = [];
  const visit = (directory: string): void => {
    for (const entry of readdirSync(directory, { withFileTypes: true })) {
      if (entry.isSymbolicLink()) continue;
      const fullPath = join(directory, entry.name);
      if (entry.isDirectory()) {
        if (!IGNORED_DIRECTORIES.has(entry.name)) visit(fullPath);
      } else if (entry.isFile() && TEXT_EXTENSIONS.has(extname(entry.name).toLowerCase())) {
        const size = statSync(fullPath).size;
        if (size <= MAX_FILE_BYTES) files.push(fullPath);
      }
    }
  };
  visit(root);
  return files.sort();
}

export function scanRepository(inputRoot: string): ScanReport {
  const root = resolve(inputRoot);
  const files = collectFiles(root);
  const findings: Finding[] = [];

  for (const file of files) {
    const extension = extname(file).toLowerCase();
    const content = readFileSync(file, "utf8");
    const hasEwsContext = EWS_CONTEXT_PATTERN.test(content);
    const lines = content.split(/\r?\n/);
    for (let index = 0; index < lines.length; index += 1) {
      const line = lines[index] ?? "";
      for (const rule of RULES) {
        if (rule.extensions && !rule.extensions.includes(extension)) continue;
        if (rule.requiresEwsContext && !hasEwsContext) continue;
        if (!rule.pattern.test(line)) continue;
        findings.push({
          ruleId: rule.id,
          severity: rule.severity,
          file: relative(root, file).replaceAll("\\", "/"),
          line: index + 1,
          evidence: redact(line),
          feature: rule.feature,
          graphDirection: rule.graphDirection
        });
      }
    }
  }

  const counts: Record<Severity, number> = { critical: 0, high: 0, medium: 0, low: 0 };
  for (const finding of findings) counts[finding.severity] += 1;

  return {
    schemaVersion: "CODEX-EWS-EXIT-SCAN/v1",
    root,
    filesScanned: files.length,
    findings,
    counts,
    verdict: findings.length > 0 ? "EWS_MIGRATION_REQUIRED" : "EWS_NOT_DETECTED",
    limitations: [
      "Static evidence only; runtime EWS usage and tenant-side third-party applications require Microsoft EWS Usage Reports.",
      "A detected call does not prove a one-to-one Graph replacement; Microsoft documents remaining parity gaps.",
      "Generic folder and item-operation names are reported only when the same file also contains a stronger EWS signature.",
      "Comments, fixtures, and on-premises-only EWS code can still match; each finding requires human scope review.",
      "No files larger than 1 MB, generated outputs, dependency folders, or binary assemblies are inspected."
    ]
  };
}

export function renderMarkdown(report: ScanReport): string {
  const rows = report.findings.length === 0
    ? "| — | — | — | — | No EWS signature detected |\n"
    : report.findings.map((f) => `| ${f.severity.toUpperCase()} | ${f.ruleId} | \`${f.file}:${f.line}\` | ${f.feature} | ${f.graphDirection} |`).join("\n") + "\n";

  return `# EWS Exit Readiness Report\n\n` +
    `**Verdict:** ${report.verdict}\n\n` +
    `Files scanned: ${report.filesScanned}  \n` +
    `Findings: ${report.findings.length} (critical ${report.counts.critical}, high ${report.counts.high}, medium ${report.counts.medium})\n\n` +
    `| Severity | Rule | Location | EWS feature | Migration direction |\n|---|---|---|---|---|\n${rows}\n` +
    `## Limitations\n\n${report.limitations.map((item) => `- ${item}`).join("\n")}\n`;
}
