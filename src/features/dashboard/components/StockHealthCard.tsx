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
    minHeight: 124,
    padding: spacing[3],
  },
  imageFrame: {
    width: 112,
    height: 112,
    alignItems: "center" as const,
    justifyContent: "center" as const,
    borderRadius: radii.full,
  },
  image: { width: 112, height: 112, flexShrink: 0 },
  copy: { flex: 1, minWidth: 0, gap: spacing[1] },
  heading: {
    flexDirection: "row" as const,
    alignItems: "center" as const,
    gap: spacing[1],
  },
  label: {
    ...typography.caption,
    fontWeight: "600" as const,
    color: colors.text.primary,
  },
  title: { ...typography.label, fontWeight: "700" as const },
  message: { ...typography.caption, color: colors.text.secondary },
});

const healthCopy = {
  empty: {
    title: "Add products to track stock.",
    message: "Stock health will appear here once your catalog has products.",
    image: healthImages.healthy,
    Icon: Boxes,
  },
  healthy: {
    title: "Inventory looks stable!",
    message: "Great job! Most of your products are well stocked.",
    image: healthImages.healthy,
    Icon: CircleCheck,
  },
  warning: {
    title: "Some products need restocking soon.",
    message: "Keep an eye on low stock items to avoid stockouts.",
    image: healthImages.warning,
    Icon: TriangleAlert,
  },
  critical: {
    title: "Urgent stock attention required!",
    message: "Several products are critically low. Take action now to avoid stockouts.",
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
      <View style={[styles.imageFrame, scheme === "dark" && { backgroundColor: colors.white }]}>
        <Image accessible={false} source={presentation.image} resizeMode="contain" style={styles.image} />
      </View>
      <View style={styles.copy}>
        <View style={styles.heading}>
          <HealthIcon color={color} size={15} strokeWidth={2.5} />
          <Text style={styles.label}>Stock Health</Text>
        </View>
        <Text style={[styles.title, { color }]}>{presentation.title}</Text>
        <Text style={styles.message}>{presentation.message}</Text>
      </View>
    </Card>
  );
}
