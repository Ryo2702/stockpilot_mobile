import { Suspense, useCallback, useEffect, useState } from "react";
import { Stack } from "expo-router";
import { SQLiteProvider, type SQLiteDatabase } from "expo-sqlite";
import { Platform, Text, View } from "react-native";

import { migrate } from "@/database/migrate";
import {
  ENCRYPTED_DATABASE_NAME,
  initializeEncryptedDatabase,
  prepareEncryptedDatabase,
  removeLegacyDatabaseAfterMigration,
} from "@/database/security/encrypted-database";
import { ThemeProvider } from "@/theme";
import { useTheme } from "@/theme/ThemeProvider";

type DatabaseTab = "checking" | "ready" | "busy" | "error";

export default function RootLayout() {
  // ponytail: Web SQLite is single-tab until Expo supports shared OPFS handles.
  const [databaseTab, setDatabaseTab] = useState<DatabaseTab>("checking");

  useEffect(() => {
    if (Platform.OS !== "web") {
      void prepareEncryptedDatabase()
        .then(() => setDatabaseTab("ready"))
        .catch(() => setDatabaseTab("error"));
      return;
    }

    if (!navigator.locks) {
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

  const initializeDatabase = useCallback(async (db: SQLiteDatabase) => {
    if (Platform.OS !== "web") await initializeEncryptedDatabase(db);
    await migrate(db);
    if (Platform.OS !== "web") await removeLegacyDatabaseAfterMigration(db);
  }, []);

  if (databaseTab === "checking") return null;
  if (databaseTab === "busy") {
    return (
      <View style={{ flex: 1, justifyContent: "center", padding: 24, backgroundColor: "#f8fafc" }}>
        <Text accessibilityRole="alert" style={{ color: "#111827" }}>
          StockPilot’s web database is already open in another tab. Close that tab and reload this page.
        </Text>
      </View>
    );
  }
  if (databaseTab === "error") {
    return (
      <View style={{ flex: 1, justifyContent: "center", padding: 24, backgroundColor: "#f8fafc" }}>
        <Text accessibilityRole="alert" style={{ color: "#111827" }}>
          StockPilot couldn’t securely open its local database. Existing data was preserved. Close and reopen the app, or contact support before reinstalling.
        </Text>
      </View>
    );
  }

  return (
    <Suspense fallback={null}>
      <SQLiteProvider
        databaseName={Platform.OS === "web" ? "stockpilot.db" : ENCRYPTED_DATABASE_NAME}
        onInit={initializeDatabase}
        useSuspense
      >
        <ThemeProvider>
          <RootContent />
        </ThemeProvider>
      </SQLiteProvider>
    </Suspense>
  );
}

function RootContent() {
  const { colors } = useTheme();
  return (
    <Stack screenOptions={{
      headerShown: false,
      contentStyle: { backgroundColor: colors.background.app },
    }} />
  );
}
