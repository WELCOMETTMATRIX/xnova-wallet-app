import { getWallets } from "@wallet-standard/app";
import type { Wallet } from "@wallet-standard/base";
import {
  StandardConnect,
  StandardDisconnect,
  StandardEvents,
  type StandardConnectFeature,
  type StandardDisconnectFeature,
  type StandardEventsFeature,
} from "@wallet-standard/features";
import { Check, ChevronDown, LogOut, Wallet as WalletIcon } from "lucide-react";
import { useEffect, useRef, useState } from "react";

import { shortAddress } from "@/lib/xnova/config";
import { setConnectedWallet } from "@/lib/xnova/wallet-store";

type ConnectableWallet = Wallet & StandardConnectFeature;
type EventWallet = Wallet & StandardEventsFeature;

function supportsSolana(wallet: Wallet): wallet is ConnectableWallet {
  return StandardConnect in wallet.features && wallet.chains.some((chain) => chain.startsWith("solana:"));
}

function accountFor(wallet: Wallet) {
  return wallet.accounts.find((account) => account.chains.some((chain) => chain.startsWith("solana:")));
}

export function ConnectInner() {
  const [wallets, setWallets] = useState<readonly ConnectableWallet[]>([]);
  const [activeWallet, setActiveWallet] = useState<ConnectableWallet | null>(null);
  const [open, setOpen] = useState(false);
  const [connecting, setConnecting] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const registry = getWallets();
    const syncWallets = () => setWallets(registry.get().filter(supportsSolana));
    syncWallets();
    const offRegister = registry.on("register", syncWallets);
    const offUnregister = registry.on("unregister", syncWallets);
    return () => {
      offRegister();
      offUnregister();
    };
  }, []);

  useEffect(() => {
    const restored = wallets.find((wallet) => accountFor(wallet));
    if (restored) setActiveWallet(restored);
  }, [wallets]);

  useEffect(() => {
    if (!activeWallet) {
      setConnectedWallet({ address: null, walletName: null, walletIcon: null });
      return;
    }

    const syncAccount = () => {
      const account = accountFor(activeWallet);
      setConnectedWallet({
        address: account?.address ?? null,
        walletName: activeWallet.name,
        walletIcon: activeWallet.icon,
      });
    };

    syncAccount();
    const eventFeature = activeWallet.features[StandardEvents] as {
      on: (event: "change", listener: () => void) => (() => void) | undefined;
    } | undefined;
    const off = eventFeature?.on("change", syncAccount);
    return () => off?.();
  }, [activeWallet]);

  useEffect(() => {
    const onPointerDown = (event: PointerEvent) => {
      if (!menuRef.current?.contains(event.target as Node)) setOpen(false);
    };
    document.addEventListener("pointerdown", onPointerDown);
    return () => document.removeEventListener("pointerdown", onPointerDown);
  }, []);

  async function connect(wallet: ConnectableWallet) {
    setConnecting(wallet.name);
    setError(null);
    try {
      const raw = (await wallet.features[StandardConnect].connect()) as {
        accounts: Array<{ address: string; chains: string[] }>;
      };
      const result = raw as { accounts: Array<{ address: string; chains: string[] }> };
      const account = result.accounts.find((candidate) =>
        candidate.chains.some((chain: string) => chain.startsWith("solana:")),
      );
      if (!account) throw new Error("No Solana account was returned");
      setActiveWallet(wallet);
      setConnectedWallet({ address: account.address, walletName: wallet.name, walletIcon: wallet.icon });
      setOpen(false);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Wallet connection was declined");
    } finally {
      setConnecting(null);
    }
  }

  async function disconnect() {
    const disconnectFeature = activeWallet?.features[StandardDisconnect] as
      | StandardDisconnectFeature[typeof StandardDisconnect]
      | undefined;
    try {
      await disconnectFeature?.disconnect();
    } finally {
      setActiveWallet(null);
      setConnectedWallet({ address: null, walletName: null, walletIcon: null });
      setOpen(false);
    }
  }

  const account = activeWallet ? accountFor(activeWallet) : null;

  return (
    <div ref={menuRef} className="relative">
      <button
        type="button"
        onClick={() => setOpen((value) => !value)}
        className="num flex h-9 items-center gap-2 rounded-sm border border-primary bg-surface px-3 text-[11px] uppercase text-foreground transition-colors hover:bg-surface-2"
        aria-haspopup="menu"
        aria-expanded={open}
      >
        {activeWallet?.icon ? (
          <img src={activeWallet.icon} alt="" className="size-4 rounded-sm" />
        ) : (
          <WalletIcon className="size-4 text-primary" aria-hidden />
        )}
        <span>{account ? shortAddress(account.address, 4) : "Connect Solana"}</span>
        <ChevronDown className="size-3 text-muted-foreground" aria-hidden />
      </button>

      {open ? (
        <div
          role="menu"
          className="absolute right-0 z-50 mt-2 w-72 rounded-sm border border-border bg-background p-2 shadow-xl"
        >
          <div className="px-2 py-2">
            <p className="label-xs">SOLANA MAINNET</p>
            <p className="mt-1 text-[11px] text-muted-foreground">
              Select an installed wallet. XNOVA never requests your seed phrase.
            </p>
          </div>

          {activeWallet && account ? (
            <>
              <div className="flex items-center gap-3 border-y border-border px-2 py-3">
                <img src={activeWallet.icon} alt="" className="size-8 rounded-sm" />
                <div className="min-w-0 flex-1">
                  <p className="text-xs font-medium">{activeWallet.name}</p>
                  <p className="num truncate text-[10px] text-muted-foreground">{account.address}</p>
                </div>
                <Check className="size-4 text-primary" aria-label="Connected" />
              </div>
              <button
                type="button"
                role="menuitem"
                onClick={() => void disconnect()}
                className="mt-2 flex w-full items-center gap-2 rounded-sm px-2 py-2 text-left text-[11px] uppercase text-muted-foreground hover:bg-surface-2 hover:text-foreground"
              >
                <LogOut className="size-4" aria-hidden /> Disconnect
              </button>
            </>
          ) : wallets.length > 0 ? (
            <div className="space-y-1 border-t border-border pt-2">
              {wallets.map((wallet) => (
                <button
                  key={wallet.name}
                  type="button"
                  role="menuitem"
                  onClick={() => void connect(wallet)}
                  disabled={connecting !== null}
                  className="flex w-full items-center gap-3 rounded-sm px-2 py-2 text-left hover:bg-surface-2 disabled:opacity-50"
                >
                  <img src={wallet.icon} alt="" className="size-7 rounded-sm" />
                  <span className="flex-1 text-xs">{wallet.name}</span>
                  <span className="label-xs">{connecting === wallet.name ? "CONNECTING" : "CONNECT"}</span>
                </button>
              ))}
            </div>
          ) : (
            <div className="border-t border-border px-2 py-3 text-[11px] text-muted-foreground">
              No Solana wallet detected. Install Phantom, Solflare, Backpack, or Crypto.com Onchain.
            </div>
          )}
          {error ? <p className="px-2 py-2 text-[11px] text-destructive">{error}</p> : null}
        </div>
      ) : null}
    </div>
  );
}
