# CODEX EWS Exit Scan Lite

Local, credential-free static inventory for likely Exchange Web Services dependencies.

Start with the [Exchange Online EWS Migration Readiness Checklist](docs/EWS-MIGRATION-READINESS-CHECKLIST.md) to reconcile Microsoft 365 runtime reporting with static code evidence and turn findings into accountable migration decisions.

## Run

Requires Node.js 22.6 or newer.

```powershell
npm run scan -- C:\path\to\repository markdown ews-report.md
```

Verify the extracted archive before use:

```powershell
npm test
```

Exit code `1` means EWS evidence was detected and review is required. Exit code `0` means no configured signature was detected; it does not prove the repository or tenant is EWS-free.

## Share a safe result

After running the scanner, use the [structured scan-feedback form](https://github.com/NorphyOG/cutoversignal/issues/new?template=ews-scan-feedback.yml) to report only the verdict and finding categories. This gives the project measurable compatibility evidence without collecting source code, logs, tenant identifiers, credentials, mailbox content, or personal data.

Useful feedback includes the scanner version, operating system, bounded verdict, detected category names, and whether the result changed a migration decision. Never paste evidence snippets from proprietary code. Security-sensitive findings belong in a private reporting channel, not a public issue.

## Scope

- Scans supported text/code files up to 1 MB.
- Detects EWS SDK namespaces, raw SOAP endpoints, client construction, impersonation, subscriptions, folder/item operations, credentials and Autodiscover signals.
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

This preview is published under the MIT License. Verify `MANIFEST.sha256` and run `npm test` after extraction before use.

Every push and pull request runs the two package self-tests on Node.js 22 through the repository workflow.

## Paid pilot

The EUR 149 human-reviewed launch pilot covers one application and one accepted source revision. It adds up to ten reconciled finding clusters, one optional AppID-filtered usage slice, up to five operation-family parity decisions, ten owner actions and a 30-minute handoff. The paid pilot is not live yet. No checkout, order, or payment is available from this preview release.
