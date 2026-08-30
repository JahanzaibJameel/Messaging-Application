import { Colors } from "@/constants/theme";
import { useColorScheme } from "@/hooks/useColorScheme";

export function useTheme() {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === "dark";
  const themeKey = (colorScheme ?? "light") as "light" | "dark";
  const theme = Colors[themeKey];

  return {
    theme,
    isDark,
  };
}
