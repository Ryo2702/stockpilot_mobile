import { Stack } from "expo-router";
import { SQLiteProvider } from "expo-sqlite";

import { migrateFresh } from "@/database/migrate";

export default function RootLayout() {
  return (
    <SQLiteProvider databaseName="stockpilot.db" onInit={migrateFresh}>
      <Stack screenOptions={{ headerShown: false }} />
    </SQLiteProvider>
  );
}
