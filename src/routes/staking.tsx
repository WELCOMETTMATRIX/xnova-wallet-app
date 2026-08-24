import { createFileRoute } from "@tanstack/react-router";

import { TerminalLayout } from "@/components/xnova/Layout";
import { StakingZone } from "@/components/xnova/StakingZone";
import { TokenHeader } from "@/components/xnova/TokenHeader";

export const Route = createFileRoute("/staking")({
  head: () => ({
    meta: [
      { title: "XNOVA Staking Zone — Solana Staking Options" },
      {
        name: "description",
        content:
          "XNOVA staking status and vetted Solana staking venues: liquid staking, native delegation and validator selection.",
      },
      { property: "og:title", content: "XNOVA Staking Zone" },
      {
        property: "og:description",
        content:
          "Staking status for XNOVA plus liquid staking and native delegation options on Solana.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Staking,
});

function Staking() {
  return (
    <TerminalLayout>
      <div className="space-y-4">
        <TokenHeader />
        <StakingZone />
      </div>
    </TerminalLayout>
  );
}
