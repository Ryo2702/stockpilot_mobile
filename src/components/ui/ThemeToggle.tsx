import { Moon, Sun } from "lucide-react-native";
import { Pressable, View } from "react-native";

import { control, radii } from "@/theme";
import { useTheme, useThemeStyles } from "@/theme/ThemeProvider";
import type { ThemeColors } from "@/theme/tokens";

const createStyles = (colors: ThemeColors) => ({
  toggle: {
    height: control.md,
    flexDirection: "row" as const,
    alignItems: "center" as const,
    gap: 2,
    padding: 3,
    borderWidth: 1,
    borderColor: colors.border.default,
    borderRadius: radii.md,
    backgroundColor: colors.background.surface,
  },
  option: {
    width: control.sm,
    height: control.sm,
    alignItems: "center" as const,
    justifyContent: "center" as const,
    borderRadius: radii.sm,
  },
  selected: {
    backgroundColor: colors.gray[100],
  },
  pressed: {
    opacity: 0.7,
  },
});

export default function ThemeToggle() {
  const { scheme, setColorScheme, colors } = useTheme();
  const styles = useThemeStyles(createStyles);
  const darkMode = scheme === "dark";

  return (
    <View style={styles.toggle}>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel="Use light appearance"
        accessibilityState={{ selected: !darkMode }}
        onPress={() => setColorScheme("light")}
        style={({ pressed }) => [styles.option, !darkMode && styles.selected, pressed && styles.pressed]}
      >
        <Sun color={!darkMode ? colors.primary[700] : colors.text.secondary} size={18} />
      </Pressable>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel="Use dark appearance"
        accessibilityState={{ selected: darkMode }}
        onPress={() => setColorScheme("dark")}
        style={({ pressed }) => [styles.option, darkMode && styles.selected, pressed && styles.pressed]}
      >
        <Moon color={darkMode ? colors.primary[700] : colors.text.secondary} size={18} />
      </Pressable>
    </View>
  );
}
