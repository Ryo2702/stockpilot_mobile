import type { InsightCategory, InsightProduct, StoreInsights } from "@/services/insights";
import { InsightCharts } from "./OverviewVisuals";
import { InventoryHealth, KeyFindings, PeriodComparison } from "./OverviewCards";
import { CategoryInsights, NextChecks } from "./OverviewListsB";
import { ReviewProducts, TopMoving } from "./OverviewListsA";

export default function OverviewContent({ data, onSelectProduct, onSelectCategory, onNavigate }: { data: StoreInsights; onSelectProduct: (product: InsightProduct) => void; onSelectCategory: (category: InsightCategory) => void; onNavigate: (key: "inventory") => void }) {
  return <><InventoryHealth data={data} onNavigate={onNavigate} /><InsightCharts data={data} /><PeriodComparison data={data} /><KeyFindings data={data} /><ReviewProducts data={data} onSelectProduct={onSelectProduct} onNavigate={onNavigate} /><TopMoving data={data} onSelectProduct={onSelectProduct} /><CategoryInsights data={data} onSelectCategory={onSelectCategory} /><NextChecks data={data} onNavigate={onNavigate} /></>;
}
