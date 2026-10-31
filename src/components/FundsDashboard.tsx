import { useEffect, useState } from "react";
import { ArrowLeft, ArrowUpRight, Coins, FolderKanban, RefreshCw, Server, WalletCards } from "lucide-react";
import type { FundFact, FundRow, FundsView } from "../../shared/funds";
import { Button } from "./ui/Button";
import { Badge } from "./ui/Badge";
import { SearchField } from "./ui/FormControls";
import { Notice, EmptyState } from "./ui/Feedback";
import { CurrencyValue } from "./ui/CurrencyValue";
import { QuantityValue } from "./ui/QuantityValue";
import { CountValue } from "./ui/CountValue";
import { TimeValue } from "./ui/TimeValue";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "./ui/Tabs";
import { Table, TableHeader, TableBody, TableHead, TableRow, TableCell } from "./ui/Table";
import { Pagination } from "./ui/Pagination";
import { CopyButton } from "./ui/CopyButton";
import "./funds.css";

type Dimension = "project" | "host" | "asset" | "address";
type Request = <T>(path: string, options?: RequestInit) => Promise<T>;
const tabs = [{ value: "project", label: "项目", icon: <FolderKanban /> }, { value: "host", label: "服务器", icon: <Server /> }, { value: "asset", label: "资产", icon: <Coins /> }, { value: "address", label: "地址", icon: <WalletCards /> }] as const;

export default function FundsDashboard({ request, reloadKey }: { request: Request; reloadKey: number }) {
  const [view, setView] = useState<FundsView | null>(null);
  const [dimension, setDimension] = useState<Dimension>("project");
  const [query, setQuery] = useState("");
  const [page, setPage] = useState(1);
  const [drill, setDrill] = useState<{ dimension: string; id: string; label: string } | null>(null);
  const [addressRows, setAddressRows] = useState<{ rows: FundRow[]; total: number }>({ rows: [], total: 0 });
  const [detail, setDetail] = useState<{ label: string; facts: FundFact[] } | null>(null);
  const [error, setError] = useState("");
  const [queued, setQueued] = useState(false);
  const [loading, setLoading] = useState(false);
  const [tick, setTick] = useState(0);
  useEffect(() => {
    let alive = true;
    const load = async () => { try { const next = await request<FundsView>("/api/funds"); if (alive) { setView(next); setError(""); } } catch (e) { if (alive) setError((e as Error).message); } };
    void load(); const timer = window.setInterval(() => { void load(); setTick(t => t + 1); }, 60_000);
    return () => { alive = false; clearInterval(timer); };
  }, [request, reloadKey]);
  useEffect(() => {
    if (dimension !== "address" && !drill) return;
    let alive = true;
    const timer = window.setTimeout(async () => {
      setLoading(true);
      try {
        const params = new URLSearchParams({ q: query, page: String(page), group: drill?.id || "", dimension: drill?.dimension || "" });
        const next = await request<{ rows: FundRow[]; total: number }>(`/api/funds/addresses?${params}`);
        if (alive) setAddressRows(next);
      } catch (e) { if (alive) setError((e as Error).message); }
      finally { if (alive) setLoading(false); }
    }, 180);
    return () => { alive = false; clearTimeout(timer); };
  }, [dimension, drill, query, page, tick, request]);
  async function refresh() {
    try { await request("/api/funds/refresh", { method: "POST" }); setQueued(true); setError(""); }
    catch (e) { setError((e as Error).message); }
  }
  async function open(row: FundRow) {
    if (dimension === "address" || drill) {
      try { setDetail({ label: row.label, facts: await request<FundFact[]>(`/api/funds/account?id=${encodeURIComponent(row.id)}`) }); }
      catch (e) { setError((e as Error).message); }
    } else { setDrill({ dimension, id: row.id, label: row.label }); setPage(1); setQuery(""); }
  }
  if (!view) return error ? <Notice title="资金总览暂时无法载入" tone="warning">{error}</Notice> : <EmptyState variant="loading" description="正在载入已保存的资金快照" />;
  const isAddresses = dimension === "address" || Boolean(drill);
  const showQuantity = dimension === "asset";
  const grouped = dimension === "address" ? [] : view.groups[dimension].filter(r => `${r.label} ${r.subtitle}`.toLowerCase().includes(query.toLowerCase()));
  const total = isAddresses ? addressRows.total : grouped.length;
  const rows = isAddresses ? addressRows.rows : grouped.slice((page - 1) * 50, page * 50);
  return <section className="funds-page">
    <div className="funds-heading">
      <div><h2 className="sr-only">全部资金</h2><p>个人钱包与服务器钱包 · 去重汇总</p></div>
      <Button variant="secondary" onClick={() => void refresh()}><RefreshCw size={16} />刷新资金</Button>
    </div>
    <div className="funds-summary">
      <div className="funds-primary"><span>已计价资产</span><strong><CurrencyValue value={view.totalUsd} /></strong><small>含 DeFi 净值 <CurrencyValue value={view.defiUsd} /> · 部分覆盖</small></div>
      <div><span>保守估值</span><strong><CurrencyValue value={view.conservativeUsd} /></strong><small>沿用稳定资产与 SPY 全额，其余八折</small></div>
      <div><span>参考估值 · 单列</span><strong>{view.referencePricedCount ? <CurrencyValue value={view.referenceUsd} /> : "待计价"}</strong><small>未计入左侧总额，数量见资产明细</small></div>
      <div><span>合并后的地址</span><strong><CountValue value={view.addressCount} /></strong><small>已合并 <CountValue value={view.overlapCount} /> 个重复来源地址</small></div>
    </div>
    <div className="funds-freshness">
      <span>服务器余额 <TimeValue value={view.fleetAt} /></span><span>个人资产 <TimeValue value={view.personalAt} /></span><span>资源发现 <TimeValue value={view.registryAt} /></span>
      <Badge tone="warning">PARTIAL</Badge>
    </div>
    {error ? <Notice tone="warning" title="本次请求未完成">{error}</Notice> : null}
    {queued ? <Notice tone="info" title="刷新请求已保存">按现有刷新间隔执行，重复点击不会加速或扩大扫描。完成后自动显示新结果，失败时沿用上次余额。</Notice> : null}
    {view.capacity && view.capacity.pending > 0 ? <Notice tone="warning" title="新增资源待接入">发现数量超过资源额度，已有账户继续更新；超出部分尚未纳入统计，需调整预算后接入。</Notice> : null}
    <details className="funds-coverage"><summary>覆盖与更新说明 · <CountValue value={view.serverCount} /> 台服务器 · <CountValue value={view.unpricedCount} /> 项未计价 · <CountValue value={view.unknownCount} /> 项待采集</summary>
      <p>服务器余额约每十五分钟刷新，个人资产与 DeFi 约每小时刷新。本机每小时发现新服务器和公开钱包清单；本机离线时发现延后。资产变化包含价格变化、转账和范围新增，不能作为利润。</p>
      {view.capacity ? <p>资源额度：服务器账户 <CountValue value={view.capacity.accounts} /> / <CountValue value={view.capacity.accountLimit} />；每轮余额 <CountValue value={view.capacity.balanceItems} /> / <CountValue value={view.capacity.balanceLimit} />；个人钱包 <CountValue value={view.capacity.personalWallets} /> / <CountValue value={view.capacity.personalLimit} />。超额新增待接入，限额不会随钱包数量自动提高。</p> : null}
      {view.worker.resources ? <p>最近一轮：RPC <CountValue value={view.worker.resources.rpcRequests} /> 次，收发 <QuantityValue value={view.worker.resources.transferBytes / 1048576} /> MiB，耗时 <QuantityValue value={view.worker.resources.durationSeconds} /> 秒，峰值内存 <QuantityValue value={view.worker.resources.peakMemoryMiB} /> MiB。每轮最多 400 次 RPC，自动余额采集每天最多 96 轮。</p> : null}
      {view.worker.personalResources ? <p>最近个人刷新：外部请求 <CountValue value={view.worker.personalResources.requests} /> / 240 次。自动和手动共用每天 24 次的额度（UTC），失败尝试也计入。</p> : null}
      <ul>{view.gaps.map((gap, i) => <li key={i}>{gap}</li>)}</ul>
      {view.worker.error ? <p>最近采集状态：{view.worker.error}</p> : null}
    </details>
    <Tabs value={dimension} onValueChange={v => { setDimension(v as Dimension); setPage(1); setQuery(""); setDrill(null); setDetail(null); }}>
      <TabsList aria-label="资金汇总维度">{tabs.map(tab => <TabsTrigger key={tab.value} value={tab.value} icon={tab.icon}>{tab.label}</TabsTrigger>)}</TabsList>
      <TabsContent value={dimension}>
        <div className="funds-toolbar">
          {drill ? <Button size="sm" onClick={() => { setDrill(null); setPage(1); setDetail(null); setQuery(""); }}><ArrowLeft size={15} />{drill.label}</Button> : <span><CountValue value={total} /> 项</span>}
          <SearchField label="搜索资金" placeholder="搜索名称、地址或项目" value={query} onClear={() => { setQuery(""); setPage(1); }} onChange={e => { setQuery(e.target.value); setPage(1); }} />
        </div>
        {detail ? <div className="funds-detail">
          <div className="funds-heading"><h3>地址持仓</h3><Button size="sm" onClick={() => setDetail(null)}>收起</Button></div>
          <p className="funds-address">{detail.label} <CopyButton text={detail.label} label="复制地址" /></p>
          <Table><TableHeader><TableRow><TableHead>资产</TableHead><TableHead numeric>数量</TableHead><TableHead numeric>估值</TableHead><TableHead>观测时间</TableHead></TableRow></TableHeader><TableBody>
            {detail.facts.filter(f => f.quantity !== "0").map(f => <TableRow key={f.id}><TableCell>{f.symbol}<small className="funds-muted">{f.source}{f.reference ? " · 参考估值" : ""}</small></TableCell><TableCell numeric>{f.quantity === null ? (f.defi ? "DeFi 净值" : "UNKNOWN") : <QuantityValue value={Number(f.quantity)} title={f.quantity} />}</TableCell><TableCell numeric>{f.usd === null ? "未计价" : <CurrencyValue value={f.usd} />}</TableCell><TableCell><TimeValue value={f.observedAt} /><small className="funds-muted">价格 <TimeValue value={f.priceAt} emptyLabel="未知" /></small></TableCell></TableRow>)}
          </TableBody></Table>
        </div> : null}
        <Table aria-label="资金明细" aria-busy={loading} containerClassName="funds-table">
          <TableHeader><TableRow><TableHead>{isAddresses ? "地址 / 归属" : dimension === "asset" ? "资产 / 链" : "归属"}</TableHead><TableHead numeric>{showQuantity ? "数量" : "链上账户"}</TableHead><TableHead numeric>已计价</TableHead><TableHead>数据状态</TableHead><TableHead>详情</TableHead></TableRow></TableHeader>
          <TableBody>{rows.map(row => <TableRow key={row.id}>
            <TableCell><span className={isAddresses ? "funds-address" : "funds-label"}>{isAddresses ? `${row.label.slice(0, 10)}…${row.label.slice(-6)}` : row.label}</span>{row.subtitle ? <small className="funds-muted" title={row.subtitle}>{isAddresses ? row.subtitle : row.subtitle.length > 65 ? `${row.subtitle.slice(0, 45)}…${row.subtitle.slice(-6)}` : row.subtitle}</small> : null}</TableCell>
            <TableCell numeric>{showQuantity ? row.quantity !== undefined ? <QuantityValue value={Number(row.quantity)} title={row.quantity} /> : "—" : <CountValue value={row.accounts} />}</TableCell>
            <TableCell numeric>{row.priced ? <CurrencyValue value={row.usd} /> : "未计价"}{row.referenceUsd > 0 ? <small className="funds-muted">另有参考 <CurrencyValue value={row.referenceUsd} /></small> : null}</TableCell>
            <TableCell>{row.unknown ? <Badge tone="warning">待采集</Badge> : row.unpriced ? <Badge tone="warning">有未计价</Badge> : row.stale ? <Badge tone="warning">含旧数据</Badge> : <Badge tone="success">已读取</Badge>}</TableCell>
            <TableCell><Button aria-label={`查看 ${row.label}`} size="sm" onClick={() => void open(row)}><ArrowUpRight size={16} /><span className="funds-detail-label">查看</span></Button></TableCell>
          </TableRow>)}</TableBody>
        </Table>
        {!rows.length && !loading ? <EmptyState variant="no-results" description="没有匹配的资金记录" /> : null}
        <Pagination page={page} pageSize={50} totalItems={total} onPageChange={setPage} itemLabel="记录" />
      </TabsContent>
    </Tabs>
  </section>;
}
