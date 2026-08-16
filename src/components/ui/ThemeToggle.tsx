import { Moon, Sun } from "lucide-react";
import type { ColorTheme } from "../../theme";
import { IconButton, type IconButtonProps } from "./Button";
import { cx } from "./utils";

export type ThemeToggleProps = Omit<IconButtonProps, "children" | "label" | "onClick"> & {
  theme: ColorTheme;
  onToggle: () => void;
};

export function ThemeToggle({ className, onToggle, theme, ...props }: ThemeToggleProps) {
  const dark = theme === "dark";
  const label = dark ? "切换为浅色模式" : "切换为深色模式";

  return (
    <IconButton
      {...props}
      aria-pressed={dark}
      className={cx("theme-toggle-action", className)}
      data-theme-control={theme}
      label={label}
      onClick={onToggle}
    >
      {dark ? <Sun /> : <Moon />}
    </IconButton>
  );
}
