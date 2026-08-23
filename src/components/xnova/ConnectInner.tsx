import { createThirdwebClient } from "thirdweb";
import {
  ConnectButton,
  ThirdwebProvider,
  darkTheme,
  useActiveAccount,
  useActiveWallet,
  useActiveWalletChain,
} from "thirdweb/react";
import { createWallet, type Wallet } from "thirdweb/wallets";
import { useEffect, useMemo } from "react";

import { setConnectedWallet } from "@/lib/xnova/wallet-store";

const WALLET_IDS = [
  "io.metamask",
  "com.crypto.wallet",
  "me.rainbow",
  "com.trustwallet.app",
  "org.uniswap",
  "com.okex.wallet",
] as const;

/** Publishes the active Thirdweb account into the app-wide wallet store. */
function AccountBridge() {
  const account = useActiveAccount();
  const chain = useActiveWalletChain();
  const wallet = useActiveWallet();

  useEffect(() => {
    setConnectedWallet({
      address: account?.address ?? null,
      chainId: chain?.id ?? null,
      chainName: chain?.name ?? null,
      walletId: wallet?.id ?? null,
    });
  }, [account?.address, chain?.id, chain?.name, wallet?.id]);

  return null;
}

export function ConnectInner({ clientId }: { clientId: string }) {
  const client = useMemo(() => createThirdwebClient({ clientId }), [clientId]);
  const wallets = useMemo<Wallet[]>(
    () => WALLET_IDS.map((id) => createWallet(id) as unknown as Wallet),
    [],
  );

  return (
    <ThirdwebProvider>
      <AccountBridge />
      <ConnectButton
        client={client}
        wallets={wallets}
        connectButton={{ label: "XNOVA SOLANA TERMINAL" }}
        detailsButton={{ style: { borderRadius: "4px", height: "36px" } }}
        connectModal={{
          size: "compact",
          title: "XNOVA SOLANA TERMINAL",
          showThirdwebBranding: false,
        }}
        theme={darkTheme({
          colors: {
            modalBg: "hsl(269, 83%, 11%)",
            borderColor: "hsl(0, 100%, 53%)",
            separatorLine: "hsl(0, 96%, 45%)",
            tertiaryBg: "hsl(0, 1%, 48%)",
            selectedTextColor: "hsl(0, 0%, 100%)",
            accentButtonBg: "hsl(0, 96%, 45%)",
          },
        })}
      />
    </ThirdwebProvider>
  );
}
