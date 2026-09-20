import { useSQLiteContext } from "expo-sqlite";
import { lazy, Suspense, useCallback, useEffect, useRef, useState } from "react";

import StoreSwitchModal from "@/components/store/StoreSwitchModal";
import type { BottomNavKey } from "@/components/ui/BottomNavigation";
import {
  deleteOwnerStore,
  createStoreForBusiness,
  getOwnerStores,
  updateOwnerStore as updateOwnerStoreRecord,
  type OwnerStore,
} from "@/services/owner-store.service";
import type { StoreInput } from "@/validation/store.validation";

import { LoadErrorScreen, LoadingScreen } from "./HomeStatusScreens";

const OnboardingScreen = lazy(() => import("@/components/onboarding/OnboardingScreen"));
const OwnerStoreScreen = lazy(() => import("@/components/store/OwnerStoreScreen"));
const CatalogScreen = lazy(() => import("@/features/catalogs/CatalogScreen"));
const InventoryScreen = lazy(() => import("@/features/inventory/InventoryScreen"));
const InsightsScreen = lazy(() => import("@/features/insights/InsightsScreen"));

export default function HomeScreen() {
  const db = useSQLiteContext();
  const switchingRef = useRef(false);
  const [ownerStore, setOwnerStore] = useState<OwnerStore | null>(null);
  const [ownerStores, setOwnerStores] = useState<OwnerStore[]>([]);
  const [showEntry, setShowEntry] = useState(false);
  const [activeSection, setActiveSection] = useState<
    "dashboard" | "catalog" | "inventory" | "insights"
  >("dashboard");
  const [cameraRequest, setCameraRequest] = useState(0);
  const [catalogProductRequest, setCatalogProductRequest] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [isSwitching, setIsSwitching] = useState(false);
  const [error, setError] = useState(false);
  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    let active = true;
    setLoading(true);
    setError(false);

    getOwnerStores(db)
      .then((stores) => {
        if (active) {
          setOwnerStores(stores);
          setOwnerStore(stores[0] ?? null);
        }
      })
      .catch(() => {
        if (active) setError(true);
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => {
      active = false;
    };
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
    setOwnerStores(remainingStores);
    setOwnerStore(remainingStores[0] ?? null);
    setActiveSection("dashboard");
    setShowEntry(false);
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

  if (loading) return <LoadingScreen />;
  if (error) return <LoadErrorScreen onRetry={() => setAttempt((value) => value + 1)} />;

  const screen =
    ownerStore && !showEntry ? (
      activeSection === "inventory" ? (
        <InventoryScreen
          key={`${ownerStore.businessId}:${ownerStore.storeId}`}
          ownerStore={ownerStore}
          ownerStores={ownerStores}
          onSelectStore={switchStore}
          onCreateStore={createStore}
          onOpenCatalogProduct={openCatalogProduct}
          onNavigate={navigate}
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
          onImportInventory={() => setShowEntry(true)}
          productRequest={catalogProductRequest}
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
          onUpdateStore={updateStore}
          onDeleteStore={deleteStore}
          onNavigate={navigate}
          onExit={() => {
            setActiveSection("dashboard");
            setShowEntry(true);
          }}
        />
      )
    ) : ownerStore ? (
      <OnboardingScreen
        existingStores={ownerStores}
        selectedStore={ownerStore}
        onSelectStore={switchStore}
        onCreateStore={createStore}
        onComplete={(store) => {
          setOwnerStore(store);
          setActiveSection("dashboard");
          setShowEntry(false);
        }}
      />
    ) : (
      <OnboardingScreen
        onComplete={(store) => {
          setOwnerStores([store]);
          setOwnerStore(store);
          setActiveSection("dashboard");
          setShowEntry(false);
        }}
      />
    );

  return (
    <>
      <Suspense fallback={<LoadingScreen />}>{screen}</Suspense>
      <StoreSwitchModal visible={isSwitching} />
    </>
  );
}
