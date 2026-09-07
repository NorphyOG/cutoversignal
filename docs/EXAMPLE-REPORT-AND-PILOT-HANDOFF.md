# Synthetic EWS report and EUR 149 pilot handoff

This example shows exactly what the free CutoverSignal scanner emits and what the fixed-scope human-reviewed pilot adds. It is generated from three synthetic lines, not customer source code, tenant data, credentials, or a real organization.

## Synthetic input

```csharp
using Microsoft.Exchange.WebServices.Data;
var service = new ExchangeService();
service.FindItems(WellKnownFolderName.Inbox, view);
```

## Exact free scanner output

The package test regenerates this section from the current scanner and fails if the documented output drifts.

<!-- GENERATED-SCANNER-OUTPUT:START -->
# EWS Exit Readiness Report

**Verdict:** EWS_MIGRATION_REQUIRED

Files scanned: 1  
Findings: 4 (critical 1, high 1, medium 2)

| Severity | Rule | Location | EWS feature | Migration direction |
|---|---|---|---|---|
| CRITICAL | EWS001 | `LegacyMailbox.cs:1` | .NET EWS Managed API | Replace the EWS SDK surface with Microsoft Graph SDK or REST calls. |
| HIGH | EWS004 | `LegacyMailbox.cs:2` | EWS client construction | Replace connection/auth bootstrap with GraphServiceClient. |
| MEDIUM | EWS007 | `LegacyMailbox.cs:3` | EWS folder addressing | Map folder identifiers and well-known folders to Graph mailFolder/calendar/contact endpoints. |
| MEDIUM | EWS008 | `LegacyMailbox.cs:3` | EWS item operation | Use the Microsoft EWS-to-Graph operation mapping and test semantic differences. |

## Limitations

- Static evidence only; runtime EWS usage and tenant-side third-party applications require Microsoft EWS Usage Reports.
- A detected call does not prove a one-to-one Graph replacement; Microsoft documents remaining parity gaps.
- Generic folder and item-operation names are reported only when the same file also contains a stronger EWS signature.
- Comments, fixtures, and on-premises-only EWS code can still match; each finding requires human scope review.
- No files larger than 1 MB, generated outputs, dependency folders, or binary assemblies are inspected.
<!-- GENERATED-SCANNER-OUTPUT:END -->

## What the EUR 149 pilot adds

The free report is evidence inventory, not a migration plan. For one application and one accepted source revision, the human-reviewed pilot adds:

1. Up to ten deduplicated finding clusters instead of a raw match list.
2. One optional AppID-filtered Microsoft 365 EWS Usage Report slice supplied by the buyer.
3. Reconciliation of static findings with the bounded runtime evidence.
4. Up to five EWS operation-family decisions: Graph mapping, redesign, retained on-premises scope, or unresolved parity gap.
5. Ten prioritized owner actions with evidence gaps and accountable next decisions.
6. A 30-minute handoff focused on the accepted application revision.

It does not promise automatic migration, complete Graph parity, tenant configuration changes, production deployment, or a readiness certification. Customer source and tenant evidence are not submitted through a public GitHub issue.

## Check fit without creating an order

If that exact scope fits a current business migration, use the [privacy-safe pilot-interest form](https://github.com/NorphyOG/cutoversignal/issues/new?template=pilot-interest.yml). The form collects no company name or email address and creates no order, contract, invoice, reservation, checkout, or payment.
