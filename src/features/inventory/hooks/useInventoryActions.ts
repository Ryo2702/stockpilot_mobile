import type { SQLiteDatabase } from "expo-sqlite";
import { useEffect, useState } from "react";

import {
  InsufficientStockError,
  InventoryItemNotFoundError,
  InvalidStockAdjustmentError,
  NoStockChangeError,
} from "@/domain/inventory.errors";
import {
  applyStockChange,
  exportInventoryCsv,
  type getInventoryDetail,
} from "@/services/inventory";
import type { OwnerStore } from "@/services/owner-store.service";
import type { StockAdjustmentInput } from "@/validation/inventory.validation";

type InventoryDetail = Awaited<ReturnType<typeof getInventoryDetail>>;

type UseInventoryActionsOptions = {
  db: SQLiteDatabase;
  ownerStore: OwnerStore;
  detail: InventoryDetail | null;
  onReload: () => void;
  onMessage: (message: string) => void;
};

export default function useInventoryActions({
  db,
  ownerStore,
  detail,
  onReload,
  onMessage,
}: UseInventoryActionsOptions) {
  const [actionError, setActionError] = useState("");
  const [adjustVisible, setAdjustVisible] = useState(false);
  const [savingStock, setSavingStock] = useState(false);

  useEffect(() => {
    setAdjustVisible(false);
    setActionError("");
  }, [ownerStore.businessId, ownerStore.storeId]);

  const changeStock = async (input: StockAdjustmentInput) => {
    if (!detail) return false;
    setSavingStock(true);
    setActionError("");
    try {
      await applyStockChange(db, ownerStore, detail.item.id, input);
      setAdjustVisible(false);
      onMessage("Stock updated and movement recorded.");
      onReload();
      return true;
    } catch (error) {
      const unit = detail.item.unit;
      if (error instanceof InsufficientStockError) {
        setActionError(`Only ${error.currentStock ?? detail.item.quantity} ${unit} are currently available.`);
      } else if (error instanceof NoStockChangeError) {
        setActionError(error.message);
      } else if (error instanceof InvalidStockAdjustmentError || error instanceof InventoryItemNotFoundError) {
        setActionError(error.message);
      } else {
        setActionError("Stock wasn't updated. Your previous stock quantity is unchanged. Try again.");
      }
      return false;
    } finally {
      setSavingStock(false);
    }
  };

  return {
    adjustVisible,
    openAdjustment: () => {
      setActionError("");
      setAdjustVisible(true);
    },
    closeAdjustment: () => {
      if (!savingStock) {
        setAdjustVisible(false);
        setActionError("");
      }
    },
    savingStock,
    actionError,
    changeStock,
    createExportCsv: () => exportInventoryCsv(db, ownerStore),
  };
}
