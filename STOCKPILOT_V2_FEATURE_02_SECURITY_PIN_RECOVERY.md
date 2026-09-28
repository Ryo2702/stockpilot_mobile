# StockPilot 2.0.0 — Feature 02: PIN Security, Fingerprint, and Recovery

## Delivered

- PIN setup now requires the owner to choose and answer five different recovery questions.
- The lock screen offers **Forgot PIN?** when all five questions have been configured.
- All five answers must be correct before the owner can create a new PIN.
- Owners can update recovery questions from **Settings → Security → Recovery Questions** after entering the current PIN.

## Fingerprint Unlock

- **Fingerprint Unlock** is available from **Settings → Security** only on devices with an enrolled fingerprint.
- It is opt-in and requires the current StockPilot PIN to enable or disable.
- The biometric prompt does not fall back to the device passcode; the owner can always use the StockPilot PIN instead.

## Data Protection

- Recovery answers are normalized and saved only as individually salted SHA-256 digests.
- Native builds save the security configuration in Expo SecureStore. The existing web fallback remains local settings storage.
- A new PIN set in Settings is not written until its recovery questions are successfully saved.

## Build Note

This feature adds `expo-local-authentication` and `expo-crypto`. Create a new native development or production build to include fingerprint support.

## Verification

- `npx tsc --noEmit`
- `npm test -- --runInBand src/services/settings.service.test.ts`
- `npx expo export --platform web --max-workers 1 --output-dir /tmp/stockpilot-v2-security-check`
