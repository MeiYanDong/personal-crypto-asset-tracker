export const INDEPENDENT_WALLET_GROUP_VALUE = "__new__";

export type PairableWallet = {
  id: string;
  label: string;
  address: string;
  addressType: "evm" | "solana";
  groupId?: string;
  groupLabel?: string;
};

export type WalletPairingTransition<T extends PairableWallet> = {
  assignments: Record<string, string>;
  changed: boolean;
  destinationGroupKey?: string;
  sourceGroupKey?: string;
  wallets: T[];
};

type PairingGroup<T extends PairableWallet> = {
  key: string;
  label: string;
  wallets: T[];
};

export function pairingGroupKey(wallet: PairableWallet) {
  return wallet.groupId || wallet.id || wallet.address;
}

function pairingGroupLabel(wallet: PairableWallet) {
  return wallet.groupLabel || wallet.label;
}

function standaloneGroupLabel(wallet: PairableWallet) {
  return wallet.label;
}

function pairedGroupLabel(group: PairingGroup<PairableWallet>) {
  return group.label.replace(/^独立[：:]\s*/, "") || group.wallets[0]?.label || "钱包";
}

function pairingGroups<T extends PairableWallet>(wallets: readonly T[]) {
  const groups = new Map<string, PairingGroup<T>>();
  for (const wallet of wallets) {
    const key = pairingGroupKey(wallet);
    const group = groups.get(key) || { key, label: pairingGroupLabel(wallet), wallets: [] };
    group.wallets.push(wallet);
    group.label = pairingGroupLabel(wallet) || group.label;
    groups.set(key, group);
  }
  return groups;
}

export function canDetachWalletFromPair(wallet: PairableWallet, wallets: readonly PairableWallet[]) {
  return (pairingGroups(wallets).get(pairingGroupKey(wallet))?.wallets.length || 0) > 1;
}

export function reassignWalletPairing<T extends PairableWallet>(
  wallets: readonly T[],
  address: string,
  nextGroupKey: string,
  assignments: Readonly<Record<string, string>>
): WalletPairingTransition<T> {
  const wallet = wallets.find((item) => item.address === address);
  if (!wallet) {
    return { assignments: { ...assignments }, changed: false, wallets: [...wallets] };
  }

  const groups = pairingGroups(wallets);
  const sourceGroupKey = pairingGroupKey(wallet);
  const sourceGroup = groups.get(sourceGroupKey);
  const detach = nextGroupKey === INDEPENDENT_WALLET_GROUP_VALUE;
  const destinationGroup = detach ? undefined : groups.get(nextGroupKey);

  if (
    !sourceGroup ||
    (!detach && (!destinationGroup || destinationGroup.key === sourceGroupKey)) ||
    (detach && sourceGroup.wallets.length <= 1) ||
    destinationGroup?.wallets.some((item) => item.addressType === wallet.addressType)
  ) {
    return { assignments: { ...assignments }, changed: false, wallets: [...wallets] };
  }

  const sourceMembers = sourceGroup.wallets.filter((item) => item.address !== wallet.address);
  const sourcePrimaryWallet = sourceGroup.wallets.find((item) => item.addressType === "evm") || sourceGroup.wallets[0];
  const sourceLabel = pairedGroupLabel(sourceGroup);
  const sourceRetainsLabel = sourceMembers.some((item) => item.address === sourcePrimaryWallet.address);
  const sourceResult = sourceMembers.length
    ? {
        key: sourceMembers.length === 1 ? sourceMembers[0].id : sourceGroupKey,
        label: sourceRetainsLabel ? sourceLabel : standaloneGroupLabel(sourceMembers[0])
      }
    : undefined;
  const destinationMembers = [wallet, ...(destinationGroup?.wallets || [])];
  const pairedPrimaryWallet = destinationMembers.find((item) => item.addressType === "evm") || destinationMembers[0];
  const pairedPrimaryGroup = groups.get(pairingGroupKey(pairedPrimaryWallet));
  const destinationResult = detach
    ? {
        key: wallet.id,
        label: wallet.address === sourcePrimaryWallet.address ? sourceLabel : standaloneGroupLabel(wallet)
      }
    : {
        key: destinationGroup!.key,
        label: pairedGroupLabel(pairedPrimaryGroup || destinationGroup!)
      };
  const destinationAddresses = new Set([
    wallet.address,
    ...(destinationGroup?.wallets.map((item) => item.address) || [])
  ]);
  const sourceAddresses = new Set(sourceMembers.map((item) => item.address));

  const nextWallets = wallets.map((item) => {
    if (destinationAddresses.has(item.address)) {
      return { ...item, groupId: destinationResult.key, groupLabel: destinationResult.label };
    }
    if (sourceResult && sourceAddresses.has(item.address)) {
      return { ...item, groupId: sourceResult.key, groupLabel: sourceResult.label };
    }
    return item;
  });

  const sourceAssignment = assignments[sourceGroupKey];
  const destinationAssignment = detach
    ? sourceAssignment
    : assignments[destinationGroup!.key] || sourceAssignment;
  const assignmentOverrides = new Map<string, string | undefined>();
  assignmentOverrides.set(destinationResult.key, destinationAssignment);
  if (sourceResult) {
    assignmentOverrides.set(sourceResult.key, sourceAssignment);
  }

  const resultingGroupKeys = new Set(nextWallets.map(pairingGroupKey));
  const nextAssignments = Object.fromEntries(
    Array.from(resultingGroupKeys).flatMap((groupKey) => {
      const assignment = assignmentOverrides.has(groupKey)
        ? assignmentOverrides.get(groupKey)
        : assignments[groupKey];
      return assignment ? [[groupKey, assignment]] : [];
    })
  );

  return {
    assignments: nextAssignments,
    changed: true,
    destinationGroupKey: destinationResult.key,
    sourceGroupKey: sourceResult?.key,
    wallets: nextWallets
  };
}
