import { CalendarDays, Download, FileText } from "lucide-react-native";
import { formatCurrency } from "@/domain/currency";
import { insightPeriods, type InsightPeriod } from "@/services/insights";

export const periodLabels: Record<InsightPeriod, string> = { today: "Today", "7_days": "7 Days", "30_days": "30 Days", this_month: "This Month", last_month: "Last Month", "3_months": "3 Months", "6_months": "6 Months", this_year: "This Year", custom: "Custom Range" };
export const reportActionRows = [
  { id: "generate", label: "Generate Report", icon: FileText },
  { id: "export", label: "Export Report (Excel)", icon: Download },
  { id: "history", label: "Report History", icon: CalendarDays },
] as const;

export function isValidDate(value: string) {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value.trim());
  if (!match) return false;
  const date = new Date(Number(match[1]), Number(match[2]) - 1, Number(match[3]));
  return date.getFullYear() === Number(match[1]) && date.getMonth() === Number(match[2]) - 1 && date.getDate() === Number(match[3]);
}

export function todayString() {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`;
}

export const formatNumber = (value: number) => new Intl.NumberFormat(undefined, { maximumFractionDigits: 1 }).format(value);
export const formatQuantity = (value: number, unit: string) => `${formatNumber(value)} ${unit}`;
export { formatCurrency };

export function movementFinding(name: string, current: number, previous: number, comparisonLabel: string) {
  if (previous === 0) return current === 0 ? `No ${name.toLowerCase()} was recorded in either period.` : `${name} was ${formatNumber(current)}; none was recorded in ${comparisonLabel}.`;
  const difference = current - previous;
  if (difference === 0) return `${name} was unchanged compared with ${comparisonLabel}.`;
  const percent = Math.round(Math.abs(difference / Math.abs(previous)) * 100) || "less than 1%";
  return `${name} ${difference > 0 ? "increased" : "decreased"} ${typeof percent === "number" ? `${percent}%` : percent} compared with ${comparisonLabel}.`;
}

export function revenueFinding(current: number, previous: number, comparisonLabel: string) {
  if (previous === 0) return current === 0 ? "No revenue was recorded in either period." : `Revenue was recorded; none was recorded in ${comparisonLabel}.`;
  const difference = current - previous;
  if (difference === 0) return `Revenue was unchanged compared with ${comparisonLabel}.`;
  const percent = Math.round(Math.abs(difference / Math.abs(previous)) * 100) || "less than 1%";
  return `Revenue ${difference > 0 ? "increased" : "decreased"} ${typeof percent === "number" ? `${percent}%` : percent} compared with ${comparisonLabel}.`;
}
