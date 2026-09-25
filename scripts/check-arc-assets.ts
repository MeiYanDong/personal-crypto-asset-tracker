import assert from "node:assert/strict";
import { dedupeArcUsdcHoldings } from "../shared/arc-assets.js";

const native = { chainIndex: "5042", symbol: "USDC", tokenContractAddress: "", usdValue: 109.299304 };
const mirror = {
  chainIndex: "5042",
  symbol: "USDC",
  tokenContractAddress: "0x3600000000000000000000000000000000000000",
  usdValue: 109.299304
};
const argus = { chainIndex: "5042", symbol: "ARGUS", tokenContractAddress: "0xece5ca8bf9220718e5727754026757512212cb3c", usdValue: 19.3 };
const otherChain = { ...mirror, chainIndex: "8453" };

assert.deepEqual(dedupeArcUsdcHoldings([native, mirror, argus, otherChain]), [native, argus, otherChain]);
assert.deepEqual(dedupeArcUsdcHoldings([mirror, argus]), [mirror, argus]);
console.log("Arc asset checks passed");
