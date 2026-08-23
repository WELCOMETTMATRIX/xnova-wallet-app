# Contributing to XNOVA

Thanks for helping build an open Solana intelligence terminal.

## Ground rules

1. **Never fabricate data.** No mock prices, holders, volumes or transactions in production code
   paths. If a provider fails, render the unavailable state.
2. **Never commit secrets.** Use `.env` locally and the hosting secret store in deployments.
3. **Keep providers modular.** New data sources go in `src/lib/xnova/providers/*.server.ts` and
   expose the same shapes defined in `src/lib/xnova/types.ts`.
4. **Server-only code stays server-only.** Secrets are read inside handlers, never at module scope.

## Workflow

```bash
bun install
bun run dev
bun run lint
bun run build
```

- Branch from `main`, use focused commits, and open a PR describing the change and how you tested it.
- UI changes: include a screenshot at desktop and mobile widths.
- New dApp registry entries: add to `src/lib/xnova/dapps.ts` with an accurate category, official
  URL (HTTPS) and a one-line factual description. Listings are not endorsements.

## Code style

- TypeScript strict mode; no `any` in new code.
- Styling through the design tokens in `src/styles.css` — no hardcoded color utilities.
- Prefer TanStack Query for data access with sensible `refetchInterval` values.
