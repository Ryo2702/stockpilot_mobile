import type { TextStyle, ViewStyle } from "react-native";

/**
 * StockPilot's visual source of truth.
 *
 * These typed tokens keep the React Native interface consistent across every
 * screen and its light and dark appearances.
 */
export const colors = {
  primary: {
    50: "#E8EDF3",
    100: "#DDE5EE",
    200: "#C9D5E2",
    300: "#AABDD1",
    400: "#8299B3",
    500: "#1F3A5F",
    600: "#1F3A5F",
    700: "#1F3A5F",
    800: "#172B46",
    900: "#172B46",
  },
  gray: {
    50: "#F7F5F2",
    100: "#EEEAE5",
    200: "#E6E8EB",
    300: "#D9DDE3",
    400: "#BBC2CB",
    500: "#858C98",
    600: "#667085",
    700: "#475467",
    800: "#344054",
    900: "#1A1D21",
  },
  secondary: "#5B7C99",
  secondarySoft: "#EDF1F5",
  accent: "#D8B892",
  accentSoft: "#F1E7DC",
  white: "#FFFFFF",
  semantic: {
    success: "#2F7D5B",
    successBackground: "#E7F1EC",
    warning: "#C58A24",
    warningBackground: "#F7EEDC",
    danger: "#C94C4C",
    dangerBackground: "#F8E5E5",
    info: "#3B78B4",
    infoBackground: "#E6EFF7",
  },
  background: {
    app: "#F7F5F2",
    surface: "#FFFFFF",
    subtle: "#EEEAE5",
    elevated: "#FFFFFF",
    input: "#FFFFFF",
    disabled: "#E9E7E4",
    disabledControl: "#D9DDE3",
  },
  text: {
    primary: "#1A1D21",
    secondary: "#667085",
    muted: "#858C98",
    disabled: "#9FA4AC",
    onPrimary: "#FFFFFF",
    onAccent: "#1A1D21",
    onDanger: "#FFFFFF",
  },
  border: {
    default: "#D9DDE3",
    subtle: "#E6E8EB",
    strong: "#BBC2CB",
    focus: "#1F3A5F",
    error: "#C94C4C",
    success: "#2F7D5B",
  },
  overlay: "rgba(26, 29, 33, 0.32)",
} as const;

type StringPalette<T> = {
  [K in keyof T]: T[K] extends string ? string : StringPalette<T[K]>;
};

export type ThemeColors = StringPalette<typeof colors>;
export type ColorScheme = "light" | "dark";
export type ThemePreference = ColorScheme | "system";

export const darkColors: ThemeColors = {
  primary: {
    50: "#2A3442",
    100: "#334255",
    200: "#40526A",
    300: "#526883",
    400: "#8299B3",
    500: "#6F8FCB",
    600: "#6F8FCB",
    700: "#6F8FCB",
    800: "#5D7EBB",
    900: "#5D7EBB",
  },
  gray: {
    50: "#191D23",
    100: "#252A31",
    200: "#303741",
    300: "#3A424D",
    400: "#525C69",
    500: "#878F9A",
    600: "#AEB5C0",
    700: "#C5CBD3",
    800: "#E0E3E7",
    900: "#F4F5F7",
  },
  secondary: "#8299B3",
  secondarySoft: "#2A3440",
  accent: "#D8B892",
  accentSoft: "#3B3329",
  white: colors.white,
  semantic: {
    success: "#58A77C",
    successBackground: "#1F3328",
    warning: "#D7A34D",
    warningBackground: "#3B3020",
    danger: "#DC6868",
    dangerBackground: "#3B2427",
    info: "#69A0D3",
    infoBackground: "#223346",
  },
  background: {
    app: "#111418",
    surface: "#191D23",
    subtle: "#252A31",
    elevated: "#20252C",
    input: "#191D23",
    disabled: "#252A31",
    disabledControl: "#303741",
  },
  text: {
    primary: "#F4F5F7",
    secondary: "#AEB5C0",
    muted: "#878F9A",
    disabled: "#626A75",
    onPrimary: "#111418",
    onAccent: "#1A1D21",
    onDanger: "#111418",
  },
  border: {
    default: "#303741",
    subtle: "#252A31",
    strong: "#47515D",
    focus: "#6F8FCB",
    error: "#DC6868",
    success: "#58A77C",
  },
  overlay: "rgba(0, 0, 0, 0.58)",
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

export const fontFamilies = {
  heading: "Manrope",
  ui: "Inter",
  mono: "IBM Plex Mono",
  monoMedium: "IBM Plex Mono Medium",
} as const;

export const typography = {
  display: {
    fontFamily: fontFamilies.heading,
    fontSize: 32,
    lineHeight: 40,
    fontWeight: "700",
  },
  h1: {
    fontFamily: fontFamilies.heading,
    fontSize: 28,
    lineHeight: 34,
    fontWeight: "700",
  },
  h2: {
    fontFamily: fontFamilies.heading,
    fontSize: 24,
    lineHeight: 30,
    fontWeight: "700",
  },
  h3: {
    fontFamily: fontFamilies.heading,
    fontSize: 20,
    lineHeight: 26,
    fontWeight: "600",
  },
  section: {
    fontFamily: fontFamilies.heading,
    fontSize: 18,
    lineHeight: 24,
    fontWeight: "600",
  },
  title: {
    fontFamily: fontFamilies.ui,
    fontSize: 16,
    lineHeight: 22,
    fontWeight: "600",
  },
  body: {
    fontFamily: fontFamilies.ui,
    fontSize: 16,
    lineHeight: 24,
    fontWeight: "400",
  },
  bodyMedium: {
    fontFamily: fontFamilies.ui,
    fontSize: 15,
    lineHeight: 22,
    fontWeight: "500",
  },
  bodySmall: {
    fontFamily: fontFamilies.ui,
    fontSize: 14,
    lineHeight: 21,
    fontWeight: "400",
  },
  label: {
    fontFamily: fontFamilies.ui,
    fontSize: 14,
    lineHeight: 20,
    fontWeight: "500",
  },
  input: {
    fontFamily: fontFamilies.ui,
    fontSize: 16,
    lineHeight: 24,
    fontWeight: "400",
  },
  caption: {
    fontFamily: fontFamilies.ui,
    fontSize: 13,
    lineHeight: 18,
    fontWeight: "400",
  },
  numeric: {
    fontFamily: fontFamilies.heading,
    fontSize: 28,
    lineHeight: 34,
    fontWeight: "700",
    fontVariant: ["tabular-nums"],
  },
  numericSmall: {
    fontFamily: fontFamilies.heading,
    fontSize: 16,
    lineHeight: 22,
    fontWeight: "700",
    fontVariant: ["tabular-nums"],
  },
  mono: {
    fontFamily: fontFamilies.mono,
    fontSize: 13,
    lineHeight: 18,
    fontWeight: "400",
  },
  monoMedium: {
    fontFamily: fontFamilies.monoMedium,
    fontSize: 13,
    lineHeight: 18,
    fontWeight: "500",
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
