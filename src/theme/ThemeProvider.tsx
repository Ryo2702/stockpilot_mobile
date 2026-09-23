import { createContext, useCallback, useContext, useMemo, useState, type PropsWithChildren } from "react";
import { Appearance, View, useColorScheme } from "react-native";
import { StatusBar } from "expo-status-bar";
import { useSQLiteContext } from "expo-sqlite";

import { getThemePreference, saveThemePreference } from "@/services/settings.service";
import useAsyncEffect from "@/hooks/useAsyncEffect";

import { themeColors, type ColorScheme, type ThemeColors, type ThemePreference } from "./tokens";

type ThemeContextValue = {
  scheme: ColorScheme;
  preference: ThemePreference;
  colors: ThemeColors;
  setColorScheme: (scheme: ThemePreference) => Promise<void>;
};

const ThemeContext = createContext<ThemeContextValue | null>(null);

export function ThemeProvider({ children }: PropsWithChildren) {
  const db = useSQLiteContext();
  const systemScheme = useColorScheme();
  const [preference, setPreference] = useState<ThemePreference>("system");

  useAsyncEffect((isActive) => {
    getThemePreference(db)
      .then((stored) => {
        if (isActive()) {
          setPreference(stored);
          Appearance.setColorScheme(stored === "system" ? "unspecified" : stored);
        }
      })
      .catch(() => undefined);
  }, [db]);

  const scheme = preference === "system" ? (systemScheme === "dark" ? "dark" : "light") : preference;
  const setColorScheme = useCallback(async (nextPreference: ThemePreference) => {
    const previousPreference = preference;
    setPreference(nextPreference);
    Appearance.setColorScheme(nextPreference === "system" ? "unspecified" : nextPreference);
    try {
      await saveThemePreference(db, nextPreference);
    } catch (error) {
      setPreference(previousPreference);
      Appearance.setColorScheme(previousPreference === "system" ? "unspecified" : previousPreference);
      throw error;
    }
  }, [db, preference]);

  const value = useMemo<ThemeContextValue>(
    () => ({
      scheme,
      preference,
      colors: themeColors[scheme],
      setColorScheme,
    }),
    [preference, scheme, setColorScheme],
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
