import assert from "node:assert/strict";
import {
  calculateConservativeEstimate,
  stableAssetBreakdown
} from "../shared/asset-estimate.js";

const tokens = [
  { symbol: "USDC", totalUsd: 100, totalBalance: 100, riskCount: 0 },
  { symbol: "SPY", totalUsd: 500, totalBalance: 0.75, riskCount: 0 },
  { symbol: "ETH", totalUsd: 200, totalBalance: 0.05, riskCount: 0 },
  { symbol: "SPY", totalUsd: 50, totalBalance: 0.075, riskCount: 1 },
  { symbol: "USDT", totalUsd: 20, totalBalance: 10, riskCount: 0 }
];

assert.deepEqual(stableAssetBreakdown(tokens), {
  stablecoinUsd: 100,
  stableAssetUsd: 600
});

const estimate = calculateConservativeEstimate(tokens, {
  totalUsd: 300,
  stableAssetUsd: 120,
  stablecoinUsd: 20
});
assert.equal(estimate.stablecoinUsd, 120);
assert.equal(estimate.stableAssetUsd, 720);
assert.equal(estimate.volatileAssetUsd, 450);
assert.equal(estimate.conservativeTotalUsd, 1080);

const legacyAdditionalVolatile = calculateConservativeEstimate(tokens, -20);
assert.equal(legacyAdditionalVolatile.stableAssetUsd, 600);
assert.equal(legacyAdditionalVolatile.volatileAssetUsd, 250);
assert.equal(legacyAdditionalVolatile.conservativeTotalUsd, 800);

console.log("asset estimate checks passed");
