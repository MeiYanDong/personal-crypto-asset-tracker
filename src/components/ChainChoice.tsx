import { Network } from "lucide-react";
import { forwardRef } from "react";
import { chainTone } from "./ChainExposure";
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

export default ChainChoice;
