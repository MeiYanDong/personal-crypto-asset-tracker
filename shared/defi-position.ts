import { stableAssetBreakdown } from "./asset-estimate.js";

export type DefiWalletIdentity = {
  id: string;
  label: string;
  address: string;
};

export type DefiPositionAsset = {
  symbol: string;
  iconUrl?: string;
  tokenAddress: string;
  balance: number;
  usdValue: number;
};

export type DefiPosition = {
  id: string;
  walletId: string;
  walletLabel: string;
  walletAddress: string;
  protocolId: string;
  protocolName: string;
  protocolLogo?: string;
  protocolUrl?: string;
  chainIndex: string;
  chainName: string;
  investmentId?: string;
  investmentKey?: string;
  name: string;
  type: string;
  totalUsd: number;
  assets: DefiPositionAsset[];
  tokenId?: string;
  status?: string;
  poolAddress?: string;
  range?: string;
};

export type DefiProtocolChain = {
  chainIndex: string;
  chainName: string;
  totalUsd: number;
  positionCount: number;
};

export type DefiProtocolOverview = {
  protocolId: string;
  protocolName: string;
  protocolLogo?: string;
  protocolUrl?: string;
  totalUsd: number;
  positionCount: number;
  chains: DefiProtocolChain[];
};

export type DefiProtocolPosition = DefiProtocolOverview & {
  id: string;
  walletId: string;
  walletLabel: string;
  walletAddress: string;
  positions: DefiPosition[];
};

export type DefiOverviewResult = {
  assetStatus?: number;
  updatedAt?: string;
  protocols: DefiProtocolOverview[];
};

type UnknownRecord = Record<string, unknown>;

function asRecord(value: unknown): UnknownRecord {
  return value && typeof value === "object" && !Array.isArray(value) ? value as UnknownRecord : {};
}

function records(value: unknown): UnknownRecord[] {
  return Array.isArray(value) ? value.map(asRecord) : [];
}

function finiteNumber(value: unknown) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : 0;
}

function textValue(value: unknown) {
  return typeof value === "string" || typeof value === "number" ? String(value).trim() : "";
}

function optionalText(value: unknown) {
  return textValue(value) || undefined;
}

function responseData(payload: unknown): unknown {
  const root = asRecord(payload);
  return Object.prototype.hasOwnProperty.call(root, "data") ? root.data : payload;
}

function timestampToIso(value: unknown) {
  const timestamp = finiteNumber(value);
  if (!timestamp) return undefined;
  const date = new Date(timestamp);
  return Number.isFinite(date.getTime()) ? date.toISOString() : undefined;
}

export function parseDefiOverview(payload: unknown): DefiOverviewResult {
  const data = asRecord(responseData(payload));
  const protocolMap = new Map<string, DefiProtocolOverview>();

  for (const walletEntry of records(data.walletIdPlatformList)) {
    for (const platform of records(walletEntry.platformList)) {
      const protocolName = textValue(platform.platformName) || "未知协议";
      const protocolId = textValue(platform.analysisPlatformId) || protocolName.toLowerCase();
      const key = `${protocolId}:${protocolName.toLowerCase()}`;
      const networkMap = new Map<string, DefiProtocolChain>();

      for (const network of records(platform.networkBalanceList)) {
        const chainIndex = textValue(network.chainIndex);
        const chainName = textValue(network.network) || chainIndex || "未知链";
        const chainKey = chainIndex || chainName.toLowerCase();
        const current = networkMap.get(chainKey) || {
          chainIndex,
          chainName,
          totalUsd: 0,
          positionCount: 0
        };
        current.totalUsd += finiteNumber(network.currencyAmount);
        current.positionCount += Math.max(0, Math.floor(finiteNumber(network.investmentCount)));
        networkMap.set(chainKey, current);
      }

      const chains = Array.from(networkMap.values()).sort((left, right) => right.totalUsd - left.totalUsd);
      const directTotal = finiteNumber(platform.currencyAmount);
      const overview = protocolMap.get(key) || {
        protocolId,
        protocolName,
        protocolLogo: optionalText(platform.platformLogo),
        protocolUrl: optionalText(platform.platformUrl),
        totalUsd: 0,
        positionCount: 0,
        chains: []
      };
      overview.protocolLogo ||= optionalText(platform.platformLogo);
      overview.protocolUrl ||= optionalText(platform.platformUrl);
      overview.totalUsd += directTotal || chains.reduce((sum, chain) => sum + chain.totalUsd, 0);
      overview.positionCount += Math.max(
        0,
        Math.floor(finiteNumber(platform.investmentCount)) || chains.reduce((sum, chain) => sum + chain.positionCount, 0)
      );
      overview.chains = [...overview.chains, ...chains];
      protocolMap.set(key, overview);
    }
  }

  return {
    assetStatus: Number.isFinite(Number(data.assetStatus)) ? Number(data.assetStatus) : undefined,
    updatedAt: timestampToIso(data.updateAt),
    protocols: Array.from(protocolMap.values())
      .filter((protocol) => protocol.totalUsd !== 0 || protocol.positionCount > 0)
      .sort((left, right) => right.totalUsd - left.totalUsd)
  };
}

function parsePositionAssets(value: unknown): DefiPositionAsset[] {
  return records(value).flatMap((asset) => {
    const symbol = textValue(asset.tokenSymbol) || textValue(asset.symbol);
    const balance = finiteNumber(asset.coinAmount ?? asset.balance);
    const usdValue = finiteNumber(asset.currencyAmount ?? asset.usdValue);
    if (!symbol || balance === 0 && usdValue === 0) return [];
    return [{
      symbol,
      iconUrl: optionalText(asset.tokenLogo ?? asset.iconUrl),
      tokenAddress: textValue(asset.tokenAddress),
      balance,
      usdValue
    }];
  });
}

const defiTypeNames: Record<string, string> = {
  "1": "存币",
  "2": "流动性池",
  "3": "Farm",
  "4": "Vault",
  "5": "质押",
  "6": "借贷",
  "7": "质押",
  "8": "锁仓",
  "9": "存款",
  "10": "解锁中"
};

function investmentType(investment: UnknownRecord) {
  return textValue(investment.investName) || defiTypeNames[textValue(investment.investType)] || "DeFi 仓位";
}

export function parseDefiPositionDetails(
  payload: unknown,
  wallet: DefiWalletIdentity,
  overviews: readonly DefiProtocolOverview[]
): DefiPosition[] {
  const data = responseData(payload);
  const roots = Array.isArray(data) ? records(data) : [asRecord(data)];
  const positions: DefiPosition[] = [];
  const seen = new Set<string>();

  for (const root of roots) {
    const rootProtocolId = textValue(root.analysisPlatformId);
    const rootProtocolName = textValue(root.platformName);
    const overview = overviews.find((candidate) =>
      rootProtocolId && candidate.protocolId === rootProtocolId ||
      rootProtocolName && candidate.protocolName.toLowerCase() === rootProtocolName.toLowerCase()
    );
    const protocolId = rootProtocolId || overview?.protocolId || rootProtocolName.toLowerCase();
    const protocolName = rootProtocolName || overview?.protocolName || "未知协议";
    const protocolLogo = optionalText(root.platformLogo) || overview?.protocolLogo;
    const protocolUrl = optionalText(root.platformUrl) || overview?.protocolUrl;

    for (const walletDetail of records(root.walletIdPlatformDetailList)) {
      for (const network of records(walletDetail.networkHoldVoList)) {
        const chainIndex = textValue(network.chainIndex);
        const chainName = textValue(network.network) ||
          overview?.chains.find((chain) => chain.chainIndex === chainIndex)?.chainName ||
          chainIndex ||
          "未知链";

        for (const [investmentIndex, investment] of records(network.investTokenBalanceVoList).entries()) {
          const nestedPositions = [
            ...records(investment.positionList),
            ...records(investment.nonPoolPositionList)
          ];
          const candidates: Array<UnknownRecord | null> = nestedPositions.length ? nestedPositions : [null];

          for (const [positionIndex, position] of candidates.entries()) {
            const assets = parsePositionAssets(position?.assetsTokenList ?? investment.assetsTokenList);
            const investmentId = optionalText(investment.investmentId);
            const investmentKey = optionalText(investment.investmentKey ?? investment.specialPositionAssetKey);
            const tokenId = optionalText(position?.tokenId);
            const totalValue = finiteNumber(position?.totalValue ?? investment.totalValue) ||
              assets.reduce((sum, asset) => sum + asset.usdValue, 0);
            const name = textValue(position?.positionName) || textValue(investment.investmentName) ||
              assets.map((asset) => asset.symbol).join(" / ") || protocolName;
            const identity = [
              wallet.address.toLowerCase(),
              protocolId,
              chainIndex,
              investmentKey || investmentId || investmentIndex,
              tokenId || positionIndex
            ].join(":");
            if (seen.has(identity)) continue;
            seen.add(identity);
            positions.push({
              id: identity,
              walletId: wallet.id,
              walletLabel: wallet.label,
              walletAddress: wallet.address,
              protocolId,
              protocolName,
              protocolLogo,
              protocolUrl,
              chainIndex,
              chainName,
              investmentId,
              investmentKey,
              name,
              type: investmentType(investment),
              totalUsd: totalValue,
              assets,
              tokenId,
              status: optionalText(position?.positionStatus),
              poolAddress: optionalText(position?.poolAddress ?? investment.poolAddress),
              range: optionalText(position?.range)
            });
          }
        }

        for (const [marketIndex, market] of records(network.investMarketTokenBalanceVoList).entries()) {
          const assetMap = asRecord(market.assetMap);
          const marketAssets = Object.values(assetMap).flatMap((value) =>
            Array.isArray(value) ? records(value) : [asRecord(value)]
          );
          const assets = marketAssets.flatMap((asset) => [
            ...parsePositionAssets(asset.assetsTokenList),
            ...parsePositionAssets(asset.borrowTokenList)
          ]);
          const marketId = optionalText(market.marketId);
          const totalValue = finiteNumber(market.totalValue) || assets.reduce((sum, asset) => sum + asset.usdValue, 0);
          const name = marketAssets
            .map((asset) => textValue(asset.investmentName))
            .filter(Boolean)
            .join(" / ") || (marketId ? `借贷市场 ${marketId}` : "借贷市场");
          const identity = [
            wallet.address.toLowerCase(),
            protocolId,
            chainIndex,
            "market",
            marketId || marketIndex
          ].join(":");
          if (seen.has(identity)) continue;
          seen.add(identity);
          positions.push({
            id: identity,
            walletId: wallet.id,
            walletLabel: wallet.label,
            walletAddress: wallet.address,
            protocolId,
            protocolName,
            protocolLogo,
            protocolUrl,
            chainIndex,
            chainName,
            investmentKey: marketId ? `market:${marketId}` : undefined,
            name,
            type: "借贷",
            totalUsd: totalValue,
            assets,
            status: optionalText(asRecord(market.healthRate).status)
          });
        }
      }
    }
  }

  return positions.sort((left, right) => right.totalUsd - left.totalUsd);
}

export function buildDefiProtocols(
  wallet: DefiWalletIdentity,
  overviews: readonly DefiProtocolOverview[],
  positions: readonly DefiPosition[]
): DefiProtocolPosition[] {
  return overviews.map((overview) => {
    const protocolPositions = positions.filter((position) =>
      position.protocolId === overview.protocolId ||
      position.protocolName.toLowerCase() === overview.protocolName.toLowerCase()
    );
    return {
      ...overview,
      id: `${wallet.address.toLowerCase()}:${overview.protocolId}`,
      walletId: wallet.id,
      walletLabel: wallet.label,
      walletAddress: wallet.address,
      positionCount: Math.max(overview.positionCount, protocolPositions.length),
      positions: protocolPositions
    };
  });
}

export function defiProtocolTotalUsd(protocols: readonly DefiProtocolPosition[]) {
  return protocols.reduce((sum, protocol) => sum + finiteNumber(protocol.totalUsd), 0);
}

export function defiStableAssetBreakdown(protocols: readonly DefiProtocolPosition[]) {
  return protocols.reduce((totals, protocol) => {
    const protocolBreakdown = protocol.positions.reduce((positionTotals, position) => {
      if (/borrow|debt|liability|借贷|负债/i.test(position.type)) {
        return positionTotals;
      }
      const breakdown = stableAssetBreakdown(position.assets.map((asset) => ({
        symbol: asset.symbol,
        totalUsd: asset.usdValue,
        totalBalance: asset.balance,
        riskCount: 0
      })));
      const positionCap = Math.max(0, finiteNumber(position.totalUsd));
      const stableAssetUsd = Math.min(positionCap, breakdown.stableAssetUsd);
      const stablecoinUsd = Math.min(stableAssetUsd, breakdown.stablecoinUsd);
      return {
        stableAssetUsd: positionTotals.stableAssetUsd + stableAssetUsd,
        stablecoinUsd: positionTotals.stablecoinUsd + stablecoinUsd
      };
    }, { stableAssetUsd: 0, stablecoinUsd: 0 });
    const protocolCap = Math.max(0, finiteNumber(protocol.totalUsd));
    const scale = protocolBreakdown.stableAssetUsd > protocolCap && protocolBreakdown.stableAssetUsd > 0
      ? protocolCap / protocolBreakdown.stableAssetUsd
      : 1;
    return {
      stableAssetUsd: totals.stableAssetUsd + protocolBreakdown.stableAssetUsd * scale,
      stablecoinUsd: totals.stablecoinUsd + protocolBreakdown.stablecoinUsd * scale
    };
  }, { stableAssetUsd: 0, stablecoinUsd: 0 });
}

export function defiReceiptTokenAddresses(protocols: readonly DefiProtocolPosition[]) {
  return new Set(
    protocols.flatMap((protocol) => protocol.positions)
      .filter((position) => /pool|liquidity|流动性/i.test(position.type))
      .map((position) => position.poolAddress?.trim().toLowerCase())
      .filter((address): address is string => Boolean(address))
  );
}
