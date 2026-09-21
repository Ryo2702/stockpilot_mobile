# Android Security Testing Procedure

This procedure separates source-level evidence from release/device evidence. A source pass is not a production-release pass. Run from the repository root unless stated otherwise.

## Source and dependency checks

```bash
npm test -- --runInBand
npx tsc --noEmit
npx expo config --type public --json
npx expo-doctor
npm audit
```

Review `test/sql-interpolation.security.test.ts` with the SQL changes. It is a lightweight regression guard for SQL template interpolations; it does not replace manual review of every SQL call or concatenated query.

Secret/log source scan:

```bash
rg -n 'console\.(log|debug|info|warn|error)|process\.env|EXPO_PUBLIC_' src app.json package.json
rg --files -g '.env*' -g '*service-account*' -g '*private*.pem' -g '*secret*'
rg -n --hidden --glob '!node_modules/**' --glob '!.git/**' --glob '!package-lock.json' --glob '!android/**' 'AKIA[A-Z0-9]{16}|AIza[0-9A-Za-z_-]{35}|-----BEGIN [A-Z ]*PRIVATE KEY-----' .
```

Review every result manually. `EXPO_PUBLIC_*` values are bundle-visible. Do not print key contents during a SecureStore/database test.

## Android production build identity

Set the real Play Store `android.package`, production signing configuration, and release profile before calling a build production. This checkout currently has none; Expo's generated `com.anonymous.stockpilot` is only a local placeholder.

After release identity is configured, generate and build using the project's chosen Expo workflow. For local CNG builds:

```bash
npx expo prebuild --platform android
cd android
./gradlew :app:bundleRelease
```

For an APK suitable for a test device, use the configured release APK task/profile. Record the command, package ID, build variant, artifact SHA-256, signing certificate fingerprint, and tool versions. Verify `debuggable=false` in the built artifact; do not infer it from source manifests.

## Manifest, permissions, and exported components

Decode the actual release package, not only `app.json` or generated source:

```bash
apkanalyzer manifest print app-release.apk
aapt dump permissions app-release.apk
aapt dump badging app-release.apk
```

Check `allowBackup=false`; `usesCleartextTraffic`/network security policy; the complete merged permission list; exported activities/services/receivers/providers; deep-link intent filters; target SDK; and `debuggable=false`. The camera permission should remain explained. Internet, overlay, vibration, and broad/legacy storage permissions should be absent unless a reviewed feature justifies them. Confirm `stockpilot://` only navigates and cannot perform a mutation through crafted parameters.

## SQLCipher, key, and migration

Build a custom native release with the SDK 57 SQLite plugin configured for SQLCipher. Expo Go is not evidence because it does not include the app's custom SQLCipher native build. On a test device:

1. Install over a seeded legacy version without uninstalling; record row counts and inventory totals first.
2. Launch and verify the encrypted database is usable after restart. Confirm the old plaintext database and sidecars are removed only after successful validation/migrations.
3. Simulate a failed/corrupt staged copy and confirm the legacy source remains and the app fails closed. Separately test a nonempty corrupt target with a valid legacy source: expect fail-closed startup and preserve both files for manual recovery; the app has no automatic repair path.
4. Extract app-private files with an authorized test setup. A normal SQLite reader must not read the encrypted primary database. Confirm the key is not in JS bundles, source maps, preferences, or logs.
5. Verify wrong-key opening fails, key persistence works across process restart, and key loss does not delete the database.

The current Jest key tests mock Crypto and SecureStore. They verify API calls/format only, not Android Keystore behavior or SQLCipher encryption.

## Static APK analysis and secrets

```bash
jadx -d decoded app-release.apk
sha256sum app-release.apk
```

Search decoded sources/resources/assets/JS bundles for `EXPO_PUBLIC_`, known credentials, database key patterns, endpoints, test strings, and debug-only modules. Run MobSF against the same release artifact and review each finding manually as true positive, false positive, accepted risk, or remediation. Attach tool version and report. Do not treat scanner count as architecture evidence.

## Database, logs, and network on device

```bash
adb logcat -c
adb logcat
```

Exercise normal product, stock, backup, import, scan, and business/store switching. Confirm no keys, business details, complete inventory, imported contents, raw QR/barcode payloads, SQL, paths, or stack traces appear.

Capture app network traffic with the approved test proxy. StockPilot should make no direct network requests. Attempt an HTTP test request from an instrumented test build and verify release policy blocks cleartext; confirm there are no unexpected HTTPS endpoints or sensitive fields. Debug variants intentionally permit Metro traffic and must not be used as release evidence.

## Input and domain regressions

Use test data in a disposable database. Try:

- CSV at 5 MiB and just over; 10,000 rows and just over; 32 columns and just over; 4,096-character fields and just over; malformed quotes/encoding; duplicate and unknown headers; negative/decimal/huge quantities; formula-leading values; and duplicate SKUs/barcodes.
- Onboarding import cancel, valid confirmation, three-store limit, a fourth active store, and a store that becomes unavailable before confirmation. Confirm canceled/invalid files make no writes and accepted imports remain transactional.
- QR/barcode empty, 129-character, control-character, URL-like, unsupported, valid EAN/UPC, SKU, and unknown code. Confirm unknown valid input can only prefill/create through the normal service and never launches a URL or changes stock by scanning alone.
- Export product/store/movement text fields beginning with tab/space plus `=`, `+`, `-`, or `@`; confirm the CSV prefixes such cells with an apostrophe, preserves CSV quoting, and leaves negative numeric movement quantities unchanged.
- Direct service and repository attempts to read/update/delete another store's product, cross-business store IDs, mismatched product/store movement rows, negative stock, and stock removal beyond availability.
- Inject movement insertion failure; confirm quantity and movement history both remain unchanged.
- Duplicate/replayed operations and malformed deep links; confirm safe errors and unchanged database state.

## Backup restore

On a native SQLCipher build, create a backup with a unique, unpredictable passphrase of at least 20 characters. Confirm `.spbackup` begins with the `SPBKSQLC1` marker and the bytes after it do not start with `SQLite format 3\0`. Test correct-passphrase inspection and restore, restore of an earlier beta backup using its 12–19 character passphrase, wrong-passphrase rejection, truncation/corruption, oversized, wrong-schema, FK-invalid, cross-store, negative-stock, and rollback after a forced insert failure. Restore the protected backup on a second install to prove its key is portable and not tied to SecureStore. Verify current inventory remains unchanged for every rejected backup and for cancellation. Avoid placing test passphrases in shell history, logs, test output, or screenshots.

Also restore a legacy serialized `.spbackup` from an earlier app version and confirm the UI warns it is unencrypted before confirmation. Do not relabel legacy files as encrypted or delete them automatically. Web exports continue to use SQLite serialization and are not Android confidentiality evidence.

## Current evidence

- `npm test -- --runInBand`: 11 suites / 42 tests passed, including SecureStore key persistence, ownership, portable-backup passphrase bounds, safe import error presentation, and CSV formula-injection regression cases.
- `npx tsc --noEmit`: passed.
- `npx expo config --type public --json`: resolved SDK 57, SQLCipher plugin, backup disabled, and camera config.
- `npx expo prebuild --platform android --no-install --no-clean`: generated source project; main manifest contains `allowBackup=false`, `usesCleartextTraffic=false`, camera permission, and removal markers for Internet, legacy storage, overlay, and vibration. This is not a merged release manifest.
- `npx expo-doctor`: 21/21 checks passed after SDK-compatible patches were installed. A later repeat was blocked by npm registry DNS failure; the local config plugin was verified by successful prebuild.
- `npm audit`: 15 moderate transitive findings; recorded in `SECURITY_FINDINGS.md`. No incompatible forced upgrade was applied.
- Unit coverage checks the backup format marker, legacy SQLite marker, new-backup and older-backup passphrase length bounds, safe import error presentation, CSV formula-prefix handling, and product-owner reassignment guard. It does not execute native SQLCipher export or verify Android Keystore behavior.
- Portable native backups are now source-configured for SQLCipher `ATTACH ... KEY ?` + `sqlcipher_export`; encryption, wrong-passphrase rejection, and cross-install restore remain NOT TESTED pending a custom native build and test device.
- `./gradlew :app:processReleaseMainManifest`: not completed; Gradle reached Android SDK installation and stalled preparing NDK 27.1.12297006. No merged release manifest was produced.
- No production APK/AAB, production package ID, release signing identity, JADX/MobSF report, or functioning test device is present in this checkout. Dynamic checks above remain NOT TESTED.
