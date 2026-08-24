import { solanaRpc } from "../src/lib/xnova/providers/onchain.server";
const mint="9RwukCBfqoXb4XaqDvchKs8LhSmbbdcVik1S9h47pump";
const r:any = await solanaRpc("getTokenAccountsByOwner",["wdrwhnCv4pzW8beKsbPa4S2UDZrXenjg16KJdKSpb5u",{mint},{encoding:"jsonParsed"}]);
console.log(JSON.stringify(r.value?.map((v:any)=>v.account.data.parsed.info.tokenAmount)));
const o:any = await solanaRpc("getAccountInfo",[mint,{encoding:"jsonParsed"}]);
console.log(o.value?.owner);
