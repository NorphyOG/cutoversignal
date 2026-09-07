# CutoverSignal — Exchange Web Services (EWS) Migration Readiness Tool

Credential-free static analysis for Exchange Web Services migration, Microsoft Graph migration planning, Exchange Online retirement readiness, and legacy EWS dependency inventory.

Start with the [Exchange Online EWS Migration Readiness Checklist](docs/EWS-MIGRATION-READINESS-CHECKLIST.md) to reconcile Microsoft 365 runtime reporting with static code evidence and turn findings into accountable migration decisions.

Need the deadline answer first? Read the [October 2026 EWS retirement readiness brief](docs/EWS-RETIREMENT-OCTOBER-2026.md) for a 30-minute inventory using Microsoft 365 usage evidence plus a credential-free static scan.

## What it answers

- Which repositories contain likely Exchange Web Services dependencies?
- Which EWS SDK, SOAP, Autodiscover, impersonation, subscription, or credential patterns need review before a Microsoft Graph migration?
- Which static findings should enter an Exchange Online EWS retirement plan?

CutoverSignal is designed for engineering and migration teams that need a local, repeatable first-pass inventory before deeper tenant-side validation. It does not claim automatic feature parity or complete migration readiness.

See the [synthetic example report and EUR 149 pilot handoff](docs/EXAMPLE-REPORT-AND-PILOT-HANDOFF.md) for the exact scanner output and the additional decisions delivered by the human-reviewed pilot. The example contains no customer source, tenant data, credentials, or real organization identifiers.

## Run

Requires Node.js 22.6 or newer.

Run the versioned CLI directly from GitHub without cloning or a global install:

```powershell
npx --yes github:NorphyOG/cutoversignal#v0.3.2 C:\path\to\repository --format markdown --out ews-report.md
```

The command is pinned to the `v0.3.2` Git tag. Exit code `1` means the scan completed and found EWS evidence that requires review.

Do not use `v0.3.0`: remote installation exposed Node's prohibition on stripping TypeScript inside `node_modules`. `v0.3.1` introduced the tested JavaScript distribution; `v0.3.2` adds .NET project and PowerShell coverage while reducing unrelated generic operation matches.

Or run a local clone:

```powershell
npm run scan -- C:\path\to\repository markdown ews-report.md
```

Verify the extracted archive before use:

```powershell
npm test
```

Exit code `1` means EWS evidence was detected and review is required. Exit code `0` means no configured signature was detected; it does not prove the repository or tenant is EWS-free.

## Run in GitHub Actions

Add this minimal workflow to the repository you want to inspect:

```yaml
name: EWS exit scan
on:
  workflow_dispatch:

permissions:
  contents: read

jobs:
  scan:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@11d5960a326750d5838078e36cf38b85af677262
        with:
          persist-credentials: false
      - uses: NorphyOG/cutoversignal@v0.2.0
```

The action resolves the requested scan root and refuses filesystem links that escape the checked-out workspace. It writes `ews-exit-scan-report.md` into a unique private directory under the GitHub runner temporary root, exposes the absolute path as `report-path`, and fails after report creation when it detects EWS evidence. The GitHub step summary contains only verdict and counts—never filenames or evidence snippets. Detailed artifact upload is off by default because reports from public repositories may reveal proprietary code context.

The `output` input is a filename, not a path; directory separators, control characters, Windows device names, and ambiguous trailing characters are rejected. Use the `report-path` output if another step needs the local report.

Set `upload-report: "true"` only after reviewing that disclosure boundary. Use `fail-on-findings: "false"` for an observation-only first run.

## Share a safe result

After running the scanner, use the [structured scan-feedback form](https://github.com/NorphyOG/cutoversignal/issues/new?template=ews-scan-feedback.yml) to report only the verdict and finding categories. This gives the project measurable compatibility evidence without collecting source code, logs, tenant identifiers, credentials, mailbox content, or personal data.

Useful feedback includes the scanner version, operating system, bounded verdict, detected category names, and whether the result changed a migration decision. Never paste evidence snippets from proprietary code. Security-sensitive findings belong in a private reporting channel, not a public issue.

## Scope

- Scans supported text/code files up to 1 MB.
- Detects EWS SDK namespaces and package references (including .NET project and PowerShell files), raw SOAP endpoints, client construction, impersonation, subscriptions, folder/item operations, credentials and Autodiscover signals.
- Reports generic folder/item operation names only when the same file contains a stronger EWS signature, reducing unrelated `GetItem`/`FolderId` matches.
- Redacts likely secret values from evidence snippets.
- Does not upload files, connect to Microsoft 365, or require credentials.

Pair the result with Microsoft’s EWS Usage Report. Static code evidence cannot establish runtime completeness or Graph feature parity.

Primary references:

- Microsoft EWS retirement: https://learn.microsoft.com/en-us/exchange/clients-and-mobile-in-exchange-online/deprecation-of-ews-exchange-online
- Microsoft EWS Usage Report: https://learn.microsoft.com/en-us/microsoft-365/admin/activity-reports/ews-usage
- Microsoft EWS-to-Graph overview: https://learn.microsoft.com/en-us/graph/migrate-exchange-web-services-overview
- Microsoft .NET EWS analyzer: https://github.com/OfficeDev/ews-migration-analyzer

## Security and release status

Do not submit credentials, tokens, mailbox content, proprietary source, or tenant exports to a public issue. See `SECURITY.md`.

This preview is published under the MIT License. Verify `MANIFEST.sha256` and run `npm test` after extraction before use. The manifest test requires every first-party file in the release tree except the manifest itself to be hash-bound and rejects symbolic links. Git metadata and locally installed `node_modules` dependencies are outside the release manifest.

Every push and pull request runs the scanner, action-boundary, and complete-manifest self-tests on Node.js 22 through the repository workflow.

## Paid pilot

The EUR 149 human-reviewed launch pilot covers one application and one accepted source revision. It adds up to ten reconciled finding clusters, one optional AppID-filtered usage slice, up to five operation-family parity decisions, ten owner actions and a 30-minute handoff. The paid pilot is not live yet. No checkout, order, or payment is available from this preview release.

If that exact scope fits a current business migration, use the [public pilot-interest form](https://github.com/NorphyOG/cutoversignal/issues/new?template=pilot-interest.yml). Select the explicit purchase-intent option only if you genuinely want to buy the EUR 149 pilot when checkout becomes available. The form collects no company name or email address and creates no order, reservation, contract, invoice, or payment.
