export const MAX_BARCODE_LENGTH = 128;

export function parseScannedCode(value: unknown) {
  if (typeof value !== "string") return null;
  const code = value.trim();
  if (
    !code ||
    code.length > MAX_BARCODE_LENGTH ||
    /[\u0000-\u001f\u007f]/.test(code) ||
    /^[a-z][a-z\d+.-]{0,31}:/i.test(code)
  ) {
    return null;
  }
  return code;
}
