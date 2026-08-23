import { useQuery } from "@tanstack/react-query";
import { createThirdwebClient, defineChain, getRpcClient, eth_getBalance } from "thirdweb";

import { Loading, Stat, Unavailable } from "./primitives";
import { formatNum, shortAddress } from "@/lib/xnova/config";

/**
 * Native balance of the connected EVM account, read directly from the chain RPC
 * through the Thirdweb client. No mock values: unavailable RPC shows an error state.
 */
export function EvmBalance({
  clientId,
  address,
  chainId,
  chainName,
}: {
  clientId: string;
  address: string;
  chainId: number;
  chainName: string | null;
}) {
  const balance = useQuery({
    queryKey: ["xnova", "evm-balance", address, chainId],
    queryFn: async () => {
      const client = createThirdwebClient({ clientId });
      const chain = defineChain(chainId);
      const rpc = getRpcClient({ client, chain });
      const wei = await eth_getBalance(rpc, { address: address as `0x${string}` });
      return Number(wei) / 1e18;
    },
    refetchInterval: 30_000,
    retry: 1,
  });

  return (
    <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
      <Stat label="Account" value={shortAddress(address, 6)} sub="Connected via Thirdweb" />
      <Stat label="Network" value={chainName ?? `Chain ${chainId}`} sub={`chainId ${chainId}`} />
      <div className="col-span-2">
        {balance.isPending ? (
          <Loading label="Reading chain balance" />
        ) : balance.isError ? (
          <Unavailable source="EVM RPC" detail={(balance.error as Error).message} />
        ) : (
          <Stat
            label="Native balance"
            value={formatNum(balance.data)}
            sub="Live from the connected network"
          />
        )}
      </div>
    </div>
  );
}
