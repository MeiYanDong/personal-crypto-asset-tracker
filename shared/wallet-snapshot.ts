export type RegroupableWallet = {
  id: string;
  label: string;
  address: string;
  addressType: "evm" | "solana";
  groupId?: string;
  groupLabel?: string;
};

export type RegroupableHolding = {
  walletId: string;
  walletLabel: string;
  walletAddress: string;
  usdValue: number;
};

export type WalletRefreshStatus = "ok" | "stale" | "error" | "skipped";
export type WalletRefreshState = WalletRefreshStatus | "missing";
export type WalletRefreshFilter = "all" | "issues" | WalletRefreshState;
export type WalletRefreshCounts = Record<WalletRefreshFilter, number>;

export function walletRefreshHasAssetData(status?: WalletRefreshStatus) {
  return status === "ok" || status === "stale";
}

export function walletRefreshState(status?: WalletRefreshStatus): WalletRefreshState {
  return status || "missing";
}

export function walletRefreshMatchesFilter(status: WalletRefreshStatus | undefined, filter: WalletRefreshFilter) {
  const state = walletRefreshState(status);
  if (filter === "all") {
    return true;
  }
  if (filter === "issues") {
    return state !== "ok";
  }
  return state === filter;
}

export function countWalletRefreshStates(statuses: Iterable<WalletRefreshStatus | undefined>) {
  const counts: WalletRefreshCounts = {
    all: 0,
    issues: 0,
    ok: 0,
    stale: 0,
    error: 0,
    skipped: 0,
    missing: 0
  };

  for (const status of statuses) {
    const state = walletRefreshState(status);
    counts.all += 1;
    counts[state] += 1;
    if (state !== "ok") {
      counts.issues += 1;
    }
  }

  return counts;
}

export type RegroupableWalletSummary<
  Wallet extends RegroupableWallet,
  Holding extends RegroupableHolding,
  TopToken
> = {
  wallet: Wallet;
  wallets?: Wallet[];
  addressTypes?: Array<Wallet["addressType"]>;
  status: WalletRefreshStatus;
  error?: string;
  staleReason?: string;
  updatedAt?: string;
  totalUsd: number;
  tokenCount: number;
  topTokens: TopToken[];
  holdings: Holding[];
};

type RegroupWalletSummaryOptions<
  Wallet extends RegroupableWallet,
  Holding extends RegroupableHolding,
  TopToken
> = {
  groupKey: (wallet: Wallet) => string;
  groupLabel: (wallet: Wallet) => string;
  normalizeAddress: (address: string) => string;
  prepareHolding: (holding: Holding, wallet: Wallet) => Holding;
  summarizeTopTokens: (holdings: Holding[]) => TopToken[];
  walletTypeRank: (wallet: Pick<Wallet, "addressType">) => number;
};

function latestUpdatedAt(updatedAtValues: Array<string | undefined>) {
  return updatedAtValues
    .filter((value): value is string => Boolean(value))
    .sort((left, right) => Date.parse(right) - Date.parse(left))[0];
}

function combineRefreshState<Summary extends { status: WalletRefreshStatus; error?: string; staleReason?: string; updatedAt?: string }>(
  summaries: Summary[]
) {
  const errors = summaries.filter((summary) => summary.status === "error");
  const stale = summaries.filter((summary) => summary.status === "stale");
  const active = summaries.filter((summary) => walletRefreshHasAssetData(summary.status));
  const messages = [...errors, ...stale]
    .map((summary) => summary.error || summary.staleReason)
    .filter((message): message is string => Boolean(message));
  const updatedAt = latestUpdatedAt(summaries.map((summary) => summary.updatedAt));

  if (summaries.every((summary) => summary.status === "skipped")) {
    return { status: "skipped" as const, error: messages.join("；") || undefined, staleReason: undefined, updatedAt };
  }
  if (errors.length && !active.length) {
    return { status: "error" as const, error: messages.join("；") || undefined, staleReason: undefined, updatedAt };
  }
  if (errors.length || stale.length) {
    return {
      status: "stale" as const,
      error: undefined,
      staleReason: messages.length ? `部分地址未刷新：${messages.join("；")}` : undefined,
      updatedAt
    };
  }
  return { status: "ok" as const, error: undefined, staleReason: undefined, updatedAt };
}

export function regroupWalletSummaries<
  Wallet extends RegroupableWallet,
  Holding extends RegroupableHolding,
  TopToken,
  Summary extends RegroupableWalletSummary<Wallet, Holding, TopToken>
>(
  summaries: readonly Summary[],
  wallets: readonly Wallet[],
  options: RegroupWalletSummaryOptions<Wallet, Holding, TopToken>
): Summary[] {
  const walletsByAddress = new Map(
    wallets.map((wallet) => [options.normalizeAddress(wallet.address), wallet])
  );
  const buckets = new Map<
    string,
    { holdings: Holding[]; members: Map<string, Wallet>; summaries: Summary[] }
  >();

  function bucketFor(wallet: Wallet, summary: Summary) {
    const key = options.groupKey(wallet);
    const bucket = buckets.get(key) || { holdings: [], members: new Map<string, Wallet>(), summaries: [] };
    bucket.members.set(wallet.address, wallet);
    if (!bucket.summaries.includes(summary)) {
      bucket.summaries.push(summary);
    }
    buckets.set(key, bucket);
    return bucket;
  }

  for (const summary of summaries) {
    const sourceMembers = summary.wallets?.length ? summary.wallets : [summary.wallet];
    for (const sourceWallet of sourceMembers) {
      const wallet = walletsByAddress.get(options.normalizeAddress(sourceWallet.address));
      if (wallet) {
        bucketFor(wallet, summary);
      }
    }
    for (const holding of summary.holdings || []) {
      const wallet = walletsByAddress.get(options.normalizeAddress(holding.walletAddress));
      if (!wallet) {
        continue;
      }
      bucketFor(wallet, summary).holdings.push(options.prepareHolding(holding, wallet));
    }
  }

  return Array.from(buckets.entries()).flatMap(([groupKey, bucket]): Summary[] => {
    const members = Array.from(bucket.members.values()).sort(
      (left, right) => options.walletTypeRank(left) - options.walletTypeRank(right)
    );
    const primaryWallet = members.find((wallet) => wallet.addressType === "evm") || members[0];
    const baseSummary = bucket.summaries[0];
    if (!primaryWallet || !baseSummary) {
      return [];
    }

    const groupLabel = members.find((wallet) => wallet.groupLabel)?.groupLabel || options.groupLabel(primaryWallet);
    const wallet = { ...primaryWallet, label: groupLabel, groupId: groupKey, groupLabel };
    const refreshState = combineRefreshState(bucket.summaries);

    return [{
      ...baseSummary,
      ...refreshState,
      wallet,
      wallets: members,
      addressTypes: Array.from(new Set(members.map((member) => member.addressType))),
      totalUsd: bucket.holdings.reduce((sum, holding) => sum + holding.usdValue, 0),
      tokenCount: bucket.holdings.length,
      topTokens: options.summarizeTopTokens(bucket.holdings),
      holdings: bucket.holdings
    } as Summary];
  });
}
