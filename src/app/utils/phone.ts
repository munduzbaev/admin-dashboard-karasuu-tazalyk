/**
 * Phone normalization for Kyrgyzstan numbers.
 *
 * Goal: store in DB as 996XXXXXXXXX (12 digits, no '+', no spaces, no separators).
 * This is the format n8n uses to dispatch WhatsApp / Telegram messages.
 *
 * Display: format back with spaces and '+' for readability in the UI.
 */

/**
 * Strip everything except digits, then coerce common KG formats to 996XXXXXXXXX.
 * Returns null for empty / clearly-invalid input (so caller can decide what to do).
 *
 * Accepted inputs (with whitespace, dashes, parens, +):
 *   +996 503 333 425  → 996503333425
 *   996503333425      → 996503333425
 *   0 503 333 425     → 996503333425  (local KG, drop leading 0)
 *   8 503 333 425     → 996503333425  (legacy CIS prefix)
 *   503333425         → 996503333425  (assume KG)
 *   ""                → null
 */
export function normalizePhone(raw: string | null | undefined): string | null {
  if (!raw) return null;
  const digits = String(raw).replace(/\D/g, "");
  if (!digits) return null;

  // Already in the canonical 996XXXXXXXXX form
  if (digits.length === 12 && digits.startsWith("996")) return digits;

  // Local KG: 0XXXXXXXXX (10 digits) → 996XXXXXXXXX
  if (digits.length === 10 && digits.startsWith("0")) return "996" + digits.slice(1);

  // Legacy CIS prefix 8: 8XXXXXXXXX → assume KG, replace
  if (digits.length === 10 && digits.startsWith("8")) return "996" + digits.slice(1);

  // 9-digit subscriber number: 503333425 → 996503333425
  if (digits.length === 9) return "996" + digits;

  // 11-digit with leading 8 prefix like 8 996 ...
  if (digits.length === 11 && digits.startsWith("8")) return "996" + digits.slice(4);

  // Anything else — return as-is (digits only); caller may reject
  return digits;
}

/**
 * Format a normalized 996XXXXXXXXX number for display: "+996 503 333 425".
 * Returns the input as-is if not in expected format.
 */
export function formatPhone(normalized: string | null | undefined): string {
  if (!normalized) return "";
  const d = String(normalized).replace(/\D/g, "");
  if (d.length === 12 && d.startsWith("996")) {
    return `+${d.slice(0, 3)} ${d.slice(3, 6)} ${d.slice(6, 9)} ${d.slice(9, 12)}`;
  }
  return String(normalized);
}

/**
 * Whether the normalized number looks like a valid KG mobile.
 * KG mobile numbers are 12 digits: 996 + 9 digits.
 */
export function isValidPhone(normalized: string | null | undefined): boolean {
  if (!normalized) return false;
  const d = String(normalized).replace(/\D/g, "");
  return d.length === 12 && d.startsWith("996");
}
