import { useState } from "react";
import { useSQLiteContext } from "expo-sqlite";
import useAsyncEffect from "@/hooks/useAsyncEffect";
import type { PosTransactionSummary } from "@/domain/pos";
import type { OwnerStore } from "@/services/owner-store.service";
import { listPosTransactions } from "@/services/pos.service";

export default function usePosHistory(ownerStore: OwnerStore, enabled: boolean) {
  const db = useSQLiteContext();
  const [history, setHistory] = useState<PosTransactionSummary[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  useAsyncEffect((isActive) => {
    if (!enabled) return;
    setLoading(true); setError("");
    listPosTransactions(db, ownerStore).then((items) => { if (isActive()) setHistory(items); }).catch((reason) => { if (isActive()) setError(reason instanceof Error ? reason.message : "Couldn't load purchase history."); }).finally(() => { if (isActive()) setLoading(false); });
  }, [db, enabled, ownerStore]);
  return { history, loading, error, setError };
}
