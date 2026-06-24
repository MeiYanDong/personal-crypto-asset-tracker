# 个人资产追踪

本地加密资产追踪工作台。它保存一组钱包地址，调用 OKX Onchain OS CLI 查询多链资产，并按两个维度汇总：

- 不分钱包：按币种汇总金额
- 按钱包：每个钱包的总金额和主要持仓

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
- `data/snapshot.json`：最近一次刷新结果，已加入 `.gitignore`，避免把资产快照提交出去。

## 默认链

页面默认查询 `ethereum`、`solana`、`base`、`bsc`、`arbitrum`、`polygon`、`optimism`、`avalanche`、`xlayer`。

EVM 地址只查询 EVM 链；Solana 地址只查询 `solana`。如果要统计 SOL 链资产，需要把 Solana base58 地址也添加到钱包列表里，不能用 `0x...` 地址代替。

Token 符号、价格和风险标记来自 OKX balance API。高价值持仓应核对合约地址和价格来源。

## 部署到 Vercel

这个项目支持 Vercel 部署，但云端刷新不能使用本机 `onchainos` 登录态。部署后 `/api/refresh`
会通过 OKX Onchain OS Balance API 查询资产，需要在 Vercel 项目环境变量里配置：

```bash
OKX_API_KEY=你的 OKX API key
OKX_SECRET_KEY=你的 OKX secret key
OKX_API_PASSPHRASE=你的 API passphrase
OKX_PROJECT_ID=你的 OKX project id # 可选，但建议配置
ASSET_TRACKER_TOKEN=网页访问口令 # 建议配置，避免公开暴露资产数据
```

本地不配置这些变量时仍走原来的 `onchainos` CLI；如果想本地强制测试 OKX HTTP API，可设置：

```bash
ASSET_TRACKER_REFRESH_PROVIDER=okx-api
```

Vercel Functions 的文件系统不是持久写入环境。当前部署版会从 `data/wallets.json`
读取初始钱包列表；页面里的新增、删除和改名会保存到当前浏览器的 `localStorage`，刷新资产时会把本浏览器的钱包列表
传给 `/api/refresh` 查询。刷新后的快照也会写入当前浏览器的 `localStorage`，页面重新加载时会优先使用本浏览器里时间
更新的快照；同一函数实例内也会保留一份内存快照。如需跨浏览器、跨设备或多人共享同一份长期钱包列表和快照，需要再
接入 Vercel Blob、Postgres 或其他数据库。
