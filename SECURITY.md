# Security Policy

## Reporting a vulnerability

Report security issues privately via a GitHub security advisory on the XNOVA repository. Do not
open a public issue for an exploitable vulnerability. We aim to acknowledge reports within 72
hours.

## Threat model and controls

- **Secrets** — `SOLSCAN_API_KEY`, `TELEGRAM_BOT_TOKEN`, `TELEGRAM_WEBHOOK_SECRET`,
  `THIRDWEB_SECRET_KEY` and RPC credentials are read only inside server handlers
  (`*.server.ts`, `createServerFn().handler()`, server routes). They are never bundled into the
  client, logged, or returned to the browser.
- **Webhooks** — `/api/public/telegram/webhook` verifies the
  `x-telegram-bot-api-secret-token` header. `/api/public/xnova/scan` verifies `x-xnova-secret`.
  Both return 401 on mismatch and 503 if the secret is not configured.
- **Input validation** — every server function validates its input with Zod; wallet addresses are
  base58 shape-checked before hitting RPC.
- **Untrusted upstream data** — market, RPC and explorer responses are treated as untrusted:
  values are coerced and range-checked, and never rendered as HTML.
- **Outbound links** — all external links use `target="_blank"` with
  `rel="noopener noreferrer nofollow"`. dApp URLs are inspected for HTTPS, raw-IP hosts, embedded
  credentials and suspicious TLDs before being shown.
- **Caching / rate limiting** — outbound provider calls are TTL-cached and time-bounded to avoid
  hammering upstream APIs; client polling is throttled per data source.
- **Custody** — XNOVA never requests a seed phrase, private key or wallet password, never stores
  keys, and never auto-signs. All signing happens inside the user's wallet.

## Hardening checklist for deployments

- Set every secret in the hosting provider's secret store, not in source control.
- Use a dedicated Solana RPC endpoint with its own rate limits.
- Rotate `TELEGRAM_WEBHOOK_SECRET` if it is ever exposed and re-register the webhook.
- Run `bun audit` (or `npm audit`) regularly and keep dependencies patched.
