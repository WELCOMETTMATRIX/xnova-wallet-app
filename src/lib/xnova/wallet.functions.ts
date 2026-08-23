import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

import { attempt } from "./result";
import { fetchSolPrice, fetchWalletPortfolio } from "./providers/rpc.server";

export const getWalletPortfolio = createServerFn({ method: "GET" })
  .inputValidator((input: unknown) =>
    z.object({ address: z.string().trim().min(32).max(44) }).parse(input),
  )
  .handler(async ({ data }) => attempt("solana-rpc", () => fetchWalletPortfolio(data.address)));

export const getSolPrice = createServerFn({ method: "GET" }).handler(async () =>
  attempt("dexscreener", fetchSolPrice),
);
