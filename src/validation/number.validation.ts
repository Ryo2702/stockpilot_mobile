export function parseNumberInput(value: unknown) {
  if (typeof value !== "string") return value;
  const normalized = value.trim().replace(",", ".");
  return normalized ? Number(normalized) : undefined;
}
