# Three-Day Trial Removal

## Changes

- Removed trial expiration creation and storage from the settings service.
- Removed the trial lock screen and expiration checks from `HomeScreen`.
- Removed the trial banner from the owner-store dashboard.
- Kept the existing reusable loading, error, store overview, and async-effect components.
- Removed unused trial-only props, styles, timers, and imports.

## Validation

- `npx tsc --noEmit` passed.
- Focused service tests passed: 3 suites, 11 tests.
- Full suite: 17 tests passed; 5 pre-existing migration/store-overview assertions still fail.
- No trial-related references remain in `src` or `test`.
