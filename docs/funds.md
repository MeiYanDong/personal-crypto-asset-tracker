# 全部资金

`/funds` 在原站点内合并个人钱包和服务器钱包。原来的 `/`、`/wallets`、配对、手动资产组、访问口令和五分钟锁屏保持原行为。

## 统计口径

- 资产按链 ID、地址和代币合约去重。EVM 地址不区分大小写，Solana 区分大小写。币种名称不能作为去重键。
- 同一地址可同时来自个人清单与服务器。服务器登记的项目归属优先用于资金视图，原个人分组配置不变。服务器表示部署位置，不代表另一份资产。跨服务器迁移或备份不会新增余额。
- 使用最新成功观测；失败不清零。余额保留最小单位整数字符串，合计使用 BigInt，展示美元时才转换为浮点数。价格来自现有个人资产快照中相同链、相同合约的报价，不根据符号跨链套价。
- 已计价总额仅合计有报价的余额和个人 DeFi 净值。MM 与风险标记资产单列为参考估值；无报价展示数量，不按零价值处理。旧价格、旧余额及未覆盖范围独立提示。
- 保守估值沿用现有政策：符合原规则的稳定币与 SPY 全额，其余八折。既有 DeFi 净值及 LP 凭证排重逻辑继续使用。未扫描服务器 DeFi、未登记币种和未连通服务器不表示无资产。
- 这是资产快照，不是盈亏账本。转入、转出、新增扫描范围、价格变化都能改变金额。

## 最小运行结构

继续使用 React/Vite、现有 Express API 和私有 Vercel Blob。没有新数据库、队列、前端框架或运行时依赖。资金页按路由延迟加载，地址接口每页最多 50 行，主页面不下载数千行余额。

- 云端 `observer.py`：Python 标准库、只读 RPC，原生币及登记代币约每 15 分钟采集一次；个人资产及 DeFi 约每小时调用原刷新管线。每分钟检查待刷新请求，执行期间由 OS 文件锁防重入。部分链失败保留上次成功快照。
- Mac `discover.py`：约每小时复用现有 AWS CLI、阿里云 SWAS CLI、SSH 配置读取实例和公开钱包清单。上传公开地址与覆盖信息。云端没有 AWS root 凭证或 SSH 私钥。本机离线不影响已登记余额采集，但新资源发现延后。
- 访问令牌经 HMAC 派生独立采集凭证，只能操作资金采集端点，不能修改个人钱包配置或读取网页口令。资金 API 仍受原访问口令保护，响应禁止公共缓存。
- 新服务器会出现在已接入云账户的实例清单；首次 SSH 入口或新云账户需一次接入。停止、失联或缺失清单均保留已知地址，并展示缺口。不会启动服务器或交易服务。

## 新项目 / 新钱包自动登记

网页新增的个人钱包会直接纳入下一轮个人刷新。执行池新增钱包会从当前项目的 `senders-public.json`、`fleet-public.json` 等公开清单发现。

新项目推荐保存 `/var/lib/<项目>/funds-public.json`，由项目部署维护公开地址清单。这个文件不含密钥，且只列本人的账户或已确认控制的合约：

```json
{
  "version": 1,
  "project": "example-project",
  "chainId": 4663,
  "accounts": [
    { "address": "0x1111111111111111111111111111111111111111", "owned": true, "role": "owner", "kind": "wallet" }
  ],
  "assets": []
}
```

每个代币的 `assets` 条目包含 `chainId`、`address`、`symbol`、`decimals`；不确定估值可加 `valuation: "reference"`。执行池使用 `role: "sender"`，受控执行合约使用 `role: "custody", kind: "executor"`。合约必须确认归属，不登记协议池或竞争对手地址。新链没有只读适配器时提示待接入，不伪造成功。

只读扫描范围为 `/var/lib` 与 `/opt` 中限定深度的明确公开文件名；不读 `.env`、钱包文件、私钥、助记词、交易账本或签名交易。未知项目缺链 ID 时不猜链。新增公开清单无需改前端。

## 运行与回退

云端服务：`asset-funds-observer.service` / `.timer`；代码 `/opt/asset-funds-observer/observer.py`，专用用户 `asset-funds-observer`；配置 `/etc/asset-funds-observer/worker.env` 为 0600；状态 `/var/lib/asset-funds-observer` 为 0700。

部署目标为已有 Robinhood Radar 主机，先核对 hostname 与共存服务。此辅助服务不产生收益，采用 `Nice=15`、`CPUWeight=10`、`CPUQuota=20%`、`MemoryMax=96M`；一分钟 timer 仅检查计划，完整采集到期才运行。以低优先级限制资源占用，保留既有服务的资源。共享机探测时约 166 MiB 可用内存，故选择短时 oneshot，不驻留新 Web 服务。采集后复核峰值内存、耗时与共存服务。

Mac 配置为 `~/.config/personal-asset-tracker/discovery.json` 与 `worker.env`；launchd 标签为 `com.myandong.asset-funds-discovery`，只读复用现有入口。日志仅记录计数与错误类别，不记录凭证。

回退：停止本项目 timer；卸载本机上述 launchd 任务；将站点恢复升级前 Git 版本。新文件均以 `asset-tracker/funds-` 为前缀，既有钱包与分组配置无需回退。个人后台刷新只更新原资产快照，与手动刷新口径一致。

验证：`npm run build` 包含原回归检查和 `check:funds`，覆盖重复来源、精确整数、未知值、汇总一致性、保守估值和后台权限；另做真实桌面、手机、搜索、分页和地址展开验收。构建目标 ES2022，保留第三方许可证注释，继续使用原有体积预算。
