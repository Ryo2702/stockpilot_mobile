import { Directory } from "expo-file-system";
import { MoreVertical, Package, RefreshCw } from "lucide-react-native";
import { useState, type ReactNode } from "react";
import { Platform, Pressable, ScrollView, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import StoreSelector from "@/components/store/StoreSelector";
import { BottomNavigation, type BottomNavKey } from "@/components/ui/BottomNavigation";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { IconButton } from "@/components/ui/IconButton";
import ScreenHeader from "@/components/ui/ScreenHeader";
import ThemeToggle from "@/components/ui/ThemeToggle";
import type { InsightCategory, InsightProduct, InsightReport, InsightReportType } from "@/services/insights";
import { useTheme, useThemeStyles } from "@/theme/ThemeProvider";

import useInsightsScreen from "../hooks/useInsightsScreen";
import { CategoryInsightSheet, InsightPeriodSheet, InsightsMoreSheet, ProductInsightSheet, ReportDetailSheet } from "./InsightSheets";
import OverviewContent from "./insights/OverviewContent";
import ReportsContent from "./insights/ReportsContent";
import TrendsContent from "./insights/TrendsContent";
import { PeriodControl } from "./insights/InsightBasics";
import { createInsightsStyles, type InsightsStyles } from "./insights/insights.styles";
import type { InsightsTab, TrendsTab } from "./insights/insights.types";
import type { InsightsScreenProps } from "../types";

type Controller = ReturnType<typeof useInsightsScreen>;

export default function InsightsScreenView({ ownerStore, ownerStores, onSelectStore, onCreateStore, onNavigate, insights }: InsightsScreenProps & { insights: Controller }) {
  const styles = useThemeStyles(createInsightsStyles); const { colors } = useTheme();
  const [activeTab, setActiveTab] = useState<InsightsTab>("overview"); const [trendsTab, setTrendsTab] = useState<TrendsTab>("movement"); const [periodVisible, setPeriodVisible] = useState(false); const [moreVisible, setMoreVisible] = useState(false); const [selectedProduct, setSelectedProduct] = useState<InsightProduct | null>(null); const [selectedCategory, setSelectedCategory] = useState<InsightCategory | null>(null); const [selectedReport, setSelectedReport] = useState<InsightReport | null>(null); const [generating, setGenerating] = useState(false); const [message, setMessage] = useState("");
  const showMessage = (value: string) => setMessage(value);
  const exportReport = async () => {
    if (!insights.data) return;
    try { const csv = await insights.createCsv(); const slug = ownerStore.storeName.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, ""); const fileName = `stockpilot-${slug}-${new Date().toISOString().slice(0, 10)}.csv`; if (Platform.OS === "web") { const url = URL.createObjectURL(new Blob([csv], { type: "text/csv;charset=utf-8" })); const link = document.createElement("a"); link.href = url; link.download = fileName; link.click(); setTimeout(() => URL.revokeObjectURL(url), 1000); } else await (await Directory.pickDirectoryAsync()).createFile(fileName, "text/csv").write(csv); showMessage(`CSV report saved for ${ownerStore.storeName}.`); } catch (error) { showMessage(error instanceof Error ? `Report couldn't be exported. ${error.message}` : "Report couldn't be exported. Try again."); }
  };
  const generateReport = async (type: InsightReportType) => { setGenerating(true); try { setSelectedReport(await insights.generateReport(type)); showMessage("Report saved to this store's local history."); } catch (error) { showMessage(error instanceof Error ? error.message : "Report couldn't be generated. Try again."); } finally { setGenerating(false); } };
  const moreAction = (action: "generate" | "export" | "history") => { setMoreVisible(false); if (action === "generate") { setActiveTab("reports"); void generateReport("monthly"); } else if (action === "export") void exportReport(); else setActiveTab("reports"); };
  return <SafeAreaView style={styles.safeArea} edges={["top", "bottom"]}><View style={styles.screen}><ScrollView style={styles.scroll} contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}><ScreenHeader title="Insights" subtitle="Understand how your inventory is changing." actions={<View style={styles.headerActions}><ThemeToggle /><IconButton icon={MoreVertical} label="Insights actions" size={22} onPress={() => setMoreVisible(true)} style={{ width: 44, height: 44 }} /></View>} context={<StoreSelector ownerStore={ownerStore} ownerStores={ownerStores} onSelectStore={onSelectStore} onCreateStore={onCreateStore} />} /><Tabs active={activeTab} onSelect={setActiveTab} />{insights.data ? <View style={styles.row}><Text style={[styles.caption, { flex: 1 }]}>{activeTab === "trends" ? "Product activity period" : "Reporting period"}</Text><PeriodControl period={insights.data.period.period} label={insights.data.period.label} onPress={() => setPeriodVisible(true)} /></View> : null}{message ? <Pressable accessibilityRole="button" onPress={() => setMessage("")} style={styles.notice}><Text style={styles.noticeText}>{message}</Text></Pressable> : null}<Body insights={insights} activeTab={activeTab} trendsTab={trendsTab} onTrendsTab={setTrendsTab} onNavigate={onNavigate} onSelectProduct={setSelectedProduct} onSelectCategory={setSelectedCategory} reports={insights.data ? <ReportsContent data={insights.data} ownerStore={ownerStore} ownerStores={ownerStores} filters={insights.filters} onFiltersChange={insights.updateFilters} reports={insights.reports} onGenerate={(type) => void generateReport(type)} onSelectReport={setSelectedReport} onExport={() => void exportReport()} generating={generating} /> : null} styles={styles} colors={colors} /></ScrollView><BottomNavigation activeKey="insights" onChange={onNavigate} /></View><InsightPeriodSheet visible={periodVisible} selected={insights.period} customRange={insights.customRange} onClose={() => setPeriodVisible(false)} onSelect={(period, range) => { insights.choosePeriod(period, range); setPeriodVisible(false); }} /><InsightsMoreSheet visible={moreVisible} onClose={() => setMoreVisible(false)} onAction={moreAction} onMore={() => onNavigate("more")} /><ProductInsightSheet product={selectedProduct} onClose={() => setSelectedProduct(null)} onViewInventory={() => { setSelectedProduct(null); onNavigate("inventory"); }} /><CategoryInsightSheet category={selectedCategory} onClose={() => setSelectedCategory(null)} /><ReportDetailSheet report={selectedReport} currency={insights.data?.currency} onClose={() => setSelectedReport(null)} /></SafeAreaView>;
}

function Tabs({ active, onSelect }: { active: InsightsTab; onSelect: (tab: InsightsTab) => void }) {
  const styles = useThemeStyles(createInsightsStyles); return <View style={styles.tabs}>{(["overview", "trends", "reports"] as const).map((tab) => <Pressable key={tab} accessibilityRole="tab" accessibilityState={{ selected: active === tab }} onPress={() => onSelect(tab)} style={[styles.tab, active === tab && styles.tabActive]}><Text style={[styles.tabLabel, active === tab && styles.tabLabelActive]}>{tab[0].toUpperCase() + tab.slice(1)}</Text></Pressable>)}</View>;
}

function Body({ insights, activeTab, trendsTab, onTrendsTab, onNavigate, onSelectProduct, onSelectCategory, reports, styles, colors }: { insights: Controller; activeTab: InsightsTab; trendsTab: TrendsTab; onTrendsTab: (tab: TrendsTab) => void; onNavigate: (key: BottomNavKey) => void; onSelectProduct: (product: InsightProduct) => void; onSelectCategory: (category: InsightCategory) => void; reports: ReactNode; styles: InsightsStyles; colors: ReturnType<typeof useTheme>["colors"] }) {
  if (insights.error) return <Card style={styles.card}><Text style={styles.sectionTitle}>Insights couldn&apos;t be updated</Text><Text style={styles.errorText}>{insights.error}. Your inventory data is unchanged.</Text><Button title="Try Again" icon={RefreshCw} onPress={insights.reload} /></Card>;
  if (insights.loading && !insights.data) return <View style={{ gap: 12 }}><View style={styles.loadPlaceholder} /><View style={styles.loadPlaceholder} /><View style={styles.loadPlaceholder} /></View>;
  if (!insights.data) return null;
  if (insights.data.health.total === 0) { const filtered = Boolean(insights.data.filters.category || insights.data.filters.productQuery); return <Card style={styles.card}><View style={styles.emptyWrap}><Package size={30} color={colors.primary[500]} /><Text style={styles.emptyTitle}>{filtered ? "No matching report data" : "No insights yet"}</Text><Text style={styles.emptyCopy}>{filtered ? "Try a different product or category filter." : "Keep recording inventory movements. Reports and trends will appear once there is activity in this store."}</Text>{filtered ? null : <Button title="Go to Inventory" onPress={() => onNavigate("inventory")} />}</View></Card>; }
  return activeTab === "overview" ? <OverviewContent data={insights.data} onSelectProduct={onSelectProduct} onSelectCategory={onSelectCategory} onNavigate={onNavigate} /> : activeTab === "trends" ? <TrendsContent data={insights.data} selected={trendsTab} onSelect={onTrendsTab} onSelectProduct={onSelectProduct} /> : reports;
}
