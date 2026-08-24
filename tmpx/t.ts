import { fetchWalletPortfolio } from "../src/lib/xnova/providers/rpc.server";
const p = await fetchWalletPortfolio("wdrwhnCv4pzW8beKsbPa4S2UDZrXenjg16KJdKSpb5u");
console.log(JSON.stringify({sol:p.solBalance,xn:p.xnovaBalance,xv:p.xnovaValueUsd,tv:p.totalValueUsd,n:p.tokens.length,t:p.tokens.slice(0,5)},null,1));
