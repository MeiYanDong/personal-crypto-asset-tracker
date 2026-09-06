import assert from "node:assert/strict";
import {
  buildDefiProtocols,
  defiProtocolTotalUsd,
  defiReceiptTokenAddresses,
  parseDefiOverview,
  parseDefiPositionDetails
} from "../shared/defi-position.js";
import { calculateConservativeEstimate } from "../shared/asset-estimate.js";

const wallet = {
  id: "wallet-1",
  label: "钱包 1",
  address: "0x1234567890123456789012345678901234567890"
};

const overviewPayload = {
  code: "0",
  data: {
    assetStatus: 1,
    updateAt: 1774429492000,
    walletIdPlatformList: [{
      platformList: [{
        platformName: "Uniswap V3",
        analysisPlatformId: "44",
        platformLogo: "https://example.com/uniswap.png",
        platformUrl: "https://app.uniswap.org",
        currencyAmount: "120.50",
        investmentCount: 1,
        networkBalanceList: [{
          network: "Ethereum",
          chainIndex: "1",
          currencyAmount: "120.50",
          investmentCount: 1
        }]
      }]
    }]
  }
};

const overview = parseDefiOverview(overviewPayload);
assert.equal(overview.assetStatus, 1);
assert.equal(overview.protocols.length, 1);
assert.equal(overview.protocols[0].protocolName, "Uniswap V3");
assert.equal(overview.protocols[0].totalUsd, 120.5);
assert.equal(overview.protocols[0].chains[0].chainIndex, "1");

const detailPayload = {
  ok: true,
  data: [{
    platformName: "Uniswap V3",
    analysisPlatformId: "44",
    walletIdPlatformDetailList: [{
      networkHoldVoList: [{
        network: "Ethereum",
        chainIndex: "1",
        investTokenBalanceVoList: [{
          investmentName: "ETH / USDC",
          investmentId: "15299",
          investmentKey: "uniswap-v3-position",
          investType: 2,
          investName: "Pool",
          poolAddress: "0xabcdefabcdefabcdefabcdefabcdefabcdefabcd",
          positionList: [{
            tokenId: "93828",
            positionName: "ETH / USDC 0.3%",
            positionStatus: "ACTIVE",
            range: "1800 - 3200 USDC per ETH",
            totalValue: "120.50",
            assetsTokenList: [
              { tokenSymbol: "ETH", tokenAddress: "0xeeee", coinAmount: "0.02", currencyAmount: "60.25" },
              { tokenSymbol: "USDC", tokenAddress: "0xa0b8", coinAmount: "60.25", currencyAmount: "60.25" }
            ]
          }]
        }]
      }]
    }]
  }]
};

const positions = parseDefiPositionDetails(detailPayload, wallet, overview.protocols);
assert.equal(positions.length, 1);
assert.equal(positions[0].tokenId, "93828");
assert.equal(positions[0].range, "1800 - 3200 USDC per ETH");
assert.deepEqual(positions[0].assets.map((asset) => asset.symbol), ["ETH", "USDC"]);

const protocols = buildDefiProtocols(wallet, overview.protocols, positions);
assert.equal(defiProtocolTotalUsd(protocols), 120.5);
assert.equal(defiReceiptTokenAddresses(protocols).has("0xabcdefabcdefabcdefabcdefabcdefabcdefabcd"), true);

const estimate = calculateConservativeEstimate([
  { symbol: "USDC", totalUsd: 100, totalBalance: 100, riskCount: 0 },
  { symbol: "ETH", totalUsd: 50, totalBalance: 0.02, riskCount: 0 }
], 120.5);
assert.equal(estimate.stablecoinUsd, 100);
assert.equal(estimate.volatileAssetUsd, 170.5);
assert.equal(estimate.conservativeTotalUsd, 236.4);

const estimateWithLiability = calculateConservativeEstimate([
  { symbol: "USDC", totalUsd: 100, totalBalance: 100, riskCount: 0 },
  { symbol: "ETH", totalUsd: 50, totalBalance: 0.02, riskCount: 0 }
], -20);
assert.equal(estimateWithLiability.volatileAssetUsd, 30);
assert.equal(estimateWithLiability.conservativeTotalUsd, 124);

console.log("DeFi position contract checks passed.");
