# XNOVA — Solana Web3 Intelligence Terminal

Open-source terminal for the XNOVA Solana token: live market data, candlestick charts, whale
tracking, holder intelligence, wallet portfolio, dApp explorer and automated Telegram alerts for
every buy and sell.

- Token (Solana Mainnet): `9RwukCBfqoXb4XaqDvchKs8LhSmbbdcVik1S9h47pump`
- Primary pair: `6XwPJSsCvHpMaiGZstCbm95RmBMQMZpErRYSXfsPyNhT`
- DexScreener: https://dexscreener.com/solana/6xwpjsscvhpmaigzstcbm95rmbmqmzperrysxfspynht
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
- DexScreener pair chart embed plus no-key on-chain trade reconstruction
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
      chain-trades.server.ts    no-key on-chain swap reconstruction for trades/alerts
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
└── DexScreener       price, liquidity, volume, pair statistics and chart link
    Solana RPC        no-key on-chain trade reconstruction for alerts

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
# 💫 About $XNOVA:
XNOVA — Solana Web3 Intelligence Terminal<br><br>Open-source terminal for the XNOVA Solana token: live market data, candlestick charts, whale tracking, holder intelligence, wallet portfolio, dApp explorer and automated Telegram alerts for every buy and sell.<br><br>    Token (Solana Mainnet): 9RwukCBfqoXb4XaqDvchKs8LhSmbbdcVik1S9h47pump<br>    Primary pair: 6XwPJSsCvHpMaiGZstCbm95RmBMQMZpErRYSXfsPyNhT<br>    DexScreener: https://dexscreener.com/solana/6xwpjsscvhpmaigzstcbm95rmbmqmzperrysxfspynht<br>    Pump.fun: https://pump.fun/coin/9RwukCBfqoXb4XaqDvchKs8LhSmbbdcVik1S9h47pump<br>    Website: https://xnovasolanax.vercel.app/<br><br>Principles<br><br>    No fabricated data. If a provider is unavailable, the UI shows Data temporarily unavailable — never an invented price, holder count or transaction.<br>    No secrets in the browser. API keys and bot tokens are read only inside server handlers.<br>    Non-custodial. The app never asks for a seed phrase or private key; signing happens in the user's wallet.<br><br>Stack<br><br>    TanStack Start (React 19, Vite, SSR on an edge runtime)<br>    TanStack Query for cached, throttled data fetching<br>    Tailwind CSS v4 design tokens (dark terminal theme)<br>    DexScreener pair chart embed plus no-key on-chain trade reconstruction<br>    thirdweb for wallet connectivity (MetaMask, Crypto.com Onchain, Rainbow, Trust, Uniswap, OKX)<br><br>Architecture<br><br>src/<br>  components/xnova/     UI panels: chart, trade tape, whales, holders, intel, staking, wallet<br>  lib/xnova/<br>    config.ts           Public constants + formatters (no secrets)<br>    types.ts            Shared data contracts<br>    result.ts           attempt() wrapper -> ok/error result for every provider call<br>    providers/<br>      dexscreener.server.ts   price, liquidity, volume, market cap, pair stats<br>      chain-trades.server.ts    no-key on-chain swap reconstruction for trades/alerts<br>      solscan.server.ts       token metadata, holders, transfers  (SOLSCAN_API_KEY)<br>      rpc.server.ts           Solana RPC: balances, SPL token accounts<br>      http.server.ts          timeout + TTL cache for outbound requests<br>    market.functions.ts       server functions consumed by the UI<br>    wallet.functions.ts       portfolio server functions<br>    alerts.server.ts          alert engine (buy/sell/whale/price scan + dedupe)<br>    telegram.server.ts        Telegram transport + message formatting<br>    bot.server.ts             Telegram command handling<br>  routes/<br>    index.tsx           Homepage: canvas hero, live header, terminal, staking zone<br>    markets.tsx         Overview / Chart / Trades / Holders / Whales / Liquidity / Transactions<br>    dapps.tsx           Solana dApp explorer with link-safety metadata<br>    portfolio.tsx       Solana wallet lookup and holdings<br>    alerts.tsx          Alert engine status, types and bot commands<br>    staking.tsx         Staking zone<br>    api/public/telegram/webhook.ts  Telegram webhook (secret-token authenticated)<br>    api/public/xnova/scan.ts        Cron endpoint that pushes buy/sell alerts<br><br>Provider adapters implement a common shape so an additional Solana data provider can be added without touching UI code.<br>Blockchain providers<br><br>Solana<br>├── Solana RPC        blockchain state, balances, token accounts<br>├── Solscan           token metadata, holders, transfers<br>└── DexScreener       price, liquidity, volume, pair statistics and chart link<br>    Solana RPC        no-key on-chain trade reconstruction for alerts<br><br>EVM / Cronos<br>└── Crypto.com Onchain (wallet connectivity via thirdweb)<br><br>Crypto.com Onchain is an EVM/Cronos wallet — it is used for wallet connectivity, not as a Solana RPC.<br>Installation<br><br>bun install<br>cp .env.example .env   # fill in values<br>bun run dev<br><br>Environment variables<br><br>See .env.example. All of these are server-side:<br>Variable 	Purpose<br>SOLANA_RPC_URL 	Solana RPC endpoint (falls back to the public mainnet endpoint)<br>SOLSCAN_API_KEY 	Solscan Pro API key for metadata, holders and transfers<br>THIRDWEB_CLIENT_ID 	thirdweb client id (public value, served to the browser at runtime)<br>TELEGRAM_BOT_TOKEN 	BotFather token for the XNOVA bot<br>TELEGRAM_CHAT_ID 	Default channel/chat that receives alerts<br>TELEGRAM_WEBHOOK_SECRET 	Shared secret for the webhook and the cron scan endpoint<br>XNOVA_ALERT_MIN_TRADE_USD 	Minimum trade value that triggers a notification (default 250)<br>XNOVA_ALERT_WHALE_USD 	Whale threshold (default 5000)<br>XNOVA_ALERT_PRICE_PCT 	1h move that triggers a price alert (default 10)<br><br>Never commit real values. .env is git-ignored.<br>Telegram setup<br><br>    Create a bot with @BotFather and copy the token.<br>    Add the bot to your channel/group and note the chat id.<br>    Store TELEGRAM_BOT_TOKEN, TELEGRAM_CHAT_ID and TELEGRAM_WEBHOOK_SECRET as server secrets.<br>    Register the webhook:<br><br>curl "https://api.telegram.org/bot<TOKEN>/setWebhook?url=https://<your-app>/api/public/telegram/webhook&secret_token=<TELEGRAM_WEBHOOK_SECRET>"<br><br>    Schedule the alert scanner every 1–2 minutes:<br><br>curl -X POST https://<your-app>/api/public/xnova/scan -H "x-xnova-secret: <TELEGRAM_WEBHOOK_SECRET>"<br><br>Commands: /start /help /token /price /chart /holders /volume /liquidity /whales /alerts /watch /unwatch /status.<br>Deployment<br><br>The app builds to an edge-compatible server bundle (bun run build). Set every environment variable in the hosting provider's secret store, then publish. Preview picks up new secrets immediately; production requires a publish.<br>Security<br><br>See SECURITY.md. Outbound dApp links are inspected for HTTPS, suspicious TLDs and malformed hosts before they are surfaced.<br>Contributing<br><br>See CONTRIBUTING.md and CODE_OF_CONDUCT.md.<br>License<br><br>MIT — see LICENSE.<br>Disclaimer<br><br>XNOVA is an analytics tool. Nothing here is financial advice, and no outcome is guaranteed. Always verify contract addresses yourself.


## 🌐 Socials:
[![X](https://img.shields.io/badge/X-black.svg?logo=X&logoColor=white)](https://x.com/xnovasolana) 

# 💻 Tech Stack:
![TypeScript](https://img.shields.io/badge/typescript-%23007ACC.svg?style=for-the-badge&logo=typescript&logoColor=white) ![Java](https://img.shields.io/badge/java-%23ED8B00.svg?style=for-the-badge&logo=openjdk&logoColor=white) ![Vercel](https://img.shields.io/badge/vercel-%23000000.svg?style=for-the-badge&logo=vercel&logoColor=white) ![React](https://img.shields.io/badge/react-%2320232a.svg?style=for-the-badge&logo=react&logoColor=%2361DAFB) ![React Native](https://img.shields.io/badge/react_native-%2320232a.svg?style=for-the-badge&logo=react&logoColor=%2361DAFB) ![Chart.js](https://img.shields.io/badge/chart.js-F5788D.svg?style=for-the-badge&logo=chart.js&logoColor=white) ![GitHub](https://img.shields.io/badge/github-%23121011.svg?style=for-the-badge&logo=github&logoColor=white) ![GitHub Actions](https://img.shields.io/badge/github%20actions-%232671E5.svg?style=for-the-badge&logo=githubactions&logoColor=white) ![Unreal Engine](https://img.shields.io/badge/unrealengine-%23313131.svg?style=for-the-badge&logo=unrealengine&logoColor=white) ![Twilio](https://img.shields.io/badge/Twilio-F22F46?style=for-the-badge&logo=Twilio&logoColor=white)


## 🏆 GitHub Trophies
![](https://github-profile-trophy.vercel.app/?username=xnovawalletapp&theme=radical&no-frame=false&no-bg=true&margin-w=4)

### ✍️ Random Dev Quote
![](https://quotes-github-readme.vercel.app/api?type=horizontal&theme=radical)

---
[![](https://komarev.com/ghpvc/?username=xnovawalletapp&icon=0&color=0)](https://visitcount.itsvg.in)

  ## 💰 You can help me by Donating
  [![BuyMeACoffee](https://img.shields.io/badge/Buy%20Me%20a%20Coffee-ffdd00?style=for-the-badge&logo=buy-me-a-coffee&logoColor=black)](https://buymeacoffee.com/dogekingmike) 

  
<!-- Proudly created with GPRM ( https://gprm.itsvg.in ) -->
