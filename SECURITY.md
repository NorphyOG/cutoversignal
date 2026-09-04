# Security Policy

## Safe reports only

Use GitHub private vulnerability reporting when it is enabled for this repository. Do not place sensitive reports in a public issue.

Never include:

- passwords, API keys, tokens, cookies, certificates, or connection strings;
- tenant, mailbox, customer, or personal data;
- proprietary source code or private repository links;
- production dumps or Microsoft 365 exports.

A minimal synthetic reproduction, affected version, expected result, actual result, and operating-system/Node version are sufficient.

## Supported preview

Version `0.2.0` is a bounded preview for Node.js 22.6 or newer. Static findings can be incomplete or incorrect. The scanner does not connect to Microsoft 365 or certify migration readiness. The GitHub Action reads only a canonically workspace-contained scan root and writes its report under the runner temporary directory; the local CLI writes only to the path explicitly selected by its operator. Neither mode proves Graph parity.

Security-sensitive reports must use an enabled private reporting channel; do not disclose sensitive material in public issues.
