import assert from "node:assert/strict";
import {
  defaultAssetGroups,
  normalizeAssetGroups,
  restoreRenamedUnclassifiedGroup,
  UNCLASSIFIED_ASSET_GROUP_ID
} from "../shared/portfolio-state.js";
import { calculateTokenAllocation } from "../shared/token-allocation.js";

const legacyGroups = normalizeAssetGroups(defaultAssetGroups.map((group) =>
  group.id === UNCLASSIFIED_ASSET_GROUP_ID ? { ...group, name: "LetsCash" } : group
));
const originalAssignments = {
  "wallet-1": UNCLASSIFIED_ASSET_GROUP_ID,
  "wallet-2": "virtuals"
};
const restored = restoreRenamedUnclassifiedGroup(legacyGroups, originalAssignments);
const letsCash = restored.assetGroups.find((group) => group.name === "LetsCash");
assert.ok(letsCash);
assert.equal(letsCash.system, false);
assert.equal(restored.assetGroups.find((group) => group.id === UNCLASSIFIED_ASSET_GROUP_ID)?.name, "未分类");
assert.equal(restored.assignments["wallet-1"], letsCash.id);
assert.equal(restored.assignments["wallet-2"], "virtuals");
assert.deepEqual(restoreRenamedUnclassifiedGroup(restored.assetGroups, restored.assignments), restored);
assert.equal(
  restoreRenamedUnclassifiedGroup(restored.assetGroups, { ...restored.assignments, "new-wallet": UNCLASSIFIED_ASSET_GROUP_ID })
    .assignments["new-wallet"],
  UNCLASSIFIED_ASSET_GROUP_ID
);

const reused = restoreRenamedUnclassifiedGroup(
  normalizeAssetGroups([...legacyGroups, { ...letsCash, id: "existing-letscash" }]),
  originalAssignments
);
assert.equal(reused.assetGroups.filter((group) => group.name === "LetsCash").length, 1);
assert.equal(reused.assignments["wallet-1"], "existing-letscash");

const allocation = calculateTokenAllocation([
  { symbol: "ETH", totalUsd: 50 },
  { symbol: "ETH", totalUsd: 10 },
  { symbol: "SOL", totalUsd: 20 },
  { symbol: "USDC", totalUsd: 10 },
  { symbol: "BNB", totalUsd: 5 },
  { symbol: "SPY", totalUsd: 4.5 },
  { symbol: "DUST", totalUsd: 0.5 },
  { symbol: "INVALID", totalUsd: Number.NaN }
]);
assert.equal(allocation.totalUsd, 100);
assert.equal(allocation.tokenCount, 6);
assert.deepEqual(allocation.slices.map((slice) => slice.symbol), ["ETH", "SOL", "USDC", "BNB", "SPY", "其他"]);
assert.equal(allocation.slices[0].share, 0.6);
assert.equal(allocation.slices.at(-1)?.totalUsd, 0.5);
assert.ok(Math.abs(allocation.slices.reduce((sum, slice) => sum + slice.share, 0) - 1) < 1e-12);
assert.deepEqual(calculateTokenAllocation([]), { totalUsd: 0, tokenCount: 0, slices: [] });
assert.equal(calculateTokenAllocation([
  { symbol: "SOL", totalUsd: 10 },
  { symbol: "ETH", totalUsd: 9 },
  { symbol: "BNB", totalUsd: 8 },
  { symbol: "OKB", totalUsd: 7 },
  { symbol: "USDT", totalUsd: 6 },
  { symbol: "DUST", totalUsd: 0.001 }
]).slices.some((slice) => slice.symbol === "其他"), false);

console.log("portfolio group and token allocation checks passed");
