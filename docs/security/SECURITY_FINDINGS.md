# StockPilot Android Security Findings

**Assessment date:** 2026-09-21  
**Scope:** Expo SDK 57 source, app configuration, dependency tree, Jest tests, and generated Android source manifest.  
**Release decision:** Not approved. No production-identity release artifact or Android runtime evidence was produced. Source changes and regression tests do not substitute for artifact/device verification.

## Findings

### SP-SEC-001 — SQLCipher and key-management verification

**ID:** SP-SEC-001  
**Severity:** HIGH  
**OWASP MASVS:** MASVS-STORAGE, MASVS-CRYPTO  
**MASWE:** MASWE-0001, MASWE-0013  
**MASTG:** MASTG-TEST-0204, MASTG-TEST-0207  
**Description:** Existing SQLite data was plaintext. SQLCipher configuration and a SecureStore-backed random key path have now been added, but encryption has not been verified in a custom Android release.  
**Affected component:** `app.json`; `src/database/security/`; `src/app/_layout.tsx`  
**Evidence:** `useSQLCipher: true`; `database-key.ts` requests 32 secure random bytes and stores the hex key through SecureStore; Jest mocks verify API use/format only.  
**Remediation:** Build with the SQLCipher native plugin and verify wrong-key rejection, persistence, extraction resistance, and restart behavior on Android.  
**Verification:** Release-device database extraction and wrong-key tests in `ANDROID_SECURITY_TESTING.md`.  
**Status:** NOT TESTED (implementation added; native behavior unverified)

### SP-SEC-002 — Legacy migration and data preservation

**ID:** SP-SEC-002  
**Severity:** HIGH  
**OWASP MASVS:** MASVS-STORAGE, MASVS-CODE  
**MASWE:** MASWE-0001  
**MASTG:** Migration/restart regression tests; no direct MASTG test ID assigned  
**Description:** The former automatic migration path could drop tables when a legacy database lacked a marker. Automatic migration is now non-destructive. Plaintext legacy databases are copied through SQLCipher staging and retained until migration and data checks succeed.  
**Affected component:** `src/database/migrate.ts`; `src/database/security/encrypted-database.ts`; migrations  
**Evidence:** Migration and ownership regression tests pass; staging validates table counts, inventory totals, integrity, foreign keys, and ownership before replacement.  
**Remediation:** Exercise supported historical database fixtures and crash/restart points on a custom Android build before deleting legacy data in production. A corrupt nonempty target with a valid legacy database is intentionally fail-closed and needs manual recovery; the app does not yet provide in-app repair.  
**Verification:** `npm test -- --runInBand`; device migration/restart tests in the test procedure.  
**Status:** PARTIALLY REMEDIATED (source tests pass; native migration unverified)

### SP-SEC-003 — Business/store/product ownership enforcement

**ID:** SP-SEC-003  
**Severity:** HIGH  
**OWASP MASVS:** MASVS-CODE, MASVS-STORAGE  
**MASWE:** MASWE-0050  
**MASTG:** Domain/database regression tests; no direct MASTG test ID assigned  
**Description:** Independent identifiers could refer to different ownership chains. Migration 10 rejects existing mismatches and installs triggers for business/store/product ownership. Products with inventory or movement history cannot be reassigned into another store/business while dependent rows retain the old ownership values. Backup validation also checks ownership before restore.
**Affected component:** `src/database/migrations/010_store_ownership.ts`; `src/services/backup.service.ts`  
**Evidence:** Migration tests reject mismatched inserts, store reassignment, and product reassignment while inventory/history exists; migration regression suite passes.
**Remediation:** Run the documented direct cross-store and cross-business mutation suite against a release database, including import/restore paths.  
**Verification:** `npm test -- --runInBand`; device/service attack cases in `ANDROID_SECURITY_TESTING.md`.  
**Status:** PARTIALLY REMEDIATED (source tests pass; Android release verification pending)

### SP-SEC-004 — Android system backup policy

**ID:** SP-SEC-004  
**Severity:** MEDIUM  
**OWASP MASVS:** MASVS-STORAGE  
**MASWE:** MASWE-0006  
**MASTG:** MASTG-TEST-0216, MASTG-TEST-0262  
**Description:** Backup is disabled in Expo config. The generated main manifest showed `allowBackup=false`, but merged release-manifest and device backup behavior were not verified.  
**Affected component:** `app.json`; Android release manifest  
**Evidence:** `android.allowBackup: false`; successful prebuild main-manifest inspection.  
**Remediation:** Inspect final release APK/AAB manifest and run backup/restore checks on supported Android versions.  
**Verification:** `apkanalyzer`/`aapt` and device procedure in `ANDROID_SECURITY_TESTING.md`.  
**Status:** NOT TESTED (configuration evidence only)

### SP-SEC-005 — Portable backup confidentiality

**ID:** SP-SEC-005  
**Severity:** HIGH  
**OWASP MASVS:** MASVS-STORAGE, MASVS-CRYPTO  
**MASWE:** MASWE-0001, MASWE-0002  
**MASTG:** MASTG-TEST-0200, MASTG-TEST-0207  
**Description:** Older `.spbackup` files use serialized SQLite bytes and remain plaintext. Current native backup creation exports through SQLCipher using a user passphrase, but that native path has not been built or verified. Browser backups remain serialized SQLite and are outside the Android target.
**Affected component:** `src/services/backup.service.ts`; backup UI
**Evidence:** Native source uses bound `ATTACH DATABASE ? AS <generated alias> KEY ?` and `sqlcipher_export()`, adds a file-format marker, verifies SQLCipher/page integrity/schema, and does not store the passphrase. Unit tests cover format recognition and the new-backup/legacy-restore passphrase bounds only.
**Remediation:** Verify exported bytes, wrong-passphrase failure, cross-install restore, and unchanged data after invalid/cancelled restore using a custom Android SQLCipher release. Keep a plaintext warning for legacy backup imports.
**Verification:** Follow the portable backup procedure in `ANDROID_SECURITY_TESTING.md` and inspect/test the release artifact on two installs/devices.
**Status:** IMPLEMENTED IN SOURCE; NATIVE VERIFICATION NOT TESTED (release gate)

### SP-SEC-006 — CSV import resource and schema validation

**ID:** SP-SEC-006  
**Severity:** MEDIUM  
**OWASP MASVS:** MASVS-CODE, MASVS-PRIVACY  
**MASWE:** MASWE-0050  
**MASTG:** Import/input regression tests; no direct MASTG test ID assigned  
**Description:** CSV imports lacked resource bounds and consistent schema checks. The service now caps file size, rows, columns, and field length, validates headers and product data, rejects duplicates, and keeps writes transactional. Onboarding presents an explicit summary confirmation.  
**Affected component:** `src/services/inventory-import.service.ts`; `src/components/onboarding/ExistingStoreSelectionStep.tsx`  
**Evidence:** CSV service tests pass within the 10-suite Jest run; import is bounded to 5 MiB, 10,000 rows, 32 columns, and 4,096 characters per field.  
**Remediation:** Exercise boundary and malformed-file cases on Android and verify cancellation leaves the database unchanged.  
**Verification:** `npm test -- --runInBand`; device/fuzz procedure in `ANDROID_SECURITY_TESTING.md`.  
**Status:** PARTIALLY REMEDIATED (source tests pass; device input testing pending)

### SP-SEC-007 — QR/barcode input validation

**ID:** SP-SEC-007  
**Severity:** MEDIUM  
**OWASP MASVS:** MASVS-CODE  
**MASWE:** MASWE-0050  
**MASTG:** Input regression tests; no direct MASTG test ID assigned  
**Description:** Camera payloads now pass through a shared validator that rejects empty, overlong, control-character, and URI-like values before lookup/form use. Scanning does not itself launch a URL or change stock.  
**Affected component:** `src/validation/barcode.validation.ts`; catalog scanner/queries  
**Evidence:** Barcode validator tests pass; max payload length is 128 characters.  
**Remediation:** Verify malformed and valid QR/barcode cases through the Android camera and normal product service flow.  
**Verification:** `npm test -- --runInBand`; device scan procedure in `ANDROID_SECURITY_TESTING.md`.  
**Status:** PARTIALLY REMEDIATED (validator tests pass; camera runtime pending)

### SP-SEC-008 — SQL value interpolation regression

**ID:** SP-SEC-008  
**Severity:** LOW  
**OWASP MASVS:** MASVS-CODE  
**MASWE:** MASWE-0050  
**MASTG:** Static/source regression check; no direct MASTG test ID assigned  
**Description:** Audited user values use bound parameters. A lightweight source test checks obvious untrusted template interpolation and includes a malicious-value fixture. Internal schema identifiers still require manual allowlist review.  
**Affected component:** SQLite repositories, services, migrations; `test/sql-interpolation.security.test.ts`  
**Evidence:** SQL-interpolation test passes with the full suite.  
**Remediation:** Keep the guard in CI and review all new SQL call sites and dynamic identifiers.  
**Verification:** `npm test -- --runInBand` and manual SQL call-site review.  
**Status:** PARTIALLY REMEDIATED (source guard passes; not a complete SQL analyzer)

### SP-SEC-009 — Permission minimization

**ID:** SP-SEC-009  
**Severity:** LOW  
**OWASP MASVS:** MASVS-PRIVACY, MASVS-PLATFORM  
**MASWE:** MASWE-0066  
**MASTG:** Merged manifest permission inspection  
**Description:** App configuration blocks Internet, overlay, vibration, and legacy storage permissions; prebuild's main manifest retained camera only. The merged release manifest has not been inspected.  
**Affected component:** `app.json`; Android dependency manifests and release merge  
**Evidence:** Resolved Expo config and generated main manifest; camera is required for scanning and audio capture is disabled.  
**Remediation:** Confirm the complete release permission set from the final APK/AAB and test camera, picker, and backup behavior.  
**Verification:** `aapt dump permissions` and documented feature tests.  
**Status:** NOT TESTED (merged release permissions unavailable)

### SP-SEC-010 — Deep-link and exported-component verification

**ID:** SP-SEC-010  
**Severity:** INFORMATIONAL  
**OWASP MASVS:** MASVS-PLATFORM, MASVS-CODE  
**MASWE:** MASWE-0029  
**MASTG:** MASTG-TEST-0394  
**Description:** The `stockpilot` scheme is configured for Expo Router navigation. No URL-to-business-mutation handler was identified in the source review. Final exported components and crafted-link behavior remain unverified.  
**Affected component:** `app.json`; Expo Router; merged Android manifest  
**Evidence:** Source/config review; generated main manifest declares a launcher activity and `stockpilot://` filter.  
**Remediation:** Verify exported components and malformed-link behavior in the release package; keep mutation behind domain services.  
**Verification:** Inspect decoded manifest and run crafted-intent tests.  
**Status:** NOT TESTED (release artifact/device unavailable)

### SP-SEC-011 — Dependency advisories

**ID:** SP-SEC-011  
**Severity:** MEDIUM  
**OWASP MASVS:** MASVS-CODE  
**MASWE:** MASWE-0044  
**MASTG:** Dependency inventory and vulnerability review  
**Description:** `npm audit` reports 15 moderate transitive advisory findings, including `decode-uri-component` through `expo-router` and `uuid` through `expo-sharing`/Expo config plugins. Proposed forced fixes leave SDK 57-compatible Expo package ranges.  
**Affected component:** npm dependency tree  
**Evidence:** `npm audit` and `npm audit --omit=dev`; compatible Expo patch versions were aligned and unused `expo-image`/`react-native-purchases` removed.  
**Remediation:** Track upstream SDK-compatible fixes and re-audit on Expo patch releases; do not force an incompatible dependency graph.  
**Verification:** Rerun `npm audit` after compatible updates and retain the JSON report.  
**Status:** OPEN (known advisories remain)

### SP-SEC-012 — Release artifact and runtime assurance gap

**ID:** SP-SEC-012  
**Severity:** HIGH  
**OWASP MASVS:** MASVS-PLATFORM, MASVS-CODE, MASVS-STORAGE  
**MASWE:** MASWE-0001, MASWE-0006  
**MASTG:** MASTG-TECH-0007, MASTG-TECH-0160  
**Description:** No production package ID, release signing configuration/profile, production APK/AAB, merged release manifest, functioning emulator/device, MobSF report, or JADX review is available in this checkout. The prebuilt Android source uses Expo's `com.anonymous.stockpilot` placeholder and cannot be treated as the production release.  
**Affected component:** Android release pipeline and app identity  
**Evidence:** No `eas.json` or production `android.package`; only generated Android source is available. ADB could not start in this environment.  
**Remediation:** Configure the existing production package identity and signing workflow, build the actual release artifact, then perform the documented static and dynamic assessment.  
**Verification:** Record artifact hash, signing certificate, merged manifest, static analyzer outputs, and device results.  
**Status:** NOT TESTED (production release not produced)

### SP-SEC-013 — Technical error disclosure through UI

**ID:** SP-SEC-013  
**Severity:** MEDIUM  
**OWASP MASVS:** MASVS-CODE, MASVS-PRIVACY  
**MASWE:** No direct MASWE entry for UI error disclosure; related CWE-209  
**MASTG:** MASTG-BEST-0021; no current atomic test covers this UI case  
**Description:** Some report, export, and import screens previously displayed arbitrary `Error.message` text, which could disclose filesystem paths, SQLite details, or provider internals.  
**Affected component:** Insights and inventory UI; CSV import service  
**Evidence:** Unknown failures now map to fixed UI messages. CSV validation uses a typed error with control/bidirectional text stripping and a 240-character cap. A regression test confirms database-like exception text is hidden while a validation message remains useful.  
**Remediation:** Keep arbitrary technical exceptions out of UI and logs; retain only curated domain/input messages.  
**Verification:** Inventory-import user-message regression test and source scan for raw error display.  
**Status:** REMEDIATED IN SOURCE (tests and release review pending)

### SP-SEC-014 — User-selected backup passphrase entropy

**ID:** SP-SEC-014  
**Severity:** MEDIUM  
**OWASP MASVS:** MASVS-CRYPTO, MASVS-STORAGE  
**MASWE:** MASWE-0014  
**MASTG:** MASWE-0014 currently has no atomic MASTG test; manual native backup verification  
**Description:** A length check cannot ensure that a user-selected portable-backup passphrase has enough entropy to resist offline guessing. New backups now require 20 characters, but repeated or predictable text can still be weak. Earlier beta backups with 12–19 character passphrases remain restorable for compatibility.  
**Affected component:** `src/services/backup.service.ts`; backup passphrase dialog  
**Evidence:** Unit tests enforce the new 20-character creation floor and 12-character restore compatibility. SQLCipher's default passphrase KDF is used; no application key derivation is implemented.  
**Remediation:** Prefer a generated high-entropy recovery secret with an explicit save/confirmation flow if the product adopts a generated-secret backup UX. Until then, advise unique unpredictable passphrases and keep this limitation explicit.  
**Verification:** Native test should verify wrong-passphrase rejection; passphrase guessing resistance depends on user choice and is not established by a minimum length.  
**Status:** OPEN (length floor improved; entropy is not guaranteed)

### SP-SEC-015 — Formula injection in CSV exports

**ID:** SP-SEC-015  
**Severity:** MEDIUM  
**OWASP MASVS:** MASVS-CODE  
**MASWE:** MASWE-0050  
**MASTG:** No current atomic MASTG test covers CSV formula injection; use manual export review  
**Description:** Spreadsheet applications may evaluate exported cells beginning with formula markers. The previous exporter check missed formula markers preceded by whitespace/control characters in legacy or directly altered database values.  
**Affected component:** `src/services/inventory.service.ts`; `src/services/insights/reports.ts`  
**Evidence:** Both serializers now prefix string cells when `=`, `+`, `-`, or `@` follows leading whitespace/control characters. A regression test covers inventory fields, insight movement text, and preservation of negative numeric output.  
**Remediation:** Retain the cell guard and review every future spreadsheet-compatible export.  
**Verification:** `src/services/csv-export.security.test.ts`; confirm exported artifacts in target spreadsheet applications as part of release testing.  
**Status:** REMEDIATED IN SOURCE (runtime spreadsheet compatibility review pending)

## Verification summary

- `npm test -- --runInBand`: 11 suites and 42 tests passed, including SecureStore key persistence, ownership, portable-backup passphrase bounds, safe import error presentation, and CSV formula-injection regression cases.
- `npx tsc --noEmit`: passed.
- Expo prebuild generated Android source. Its main manifest showed `allowBackup=false`, `usesCleartextTraffic=false`, `CAMERA`, and removal markers for Internet, legacy storage, overlay, and vibration. This is not the merged release manifest.
- `npx expo-doctor`: 21/21 checks passed after SDK-compatible patch updates.
- Gradle release-manifest processing was attempted; it reached Android SDK setup and stalled while preparing NDK 27.1.12297006. It was stopped without merged-manifest output.
- `npm audit`: 15 moderate transitive findings remain.
- No SQLCipher native runtime, APK/AAB static analysis, Android logcat/network test, database extraction, backup/restore, or device input testing was performed.

## Control status at assessment

| Control | Status | Evidence |
|---|---|---|
| Database encryption | NOT TESTED | SQLCipher configured and source key flow exists; no native release verification. |
| Secure key storage | NOT TESTED | Crypto/SecureStore tests are mocked; Android Keystore behavior unverified. |
| Android backup | NOT TESTED | Generated source manifest only; merged release manifest and device test missing. |
| Cleartext traffic | NOT TESTED | Generated main manifest says false; debug manifest overrides it; no release artifact test. |
| Permissions | NOT TESTED | Generated main manifest only; merged release permission set missing. |
| SQL injection | PASS | Static interpolation regression check and parameterized repository review; not a full analyzer. |
| Store isolation | PASS | SQLite regression tests cover mismatched writes, store reassignment, and product reassignment with dependent rows. |
| Negative stock | PASS | Database CHECK and service validation regression tests. |
| Transaction safety | PASS | Service test injects movement-write failure and verifies stock rollback. |
| Import security | PASS | Bounded CSV/schema/duplicate/quantity tests; Android picker fuzzing pending. |
| QR/barcode security | PASS | Shared payload validator tests; camera runtime pending. |
| Sensitive logging | NOT TESTED | Source scan clean; release bundle and logcat scans pending. |
| Secret exposure | NOT TESTED | Scoped repository scans clean; APK/AAB and bundle scan missing. |
| Exported components | NOT TESTED | No merged release manifest available. |
| Production debugging | NOT TESTED | No production APK/AAB to inspect. |
| Dependency security | FAIL | 15 moderate transitive npm advisory findings remain. |
| Static analysis | NOT TESTED | MobSF and JADX were not run on a release artifact. |
| Dynamic analysis | NOT TESTED | No release package/test device available. |
| Portable backup encryption | NOT TESTED | Native SQLCipher export added in source; integration and wrong-passphrase behavior require native verification. |
