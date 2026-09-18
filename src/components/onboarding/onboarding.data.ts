import { Lightbulb, Package, Store, Zap, type LucideIcon } from "lucide-react-native";

import { colors } from "@/theme";
import { ownerNameSchema } from "@/validation/store.validation";

export const mascotVideo = require("../../../assets/mascot-clean.mp4");
export { ownerNameSchema };

export const features: Array<{
  title: string;
  description: string;
  icon: LucideIcon;
  color: string;
  background: string;
}> = [
  {
    title: "Multiple Stores",
    description: "Manage all your stores independently.",
    icon: Store,
    color: colors.primary[600],
    background: colors.primary[50],
  },
  {
    title: "Track Inventory",
    description: "Know what's in stock, low, or out of stock.",
    icon: Package,
    color: colors.semantic.success,
    background: colors.semantic.successBackground,
  },
  {
    title: "Get Insights",
    description: "See helpful insights to make better decisions.",
    icon: Lightbulb,
    color: colors.semantic.warning,
    background: colors.semantic.warningBackground,
  },
  {
    title: "Work Offline",
    description: "Your data stays on your device, always.",
    icon: Zap,
    color: "#8b5cf6",
    background: "#f5f3ff",
  },
];

export const nextSteps = [
  "Create your first store",
  "Add your products",
  "Start managing your inventory",
];
