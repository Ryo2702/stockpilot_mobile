import {
  Boxes,
  CircleAlert,
  CircleCheck,
  TriangleAlert,
} from "lucide-react-native";
import { Image, Text, View } from "react-native";

import { Card } from "@/components/ui/Card";
import type { StoreStockHealthState } from "@/domain/stock-health";
import { radii, spacing, typography, useThemeStyles } from "@/theme";
import { useTheme } from "@/theme/ThemeProvider";
import type { ThemeColors } from "@/theme/tokens";

const healthImages = {
  healthy: require("../../../../assets/healthy_stockhealth.png"),
  warning: require("../../../../assets/warning_stochealth.png"),
  critical: require("../../../../assets/critical_health.png"),
};

const createStyles = (colors: ThemeColors) => ({
  card: {
    flexDirection: "row" as const,
    alignItems: "center" as const,
    gap: spacing[3],
    minHeight: 100,
    padding: spacing[3],
  },
  imageFrame: {
    width: 84,
    height: 84,
    alignItems: "center" as const,
    justifyContent: "center" as const,
    borderRadius: radii.full,
  },
  image: { width: 84, height: 84, flexShrink: 0 },
  copy: { flex: 1, minWidth: 0, gap: spacing[1] },
  heading: {
    flexDirection: "row" as const,
    alignItems: "center" as const,
    gap: spacing[1],
  },
  label: {
    ...typography.label,
    fontWeight: "600" as const,
    color: colors.text.primary,
  },
  title: { ...typography.title, fontWeight: "600" as const, color: colors.text.primary },
  message: { ...typography.bodySmall, color: colors.text.secondary },
});

const healthCopy = {
  empty: {
    title: "Add products to track stock.",
    message: "Stock health appears after you add products.",
    image: healthImages.healthy,
    Icon: Boxes,
  },
  healthy: {
    title: "Inventory looks stable.",
    message: "Most products are well stocked.",
    image: healthImages.healthy,
    Icon: CircleCheck,
  },
  warning: {
    title: "Restock soon.",
    message: "Some products are below their reorder level.",
    image: healthImages.warning,
    Icon: TriangleAlert,
  },
  critical: {
    title: "Restock needed.",
    message: "Some products are critically low.",
    image: healthImages.critical,
    Icon: CircleAlert,
  },
} as const;

export default function StockHealthCard({ state }: { state: StoreStockHealthState }) {
  const { colors, scheme } = useTheme();
  const styles = useThemeStyles(createStyles);
  const presentation = healthCopy[state];
  const isEmpty = state === "empty";
  const color = isEmpty
    ? colors.primary[600]
    : state === "healthy"
      ? colors.semantic.success
      : state === "warning"
        ? colors.semantic.warning
        : colors.semantic.danger;
  const background = isEmpty
    ? colors.primary[50]
    : state === "healthy"
      ? colors.semantic.successBackground
      : state === "warning"
        ? colors.semantic.warningBackground
        : colors.semantic.dangerBackground;
  const HealthIcon = presentation.Icon;

  return (
    <Card style={[styles.card, { backgroundColor: background, borderColor: background }]}>
      <View style={[styles.imageFrame, scheme === "dark" && { borderWidth: 1, borderColor: colors.white }]}>
        <Image accessible={false} source={presentation.image} resizeMode="contain" style={styles.image} />
      </View>
      <View style={styles.copy}>
        <View style={styles.heading}>
          <HealthIcon color={color} size={15} strokeWidth={2.5} />
          <Text style={styles.label}>Stock Health</Text>
        </View>
        <Text style={styles.title}>{presentation.title}</Text>
        <Text style={styles.message}>{presentation.message}</Text>
      </View>
    </Card>
  );
}
