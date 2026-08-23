/**
 * Tiny external store holding the currently connected wallet.
 * Written by the Thirdweb bridge in the header, read anywhere via useConnectedWallet().
 */
import { useSyncExternalStore } from "react";

export interface ConnectedWallet {
  address: string | null;
  chainId: number | null;
  chainName: string | null;
  walletId: string | null;
}

const EMPTY: ConnectedWallet = { address: null, chainId: null, chainName: null, walletId: null };

let state: ConnectedWallet = EMPTY;
const listeners = new Set<() => void>();

export function setConnectedWallet(next: ConnectedWallet) {
  if (
    next.address === state.address &&
    next.chainId === state.chainId &&
    next.walletId === state.walletId
  ) {
    return;
  }
  state = next;
  for (const l of listeners) l();
}

function subscribe(listener: () => void) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

export function useConnectedWallet(): ConnectedWallet {
  return useSyncExternalStore(
    subscribe,
    () => state,
    () => EMPTY,
  );
}

/** Last Solana address inspected in the portfolio, persisted locally (no server storage). */
const SOL_KEY = "xnova:solana-address";

export function loadSavedSolanaAddress(): string {
  if (typeof window === "undefined") return "";
  try {
    return window.localStorage.getItem(SOL_KEY) ?? "";
  } catch {
    return "";
  }
}

export function saveSolanaAddress(address: string) {
  try {
    window.localStorage.setItem(SOL_KEY, address);
  } catch {
    /* storage unavailable */
  }
}
