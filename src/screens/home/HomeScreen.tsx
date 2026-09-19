import { useSQLiteContext } from "expo-sqlite";
import { lazy, Suspense, useEffect, useRef, useState } from "react";

import StoreSwitchModal from "@/components/store/StoreSwitchModal";
import {
  createStoreForBusiness,
  getOwnerStores,
  type OwnerStore,
} from "@/services/owner-store.service";
import type { StoreInput } from "@/validation/store.validation";

import { LoadErrorScreen, LoadingScreen } from "./HomeStatusScreens";

const OnboardingScreen = lazy(() => import("@/components/onboarding/OnboardingScreen"));
const OwnerStoreScreen = lazy(() => import("@/components/store/OwnerStoreScreen"));

export default function HomeScreen() {
  const db = useSQLiteContext();
  const switchingRef = useRef(false);
  const [ownerStore, setOwnerStore] = useState<OwnerStore | null>(null);
  const [ownerStores, setOwnerStores] = useState<OwnerStore[]>([]);
  const [showEntry, setShowEntry] = useState(false);
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

  if (loading) return <LoadingScreen />;
  if (error) return <LoadErrorScreen onRetry={() => setAttempt((value) => value + 1)} />;

  const screen =
    ownerStore && !showEntry ? (
      <OwnerStoreScreen
        ownerStore={ownerStore}
        ownerStores={ownerStores}
        onSelectStore={switchStore}
        onCreateStore={createStore}
        onExit={() => setShowEntry(true)}
      />
    ) : ownerStore ? (
      <OnboardingScreen
        existingStores={ownerStores}
        selectedStore={ownerStore}
        onSelectStore={switchStore}
        onCreateStore={createStore}
        onComplete={(store) => {
          setOwnerStore(store);
          setShowEntry(false);
        }}
      />
    ) : (
      <OnboardingScreen
        onComplete={(store) => {
          setOwnerStores([store]);
          setOwnerStore(store);
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
