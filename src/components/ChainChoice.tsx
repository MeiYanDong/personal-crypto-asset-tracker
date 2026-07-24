import { Network } from "lucide-react";
import { forwardRef } from "react";
import { chainTone } from "./ChainExposure";
import { CountPair } from "./ui/CountValue";
import { Checkbox, type CheckboxProps } from "./ui/FormControls";
import { IdentityMark } from "./ui/IdentityMark";
import { cx } from "./ui/utils";

const chainLabels: Record<string, string> = {
  ethereum: "Ethereum",
  solana: "Solana",
  base: "Base",
  robinhood: "Robinhood",
  bsc: "BSC",
  arbitrum: "Arbitrum",
  polygon: "Polygon",
  optimism: "Optimism",
  avalanche: "Avalanche",
  xlayer: "XLayer",
  linea: "Linea",
  scroll: "Scroll",
  zksync: "zkSync",
  fantom: "Fantom"
};

export function chainDisplayLabel(chain: string) {
  const key = chain.trim().toLowerCase();
  return chainLabels[key] || chain;
}

export type ChainChoiceProps = Omit<CheckboxProps, "checked" | "label" | "onChange"> & {
  chain: string;
  checked: boolean;
  onCheckedChange: () => void;
};

export const ChainChoice = forwardRef<HTMLInputElement, ChainChoiceProps>(function ChainChoice({
  chain,
  checked,
  className,
  onCheckedChange,
  ...props
}, ref) {
  const label = chainDisplayLabel(chain);
  const tone = chainTone(chain, label);

  return (
    <Checkbox
      {...props}
      ref={ref}
      checked={checked}
      className={cx("chain-choice", className)}
      data-chain={chain}
      label={(
        <span className="chain-choice-label">
          <IdentityMark
            aria-hidden="true"
            className={`chain-choice-mark chain-badge ${tone}`}
            kind="icon"
          >
            <Network />
          </IdentityMark>
          <span>{label}</span>
        </span>
      )}
      onChange={onCheckedChange}
    />
  );
});

export type ChainChoiceGroupProps = {
  chains: readonly string[];
  label: string;
  labelId: string;
  onCheckedChange: (chain: string) => void;
  selectedChains: readonly string[];
};

export function ChainChoiceGroup({
  chains,
  label,
  labelId,
  onCheckedChange,
  selectedChains
}: ChainChoiceGroupProps) {
  const selectedChainSet = new Set(selectedChains);
  const selectedCount = chains.filter((chain) => selectedChainSet.has(chain)).length;

  return (
    <section
      aria-labelledby={labelId}
      className="chain-choice-group"
      data-component="chain-choice-group"
      role="group"
    >
      <div className="chain-choice-group-heading" data-slot="chain-choice-group-heading">
        <strong id={labelId}>{label}</strong>
        <span
          aria-atomic="true"
          className="chain-choice-group-count"
          data-slot="chain-choice-group-count"
          role="status"
        >
          <span>已选</span>
          <CountPair first={selectedCount} second={chains.length} />
        </span>
      </div>
      <div className="chain-choice-group-list" data-slot="chain-choice-group-list">
        {chains.map((chain) => (
          <ChainChoice
            chain={chain}
            checked={selectedChainSet.has(chain)}
            key={chain}
            onCheckedChange={() => onCheckedChange(chain)}
          />
        ))}
      </div>
    </section>
  );
}

export default ChainChoice;
