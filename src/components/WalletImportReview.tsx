import { CheckCircle2, CircleAlert, Link2, ScanSearch } from "lucide-react";
import { CountValue } from "./ui/CountValue";
import {
  StatContent,
  StatItem,
  StatLabel,
  StatList,
  StatValue
} from "./ui/Stat";

export type WalletImportIssue = {
  lineNumber: number;
  message: string;
};

type WalletImportReviewProps = {
  lineCount: number;
  validCount: number;
  pairCount: number;
  issues: WalletImportIssue[];
};

export default function WalletImportReview({
  lineCount,
  validCount,
  pairCount,
  issues
}: WalletImportReviewProps) {
  const statusText = lineCount
    ? `预检完成：${validCount} 个地址可添加，${pairCount} 个新配对，${issues.length} 行需要处理。`
    : "尚未输入钱包地址。";
  const state = !lineCount ? "empty" : issues.length ? "issues" : "ready";
  const isEmpty = state === "empty";

  return (
    <aside
      aria-labelledby="wallet-import-review-title"
      className="wallet-import-review"
      data-slot="wallet-import-review"
      data-state={state}
    >
      <div className="wallet-import-review-heading">
        <span className="wallet-import-review-heading-icon" aria-hidden="true">
          <ScanSearch />
        </span>
        <div>
          <strong id="wallet-import-review-title">
            {isEmpty ? "支持格式" : "预检结果"}
          </strong>
          <span>{isEmpty ? "每行一个钱包地址" : "格式、重复与配对"}</span>
        </div>
      </div>

      <span
        aria-atomic="true"
        className="sr-only"
        id="wallet-import-review-status"
        role="status"
      >
        {statusText}
      </span>

      {isEmpty ? (
        <ul className="wallet-import-review-formats">
          <li>
            <code>地址</code>
            <span>自动识别 EVM / Solana</span>
          </li>
          <li>
            <code>名称 地址</code>
            <span>保留自定义钱包名称</span>
          </li>
          <li>
            <code>链名 编号 地址</code>
            <span>同编号自动配对</span>
          </li>
        </ul>
      ) : (
        <StatList className="wallet-import-review-metrics">
          <StatItem className="wallet-import-review-metric" data-tone={validCount ? "success" : "neutral"}>
            <StatLabel>可添加</StatLabel>
            <StatContent>
              <CheckCircle2 aria-hidden="true" />
              <StatValue><CountValue value={validCount} /></StatValue>
            </StatContent>
          </StatItem>
          <StatItem className="wallet-import-review-metric" data-tone={pairCount ? "info" : "neutral"}>
            <StatLabel>新配对</StatLabel>
            <StatContent>
              <Link2 aria-hidden="true" />
              <StatValue><CountValue value={pairCount} /></StatValue>
            </StatContent>
          </StatItem>
          <StatItem className="wallet-import-review-metric" data-tone={issues.length ? "warning" : "neutral"}>
            <StatLabel>需处理</StatLabel>
            <StatContent>
              <CircleAlert aria-hidden="true" />
              <StatValue><CountValue value={issues.length} /></StatValue>
            </StatContent>
          </StatItem>
        </StatList>
      )}

      {!isEmpty && issues.length ? (
        <div className="wallet-import-review-issues">
          <strong>需要处理</strong>
          <ul>
            {issues.slice(0, 3).map((issue) => (
              <li key={`${issue.lineNumber}-${issue.message}`}>
                <span aria-hidden="true">{issue.lineNumber}</span>
                <span>第 {issue.lineNumber} 行：{issue.message}</span>
              </li>
            ))}
          </ul>
          {issues.length > 3 ? (
            <p>另有 <CountValue value={issues.length - 3} /> 行需要处理</p>
          ) : null}
        </div>
      ) : !isEmpty ? (
        <div className="wallet-import-review-state" data-tone="success">
          <span className="wallet-import-review-state-icon" aria-hidden="true"><CheckCircle2 /></span>
          <span>格式与冲突检查通过</span>
        </div>
      ) : null}
    </aside>
  );
}
