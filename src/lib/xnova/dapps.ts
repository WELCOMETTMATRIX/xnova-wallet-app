export type DappCategory =
  | "DEX"
  | "DeFi"
  | "NFT"
  | "Gaming"
  | "Staking"
  | "Lending"
  | "Liquid Staking"
  | "Launchpad"
  | "Infrastructure"
  | "Wallet"
  | "Analytics"
  | "DAO"
  | "Payments"
  | "Social"
  | "Bridge";

export interface Dapp {
  name: string;
  url: string;
  category: DappCategory;
  description: string;
  twitter?: string;
  trending?: boolean;
  added?: string; // ISO date the entry was added to this registry
}

/**
 * Curated registry of well-known Solana dApps. Community-maintained via PRs.
 * Listing is not an endorsement — always verify a domain before connecting.
 */
export const DAPPS: Dapp[] = [
  { name: "Jupiter", url: "https://jup.ag", category: "DEX", description: "Solana's liquidity aggregator and swap router.", twitter: "https://x.com/JupiterExchange", trending: true, added: "2026-08-01" },
  { name: "Raydium", url: "https://raydium.io", category: "DEX", description: "AMM and liquidity provider built on Solana.", twitter: "https://x.com/RaydiumProtocol", added: "2026-08-01" },
  { name: "Orca", url: "https://www.orca.so", category: "DEX", description: "Concentrated liquidity AMM with whirlpools.", twitter: "https://x.com/orca_so", added: "2026-08-01" },
  { name: "Meteora", url: "https://www.meteora.ag", category: "DeFi", description: "Dynamic liquidity market maker and vaults.", twitter: "https://x.com/MeteoraAG", trending: true, added: "2026-08-01" },
  { name: "Phoenix", url: "https://www.phoenix.trade", category: "DEX", description: "Fully on-chain central limit order book.", added: "2026-08-01" },
  { name: "Drift Protocol", url: "https://drift.trade", category: "DeFi", description: "Perpetual futures and spot margin trading.", twitter: "https://x.com/DriftProtocol", trending: true, added: "2026-08-01" },
  { name: "Kamino Finance", url: "https://app.kamino.finance", category: "Lending", description: "Automated liquidity vaults and lending markets.", twitter: "https://x.com/KaminoFinance", added: "2026-08-01" },
  { name: "MarginFi", url: "https://app.marginfi.com", category: "Lending", description: "Decentralised borrow / lend protocol.", added: "2026-08-01" },
  { name: "Save (Solend)", url: "https://save.finance", category: "Lending", description: "Algorithmic lending pools on Solana.", added: "2026-08-01" },
  { name: "Marinade", url: "https://marinade.finance", category: "Liquid Staking", description: "Liquid staking with mSOL and native staking.", twitter: "https://x.com/MarinadeFinance", added: "2026-08-01" },
  { name: "Jito", url: "https://www.jito.network", category: "Liquid Staking", description: "MEV-powered liquid staking (JitoSOL).", twitter: "https://x.com/jito_sol", trending: true, added: "2026-08-01" },
  { name: "Sanctum", url: "https://app.sanctum.so", category: "Liquid Staking", description: "Infinite LST liquidity layer.", added: "2026-08-01" },
  { name: "Lido-style Staking (Solana Beach)", url: "https://solanabeach.io/validators", category: "Staking", description: "Validator explorer for native SOL delegation.", added: "2026-08-01" },
  { name: "Magic Eden", url: "https://magiceden.io", category: "NFT", description: "Multi-chain NFT marketplace with Solana roots.", added: "2026-08-01" },
  { name: "Tensor", url: "https://www.tensor.trade", category: "NFT", description: "Pro NFT trading terminal for Solana.", trending: true, added: "2026-08-01" },
  { name: "Metaplex", url: "https://www.metaplex.com", category: "Infrastructure", description: "NFT and digital asset standard for Solana.", added: "2026-08-01" },
  { name: "Helius", url: "https://www.helius.dev", category: "Infrastructure", description: "RPC, webhooks and indexing APIs.", added: "2026-08-01" },
  { name: "Triton One", url: "https://triton.one", category: "Infrastructure", description: "High performance Solana RPC infrastructure.", added: "2026-08-01" },
  { name: "Solscan", url: "https://solscan.io", category: "Analytics", description: "Block explorer and on-chain data API.", added: "2026-08-01" },
  { name: "DexScreener", url: "https://dexscreener.com/solana", category: "Analytics", description: "Real-time DEX pair charts and market data.", added: "2026-08-01" },
  { name: "GeckoTerminal", url: "https://www.geckoterminal.com/solana", category: "Analytics", description: "On-chain DEX analytics and OHLCV data.", added: "2026-08-01" },
  { name: "Birdeye", url: "https://birdeye.so", category: "Analytics", description: "Token discovery and trading analytics.", added: "2026-08-01" },
  { name: "Phantom", url: "https://phantom.app", category: "Wallet", description: "Leading Solana browser and mobile wallet.", added: "2026-08-01" },
  { name: "Solflare", url: "https://solflare.com", category: "Wallet", description: "Solana wallet with staking support.", added: "2026-08-01" },
  { name: "Backpack", url: "https://backpack.app", category: "Wallet", description: "xNFT-native wallet and exchange.", added: "2026-08-01" },
  { name: "Crypto.com Onchain", url: "https://crypto.com/onchain", category: "Wallet", description: "Self-custody multi-chain wallet (EVM / Cronos focus).", added: "2026-08-01" },
  { name: "Pump.fun", url: "https://pump.fun", category: "Launchpad", description: "Permissionless token launchpad on Solana.", trending: true, added: "2026-08-01" },
  { name: "Streamflow", url: "https://streamflow.finance", category: "Payments", description: "Token vesting and streaming payments.", added: "2026-08-01" },
  { name: "Sphere Pay", url: "https://spherepay.co", category: "Payments", description: "Payment infrastructure built on Solana.", added: "2026-08-01" },
  { name: "Realms", url: "https://app.realms.today", category: "DAO", description: "DAO governance platform for Solana.", added: "2026-08-01" },
  { name: "Squads", url: "https://squads.so", category: "DAO", description: "Multisig and treasury management.", added: "2026-08-01" },
  { name: "Wormhole", url: "https://portalbridge.com", category: "Bridge", description: "Cross-chain messaging and asset bridge.", added: "2026-08-01" },
  { name: "deBridge", url: "https://app.debridge.finance", category: "Bridge", description: "Cross-chain liquidity transfers.", added: "2026-08-01" },
  { name: "Star Atlas", url: "https://staratlas.com", category: "Gaming", description: "Space grand-strategy metaverse on Solana.", added: "2026-08-01" },
  { name: "Aurory", url: "https://aurory.io", category: "Gaming", description: "Solana gaming ecosystem and NFT RPG.", added: "2026-08-01" },
  { name: "Dialect", url: "https://www.dialect.to", category: "Social", description: "On-chain messaging and notifications.", added: "2026-08-01" },
  { name: "Solana Blinks / Actions", url: "https://solana.com/solutions/actions", category: "Social", description: "Shareable on-chain actions across the web.", added: "2026-08-01" },
];

export const CATEGORIES: DappCategory[] = [
  "DEX",
  "DeFi",
  "Lending",
  "Liquid Staking",
  "Staking",
  "NFT",
  "Gaming",
  "Launchpad",
  "Infrastructure",
  "Wallet",
  "Analytics",
  "DAO",
  "Payments",
  "Social",
  "Bridge",
];

export interface UrlSafety {
  https: boolean;
  host: string;
  suspicious: boolean;
  reasons: string[];
}

const SUSPICIOUS_TLD = [".zip", ".mov", ".click", ".top", ".xyz", ".gq", ".cf"];

/** Lightweight client-side safety metadata for outbound dApp links. */
export function inspectUrl(raw: string): UrlSafety {
  const reasons: string[] = [];
  try {
    const url = new URL(raw);
    const https = url.protocol === "https:";
    if (!https) reasons.push("Connection is not HTTPS");
    if (SUSPICIOUS_TLD.some((tld) => url.hostname.endsWith(tld))) {
      reasons.push("Uncommon top-level domain");
    }
    if (/\d{1,3}(\.\d{1,3}){3}/.test(url.hostname)) reasons.push("Raw IP host");
    if (url.hostname.split(".").length > 4) reasons.push("Deeply nested subdomain");
    if (url.username || url.password) reasons.push("Embedded credentials in URL");
    return { https, host: url.hostname, suspicious: reasons.length > 0, reasons };
  } catch {
    return { https: false, host: raw, suspicious: true, reasons: ["Malformed URL"] };
  }
}
