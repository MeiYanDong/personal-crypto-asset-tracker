# 个人资产追踪

本地加密资产追踪工作台。它保存一组钱包地址，调用 OKX Onchain OS CLI 查询多链资产，并按三个维度汇总：

- 按资产组：统计 OKX Boost、42 Space、Virtuals、Robinhood 或自定义资产组
- 不分钱包：按币种汇总金额
- 按钱包：每个钱包的总金额和主要持仓

资产展示位于 `/`，钱包地址、EVM/SOL 配对、批量导入和资产组归类位于 `/wallets`。

## 使用

```bash
npm install
npm run dev
```

打开 `http://127.0.0.1:5173`。

如果刷新资产时提示登录过期，先执行：

```bash
onchainos wallet login
```

登录后回到页面重新刷新即可。

如果某个钱包本轮遇到限流或短暂失败，页面会沿用这个钱包上一次成功刷新的持仓，并标记为“旧数据”。这样总金额和 token 数量不会因为失败钱包被当成 0 而跳变。

## 数据文件

- `data/wallets.json`：钱包地址和标签，可通过页面添加、改名、删除。
- `data/portfolio-state.json`：本地运行时的钱包、资产组及归属配置，已加入 `.gitignore`。
- `data/snapshot.json`：最近一次刷新结果，已加入 `.gitignore`，避免把资产快照提交出去。

## 默认链

页面默认查询 `ethereum`、`solana`、`base`、`robinhood`、`bsc`、`arbitrum`、`polygon`、`optimism`、`avalanche`、`xlayer`。

EVM 地址只查询 EVM 链；Solana 地址只查询 `solana`。如果要统计 SOL 链资产，需要把 Solana base58 地址也添加到钱包列表里，不能用 `0x...` 地址代替。

Robinhood Chain 使用同一组 EVM 地址，主网 Chain ID 为 `4663`，原生 Gas 资产为 `ETH`。刷新时会通过 OKX Onchain OS Balance API 与其他 EVM 链一起扫描，无需单独添加 Robinhood 地址。

Token 符号、价格和风险标记来自 OKX balance API。高价值持仓应核对合约地址和价格来源。

## 保守资产估值

页面同时计算一项保守资产估值：

```text
保守资产估值 = 稳定币市值 + (总资产市值 - 稳定币市值) × 0.8
```

稳定币部分保留 100%，其余波动资产按 80% 计入。当前识别 USDT、USDC、USDT0、USDG、DAI、USDS、FDUSD、PYUSD、USDP、TUSD、BUSD、GUSD 及常见 USDC/USDT 跨链版本；只有价格处于 `$0.90–$1.10` 且未被标记为风险 token 时才按稳定币处理。该计算使用完整资产快照，包含页面省略显示的 `<$1` 小额持仓。

## 部署到 Vercel

这个项目支持 Vercel 部署，但云端刷新不能使用本机 `onchainos` 登录态。部署后 `/api/refresh`
会通过 OKX Onchain OS Balance API 查询资产，需要在 Vercel 项目环境变量里配置：

```bash
OKX_API_KEY=你的 OKX API key
OKX_SECRET_KEY=你的 OKX secret key
OKX_API_PASSPHRASE=你的 API passphrase
OKX_PROJECT_ID=你的 OKX project id # 可选，但建议配置
ASSET_TRACKER_TOKEN=网页访问口令 # 建议配置，避免公开暴露资产数据
BLOB_READ_WRITE_TOKEN=Vercel Blob 读写口令 # 连接 Blob 后由 Vercel 自动配置
```

本地不配置这些变量时仍走原来的 `onchainos` CLI；如果想本地强制测试 OKX HTTP API，可设置：

```bash
ASSET_TRACKER_REFRESH_PROVIDER=okx-api
```

Vercel Functions 的文件系统不是持久写入环境，因此部署版使用私有 Vercel Blob 保存钱包、资产组、归属配置和最近快照。
浏览器仍保留一份本地缓存；升级前保存在 `asset-tracker-wallets-v1` 的旧钱包会在首次打开新版页面时合并到云端状态，
避免丢失只存在于原浏览器的钱包。删除资产组不会删除钱包，组内钱包会自动移到“未分类”。
