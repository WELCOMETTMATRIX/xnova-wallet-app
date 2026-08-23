import { createThirdwebClient } from "thirdweb";
import { ConnectButton, ThirdwebProvider, darkTheme } from "thirdweb/react";
import { createWallet, type Wallet } from "thirdweb/wallets";
import { useMemo } from "react";

const WALLET_IDS = [
  "io.metamask",
  "com.crypto.wallet",
  "me.rainbow",
  "com.trustwallet.app",
  "org.uniswap",
  "com.okex.wallet",
] as const;

export function ConnectInner({ clientId }: { clientId: string }) {
  const client = useMemo(() => createThirdwebClient({ clientId }), [clientId]);
  const wallets = useMemo<Wallet[]>(
    () => WALLET_IDS.map((id) => createWallet(id) as unknown as Wallet),
    [],
  );

  return (
    <ThirdwebProvider>
      <ConnectButton
        client={client}
        wallets={wallets}
        connectButton={{ label: "CONNECT WALLET" }}
        detailsButton={{ style: { borderRadius: "4px", height: "36px" } }}
        connectModal={{
          size: "compact",
          title: "XNOVA SOLANA TERMINAL",
          showThirdwebBranding: false,
        }}
        theme={darkTheme({
          colors: {
            modalBg: "hsl(240, 4%, 9%)",
            borderColor: "hsl(0, 100%, 53%)",
            separatorLine: "hsl(0, 96%, 45%)",
            tertiaryBg: "hsl(240, 4%, 14%)",
            selectedTextColor: "hsl(0, 0%, 100%)",
            accentButtonBg: "hsl(0, 96%, 45%)",
          },
        })}
      />
    </ThirdwebProvider>
  );
}
