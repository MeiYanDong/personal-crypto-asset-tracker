import {
  forwardRef,
  type AnchorHTMLAttributes,
  type CSSProperties,
  type ForwardedRef,
  type HTMLAttributes,
  type MouseEvent,
  type MouseEventHandler,
  type ReactElement,
  type ReactNode,
  type RefAttributes
} from "react";
import { cx } from "./utils";

export type RouteNavigationItem<Value extends string> = {
  download?: AnchorHTMLAttributes<HTMLAnchorElement>["download"];
  value: Value;
  href: string;
  icon?: ReactNode;
  label: string;
  onClick?: MouseEventHandler<HTMLAnchorElement>;
  rel?: string;
  target?: AnchorHTMLAttributes<HTMLAnchorElement>["target"];
};

type RouteNavigationStyle = CSSProperties & {
  "--ui-route-count": number;
};

export type RouteNavigationProps<Value extends string> = Omit<HTMLAttributes<HTMLElement>, "onChange"> & {
  items: readonly RouteNavigationItem<Value>[];
  label: string;
  onNavigate: (value: Value) => void;
  value: Value;
};

function shouldUseBrowserNavigation(event: MouseEvent<HTMLAnchorElement>) {
  const target = event.currentTarget.getAttribute("target");
  return (
    event.defaultPrevented ||
    event.button !== 0 ||
    event.altKey ||
    event.ctrlKey ||
    event.metaKey ||
    event.shiftKey ||
    event.currentTarget.hasAttribute("download") ||
    Boolean(target && target.toLowerCase() !== "_self")
  );
}

function RouteNavigationInner<Value extends string>({
  className,
  items,
  label,
  onNavigate,
  style,
  value,
  ...props
}: RouteNavigationProps<Value>, forwardedRef: ForwardedRef<HTMLElement>) {
  const rootStyle = {
    ...style,
    "--ui-route-count": Math.max(1, items.length)
  } as RouteNavigationStyle;

  return (
    <nav
      {...props}
      aria-label={label}
      className={cx("ui-route-nav", className)}
      data-count={items.length}
      data-slot="route-navigation"
      ref={forwardedRef}
      style={rootStyle}
    >
      <ul className="ui-route-nav-list" data-slot="route-navigation-list">
        {items.map((item) => {
          const isCurrent = item.value === value;
          return (
            <li
              data-current={isCurrent || undefined}
              data-slot="route-navigation-item"
              data-state={isCurrent ? "current" : "idle"}
              key={item.value}
            >
              <a
                aria-current={isCurrent ? "page" : undefined}
                className="ui-route-nav-link"
                data-current={isCurrent || undefined}
                data-slot="route-navigation-link"
                data-state={isCurrent ? "current" : "idle"}
                download={item.download}
                href={item.href}
                rel={item.rel}
                target={item.target}
                onClick={(event) => {
                  item.onClick?.(event);
                  if (shouldUseBrowserNavigation(event)) {
                    return;
                  }
                  event.preventDefault();
                  if (!isCurrent) {
                    onNavigate(item.value);
                  }
                }}
              >
                {item.icon ? (
                  <span className="ui-route-nav-icon" data-slot="route-navigation-icon" aria-hidden="true">
                    {item.icon}
                  </span>
                ) : null}
                <span data-slot="route-navigation-label">{item.label}</span>
              </a>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}

export const RouteNavigation = forwardRef(RouteNavigationInner) as <Value extends string>(
  props: RouteNavigationProps<Value> & RefAttributes<HTMLElement>
) => ReactElement;
