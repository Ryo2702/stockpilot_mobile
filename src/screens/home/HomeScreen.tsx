import { useSQLiteContext } from "expo-sqlite";
import { lazy, Suspense, useCallback, useRef, useState } from "react";

import PinScreen from "@/components/auth/PinScreen";
import StoreSwitchModal from "@/components/store/StoreSwitchModal";
import type { BottomNavKey } from "@/components/ui/BottomNavigation";
import useAsyncEffect from "@/hooks/useAsyncEffect";
import {
  deleteOwnerStore,
  createStoreForBusiness,
  getOwnerStores,
  updateOwnerName as updateOwnerNameRecord,
  updateOwnerStore as updateOwnerStoreRecord,
  type OwnerStore,
} from "@/services/owner-store.service";
import {
  getAppPin,
  getActiveStoreSelection,
  saveAppPin,
  saveActiveStoreSelection,
} from "@/services/settings.service";
import type { StoreInput } from "@/validation/store.validation";

import { LoadErrorScreen, LoadingScreen } from "./HomeStatusScreens";

const OnboardingScreen = lazy(() => import("@/components/onboarding/OnboardingScreen"));
const OwnerStoreScreen = lazy(() => import("@/components/store/OwnerStoreScreen"));
const CatalogScreen = lazy(() => import("@/features/catalogs/CatalogScreen"));
const InventoryScreen = lazy(() => import("@/features/inventory/InventoryScreen"));
const InsightsScreen = lazy(() => import("@/features/insights/InsightsScreen"));
const MoreScreen = lazy(() => import("@/features/settings/MoreScreen"));

type HomeSection = Exclude<BottomNavKey, "camera">;
type InventoryActionRequest = { id: number; action: "import" | "export" };
type AuthState = "checking" | "setup" | "locked" | "unlocked";

export default function HomeScreen() {
  const db = useSQLiteContext();
  const switchingRef = useRef(false);
  const inventoryActionSequence = useRef(0);
  const barcodeRequestSequence = useRef(0);
  const [ownerStore, setOwnerStore] = useState<OwnerStore | null>(null);
  const [ownerStores, setOwnerStores] = useState<OwnerStore[]>([]);
  const [storedPin, setStoredPin] = useState<string | null>(null);
  const [authState, setAuthState] = useState<AuthState>("checking");
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [activeSection, setActiveSection] = useState<HomeSection>("dashboard");
  const [inventoryActionRequest, setInventoryActionRequest] = useState<InventoryActionRequest | null>(null);
  const [cameraRequest, setCameraRequest] = useState(0);
  const [catalogProductRequest, setCatalogProductRequest] = useState<string | null>(null);
  const [catalogBarcodeRequest, setCatalogBarcodeRequest] = useState<{ id: number; code: string } | null>(null);
  const [loading, setLoading] = useState(true);
  const [isSwitching, setIsSwitching] = useState(false);
  const [error, setError] = useState(false);
  const [attempt, setAttempt] = useState(0);

  useAsyncEffect((isActive) => {
    setLoading(true);
    setError(false);

    Promise.all([getOwnerStores(db), getAppPin(db)])
      .then(async ([stores, pin]) => {
        const selection = await getActiveStoreSelection(db).catch(() => null);
        const selectedStore = stores.find(
          (store) => store.businessId === selection?.businessId && store.storeId === selection.storeId,
        ) ?? stores[0] ?? null;
        if (isActive()) {
          setOwnerStores(stores);
          setOwnerStore(selectedStore);
          setStoredPin(pin);
          setAuthState(stores.length ? (pin ? "locked" : "setup") : "unlocked");
        }
      })
      .catch(() => {
        if (isActive()) setError(true);
      })
      .finally(() => {
        if (isActive()) setLoading(false);
      });
  }, [attempt, db]);

  const switchStore = async (target: OwnerStore) => {
    const isSwitch =
      ownerStore?.storeId !== target.storeId || ownerStore?.businessId !== target.businessId;
    if (!isSwitch) return;
    if (switchingRef.current) throw new Error("A store switch is already in progress.");

    switchingRef.current = true;
    setIsSwitching(true);
    try {
      const stores = await getOwnerStores(db);
      const validStore = stores.find(
        (store) => store.storeId === target.storeId && store.businessId === target.businessId,
      );
      if (!validStore) throw new Error("The selected store is no longer available.");

      await saveActiveStoreSelection(db, {
        businessId: validStore.businessId,
        storeId: validStore.storeId,
      });
      setOwnerStores(stores);
      setOwnerStore(validStore);
    } finally {
      switchingRef.current = false;
      setIsSwitching(false);
    }
  };

  const createStore = async (storeInput: StoreInput) => {
    if (!ownerStore) throw new Error("No owner store is available.");
    const store = await createStoreForBusiness(db, ownerStore.businessId, storeInput);
    setOwnerStores((stores) => [...stores, store]);
    return store;
  };

  const updateStore = async (storeInput: StoreInput) => {
    if (!ownerStore) throw new Error("No owner store is available.");
    const details = await updateOwnerStoreRecord(
      db,
      ownerStore.businessId,
      ownerStore.storeId,
      storeInput,
    );
    const updatedStore: OwnerStore = {
      businessId: details.businessId,
      ownerName: details.ownerName,
      storeId: details.storeId,
      storeName: details.name,
      storeType: details.storeType,
    };
    setOwnerStore(updatedStore);
    setOwnerStores((stores) =>
      stores.map((store) =>
        store.storeId === updatedStore.storeId && store.businessId === updatedStore.businessId
          ? updatedStore
          : store,
      ),
    );
    return details;
  };

  const deleteStore = async () => {
    if (!ownerStore) throw new Error("No owner store is available.");
    await deleteOwnerStore(db, ownerStore.businessId, ownerStore.storeId);
    const remainingStores = ownerStores.filter(
      (store) =>
        store.storeId !== ownerStore.storeId || store.businessId !== ownerStore.businessId,
    );
    void saveActiveStoreSelection(
      db,
      remainingStores[0]
        ? { businessId: remainingStores[0].businessId, storeId: remainingStores[0].storeId }
        : null,
    ).catch(() => undefined);
    setOwnerStores(remainingStores);
    setOwnerStore(remainingStores[0] ?? null);
    setActiveSection("dashboard");
  };

  const updateOwnerName = async (businessId: string, name: string) => {
    const ownerName = await updateOwnerNameRecord(db, businessId, name);
    setOwnerStore((current) =>
      current?.businessId === businessId ? { ...current, ownerName } : current,
    );
    setOwnerStores((stores) =>
      stores.map((store) => store.businessId === businessId ? { ...store, ownerName } : store),
    );
  };

  const refreshStores = async () => {
    const stores = await getOwnerStores(db);
    const selection = await getActiveStoreSelection(db).catch(() => null);
    const selectedStore = stores.find(
      (store) => store.businessId === selection?.businessId && store.storeId === selection.storeId,
    ) ?? stores[0] ?? null;
    setOwnerStores(stores);
    setOwnerStore(selectedStore);
  };

  const completeOnboarding = (store: OwnerStore) => {
    setOwnerStores((stores) => stores.some(
      (current) => current.businessId === store.businessId && current.storeId === store.storeId,
    ) ? stores : [...stores, store]);
    setOwnerStore(store);
    setShowOnboarding(false);
    setActiveSection("dashboard");
    setAuthState(storedPin ? "locked" : "setup");
    void saveActiveStoreSelection(db, { businessId: store.businessId, storeId: store.storeId });
  };

  const openInventoryAction = (action: InventoryActionRequest["action"]) => {
    inventoryActionSequence.current += 1;
    setInventoryActionRequest({ id: inventoryActionSequence.current, action });
    setActiveSection("inventory");
  };

  const markInventoryActionHandled = (id: number) => {
    setInventoryActionRequest((current) => current?.id === id ? null : current);
  };

  const navigate = (key: BottomNavKey) => {
    if (key !== "camera") {
      setActiveSection(key);
    } else {
      setActiveSection("catalog");
      setCameraRequest((request) => request + 1);
    }
  };

  const openCatalogProduct = (productId: string) => {
    setCatalogProductRequest(productId);
    setActiveSection("catalog");
  };
  const handleCatalogProductRequest = useCallback(() => setCatalogProductRequest(null), []);
  const handleInventoryBarcode = (code: string) => {
    barcodeRequestSequence.current += 1;
    setCatalogBarcodeRequest({ id: barcodeRequestSequence.current, code });
    setActiveSection("catalog");
  };
  const acknowledgeCatalogBarcodeRequest = useCallback((id: number) => {
    setCatalogBarcodeRequest((current) => current?.id === id ? null : current);
  }, []);

  if (loading) return <LoadingScreen />;
  if (error) return <LoadErrorScreen onRetry={() => setAttempt((value) => value + 1)} />;

  const screen = showOnboarding ? (
    <OnboardingScreen
      existingStores={ownerStores}
      selectedStore={ownerStore ?? undefined}
      onSelectStore={switchStore}
      onCreateStore={createStore}
      onComplete={completeOnboarding}
    />
  ) : authState === "setup" ? (
    <PinScreen
      mode="setup"
      ownerName={ownerStore?.ownerName}
      onSubmit={async (pin) => {
        await saveAppPin(db, pin);
        setStoredPin(pin);
        setAuthState("unlocked");
        return true;
      }}
    />
  ) : authState === "locked" ? (
    <PinScreen
      mode="unlock"
      ownerName={ownerStore?.ownerName}
      onSubmit={async (pin) => {
        const valid = pin === storedPin;
        if (valid) setAuthState("unlocked");
        return valid;
      }}
    />
  ) : ownerStore ? (
    activeSection === "more" ? (
      <MoreScreen
        ownerStore={ownerStore}
        ownerStores={ownerStores}
        onSelectStore={switchStore}
        onCreateStore={createStore}
        onUpdateStore={updateStore}
        onUpdateOwnerName={updateOwnerName}
        onDeleteStore={deleteStore}
        onOpenStoreManagement={() => setActiveSection("dashboard")}
        onOpenInventoryAction={openInventoryAction}
        onRestoreComplete={refreshStores}
        onNavigate={navigate}
        onPinChanged={setStoredPin}
        onExit={() => {
          setShowOnboarding(true);
          setActiveSection("dashboard");
        }}
      />
    ) : activeSection === "inventory" ? (
      <InventoryScreen
        key={`${ownerStore.businessId}:${ownerStore.storeId}`}
        ownerStore={ownerStore}
        ownerStores={ownerStores}
        onSelectStore={switchStore}
        onCreateStore={createStore}
        onOpenCatalogProduct={openCatalogProduct}
        onScanBarcode={handleInventoryBarcode}
        onNavigate={navigate}
        actionRequest={inventoryActionRequest}
        onActionRequestHandled={markInventoryActionHandled}
      />
    ) : activeSection === "insights" ? (
      <InsightsScreen
        key={`${ownerStore.businessId}:${ownerStore.storeId}`}
        ownerStore={ownerStore}
        ownerStores={ownerStores}
        onSelectStore={switchStore}
        onCreateStore={createStore}
        onNavigate={navigate}
      />
    ) : activeSection === "catalog" ? (
      <CatalogScreen
        ownerStore={ownerStore}
        ownerStores={ownerStores}
        onSelectStore={switchStore}
        onCreateStore={createStore}
        onImportInventory={() => openInventoryAction("import")}
        productRequest={catalogProductRequest}
        barcodeRequest={catalogBarcodeRequest}
        onBarcodeRequestHandled={acknowledgeCatalogBarcodeRequest}
        onProductRequestHandled={handleCatalogProductRequest}
        onNavigate={navigate}
        cameraRequest={cameraRequest}
        onCameraRequestHandled={() => setCameraRequest(0)}
      />
    ) : (
      <OwnerStoreScreen
        ownerStore={ownerStore}
        ownerStores={ownerStores}
        onSelectStore={switchStore}
        onCreateStore={createStore}
        onNavigate={navigate}
      />
    )
  ) : (
    <OnboardingScreen
      onComplete={completeOnboarding}
    />
  );

  return (
    <>
      <Suspense fallback={<LoadingScreen />}>{screen}</Suspense>
      <StoreSwitchModal visible={isSwitching} />
    </>
  );
}
