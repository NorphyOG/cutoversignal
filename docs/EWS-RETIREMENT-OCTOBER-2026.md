# Exchange Online EWS retirement: October 2026 readiness brief

Microsoft's current schedule says Exchange Web Services starts to be disabled globally in Exchange Online in October 2026 and is fully disabled in April 2027. This brief turns that deadline into a bounded first-pass inventory. It does not claim that every EWS feature already has a Microsoft Graph equivalent.

Checked against the linked Microsoft guidance on 2026-09-07.

## What the deadline applies to

- The retirement concerns EWS access to Exchange Online.
- Microsoft recommends migrating Exchange Online EWS applications to Microsoft Graph.
- Microsoft Graph is not supported for Exchange Server on-premises. Keep on-premises and Exchange Online decisions separate.
- Some EWS capabilities still have parity gaps or require a redesign. Microsoft says not to wait for every gap to close before inventory and migration work begins.

## A 30-minute first pass

1. Open the Microsoft 365 admin center EWS Usage Report and select the 90-day view.
2. Record each application ID, SOAP action, call volume, and last activity date in UTC.
3. Treat a quiet report cautiously: Microsoft says usage is aggregated weekly and can take up to ten days to appear.
4. Run a credential-free static scan across each accepted application source revision.
5. Reconcile runtime applications and SOAP actions with static SDK, SOAP, Autodiscover, impersonation, notification, synchronization, and item-operation evidence.
6. Assign an owner and next decision to every mismatch or unresolved Graph parity gap.

Run CutoverSignal directly from the versioned GitHub tag:

```powershell
npx --yes github:NorphyOG/cutoversignal#v0.3.2 C:\path\to\repository --format markdown --out ews-report.md
```

Exit code `1` means the scan completed and found EWS evidence requiring review. Exit code `0` means no configured signature was detected; it does not prove the repository, deployed application, or tenant is EWS-free.

## Reconcile before declaring readiness

| Microsoft 365 usage report | Static code scan | Next decision |
| --- | --- | --- |
| EWS observed | EWS detected | Map active SOAP operations and prioritize the application. |
| EWS observed | No EWS detected | Locate the deployed revision, packaged dependency, vendor component, or missing repository. |
| No EWS observed | EWS detected | Check report delay, dormant code, test-only code, on-premises scope, and deployment state. |
| No EWS observed | No EWS detected | Preserve the windows and source revisions; do not claim completeness without scope evidence. |

Continue with the full [Exchange Online EWS Migration Readiness Checklist](EWS-MIGRATION-READINESS-CHECKLIST.md) for operation mapping, gap decisions, rollout evidence, and accountable sign-off.

## Privacy-safe feedback and pilot interest

Share only the scanner version, bounded verdict, category names, platform, and whether the result changed a migration decision through the [structured feedback form](https://github.com/NorphyOG/cutoversignal/issues/new?template=ews-scan-feedback.yml). Never post proprietary source, evidence snippets, logs, tenant identifiers, credentials, mailbox content, customer data, or personal data.

The EUR 149 human-reviewed pilot is not live yet. If its exact one-application scope fits a current business migration, use the [pilot-interest form](https://github.com/NorphyOG/cutoversignal/issues/new?template=pilot-interest.yml). The form creates no order, contract, invoice, payment, or reservation.

## Primary Microsoft references

- [Deprecation of Exchange Web Services in Exchange Online](https://learn.microsoft.com/en-us/exchange/clients-and-mobile-in-exchange-online/deprecation-of-ews-exchange-online)
- [Exchange Web Services usage report](https://learn.microsoft.com/en-us/microsoft-365/admin/activity-reports/ews-usage?view=o365-worldwide)
- [Migrate EWS apps to Microsoft Graph](https://learn.microsoft.com/en-us/graph/migrate-exchange-web-services-overview)
- [EWS to Microsoft Graph API mappings](https://learn.microsoft.com/en-us/graph/migrate-exchange-web-services-api-mapping)

Revalidate Microsoft's schedule and parity guidance before a production cutover.
