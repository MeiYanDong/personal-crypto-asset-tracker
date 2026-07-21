import type { CSSProperties, HTMLAttributes, MouseEvent, ReactNode } from "react";
import { cx } from "./utils";

export type RouteNavigationItem<Value extends string> = {
  value: Value;
  href: string;
  icon?: ReactNode;
  label: string;
};

type RouteNavigationStyle = CSSProperties & {
  "--ui-route-count": number;
};

type RouteNavigationProps<Value extends string> = Omit<HTMLAttributes<HTMLElement>, "onChange"> & {
  items: readonly RouteNavigationItem<Value>[];
  label: string;
  onNavigate: (value: Value) => void;
  value: Value;
};

function shouldUseBrowserNavigation(event: MouseEvent<HTMLAnchorElement>) {
  return event.button !== 0 || event.altKey || event.ctrlKey || event.metaKey || event.shiftKey;
}

export function RouteNavigation<Value extends string>({
  className,
  items,
  label,
  onNavigate,
  value,
  ...props
}: RouteNavigationProps<Value>) {
  const style = {
    "--ui-route-count": Math.max(1, items.length)
  } as RouteNavigationStyle;

  return (
    <nav aria-label={label} className={cx("ui-route-nav", className)} {...props}>
      <ul className="ui-route-nav-list" style={style}>
        {items.map((item) => {
          const isCurrent = item.value === value;
          return (
            <li key={item.value}>
              <a
                aria-current={isCurrent ? "page" : undefined}
                className="ui-route-nav-link"
                href={item.href}
                onClick={(event) => {
                  if (shouldUseBrowserNavigation(event)) {
                    return;
                  }
                  event.preventDefault();
                  if (!isCurrent) {
                    onNavigate(item.value);
                  }
                }}
              >
                {item.icon ? <span className="ui-route-nav-icon" aria-hidden="true">{item.icon}</span> : null}
                <span>{item.label}</span>
              </a>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
