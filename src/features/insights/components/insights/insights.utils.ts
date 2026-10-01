import { catalogCategoryOptions } from "@/data/catalog.data";
import type { InsightPeriod, StoreInsights } from "@/services/insights";

export function formatNumber(value: number) {
  return new Intl.NumberFormat(undefined, { maximumFractionDigits: 1 }).format(value);
}

export function formatQuantity(value: number, unit: string) {
  return `${formatNumber(value)} ${unit}`;
}

export function periodTitle(period: InsightPeriod) {
  return {
    today: "Today", "7_days": "7 Days", "30_days": "30 Days", this_month: "This Month",
    last_month: "Last Month", "3_months": "3 Months", "6_months": "6 Months",
    this_year: "This Year", custom: "Custom Range",
  }[period];
}

export function movementChange(current: number, previous: number, comparison = "the previous period") {
  if (previous === 0) return current === 0 ? "No activity" : "New activity";
  const percent = Math.round(((current - previous) / Math.abs(previous)) * 100);
  if (percent === 0) return "No change";
  return `${percent > 0 ? "+" : ""}${percent}% vs ${comparison}`;
}

export function revenueChange(current: number, previous: number, comparison: string) {
  if (previous === 0) return current === 0 ? "No revenue recorded" : "New revenue recorded";
  const percent = Math.round(((current - previous) / Math.abs(previous)) * 100);
  return percent === 0 ? `No change vs ${comparison}` : `${percent > 0 ? "+" : ""}${percent}% vs ${comparison}`;
}

export function categoryName(category: string) {
  return catalogCategoryOptions.find((option) => option.value === category)?.label ?? category;
}

export function daysSince(date: string | null) {
  if (!date) return "No movement recorded";
  const days = Math.max(0, Math.floor((Date.now() - new Date(date).getTime()) / 86400000));
  return days === 0 ? "Today" : `${days} days ago`;
}

export function dataFindings(data: StoreInsights) {
  const findings: string[] = [];
  if (data.health.critical) findings.push(`${data.health.critical} ${data.health.critical === 1 ? "product is" : "products are"} currently critical with zero available stock.`);
  if (data.health.low) findings.push(`${data.health.low} ${data.health.low === 1 ? "product is" : "products are"} at or below its reorder level.`);
  if (data.products.noMovementCount) findings.push(`${data.products.noMovementCount} products had no stock movement in the last 30 days.`);
  const top = data.products.topMoving[0];
  if (top) findings.push(`${top.name} had the highest outgoing movement in ${data.period.label.toLowerCase()} (${formatQuantity(top.stockOut, top.unit)}).`);
  if (!data.movement.stockIn && !data.movement.stockOut && !data.movement.adjustments) findings.push(`No stock movements were recorded for ${data.period.label.toLowerCase()}.`);
  return findings.slice(0, 4);
}
