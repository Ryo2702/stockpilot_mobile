import { describe, expect, test } from "@jest/globals";

import { MAX_BARCODE_LENGTH, parseScannedCode } from "./barcode.validation";

describe("scanned code validation", () => {
  test("normalizes bounded barcode text", () => {
    expect(parseScannedCode("  0123456789012  ")).toBe("0123456789012");
    expect(parseScannedCode("A".repeat(MAX_BARCODE_LENGTH))).toBe("A".repeat(MAX_BARCODE_LENGTH));
  });

  test("rejects empty, oversized, control-character, and URL payloads", () => {
    expect(parseScannedCode("  ")).toBeNull();
    expect(parseScannedCode("A".repeat(MAX_BARCODE_LENGTH + 1))).toBeNull();
    expect(parseScannedCode("SKU\n123")).toBeNull();
    expect(parseScannedCode("https://example.test/stock" )).toBeNull();
    expect(parseScannedCode("javascript:alert(1)")).toBeNull();
  });
});
