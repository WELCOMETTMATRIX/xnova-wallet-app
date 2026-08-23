import { createFileRoute } from "@tanstack/react-router";

import { AiChat } from "@/components/xnova/AiChat";
import { TerminalLayout } from "@/components/xnova/Layout";

export const Route = createFileRoute("/ai")({
  head: () => ({
    meta: [
      { title: "XNOVA AI — Solana Terminal Assistant" },
      {
        name: "description",
        content:
          "Chat with XNOVA AI about the Solana token, whale alerts, wallet connectivity, dApps and terminal features — live data stays in the market panels.",
      },
      { property: "og:title", content: "XNOVA AI — Solana Terminal Assistant" },
      {
        property: "og:description",
        content: "AI assistant built into the XNOVA Solana Web3 intelligence terminal.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: AiPage,
});

function AiPage() {
  return (
    <TerminalLayout>
      <div className="space-y-4">
        <header className="panel px-4 py-4">
          <h1 className="text-lg font-semibold tracking-tight">XNOVA AI</h1>
          <p className="mt-1 max-w-2xl text-[11px] leading-relaxed text-muted-foreground">
            An assistant wired into the XNOVA terminal. It explains the token, panels, alerts and
            Solana concepts. It never asks for keys and never invents market numbers.
          </p>
        </header>
        <AiChat />
      </div>
    </TerminalLayout>
  );
}
