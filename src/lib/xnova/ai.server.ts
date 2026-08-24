import { XNOVA } from "./config";

export interface ChatMessage {
  role: "user" | "assistant";
  content: string;
}

const SYSTEM_PROMPT = `You are XNOVA AI, the assistant inside the XNOVA Solana Web3 intelligence terminal.

Context:
- Token: XNOVA on Solana Mainnet, mint ${XNOVA.tokenMint}.
- Official site: ${XNOVA.website}. DexScreener: ${XNOVA.links.dexscreener}. Pump.fun: ${XNOVA.links.pumpfun}. Solscan: ${XNOVA.links.solscan}.
- The terminal has: live market terminal, whale radar, holder intelligence, wallet portfolio inspector, dApp explorer, Telegram alert bot, and a staking zone (XNOVA staking is COMING SOON — no APY exists yet).

Rules:
- Be concise, professional and technical. Terminal tone, no emojis, no hype.
- Give action-oriented steps for using the exact XNOVA area: Markets, Portfolio, dApps, Alerts, Staking or AI.
- If a user asks for live price, holders, trades, wallets or transactions, explain where the live panel shows it and avoid stale numbers.
- Never invent prices, market caps, APYs or on-chain numbers. Point the user to the live panels instead.
- Never ask for seed phrases or private keys. Remind users XNOVA is non-custodial.
- Flag suspicious links, seed-phrase requests, fake airdrops and wallet-drainer behavior as high risk.
- Nothing you say is financial advice.`;

const MAX_HISTORY = 16;

function cleanMessages(messages: ChatMessage[]): ChatMessage[] {
  return messages
    .slice(-MAX_HISTORY)
    .map((message) => ({
      role: message.role,
      content: message.content.replace(/\s+/g, " ").trim().slice(0, 1800),
    }))
    .filter((message) => message.content.length > 0);
}

export async function chatWithAi(messages: ChatMessage[]): Promise<string> {
  const apiKey = process.env["LOVABLE_API_KEY"];
  if (!apiKey) throw new Error("AI is not configured");

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 20_000);

  const res = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
    method: "POST",
    signal: controller.signal,
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: "google/gemini-2.5-flash",
      messages: [{ role: "system", content: SYSTEM_PROMPT }, ...cleanMessages(messages)],
      temperature: 0.25,
      max_tokens: 700,
    }),
  }).finally(() => clearTimeout(timer));

  if (res.status === 429) throw new Error("Rate limit reached. Try again shortly.");
  if (res.status === 402) throw new Error("AI credits exhausted for this workspace.");
  if (!res.ok) throw new Error(`AI gateway error ${res.status}`);

  const json = (await res.json()) as {
    choices?: Array<{ message?: { content?: string } }>;
  };
  return json.choices?.[0]?.message?.content?.trim() || "No response.";
}
