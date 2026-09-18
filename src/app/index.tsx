import { useSQLiteContext } from "expo-sqlite";
import { useEffect, useState } from "react";
import { ActivityIndicator, StyleSheet, Text } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { VideoView, useVideoPlayer } from "expo-video";

import OnboardingScreen from "@/components/onboarding/OnboardingScreen";
import OwnerStoreScreen from "@/components/store/OwnerStoreScreen";
import { Button } from "@/components/ui/Button";
import { mascotVideo } from "@/components/onboarding/onboarding.data";
import { getOwnerStore, type OwnerStore } from "@/services/owner-store.service";
import { colors, spacing, typography } from "@/theme";

export default function IndexScreen() {
  const db = useSQLiteContext();
  const [ownerStore, setOwnerStore] = useState<OwnerStore | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    let active = true;
    setLoading(true);
    setError(false);

    getOwnerStore(db)
      .then((store) => {
        if (active) setOwnerStore(store);
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
  if (ownerStore) return <OwnerStoreScreen ownerStore={ownerStore} />;
  return <OnboardingScreen onComplete={setOwnerStore} />;
}

function LoadingScreen() {
  const player = useVideoPlayer(mascotVideo, (videoPlayer) => {
    videoPlayer.loop = true;
    videoPlayer.muted = true;
    videoPlayer.play();
  });

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
