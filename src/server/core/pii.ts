const EMAIL = /[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}/g;

// North American numbers: optional +1 / 1, area code (bracketed or not), then 3 and 4 digits.
// The lookarounds stop it matching inside longer digit runs, dates or money.
const PHONE = /(?<![\w$])(?:\+?1[\s.-]?)?(?:\(\d{3}\)\s?|\d{3}[\s.-])\d{3}[\s.-]\d{4}(?![\w-]|\.\d)/g;

/** Replaces emails with [email] and phone numbers with [phone]. Pure; no I/O. */
export function stripPii(text: string): string {
  return text.replace(EMAIL, "[email]").replace(PHONE, "[phone]");
}
