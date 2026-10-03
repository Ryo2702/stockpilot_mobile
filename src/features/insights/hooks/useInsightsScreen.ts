import { useSQLiteContext } from "expo-sqlite";
import { useCallback, useEffect, useState } from "react";

import useAsyncEffect from "@/hooks/useAsyncEffect";
import useDebouncedValue from "@/hooks/useDebouncedValue";
import type { OwnerStore } from "@/services/owner-store.service";
import {
  getInsightReportHistory,
  getStoreInsights,
  createInsightsExcel,
  defaultInsightFilters,
  saveInsightsReport,
  type InsightCustomRange,
  type InsightPeriod,
  type InsightReport,
  type InsightReportType,
  type InsightFilters,
  type StoreInsights,
} from "@/services/insights";

export default function useInsightsScreen(ownerStore: OwnerStore) {
  const db = useSQLiteContext();
  const [period, setPeriodState] = useState<InsightPeriod>("this_month");
  const [customRange, setCustomRange] = useState<InsightCustomRange | null>(null);
  const [filters, setFilters] = useState<InsightFilters>(() => defaultInsightFilters(ownerStore));
  const [debouncedProductQuery] = useDebouncedValue(filters.productQuery, 250);
  const [data, setData] = useState<StoreInsights | null>(null);
  const [reports, setReports] = useState<InsightReport[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    setFilters(defaultInsightFilters(ownerStore));
  }, [ownerStore.businessId, ownerStore.storeId]);

  useAsyncEffect((isActive) => {
    setLoading(true);
    setError(null);

    Promise.all([
      getStoreInsights(db, ownerStore, period, customRange, { ...filters, productQuery: debouncedProductQuery.trim() }),
      getInsightReportHistory(db, ownerStore),
    ])
      .then(([insights, history]) => {
        if (!isActive()) return;
        setData(insights);
        setReports(history);
      })
      .catch((reason: unknown) => {
        if (!isActive()) return;
        setError(reason instanceof Error ? reason.message : "The local insights data could not be read.");
      })
      .finally(() => {
        if (isActive()) setLoading(false);
      });
  }, [attempt, customRange, db, debouncedProductQuery, filters.category, filters.storeId, ownerStore, period]);

  const choosePeriod = useCallback((next: InsightPeriod, range?: InsightCustomRange) => {
    if (next === "custom" && range) setCustomRange(range);
    setData(null);
    setPeriodState(next);
    setAttempt((value) => value + 1);
  }, []);

  const reload = useCallback(() => setAttempt((value) => value + 1), []);

  const updateFilters = useCallback((next: Partial<InsightFilters>) => {
    setFilters((current) => ({ ...current, ...next }));
  }, []);

  const generateReport = useCallback(async (type: InsightReportType) => {
    if (!data) throw new Error("Insights are still loading.");
    const report = await saveInsightsReport(db, ownerStore, data, type);
    setReports((items) => [report, ...items].slice(0, 20));
    return report;
  }, [data, db, ownerStore]);

  const createExcel = useCallback(async () => {
    if (!data) throw new Error("Insights are still loading.");
    return createInsightsExcel(db, ownerStore, data);
  }, [data, db, ownerStore]);

  return {
    period,
    customRange,
    filters,
    updateFilters,
    choosePeriod,
    data,
    reports,
    loading,
    error,
    reload,
    generateReport,
    createExcel,
  };
}
