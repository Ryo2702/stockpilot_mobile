import type { BottomNavKey } from "@/components/ui/BottomNavigation";
import type { InsightPeriod, InsightProduct, StoreInsights } from "@/services/insights";

export type InsightsTab = "overview" | "trends" | "reports";
export type TrendsTab = "movement" | "health" | "activity";

export type ProductSelect = (product: InsightProduct) => void;
export type Navigate = (key: BottomNavKey) => void;
export type InsightsData = StoreInsights;
export type PeriodSelect = (period: InsightPeriod) => void;
