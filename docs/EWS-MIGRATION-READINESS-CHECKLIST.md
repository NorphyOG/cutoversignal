# Exchange Online EWS Migration Readiness Checklist

Use this checklist to turn an Exchange Online EWS retirement project into a bounded inventory and decision record. It complements Microsoft 365 runtime reporting with local static code evidence; neither source is complete by itself.

Microsoft currently says that EWS begins to be disabled in Exchange Online in October 2026 and is fully disabled in April 2027. Microsoft Graph is the recommended API for Exchange Online, but it does not support Exchange Server on-premises and some EWS scenarios still have parity gaps.

## 1. Establish the runtime inventory

- Open the Microsoft 365 admin center EWS Usage Report.
- Review 7-, 30-, and 90-day windows.
- Record each Application ID, SOAP action, call volume, and last activity date in UTC.
- Assign an accountable owner to every observed application.
- Treat a blank or recent report cautiously: Microsoft says data is aggregated weekly and can take up to ten days to appear.

## 2. Establish the code inventory

- Scan every repository, deployment script, integration package, and maintained branch that may access Exchange Online.
- Record the accepted source revision for each scan.
- Classify SDK usage, raw SOAP endpoints, Autodiscover, impersonation, notifications, synchronization, and folder/item operations.
- Do not treat a clean static scan as proof that the tenant or application is EWS-free.

Run the local scanner from this repository:

```powershell
npm run scan -- C:\path\to\repository markdown ews-report.md
```

## 3. Reconcile runtime and code evidence

| Runtime report | Static scan | Required decision |
| --- | --- | --- |
| EWS observed | EWS detected | Prioritize the application and map its active operations. |
| EWS observed | No EWS detected | Find the missing repository, packaged dependency, vendor component, or stale deployment. |
| No EWS observed | EWS detected | Determine whether the code is dormant, test-only, on-premises-only, or outside the report window. |
| No EWS observed | No EWS detected | Preserve the evidence window and limitations; do not claim completeness without scope proof. |

## 4. Map operations and gaps

- Map every observed EWS operation to Microsoft Graph or another supported target.
- Separate direct mappings from redesigns such as push subscriptions, delta synchronization, impersonation, mailbox scoping, and import/export.
- Record any documented Graph parity gap before committing to a migration design.
- Keep Exchange Server on-premises workloads separate from Exchange Online retirement decisions.

## 5. Build the migration plan

- Define the smallest application slice that can move independently.
- Specify permissions, admin consent, mailbox scope, throttling, retry behavior, and observability.
- Define dual-run or reconciliation evidence where business correctness matters.
- Set a rollback boundary and name the person who can authorize it.
- Include vendor-owned and Microsoft first-party dependencies in the plan instead of silently excluding them.

## 6. Prove readiness

- Re-run static analysis on the release candidate revision.
- Re-check the EWS Usage Report after the reporting delay.
- Exercise representative mailbox, calendar, attachment, notification, and synchronization paths.
- Record residual EWS calls, accepted exceptions, accountable owners, and expiry dates.
- Do not declare completion from a scanner verdict alone.

## Privacy-safe project feedback

If you use EWS Exit Scan Lite, share only the bounded verdict and category-level result through the [structured feedback form](https://github.com/NorphyOG/cutoversignal/issues/new?template=ews-scan-feedback.yml). Do not submit source code, evidence snippets, logs, identifiers, credentials, mailbox content, personal data, customer data, or security-sensitive details.

## Primary Microsoft references

- [Deprecation of Exchange Web Services in Exchange Online](https://learn.microsoft.com/en-us/exchange/clients-and-mobile-in-exchange-online/deprecation-of-ews-exchange-online)
- [Exchange Web Services usage report](https://learn.microsoft.com/en-us/microsoft-365/admin/activity-reports/ews-usage?view=o365-worldwide)
- [Migrate EWS apps to Microsoft Graph](https://learn.microsoft.com/en-us/graph/migrate-exchange-web-services-overview)
- [EWS to Microsoft Graph API mappings](https://learn.microsoft.com/en-us/graph/migrate-exchange-web-services-api-mapping)

Checked against the linked Microsoft guidance on 2026-09-04. Revalidate the retirement timeline and parity guidance before a production cutover.
