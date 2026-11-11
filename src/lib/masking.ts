export function maskDocumentNumber(value: string): string {
  const trimmed = value.trim();
  if (trimmed.length <= 4) return "****";
  const visible = trimmed.slice(-3);
  return `${"*".repeat(Math.min(trimmed.length - 3, 8))}${visible}`;
}
