import type { TextStyle, ViewStyle } from "react-native";

/**
 * StockPilot's visual source of truth.
 *
 * These typed tokens keep the React Native interface consistent across every
 * screen and its light and dark appearances.
 */
export const colors = {
  primary: {
    50: "#f6f0e8",
    100: "#efe4d9",
    200: "#e6ded6",
    300: "#d9bfa8",
    400: "#d4ac8b",
    500: "#c89f7a",
    600: "#c89f7a",
    700: "#6f4e37",
    800: "#4c3526",
    900: "#241c17",
  },
  gray: {
    50: "#fcf8f4",
    100: "#f6f0e8",
    200: "#e6ded6",
    300: "#ddd4cb",
    400: "#c2b8af",
    500: "#9b928a",
    600: "#746a62",
    700: "#5d554f",
    800: "#3a312c",
    900: "#241c17",
  },
  white: "#ffffff",
  semantic: {
    success: "#22c55e",
    successBackground: "#f0fdf4",
    warning: "#f59e0b",
    warningBackground: "#fffbeb",
    danger: "#ef4444",
    dangerBackground: "#fef2f2",
    info: "#6f4e37",
    infoBackground: "#f6f0e8",
  },
  background: {
    app: "#ffffff",
    surface: "#ffffff",
    subtle: "#f6f0e8",
    disabled: "#f1ece6",
  },
  text: {
    primary: "#241c17",
    secondary: "#746a62",
    muted: "#9b928a",
    disabled: "#aaa19a",
    onPrimary: "#241c17",
  },
  border: {
    default: "#e6ded6",
    strong: "#ddd4cb",
    focus: "#c89f7a",
  },
} as const;

type StringPalette<T> = {
  [K in keyof T]: T[K] extends string ? string : StringPalette<T[K]>;
};

export type ThemeColors = StringPalette<typeof colors>;
export type ColorScheme = "light" | "dark";
export type ThemePreference = ColorScheme | "system";

export const darkColors: ThemeColors = {
  primary: {
    50: "#2a221d",
    100: "#3a302a",
    200: "#4a3930",
    300: "#765a48",
    400: "#a97856",
    500: "#c89f7a",
    600: "#c89f7a",
    700: "#dab797",
    800: "#e9cfba",
    900: "#f6f0e8",
  },
  gray: {
    50: "#181411",
    100: "#211b17",
    200: "#2a221d",
    300: "#3a302a",
    400: "#61564e",
    500: "#968c84",
    600: "#c5bbb2",
    700: "#ded5cc",
    800: "#eee7e0",
    900: "#f6f0e8",
  },
  white: colors.white,
  semantic: {
    success: "#22c55e",
    successBackground: "#12351f",
    warning: "#f59e0b",
    warningBackground: "#412d0c",
    danger: "#ef4444",
    dangerBackground: "#451516",
    info: "#c89f7a",
    infoBackground: "#2a221d",
  },
  background: {
    app: "#181411",
    surface: "#211b17",
    subtle: "#2a221d",
    disabled: "#2a221d",
  },
  text: {
    primary: "#f6f0e8",
    secondary: "#c5bbb2",
    muted: "#968c84",
    disabled: "#756b63",
    onPrimary: "#241c17",
  },
  border: {
    default: "#3a302a",
    strong: "#4b4038",
    focus: "#c89f7a",
  },
};

export const themeColors: Record<ColorScheme, ThemeColors> = {
  light: colors,
  dark: darkColors,
};

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
