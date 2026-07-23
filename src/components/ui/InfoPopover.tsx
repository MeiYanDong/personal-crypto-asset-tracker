import { CircleHelp, X } from "lucide-react";
import { useId, type ReactNode } from "react";
import { IconButton } from "./Button";
import {
  Popover,
  PopoverClose,
  PopoverContent,
  PopoverTrigger,
  type PopoverContentProps
} from "./Popover";
import { cx } from "./utils";

export type InfoPopoverProps = {
  align?: PopoverContentProps["align"];
  children: ReactNode;
  className?: string;
  description?: ReactNode;
  label: string;
  side?: PopoverContentProps["side"];
  title: ReactNode;
};

export function InfoPopover({
  align = "start",
  children,
  className,
  description,
  label,
  side = "bottom",
  title
}: InfoPopoverProps) {
  const titleId = useId();
  const descriptionId = useId();

  return (
    <Popover>
      <PopoverTrigger asChild>
        <IconButton
          className="ui-info-popover-trigger"
          data-slot="info-popover-trigger"
          label={label}
          size="xs"
          title={label}
          tooltip={false}
          variant="ghost"
        >
          <CircleHelp />
        </IconButton>
      </PopoverTrigger>
      <PopoverContent
        align={align}
        aria-describedby={description ? descriptionId : undefined}
        aria-labelledby={titleId}
        className={cx("ui-info-popover-content", className)}
        data-slot="info-popover-content"
        side={side}
      >
        <header className="ui-info-popover-header" data-slot="info-popover-header">
          <strong id={titleId}>{title}</strong>
          <PopoverClose asChild>
            <IconButton
              className="ui-info-popover-close"
              data-slot="info-popover-close"
              label="关闭说明"
              size="xs"
              title="关闭说明"
              tooltip={false}
              variant="ghost"
            >
              <X />
            </IconButton>
          </PopoverClose>
        </header>
        {description ? (
          <p className="ui-info-popover-description" id={descriptionId}>
            {description}
          </p>
        ) : null}
        <div className="ui-info-popover-body" data-slot="info-popover-body">
          {children}
        </div>
      </PopoverContent>
    </Popover>
  );
}
