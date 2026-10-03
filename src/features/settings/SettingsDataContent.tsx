import {
  CircleCheck,
  Clock3,
  Database,
  FileText,
  HardDrive,
  Info,
  Package,
  ReceiptText,
  RefreshCw,
  Save,
  Share2,
} from "lucide-react-native";
import { ActivityIndicator, Image, Text, View } from "react-native";

import { Button } from "@/components/ui/Button";
import { legalPages, type LegalPage } from "@/data/legal.data";
import { useTheme, useThemeStyles } from "@/theme/ThemeProvider";

import type { SettingsController } from "./settings.controller";
import { SettingsGroup, SettingsRow } from "./settings.components";
import {
  formatBytes,
  formatDateTime,
  version,
  build,
} from "./settings.utils";
import { createSettingsStyles } from "./settings.styles";

type Props = { settings: SettingsController };

export function LegalContent({ pageKey }: { pageKey: LegalPage }) {
  const styles = useThemeStyles(createSettingsStyles);
  const content = legalPages[pageKey];

  return (
    <View style={styles.form}>
      <Text style={styles.infoText}>{content.intro}</Text>
      {content.sections.map((section) => (
        <View key={section.heading} style={styles.infoNote}>
          <Text style={styles.rowTitle}>{section.heading}</Text>
          <Text style={styles.infoText}>{section.body}</Text>
        </View>
      ))}
    </View>
  );
}

export function BackupContent({ settings }: Props) {
  const { colors } = useTheme();
  const styles = useThemeStyles(createSettingsStyles);
  const {
    backupResult,
    backupBusy,
    saveBackup,
    shareAvailable,
    shareCreatedBackup,
    setBackupResult,
    backupError,
    lastBackup,
    backupFiles,
    prepareLocalRestore,
    startBackup,
    chooseBackupFile,
    backupStatus,
    restoreError,
    restoreMessage,
  } = settings;

  return backupResult ? (
    <View style={styles.form}>
      <View style={styles.statusCard}>
        <CircleCheck color={colors.semantic.success} size={32} />
        <Text style={styles.statusTitle}>Backup Created</Text>
        <Text style={styles.filename}>{backupResult.name}</Text>
        <Text style={styles.statusCopy}>
          {formatBytes(backupResult.size)} · This device
        </Text>
      </View>
      <Button
        title="Save to Device"
        icon={Save}
        loading={backupBusy}
        onPress={() => void saveBackup()}
      />
      {shareAvailable ? (
        <Button
          title="Share File"
          icon={Share2}
          variant="secondary"
          loading={backupBusy}
          onPress={() => void shareCreatedBackup()}
        />
      ) : null}
      <Button
        title="Done"
        variant="ghost"
        onPress={() => setBackupResult(null)}
      />
      {backupError ? (
        <Text accessibilityRole="alert" style={styles.error}>
          {backupError}
        </Text>
      ) : null}
    </View>
  ) : (
    <>
      <SettingsGroup label="Last Backup">
        <SettingsRow
          icon={Clock3}
          title={
            lastBackup ? formatDateTime(lastBackup.createdAt) : "No backups yet"
          }
          description={
            lastBackup
              ? "This device"
              : "Create a local backup to keep a portable copy of your StockPilot data."
          }
        />
      </SettingsGroup>
      {backupFiles.length ? (
        <SettingsGroup label="Saved on This Device">
          {backupFiles.map((backup) => (
            <SettingsRow
              key={backup.name}
              icon={Database}
              title={backup.name}
              description={formatBytes(backup.size)}
              onPress={() => void prepareLocalRestore(backup)}
            />
          ))}
        </SettingsGroup>
      ) : null}
      <Button
        title="Create Backup"
        loading={backupBusy}
        onPress={() => void startBackup()}
      />
      <SettingsGroup label="Restore Backup">
        <SettingsRow
          icon={RefreshCw}
          title="Choose Backup File"
          description="Restore inventory from a StockPilot backup file."
          onPress={() => void chooseBackupFile()}
        />
      </SettingsGroup>
      {backupStatus ? (
        <View style={styles.busyRow}>
          <ActivityIndicator color={colors.primary[600]} />
          <Text style={styles.busyText}>
            {backupStatus === "preparing"
              ? "Preparing Backup"
              : backupStatus === "checking"
                ? "Checking Backup File"
                : backupStatus === "saving"
                  ? "Saving Backup"
                  : "Opening Share Sheet"}
          </Text>
        </View>
      ) : null}
      {backupError ? (
        <Text accessibilityRole="alert" style={styles.error}>
          {backupError}
        </Text>
      ) : null}
      {restoreError ? (
        <Text accessibilityRole="alert" style={styles.error}>
          {restoreError}
        </Text>
      ) : null}
      {restoreMessage ? (
        <View style={styles.infoNote}>
          <Text style={styles.infoText}>{restoreMessage}</Text>
        </View>
      ) : null}
    </>
  )
}

export function StorageContent({ settings }: Props) {
  const styles = useThemeStyles(createSettingsStyles);
  const { storage, setPage } = settings;

  return (
    <>
      <SettingsGroup label="StockPilot Data">
        <SettingsRow
          icon={Database}
          title="Database"
          value={storage ? formatBytes(storage.databaseBytes) : "Unavailable"}
        />
        <SettingsRow
          icon={FileText}
          title="Backups"
          value={
            storage
              ? formatBytes(storage.backupBytes) +
                " · " +
                storage.backupCount +
                (storage.backupCount === 1 ? " local backup" : " local backups")
              : "Unavailable"
          }
        />
        <SettingsRow
          icon={HardDrive}
          title="Total"
          value={storage ? formatBytes(storage.totalBytes) : "Unavailable"}
        />
      </SettingsGroup>
      <Button
        title="Manage Backups"
        variant="secondary"
        onPress={() => setPage("backup")}
      />
    </>
  )
}

export function FreeAccessContent() {
  const { colors } = useTheme();
  const styles = useThemeStyles(createSettingsStyles);

  return (
    <View style={styles.form}>
      <View style={styles.statusCard}>
        <View style={styles.brandMark}>
          <CircleCheck color={colors.semantic.success} size={30} />
        </View>
        <Text style={styles.premiumBadge}>Free</Text>
        <Text style={styles.statusTitle}>Free access</Text>
        <Text style={styles.statusCopy}>
          All current StockPilot features are available without a purchase.
        </Text>
      </View>
      <View style={styles.infoNote}>
        <Text style={styles.infoText}>
          No subscription or lifetime purchase is required. Your inventory stays
          available locally on this device.
        </Text>
      </View>
      <SettingsGroup label="Included features">
        <SettingsRow
          icon={Package}
          title="Products and inventory"
          value="Products, stock, prices, barcodes, and stock history"
        />
        <SettingsRow
          icon={ReceiptText}
          title="Point of sale"
          value="Product search, checkout, receipts, and sales history"
        />
        <SettingsRow
          icon={FileText}
          title="Reports and analytics"
          value="Inventory, movement, and sales reports"
        />
        <SettingsRow
          icon={Database}
          title="Backup and restore"
          value="Local backups and sharing where supported"
        />
      </SettingsGroup>
    </View>
  )
}

export function AboutContent() {
  const styles = useThemeStyles(createSettingsStyles);

  return (
    <>
      <View style={styles.statusCard}>
        <Image
          accessible={false}
          source={require("../../../assets/app-icon.png")}
          resizeMode="cover"
          style={styles.brandMark}
        />
        <Text style={styles.statusTitle}>StockPilot</Text>
        <Text style={styles.tagline}>Smarter Inventory. Less Worry.</Text>
        <Text style={styles.statusCopy}>
          StockPilot helps small businesses track products, monitor stock
          levels, and keep everyday inventory work in one place.
        </Text>
      </View>
      <SettingsGroup label="Application">
        <SettingsRow icon={FileText} title="Version" value={version} />
        <SettingsRow icon={Info} title="Build" value={String(build)} />
      </SettingsGroup>
    </>
  )
}
