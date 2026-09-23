# Validation Input Update

## Changes

- Removed digit filtering from catalog quantity and reorder inputs.
- Removed `maxLength` limits from settings fields so typing is not interrupted.
- Kept country codes and numeric drafts unchanged while the user types.
- Added one shared `parseNumberInput` boundary parser for raw numeric strings.
- Updated product, inventory, store, settings, and stock-adjustment validation to parse and normalize values on submit.
- Kept length, integer, range, and format rules in the schemas instead of the input handlers.

## Validation

- `npx tsc --noEmit` passed.
- `git diff --check` passed.
- Focused tests passed: 5 suites, 14 tests.
- Raw numeric strings are converted only after submit validation; malformed or non-integer quantities are rejected without preventing draft input.
