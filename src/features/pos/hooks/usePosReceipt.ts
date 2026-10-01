import { useEffect, useState } from "react";
import type { SQLiteDatabase } from "expo-sqlite";
import type { PosTransaction } from "@/domain/pos";
import type { OwnerStore } from "@/services/owner-store.service";
import { getPosTransaction } from "@/services/pos.service";
import { createPosReceiptPdf } from "@/services/pos-receipt.service";

export default function usePosReceipt({ db, ownerStore, onError, onHistoryError }: { db: SQLiteDatabase; ownerStore: OwnerStore; onError: (message: string) => void; onHistoryError: (message: string) => void }) {
  const [receipt, setReceipt] = useState<PosTransaction | null>(null);
  const [fileUri, setFileUri] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  useEffect(() => { setReceipt(null); setFileUri(null); }, [ownerStore.businessId, ownerStore.storeId]);
  const showReceipt = (value: PosTransaction) => { setReceipt(value); setFileUri(null); };
  const createReceipt = async () => {
    if (!receipt) return null;
    if (fileUri) return fileUri;
    setLoading(true);
    try { const uri = await createPosReceiptPdf(receipt); setFileUri(uri); return uri; }
    catch { onError("Couldn't generate the receipt PDF."); return null; }
    finally { setLoading(false); }
  };
  const openTransaction = async (id: string) => {
    onHistoryError(""); setFileUri(null); setLoading(true);
    try { setReceipt(await getPosTransaction(db, ownerStore, id)); }
    catch { onHistoryError("Couldn't load the purchase details."); }
    finally { setLoading(false); }
  };
  const close = () => { setReceipt(null); setFileUri(null); onError(""); };
  return { receipt, fileUri, loading, showReceipt, createReceipt, openTransaction, close };
}
