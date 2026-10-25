import { theme } from "antd";
import { useMemo, type CSSProperties } from "react";

// The table's colors, radii, font sizes and motion. Each internal `--ts-*`
// variable is your `--tablesync-*` override if you set one (e.g. on :root),
// else the value of the current AntD theme — light, dark or custom.
export function useThemeVars(): CSSProperties {
  const { token } = theme.useToken();
  return useMemo(() => {
    const px = (value: number | string) =>
      typeof value === "number" ? `${value}px` : value;
    const defaults: Record<string, string | number> = {
      text: token.colorText,
      muted: token.colorTextSecondary,
      primary: token.colorPrimary,
      "primary-soft": token.colorPrimaryBg,
      error: token.colorError,
      border: token.colorBorderSecondary,
      card: token.colorBgContainer,
      bg: token.colorBgLayout,
      hover: token.colorFillAlter,
      shadow: token.boxShadowSecondary,
      "radius-sm": px(token.borderRadiusSM),
      "radius-md": px(token.borderRadius),
      "radius-lg": px(token.borderRadiusLG),
      "font-size-xs": px(token.fontSizeSM),
      "font-size-sm": px(token.fontSizeSM),
      "font-size-md": px(token.fontSize),
      "font-size-lg": px(token.fontSizeLG),
      "font-size-icon": px(token.fontSizeHeading2),
      "motion-fast": token.motionDurationFast,
      "motion-base": token.motionDurationMid,
      ease: token.motionEaseOut,
      // mock row stripes in the "Status accent" preview
      "accent-1": token.colorPrimary,
      "accent-2": token.colorWarning,
      "accent-3": token.colorSuccess,
      "accent-4": token.colorError,
    };
    return Object.fromEntries(
      Object.entries(defaults).map(([name, value]) => [
        `--ts-${name}`,
        `var(--tablesync-${name}, ${value})`,
      ]),
    ) as CSSProperties;
  }, [token]);
}
