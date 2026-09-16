import type { TextStyle, ViewStyle } from "react-native";

/**
 * StockPilot's visual source of truth.
 *
 * The style guide is written with CSS variables in mind. These typed tokens
 * are the React Native equivalent so colors, spacing, and control sizes stay
 * consistent across every screen.
 */
export const colors = {
  primary: {
    50: "#eff6ff",
    100: "#dbeafe",
    200: "#bfdbfe",
    300: "#93c5fd",
    400: "#60a5fa",
    500: "#3b82f6",
    600: "#2563eb",
    700: "#1d4ed8",
    800: "#1e40af",
    900: "#1e3a8a",
  },
  gray: {
    50: "#f9fafb",
    100: "#f3f4f6",
    200: "#e5e7eb",
    300: "#d1d5db",
    400: "#9ca3af",
    500: "#6b7280",
    600: "#4b5563",
    700: "#374151",
    800: "#1f2937",
    900: "#111827",
  },
  white: "#ffffff",
  semantic: {
    success: "#22c55e",
    successBackground: "#f0fdf4",
    warning: "#f59e0b",
    warningBackground: "#fffbeb",
    danger: "#ef4444",
    dangerBackground: "#fef2f2",
    info: "#3b82f6",
    infoBackground: "#eff6ff",
  },
  background: {
    app: "#f8fafc",
    surface: "#ffffff",
    subtle: "#f9fafb",
  },
  text: {
    primary: "#111827",
    secondary: "#4b5563",
    muted: "#6b7280",
    disabled: "#9ca3af",
    onPrimary: "#ffffff",
  },
  border: {
    default: "#e5e7eb",
    strong: "#d1d5db",
    focus: "#2563eb",
  },
} as const;

export const spacing = {
  1: 4,
  2: 8,
  3: 12,
  4: 16,
  5: 20,
  6: 24,
  8: 32,
  10: 40,
  12: 48,
} as const;

export const radii = {
  xs: 4,
  sm: 6,
  md: 8,
  lg: 12,
  xl: 16,
  full: 9999,
} as const;

export const control = {
  sm: 32,
  md: 40,
  lg: 48,
} as const;

export const typography = {
  display: {
    fontSize: 32,
    lineHeight: 40,
    fontWeight: "700",
  },
  h1: {
    fontSize: 28,
    lineHeight: 36,
    fontWeight: "700",
  },
  h2: {
    fontSize: 24,
    lineHeight: 32,
    fontWeight: "700",
  },
  h3: {
    fontSize: 20,
    lineHeight: 28,
    fontWeight: "600",
  },
  title: {
    fontSize: 18,
    lineHeight: 26,
    fontWeight: "600",
  },
  body: {
    fontSize: 16,
    lineHeight: 24,
    fontWeight: "400",
  },
  bodySmall: {
    fontSize: 14,
    lineHeight: 20,
    fontWeight: "400",
  },
  label: {
    fontSize: 14,
    lineHeight: 20,
    fontWeight: "500",
  },
  caption: {
    fontSize: 12,
    lineHeight: 16,
    fontWeight: "400",
  },
} satisfies Record<string, TextStyle>;

export const shadows = {
  sm: {
    shadowColor: colors.gray[900],
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  } satisfies ViewStyle,
  md: {
    shadowColor: colors.gray[900],
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 4,
  } satisfies ViewStyle,
} as const;

export const motion = {
  fast: 120,
  normal: 180,
} as const;

