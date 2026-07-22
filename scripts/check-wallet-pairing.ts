import assert from "node:assert/strict";
import {
  canDetachWalletFromPair,
  INDEPENDENT_WALLET_GROUP_VALUE,
  pairingGroupKey,
  reassignWalletPairing,
  type PairableWallet
} from "../shared/wallet-pairing.js";
import {
  regroupWalletSummaries,
  type RegroupableHolding,
  type RegroupableWalletSummary
} from "../shared/wallet-snapshot.js";

type Wallet = PairableWallet & { createdAt: string };
type Holding = RegroupableHolding & { symbol: string };
type TopToken = { symbol: string; totalUsd: number };
type Summary = RegroupableWalletSummary<Wallet, Holding, TopToken>;

const createdAt = "2026-07-23T00:00:00.000Z";
const evm1: Wallet = {
  id: "wallet-001",
  label: "EVM 1",
  address: "0x1111111111111111111111111111111111111111",
  addressType: "evm",
  groupId: "wallet-001",
  groupLabel: "钱包 1",
  createdAt
};
const sol1: Wallet = {
  id: "wallet-solana-111",
  label: "SOL 1",
  address: "11111111111111111111111111111111",
  addressType: "solana",
  groupId: "wallet-001",
  groupLabel: "钱包 1",
  createdAt
};
const evm2: Wallet = {
  id: "wallet-002",
  label: "EVM 2",
  address: "0x2222222222222222222222222222222222222222",
  addressType: "evm",
  groupId: "wallet-002",
  groupLabel: "独立：EVM 2",
  createdAt
};

const pairedWallets = [evm1, sol1];
const assignments = { "wallet-001": "virtuals" };

assert.equal(canDetachWalletFromPair(evm1, pairedWallets), true);

const detachedAnchor = reassignWalletPairing(
  pairedWallets,
  evm1.address,
  INDEPENDENT_WALLET_GROUP_VALUE,
  assignments
);
assert.equal(detachedAnchor.changed, true);
assert.deepEqual(new Set(detachedAnchor.wallets.map(pairingGroupKey)), new Set([evm1.id, sol1.id]));
assert.equal(detachedAnchor.wallets.find((wallet) => wallet.address === evm1.address)?.groupLabel, "钱包 1");
assert.equal(detachedAnchor.wallets.find((wallet) => wallet.address === sol1.address)?.groupLabel, "SOL 1");
assert.deepEqual(detachedAnchor.assignments, { [evm1.id]: "virtuals", [sol1.id]: "virtuals" });

const detachedSol = reassignWalletPairing(
  pairedWallets,
  sol1.address,
  INDEPENDENT_WALLET_GROUP_VALUE,
  assignments
);
assert.equal(detachedSol.changed, true);
assert.deepEqual(new Set(detachedSol.wallets.map(pairingGroupKey)), new Set([evm1.id, sol1.id]));
assert.equal(detachedSol.wallets.find((wallet) => wallet.address === evm1.address)?.groupLabel, "钱包 1");

const pairedAgain = reassignWalletPairing(
  detachedAnchor.wallets,
  sol1.address,
  evm1.id,
  detachedAnchor.assignments
);
assert.equal(pairedAgain.changed, true);
assert.deepEqual(new Set(pairedAgain.wallets.map(pairingGroupKey)), new Set([evm1.id]));
assert.deepEqual(pairedAgain.assignments, { [evm1.id]: "virtuals" });
assert.equal(pairedAgain.wallets.every((wallet) => wallet.groupLabel === "钱包 1"), true);

const pairedFromEvm = reassignWalletPairing(
  detachedAnchor.wallets,
  evm1.address,
  sol1.id,
  detachedAnchor.assignments
);
assert.equal(pairedFromEvm.changed, true);
assert.deepEqual(new Set(pairedFromEvm.wallets.map(pairingGroupKey)), new Set([sol1.id]));
assert.equal(pairedFromEvm.wallets.every((wallet) => wallet.groupLabel === "钱包 1"), true);

const rejectedSameType = reassignWalletPairing(
  [...detachedAnchor.wallets, evm2],
  evm1.address,
  evm2.id,
  { ...detachedAnchor.assignments, [evm2.id]: "42-space" }
);
assert.equal(rejectedSameType.changed, false);

function summarizeTopTokens(holdings: Holding[]) {
  const totals = new Map<string, number>();
  for (const holding of holdings) {
    totals.set(holding.symbol, (totals.get(holding.symbol) || 0) + holding.usdValue);
  }
  return Array.from(totals, ([symbol, totalUsd]) => ({ symbol, totalUsd }));
}

const pairedSummary: Summary = {
  wallet: { ...evm1, label: "钱包 1" },
  wallets: pairedWallets,
  addressTypes: ["evm", "solana"],
  status: "ok",
  totalUsd: 150,
  tokenCount: 2,
  topTokens: [
    { symbol: "ETH", totalUsd: 100 },
    { symbol: "SOL", totalUsd: 50 }
  ],
  holdings: [
    { walletId: evm1.id, walletLabel: evm1.label, walletAddress: evm1.address, symbol: "ETH", usdValue: 100 },
    { walletId: sol1.id, walletLabel: sol1.label, walletAddress: sol1.address, symbol: "SOL", usdValue: 50 }
  ]
};

const regroupOptions = {
  groupKey: pairingGroupKey,
  groupLabel: (wallet: Wallet) => wallet.groupLabel || wallet.label,
  normalizeAddress: (address: string) => address.toLowerCase(),
  prepareHolding: (holding: Holding, wallet: Wallet) => ({
    ...holding,
    walletId: wallet.id,
    walletLabel: wallet.label,
    walletAddress: wallet.address
  }),
  summarizeTopTokens,
  walletTypeRank: (wallet: Pick<Wallet, "addressType">) => wallet.addressType === "evm" ? 0 : 1
};

const splitSummaries = regroupWalletSummaries([pairedSummary], detachedAnchor.wallets, regroupOptions);
assert.equal(splitSummaries.length, 2);
assert.deepEqual(splitSummaries.map((summary) => summary.totalUsd).sort((a, b) => a - b), [50, 100]);
assert.equal(splitSummaries.every((summary) => summary.wallets?.length === 1), true);

const mergedSummaries = regroupWalletSummaries(splitSummaries, pairedAgain.wallets, regroupOptions);
assert.equal(mergedSummaries.length, 1);
assert.equal(mergedSummaries[0].totalUsd, 150);
assert.equal(mergedSummaries[0].wallets?.length, 2);

console.log("wallet pairing checks passed");
