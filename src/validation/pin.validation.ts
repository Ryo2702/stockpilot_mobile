export function isValidPin(value: string) {
  return /^\d{4,6}$/.test(value);
}
