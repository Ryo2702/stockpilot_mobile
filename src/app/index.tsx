import { useSQLiteContext } from "expo-sqlite";
import { useEffect, useState } from "react";
import { ActivityIndicator, Image, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { VideoView, useVideoPlayer } from "expo-video";

import OnboardingScreen from "@/components/onboarding/OnboardingScreen";
import StoreSelector from "@/components/store/StoreSelector";
import OwnerStoreScreen from "@/components/store/OwnerStoreScreen";
import { Button } from "@/components/ui/Button";
import { mascotVideo } from "@/components/onboarding/onboarding.data";
import { createStoreForBusiness, getOwnerStores, type OwnerStore } from "@/services/owner-store.service";
import { colors, spacing, typography } from "@/theme";
import type { StoreInput } from "@/validation/store.validation";

const headMascot = require("../../assets/images/stockpilot/headMascot-transparent.png");

export default function IndexScreen() {
  const db = useSQLiteContext();
  const [ownerStore, setOwnerStore] = useState<OwnerStore | null>(null);
  const [ownerStores, setOwnerStores] = useState<OwnerStore[]>([]);
  const [showEntry, setShowEntry] = useState(false);
  const [loading, setLoading] = useState(true);
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

  if (loading) return <LoadingScreen />;
  if (error) return <LoadErrorScreen onRetry={() => setAttempt((value) => value + 1)} />;
  if (ownerStore && !showEntry) {
    return (
      <OwnerStoreScreen
        ownerStore={ownerStore}
        ownerStores={ownerStores}
        onSelectStore={async (store) => {
          setOwnerStore(store);
        }}
        onCreateStore={async (storeInput: StoreInput) => {
          const store = await createStoreForBusiness(db, ownerStore.businessId, storeInput);
          setOwnerStores((stores) => [...stores, store]);
          setOwnerStore(store);
          return store;
        }}
        onExit={() => setShowEntry(true)}
      />
    );
  }

  if (ownerStore && showEntry) {
    return (
      <OwnerEntryScreen
        ownerStore={ownerStore}
        ownerStores={ownerStores}
        onEnter={async (store) => {
          setOwnerStore(store);
          setShowEntry(false);
        }}
      />
    );
  }

  return (
    <OnboardingScreen
      onComplete={(store) => {
        setOwnerStores([store]);
        setOwnerStore(store);
        setShowEntry(false);
      }}
    />
  );
}

function OwnerEntryScreen({
  ownerStore,
  ownerStores,
  onEnter,
}: {
  ownerStore: OwnerStore;
  ownerStores: OwnerStore[];
  onEnter: (store: OwnerStore) => Promise<void>;
}) {
  const [selectedStore, setSelectedStore] = useState(ownerStore);
  const [entering, setEntering] = useState(false);

  const enter = async () => {
    setEntering(true);
    try {
      await onEnter(selectedStore);
    } finally {
      setEntering(false);
    }
  };

  return (
    <SafeAreaView style={styles.entrySafeArea} edges={["top", "bottom"]}>
      <View style={styles.entryContent}>
        <Image
          accessible
          accessibilityLabel="StockPilot mascot"
          source={headMascot}
          resizeMode="contain"
          style={styles.entryMascot}
        />
        <Text style={styles.entryTitle}>Welcome to StockPilot</Text>
        <Text style={styles.entryGreeting}>Hi, {ownerStore.ownerName}!</Text>
        <Text style={styles.entrySubtitle}>Select a store to continue.</Text>
        <StoreSelector
          ownerStore={selectedStore}
          ownerStores={ownerStores}
          onSelectStore={async (store) => {
            setSelectedStore(store);
          }}
        />
        <Button title="Enter" size="lg" loading={entering} onPress={enter} style={styles.entryButton} />
      </View>
    </SafeAreaView>
  );
}

function LoadingScreen() {
  const player = useVideoPlayer(mascotVideo, (videoPlayer) => {
    videoPlayer.loop = true;
    videoPlayer.muted = true;
  });

  useEffect(() => {
    player.play();
  }, [player]);

  return (
    <SafeAreaView style={styles.centered}>
      <VideoView
        player={player}
        style={styles.mascot}
        contentFit="contain"
        nativeControls={false}
        playsInline
        accessibilityLabel="StockPilot mascot loading animation"
      />
      <ActivityIndicator color={colors.primary[600]} />
      <Text style={styles.loadingText}>Loading your store…</Text>
    </SafeAreaView>
  );
}

function LoadErrorScreen({ onRetry }: { onRetry: () => void }) {
  return (
    <SafeAreaView style={styles.centered}>
      <Text style={styles.errorTitle}>Your store couldn&apos;t be loaded.</Text>
      <Text style={styles.errorText}>Try again to open StockPilot.</Text>
      <Button title="Try again" variant="secondary" onPress={onRetry} />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  centered: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    gap: spacing[3],
    padding: spacing[6],
    backgroundColor: colors.background.surface,
  },
  entrySafeArea: {
    flex: 1,
    backgroundColor: colors.background.surface,
  },
  entryContent: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    gap: spacing[4],
    padding: spacing[6],
  },
  entryMascot: {
    width: 150,
    height: 150,
  },
  entryTitle: {
    ...typography.h2,
    color: colors.text.primary,
    textAlign: "center",
  },
  entryGreeting: {
    ...typography.title,
    color: colors.text.primary,
    textAlign: "center",
  },
  entrySubtitle: {
    ...typography.bodySmall,
    color: colors.text.secondary,
    textAlign: "center",
  },
  entryButton: {
    width: "100%",
    maxWidth: 420,
  },
  mascot: {
    width: 150,
    height: 150,
  },
  loadingText: {
    ...typography.bodySmall,
    color: colors.text.secondary,
  },
  errorTitle: {
    ...typography.h3,
    color: colors.text.primary,
    textAlign: "center",
  },
  errorText: {
    ...typography.bodySmall,
    color: colors.text.secondary,
  },
});
