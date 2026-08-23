# XNOVA — Solana Web3 Intelligence Terminal

Open-source terminal for the XNOVA Solana token: live market data, candlestick charts, whale
tracking, holder intelligence, wallet portfolio, dApp explorer and automated Telegram alerts for
every buy and sell.

- Token (Solana Mainnet): `9RwukCBfqoXb4XaqDvchKs8LhSmbbdcVik1S9h47pump`
- Primary pair: `6XwPJSsCvHpMaiGZstCbm95RmBMQMZpErRYSXfsPyNhT`
- DexScreener: https://dexscreener.com/solana/9RwukCBfqoXb4XaqDvchKs8LhSmbbdcVik1S9h47pump
- Pump.fun: https://pump.fun/coin/9RwukCBfqoXb4XaqDvchKs8LhSmbbdcVik1S9h47pump
- Website: https://xnovasolanax.vercel.app/

## Principles

1. **No fabricated data.** If a provider is unavailable, the UI shows `Data temporarily
   unavailable` — never an invented price, holder count or transaction.
2. **No secrets in the browser.** API keys and bot tokens are read only inside server handlers.
3. **Non-custodial.** The app never asks for a seed phrase or private key; signing happens in the
   user's wallet.

## Stack

- TanStack Start (React 19, Vite, SSR on an edge runtime)
- TanStack Query for cached, throttled data fetching
- Tailwind CSS v4 design tokens (dark terminal theme)
- lightweight-charts for candlesticks, volume and moving averages
- thirdweb for wallet connectivity (MetaMask, Crypto.com Onchain, Rainbow, Trust, Uniswap, OKX)

## Architecture

```
src/
  components/xnova/     UI panels: chart, trade tape, whales, holders, intel, staking, wallet
  lib/xnova/
    config.ts           Public constants + formatters (no secrets)
    types.ts            Shared data contracts
    result.ts           attempt() wrapper -> ok/error result for every provider call
    providers/
      dexscreener.server.ts   price, liquidity, volume, market cap, pair stats
      geckoterminal.server.ts OHLCV candles + pool trade tape (whale source)
      solscan.server.ts       token metadata, holders, transfers  (SOLSCAN_API_KEY)
      rpc.server.ts           Solana RPC: balances, SPL token accounts
      http.server.ts          timeout + TTL cache for outbound requests
    market.functions.ts       server functions consumed by the UI
    wallet.functions.ts       portfolio server functions
    alerts.server.ts          alert engine (buy/sell/whale/price scan + dedupe)
    telegram.server.ts        Telegram transport + message formatting
    bot.server.ts             Telegram command handling
  routes/
    index.tsx           Homepage: canvas hero, live header, terminal, staking zone
    markets.tsx         Overview / Chart / Trades / Holders / Whales / Liquidity / Transactions
    dapps.tsx           Solana dApp explorer with link-safety metadata
    portfolio.tsx       Solana wallet lookup and holdings
    alerts.tsx          Alert engine status, types and bot commands
    staking.tsx         Staking zone
    api/public/telegram/webhook.ts  Telegram webhook (secret-token authenticated)
    api/public/xnova/scan.ts        Cron endpoint that pushes buy/sell alerts
```

Provider adapters implement a common shape so an additional Solana data provider can be added
without touching UI code.

### Blockchain providers

```
Solana
├── Solana RPC        blockchain state, balances, token accounts
├── Solscan           token metadata, holders, transfers
└── DexScreener       price, liquidity, volume, pair statistics
    GeckoTerminal     OHLCV candles and pool trades

EVM / Cronos
└── Crypto.com Onchain (wallet connectivity via thirdweb)
```

Crypto.com Onchain is an EVM/Cronos wallet — it is used for wallet connectivity, not as a Solana RPC.

## Installation

```bash
bun install
cp .env.example .env   # fill in values
bun run dev
```

## Environment variables

See `.env.example`. All of these are **server-side**:

| Variable | Purpose |
| --- | --- |
| `SOLANA_RPC_URL` | Solana RPC endpoint (falls back to the public mainnet endpoint) |
| `SOLSCAN_API_KEY` | Solscan Pro API key for metadata, holders and transfers |
| `THIRDWEB_CLIENT_ID` | thirdweb client id (public value, served to the browser at runtime) |
| `TELEGRAM_BOT_TOKEN` | BotFather token for the XNOVA bot |
| `TELEGRAM_CHAT_ID` | Default channel/chat that receives alerts |
| `TELEGRAM_WEBHOOK_SECRET` | Shared secret for the webhook and the cron scan endpoint |
| `XNOVA_ALERT_MIN_TRADE_USD` | Minimum trade value that triggers a notification (default 250) |
| `XNOVA_ALERT_WHALE_USD` | Whale threshold (default 5000) |
| `XNOVA_ALERT_PRICE_PCT` | 1h move that triggers a price alert (default 10) |

Never commit real values. `.env` is git-ignored.

## Telegram setup

1. Create a bot with [@BotFather](https://t.me/BotFather) and copy the token.
2. Add the bot to your channel/group and note the chat id.
3. Store `TELEGRAM_BOT_TOKEN`, `TELEGRAM_CHAT_ID` and `TELEGRAM_WEBHOOK_SECRET` as server secrets.
4. Register the webhook:

```bash
curl "https://api.telegram.org/bot<TOKEN>/setWebhook?url=https://<your-app>/api/public/telegram/webhook&secret_token=<TELEGRAM_WEBHOOK_SECRET>"
```

5. Schedule the alert scanner every 1–2 minutes:

```bash
curl -X POST https://<your-app>/api/public/xnova/scan -H "x-xnova-secret: <TELEGRAM_WEBHOOK_SECRET>"
```

Commands: `/start /help /token /price /chart /holders /volume /liquidity /whales /alerts /watch
/unwatch /status`.

## Deployment

The app builds to an edge-compatible server bundle (`bun run build`). Set every environment
variable in the hosting provider's secret store, then publish. Preview picks up new secrets
immediately; production requires a publish.

## Security

See [SECURITY.md](./SECURITY.md). Outbound dApp links are inspected for HTTPS, suspicious TLDs and
malformed hosts before they are surfaced.

## Contributing

See [CONTRIBUTING.md](./CONTRIBUTING.md) and [CODE_OF_CONDUCT.md](./CODE_OF_CONDUCT.md).

## License

MIT — see [LICENSE](./LICENSE).

## Disclaimer

XNOVA is an analytics tool. Nothing here is financial advice, and no outcome is guaranteed. Always
verify contract addresses yourself.
