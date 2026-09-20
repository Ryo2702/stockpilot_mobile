import { IconButton } from "@/components/ui/IconButton";
import { useTheme } from "@/theme/ThemeProvider";
import { Moon, Sun } from "lucide-react-native";

export default function ThemeToggle() {
  const { scheme, setColorScheme } = useTheme();
  const darkMode = scheme === "dark";

  return (
    <IconButton
      icon={darkMode ? Sun : Moon}
      label={`Switch to ${darkMode ? "light" : "dark"} appearance`}
      onPress={() => setColorScheme(darkMode ? "light" : "dark")}
    />
  );
}
