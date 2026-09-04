# CutoverSignal

Credential-free tools for API deprecation audits, migration readiness, and legacy dependency analysis.

## First product: EWS Readiness Pilot

CutoverSignal is preparing a local, credential-free static inventory tool for likely Exchange Web Services dependencies. The scanner is designed to find review signals in source and configuration files without connecting to Microsoft 365 or uploading customer code.

Planned public preview scope:

- EWS SDK namespaces and client construction
- raw SOAP endpoints and Autodiscover signals
- impersonation, subscription, folder, and item-operation indicators
- redacted evidence snippets
- explicit limits: static findings do not prove runtime completeness or Microsoft Graph feature parity

## Status

The repository and brand foundation are public. The scanner release and paid pilot are still being validated; no live checkout is linked here yet.

## References

- [Microsoft EWS retirement](https://learn.microsoft.com/en-us/exchange/clients-and-mobile-in-exchange-online/deprecation-of-ews-exchange-online)
- [Microsoft EWS Usage Report](https://learn.microsoft.com/en-us/microsoft-365/admin/activity-reports/ews-usage)
- [Microsoft EWS-to-Graph overview](https://learn.microsoft.com/en-us/graph/migrate-exchange-web-services-overview)

## Security

Do not submit credentials, tokens, mailbox content, proprietary source, tenant exports, or personal data in a public issue. Use only synthetic, minimal reproductions.

## License

MIT.
