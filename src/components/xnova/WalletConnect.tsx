import { ClientOnly } from "@tanstack/react-router";
import { lazy, Suspense } from "react";

const ConnectInner = lazy(() =>
  import("./ConnectInner").then((m) => ({ default: m.ConnectInner })),
);

function Placeholder({ label }: { label: string }) {
  return (
    <div className="num flex h-9 items-center rounded-sm border border-border bg-surface px-3 text-[11px] uppercase tracking-widest text-muted-foreground">
      {label}
    </div>
  );
}

/** Thirdweb wallet connection (MetaMask, Crypto.com Onchain, Rainbow, Trust, OKX, Uniswap). */
export function WalletConnect() {
  return (
    <ClientOnly fallback={<Placeholder label="Connect Solana" />}>
      <Suspense fallback={<Placeholder label="Connect Solana" />}>
        <ConnectInner />
      </Suspense>
    </ClientOnly>
  );
}
