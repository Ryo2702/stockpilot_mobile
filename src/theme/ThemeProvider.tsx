import { createContext, useContext, useMemo, useState, type PropsWithChildren } from "react";
import { Appearance, useColorScheme, View } from "react-native";
import { StatusBar } from "expo-status-bar";

import { themeColors, type ColorScheme, type ThemeColors } from "./tokens";

type ThemeContextValue = {
  scheme: ColorScheme;
  colors: ThemeColors;
  setColorScheme: (scheme: ColorScheme) => void;
};

const ThemeContext = createContext<ThemeContextValue | null>(null);

export function ThemeProvider({ children }: PropsWithChildren) {
  const systemScheme: ColorScheme = useColorScheme() === "dark" ? "dark" : "light";
  const [schemeOverride, setSchemeOverride] = useState<ColorScheme | null>(null);
  const scheme = schemeOverride ?? systemScheme;
  const value = useMemo<ThemeContextValue>(
    () => ({
      scheme,
      colors: themeColors[scheme],
      setColorScheme: (nextScheme) => {
        setSchemeOverride(nextScheme);
        if (typeof Appearance.setColorScheme === "function") {
          Appearance.setColorScheme(nextScheme);
        }
      },
    }),
    [scheme, setSchemeOverride],
  );

  return (
    <ThemeContext.Provider value={value}>
      <View style={{ flex: 1, backgroundColor: value.colors.background.app }}>
        <StatusBar style={scheme === "dark" ? "light" : "dark"} />
        {children}
      </View>
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const theme = useContext(ThemeContext);
  if (!theme) throw new Error("useTheme must be used inside ThemeProvider.");
  return theme;
}

export function useThemeStyles<T>(createStyles: (colors: ThemeColors) => T): T {
  const { colors } = useTheme();
  return useMemo(() => createStyles(colors), [colors, createStyles]);
}
