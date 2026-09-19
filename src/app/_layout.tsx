import { Suspense, useEffect, useState } from "react";
import { Stack } from "expo-router";
import { SQLiteProvider } from "expo-sqlite";
import { Platform, Text, View } from "react-native";

import { migrate } from "@/database/migrate";

export default function RootLayout() {
  // ponytail: Web SQLite is single-tab until Expo supports shared OPFS handles.
  const [databaseTab, setDatabaseTab] = useState<"checking" | "ready" | "busy">(
    Platform.OS === "web" ? "checking" : "ready",
  );

  useEffect(() => {
    if (Platform.OS !== "web" || !navigator.locks) {
      setDatabaseTab("ready");
      return;
    }

    let active = true;
    let release!: () => void;
    const released = new Promise<void>((resolve) => {
      release = resolve;
    });

    void navigator.locks
      .request("stockpilot.sqlite", { ifAvailable: true }, async (lock) => {
        if (!active) return;
        if (!lock) {
          setDatabaseTab("busy");
          return;
        }
        setDatabaseTab("ready");
        await released;
      })
      .catch(() => {
        if (active) setDatabaseTab("busy");
      });

    return () => {
      active = false;
      release();
    };
  }, []);

  if (databaseTab === "checking") return null;
  if (databaseTab === "busy") {
    return (
      <View style={{ flex: 1, justifyContent: "center", padding: 24 }}>
        <Text accessibilityRole="alert">
          StockPilot’s web database is already open in another tab. Close that tab and reload this page.
        </Text>
      </View>
    );
  }

  return (
    <Suspense fallback={null}>
      <SQLiteProvider databaseName="stockpilot.db" onInit={migrate} useSuspense>
        <Stack screenOptions={{ headerShown: false }} />
      </SQLiteProvider>
    </Suspense>
  );
}
