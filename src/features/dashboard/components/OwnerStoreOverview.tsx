import { View } from "react-native";

import type { BottomNavKey } from "@/components/ui/BottomNavigation";
import type { OwnerStoreOverview as OwnerStoreOverviewData } from "@/services/owner-store.service";
import { getStoreStockHealthState } from "@/services/stock-health.service";
import { spacing } from "@/theme";

import QuickActions from "./QuickActions";
import StockHealthCard from "./StockHealthCard";
import StoreStatusCards from "./StoreStatusCards";

type OwnerStoreOverviewProps = {
  overview: OwnerStoreOverviewData | null;
  onNavigate?: (key: BottomNavKey) => void;
};

export default function OwnerStoreOverview({ overview, onNavigate }: OwnerStoreOverviewProps) {
  const healthState = getStoreStockHealthState({
    productCount: overview?.productCount ?? 0,
    lowStockCount: overview?.lowStockCount ?? 0,
    criticalCount: overview?.criticalCount ?? 0,
  });

  return (
    <View style={{ gap: spacing[3] }}>
      <StoreStatusCards overview={overview} />
      <StockHealthCard state={healthState} />
      <QuickActions onNavigate={onNavigate} />
    </View>
  );
}
