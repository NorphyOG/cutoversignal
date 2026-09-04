# CODEX EWS Exit Scan Lite

Local, credential-free static inventory for likely Exchange Web Services dependencies.

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

## Paid pilot

The EUR 149 human-reviewed launch pilot covers one application and one accepted source revision. It adds up to ten reconciled finding clusters, one optional AppID-filtered usage slice, up to five operation-family parity decisions, ten owner actions and a 30-minute handoff. The paid pilot is not live yet. No checkout, order, or payment is available from this preview release.
